"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logoutOtherDevices } from "@/app/actions/auth";

export default function SignOutOthersButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    const result = await logoutOtherDevices();
    setIsLoading(false);
    
    if (result.error) {
      alert("Error: " + result.error);
    } else {
      alert(result.message);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="w-full text-xs" 
      size="sm"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? "Signing out..." : "Sign out of all other devices"}
    </Button>
  );
}
