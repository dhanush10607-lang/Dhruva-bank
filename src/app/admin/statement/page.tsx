"use client";

import { useEffect, useState } from "react";
import { FileText, ArrowUpRight, ArrowDownRight, Search, Calendar, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminAllTransactions } from "@/app/actions/admin";

export default function TreasuryStatementPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const txs = await getAdminAllTransactions();
        setTransactions(txs);
      } catch (error) {
        console.error("Error loading transactions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredTx = transactions.filter(tx => {
    const matchesSearch = 
      (tx.description?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (tx.reference_number?.toLowerCase() || "").includes(search.toLowerCase());
    
    if (dateFilter) {
      const txDate = new Date(tx.created_at).toISOString().split('T')[0];
      return matchesSearch && txDate === dateFilter;
    }
    return matchesSearch;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Treasury Statement</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">View the complete ledger history for the central admin treasury.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <FileText className="text-blue-600 dark:text-blue-400" size={28} />
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Transaction History</h2>
            <p className="text-sm text-zinc-500">All incoming and outgoing treasury movements</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Description or Reference Number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          {(search || dateFilter) && (
            <Button variant="outline" onClick={() => { setSearch(""); setDateFilter(""); }}>Clear</Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-zinc-500 mt-4">Loading statement...</p>
          </div>
        ) : filteredTx.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
            <History className="mx-auto text-zinc-400 mb-4" size={40} />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No Transactions Found</h3>
            <p className="text-zinc-500 mt-1 max-w-md mx-auto">The treasury ledger is empty or no records match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date & Reference</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Type</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Amount</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4">
                      <p className="font-mono text-sm text-zinc-900 dark:text-zinc-300">{tx.reference_number}</p>
                      <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleString()}</p>
                    </td>
                    <td className="p-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {tx.description}
                    </td>
                    <td className="p-4">
                      {tx.type === 'CREDIT' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md">
                          <ArrowDownRight size={14} /> CREDIT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md">
                          <ArrowUpRight size={14} /> DEBIT
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-zinc-900 dark:text-white">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount)}
                    </td>
                    <td className="p-4 text-right text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.balance_after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
