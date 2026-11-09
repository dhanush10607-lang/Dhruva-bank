"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeMerchantPayment } from "@/lib/merchant/ledger";
import bcrypt from "bcryptjs";

export async function authorizeCheckoutPayment(prevState: any, formData: FormData) {
  const sessionId = formData.get("session_id") as string;
  const accountId = formData.get("account_id") as string;
  const mpin = formData.get("mpin") as string;

  if (!sessionId || !accountId || !mpin) {
    return { error: "Please select an account and enter your 4-digit MPIN." };
  }

  // 1. Verify user session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required. Please log in to complete payment." };
  }

  // 2. Fetch User Profile to verify MPIN and lock status
  const supabaseAdmin = createAdminClient();
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("id, mpin_hash, is_locked, status")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "User account profile not found." };
  }

  if (profile.is_locked) {
    return { error: "Security Lock active. All outgoing payments are blocked." };
  }

  if (profile.status !== "APPROVED") {
    return { error: "Your account KYC verification is pending or suspended." };
  }

  // 3. Verify MPIN securely
  const isMpinValid = await bcrypt.compare(mpin, profile.mpin_hash);
  if (!isMpinValid) {
    // Record failed attempt
    await supabaseAdmin
      .from("users")
      .update({ failed_attempts: (profile as any).failed_attempts + 1 })
      .eq("id", profile.id);
    return { error: "Invalid MPIN. Please try again." };
  }

  // 4. Verify selected account belongs to this user
  const { data: selectedAccount } = await supabaseAdmin
    .from("accounts")
    .select("id, balance, status, account_number")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .single();

  if (!selectedAccount) {
    return { error: "Selected account not found or does not belong to you." };
  }

  if (selectedAccount.status !== "ACTIVE") {
    return { error: "The selected account is inactive, frozen, or closed." };
  }

  // 5. Execute Payment Atomically
  const result = await executeMerchantPayment({
    sessionId,
    payerAccountId: selectedAccount.id,
    payerUserId: user.id,
  });

  if (!result.success) {
    return { error: result.error || "Payment execution failed." };
  }

  return {
    success: true,
    paymentIntentId: result.paymentIntentId,
    transactionRef: result.transactionRef,
    amount: result.amount,
  };
}

