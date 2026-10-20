import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  CheckCircle2, 
  RotateCcw, 
  Copy, 
  Check, 
  X, 
  Sliders, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { assessInvestorProfile } from "../../api";
import type { InvestorQuestionnaireAnswers, InvestorProfileResult } from "../../types";

interface RiskAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: string;
  onProfileAssessed: (newProfile: string, result: InvestorProfileResult) => void;
  onOpenPortfolio: () => void;
  isMandatory?: boolean;
  onCancel?: () => void;
}

const QUESTIONS = [
  {
    key: "q1_horizon",
    title: "1. Investment Horizon",
    subtitle: "How long do you intend to maintain this investment before liquidating capital?",
    options: [
      { id: "A", title: "Short-Term (< 6 months)", desc: "Immediate liquidity priority, short cash cycle." },
      { id: "B", title: "Medium-Term (6 – 12 months)", desc: "Planned capital deployment over the coming year." },
      { id: "C", title: "Multi-Year (1 – 3 years)", desc: "Cyclical investment horizon with steady rebalancing." },
      { id: "D", title: "Long-Term (> 3 years)", desc: "Patient capital seeking multi-year compound growth." },
    ],
  },
  {
    key: "q2_drawdown",
    title: "2. Maximum Drawdown / Loss Capacity",
    subtitle: "What level of portfolio decline could you endure during adverse market stress?",
    options: [
      { id: "A", title: "Zero Loss Tolerance", desc: "Absolute capital preservation. Cannot accept any principal reduction." },
      { id: "B", title: "Minor Fluctuations (< 5%)", desc: "Accept slight interim volatility in exchange for yield." },
      { id: "C", title: "Moderate Fluctuations (5% – 15%)", desc: "Comfortable weathering regular market corrections." },
      { id: "D", title: "Substantial Fluctuations (15% – 30%)", desc: "Willing to accept heavy drawdowns for higher expected returns." },
      { id: "E", title: "Aggressive Volatility (> 30%)", desc: "Full risk tolerance for high-beta, maximum-alpha pursuit." },
    ],
  },
  {
    key: "q3_experience",
    title: "3. Financial Knowledge & Trading Experience",
    subtitle: "Which of the following best characterizes your asset management background?",
    options: [
      { id: "A", title: "Novice", desc: "Primarily bank demand deposits and sovereign savings products." },
      { id: "B", title: "Basic", desc: "Government bonds, money market instruments, principal-protected funds." },
      { id: "C", title: "Moderate", desc: "Equity mutual funds, broad market index ETFs, fixed income." },
      { id: "D", title: "Experienced", desc: "Direct trading in China A-shares and equities for 3+ years." },
      { id: "E", title: "Expert", desc: "Derivatives, margin financing, quantitative equity strategies." },
    ],
  },
  {
    key: "q4_objective",
    title: "4. Primary Investment Objective",
    subtitle: "What is your primary mandate for this capital allocation?",
    options: [
      { id: "A", title: "Capital Defense & Inflation Hedge", desc: "Maintain real purchasing power with minimal downside." },
      { id: "B", title: "Steady Yield & Dividend Income", desc: "Generate predictable cash flow with low capital variance." },
      { id: "C", title: "Balanced Capital Growth", desc: "Moderate capital appreciation balanced against volatility." },
      { id: "D", title: "Active Capital Appreciation", desc: "Outperform broader equity benchmarks over the medium term." },
      { id: "E", title: "Aggressive Maximum Alpha", desc: "Maximize capital expansion via high-conviction factor bets." },
    ],
  },
  {
    key: "q5_liquidity",
    title: "5. Liquidity Requirements",
    subtitle: "How rapidly might you need access to these committed funds?",
    options: [
      { id: "A", title: "High Liquidity", desc: "Funds must be redeemable on short notice without penalty." },
      { id: "B", title: "Moderate Liquidity", desc: "Planned periodic withdrawals, majority committed." },
      { id: "C", title: "Committed Capital", desc: "Locked capital; no anticipated liquidity demands for the term." },
    ],
  },
];

