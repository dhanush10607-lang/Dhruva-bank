"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowLeftRight, CheckCircle2, RotateCcw, HandCoins, Search, Calendar, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { creditAccount, debitAccount, getAdminTreasury, getAdminInjectedTransactions, getAllAccountsForDropdown } from "@/app/actions/admin";
import { formatCompactCurrency } from "@/lib/utils";

export default function TransactionsPage() {
  const [txType, setTxType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [creditState, creditFormAction, isCreditPending] = useActionState(creditAccount, null);
  const [debitState, debitFormAction, isDebitPending] = useActionState(debitAccount, null);
  const [treasury, setTreasury] = useState<any>(null);
  const [injectedTx, setInjectedTx] = useState<any[]>([]);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    async function loadData() {
      const adminTreasury = await getAdminTreasury();
      setTreasury(adminTreasury);
      const txs = await getAdminInjectedTransactions();
      setInjectedTx(txs);
      const accountsList = await getAllAccountsForDropdown();
      setAllAccounts(accountsList);
    }
    loadData();
  }, [creditState, debitState, txType]);

  const state = txType === 'CREDIT' ? creditState : debitState;

  const filteredTx = injectedTx.filter(tx => {
    const matchesSearch = (tx.accounts?.account_number?.toLowerCase() || "").includes(search.toLowerCase()) || 
                          (tx.reference_number?.toLowerCase() || "").includes(search.toLowerCase());
    
    if (dateFilter) {
      const txDate = new Date(tx.created_at).toISOString().split('T')[0];
      return matchesSearch && txDate === dateFilter;
    }
    return matchesSearch;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Treasury Management</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Inject demo funds into accounts or refund money back to treasury.</p>
        </div>
        
        {treasury && (
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm text-right">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Total Treasury Balance</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{formatCompactCurrency(treasury.balance)}</p>
          </div>
        )}
      </div>

      {/* Transaction Type Tabs */}
      <div className="flex gap-4 mb-6">
        <button 
          suppressHydrationWarning
          onClick={() => { setTxType('CREDIT'); setSearch(""); setDateFilter(""); }}
          className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all ${
            txType === 'CREDIT' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <HandCoins size={20} />
          <span className="font-semibold text-lg">Inject Funds (Credit)</span>
        </button>

        <button 
          suppressHydrationWarning
          onClick={() => setTxType('DEBIT')}
          className={`flex-1 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all ${
            txType === 'DEBIT' 
              ? 'bg-amber-600 text-white shadow-md' 
              : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <RotateCcw size={20} />
          <span className="font-semibold text-lg">Treasury Refund Portal</span>
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <ArrowLeftRight className={txType === 'CREDIT' ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'} size={28} />
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {txType === 'CREDIT' ? 'Fund Injection Portal' : 'Treasury Refund Portal'}
            </h2>
            <p className="text-sm text-zinc-500">
              {txType === 'CREDIT' ? 'All transactions are logged in the audit trail.' : 'Reverse previously injected funds back into the Treasury.'}
            </p>
          </div>
        </div>

        {state?.error && (
          <div className="p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-400">
            {state.error}
          </div>
        )}

        {state?.success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Transaction Successful</h3>
            <p className="text-zinc-500 mb-6">{state.message || "The transaction has been processed."}</p>
            <Button onClick={() => window.location.reload()} variant="outline">Start Another Transaction</Button>
          </div>
        ) : txType === 'CREDIT' ? (
          /* CREDIT FORM */
          <form action={creditFormAction} className="space-y-6 max-w-2xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Account Number</label>
              <input 
                suppressHydrationWarning 
                type="text" 
                name="accountNumber" 
                list="accounts-list"
                required 
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Search by Name, ID, or Type DHRU..." 
                autoComplete="off"
              />
              <datalist id="accounts-list">
                {allAccounts.map(acc => (
                  <option key={acc.account_number} value={acc.account_number}>
                    {acc.users?.full_name} ({acc.users?.customer_id})
                  </option>
                ))}
              </datalist>
              <p className="text-xs text-zinc-500 mt-2">Start typing a name, customer ID, or account number to search.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Amount to Credit (₹)</label>
              <input suppressHydrationWarning type="number" name="amount" required min="1" max={treasury?.balance || 1000000} className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 50000" />
              {treasury && Number(treasury.balance) === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                  You have ₹0 in your Treasury. Please file an RBI Claim first to request funds.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Transaction Description</label>
              <input suppressHydrationWarning type="text" name="description" defaultValue="Demo Funds Credited by Admin" required className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <Button 
              suppressHydrationWarning
              type="submit" 
              disabled={isCreditPending || (treasury && Number(treasury.balance) <= 0)} 
              className="w-full font-bold py-6 rounded-xl text-lg shadow-md transition-all bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreditPending ? "Processing..." : "Inject Funds into Account"}
            </Button>
          </form>
        ) : (
          /* DEBIT / REFUND LIST */
          <div>
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by Account Number or Reference ID..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none" 
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none" 
                />
              </div>
              {(search || dateFilter) && (
                <Button variant="outline" onClick={() => { setSearch(""); setDateFilter(""); }}>Clear</Button>
              )}
            </div>

            {filteredTx.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
                <History className="mx-auto text-zinc-400 mb-4" size={40} />
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No Injectable Transactions Found</h3>
                <p className="text-zinc-500 mt-1 max-w-md mx-auto">There are no records matching your criteria or you haven't injected any funds recently.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                      <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Reference / Date</th>
                      <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Account Number</th>
                      <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</th>
                      <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount Injected</th>
                      <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredTx.map(tx => (
                      <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="p-4">
                          <p className="font-mono text-sm text-zinc-900 dark:text-zinc-300">{tx.reference_number}</p>
                          <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleString()}</p>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                            {tx.accounts?.account_number || "Unknown"}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {tx.description}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-green-600 dark:text-green-400">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <form action={debitFormAction}>
                            <input type="hidden" name="accountNumber" value={tx.accounts?.account_number} />
                            <input type="hidden" name="amount" value={tx.amount} />
                            <input type="hidden" name="description" value={`Reversal of ${tx.reference_number}`} />
                            <Button 
                              suppressHydrationWarning
                              type="submit"
                              disabled={isDebitPending || tx.is_refunded}
                              size="sm"
                              className={tx.is_refunded ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed" : "bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400"}
                            >
                              <RotateCcw size={14} className="mr-2" /> 
                              {tx.is_refunded ? "Refunded" : "Refund"}
                            </Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
