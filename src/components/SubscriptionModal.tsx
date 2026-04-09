import { useState, useEffect } from "react";
import { X, CheckCircle2, Loader2 } from "lucide-react";

declare global {
  interface Window {
    // The interface injected by the Android Web2App wrapper
    AndroidBilling?: {
      purchase: (productId: string) => void;
    };
    // Callbacks that the Android app will call
    onPurchaseComplete?: (purchaseToken: string) => void;
    onPurchaseError?: (errorMessage: string) => void;
  }
}

export function SubscriptionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Expose functions to the global window object so the Android app can call them back
    window.onPurchaseComplete = async (purchaseToken: string) => {
      try {
        // Send the real token to our backend to verify with Google Play Developer API
        const response = await fetch("/api/verify-purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            purchaseToken,
            productId: "dorkops_pro_monthly"
          })
        });

        if (!response.ok) throw new Error("Backend verification failed");
        
        setStatus("success");
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setErrorMessage("Failed to verify purchase with server.");
      }
    };

    window.onPurchaseError = (errorMsg: string) => {
      console.error("Android Billing Error:", errorMsg);
      setStatus("error");
      setErrorMessage(errorMsg || "Payment was canceled or failed.");
    };

    return () => {
      // Cleanup global listeners when modal closes
      delete window.onPurchaseComplete;
      delete window.onPurchaseError;
    };
  }, []);

  if (!isOpen) return null;

  const handleSubscribe = () => {
    setStatus("loading");
    setErrorMessage("");
    
    // Check if we are running inside the Android Web2App wrapper
    if (typeof window !== "undefined" && window.AndroidBilling) {
      // Trigger the real Google Play Billing flow natively
      window.AndroidBilling.purchase("dorkops_pro_monthly");
    } else {
      // We are in a standard web browser, not the Android app
      setStatus("error");
      setErrorMessage("Google Play Billing is only available inside the DorkOps Android app.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-black/90 border border-neon/50 rounded-xl shadow-[0_0_30px_rgba(57,255,20,0.2)] w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-neon/30">
          <h2 className="text-2xl font-display font-bold text-neon uppercase tracking-widest glow-text">Upgrade Access</h2>
          <button onClick={onClose} className="text-neon/50 hover:text-neon transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 text-neon/80 space-y-6 font-sans">
          {status === "success" ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 bg-neon/20 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-neon" />
              </div>
              <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">Clearance Granted</h3>
              <p>Thank you for upgrading. You now have unlimited access to DorkOps Pro.</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="text-4xl font-display font-bold text-white glow-text">$4.99<span className="text-lg text-neon/50 font-sans font-normal">/mo</span></div>
                <p className="text-neon/70">Unlock the full power of OSINT research.</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-neon flex-shrink-0" />
                  <span>Unlimited Dork translations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-neon flex-shrink-0" />
                  <span>Advanced API access</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-neon flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>

              {status === "error" && (
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm text-center">
                  [ERROR]: {errorMessage}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-6 border-t border-neon/30 bg-black">
          {status === "success" ? (
            <button 
              onClick={onClose}
              className="w-full py-3 bg-neon/10 hover:bg-neon/20 text-neon font-bold rounded-lg transition-colors border border-neon/50 uppercase tracking-widest"
            >
              Close Terminal
            </button>
          ) : (
            <button 
              onClick={handleSubscribe}
              disabled={status === "loading"}
              className="w-full py-3 bg-neon hover:bg-white disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 disabled:shadow-none text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest border border-neon shadow-[0_0_15px_rgba(57,255,20,0.3)]"
            >
              {status === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
              {status === "loading" ? "Processing..." : "Authorize Payment"}
            </button>
          )}
          <p className="text-xs text-neon/40 text-center mt-4 uppercase tracking-wider">
            Powered by Google Play Billing API
          </p>
        </div>
      </div>
    </div>
  );
}
