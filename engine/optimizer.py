"""
Deterministic Markowitz Portfolio Optimizer.
Implements Modern Portfolio Theory with Mean-Variance Quadratic Utility:
    max U(w) = w^T * mu - (lambda / 2) * w^T * Sigma * w
where lambda is the investor's risk-aversion coefficient (C1 to C5).
Subject to CSRC suitability boundaries and asset concentration limits.
"""

from typing import Dict, List
import numpy as np
from scipy.optimize import minimize

from engine.models import InvestorRiskLevel, PortfolioAllocation
from engine.universe import (
    ASSET_IDS,
    ASSET_MAP,
    NUM_ASSETS,
    EXPECTED_RETURNS,
    COVARIANCE_MATRIX,
)
from engine.compliance import get_optimization_bounds, validate_allocation


# Arrow-Pratt Risk Aversion Parameter (lambda)
# Higher lambda = higher risk aversion (penalizes volatility heavily)
RISK_AVERSION_LAMBDA: Dict[InvestorRiskLevel, float] = {
    InvestorRiskLevel.C1_CONSERVATIVE: 50.0,  # Extreme risk aversion -> Capital preservation
    InvestorRiskLevel.C2_PRUDENT: 18.0,       # High risk aversion -> Fixed income focus
    InvestorRiskLevel.C3_BALANCED: 6.5,       # Moderate risk aversion -> Multi-asset balance
    InvestorRiskLevel.C4_GROWTH: 2.2,         # Low risk aversion -> Growth equities focus
    InvestorRiskLevel.C5_AGGRESSIVE: 0.8,     # Aggressive -> High-beta & alternative assets
}

# Maximum Cash Allocation per Risk Tier
# Prevents aggressive growth investors from being allocated 100% Cash
MAX_CASH_ALLOCATION: Dict[InvestorRiskLevel, float] = {
    InvestorRiskLevel.C1_CONSERVATIVE: 1.00,
    InvestorRiskLevel.C2_PRUDENT: 0.40,
    InvestorRiskLevel.C3_BALANCED: 0.20,
    InvestorRiskLevel.C4_GROWTH: 0.10,
    InvestorRiskLevel.C5_AGGRESSIVE: 0.05,
}


def optimize_portfolio(
    client_tier: InvestorRiskLevel,
    risk_free_rate: float = 0.035,
    excluded_assets: List[str] = None
) -> PortfolioAllocation:
    """
    Computes the optimal asset weights for a given investor risk level.
    Guarantees deterministic, zero-hallucination results.
    """
    # 1. Special Case: C1 Conservative (100% Cash / R1 Sovereign equivalents)
    if client_tier == InvestorRiskLevel.C1_CONSERVATIVE:
        weights = {aid: 0.0 for aid in ASSET_IDS}
        weights["CASH-USD"] = 1.0
        exp_ret = float(ASSET_MAP["CASH-USD"].expected_return)
        exp_vol = float(ASSET_MAP["CASH-USD"].volatility)
        sharpe = (exp_ret - risk_free_rate) / exp_vol if exp_vol > 0 else 0.0
        
        is_compliant, violations, comp_tier = validate_allocation(client_tier, weights)
        return PortfolioAllocation(
            client_tier=client_tier,
            weights=weights,
            expected_annual_return=round(exp_ret, 4),
            expected_annual_volatility=round(exp_vol, 4),
            sharpe_ratio=round(sharpe, 3),
            composite_risk_tier=comp_tier,
            is_compliant=is_compliant,
            compliance_message="Compliant: 100% capital preservation allocation."
        )

    # 2. General Case: Quadratic Utility Maximization
    # Bounds derived from CSRC suitability rules
    raw_bounds = get_optimization_bounds(client_tier)
    
    # Cap cash based on investor growth orientation
    bounds = []
    cash_cap = MAX_CASH_ALLOCATION[client_tier]
    for i, asset_id in enumerate(ASSET_IDS):
        low, high = raw_bounds[i]
        
        # Override bounds if asset is excluded
        if excluded_assets and asset_id in excluded_assets:
            high = 0.0
            
        if asset_id == "CASH-USD":
            bounds.append((low, min(high, cash_cap)))
        else:
            bounds.append((low, high))

    active_indices = [i for i, (low, high) in enumerate(bounds) if high > 0.0]
    n_active = len(active_indices)
    
    # Equal-weight starting point among permissible assets
    w0 = np.zeros(NUM_ASSETS)
    for i in active_indices:
        w0[i] = 1.0 / n_active

    lam = RISK_AVERSION_LAMBDA[client_tier]

    def objective_neg_utility(w: np.ndarray) -> float:
        """
        Negative Quadratic Utility: - [ w^T * mu - (lambda / 2) * w^T * Sigma * w ]
        Minimizing this maximizes the investor's risk-adjusted utility.
        """
        port_ret = float(np.dot(w, EXPECTED_RETURNS))
        port_var = float(np.dot(w.T, np.dot(COVARIANCE_MATRIX, w)))
        utility = port_ret - (lam / 2.0) * port_var
        return -utility

    # Constraint: sum of weights equals 1.0
    budget_constraint = {
        "type": "eq",
        "fun": lambda w: np.sum(w) - 1.0
    }

    # Run SLSQP optimizer
    opt_res = minimize(
        fun=objective_neg_utility,
        x0=w0,
        method="SLSQP",
        bounds=bounds,
        constraints=[budget_constraint],
        options={"maxiter": 1000, "ftol": 1e-9}
    )

    if opt_res.success:
        raw_weights = opt_res.x
    else:
        raw_weights = w0

    # Clean small numerical noise (< 0.5% -> 0.0)
    cleaned_weights = np.where(raw_weights < 0.005, 0.0, raw_weights)
    
    # Ensure forbidden assets remain strictly 0.0
    for i, (low, high) in enumerate(bounds):
        if high == 0.0:
            cleaned_weights[i] = 0.0
            
    # Renormalize to exact 1.0 sum
    sum_w = np.sum(cleaned_weights)
    if sum_w > 0:
        cleaned_weights = cleaned_weights / sum_w
    else:
        cleaned_weights = w0 / np.sum(w0)

    # Compute portfolio metrics
    exp_ret = float(np.dot(cleaned_weights, EXPECTED_RETURNS))
    exp_var = float(np.dot(cleaned_weights.T, np.dot(COVARIANCE_MATRIX, cleaned_weights)))
    exp_vol = float(np.sqrt(max(exp_var, 1e-8)))
    sharpe = (exp_ret - risk_free_rate) / exp_vol if exp_vol > 0 else 0.0

    # Format weights dictionary
    weights_dict: Dict[str, float] = {}
    for i, asset_id in enumerate(ASSET_IDS):
        w = round(float(cleaned_weights[i]), 4)
        if w > 0.0:
            weights_dict[asset_id] = w

    # Final compliance verification
    is_compliant, violations, comp_tier = validate_allocation(client_tier, weights_dict)
    
    compliance_msg = (
        "Compliant: Allocation fully satisfies CSRC investor suitability guidelines."
        if is_compliant
        else f"Compliance Warning: {'; '.join(violations)}"
    )

    return PortfolioAllocation(
        client_tier=client_tier,
        weights=weights_dict,
        expected_annual_return=round(exp_ret, 4),
        expected_annual_volatility=round(exp_vol, 4),
        sharpe_ratio=round(sharpe, 3),
        composite_risk_tier=comp_tier,
        is_compliant=is_compliant,
        compliance_message=compliance_msg
    )
