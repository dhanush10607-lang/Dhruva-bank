-- EOM (End of Month) Tracking Table for Idempotency
CREATE TABLE IF NOT EXISTS public.eom_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'PROCESSED',
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id, period_month, period_year)
);

-- Index for fast idempotency lookups
CREATE INDEX IF NOT EXISTS idx_eom_tracking_lookup ON public.eom_tracking(account_id, period_month, period_year);

-- RPC for Bulk EOM Processing
-- This function processes an array of account IDs, applies interest and fees, 
-- creates transaction logs, and records idempotency in a single database transaction.
CREATE OR REPLACE FUNCTION process_eom_batch(
    p_account_ids UUID[], 
    p_month INTEGER, 
    p_year INTEGER,
    p_interest_rate NUMERIC DEFAULT 0.0,
    p_monthly_fee NUMERIC DEFAULT 0.0
) RETURNS INTEGER AS $$
DECLARE
    v_account_id UUID;
    v_balance NUMERIC(15,2);
    v_new_balance NUMERIC(15,2);
    v_interest_amount NUMERIC(15,2);
    v_processed_count INTEGER := 0;
BEGIN
    FOR i IN 1 .. array_length(p_account_ids, 1) LOOP
        v_account_id := p_account_ids[i];
        
        -- Check idempotency (skip if already processed for this month/year)
        IF NOT EXISTS (SELECT 1 FROM public.eom_tracking WHERE account_id = v_account_id AND period_month = p_month AND period_year = p_year) THEN
            
            -- Lock account row for update to prevent race conditions
            SELECT COALESCE(balance, 0.00) INTO v_balance FROM public.accounts WHERE id = v_account_id FOR UPDATE;
            
            IF FOUND THEN
                -- Calculate EOM changes and round to 2 decimal places to prevent overflow
                v_interest_amount := ROUND((v_balance * (p_interest_rate / 100.0))::numeric, 2);
                v_new_balance := ROUND((v_balance + v_interest_amount - p_monthly_fee)::numeric, 2);
                
                -- Update balance
                UPDATE public.accounts SET balance = v_new_balance WHERE id = v_account_id;
                
                -- Insert transaction for interest if applicable
                IF v_interest_amount > 0 THEN
                    INSERT INTO public.transactions (account_id, type, amount, balance_after, description, reference_number)
                    VALUES (v_account_id, 'CREDIT', v_interest_amount, v_balance + v_interest_amount, 'Monthly Interest (' || p_month || '/' || p_year || ')', 'EOM-INT-' || p_year || '-' || p_month || '-' || substr(v_account_id::text, 1, 8));
                END IF;

                -- Insert transaction for fee if applicable
                IF p_monthly_fee > 0 THEN
                    INSERT INTO public.transactions (account_id, type, amount, balance_after, description, reference_number)
                    VALUES (v_account_id, 'DEBIT', p_monthly_fee, v_new_balance, 'Monthly Maintenance Fee (' || p_month || '/' || p_year || ')', 'EOM-FEE-' || p_year || '-' || p_month || '-' || substr(v_account_id::text, 1, 8));
                END IF;

                -- Mark as processed for idempotency
                INSERT INTO public.eom_tracking (account_id, period_month, period_year, status)
                VALUES (v_account_id, p_month, p_year, 'PROCESSED');
                
                v_processed_count := v_processed_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;
