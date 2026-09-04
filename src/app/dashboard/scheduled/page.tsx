import { getScheduledTransfers, getBeneficiaries, createScheduledTransfer, cancelScheduledTransfer } from "@/app/actions/user";
import { CalendarClock, Plus, Trash2, ArrowRightLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCompactCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ScheduledTransfersPage() {
  const transfers = await getScheduledTransfers();
  const beneficiaries = await getBeneficiaries();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Scheduled Transfers</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Set up and manage recurring payments automatically.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create New Schedule Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 sticky top-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus size={20} /> New Schedule
            </h2>
            
            <form action={createScheduledTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Select Beneficiary</label>
                <select 
                  name="beneficiary_id" 
                  required
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                >
                  <option value="">Select a beneficiary...</option>
                  {beneficiaries.map((b: any) => (
                    <option key={b.id} value={b.account_number}>
                      {b.name} ({b.account_number.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Amount (₹)</label>
                <input 
                  type="number" 
                  name="amount" 
                  required
                  min="1"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Frequency</label>
                <select 
                  name="frequency" 
                  required
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Description</label>
                <input 
                  type="text" 
                  name="description" 
                  placeholder="e.g. Rent, Subscription"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 mt-2">
                Create Schedule
              </Button>
            </form>
          </div>
        </div>

        {/* Existing Schedules */}
        <div className="lg:col-span-2">
          {transfers.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-16 text-center h-full flex flex-col justify-center items-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                <CalendarClock size={32} />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No Scheduled Transfers</h2>
              <p className="text-zinc-500 max-w-sm">You haven't set up any recurring payments yet. Create one to automatically send money.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((t: any) => (
                <div key={t.id} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <ArrowRightLeft size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white">{t.description || 'Scheduled Transfer'}</h3>
                      <p className="text-sm text-zinc-500 mt-1">To Account: •••• {t.to_account_id ? 'INTERNAL' : 'EXTERNAL'}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded">
                          {t.frequency}
                        </span>
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                          <Clock size={12} /> Next: {new Date(t.next_run_date).toLocaleDateString()}
                        </span>
                        {t.status === 'ACTIVE' ? (
                          <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">ACTIVE</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">{t.status}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-4">
                    <p className="text-xl font-bold text-zinc-900 dark:text-white">
                      ₹{Number(t.amount).toLocaleString('en-IN')}
                    </p>
                    {t.status === 'ACTIVE' && (
                      <form action={cancelScheduledTransfer}>
                        <input type="hidden" name="id" value={t.id} />
                        <Button type="submit" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 h-8 px-3 text-xs">
                          <Trash2 size={14} className="mr-1" /> Cancel
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
