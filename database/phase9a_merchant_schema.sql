-- ==============================================================================
-- PHASE 9A: DHRUVA BANK MERCHANT PAYMENT GATEWAY (RAILCONNECT PAY)
-- Migration Schema & Atomic Payment Processing Engine
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. MERCHANTS TABLE
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'RAILCONNECT'
    name VARCHAR(100) NOT NULL,
    merchant_type VARCHAR(50) DEFAULT 'DEMO_PAYMENT_MERCHANT',
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    settlement_account_id UUID REFERENCES public.accounts(id) ON DELETE RESTRICT,
    contact_email VARCHAR(255),
    webhook_url TEXT,
    webhook_secret VARCHAR(255),
    allowed_redirect_origins TEXT[] DEFAULT ARRAY['http://localhost:3000', 'https://railconnect.vercel.app'],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MERCHANT API CREDENTIALS TABLE
CREATE TABLE IF NOT EXISTS public.merchant_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    api_key VARCHAR(100) UNIQUE NOT NULL, -- Public Key identifier (e.g. key_test_rc_xxx)
    api_secret_hash VARCHAR(255) NOT NULL, -- Hashed secret for verification
    api_secret_preview VARCHAR(12) NOT NULL, -- Masked display (e.g. sec_***abc)
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- 4. MERCHANT PAYMENT INTENTS TABLE
CREATE TABLE IF NOT EXISTS public.merchant_payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id VARCHAR(64) UNIQUE NOT NULL, -- Public external ID: pi_xxxx
    session_id VARCHAR(64) UNIQUE NOT NULL,        -- Hosted checkout session ID: cs_xxxx
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE RESTRICT,
    merchant_order_ref VARCHAR(100) NOT NULL,
    booking_reference VARCHAR(100) NOT NULL,
    customer_reference VARCHAR(100),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'INR',
    description TEXT,
    status VARCHAR(30) DEFAULT 'CREATED' CHECK (
        status IN ('CREATED', 'CHECKOUT_PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED', 'REVERSED')
    ),
    idempotency_key VARCHAR(128) NOT NULL,
    success_url TEXT NOT NULL,
    failure_url TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    payer_user_id UUID REFERENCES public.users(id),
    payer_account_id UUID REFERENCES public.accounts(id),
    transaction_id UUID, -- Will link to merchant_transactions
    failure_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(merchant_id, idempotency_key)
);

-- 5. MERCHANT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.merchant_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_ref VARCHAR(64) UNIQUE NOT NULL, -- Shared transaction reference
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE RESTRICT,
    payment_intent_id UUID NOT NULL REFERENCES public.merchant_payment_intents(id) ON DELETE RESTRICT,
    payer_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    merchant_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
    sender_debit_txn_id UUID REFERENCES public.transactions(id),
    merchant_credit_txn_id UUID REFERENCES public.transactions(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. MERCHANT LEDGER ENTRIES TABLE (Audit Ledger)
CREATE TABLE IF NOT EXISTS public.merchant_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.merchant_transactions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id),
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    balance_before NUMERIC(15,2) NOT NULL,
    balance_after NUMERIC(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. PAYMENT STATE HISTORY
CREATE TABLE IF NOT EXISTS public.payment_state_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id UUID NOT NULL REFERENCES public.merchant_payment_intents(id) ON DELETE CASCADE,
    from_state VARCHAR(30),
    to_state VARCHAR(30) NOT NULL,
    reason TEXT,
    actor_type VARCHAR(20) DEFAULT 'SYSTEM' CHECK (actor_type IN ('SYSTEM', 'CUSTOMER', 'MERCHANT', 'ADMIN')),
    actor_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. WEBHOOK EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.merchant_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(64) UNIQUE NOT NULL, -- evt_xxxx
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- e.g. payment.succeeded, payment.failed
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DELIVERED', 'FAILED')),
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. WEBHOOK DELIVERY ATTEMPTS LOG TABLE
CREATE TABLE IF NOT EXISTS public.merchant_webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_event_id UUID NOT NULL REFERENCES public.merchant_webhook_events(id) ON DELETE CASCADE,
    endpoint_url TEXT NOT NULL,
    request_headers JSONB,
    request_body JSONB,
    response_status INT,
    response_body TEXT,
    error_message TEXT,
    duration_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. MERCHANT AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.merchant_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
    actor_id TEXT,
    actor_type VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & INTEGRITY
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_merchant_pi_pid ON public.merchant_payment_intents(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_merchant_pi_sid ON public.merchant_payment_intents(session_id);
CREATE INDEX IF NOT EXISTS idx_merchant_pi_merchant_id ON public.merchant_payment_intents(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_pi_status ON public.merchant_payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_merchant_pi_order_ref ON public.merchant_payment_intents(merchant_order_ref);
CREATE INDEX IF NOT EXISTS idx_merchant_txns_ref ON public.merchant_transactions(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_merchant_txns_pi_id ON public.merchant_transactions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_merchant_webhook_events_next ON public.merchant_webhook_events(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_merchant_ledger_txn ON public.merchant_ledger_entries(transaction_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_audit_logs ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICIES: Full access for Dhruva Bank ADMIN users
CREATE POLICY "Admins have full access to merchants" ON public.merchants
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN'))
);

CREATE POLICY "Admins have full access to merchant credentials" ON public.merchant_credentials
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN'))
);

CREATE POLICY "Admins have full access to payment intents" ON public.merchant_payment_intents
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN'))
);

CREATE POLICY "Admins have full access to merchant transactions" ON public.merchant_transactions
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN'))
);

CREATE POLICY "Admins have full access to merchant ledger" ON public.merchant_ledger_entries
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN'))
);

CREATE POLICY "Admins have full access to webhook events" ON public.merchant_webhook_events
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN'))
);

