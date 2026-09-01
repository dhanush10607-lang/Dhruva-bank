import { getPendingUsers, approveUser, rejectUser } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Check, X, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PendingUsersPage() {
  const users = await getPendingUsers();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Pending Verifications</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Review and approve new customer registrations.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mb-4">
              <Check size={32} />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">All caught up!</h3>
            <p className="text-zinc-500 mt-2">There are no pending user registrations at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Customer</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Contact</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 text-sm text-zinc-500 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-medium text-zinc-900 dark:text-white">{user.full_name}</div>
                      <div className="text-sm text-zinc-500">No Demo Docs Provided</div>
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      <div>{user.email}</div>
                      <div>{user.mobile}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-500 border border-amber-200 dark:border-amber-800/50">
                        <Clock size={14} /> Pending
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <form action={async () => {
                          "use server";
                          await rejectUser(user.id);
                        }}>
                          <Button type="submit" variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/50">
                            <X size={16} className="mr-1" /> Reject
                          </Button>
                        </form>
                        
                        <form action={async () => {
                          "use server";
                          await approveUser(user.id);
                        }}>
                          <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            <Check size={16} className="mr-1" /> Approve
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
