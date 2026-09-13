import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, PieChart, Activity, Send, CheckCircle2, TrendingUp, Loader2, Settings2 } from "lucide-react";
import { PortfolioAllocation, MonteCarloPath, InvestorRiskLevel } from "../types";
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { sendMessageToAgent } from "../lib/api";
import ReactMarkdown from 'react-markdown';

interface SimpleDashboardProps {
  allocation: PortfolioAllocation;
  monteCarlo: MonteCarloPath;
  currentTier: InvestorRiskLevel;
  portfolioValue: number;
  excludedAssets: string[];
  onUpdatePortfolioValue: (val: number) => void;
  onToggleAsset: (assetId: string) => void;
  onOpenChat: () => void;
  onSelectTier: (tier: InvestorRiskLevel) => void;
}

// Recharts colors exactly matching the Expert CockpitPanel
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
  excludedAssets,
  onUpdatePortfolioValue,
  onToggleAsset,
  onOpenChat,
  onSelectTier,
}) => {
  // Format data for Recharts Pie
  const activeWeights = useMemo(() => {
    return Object.entries(allocation.weights)
      .filter(([name, val]) => val > 0 && !excludedAssets.includes(name))
      .map(([name, value]) => ({ name, value: value * 100 }));
  }, [allocation.weights, excludedAssets]);

  // Format data for Recharts Area
  const chartData = monteCarlo.months.map((m, i) => ({
    month: m === 0 ? "Now" : `Y${m / 12}`,
    P90: monteCarlo.p90_optimistic[i],
    P50: monteCarlo.p50_median[i],
    P10: monteCarlo.p10_pessimistic[i],
  }));

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState([
    { role: "agent", text: "Hello Sarah! Let's build your wealth strategy. To calibrate your portfolio, how would you react if market volatility caused a 10% drawdown in a month?" },
    { role: "user", text: "I'm saving for a down payment in 6 yrs. I want growth, but I can't afford to lose my core capital." },
    { role: "agent", text: `Understood. That points to an ${currentTier} ${allocation.client_tier} allocation. I have optimized your portfolio with a ${(allocation.expected_annual_return * 100).toFixed(1)}% expected return and capped your equity risk. Take a look at your customized cockpit on the right.` },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);

  const processAgentResponse = (text: string) => {
    let cleanText = text;
    
    // Check for SET_TIER
    const tierMatch = text.match(/\[ACTION:\s*SET_TIER,\s*(C[1-5])\]/);
    if (tierMatch && tierMatch[1]) {
      onSelectTier(tierMatch[1] as InvestorRiskLevel);
      cleanText = cleanText.replace(tierMatch[0], "");
    }
    
    // Check for SET_CAPITAL
    const capitalMatch = text.match(/\[ACTION:\s*SET_CAPITAL,\s*(\d+)\]/);
    if (capitalMatch && capitalMatch[1]) {
      onUpdatePortfolioValue(Number(capitalMatch[1]));
      cleanText = cleanText.replace(capitalMatch[0], "");
    }
    
    return cleanText.trim();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue;
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      const responseText = await sendMessageToAgent(userMessage, messages, currentTier);
      const cleanText = processAgentResponse(responseText);
      setMessages(prev => [...prev, { role: "agent", text: cleanText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "agent", text: "⚠️ WeBank Agent could not be reached." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (prompt: string) => {
    if (isLoading) return;
    setMessages(prev => [...prev, { role: "user", text: prompt }]);
    setIsLoading(true);
    try {
      const responseText = await sendMessageToAgent(prompt, messages, currentTier);
      const cleanText = processAgentResponse(responseText);
      setMessages(prev => [...prev, { role: "agent", text: cleanText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "agent", text: "⚠️ WeBank Agent could not be reached." }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wait for framer-motion animation to finish before scrolling
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
    return () => clearTimeout(timeout);
  }, [messages]);

  const minP10 = Math.min(...monteCarlo.p10_pessimistic);
  const maxDrawdown = Math.min(0, (minP10 / portfolioValue) * 100 - 100);

  return (
    <div className="flex-1 w-full h-full bg-black text-white overflow-hidden">
      <div className="h-full grid grid-cols-1 lg:grid-cols-2 w-full">
        
        {/* ── LEFT PANEL: Conversational Advisor ── */}
        <div className="h-full border-r border-zinc-900 flex flex-col bg-black relative min-h-0">
          
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
          <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 scroll-smooth bg-black">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 prose prose-invert prose-sm ${
                    msg.role === "user" 
                      ? "bg-zinc-800 border border-zinc-700 text-zinc-50 rounded-br-none" 
                      : "bg-zinc-950/60 border border-zinc-900 text-zinc-300 rounded-bl-none shadow-lg"
                  }`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-1" />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-black border-t border-zinc-900">

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
            <div className="mt-4 text-[9px] text-zinc-600/80 text-center font-mono leading-relaxed">
              <span className="text-zinc-500">STRICTLY CONFIDENTIAL &middot; CSRC COMPLIANCE ACTIVE</span><br/>
              Simulated sandbox environment for demonstration purposes only.<br/>
              Created by: Adriel Kourlate, Yves Abdallah, Kushi, Aadithyan, Zixuan
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Dynamic Wealth Cockpit ── */}
        <div className="h-full overflow-y-auto p-6 lg:p-8 bg-black flex flex-col min-h-0">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 shrink-0 gap-4">
            <h2 className="text-2xl font-light tracking-tight text-white">Your Wealth Cockpit</h2>
            
            <div className="flex items-center gap-3">
              {/* Initial Capital Input */}
              <div className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-900 rounded-xl px-3 py-2 shadow-lg">
                <span className="text-zinc-500 text-xs font-mono uppercase">Capital</span>
                <div className="flex items-center">
                  <span className="text-zinc-400 text-sm">$</span>
                  <input 
                    type="number" 
                    value={portfolioValue}
                    onChange={(e) => onUpdatePortfolioValue(Number(e.target.value))}
                    className="bg-transparent text-white text-sm font-mono w-24 focus:outline-none pl-1"
                    min="1000"
                    step="1000"
                  />
                </div>
              </div>

              {/* Settings Dropdown for Asset Management */}
              <div className="relative">
                <button 
                  onClick={() => setIsAssetsModalOpen(!isAssetsModalOpen)}
                  className={`p-2.5 rounded-xl border transition-colors shadow-lg ${isAssetsModalOpen ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-950/60 border-zinc-900 hover:bg-zinc-900 text-zinc-400'}`}
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                
                <AnimatePresence>
                  {isAssetsModalOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-12 w-64 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50"
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
                                onChange={() => onToggleAsset(assetId)}
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
          </div>

          <div className="flex-1 min-h-0 flex flex-col gap-4">
            {/* CARD 1: RISK & SUITABILITY */}
            <div className="shrink-0 rounded-2xl bg-zinc-950/60 border border-zinc-900 p-5 shadow-xl relative overflow-hidden backdrop-blur-xl">
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
                  <div className="text-xl text-white font-medium" style={{ color: TIER_COLORS[currentTier] }}>{allocation.client_tier.replace('_', ' ')}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Equity Ceiling</div>
                  <div className="text-xl text-white font-mono font-light">{(allocation.expected_annual_volatility * 200).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">Max 1Y Drawdown</div>
                  <div className="text-xl text-emerald-400 font-mono font-light">{maxDrawdown.toFixed(1)}%</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-3 h-3" />
                {allocation.compliance_message}
              </div>
            </div>

            {/* LOWER SECTION: CARDS 2 & 3 */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CARD 2: DYNAMIC ASSET ALLOCATION */}
              <div className="rounded-2xl bg-zinc-950/60 border border-zinc-900 p-5 shadow-xl flex flex-col backdrop-blur-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-zinc-500" />
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Asset Allocation</span>
                </div>
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
                      {activeWeights.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.name] || "#52525b"} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#e4e4e7' }}
                      formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Weight']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {activeWeights.slice(0, 4).map((asset: any) => (
                  <div key={asset.name} className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400 truncate">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ASSET_COLORS[asset.name] }} />
                    <span className="truncate">{asset.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 3: MONTE CARLO WEALTH PROJECTION */}
            <div className="rounded-2xl bg-zinc-950/60 border border-zinc-900 p-5 shadow-xl flex flex-col backdrop-blur-xl">
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
                      formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, {maximumFractionDigits:0})}`, '']}
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
          </div>

          {/* AI NEXT BEST ACTIONS (Fills empty space) */}
          <div className="mt-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 p-5 shadow-xl flex flex-col backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Next Best Actions</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button 
                onClick={() => handleQuickAction("Simulate a +100bps interest rate shock on my bond holdings. What would happen to my portfolio?")}
                disabled={isLoading}
                className="text-left p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center justify-between group disabled:opacity-50"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-200">Stress Test Rates</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Simulate +100bps shock</div>
                </div>
                <Activity className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
              </button>
              <button 
                onClick={() => handleQuickAction("I want to increase my growth exposure. Can you optimize my portfolio for a C4 growth profile?")}
                disabled={isLoading}
                className="text-left p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center justify-between group disabled:opacity-50"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-200">Optimize Growth</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Shift to C4 profile</div>
                </div>
                <TrendingUp className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* Execute Sandbox Button Sticky Footer */}
          <div className="shrink-0 mt-6 pt-4 border-t border-zinc-900">
            <button 
              type="button"
              onClick={() => handleQuickAction("Execute a sandbox rebalance order for my current portfolio allocation.")}
              disabled={isLoading}
              className="w-full py-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-medium transition-colors shadow-lg disabled:opacity-50"
            >
              <TrendingUp className="w-5 h-5" /> Execute Sandbox Order
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;
