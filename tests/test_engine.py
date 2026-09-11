"""
Comprehensive Pytest Suite for WeAdvisory AI Quantitative Engine.
Validates:
1. CSRC Suitability compliance and hard-stop protection
2. Markowitz mean-variance optimization convergence and weight sums
3. Positive semi-definiteness of covariance matrix
4. Monte Carlo percentile path integrity
5. Cryptographic audit trail and tamper detection
"""

import numpy as np
import pytest
from engine import (
    InvestorRiskLevel,
    ProductRiskTier,
    SANDBOX_UNIVERSE,
    COVARIANCE_MATRIX,
    EXPECTED_RETURNS,
    validate_allocation,
    compute_composite_risk,
    optimize_portfolio,
    run_monte_carlo_simulation,
    generate_audit_record,
    verify_audit_record,
)


def test_universe_properties():
    """Verify sandbox universe and covariance matrix mathematical properties."""
    assert len(SANDBOX_UNIVERSE) == 10
    assert len(EXPECTED_RETURNS) == 10
    assert COVARIANCE_MATRIX.shape == (10, 10)
    
    # Check symmetry
    np.testing.assert_allclose(COVARIANCE_MATRIX, COVARIANCE_MATRIX.T, atol=1e-8)
    
    # Check positive semi-definiteness (eigenvalues >= 0)
    eigenvalues = np.linalg.eigvalsh(COVARIANCE_MATRIX)
    assert np.all(eigenvalues >= -1e-8), f"Negative eigenvalue detected: {np.min(eigenvalues)}"


def test_csrc_hard_stop_blocks_unauthorized_assets():
    """
    Ensure CSRC suitability guardrail strictly blocks non-compliant allocations.
    E.g., attempting to assign R4 (Tech) or R5 (RWA) to a C2 (Prudent) investor.
    """
    # Rogue allocation: C2 Prudent client given 40% Tech Innovation (R4)
    rogue_weights = {
        "CASH-USD": 0.30,
        "US-TREAS-7Y": 0.30,
        "TECH-INNOVATION": 0.40  # R4 breach!
    }
    
    is_compliant, violations, comp_tier = validate_allocation(
        client_tier=InvestorRiskLevel.C2_PRUDENT,
        weights=rogue_weights
    )
    
    assert not is_compliant
    assert len(violations) > 0
    assert any("Regulatory Breach [CSRC Rule]" in v for v in violations)
    assert any("TECH-INNOVATION" in v or "Tier R4" in v for v in violations)


def test_c1_conservative_optimization():
    """C1 Conservative investor must receive 100% R1 capital preservation."""
    alloc = optimize_portfolio(InvestorRiskLevel.C1_CONSERVATIVE)
    
    assert alloc.is_compliant
    assert alloc.client_tier == InvestorRiskLevel.C1_CONSERVATIVE
    assert alloc.composite_risk_tier == ProductRiskTier.R1_LOW
    assert alloc.weights["CASH-USD"] == 1.0
    assert sum(alloc.weights.values()) == pytest.approx(1.0, rel=1e-4)


@pytest.mark.parametrize("client_tier", [
    InvestorRiskLevel.C2_PRUDENT,
    InvestorRiskLevel.C3_BALANCED,
    InvestorRiskLevel.C4_GROWTH,
    InvestorRiskLevel.C5_AGGRESSIVE,
])
def test_all_tiers_optimization_compliance(client_tier):
    """Verify that Markowitz optimizer generates 100% compliant portfolios across all tiers."""
    alloc = optimize_portfolio(client_tier)
    
    assert alloc.is_compliant, f"Optimization for {client_tier.value} produced non-compliant weights: {alloc.compliance_message}"
    assert sum(alloc.weights.values()) == pytest.approx(1.0, abs=1e-3)
    assert alloc.expected_annual_return > 0.03
    assert alloc.expected_annual_volatility > 0.0
    assert alloc.sharpe_ratio >= 0.0
    
    # Check that no forbidden assets have non-zero weight
    if client_tier == InvestorRiskLevel.C2_PRUDENT:
        # C2 cannot have R3, R4, R5
        assert "TECH-INNOVATION" not in alloc.weights
        assert "MSCI-WORLD-ETF" not in alloc.weights
        assert "GLOBAL-DIVIDEND" not in alloc.weights
        assert "EMERGING-MKTS" not in alloc.weights
        
    elif client_tier == InvestorRiskLevel.C3_BALANCED:
        # C3 cannot have R4, R5
        assert "TECH-INNOVATION" not in alloc.weights
        assert "MSCI-WORLD-ETF" not in alloc.weights
        assert "EMERGING-MKTS" not in alloc.weights


