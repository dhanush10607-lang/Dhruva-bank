"use client";

import { useState } from "react";
import { simulateEndOfMonth } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EOMActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const router = useRouter();

  const handleSimulate = async () => {
    if (!confirm("Are you sure you want to trigger the End of Month simulation? This will modify all account balances.")) return;
    
    setIsLoading(true);
    setResult(null);
    try {
      const res = await simulateEndOfMonth();
      setResult(res as any);
      if (res.success) {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      setResult({ error: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {result?.success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-xl border border-green-200 dark:border-green-900/50">
          {result.message}
        </div>
      )}
      
      {result?.error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-900/50">
          {result.error}
        </div>
      )}

      <Button 
        onClick={handleSimulate}
        disabled={isLoading}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg font-bold shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/40"
      >
        <PlayCircle size={24} className="mr-3" />
        {isLoading ? "Processing Ledger..." : "Run EOM Simulation"}
      </Button>
    </div>
  );
}
