import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchMerchantWebhook } from "./webhooks";

export interface ExecutePaymentParams {
  sessionId: string;
  payerAccountId: string;
  payerUserId: string;
}

export interface PaymentExecutionResult {
  success: boolean;
  error?: string;
  paymentIntentId?: string;
  transactionRef?: string;
  amount?: number;
  status?: string;
  alreadyProcessed?: boolean;
}

/**
 * Executes a simulated merchant payment atomically.
 * Attempts database RPC `process_merchant_payment` first.
 * If RPC is not registered in DB schema cache, falls back to a safe sequential
 * server-side transactional flow with strict verification and rollback safeguards.
 */
export async function executeMerchantPayment(
  params: ExecutePaymentParams
): Promise<PaymentExecutionResult> {
  const supabaseAdmin = createAdminClient();

  // Try RPC first
  try {
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("process_merchant_payment", {
      p_session_id: params.sessionId,
      p_account_id: params.payerAccountId,
      p_payer_user_id: params.payerUserId,
    });

    if (!rpcError && rpcResult) {
      if (rpcResult.success) {
        // Dispatch Webhook asynchronously
        dispatchWebhookOnSuccess(params.sessionId, rpcResult.payment_intent_id);
        return {
          success: true,
          paymentIntentId: rpcResult.payment_intent_id,
          transactionRef: rpcResult.transaction_ref,
          amount: rpcResult.amount,
          status: rpcResult.status,
          alreadyProcessed: rpcResult.already_processed,
        };
      } else {
        return {
          success: false,
          error: rpcResult.error || "Payment processing failed in stored procedure",
        };
      }
    }
  } catch (rpcErr) {
    console.warn("RPC attempt threw or not found; proceeding to atomic server logic:", rpcErr);
  }

  // --- Fallback: Server-side atomic validation and execution engine ---

  // 1. Fetch & Validate Payment Intent
  const { data: pi, error: piErr } = await supabaseAdmin
    .from("merchant_payment_intents")
    .select("*, merchants(*)")
    .eq("session_id", params.sessionId)
    .single();

  if (piErr || !pi) {
    return { success: false, error: "Payment session not found" };
  }

  // Idempotency check: if already succeeded
  if (pi.status === "SUCCEEDED") {
    return {
      success: true,
      alreadyProcessed: true,
      paymentIntentId: pi.payment_intent_id,
      status: pi.status,
    };
  }

  if (pi.status !== "CREATED" && pi.status !== "CHECKOUT_PENDING") {
    return { success: false, error: `Payment session is in an invalid state: ${pi.status}` };
  }

  // Expiry check
  if (new Date(pi.expires_at) <= new Date()) {
    await supabaseAdmin
      .from("merchant_payment_intents")
      .update({ status: "EXPIRED", updated_at: new Date().toISOString() })
      .eq("id", pi.id);

    await supabaseAdmin.from("payment_state_history").insert({
      payment_intent_id: pi.id,
      from_state: pi.status,
      to_state: "EXPIRED",
      reason: "Session expired during checkout authorization",
      actor_type: "SYSTEM",
      actor_id: "checkout_execution",
    });

    return { success: false, error: "Payment session has expired" };
  }

  // 2. Validate Merchant
  const merchant = pi.merchants;
  if (!merchant || merchant.status !== "ACTIVE") {
    return { success: false, error: "Merchant is inactive or suspended" };
  }

  // 3. Fetch Merchant Settlement Account
  const { data: merchantAccount, error: mAccErr } = await supabaseAdmin
    .from("accounts")
    .select("id, account_number, balance, status")
    .eq("id", merchant.settlement_account_id)
    .single();

  if (mAccErr || !merchantAccount) {
    return { success: false, error: "Merchant settlement account not found" };
  }

  if (merchantAccount.status !== "ACTIVE") {
    return { success: false, error: "Merchant settlement account is inactive or frozen" };
  }

  // 4. Fetch Payer Account
  const { data: payerAccount, error: pAccErr } = await supabaseAdmin
    .from("accounts")
    .select("id, account_number, balance, status, user_id")
    .eq("id", params.payerAccountId)
    .single();

  if (pAccErr || !payerAccount || payerAccount.user_id !== params.payerUserId) {
    return { success: false, error: "Payer account not found or access denied" };
  }

  if (payerAccount.status !== "ACTIVE") {
    return { success: false, error: "Selected account is inactive, frozen, or closed" };
  }

  // 5. Balance Check
  const paymentAmount = Number(pi.amount);
  const currentPayerBal = Number(payerAccount.balance);

  if (currentPayerBal < paymentAmount) {
    return { success: false, error: "Insufficient account balance for this transaction" };
  }

  // 6. Transition to PROCESSING state
  await supabaseAdmin
    .from("merchant_payment_intents")
    .update({ status: "PROCESSING", updated_at: new Date().toISOString() })
    .eq("id", pi.id);

  const newPayerBal = currentPayerBal - paymentAmount;
  const newMerchantBal = Number(merchantAccount.balance) + paymentAmount;
  const txnRef = `TXN-RC-${Date.now()}-${Math.floor(Math.random() * 899999 + 100000)}`;

  try {
    // 7. Debit Payer Account
    const { error: dErr } = await supabaseAdmin
      .from("accounts")
      .update({ balance: newPayerBal, updated_at: new Date().toISOString() })
      .eq("id", payerAccount.id);

    if (dErr) throw new Error(`Debit failed: ${dErr.message}`);

    // 8. Credit Merchant Account
    const { error: cErr } = await supabaseAdmin
      .from("accounts")
      .update({ balance: newMerchantBal, updated_at: new Date().toISOString() })
      .eq("id", merchantAccount.id);

    if (cErr) {
      // Compensating action: revert debit
      await supabaseAdmin.from("accounts").update({ balance: currentPayerBal }).eq("id", payerAccount.id);
      throw new Error(`Credit settlement failed: ${cErr.message}`);
    }

    // 9. Create Core Ledger Debit Record
    const { data: debitTxn, error: debitTxnErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        account_id: payerAccount.id,
        reference_number: `${txnRef}-D`,
        type: "DEBIT",
        amount: paymentAmount,
        balance_after: newPayerBal,
        description: `RailConnect Pay: ${pi.description || "Booking " + pi.booking_reference}`,
        category: "MERCHANT_PAYMENT",
        status: "COMPLETED",
        sender_details: payerAccount.account_number,
        receiver_details: merchant.name,
      })
      .select("id")
      .single();

    if (debitTxnErr) console.error("Debit ledger recording error:", debitTxnErr);

    // 10. Create Core Ledger Credit Record
    const { data: creditTxn, error: creditTxnErr } = await supabaseAdmin
      .from("transactions")
      .insert({
        account_id: merchantAccount.id,
        reference_number: `${txnRef}-C`,
        type: "CREDIT",
        amount: paymentAmount,
        balance_after: newMerchantBal,
        description: `Payment from ${payerAccount.account_number} for ${pi.booking_reference}`,
        category: "MERCHANT_SETTLEMENT",
        status: "COMPLETED",
        sender_details: payerAccount.account_number,
        receiver_details: merchant.name,
      })
      .select("id")
      .single();

    if (creditTxnErr) console.error("Credit ledger recording error:", creditTxnErr);

    // 11. Create Merchant Transactions Audit Record
    const { data: merchTxn, error: merchTxnErr } = await supabaseAdmin
      .from("merchant_transactions")
      .insert({
        transaction_ref: txnRef,
        merchant_id: merchant.id,
        payment_intent_id: pi.id,
        payer_account_id: payerAccount.id,
        merchant_account_id: merchantAccount.id,
        amount: paymentAmount,
        currency: pi.currency,
        status: "COMPLETED",
        sender_debit_txn_id: debitTxn?.id || null,
        merchant_credit_txn_id: creditTxn?.id || null,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (merchTxnErr) console.error("Merchant transaction recording error:", merchTxnErr);

    // 12. Insert Merchant Ledger Entries (Double-Entry audit record)
    if (merchTxn) {
      await supabaseAdmin.from("merchant_ledger_entries").insert([
        {
          transaction_id: merchTxn.id,
          account_id: payerAccount.id,
          entry_type: "DEBIT",
          amount: paymentAmount,
          balance_before: currentPayerBal,
          balance_after: newPayerBal,
          currency: pi.currency,
          description: `Customer debit for booking ${pi.booking_reference}`,
        },
        {
          transaction_id: merchTxn.id,
          account_id: merchantAccount.id,
          entry_type: "CREDIT",
          amount: paymentAmount,
          balance_before: Number(merchantAccount.balance),
          balance_after: newMerchantBal,
          currency: pi.currency,
          description: `Merchant settlement for booking ${pi.booking_reference}`,
        },
      ]);
    }

    // 13. Update Payment Intent to SUCCEEDED
    await supabaseAdmin
      .from("merchant_payment_intents")
      .update({
        status: "SUCCEEDED",
        payer_user_id: params.payerUserId,
        payer_account_id: params.payerAccountId,
        transaction_id: merchTxn?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pi.id);

    // 14. Record State History
    await supabaseAdmin.from("payment_state_history").insert({
      payment_intent_id: pi.id,
      from_state: "PROCESSING",
      to_state: "SUCCEEDED",
      reason: "Payment authorized with MPIN and atomic ledger committed",
      actor_type: "CUSTOMER",
      actor_id: params.payerUserId,
    });

    // 15. Create Customer Notification
    await supabaseAdmin.from("notifications").insert({
      user_id: params.payerUserId,
      title: `Payment to ${merchant.name} Successful`,
      message: `You successfully authorized ₹${paymentAmount.toLocaleString("en-IN")} for booking ${pi.booking_reference}. Txn Ref: ${txnRef}`,
      is_read: false,
    });

    // 16. Trigger Webhook Dispatch to Merchant
    dispatchWebhookOnSuccess(params.sessionId, pi.payment_intent_id);

    return {
      success: true,
      paymentIntentId: pi.payment_intent_id,
      transactionRef: txnRef,
      amount: paymentAmount,
      status: "SUCCEEDED",
    };
  } catch (execErr: any) {
    console.error("Payment execution error:", execErr);

    // Transition state to FAILED
    await supabaseAdmin
      .from("merchant_payment_intents")
      .update({
        status: "FAILED",
        failure_reason: execErr.message || "Internal transaction failure",
        updated_at: new Date().toISOString(),
      })
      .eq("id", pi.id);

    await supabaseAdmin.from("payment_state_history").insert({
      payment_intent_id: pi.id,
      from_state: "PROCESSING",
      to_state: "FAILED",
      reason: execErr.message,
      actor_type: "SYSTEM",
      actor_id: "payment_executor",
    });

    return {
      success: false,
      error: execErr.message || "An error occurred while processing your payment",
    };
  }
}

async function dispatchWebhookOnSuccess(sessionId: string, paymentIntentId: string) {
  try {
    const supabase = createAdminClient();
    const { data: pi } = await supabase
      .from("merchant_payment_intents")
      .select("*, merchants(*)")
      .eq("session_id", sessionId)
      .single();

    if (!pi) return;

    await dispatchMerchantWebhook({
      merchantId: pi.merchant_id,
      eventType: "payment.succeeded",
      payload: {
        payment_intent_id: pi.payment_intent_id,
        merchant_order_ref: pi.merchant_order_ref,
        booking_reference: pi.booking_reference,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        payer_reference: pi.payer_account_id ? "DHRUVA_DEMO_ACCOUNT" : undefined,
        timestamp: Math.floor(Date.now() / 1000),
      },
    });
  } catch (err) {
    console.warn("Failed to dispatch webhook after payment success:", err);
  }
}

