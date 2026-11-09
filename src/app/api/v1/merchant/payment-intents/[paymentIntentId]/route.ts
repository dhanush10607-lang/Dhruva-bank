import { NextRequest, NextResponse } from "next/server";
import { authenticateMerchantRequest } from "@/lib/merchant/auth";
import { getPaymentIntent } from "@/lib/merchant/intents";

export const dynamic = "force-dynamic";

export async function GET(
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

    // Verify merchant ownership
    if (intent.merchant_id !== auth.merchant.id) {
      return NextResponse.json(
        { success: false, error: "Access denied to this payment intent", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        payment_intent_id: intent.payment_intent_id,
        session_id: intent.session_id,
        merchant_order_ref: intent.merchant_order_ref,
        booking_reference: intent.booking_reference,
        customer_reference: intent.customer_reference,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        description: intent.description,
        expires_at: intent.expires_at,
        created_at: intent.created_at,
        updated_at: intent.updated_at,
      },
    });
  } catch (err: any) {
    console.error("Retrieve payment intent error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

