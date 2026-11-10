"use client";

import { useActionState, useState, useEffect } from "react";
import { authorizeCheckoutPayment } from "./actions";
import { ShieldCheck, Lock, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckoutClientProps {
  session: any;
  accounts: any[];
  userProfile: any;
}

export default function CheckoutClient({ session, accounts, userProfile }: CheckoutClientProps) {
  const [state, formAction, isPending] = useActionState(authorizeCheckoutPayment, null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || "");
  const [mpin, setMpin] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(3);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const isInsufficient = selectedAccount ? Number(selectedAccount.balance) < Number(session.amount) : true;
  const isSuccess = Boolean(state?.success || session.status === "SUCCEEDED");

  const successReturnUrl = new URL(session.success_url);
  successReturnUrl.searchParams.set("status", "SUCCESS");
  successReturnUrl.searchParams.set("payment_id", state?.paymentIntentId || session.payment_intent_id);
  if (state?.transactionRef) {
    successReturnUrl.searchParams.set("txn_ref", state.transactionRef);
  }
  const redirectTarget = successReturnUrl.toString();

  useEffect(() => {
    if (!isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = redirectTarget;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, redirectTarget]);

  if (isSuccess) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Payment Authorized!</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          Your simulated payment of ₹{Number(session.amount).toLocaleString("en-IN")} to RailConnect has completed successfully.
        </p>

        <div className="my-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <Loader2 size={14} className="animate-spin" />
          Auto-redirecting to RailConnect in {countdown}s...
        </div>

        <div className="my-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-left text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Payment ID:</span>
            <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{state?.paymentIntentId || session.payment_intent_id}</span>
          </div>
          {state?.transactionRef && (
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Reference:</span>
              <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">{state.transactionRef}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Booking Ref:</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{session.booking_reference}</span>
          </div>
        </div>

        <a
          href={redirectTarget}
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-600/20 transition-colors"
        >
          Return to RailConnect Now
          <ArrowRight size={18} />
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      {state?.error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Payment Failed</p>
            <p className="mt-0.5">{state.error}</p>
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="session_id" value={session.session_id} />
        <input type="hidden" name="account_id" value={selectedAccountId} />

        {/* Account Selection */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Select Paying Account
          </label>
          <div className="space-y-2">
            {accounts.map((acc) => {
              const isSelected = acc.id === selectedAccountId;
              const hasBalance = Number(acc.balance) >= Number(session.amount);

              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/20"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-blue-600 bg-blue-600" : "border-zinc-400"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-white">
                          {acc.account_type} ({acc.account_number.slice(-4)})
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {acc.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">Acc: {acc.account_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      ₹{Number(acc.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    {!hasBalance && (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Insufficient balance
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MPIN Input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Enter 4-Digit Security MPIN
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              name="mpin"
              maxLength={4}
              required
              value={mpin}
              onChange={(e) => setMpin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500" />
            MPIN is verified directly by Dhruva Bank and is never shared with RailConnect.
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isPending || isInsufficient || mpin.length !== 4}
          className="w-full py-4 text-base rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/25 disabled:opacity-50"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Processing Demo Payment...
            </span>
          ) : isInsufficient ? (
            "Insufficient Account Balance"
          ) : (
            `Pay ₹${Number(session.amount).toLocaleString("en-IN")} via Dhruva Bank`
          )}
        </Button>

        {/* Cancel / Return to Merchant */}
        <div className="text-center pt-2">
          <a
            href={session.failure_url}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            Cancel and return to RailConnect
          </a>
        </div>
      </form>
    </div>
  );
}

