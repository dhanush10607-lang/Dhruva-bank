"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, X } from "lucide-react";
import { payLoanEMI } from "@/app/actions/user";
import { useRouter } from "next/navigation";

interface LoanPaymentModalProps {
  loanId: string;
  totalPayable: number;
  emiAmount: number;
}

export default function LoanPaymentModal({ loanId, totalPayable, emiAmount }: LoanPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState<number>(emiAmount);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const router = useRouter();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("loanId", loanId);
      formData.append("amount", amount.toString());

      const res = await payLoanEMI(null, formData);
      if (res.error) {
        setMessage({ text: res.error, type: 'error' });
      } else {
        setMessage({ text: res.message || "Payment successful", type: 'success' });
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setMessage({ text: "An unexpected error occurred.", type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline" 
        size="sm"
        className="mt-4 md:mt-0 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 dark:border-blue-900/50"
      >
        <CreditCard size={16} className="mr-2" />
        Pay EMI / Foreclose
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Loan Repayment</h3>
          <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handlePayment} className="p-6">
          <div className="mb-6 space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl flex justify-between items-center">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Total Outstanding</span>
              <span className="font-bold text-zinc-900 dark:text-white">₹{totalPayable.toLocaleString()}</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Payment Amount (₹)
              </label>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                max={totalPayable}
                min={1}
                step={0.01}
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Tip: Enter exactly ₹{totalPayable} to foreclose this loan.
              </p>
            </div>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Confirm Payment"}
          </Button>
        </form>
      </div>
    </div>
  );
}
