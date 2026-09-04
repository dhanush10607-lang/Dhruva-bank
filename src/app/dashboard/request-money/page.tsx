"use client";

import { useState } from "react";
import { QrCode, Copy, Check, Share2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserAccount } from "@/app/actions/user";
import { useEffect } from "react";

export default function RequestMoneyPage() {
  const [amount, setAmount] = useState<string>("500");
  const [description, setDescription] = useState<string>("Dinner split");
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [accountNumber, setAccountNumber] = useState<string>("");

  useEffect(() => {
    async function fetchAccount() {
      const acc = await getUserAccount();
      if (acc) setAccountNumber(acc.account_number);
    }
    fetchAccount();
  }, []);

  // Using the actual window origin or fallback to production URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dhruvabank.vercel.app';
  const paymentLink = `${baseUrl}/dashboard/transfer?amount=${amount}&desc=${encodeURIComponent(description)}&to=${accountNumber}`;
  // Using a free public API for QR code generation to avoid npm dependencies
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentLink)}&color=09090b`;

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Pay me via Dhruva Bank',
        text: `Please pay ₹${amount} for ${description}`,
        url: paymentLink,
      }).catch(console.error);
    } else {
      handleCopy();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Request Money</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Generate a QR code or payment link to split bills instantly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Generator Form */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Payment Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Amount to Request (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setGenerated(false);
                  }}
                  className="w-full pl-8 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all dark:text-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">What is it for?</label>
              <input
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setGenerated(false);
                }}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all dark:text-white"
                placeholder="e.g. Dinner last night"
              />
            </div>

            <Button 
              onClick={() => setGenerated(true)}
              disabled={!amount || Number(amount) <= 0 || !accountNumber}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-semibold shadow-md"
            >
              <QrCode className="mr-2" /> Generate Request Link
            </Button>
          </div>
        </div>

        {/* QR Display */}
        <div className={`transition-all duration-500 ${generated ? 'opacity-100 scale-100' : 'opacity-50 scale-95 pointer-events-none'}`}>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col items-center justify-center h-full min-h-[400px]">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="relative z-10 w-full flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-2xl shadow-inner mb-6">
                {/* We use standard img tag to fetch from API directly */}
                <img src={qrCodeUrl} alt="Payment QR Code" width={200} height={200} className="rounded-lg" />
              </div>
              
              <h3 className="text-2xl font-bold mb-1">₹{amount || '0'}</h3>
              <p className="text-blue-100 mb-8">{description || 'Requesting funds'}</p>

              <div className="flex w-full gap-3">
                <Button 
                  onClick={handleCopy} 
                  variant="outline" 
                  className="flex-1 bg-white/10 border-white/20 hover:bg-white/20 text-white backdrop-blur-md"
                >
                  {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </Button>
                <Button 
                  onClick={handleShare} 
                  variant="outline" 
                  className="flex-1 bg-white border-transparent text-blue-700 hover:bg-blue-50 shadow-md"
                >
                  <Share2 size={18} className="mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
