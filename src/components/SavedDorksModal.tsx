import React, { useState, useEffect } from "react";
import { X, Copy, Check, Trash2, Loader2, Search, FileJson, FileText } from "lucide-react";
import { User } from "firebase/auth";
import { collection, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { LiveSearchModal } from "./LiveSearchModal";

interface SavedDork {
  id: string;
  dork: string;
  intent: string;
  createdAt: string;
}

export function SavedDorksModal({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: User | null }) {
  const [dorks, setDorks] = useState<SavedDork[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [liveSearchDork, setLiveSearchDork] = useState<{dork: string, intent: string} | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchSavedDorks();
    }
  }, [isOpen, user]);

  const fetchSavedDorks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "users", user.uid, "savedDorks"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedDorks: SavedDork[] = [];
      querySnapshot.forEach((doc) => {
        fetchedDorks.push({ id: doc.id, ...doc.data() } as SavedDork);
      });
      setDorks(fetchedDorks);
    } catch (error) {
      console.error("Error fetching saved dorks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "savedDorks", id));
      setDorks(dorks.filter(d => d.id !== id));
    } catch (error) {
      console.error("Error deleting dork:", error);
    }
  };

  const exportData = (format: 'json' | 'csv') => {
    const dataToExport = dorks;
    let content = format === 'json' 
      ? JSON.stringify(dataToExport, null, 2) 
      : [["ID", "Intent", "Dork"], ...dataToExport.map(d => [d.id, d.intent, d.dork])].map(r => r.join(",")).join("\n");
    
    const blob = new Blob([content], { type: format === 'json' ? "application/json" : "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `intel_export.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-black/90 border border-purple/50 rounded-xl shadow-[0_0_30px_rgba(139,92,246,0.2)] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-6 border-b border-purple/30 bg-purple/5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-display font-bold text-pop uppercase tracking-widest glow-pop">Saved Intel</h2>
              <span className="text-[10px] px-2 py-0.5 rounded border border-pop/50 text-pop font-bold uppercase tracking-tighter">Pro Assets</span>
            </div>
            <div className="flex items-center gap-4">
              {dorks.length > 0 && (
                <div className="flex items-center gap-2 border-r border-purple/30 pr-4">
                  <button 
                    onClick={() => exportData('json')}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-pop/70 hover:text-pop transition-colors uppercase tracking-widest"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    JSON
                  </button>
                  <button 
                    onClick={() => exportData('csv')}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-pop/70 hover:text-pop transition-colors uppercase tracking-widest"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    CSV
                  </button>
                </div>
              )}
              <button onClick={onClose} className="text-pop/50 hover:text-pop transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 font-sans">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 text-neon animate-spin" />
              </div>
            ) : dorks.length === 0 ? (
              <div className="text-center py-12 text-neon/50">
                No saved dorks found. Generate and save some intel first.
              </div>
            ) : (
              <div className="space-y-6">
                {dorks.map((dork) => (
                  <div key={dork.id} className="bg-black/60 border border-neon/30 rounded-lg p-4 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
                    <div className="text-neon/50 text-xs mb-2 uppercase tracking-wider">
                      Intent: <span className="text-neon/80">{dork.intent}</span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <code className="text-neon/90 font-sans text-sm break-all flex-1">
                        {dork.dork}
                      </code>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => setLiveSearchDork({ dork: dork.dork, intent: dork.intent })}
                          className="p-2 text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors border border-transparent hover:border-blue-400/50"
                          title="Live Search"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(dork.id, dork.dork)}
                          className="p-2 text-neon/50 hover:text-black hover:bg-neon rounded-md transition-colors border border-transparent hover:border-neon"
                          title="Copy to clipboard"
                        >
                          {copiedId === dork.id ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(dork.id)}
                          className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors border border-transparent hover:border-red-500/50"
                          title="Delete saved dork"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <LiveSearchModal 
        isOpen={!!liveSearchDork} 
        onClose={() => setLiveSearchDork(null)} 
        dork={liveSearchDork?.dork || ""} 
        intent={liveSearchDork?.intent || ""} 
      />
    </>
  );
}
