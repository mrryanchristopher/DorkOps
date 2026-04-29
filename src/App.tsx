import React, { useState, FormEvent, useEffect } from "react";
import { Terminal, Sparkles, BookOpen, Crown, Loader2, ShieldAlert, LogIn, LogOut, Bookmark, Zap, Activity } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import { TutorialModal } from "./components/TutorialModal";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { SavedDorksModal } from "./components/SavedDorksModal";
import { LiveSearchModal } from "./components/LiveSearchModal";
import { DorkResult } from "./components/DorkResult";
import { TacticalLibrary } from "./components/TacticalLibrary";
import { auth, db, signInWithGoogle, logOut } from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, FirestoreError } from "firebase/firestore";

interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: any[];
  }
}

function handleFirestoreError(error: FirestoreError, operationType: FirestoreErrorInfo['operationType'], path: string | null, user: User | null) {
  if (error.code === 'permission-denied') {
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: user?.uid || 'anonymous',
        email: user?.email || 'N/A',
        emailVerified: user?.emailVerified || false,
        isAnonymous: user?.isAnonymous || true,
        providerInfo: user?.providerData || []
      }
    };
    console.error("CRITICAL PERMISSION ERROR:", JSON.stringify(errorInfo, null, 2));
    // We throw the JSON string as requested by the instructions
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
}

// Initialize Gemini API in the frontend
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const DAILY_LIMIT = 5;

