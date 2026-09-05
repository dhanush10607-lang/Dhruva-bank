-- This script empties all the data in the public schema of the Dhruva Bank database.
-- WARNING: This action is irreversible. All user profiles, accounts, transactions, and other data will be deleted.

TRUNCATE TABLE 
    public.fixed_deposits,
    public.support_tickets,
    public.loans,
    public.audit_logs,
    public.notifications,
    public.cards,
    public.beneficiaries,
    public.transactions,
    public.accounts,
    public.users
CASCADE;

-- NOTE: If you also want to delete all authentication users (emails/passwords), 
-- you will need to run thea following command separately:
-- TRUNCATE TABLE auth.users CASCADE;
