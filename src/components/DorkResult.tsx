import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export const DorkResult: React.FC<{ dork: string }> = ({ dork }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dork);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="group relative bg-black/60 border border-neon/30 hover:border-neon/60 rounded-lg p-4 transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
      <code className="block text-neon/90 font-sans text-sm break-all pr-12">
        {dork}
      </code>
      <button
        onClick={handleCopy}
        className="absolute top-1/2 -translate-y-1/2 right-3 p-2 text-neon/50 hover:text-black hover:bg-neon rounded-md transition-colors border border-transparent hover:border-neon"
        title="Copy to clipboard"
      >
        {copied ? <Check className="w-5 h-5 text-black" /> : <Copy className="w-5 h-5" />}
      </button>
    </div>
  );
}
