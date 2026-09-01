import { getUserProfile } from "@/app/actions/user";
import { Lock, Smartphone, Key } from "lucide-react";
import SecureLockToggle from "./SecureLockToggle";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SecurityCenterPage() {
  const profile = await getUserProfile();

  if (!profile) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Security Center</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your account security and E-Secure Lock.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          
          <SecureLockToggle initialLocked={profile.is_locked} />

          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <Key className="text-zinc-400" size={20} />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white text-sm">Change MPIN</p>
                    <p className="text-xs text-zinc-500">Update your 4-digit transaction pin</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Lock className="text-zinc-400" size={20} />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white text-sm">Change Password</p>
                    <p className="text-xs text-zinc-500">Update your login password</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Active Sessions</h3>
            <div className="flex items-start gap-3 mb-4">
              <Smartphone className="text-zinc-400 shrink-0" size={18} />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Windows PC (Current)</p>
                <p className="text-xs text-zinc-500">Chrome Browser</p>
                <p className="text-xs text-green-600 mt-1">Active now</p>
              </div>
            </div>
            <Button variant="outline" className="w-full text-xs" size="sm">Sign out of all other devices</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
