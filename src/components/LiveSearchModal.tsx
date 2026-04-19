import React, { useState, useEffect } from "react";
import { X, ExternalLink, Loader2, Search, AlertTriangle } from "lucide-react";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface LiveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  dork: string;
  intent: string;
}

export function LiveSearchModal({ isOpen, onClose, dork, intent }: LiveSearchModalProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && dork) {
      performSearch();
    } else {
      setResults([]);
      setError(null);
    }
  }, [isOpen, dork]);

  const performSearch = async () => {
    const apiKey = import.meta.env.VITE_BRAVE_SEARCH_API_KEY;

    if (!apiKey) {
      setError("missing_keys");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(dork)}`,
        {
          headers: {
            "Accept": "application/json",
            "X-Subscription-Token": apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const mappedResults = data.web?.results?.map((res: any) => ({
        title: res.title,
        link: res.url,
        snippet: res.description
      })) || [];
      
      setResults(mappedResults);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "An error occurred while searching.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-black/90 border border-neon/50 rounded-xl shadow-[0_0_30px_rgba(57,255,20,0.2)] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-neon/30 bg-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg border border-neon/50 bg-neon/10 flex items-center justify-center shadow-[0_0_10px_rgba(57,255,20,0.2)]">
              <Search className="w-5 h-5 text-neon" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-neon uppercase tracking-widest glow-text">Live Intel Feed</h2>
              <p className="text-xs text-neon/50 font-sans truncate max-w-md">Intent: {intent}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-neon/50 hover:text-neon transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 bg-black/40 border-b border-neon/20">
          <code className="block text-neon font-sans text-sm break-all p-3 bg-black/60 border border-neon/30 rounded-lg shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
            {dork}
          </code>
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <a 
              href={`https://duckduckgo.com/?q=${encodeURIComponent(dork)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-md transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(234,88,12,0.3)]"
            >
              <ExternalLink className="w-4 h-4" />
              DuckDuckGo
            </a>
            <a 
              href={`https://search.brave.com/search?q=${encodeURIComponent(dork)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 px-4 py-2 rounded-md transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(220,38,38,0.3)]"
            >
              <ExternalLink className="w-4 h-4" />
              Brave
            </a>
            <a 
              href={`https://www.google.com/search?q=${encodeURIComponent(dork)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-black bg-neon hover:bg-white px-4 py-2 rounded-md transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(57,255,20,0.3)]"
            >
              <ExternalLink className="w-4 h-4" />
              Google
            </a>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 font-sans">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 text-neon animate-spin" />
              <p className="text-neon/70 uppercase tracking-widest text-sm animate-pulse">Executing Query...</p>
            </div>
          ) : error === "missing_keys" ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-neon/10 border border-neon/50 flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.2)] mb-2">
                <Search className="w-8 h-8 text-neon" />
              </div>
              <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Execute Secure Payload</h3>
              <p className="text-neon/70 text-sm leading-relaxed">
                To bypass corporate API tracking and rate limits, DorkOps routes your queries directly through encrypted browser sessions. 
              </p>
              <div className="bg-black/60 border border-neon/30 p-6 rounded-lg w-full space-y-4 mt-4 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                <p className="text-xs text-neon uppercase tracking-wider mb-2 font-bold flex items-center gap-2 justify-center">
                  Select a target network to execute:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a 
                    href={`https://duckduckgo.com/?q=${encodeURIComponent(dork)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center items-center gap-2 font-bold text-white bg-orange-600 hover:bg-orange-500 px-4 py-3 rounded-md transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(234,88,12,0.3)] w-full"
                  >
                    <ExternalLink className="w-4 h-4" />
                    DuckDuckGo
                  </a>
                  <a 
                    href={`https://search.brave.com/search?q=${encodeURIComponent(dork)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center items-center gap-2 font-bold text-white bg-red-600 hover:bg-red-500 px-4 py-3 rounded-md transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(220,38,38,0.3)] w-full"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Brave Search
                  </a>
                  <a 
                    href={`https://www.google.com/search?q=${encodeURIComponent(dork)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center items-center gap-2 font-bold text-black bg-neon hover:bg-white px-4 py-3 rounded-md transition-colors uppercase tracking-wider shadow-[0_0_10px_rgba(57,255,20,0.3)] w-full sm:col-span-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Google (Logged)
                  </a>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 bg-red-950/20 border border-red-500/30 rounded-lg">
              [ERROR]: {error}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-neon/50 uppercase tracking-widest">
              No results found for this query.
            </div>
          ) : (
            <div className="space-y-6">
              {results.map((result, idx) => (
                <div key={idx} className="bg-black/60 border border-neon/20 hover:border-neon/50 rounded-lg p-5 transition-colors shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                  <a 
                    href={result.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-2"
                  >
                    <h3 className="text-lg font-bold text-blue-400 group-hover:text-blue-300 group-hover:underline transition-colors line-clamp-1">
                      {result.title}
                    </h3>
                    <p className="text-xs text-green-500/70 truncate">
                      {result.link}
                    </p>
                    <p className="text-sm text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                      {result.snippet}
                    </p>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neon/30 bg-black flex justify-center sm:justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 bg-black hover:bg-neon/10 text-neon font-bold rounded-lg transition-all border border-neon/50 hover:border-neon uppercase tracking-widest shadow-[0_0_10px_rgba(57,255,20,0.1)] hover:shadow-[0_0_15px_rgba(57,255,20,0.3)]"
          >
            Return to Dorks
          </button>
        </div>
      </div>
    </div>
  );
}
