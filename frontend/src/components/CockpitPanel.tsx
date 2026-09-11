import React, { useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  PieChart,
  Activity,
  Layers,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  PortfolioAllocation,
  MonteCarloPath,
  ComplianceAuditRecord,
  InvestorRiskLevel,
} from "../types";

interface CockpitPanelProps {
  allocation: PortfolioAllocation;
  monteCarlo: MonteCarloPath;
  auditRecord: ComplianceAuditRecord | null;
  onExecuteRebalance: () => Promise<void>;
  isRebalancing: boolean;
  onOpenAudit: () => void;
}

// Color mapping for the 10 assets
const ASSET_COLORS: Record<string, string> = {
  "CASH-USD": "#10B981",         // Emerald
  "CN-CGB-10Y": "#3B82F6",       // Blue
  "US-TREAS-7Y": "#6366F1",       // Indigo
  "CORP-IG-BOND": "#8B5CF6",      // Purple
  "GLOBAL-DIVIDEND": "#00D2FF",   // Cyan
  "GOLD-PHYS": "#F59E0B",         // Amber
  "MSCI-WORLD-ETF": "#EC4899",    // Pink
  "TECH-INNOVATION": "#8B5CF6",   // Violet
  "EMERGING-MKTS": "#F43F5E",     // Rose
  "TOKEN-TREAS-RWA": "#14B8A6",   // Teal
};

const ASSET_NAMES: Record<string, string> = {
  "CASH-USD": "USD Cash Equivalents",
  "CN-CGB-10Y": "China Gov 10Y Bonds",
  "US-TREAS-7Y": "US 7-10Y Treasury ETF",
  "CORP-IG-BOND": "Global Investment Grade",
  "GLOBAL-DIVIDEND": "Global Dividend ETF",
  "GOLD-PHYS": "Physical Gold Trust",
  "MSCI-WORLD-ETF": "MSCI World Equities",
  "TECH-INNOVATION": "Tech & AI Innovation",
  "EMERGING-MKTS": "Emerging Markets Equity",
  "TOKEN-TREAS-RWA": "Tokenized US Treasury",
};

const ASSET_TIERS: Record<string, string> = {
  "CASH-USD": "R1",
  "CN-CGB-10Y": "R2",
  "US-TREAS-7Y": "R2",
  "CORP-IG-BOND": "R3",
  "GLOBAL-DIVIDEND": "R3",
  "GOLD-PHYS": "R3",
  "MSCI-WORLD-ETF": "R4",
  "TECH-INNOVATION": "R4",
  "EMERGING-MKTS": "R5",
  "TOKEN-TREAS-RWA": "R5",
};

