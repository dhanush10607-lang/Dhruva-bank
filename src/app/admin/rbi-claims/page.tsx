"use client";

import { useActionState } from "react";
import { ShieldAlert, FileText, Send, Building2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitRBIClaim } from "@/app/actions/admin";

export default function RBIClaimsPage() {
  const [state, formAction, isPending] = useActionState(submitRBIClaim, null);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">RBI Claim Simulation</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Simulate filing a regulatory dispute to fund the Bank Treasury.</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 mb-8 flex gap-4">
        <ShieldAlert className="text-amber-600 dark:text-amber-500 shrink-0 mt-1" size={24} />
        <div>
          <h3 className="text-amber-800 dark:text-amber-400 font-bold mb-1">Demonstration Module</h3>
          <p className="text-sm text-amber-700 dark:text-amber-500">
            This module simulates escalating an unresolved financial dispute to the Reserve Bank of India (RBI). 
            When submitted, it simulates a processing delay (approx 12 seconds), and then the RBI credits the claimed amount into your <strong>Admin Treasury Account</strong>.
          </p>
        </div>
      </div>

      {state?.success ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-zinc-200 dark:border-zinc-800 shadow-sm animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Claim Successfully Settled</h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            The RBI Ombudsman has approved the claim. ₹{state.amount} has been successfully deposited into the Admin Treasury Account.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">File Another Claim</Button>
        </div>
      ) : isPending ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-16 text-center border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-6 animate-pulse">
            <Clock size={40} className="animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">RBI is Processing...</h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Please wait. In a real scenario, this takes 10 to 15 minutes. For this simulation, it will take about 12 seconds. Do not refresh the page.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <Building2 className="text-blue-600 dark:text-blue-400" size={28} />
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Ombudsman Escalation Form</h2>
              <p className="text-sm text-zinc-500">File a mock grievance to receive treasury funds</p>
            </div>
          </div>

          {state?.error && (
            <div className="p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-400">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fund Request Amount (₹)</label>
              <input type="number" name="amount" required min="1" className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 500000" />
              <p className="text-xs text-zinc-500 mt-2">This amount will be credited to your Admin Treasury.</p>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl font-bold text-lg shadow-md transition-all">
              <Send size={20} className="mr-2" /> Request Funds from RBI
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
