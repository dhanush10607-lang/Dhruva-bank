import { getUserTransactions, getUserAccount } from "@/app/actions/user";
import { ArrowUpRight, ArrowDownRight, History, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function TransactionsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data: transactions, total } = await getUserTransactions(limit, offset);
  const account = await getUserAccount();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Transaction History</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Account ending in {account?.account_number?.slice(-4) || '****'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <Download size={16} className="mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Simple Filters (UI Only) */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search transactions..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 text-sm">
            <span className="px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium cursor-pointer border border-blue-200 dark:border-blue-800/50">All</span>
            <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700">Credits</span>
            <span className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700">Debits</span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-4">
              <History size={32} />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No history found</h3>
            <p className="text-zinc-500 mt-2">You don't have any transactions on this account yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Details</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ref Number</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-sm text-zinc-500">
                      <div>{new Date(tx.created_at).toLocaleDateString('en-IN')}</div>
                      <div className="text-xs text-zinc-400">{new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'CREDIT' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}>
                          {tx.type === 'CREDIT' ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white text-sm">{tx.description || (tx.type === 'CREDIT' ? 'Deposit' : 'Withdrawal')}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {tx.type === 'CREDIT' ? 'From: ' : 'To: '} 
                            <span className="font-mono">{tx.type === 'CREDIT' ? tx.sender_details : tx.receiver_details}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap text-xs font-mono text-zinc-500">
                      {tx.reference_number}
                    </td>
                    <td className="p-4 whitespace-nowrap text-right">
                      <p className={`font-bold text-sm ${
                        tx.type === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-white'
                      }`}>
                        {tx.type === 'CREDIT' ? '+' : '-'} {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount)}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">Bal: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.balance_after)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {total > limit && (
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900">
            <p className="text-sm text-zinc-500">
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} transactions
            </p>
            <div className="flex gap-2">
              <a 
                href={`/dashboard/transactions?page=${page - 1}`}
                className={`px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 ${page <= 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                Previous
              </a>
              <a 
                href={`/dashboard/transactions?page=${page + 1}`}
                className={`px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 ${offset + limit >= total ? 'opacity-50 pointer-events-none' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              >
                Next
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
