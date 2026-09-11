import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, RefreshCw, Cpu, ChevronLeft, Layers, BarChart2 } from "lucide-react";
import { InvestorRiskLevel } from "../types";

type DashboardMode = "simple" | "expert";

interface NavbarProps {
  clientName: string;
  riskLevel: InvestorRiskLevel;
  portfolioValue: number;
  onOpenAudit: () => void;
  onReset: () => void;
  onBackToLanding?: () => void;
  dashboardMode: DashboardMode;
  onToggleMode: () => void;
}

const TIER_META: Record<
  InvestorRiskLevel,
  { label: string; sub: string; color: string; bg: string }
> = {
  C1: { label: "C1", sub: "Conservative", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  C2: { label: "C2", sub: "Prudent",      color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  C3: { label: "C3", sub: "Balanced",     color: "#e4e4e7", bg: "rgba(228,228,231,0.10)" },
  C4: { label: "C4", sub: "Growth",       color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  C5: { label: "C5", sub: "Aggressive",   color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

export const Navbar: React.FC<NavbarProps> = ({
  clientName,
  riskLevel,
  portfolioValue,
  onOpenAudit,
  onReset,
  onBackToLanding,
  dashboardMode,
  onToggleMode,
}) => {
  const tier = TIER_META[riskLevel];

  return (
    <header className="shrink-0 w-full bg-black border-b border-zinc-900">
      <div className="max-w-screen-2xl mx-auto px-4 h-12 flex items-center gap-3">

        {/* Back arrow */}
        {onBackToLanding && (
          <motion.button
            onClick={onBackToLanding}
            whileHover={{ x: -2 }}
            className="flex items-center gap-1 shrink-0 text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
        )}

        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-zinc-900">
            <Cpu className="w-3 h-3 text-zinc-300" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-white leading-none tracking-tight">WeAdvisory</div>
            <div className="text-[8px] font-mono mt-0.5 leading-none text-zinc-600 uppercase tracking-wider">
              Track B · AI Wealth Agent
            </div>
          </div>
        </div>

        <div className="w-px h-4 shrink-0 bg-zinc-900" />

        {/* Client info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0 bg-zinc-900 text-zinc-400">
            {clientName.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="hidden sm:flex flex-col min-w-0">
            <div className="text-[11px] font-semibold text-zinc-200 leading-none">{clientName}</div>
            <div className="text-[9px] font-mono text-zinc-500 mt-0.5">
              AUM <span className="text-zinc-300 font-bold">${portfolioValue.toLocaleString()}</span>
            </div>
          </div>

          {/* Tier pill */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
            style={{ background: tier.bg }}
          >
            <span className="font-mono font-bold text-[10px]" style={{ color: tier.color }}>
              {tier.label}
            </span>
            <span className="hidden md:block text-[9px] font-mono" style={{ color: tier.color, opacity: 0.7 }}>
              {tier.sub}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Mode Toggle (Simple ↔ Expert) — centre de l'attention ── */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onToggleMode}
            className="relative flex items-center rounded-full p-0.5 bg-zinc-900 border border-zinc-800"
            style={{ gap: 0 }}
          >
            {/* Sliding pill background */}
            <motion.div
              className="absolute top-0.5 bottom-0.5 rounded-full bg-zinc-700"
              animate={{
                left: dashboardMode === "simple" ? "2px" : "50%",
                right: dashboardMode === "simple" ? "50%" : "2px",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{ zIndex: 0 }}
            />

            {/* Simple button */}
            <button
              onClick={() => dashboardMode !== "simple" && onToggleMode()}
              className={`relative z-10 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors duration-200 ${
                dashboardMode === "simple" ? "text-white" : "text-zinc-500"
              }`}
            >
              <Layers className="w-2.5 h-2.5" />
              Simple
            </button>

            {/* Expert button */}
            <button
              onClick={() => dashboardMode !== "expert" && onToggleMode()}
              className={`relative z-10 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium transition-colors duration-200 ${
                dashboardMode === "expert" ? "text-white" : "text-zinc-500"
              }`}
            >
              <BarChart2 className="w-2.5 h-2.5" />
              Expert
            </button>
          </button>
        </div>

        <div className="w-px h-4 shrink-0 bg-zinc-900" />

        {/* CSRC badge */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">CSRC</span>
        </div>

        <div className="w-px h-4 shrink-0 bg-zinc-900" />

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.button
            onClick={onOpenAudit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1" />
              <line x1="3" y1="4" x2="9" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="3" y1="6" x2="9" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              <line x1="3" y1="8" x2="7" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            Audit
          </motion.button>

          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97, rotate: -90 }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </motion.button>
        </div>

      </div>
    </header>
  );
};