export default function App() {
  const [query, setQuery] = useState("");
  const [isChainMode, setIsChainMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<{ 
    dorks?: string[]; 
    chain?: { step: string; dorks: string[] }[];
    instructions: string; 
    tips: string[]; 
    intent: string 
  } | null>(null);
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
      try {
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
      } catch (err: any) {
        if (err.name === 'FirebaseError') {
          handleFirestoreError(err as FirestoreError, 'write', userRef.path, user);
        }
        throw err;
      }
    };

    initProfile().then(() => {
      // Then listen for real-time updates
      const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile(data);
        }
        setIsAuthReady(true);
      }, (error) => {
        try {
          handleFirestoreError(error as FirestoreError, 'get', userRef.path, user);
        } catch (e: any) {
          setError(e.message);
        }
        setIsAuthReady(true);
      });

      return () => unsubscribeSnapshot();
    });

  }, [user]);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!user) {
      setError("[TERMINAL_FAULT]: Authentication required. Please log in to generate Intelligence.");
      return;
    }

    if (userProfile && !userProfile.isPro && userProfile.dailySearches >= DAILY_LIMIT) {
      setIsSubOpen(true);
      setError(`[LIMIT_EXCEEDED]: Daily intel limit reached (${DAILY_LIMIT}/${DAILY_LIMIT}). Upgrade to Pro node for infinite parameters.`);
      return;
    }

    setIsGenerating(true);
    setError("");
    setResults(null);

    try {
      const modePrompt = isChainMode && userProfile?.isPro
        ? "Analyze the intent and provide a 3-step 'Chain' of searches. Each step should build on the last (e.g. 1. Find the server, 2. Find the dir, 3. Find the config). Provide 2 dorks per step."
        : "Translate the following plain English search intent into 3 to 5 highly precise OSINT Dorks compatible with major search engines.";

      const response = await ai.models.generateContent({
        model: userProfile?.isPro ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview",
        contents: `${modePrompt}
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
                description: "3 to 5 precise OSINT Dorks (used if NOT in chain mode).",
              },
              chain: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.STRING },
                    dorks: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                },
                description: "3-step chain of intelligence parameters (used if in chain mode).",
              },
              instructions: {
                type: Type.STRING,
                description: "Tactical brief for the intelligence payload.",
              },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 to 3 refinement tips.",
              },
            },
            required: ["instructions", "tips"],
          },
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("[TERMINAL_FAULT]: Intelligence generation sequence aborted.");
      }

      const jsonResult = JSON.parse(resultText);
      setResults({ ...jsonResult, intent: query });

      // Increment usage if not pro
      if (userProfile && !userProfile.isPro) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { dailySearches: userProfile.dailySearches + 1 });
      }

    } catch (err: any) {
      console.error("Error generating intelligence:", err);
      setError("[TERMINAL_FAULT]: Intelligence generation sequence aborted.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pop animate-spin shadow-[0_0_10px_rgba(255,0,255,0.4)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 font-sans flex flex-col selection:bg-pop selection:text-black">
      {/* Header */}
      <header className={`border-b ${userProfile?.isPro ? 'border-purple/50 bg-black/90' : 'border-neon/30 bg-black/80'} sticky top-0 z-10 backdrop-blur-md transition-all duration-700`}>
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl border ${userProfile?.isPro ? 'border-pop shadow-[0_0_15px_rgba(255,0,255,0.3)]' : 'border-neon/50 shadow-[0_0_10px_rgba(57,255,20,0.2)]'} flex items-center justify-center bg-black overflow-hidden transition-all duration-700`}>
              <img 
                src={userProfile?.isPro ? "https://pbs.twimg.com/media/HGin1T5boAAqBaD?format=png&name=small" : "https://cdn.buymeacoffee.com/uploads/gallery/9959663/2026-04-13/DorkOps.png"} 
                alt="DorkOps Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className={`text-2xl font-display font-black tracking-[0.2em] ${userProfile?.isPro ? 'text-pop glow-pop' : 'text-neon glow-text'} uppercase hidden sm:block transition-all duration-700`}>
                DorkOps {userProfile?.isPro && <span className="text-xs ml-2 align-top text-purple-400">PRO-NODE</span>}
              </h1>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                <Activity className="w-3 h-3 text-pop" />
                Terminal {userProfile?.isPro ? 'v3.1-PRO' : 'v1.0-FLASH'} Active
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <button 
                  onClick={() => setIsSavedOpen(true)}
                  className={`flex items-center gap-2 text-xs font-bold ${userProfile?.isPro ? 'text-pop/70 hover:text-pop bg-purple/10 border-purple/30' : 'text-neon/70 hover:text-neon hover:bg-neon/10 border-transparent'} transition-all px-4 py-2.5 rounded-lg border uppercase tracking-wider`}
                  title="Saved Intel"
                >
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline">Intel Vault</span>
                </button>
                <button 
                  onClick={logOut}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors px-4 py-2.5 rounded-lg border border-transparent uppercase tracking-wider"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 text-xs font-bold text-neon/70 hover:text-neon transition-colors px-4 py-2.5 rounded-lg hover:bg-neon/10 border border-transparent uppercase tracking-wider"
              >
                <LogIn className="w-4 h-4" />
                <span>Authorize</span>
              </button>
            )}
            {!userProfile?.isPro && (
              <a 
                href="https://play.google.com/store/apps/developer?id=Media+Multi-Tool+Ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-black text-black transition-all px-5 py-2.5 rounded-lg bg-neon hover:bg-white border border-neon uppercase tracking-tighter shadow-[0_0_15px_rgba(57,255,20,0.4)]"
              >
                <Crown className="w-4 h-4" />
                <span>UPGRADE</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 gap-8 flex flex-col lg:flex-row">
        {/* Left Sidebar - Tactical Library */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <TacticalLibrary 
            isPro={!!userProfile?.isPro} 
            onSelect={(intent, dork) => {
              setQuery(dork);
            }} 
          />
        </aside>

        {/* Center - Main Terminal */}
        <div className="flex-1 min-w-0">
          <div className="text-center mb-10 space-y-4">
            <h2 className="text-5xl sm:text-7xl font-display font-black text-white tracking-widest uppercase">
              Execute <span className={userProfile?.isPro ? "text-pop glow-pop" : "text-neon glow-text"}>OSINT</span>
            </h2>
            <p className={`text-lg ${userProfile?.isPro ? 'text-pop/70' : 'text-neon/70'} max-w-2xl mx-auto font-sans font-bold italic`}>
              Vibe Coding for OSINT
            </p>
            {user && !userProfile?.isPro && (
              <div className="text-xs text-neon/50 font-sans font-bold bg-white/5 py-1 px-3 rounded-full inline-block border border-neon/20">
                DAILY INTEL: {userProfile?.dailySearches || 0} / {DAILY_LIMIT}
              </div>
            )}
          </div>

          <form onSubmit={handleGenerate} className="relative mb-12">
            <div className={`absolute top-4 left-4 ${userProfile?.isPro ? 'text-pop/50' : 'text-neon/50'}`}>
              <Terminal className="w-6 h-6" />
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="> INPUT PARAMETERS: (e.g. Find exposed .env files on internal subdomains)..."
              className={`w-full terminal-input rounded-2xl py-6 pl-14 pr-4 bg-black/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] text-lg transition-all min-h-[160px] ${userProfile?.isPro ? 'text-pop border-purple/30 placeholder-pop/20 focus:border-pop focus:shadow-[0_0_25px_rgba(255,0,255,0.1)]' : 'text-neon placeholder-neon/30 focus:border-neon'}`}
              disabled={isGenerating || !user}
            />
            
            <div className="absolute bottom-6 left-14 flex items-center gap-4">
               {userProfile?.isPro && (
                 <button
                   type="button"
                   onClick={() => setIsChainMode(!isChainMode)}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[10px] font-black uppercase tracking-tighter transition-all ${isChainMode ? 'bg-pop text-black border-pop shadow-[0_0_10px_rgba(255,0,255,0.4)]' : 'bg-black text-pop/50 border-purple/30 hover:border-pop'}`}
                 >
                   <Zap className="w-3.5 h-3.5" />
                   Chain Mode: {isChainMode ? 'ENGAGED' : 'OFF'}
                 </button>
               )}
            </div>

            <div className="absolute bottom-6 right-6">
              <button
                type="submit"
                disabled={!query.trim() || isGenerating || !user}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-black transition-all uppercase tracking-widest border shadow-lg disabled:opacity-30 ${userProfile?.isPro ? 'bg-pop text-black border-pop shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:bg-white' : 'bg-neon text-black border-neon shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:bg-white'}`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Execute
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-8 p-5 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 text-center font-bold font-mono tracking-tighter animate-pulse uppercase">
              {error}
            </div>
          )}

          {results && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Conditional Rendering: Chained Mode vs Standard */}
              {results.chain ? (
                <div className="grid grid-cols-1 gap-6">
                   {results.chain.map((step, idx) => (
                     <section key={idx} className="space-y-4">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-lg bg-pop text-black flex items-center justify-center font-black shadow-[0_0_15px_rgba(255,0,255,0.4)]">
                              0{idx + 1}
                           </div>
                           <h3 className="text-xl font-display font-black text-white uppercase tracking-wider">{step.step}</h3>
                        </div>
                        <div className="space-y-3 pl-14">
                           {step.dorks.map((dork, i) => (
                              <DorkResult key={i} dork={dork} intent={results.intent} user={user} onLiveSearch={(d) => setLiveSearchDork(d)} />
                           ))}
                        </div>
                     </section>
                   ))}
                </div>
              ) : (
                <section className="space-y-4">
                  <h3 className="text-xl font-display font-bold text-white flex items-center gap-3 uppercase tracking-wider">
                    <span className={`w-8 h-8 rounded border ${userProfile?.isPro ? 'border-pop/50 bg-pop/10 text-pop shadow-[0_0_10px_rgba(255,0,255,0.2)]' : 'border-neon/50 bg-neon/10 text-neon shadow-[0_0_10px_rgba(57,255,20,0.2)]'} flex items-center justify-center text-sm transition-all duration-700`}>01</span>
                    Payload Analysis
                  </h3>
                  <div className="space-y-3 pl-11">
                    {results.dorks?.map((dork, i) => (
                      <DorkResult key={i} dork={dork} intent={results.intent} user={user} onLiveSearch={(d) => setLiveSearchDork(d)} />
                    ))}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-4">
                  <h3 className="text-sm font-display font-black text-slate-500 flex items-center gap-3 uppercase tracking-widest">
                    Execution Brief
                  </h3>
                  <div className={`p-6 bg-black/60 border ${userProfile?.isPro ? 'border-purple-500/30' : 'border-blue-500/30'} rounded-2xl text-slate-300 leading-relaxed font-sans shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]`}>
                    {results.instructions}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-display font-black text-slate-500 flex items-center gap-3 uppercase tracking-widest">
                    Tactical Refinements
                  </h3>
                  <ul className={`p-6 bg-black/60 border ${userProfile?.isPro ? 'border-purple-500/30' : 'border-amber-500/30'} rounded-2xl space-y-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]`}>
                    {results.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-300 font-sans">
                        <div className={`w-1.5 h-6 rounded-full ${userProfile?.isPro ? 'bg-pop shadow-[0_0_8px_rgba(255,0,255,0.8)]' : 'bg-accent shadow-[0_0_8px_rgba(57,255,20,0.8)]'} flex-shrink-0 transition-all`} />
                        <span className={!userProfile?.isPro ? "text-accent" : ""}>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>

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
      <SubscriptionModal isOpen={isSubOpen} onClose={() => setIsSubOpen(false)} />
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
