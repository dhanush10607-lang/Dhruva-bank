"use client";

import { useState, useActionState, useEffect } from "react";
import { CreditCard, Eye, EyeOff, CheckCircle2, Lock, Unlock, Settings2, Plus } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getUserCard, requestCard, toggleCardFreeze, toggleCardInternational } from "@/app/actions/user";

export default function CardsPage() {
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTogglingFreeze, setIsTogglingFreeze] = useState(false);
  const [isTogglingIntl, setIsTogglingIntl] = useState(false);
  const [state, formAction, isPending] = useActionState(requestCard, null);

  const gradients = [
    "from-slate-900 via-blue-950 to-slate-900",    // Midnight Blue
    "from-zinc-900 via-zinc-800 to-black",         // Obsidian Black
    "from-blue-900 via-blue-800 to-indigo-950",    // Royal Navy
    "from-stone-800 via-stone-900 to-neutral-950", // Charcoal
    "from-emerald-950 via-teal-950 to-slate-900",  // Deep Forest
    "from-indigo-950 via-slate-900 to-blue-950"    // Deep Indigo
  ];

  const getCardGradient = (id: string) => {
    // Simple hash to pick a gradient deterministically based on card ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  useEffect(() => {
    async function fetchCard() {
      const data = await getUserCard();
      setCard(data);
      setLoading(false);
    }
    fetchCard();
  }, [state]); // Refetch when form state changes (i.e., successfully requested)

  if (loading) {
    return <div className="p-8 max-w-5xl mx-auto text-center text-zinc-500">Loading card details...</div>;
  }

  const handleFreezeToggle = async () => {
    if (!card) return;
    setIsTogglingFreeze(true);
    const res = await toggleCardFreeze(card.id, card.status);
    if (res.success) {
      setCard({ ...card, status: res.newStatus });
    } else {
      alert(res.error);
    }
    setIsTogglingFreeze(false);
  };

  const handleIntlToggle = async () => {
    if (!card) return;
    setIsTogglingIntl(true);
    const res = await toggleCardInternational(card.id, card.international_enabled);
    if (res.success) {
      setCard({ ...card, international_enabled: res.newEnabled });
    } else {
      alert(res.error);
    }
    setIsTogglingIntl(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Card Management</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your virtual and physical debit cards.</p>
      </div>

      {!card ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-16 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-6">
            <CreditCard size={40} />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">No Active Cards</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
            You currently do not have any active debit cards linked to your account. Request a virtual card instantly to start making secure online payments.
          </p>

          {state?.error && (
            <div className="p-4 mb-6 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-red-900/30 dark:text-red-400">
              {state.error}
            </div>
          )}
          
          <form action={formAction}>
            <Button disabled={isPending} type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 px-8 rounded-xl text-lg shadow-md">
              <Plus className="mr-2" /> {isPending ? "Issuing Card..." : "Request Virtual Card Now"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Virtual Card Display */}
          <div className="space-y-6">
              <div className={`relative p-8 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${
              card.status === 'FROZEN'
                ? 'bg-gradient-to-br from-zinc-500 to-zinc-700 opacity-90 grayscale' 
                : `bg-gradient-to-br ${getCardGradient(card.id)}`
            }`}>
              {/* Hologram / Design Element */}
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 text-white flex flex-col h-56 justify-between">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="Dhruva Bank Logo" width={32} height={32} className="opacity-90" />
                    <div className="font-bold text-xl tracking-wider opacity-90">DHRUVA BANK</div>
                  </div>
                  <CreditCard size={28} className="opacity-80" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-2xl tracking-widest flex-1">
                      {showCardNumber ? `4532 8891 0023 ${card.card_number_masked.slice(-4)}` : card.card_number_masked}
                    </p>
                    <button 
                      onClick={() => setShowCardNumber(!showCardNumber)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      {showCardNumber ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  
                  <div className="flex justify-between text-sm opacity-80 uppercase tracking-widest font-medium">
                    <div>
                      <p className="text-xs opacity-60">Card Holder</p>
                      <p>{card.cardholder_name}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-60">Valid Thru</p>
                      <p>{card.expiry_date}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-60">CVV</p>
                      <p>{showCardNumber ? card.cvv_hash : "•••"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-white">Card Status</p>
                <p className="text-sm text-zinc-500">{card.status === 'FROZEN' ? 'Temporarily Frozen' : 'Active and ready to use'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {card.status !== 'FROZEN' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${card.status === 'FROZEN' ? 'bg-zinc-400' : 'bg-green-500'}`}></span>
                </span>
              </div>
            </div>
          </div>

          {/* Card Controls */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Quick Controls</h3>
              
              <div className="space-y-6">
                {/* Freeze Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.status === 'FROZEN' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600'}`}>
                      {card.status === 'FROZEN' ? <Lock size={20} /> : <Unlock size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">Freeze Card</p>
                      <p className="text-xs text-zinc-500">Temporarily disable transactions</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleFreezeToggle}
                    disabled={isTogglingFreeze}
                    className={`w-12 h-6 rounded-full transition-colors relative ${card.status === 'FROZEN' ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${card.status === 'FROZEN' ? 'translate-x-6' : 'translate-x-0'}`}></span>
                  </button>
                </div>

                {/* International Usage */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.international_enabled ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600'}`}>
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">International Usage</p>
                      <p className="text-xs text-zinc-500">Enable payments outside India</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleIntlToggle}
                    disabled={isTogglingIntl}
                    className={`w-12 h-6 rounded-full transition-colors relative ${card.international_enabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${card.international_enabled ? 'translate-x-6' : 'translate-x-0'}`}></span>
                  </button>
                </div>
                
                <p className="text-xs text-zinc-500 text-center mt-2">Card controls are now active.</p>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-zinc-700 dark:text-zinc-300">
                    <Settings2 size={16} /> Advanced Card Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
