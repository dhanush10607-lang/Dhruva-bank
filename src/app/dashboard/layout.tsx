import Link from "next/link";
import { logoutUser } from "@/app/actions/auth";
import { getUserProfile } from "@/app/actions/user";
import { redirect } from "next/navigation";
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  History, 
  CreditCard, 
  Landmark, 
  LogOut, 
  User,
  ShieldCheck,
  Users,
  HandCoins,
  LifeBuoy,
  FileText,
  PiggyBank
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();
  
  if (!profile) {
    redirect("/login");
  }

  if (profile.status !== "APPROVED") {
    redirect("/login?message=Your account application is awaiting admin verification.");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-xl mb-4">
            <Landmark size={24} />
            <span>Dhruva Bank</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
              {profile.full_name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate w-32">{profile.full_name}</p>
              <p className="text-xs text-zinc-500">Cust ID: {profile.customer_id}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <LayoutDashboard size={18} />
            Overview
          </Link>
          <Link href="/dashboard/transfer" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ArrowRightLeft size={18} />
            Transfer Money
          </Link>
          <Link href="/dashboard/transactions" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <History size={18} />
            Transactions
          </Link>
          <Link href="/dashboard/fd" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <PiggyBank size={18} />
            Fixed Deposits
          </Link>
          <Link href="/dashboard/statement" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <FileText size={18} />
            Account Statement
          </Link>
          <Link href="/dashboard/beneficiaries" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Users size={18} />
            Beneficiaries
          </Link>
          <Link href="/dashboard/cards" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <CreditCard size={18} />
            My Cards
          </Link>
          <Link href="/dashboard/loans" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <HandCoins size={18} />
            Loans
          </Link>
          <Link href="/dashboard/support" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <LifeBuoy size={18} />
            Support Tickets
          </Link>
          <Link href="/dashboard/security" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors mt-8">
            <ShieldCheck size={18} />
            Security Center
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <User size={18} />
            Profile
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <form action={logoutUser}>
            <button type="submit" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors w-full">
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
