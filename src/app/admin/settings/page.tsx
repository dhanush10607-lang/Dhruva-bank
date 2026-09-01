import { createClient } from "@/lib/supabase/server";
import { Settings, CalendarClock, AlertTriangle } from "lucide-react";
import EOMActions from "./EOMActions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
          <Settings className="text-blue-600 dark:text-blue-400" />
          System Settings
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage global banking parameters and trigger system-wide tasks.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* End of Month Simulation Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <CalendarClock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">End of Month (EOM) Simulation</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                Triggering the EOM Simulation will iterate through all active accounts in the database and automatically process monthly financial events.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10">
              <h3 className="font-bold text-green-900 dark:text-green-400 mb-1">Interest Credit</h3>
              <p className="text-sm text-green-700 dark:text-green-500">Adds 4.0% p.a. interest to all Savings accounts based on their current balance.</p>
            </div>
            <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
              <h3 className="font-bold text-red-900 dark:text-red-400 mb-1">Maintenance Charges</h3>
              <p className="text-sm text-red-700 dark:text-red-500">Deducts a flat ₹50.00 account maintenance fee from all accounts.</p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-xl flex gap-3 mb-6">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-yellow-800 dark:text-yellow-400">Warning</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-500/80 mt-1">
                This action is irreversible. All generated transactions will be permanently recorded in the ledger and affect user balances immediately.
              </p>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex justify-end">
            <EOMActions />
          </div>
        </div>

      </div>
    </div>
  );
}
