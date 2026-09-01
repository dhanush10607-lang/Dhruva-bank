"use client";

import { useState } from "react";
import { updateTicketStatus } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TicketActions({ 
  ticketId, 
  currentStatus,
  currentReply
}: { 
  ticketId: string, 
  currentStatus: string,
  currentReply: string 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [reply, setReply] = useState(currentReply);
  const [status, setStatus] = useState(currentStatus);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateTicketStatus(ticketId, status, reply);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Admin Reply</label>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          rows={3}
          placeholder="Type your response to the customer here..."
          required
        />
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Set Status:</label>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none"
          >
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Send size={16} className="mr-2" />
          Update Ticket
        </Button>
      </div>
    </form>
  );
}
