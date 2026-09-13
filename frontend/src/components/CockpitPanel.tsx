import React, { useState, useEffect, useRef } from "react";
import { motion, animate, AnimatePresence } from "framer-motion";
import { ShieldCheck, PieChart, Activity, TrendingUp, Loader2 } from "lucide-react";
import { PortfolioAllocation, MonteCarloPath, ComplianceAuditRecord } from "../types";

interface CockpitPanelProps {
  allocation: PortfolioAllocation;
  monteCarlo: MonteCarloPath;
  auditRecord: ComplianceAuditRecord | null;
  onExecuteRebalance: () => Promise<void>;
  isRebalancing: boolean;
  onOpenAudit: () => void;
  portfolioValue?: number;
  excludedAssets?: string[];
  onUpdatePortfolioValue?: (val: number) => void;
  onToggleAsset?: (asset: string) => void;
}

const ASSET_COLORS: Record<string, string> = {
  "CASH-USD":        "#0ea5e9",
  "CN-CGB-10Y":      "#52525b",
  "US-TREAS-7Y":     "#71717a",
  "CORP-IG-BOND":    "#a1a1aa",
  "GLOBAL-DIVIDEND": "#d4d4d8",
  "GOLD-PHYS":       "#e4e4e7",
  "MSCI-WORLD-ETF":  "#f4f4f5",
  "TECH-INNOVATION": "#ffffff",
  "EMERGING-MKTS":   "#ef4444",
  "TOKEN-TREAS-RWA": "#dc2626",
};

const ASSET_TIERS: Record<string, string> = {
  "CASH-USD": "R1", "CN-CGB-10Y": "R2", "US-TREAS-7Y": "R2",
  "CORP-IG-BOND": "R3", "GLOBAL-DIVIDEND": "R3", "GOLD-PHYS": "R3",
  "MSCI-WORLD-ETF": "R4", "TECH-INNOVATION": "R4", "EMERGING-MKTS": "R5",
  "TOKEN-TREAS-RWA": "R5",
};

function useAnimatedNumber(target: number, decimals = 2, duration = 1.2) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const ctrl = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: v => setDisplay(parseFloat(v.toFixed(decimals))),
    });
    return ctrl.stop;
  }, [target]);
  return display;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const fadeSlide: any = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Monte Carlo SVG Chart (3 lines + area bands) ── */
