import React from "react";
import { ShieldCheck, Sparkles, Activity, FileText, RefreshCw } from "lucide-react";
import { InvestorRiskLevel } from "../types";

interface NavbarProps {
  clientName: string;
  riskLevel: InvestorRiskLevel;
  portfolioValue: number;
  onOpenAudit: () => void;
  onReset: () => void;
}

const TIER_LABELS: Record<InvestorRiskLevel, { cn: string; en: string; color: string }> = {
  C1: { cn: "C1 保守型", en: "Conservative", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  C2: { cn: "C2 谨慎型", en: "Prudent", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  C3: { cn: "C3 平衡型", en: "Balanced", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  C4: { cn: "C4 积极型", en: "Growth", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  C5: { cn: "C5 激进型", en: "Aggressive", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
};

export const Navbar: React.FC<NavbarProps> = ({
  clientName,
  riskLevel,
  portfolioValue,
  onOpenAudit,
  onReset,
}) => {
  const tierInfo = TIER_LABELS[riskLevel];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0B0F17]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand & Track Identification */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white tracking-tight text-lg">WeAdvisory</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                AI Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              2026 Shenzhen FinTechathon · WeBank Track
            </p>
          </div>
        </div>

        {/* Center Investor Diagnostic & Capital Status */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-surface/80 border border-white/[0.06]">
            <span className="text-xs text-slate-400">Client:</span>
            <span className="text-xs font-semibold text-slate-200">{clientName}</span>
          </div>

          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${tierInfo.color}`}>
            <span>{tierInfo.cn}</span>
            <span className="opacity-60">·</span>
            <span>{tierInfo.en}</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-surface/80 border border-white/[0.06]">
            <span className="text-xs text-slate-400">Sandbox AUM:</span>
            <span className="text-xs font-mono font-bold text-white">
              ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Right Actions: Audit Ledger & Reset */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenAudit}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all hover:text-white"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSRC Audit Proof</span>
          </button>

          <button
            onClick={onReset}
            title="Reset Simulation Session"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};
