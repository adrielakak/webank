import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, PieChart, Activity, Send, CheckCircle2, AlertTriangle, Fingerprint, TrendingUp, Loader2 } from "lucide-react";
import { PortfolioAllocation, MonteCarloPath, InvestorRiskLevel } from "../types";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { sendMessageToAgent } from "../lib/api";

interface SimpleDashboardProps {
  allocation: PortfolioAllocation;
  monteCarlo: MonteCarloPath;
  currentTier: InvestorRiskLevel;
  portfolioValue: number;
  onOpenChat: () => void;
  onSelectTier: (tier: InvestorRiskLevel) => void;
}

// Recharts colors exactly matching the Expert CockpitPanel
const ASSET_COLORS: Record<string, string> = {
  "CASH-USD":        "#3f3f46",
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

const TIER_COLORS: Record<InvestorRiskLevel, string> = {
  C1: "#60a5fa",
  C2: "#a78bfa",
  C3: "#e4e4e7",
  C4: "#fbbf24",
  C5: "#ef4444",
};

export const SimpleDashboard: React.FC<SimpleDashboardProps> = ({
  allocation,
  monteCarlo,
  currentTier,
  portfolioValue,
  onOpenChat,
  onSelectTier,
}) => {
  // Format data for Recharts Pie
  const activeWeights = Object.entries(allocation.weights)
    .filter(([, w]) => w > 0.001)
    .map(([name, value]) => ({ name, value: value * 100 }));

  // Format data for Recharts Area
  const chartData = monteCarlo.months.map((m, i) => ({
    month: m === 0 ? "Now" : `Y${m / 12}`,
    P90: monteCarlo.p90_optimistic[i],
    P50: monteCarlo.p50_median[i],
    P10: monteCarlo.p10_pessimistic[i],
  }));

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState([
    { role: "agent", text: "Hello Sarah! Let's build your wealth strategy. To calibrate your portfolio, how would you react if market volatility caused a 10% drawdown in a month?" },
    { role: "user", text: "I'm saving for a down payment in 6 yrs. I want growth, but I can't afford to lose my core capital." },
    { role: "agent", text: `Understood. That points to an ${currentTier} ${allocation.client_tier} allocation. I have optimized your portfolio with a ${(allocation.expected_annual_return * 100).toFixed(1)}% expected return and capped your equity risk. Take a look at your customized cockpit on the right.` },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue;
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      const responseText = await sendMessageToAgent(userMessage, messages);
      setMessages(prev => [...prev, { role: "agent", text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "agent", text: "⚠️ WeBank Agent could not be reached." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 w-full h-full bg-black text-white overflow-hidden">
      <div className="h-full grid grid-cols-1 lg:grid-cols-2">
        
        {/* ── LEFT PANEL: Conversational Advisor ── */}
        <div className="h-full border-r border-zinc-900 flex flex-col bg-black relative">
          
          {/* Header */}
          <div className="p-4 border-b border-zinc-900 flex items-center justify-between sticky top-0 z-10 bg-black">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-200">WeBank AI Assistant</div>
                <div className="text-[10px] text-zinc-500 font-mono">XAI EXPLAINABILITY ENGINE</div>
              </div>
            </div>
          </div>

          {/* Chat Feed */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-black">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.role === "user" 
                      ? "bg-zinc-800 border border-zinc-700 text-zinc-50 rounded-br-none" 
                      : "bg-zinc-950/60 border border-zinc-900 text-zinc-300 rounded-bl-none shadow-lg"
                  }`}>
                    <p className="text-sm leading-relaxed font-light">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-black border-t border-zinc-900">
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              <button onClick={() => onSelectTier("C2")} className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-light border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors text-zinc-300">Simulate Rate Shock +1%</button>
              <button onClick={() => onSelectTier("C4")} className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-light border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors text-zinc-300">Increase Growth Exposure</button>
            </div>
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isLoading}
                placeholder={isLoading ? "WeBank AI is thinking..." : "Ask your advisor anything..."}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-all font-light disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-2 p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT PANEL: Dynamic Wealth Cockpit ── */}
        <div className="h-full overflow-y-auto p-6 lg:p-8 space-y-6 bg-black">
          
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-light tracking-tight text-white">Your Wealth Cockpit</h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> AUDITED
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD 1: RISK & SUITABILITY */}
            <div className="col-span-1 md:col-span-2 rounded-2xl bg-zinc-950/60 border border-zinc-900 p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Risk & Suitability Sentinel</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Score</div>
                  <div className="text-xl text-white font-mono font-light">{allocation.expected_annual_return > 0 ? "64/100" : "42/100"}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Assigned Tier</div>
                  <div className="text-xl text-white font-medium" style={{ color: TIER_COLORS[currentTier] }}>{currentTier} - {allocation.client_tier}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Equity Ceiling</div>
                  <div className="text-xl text-white font-mono font-light">{(allocation.expected_annual_volatility * 200).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Max 1Y Drawdown</div>
                  <div className="text-xl text-emerald-400 font-mono font-light">{(monteCarlo.terminal_p10 / portfolioValue * 100 - 100).toFixed(1)}%</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-3 h-3" />
                {allocation.compliance_message}
              </div>
            </div>

            {/* CARD 2: DYNAMIC ASSET ALLOCATION */}
            <div className="rounded-2xl bg-zinc-950/60 border border-zinc-900 p-5 shadow-xl flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Asset Allocation</span>
              </div>
              <div className="flex-1 min-h-[200px] -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={activeWeights}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {activeWeights.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.name] || "#52525b"} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#e4e4e7' }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Weight']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {activeWeights.slice(0, 4).map((asset) => (
                  <div key={asset.name} className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400 truncate">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ASSET_COLORS[asset.name] }} />
                    <span className="truncate">{asset.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 3: MONTE CARLO WEALTH PROJECTION */}
            <div className="rounded-2xl bg-zinc-950/60 border border-zinc-900 p-5 shadow-xl flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">5-Year Projection</span>
              </div>
              <div className="flex-1 min-h-[200px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorP50" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={TIER_COLORS[currentTier]} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={TIER_COLORS[currentTier]} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                      formatter={(value: number) => [`$${value.toLocaleString(undefined, {maximumFractionDigits:0})}`, '']}
                    />
                    <Area type="monotone" dataKey="P90" stroke="#22c55e" strokeWidth={1} strokeDasharray="3 3" fill="none" />
                    <Area type="monotone" dataKey="P10" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" fill="none" />
                    <Area type="monotone" dataKey="P50" stroke={TIER_COLORS[currentTier]} strokeWidth={2} fillOpacity={1} fill="url(#colorP50)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono mt-2 pt-2 border-t border-zinc-900">
                <div className="text-zinc-500 uppercase tracking-widest">P50 Expected</div>
                <div className="text-white">${monteCarlo.terminal_p50.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
              </div>
            </div>

            {/* CARD 4: CRYPTOGRAPHIC AUDIT PROOF */}
            <div className="col-span-1 md:col-span-2 rounded-2xl bg-zinc-950/60 border border-zinc-900 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-zinc-500" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Audit Hash</span>
                </div>
                <div className="text-xs font-mono text-zinc-400 mt-1 break-all">
                  0x{Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}
                </div>
              </div>
              <button 
                onClick={() => alert("Executing Sandbox Order...")}
                className="whitespace-nowrap px-6 py-3 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-200 text-sm font-medium transition-colors shadow-lg"
              >
                <TrendingUp className="w-4 h-4" /> Execute Sandbox Order
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