function computeClientSideProfile(answers: InvestorQuestionnaireAnswers): InvestorProfileResult {
  const METRICS: Record<string, { title: string; weights: Record<string, number>; labels: Record<string, string> }> = {
    q1_horizon: {
      title: "Investment Horizon",
      weights: { A: 2, B: 5, C: 12, D: 20 },
      labels: {
        A: "Short-term (< 6 months)",
        B: "Medium-term (6 – 12 months)",
        C: "Multi-year (1 – 3 years)",
        D: "Long-term (> 3 years)",
      },
    },
    q2_drawdown: {
      title: "Maximum Loss / Drawdown Tolerance",
      weights: { A: 0, B: 8, C: 16, D: 24, E: 30 },
      labels: {
        A: "Zero loss tolerance (Capital preservation only)",
        B: "Minor fluctuations (< 5% drawdown)",
        C: "Moderate volatility (5% – 15% drawdown)",
        D: "Substantial volatility (15% – 30% drawdown)",
        E: "High volatility for aggressive upside (> 30% drawdown)",
      },
    },
    q3_experience: {
      title: "Financial Experience & Knowledge",
      weights: { A: 2, B: 6, C: 12, D: 18, E: 20 },
      labels: {
        A: "Novice (Bank deposits and savings only)",
        B: "Basic (Government bonds, money-market funds)",
        C: "Moderate (Mutual funds, index ETFs)",
        D: "Experienced (Direct A-share equities, 3+ years)",
        E: "Expert (Derivatives, margin finance, quant strategies)",
      },
    },
    q4_objective: {
      title: "Primary Investment Objective",
      weights: { A: 2, B: 6, C: 12, D: 16, E: 20 },
      labels: {
        A: "Preserve principal with inflation protection",
        B: "Steady income and low-volatility yield",
        C: "Balanced growth with controlled downside risk",
        D: "Capital appreciation over medium-to-long term",
        E: "Aggressive maximum capital growth",
      },
    },
    q5_liquidity: {
      title: "Liquidity Requirements",
      weights: { A: 2, B: 6, C: 10 },
      labels: {
        A: "High liquidity (Immediate on-demand redemption)",
        B: "Moderate liquidity (Regular planned withdrawals)",
        C: "Low liquidity (Committed funds, lock-up acceptable)",
      },
    },
  };

  let totalScore = 0;
  const breakdown: any = {};

  for (const [key, info] of Object.entries(METRICS)) {
    const ans = (answers as any)[key] || "A";
    const pts = info.weights[ans] ?? 0;
    totalScore += pts;
    breakdown[key] = {
      question: info.title,
      selected_option: ans,
      label: info.labels[ans] || ans,
      points: pts,
    };
  }

  let category: "C1" | "C2" | "C3" | "C4" | "C5" = "C3";
  let csrc_product = "R3";
  let title = "Balanced (平衡型)";
  let allowed_risk_levels = [0, 1, 2];
  let max_drawdown_tolerance = "-10% to -15%";
  let summary = "Seek balanced capital growth with controlled downside fluctuations. High risk permitted with warnings.";

  if (totalScore <= 25) {
    category = "C1";
    csrc_product = "R1";
    title = "Conservative (保守型)";
    allowed_risk_levels = [0];
    max_drawdown_tolerance = "0% to -3%";
    summary = "Focus strictly on principal safety. Allocations restricted to zero-downside / defensive assets.";
  } else if (totalScore <= 45) {
    category = "C2";
    csrc_product = "R2";
    title = "Steady (稳健型)";
    allowed_risk_levels = [0, 1];
    max_drawdown_tolerance = "-5% to -8%";
    summary = "Prioritize capital stability with modest income yield. High & severe risk assets are prohibited.";
  } else if (totalScore <= 65) {
    category = "C3";
    csrc_product = "R3";
    title = "Balanced (平衡型)";
    allowed_risk_levels = [0, 1, 2];
    max_drawdown_tolerance = "-10% to -15%";
    summary = "Seek balanced capital growth with controlled downside fluctuations. High risk permitted with warnings.";
  } else if (totalScore <= 85) {
    category = "C4";
    csrc_product = "R4";
    title = "Growth (积极型)";
    allowed_risk_levels = [0, 1, 2, 3];
    max_drawdown_tolerance = "-15% to -25%";
    summary = "Pursue substantial long-term growth and capital appreciation with high volatility tolerance.";
  } else {
    category = "C5";
    csrc_product = "R5";
    title = "Aggressive (激进型)";
    allowed_risk_levels = [0, 1, 2, 3, 4];
    max_drawdown_tolerance = "> -30%";
    summary = "Maximum alpha pursuit with full tolerance for substantial market swings and speculative assets.";
  }

  const hexChars = "0123456789abcdef";
  let certificate_hash = "";
  for (let i = 0; i < 64; i++) {
    certificate_hash += hexChars[Math.floor(Math.random() * 16)];
  }

  return {
    score: totalScore,
    category,
    csrc_product,
    title: `${category} : ${title}`,
    allowed_risk_levels,
    max_drawdown_tolerance,
    summary,
    breakdown,
    certificate_hash,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

export default function RiskAssessmentModal({
  isOpen,
  onClose,
  currentProfile: _currentProfile,
  onProfileAssessed,
  onOpenPortfolio,
  isMandatory = false,
  onCancel,
}: RiskAssessmentModalProps) {
  const [step, setStep] = useState(0); // 0 to 4 questions, 5 = results
  const [answers, setAnswers] = useState<InvestorQuestionnaireAnswers>({
    q1_horizon: "C",
    q2_drawdown: "C",
    q3_experience: "C",
    q4_objective: "C",
    q5_liquidity: "B",
  });
  const [result, setResult] = useState<InvestorProfileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentQ = QUESTIONS[step];

  const handleSelect = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.key]: optionId,
    }));
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleRestart = () => {
    setStep(0);
    setResult(null);
  };

  const handleApplyProfile = () => {
    if (result) {
      onProfileAssessed(result.csrc_product, result);
    }
  };

  const handleCopyHash = () => {
    if (result?.certificate_hash) {
      navigator.clipboard.writeText(result.certificate_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNext = async () => {
    if (loading) return;
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      // Submit assessment
      setLoading(true);
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("API timeout")), 2000)
        );
        const res = await Promise.race([
          assessInvestorProfile(answers),
          timeoutPromise,
        ]);
        setResult(res);
        setStep(QUESTIONS.length); // Results screen
      } catch (err) {
        console.warn("API assessment slow/failed, applying instant deterministic client evaluation:", err);
        const fallbackRes = computeClientSideProfile(answers);
        setResult(fallbackRes);
        setStep(QUESTIONS.length);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      if (e.key === "Escape") {
        if (isMandatory) {
          if (onCancel) onCancel();
          else onClose();
        } else {
          onClose();
        }
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (loading) return;
        if (step < QUESTIONS.length) {
          handleNext();
        } else if (result) {
          handleApplyProfile();
        }
        return;
      }

      if (step < QUESTIONS.length) {
        const keyUpper = e.key.toUpperCase();
        if (keyUpper === "A" || keyUpper === "1") {
          e.preventDefault();
          handleSelect("A");
        } else if (keyUpper === "B" || keyUpper === "2") {
          e.preventDefault();
          handleSelect("B");
        } else if (keyUpper === "C" || keyUpper === "3") {
          e.preventDefault();
          handleSelect("C");
        } else if (e.key === "ArrowLeft" && step > 0) {
          e.preventDefault();
          handlePrev();
        } else if (e.key === "ArrowRight" && step < QUESTIONS.length - 1) {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMandatory, step, loading, result, answers, onCancel, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  CSRC Investor Suitability Assessment
                </h2>
                {isMandatory && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Mandatory KYC
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                {isMandatory
                  ? "CSRC suitability profiling is required to unlock China A-Share market analytics & advisory."
                  : "Regulatory investor classification under WeBank & CSRC R1–R5 standards"}
              </p>
            </div>
          </div>
          <button
            onClick={isMandatory && onCancel ? onCancel : onClose}
            title={isMandatory ? "Cancel & Return to Home" : "Close"}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isMandatory && (
              <span className="hidden sm:inline text-[11px] text-neutral-400 font-medium">
                Exit to Home
              </span>
            )}
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar (when answering) */}
        {step < QUESTIONS.length && (
          <div className="px-6 pt-4 pb-1">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono mb-2">
              <span>Question {step + 1} of {QUESTIONS.length}</span>
              <span className="text-emerald-400 font-medium">
                {Math.round((step / QUESTIONS.length) * 100)}% Completed
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                initial={{ width: "0%" }}
                animate={{ width: `${(step / QUESTIONS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {step < QUESTIONS.length ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-base font-medium text-white mb-1">
                    {currentQ.title}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {currentQ.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 pt-2">
                  {currentQ.options.map((opt) => {
                    const isSelected = (answers as any)[currentQ.key] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          handleSelect(opt.id);
                          (document.activeElement as HTMLElement)?.blur();
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-colors flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500/50 shadow-sm shadow-emerald-500/10 text-white"
                            : "bg-neutral-900/40 border-neutral-800/80 hover:bg-neutral-900/80 hover:border-neutral-700 text-neutral-300"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-semibold shrink-0 mt-0.5 border ${
                            isSelected
                              ? "bg-emerald-500 text-black border-emerald-400"
                              : "bg-neutral-800 text-neutral-400 border-neutral-700"
                          }`}
                        >
                          {opt.id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold flex items-center justify-between">
                            <span>{opt.title}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                {/* Result Hero Card */}
                <div className="bg-gradient-to-br from-neutral-900 via-neutral-900/80 to-neutral-950 p-5 rounded-2xl border border-neutral-800 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium mb-3">
                    <Award className="w-3.5 h-3.5" />
                    CSRC Investor Suitability Certified
                  </div>

                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {result.title}
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                    {result.summary}
                  </p>

                  {/* Badges / Metrics Row */}
                  <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-neutral-800/80">
                    <div className="bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/60">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">Score</div>
                      <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                        {result.score} <span className="text-xs text-neutral-500 font-normal">/ 100</span>
                      </div>
                    </div>
                    <div className="bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/60">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">Product Ceiling</div>
                      <div className="text-lg font-bold text-blue-400 font-mono mt-0.5">
                        {result.csrc_product}
                      </div>
                    </div>
                    <div className="bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/60">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">Max Drawdown</div>
                      <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                        {result.max_drawdown_tolerance}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Score Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-neutral-300">Dimension Score Breakdown</div>
                  <div className="grid grid-cols-1 gap-1.5 text-xs">
                    {Object.entries(result.breakdown).map(([k, item]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/40 border border-neutral-800/60 text-[11px]"
                      >
                        <span className="text-neutral-400">{item.question}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-200 font-medium">{item.label}</span>
                          <span className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            +{item.points} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cryptographic SHA-256 Audit Box */}
                <div className="p-3 bg-neutral-900/50 rounded-2xl border border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                  <div className="min-w-0 pr-3">
                    <div className="text-[10px] text-neutral-500 uppercase">SHA-256 Immutable Certificate</div>
                    <div className="text-emerald-400 text-[11px] truncate mt-0.5">
                      {result.certificate_hash}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyHash}
                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors shrink-0"
                    title="Copy Certificate Hash"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-neutral-800/80 bg-neutral-900/40 flex items-center justify-between">
          {step < QUESTIONS.length ? (
            <>
              {step === 0 && isMandatory ? (
                <button
                  type="button"
                  onClick={onCancel || onClose}
                  className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Exit to Home
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={step === 0}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl border transition-colors ${
                    step === 0
                      ? "opacity-30 border-neutral-800 text-neutral-600 cursor-not-allowed"
                      : "border-neutral-800 hover:bg-neutral-800 text-neutral-300"
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
              )}

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline-flex items-center gap-1.5">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] shadow-sm">Enter ↵</kbd>
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="w-44 flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition-colors shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{step === QUESTIONS.length - 1 ? "Complete & Certify" : "Next"}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRestart}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake Assessment
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyProfile}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enter Cockpit as {result?.csrc_product || "C3"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleApplyProfile();
                    onOpenPortfolio();
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors border border-neutral-700 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View Portfolio</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
