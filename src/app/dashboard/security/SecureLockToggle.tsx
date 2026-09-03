"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { toggleSecureLock } from "@/app/actions/user";
import { useRouter } from "next/navigation";

export default function SecureLockToggle({ initialLocked }: { initialLocked: boolean }) {
  const [isLocked, setIsLocked] = useState(initialLocked);
  const [mPin, setMpin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggleLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mPin.length === 4) {
      setIsLoading(true);
      // Ideally we should verify MPIN here first, but this is a simulated demo
      const result = await toggleSecureLock(isLocked);
      if (result.success) {
        setIsLocked(!isLocked);
        setMpin("");
        router.refresh();
      }
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-8 rounded-3xl border transition-all duration-300 ${
      isLocked 
        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50' 
        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm'
    }`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isLocked 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          }`}>
            {isLocked ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">E-Secure Lock</h2>
            <p className={`text-sm font-medium ${isLocked ? 'text-red-600' : 'text-green-600'}`}>
              Status: {isLocked ? 'LOCKED' : 'ACTIVE'}
            </p>
          </div>
        </div>
      </div>

      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        {isLocked 
          ? 'Your account is currently locked. All outgoing transactions, transfers, and card payments are blocked. Incoming deposits will still process normally.' 
          : 'E-Secure Lock allows you to instantly freeze all outgoing transactions and card usage across your entire account in case of emergency.'}
      </p>

      <form onSubmit={handleToggleLock} className="flex gap-3 items-end">
        <div className="flex-1">
          <label htmlFor="mpin" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Authorize with MPIN
          </label>
          <input
            id="mpin"
            type="password"
            maxLength={4}
            value={mPin}
            onChange={(e) => setMpin(e.target.value)}
            placeholder="••••"
            className="w-full sm:w-32 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest text-center"
            required
            disabled={isLoading}
            suppressHydrationWarning
          />
        </div>
        <Button type="submit" disabled={isLoading} variant={isLocked ? "default" : "destructive"} className={isLocked ? "bg-green-600 hover:bg-green-700" : ""}>
          {isLoading ? 'Updating...' : (isLocked ? 'Unlock Account' : 'Lock Account')}
        </Button>
      </form>
    </div>
  );
}
