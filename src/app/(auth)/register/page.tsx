"use client";

import { registerUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { useActionState } from "react";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerUser, null);

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 my-8">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-blue-600 p-3 rounded-xl mb-4 text-white">
          <Landmark size={32} />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white text-center">
          Apply for an Account
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm text-center">
          Join Dhruva Bank today. Secure, intelligent, and seamless digital banking.
        </p>
      </div>

      {state?.error && (
        <div className="p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-400">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Full Name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label htmlFor="mobile" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Mobile Number
          </label>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            required
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="+91 9876543210"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
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

        <div>
          <label htmlFor="mpin" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Create 4-Digit MPIN (For Transactions)
          </label>
          <input
            id="mpin"
            name="mpin"
            type="password"
            maxLength={4}
            pattern="\d{4}"
            required
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="1234"
          />
        </div>

        <Button disabled={isPending} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium mt-6">
          {isPending ? "Submitting..." : "Submit Application"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
          Sign In
        </Link>
      </div>
      
      <div className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
        <p className="font-semibold text-zinc-600 dark:text-zinc-300 mb-1">Disclaimer</p>
        <p>This is a simulated banking platform created for educational purposes.</p>
        <p>Do NOT use real government ID numbers or passwords.</p>
      </div>
    </div>
  );
}
