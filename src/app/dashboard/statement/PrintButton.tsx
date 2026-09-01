"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <Button 
      onClick={() => window.print()}
      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
    >
      <Printer size={18} className="mr-2" />
      Print / Download PDF
    </Button>
  );
}
