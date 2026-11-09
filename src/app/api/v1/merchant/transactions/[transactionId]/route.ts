import { NextRequest, NextResponse } from "next/server";
import { authenticateMerchantRequest } from "@/lib/merchant/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const { transactionId } = await params;
    const auth = await authenticateMerchantRequest(request);

    if (!auth.authenticated || !auth.merchant) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized", code: "AUTHENTICATION_FAILED" },
        { status: auth.statusCode || 401 }
      );
    }

    const supabase = createAdminClient();

    // Query transaction by transaction_ref or id
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId);
    const query = supabase
      .from("merchant_transactions")
      .select(`
        id,
        transaction_ref,
        amount,
        currency,
        status,
        completed_at,
        created_at,
        merchant_payment_intents (
          payment_intent_id,
          merchant_order_ref,
          booking_reference,
          description
        ),
        merchant_ledger_entries (
          id,
          entry_type,
          amount,
          balance_before,
          balance_after,
          description,
          created_at
        )
      `)
      .eq("merchant_id", auth.merchant.id);

    const { data: txn, error } = isUuid
      ? await query.eq("id", transactionId).maybeSingle()
      : await query.eq("transaction_ref", transactionId).maybeSingle();

    if (error || !txn) {
      return NextResponse.json(
        { success: false, error: "Merchant transaction not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: txn,
    });
  } catch (err: any) {
    console.error("Retrieve transaction error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

