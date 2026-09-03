import { CreditCard } from "lucide-react";
import { getAllCards } from "@/app/actions/admin";
import CardStatusDropdown from "./CardStatusDropdown";

export const dynamic = "force-dynamic";

export default async function AdminCardsPage() {
  const cards = await getAllCards();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Cards Management</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Monitor all issued debit and credit cards.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {cards.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4">
              <CreditCard size={32} />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No Cards Issued</h3>
            <p className="text-zinc-500 mt-2 max-w-sm mx-auto">There are currently no active cards in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Cardholder</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Card Number</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Account Linked</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Issued Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {cards.map((card: any) => (
                  <tr key={card.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-zinc-900 dark:text-white">{card.cardholder_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-mono text-zinc-900 dark:text-zinc-300">{card.card_number_masked}</p>
                      <p className="text-xs text-zinc-500">Exp: {card.expiry_date}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {card.accounts?.account_number || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4">
                      <CardStatusDropdown card={card} />
                    </td>
                    <td className="p-4 text-sm text-zinc-500">
                      {new Date(card.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
