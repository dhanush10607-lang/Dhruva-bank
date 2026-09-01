"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, CheckCircle2 } from "lucide-react";
import { openFixedDeposit } from "@/app/actions/user";
import { useRouter } from "next/navigation";

export default function FDForm() {
  const [amount, setAmount] = useState<number>(10000);
  const [tenure, setTenure] = useState<number>(12);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const router = useRouter();

  const handleOpenFD = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("amount", amount.toString());
      formData.append("tenure_months", tenure.toString());

      const res = await openFixedDeposit(null, formData);
      if (res.error) {
        setMessage({ text: res.error, type: 'error' });
      } else {
        setMessage({ text: res.message || "FD Opened!", type: 'success' });
        setTimeout(() => {
          setMessage(null);
          setAmount(10000);
          router.refresh();
        }, 2000);
      }
    } catch (err) {
      setMessage({ text: "An unexpected error occurred.", type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getInterestRate = () => {
    if (tenure >= 36) return 7.5;
    if (tenure >= 12) return 7.0;
    return 6.5;
  };

  return (
    <form onSubmit={handleOpenFD} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Deposit Amount (₹)
        </label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          min={5000}
          step={1000}
          required
          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-zinc-500 mt-1">Minimum ₹5,000</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Tenure
        </label>
        <select 
          value={tenure}
          onChange={(e) => setTenure(Number(e.target.value))}
          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={6}>6 Months (6.5% p.a.)</option>
          <option value={12}>1 Year (7.0% p.a.)</option>
          <option value={24}>2 Years (7.0% p.a.)</option>
          <option value={36}>3 Years (7.5% p.a.)</option>
          <option value={60}>5 Years (7.5% p.a.)</option>
        </select>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50">
        <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-2">Maturity Projection</h4>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-blue-700 dark:text-blue-300">Interest Rate:</span>
          <span className="font-semibold text-blue-900 dark:text-blue-200">{getInterestRate()}% p.a.</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-blue-700 dark:text-blue-300">Est. Maturity Amount:</span>
          <span className="font-bold text-blue-900 dark:text-blue-200">
            ₹{(amount * (1 + (getInterestRate() / 100) * (tenure / 12))).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.type === 'success' && <CheckCircle2 size={18} />}
          {message.text}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-base font-bold shadow-lg shadow-blue-500/20">
        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
          <>
            <PlusCircle size={20} className="mr-2" />
            Open Fixed Deposit
          </>
        )}
      </Button>
    </form>
  );
}
