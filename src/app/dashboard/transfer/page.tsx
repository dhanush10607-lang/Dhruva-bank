"use client";

import { useActionState, useEffect, useState, use } from "react";
import { processTransfer } from "@/app/actions/transfer";
import { getBeneficiaries } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Send, AlertCircle, CheckCircle2, Users } from "lucide-react";
import Link from "next/link";

export default function TransferPage({ searchParams }: { searchParams: Promise<{ acc?: string, to?: string, amount?: string, desc?: string }> }) {
  const params = use(searchParams);
  const [state, formAction, isPending] = useActionState(processTransfer, null);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const b = await getBeneficiaries();
      setBeneficiaries(b);
    }
    load();
  }, []);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Transfer Money</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Send simulated funds to any Dhruva Bank customer securely.</p>
      </div>

      {state?.success ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-2xl p-8 text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-2">Transfer Successful!</h2>
          <p className="text-green-700 dark:text-green-500 mb-4">{state.message}</p>
          <div className="inline-block bg-white dark:bg-black/20 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800">
            <span className="text-sm text-green-700 dark:text-green-500">Reference: </span>
            <span className="font-mono font-medium text-green-900 dark:text-green-300">{state.reference}</span>
          </div>
          <div className="mt-8">
            <Button onClick={() => window.location.reload()} variant="outline" className="text-green-700 border-green-300">
              Make Another Transfer
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-6 sm:p-8">
            {state?.error && (
              <div className="flex items-start gap-3 p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{state.error}</p>
              </div>
            )}

            <form action={formAction} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Beneficiary Details</h3>
                
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label htmlFor="account_number" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Dhruva Bank Account Number
                    </label>
                    <Link href="/dashboard/beneficiaries" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                      <Users size={12} /> Manage Payees
                    </Link>
                  </div>
                  <input
                    id="account_number"
                    name="account_number"
                    type="text"
                    list="beneficiaries-list"
                    required
                    defaultValue={params?.to || params?.acc || ""}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                    placeholder="Search Payee or type DHRU..."
                    autoComplete="off"
                  />
                  <datalist id="beneficiaries-list">
                    {beneficiaries.map((b) => (
                      <option key={b.account_number} value={b.account_number}>
                        {b.name} {b.nickname ? `(${b.nickname})` : ''} - {b.bank_name}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Transfer Details</h3>
                
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-zinc-500">₹</span>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      defaultValue={params?.amount || ""}
                      className="w-full pl-8 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Remarks / Description (Optional)
                  </label>
                  <input
                    id="description"
                    name="description"
                    type="text"
                    maxLength={50}
                    defaultValue={params?.desc || ""}
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="e.g. Rent Payment"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Category (Optional)
                  </label>
                  <select
                    id="category"
                    name="category"
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">Uncategorized</option>
                    <option value="GROCERIES">Groceries</option>
                    <option value="RENT">Rent & Housing</option>
                    <option value="FOOD_AND_DINING">Food & Dining</option>
                    <option value="UTILITIES">Utilities & Bills</option>
                    <option value="TRAVEL">Travel</option>
                    <option value="ENTERTAINMENT">Entertainment</option>
                    <option value="HEALTHCARE">Healthcare</option>
                    <option value="SHOPPING">Shopping</option>
                    <option value="EDUCATION">Education</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Security Verification</h3>
                
                <div>
                  <label htmlFor="mpin" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Enter 4-Digit MPIN
                  </label>
                  <input
                    id="mpin"
                    name="mpin"
                    type="password"
                    maxLength={4}
                    pattern="\d{4}"
                    required
                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center tracking-widest text-xl"
                    placeholder="••••"
                  />
                  <p className="text-xs text-zinc-500 mt-2">Required to authorize this transaction securely.</p>
                </div>
              </div>

              <Button disabled={isPending} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl font-bold text-lg mt-8 shadow-md">
                {isPending ? "Processing Transfer..." : (
                  <>
                    <Send size={20} className="mr-2" /> Complete Transfer
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
