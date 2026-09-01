import Link from "next/link";
import { logoutUser } from "@/app/actions/auth";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  CreditCard, 
  Landmark, 
  LogOut, 
  ShieldAlert,
  ArrowRightLeft,
  HandCoins,
  LifeBuoy,
  Settings
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-xl">
            <Landmark size={24} />
            <span>Dhruva Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Users size={18} />
            All Customers
          </Link>
          <Link href="/admin/users/pending" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 transition-colors">
            <UserCheck size={18} />
            Pending Verification
          </Link>
          <Link href="/admin/transactions" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ArrowRightLeft size={18} />
            Transactions
          </Link>
          <Link href="/admin/cards" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <CreditCard size={18} />
            Card Management
          </Link>
          <Link href="/admin/loans" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <HandCoins size={18} />
            Loan Approvals
          </Link>
          <Link href="/admin/support" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <LifeBuoy size={18} />
            Support Desk
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Settings size={18} />
            System Settings
          </Link>
          <Link href="/admin/rbi-claims" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors mt-8">
            <ShieldAlert size={18} />
            RBI Simulation
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <form action={logoutUser}>
            <button suppressHydrationWarning type="submit" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors w-full">
              <LogOut size={18} />
              Secure Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
