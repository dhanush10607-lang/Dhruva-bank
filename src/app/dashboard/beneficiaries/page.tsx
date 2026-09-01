import { getBeneficiaries } from "@/app/actions/user";
import { Plus, Users, Banknote, CreditCard, Star } from "lucide-react";
import BeneficiaryForm from "./BeneficiaryForm";
import DeleteBeneficiaryButton from "./DeleteBeneficiaryButton";

export const dynamic = "force-dynamic";

export default async function BeneficiariesPage() {
  const beneficiaries = await getBeneficiaries();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Beneficiaries</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your saved payees for quick and easy transfers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Beneficiary List */}
        <div className="lg:col-span-2 space-y-6">
          {beneficiaries.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl p-12 text-center">
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4">
                <Users size={40} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No Beneficiaries Found</h3>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Add a new beneficiary to start transferring money quickly without entering account details every time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {beneficiaries.map((b) => (
                <div key={b.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow group relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold text-xl">
                      {b.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex gap-2">
                      {b.nickname && (
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1">
                          <Star size={12} /> {b.nickname}
                        </span>
                      )}
                      <DeleteBeneficiaryButton id={b.id} name={b.name} />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{b.name}</h3>
                  <div className="space-y-1 mt-3">
                    <p className="text-sm text-zinc-500 flex items-center gap-2">
                      <Banknote size={14} /> {b.bank_name}
                    </p>
                    <p className="text-sm text-zinc-500 flex items-center gap-2">
                      <CreditCard size={14} /> {b.account_number}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                    <a href={`/dashboard/transfer?acc=${b.account_number}`} className="flex-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-center py-2 rounded-lg text-sm font-medium transition-colors">
                      Send Money
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Beneficiary Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Plus className="text-blue-600 dark:text-blue-400" />
              Add New Payee
            </h2>
            <BeneficiaryForm />
          </div>
        </div>

      </div>
    </div>
  );
}
