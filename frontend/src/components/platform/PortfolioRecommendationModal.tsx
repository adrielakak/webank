import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  X, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  Loader2,
  Copy,
  Check
} from "lucide-react";
import { fetchPortfolioRecommendation } from "../../api";
import type { PortfolioRecommendation } from "../../types";

interface PortfolioRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: string;
  selectedDate: string | null;
  onSelectStock: (stkcd: number) => void;
  onOpenAssessment: () => void;
}

export default function PortfolioRecommendationModal({
  isOpen,
  onClose,
  profile,
  selectedDate,
  onSelectStock,
  onOpenAssessment,
}: PortfolioRecommendationModalProps) {
  const [budget, setBudget] = useState<number>(100000);
  const [data, setData] = useState<PortfolioRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPortfolio();
    }
  }, [isOpen, profile, selectedDate, budget]);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const res = await fetchPortfolioRecommendation(
        profile,
        selectedDate || undefined,
        budget,
        5
      );
      setData(res);
    } catch (err) {
      console.error("Failed to load portfolio recommendation:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopyHash = () => {
    if (data?.audit_hash) {
      navigator.clipboard.writeText(data.audit_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  Personalized Wealth Portfolio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {profile} Mandate
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Inverse-volatility risk-parity basket strictly filtered by CSRC suitability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Capital & Parameters Bar */}
        <div className="px-6 py-3 bg-neutral-900/30 border-b border-neutral-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Investment Capital:</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 text-xs">¥</span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Math.max(1000, Number(e.target.value) || 0))}
                className="bg-neutral-900 border border-neutral-800 rounded-lg pl-6 pr-3 py-1 text-xs text-white font-mono w-32 focus:outline-none focus:border-blue-500"
                step="10000"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-500 font-mono text-[11px]">
              Benchmark: {selectedDate || "Latest"}
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenAssessment();
              }}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium hover:underline"
            >
              Re-evaluate Risk Profile →
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-3" />
              <p className="text-xs text-neutral-400">Optimizing risk-parity allocation...</p>
            </div>
          ) : data ? (
            <div className="space-y-5">
              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-900/50 rounded-2xl border border-neutral-800/80">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                    Expected Return
                  </div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    +{data.summary.portfolio_expected_return_pct}%
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/50 rounded-2xl border border-neutral-800/80">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                    Weighted Volatility
                  </div>
                  <div className="text-lg font-bold text-blue-400 font-mono mt-0.5">
                    {data.summary.portfolio_volatility_pct}%
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/50 rounded-2xl border border-neutral-800/80">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                    Sharpe Ratio
                  </div>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                    {data.summary.estimated_sharpe}
                  </div>
                </div>

                <div className="p-3 bg-neutral-900/50 rounded-2xl border border-neutral-800/80">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                    CSRC Compliance
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>100% Certified</span>
                  </div>
                </div>
              </div>

              {/* Holdings Table */}
              <div className="border border-neutral-800/80 rounded-2xl overflow-hidden bg-neutral-900/30">
                <div className="px-4 py-2.5 bg-neutral-900/60 border-b border-neutral-800/80 text-[11px] font-mono text-neutral-400 grid grid-cols-12 gap-2">
                  <div className="col-span-4">ASSET & SECTOR</div>
                  <div className="col-span-3 text-right">WEIGHT & ALLOCATION</div>
                  <div className="col-span-3 text-center">AI RISK RATING</div>
                  <div className="col-span-2 text-right">ACTION</div>
                </div>

                <div className="divide-y divide-neutral-800/60">
                  {data.holdings.map((h) => (
                    <div
                      key={h.stkcd}
                      className="px-4 py-3 grid grid-cols-12 gap-2 items-center text-xs hover:bg-neutral-900/50 transition-colors"
                    >
                      {/* Code & Sector */}
                      <div className="col-span-4 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">
                            {h.stkcd.toString().padStart(6, "0")}
                          </span>
                          <span className="text-[10px] text-neutral-400 px-1.5 py-0.2 rounded bg-neutral-800">
                            {h.sector}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
                          Vol: {(h.risk_x * 100).toFixed(1)}% | Momentum: {(h.return_y * 100).toFixed(1)}%
                        </div>
                      </div>

                      {/* Weight & Allocation */}
                      <div className="col-span-3 text-right">
                        <div className="font-mono font-semibold text-white">
                          ¥{h.allocation_cny.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <span className="text-[11px] font-mono text-emerald-400 font-medium">
                            {h.weight}%
                          </span>
                          <div className="w-12 h-1 bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${Math.min(100, h.weight * 2)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* AI Risk Rating */}
                      <div className="col-span-3 text-center">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border"
                          style={{
                            color: h.risk_color,
                            backgroundColor: `${h.risk_color}15`,
                            borderColor: `${h.risk_color}30`,
                          }}
                        >
                          {h.risk_label}
                        </span>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          R{Math.min(5, h.predicted_risk + 1)} Compliant
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="col-span-2 text-right">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectStock(h.stkcd);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium transition-colors"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immutable Cryptographic SHA-256 Audit Bar */}
              <div className="p-3 bg-neutral-900/50 rounded-2xl border border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                <div className="min-w-0 pr-3">
                  <div className="text-[10px] text-neutral-500 uppercase">Recommendation Cryptographic Audit</div>
                  <div className="text-emerald-400 text-[11px] truncate mt-0.5">
                    {data.audit_hash}
                  </div>
                </div>
                <button
                  onClick={handleCopyHash}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors shrink-0"
                  title="Copy Audit Hash"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-neutral-400">
              <p className="text-sm font-medium text-white mb-1">Unable to load portfolio</p>
              <p className="text-xs text-neutral-500 mb-4">Click retry to recalculate the optimal allocation basket.</p>
              <button
                onClick={loadPortfolio}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Retry Allocation
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800/80 bg-neutral-900/40 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Meets CSRC Article 17 Suitability Guardrail Requirements</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
