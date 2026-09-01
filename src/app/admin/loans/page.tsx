import { createClient } from "@/lib/supabase/server";
import { HandCoins, CheckCircle2, XCircle, Clock } from "lucide-react";
import LoanActions from "./LoanActions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLoansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: loans } = await supabase
    .from("loans")
    .select(`
      *,
      users ( full_name, customer_id, email, mobile )
    `)
    .order("created_at", { ascending: false });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE': return <CheckCircle2 className="text-green-500" size={18} />;
      case 'REJECTED': return <XCircle className="text-red-500" size={18} />;
      case 'PENDING': return <Clock className="text-yellow-500" size={18} />;
      default: return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <HandCoins className="text-blue-600 dark:text-blue-400" />
            Loan Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Review, approve, and manage customer loan applications.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                <th className="p-4">Applicant</th>
                <th className="p-4">Loan Details</th>
                <th className="p-4">Financials</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(!loans || loans.length === 0) ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">No loan applications found.</td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-zinc-900 dark:text-white">{loan.users?.full_name}</div>
                      <div className="text-xs text-zinc-500 font-mono mt-0.5">{loan.users?.customer_id}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{loan.users?.mobile}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-zinc-900 dark:text-white">{loan.loan_type}</div>
                      <div className="text-xs text-zinc-500 mt-1">{loan.tenure_months} Months</div>
                      <div className="text-xs text-zinc-500">{loan.interest_rate}% p.a.</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-zinc-900 dark:text-white">₹{loan.amount.toLocaleString()}</div>
                      <div className="text-xs text-zinc-500 mt-1">EMI: ₹{Math.round(loan.emi_amount).toLocaleString()}</div>
                      <div className="text-xs text-zinc-500">Total: ₹{Math.round(loan.total_payable).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(loan.status)}`}>
                        {getStatusIcon(loan.status)}
                        {loan.status}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-2">
                        {new Date(loan.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-right align-middle">
                      {loan.status === 'PENDING' && (
                        <LoanActions loanId={loan.id} />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
