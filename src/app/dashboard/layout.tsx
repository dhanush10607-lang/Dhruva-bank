import { logoutUser } from "@/app/actions/auth";
import { getUserProfile } from "@/app/actions/user";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();
  
  if (!profile) {
    redirect("/login");
  }

  if (profile.status === "SUSPENDED") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 max-w-md w-full p-8 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 text-center">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V4m0 0l-4 4m4-4l4 4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Account Deactivated</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            Your account has been deactivated by an administrator. You cannot access the dashboard or perform any transactions at this time.
          </p>
          <form action={logoutUser}>
            <button type="submit" className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-3 rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
              Log Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Removed the APPROVED check to allow PENDING users to upload KYC
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row relative">
      <DashboardSidebar profile={{ full_name: profile.full_name, customer_id: profile.customer_id }} logoutAction={logoutUser} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full max-w-[100vw] md:max-w-[calc(100vw-16rem)]">
        {children}
      </main>
    </div>
  );
}
