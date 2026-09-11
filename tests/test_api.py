"""
Integration Tests for FastAPI Backend Endpoints.
Uses Starlette TestClient to test end-to-end API workflows with zero latency.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "WeBank" in data["standard"]


def test_universe_endpoint():
    response = client.get("/api/universe")
    assert response.status_code == 200
    assets = response.json()
    assert len(assets) == 10
    asset_ids = [a["asset_id"] for a in assets]
    assert "CASH-USD" in asset_ids
    assert "MSCI-WORLD-ETF" in asset_ids
    assert "TOKEN-TREAS-RWA" in asset_ids


def test_profile_diagnostic_endpoint():
    # Test C3 Balanced profile assessment
    payload = {
        "client_id": "usr_test_01",
        "name": "Sarah Jenkins",
        "horizon_years": 6,
        "loss_tolerance_pct": 12.0,
        "primary_goal": "BALANCED_GROWTH",
        "reaction_to_drawdown": "HOLD",
        "initial_capital": 50000.0
    }
    response = client.post("/api/profile", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["client_id"] == "usr_test_01"
    assert data["risk_level"] == "C3"
    assert "C3 平衡型" in data["csrc_classification_chinese"]
    assert "R3" in data["permissible_risk_tiers"]


def test_optimize_endpoint():
    payload = {
        "client_tier": "C3",
        "risk_free_rate": 0.035
    }
    response = client.post("/api/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["client_tier"] == "C3"
    assert data["is_compliant"] is True
    assert sum(data["weights"].values()) == pytest.approx(1.0, abs=1e-3)
    assert data["expected_annual_return"] > 0.04
    assert data["expected_annual_volatility"] > 0.0


def test_simulate_endpoint():
    # First optimize a portfolio
    opt_resp = client.post("/api/optimize", json={"client_tier": "C3"})
    allocation = opt_resp.json()
    
    # Run simulation
    sim_payload = {
        "allocation": allocation,
        "initial_capital": 50000.0,
        "horizon_years": 5,
        "num_simulations": 500
    }
    response = client.post("/api/simulate", json=sim_payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["months"]) == 61
    assert data["initial_value"] == 50000.0
    assert data["terminal_p10"] <= data["terminal_p50"] <= data["terminal_p90"]


def test_validate_compliance_sentinel_endpoint():
    # Attempt rogue allocation: C2 client given 35% Tech Growth (R4)
    payload = {
        "client_tier": "C2",
        "weights": {
            "CASH-USD": 0.35,
            "US-TREAS-7Y": 0.30,
            "TECH-INNOVATION": 0.35
        }
    }
    response = client.post("/api/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_compliant"] is False
    assert len(data["violations"]) > 0
    assert "CSRC suitability" in data["risk_warning"]


def test_audit_flow_endpoint():
    audit_payload = {
        "client_id": "usr_audit_test",
        "risk_level": "C3",
        "composite_risk_tier": "R3",
        "compliance_status": "APPROVED",
        "violations": [],
        "weights": {
            "CASH-USD": 0.20,
            "US-TREAS-7Y": 0.30,
            "GLOBAL-DIVIDEND": 0.30,
            "GOLD-PHYS": 0.20
        }
    }
    # Create audit record
    post_resp = client.post("/api/audit", json=audit_payload)
    assert post_resp.status_code == 200
    record = post_resp.json()
    assert "sha256_fingerprint" in record
    assert len(record["sha256_fingerprint"]) == 64
    
    # Retrieve audit records
    get_resp = client.get("/api/audit/records?limit=5")
    assert get_resp.status_code == 200
    records = get_resp.json()
    assert len(records) > 0
    assert any(r["client_id"] == "usr_audit_test" for r in records)
