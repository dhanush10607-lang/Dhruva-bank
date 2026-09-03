"use client";

import { useState } from "react";
import { updateUserStatus } from "@/app/actions/admin";

export default function UserStatusDropdown({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === user.status) return;

    setLoading(true);
    try {
      await updateUserStatus(user.id, newStatus);
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <select
      value={user.status}
      onChange={handleStatusChange}
      disabled={loading || user.role === 'ADMIN'}
      className={`px-2 py-1 text-xs font-medium rounded-md border outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        user.status === 'APPROVED' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 
        user.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
        user.status === 'SUSPENDED' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
        'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
      }`}
    >
      <option value="APPROVED" className="bg-white text-zinc-900">Active (APPROVED)</option>
      <option value="SUSPENDED" className="bg-white text-zinc-900">Deactivated (SUSPENDED)</option>
      <option value="PENDING" className="bg-white text-zinc-900">PENDING</option>
      <option value="REJECTED" className="bg-white text-zinc-900">REJECTED</option>
    </select>
  );
}
