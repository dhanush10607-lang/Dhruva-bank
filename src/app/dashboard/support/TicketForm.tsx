"use client";

import { useActionState } from "react";
import { createTicket } from "@/app/actions/user";
import { Button } from "@/components/ui/button";

export default function TicketForm() {
  const [state, formAction, isPending] = useActionState(createTicket, null);

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
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Issue Category</label>
        <select 
          name="category" 
          required 
          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Select Category</option>
          <option value="ACCOUNT">Account & Profile</option>
          <option value="TRANSACTION">Transfer & Transactions</option>
          <option value="CARD">Debit / Credit Cards</option>
          <option value="SECURITY">Security & E-Secure Lock</option>
          <option value="OTHER">Other Issues</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Subject</label>
        <input 
          type="text" 
          name="subject" 
          required 
          maxLength={100}
          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="Brief title of your issue"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Details</label>
        <textarea 
          name="message" 
          required 
          rows={5}
          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
          placeholder="Please describe your issue in detail..."
        />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md">
          {isPending ? "Submitting..." : "Submit Ticket"}
        </Button>
      </div>
    </form>
  );
}
