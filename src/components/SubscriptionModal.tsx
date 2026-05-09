import React from "react";
import { X, CheckCircle2, Zap } from "lucide-react";

export function SubscriptionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-black/95 border border-purple/50 rounded-xl shadow-[0_0_40px_rgba(139,92,246,0.2)] w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-purple/30 bg-purple/5">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-pop glow-pop animate-pulse" />
            <h2 className="text-2xl font-display font-bold text-pop uppercase tracking-widest glow-pop">DorkOps Pro</h2>
          </div>
          <button onClick={onClose} className="text-pop/50 hover:text-pop transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 text-slate-300 space-y-6 font-sans">
          <div className="text-center space-y-2">
            <p className="text-white text-lg font-bold">Advance Your Intel Operations.</p>
            <p className="text-slate-400 text-sm">Unlock forensic-grade search capabilities and the tactical payload library.</p>
          </div>

          <ul className="space-y-4 bg-black/60 p-4 border border-purple/20 rounded-lg shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-pop flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Chain Mode Logic</span>
                <span className="text-xs text-slate-400">Multi-step automated generation of sequential searching parameters.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-pop flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Gemini 3.1 Pro Node</span>
                <span className="text-xs text-slate-400">Upgrade to the flagship intelligence engine for complex boolean dorks.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-pop flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Tactical Library</span>
                <span className="text-xs text-slate-400">Access pre-built OSINT dorks for infrastructure, cloud, and DB assets.</span>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="p-6 border-t border-purple/30 bg-black/40 flex flex-col items-center gap-4">
          <a 
            href="https://play.google.com/store/search?q=pub:Media+Multi-Tool+LLC&c=apps"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-pop hover:bg-white text-black font-bold rounded-lg transition-all flex items-center justify-center gap-3 uppercase tracking-widest border border-pop shadow-[0_0_20px_rgba(255,0,255,0.4)]"
          >
            <Zap className="w-5 h-5" />
            Get Pro on Play Store
          </a>
          <p className="text-[10px] text-center text-slate-500 uppercase tracking-tighter">
            Full terminal access available via the mobile app
          </p>
        </div>
      </div>
    </div>
  );
}
