import { getUserProfile, getUserAccount, getUserTransactions } from "@/app/actions/user";
import { Landmark, Printer, FileText, Download } from "lucide-react";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function StatementPage() {
  const profile = await getUserProfile();
  const account = await getUserAccount();
  const transactions = await getUserTransactions();

  if (!profile || !account) {
    return <div>Error loading account details.</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Non-Printable Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 print:hidden gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <FileText className="text-blue-600 dark:text-blue-400" />
            Account Statement
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Download or print your official bank statement.</p>
        </div>
        <PrintButton />
      </div>

      {/* Printable Statement Container */}
      <div id="printable-statement" className="bg-white text-black p-8 md:p-12 shadow-sm border border-zinc-200 print:shadow-none print:border-none rounded-xl">
        
        {/* Bank Header */}
        <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-6 mb-6">
          <div className="flex items-center gap-3 text-blue-800 font-black text-3xl">
            <Landmark size={36} />
            <span>DHRUVA BANK</span>
          </div>
          <div className="text-right text-sm text-zinc-600">
            <p>123 Financial District</p>
            <p>Mumbai, MH 400001</p>
            <p>support@dhruvabank.com</p>
            <p>1800-200-BANK</p>
          </div>
        </div>

        {/* Statement Info */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase tracking-widest border-b inline-block border-zinc-300 pb-1">Official Account Statement</h2>
          <p className="text-sm text-zinc-500 mt-2">Generated on: {new Date().toLocaleString()}</p>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-lg">
            <h3 className="font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-2">Customer Information</h3>
            <p><span className="font-semibold w-24 inline-block">Name:</span> {profile.full_name}</p>
            <p><span className="font-semibold w-24 inline-block">Cust ID:</span> {profile.customer_id}</p>
            <p><span className="font-semibold w-24 inline-block">Mobile:</span> {profile.mobile}</p>
            <p><span className="font-semibold w-24 inline-block">Email:</span> {profile.email}</p>
            <p className="mt-2"><span className="font-semibold">Address:</span><br/>{profile.address || 'N/A'}<br/>{profile.city}, {profile.state} - {profile.pin_code}</p>
          </div>
          
          <div className="bg-zinc-50 p-4 border border-zinc-200 rounded-lg">
            <h3 className="font-bold text-zinc-900 mb-2 border-b border-zinc-200 pb-2">Account Summary</h3>
            <p><span className="font-semibold w-32 inline-block">Account No:</span> {account.account_number}</p>
            <p><span className="font-semibold w-32 inline-block">Account Type:</span> {account.account_type}</p>
            <p><span className="font-semibold w-32 inline-block">Account Status:</span> {account.status}</p>
            <div className="mt-4 pt-4 border-t border-zinc-200">
              <p className="text-lg"><span className="font-semibold w-32 inline-block text-zinc-600">Available Balance:</span> <span className="font-bold text-green-700">₹{account.balance.toLocaleString()}</span></p>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <h3 className="font-bold text-zinc-900 mb-4 text-lg">Transaction Ledger</h3>
        <table className="w-full text-left text-sm border-collapse border border-zinc-300">
          <thead>
            <tr className="bg-zinc-100 border-b border-zinc-300">
              <th className="p-3 border-r border-zinc-300 font-bold">Date & Time</th>
              <th className="p-3 border-r border-zinc-300 font-bold">Ref No.</th>
              <th className="p-3 border-r border-zinc-300 font-bold w-1/3">Description</th>
              <th className="p-3 border-r border-zinc-300 font-bold text-right text-red-700">Debit (₹)</th>
              <th className="p-3 border-r border-zinc-300 font-bold text-right text-green-700">Credit (₹)</th>
              <th className="p-3 font-bold text-right bg-zinc-200">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">No transactions found.</td>
              </tr>
            ) : (
              transactions.map((txn: any) => (
                <tr key={txn.id} className="border-b border-zinc-200 even:bg-zinc-50">
                  <td className="p-2 border-r border-zinc-200 align-top whitespace-nowrap">
                    {new Date(txn.created_at).toLocaleDateString()}<br/>
                    <span className="text-xs text-zinc-500">{new Date(txn.created_at).toLocaleTimeString()}</span>
                  </td>
                  <td className="p-2 border-r border-zinc-200 align-top text-xs font-mono break-all">{txn.reference_number}</td>
                  <td className="p-2 border-r border-zinc-200 align-top">
                    <p>{txn.description}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {txn.type === 'DEBIT' ? `To: ${txn.receiver_details}` : `From: ${txn.sender_details}`}
                    </p>
                  </td>
                  <td className="p-2 border-r border-zinc-200 align-top text-right text-red-600">
                    {txn.type === 'DEBIT' ? txn.amount.toLocaleString() : '-'}
                  </td>
                  <td className="p-2 border-r border-zinc-200 align-top text-right text-green-600">
                    {txn.type === 'CREDIT' ? txn.amount.toLocaleString() : '-'}
                  </td>
                  <td className="p-2 align-top text-right font-semibold bg-zinc-50">
                    {txn.balance_after.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-zinc-300 text-xs text-zinc-500 text-center flex flex-col gap-1">
          <p>*** END OF STATEMENT ***</p>
          <p>This is a computer-generated statement and does not require a physical signature.</p>
        </div>

      </div>
    </div>
  );
}
