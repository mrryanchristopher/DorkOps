import React, { useState } from "react";
import { Copy, Check, Bookmark, BookmarkCheck, Search } from "lucide-react";
import { User } from "firebase/auth";
import { collection, addDoc, FirestoreError } from "firebase/firestore";
import { db } from "../firebase";

export const DorkResult: React.FC<{ 
  dork: string; 
  intent?: string; 
  user?: User | null;
  onLiveSearch?: (dork: string) => void;
}> = ({ dork, intent, user, onLiveSearch }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dork);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleSave = async () => {
    if (!user || !intent || saved || isSaving) return;
    
    setIsSaving(true);
    try {
      const savedDorksRef = collection(db, "users", user.uid, "savedDorks");
      await addDoc(savedDorksRef, {
        dork,
        intent,
        createdAt: new Date().toISOString()
      });
      setSaved(true);
    } catch (err: any) {
      console.error("Failed to save dork: ", err);
      if (err instanceof FirestoreError && err.code === 'permission-denied') {
        console.error("CRITICAL PERMISSION ERROR: Saving dork failed for Path:", `users/${user.uid}/savedDorks`, "User:", user.uid);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="group relative bg-black/60 border border-neon/30 hover:border-neon/60 rounded-lg p-4 transition-all shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
      <code className="block text-neon/90 font-sans text-sm break-all pr-32">
        {dork}
      </code>
      <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1">
        {onLiveSearch && (
          <button
            onClick={() => onLiveSearch(dork)}
            className="p-2 text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors border border-transparent hover:border-blue-400/50"
            title="Live Search"
          >
            <Search className="w-5 h-5" />
          </button>
        )}
        {user && intent && (
          <button
            onClick={handleSave}
            disabled={saved || isSaving}
            className={`p-2 rounded-md transition-colors border border-transparent ${
              saved ? "text-neon" : "text-neon/50 hover:text-black hover:bg-neon hover:border-neon"
            }`}
            title={saved ? "Saved" : "Save Dork"}
          >
            {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="p-2 text-neon/50 hover:text-black hover:bg-neon rounded-md transition-colors border border-transparent hover:border-neon"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-5 h-5 text-black" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
