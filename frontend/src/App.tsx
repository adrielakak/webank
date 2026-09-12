import React, { useState, useEffect } from "react";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { LandingPage } from "./components/LandingPage";
import { Navbar } from "./components/Navbar";
import { ChatPanel } from "./components/ChatPanel";
import { CockpitPanel } from "./components/CockpitPanel";
import { AuditModal } from "./components/AuditModal";
import { SimpleDashboard } from "./components/SimpleDashboard";
import { RiskProfilingWizard } from "./components/RiskProfilingWizard";
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
  sendMessageToAgent,
} from "./lib/api";

type DashboardMode = "simple" | "expert";

const pageVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.18, ease: "easeIn" } },
};

const modeVariants: Variants = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.15, ease: "easeIn" } },
};

export function App() {
  const [currentPage, setCurrentPage] = useState<"landing" | "dashboard">("landing");
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>("simple");
  const [chatOpen, setChatOpen] = useState(false);

  const [clientName] = useState("Sarah Jenkins");
  const [currentTier, setCurrentTier] = useState<InvestorRiskLevel>("C3");
  const [portfolioValue] = useState(50000);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditRecords, setAuditRecords] = useState<ComplianceAuditRecord[]>([]);
  const [isWizardComplete, setIsWizardComplete] = useState(false);
  const [excludedAssets, setExcludedAssets] = useState<string[]>([]);

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
    compliance_message:
      "Compliant: Allocation fully satisfies CSRC investor suitability guidelines.",
  });

  const [monteCarlo, setMonteCarlo] = useState<MonteCarloPath>({
    months: Array.from({ length: 61 }, (_, i) => i),
    p10_pessimistic: Array.from(
      { length: 61 },
      (_, i) => 50000 * Math.exp(0.01 * (i / 12) - 0.08 * Math.sqrt(i / 12))
    ),
    p50_median: Array.from(
      { length: 61 },
      (_, i) => 50000 * Math.exp(0.06 * (i / 12))
    ),
    p90_optimistic: Array.from(
      { length: 61 },
      (_, i) => 50000 * Math.exp(0.06 * (i / 12) + 0.12 * Math.sqrt(i / 12))
    ),
    initial_value: 50000,
    terminal_p10: 48200,
    terminal_p50: 71400,
    terminal_p90: 88500,
    probability_of_loss: 0.038,
    max_drawdown_p50: 0.052,
  });

  const [currentAudit, setCurrentAudit] = useState<ComplianceAuditRecord | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    fetchAuditRecords().then((records) => {
      setAuditRecords(records);
      if (records.length > 0) setCurrentAudit(records[0]);
    });
  }, []);

  const handleCompleteWizard = async (tier: InvestorRiskLevel) => {
    setCurrentTier(tier);
    setIsWizardComplete(true);
    await handleSelectTier(tier);
  };

  const handleSelectTier = async (tier: InvestorRiskLevel, exAssets: string[] = excludedAssets, val: number = portfolioValue) => {
    setCurrentTier(tier);
    try {
      const newAlloc = await optimizePortfolio(tier, exAssets);
      setAllocation(newAlloc);
      const newMC = await simulateMonteCarlo(newAlloc, val, 5);
      setMonteCarlo(newMC);

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

  const handleUpdatePortfolioValue = (newVal: number) => {
    setPortfolioValue(newVal);
    handleSelectTier(currentTier, excludedAssets, newVal);
  };

  const handleToggleAsset = (assetId: string) => {
    const newEx = excludedAssets.includes(assetId) 
      ? excludedAssets.filter(a => a !== assetId)
      : [...excludedAssets, assetId];
    setExcludedAssets(newEx);
    handleSelectTier(currentTier, newEx, portfolioValue);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    
    // We must pass the updated messages array to the agent
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      const history = newMessages.map(m => ({ 
        role: m.role === "assistant" || m.role === "sentinel" ? "agent" : "user", 
        text: m.content 
      }));
      
      const responseText = await sendMessageToAgent(text, history.slice(0, -1), currentTier); // exclude current message
      
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          role: "assistant",
          content: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          role: "assistant",
          content: "⚠️ WeBank Agent could not be reached.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  const handleTriggerRogueTrade = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: `usr_${Date.now()}`,
        role: "user",
        content: "I want to buy 40% Emerging Markets (R5) and 30% Tokenized RWAs right now.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: `sent_${Date.now() + 1}`,
        role: "sentinel",
        content:
          "🛑 **REGULATORY HARD-STOP INTERCEPTION [CSRC RULE ENFORCED]**\n\nYour order has been **REJECTED** by the Compliance Sentinel.\n\n• **Violation**: You are categorized as **Level C3 (Balanced)**. You are legally restricted to product tiers **R1, R2, and R3**.\n• **Breach**: 'EMERGING-MKTS' and 'TOKEN-TREAS-RWA' are classified as **Tier R5 (High Risk)**.\n• **CSRC Mandate**: 《证券期货投资者适当性管理办法》第十九条: Financial institutions are strictly prohibited from recommending transactions exceeding the investor's certified risk level.\n\nAllocation reverted to approved C3 parameters. Incident logged.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleTriggerRateShock = () => {
    handleSendMessage("Simulate a +100bps Interest Rate Shock across all bond holdings.");
  };

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
        content: `✓ **Sandbox Rebalance Executed Successfully!**\n\n• All target positions adjusted in simulated account.\n• Mandate Hash: \`${audit.sha256_fingerprint.substring(0, 24)}...\`\n• Cryptographic non-repudiation log added to immutable ledger.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleResetSession = () => {
    setIsWizardComplete(false);
    setMessages([]);
  };

  /* ── Dashboard layout ─────────────────────────────────────────── */
  const DashboardContent = () => (
    <AnimatePresence mode="wait">
      {dashboardMode === "simple" && !chatOpen ? (
        <motion.div
          key="simple"
          variants={modeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <SimpleDashboard
            allocation={allocation}
            monteCarlo={monteCarlo}
            currentTier={currentTier}
            portfolioValue={portfolioValue}
            excludedAssets={excludedAssets}
            onUpdatePortfolioValue={handleUpdatePortfolioValue}
            onToggleAsset={handleToggleAsset}
            onOpenChat={() => setChatOpen(true)}
            onSelectTier={handleSelectTier}
          />
        </motion.div>
      ) : dashboardMode === "simple" && chatOpen ? (
        /* Simple mode + chat open: show chat panel only */
        <motion.div
          key="simple-chat"
          variants={modeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1 flex flex-col overflow-hidden relative"
        >
          {/* Back button */}
          <div className="shrink-0 px-4 pt-3">
            <button
              onClick={() => setChatOpen(false)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors font-mono uppercase tracking-wider"
            >
              ← Back to overview
            </button>
          </div>
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            onSelectTier={handleSelectTier}
            currentTier={currentTier}
            onTriggerRogueTrade={handleTriggerRogueTrade}
            onTriggerRateShock={handleTriggerRateShock}
          />
        </motion.div>
      ) : (
        /* Expert mode: full split layout */
        <motion.div
          key="expert"
          variants={modeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1 flex flex-col md:flex-row overflow-hidden"
        >
          <div className="w-full md:w-[42%] h-full flex flex-col border-r border-zinc-900">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              onSelectTier={handleSelectTier}
              currentTier={currentTier}
              onTriggerRogueTrade={handleTriggerRogueTrade}
              onTriggerRateShock={handleTriggerRateShock}
            />
          </div>
          <div className="w-full md:w-[58%] h-full flex flex-col">
            <CockpitPanel
              allocation={allocation}
              monteCarlo={monteCarlo}
              auditRecord={currentAudit}
              onExecuteRebalance={handleExecuteRebalance}
              isRebalancing={isRebalancing}
              onOpenAudit={() => setIsAuditModalOpen(true)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <AnimatePresence mode="wait">
      {currentPage === "landing" ? (
        <motion.div
          key="landing"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <LandingPage onLaunch={() => setCurrentPage("dashboard")} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-black text-white"
          style={{ height: "100vh" }}
        >
          <Navbar
            clientName={clientName}
            riskLevel={currentTier}
            portfolioValue={portfolioValue}
            onOpenAudit={() => setIsAuditModalOpen(true)}
            onReset={handleResetSession}
            onBackToLanding={() => setCurrentPage("landing")}
            dashboardMode={dashboardMode}
            onToggleMode={() => setDashboardMode(m => m === "simple" ? "expert" : "simple")}
          />

          <div className="flex-1 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 3rem)" }}>
            <DashboardContent />
          </div>

          <AuditModal
            isOpen={isAuditModalOpen}
            onClose={() => setIsAuditModalOpen(false)}
            records={auditRecords}
          />

          {!isWizardComplete && (
            <RiskProfilingWizard onComplete={handleCompleteWizard} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
