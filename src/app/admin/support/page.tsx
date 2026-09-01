import { createClient } from "@/lib/supabase/server";
import { LifeBuoy, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import TicketActions from "./TicketActions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select(`
      *,
      users ( full_name, customer_id, email )
    `)
    .order("created_at", { ascending: false });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'IN_PROGRESS': return <Clock className="text-yellow-500" size={16} />;
      case 'RESOLVED':
      case 'CLOSED': return <CheckCircle2 className="text-green-500" size={16} />;
      default: return <AlertCircle className="text-zinc-500" size={16} />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'RESOLVED':
      case 'CLOSED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
          <LifeBuoy className="text-blue-600 dark:text-blue-400" />
          Support Desk
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage and reply to customer support tickets.</p>
      </div>

      <div className="space-y-6">
        {(!tickets || tickets.length === 0) ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center">
            <p className="text-zinc-500">No support tickets found.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{ticket.category}</span>
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="text-xs text-zinc-500">{new Date(ticket.created_at).toLocaleString()}</span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{ticket.subject}</h3>
                  <p className="text-sm text-zinc-500">From: <span className="font-medium text-zinc-700 dark:text-zinc-300">{ticket.users?.full_name}</span> ({ticket.users?.customer_id})</p>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusClass(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  {ticket.status}
                </div>
              </div>
              
              <div className="p-6 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="mb-6">
                  <p className="text-sm font-medium text-zinc-500 mb-2">Customer Message:</p>
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap">{ticket.message}</p>
                  </div>
                </div>

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                  <TicketActions 
                    ticketId={ticket.id} 
                    currentStatus={ticket.status} 
                    currentReply={ticket.admin_reply || ""} 
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
