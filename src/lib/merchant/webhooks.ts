import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export interface EnqueueWebhookParams {
  merchantId: string;
  eventType: "payment.succeeded" | "payment.failed" | "payment.cancelled" | "payment.expired";
  payload: Record<string, any>;
}

/**
 * Creates and immediately enqueues / attempts delivery of a signed webhook event to the merchant.
 */
export async function dispatchMerchantWebhook(params: EnqueueWebhookParams) {
  const supabase = createAdminClient();

  // 1. Fetch merchant details including webhook url and secret
  const { data: merchant, error: merchErr } = await supabase
    .from("merchants")
    .select("id, name, code, webhook_url, webhook_secret, status")
    .eq("id", params.merchantId)
    .single();

  if (merchErr || !merchant) {
    console.error("Webhook dispatch failed: Merchant not found", params.merchantId);
    return null;
  }

  const eventId = `evt_${crypto.randomBytes(16).toString("hex")}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const fullPayload = {
    id: eventId,
    event: params.eventType,
    created_at: new Date().toISOString(),
    timestamp,
    data: params.payload,
  };

  // 2. Persist Webhook Event in Database
  const { data: eventRecord, error: insertErr } = await supabase
    .from("merchant_webhook_events")
    .insert({
      event_id: eventId,
      merchant_id: merchant.id,
      event_type: params.eventType,
      payload: fullPayload,
      status: "PENDING",
      attempts: 0,
      next_attempt_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (insertErr || !eventRecord) {
    console.error("Failed to persist webhook event:", insertErr);
    return null;
  }

  // If no webhook URL is configured, mark as delivered/skipped
  if (!merchant.webhook_url) {
    await supabase
      .from("merchant_webhook_events")
      .update({
        status: "DELIVERED",
        last_error: "No webhook URL configured; marked delivered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventRecord.id);
    return eventRecord;
  }

  // 3. Attempt synchronous first delivery (fail-safe and asynchronous in case of network issues)
  deliverWebhookAttempt(eventRecord.id, merchant.webhook_url, merchant.webhook_secret || "", fullPayload).catch(
    (err) => console.warn("Background webhook delivery attempt failed:", err)
  );

  return eventRecord;
}

/**
 * Executes a single signed HTTP delivery attempt for a webhook event.
 */
export async function deliverWebhookAttempt(
  webhookEventId: string,
  targetUrl: string,
  webhookSecret: string,
  payload: Record<string, any>
) {
  const supabase = createAdminClient();
  const startTime = Date.now();
  const rawBody = JSON.stringify(payload);
  const timestamp = payload.timestamp || Math.floor(Date.now() / 1000);

  // Sign webhook: sha256 HMAC of `${timestamp}.${rawBody}`
  const signature = crypto
    .createHmac("sha256", webhookSecret || "dhruva_default_secret")
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "DhruvaBank-Webhook/1.0",
    "x-dhruva-event-id": payload.id,
    "x-dhruva-timestamp": timestamp.toString(),
    "x-dhruva-signature": signature,
  };

  let responseStatus = 0;
  let responseBody = "";
  let errorMessage: string | null = null;
  let isSuccess = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8-second delivery timeout

    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: rawBody,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    responseStatus = res.status;
    responseBody = (await res.text()).slice(0, 1000); // truncate response body
    isSuccess = res.ok; // 2xx status code
    if (!res.ok) {
      errorMessage = `Server responded with HTTP ${res.status}`;
    }
  } catch (err: any) {
    errorMessage = err.name === "AbortError" ? "Webhook delivery timed out after 8s" : err.message;
  }

  const durationMs = Date.now() - startTime;

  // 1. Record Delivery Attempt Log
  await supabase.from("merchant_webhook_deliveries").insert({
    webhook_event_id: webhookEventId,
    endpoint_url: targetUrl,
    request_headers: headers,
    request_body: payload,
    response_status: responseStatus || null,
    response_body: responseBody || null,
    error_message: errorMessage,
    duration_ms: durationMs,
  });

  // 2. Fetch current attempts and update Webhook Event state
  const { data: currentEvent } = await supabase
    .from("merchant_webhook_events")
    .select("attempts, max_attempts")
    .eq("id", webhookEventId)
    .single();

  const attempts = (currentEvent?.attempts || 0) + 1;
  const maxAttempts = currentEvent?.max_attempts || 5;

  if (isSuccess) {
    await supabase
      .from("merchant_webhook_events")
      .update({
        status: "DELIVERED",
        attempts,
        last_attempt_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", webhookEventId);
  } else {
    // Exponential backoff: next attempt in 2^(attempts) * 30 seconds
    const backoffSeconds = Math.min(Math.pow(2, attempts) * 30, 3600);
    const nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000).toISOString();
    const isExhausted = attempts >= maxAttempts;

    await supabase
      .from("merchant_webhook_events")
      .update({
        status: isExhausted ? "FAILED" : "PENDING",
        attempts,
        next_attempt_at: isExhausted ? null : nextAttemptAt,
        last_attempt_at: new Date().toISOString(),
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", webhookEventId);
  }

  return { isSuccess, responseStatus, errorMessage, durationMs };
}

