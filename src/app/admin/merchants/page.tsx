import { createAdminClient } from "@/lib/supabase/admin";
import { provisionRailConnectMerchant } from "@/lib/merchant/provision";
import { verifyAdmin } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Store, ShieldCheck, ArrowRight, CheckCircle2, AlertOctagon, Key, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMerchantsPage() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect("/login");

  const supabase = createAdminClient();

  // Safely ensure RailConnect merchant is provisioned
  try {
    await provisionRailConnectMerchant(false);
  } catch (provErr) {
    console.error("Auto-provision merchant notice:", provErr);
  }

  // Fetch all merchants
  const { data: merchants, error: merchErr } = await supabase
    .from("merchants")
    .select(`
      *,
      accounts (
        account_number,
        balance
      ),
      merchant_credentials (
        api_key,
        api_secret_preview,
        status,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (merchErr) {
    console.error("Fetch merchants error:", merchErr);
  }

  // Fetch Payment Intents stats
  const { count: totalIntents } = await supabase
    .from("merchant_payment_intents")
    .select("*", { count: "exact", head: true });

  const { count: succeededIntents } = await supabase
    .from("merchant_payment_intents")
    .select("*", { count: "exact", head: true })
    .eq("status", "SUCCEEDED");

  const { count: totalDeliveries } = await supabase
    .from("merchant_webhook_events")
    .select("*", { count: "exact", head: true });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <Store className="text-blue-600" size={32} />
            Merchant Gateway Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage RailConnect Pay, inspect payment intents, ledger records, webhooks, and credentials.
          </p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Intents</span>
            <Activity size={18} className="text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-2">{totalIntents || 0}</p>
          <span className="text-xs text-zinc-400 mt-1 block">RailConnect checkout requests</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Succeeded Payments</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{succeededIntents || 0}</p>
          <span className="text-xs text-zinc-400 mt-1 block">Successfully debited & settled</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Webhook Events</span>
            <Key size={18} className="text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-2">{totalDeliveries || 0}</p>
          <span className="text-xs text-zinc-400 mt-1 block">Signed HTTP events dispatched</span>
        </div>
      </div>

      {/* MERCHANTS LIST */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Registered Merchants</h2>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold">
            {merchants?.length || 0} Entities
          </span>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {merchants?.map((m: any) => {
            const activeCred = m.merchant_credentials?.find((c: any) => c.status === "ACTIVE");
            return (
              <div key={m.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{m.name}</h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {m.code}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                        m.status === "ACTIVE"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {m.status === "ACTIVE" ? <ShieldCheck size={12} /> : <AlertOctagon size={12} />}
                      {m.status}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 space-x-4 pt-1">
                    <span>Settlement Account: <strong className="text-zinc-700 dark:text-zinc-300">{m.accounts?.account_number}</strong></span>
                    <span>Balance: <strong className="text-emerald-600">₹{Number(m.accounts?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
                    {activeCred && (
                      <span>API Key: <code className="font-mono text-zinc-600 dark:text-zinc-300">{activeCred.api_key}</code></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/merchants/${m.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
                  >
                    Manage Merchant
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

