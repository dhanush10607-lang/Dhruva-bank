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

-- EOM Loan Tracking Table for Idempotency
CREATE TABLE IF NOT EXISTS public.eom_loan_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'PROCESSED',
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(loan_id, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_eom_loan_tracking_lookup ON public.eom_loan_tracking(loan_id, period_month, period_year);


-- RPC for Bulk EOM Processing
-- Drop the old function signatures just in case Postgres complains about type changes
DROP FUNCTION IF EXISTS process_eom_batch(UUID[], INTEGER, INTEGER, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS process_eom_batch(UUID[], INTEGER, INTEGER, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS process_eom_batch(UUID[], INTEGER, INTEGER, NUMERIC, NUMERIC, UUID);

CREATE OR REPLACE FUNCTION process_eom_batch(
    p_account_ids UUID[], 
    p_month INTEGER, 
    p_year INTEGER,
    p_interest_rate_pa NUMERIC DEFAULT 4.0,
    p_monthly_fee NUMERIC DEFAULT 50.0,
    p_admin_account_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_account_id UUID;
    v_user_id UUID;
    v_account_type VARCHAR;
    v_balance NUMERIC;
    v_new_balance NUMERIC;
    v_interest_amount NUMERIC;
    
    v_loan RECORD;
    
    v_processed_count INTEGER := 0;
    v_total_fees_collected NUMERIC := 0;
    v_admin_balance NUMERIC;
    v_new_admin_balance NUMERIC;
BEGIN
    FOR i IN 1 .. array_length(p_account_ids, 1) LOOP
        v_account_id := p_account_ids[i];
        
        -- Check idempotency (skip if already processed for this month/year)
        IF NOT EXISTS (SELECT 1 FROM public.eom_tracking WHERE account_id = v_account_id AND period_month = p_month AND period_year = p_year) THEN
            
            BEGIN
                -- Lock account row for update to prevent race conditions
                SELECT user_id, account_type, COALESCE(balance, 0.00) 
                INTO v_user_id, v_account_type, v_balance 
                FROM public.accounts WHERE id = v_account_id FOR UPDATE;
                
                IF FOUND THEN
                    v_interest_amount := 0;
                    
                    -- Calculate EOM changes (Interest applies only to SAVINGS)
                    IF v_account_type = 'SAVINGS' THEN
                        -- Monthly interest rate is (Annual Rate / 12)
                        v_interest_amount := ROUND((v_balance * ((p_interest_rate_pa / 100.0) / 12.0))::numeric, 2);
                    END IF;
                    
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
                        
                        -- Aggregate fees for the admin
                        v_total_fees_collected := v_total_fees_collected + p_monthly_fee;
                    END IF;
                    
                    -- ----------------------------------------------------
                    -- LOAN EMI PROCESSING
                    -- ----------------------------------------------------
                    FOR v_loan IN 
                        SELECT id, emi_amount, total_payable, loan_type 
                        FROM public.loans 
                        WHERE user_id = v_user_id AND status = 'ACTIVE'
                    LOOP
                        -- Check if EMI for this specific loan was already paid this month
                        IF NOT EXISTS (SELECT 1 FROM public.eom_loan_tracking WHERE loan_id = v_loan.id AND period_month = p_month AND period_year = p_year) THEN
                            
                            -- Deduct EMI from account balance
                            v_new_balance := ROUND((v_new_balance - v_loan.emi_amount)::numeric, 2);
                            UPDATE public.accounts SET balance = v_new_balance WHERE id = v_account_id;
                            
                            -- Record Transaction
                            INSERT INTO public.transactions (account_id, type, amount, balance_after, description, reference_number)
                            VALUES (v_account_id, 'DEBIT', v_loan.emi_amount, v_new_balance, 'Loan EMI Deduction (' || v_loan.loan_type || ')', 'EOM-EMI-' || p_year || '-' || p_month || '-' || substr(v_loan.id::text, 1, 8));
                            
                            -- Update Loan Balance
                            IF (v_loan.total_payable - v_loan.emi_amount) <= 0 THEN
                                UPDATE public.loans SET total_payable = 0, status = 'CLOSED' WHERE id = v_loan.id;
                            ELSE
                                UPDATE public.loans SET total_payable = v_loan.total_payable - v_loan.emi_amount WHERE id = v_loan.id;
                            END IF;
                            
                            -- Record loan idempotency
                            INSERT INTO public.eom_loan_tracking (loan_id, period_month, period_year, status)
                            VALUES (v_loan.id, p_month, p_year, 'PROCESSED');
                        END IF;
                    END LOOP;

                    -- Mark as processed for idempotency
                    INSERT INTO public.eom_tracking (account_id, period_month, period_year, status)
                    VALUES (v_account_id, p_month, p_year, 'PROCESSED');
                    
                    v_processed_count := v_processed_count + 1;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- If an error occurs, gracefully catch it.
                CONTINUE;
            END;
        END IF;
    END LOOP;
    
    -- Credit total collected fees to the admin account in a single operation
    IF p_admin_account_id IS NOT NULL AND v_total_fees_collected > 0 THEN
        SELECT COALESCE(balance, 0.00) INTO v_admin_balance FROM public.accounts WHERE id = p_admin_account_id FOR UPDATE;
        v_new_admin_balance := v_admin_balance + v_total_fees_collected;
        
        UPDATE public.accounts SET balance = v_new_admin_balance WHERE id = p_admin_account_id;
        
        INSERT INTO public.transactions (account_id, type, amount, balance_after, description, reference_number)
        VALUES (p_admin_account_id, 'CREDIT', v_total_fees_collected, v_new_admin_balance, 'EOM Fee Collection Batch (' || p_month || '/' || p_year || ')', 'EOM-COL-BATCH-' || p_year || '-' || p_month || '-' || substr(gen_random_uuid()::text, 1, 12));
    END IF;

    RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;
