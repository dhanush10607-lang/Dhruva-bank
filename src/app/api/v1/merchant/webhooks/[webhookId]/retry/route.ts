import { NextRequest, NextResponse } from "next/server";
import { authenticateMerchantRequest } from "@/lib/merchant/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { deliverWebhookAttempt } from "@/lib/merchant/webhooks";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> }
) {
  try {
    const { webhookId } = await params;
    const auth = await authenticateMerchantRequest(request);

    if (!auth.authenticated || !auth.merchant) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized", code: "AUTHENTICATION_FAILED" },
        { status: auth.statusCode || 401 }
      );
    }

    const supabase = createAdminClient();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(webhookId);
    const query = supabase
      .from("merchant_webhook_events")
      .select("*, merchants(*)")
      .eq("merchant_id", auth.merchant.id);

    const { data: event, error } = isUuid
      ? await query.eq("id", webhookId).maybeSingle()
      : await query.eq("event_id", webhookId).maybeSingle();

    if (error || !event) {
      return NextResponse.json(
        { success: false, error: "Webhook event not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const merchant = event.merchants;
    if (!merchant.webhook_url) {
      return NextResponse.json(
        { success: false, error: "Merchant has no webhook_url configured", code: "NO_WEBHOOK_URL" },
        { status: 400 }
      );
    }

    const result = await deliverWebhookAttempt(
      event.id,
      merchant.webhook_url,
      merchant.webhook_secret || "",
      event.payload
    );

    return NextResponse.json({
      success: true,
      data: {
        event_id: event.event_id,
        delivered: result.isSuccess,
        response_status: result.responseStatus,
        duration_ms: result.durationMs,
        error_message: result.errorMessage,
      },
    });
  } catch (err: any) {
    console.error("Retry webhook error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

