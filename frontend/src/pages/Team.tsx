import { ArrowLeft } from "lucide-react";

interface TeamProps {
  onNavigateHome: () => void;
}

export default function Team({ onNavigateHome }: TeamProps) {
  const teamMembers = [
    { name: "Adriel Kourlate", role: "Lead Quantitative Researcher & Architecture" },
    { name: "Dong Zixuan", role: "Quantitative Data Engineering & Asset Pricing" },
    { name: "Aadithyan Sajith Kumar", role: "Financial Modeling & CSRC Compliance" },
    { name: "Khushi Mistry", role: "Risk Analytics & System Reliability" }
  ];

  const advisor = {
    name: "Prof. Halis Sak",
    role: "Academic Advisor & Faculty Mentor",
    affiliation: "Quantitative Finance & Research Supervision"
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-neutral-50 flex flex-col items-center py-24 px-6 md:px-12">
      <div className="max-w-4xl w-full">
        <button 
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-neutral-400 hover:text-cyan-400 transition-colors mb-12"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 text-xs font-mono tracking-wider mb-4">
          FINTECHATHON 2026 · WEBANK TRACK
        </div>

        <h1 className="text-4xl font-light tracking-tight mb-3">
          Team <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Adastra</span>
        </h1>
        <p className="text-neutral-400 mb-12 max-w-xl text-sm leading-relaxed">
          Quantitative researchers, engineers, and risk modelers building next-generation AI advisory infrastructure for China A-Shares.
        </p>

        <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-4">
          Core Research & Engineering Team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {teamMembers.map((member) => (
            <div 
              key={member.name} 
              className="p-6 border border-neutral-800/60 rounded-xl bg-neutral-900/30 backdrop-blur-sm flex flex-col gap-2 hover:border-cyan-500/40 transition-all duration-200"
            >
              <h3 className="text-lg font-medium text-neutral-100">{member.name}</h3>
              <p className="text-xs font-mono text-cyan-400/80">{member.role}</p>
            </div>
          ))}
        </div>

        <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-4">
          Academic Mentorship & Supervision
        </h2>
        <div className="p-6 border border-amber-500/30 rounded-xl bg-amber-950/10 backdrop-blur-sm flex flex-col gap-2 hover:border-amber-500/50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-amber-200">{advisor.name}</h3>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Faculty Advisor
            </span>
          </div>
          <p className="text-xs font-mono text-amber-300/80">{advisor.role}</p>
          <p className="text-xs text-neutral-400">{advisor.affiliation}</p>
        </div>
      </div>
    </div>
  );
}
