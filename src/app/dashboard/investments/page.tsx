"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Briefcase, Activity, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState("STOCKS");

  const mockAssets = [
    { symbol: "RELIANCE", name: "Reliance Industries", price: 2950.45, change: 1.2, type: "STOCK" },
    { symbol: "HDFCBANK", name: "HDFC Bank", price: 1680.90, change: -0.5, type: "STOCK" },
    { symbol: "TCS", name: "Tata Consultancy", price: 4120.30, change: 2.1, type: "STOCK" },
    { symbol: "BTC", name: "Bitcoin", price: 5400000.00, change: 5.4, type: "CRYPTO" },
    { symbol: "ETH", name: "Ethereum", price: 290000.00, change: -1.2, type: "CRYPTO" },
    { symbol: "NIFTY50", name: "Nifty 50 Index Fund", price: 250.00, change: 0.8, type: "MUTUAL_FUND" },
  ];

  const filteredAssets = mockAssets.filter(a => activeTab === "ALL" || a.type === activeTab);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Wealth & Investments</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Grow your wealth with stocks, mutual funds, and crypto directly from your bank.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Portfolio Overview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <h3 className="font-bold text-indigo-100 mb-6 flex items-center gap-2">
              <Briefcase size={20} /> My Portfolio
            </h3>
            
            <p className="text-4xl font-bold mb-2">₹0.00</p>
            <div className="flex items-center gap-2 text-sm text-green-300 font-medium bg-white/10 w-fit px-3 py-1 rounded-full">
              <TrendingUp size={14} /> +0.00 (0.00%) Today
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-sm text-indigo-200">Available to Invest</p>
              <p className="text-xl font-bold">₹1,45,200.00</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 text-center">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 mx-auto mb-4">
              <Activity size={24} />
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">No Active Investments</h3>
            <p className="text-sm text-zinc-500 mb-6">You haven't purchased any assets yet. Explore the market to start building your portfolio.</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-2xl p-4 flex gap-3 text-sm text-yellow-800 dark:text-yellow-400">
            <ShieldAlert size={20} className="shrink-0 mt-0.5" />
            <p>Investment products are not insured by the RBI and may lose value. Invest at your own risk.</p>
          </div>
        </div>

        {/* Market Explorer */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Explore Market</h2>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search assets..." 
                    className="pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                {['STOCKS', 'CRYPTO', 'MUTUAL_FUND', 'ALL'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                  >
                    {tab.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredAssets.map(asset => (
                <div key={asset.symbol} className="p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 text-lg">
                      {asset.symbol.substring(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white">{asset.name}</h3>
                      <p className="text-xs text-zinc-500">{asset.symbol} • {asset.type}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-zinc-900 dark:text-white mb-1">
                      ₹{asset.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    <div className={`flex items-center justify-end gap-1 text-xs font-bold ${asset.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {asset.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(asset.change)}%
                    </div>
                  </div>
                  
                  <div className="pl-6 border-l border-zinc-100 dark:border-zinc-800 ml-6 hidden sm:block">
                    <Button variant="outline" className="font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
                      Buy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
