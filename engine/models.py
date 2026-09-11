"""
Data models and schemas for WeAdvisory AI Quantitative & Compliance Engine.
Strictly adheres to CSRC C1-C5 investor suitability & R1-R5 product classifications.
"""

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class InvestorRiskLevel(str, Enum):
    """
    CSRC Investor Risk Tolerance Levels (投资者风险承受能力等级)
    """
    C1_CONSERVATIVE = "C1"   # 保守型: Capital preservation, zero tolerance for loss
    C2_PRUDENT = "C2"        # 谨慎型: Low risk, stable returns
    C3_BALANCED = "C3"       # 平衡型: Moderate risk, balanced asset appreciation
    C4_GROWTH = "C4"         # 积极型 / 成长型: High risk, capital appreciation
    C5_AGGRESSIVE = "C5"     # 激进型 / 进取型: Maximum risk tolerance, speculative assets


class ProductRiskTier(str, Enum):
    """
    CSRC / WeBank Product Risk Ratings (产品风险等级)
    """
    R1_LOW = "R1"            # 低风险: Money market, sovereign cash equivalents
    R2_MEDIUM_LOW = "R2"     # 中低风险: Sovereign bonds, high-grade debt
    R3_MEDIUM = "R3"         # 中风险: Multi-asset funds, investment-grade credit, gold
    R4_MEDIUM_HIGH = "R4"    # 中高风险: Equities, sector growth ETFs
    R5_HIGH = "R5"           # 高风险: High-beta emerging markets, crypto / RWAs


class AssetSpec(BaseModel):
    """Specification of an investable asset in the sandbox universe."""
    asset_id: str
    name: str
    category: str
    risk_tier: ProductRiskTier
    expected_return: float = Field(..., description="Annualized expected return (mu), e.g. 0.08 for 8%")
    volatility: float = Field(..., description="Annualized standard deviation (sigma), e.g. 0.15 for 15%")
    max_weight_ceiling: float = Field(0.35, description="Anti-concentration limit (max % allowed)")


class InvestorProfile(BaseModel):
    """Validated client profile from psychometric onboarding."""
    client_id: str
    name: str
    risk_level: InvestorRiskLevel
    horizon_years: int = Field(5, ge=1, le=30)
    initial_capital: float = Field(50000.0, ge=100.0)
    monthly_contribution: float = Field(0.0, ge=0.0)


class PortfolioAllocation(BaseModel):
    """Deterministic output from Markowitz optimization engine."""
    client_tier: InvestorRiskLevel
    weights: Dict[str, float]
    expected_annual_return: float
    expected_annual_volatility: float
    sharpe_ratio: float
    composite_risk_tier: ProductRiskTier
    is_compliant: bool
    compliance_message: str


class MonteCarloPercentilePath(BaseModel):
    """Percentile trajectories from stochastic forward simulation."""
    months: List[int]
    p10_pessimistic: List[float]
    p50_median: List[float]
    p90_optimistic: List[float]
    initial_value: float
    terminal_p10: float
    terminal_p50: float
    terminal_p90: float
    probability_of_loss: float
    max_drawdown_p50: float


class ComplianceAuditRecord(BaseModel):
    """Immutable audit record for regulatory inspection."""
    audit_id: str
    timestamp_utc: str
    client_id: str
    risk_level: InvestorRiskLevel
    composite_risk_tier: ProductRiskTier
    compliance_status: str
    violations: List[str]
    weights: Dict[str, float]
    sha256_fingerprint: str
