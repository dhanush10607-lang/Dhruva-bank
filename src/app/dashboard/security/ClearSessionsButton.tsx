"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clearLoginHistory } from "@/app/actions/user";

export default function ClearSessionsButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClear = async () => {
    setIsLoading(true);
    const result = await clearLoginHistory();
    setIsLoading(false);
    
    if (result.error) {
      alert("Error: " + result.error);
    } else {
      alert(result.message);
    }
  };

  return (
    <Button 
      variant="ghost" 
      className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" 
      size="sm"
      onClick={handleClear}
      disabled={isLoading}
    >
      {isLoading ? "Clearing..." : "Clear login history"}
    </Button>
  );
}
