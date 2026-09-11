import React, { useState, useEffect } from "react";
import { motion, animate, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { ShieldCheck, TrendingUp, Zap, MessageCircle, ChevronRight, AlertTriangle } from "lucide-react";
import { PortfolioAllocation, MonteCarloPath, InvestorRiskLevel } from "../types";

interface SimpleDashboardProps {
  allocation: PortfolioAllocation;
  monteCarlo: MonteCarloPath;
  currentTier: InvestorRiskLevel;
  portfolioValue: number;
  onOpenChat: () => void;
  onSelectTier: (tier: InvestorRiskLevel) => void;
}

/* ── Animated number hook ───────────────────────────────────────── */
function useCountUp(target: number, decimals = 2, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const ctrl = animate(0, target, {
        duration: 1.4,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: v => setVal(parseFloat(v.toFixed(decimals))),
      });
      return ctrl.stop;
    }, delay);
    return () => clearTimeout(timeout);
  }, [target]);
  return val;
}

/* ── Tier config ─────────────────────────────────────────────────── */
const TIER_CONF: Record<InvestorRiskLevel, {
  emoji: string; label: string; sub: string;
  color: string; bg: string; border: string; risk: number;
}> = {
  C1: { emoji: "🛡", label: "Conservative", sub: "保守型", color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)", risk: 1 },
  C2: { emoji: "🔒", label: "Prudent",      sub: "谨慎型", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)", risk: 2 },
  C3: { emoji: "⚖️", label: "Balanced",     sub: "平衡型", color: "#e4e4e7", bg: "rgba(228,228,231,0.06)", border: "rgba(228,228,231,0.15)", risk: 3 },
  C4: { emoji: "📈", label: "Growth",       sub: "积极型", color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.2)", risk: 4 },
  C5: { emoji: "🚀", label: "Aggressive",   sub: "激进型", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", risk: 5 },
};

const TIERS: InvestorRiskLevel[] = ["C1", "C2", "C3", "C4", "C5"];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Sparkline (single smooth P50 curve) ────────────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const W = 600, H = 100;
  const min = Math.min(...data), max = Math.max(...data);
  const n = data.length;
  const xs = data.map((_, i) => (i / (n - 1)) * W);
  const ys = data.map(v => H - ((v - min) / (max - min)) * H * 0.85 - H * 0.075);

  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const areaD = `${d} L${W},${H} L0,${H} Z`;

  return (
    <div className="w-full h-full relative" onMouseLeave={() => setHoverIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d={areaD} fill="url(#sparkGrad)" />
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: "easeOut", delay: 0.3 }}
        />

        {/* Hover interaction */}
        {hoverIdx !== null && (
          <g>
            <line x1={xs[hoverIdx]} y1={0} x2={xs[hoverIdx]} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx={xs[hoverIdx]} cy={ys[hoverIdx]} r={3} fill={color} />
          </g>
        )}
        
        {/* Invisible hit areas */}
        {data.map((_, i) => (
          <rect
            key={`hit-${i}`}
            x={xs[i] - (W / n) / 2}
            y={0}
            width={W / n}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            className="cursor-crosshair"
          />
        ))}
      </svg>
      
      {/* Tooltip */}
      {hoverIdx !== null && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-[10px] font-mono px-2 py-1 rounded shadow-lg pointer-events-none z-10 whitespace-nowrap">
          <span className="text-zinc-500 mr-2">M{hoverIdx}</span>
          <span style={{ color }}>${Math.round(data[hoverIdx]).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

/* ── KPI Card ────────────────────────────────────────────────────── */
function KpiCard({
  label, value, unit, sub, color, delay = 0,
}: {
  label: string; value: string; unit?: string; sub: string; color?: string; delay?: number;
}) {
  return (
    <motion.div
      variants={fadeSlide}
      whileHover={{ y: -2, scale: 1.015 }}
      className="flex flex-col gap-1 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 backdrop-blur-sm cursor-default select-none"
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{label}</span>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-semibold tabular-nums" style={{ color: color ?? "#fafafa" }}>
          {value}
        </span>
        {unit && <span className="text-sm text-zinc-500 font-mono">{unit}</span>}
      </div>
      <span className="text-xs text-zinc-600 font-light">{sub}</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SIMPLE DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */
export const SimpleDashboard: React.FC<SimpleDashboardProps> = ({
  allocation,
  monteCarlo,
  currentTier,
  portfolioValue,
  onOpenChat,
  onSelectTier,
}) => {
  const tc = TIER_CONF[currentTier];
  const isGain = allocation.expected_annual_return >= 0;
  const chartColor = isGain ? "#ef4444" : "#22c55e"; // Chinese convention

  const aum = useCountUp(portfolioValue, 0, 200);
  const ret = useCountUp(allocation.expected_annual_return * 100, 2, 400);
  const sharpe = useCountUp(allocation.sharpe_ratio, 2, 600);
  const vol = useCountUp(allocation.expected_annual_volatility * 100, 2, 500);

  const topAsset = Object.entries(allocation.weights).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <motion.div
        className="max-w-2xl mx-auto flex flex-col gap-6"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >

        {/* ── Hero AUM card ── */}
        <motion.div
          variants={fadeSlide}
          className="relative rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800/50 p-6"
        >
          {/* Subtle glow */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 30% 50%, ${tc.color} 0%, transparent 70%)`,
            }}
          />

          <div className="relative z-10 flex flex-col gap-4">
            {/* Portfolio label */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Sandbox Portfolio · Sarah Jenkins
              </span>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: tc.bg, border: `1px solid ${tc.border}` }}>
                <span className="text-sm">{tc.emoji}</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: tc.color }}>
                  {currentTier} {tc.label}
                </span>
              </div>
            </div>

            {/* AUM value */}
            <div>
              <div className="text-5xl md:text-6xl font-bold tabular-nums tracking-tight text-white">
                ${aum.toLocaleString("en-US")}
              </div>
              <div className={`text-lg font-medium mt-1 tabular-nums ${isGain ? "text-red-400" : "text-green-400"}`}>
                {isGain ? "+" : ""}{ret.toFixed(2)}% expected annual return
              </div>
            </div>

            {/* Sparkline */}
            <div className="h-20 w-full -mx-1">
              <Sparkline data={monteCarlo.p50_median} color={chartColor} />
            </div>

            {/* Horizon labels */}
            <div className="flex justify-between text-[9px] font-mono text-zinc-600 uppercase -mt-2">
              <span>Now</span>
              <span>Year 1</span>
              <span>Year 3</span>
              <span>Year 5</span>
            </div>
          </div>
        </motion.div>

        {/* ── KPI grid ── */}
        <motion.div variants={fadeSlide} className="grid grid-cols-3 gap-3">
          <KpiCard
            label="Sharpe"
            value={sharpe.toFixed(2)}
            sub="Risk-adjusted return"
            color="#e4e4e7"
            delay={0}
          />
          <KpiCard
            label="Volatility"
            value={vol.toFixed(1)}
            unit="%"
            sub="Annual std deviation"
            color="#a1a1aa"
            delay={0.1}
          />
          <KpiCard
            label="Compliance"
            value="✓"
            sub="CSRC suitability met"
            color="#10b981"
            delay={0.2}
          />
        </motion.div>

        {/* ── Risk Tier selector ── */}
        <motion.div variants={fadeSlide} className="flex flex-col gap-3">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Your risk profile</span>
          <div className="flex gap-2">
            {TIERS.map(tier => {
              const t = TIER_CONF[tier];
              const active = tier === currentTier;
              return (
                <motion.button
                  key={tier}
                  onClick={() => onSelectTier(tier)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all duration-200"
                  style={{
                    background: active ? t.bg : "transparent",
                    borderColor: active ? t.border : "rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="text-base">{t.emoji}</span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: active ? t.color : "#52525b" }}>
                    {tier}
                  </span>
                  <span className="hidden md:block text-[8px] font-mono text-zinc-600">{t.label}</span>
                </motion.button>
              );
            })}
          </div>
          {/* Risk scale bar */}
          <div className="relative h-1.5 rounded-full bg-zinc-900 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, #60a5fa, ${tc.color})`,
              }}
              animate={{ width: `${(TIER_CONF[currentTier].risk / 5) * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-zinc-600">
            <span>Low risk</span>
            <span>High risk</span>
          </div>
        </motion.div>

        {/* ── Top holding ── */}
        <motion.div
          variants={fadeSlide}
          className="flex items-center justify-between px-5 py-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/40"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Top holding</span>
            <span className="text-sm font-medium text-white">{topAsset?.[0] ?? "—"}</span>
          </div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: tc.color }}>
            {((topAsset?.[1] ?? 0) * 100).toFixed(1)}%
          </div>
        </motion.div>

        {/* ── CSRC compliance banner ── */}
        <motion.div
          variants={fadeSlide}
          className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border"
          style={{ background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-emerald-400">CSRC Suitability — Fully Compliant</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">{allocation.compliance_message}</div>
          </div>
        </motion.div>

        {/* ── CTA: Open AI Chat ── */}
        <motion.button
          variants={fadeSlide}
          onClick={onOpenChat}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-medium text-sm transition-all"
          style={{
            background: `linear-gradient(135deg, ${tc.color}22, ${tc.color}10)`,
            border: `1px solid ${tc.border}`,
            color: tc.color,
          }}
        >
          <MessageCircle className="w-4 h-4" />
          Consult my AI Advisor
          <ChevronRight className="w-4 h-4 opacity-60" />
        </motion.button>

        {/* Footer note */}
        <motion.p variants={fadeSlide} className="text-center text-[9px] font-mono text-zinc-700 uppercase tracking-widest pb-2">
          Powered by WeAdvisory Multi-Agent System · Sandbox only
        </motion.p>

      </motion.div>
    </div>
  );
};
