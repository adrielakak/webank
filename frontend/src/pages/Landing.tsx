import { useState } from "react";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Cpu,
  Lock,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Terminal,
  Compass,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Grainient from "../components/ui/Grainient";
import TextType from "../components/ui/TextType";

// Animation presets with smooth cubic-bezier easing
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number] 
    } 
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};


// Interactive Showcase Stock Intelligence Data
interface ShowcaseStock {
  ticker: string;
  name: string;
  chinese: string;
  sector: string;
  tier: "R1" | "R2" | "R3" | "R4" | "R5";
  tierLabel: string;
  badgeColor: string;
  expectedReturn: string;
  probCrash: string;
  auditHash: string;
  summary: string;
  features: { name: string; impact: string; positive: boolean }[];
}

const SHOWCASE_STOCKS: ShowcaseStock[] = [
  {
    ticker: "600519",
    name: "Kweichow Moutai",
    chinese: "贵州茅台",
    sector: "Consumer Staples",
    tier: "R1",
    tierLabel: "R1 Low Risk (Capital Preservation)",
    badgeColor: "emerald",
    expectedReturn: "+2.80%/mo",
    probCrash: "1.8%",
    auditHash: "0x7f4a9b2c8e1d3f5a0462bb184e9c7042a3f91",
    summary:
      "Capital preservation benchmark. Substantial Altman Z-score solvency, robust operating cash flows, and negative idiosyncratic volatility cushion downside risks during market corrections.",
    features: [
      { name: "Tversky-Kahneman Peer Reward", impact: "+0.48", positive: true },
      { name: "Operating Cash Flow to Equity", impact: "+0.35", positive: true },
      { name: "Altman Z-Score Solvency", impact: "+0.29", positive: true },
      { name: "Orthogonal News Surprise", impact: "+0.15", positive: true },
      { name: "Idiosyncratic Volatility", impact: "-0.41", positive: false },
    ],
  },
  {
    ticker: "300750",
    name: "CATL CleanTech",
    chinese: "宁德时代",
    sector: "Clean Energy",
    tier: "R2",
    tierLabel: "R2 Moderate Risk (Balanced Growth)",
    badgeColor: "teal",
    expectedReturn: "+3.50%/mo",
    probCrash: "7.8%",
    auditHash: "0x3e18a4c9d72b5f01948ac91207e3bf81d64c0",
    summary:
      "Strong growth candidate driven by positive orthogonal news surprise in lithium battery supply chains, paired with sustained 12-month cross-asset institutional momentum.",
    features: [
      { name: "Orthogonal CleanTech News Shock", impact: "+0.58", positive: true },
      { name: "12-Month Momentum (ret_12_1)", impact: "+0.42", positive: true },
      { name: "Asset Turnover Acceleration", impact: "+0.26", positive: true },
      { name: "Macro Liquidity Beta", impact: "+0.18", positive: true },
      { name: "Raw Factor Valuation Spread", impact: "-0.22", positive: false },
    ],
  },
  {
    ticker: "688981",
    name: "SMIC Semiconductors",
    chinese: "中芯国际",
    sector: "Technology / Semis",
    tier: "R4",
    tierLabel: "R4 High Risk (Aggressive Alpha)",
    badgeColor: "amber",
    expectedReturn: "+4.80%/mo",
    probCrash: "28.4%",
    auditHash: "0x9c417f0a82b3d6e51084ef7201c9a48b37e2d",
    summary:
      "High-conviction upside driven by geopolitical semiconductor independence catalysts, but flagged for strict C4/C5 suitability due to elevated idiosyncratic volatility.",
    features: [
      { name: "Orthogonal Tech Policy Shock", impact: "+0.64", positive: true },
      { name: "Idiosyncratic Volatility Multiplier", impact: "+0.52", positive: true },
      { name: "Trading Turnover Spike", impact: "+0.37", positive: true },
      { name: "Distance to 52-Week High", impact: "+0.28", positive: true },
      { name: "Book-to-Market Multiple", impact: "-0.31", positive: false },
    ],
  },
  {
    ticker: "000002",
    name: "Vanke Real Estate",
    chinese: "万科企业",
    sector: "Real Estate",
    tier: "R5",
    tierLabel: "R5 Severe Tail-Risk (Avoid Zone)",
    badgeColor: "rose",
    expectedReturn: "-1.20%/mo",
    probCrash: "68.2%",
    auditHash: "0x1d58c2a9e3b47f01839db0472e185ac946f07",
    summary:
      "Automated CSRC Sentinel Trigger: acute refinancing distress and downside peer contagion flag this asset for mandatory exclusion across conservative and balanced client mandates.",
    features: [
      { name: "Financial Constraint Index (KZ)", impact: "+0.78", positive: true },
      { name: "Downside Volatility Multiplier", impact: "+0.65", positive: true },
      { name: "Negative Real Estate Sentiment Shock", impact: "+0.45", positive: true },
      { name: "Peer Negative Contagion", impact: "+0.39", positive: true },
      { name: "Moving Average Divergence", impact: "-0.52", positive: false },
    ],
  },
];

// Interactive Miniature Stocks for the Hero Workstation
interface MiniStock {
  code: string;
  name: string;
  chinese: string;
  x: number; // percentage in coordinate space (0-100)
  y: number; // percentage in coordinate space (0-100)
  ret: string;
  risk: string;
  quadrant: "Opportunity" | "Speculative" | "Defensive" | "Avoid";
  tier: "R1" | "R2" | "R3" | "R4" | "R5";
  shapHighlight: string;
}

