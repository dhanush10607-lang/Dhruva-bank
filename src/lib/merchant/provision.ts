import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export interface Merchant {
  id: string;
  code: string;
  name: string;
  merchant_type: string;
  currency: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  settlement_account_id: string;
  contact_email?: string;
  webhook_url?: string;
  webhook_secret?: string;
  allowed_redirect_origins: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MerchantCredential {
  id: string;
  merchant_id: string;
  api_key: string;
  api_secret_hash: string;
  api_secret_preview: string;
  status: "ACTIVE" | "REVOKED";
  created_at: string;
  revoked_at?: string;
}

export interface ProvisionMerchantResult {
  merchant: Merchant;
  apiKey?: string;
  apiSecret?: string; // Only returned when newly generated or rotated
  settlementAccountNumber: string;
  isNew: boolean;
}

const RAILCONNECT_MERCHANT_CODE = "RAILCONNECT";
const RAILCONNECT_SETTLEMENT_ACC_NUM = "MERCH-RC-778899";

/**
 * Idempotently provisions the RailConnect merchant entity, dedicated settlement account,
 * and merchant API credentials.
 */
export async function provisionRailConnectMerchant(forceNewKey: boolean = false): Promise<ProvisionMerchantResult> {
  const supabase = createAdminClient();

  // 1. Ensure dedicated settlement account exists
  let settlementAccountId: string;
  const { data: existingAccount } = await supabase
    .from("accounts")
    .select("id, account_number, balance")
    .eq("account_number", RAILCONNECT_SETTLEMENT_ACC_NUM)
    .maybeSingle();

  if (existingAccount) {
    settlementAccountId = existingAccount.id;
  } else {
    // Look for an admin user to associate the merchant account with if user_id is required
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .in("role", ["ADMIN", "SUPER_ADMIN"])
      .limit(1)
      .maybeSingle();

    const { data: newAccount, error: accErr } = await supabase
      .from("accounts")
      .insert({
        account_number: RAILCONNECT_SETTLEMENT_ACC_NUM,
        account_type: "CURRENT",
        balance: 0.00,
        currency: "INR",
        status: "ACTIVE",
        user_id: adminUser?.id || null,
      })
      .select("id")
      .single();

    if (accErr || !newAccount) {
      throw new Error(`Failed to create merchant settlement account: ${accErr?.message}`);
    }
    settlementAccountId = newAccount.id;
  }

  // 2. Ensure RailConnect merchant record exists
  let merchant: Merchant;
  let isNew = false;
  const { data: existingMerchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("code", RAILCONNECT_MERCHANT_CODE)
    .maybeSingle();

  if (existingMerchant) {
    merchant = existingMerchant as Merchant;
  } else {
    isNew = true;
    const defaultWebhookSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
    const { data: createdMerchant, error: merchErr } = await supabase
      .from("merchants")
      .insert({
        code: RAILCONNECT_MERCHANT_CODE,
        name: "RailConnect",
        merchant_type: "DEMO_PAYMENT_MERCHANT",
        currency: "INR",
        status: "ACTIVE",
        settlement_account_id: settlementAccountId,
        contact_email: "payments@railconnect.demo",
        webhook_url: "https://railconnect.vercel.app/api/webhooks/dhruva-pay",
        webhook_secret: defaultWebhookSecret,
        allowed_redirect_origins: [
          "http://localhost:3000",
          "http://localhost:3001",
          "https://railconnect.vercel.app",
          "https://dhruva-bank.vercel.app",
        ],
        metadata: {
          platform: "RailConnect Indian Railways Booking Simulator",
          integration_version: "v1",
        },
      })
      .select("*")
      .single();

    if (merchErr || !createdMerchant) {
      throw new Error(`Failed to create merchant: ${merchErr?.message}`);
    }
    merchant = createdMerchant as Merchant;
  }

  // 3. Ensure active API credential exists (or rotate if forceNewKey)
  let plainApiKey: string | undefined;
  let plainApiSecret: string | undefined;

  const { data: activeCreds } = await supabase
    .from("merchant_credentials")
    .select("*")
    .eq("merchant_id", merchant.id)
    .eq("status", "ACTIVE")
    .limit(1);

  if (forceNewKey || !activeCreds || activeCreds.length === 0) {
    if (activeCreds && activeCreds.length > 0) {
      // Revoke older keys
      await supabase
        .from("merchant_credentials")
        .update({
          status: "REVOKED",
          revoked_at: new Date().toISOString(),
        })
        .eq("merchant_id", merchant.id);
    }

    plainApiKey = `key_live_${crypto.randomBytes(16).toString("hex")}`;
    plainApiSecret = `sec_live_${crypto.randomBytes(24).toString("hex")}`;
    const secretHash = crypto.createHash("sha256").update(plainApiSecret).digest("hex");
    const secretPreview = `${plainApiSecret.slice(0, 7)}...${plainApiSecret.slice(-4)}`;

    const { error: credErr } = await supabase
      .from("merchant_credentials")
      .insert({
        merchant_id: merchant.id,
        api_key: plainApiKey,
        api_secret_hash: secretHash,
        api_secret_preview: secretPreview,
        status: "ACTIVE",
      });

    if (credErr) {
      throw new Error(`Failed to create merchant API credentials: ${credErr.message}`);
    }
  }

  return {
    merchant,
    apiKey: plainApiKey,
    apiSecret: plainApiSecret,
    settlementAccountNumber: RAILCONNECT_SETTLEMENT_ACC_NUM,
    isNew,
  };
}

/**
 * Rotates merchant credentials for a given merchant ID.
 */
export async function rotateMerchantCredentials(merchantId: string) {
  const supabase = createAdminClient();

  // Revoke active credentials
  await supabase
    .from("merchant_credentials")
    .update({
      status: "REVOKED",
      revoked_at: new Date().toISOString(),
    })
    .eq("merchant_id", merchantId)
    .eq("status", "ACTIVE");

  const plainApiKey = `key_live_${crypto.randomBytes(16).toString("hex")}`;
  const plainApiSecret = `sec_live_${crypto.randomBytes(24).toString("hex")}`;
  const secretHash = crypto.createHash("sha256").update(plainApiSecret).digest("hex");
  const secretPreview = `${plainApiSecret.slice(0, 7)}...${plainApiSecret.slice(-4)}`;

  const { data: newCred, error: credErr } = await supabase
    .from("merchant_credentials")
    .insert({
      merchant_id: merchantId,
      api_key: plainApiKey,
      api_secret_hash: secretHash,
      api_secret_preview: secretPreview,
      status: "ACTIVE",
    })
    .select("*")
    .single();

  if (credErr || !newCred) {
    throw new Error(`Failed to rotate merchant API credentials: ${credErr?.message}`);
  }

  // Log in audit log
  await supabase.from("merchant_audit_logs").insert({
    merchant_id: merchantId,
    actor_type: "ADMIN",
    action: "CREDENTIAL_ROTATED",
    details: { api_key: plainApiKey },
  });

  return {
    apiKey: plainApiKey,
    apiSecret: plainApiSecret,
    secretPreview,
  };
}

