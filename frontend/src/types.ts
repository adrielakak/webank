export type InvestorRiskLevel = "C1" | "C2" | "C3" | "C4" | "C5";
export type ProductRiskTier = "R1" | "R2" | "R3" | "R4" | "R5";

export interface AssetSpec {
  asset_id: string;
  name: string;
  category: string;
  risk_tier: ProductRiskTier;
  expected_return: number;
  volatility: number;
  max_weight_ceiling: number;
}

export interface PortfolioAllocation {
  client_tier: InvestorRiskLevel;
  weights: Record<string, number>;
  expected_annual_return: number;
  expected_annual_volatility: number;
  sharpe_ratio: number;
  composite_risk_tier: ProductRiskTier;
  is_compliant: boolean;
  compliance_message: string;
}

export interface MonteCarloPath {
  months: number[];
  p10_pessimistic: number[];
  p50_median: number[];
  p90_optimistic: number[];
  initial_value: number;
  terminal_p10: number;
  terminal_p50: number;
  terminal_p90: number;
  probability_of_loss: number;
  max_drawdown_p50: number;
}

export interface ComplianceAuditRecord {
  audit_id: string;
  timestamp_utc: string;
  client_id: string;
  risk_level: InvestorRiskLevel;
  composite_risk_tier: ProductRiskTier;
  compliance_status: string;
  violations: string[];
  weights: Record<string, number>;
  sha256_fingerprint: string;
}

export interface DiagnosticResponse {
  client_id: string;
  name: string;
  risk_level: InvestorRiskLevel;
  csrc_classification_chinese: string;
  csrc_classification_english: string;
  suitability_summary: string;
  permissible_risk_tiers: string[];
  initial_capital: number;
  horizon_years: number;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user" | "sentinel";
  content: string;
  timestamp: string;
  options?: { label: string; action: () => void }[];
}
