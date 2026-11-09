# Webhook Security, Signing & Delivery Specification

## Overview
Dhruva Bank uses cryptographically signed HTTP POST webhooks to notify RailConnect of asynchronous payment state transitions (e.g. `payment.succeeded`, `payment.failed`, `payment.expired`).

---

## 1. Webhook Payload Format

```json
{
  "id": "evt_91a0c4f82810...",
  "event": "payment.succeeded",
  "created_at": "2026-11-09T14:38:12.000Z",
  "timestamp": 1794226092,
  "data": {
    "payment_intent_id": "pi_7c19ad04e578fa21...",
    "merchant_order_ref": "RC-ORD-902341",
    "booking_reference": "PNR-4920194820",
    "amount": 1250.00,
    "currency": "INR",
    "status": "SUCCEEDED",
    "timestamp": 1794226092
  }
}
```

---

## 2. Webhook Headers & Signature Verification

Every webhook notification includes the following HTTP headers:

- `User-Agent`: `DhruvaBank-Webhook/1.0`
- `Content-Type`: `application/json`
- `x-dhruva-event-id`: Unique event ID (e.g., `evt_...`)
- `x-dhruva-timestamp`: Unix timestamp when the webhook was generated
- `x-dhruva-signature`: Hex HMAC-SHA256 signature

### Verification Procedure (RailConnect Server Implementation)
1. Read the raw request body as a UTF-8 string (do not use parsed JSON for signature check).
2. Extract `x-dhruva-timestamp` and `x-dhruva-signature`.
3. Check timestamp freshness: Reject requests if `Math.abs(Date.now() / 1000 - timestamp) > 300` (5 minutes tolerance).
4. Compute the expected signature:
   $$\text{expected\_signature} = \text{HMAC-SHA256}(\text{key} = \text{webhook\_secret}, \text{data} = \text{timestamp} + "." + \text{raw\_body})$$
5. Perform a constant-time comparison (`crypto.timingSafeEqual`) between the computed signature and `x-dhruva-signature`.

```typescript
import crypto from "crypto";

export function verifyDhruvaWebhook(
  rawBody: string,
  timestampStr: string,
  signature: string,
  webhookSecret: string
): boolean {
  const timestamp = parseInt(timestampStr, 10);
  const now = Math.floor(Date.now() / 1000);

  if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
    return false; // Replay attack or out of sync
  }

  const payload = `${timestamp}.${rawBody}`;
  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSig, "hex")
  );
}
```

---

## 3. Delivery Retries & Resilience

- **Initial Delivery**: Dhruva Bank attempts immediate delivery upon state transition.
- **Delivery Timeout**: 8 seconds per HTTP request.
- **Retry Schedule**: If the merchant server returns non-2xx status or times out:
  - Attempt 1: Immediate
  - Attempt 2: After 30 seconds
  - Attempt 3: After 60 seconds
  - Attempt 4: After 120 seconds
  - Attempt 5: After 240 seconds
- **Idempotency on RailConnect**: RailConnect must store processed `x-dhruva-event-id`s to prevent duplicate booking confirmations if network retries occur.
- **Manual Replay**: Dhruva Bank admins can replay any failed or pending webhook event directly from the Admin Portal (`/admin/merchants/{id}`).

