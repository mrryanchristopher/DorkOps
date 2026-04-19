import React, { useState, FormEvent, useEffect } from "react";
import { Terminal, Sparkles, BookOpen, Crown, Loader2, ShieldAlert, LogIn, LogOut, Bookmark } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { TutorialModal } from "./components/TutorialModal";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { SavedDorksModal } from "./components/SavedDorksModal";
import { LiveSearchModal } from "./components/LiveSearchModal";
import { DorkResult } from "./components/DorkResult";
import { auth, db, signInWithGoogle, logOut } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";

declare global {
  interface Window {
    AndroidRevenueCat?: {
      checkEntitlement: () => void;
      presentPaywall: () => void;
    };
    onEntitlementResult?: (isPro: boolean) => void;
  }
}

// Initialize Gemini API in the frontend
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const DAILY_LIMIT = 5;

export default function App() {
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{ dorks: string[]; instructions: string; tips: string[]; intent: string } | null>(null);
  const [error, setError] = useState("");
  
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  
  const [liveSearchDork, setLiveSearchDork] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserProfile(null);
        setIsAuthReady(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    
    // First, ensure the document exists and handle daily reset
    const initProfile = async () => {
      const userSnap = await getDoc(userRef);
      const today = new Date().toISOString().split('T')[0];

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.lastSearchDate !== today) {
          await updateDoc(userRef, {
            dailySearches: 0,
            lastSearchDate: today
          });
        }
      } else {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || "",
          isPro: false,
          dailySearches: 0,
          lastSearchDate: today
        });
      }
    };

    initProfile().then(() => {
      // Then listen for real-time updates
      const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
          
          // Check RevenueCat entitlement if we are in the Android wrapper
          // We only check if Firestore says they are NOT Pro, to see if they bought it recently
          if (!data.isPro && typeof window !== "undefined" && window.AndroidRevenueCat) {
             window.AndroidRevenueCat.checkEntitlement();
          }
        }
        setIsAuthReady(true);
      }, (error) => {
        console.error("Firestore Error: ", error);
        setIsAuthReady(true);
      });

      return () => unsubscribeSnapshot();
    });

  }, [user]);

  // Global listener for the entitlement check result from Android
  useEffect(() => {
    window.onEntitlementResult = async (isPro: boolean) => {
      if (isPro && user && userProfile && !userProfile.isPro) {
        // RevenueCat says they are Pro, but Firestore says they aren't. Sync it!
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { isPro: true });
      }
    };
    return () => {
      delete window.onEntitlementResult;
    };
  }, [user, userProfile]);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!user) {
      setError("Authentication required. Please log in to generate Dorks.");
      return;
    }

    if (userProfile && !userProfile.isPro && userProfile.dailySearches >= DAILY_LIMIT) {
      setIsSubOpen(true);
      setError(`Daily limit reached (${DAILY_LIMIT}/${DAILY_LIMIT}). Upgrade to Pro for unlimited access.`);
      return;
    }

    setIsGenerating(true);
    setError("");
    setResults(null);

    try {
      const response = await ai.models.generateContent({
        model: userProfile?.isPro ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview",
        contents: `Translate the following plain English search intent into 3 to 5 highly precise OSINT Dorks compatible with major search engines (Google, DuckDuckGo, Brave, Bing). 
        Include advanced operators (site:, filetype:, inurl:, intitle:, etc.) and boolean logic where needed.
        
        Search Intent: "${query}"`,
        config: {
          systemInstruction: "You are an expert OSINT researcher. Your job is to translate plain English into precise search engine dorks. Return the result as JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dorks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 5 precise OSINT Dorks.",
              },
              instructions: {
                type: Type.STRING,
                description: "Brief instructions on how to use these dorks.",
              },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 to 3 tips for refining the search further.",
              },
            },
            required: ["dorks", "instructions", "tips"],
          },
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No response from Gemini");
      }

      const jsonResult = JSON.parse(resultText);
      setResults({ ...jsonResult, intent: query });

      // Increment usage
      if (userProfile && !userProfile.isPro) {
        const userRef = doc(db, "users", user.uid);
        const newCount = userProfile.dailySearches + 1;
        await updateDoc(userRef, { dailySearches: newCount });
      }

    } catch (err: any) {
      console.error("Error generating dorks:", err);
      let errorMessage = "Failed to generate dorks. Please try again.";
      if (err.message && err.message.includes("API key not valid")) {
        errorMessage = "Invalid Gemini API Key. Please configure your GEMINI_API_KEY in the AI Studio Settings panel.";
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 font-sans flex flex-col selection:bg-neon selection:text-black">
      {/* Header */}
      <header className="border-b border-neon/30 bg-black/80 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-neon/50 bg-neon/10 flex items-center justify-center shadow-[0_0_10px_rgba(57,255,20,0.2)] overflow-hidden">
              <img 
                src="https://cdn.buymeacoffee.com/uploads/gallery/9959663/2026-04-13/DorkOps.png" 
                alt="DorkOps Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-widest text-neon glow-text uppercase hidden sm:block">DorkOps</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <button 
                  onClick={() => setIsSavedOpen(true)}
                  className="flex items-center gap-2 text-sm font-bold text-neon/70 hover:text-neon transition-colors px-3 py-2 rounded-md hover:bg-neon/10 border border-transparent hover:border-neon/30 uppercase tracking-wider"
                  title="Saved Intel"
                >
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline">Saved</span>
                </button>
                <button 
                  onClick={logOut}
                  className="flex items-center gap-2 text-sm font-bold text-neon/70 hover:text-neon transition-colors px-3 py-2 rounded-md hover:bg-neon/10 border border-transparent hover:border-neon/30 uppercase tracking-wider"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 text-sm font-bold text-neon/70 hover:text-neon transition-colors px-3 py-2 rounded-md hover:bg-neon/10 border border-transparent hover:border-neon/30 uppercase tracking-wider"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
            <button 
              onClick={() => setIsTutorialOpen(true)}
              className="flex items-center gap-2 text-sm font-bold text-neon/70 hover:text-neon transition-colors px-3 py-2 rounded-md hover:bg-neon/10 border border-transparent hover:border-neon/30 uppercase tracking-wider"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Intel</span>
            </button>
            <button 
              onClick={() => setIsSubOpen(true)}
              className="flex items-center gap-2 text-sm font-bold text-black transition-colors px-4 py-2 rounded-md bg-neon hover:bg-white border border-neon uppercase tracking-wider shadow-[0_0_10px_rgba(57,255,20,0.4)]"
            >
              <Crown className="w-4 h-4" />
              <span>{userProfile?.isPro ? "Pro Active" : "Pro"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12 flex flex-col">
        <div className="text-center mb-10 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-display font-black text-white tracking-widest uppercase">
            Execute <span className="text-neon glow-text">OSINT</span>
          </h2>
          <p className="text-lg text-neon/70 max-w-2xl mx-auto font-sans">
            Translate plain English into Forensic-Grade OSINT Dorks (Google, DuckDuckGo, Brave).
          </p>
          {user && !userProfile?.isPro && (
            <div className="text-sm text-neon/50 font-sans">
              Daily Intel Limit: {userProfile?.dailySearches || 0} / {DAILY_LIMIT}
            </div>
          )}
        </div>

        <form onSubmit={handleGenerate} className="relative mb-12">
          <div className="absolute top-4 left-4 text-neon/50">
            <Terminal className="w-6 h-6" />
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="> Enter target parameters (e.g., find hidden PDF documents about WWII from gov domains)..."
            className="w-full terminal-input rounded-xl py-4 pl-14 pr-4 text-neon placeholder-neon/30 resize-none min-h-[140px] transition-all"
            disabled={isGenerating || !user}
          />
          <div className="absolute bottom-4 right-4">
            <button
              type="submit"
              disabled={!query.trim() || isGenerating || !user}
              className="flex items-center gap-2 bg-neon hover:bg-white disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 disabled:shadow-none text-black px-6 py-2.5 rounded-lg font-bold transition-all uppercase tracking-widest border border-neon shadow-[0_0_15px_rgba(57,255,20,0.3)]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
          </div>
        </form>

        {!user && (
          <div className="mb-8 p-4 bg-black/60 border border-neon/30 rounded-xl text-neon/80 text-center font-sans">
            Authentication required. <button onClick={signInWithGoogle} className="text-neon hover:underline font-bold">Log in with Google</button> to access the terminal.
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 text-center font-sans">
            [ERROR]: {error}
          </div>
        )}

        {results && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="space-y-4">
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                <span className="w-8 h-8 rounded border border-neon/50 bg-neon/10 text-neon flex items-center justify-center text-sm shadow-[0_0_10px_rgba(57,255,20,0.2)]">01</span>
                Generated Dorks
              </h3>
              <div className="space-y-3 pl-11">
                {results.dorks.map((dork, i) => (
                  <DorkResult 
                    key={i} 
                    dork={dork} 
                    intent={results.intent} 
                    user={user} 
                    onLiveSearch={(d) => setLiveSearchDork(d)}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                <span className="w-8 h-8 rounded border border-blue-500/50 bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(59,130,246,0.2)]">02</span>
                Execution Brief
              </h3>
              <div className="pl-11">
                <div className="bg-black/60 border border-blue-500/30 rounded-xl p-5 text-blue-100/80 leading-relaxed font-sans shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                  {results.instructions}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                <span className="w-8 h-8 rounded border border-amber-500/50 bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm shadow-[0_0_10px_rgba(245,158,11,0.2)]">03</span>
                Tactical Tips
              </h3>
              <div className="pl-11">
                <ul className="bg-black/60 border border-amber-500/30 rounded-xl p-5 space-y-3 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
                  {results.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-amber-100/80 font-sans">
                      <div className="w-2 h-2 rounded-sm bg-amber-500 mt-2 flex-shrink-0 shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neon/20 bg-black/80 py-8 mt-auto backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
          <p className="text-neon/50 text-sm font-sans">
            © {new Date().getFullYear()} DorkOps. All rights reserved.
          </p>
          <p className="text-neon/50 text-sm font-sans">
            Created by <a href="https://mediamultitool.com" target="_blank" rel="noopener noreferrer" className="text-neon hover:text-white hover:underline transition-colors glow-text">Media Multi-Tool</a>
          </p>
        </div>
      </footer>

      {/* Modals */}
      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <SubscriptionModal isOpen={isSubOpen} onClose={() => setIsSubOpen(false)} user={user} />
      <SavedDorksModal isOpen={isSavedOpen} onClose={() => setIsSavedOpen(false)} user={user} />
      <LiveSearchModal 
        isOpen={!!liveSearchDork} 
        onClose={() => setLiveSearchDork(null)} 
        dork={liveSearchDork || ""} 
        intent={results?.intent || ""} 
      />
    </div>
  );
}
