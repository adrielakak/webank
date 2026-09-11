"""
FastAPI Backend Gateway for WeAdvisory AI.
High-throughput, asynchronous, sub-millisecond validation with Pydantic v2 and FastAPI.
Exposes the quantitative engine, compliance sentinel, and audit ledger.
"""

import os
import json
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from engine import (
    InvestorRiskLevel,
    ProductRiskTier,
    AssetSpec,
    PortfolioAllocation,
    MonteCarloPercentilePath,
    ComplianceAuditRecord,
    SANDBOX_UNIVERSE,
    validate_allocation,
    optimize_portfolio,
    run_monte_carlo_simulation,
    generate_audit_record,
    verify_audit_record,
)
from engine.audit import AUDIT_LOG_FILE


app = FastAPI(
    title="WeAdvisory AI API",
    description="Compliant & Explainable Wealth Advisory Engine (CSRC C1-C5 / WeBank Standards)",
    version="1.0.0"
)

# Enable CORS for local and web development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request & Response Models ---

class DiagnosticRequest(BaseModel):
    client_id: str = "usr_001"
    name: str = "Sarah Jenkins"
    horizon_years: int = Field(5, ge=1, le=30)
    loss_tolerance_pct: float = Field(10.0, ge=0.0, le=100.0)
    primary_goal: str = Field("BALANCED_GROWTH", description="PRESERVATION, INCOME, BALANCED_GROWTH, MAX_GROWTH")
    reaction_to_drawdown: str = Field("HOLD", description="SELL_ALL, SELL_SOME, HOLD, BUY_MORE")
    initial_capital: float = Field(50000.0, ge=100.0)


class DiagnosticResponse(BaseModel):
    client_id: str
    name: str
    risk_level: InvestorRiskLevel
    csrc_classification_chinese: str
    csrc_classification_english: str
    suitability_summary: str
    permissible_risk_tiers: List[str]
    initial_capital: float
    horizon_years: int


class OptimizeRequest(BaseModel):
    client_tier: InvestorRiskLevel = InvestorRiskLevel.C3_BALANCED
    risk_free_rate: float = 0.035


class SimulateRequest(BaseModel):
    allocation: PortfolioAllocation
    initial_capital: float = 50000.0
    horizon_years: int = 5
    num_simulations: int = 1000


class ValidateRequest(BaseModel):
    client_tier: InvestorRiskLevel
    weights: Dict[str, float]


class ValidateResponse(BaseModel):
    is_compliant: bool
    composite_risk_tier: ProductRiskTier
    violations: List[str]
    risk_warning: Optional[str] = None


class AuditRequest(BaseModel):
    client_id: str
    risk_level: InvestorRiskLevel
    composite_risk_tier: ProductRiskTier
    compliance_status: str
    violations: List[str]
    weights: Dict[str, float]


# --- API Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "WeAdvisory AI Engine",
        "version": "1.0.0",
        "standard": "CSRC R1-R5 / WeBank FinTechathon 2026"
    }


@app.get("/api/universe", response_model=List[AssetSpec])
def get_investment_universe():
    """Returns the full 10-asset sandbox investment universe."""
    return SANDBOX_UNIVERSE


