"use client";

import { useState } from "react";
import { approveLoan, rejectLoan } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoanActions({ loanId }: { loanId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    setIsLoading(true);
    try {
      if (action === 'APPROVE') {
        await approveLoan(loanId);
      } else {
        await rejectLoan(loanId);
      }
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <Button 
        onClick={() => handleAction('APPROVE')} 
        disabled={isLoading}
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
      >
        <Check size={14} className="mr-1" /> Approve
      </Button>
      <Button 
        onClick={() => handleAction('REJECT')} 
        disabled={isLoading}
        size="sm"
        variant="destructive"
        className="h-8 px-3"
      >
        <X size={14} className="mr-1" /> Reject
      </Button>
    </div>
  );
}
