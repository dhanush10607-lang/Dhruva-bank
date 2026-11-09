import { NextRequest, NextResponse } from "next/server";
import { authenticateMerchantRequest } from "@/lib/merchant/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateMerchantRequest(request);

    if (!auth.authenticated || !auth.merchant) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized", code: "AUTHENTICATION_FAILED" },
        { status: auth.statusCode || 401 }
      );
    }

    const supabase = createAdminClient();

    // 1. Fetch settlement account
    const { data: settlementAccount, error: accErr } = await supabase
      .from("accounts")
      .select("id, account_number, balance, currency, status, created_at")
      .eq("id", auth.merchant.settlement_account_id)
      .single();

    if (accErr || !settlementAccount) {
      return NextResponse.json(
        { success: false, error: "Settlement account not found", code: "ACCOUNT_NOT_FOUND" },
        { status: 500 }
      );
    }

    // 2. Fetch payment stats
    const { count: totalTransactions } = await supabase
      .from("merchant_transactions")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", auth.merchant.id)
      .eq("status", "COMPLETED");

    const { count: pendingIntents } = await supabase
      .from("merchant_payment_intents")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", auth.merchant.id)
      .eq("status", "CREATED");

    return NextResponse.json({
      success: true,
      data: {
        merchant: {
          id: auth.merchant.id,
          code: auth.merchant.code,
          name: auth.merchant.name,
          status: auth.merchant.status,
          currency: auth.merchant.currency,
        },
        settlement_account: {
          account_number: settlementAccount.account_number,
          current_balance: Number(settlementAccount.balance),
          currency: settlementAccount.currency,
          status: settlementAccount.status,
        },
        summary: {
          total_successful_transactions: totalTransactions || 0,
          pending_payment_intents: pendingIntents || 0,
        },
      },
    });
  } catch (err: any) {
    console.error("Merchant account summary error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