const MINI_STOCKS: MiniStock[] = [
  { code: "600519", name: "Moutai", chinese: "贵州茅台", x: 26, y: 28, ret: "+2.80%", risk: "1.4%", quadrant: "Opportunity", tier: "R1", shapHighlight: "+0.48 TK-Peer" },
  { code: "600036", name: "CMB", chinese: "招商银行", x: 20, y: 38, ret: "+1.92%", risk: "1.2%", quadrant: "Opportunity", tier: "R1", shapHighlight: "+0.39 Solvency" },
  { code: "000001", name: "PAB", chinese: "平安银行", x: 32, y: 34, ret: "+2.15%", risk: "1.6%", quadrant: "Opportunity", tier: "R1", shapHighlight: "+0.31 CashFlow" },
  { code: "300750", name: "CATL", chinese: "宁德时代", x: 68, y: 22, ret: "+3.50%", risk: "3.8%", quadrant: "Speculative", tier: "R2", shapHighlight: "+0.58 CleanTech" },
  { code: "688981", name: "SMIC", chinese: "中芯国际", x: 78, y: 16, ret: "+4.80%", risk: "4.6%", quadrant: "Speculative", tier: "R4", shapHighlight: "+0.64 SemiShock" },
  { code: "002594", name: "BYD", chinese: "比亚迪", x: 62, y: 30, ret: "+2.95%", risk: "3.2%", quadrant: "Speculative", tier: "R3", shapHighlight: "+0.42 Momentum" },
  { code: "601318", name: "PingAn", chinese: "中国平安", x: 28, y: 65, ret: "+0.85%", risk: "1.8%", quadrant: "Defensive", tier: "R2", shapHighlight: "-0.18 Volatility" },
  { code: "000002", name: "Vanke", chinese: "万科企业", x: 74, y: 78, ret: "-1.20%", risk: "4.9%", quadrant: "Avoid", tier: "R5", shapHighlight: "+0.78 KZ-Stress" },
  { code: "688566", name: "Jinko", chinese: "晶科能源", x: 82, y: 84, ret: "-3.40%", risk: "5.4%", quadrant: "Avoid", tier: "R5", shapHighlight: "+0.84 CrashSurprise" },
];

// CSRC Interactive Simulator Profiles
const CSRC_PROFILES = [
  {
    id: "C1",
    name: "C1 · Conservative",
    chinese: "保守型 (Prudent Preserver)",
    archetype: "Retirees & Sovereign Treasury",
    allowedTier: "R1 Only",
    forbiddenTiers: ["R2", "R3", "R4", "R5"],
    guardrail: "Hard Tail-Risk Firewall (Active at prob_severe > 15%)",
    targetReturn: "+2.80% ~ +3.50% / yr",
    maxDrawdown: "< -1.00%",
    holdings: [
      { ticker: "601997", name: "Bank of Guiyang", weight: "25.1%", tier: "R1" },
      { ticker: "600036", name: "China Merchants Bank", weight: "24.8%", tier: "R1" },
      { ticker: "600519", name: "Kweichow Moutai", weight: "25.0%", tier: "R1" },
      { ticker: "000001", name: "Ping An Bank", weight: "25.1%", tier: "R1" },
    ],
    hash: "0x473d7f5a2b9cbaddb18f2ace4341e6f653138e22",
  },
  {
    id: "C3",
    name: "C3 · Balanced Wealth",
    chinese: "稳健型 (Balanced Growth)",
    archetype: "Private Wealth & Multi-Asset Funds",
    allowedTier: "R1 to R3 (Warnings on R4)",
    forbiddenTiers: ["R5 (Severe Krach)"],
    guardrail: "Severe Risk Exclusion (Auto-drops prob_severe > 35%)",
    targetReturn: "+7.20% ~ +9.50% / yr",
    maxDrawdown: "< -4.50%",
    holdings: [
      { ticker: "300750", name: "CATL CleanTech", weight: "22.4%", tier: "R2" },
      { ticker: "002594", name: "BYD EV Mobility", weight: "21.8%", tier: "R3" },
      { ticker: "600519", name: "Kweichow Moutai", weight: "20.5%", tier: "R1" },
      { ticker: "600036", name: "China Merchants Bank", weight: "18.2%", tier: "R1" },
      { ticker: "300059", name: "East Money FinTech", weight: "17.1%", tier: "R3" },
    ],
    hash: "0x8f19c3021a4bc89e0234ac9188231fa719b402e",
  },
  {
    id: "C5",
    name: "C5 · Aggressive Alpha",
    chinese: "激进型 (Quant Arbitrage)",
    archetype: "Quantitative Hedge Funds & Family Offices",
    allowedTier: "Full Spectrum (R1 to R5)",
    forbiddenTiers: ["None (Unrestricted)"],
    guardrail: "Max Information Ratio & Long/Short Hedging",
    targetReturn: "+14.50% ~ +18.20% / yr",
    maxDrawdown: "< -9.50%",
    holdings: [
      { ticker: "688981", name: "SMIC Semiconductors", weight: "28.5%", tier: "R4" },
      { ticker: "300750", name: "CATL Lithium", weight: "26.2%", tier: "R2" },
      { ticker: "002594", name: "BYD Auto Battery", weight: "23.8%", tier: "R3" },
      { ticker: "688566", name: "Solar Dynamic Hedge", weight: "21.5%", tier: "R5" },
    ],
    hash: "0xc9481b7e0129a8f4c661bb109283719937a1f2",
  },
];

interface LandingProps {
  onNavigateApp: (options?: { openAssessment?: boolean; targetProfile?: string }) => void;
}

