import { getTickets } from "@/app/actions/user";
import { LifeBuoy, Clock, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import TicketForm from "./TicketForm";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const tickets = await getTickets();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'IN_PROGRESS':
        return <Clock className="text-yellow-500" />;
      case 'RESOLVED':
      case 'CLOSED':
        return <CheckCircle2 className="text-green-500" />;
      default:
        return <AlertCircle className="text-zinc-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'IN_PROGRESS':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50';
      case 'RESOLVED':
      case 'CLOSED':
        return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50';
      default:
        return 'bg-zinc-50 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400 border-zinc-200 dark:border-zinc-900/50';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Customer Support</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Submit support tickets and track their resolution status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Your Support Tickets</h2>
          
          {tickets.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                <LifeBuoy size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">How can we help?</h3>
              <p className="text-zinc-500 dark:text-zinc-400">You don't have any open support tickets.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{ticket.category}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-xs text-zinc-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{ticket.subject}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-zinc-500 mb-1">Your Message:</p>
                      <p className="text-sm text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap">{ticket.message}</p>
                    </div>
                    
                    {ticket.admin_reply && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50 mt-4 relative">
                        <div className="absolute -top-3 left-4 bg-white dark:bg-zinc-900 px-2 flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400">
                          <MessageSquare size={12} /> Support Reply
                        </div>
                        <p className="text-sm text-zinc-800 dark:text-zinc-300 pt-2 whitespace-pre-wrap">{ticket.admin_reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Ticket Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Create Ticket</h2>
            <TicketForm />
          </div>
        </div>
      </div>
    </div>
  );
}
