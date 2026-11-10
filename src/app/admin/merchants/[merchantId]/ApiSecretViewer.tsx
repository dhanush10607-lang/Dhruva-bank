"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";

interface ApiSecretViewerProps {
  secret: string;
  preview: string;
}

export default function ApiSecretViewer({ secret, preview }: ApiSecretViewerProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-200 text-xs select-all">
        {revealed ? secret : preview || "••••••••••••"}
      </span>
      <button
        type="button"
        onClick={() => setRevealed(!revealed)}
        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
        title={revealed ? "Hide Secret" : "Reveal Secret"}
      >
        {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
        title="Copy Secret"
      >
        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

