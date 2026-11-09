import { NextRequest, NextResponse } from "next/server";
import { authenticateMerchantRequest } from "@/lib/merchant/auth";
import { getPaymentIntent } from "@/lib/merchant/intents";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentIntentId: string }> }
) {
  try {
    const { paymentIntentId } = await params;
    const auth = await authenticateMerchantRequest(request);

    if (!auth.authenticated || !auth.merchant) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized", code: "AUTHENTICATION_FAILED" },
        { status: auth.statusCode || 401 }
      );
    }

    const intent = await getPaymentIntent(paymentIntentId);

    if (!intent) {
      return NextResponse.json(
        { success: false, error: "Payment intent not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (intent.merchant_id !== auth.merchant.id) {
      return NextResponse.json(
        { success: false, error: "Access denied to this payment intent", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // If payment succeeded, retrieve transaction details
    let transactionData = null;
    if (intent.status === "SUCCEEDED" && intent.transaction_id) {
      const { data: txn } = await supabase
        .from("merchant_transactions")
        .select("id, transaction_ref, completed_at, status")
        .eq("id", intent.transaction_id)
        .maybeSingle();

      if (txn) {
        transactionData = {
          transaction_ref: txn.transaction_ref,
          completed_at: txn.completed_at,
          status: txn.status,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        payment_intent_id: intent.payment_intent_id,
        merchant_order_ref: intent.merchant_order_ref,
        booking_reference: intent.booking_reference,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        verified: intent.status === "SUCCEEDED",
        transaction: transactionData,
        expires_at: intent.expires_at,
        verified_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error("Verify payment intent error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

