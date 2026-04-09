import { X } from "lucide-react";

export function TutorialModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-black/90 border border-neon/50 rounded-xl shadow-[0_0_30px_rgba(57,255,20,0.2)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-neon/30">
          <h2 className="text-2xl font-display font-bold text-neon uppercase tracking-widest glow-text">Intel Briefing</h2>
          <button onClick={onClose} className="text-neon/50 hover:text-neon transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto text-neon/80 space-y-6 font-sans">
          <section>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">What is a Google Dork?</h3>
            <p>
              A Google Dork (or Google Hacking) is a search string that uses advanced search operators to find information that is not readily available on a website. It's a powerful tool for OSINT (Open Source Intelligence) professionals, researchers, and anyone looking for specific data.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">Common Operators</h3>
            <ul className="space-y-3">
              <li>
                <code className="text-black bg-neon px-2 py-1 rounded font-bold">site:</code>
                <span className="ml-2">Restricts search results to a specific domain (e.g., <code>site:gov</code>).</span>
              </li>
              <li>
                <code className="text-black bg-neon px-2 py-1 rounded font-bold">filetype:</code>
                <span className="ml-2">Searches for specific file extensions (e.g., <code>filetype:pdf</code>).</span>
              </li>
              <li>
                <code className="text-black bg-neon px-2 py-1 rounded font-bold">intitle:</code>
                <span className="ml-2">Finds pages with a specific word in the title.</span>
              </li>
              <li>
                <code className="text-black bg-neon px-2 py-1 rounded font-bold">inurl:</code>
                <span className="ml-2">Finds pages with a specific word in the URL.</span>
              </li>
              <li>
                <code className="text-black bg-neon px-2 py-1 rounded font-bold">"exact phrase"</code>
                <span className="ml-2">Forces Google to search for the exact phrase inside the quotes.</span>
              </li>
              <li>
                <code className="text-black bg-neon px-2 py-1 rounded font-bold">-word</code>
                <span className="ml-2">Excludes a word from the search results.</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">How to use DorkOps</h3>
            <p>
              Instead of memorizing all these operators, simply describe what you're looking for in plain English. 
              For example: <br/><br/>
              <em className="text-neon/60">"I want to find hidden documents about WWII that were released in a FOIA request"</em>
              <br/><br/>
              DorkOps will translate this into precise queries you can copy and paste directly into Google.
            </p>
          </section>
        </div>
        
        <div className="p-6 border-t border-neon/30 bg-black flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-neon hover:bg-white text-black font-bold rounded-lg transition-colors uppercase tracking-widest shadow-[0_0_15px_rgba(57,255,20,0.3)]"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