function MonteCarloChart({ mc, color }: { mc: MonteCarloPath; color: string }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const W = 800, H = 220;
  const allVals = [...mc.p10_pessimistic, ...mc.p50_median, ...mc.p90_optimistic];
  const minV = Math.min(...allVals) * 0.97;
  const maxV = Math.max(...allVals) * 1.03;
  const n = mc.months.length;

  const gx = (i: number) => (i / (n - 1)) * W;
  const gy = (v: number) => H - ((v - minV) / (maxV - minV)) * H;

  const pts = (arr: number[]) =>
    arr.map((v, i) => `${gx(i).toFixed(1)},${gy(v).toFixed(1)}`).join(" ");

  const p10pts = pts(mc.p10_pessimistic);
  const p50pts = pts(mc.p50_median);
  const p90pts = pts(mc.p90_optimistic);

  // Area between P10 and P90
  const areaPath =
    mc.p90_optimistic.map((v, i) => `${i === 0 ? "M" : "L"}${gx(i).toFixed(1)},${gy(v).toFixed(1)}`).join(" ") +
    " " +
    [...mc.p10_pessimistic].reverse().map((v, i) => {
      const ri = mc.p10_pessimistic.length - 1 - i;
      return `L${gx(ri).toFixed(1)},${gy(v).toFixed(1)}`;
    }).join(" ") +
    " Z";

  const yearLabels = [0, 12, 24, 36, 48, 60];

  return (
    <div className="w-full relative" onMouseLeave={() => setHoverIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Band P10→P90 */}
        <path d={areaPath} fill="url(#mcGrad)" />

        {/* P10 */}
        <motion.polyline
          points={p10pts}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.35"
          strokeLinecap="round"
          strokeDasharray="4 4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        />

        {/* P90 */}
        <motion.polyline
          points={p90pts}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.35"
          strokeLinecap="round"
          strokeDasharray="4 4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        />

        {/* P50 — main line, animated draw */}
        <motion.polyline
          key={p50pts}
          points={p50pts}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
        />

        {/* Year markers */}
        {yearLabels.map(m => (
          <line
            key={m}
            x1={gx(m)} y1={0} x2={gx(m)} y2={H}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Hover interaction */}
        {hoverIdx !== null && (
          <g>
            <line x1={gx(hoverIdx)} y1={0} x2={gx(hoverIdx)} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx={gx(hoverIdx)} cy={gy(mc.p50_median[hoverIdx])} r={4} fill={color} />
            <circle cx={gx(hoverIdx)} cy={gy(mc.p10_pessimistic[hoverIdx])} r={3} fill="#ef4444" opacity={0.8} />
            <circle cx={gx(hoverIdx)} cy={gy(mc.p90_optimistic[hoverIdx])} r={3} fill="#22c55e" opacity={0.8} />
          </g>
        )}
        
        {/* Invisible hit areas */}
        {mc.months.map((_, i) => (
          <rect
            key={`hit-${i}`}
            x={gx(i) - (W / n) / 2}
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
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-[10px] font-mono px-3 py-2 rounded-lg shadow-xl pointer-events-none z-10">
          <div className="text-zinc-500 mb-1 font-sans text-xs">
            Year {(hoverIdx / 12).toFixed(1)} (Month {hoverIdx})
          </div>
          <div className="flex gap-4">
            <div className="text-green-400">P90: ${Math.round(mc.p90_optimistic[hoverIdx]).toLocaleString()}</div>
            <div style={{ color }}>P50: ${Math.round(mc.p50_median[hoverIdx]).toLocaleString()}</div>
            <div className="text-red-400">P10: ${Math.round(mc.p10_pessimistic[hoverIdx]).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* X-axis labels */}
      <div className="flex justify-between px-1 mt-1">
        {yearLabels.map(m => (
          <span key={m} className="text-[9px] font-mono text-zinc-600">
            {m === 0 ? "Now" : `Y${m / 12}`}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        {[
          { label: "P90 Optimistic", opacity: 0.4, dash: true },
          { label: "P50 Median",     opacity: 1,   dash: false },
          { label: "P10 Stressed",   opacity: 0.4, dash: true },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div
              className="w-6 h-px"
              style={{
                background: color,
                opacity: l.opacity,
                borderTop: l.dash ? `2px dashed ${color}` : `2px solid ${color}`,
                height: 0,
                display: "block",
              }}
            />
            <span className="text-[9px] font-mono text-zinc-600">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Animated Donut ─────────────────────────────────────────────── */
function AnimatedDonut({
  weights, hoveredAsset, onHover,
}: {
  weights: [string, number][];
  hoveredAsset: string | null;
  onHover: (id: string | null) => void;
}) {
  const radius = 60, cx = 80, cy = 80, sw = 5;
  const circ = 2 * Math.PI * radius;
  let cumul = 0;

  return (
    <svg width="130" height="130" viewBox="0 0 160 160" className="-rotate-90">
      {/* Track */}
      <circle cx={cx} cy={cy} r={radius} fill="transparent"
        stroke="rgba(255,255,255,0.04)" strokeWidth={sw + 2} />
      {weights.map(([id, weight]) => {
        const da = `${weight * circ} ${circ}`;
        const offset = -cumul * circ;
        cumul += weight;
        const hovered = hoveredAsset === id;
        return (
          <motion.circle
            key={id}
            cx={cx} cy={cy} r={radius}
            fill="transparent"
            stroke={ASSET_COLORS[id] ?? "#52525b"}
            strokeWidth={hovered ? sw + 4 : sw}
            strokeDasharray={da}
            strokeDashoffset={offset}
            className="cursor-pointer"
            onMouseEnter={() => onHover(id)}
            onMouseLeave={() => onHover(null)}
            animate={{ strokeWidth: hovered ? sw + 4 : sw, opacity: hoveredAsset && !hovered ? 0.4 : 1 }}
            transition={{ duration: 0.2 }}
          />
        );
      })}
    </svg>
  );
}

/* ── Metric row ─────────────────────────────────────────────────── */
function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-900/60 last:border-0">
      <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">{label}</span>
      <div className="flex flex-col items-end">
        <span className="text-sm font-semibold text-zinc-200 tabular-nums">{value}</span>
        {sub && <span className="text-[9px] text-zinc-600 font-mono">{sub}</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COCKPIT PANEL (EXPERT MODE)
   ═══════════════════════════════════════════════════════════════════ */
export const CockpitPanel: React.FC<CockpitPanelProps> = ({
  allocation, monteCarlo, auditRecord, onExecuteRebalance, isRebalancing, onOpenAudit,
  portfolioValue = 50000, excludedAssets = [], onUpdatePortfolioValue, onToggleAsset
}) => {
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);
  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);

  const activeWeights = Object.entries(allocation.weights)
    .filter(([, w]) => w > 0.001)
    .sort((a, b) => b[1] - a[1]);

  const isGain = allocation.expected_annual_return >= 0;
  const chartColor = isGain ? "#ef4444" : "#22c55e";

  const aumDisplay = useAnimatedNumber(portfolioValue, 0, 0.8);
  const retDisplay = useAnimatedNumber(allocation.expected_annual_return * 100, 2, 1.0);
  const sharpeDisplay = useAnimatedNumber(allocation.sharpe_ratio, 3, 0.9);
  const volDisplay = useAnimatedNumber(allocation.expected_annual_volatility * 100, 2, 0.9);
  const minP10 = Math.min(...monteCarlo.p10_pessimistic);
  const maxDrawdown = Math.min(0, (minP10 / (portfolioValue || 50000)) * 100 - 100);

  return (
    <motion.div
      className="flex-1 overflow-y-auto bg-black text-white px-6 lg:px-8 py-6 flex flex-col gap-6"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* ── 1. Hero AUM & Controls ── */}
      <motion.div variants={fadeSlide} className="flex flex-col items-center text-center gap-1 pt-2 relative">
        <div className="flex items-center gap-3 absolute top-0 right-0">
          {/* Initial Capital Input */}
          <div className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 shadow-lg">
            <span className="text-zinc-500 text-xs font-mono uppercase">Capital</span>
            <div className="flex items-center">
              <span className="text-zinc-400 text-sm">$</span>
              <input
                type="number"
                value={portfolioValue}
                onChange={(e) => onUpdatePortfolioValue?.(Number(e.target.value))}
                className="w-20 bg-transparent border-none outline-none text-white text-sm tabular-nums font-mono focus:ring-0 p-0 ml-1"
                min="1000"
                step="1000"
              />
            </div>
          </div>

          {/* Asset Universe Button */}
          <div className="relative">
            <button 
              onClick={() => setIsAssetsModalOpen(!isAssetsModalOpen)}
              className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-900 hover:bg-zinc-900 rounded-xl px-3 py-2 shadow-lg transition-colors"
            >
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-300 text-xs font-mono uppercase">Assets</span>
            </button>
            
            <AnimatePresence>
              {isAssetsModalOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-12 w-64 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-left"
                >
                  <div className="p-3 border-b border-zinc-900 bg-zinc-900/50 text-xs font-mono text-zinc-400 uppercase tracking-widest flex justify-between items-center">
                    <span>Asset Universe</span>
                    <span className="text-zinc-600">{Object.keys(ASSET_COLORS).length - excludedAssets.length}/{Object.keys(ASSET_COLORS).length}</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {Object.keys(ASSET_COLORS).map(assetId => {
                      const isExcluded = excludedAssets.includes(assetId);
                      return (
                        <label key={assetId} className="flex items-center justify-between p-2 hover:bg-zinc-900 rounded-lg cursor-pointer group transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[assetId] }} />
                            <span className={`text-xs font-mono ${isExcluded ? 'text-zinc-600 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                              {assetId}
                            </span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={!isExcluded}
                            onChange={() => onToggleAsset?.(assetId)}
                            className="w-3 h-3 accent-emerald-500 rounded-sm"
                          />
                        </label>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <span className="font-mono text-zinc-600 text-[10px] uppercase tracking-widest mt-12">
          Sandbox · Markowitz Optimal Portfolio
        </span>
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-5xl md:text-6xl font-bold tracking-tighter tabular-nums leading-none text-white"
        >
          ${aumDisplay.toLocaleString("en-US")}
        </motion.h1>
        <div className={`text-base font-medium tabular-nums ${isGain ? "text-red-400" : "text-green-400"}`}>
          {isGain ? "+" : ""}{retDisplay.toFixed(2)}% · {allocation.client_tier} {isGain ? "平衡型" : "—"}
        </div>
      </motion.div>

      {/* ── 2. Monte Carlo Chart ── */}
      <motion.div variants={fadeSlide} className="rounded-2xl bg-zinc-950/60 border border-zinc-900 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            5-Year Monte Carlo · 1,000 GBM Simulations
          </span>
        </div>
        <MonteCarloChart mc={monteCarlo} color={chartColor} />

        {/* Terminal values */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-zinc-900">
          {[
            { label: "P10 Stressed", val: monteCarlo.terminal_p10, color: "#ef444488" },
            { label: "P50 Median",   val: monteCarlo.terminal_p50, color: chartColor },
            { label: "P90 Best",     val: monteCarlo.terminal_p90, color: "#22c55e88" },
          ].map(t => (
            <div key={t.label} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-mono text-zinc-600 uppercase">{t.label}</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: t.color }}>
                ${t.val.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 3. Portfolio + Compliance grid ── */}
      <motion.div variants={fadeSlide} className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Compliance */}
        <div className="rounded-2xl bg-zinc-950/60 border border-zinc-900 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">CSRC Sentinel</span>
          </div>

          <div>
            <div className="text-3xl font-light tracking-tight text-white">{allocation.client_tier}</div>
            <p className="text-xs text-zinc-500 font-light mt-1 leading-relaxed">{allocation.compliance_message}</p>
          </div>

          <MetricRow label="Risk Tier"   value={allocation.client_tier.replace('_', ' ')} />
          <MetricRow label="Sharpe"      value={sharpeDisplay.toFixed(3)} sub="Risk-adjusted" />
          <MetricRow label="Volatility"  value={`${volDisplay.toFixed(2)}%`} sub="Annual σ" />
          <MetricRow label="P(loss) 5Y"  value={`${(monteCarlo.probability_of_loss * 100).toFixed(1)}%`} />

          <motion.div
            className="flex items-center gap-2 mt-auto pt-2"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Fully Compliant</span>
          </motion.div>
        </div>

        {/* Allocation Donut */}
        <div className="rounded-2xl bg-zinc-950/60 border border-zinc-900 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Markowitz Distribution</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <AnimatedDonut
                weights={activeWeights}
                hoveredAsset={hoveredAsset}
                onHover={setHoveredAsset}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={hoveredAsset ?? "count"}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="text-xl font-light text-white"
                  >
                    {hoveredAsset
                      ? `${((allocation.weights[hoveredAsset] ?? 0) * 100).toFixed(0)}%`
                      : activeWeights.length}
                  </motion.span>
                </AnimatePresence>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                  {hoveredAsset ? ASSET_TIERS[hoveredAsset] : "Assets"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              {activeWeights.slice(0, 5).map(([id, weight]) => (
                <motion.div
                  key={id}
                  className="flex items-center justify-between"
                  animate={{ opacity: hoveredAsset && hoveredAsset !== id ? 0.25 : 1 }}
                  transition={{ duration: 0.15 }}
                  onMouseEnter={() => setHoveredAsset(id)}
                  onMouseLeave={() => setHoveredAsset(null)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ASSET_COLORS[id] }} />
                    <span className="text-[11px] text-zinc-400 font-mono">{id}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">{(weight * 100).toFixed(1)}%</span>
                </motion.div>
              ))}
              {activeWeights.length > 5 && (
                <span className="text-[9px] font-mono text-zinc-700 uppercase">+{activeWeights.length - 5} more</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 4. Execute Rebalance + Audit ── */}
      <motion.div variants={fadeSlide} className="flex gap-3">
        <motion.button
          onClick={onExecuteRebalance}
          disabled={isRebalancing}
          whileHover={!isRebalancing ? { scale: 1.01 } : {}}
          whileTap={!isRebalancing ? { scale: 0.98 } : {}}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-sm font-medium transition-all disabled:opacity-50"
        >
          {isRebalancing ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Executing sandbox…</>
          ) : (
            <><TrendingUp className="w-4 h-4" />Execute Rebalance</>
          )}
        </motion.button>

        <motion.button
          onClick={onOpenAudit}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white text-sm font-medium transition-all"
        >
          <ShieldCheck className="w-4 h-4" />
          Audit Ledger
        </motion.button>
      </motion.div>

      {/* Audit fingerprint */}
      {auditRecord && (
        <motion.div variants={fadeSlide} className="text-[9px] font-mono text-zinc-700 text-center break-all">
          SHA-256: {auditRecord.sha256_fingerprint.substring(0, 40)}…
        </motion.div>
      )}

    </motion.div>
  );
};
