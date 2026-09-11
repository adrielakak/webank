"""
Compliance Sentinel & CSRC Suitability Engine.
Implements the official 《证券期货投资者适当性管理办法》 (Investor Suitability Standards).
Guarantees hard-stop mathematical boundaries between Investor Levels (C1-C5)
and Product Risk Tiers (R1-R5).
"""

from typing import Dict, List, Tuple
from engine.models import InvestorRiskLevel, ProductRiskTier
from engine.universe import ASSET_MAP, ASSET_IDS, NUM_ASSETS


# CSRC Regulatory Allowed Product Tiers per Investor Level
# 核心原则: 严禁向投资者主动推介高于其风险承受能力的产品
CSRC_ALLOWED_TIERS: Dict[InvestorRiskLevel, List[ProductRiskTier]] = {
    InvestorRiskLevel.C1_CONSERVATIVE: [
        ProductRiskTier.R1_LOW
    ],
    InvestorRiskLevel.C2_PRUDENT: [
        ProductRiskTier.R1_LOW,
        ProductRiskTier.R2_MEDIUM_LOW
    ],
    InvestorRiskLevel.C3_BALANCED: [
        ProductRiskTier.R1_LOW,
        ProductRiskTier.R2_MEDIUM_LOW,
        ProductRiskTier.R3_MEDIUM
    ],
    InvestorRiskLevel.C4_GROWTH: [
        ProductRiskTier.R1_LOW,
        ProductRiskTier.R2_MEDIUM_LOW,
        ProductRiskTier.R3_MEDIUM,
        ProductRiskTier.R4_MEDIUM_HIGH
    ],
    InvestorRiskLevel.C5_AGGRESSIVE: [
        ProductRiskTier.R1_LOW,
        ProductRiskTier.R2_MEDIUM_LOW,
        ProductRiskTier.R3_MEDIUM,
        ProductRiskTier.R4_MEDIUM_HIGH,
        ProductRiskTier.R5_HIGH
    ],
}

# Numeric scores for risk tiers to compute composite portfolio risk
TIER_NUMERIC_WEIGHT: Dict[ProductRiskTier, float] = {
    ProductRiskTier.R1_LOW: 1.0,
    ProductRiskTier.R2_MEDIUM_LOW: 2.0,
    ProductRiskTier.R3_MEDIUM: 3.0,
    ProductRiskTier.R4_MEDIUM_HIGH: 4.0,
    ProductRiskTier.R5_HIGH: 5.0,
}


def compute_composite_risk(weights: Dict[str, float]) -> Tuple[float, ProductRiskTier]:
    """
    Computes the weighted composite risk score (1.0 to 5.0) and maps to an effective Risk Tier.
    """
    total_score = 0.0
    for asset_id, weight in weights.items():
        if asset_id in ASSET_MAP:
            tier = ASSET_MAP[asset_id].risk_tier
            total_score += weight * TIER_NUMERIC_WEIGHT[tier]
    
    if total_score <= 1.5:
        effective_tier = ProductRiskTier.R1_LOW
    elif total_score <= 2.5:
        effective_tier = ProductRiskTier.R2_MEDIUM_LOW
    elif total_score <= 3.5:
        effective_tier = ProductRiskTier.R3_MEDIUM
    elif total_score <= 4.5:
        effective_tier = ProductRiskTier.R4_MEDIUM_HIGH
    else:
        effective_tier = ProductRiskTier.R5_HIGH
        
    return round(total_score, 3), effective_tier


def validate_allocation(
    client_tier: InvestorRiskLevel,
    weights: Dict[str, float]
) -> Tuple[bool, List[str], ProductRiskTier]:
    """
    Inviolable Compliance Guardrail.
    Inspects proposed portfolio weights against CSRC regulations.
    Returns: (is_compliant, list_of_violations, composite_risk_tier)
    """
    violations: List[str] = []
    allowed_tiers = CSRC_ALLOWED_TIERS[client_tier]
    
    # 1. Check weight sum
    total_weight = sum(weights.values())
    if abs(total_weight - 1.0) > 1e-4:
        violations.append(f"Portfolio weights must sum to 1.0 (found {total_weight:.4f}).")

    # 2. Check individual product risk tier suitability
    for asset_id, weight in weights.items():
        if weight <= 1e-6:
            continue
            
        if asset_id not in ASSET_MAP:
            violations.append(f"Unknown asset identifier: {asset_id}")
            continue
            
        asset = ASSET_MAP[asset_id]
        if asset.risk_tier not in allowed_tiers:
            violations.append(
                f"Regulatory Breach [CSRC Rule]: Client level {client_tier.value} is legally prohibited "
                f"from holding product '{asset.name}' (Tier {asset.risk_tier.value}). Allocation: {weight*100:.1f}%."
            )
            
        # 3. Check anti-concentration limit
        if weight > asset.max_weight_ceiling + 1e-4:
            violations.append(
                f"Concentration Breach: Asset '{asset.name}' exceeds maximum ceiling of "
                f"{asset.max_weight_ceiling*100:.1f}% (allocated {weight*100:.1f}%)."
            )

    # 4. Compute composite risk score
    _, composite_tier = compute_composite_risk(weights)
    
    # Composite risk cannot exceed client's maximum permissible tier
    max_permissible_tier = allowed_tiers[-1]
    if TIER_NUMERIC_WEIGHT[composite_tier] > TIER_NUMERIC_WEIGHT[max_permissible_tier]:
        violations.append(
            f"Composite Risk Violation: Overall portfolio composite risk is {composite_tier.value}, "
            f"exceeding client's maximum permissible rating {max_permissible_tier.value}."
        )

    is_compliant = (len(violations) == 0)
    return is_compliant, violations, composite_tier


def get_optimization_bounds(client_tier: InvestorRiskLevel) -> List[Tuple[float, float]]:
    """
    Generates strict (min_weight, max_weight) bounds for the mathematical optimizer.
    Assets forbidden by CSRC regulations have their upper bound forced to 0.0000.
    """
    allowed_tiers = CSRC_ALLOWED_TIERS[client_tier]
    bounds = []
    
    for asset_id in ASSET_IDS:
        asset = ASSET_MAP[asset_id]
        if asset.risk_tier in allowed_tiers:
            # Allowed asset: can range from 0 to its concentration ceiling
            bounds.append((0.0, asset.max_weight_ceiling))
        else:
            # Forbidden asset: strictly locked to 0.0
            bounds.append((0.0, 0.0))
            
    return bounds
