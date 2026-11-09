import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { toggleMerchantStatus, rotateCredentialsAction, resendWebhookAction } from "../actions";
import { 
  Store, 
  Key, 
  RotateCw, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Send,
  ArrowRightLeft,
  FileText
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface MerchantDetailPageProps {
  params: Promise<{ merchantId: string }>;
}

export default async function MerchantDetailPage({ params }: MerchantDetailPageProps) {
  const { merchantId } = await params;
  const supabase = createAdminClient();

  // 1. Fetch Merchant Details
  const { data: merchant, error: mErr } = await supabase
    .from("merchants")
    .select(`
      *,
      accounts (
        id,
        account_number,
        balance,
        status
      ),
      merchant_credentials (*)
    `)
    .eq("id", merchantId)
    .single();

  if (mErr || !merchant) {
    notFound();
  }

  // 2. Fetch Recent Payment Intents
  const { data: intents } = await supabase
    .from("merchant_payment_intents")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false })
    .limit(10);

  // 3. Fetch Recent Transactions
  const { data: transactions } = await supabase
    .from("merchant_transactions")
    .select(`
      *,
      merchant_ledger_entries (*)
    `)
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false })
    .limit(10);

  // 4. Fetch Recent Webhook Events
  const { data: webhooks } = await supabase
    .from("merchant_webhook_events")
    .select(`
      *,
      merchant_webhook_deliveries (*)
    `)
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Active Credential
  const activeCred = merchant.merchant_credentials?.find((c: any) => c.status === "ACTIVE");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/admin/merchants" className="text-sm text-blue-600 hover:underline">
              ← All Merchants
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mt-1 flex items-center gap-3">
            <Store className="text-blue-600" size={32} />
            {merchant.name} ({merchant.code})
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Merchant ID: <code className="font-mono">{merchant.id}</code>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <form action={toggleMerchantStatus.bind(null, merchant.id, merchant.status)}>
            <button
              type="submit"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${
                merchant.status === "ACTIVE"
                  ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60"
                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40"
              }`}
            >
              <AlertOctagon size={16} />
              {merchant.status === "ACTIVE" ? "Suspend Merchant" : "Activate Merchant"}
            </button>
          </form>

          <form action={rotateCredentialsAction.bind(null, merchant.id)}>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-sm"
            >
              <RotateCw size={16} />
              Rotate Credentials
            </button>
          </form>
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Settlement Account</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
            {merchant.accounts?.account_number}
          </p>
          <div className="mt-3 flex items-baseline justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-sm">
            <span className="text-zinc-500">Current Balance:</span>
            <span className="font-extrabold text-emerald-600 text-lg">
              ₹{Number(merchant.accounts?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">API Credentials</span>
          <p className="font-mono text-sm font-medium text-zinc-900 dark:text-white mt-2 break-all">
            {activeCred?.api_key || "No active key"}
          </p>
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500">Secret:</span>
            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
              {activeCred?.api_secret_preview || "••••••••"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Webhook Config</span>
          <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300 mt-2 truncate">
            {merchant.webhook_url || "Not configured"}
          </p>
          <div className="mt-3 flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500">Status:</span>
            <span className="text-emerald-600 font-semibold">Active & Signed</span>
          </div>
        </div>
      </div>

      {/* RECENT PAYMENT INTENTS */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            Recent Payment Intents
          </h2>
          <span className="text-xs text-zinc-400">Showing last 10 requests</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="p-4">Intent ID</th>
                <th className="p-4">Booking Ref</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created At</th>
                <th className="p-4 text-right">Hosted Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {intents?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400">
                    No payment intents created yet.
                  </td>
                </tr>
              ) : (
                intents?.map((pi: any) => (
                  <tr key={pi.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="p-4 font-mono text-xs">{pi.payment_intent_id}</td>
                    <td className="p-4 font-semibold text-zinc-800 dark:text-zinc-200">{pi.booking_reference}</td>
                    <td className="p-4 font-bold text-zinc-900 dark:text-white">
                      ₹{Number(pi.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          pi.status === "SUCCEEDED"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600"
                            : pi.status === "EXPIRED"
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                            : pi.status === "FAILED"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-600"
                            : "bg-blue-50 dark:bg-blue-950/40 text-blue-600"
                        }`}
                      >
                        {pi.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-zinc-400">
                      {new Date(pi.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href={`/checkout/${pi.session_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        Checkout
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSACTIONS & DOUBLE-ENTRY AUDIT LEDGER */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft size={18} className="text-emerald-600" />
            Merchant Transactions & Atomic Double-Entry Ledger
          </h2>
          <span className="text-xs text-zinc-400">Debit / Credit pairs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="p-4">Transaction Ref</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Double-Entry Ledger Records</th>
                <th className="p-4">Status</th>
                <th className="p-4">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {transactions?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                transactions?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="p-4 font-mono text-xs">{tx.transaction_ref}</td>
                    <td className="p-4 font-bold text-zinc-900 dark:text-white">
                      ₹{Number(tx.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 space-y-1">
                      {tx.merchant_ledger_entries?.map((entry: any) => (
                        <div key={entry.id} className="text-xs font-mono flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              entry.entry_type === "CREDIT"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                            }`}
                          >
                            {entry.entry_type}
                          </span>
                          <span>₹{Number(entry.amount).toLocaleString("en-IN")}</span>
                          <span className="text-zinc-400">({entry.description})</span>
                        </div>
                      ))}
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-600">
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-zinc-400">
                      {new Date(tx.completed_at || tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WEBHOOK DISPATCH LOGS */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Send size={18} className="text-amber-500" />
            Signed Webhook Events & Delivery History
          </h2>
          <span className="text-xs text-zinc-400">HMAC-signed event notifications</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-xs text-zinc-400 uppercase">
              <tr>
                <th className="p-4">Event ID</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Attempts</th>
                <th className="p-4">Last Error</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {webhooks?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-400">
                    No webhooks dispatched yet.
                  </td>
                </tr>
              ) : (
                webhooks?.map((wh: any) => (
                  <tr key={wh.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    <td className="p-4 font-mono text-xs">{wh.event_id}</td>
                    <td className="p-4 font-medium text-zinc-800 dark:text-zinc-200">{wh.event_type}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          wh.status === "DELIVERED"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                            : wh.status === "FAILED"
                            ? "bg-red-50 text-red-600 dark:bg-red-950/40"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                        }`}
                      >
                        {wh.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono">{wh.attempts} / {wh.max_attempts}</td>
                    <td className="p-4 text-xs text-zinc-400 max-w-xs truncate">
                      {wh.last_error || "—"}
                    </td>
                    <td className="p-4 text-right">
                      <form action={resendWebhookAction.bind(null, wh.id)}>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          Replay
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

