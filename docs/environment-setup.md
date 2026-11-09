# Dhruva Bank Environment & Deployment Setup

## 1. Required Environment Variables

Configure the following environment variables in `.env.local` for local development, or in your Vercel Project Settings for production:

```env
# Supabase Configuration (Free Tier Compatible)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Upstash Redis (For Merchant Rate Limiting & EOM Queues)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="gQAAAAAA..."

# Application Host URL (Used for generating Hosted Checkout Links)
NEXT_PUBLIC_APP_URL="https://dhruva-bank.vercel.app"

# Cron Secret for Worker Tasks
CRON_SECRET="your_cron_secret"
```

---

## 2. Database Migration Steps

Execute the SQL script located at `database/phase9a_merchant_schema.sql` in your Supabase SQL Editor:
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Copy and paste the contents of `database/phase9a_merchant_schema.sql`.
3. Click **Run**.
4. This creates all merchant tables, indexes, RLS policies, and the `process_merchant_payment` stored procedure.

---

## 3. Merchant Provisioning Steps

To provision the default RailConnect merchant entity and generate credentials:
1. Navigate to the Dhruva Bank Admin Dashboard at `/admin/merchants`.
2. Logging in as an Admin automatically checks and provisions:
   - Merchant Code: `RAILCONNECT`
   - Settlement Account: `MERCH-RC-778899`
   - Initial active API key and secret.
3. You can rotate credentials, suspend/reactivate merchants, view ledger double-entries, and replay webhooks directly from this dashboard.

---

## 4. Free-Tier Constraints & Vercel Considerations

- **Supabase**: Runs entirely within the free-tier quota (no compute or enterprise add-ons required).
- **Upstash Redis**: Uses standard free-tier REST requests for sliding-window rate limiting.
- **Vercel**: Works seamlessly within standard Serverless Function memory and runtime limits.