def test_monotonic_risk_return_progression():
    """Higher risk tiers should have higher expected returns and higher volatility."""
    alloc_c1 = optimize_portfolio(InvestorRiskLevel.C1_CONSERVATIVE)
    alloc_c2 = optimize_portfolio(InvestorRiskLevel.C2_PRUDENT)
    alloc_c3 = optimize_portfolio(InvestorRiskLevel.C3_BALANCED)
    alloc_c4 = optimize_portfolio(InvestorRiskLevel.C4_GROWTH)
    alloc_c5 = optimize_portfolio(InvestorRiskLevel.C5_AGGRESSIVE)
    
    # Expected return progression: C2 <= C3 <= C4 <= C5
    assert alloc_c2.expected_annual_return <= alloc_c3.expected_annual_return
    assert alloc_c3.expected_annual_return <= alloc_c4.expected_annual_return
    assert alloc_c4.expected_annual_return <= alloc_c5.expected_annual_return
    
    # Volatility progression: C1 < C2 < C3 < C4 < C5
    assert alloc_c1.expected_annual_volatility < alloc_c2.expected_annual_volatility
    assert alloc_c2.expected_annual_volatility <= alloc_c3.expected_annual_volatility
    assert alloc_c3.expected_annual_volatility <= alloc_c4.expected_annual_volatility
    assert alloc_c4.expected_annual_volatility <= alloc_c5.expected_annual_volatility


def test_monte_carlo_simulation():
    """Verify stochastic simulation generates well-ordered percentile cones."""
    alloc_c3 = optimize_portfolio(InvestorRiskLevel.C3_BALANCED)
    mc_result = run_monte_carlo_simulation(alloc_c3, initial_capital=50000.0, horizon_years=5)
    
    assert len(mc_result.months) == 61  # Month 0 to 60
    assert len(mc_result.p10_pessimistic) == 61
    assert len(mc_result.p50_median) == 61
    assert len(mc_result.p90_optimistic) == 61
    
    # Check that P10 <= P50 <= P90 at every single month
    for t in range(61):
        assert mc_result.p10_pessimistic[t] <= mc_result.p50_median[t] + 1e-2
        assert mc_result.p50_median[t] <= mc_result.p90_optimistic[t] + 1e-2
        
    assert mc_result.initial_value == 50000.0
    assert 0.0 <= mc_result.probability_of_loss <= 1.0
    assert mc_result.max_drawdown_p50 >= 0.0


def test_cryptographic_audit_trail_and_tamper_detection():
    """Test SHA-256 fingerprint generation and anti-tamper verification."""
    alloc = optimize_portfolio(InvestorRiskLevel.C3_BALANCED)
    
    record = generate_audit_record(
        client_id="test_client_001",
        risk_level=alloc.client_tier,
        composite_risk_tier=alloc.composite_risk_tier,
        compliance_status="APPROVED",
        violations=[],
        weights=alloc.weights
    )
    
    # Verify authentic record
    assert verify_audit_record(record) is True
    
    # Tamper with the record (e.g. maliciously modify a weight)
    tampered_weights = dict(record.weights)
    first_asset = list(tampered_weights.keys())[0]
    tampered_weights[first_asset] += 0.05
    
    tampered_record = record.model_copy(update={"weights": tampered_weights})
    
    # Tampered record must be flagged as INVALID
    assert verify_audit_record(tampered_record) is False
