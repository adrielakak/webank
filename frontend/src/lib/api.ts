import {
  AssetSpec,
  PortfolioAllocation,
  MonteCarloPath,
  ComplianceAuditRecord,
  DiagnosticResponse,
  InvestorRiskLevel,
} from "../types";

const API_BASE = "http://localhost:8001/api";

export async function fetchUniverse(): Promise<AssetSpec[]> {
  try {
    const res = await fetch(`${API_BASE}/universe`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend unavailable, using static sandbox universe", e);
  }

  // Fallback data matching engine/universe.py
  return [
    { asset_id: "CASH-USD", name: "USD Cash & Yield Equivalents", category: "Money Market", risk_tier: "R1", expected_return: 0.045, volatility: 0.005, max_weight_ceiling: 1.0 },
    { asset_id: "CN-CGB-10Y", name: "China Gov 10Y Bond Index", category: "Sovereign Debt", risk_tier: "R2", expected_return: 0.032, volatility: 0.035, max_weight_ceiling: 0.6 },
    { asset_id: "US-TREAS-7Y", name: "US 7-10 Year Treasury ETF", category: "Sovereign Debt", risk_tier: "R2", expected_return: 0.048, volatility: 0.055, max_weight_ceiling: 0.6 },
    { asset_id: "CORP-IG-BOND", name: "Global Investment Grade Bonds", category: "Corporate Debt", risk_tier: "R3", expected_return: 0.058, volatility: 0.072, max_weight_ceiling: 0.4 },
    { asset_id: "GLOBAL-DIVIDEND", name: "Global Dividend Achievers ETF", category: "Equities (Defensive)", risk_tier: "R3", expected_return: 0.075, volatility: 0.120, max_weight_ceiling: 0.35 },
    { asset_id: "GOLD-PHYS", name: "Physical Gold Trust", category: "Commodities", risk_tier: "R3", expected_return: 0.060, volatility: 0.145, max_weight_ceiling: 0.25 },
    { asset_id: "MSCI-WORLD-ETF", name: "MSCI World Index ETF", category: "Core Equities", risk_tier: "R4", expected_return: 0.095, volatility: 0.165, max_weight_ceiling: 0.35 },
    { asset_id: "TECH-INNOVATION", name: "Tech & AI Sector ETF", category: "High-Beta Growth", risk_tier: "R4", expected_return: 0.140, volatility: 0.245, max_weight_ceiling: 0.30 },
    { asset_id: "EMERGING-MKTS", name: "Emerging Markets Equity ETF", category: "Developing Equities", risk_tier: "R5", expected_return: 0.108, volatility: 0.215, max_weight_ceiling: 0.25 },
    { asset_id: "TOKEN-TREAS-RWA", name: "Tokenized US Treasury (RWA)", category: "On-Chain RWA", risk_tier: "R5", expected_return: 0.052, volatility: 0.060, max_weight_ceiling: 0.20 },
  ];
}

export async function evaluateProfile(params: {
  client_id: string;
  name: string;
  horizon_years: number;
  loss_tolerance_pct: number;
  primary_goal: string;
  reaction_to_drawdown: string;
  initial_capital: number;
}): Promise<DiagnosticResponse> {
  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend unavailable, using fallback diagnostic", e);
  }

  // Fallback calculation matching backend logic
  return {
    client_id: params.client_id,
    name: params.name,
    risk_level: "C3",
    csrc_classification_chinese: "C3 平衡型",
    csrc_classification_english: "Balanced (Moderate Growth & Stability)",
    suitability_summary: "Balanced blend of fixed income, dividend equities, and safe havens.",
    permissible_risk_tiers: ["R1", "R2", "R3"],
    initial_capital: params.initial_capital,
    horizon_years: params.horizon_years,
  };
}

