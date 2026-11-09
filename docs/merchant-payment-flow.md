# Merchant Payment State Machine & Payment Flow

## 1. Payment Lifecycle State Machine

A payment intent transitions strictly through the following controlled state machine:

```
                  ┌──────────────┐
                  │   CREATED    │
                  └──────┬───────┘
                         │
             Customer opens checkout page
                         │
                         ▼
              ┌─────────────────────┐
              │  CHECKOUT_PENDING   │
              └──────────┬──────────┘
                         │
            Customer enters MPIN & submits
                         │
                         ▼
                ┌────────────────┐
                │   PROCESSING   │
                └───────┬────────┘
       ┌────────────────┼────────────────┐
       │ (Ledger commit)│                │ (Ledger abort / error)
       ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  SUCCEEDED  │  │   FAILED    │  │   EXPIRED   │
└─────────────┘  └─────────────┘  └─────────────┘
       │
 (Admin / Refund)
       ▼
┌─────────────┐
│  REVERSED   │
└─────────────┘
```

### State Definitions:
1. `CREATED`: Intent generated via Merchant API with a unique session ID.
2. `CHECKOUT_PENDING`: The customer has loaded the hosted checkout page `/checkout/{sessionId}`.
3. `PROCESSING`: MPIN submitted, atomic ledger verification and account row locking underway.
4. `SUCCEEDED`: Funds atomically debited from passenger and credited to merchant settlement account.
5. `FAILED`: Transaction rejected due to insufficient funds, inactive account, invalid MPIN, or ledger rollback.
6. `EXPIRED`: Checkout session TTL expired (default 15 minutes) before completion.
7. `REVERSED`: Transaction reversed or refunded by banking administration.

Every transition writes an immutable audit record to `public.payment_state_history`.

---

## 2. Step-by-Step Payment Flow

### Step 1: Merchant Payment Intent Creation
1. Passenger selects "Dhruva Bank (RailConnect Pay)" on the RailConnect checkout page.
2. RailConnect backend sends a signed `POST /api/v1/merchant/payment-intents` request.
3. Dhruva Bank validates the signature, merchant status, allowed return origins, and idempotency key.
4. Returns a hosted checkout URL: `https://dhruva-bank.vercel.app/checkout/cs_...`.

### Step 2: Passenger Redirection & Authentication
1. Passenger's browser is redirected to the Dhruva Bank hosted checkout URL.
2. If the passenger is not logged into Dhruva Bank, middleware redirects them to `/login?returnTo=/checkout/cs_...`.
3. Once authenticated, the checkout displays:
   - Clear DEMO BANKING SIMULATION labels.
   - Merchant details (`RailConnect`).
   - Amount due and booking reference (`PNR`).
   - Account selection list showing active eligible accounts and real-time balances.

### Step 3: MPIN Authorization
1. Passenger selects their paying account and enters their 4-digit bank MPIN.
2. The browser sends the authorization request to the Next.js Server Action (`authorizeCheckoutPayment`).
3. The server validates:
   - Active session user matches account owner.
   - User security lock is disabled (`is_locked = false`).
   - User KYC status is approved (`status = APPROVED`).
   - MPIN hash matches via `bcrypt.compare`.
   - Passenger balance >= payment amount.

### Step 4: Atomic Settlement Execution
1. The engine executes the atomic double-entry ledger transfer.
2. The passenger's balance is debited; the RailConnect settlement account (`MERCH-RC-778899`) is credited.
3. Corresponding records are created in `public.transactions`, `public.merchant_transactions`, and `public.merchant_ledger_entries`.
4. Payment intent status transitions to `SUCCEEDED`.

### Step 5: Webhook Dispatch & Browser Return
1. A signed webhook event (`payment.succeeded`) is persisted and dispatched to RailConnect's webhook endpoint.
2. The hosted checkout page displays the success receipt and provides a return button to RailConnect's `success_url?status=SUCCESS&payment_id=pi_...&txn_ref=TXN-...`.
3. RailConnect receives the redirect and validates the transaction with the Dhruva Bank `/verify` API or signed webhook before confirming the train booking.

