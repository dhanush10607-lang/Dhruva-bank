import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export interface CreatePaymentIntentParams {
  merchantId: string;
  merchantOrderRef: string;
  bookingReference: string;
  customerReference?: string;
  amount: number;
  currency?: string;
  description?: string;
  idempotencyKey: string;
  successUrl: string;
  failureUrl: string;
  metadata?: Record<string, any>;
  expiresInSeconds?: number;
}

export interface PaymentIntentRecord {
  id: string;
  payment_intent_id: string;
  session_id: string;
  merchant_id: string;
  merchant_order_ref: string;
  booking_reference: string;
  customer_reference?: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  idempotency_key: string;
  success_url: string;
  failure_url: string;
  expires_at: string;
  payer_user_id?: string;
  payer_account_id?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Creates or retrieves an existing payment intent using idempotency key.
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<{ intent: PaymentIntentRecord; isNew: boolean }> {
  const supabase = createAdminClient();

  // 1. Check Idempotency Key first
  const { data: existingIntent } = await supabase
    .from("merchant_payment_intents")
    .select("*")
    .eq("merchant_id", params.merchantId)
    .eq("idempotency_key", params.idempotencyKey)
    .maybeSingle();

  if (existingIntent) {
    return { intent: existingIntent as PaymentIntentRecord, isNew: false };
  }

  // 2. Generate unique IDs
  const paymentIntentId = `pi_${crypto.randomBytes(16).toString("hex")}`;
  const sessionId = `cs_${crypto.randomBytes(20).toString("hex")}`;

  // Default expiry: 15 minutes (900 seconds)
  const expirySecs = params.expiresInSeconds || 900;
  const expiresAt = new Date(Date.now() + expirySecs * 1000).toISOString();

  // 3. Insert record
  const { data: createdIntent, error } = await supabase
    .from("merchant_payment_intents")
    .insert({
      payment_intent_id: paymentIntentId,
      session_id: sessionId,
      merchant_id: params.merchantId,
      merchant_order_ref: params.merchantOrderRef,
      booking_reference: params.bookingReference,
      customer_reference: params.customerReference || null,
      amount: params.amount,
      currency: params.currency || "INR",
      description: params.description || `RailConnect Booking #${params.bookingReference}`,
      status: "CREATED",
      idempotency_key: params.idempotencyKey,
      success_url: params.successUrl,
      failure_url: params.failureUrl,
      expires_at: expiresAt,
      metadata: params.metadata || {},
    })
    .select("*")
    .single();

  if (error || !createdIntent) {
    throw new Error(`Failed to create payment intent: ${error?.message}`);
  }

  // 4. Record state history
  await supabase.from("payment_state_history").insert({
    payment_intent_id: createdIntent.id,
    from_state: null,
    to_state: "CREATED",
    reason: "Payment intent initialized by merchant API",
    actor_type: "MERCHANT",
    actor_id: params.merchantId,
  });

  return { intent: createdIntent as PaymentIntentRecord, isNew: true };
}

/**
 * Retrieves payment intent by public payment_intent_id or session_id.
 */
export async function getPaymentIntent(identifier: string) {
  const supabase = createAdminClient();

  const isSession = identifier.startsWith("cs_");
  const column = isSession ? "session_id" : "payment_intent_id";

  const { data: intent, error } = await supabase
    .from("merchant_payment_intents")
    .select(`
      *,
      merchants (
        id,
        code,
        name,
        currency,
        status,
        contact_email
      )
    `)
    .eq(column, identifier)
    .maybeSingle();

  if (error || !intent) return null;

  // Auto-check expiry
  if (
    (intent.status === "CREATED" || intent.status === "CHECKOUT_PENDING") &&
    new Date(intent.expires_at) <= new Date()
  ) {
    await supabase
      .from("merchant_payment_intents")
      .update({ status: "EXPIRED", updated_at: new Date().toISOString() })
      .eq("id", intent.id);

    await supabase.from("payment_state_history").insert({
      payment_intent_id: intent.id,
      from_state: intent.status,
      to_state: "EXPIRED",
      reason: "Session reached expiry window",
      actor_type: "SYSTEM",
      actor_id: "auto_expire_check",
    });

    intent.status = "EXPIRED";
  }

  return intent;
}

