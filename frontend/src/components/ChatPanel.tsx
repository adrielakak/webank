import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ShieldAlert, Sparkles, Sliders, ChevronRight } from "lucide-react";
import { ChatMessage, InvestorRiskLevel } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSelectTier: (tier: InvestorRiskLevel) => void;
  currentTier: InvestorRiskLevel;
  onTriggerRogueTrade: () => void;
  onTriggerRateShock: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  onSelectTier,
  currentTier,
  onTriggerRogueTrade,
  onTriggerRateShock,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full bg-surface/50 border-r border-white/[0.08] backdrop-blur-xl">
      
      {/* Panel Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B0F17]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">WeBank Advisory Copilot</h2>
            <p className="text-[11px] text-slate-400">Natural Dialogue · XAI Explainability Engine</p>
          </div>
        </div>

        {/* Quick Tier Selector Pills */}
        <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-lg border border-white/[0.06]">
          {(["C1", "C2", "C3", "C4", "C5"] as InvestorRiskLevel[]).map((t) => (
            <button
              key={t}
              onClick={() => onSelectTier(t)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded transition-all ${
                currentTier === t
                  ? "bg-blue-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === "assistant"
                  ? "bg-blue-500/20 text-cyan-400 border border-blue-500/30"
                  : msg.role === "sentinel"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-white/10 text-slate-200"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot className="w-3.5 h-3.5" />
              ) : msg.role === "sentinel" ? (
                <ShieldAlert className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Bubble Content */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : msg.role === "sentinel"
                  ? "bg-rose-950/40 text-rose-200 border border-rose-500/30 rounded-tl-sm"
                  : "bg-[#182234]/80 text-slate-200 border border-white/[0.06] rounded-tl-sm shadow-md"
              }`}
            >
              {/* Message Header tag if Sentinel */}
              {msg.role === "sentinel" && (
                <div className="flex items-center space-x-1.5 text-rose-400 font-semibold mb-1 text-[11px] uppercase tracking-wider font-mono">
                  <ShieldAlert className="w-3 h-3" />
                  <span>CSRC Suitability Hard-Stop Interception</span>
                </div>
              )}

              <div className="whitespace-pre-line">{msg.content}</div>

              {/* Timestamp */}
              <div
                className={`mt-1.5 text-[10px] font-mono text-right ${
                  msg.role === "user" ? "text-blue-200" : "text-slate-500"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Action Chips */}
      <div className="px-4 py-2 bg-black/20 border-t border-white/[0.04] flex items-center space-x-2 overflow-x-auto text-[11px]">
        <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider shrink-0">Try Demo:</span>
        <button
          onClick={onTriggerRateShock}
          className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.06] transition-all whitespace-nowrap"
        >
          ⚡ Simulate +100bps Rate Shock
        </button>
        <button
          onClick={() => onSendMessage("Explain why Gold (10.8%) is included in my portfolio.")}
          className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.06] transition-all whitespace-nowrap"
        >
          🔍 Why Gold?
        </button>
        <button
          onClick={onTriggerRogueTrade}
          className="px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all whitespace-nowrap"
        >
          🛡️ Test Illegal R5 Trade (Audit Block)
        </button>
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-white/[0.08] bg-[#0B0F17]/60">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask your wealth copilot anything..."
            className="flex-1 bg-surface border border-white/[0.08] focus:border-cyan-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 text-white transition-all shadow-md shadow-blue-500/20 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
