"use client";

import { loginUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginUser, null);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const returnTo = searchParams.get("returnTo");

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-blue-600 p-3 rounded-xl mb-4 text-white">
          <Landmark size={32} />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white text-center">
          Welcome to Dhruva Bank
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm text-center">
          Secure, intelligent, and seamless digital banking.
        </p>
      </div>

      {message && (
        <div className="p-4 mb-6 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-green-900/30 dark:text-green-400">
          {message}
        </div>
      )}

      {state?.error && (
        <div className="p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-400">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4" suppressHydrationWarning>
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="john@example.com"
            defaultValue={(state as any)?.email as string || ""}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="••••••••"
          />
        </div>

        <Button disabled={isPending} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium">
          {isPending ? "Authenticating..." : "Secure Login"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Don't have an account?{" "}
        <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          Apply Now
        </Link>
      </div>
      
      <div className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>This is a simulated banking platform.</p>
        <p>Not connected to real financial networks.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
