"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  PiggyBank,
  Menu,
  X
} from "lucide-react";

interface ProfileProps {
  full_name: string;
  customer_id: string;
}

interface DashboardSidebarProps {
  profile: ProfileProps;
  logoutAction: () => void;
}

export default function DashboardSidebar({ profile, logoutAction }: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const isActive = (path: string) => pathname === path;

  const getLinkClasses = (path: string) => {
    return `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive(path) 
        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    }`;
  };

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 p-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-lg">
          <Landmark size={20} />
          <span>Dhruva Bank</span>
        </div>
        <button 
          suppressHydrationWarning
          onClick={toggleSidebar}
          className="p-2 -mr-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-50 w-72 md:w-64 bg-white dark:bg-zinc-900 
        border-r border-zinc-200 dark:border-zinc-800 flex flex-col 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-start">
          <div>
            <div className="hidden md:flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-xl mb-4">
              <Landmark size={24} />
              <span>Dhruva Bank</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                {profile.full_name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate">{profile.full_name}</p>
                <p className="text-xs text-zinc-500">Cust ID: {profile.customer_id}</p>
              </div>
            </div>
          </div>
          
          <button 
            suppressHydrationWarning
            onClick={closeSidebar}
            className="md:hidden p-2 -mr-2 -mt-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          <Link onClick={closeSidebar} href="/dashboard" className={getLinkClasses("/dashboard")}>
            <LayoutDashboard size={18} className="shrink-0" />
            Overview
          </Link>
          <Link onClick={closeSidebar} href="/dashboard/transfer" className={getLinkClasses("/dashboard/transfer")}>
            <ArrowRightLeft size={18} className="shrink-0" />
            Transfer Money
          </Link>
          <Link onClick={closeSidebar} href="/dashboard/transactions" className={getLinkClasses("/dashboard/transactions")}>
            <History size={18} className="shrink-0" />
            Transactions
          </Link>
          <Link onClick={closeSidebar} href="/dashboard/fd" className={getLinkClasses("/dashboard/fd")}>
            <PiggyBank size={18} className="shrink-0" />
            Fixed Deposits
          </Link>
          <Link onClick={closeSidebar} href="/dashboard/statement" className={getLinkClasses("/dashboard/statement")}>
            <FileText size={18} className="shrink-0" />
            Account Statement
          </Link>
          <Link onClick={closeSidebar} href="/dashboard/beneficiaries" className={getLinkClasses("/dashboard/beneficiaries")}>
            <Users size={18} className="shrink-0" />
            Beneficiaries
          </Link>
          <Link onClick={closeSidebar} href="/dashboard/cards" className={getLinkClasses("/dashboard/cards")}>
            <CreditCard size={18} className="shrink-0" />
            My Cards
          </Link>
          <Link onClick={closeSidebar} href="/dashboard/loans" className={getLinkClasses("/dashboard/loans")}>
            <HandCoins size={18} className="shrink-0" />
            Loans
          </Link>
          <Link onClick={closeSidebar} href="/dashboard/support" className={getLinkClasses("/dashboard/support")}>
            <LifeBuoy size={18} className="shrink-0" />
            Support Tickets
          </Link>
          <Link onClick={closeSidebar} href="/dashboard/security" className={`mt-6 ${getLinkClasses("/dashboard/security")}`}>
            <ShieldCheck size={18} className="shrink-0" />
            Security Center
          </Link>
          <Link onClick={closeSidebar} href="/dashboard/profile" className={getLinkClasses("/dashboard/profile")}>
            <User size={18} className="shrink-0" />
            Profile
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <form action={logoutAction}>
            <button suppressHydrationWarning type="submit" className="flex items-center justify-center md:justify-start gap-3 px-4 py-3 text-sm font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors w-full">
              <LogOut size={18} />
              Secure Logout
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
