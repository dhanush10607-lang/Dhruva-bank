import { logoutUser } from "@/app/actions/auth";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row relative">
      <AdminSidebar logoutAction={logoutUser} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full max-w-[100vw] md:max-w-[calc(100vw-16rem)]">
        {children}
      </main>
    </div>
  );
}
