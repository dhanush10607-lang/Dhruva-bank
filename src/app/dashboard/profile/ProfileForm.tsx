"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/user";
import { Button } from "@/components/ui/button";

export default function ProfileForm({ profile }: { profile: any }) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <form action={formAction} className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Residential Address</label>
          <textarea 
            name="address" 
            defaultValue={profile.address || ""}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="House/Flat No, Street, Landmark"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">City</label>
          <input 
            type="text" 
            name="city" 
            defaultValue={profile.city || ""}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="e.g. Mumbai"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">State</label>
          <input 
            type="text" 
            name="state" 
            defaultValue={profile.state || ""}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="e.g. Maharashtra"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">PIN Code</label>
          <input 
            type="text" 
            name="pin_code" 
            defaultValue={profile.pin_code || ""}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="e.g. 400001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Occupation</label>
          <input 
            type="text" 
            name="occupation" 
            defaultValue={profile.occupation || ""}
            className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="e.g. Software Engineer"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
        <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-xl shadow-md">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
