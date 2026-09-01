"use client";

import { useActionState, useRef } from "react";
import { addBeneficiary } from "@/app/actions/user";
import { Button } from "@/components/ui/button";

export default function BeneficiaryForm() {
  const [state, formAction, isPending] = useActionState(addBeneficiary, null);
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.success && formRef.current) {
    formRef.current.reset();
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state?.success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-lg border border-green-200 dark:border-green-900/50">
          {state.message}
        </div>
      )}
      
      {state?.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-900/50">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Payee Full Name</label>
        <input 
          type="text" 
          name="name" 
          required 
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="e.g. John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Account Number</label>
        <input 
          type="text" 
          name="accountNumber" 
          required 
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="e.g. DHRU12345678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Bank Name</label>
        <input 
          type="text" 
          name="bankName" 
          required 
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="e.g. Dhruva Bank"
          defaultValue="Dhruva Bank"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">IFSC / Branch Code</label>
        <input 
          type="text" 
          name="ifscCode" 
          required 
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="e.g. DHRU0001234"
          defaultValue="DHRU0001234"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nickname (Optional)</label>
        <input 
          type="text" 
          name="nickname" 
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
          placeholder="e.g. Rent, Mom, Groceries"
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl mt-2">
        {isPending ? "Adding Payee..." : "Add Beneficiary"}
      </Button>
    </form>
  );
}
