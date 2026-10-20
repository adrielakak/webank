// ──────────────────────────────────────────────
// Adastra : Type Definitions
// ──────────────────────────────────────────────

export interface StockPoint {
  stkcd: number;
  risk_x: number;       // Idiosyncratic volatility (X axis)
  return_y: number;     // Monthly return (Y axis)
  predicted_risk: 0 | 1 | 2 | 3 | 4;
  actual_risk: 0 | 1 | 2 | 3 | 4;
  prob_no_risk: number;
  prob_low_risk: number;
  prob_medium_risk: number;
  prob_high_risk: number;
  prob_severe_risk: number;
  risk_label: "No Risk" | "Low Risk" | "Medium Risk" | "High Risk" | "Severe Risk";
  risk_color: string;
  market_equity: number;
  sector: string;
  top_shap: Record<string, number>;
  tk_peer_reward?: number;
  is_imputed?: boolean;
}

export interface StockDetail {
  stkcd: number;
  date: string;
  risk_x: number;
  return_y: number;
  actual_return?: number;
  predicted_risk: 0 | 1 | 2 | 3 | 4;
  actual_risk: 0 | 1 | 2 | 3 | 4;
  risk_label: "No Risk" | "Low Risk" | "Medium Risk" | "High Risk" | "Severe Risk";
  actual_risk_label?: string;
  accuracy_status?: "EXACT_MATCH" | "CONSERVATIVE_PROTECTION" | "UNDERESTIMATED_RISK";
  quadrant?: string;
  expected_return_z?: number;
  expected_return_pct?: number;
  risk_color: string;
  prob_no_risk: number;
  prob_low_risk: number;
  prob_medium_risk: number;
  prob_high_risk: number;
  prob_severe_risk: number;
  market_equity: number;
  sector: string;
  shap_features: ShapFeature[];
  compliance?: ComplianceStatus;
  xai_explanation: string;
  tk_peer_reward?: number;
  is_imputed?: boolean;
  history_data?: {month: string, value: number}[];
  timeline_2023?: TimelineMonth[];
}

export interface TimelineMonth {
  date: string;
  month_label: string;
  return_y: number;
  risk_x: number;
  predicted_risk: number;
  actual_risk: number;
  risk_label: string;
  actual_risk_label: string;
  risk_color: string;
  is_exact: boolean;
  is_conservative: boolean;
  is_current: boolean;
}

export interface ComplianceStatus {
  profile: string;
  is_compliant: boolean;
  reason: string;
  audit_hash: string;
  timestamp: number;
}

export interface ShapFeature {
  feature: string;
  value: number;
}

export interface MarketStats {
  date: string;
  total_stocks: number;
  avg_volatility: number;
  median_volatility: number;
  avg_return: number;
  median_return: number;
  is_synthetic?: boolean;
  dataset_label?: string;
  risk_distribution: {
    no_risk: number;
    low_risk: number;
    medium_risk: number;
    high_risk: number;
    severe_risk: number;
  };
  risk_percentages: {
    no_risk: number;
    low_risk: number;
    medium_risk: number;
    high_risk: number;
    severe_risk: number;
  };
}

export interface DatesResponse {
  dates: string[];
  count: number;
  is_synthetic?: boolean;
  dataset_label?: string;
}

export interface StocksResponse {
  date: string;
  count: number;
  stocks: StockPoint[];
}

export interface BacktestSummary {
  strategy_cum_return: number;
  benchmark_cum_return: number;
  net_alpha: number;
  strategy_sharpe: number;
  benchmark_sharpe: number;
  strategy_max_dd: number;
  benchmark_max_dd: number;
  monthly_win_rate: number;
  win_months_count: number;
  total_months_count: number;
  total_signals: number;
}

export interface BacktestMonthSeries {
  date: string;
  month: string;
  month_label: string;
  strategy_ret: number;
  benchmark_ret: number;
  avoid_ret: number;
  defensive_ret: number;
  speculative_ret: number;
  alpha_ret: number;
  strategy_cum: number;
  benchmark_cum: number;
  avoid_cum: number;
  defensive_cum: number;
  speculative_cum: number;
  outperformed: boolean;
}

export interface BacktestQuadrant {
  key: string;
  label: string;
  role: string;
  avg_monthly_return: number;
  cum_return: number;
  count: number;
  color: string;
}

export interface BacktestTopPick {
  stkcd: number;
  date: string;
  month_label: string;
  return_y: number;
  risk_x: number;
  sector: string;
  market_equity: number;
  predicted_risk: number;
  actual_risk: number;
}

export interface BacktestResponse {
  summary: BacktestSummary;
  monthly_series: BacktestMonthSeries[];
  quadrants: BacktestQuadrant[];
  top_picks_all_time: BacktestTopPick[];
  selected_month: string;
  month_picks: BacktestTopPick[];
}

export interface InvestorQuestionnaireAnswers {
  q1_horizon: string;
  q2_drawdown: string;
  q3_experience: string;
  q4_objective: string;
  q5_liquidity: string;
}

export interface ProfileBreakdownItem {
  question: string;
  selected_option: string;
  label: string;
  points: number;
}

export interface InvestorProfileResult {
  score: number;
  category: "C1" | "C2" | "C3" | "C4" | "C5";
  csrc_product: string;
  title: string;
  allowed_risk_levels: number[];
  max_drawdown_tolerance: string;
  summary: string;
  breakdown: Record<string, ProfileBreakdownItem>;
  certificate_hash: string;
  timestamp: number;
}

export interface RecommendedHolding {
  stkcd: number;
  weight: number;
  weight_ratio: number;
  allocation_cny: number;
  predicted_risk: number;
  risk_label: string;
  risk_color: string;
  return_y: number;
  risk_x: number;
  sector: string;
  market_equity: number;
  compliance_status: ComplianceStatus;
}

export interface PortfolioRecommendation {
  profile: string;
  investor_category: string;
  date: string;
  budget: number;
  holdings: RecommendedHolding[];
  summary: {
    portfolio_expected_return_pct: number;
    portfolio_volatility_pct: number;
    estimated_sharpe: number;
    total_assets: number;
    is_fully_compliant: boolean;
  };
  audit_hash: string;
  timestamp: number;
}

export interface AdviserChatResponse {
  reply: string;
  referenced_stkcd?: number;
  referenced_profile?: string;
  suggested_prompts?: string[];
  audit_hash: string;
}
