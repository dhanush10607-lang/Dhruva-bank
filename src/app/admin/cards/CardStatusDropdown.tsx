"use client";

import { useState } from "react";
import { updateCardStatus } from "@/app/actions/admin";

export default function CardStatusDropdown({ card }: { card: any }) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === card.status) return;

    setLoading(true);
    try {
      await updateCardStatus(card.id, newStatus);
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={card.status}
      onChange={handleStatusChange}
      disabled={loading}
      className={`px-2 py-1 text-xs font-medium rounded-md border outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        card.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 
        card.status === 'FROZEN' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
        'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
      }`}
    >
      <option value="ACTIVE" className="bg-white text-zinc-900">ACTIVE</option>
      <option value="FROZEN" className="bg-white text-zinc-900">FROZEN</option>
      <option value="BLOCKED" className="bg-white text-zinc-900">BLOCKED</option>
    </select>
  );
}
