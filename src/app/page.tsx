import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Landmark, ShieldCheck, Smartphone, CreditCard } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-xl">
          <Landmark size={28} />
          <span>Dhruva Bank</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Login
          </Link>
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
              Open Account
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium border border-blue-200 dark:border-blue-800/50">
            Next Generation Digital Banking
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight">
            Banking, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Simplified.</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
            Experience secure, intelligent and seamless digital banking with Dhruva Bank. 
            Manage your finances, transfer funds, and apply for loans entirely online.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg border-zinc-300 dark:border-zinc-700">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Hero Visual Mockup */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-500/20 blur-3xl rounded-full" />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  JD
                </div>
                <div>
                  <p className="font-semibold text-sm">John Doe</p>
                  <p className="text-xs text-zinc-500">Savings •••• 1234</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">Available Balance</p>
                <p className="font-bold text-xl">₹ 1,24,500.00</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 flex items-center justify-between border border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Salary Credit</p>
                    <p className="text-xs text-zinc-500">Today, 09:30 AM</p>
                  </div>
                </div>
                <p className="font-semibold text-green-600 dark:text-green-400">+ ₹ 85,000</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-4 flex items-center justify-between border border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg text-red-600 dark:text-red-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Rent Payment</p>
                    <p className="text-xs text-zinc-500">Yesterday</p>
                  </div>
                </div>
                <p className="font-semibold text-zinc-900 dark:text-white">- ₹ 25,000</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white dark:bg-zinc-900 py-24 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold">Bank Grade Security</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Protected by advanced E-Secure Lock technology and multi-factor authentication for total peace of mind.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
              <Smartphone size={24} />
            </div>
            <h3 className="text-xl font-bold">Seamless Experience</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              A lightning-fast dashboard that works flawlessly across all your devices, anywhere in the world.
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
              <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-bold">Total Card Control</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Freeze cards, set limits, and toggle international transactions instantly from your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 text-center text-sm text-zinc-500">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-500 rounded-xl mb-8 inline-block max-w-3xl border border-yellow-200 dark:border-yellow-800/50">
          <strong className="block mb-1">Demonstration Notice</strong>
          Dhruva Bank is a demonstration banking application created for educational purposes. It is not a real bank and does not provide real banking, payment, RBI, or financial services.
        </div>
        <p>© 2026 Dhruva Bank Demo Project. All rights reserved.</p>
      </footer>
    </div>
  );
}
