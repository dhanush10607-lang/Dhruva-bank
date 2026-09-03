"use client";

import { useState, useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { changePassword } from "@/app/actions/user";
import { Lock, X } from "lucide-react";

export default function ChangePasswordModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(changePassword, null);

  useEffect(() => {
    if (state?.success) {
      setTimeout(() => setIsOpen(false), 2000);
    }
  }, [state]);

  if (!isOpen) {
    return <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>Update</Button>;
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>Update</Button>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-full">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Change Password</h2>
              <p className="text-sm text-zinc-500">Update your login password</p>
            </div>
          </div>

          {state?.error && (
            <div className="p-3 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-400">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="p-3 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-green-900/30 dark:text-green-400">
              {state.message}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Current Password</label>
              <input 
                type="password" 
                name="currentPassword" 
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">New Password</label>
              <input 
                type="password" 
                name="newPassword" 
                required
                minLength={6}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Confirm New Password</label>
              <input 
                type="password" 
                name="confirmPassword" 
                required
                minLength={6}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>
            
            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" disabled={isPending}>
                {isPending ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