CREATE POLICY "Admins have full access to webhook deliveries" ON public.merchant_webhook_deliveries
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN'))
);

CREATE POLICY "Admins have full access to merchant audit logs" ON public.merchant_audit_logs
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- CUSTOMER ACCESS: Payer can view their own payment session
CREATE POLICY "Users can view payment intents they are payer of" ON public.merchant_payment_intents
FOR SELECT USING (
    auth.uid() = payer_user_id
);

-- ==============================================================================
-- ATOMIC STORED PROCEDURE: process_merchant_payment
-- Handles row locking, validation, balance checking, atomic double-entry debit/credit,
-- status transition, ledger entry creation, and state history recording.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.process_merchant_payment(
    p_session_id VARCHAR,
    p_account_id UUID,
    p_payer_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pi RECORD;
    v_merchant RECORD;
    v_payer_account RECORD;
    v_merchant_account RECORD;
    v_txn_ref VARCHAR(64);
    v_new_payer_bal NUMERIC(15,2);
    v_new_merchant_bal NUMERIC(15,2);
    v_sender_debit_id UUID;
    v_merchant_credit_id UUID;
    v_merchant_txn_id UUID;
BEGIN
    -- 1. Fetch and Lock Payment Intent
    SELECT * INTO v_pi
    FROM public.merchant_payment_intents
    WHERE session_id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment session not found');
    END IF;

    -- Check if already succeeded (Idempotent response)
    IF v_pi.status = 'SUCCEEDED' THEN
        RETURN jsonb_build_object(
            'success', true, 
            'already_processed', true,
            'payment_intent_id', v_pi.payment_intent_id,
            'status', v_pi.status
        );
    END IF;

    -- Check valid state
    IF v_pi.status NOT IN ('CREATED', 'CHECKOUT_PENDING') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment session is not in a payable state: ' || v_pi.status);
    END IF;

    -- Check expiry
    IF v_pi.expires_at <= timezone('utc'::text, now()) THEN
        UPDATE public.merchant_payment_intents
        SET status = 'EXPIRED', updated_at = timezone('utc'::text, now())
        WHERE id = v_pi.id;

        INSERT INTO public.payment_state_history (payment_intent_id, from_state, to_state, reason, actor_type, actor_id)
        VALUES (v_pi.id, v_pi.status, 'EXPIRED', 'Payment session expired during authorization', 'CUSTOMER', p_payer_user_id::text);

        RETURN jsonb_build_object('success', false, 'error', 'Payment session has expired');
    END IF;

    -- 2. Fetch and Validate Merchant
    SELECT * INTO v_merchant
    FROM public.merchants
    WHERE id = v_pi.merchant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Associated merchant not found');
    END IF;

    IF v_merchant.status != 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Merchant account is suspended or inactive');
    END IF;

    -- 3. Lock and Validate Merchant Settlement Account
    SELECT * INTO v_merchant_account
    FROM public.accounts
    WHERE id = v_merchant.settlement_account_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Merchant settlement account not found');
    END IF;

    IF v_merchant_account.status != 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Merchant settlement account is not active');
    END IF;

    -- 4. Lock and Validate Payer Account
    SELECT * INTO v_payer_account
    FROM public.accounts
    WHERE id = p_account_id AND user_id = p_payer_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Selected account not found or does not belong to authenticated user');
    END IF;

    IF v_payer_account.status != 'ACTIVE' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Selected account is inactive, frozen, or closed');
    END IF;

    -- 5. Check Balance
    IF v_payer_account.balance < v_pi.amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance in selected account');
    END IF;

    -- 6. Perform Atomic Debit and Credit
    v_new_payer_bal := v_payer_account.balance - v_pi.amount;
    v_new_merchant_bal := v_merchant_account.balance + v_pi.amount;

    -- Update Payer Balance
    UPDATE public.accounts
    SET balance = v_new_payer_bal, updated_at = timezone('utc'::text, now())
    WHERE id = v_payer_account.id;

    -- Update Merchant Balance
    UPDATE public.accounts
    SET balance = v_new_merchant_bal, updated_at = timezone('utc'::text, now())
    WHERE id = v_merchant_account.id;

    -- Generate Unique Shared Reference Number
    v_txn_ref := 'TXN-RC-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(md5(random()::text), 1, 8);

    -- Insert Bank Debit Transaction for Payer
    INSERT INTO public.transactions (
        account_id,
        reference_number,
        type,
        amount,
        balance_after,
        description,
        category,
        status,
        sender_details,
        receiver_details,
        created_at
    ) VALUES (
        v_payer_account.id,
        v_txn_ref || '-D',
        'DEBIT',
        v_pi.amount,
        v_new_payer_bal,
        'RailConnect Pay: ' || COALESCE(v_pi.description, 'Booking ' || v_pi.booking_reference),
        'MERCHANT_PAYMENT',
        'COMPLETED',
        v_payer_account.account_number,
        v_merchant.name,
        timezone('utc'::text, now())
    ) RETURNING id INTO v_sender_debit_id;

    -- Insert Bank Credit Transaction for Merchant
    INSERT INTO public.transactions (
        account_id,
        reference_number,
        type,
        amount,
        balance_after,
        description,
        category,
        status,
        sender_details,
        receiver_details,
        created_at
    ) VALUES (
        v_merchant_account.id,
        v_txn_ref || '-C',
        'CREDIT',
        v_pi.amount,
        v_new_merchant_bal,
        'Payment from ' || v_payer_account.account_number || ' for ' || v_pi.booking_reference,
        'MERCHANT_SETTLEMENT',
        'COMPLETED',
        v_payer_account.account_number,
        v_merchant.name,
        timezone('utc'::text, now())
    ) RETURNING id INTO v_merchant_credit_id;

    -- Insert Merchant Transactions Record
    INSERT INTO public.merchant_transactions (
        transaction_ref,
        merchant_id,
        payment_intent_id,
        payer_account_id,
        merchant_account_id,
        amount,
        currency,
        status,
        sender_debit_txn_id,
        merchant_credit_txn_id,
        completed_at,
        created_at
    ) VALUES (
        v_txn_ref,
        v_merchant.id,
        v_pi.id,
        v_payer_account.id,
        v_merchant_account.id,
        v_pi.amount,
        v_pi.currency,
        'COMPLETED',
        v_sender_debit_id,
        v_merchant_credit_id,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    ) RETURNING id INTO v_merchant_txn_id;

    -- Insert Merchant Ledger Debit Entry
    INSERT INTO public.merchant_ledger_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        balance_before,
        balance_after,
        currency,
        description,
        created_at
    ) VALUES (
        v_merchant_txn_id,
        v_payer_account.id,
        'DEBIT',
        v_pi.amount,
        v_payer_account.balance,
        v_new_payer_bal,
        v_pi.currency,
        'Customer debit for booking ' || v_pi.booking_reference,
        timezone('utc'::text, now())
    );

    -- Insert Merchant Ledger Credit Entry
    INSERT INTO public.merchant_ledger_entries (
        transaction_id,
        account_id,
        entry_type,
        amount,
        balance_before,
        balance_after,
        currency,
        description,
        created_at
    ) VALUES (
        v_merchant_txn_id,
        v_merchant_account.id,
        'CREDIT',
        v_pi.amount,
        v_merchant_account.balance,
        v_new_merchant_bal,
        v_pi.currency,
        'Merchant settlement for booking ' || v_pi.booking_reference,
        timezone('utc'::text, now())
    );

    -- Update Payment Intent to SUCCEEDED
    UPDATE public.merchant_payment_intents
    SET status = 'SUCCEEDED',
        payer_user_id = p_payer_user_id,
        payer_account_id = p_account_id,
        transaction_id = v_merchant_txn_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_pi.id;

    -- Record Payment State History Transition
    INSERT INTO public.payment_state_history (
        payment_intent_id,
        from_state,
        to_state,
        reason,
        actor_type,
        actor_id
    ) VALUES (
        v_pi.id,
        v_pi.status,
        'SUCCEEDED',
        'Customer authorized with MPIN and atomic ledger processed',
        'CUSTOMER',
        p_payer_user_id::text
    );

    -- Create Customer In-App Notification
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        is_read,
        created_at
    ) VALUES (
        p_payer_user_id,
        'Payment Authorized to ' || v_merchant.name,
        'You authorized simulated payment of ₹' || v_pi.amount || ' for ' || v_pi.booking_reference || '. Txn Ref: ' || v_txn_ref,
        false,
        timezone('utc'::text, now())
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_intent_id', v_pi.payment_intent_id,
        'transaction_ref', v_txn_ref,
        'amount', v_pi.amount,
        'status', 'SUCCEEDED',
        'completed_at', timezone('utc'::text, now())
    );
END;
$$;

