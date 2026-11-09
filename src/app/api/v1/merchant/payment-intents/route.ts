import { NextRequest, NextResponse } from "next/server";
import { authenticateMerchantRequest, validateRedirectUrl } from "@/lib/merchant/auth";
import { createPaymentIntent } from "@/lib/merchant/intents";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const auth = await authenticateMerchantRequest(request, rawBody);

    if (!auth.authenticated || !auth.merchant) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error || "Unauthorized",
          code: "AUTHENTICATION_FAILED",
        },
        { status: auth.statusCode || 401 }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const {
      merchant_order_ref,
      booking_reference,
      customer_reference,
      amount,
      currency = "INR",
      description,
      success_url,
      failure_url,
      idempotency_key,
      metadata,
      expires_in_seconds,
    } = body;

    // Validate required fields
    if (!merchant_order_ref || typeof merchant_order_ref !== "string") {
      return NextResponse.json(
        { success: false, error: "merchant_order_ref is required", code: "MISSING_FIELD" },
        { status: 400 }
      );
    }

    if (!booking_reference || typeof booking_reference !== "string") {
      return NextResponse.json(
        { success: false, error: "booking_reference is required", code: "MISSING_FIELD" },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "amount must be a positive number in INR", code: "INVALID_AMOUNT" },
        { status: 400 }
      );
    }

    if (!idempotency_key || typeof idempotency_key !== "string") {
      return NextResponse.json(
        { success: false, error: "idempotency_key is required", code: "MISSING_IDEMPOTENCY_KEY" },
        { status: 400 }
      );
    }

    if (!success_url || !failure_url) {
      return NextResponse.json(
        { success: false, error: "success_url and failure_url are required", code: "MISSING_URLS" },
        { status: 400 }
      );
    }

    // Validate redirect URL allowlist against merchant allowed origins
    const allowedOrigins = auth.merchant.allowed_redirect_origins || [];
    if (!validateRedirectUrl(success_url, allowedOrigins)) {
      return NextResponse.json(
        {
          success: false,
          error: `success_url origin is not in the merchant's allowed origins allowlist: ${allowedOrigins.join(", ")}`,
          code: "DISALLOWED_REDIRECT_ORIGIN",
        },
        { status: 400 }
      );
    }

    if (!validateRedirectUrl(failure_url, allowedOrigins)) {
      return NextResponse.json(
        {
          success: false,
          error: `failure_url origin is not in the merchant's allowed origins allowlist: ${allowedOrigins.join(", ")}`,
          code: "DISALLOWED_REDIRECT_ORIGIN",
        },
        { status: 400 }
      );
    }

    // Create payment intent
    const { intent, isNew } = await createPaymentIntent({
      merchantId: auth.merchant.id,
      merchantOrderRef: merchant_order_ref,
      bookingReference: booking_reference,
      customerReference: customer_reference,
      amount: numAmount,
      currency: currency.toUpperCase(),
      description,
      idempotencyKey: idempotency_key,
      successUrl: success_url,
      failureUrl: failure_url,
      metadata,
      expiresInSeconds: expires_in_seconds,
    });

    // Generate Hosted Checkout URL
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "dhruva-bank.vercel.app";
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const checkoutUrl = `${proto}://${host}/checkout/${intent.session_id}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          payment_intent_id: intent.payment_intent_id,
          session_id: intent.session_id,
          merchant_order_ref: intent.merchant_order_ref,
          booking_reference: intent.booking_reference,
          amount: intent.amount,
          currency: intent.currency,
          status: intent.status,
          checkout_url: checkoutUrl,
          expires_at: intent.expires_at,
          created_at: intent.created_at,
          is_idempotent_replay: !isNew,
        },
      },
      { status: isNew ? 201 : 200 }
    );
  } catch (err: any) {
    console.error("Payment intent creation error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

