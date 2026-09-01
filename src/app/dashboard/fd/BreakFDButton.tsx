"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ZapOff } from "lucide-react";
import { breakFixedDeposit } from "@/app/actions/user";
import { useRouter } from "next/navigation";

export default function BreakFDButton({ fdId }: { fdId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleBreak = async () => {
    if (!confirm("Are you sure you want to break this Fixed Deposit? A 1% early withdrawal penalty will be applied to the principal amount.")) return;

    setIsLoading(true);
    try {
      const res = await breakFixedDeposit(fdId);
      if (res.error) {
        alert(res.error);
      } else {
        alert(res.message);
        router.refresh();
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleBreak} 
      disabled={isLoading}
      variant="outline" 
      size="sm"
      className="mt-4 w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 dark:border-red-900/50"
    >
      {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <ZapOff size={16} className="mr-2" />}
      Break FD
    </Button>
  );
}
