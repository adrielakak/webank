"""
WeAdvisory AI Quantitative & Compliance Engine.
"""

from engine.models import (
    InvestorRiskLevel,
    ProductRiskTier,
    AssetSpec,
    InvestorProfile,
    PortfolioAllocation,
    MonteCarloPercentilePath,
    ComplianceAuditRecord,
)
from engine.universe import (
    SANDBOX_UNIVERSE,
    ASSET_MAP,
    ASSET_IDS,
    COVARIANCE_MATRIX,
    EXPECTED_RETURNS,
)
from engine.compliance import (
    validate_allocation,
    compute_composite_risk,
    CSRC_ALLOWED_TIERS,
)
from engine.optimizer import optimize_portfolio
from engine.monte_carlo import run_monte_carlo_simulation
from engine.audit import generate_audit_record, verify_audit_record

__all__ = [
    "InvestorRiskLevel",
    "ProductRiskTier",
    "AssetSpec",
    "InvestorProfile",
    "PortfolioAllocation",
    "MonteCarloPercentilePath",
    "ComplianceAuditRecord",
    "SANDBOX_UNIVERSE",
    "ASSET_MAP",
    "ASSET_IDS",
    "COVARIANCE_MATRIX",
    "EXPECTED_RETURNS",
    "validate_allocation",
    "compute_composite_risk",
    "CSRC_ALLOWED_TIERS",
    "optimize_portfolio",
    "run_monte_carlo_simulation",
    "generate_audit_record",
    "verify_audit_record",
]
