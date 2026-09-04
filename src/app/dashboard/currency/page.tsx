"use client";

import { useState } from "react";
import { TrendingUp, ArrowRightLeft, DollarSign, Euro, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CurrencyExchangePage() {
  const [amount, setAmount] = useState<string>("1000");
  const [fromCurrency, setFromCurrency] = useState("INR");
  const [toCurrency, setToCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);

  // Simulated exchange rates (In a real app, this would come from an API or DB)
  const rates: Record<string, number> = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
  };

  const symbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
  };

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`Simulated: Converted ${symbols[fromCurrency]}${amount} to ${symbols[toCurrency]}${convertedAmount}`);
    }, 1000);
  };

  const convertedAmount = (Number(amount) * (rates[toCurrency] / rates[fromCurrency])).toFixed(2);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Currency Exchange</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Convert your funds instantly between global currencies with zero hidden fees.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Converter Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
          <form onSubmit={handleConvert} className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">You Send</label>
              <span className="text-xs text-zinc-500">Balance: ₹1,45,200</span>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-4 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xl font-bold dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <select 
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-32 px-4 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold outline-none dark:text-white"
              >
                <option value="INR">🇮🇳 INR</option>
                <option value="USD">🇺🇸 USD</option>
                <option value="EUR">🇪🇺 EUR</option>
              </select>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors">
                <ArrowRightLeft size={18} className="rotate-90" />
              </div>
            </div>

            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">You Receive (Estimated)</label>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={convertedAmount}
                  readOnly
                  className="w-full pl-4 pr-4 py-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none text-xl font-bold text-zinc-500 cursor-not-allowed"
                />
              </div>
              <select 
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-32 px-4 py-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold outline-none dark:text-white"
              >
                <option value="USD">🇺🇸 USD</option>
                <option value="EUR">🇪🇺 EUR</option>
                <option value="INR">🇮🇳 INR</option>
              </select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
              <Info className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={16} />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">Live Exchange Rate</p>
                <p>1 {fromCurrency} = {(rates[toCurrency] / rates[fromCurrency]).toFixed(4)} {toCurrency}</p>
                <p className="text-xs mt-1 opacity-80">Rates are indicative and refresh every 60 seconds.</p>
              </div>
            </div>

            <Button disabled={loading || !amount || Number(amount) <= 0} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-semibold text-lg shadow-md">
              {loading ? "Processing..." : "Convert Funds Instantly"}
            </Button>
          </form>
        </div>

        {/* Global Wallet Balances */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl">
            <h3 className="font-bold text-slate-300 mb-6 flex items-center gap-2">
              <DollarSign size={20} /> USD Wallet
            </h3>
            <p className="text-4xl font-bold mb-2">$0.00</p>
            <p className="text-sm text-slate-400">≈ ₹0.00 INR</p>
            
            <div className="mt-8 flex gap-3">
              <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white w-full">Deposit</Button>
              <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white w-full">Withdraw</Button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-3xl p-8 text-white shadow-xl">
            <h3 className="font-bold text-indigo-300 mb-6 flex items-center gap-2">
              <Euro size={20} /> EUR Wallet
            </h3>
            <p className="text-4xl font-bold mb-2">€0.00</p>
            <p className="text-sm text-indigo-400">≈ ₹0.00 INR</p>
            
            <div className="mt-8 flex gap-3">
              <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white w-full">Deposit</Button>
              <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white w-full">Withdraw</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
