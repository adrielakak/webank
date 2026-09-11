"""
Sandbox Asset Universe & Covariance Matrix.
Curated global multi-asset universe with WeBank/CSRC R1-R5 risk ratings.
"""

from typing import Dict, List
import numpy as np
from engine.models import AssetSpec, ProductRiskTier


# 10 Curated Multi-Asset Classes
SANDBOX_UNIVERSE: List[AssetSpec] = [
    AssetSpec(
        asset_id="CASH-USD",
        name="USD Cash & Yield Equivalents",
        category="Money Market",
        risk_tier=ProductRiskTier.R1_LOW,
        expected_return=0.045,  # 4.5% annual return
        volatility=0.005,       # 0.5% annual volatility
        max_weight_ceiling=1.00 # Cash can be 100% for C1 conservative
    ),
    AssetSpec(
        asset_id="CN-CGB-10Y",
        name="China Government 10Y Bond Index",
        category="Sovereign Debt",
        risk_tier=ProductRiskTier.R2_MEDIUM_LOW,
        expected_return=0.032,  # 3.2%
        volatility=0.035,       # 3.5%
        max_weight_ceiling=0.60
    ),
    AssetSpec(
        asset_id="US-TREAS-7Y",
        name="US 7-10 Year Treasury ETF",
        category="Sovereign Debt",
        risk_tier=ProductRiskTier.R2_MEDIUM_LOW,
        expected_return=0.048,  # 4.8%
        volatility=0.055,       # 5.5%
        max_weight_ceiling=0.60
    ),
    AssetSpec(
        asset_id="CORP-IG-BOND",
        name="Global Investment Grade Corporate Bonds",
        category="Corporate Debt",
        risk_tier=ProductRiskTier.R3_MEDIUM,
        expected_return=0.058,  # 5.8%
        volatility=0.072,       # 7.2%
        max_weight_ceiling=0.40
    ),
    AssetSpec(
        asset_id="GLOBAL-DIVIDEND",
        name="Global Dividend Achievers Equity ETF",
        category="Equities (Defensive)",
        risk_tier=ProductRiskTier.R3_MEDIUM,
        expected_return=0.075,  # 7.5%
        volatility=0.120,       # 12.0%
        max_weight_ceiling=0.35
    ),
    AssetSpec(
        asset_id="GOLD-PHYS",
        name="Physical Gold Trust",
        category="Commodities (Safe Haven)",
        risk_tier=ProductRiskTier.R3_MEDIUM,
        expected_return=0.060,  # 6.0%
        volatility=0.145,       # 14.5%
        max_weight_ceiling=0.25
    ),
    AssetSpec(
        asset_id="MSCI-WORLD-ETF",
        name="MSCI All Country World Index ETF",
        category="Core Global Equities",
        risk_tier=ProductRiskTier.R4_MEDIUM_HIGH,
        expected_return=0.095,  # 9.5%
        volatility=0.165,       # 16.5%
        max_weight_ceiling=0.35
    ),
    AssetSpec(
        asset_id="TECH-INNOVATION",
        name="Tech & AI Innovation Sector ETF",
        category="High-Beta Growth",
        risk_tier=ProductRiskTier.R4_MEDIUM_HIGH,
        expected_return=0.140,  # 14.0%
        volatility=0.245,       # 24.5%
        max_weight_ceiling=0.30
    ),
    AssetSpec(
        asset_id="EMERGING-MKTS",
        name="Emerging Markets Equity ETF",
        category="Developing Equities",
        risk_tier=ProductRiskTier.R5_HIGH,
        expected_return=0.108,  # 10.8%
        volatility=0.215,       # 21.5%
        max_weight_ceiling=0.25
    ),
    AssetSpec(
        asset_id="TOKEN-TREAS-RWA",
        name="Tokenized Short-Term Treasury / RWA",
        category="On-chain Real World Asset",
        risk_tier=ProductRiskTier.R5_HIGH,  # R5 due to on-chain/smart contract regulatory tier
        expected_return=0.052,  # 5.2%
        volatility=0.060,       # 6.0%
        max_weight_ceiling=0.20
    ),
]

ASSET_MAP: Dict[str, AssetSpec] = {a.asset_id: a for a in SANDBOX_UNIVERSE}
ASSET_IDS: List[str] = [a.asset_id for a in SANDBOX_UNIVERSE]
NUM_ASSETS = len(SANDBOX_UNIVERSE)

# Expected return vector mu
EXPECTED_RETURNS = np.array([a.expected_return for a in SANDBOX_UNIVERSE], dtype=np.float64)

# Volatilities vector sigma
VOLATILITIES = np.array([a.volatility for a in SANDBOX_UNIVERSE], dtype=np.float64)

# Realistic cross-asset correlation matrix (10x10)
# Demonstrates diversification benefits between equities, bonds, cash, gold and RWAs
CORRELATION_MATRIX = np.array([
    # CASH   CN10Y  US7Y   CORP   GDIV   GOLD   MSCI   TECH   EM     RWA
    [ 1.00,  0.05,  0.08,  0.02, -0.05, -0.02, -0.05, -0.03, -0.04,  0.15], # CASH-USD
    [ 0.05,  1.00,  0.30,  0.25,  0.08,  0.12,  0.10,  0.05,  0.20,  0.10], # CN-CGB-10Y
    [ 0.08,  0.30,  1.00,  0.55,  0.15,  0.22,  0.12,  0.08,  0.18,  0.12], # US-TREAS-7Y
    [ 0.02,  0.25,  0.55,  1.00,  0.38,  0.18,  0.42,  0.35,  0.45,  0.20], # CORP-IG-BOND
    [-0.05,  0.08,  0.15,  0.38,  1.00,  0.05,  0.75,  0.62,  0.68,  0.08], # GLOBAL-DIVIDEND
    [-0.02,  0.12,  0.22,  0.18,  0.05,  1.00,  0.08,  0.04,  0.25,  0.05], # GOLD-PHYS
    [-0.05,  0.10,  0.12,  0.42,  0.75,  0.08,  1.00,  0.84,  0.78,  0.10], # MSCI-WORLD-ETF
    [-0.03,  0.05,  0.08,  0.35,  0.62,  0.04,  0.84,  1.00,  0.72,  0.12], # TECH-INNOVATION
    [-0.04,  0.20,  0.18,  0.45,  0.68,  0.25,  0.78,  0.72,  1.00,  0.15], # EMERGING-MKTS
    [ 0.15,  0.10,  0.12,  0.20,  0.08,  0.05,  0.10,  0.12,  0.15,  1.00], # TOKEN-TREAS-RWA
], dtype=np.float64)

# Construct Covariance Matrix: Sigma = D * Correlation * D where D = diag(sigma)
D = np.diag(VOLATILITIES)
COVARIANCE_MATRIX = D @ CORRELATION_MATRIX @ D

# Ensure exact symmetry and positive semi-definiteness
COVARIANCE_MATRIX = (COVARIANCE_MATRIX + COVARIANCE_MATRIX.T) / 2.0
eigenvalues = np.linalg.eigvalsh(COVARIANCE_MATRIX)
if np.any(eigenvalues < 0):
    COVARIANCE_MATRIX += np.eye(NUM_ASSETS) * (abs(np.min(eigenvalues)) + 1e-6)
