import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPaymentIntent } from "@/lib/merchant/intents";
import CheckoutClient from "./CheckoutClient";
import { Landmark, ShieldAlert, Clock, AlertTriangle, TrainTrack } from "lucide-react";

export const dynamic = "force-dynamic";

interface CheckoutPageProps {
  params: Promise<{ paymentSessionId: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { paymentSessionId } = await params;

  // 1. Fetch Payment Intent
  const session = await getPaymentIntent(paymentSessionId);

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Invalid Payment Session</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            The payment session reference is invalid or does not exist. Please return to the merchant and initiate checkout again.
          </p>
        </div>
      </div>
    );
  }

  // Check Expiry
  const isExpired = session.status === "EXPIRED" || new Date(session.expires_at) <= new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Payment Session Expired</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            This payment request has expired for security reasons. Please return to RailConnect to re-initiate booking checkout.
          </p>
          <a
            href={session.failure_url}
            className="inline-block mt-6 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
          >
            Return to RailConnect
          </a>
        </div>
      </div>
    );
  }

  // 2. Check Customer Authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with returnTo preservation
    redirect(`/login?returnTo=/checkout/${paymentSessionId}`);
  }

  // 3. Fetch User Profile and Accounts
  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, email, role, status, is_locked")
    .eq("id", user.id)
    .single();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, account_number, account_type, balance, currency, status")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE");

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* DEMO / SIMULATION BANNER */}
        <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>DEMO BANKING SIMULATION • NO REAL MONEY INVOLVED</span>
          </div>
          <span className="font-semibold px-2 py-0.5 rounded-full bg-amber-200/50 dark:bg-amber-900/50 text-[10px]">
            DEMO
          </span>
        </div>

        {/* HEADER BRANDING */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500 font-bold text-xl">
            <Landmark size={26} />
            <span>Dhruva Bank</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700">
            <TrainTrack size={14} className="text-blue-600" />
            <span>Merchant: <strong className="text-zinc-800 dark:text-zinc-200">{session.merchants?.name || "RailConnect"}</strong></span>
          </div>
        </div>

        {/* PAYMENT SUMMARY CARD */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 mb-6 shadow-sm">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Amount Due</p>
          <div className="flex items-baseline justify-between mt-1">
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              ₹{Number(session.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
              INR
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Booking Reference</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-white">{session.booking_reference}</span>
            </div>
            {session.description && (
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Purpose</span>
                <span className="text-zinc-800 dark:text-zinc-200 font-medium">{session.description}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Customer Authenticated</span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{profile?.full_name || profile?.email}</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE CHECKOUT CLIENT */}
        <CheckoutClient
          session={session}
          accounts={accounts || []}
          userProfile={profile}
        />

        {/* SECURITY FOOTER */}
        <div className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
          <p>Protected by Dhruva Bank 256-bit Simulated Cryptography</p>
          <p>Session ID: {session.session_id}</p>
        </div>
      </div>
    </div>
  );
}

