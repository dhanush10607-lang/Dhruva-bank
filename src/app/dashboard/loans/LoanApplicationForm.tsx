"use client";

import { useActionState } from "react";
import { applyForLoan } from "@/app/actions/user";
import { Button } from "@/components/ui/button";

export default function LoanApplicationForm() {
  const [state, formAction, isPending] = useActionState(applyForLoan, null);

  return (
    <form action={formAction} className="space-y-5">
      {state?.success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-xl border border-green-200 dark:border-green-900/50">
          {state.message}
        </div>
      )}
      
      {state?.error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-900/50">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Loan Type</label>
        <select 
          name="loan_type" 
          required 
          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Select Loan Type</option>
          <option value="PERSONAL">Personal Loan (12.5% p.a.)</option>
          <option value="HOME">Home Loan (8.5% p.a.)</option>
          <option value="VEHICLE">Vehicle Loan (9.5% p.a.)</option>
          <option value="EDUCATION">Education Loan (7.5% p.a.)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Required Amount (₹)</label>
        <input 
          type="number" 
          name="amount" 
          min="10000"
          max="5000000"
          step="1000"
          required 
          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="e.g. 500000"
        />
        <p className="text-xs text-zinc-500 mt-1">Min: ₹10,000 | Max: ₹50,00,000</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tenure (Months)</label>
        <select 
          name="tenure_months" 
          required 
          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Select Tenure</option>
          <option value="12">1 Year (12 months)</option>
          <option value="24">2 Years (24 months)</option>
          <option value="36">3 Years (36 months)</option>
          <option value="60">5 Years (60 months)</option>
          <option value="120">10 Years (120 months)</option>
        </select>
      </div>

      <div className="pt-4">
        <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md">
          {isPending ? "Submitting..." : "Apply Now"}
        </Button>
      </div>
    </form>
  );
}
