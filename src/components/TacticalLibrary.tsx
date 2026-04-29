import React from "react";
import { Shield, Users, Database, Cloud, Zap, ArrowRight } from "lucide-react";

interface TacticalLibraryProps {
  onSelect: (intent: string, dork: string) => void;
  isPro: boolean;
}

const CATEGORIES = [
  {
    id: "infrastructure",
    name: "Infrastructure",
    icon: Shield,
    color: "text-blue-400",
    dorks: [
      { intent: "Find Apache Server Status", dork: 'intitle:"Apache Status" "server information"' },
      { intent: "Exposed Nginx Configs", dork: 'filetype:conf inurl:nginx.conf' },
      { intent: "Open Jenkins Dashboards", dork: 'intitle:"Dashboard [Jenkins]"' },
    ]
  },
  {
    id: "personnel",
    name: "Personnel Recon",
    icon: Users,
    color: "text-green-400",
    dorks: [
      { intent: "Find Resumes on S3", dork: 'site:s3.amazonaws.com "resume" filetype:pdf' },
      { intent: "LinkedIn Profile Scraping", dork: 'site:linkedin.com/in "software engineer" "gmail.com"' },
      { intent: "Private Email Directories", dork: 'intitle:"index of" "email.txt"' },
    ]
  },
  {
    id: "database",
    name: "DB Intelligence",
    icon: Database,
    color: "text-purple-400",
    dorks: [
      { intent: "SQL Dump Files", dork: 'filetype:sql "INSERT INTO" "users"' },
      { intent: "MongoDB Express Panels", dork: 'intitle:"Mongo Express" "Database"' },
      { intent: "Exposed Firebase DBs", dork: 'site:firebaseio.com filetype:json' },
    ]
  },
  {
    id: "cloud",
    name: "Cloud Assets",
    icon: Cloud,
    color: "text-amber-400",
    dorks: [
      { intent: "Azure Blob Storage", dork: 'site:blob.core.windows.net "confidential"' },
      { intent: "DigitalOcean Spaces", dork: 'site:digitaloceanspaces.com "backup"' },
      { intent: "AWS Credential Leaks", dork: 'filetype:env "AWS_SECRET_ACCESS_KEY"' },
    ]
  }
];

export const TacticalLibrary: React.FC<TacticalLibraryProps> = ({ onSelect, isPro }) => {
  if (!isPro) {
    return (
      <div className="p-6 bg-black/40 border border-purple/30 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
        <Zap className="w-12 h-12 text-purple/50 animate-pulse" />
        <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Tactical Library</h3>
        <p className="text-slate-400 text-sm font-sans max-w-[200px]">
          Upgrade to <a href="https://play.google.com/store/apps/developer?id=Media+Multi-Tool+Ai" target="_blank" rel="noopener noreferrer" className="text-pop font-bold hover:underline">PRO</a> to access the automated OSINT payload library.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-6 h-6 text-pop glow-pop" />
        <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Tactical Library</h3>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="bg-black/60 border border-purple/30 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-purple/20 bg-purple/5 flex items-center gap-2">
              <cat.icon className={`w-4 h-4 ${cat.color}`} />
              <span className="text-xs font-bold uppercase tracking-tighter text-slate-300">{cat.name}</span>
            </div>
            <div className="p-2 space-y-1">
              {cat.dorks.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelect(item.intent, item.dork)}
                  className="w-full text-left p-2 rounded-lg hover:bg-pop/10 group transition-all flex items-center justify-between"
                >
                  <span className="text-xs text-slate-400 group-hover:text-pop transition-colors truncate pr-2">
                    {item.intent}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-pop flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
