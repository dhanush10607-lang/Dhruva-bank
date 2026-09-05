"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Settings,
  Menu,
  X
} from "lucide-react";

interface AdminSidebarProps {
  logoutAction: () => void;
}

export default function AdminSidebar({ logoutAction }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const isActive = (path: string) => pathname === path;

  const getLinkClasses = (path: string, customActiveClasses?: string) => {
    if (isActive(path)) {
      return `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${customActiveClasses || "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`;
    }
    return "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors";
  };

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 p-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-lg">
          <Landmark size={20} />
          <span>Dhruva Admin</span>
        </div>
        <button 
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
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <div className="hidden md:flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-xl">
            <Landmark size={24} />
            <span>Dhruva Admin</span>
          </div>
          <div className="md:hidden flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-lg">
            <span>Admin Menu</span>
          </div>
          
          <button 
            onClick={closeSidebar}
            className="md:hidden p-2 -mr-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          <Link onClick={closeSidebar} href="/admin" className={getLinkClasses("/admin")}>
            <LayoutDashboard size={18} className="shrink-0" />
            Dashboard
          </Link>
          <Link onClick={closeSidebar} href="/admin/users" className={getLinkClasses("/admin/users")}>
            <Users size={18} className="shrink-0" />
            All Customers
          </Link>
          <Link onClick={closeSidebar} href="/admin/users/pending" className={getLinkClasses("/admin/users/pending")}>
            <UserCheck size={18} className="shrink-0" />
            Pending Verification
          </Link>
          <Link onClick={closeSidebar} href="/admin/transactions" className={getLinkClasses("/admin/transactions")}>
            <ArrowRightLeft size={18} className="shrink-0" />
            Treasury Management
          </Link>
          <Link onClick={closeSidebar} href="/admin/statement" className={getLinkClasses("/admin/statement")}>
            <LayoutDashboard size={18} className="shrink-0" />
            Treasury Statement
          </Link>
          <Link onClick={closeSidebar} href="/admin/cards" className={getLinkClasses("/admin/cards")}>
            <CreditCard size={18} className="shrink-0" />
            Card Management
          </Link>
          <Link onClick={closeSidebar} href="/admin/loans" className={getLinkClasses("/admin/loans")}>
            <HandCoins size={18} className="shrink-0" />
            Loan Approvals
          </Link>
          <Link onClick={closeSidebar} href="/admin/support" className={getLinkClasses("/admin/support")}>
            <LifeBuoy size={18} className="shrink-0" />
            Support Desk
          </Link>
          <Link onClick={closeSidebar} href="/admin/settings" className={getLinkClasses("/admin/settings")}>
            <Settings size={18} className="shrink-0" />
            System Settings
          </Link>
          <Link onClick={closeSidebar} href="/admin/rbi-claims" className={`mt-6 ${getLinkClasses("/admin/rbi-claims")}`}>
            <ShieldAlert size={18} className="shrink-0" />
            RBI Simulation
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
