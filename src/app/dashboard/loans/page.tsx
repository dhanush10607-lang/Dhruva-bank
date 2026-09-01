import { getLoans } from "@/app/actions/user";
import { HandCoins, FileText, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import LoanApplicationForm from "./LoanApplicationForm";
import LoanPaymentModal from "./LoanPaymentModal";

export const dynamic = "force-dynamic";

export default async function UserLoansPage() {
  const loans = await getLoans();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return <CheckCircle2 className="text-green-500" />;
      case 'REJECTED':
        return <XCircle className="text-red-500" />;
      case 'PENDING':
        return <Clock className="text-yellow-500" />;
      default:
        return <FileText className="text-zinc-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50';
      default:
        return 'bg-zinc-50 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400 border-zinc-200 dark:border-zinc-900/50';
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Simulated Loans</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Apply for demo loans and view your application status.</p>
        
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm border border-blue-200 dark:border-blue-900/50">
          <AlertCircle size={16} />
          <strong>Note:</strong> This is a simulation module. No real money or credit checks are involved.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Applications List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Your Loan Applications</h2>
          
          {loans.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                <HandCoins size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No Applications Found</h3>
              <p className="text-zinc-500 dark:text-zinc-400">You haven't applied for any loans yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <div key={loan.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(loan.status)}
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{loan.loan_type} LOAN</h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusClass(loan.status)}`}>
                        {loan.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Principal</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">₹{loan.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Interest</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">{loan.interest_rate}% p.a.</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Tenure</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">{loan.tenure_months} months</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Total Payable</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">₹{loan.total_payable?.toLocaleString() || 'TBD'}</p>
                      </div>
                    </div>
                  </div>
                  {loan.status === 'ACTIVE' && (
                    <LoanPaymentModal 
                      loanId={loan.id} 
                      totalPayable={loan.total_payable} 
                      emiAmount={loan.emi_amount} 
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Apply Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">New Application</h2>
            <LoanApplicationForm />
          </div>
        </div>
      </div>
    </div>
  );
}
