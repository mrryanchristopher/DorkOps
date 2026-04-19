import { X, CheckCircle2, ShieldAlert } from "lucide-react";
import { User } from "firebase/auth";

export function SubscriptionModal({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: User | null }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-black/90 border border-neon/50 rounded-xl shadow-[0_0_30px_rgba(57,255,20,0.2)] w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-neon/30">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-neon" />
            <h2 className="text-2xl font-display font-bold text-neon uppercase tracking-widest glow-text">DorkOps Pro</h2>
          </div>
          <button onClick={onClose} className="text-neon/50 hover:text-neon transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 text-neon/80 space-y-6 font-sans">
          <div className="text-center space-y-2">
            <p className="text-neon text-lg font-bold">Unleash the full potential of your OSINT research.</p>
            <p className="text-neon/70 text-sm">Download the official DorkOps mobile application to upgrade your terminal access.</p>
          </div>

          <ul className="space-y-4 bg-black/60 p-4 border border-neon/20 rounded-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-neon flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Unlimited Intel Generation</span>
                <span className="text-xs text-neon/60">Bypass the daily web limits and generate endless forensic-grade dorks.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-neon flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Gemini 3.1 Pro Reasoning</span>
                <span className="text-xs text-neon/60">Unlock Google's flagship reasoning model for hyper-advanced boolean logic mapping.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-neon flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Offline Intel Vault</span>
                <span className="text-xs text-neon/60">Native storage and organization of your most critical payload strings.</span>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="p-6 border-t border-neon/30 bg-black">
          <a 
            href="https://play.google.com/store/apps/developer?id=Media+Multi-Tool+Ai"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-neon hover:bg-white text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest border border-neon shadow-[0_0_15px_rgba(57,255,20,0.3)]"
          >
            Get Pro on Google Play
          </a>
        </div>
      </div>
    </div>
  );
}
