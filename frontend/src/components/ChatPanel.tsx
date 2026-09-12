import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Shield,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Zap,
} from "lucide-react";
import { ChatMessage, InvestorRiskLevel } from "../types";
import { ProductComparisonCard } from "./ProductComparisonCard";
import ReactMarkdown from "react-markdown";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSelectTier: (tier: InvestorRiskLevel) => void;
  currentTier: InvestorRiskLevel;
  onTriggerRogueTrade: () => void;
  onTriggerRateShock: () => void;
}

const TIER_META: Record<InvestorRiskLevel, { label: string; sub: string; color: string; bg: string; border: string }> = {
  C1: { label: "C1", sub: "保守型", color: "#60a5fa", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.22)" },
  C2: { label: "C2", sub: "谨慎型", color: "#a78bfa", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.22)" },
  C3: { label: "C3", sub: "平衡型", color: "#e4e4e7", bg: "rgba(228,228,231,0.09)", border: "rgba(228,228,231,0.20)" },
  C4: { label: "C4", sub: "积极型", color: "#fbbf24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.22)" },
  C5: { label: "C5", sub: "激进型", color: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.22)" },
};


/* ── Typing indicator ───────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ── Suggestion chips ───────────────────────────────────────────────────── */
const DEMO_CHIPS = [
  { id: "rate", label: "Rate Shock", icon: TrendingUp },
  { id: "gold", label: "Gold Allocation", icon: BarChart3 },
  { id: "compare", label: "Compare C3/C4", icon: Zap },
  { id: "rouge", label: "Rogue Trade", icon: AlertTriangle },
];

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  onSelectTier,
  currentTier,
  onTriggerRogueTrade,
  onTriggerRateShock,
}) => {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    setIsTyping(true);
    onSendMessage(trimmed);
    setTimeout(() => setIsTyping(false), 800);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleChip = (id: string) => {
    if (id === "rouge") { setIsTyping(true); onTriggerRogueTrade(); setTimeout(() => setIsTyping(false), 600); }
    else if (id === "rate") { setIsTyping(true); onTriggerRateShock(); setTimeout(() => setIsTyping(false), 800); }
    else if (id === "compare") onSendMessage("Compare C3 vs C4 expected returns and risk profile.");
    else if (id === "gold") onSendMessage("Why is Gold 10.8% of my allocation?");
  };

  const tierMeta = TIER_META[currentTier];

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden relative">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="shrink-0 pt-6 pb-4 px-6 flex flex-col gap-6 z-10 bg-black">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white tracking-tight">Advisory</span>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">Copilot Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>

        {/* Minimal Tier Indicator */}
        <div className="flex gap-4 border-b border-zinc-900 pb-4">
          {(["C1", "C2", "C3", "C4", "C5"] as InvestorRiskLevel[]).map(tier => {
            const active = tier === currentTier;
            return (
              <button
                key={tier}
                onClick={() => onSelectTier(tier)}
                className={`text-sm font-medium transition-colors ${active ? "text-white" : "text-zinc-600 hover:text-zinc-400"}`}
              >
                {tier}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map(msg => {
            const isComparison = msg.content.includes("C3 vs C4 Product Comparison");
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                <div className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[90%] md:max-w-[85%] rounded-2xl px-5 py-3.5 ${
                      msg.role === "user" 
                        ? "bg-zinc-800 text-white rounded-tr-sm" 
                        : msg.role === "sentinel"
                        ? "bg-zinc-900 text-red-500 rounded-tl-sm"
                        : "bg-transparent text-zinc-300"
                    }`}
                  >
                    {isComparison ? (
                      <ProductComparisonCard />
                    ) : (
                      <div className="prose prose-invert prose-sm">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5"
          >
            <div className="rounded-2xl rounded-tl-sm bg-zinc-900">
              <TypingIndicator />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input Area ────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-black px-6 pb-6 pt-2 z-10">
        
        {/* Chips */}
        <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide">
          {DEMO_CHIPS.map(chip => {
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                onClick={() => handleChip(chip.id)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
              >
                <Icon className="w-3 h-3 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-300">{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Field */}
        <div className="relative flex items-center bg-zinc-900 rounded-full pr-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your portfolio..."
            className="w-full bg-transparent border-none outline-none text-sm text-white px-6 py-4 placeholder:text-zinc-600"
          />
          <motion.button
            onClick={handleSend}
            disabled={!input.trim()}
            whileTap={input.trim() ? { scale: 0.95 } : {}}
            className={`mb-0.5 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-25 transition-colors duration-150 ${
              input.trim() ? "bg-white text-black hover:bg-zinc-200" : "bg-zinc-800 text-zinc-500"
            }`}
          >
            <Send className="w-4 h-4 ml-0.5" />
          </motion.button>
        </div>
        <p className="text-[9px] font-mono mt-2 text-center text-zinc-600 uppercase tracking-widest">
          Powered by WeAdvisory Multi-Agent System
        </p>
      </div>
    </div>
  );
};
