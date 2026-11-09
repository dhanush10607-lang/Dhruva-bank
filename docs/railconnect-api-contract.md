# Dhruva Bank Merchant Payment API Contract (v1)

This document contains the complete JSON specification for RailConnect (and other integrated merchants) to communicate with the Dhruva Bank Merchant Payment Gateway.

**Base URL**: `https://dhruva-bank.vercel.app` (or `http://localhost:3000` in development)  
**API Version**: `v1`  
**Authentication**: Server-to-server HMAC-SHA256 signature or Bearer API secret

---

## 1. Create Payment Intent

Creates a new checkout intent for an upcoming booking payment.

- **Endpoint**: `POST /api/v1/merchant/payment-intents`
- **Headers**:
  ```http
  Content-Type: application/json
  x-merchant-key: key_live_xxxxxx
  x-timestamp: 1794226000
  x-signature: 4f3a... [HMAC-SHA256 hex]
  ```

### Request Body
```json
{
  "merchant_order_ref": "RC-ORD-902341",
  "booking_reference": "PNR-4920194820",
  "customer_reference": "CUST-8831",
  "amount": 1250.00,
  "currency": "INR",
  "description": "RailConnect Train 12951 Mumbai Rajdhani - 2AC",
  "idempotency_key": "idemp_rc_902341_attempt_1",
  "success_url": "https://irctc-rho.vercel.app/payment/success",
  "failure_url": "https://irctc-rho.vercel.app/payment/cancel",
  "expires_in_seconds": 900,
  "metadata": {
    "train_number": "12951",
    "coach": "A1",
    "seat": "23"
  }
}
```

### Response (201 Created or 200 OK for Idempotent Replay)
```json
{
  "success": true,
  "data": {
    "payment_intent_id": "pi_7c19ad04e578fa21...",
    "session_id": "cs_92ad41804bba9901...",
    "merchant_order_ref": "RC-ORD-902341",
    "booking_reference": "PNR-4920194820",
    "amount": 1250,
    "currency": "INR",
    "status": "CREATED",
    "checkout_url": "https://dhruva-bank.vercel.app/checkout/cs_92ad41804bba9901...",
    "expires_at": "2026-11-09T14:50:00.000Z",
    "created_at": "2026-11-09T14:35:00.000Z",
    "is_idempotent_replay": false
  }
}
```

---

## 2. Retrieve Payment Intent Status

Retrieves the current status of a payment intent.

- **Endpoint**: `GET /api/v1/merchant/payment-intents/{paymentIntentId}`
- **Headers**:
  ```http
  x-merchant-key: key_live_xxxxxx
  x-timestamp: 1794226000
  x-signature: 4f3a... [HMAC-SHA256 hex]
  ```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "payment_intent_id": "pi_7c19ad04e578fa21...",
    "session_id": "cs_92ad41804bba9901...",
    "merchant_order_ref": "RC-ORD-902341",
    "booking_reference": "PNR-4920194820",
    "customer_reference": "CUST-8831",
    "amount": 1250,
    "currency": "INR",
    "status": "SUCCEEDED",
    "description": "RailConnect Train 12951 Mumbai Rajdhani - 2AC",
    "expires_at": "2026-11-09T14:50:00.000Z",
    "created_at": "2026-11-09T14:35:00.000Z",
    "updated_at": "2026-11-09T14:38:12.000Z"
  }
}
```

---

## 3. Verify Payment Authoritatively

Performs an authoritative server-to-server check before confirming a booking.

- **Endpoint**: `POST /api/v1/merchant/payment-intents/{paymentIntentId}/verify`

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "payment_intent_id": "pi_7c19ad04e578fa21...",
    "merchant_order_ref": "RC-ORD-902341",
    "booking_reference": "PNR-4920194820",
    "amount": 1250,
    "currency": "INR",
    "status": "SUCCEEDED",
    "verified": true,
    "transaction": {
      "transaction_ref": "TXN-RC-202611091438-928174",
      "completed_at": "2026-11-09T14:38:12.000Z",
      "status": "COMPLETED"
    },
    "expires_at": "2026-11-09T14:50:00.000Z",
    "verified_at": "2026-11-09T14:38:15.000Z"
  }
}
```

---

## 4. Retrieve Transaction & Double-Entry Ledger Details

- **Endpoint**: `GET /api/v1/merchant/transactions/{transactionRefOrId}`

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "2fa40d82-...",
    "transaction_ref": "TXN-RC-202611091438-928174",
    "amount": 1250,
    "currency": "INR",
    "status": "COMPLETED",
    "completed_at": "2026-11-09T14:38:12.000Z",
    "merchant_ledger_entries": [
      {
        "id": "e912...",
        "entry_type": "DEBIT",
        "amount": 1250,
        "balance_before": 10000,
        "balance_after": 8750,
        "description": "Customer debit for booking PNR-4920194820"
      },
      {
        "id": "b104...",
        "entry_type": "CREDIT",
        "amount": 1250,
        "balance_before": 50000,
        "balance_after": 51250,
        "description": "Merchant settlement for booking PNR-4920194820"
      }
    ]
  }
}
```

---

## 5. Merchant Account Summary

- **Endpoint**: `GET /api/v1/merchant/account/summary`

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "merchant": {
      "id": "e9102...",
      "code": "RAILCONNECT",
      "name": "RailConnect",
      "status": "ACTIVE",
      "currency": "INR"
    },
    "settlement_account": {
      "account_number": "MERCH-RC-778899",
      "current_balance": 154250.00,
      "currency": "INR",
      "status": "ACTIVE"
    },
    "summary": {
      "total_successful_transactions": 84,
      "pending_payment_intents": 2
    }
  }
}
```

---

## 6. Error Codes

| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `INVALID_JSON` | Body is not valid JSON. |
| `400` | `MISSING_FIELD` | Mandatory parameter omitted. |
| `400` | `INVALID_AMOUNT` | Amount must be numeric and > 0 INR. |
| `400` | `DISALLOWED_REDIRECT_ORIGIN` | Success or failure URL origin is not in merchant allowlist. |
| `401` | `AUTHENTICATION_FAILED` | Missing or invalid key, secret, or HMAC signature. |
| `403` | `FORBIDDEN` | Access denied or merchant account is suspended. |
| `404` | `NOT_FOUND` | Payment intent, session, or transaction not found. |
| `429` | `RATE_LIMIT_EXCEEDED` | Merchant API rate limit (60 requests/minute) exceeded. |
| `500` | `SERVER_ERROR` | Internal server or database error. |

