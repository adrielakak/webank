import React, { useState, useEffect } from "react";
import { DitherBackground } from "./components/DitherBackground";
import { Navbar } from "./components/Navbar";
import { ChatPanel } from "./components/ChatPanel";
import { CockpitPanel } from "./components/CockpitPanel";
import { AuditModal } from "./components/AuditModal";
import {
  InvestorRiskLevel,
  PortfolioAllocation,
  MonteCarloPath,
  ComplianceAuditRecord,
  ChatMessage,
} from "./types";
import {
  optimizePortfolio,
  simulateMonteCarlo,
  createAuditRecord,
  fetchAuditRecords,
} from "./lib/api";

export function App() {
  const [clientName, setClientName] = useState("Sarah Jenkins");
  const [currentTier, setCurrentTier] = useState<InvestorRiskLevel>("C3");
  const [portfolioValue, setPortfolioValue] = useState(50000);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditRecords, setAuditRecords] = useState<ComplianceAuditRecord[]>([]);

  // Allocation & Monte Carlo State
  const [allocation, setAllocation] = useState<PortfolioAllocation>({
    client_tier: "C3",
    weights: {
      "GLOBAL-DIVIDEND": 0.3062,
      "CORP-IG-BOND": 0.299,
      "CASH-USD": 0.2,
      "GOLD-PHYS": 0.1084,
      "US-TREAS-7Y": 0.0864,
    },
    expected_annual_return: 0.06,
    expected_annual_volatility: 0.0553,
    sharpe_ratio: 0.451,
    composite_risk_tier: "R3",
    is_compliant: true,
    compliance_message: "Compliant: Allocation fully satisfies CSRC investor suitability guidelines.",
  });

  const [monteCarlo, setMonteCarlo] = useState<MonteCarloPath>({
    months: Array.from({ length: 61 }, (_, i) => i),
    p10_pessimistic: Array.from({ length: 61 }, (_, i) => 50000 * Math.exp(0.01 * (i / 12) - 0.08 * Math.sqrt(i / 12))),
    p50_median: Array.from({ length: 61 }, (_, i) => 50000 * Math.exp(0.06 * (i / 12))),
    p90_optimistic: Array.from({ length: 61 }, (_, i) => 50000 * Math.exp(0.06 * (i / 12) + 0.12 * Math.sqrt(i / 12))),
    initial_value: 50000,
    terminal_p10: 48200,
    terminal_p50: 71400,
    terminal_p90: 88500,
    probability_of_loss: 0.038,
    max_drawdown_p50: 0.052,
  });

  const [currentAudit, setCurrentAudit] = useState<ComplianceAuditRecord | null>(null);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_1",
      role: "assistant",
      content:
        "Welcome Sarah! I have analyzed your 7-year horizon and moderate risk profile. Under WeBank's **CSRC Suitability Framework**, you are formally assigned to **C3 平衡型 (Balanced)**.\n\nYour optimal Markowitz portfolio targets **6.00% annual return** with a low **5.53% volatility**, blending global dividend equities, corporate debt, gold, and US Treasuries. All allocations satisfy CSRC investor suitability boundaries.\n\nHow can I assist your wealth strategy today?",
      timestamp: "10:14 AM",
    },
  ]);

  // Load initial audit ledger
  useEffect(() => {
    fetchAuditRecords().then((records) => {
      setAuditRecords(records);
      if (records.length > 0) setCurrentAudit(records[0]);
    });
  }, []);

  // Update allocation whenever tier changes
  const handleSelectTier = async (tier: InvestorRiskLevel) => {
    setCurrentTier(tier);
    try {
      const newAlloc = await optimizePortfolio(tier);
      setAllocation(newAlloc);

      const newMC = await simulateMonteCarlo(newAlloc, portfolioValue, 5);
      setMonteCarlo(newMC);

      // Create cryptographically signed audit proof
      const audit = await createAuditRecord({
        client_id: "usr_sarah_jenkins",
        risk_level: tier,
        composite_risk_tier: newAlloc.composite_risk_tier,
        compliance_status: "APPROVED",
        violations: [],
        weights: newAlloc.weights,
      });
      setCurrentAudit(audit);
      setAuditRecords((prev) => [audit, ...prev]);

      // Inform in chat
      const tierDetails: Record<InvestorRiskLevel, string> = {
        C1: "Switched to **C1 保守型 (Conservative)**: 100% Cash / Sovereign equivalents. Expected return: 4.50%, near-zero volatility.",
        C2: "Switched to **C2 谨慎型 (Prudent)**: Fixed income focus (US Treasuries 41.1%, China Gov Bonds 18.9%, Cash 40%). Volatility: 2.56%.",
        C3: "Switched to **C3 平衡型 (Balanced)**: Balanced multi-asset portfolio (Equities 30.6%, Corporate Bonds 29.9%, Cash 20%, Gold 10.8%). Return: 6.00%.",
        C4: "Switched to **C4 积极型 (Growth)**: High equity exposure (MSCI World 32.4%, Tech Innovation 30%, Gold 19.9%). Return: 9.69%, Volatility: 13.85%.",
        C5: "Switched to **C5 激进型 (Aggressive)**: Maximum capital appreciation (MSCI World 35%, Tech 30%, Emerging Markets 25%). Return: 10.97%.",
      };

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: "assistant",
          content: `${tierDetails[tier]}\n\n✓ **CSRC Guardrail Verified**: Composite risk tier is **${newAlloc.composite_risk_tier}**. Cryptographic SHA-256 fingerprint generated.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (e) {
      console.error("Failed to rebalance tier", e);
    }
  };

  // Chat message submission
  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Simulated Copilot intelligence responses
    setTimeout(() => {
      let reply = "";
      const lower = text.toLowerCase();

      if (lower.includes("gold") || lower.includes("10.8")) {
        reply =
          "**Why Physical Gold (10.8%) is included:**\n\n1. **Negative Equity Correlation**: Gold has a correlation of only 0.08 with MSCI World and 0.05 with Dividend Equities, acting as an empirical hedge against inflation and equity drawdowns.\n2. **Sharpe Optimization**: Adding 10.8% gold expands the Markowitz efficient frontier, reducing overall portfolio volatility from 6.8% down to **5.53%** without sacrificing expected return.\n3. **CSRC Suitability**: Under CSRC Category R3, physical gold is classified as a medium-risk commodity, fully compliant with your C3 profile.";
      } else if (lower.includes("rate") || lower.includes("shock") || lower.includes("interest")) {
        reply =
          "⚡ **Rate Shock Stress-Test (+100 bps Interest Rate Hike):**\n\n• **Sovereign Bonds**: US 7-10Y Treasuries have a modified duration of ~7.2 years, leading to a theoretical -7.2% price adjustment.\n• **Corporate Credit**: Investment Grade credit absorbs shock with wider spreads (-4.5%).\n• **Cash Yield Benefit**: Your 20% Cash allocation immediately benefits from higher money-market yields (+100 bps income boost).\n• **Composite Portfolio Impact**: Overall simulated 1-year drawdown is limited to **-1.92%**, well within your C3 tolerance ceiling (-10.0%).";
      } else {
        reply = `Thank you for your question. Based on your current **${currentTier} Balanced strategy**, your portfolio is mathematically optimized to capture upside while hedging downside risks. Your current expected Sharpe ratio is **${allocation.sharpe_ratio}**. Would you like to stress-test a specific market shock or execute a simulated rebalance?`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          role: "assistant",
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 600);
  };

  // Demo: Trigger Rogue Trade to showcase CSRC Compliance Hard-Stop
  const handleTriggerRogueTrade = () => {
    const userPrompt: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: "I want to buy 40% of Emerging Markets Equities (R5) and 30% Tokenized RWAs right now.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const sentinelInterception: ChatMessage = {
      id: `sent_${Date.now() + 1}`,
      role: "sentinel",
      content:
        "🛑 **REGULATORY HARD-STOP INTERCEPTION [CSRC RULE ENFORCED]**\n\nYour order has been **REJECTED** by the Compliance Sentinel.\n\n• **Violation**: You are categorized as **Level C3 (Balanced)**. You are legally restricted to product tiers **R1, R2, and R3**.\n• **Breach**: 'EMERGING-MKTS' and 'TOKEN-TREAS-RWA' are classified as **Tier R5 (High Risk)**.\n• **CSRC Regulatory Mandate**: 《证券期货投资者适当性管理办法》 第十九条: *Financial institutions are strictly prohibited from recommending or facilitating transactions that exceed the investor's certified risk level without prior re-profiling and formal risk disclosure signing.*\n\nAllocation reverted to approved C3 parameters. Incident logged to audit ledger.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userPrompt, sentinelInterception]);
  };

  // Demo: Trigger Rate Shock
  const handleTriggerRateShock = () => {
    handleSendMessage("Simulate a +100bps Interest Rate Shock across all bond holdings.");
  };

  // Execute Rebalance in Sandbox
  const handleExecuteRebalance = async () => {
    setIsRebalancing(true);
    await new Promise((r) => setTimeout(r, 1200));

    const audit = await createAuditRecord({
      client_id: "usr_sarah_jenkins",
      risk_level: currentTier,
      composite_risk_tier: allocation.composite_risk_tier,
      compliance_status: "EXECUTED_SANDBOX",
      violations: [],
      weights: allocation.weights,
    });

    setCurrentAudit(audit);
    setAuditRecords((prev) => [audit, ...prev]);
    setIsRebalancing(false);

    setMessages((prev) => [
      ...prev,
      {
        id: `exec_${Date.now()}`,
        role: "assistant",
        content: `✓ **Sandbox Rebalance Executed Successfully!**\n\n• All 5 target positions adjusted in simulated account.\n• Mandate Hash: \`${audit.sha256_fingerprint.substring(0, 24)}...\`\n• Cryptographic non-repudiation log added to immutable ledger.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleResetSession = () => {
    handleSelectTier("C3");
    setMessages([
      {
        id: `msg_init_${Date.now()}`,
        role: "assistant",
        content: "Session reset. Reinitialized with Sarah Jenkins (C3 Balanced) sandbox account. How can I help you explore your asset allocation?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col relative font-sans overflow-x-hidden">
      <DitherBackground />

      {/* Navigation Header */}
      <Navbar
        clientName={clientName}
        riskLevel={currentTier}
        portfolioValue={portfolioValue}
        onOpenAudit={() => setIsAuditModalOpen(true)}
        onReset={handleResetSession}
      />

      {/* Main Split-Screen Workspace (50% Chat / 50% Cockpit) */}
      <main className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto relative z-10 overflow-hidden border-x border-white/[0.06] shadow-2xl">
        {/* Left 50%: Conversational Advisor */}
        <div className="w-full md:w-1/2 h-[calc(100vh-4rem)] flex flex-col">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            onSelectTier={handleSelectTier}
            currentTier={currentTier}
            onTriggerRogueTrade={handleTriggerRogueTrade}
            onTriggerRateShock={handleTriggerRateShock}
          />
        </div>

        {/* Right 50%: Dynamic Wealth Cockpit */}
        <div className="w-full md:w-1/2 h-[calc(100vh-4rem)] flex flex-col">
          <CockpitPanel
            allocation={allocation}
            monteCarlo={monteCarlo}
            auditRecord={currentAudit}
            onExecuteRebalance={handleExecuteRebalance}
            isRebalancing={isRebalancing}
            onOpenAudit={() => setIsAuditModalOpen(true)}
          />
        </div>
      </main>

      {/* CSRC Audit Ledger Modal */}
      <AuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        records={auditRecords}
      />
    </div>
  );
}

export default App;