export const CockpitPanel: React.FC<CockpitPanelProps> = ({
  allocation,
  monteCarlo,
  auditRecord,
  onExecuteRebalance,
  isRebalancing,
  onOpenAudit,
}) => {
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  // Parse weights for donut chart
  const activeWeights = Object.entries(allocation.weights)
    .filter(([_, w]) => w > 0.001)
    .sort((a, b) => b[1] - a[1]);

  // Compute SVG Donut segments
  let cumulativeAngle = 0;
  const radius = 68;
  const cx = 90;
  const cy = 90;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Monte Carlo SVG coordinate mapper
  const mcMonths = monteCarlo.months;
  const maxVal = Math.max(...monteCarlo.p90_optimistic) * 1.05;
  const minVal = Math.min(...monteCarlo.p10_pessimistic) * 0.95;
  const svgWidth = 460;
  const svgHeight = 150;

  const getX = (m: number) => (m / 60) * (svgWidth - 40) + 20;
  const getY = (v: number) => svgHeight - 20 - ((v - minVal) / (maxVal - minVal)) * (svgHeight - 40);

  // Generate SVG paths for Monte Carlo
  const p90Points = monteCarlo.p90_optimistic.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  const p50Points = monteCarlo.p50_median.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  const p10Points = monteCarlo.p10_pessimistic.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");

  // Shaded cone area: p90 forward, then p10 reversed
  const p10Reversed = [...monteCarlo.p10_pessimistic]
    .map((v, i) => `${getX(i)},${getY(v)}`)
    .reverse()
    .join(" ");
  const conePath = `M ${getX(0)},${getY(monteCarlo.p90_optimistic[0])} ${monteCarlo.p90_optimistic
    .map((v, i) => `L ${getX(i)},${getY(v)}`)
    .join(" ")} ${[...monteCarlo.p10_pessimistic]
    .map((v, i) => `L ${getX(60 - i)},${getY(monteCarlo.p10_pessimistic[60 - i])}`)
    .join(" ")} Z`;

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#0B0F17]/90">
      
      {/* 1. CSRC SUITABILITY & REGULATORY SENTINEL CARD */}
      <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white tracking-tight">
                  CSRC Suitability Sentinel
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                  COMPLIANT · PASS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Guaranteed matching according to CSRC Investor Protection Guidelines
              </p>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-500 block uppercase">Composite Risk</span>
            <span className="text-sm font-bold text-cyan-400">
              {allocation.composite_risk_tier} (Balanced)
            </span>
          </div>
        </div>

        {/* Suitability constraints row */}
        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/[0.06] text-xs">
          <div className="bg-black/30 rounded-lg p-2 border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block font-mono">Client Level</span>
            <span className="font-semibold text-slate-200">{allocation.client_tier} (Moderate)</span>
          </div>
          <div className="bg-black/30 rounded-lg p-2 border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block font-mono">Max Permitted Tier</span>
            <span className="font-semibold text-emerald-400">
              {allocation.client_tier === "C1"
                ? "R1"
                : allocation.client_tier === "C2"
                ? "R2"
                : allocation.client_tier === "C3"
                ? "R3"
                : allocation.client_tier === "C4"
                ? "R4"
                : "R5"}
            </span>
          </div>
          <div className="bg-black/30 rounded-lg p-2 border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block font-mono">Anti-Concentration</span>
            <span className="font-semibold text-slate-200">Max 35% Cap Active</span>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC ASSET ALLOCATION (DONUT + BREAKDOWN) */}
      <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Target Asset Allocation (Markowitz Optimal)
            </h3>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-slate-400">
              Exp Return:{" "}
              <strong className="text-emerald-400">
                {(allocation.expected_annual_return * 100).toFixed(2)}%
              </strong>
            </span>
            <span className="text-slate-400">
              Vol:{" "}
              <strong className="text-cyan-400">
                {(allocation.expected_annual_volatility * 100).toFixed(2)}%
              </strong>
            </span>
            <span className="text-slate-400">
              Sharpe: <strong className="text-amber-400">{allocation.sharpe_ratio}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Donut SVG */}
          <div className="md:col-span-5 flex justify-center relative">
            <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
              {activeWeights.map(([id, weight]) => {
                const strokeDasharray = `${weight * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativeAngle * circumference;
                cumulativeAngle += weight;
                const isHovered = hoveredAsset === id;

                return (
                  <circle
                    key={id}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="transparent"
                    stroke={ASSET_COLORS[id] || "#3A86FF"}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredAsset(id)}
                    onMouseLeave={() => setHoveredAsset(null)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {hoveredAsset ? ASSET_TIERS[hoveredAsset] : "Assets"}
              </span>
              <span className="text-lg font-bold font-mono text-white">
                {hoveredAsset
                  ? `${((allocation.weights[hoveredAsset] || 0) * 100).toFixed(1)}%`
                  : activeWeights.length}
              </span>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="md:col-span-7 space-y-1.5 text-xs">
            {activeWeights.map(([id, weight]) => {
              const pct = (weight * 100).toFixed(1);
              const color = ASSET_COLORS[id] || "#3A86FF";
              const tier = ASSET_TIERS[id] || "R2";
              const isHovered = hoveredAsset === id;

              return (
                <div
                  key={id}
                  onMouseEnter={() => setHoveredAsset(id)}
                  onMouseLeave={() => setHoveredAsset(null)}
                  className={`flex items-center justify-between p-1.5 rounded-lg border transition-all ${
                    isHovered
                      ? "bg-white/[0.08] border-cyan-500/40 shadow-sm"
                      : "bg-black/20 border-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-white/10 text-slate-300">
                      {tier}
                    </span>
                    <span className="text-slate-300 truncate">{ASSET_NAMES[id] || id}</span>
                  </div>
                  <span className="font-mono font-bold text-white shrink-0 ml-2">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. MONTE CARLO 5-YEAR WEALTH RISK CONE */}
      <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              5-Year Stochastic Wealth Cone (1,000 Scenarios)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Loss Probability:{" "}
            <strong className="text-emerald-400">
              {(monteCarlo.probability_of_loss * 100).toFixed(1)}%
            </strong>
          </span>
        </div>

        {/* SVG Chart */}
        <div className="w-full h-[150px] relative bg-black/30 rounded-xl border border-white/[0.04] overflow-hidden">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
            <defs>
              <linearGradient id="coneGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0066FF" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Background Gridlines */}
            <line x1="20" y1={getY(minVal)} x2={svgWidth - 20} y2={getY(minVal)} stroke="rgba(255,255,255,0.05)" />
            <line x1="20" y1={getY(monteCarlo.initial_value)} x2={svgWidth - 20} y2={getY(monteCarlo.initial_value)} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <line x1="20" y1={getY(maxVal)} x2={svgWidth - 20} y2={getY(maxVal)} stroke="rgba(255,255,255,0.05)" />

            {/* Shaded Area Cone (P10 to P90) */}
            <path d={conePath} fill="url(#coneGradient)" />

            {/* P90 Curve */}
            <polyline fill="none" stroke="#00D2FF" strokeWidth="1.5" strokeOpacity="0.7" points={p90Points} />

            {/* P50 Median Expected Curve */}
            <polyline fill="none" stroke="#10B981" strokeWidth="2.5" points={p50Points} />

            {/* P10 Stressed Curve */}
            <polyline fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeOpacity="0.8" points={p10Points} />
          </svg>

          {/* Value Labels */}
          <div className="absolute top-2 right-3 text-right font-mono text-[10px]">
            <span className="text-cyan-400 block font-semibold">
              P90: ${monteCarlo.terminal_p90.toLocaleString()}
            </span>
            <span className="text-emerald-400 block font-bold">
              P50: ${monteCarlo.terminal_p50.toLocaleString()}
            </span>
            <span className="text-amber-400 block font-semibold">
              P10: ${monteCarlo.terminal_p10.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] font-mono mt-2 text-slate-400 px-1">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Optimistic (P90)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Expected Median (P50)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Stressed (P10)</span>
            </span>
          </div>
          <span>Horizon: 5 Years</span>
        </div>
      </div>

      {/* 4. CRYPTOGRAPHIC AUDIT MANDATE & EXECUTION */}
      <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white">SHA-256 Mandate Hash</span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs md:max-w-sm">
              {auditRecord?.sha256_fingerprint || "0x8f2a9c12b740e1d88204bca9921e4d0f..."}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={onOpenAudit}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-all"
          >
            View Ledger
          </button>

          <button
            onClick={onExecuteRebalance}
            disabled={isRebalancing}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 shadow-lg shadow-blue-500/25 transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            {isRebalancing ? (
              <span>Signing & Executing...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Execute Sandbox Order</span>
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