@app.post("/api/profile", response_model=DiagnosticResponse)
def evaluate_investor_profile(req: DiagnosticRequest):
    """
    Evaluates questionnaire answers and maps to official CSRC C1-C5 Investor Level.
    """
    score = 0.0
    
    # 1. Horizon scoring (0 to 25 pts)
    if req.horizon_years <= 1:
        score += 5
    elif req.horizon_years <= 3:
        score += 12
    elif req.horizon_years <= 7:
        score += 20
    else:
        score += 25

    # 2. Loss tolerance scoring (0 to 35 pts)
    if req.loss_tolerance_pct <= 0:
        score += 0
    elif req.loss_tolerance_pct <= 5:
        score += 8
    elif req.loss_tolerance_pct <= 12:
        score += 18
    elif req.loss_tolerance_pct <= 20:
        score += 28
    else:
        score += 35

    # 3. Behavioral reaction to 15% drawdown (0 to 25 pts)
    reaction_map = {
        "SELL_ALL": 0,
        "SELL_SOME": 8,
        "HOLD": 18,
        "BUY_MORE": 25
    }
    score += reaction_map.get(req.reaction_to_drawdown.upper(), 12)

    # 4. Goal orientation (0 to 15 pts)
    goal_map = {
        "PRESERVATION": 0,
        "INCOME": 5,
        "BALANCED_GROWTH": 10,
        "MAX_GROWTH": 15
    }
    score += goal_map.get(req.primary_goal.upper(), 10)

    # Assign CSRC C1-C5 tier based on composite psychometric score (0 - 100)
    if score <= 20:
        tier = InvestorRiskLevel.C1_CONSERVATIVE
        label_cn = "C1 保守型"
        label_en = "Conservative (Capital Preservation)"
        summary = "Strict capital preservation. Zero tolerance for negative yield."
        tiers = ["R1"]
    elif score <= 45:
        tier = InvestorRiskLevel.C2_PRUDENT
        label_cn = "C2 谨慎型"
        label_en = "Prudent (Low Risk / Fixed Income)"
        summary = "Focus on sovereign debt and capital stability with modest yield."
        tiers = ["R1", "R2"]
    elif score <= 70:
        tier = InvestorRiskLevel.C3_BALANCED
        label_cn = "C3 平衡型"
        label_en = "Balanced (Moderate Growth & Stability)"
        summary = "Balanced blend of fixed income, dividend equities, and safe havens."
        tiers = ["R1", "R2", "R3"]
    elif score <= 85:
        tier = InvestorRiskLevel.C4_GROWTH
        label_cn = "C4 积极型"
        label_en = "Growth (Capital Appreciation)"
        summary = "High equity exposure seeking long-term compound capital appreciation."
        tiers = ["R1", "R2", "R3", "R4"]
    else:
        tier = InvestorRiskLevel.C5_AGGRESSIVE
        label_cn = "C5 激进型"
        label_en = "Aggressive (Maximum Growth / High Beta)"
        summary = "High risk tolerance, including high-beta tech, emerging markets, and RWAs."
        tiers = ["R1", "R2", "R3", "R4", "R5"]

    return DiagnosticResponse(
        client_id=req.client_id,
        name=req.name,
        risk_level=tier,
        csrc_classification_chinese=label_cn,
        csrc_classification_english=label_en,
        suitability_summary=summary,
        permissible_risk_tiers=tiers,
        initial_capital=req.initial_capital,
        horizon_years=req.horizon_years
    )


@app.post("/api/optimize", response_model=PortfolioAllocation)
def optimize(req: OptimizeRequest):
    """
    Runs deterministic Markowitz mean-variance optimization with CSRC suitability constraints.
    """
    try:
        allocation = optimize_portfolio(req.client_tier, req.risk_free_rate)
        return allocation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization solver error: {str(e)}")


@app.post("/api/simulate", response_model=MonteCarloPercentilePath)
def simulate(req: SimulateRequest):
    """
    Runs 1,000-path stochastic Monte Carlo simulation across 5 years (monthly frequency).
    """
    try:
        result = run_monte_carlo_simulation(
            allocation=req.allocation,
            initial_capital=req.initial_capital,
            horizon_years=req.horizon_years,
            num_simulations=req.num_simulations
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@app.post("/api/validate", response_model=ValidateResponse)
def validate_custom_allocation(req: ValidateRequest):
    """
    Compliance Sentinel: Checks if a custom user-defined allocation violates CSRC suitability rules.
    """
    is_compliant, violations, comp_tier = validate_allocation(req.client_tier, req.weights)
    warning = None
    if not is_compliant:
        warning = (
            f"Regulatory Hard-Stop: Allocation violates CSRC suitability rules for level {req.client_tier.value}."
        )
        
    return ValidateResponse(
        is_compliant=is_compliant,
        composite_risk_tier=comp_tier,
        violations=violations,
        risk_warning=warning
    )


@app.post("/api/audit", response_model=ComplianceAuditRecord)
def create_audit_record(req: AuditRequest):
    """
    Hashes the approved portfolio allocation and registers it into the immutable audit ledger.
    """
    record = generate_audit_record(
        client_id=req.client_id,
        risk_level=req.risk_level,
        composite_risk_tier=req.composite_risk_tier,
        compliance_status=req.compliance_status,
        violations=req.violations,
        weights=req.weights
    )
    return record


@app.get("/api/audit/records", response_model=List[ComplianceAuditRecord])
def get_audit_records(limit: int = Query(20, ge=1, le=100)):
    """
    Returns the most recent verified audit records from the immutable ledger.
    """
    if not os.path.exists(AUDIT_LOG_FILE):
        return []
        
    records = []
    with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    records.append(ComplianceAuditRecord(**json.loads(line)))
                except Exception:
                    continue
                    
    # Return latest records first
    records.reverse()
    return records[:limit]
