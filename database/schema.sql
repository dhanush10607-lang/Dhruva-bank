-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    dob DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pin_code VARCHAR(20),
    pan_demo VARCHAR(50),
    aadhaar_demo VARCHAR(50),
    occupation VARCHAR(100),
    nominee_name VARCHAR(100),
    mpin_hash VARCHAR(255) NOT NULL,
    failed_attempts INT DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE,
    customer_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(20) DEFAULT 'SAVINGS' CHECK (account_type IN ('SAVINGS', 'CURRENT', 'SALARY')),
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'INR',
    usd_balance DECIMAL(15,2) DEFAULT 0.00,
    eur_balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    branch_id UUID, -- Will link to branches table later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TRANSACTIONS TABLE (Ledger)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES public.accounts(id),
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    fee DECIMAL(15,2) DEFAULT 0.00,
    balance_after DECIMAL(15,2) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'UNCATEGORIZED',
    status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
    sender_details TEXT,
    receiver_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- BENEFICIARIES TABLE
CREATE TABLE IF NOT EXISTS public.beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    nickname VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, account_number)
);

-- CARDS TABLE
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    card_number_masked VARCHAR(20) NOT NULL,
    cardholder_name VARCHAR(100) NOT NULL,
    expiry_date VARCHAR(5) NOT NULL, -- MM/YY
    cvv_hash VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'DEBIT' CHECK (type IN ('DEBIT', 'CREDIT')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FROZEN', 'BLOCKED')),
    daily_limit DECIMAL(15,2) DEFAULT 50000.00,
    online_enabled BOOLEAN DEFAULT TRUE,
    international_enabled BOOLEAN DEFAULT FALSE,
    contactless_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id), -- Nullable for system actions
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit Logs can be read and inserted by the owner
CREATE POLICY "Users can read own audit logs" 
ON public.audit_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own audit logs" 
ON public.audit_logs FOR DELETE 
USING (auth.uid() = user_id);

-- Users can read their own profile
CREATE POLICY "Users can read own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Accounts can be read by all authenticated users (required for transfers and beneficiary validation)
CREATE POLICY "Users can read all accounts" 
ON public.accounts FOR SELECT 
USING (true);

CREATE POLICY "Users can update own accounts" 
ON public.accounts FOR UPDATE 
USING (auth.uid() = user_id);

-- Transactions can be read by the account owner
CREATE POLICY "Users can read own transactions" 
ON public.transactions FOR SELECT 
USING (
    account_id IN (
        SELECT id FROM public.accounts WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (
    account_id IN (
        SELECT id FROM public.accounts WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view and update all accounts" ON public.accounts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'ADMIN'
  )
);

CREATE POLICY "Admins can insert transactions" ON public.transactions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'ADMIN'
  )
);

-- Beneficiaries can be managed by the owner
CREATE POLICY "Users can manage own beneficiaries" 
ON public.beneficiaries FOR ALL 
USING (auth.uid() = user_id);

-- Cards can be read and updated by the owner
CREATE POLICY "Users can manage own cards" 
ON public.cards FOR ALL 
USING (
    account_id IN (
        SELECT id FROM public.accounts WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view and update all cards" ON public.cards
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'ADMIN'
  )
);

-- Notifications can be read and updated by the owner
CREATE POLICY "Users can manage own notifications" 
ON public.notifications FOR ALL 
USING (auth.uid() = user_id);

-- Create a function to automatically create a user profile after Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, mobile, mpin_hash)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    new.raw_user_meta_data->>'mobile',
    new.raw_user_meta_data->>'mpin_hash'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- LOANS TABLE
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    loan_type VARCHAR(50) NOT NULL CHECK (loan_type IN ('PERSONAL', 'HOME', 'VEHICLE', 'EDUCATION')),
    amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    tenure_months INT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'CLOSED')),
    total_payable DECIMAL(15,2),
    emi_amount DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own loans" 
ON public.loans FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loans" 
ON public.loans FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loans" 
ON public.loans FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own support tickets" 
ON public.support_tickets FOR ALL 
USING (auth.uid() = user_id);

-- Admin Policies for Loans & Tickets
CREATE POLICY "Admins can view all loans" ON public.loans
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update all loans" ON public.loans
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'ADMIN'
  )
);

CREATE POLICY "Admins can view all support tickets" ON public.support_tickets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update all support tickets" ON public.support_tickets
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'ADMIN'
  )
);

-- FIXED DEPOSITS TABLE
CREATE TABLE IF NOT EXISTS public.fixed_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 5000),
    interest_rate DECIMAL(5,2) NOT NULL,
    tenure_months INT NOT NULL,
    maturity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MATURED', 'BROKEN')),
    maturity_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.fixed_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own fixed deposits" 
ON public.fixed_deposits FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all fixed deposits" ON public.fixed_deposits
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'ADMIN'
  )
);

-- ==========================================
-- SCHEDULED TRANSFERS
-- ==========================================
CREATE TABLE scheduled_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    frequency VARCHAR(20) DEFAULT 'MONTHLY' CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
    next_run_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- WEALTH MANAGEMENT (INVESTMENTS)
-- ==========================================
CREATE TABLE market_assets (
    symbol VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'STOCK' CHECK (type IN ('STOCK', 'CRYPTO', 'MUTUAL_FUND')),
    current_price DECIMAL(15,2) NOT NULL,
    daily_change_percent DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(10) REFERENCES market_assets(symbol) ON DELETE CASCADE,
    quantity DECIMAL(15,6) NOT NULL CHECK (quantity > 0),
    average_buy_price DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, asset_symbol)
);

-- ==========================================
-- INDEXES FOR SCALABILITY & PERFORMANCE
-- ==========================================

-- 1. Foreign Key Indexes (Prevents full table scans on joins)
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_id ON public.beneficiaries(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_account_id ON public.cards(account_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_deposits_user_id ON public.fixed_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- 2. Time-Series Indexes (Optimizes sorting and filtering by date)
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 3. High-Frequency Query Indexes (Optimizes WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_users_customer_id ON public.users(customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON public.accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_number ON public.transactions(reference_number);
