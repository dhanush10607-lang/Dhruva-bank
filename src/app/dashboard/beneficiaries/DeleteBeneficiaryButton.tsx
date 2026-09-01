"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteBeneficiary } from "@/app/actions/user";
import { useRouter } from "next/navigation";

export default function DeleteBeneficiaryButton({ id, name }: { id: string, name: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${name} from your beneficiaries?`)) return;
    
    setIsDeleting(true);
    try {
      const res = await deleteBeneficiary(id);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      title="Remove Beneficiary"
      className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
    >
      {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
    </button>
  );
}
