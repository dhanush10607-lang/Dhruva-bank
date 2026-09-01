import { getFixedDeposits } from "@/app/actions/user";
import { PiggyBank, Wallet, TrendingUp, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import FDForm from "./FDForm";
import BreakFDButton from "./BreakFDButton";

export const dynamic = "force-dynamic";

export default async function FDPage() {
  const fds = await getFixedDeposits();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle2 className="text-green-500" />;
      case 'BROKEN':
        return <XCircle className="text-red-500" />;
      case 'MATURED':
        return <CheckCircle2 className="text-blue-500" />;
      default:
        return <AlertCircle className="text-zinc-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50';
      case 'BROKEN':
        return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50';
      case 'MATURED':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      default:
        return 'bg-zinc-50 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400 border-zinc-200 dark:border-zinc-900/50';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
          <PiggyBank className="text-blue-600 dark:text-blue-400" />
          Fixed Deposits
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Grow your wealth with secure, high-yield term deposits.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FD List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Your Deposits</h2>
          
          {fds.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                <Wallet size={32} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">No Active Deposits</h3>
              <p className="text-zinc-500 dark:text-zinc-400">Open a Fixed Deposit today to start earning higher interest.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fds.map((fd: any) => (
                <div key={fd.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                      {getStatusIcon(fd.status)}
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">FD: {fd.tenure_months} Months</h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusClass(fd.status)}`}>
                        {fd.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Wallet size={12}/> Principal</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">₹{fd.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><TrendingUp size={12}/> Interest</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">{fd.interest_rate}% p.a.</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><AlertCircle size={12}/> Maturity Date</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">{new Date(fd.maturity_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><PiggyBank size={12}/> Maturity Amt.</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">₹{fd.maturity_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  {fd.status === 'ACTIVE' && (
                    <BreakFDButton fdId={fd.id} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Apply Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm sticky top-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Open New FD</h2>
            <FDForm />
          </div>
        </div>
      </div>
    </div>
  );
}
