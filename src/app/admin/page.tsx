import { verifyAdmin, getDashboardStats } from "@/app/actions/admin";
import { redirect } from "next/navigation";
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  CreditCard
} from "lucide-react";

export default async function AdminDashboardPage() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) redirect("/login");

  const stats = await getDashboardStats();

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Overview of Dhruva Bank system operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stat Cards */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Customers</h3>
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.totalUsers}</p>
          <p className="text-sm text-zinc-500 mt-2 flex items-center gap-1">
            Total registered users
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Accounts</h3>
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Activity size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.activeAccounts}</p>
          <p className="text-sm text-zinc-500 mt-2 flex items-center gap-1">
            Accounts ready for banking
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Deposits (Demo)</h3>
            <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <ArrowDownRight size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stats.totalDeposits)}
          </p>
          <p className="text-sm text-zinc-500 mt-2 flex items-center gap-1">
            Total credit volume
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Cards</h3>
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <CreditCard size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.activeCards}</p>
          <p className="text-sm text-zinc-500 mt-2 flex items-center gap-1">
            Issued to customers
          </p>
        </div>
      </div>

      {/* Mock Chart Area */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-96 flex flex-col justify-center items-center">
        <p className="text-zinc-500">Transaction Volume Chart</p>
        <p className="text-xs text-zinc-400">(Recharts integration coming soon)</p>
      </div>
    </div>
  );
}
