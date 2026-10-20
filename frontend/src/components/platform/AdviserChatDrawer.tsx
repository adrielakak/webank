import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  Loader2,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Target,
  TrendingUp,
  Layers,
  HelpCircle,
  Search,
  ChevronRight
} from "lucide-react";
import { sendAdviserChat } from "../../api";
import type { AdviserChatResponse } from "../../types";

interface Message {
  id: string;
  sender: "user" | "adviser";
  text: string;
  timestamp: string;
  auditHash?: string;
  suggestedPrompts?: string[];
  referencedStkcd?: number;
}

interface AdviserChatDrawerProps {
  profile: string;
  selectedDate: string | null;
  selectedStkcd?: number | null;
  onSelectStock?: (stkcd: number) => void;
  onOpenPortfolio?: () => void;
  onOpenAssessment?: () => void;
  forceOpenTrigger?: number;
}

type CategoryId = "asset" | "guardrails" | "alpha" | "portfolio" | "csrc";

interface PromptCategory {
  id: CategoryId;
  label: string;
  icon: any;
  description: string;
}

export default function AdviserChatDrawer({
  profile,
  selectedDate,
  selectedStkcd,
  onSelectStock,
  onOpenPortfolio,
  onOpenAssessment,
  forceOpenTrigger,
}: AdviserChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("asset");
  const [rotationSeed, setRotationSeed] = useState(0);

  useEffect(() => {
    if (forceOpenTrigger && forceOpenTrigger > 0) {
      setIsOpen(true);
      setActiveCategory("asset");
    }
  }, [forceOpenTrigger]);

  const targetCode = selectedStkcd ? selectedStkcd.toString().padStart(6, "0") : "300699";

  const categories: PromptCategory[] = useMemo(() => [
    {
      id: "asset",
      label: selectedStkcd ? `#${targetCode}` : "Asset Diagnostic",
      icon: Target,
      description: "Stock-specific XAI, TreeSHAP, and unexpected crash diagnostic",
    },
    {
      id: "guardrails",
      label: "Crash Guardrails",
      icon: ShieldCheck,
      description: "Asymmetric risk, tail protection, and Kahneman-Tversky loss aversion",
    },
    {
      id: "alpha",
      label: "Alpha Strategy",
      icon: TrendingUp,
      description: "+12.06% net return, Sharpe 1.03, and Opportunity quadrant mechanics",
    },
    {
      id: "portfolio",
      label: "Portfolio Basket",
      icon: Layers,
      description: "CSRC compliant allocation, pair trades, and risk parity",
    },
    {
      id: "csrc",
      label: "CSRC & Blockchain",
      icon: HelpCircle,
      description: "Regulatory R1-R5 investor rules and FISCO BCOS consensus",
    },
  ], [selectedStkcd, targetCode]);

  // Predefined questions organized by category with rotating alternative phrasing
  const questionsByCategory: Record<CategoryId, string[][]> = useMemo(() => ({
    asset: [
      [
        `Why did AI predict Low Risk on ${targetCode} before the -23.39% crash?`,
        `How did the CSRC Crash Guardrail protect investors on ${targetCode}?`,
        `Decompose TreeSHAP factor attributions for stock ${targetCode}`,
        `Is stock ${targetCode} compliant with my ${profile} mandate?`,
        `Combine ${targetCode} with Kweichow Moutai (600519) in volatility parity`,
      ],
      [
        `Explain the difference between Predicted Low Risk vs Realized Severe Risk on ${targetCode}`,
        `What pre-shock fundamental signals did TreeSHAP detect on ${targetCode}?`,
        `Why is an asymmetric tail-risk guardrail necessary for ${targetCode}?`,
        `Compare ${targetCode} downside risk against cross-sectional ChiNext peers`,
        `Can a conservative investor hold ${targetCode} under CSRC Rule 2026/08?`,
      ],
    ],
    guardrails: [
      [
        "Why is a conservative miss safer than an aggressive miss in wealth management?",
        "How does Kahneman-Tversky loss aversion (2.5x) shape our risk model?",
        "What happens when tail-risk crash probability (prob_class_4) exceeds 15%?",
        "How does the CSRC Sentinel override baseline model predictions?",
      ],
      [
        "Why do standard symmetric machine learning models fail during market crashes?",
        "Explain how the Bayesian posterior distribution captures tail-risk shocks",
        "What is the mathematical threshold for triggering a Crash Guardrail?",
        "How does capital preservation outperform aggressive guessing in the long run?",
      ],
    ],
    alpha: [
      [
        "How did Adastra generate +12.06% net return (+3.79% alpha) in 2023?",
        "Explain the 4 quadrants (Opportunity, Defensive, Speculative, Avoid)",
        "What is the Sharpe ratio of the Opportunity portfolio (1.03 vs Benchmark 0.69)?",
        "How does TreeSHAP compute deterministic attributions in 76μs?",
      ],
      [
        "What is the monthly win-rate (75%) of the Opportunity quadrant strategy?",
        "Why are speculative assets systematically filtered out from retail portfolios?",
        "How do peer momentum and Altman Z-score factors drive long-term alpha?",
        "Explain the empirical backtest methodology across 35,085 stock-months",
      ],
    ],
    portfolio: [
      [
        `Recommend a compliant portfolio for my ${profile} profile`,
        `How do you compute inverse-volatility weighting for multi-asset pairs?`,
        "Show cross-sector diversification and drawdown risk metrics",
        "How do you rebalance a portfolio to maintain strict CSRC compliance?",
      ],
      [
        `Generate a customized ¥100,000 asset allocation for ${profile} suitability`,
        "How does pair trading Moutai (600519) reduce market beta risk?",
        "What is the maximum drawdown limit for conservative client mandates?",
        "Explain the difference between R1 preservation and R3 balanced growth",
      ],
    ],
    csrc: [
      [
        "What are CSRC investor suitability standards (C1 to C5 vs R1 to R5)?",
        "How is every recommendation cryptographically verified on FISCO BCOS?",
        "Show CSRC R1 to R5 investor suitability rules",
        "How does WeBank guarantee regulatory compliance against model drift?",
      ],
      [
        "Explain the legal obligations under CSRC Investor Suitability Management Measures",
        "How does immutable SHA-256 hashing prevent post-hoc prediction tampering?",
        "What recourse does a bank have if a quant model breaches risk mandates?",
        "How is client KYC risk tolerance mapped to quantitative asset buckets?",
      ],
    ],
  }), [targetCode, profile]);

  const activeQuestions = useMemo(() => {
    const sets = questionsByCategory[activeCategory];
    const setIndex = rotationSeed % sets.length;
    let list = sets[setIndex];
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter((item) => item.toLowerCase().includes(q));
    }
    return list;
  }, [questionsByCategory, activeCategory, rotationSeed, filterQuery]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "adviser",
      text: `### Adastra Quantitative Advisor 🛡️
I am your certified wealth advisory agent, calibrated to **CSRC Investor Suitability standards**.

I operate with **zero black-box opacity**, providing exact TreeSHAP attributions and **CSRC Asymmetric Crash Guardrails** across China A-Shares.

**Select a guided inquiry below to begin your analysis:**`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      const lastMsg = messages[messages.length - 1];
      // When an adviser response arrives, scroll so the user question / answer header is at the top
      if (lastMsg && lastMsg.sender === "adviser" && messages.length >= 2) {
        const userMsg = messages[messages.length - 2];
        const userEl = document.getElementById(`msg-${userMsg.id}`);
        if (userEl) {
          userEl.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        const adviserEl = document.getElementById(`msg-${lastMsg.id}`);
        if (adviserEl) {
          adviserEl.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);

    return () => clearTimeout(timer);
  }, [messages, isOpen, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res: AdviserChatResponse = await sendAdviserChat(
        query,
        profile,
        selectedDate || undefined,
        selectedStkcd || undefined
      );

      const adviserMsg: Message = {
        id: `adviser-${Date.now()}`,
        sender: "adviser",
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        auditHash: res.audit_hash,
        suggestedPrompts: res.suggested_prompts,
        referencedStkcd: res.referenced_stkcd,
      };

      setMessages((prev) => [...prev, adviserMsg]);
    } catch (err) {
      console.error("Adviser chat error:", err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "adviser",
        text: "⚠️ An error occurred while communicating with the advisory engine. Please verify the backend connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome",
        sender: "adviser",
        text: `### Adastra Quantitative Advisor 🛡️
Chat session reset. Ready for compliant CSRC allocation guidance.

**Select a guided inquiry below:**`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-2 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith("### ")) {
            return (
              <h3 key={idx} className="text-sm font-bold text-white pt-1">
                {line.replace("### ", "")}
              </h3>
            );
          }
          if (line.startsWith("#### ")) {
            return (
              <h4 key={idx} className="text-xs font-semibold text-cyan-400 pt-1">
                {line.replace("#### ", "")}
              </h4>
            );
          }
          if (line.startsWith("* ") || line.startsWith("- ")) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-neutral-300">
                <span className="text-emerald-400 leading-4">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(line.substring(2)) }} />
              </div>
            );
          }
          if (line.startsWith("|")) {
            return (
              <div key={idx} className="font-mono text-[10px] text-neutral-400 overflow-x-auto py-0.5">
                {line}
              </div>
            );
          }
          if (line.startsWith("---")) {
            return <div key={idx} className="border-t border-neutral-800 my-2" />;
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} className="text-neutral-300" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          );
        })}
      </div>
    );
  };

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const formatInline = (str: string) => {
    const safe = escapeHtml(str);
    return safe
      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-white font-semibold'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='bg-neutral-800 text-emerald-400 px-1 py-0.2 rounded font-mono text-[11px]'>$1</code>");
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-semibold rounded-full shadow-2xl shadow-emerald-500/30 border border-emerald-400/50 hover:shadow-emerald-500/50 transition-all cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-black" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-black rounded-full" />
          </div>
          <span className="text-xs tracking-wide font-bold">Ask AI Advisor</span>
          <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono font-bold">
            {profile}
          </span>
        </motion.button>
      )}

      {/* Floating Chat Drawer Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 right-6 z-50 bg-[#080a0f] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded
                ? "w-[92vw] md:w-[760px] h-[88vh]"
                : "w-[94vw] sm:w-[460px] md:w-[500px] h-[670px] max-h-[92vh]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white tracking-wide">
                      Adastra Guided Advisor
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                      CSRC Compliant
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                    <span>Profile: <strong className="text-emerald-400 font-mono">{profile}</strong></span>
                    <span>·</span>
                    <span>Date: <strong className="text-neutral-200">{selectedDate || "2023-12"}</strong></span>
                    {selectedStkcd && (
                      <>
                        <span>·</span>
                        <span>Stock: <strong className="text-cyan-400 font-mono">#{targetCode}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-neutral-400">
                <button
                  onClick={handleResetChat}
                  className="p-1.5 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Reset conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Suitability Mandate Banner (Sticky under header) */}
            <div className="px-4 py-2 bg-gradient-to-r from-emerald-950/30 via-neutral-900/50 to-neutral-950/80 border-b border-neutral-800/60 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-neutral-300">
                  Investor Mandate: <strong className="text-white font-mono">{profile}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onOpenAssessment && (
                  <button
                    onClick={onOpenAssessment}
                    className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>KYC Quiz</span>
                  </button>
                )}
                {onOpenPortfolio && (
                  <button
                    onClick={onOpenPortfolio}
                    className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Portfolio</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages Body */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  id={`msg-${m.id}`}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[94%] p-3.5 rounded-2xl ${
                      m.sender === "user"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-medium text-xs rounded-br-xs shadow-md shadow-emerald-500/10"
                        : "bg-neutral-900/80 border border-neutral-800/80 text-neutral-200 rounded-bl-xs shadow-sm backdrop-blur-sm"
                    }`}
                  >
                    {m.sender === "user" ? (
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    ) : (
                      renderMarkdown(m.text)
                    )}

                    {/* Stock action button if referenced */}
                    {m.referencedStkcd && onSelectStock && (
                      <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400 font-mono">
                          Referenced Asset: #{m.referencedStkcd.toString().padStart(6, "0")}
                        </span>
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onSelectStock(m.referencedStkcd!);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        >
                          <span>Open in Cockpit</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}

                    {/* Interactive Suggested Follow-Up Prompts */}
                    {m.suggestedPrompts && m.suggestedPrompts.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex flex-wrap gap-1.5">
                        <span className="text-[10px] text-neutral-500 font-mono w-full mb-0.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>Suggested follow-up:</span>
                        </span>
                        {m.suggestedPrompts.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            onClick={() => handleSend(p)}
                            className="text-[10px] font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 rounded-lg px-2 py-1 transition-all cursor-pointer text-left flex items-center gap-1"
                          >
                            <span>{p}</span>
                            <ChevronRight className="w-2.5 h-2.5 text-emerald-400" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* SHA-256 Audit Bar */}
                    {m.auditHash && (
                      <div className="mt-2 pt-1.5 border-t border-neutral-800/60 flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Audit Proof:</span>
                        </span>
                        <span className="text-emerald-400/80 truncate max-w-[170px]" title={m.auditHash}>
                          {m.auditHash.slice(0, 16)}...
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] text-neutral-500 mt-1 px-1 font-mono">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 p-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl w-fit text-xs text-neutral-400">
                  <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span>Synthesizing quant factors & blockchain audit...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ─── GUIDED DECISION-TREE ACTION MATRIX (NO CLUNKY OPEN-ENDED INPUT) ─── */}
            <div className="border-t border-neutral-800/80 bg-neutral-950/95 flex flex-col">
              {/* Category Navigation Pills */}
              <div className="px-3 pt-2 pb-1.5 border-b border-neutral-800/40 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 text-[11px] font-medium">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.id);
                          setFilterQuery("");
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-xs ${
                          isActive
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                            : "bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 border border-transparent hover:bg-neutral-900"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Shuffle / Randomize variations */}
                <button
                  onClick={() => setRotationSeed((prev) => prev + 1)}
                  className="p-1 text-neutral-400 hover:text-emerald-400 rounded hover:bg-neutral-900 transition-colors shrink-0 ml-1 cursor-pointer"
                  title="Shuffle questions (change phrasing & insights)"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {/* Interactive Question Cards */}
              <div className="p-3 max-h-48 overflow-y-auto space-y-1.5">
                {activeQuestions.length === 0 ? (
                  <div className="text-center py-3 text-xs text-neutral-500 font-mono">
                    No matching questions found. Try clearing the filter.
                  </div>
                ) : (
                  activeQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      disabled={loading}
                      onClick={() => handleSend(q)}
                      className="w-full text-left p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800/80 hover:border-emerald-500/40 text-neutral-200 hover:text-white text-xs transition-all flex items-center justify-between group cursor-pointer shadow-sm hover:shadow-emerald-950/20 disabled:opacity-50"
                    >
                      <span className="line-clamp-2 leading-relaxed pr-2 font-normal">
                        {q}
                      </span>
                      <div className="w-5 h-5 rounded-full bg-neutral-800 group-hover:bg-emerald-500/20 text-neutral-400 group-hover:text-emerald-400 flex items-center justify-center shrink-0 transition-all">
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Bottom Quick Search & Custom Input Bar */}
              <div className="px-3 pb-3 pt-1 border-t border-neutral-800/50 bg-neutral-900/40">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (input.trim()) {
                      handleSend(input);
                      setInput("");
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-3 h-3 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setFilterQuery(e.target.value);
                      }}
                      placeholder="Type stock code (e.g. 300699, 600519) or filter questions..."
                      disabled={loading}
                      className="w-full bg-neutral-950/90 border border-neutral-800 focus:border-emerald-500/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
                    />
                  </div>
                  {input.trim() && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="p-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-40 text-black rounded-lg transition-all shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>
                <div className="flex items-center justify-between text-[9px] text-neutral-500 mt-1.5 px-1 font-mono">
                  <span>Guided Quant Dialogue · Zero Black Box</span>
                  <span className="text-emerald-400/80">Click any card to ask instantly</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