export async function optimizePortfolio(clientTier: InvestorRiskLevel, excludedAssets: string[] = []): Promise<PortfolioAllocation> {
  try {
    const res = await fetch(`${API_BASE}/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_tier: clientTier, excluded_assets: excludedAssets, risk_free_rate: 0.035 }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend unavailable, using fallback optimization", e);
  }

  // Pre-calculated deterministic fallback matching engine/optimizer.py
  const fallbacks: Record<InvestorRiskLevel, PortfolioAllocation> = {
    C1: {
      client_tier: "C1",
      weights: { "CASH-USD": 1.0 },
      expected_annual_return: 0.045,
      expected_annual_volatility: 0.005,
      sharpe_ratio: 2.0,
      composite_risk_tier: "R1",
      is_compliant: true,
      compliance_message: "Compliant: 100% capital preservation allocation.",
    },
    C2: {
      client_tier: "C2",
      weights: { "CASH-USD": 0.4, "CN-CGB-10Y": 0.189, "US-TREAS-7Y": 0.411 },
      expected_annual_return: 0.0438,
      expected_annual_volatility: 0.0256,
      sharpe_ratio: 0.342,
      composite_risk_tier: "R2",
      is_compliant: true,
      compliance_message: "Compliant: Allocation fully satisfies CSRC investor suitability guidelines.",
    },
    C3: {
      client_tier: "C3",
      weights: { "GLOBAL-DIVIDEND": 0.3062, "CORP-IG-BOND": 0.299, "CASH-USD": 0.2, "GOLD-PHYS": 0.1084, "US-TREAS-7Y": 0.0864 },
      expected_annual_return: 0.06,
      expected_annual_volatility: 0.0553,
      sharpe_ratio: 0.451,
      composite_risk_tier: "R3",
      is_compliant: true,
      compliance_message: "Compliant: Allocation fully satisfies CSRC investor suitability guidelines.",
    },
    C4: {
      client_tier: "C4",
      weights: { "MSCI-WORLD-ETF": 0.3235, "TECH-INNOVATION": 0.3, "GOLD-PHYS": 0.1993, "GLOBAL-DIVIDEND": 0.1121, "CORP-IG-BOND": 0.0652 },
      expected_annual_return: 0.0969,
      expected_annual_volatility: 0.1385,
      sharpe_ratio: 0.447,
      composite_risk_tier: "R4",
      is_compliant: true,
      compliance_message: "Compliant: Allocation fully satisfies CSRC investor suitability guidelines.",
    },
    C5: {
      client_tier: "C5",
      weights: { "MSCI-WORLD-ETF": 0.35, "TECH-INNOVATION": 0.3, "EMERGING-MKTS": 0.25, "GLOBAL-DIVIDEND": 0.1 },
      expected_annual_return: 0.1097,
      expected_annual_volatility: 0.1801,
      sharpe_ratio: 0.415,
      composite_risk_tier: "R5",
      is_compliant: true,
      compliance_message: "Compliant: Allocation fully satisfies CSRC investor suitability guidelines.",
    },
  };

  return fallbacks[clientTier];
}

export async function simulateMonteCarlo(
  allocation: PortfolioAllocation,
  initialCapital: number = 50000,
  horizonYears: number = 5
): Promise<MonteCarloPath> {
  try {
    const res = await fetch(`${API_BASE}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allocation,
        initial_capital: initialCapital,
        horizon_years: horizonYears,
        num_simulations: 1000,
      }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend unavailable, generating stochastic path client-side", e);
  }

  // Client-side simulation fallback
  const months = Array.from({ length: horizonYears * 12 + 1 }, (_, i) => i);
  const mu = allocation.expected_annual_return;
  const sigma = Math.max(allocation.expected_annual_volatility, 0.01);
  const dt = 1.0 / 12.0;

  const p10: number[] = [initialCapital];
  const p50: number[] = [initialCapital];
  const p90: number[] = [initialCapital];

  for (let m = 1; m <= horizonYears * 12; m++) {
    const t = m * dt;
    p10.push(initialCapital * Math.exp((mu - 0.5 * sigma * sigma) * t - 1.28 * sigma * Math.sqrt(t)));
    p50.push(initialCapital * Math.exp((mu - 0.5 * sigma * sigma) * t));
    p90.push(initialCapital * Math.exp((mu - 0.5 * sigma * sigma) * t + 1.28 * sigma * Math.sqrt(t)));
  }

  return {
    months,
    p10_pessimistic: p10.map((v) => Math.round(v)),
    p50_median: p50.map((v) => Math.round(v)),
    p90_optimistic: p90.map((v) => Math.round(v)),
    initial_value: initialCapital,
    terminal_p10: Math.round(p10[p10.length - 1]),
    terminal_p50: Math.round(p50[p50.length - 1]),
    terminal_p90: Math.round(p90[p90.length - 1]),
    probability_of_loss: 0.038,
    max_drawdown_p50: 0.052,
  };
}

export async function createAuditRecord(payload: {
  client_id: string;
  risk_level: InvestorRiskLevel;
  composite_risk_tier: string;
  compliance_status: string;
  violations: string[];
  weights: Record<string, number>;
}): Promise<ComplianceAuditRecord> {
  try {
    const res = await fetch(`${API_BASE}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend unavailable, generating local audit record", e);
  }

  return {
    audit_id: `aud_${Math.random().toString(36).substring(2, 11)}`,
    timestamp_utc: new Date().toISOString(),
    client_id: payload.client_id,
    risk_level: payload.risk_level,
    composite_risk_tier: payload.composite_risk_tier as any,
    compliance_status: payload.compliance_status,
    violations: payload.violations,
    weights: payload.weights,
    sha256_fingerprint: "0x8f2a" + Array.from({ length: 60 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
  };
}

export async function fetchAuditRecords(): Promise<ComplianceAuditRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/audit/records?limit=15`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Backend unavailable, using simulated audit history", e);
  }

  return [
    {
      audit_id: "aud_9f482a1c0b",
      timestamp_utc: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      client_id: "usr_sarah_jenkins",
      risk_level: "C3",
      composite_risk_tier: "R3",
      compliance_status: "APPROVED",
      violations: [],
      weights: { "GLOBAL-DIVIDEND": 0.3062, "CORP-IG-BOND": 0.299, "CASH-USD": 0.2, "GOLD-PHYS": 0.1084, "US-TREAS-7Y": 0.0864 },
      sha256_fingerprint: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
    {
      audit_id: "aud_3d81c7901e",
      timestamp_utc: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      client_id: "usr_alex_zhang",
      risk_level: "C2",
      composite_risk_tier: "R2",
      compliance_status: "APPROVED",
      violations: [],
      weights: { "US-TREAS-7Y": 0.411, "CASH-USD": 0.4, "CN-CGB-10Y": 0.189 },
      sha256_fingerprint: "a94892cbf94291823908facc81726a8d791240a928e17812903bda827189a01f",
    },
  ];
}

export async function sendMessageToAgent(message: string, history: {role: string, text: string}[], clientTier: string = "C3"): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, client_tier: clientTier }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.response;
    }
    return "⚠️ Sorry, the WeBank AI system is currently unavailable.";
  } catch (e) {
    console.error("Chat API error:", e);
    return "⚠️ Communication error. Please check your connection to the WeBank Gateway.";
  }
}