export default function LandingPage({ onNavigateApp }: LandingProps) {
  const [selectedStock, setSelectedStock] = useState<ShowcaseStock>(SHOWCASE_STOCKS[0]);
  const [hoveredMiniStock, setHoveredMiniStock] = useState<MiniStock>(MINI_STOCKS[0]);
  const [activeProfileTab, setActiveProfileTab] = useState<string>("C3");
  const [quadrantFilter, setQuadrantFilter] = useState<string>("All");

  const [highlightWorkstation, setHighlightWorkstation] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isButtonPulsing, setIsButtonPulsing] = useState(false);

  const currentProfile = CSRC_PROFILES.find((p) => p.id === activeProfileTab) || CSRC_PROFILES[1];

  const handleScrollToWorkstation = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsButtonPulsing(true);
    setTimeout(() => setIsButtonPulsing(false), 900);

    const element = document.getElementById("workstation");
    if (!element) return;

    // Trigger visual scan line and aura
    setHighlightWorkstation(true);
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1600);
    setTimeout(() => setHighlightWorkstation(false), 3400);

    // High-precision smooth cubic-bezier scroll
    const navOffset = 90;
    const targetY = Math.max(0, element.getBoundingClientRect().top + window.scrollY - navOffset);
    const startY = window.scrollY;
    const diff = targetY - startY;

    if (Math.abs(diff) < 5) return;

    const duration = 750;
    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + diff * easeInOutCubic(progress));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#05070A] text-neutral-100 font-sans selection:bg-emerald-500/25 overflow-x-hidden">
      {/* Ambient background with refined low-noise WebGL gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
        <Grainient
          color1="#05070A"
          color2="#042018"
          color3="#071421"
          timeSpeed={0.10}
          warpSpeed={1.0}
          noiseScale={1.8}
        />
      </div>

      {/* Cyber-FinTech Grid Overlay */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col w-full h-full">
        <Navbar onLaunch={() => onNavigateApp({ openAssessment: true })} />

        <main className="flex-1 flex flex-col gap-24 md:gap-36 pb-32">
          {/* ─── HERO: PRESTIGIOUS QUANTITATIVE ADVISORY COCKPIT ─── */}
          <section className="px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center pt-28 md:pt-36 w-full">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col items-center w-full"
            >
              {/* Main Headline with 1-word non-breaking TextType */}
              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-black tracking-tight text-white mb-8 leading-[1.08] max-w-5xl text-center"
              >
                <span>Predict Market Moves.</span>
                <br />
                <span>Prove Every Decision.</span>
                <br />
                <span className="text-emerald-400 drop-shadow-[0_0_35px_rgba(52,211,153,0.35)] whitespace-nowrap inline-block">
                  <TextType
                    as="span"
                    text={[
                      "Explainable.",
                      "Audited.",
                      "Compliant.",
                      "Deterministic.",
                    ]}
                    typingSpeed={60}
                    pauseDuration={2200}
                    deletingSpeed={35}
                    deleteMode="backspace"
                    typeEffect="none"
                    cursorStyle="bar"
                    cursorColor="#34d399"
                    showCursor
                    textColors={["#34d399", "#2dd4bf", "#38bdf8", "#34d399"]}
                    className="font-black whitespace-nowrap"
                  />
                </span>
              </motion.h1>

              {/* Value Proposition Subtitle */}
              <motion.p
                variants={fadeInUp}
                className="text-base sm:text-lg md:text-xl text-neutral-200 max-w-3xl mx-auto mb-10 leading-relaxed font-normal text-balance"
              >
                The first zero-black-box quant advisory platform for China A-Shares. Generating <span className="text-emerald-400 font-semibold">+12.06% net return (+3.79% alpha)</span> with deterministic TreeSHAP attribution and immutable <span className="text-cyan-400 font-mono font-semibold">FISCO BCOS</span> blockchain consensus.
              </motion.p>

              {/* Primary Call to Actions */}
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
                <button
                  onClick={() => onNavigateApp({ openAssessment: true })}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 text-black font-extrabold rounded-2xl text-sm hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-emerald-500/30 transition-all flex items-center gap-3 group cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-black animate-pulse" />
                  <span>Launch Cockpit (KYC Assessment)</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <motion.button
                  id="btn-explore-workstation"
                  onClick={handleScrollToWorkstation}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative px-6 py-4 rounded-2xl border border-white/10 bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-300 hover:text-white text-sm font-medium transition-all backdrop-blur-md flex items-center gap-2.5 group cursor-pointer shadow-lg hover:shadow-emerald-500/15 overflow-hidden"
                >
                  {/* Expanding click pulse ripple */}
                  {isButtonPulsing && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0.7 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className="absolute inset-0 bg-emerald-400/30 rounded-2xl pointer-events-none"
                    />
                  )}
                  <motion.div
                    animate={isButtonPulsing ? { rotate: 360 } : {}}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Compass className="w-4 h-4 text-neutral-400 group-hover:text-emerald-400 group-hover:rotate-45 transition-all duration-300" />
                  </motion.div>
                  <span>Explore Live Workstation</span>
                  <motion.span
                    animate={isButtonPulsing ? { y: [0, 4, 0] } : {}}
                    transition={{ duration: 0.4, repeat: isButtonPulsing ? 2 : 0 }}
                    className="text-emerald-400 group-hover:translate-y-1 transition-transform inline-block"
                  >
                    ↓
                  </motion.span>
                </motion.button>
              </motion.div>

              {/* ─── LIVE COCKPIT WORKSTATION MOCKUP (THE INSTITUTIONAL WOW FACTOR) ─── */}
              <motion.div
                id="workstation"
                variants={fadeInUp}
                className={`w-full max-w-5xl rounded-3xl bg-neutral-950/90 border p-4 sm:p-6 md:p-8 backdrop-blur-2xl relative overflow-hidden text-left mb-12 transition-all duration-700 ${
                  highlightWorkstation
                    ? "border-emerald-400/80 shadow-[0_0_80px_rgba(52,211,153,0.35),0_25px_70px_rgba(0,0,0,0.9)] scale-[1.01]"
                    : "border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.8)] scale-100"
                }`}
              >
                {/* Laser Scanning Beam upon activation */}
                {isScanning && (
                  <motion.div
                    key="scanner-beam"
                    initial={{ top: "0%", opacity: 0 }}
                    animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 1.4, ease: "easeInOut" }}
                    className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#34d399,0_0_8px_#22d3ee] z-30 pointer-events-none"
                  />
                )}

                {/* Glowing Aura Accent */}
                <div className={`absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${highlightWorkstation ? 'bg-emerald-500/35' : 'bg-emerald-500/15'}`} />
                <div className={`absolute -bottom-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${highlightWorkstation ? 'bg-cyan-500/35' : 'bg-cyan-500/15'}`} />

                {/* Workstation Header Bar */}
                <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      ADASTRA-TERMINAL // CHINA A-SHARES QUANT ENGINE
                    </span>
                    {highlightWorkstation && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.3)] animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        RADAR ENGAGED
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      NODE: SHENZHEN-SZ-01
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      TREESHAP: 76μs
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                      CSRC SENTINEL: ARMED
                    </span>
                  </div>
                </div>

                {/* Workstation Grid: Topology Canvas & Live Attributions */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-stretch">
                  {/* Left (7 Cols): 2D Market Scatter Topology Preview */}
                  <div className="lg:col-span-7 flex flex-col p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-white/5 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          2D Market Topology (China A-Shares)
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400">
                        Hover dots to inspect
                      </span>
                    </div>

                    {/* Quadrant Quick Filters */}
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      {["All", "Opportunity", "Speculative", "Defensive", "Avoid"].map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuadrantFilter(q)}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            quadrantFilter === q
                              ? "bg-emerald-500 text-black font-bold"
                              : "bg-white/5 text-neutral-400 hover:text-white"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>

                    {/* Interactive Scatter Plane */}
                    <div className="relative w-full h-64 sm:h-72 bg-[#090b10] border border-white/5 rounded-xl overflow-hidden p-3 select-none">
                      {/* Quadrant Background Zones */}
                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-20 pointer-events-none">
                        <div className="border-r border-b border-emerald-500/40 bg-emerald-500/5 flex items-start p-2">
                          <span className="text-[9px] font-mono font-bold text-emerald-300">OPPORTUNITY (ALPHA)</span>
                        </div>
                        <div className="border-b border-cyan-500/40 bg-cyan-500/5 flex items-start justify-end p-2">
                          <span className="text-[9px] font-mono font-bold text-cyan-300">SPECULATIVE (MOMENTUM)</span>
                        </div>
                        <div className="border-r border-amber-500/40 bg-amber-500/5 flex items-end p-2">
                          <span className="text-[9px] font-mono font-bold text-amber-300">DEFENSIVE (PRESERVE)</span>
                        </div>
                        <div className="bg-rose-500/5 flex items-end justify-end p-2">
                          <span className="text-[9px] font-mono font-bold text-rose-400">AVOID (KRACH TAIL)</span>
                        </div>
                      </div>

                      {/* Axis Markers */}
                      <div className="absolute left-2 bottom-1 text-[9px] font-mono text-neutral-400 font-medium">
                        Risk (Z-Score) →
                      </div>
                      <div className="absolute left-1 top-2 text-[9px] font-mono text-neutral-400 font-medium">
                        ↑ Expected Return (Z-Score)
                      </div>

                      {/* Interactive Stock Dots */}
                      {MINI_STOCKS.filter(
                        (s) => quadrantFilter === "All" || s.quadrant === quadrantFilter
                      ).map((stock) => {
                        const isHovered = hoveredMiniStock.code === stock.code;
                        const isOpportunity = stock.quadrant === "Opportunity";

                        return (
                          <div
                            key={stock.code}
                            onMouseEnter={() => setHoveredMiniStock(stock)}
                            onClick={() => setHoveredMiniStock(stock)}
                            style={{ left: `${stock.x}%`, top: `${stock.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                          >
                            {isOpportunity && (
                              <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-ping pointer-events-none" />
                            )}
                            <div
                              className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center ${
                                isHovered
                                  ? "scale-150 border-white bg-white shadow-lg shadow-white/50 z-20"
                                  : stock.quadrant === "Opportunity"
                                  ? "border-emerald-400 bg-emerald-400/80 shadow-md shadow-emerald-500/50"
                                  : stock.quadrant === "Speculative"
                                  ? "border-cyan-400 bg-cyan-400/80 shadow-md shadow-cyan-500/50"
                                  : stock.quadrant === "Defensive"
                                  ? "border-amber-400 bg-amber-400/80 shadow-md shadow-amber-500/50"
                                  : "border-rose-400 bg-rose-400/80 shadow-md shadow-rose-500/50"
                              }`}
                            />
                            {/* Stock Label */}
                            <span
                              className={`absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono px-1 rounded transition-opacity ${
                                isHovered
                                  ? "bg-neutral-800 text-white font-bold opacity-100 z-30"
                                  : "text-neutral-400 opacity-60 group-hover:opacity-100"
                              }`}
                            >
                              {stock.code}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                      <span>Live Snapshot: 1,744 Active A-Shares</span>
                      <span className="text-emerald-400 font-semibold">
                        Selected: {hoveredMiniStock.name} ({hoveredMiniStock.code})
                      </span>
                    </div>
                  </div>

                  {/* Right (5 Cols): Real-time TreeSHAP Vector & CSRC Audit Stamp */}
                  <div className="lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-white/5 gap-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div>
                          <span className="text-[10px] font-mono text-neutral-400 block uppercase">
                            Active Asset Inspection
                          </span>
                          <h4 className="text-base font-bold text-white flex items-center gap-2">
                            <span>{hoveredMiniStock.chinese}</span>
                            <span className="text-xs font-mono text-neutral-400 font-normal">
                              {hoveredMiniStock.code}
                            </span>
                          </h4>
                        </div>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            hoveredMiniStock.tier === "R1"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                              : hoveredMiniStock.tier === "R2"
                              ? "bg-teal-500/10 text-teal-300 border border-teal-500/30"
                              : hoveredMiniStock.tier === "R4"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          CSRC {hoveredMiniStock.tier}
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                          <span className="text-[10px] text-neutral-500 block">AI EXP. RETURN</span>
                          <span className="text-sm font-bold text-emerald-400">{hoveredMiniStock.ret}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                          <span className="text-[10px] text-neutral-500 block">IDIOSYNCRATIC VOL</span>
                          <span className="text-sm font-bold text-white">{hoveredMiniStock.risk}</span>
                        </div>
                      </div>

                      {/* TreeSHAP Mini Decomposition */}
                      <div className="flex flex-col gap-2 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-neutral-400">TreeSHAP Factor Driver</span>
                          <span className="text-emerald-400 font-semibold">{hoveredMiniStock.shapHighlight}</span>
                        </div>
                        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full w-[75%]" />
                        </div>
                      </div>

                      {/* CSRC Regulatory Compliance Badge */}
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-300 font-semibold mb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>CSRC Suitability Match</span>
                        </div>
                        <p className="text-[11px] text-neutral-300 leading-snug">
                          {hoveredMiniStock.tier === "R5"
                            ? "CRITICAL WARNING: Auto-excluded from C1/C2 accounts via Kahneman-Tversky Sentinel."
                            : "Approved for balanced client mandates under CSRC Rule 2026/08."}
                        </p>
                      </div>
                    </div>

                    {/* Immutable Blockchain Anchor */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                      <span className="flex items-center gap-1 text-cyan-300">
                        <Lock className="w-3 h-3 text-cyan-400" />
                        FISCO BCOS Sealed
                      </span>
                      <button
                        onClick={() => onNavigateApp({ openAssessment: true })}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline flex items-center gap-1"
                      >
                        Open in Full Cockpit →
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Refined Institutional Metric Bar */}
              <motion.div
                variants={fadeInUp}
                className="w-full grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-4"
              >
                <div className="flex flex-col p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-left">
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">Annual Net Return</span>
                  <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">+12.06%</span>
                  <span className="text-[11px] text-neutral-400 mt-1">2023 Out-of-Sample Backtest</span>
                </div>

                <div className="flex flex-col p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-left">
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">Strategy Sharpe</span>
                  <span className="text-3xl font-extrabold text-white font-mono tracking-tight">1.03</span>
                  <span className="text-[11px] text-neutral-400 mt-1">vs 0.69 Universe Benchmark</span>
                </div>

                <div className="flex flex-col p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-left">
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">Sample Universe</span>
                  <span className="text-3xl font-extrabold text-white font-mono tracking-tight">35,085</span>
                  <span className="text-[11px] text-neutral-400 mt-1">Empirical A-Share Stock-Months</span>
                </div>

                <div className="flex flex-col p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-left">
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">Audit Latency</span>
                  <span className="text-3xl font-extrabold text-cyan-300 font-mono tracking-tight">&lt; 100μs</span>
                  <span className="text-[11px] text-neutral-400 mt-1">Deterministic TreeSHAP Speed</span>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* ─── INSTITUTIONAL TRUST & CONSORTIUM CREDIBILITY BAR ─── */}
          <section className="px-6 md:px-12 max-w-6xl mx-auto w-full">
            <div className="py-6 px-8 rounded-2xl bg-white/[0.015] border border-white/10 flex flex-wrap items-center justify-between gap-6 backdrop-blur-md">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest font-semibold">
                FINTECHATHON 2026 CONSORTIUM ECOSYSTEM:
              </span>
              <div className="flex flex-wrap items-center gap-6 sm:gap-10 text-xs font-mono text-neutral-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-semibold text-white">WeBank (微众银行)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>FISCO BCOS Blockchain</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                  <span>CSRC 中国证监会 Suitability</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>China A-Shares Market Data</span>
                </div>
              </div>
            </div>
          </section>

          {/* ─── "ONE LIVE THING": INTERACTIVE CSRC SUITABILITY SIMULATOR ─── */}
          <section className="px-6 md:px-12 max-w-6xl mx-auto w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="flex flex-col gap-8 p-8 md:p-12 rounded-3xl bg-neutral-950/80 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-400 uppercase tracking-widest mb-3">
                    <ShieldCheck className="w-4 h-4" />
                    <span>One Live Thing · Interactive Regulatory Sandbox</span>
                  </motion.div>
                  <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                    Simulate Investor Suitability Live.
                  </motion.h2>
                </div>
                <motion.p variants={fadeInUp} className="text-xs md:text-sm text-neutral-400 max-w-md">
                  Select a regulatory risk tier to see how Adastra dynamically shifts asset ceilings, quarantines tail-risk assets, and prepares a cryptographic basket.
                </motion.p>
              </div>

              {/* 3 Interactive Tabs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CSRC_PROFILES.map((p) => {
                  const isActive = activeProfileTab === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveProfileTab(p.id)}
                      className={`p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isActive
                          ? "bg-neutral-800/90 border-emerald-500/60 shadow-xl shadow-emerald-950/50"
                          : "bg-white/[0.02] border-white/5 hover:border-white/20 text-neutral-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white">{p.name}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            p.id === "C1"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : p.id === "C3"
                              ? "bg-teal-500/10 text-teal-300 border border-teal-500/20"
                              : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                          }`}
                        >
                          {p.allowedTier}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-300">{p.chinese}</span>
                      <span className="text-[11px] text-neutral-500 font-light">{p.archetype}</span>
                    </button>
                  );
                })}
              </div>

              {/* Simulator Output Box */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentProfile.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-2xl bg-neutral-900/60 border border-white/5"
                >
                  {/* Left (6 Cols): Policy & Tail-Risk Firewalls */}
                  <div className="lg:col-span-6 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                          Regulatory Envelope
                        </span>
                        <span className="text-xs font-mono text-emerald-400 font-semibold">
                          Target: {currentProfile.targetReturn}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-neutral-400">Max Permitted Product Tier</span>
                          <span className="text-white font-bold">{currentProfile.allowedTier}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-neutral-400">Excluded Product Tiers</span>
                          <span className="text-rose-400 font-semibold">{currentProfile.forbiddenTiers.join(", ")}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-neutral-400">Drawdown Circuit Breaker</span>
                          <span className="text-emerald-400 font-semibold">{currentProfile.maxDrawdown}</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs">
                        <span className="text-emerald-300 font-semibold block mb-0.5">
                          Kahneman-Tversky Tail-Risk Guardrail (λ = 2.25)
                        </span>
                        <p className="text-[11px] text-neutral-300 leading-relaxed">
                          {currentProfile.guardrail}. Automatically rebalances capital into solvency anchors to prevent severe retail loss events.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateApp({ openAssessment: true, targetProfile: currentProfile.id })}
                      className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      <span>TEST THIS MANDATE IN COCKPIT ({currentProfile.id})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Right (6 Cols): Holdings Allocation Preview */}
                  <div className="lg:col-span-6 flex flex-col justify-between gap-3 p-4 rounded-xl bg-black/40 border border-white/5">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-3">
                        <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                          Programmatic Inverse-Vol Basket
                        </span>
                        <span className="text-[11px] font-mono text-cyan-300">
                          {currentProfile.holdings.length} Assets Selected
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {currentProfile.holdings.map((h, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold">{h.ticker}</span>
                              <span className="text-neutral-300 font-sans text-xs">{h.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-neutral-400">{h.weight}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-neutral-300 border border-white/10">
                                {h.tier}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                      <span className="truncate max-w-[280px]">Audit: {currentProfile.hash}</span>
                      <span className="text-cyan-400">FISCO BCOS Ready</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </section>

          {/* ─── THE 3-STEP QUANTITATIVE & BLOCKCHAIN PIPELINE ─── */}
          <section id="architecture" className="px-6 md:px-12 max-w-6xl mx-auto w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="flex flex-col gap-10"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-400 uppercase tracking-widest mb-3">
                    <Cpu className="w-4 h-4" />
                    <span>Scientific Pipeline</span>
                  </motion.div>
                  <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                    From Unstructured News to Blockchain Audit.
                  </motion.h2>
                </div>
                <motion.p variants={fadeInUp} className="text-sm text-neutral-400 max-w-md">
                  Replacing opaque generative black-boxes with peer-reviewed financial econometrics and immutable cryptographic state logs.
                </motion.p>
              </div>

              {/* 3 Step Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <motion.div
                  variants={fadeInUp}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between backdrop-blur-md relative group shadow-xl"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black font-mono text-emerald-400">01</span>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        Didisheim et al. (RFS)
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Orthogonal News Residuals
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed font-light">
                      Financial articles often duplicate quarterly disclosures. We project 2.1 GB of Chinese news transformer embeddings orthogonally onto 100+ accounting factors via Ridge regression, extracting pure unpriced news surprises uncaptured by balance sheets.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span>Cross-Sectional Ridge</span>
                    <span className="text-emerald-400 font-semibold">+1.306%/mo Spread</span>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div
                  variants={fadeInUp}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between backdrop-blur-md relative group shadow-xl"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black font-mono text-cyan-400">02</span>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                        Lundberg &amp; Lee (Nature)
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Deterministic TreeSHAP Proof
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed font-light">
                      Eliminate hallucination risks. For every asset, Adastra solves exact additive Shapley values from decision tree leaf paths in under 100 microseconds. Every single basis point of risk and return is mathematically proven.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span>Exact Leaf Attribution</span>
                    <span className="text-cyan-400 font-semibold">Zero Hallucinations</span>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div
                  variants={fadeInUp}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between backdrop-blur-md relative group shadow-xl"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black font-mono text-indigo-400">03</span>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                        WeBank Consortium
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                      FISCO BCOS Blockchain Anchor
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed font-light">
                      Every investor profiling record, asset valuation vector, and rebalancing transaction generates an immutable SHA-256 state seal, ready for native anchoring into WeBank's open-source FISCO BCOS consortium blockchain.
                    </p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-400">
                    <span>Tamper-Evident SHA-256</span>
                    <span className="text-indigo-400 font-semibold">Auditable Ledger</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* ─── INTERACTIVE MODEL EXPLORER (SHOWCASE STOCKS) ─── */}
          <section id="showcase" className="px-6 md:px-12 max-w-6xl mx-auto w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="flex flex-col gap-8"
            >
              <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-400 uppercase tracking-widest">
                  <BarChart3 className="w-4 h-4" />
                  <span>Interactive Model Explorer</span>
                </motion.div>
                <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                  Inspect Real Factor Attributions.
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-sm md:text-base text-neutral-300 font-light">
                  Select a representative China A-Share to see how Adastra decomposes multi-factor risk, scores regulatory suitability, and generates an auditable cryptographic seal in real time.
                </motion.p>
              </div>

              {/* Workstation Frame */}
              <motion.div
                variants={fadeInUp}
                className="w-full rounded-3xl bg-neutral-950/90 border border-white/10 p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden"
              >
                {/* Stock Selector Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {SHOWCASE_STOCKS.map((stock) => {
                    const isActive = selectedStock.ticker === stock.ticker;
                    return (
                      <button
                        key={stock.ticker}
                        onClick={() => setSelectedStock(stock)}
                        className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                          isActive
                            ? "bg-neutral-800/90 border-emerald-500/50 shadow-lg shadow-emerald-950/50"
                            : "bg-white/[0.02] border-white/5 hover:border-white/20 text-neutral-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-semibold text-white">{stock.ticker}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              stock.tier === "R1"
                                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                : stock.tier === "R2"
                                ? "bg-teal-500/10 text-teal-300 border border-teal-500/20"
                                : stock.tier === "R4"
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            }`}
                          >
                            {stock.tier}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-white block truncate">{stock.name}</span>
                        <span className="text-xs text-neutral-400 block">{stock.chinese}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Workstation Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left 5 Cols: Overview & Synthesis */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">Security Profile</span>
                          <h4 className="text-xl font-bold text-white">{selectedStock.name} ({selectedStock.ticker})</h4>
                        </div>
                        <span className="text-xs text-neutral-400 font-medium px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/5">
                          {selectedStock.sector}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 font-mono">
                        <div>
                          <span className="text-[11px] text-neutral-400 block uppercase">Expected Return</span>
                          <span className={`text-lg font-bold ${selectedStock.expectedReturn.startsWith("+") ? "text-emerald-400" : "text-rose-400"}`}>
                            {selectedStock.expectedReturn}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-neutral-400 block uppercase">Tail Risk Prob</span>
                          <span className={`text-lg font-bold ${parseFloat(selectedStock.probCrash) > 20 ? "text-rose-400" : "text-neutral-200"}`}>
                            {selectedStock.probCrash}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5">
                        <span className="text-[11px] text-neutral-400 block font-mono uppercase mb-1">CSRC Suitability Classification</span>
                        <span className="text-xs font-semibold text-white block">{selectedStock.tierLabel}</span>
                      </div>
                    </div>

                    {/* AI Advisory Synthesis */}
                    <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-neutral-200">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-2">
                        Institutional Advisory Synthesis
                      </span>
                      <p className="text-xs leading-relaxed font-light text-neutral-300">
                        "{selectedStock.summary}"
                      </p>
                    </div>

                    {/* Cryptographic Hash */}
                    <div className="p-4 rounded-xl bg-black/50 border border-white/5 flex items-center gap-3">
                      <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[10px] font-mono text-neutral-400 block uppercase">FISCO BCOS Verification Hash</span>
                        <span className="text-xs font-mono text-cyan-300 truncate block">{selectedStock.auditHash}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right 7 Cols: Exact TreeSHAP Decomposition */}
                  <div className="lg:col-span-7 flex flex-col gap-5 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-mono text-white font-semibold uppercase tracking-wider">
                          TreeSHAP Factor Contribution
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400">Additive Basis (Δ Alpha)</span>
                    </div>

                    <div className="flex flex-col gap-4">
                      {selectedStock.features.map((feat, idx) => {
                        const val = parseFloat(feat.impact);
                        const pct = Math.min(Math.abs(val) * 110, 100);

                        return (
                          <div key={idx} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-neutral-300 font-medium">{feat.name}</span>
                              <span
                                className={`font-mono font-bold text-xs ${
                                  feat.positive ? "text-emerald-400" : "text-rose-400"
                                }`}
                              >
                                {feat.impact}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden flex">
                              <motion.div
                                key={`${selectedStock.ticker}-${idx}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, delay: idx * 0.06, ease: "easeOut" }}
                                className={`h-full rounded-full ${
                                  feat.positive
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                    : "bg-gradient-to-r from-rose-500 to-red-400"
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400 font-mono">
                      <span>Exact Leaf Path Attribution</span>
                      <span className="text-emerald-400">100% Deterministic Guarantee</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* ─── EMPIRICAL VALIDATION & OUT-OF-SAMPLE 2023 ALPHA ─── */}
          <section id="alpha" className="px-6 md:px-12 max-w-6xl mx-auto w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="flex flex-col gap-6">
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-400 uppercase tracking-widest">
                  <BarChart3 className="w-4 h-4" />
                  <span>Empirical Validation</span>
                </motion.div>
                <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  +12.06% Net Return in tough market conditions.
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-neutral-300 leading-relaxed text-base font-light">
                  During 2023, while Chinese equity cap-weighted benchmarks struggled under macro pressures (CSI 300 dropped -11.38%), the Adastra Alpha Strategy delivered a <strong className="text-white font-semibold">+12.06% net cumulative return</strong> (+14.02% gross) compared to <strong className="text-neutral-400 font-semibold">+8.27%</strong> for the Equal-Weighted ML Universe benchmark, achieving a <strong className="text-emerald-400 font-semibold">+3.79% net alpha</strong>.
                </motion.p>

                <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-neutral-400 block font-mono">Sharpe Ratio</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">1.03</span>
                    <span className="text-[11px] text-neutral-400">vs 0.69 Benchmark</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-neutral-400 block font-mono">Max Drawdown</span>
                    <span className="text-2xl font-bold font-mono text-white">-4.12%</span>
                    <span className="text-[11px] text-emerald-400">Low Volatility</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-xs text-neutral-400 block font-mono">Consistency</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">9 / 12</span>
                    <span className="text-[11px] text-neutral-400">75% Positive Mos</span>
                  </div>
                </motion.div>
              </div>

              {/* Animated Performance Track Curve */}
              <motion.div
                variants={fadeInUp}
                className="w-full bg-neutral-950/80 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col shadow-2xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                  <span className="text-xs font-mono text-neutral-400 uppercase">2023 Out-of-Sample Performance</span>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Adastra (+9.42%)
                    </span>
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      <span className="w-2 h-2 rounded-full bg-neutral-500"></span> CSI Benchmark (+3.09%)
                    </span>
                  </div>
                </div>

                {/* SVG Curve */}
                <div className="h-60 w-full relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="strategyGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Benchmark Path */}
                    <path
                      d="M 0 150 Q 80 145, 140 148 T 260 135 T 400 125"
                      fill="none"
                      stroke="#4b5563"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />

                    {/* Strategy Area Fill */}
                    <path
                      d="M 0 150 Q 60 130, 120 100 T 240 70 T 340 50 T 400 30 L 400 180 L 0 180 Z"
                      fill="url(#strategyGlow)"
                    />

                    {/* Strategy Path with draw animation */}
                    <motion.path
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.6, ease: "easeOut" }}
                      d="M 0 150 Q 60 130, 120 100 T 240 70 T 340 50 T 400 30"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="3.5"
                    />
                  </svg>
                </div>

                {/* Bottom Card Summary */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span>Jan 2023 Baseline</span>
                  <span className="text-emerald-400 font-bold">+12.06% Net Return (+3.79% Alpha Over Benchmark)</span>
                  <span>Dec 2023 Close</span>
                </div>
              </motion.div>
            </motion.div>
          </section>

          {/* ─── INSTITUTIONAL COMPARISON: GENERIC AI VS ADASTRA ─── */}
          <section className="px-6 md:px-12 max-w-6xl mx-auto w-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={staggerContainer}
              className="flex flex-col gap-10 p-8 md:p-12 rounded-3xl bg-neutral-950/80 border border-white/10 shadow-2xl backdrop-blur-xl relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 text-xs font-mono font-medium text-emerald-400 uppercase tracking-widest mb-3">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Institutional Standard</span>
                  </motion.div>
                  <motion.h2 variants={fadeInUp} className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
                    Why Commercial Banks Choose Adastra.
                  </motion.h2>
                </div>
                <motion.p variants={fadeInUp} className="text-xs md:text-sm text-neutral-400 max-w-md">
                  Consumer LLMs expose wealth managers to regulatory penalties and hallucinated returns. Adastra is built on audited quantitative mathematics.
                </motion.p>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Generic Black Box */}
                <motion.div variants={fadeInUp} className="p-6 md:p-8 rounded-2xl bg-rose-950/10 border border-rose-500/20 flex flex-col gap-6">
                  <div className="flex items-center justify-between pb-3 border-b border-rose-500/10">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                      <XCircle className="w-4 h-4" />
                      <span>Generic Black-Box LLMs</span>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Unsuitable for Wealth
                    </span>
                  </div>

                  <div className="flex flex-col gap-5 text-xs text-neutral-300">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-white block font-semibold mb-1">Hallucinatory Fiction</strong>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                          Autoregressive next-token guessing cannot ingest 100+ accounting matrices or guarantee factual arithmetic in volatile markets.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-white block font-semibold mb-1">CSRC Suitability Blindness</strong>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                          Zero programmatic investor profiling. Prone to recommending speculative growth assets to conservative retirees.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-white block font-semibold mb-1">Opaque Attribution</strong>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                          Provides post-hoc storytelling rather than mathematical evidence, failing regulatory audit inspections.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Adastra Platform */}
                <motion.div variants={fadeInUp} className="p-6 md:p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col gap-6">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Adastra Quantitative Cockpit</span>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Bank-Grade Compliant
                    </span>
                  </div>

                  <div className="flex flex-col gap-5 text-xs text-neutral-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-white block font-semibold mb-1">Deterministic TreeSHAP Attribution</strong>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                          Every single score is computed directly from decision tree leaf paths in under 100 microseconds with exact additive proof.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-white block font-semibold mb-1">Automated CSRC Compliance Gate</strong>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                          Standardized 5-question psychometric profiling actively blocks unauthorized product risk tiers from conservative mandates.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="text-white block font-semibold mb-1">WeBank FISCO BCOS Audit Trail</strong>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                          Every investor evaluation and recommendation generates an immutable SHA-256 seal ready for consortium blockchain anchoring.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* ─── FINAL CTA SECTION ─── */}
          <section className="px-6 md:px-12 max-w-6xl mx-auto w-full py-6 text-center flex flex-col items-center relative">
            <div className="w-full p-10 md:p-16 rounded-3xl bg-gradient-to-b from-neutral-900/90 to-neutral-950 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6 max-w-2xl">
                Ready to Experience Explainable Quantitative Advisory?
              </h2>
              <p className="text-neutral-300 mb-10 max-w-xl mx-auto text-base font-light">
                Launch the live cockpit to complete your standardized CSRC investor suitability assessment and explore real-time TreeSHAP attributions across China A-Shares.
              </p>
              <button
                onClick={() => onNavigateApp({ openAssessment: true })}
                className="px-10 py-5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 text-black font-extrabold rounded-2xl text-base hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-emerald-500/30 transition-all flex items-center gap-3 cursor-pointer group"
              >
                <span>Launch Cockpit (KYC Assessment)</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </section>
        </main>

        {/* ─── INSTITUTIONAL FOOTER ─── */}
        <footer className="border-t border-white/10 pt-16 pb-12 px-6 md:px-12 bg-[#05070A]">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
              <div className="flex items-center gap-2 font-medium tracking-wide text-white">
                <span className="font-bold text-lg tracking-tight">Adastra</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Shenzhen International FinTech Competition (FinTechathon 2026) · WeBank Track. Quantitative AI and CSRC Suitability Cockpit.
              </p>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <span className="font-semibold text-white uppercase tracking-wider font-mono">Research</span>
              <a href="#architecture" className="text-neutral-400 hover:text-white transition-colors">Orthogonal News Residuals</a>
              <a href="#architecture" className="text-neutral-400 hover:text-white transition-colors">Deterministic TreeSHAP</a>
              <a href="#alpha" className="text-neutral-400 hover:text-white transition-colors">2023 Out-of-Sample Alpha</a>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <span className="font-semibold text-white uppercase tracking-wider font-mono">Cockpit</span>
              <button
                onClick={() => onNavigateApp({ openAssessment: true })}
                className="text-neutral-400 hover:text-white transition-colors text-left cursor-pointer"
              >
                Launch Cockpit (KYC Gate)
              </button>
              <a href="https://github.com/adrielakak/webank" target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                GitHub Repository
              </a>
              <a href="https://github.com/adrielakak/webank/blob/main/docs/SECURITY_REPORT.md" target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                Security Self-Assessment
              </a>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <span className="font-semibold text-white uppercase tracking-wider font-mono">Compliance &amp; Trust</span>
              <a href="#team" className="text-neutral-400 hover:text-white transition-colors">Team &amp; Mentorship</a>
              <a href="#legal" className="text-neutral-400 hover:text-white transition-colors">Terms &amp; Privacy Policy</a>
              <span className="text-neutral-400">CSRC Investor Protection Rules</span>
              <span className="text-neutral-400">FISCO BCOS Consortium Ready</span>
              <span className="text-neutral-400">MIT Open Source License</span>
            </div>
          </div>

          <div className="max-w-6xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
            <span>© 2026 Adastra (Team Adastra). All rights reserved.</span>
            <span>FinTechathon 2026 · Shenzhen International FinTech Competition</span>
          </div>

          <div className="max-w-6xl mx-auto pt-3 text-[11px] text-neutral-400 text-center sm:text-left">
            Developed by Adriel Kourlate, Dong Zixuan, Aadithyan Sajith kumar, Khushi Mistry · Advised by Prof. Halis Sak
          </div>
        </footer>
      </div>
    </div>
  );
}
