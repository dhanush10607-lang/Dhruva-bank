import { getUserAccount, getUserTransactions, getUserProfile } from "@/app/actions/user";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet,
  CreditCard,
  Send,
  Plus
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const profile = await getUserProfile();
  const account = await getUserAccount();
  const transactions = await getUserTransactions();

  // Basic stats logic
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Good Morning, {profile?.full_name.split(' ')[0]}</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Here is your financial summary.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/transfer">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <Send size={16} className="mr-2" />
              Transfer Money
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Main Balance Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Landmark size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 mb-2">Available Balance</p>
            <h2 className="text-5xl font-bold mb-8">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(account?.balance || 0)}
            </h2>
            
            <div className="flex items-end justify-between">
              <div>
                <p className="text-blue-200 text-sm mb-1">Account Number (Demo)</p>
                <p className="font-mono text-lg tracking-wider">{account?.account_number}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-sm mb-1">Status</p>
                <p className="font-medium bg-white/20 px-3 py-1 rounded-full text-sm inline-block">
                  {account?.status}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions / Mini Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <ArrowDownRight size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Credits</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
                    transactions.filter(t => t.type === 'CREDIT').reduce((acc, curr) => acc + Number(curr.amount), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <ArrowUpRight size={24} />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Debits</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
                    transactions.filter(t => t.type === 'DEBIT').reduce((acc, curr) => acc + Number(curr.amount), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Recent Transactions</h2>
          <Link href="/dashboard/transactions" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
            View All
          </Link>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-4">
                <Wallet size={32} />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No transactions yet</h3>
              <p className="text-zinc-500 mt-2">When you transfer or receive money, it will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentTransactions.map((tx: any) => (
                <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      tx.type === 'CREDIT' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                        : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    }`}>
                      {tx.type === 'CREDIT' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{tx.description || (tx.type === 'CREDIT' ? 'Deposit' : 'Withdrawal')}</p>
                      <p className="text-xs text-zinc-500">{new Date(tx.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      tx.type === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-zinc-900 dark:text-white'
                    }`}>
                      {tx.type === 'CREDIT' ? '+' : '-'} {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount)}
                    </p>
                    <p className="text-xs text-zinc-500">Bal: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.balance_after)}</p>
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

// Ensure the icon is imported for the absolute block
import { Landmark } from "lucide-react";
