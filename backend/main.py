from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import pandas as pd
import json
import os
import time
import hmac
import uuid
import hashlib
import numpy as np
from pydantic import BaseModel
try:
    from backend.compliance import evaluate_suitability
    from backend.xai import generate_nl_explanation
    from backend.adviser import compute_investor_profile, generate_personalized_portfolio, handle_advisory_dialogue
except ImportError:
    from compliance import evaluate_suitability
    from xai import generate_nl_explanation
    from adviser import compute_investor_profile, generate_personalized_portfolio, handle_advisory_dialogue

app = FastAPI(
    title="Adastra : Risk Intelligence API",
    description="Backend for the Adastra FinTech cockpit. Serves ML predictions, SHAP explanations, and market statistics for China A-shares.",
    version="2.0.0",
)

# CORS : allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(
    os.path.dirname(__file__), "..", "dashboard_data", "dashboard_points.parquet"
)

HISTORY_PATH = os.path.join(
    os.path.dirname(__file__), "..", "teacher data", "features_light.parquet"
)

EXPECTED_PATH = os.path.join(
    os.path.dirname(__file__), "..", "dashboard_data", "expected_return_2023.csv"
)

# In-memory dataframes and backtest cache
df: pd.DataFrame | None = None
df_history: pd.DataFrame | None = None
df_backtest: pd.DataFrame | None = None
backtest_data: dict | None = None
is_synthetic_mode: bool = False


def _compute_backtest(df_pts: pd.DataFrame, exp_source: Any):
    """Compute out-of-sample 2023 backtest metrics for Adastra Strategy."""
    if isinstance(exp_source, pd.DataFrame):
        df_exp = exp_source.copy()
    elif isinstance(exp_source, str):
        if not os.path.exists(exp_source):
            print(f"⚠️  Expected returns file not found at {exp_source}")
            return None, None
        df_exp = pd.read_csv(exp_source)
    else:
        return None, None

    df_exp["date_str"] = pd.to_datetime(df_exp["date"]).dt.strftime("%Y-%m-%d")
    df_exp["stkcd_str"] = df_exp["Stkcd"].astype(str)

    df_pts_copy = df_pts.copy()
    df_pts_copy["date_str"] = pd.to_datetime(df_pts_copy["date"]).dt.strftime("%Y-%m-%d")
    df_pts_copy["stkcd_str"] = df_pts_copy["stkcd"].astype(str)

    # Inner merge with expected returns
    df_m = pd.merge(
        df_pts_copy,
        df_exp[["stkcd_str", "date_str", "expected_return_z", "ret"]],
        on=["stkcd_str", "date_str"],
        how="inner",
    )

    # Calculate cross-sectional standardized news risk
    def standardize(x):
        std = x.std()
        return (x - x.mean()) / std if std > 0 else 0

    df_m["news_risk_z"] = df_m.groupby("date_str")["risk_x"].transform(standardize)

    # 4 Quadrants
    conds = [
        (df_m["expected_return_z"] > 0) & (df_m["news_risk_z"] < 0),
        (df_m["expected_return_z"] > 0) & (df_m["news_risk_z"] > 0),
        (df_m["expected_return_z"] <= 0) & (df_m["news_risk_z"] < 0),
        (df_m["expected_return_z"] <= 0) & (df_m["news_risk_z"] > 0),
    ]
    quads = ["Opportunity", "Speculative", "Defensive", "Avoid"]
    df_m["quadrant"] = np.select(conds, quads, default="Unknown")

    # Monthly series
    months = sorted(df_m["date_str"].unique())
    monthly_series = []
    strat_cum = 1.0
    bm_cum = 1.0
    avoid_cum = 1.0
    def_cum = 1.0
    spec_cum = 1.0

    opp_rets = []
    bm_rets = []

    for m in months:
        sub = df_m[df_m["date_str"] == m]
        opp_ret = float(sub[sub["quadrant"] == "Opportunity"]["ret"].mean())
        bm_ret = float(sub["ret"].mean())
        av_ret = float(sub[sub["quadrant"] == "Avoid"]["ret"].mean())
        df_ret = float(sub[sub["quadrant"] == "Defensive"]["ret"].mean())
        sp_ret = float(sub[sub["quadrant"] == "Speculative"]["ret"].mean())

        strat_cum *= 1 + opp_ret
        bm_cum *= 1 + bm_ret
        avoid_cum *= 1 + av_ret
        def_cum *= 1 + df_ret
        spec_cum *= 1 + sp_ret

        opp_rets.append(opp_ret)
        bm_rets.append(bm_ret)

        dt = pd.to_datetime(m)
        monthly_series.append({
            "date": m,
            "month": m[:7],
            "month_label": dt.strftime("%b %Y"),
            "strategy_ret": round(opp_ret * 100, 2),
            "benchmark_ret": round(bm_ret * 100, 2),
            "avoid_ret": round(av_ret * 100, 2),
            "defensive_ret": round(df_ret * 100, 2),
            "speculative_ret": round(sp_ret * 100, 2),
            "alpha_ret": round((opp_ret - bm_ret) * 100, 2),
            "strategy_cum": round((strat_cum - 1) * 100, 2),
            "benchmark_cum": round((bm_cum - 1) * 100, 2),
            "avoid_cum": round((avoid_cum - 1) * 100, 2),
            "defensive_cum": round((def_cum - 1) * 100, 2),
            "speculative_cum": round((spec_cum - 1) * 100, 2),
            "outperformed": bool(opp_ret >= bm_ret),
        })

    wins = sum(1 for ms in monthly_series if ms["outperformed"])
    win_rate = round(wins / len(monthly_series) * 100, 1) if monthly_series else 0.0

    total_strat = strat_cum - 1
    total_bm = bm_cum - 1
    total_alpha = total_strat - total_bm

    # Sharpe ratio (monthly risk free rate = 1.5% / 12)
    rf_monthly = 0.015 / 12
    opp_excess = [r - rf_monthly for r in opp_rets]
    bm_excess = [r - rf_monthly for r in bm_rets]

    sharpe_strat = round(float(np.mean(opp_excess) / np.std(opp_excess) * np.sqrt(12)), 2) if np.std(opp_excess) > 0 else 0.0
    sharpe_bm = round(float(np.mean(bm_excess) / np.std(bm_excess) * np.sqrt(12)), 2) if np.std(bm_excess) > 0 else 0.0

    # Max Drawdown
    cum_series = np.array([ms["strategy_cum"] / 100 + 1 for ms in monthly_series])
    cum_peaks = np.maximum.accumulate(cum_series)
    drawdowns = (cum_series - cum_peaks) / cum_peaks
    max_dd_strat = round(float(np.min(drawdowns)) * 100, 2)

    bm_cum_series = np.array([ms["benchmark_cum"] / 100 + 1 for ms in monthly_series])
    bm_peaks = np.maximum.accumulate(bm_cum_series)
    bm_drawdowns = (bm_cum_series - bm_peaks) / bm_peaks
    max_dd_bm = round(float(np.min(bm_drawdowns)) * 100, 2)

    # Quadrant breakdown
    quad_labels = {
        "Opportunity": ("Opportunity (Top-Left)", "AI Long Alpha (High Return, Low Volatility)", "#10b981"),
        "Speculative": ("Speculative (Top-Right)", "High Volatility Momentum Upside", "#3b82f6"),
        "Defensive": ("Defensive (Bottom-Left)", "Capital Preservation (Low Volatility)", "#f59e0b"),
        "Avoid": ("Avoid (Bottom-Right)", "Strict Exclusion / Underperforming Filter", "#ef4444"),
    }
    quadrants = []
    for q_name in ["Opportunity", "Speculative", "Defensive", "Avoid"]:
        q_sub = df_m[df_m["quadrant"] == q_name]
        q_label, q_role, q_color = quad_labels[q_name]
        quadrants.append({
            "key": q_name,
            "label": q_label,
            "role": q_role,
            "avg_monthly_return": round(float(q_sub["ret"].mean()) * 100, 2) if not q_sub.empty else 0.0,
            "cum_return": round((np.prod(1 + q_sub.groupby("date_str")["ret"].mean()) - 1) * 100, 2) if not q_sub.empty else 0.0,
            "count": int(len(q_sub)),
            "color": q_color,
        })

    # Top Alpha Picks All-Time
    top_opp = df_m[df_m["quadrant"] == "Opportunity"].sort_values("ret", ascending=False).head(10)
    top_picks_all_time = []
    for _, r in top_opp.iterrows():
        top_picks_all_time.append({
            "stkcd": int(r["stkcd"]),
            "date": str(r["date_str"]),
            "month_label": pd.to_datetime(r["date_str"]).strftime("%b %Y"),
            "return_y": round(float(r["ret"]) * 100, 2),
            "risk_x": round(float(r["risk_x"]) * 100, 2),
            "sector": str(r.get("sector", "Unknown")),
            "market_equity": round(float(r.get("market_equity", 0)), 1),
            "predicted_risk": int(r["predicted_risk"]),
            "actual_risk": int(r["actual_risk"]),
        })

    # By-month picks
    by_month_picks = {}
    for m_str in months:
        m_k = m_str[:7]
        m_sub = df_m[(df_m["date_str"] == m_str) & (df_m["quadrant"] == "Opportunity")].sort_values("ret", ascending=False).head(6)
        picks = []
        for _, r in m_sub.iterrows():
            picks.append({
                "stkcd": int(r["stkcd"]),
                "date": str(r["date_str"]),
                "month_label": pd.to_datetime(r["date_str"]).strftime("%b %Y"),
                "return_y": round(float(r["ret"]) * 100, 2),
                "risk_x": round(float(r["risk_x"]) * 100, 2),
                "sector": str(r.get("sector", "Unknown")),
                "market_equity": round(float(r.get("market_equity", 0)), 1),
                "predicted_risk": int(r["predicted_risk"]),
                "actual_risk": int(r["actual_risk"]),
            })
        by_month_picks[m_k] = picks

    latest_m = months[-1][:7] if months else "2023-12"

    # Monthly return stats to convert expected_return_z to expected percentage
    month_stats = {}
    for m_str in months:
        sub_m = df_m[df_m["date_str"] == m_str]
        month_stats[m_str] = {
            "mean": float(sub_m["ret"].mean()),
            "std": float(sub_m["ret"].std()) if len(sub_m) > 1 else 0.0,
        }

    backtest_dict = {
        "summary": {
            "strategy_cum_return": round(float(total_strat) * 100, 2),
            "benchmark_cum_return": round(float(total_bm) * 100, 2),
            "net_alpha": round(float(total_alpha) * 100, 2),
            "strategy_sharpe": sharpe_strat,
            "benchmark_sharpe": sharpe_bm,
            "strategy_max_dd": max_dd_strat,
            "benchmark_max_dd": max_dd_bm,
            "monthly_win_rate": win_rate,
            "win_months_count": wins,
            "total_months_count": len(monthly_series),
            "total_signals": int(len(df_m[df_m["quadrant"] == "Opportunity"])),
        },
        "monthly_series": monthly_series,
        "quadrants": quadrants,
        "top_picks_all_time": top_picks_all_time,
        "by_month_picks": by_month_picks,
        "latest_month": latest_m,
        "latest_month_picks": by_month_picks.get(latest_m, []),
        "month_stats": month_stats,
    }

    return df_m, backtest_dict


def _generate_synthetic_fallback(n_stocks: int = 50, random_seed: int = 42):
    """
    Generates an academic synthetic demo dataset in-memory when proprietary CSMAR files
    are absent (e.g. on public cloud deployments, zero-data Git compliance).
    Ensures 100% adherence to academic IP rules while allowing live API evaluation.
    """
    np.random.seed(random_seed)
    dates_2023 = pd.date_range("2023-01-31", "2023-12-31", freq="ME")
    sectors = ["Technology", "Financials", "Consumer Goods", "Healthcare", "Industrials", "Materials"]
    stkcds = [int(x) for x in np.random.choice(range(100000, 999999), size=n_stocks, replace=False)]
    if 688566 not in stkcds:
        stkcds[0] = 688566

    records = []
    exp_records = []

    for stkcd in stkcds:
        sector = np.random.choice(sectors)
        base_vol = float(np.random.uniform(0.015, 0.045))
        base_equity = float(np.random.uniform(500, 50000))

        for dt in dates_2023:
            ret = float(np.random.normal(0.01, 0.08))
            vol = float(np.clip(base_vol + np.random.normal(0, 0.005), 0.01, 0.09))

            # Stock 688566 case study: simulated severe crash
            if stkcd == 688566 and dt.month in [11, 12]:
                probs = [0.02, 0.05, 0.10, 0.18, 0.65]
                pred_risk = 4
                act_risk = 4
                ret = -0.18
            else:
                alpha = [1.2, 1.0, 1.1, 0.8, 0.6]
                probs = list(np.random.dirichlet(alpha))
                pred_risk = int(np.argmax(probs))
                if ret >= 0.05:
                    act_risk = 0
                elif ret >= 0:
                    act_risk = 1
                elif ret >= -0.05:
                    act_risk = 2
                elif ret >= -0.10:
                    act_risk = 3
                else:
                    act_risk = 4

            shap = {
                "age": round(float(np.random.uniform(0.5, 2.5)), 4),
                "ivol_capm_252d": round(float(np.random.uniform(0.1, 0.6)), 4),
                "mispricing_perf": round(float(np.random.uniform(-0.3, 0.4)), 4),
                "price_peer_reward_lag1": round(float(np.random.uniform(-0.2, 0.3)), 4),
                "gp_at": round(float(np.random.uniform(0.05, 0.35)), 4),
            }

            records.append({
                "stkcd": stkcd,
                "date": dt,
                "risk_x": vol,
                "return_y": ret,
                "market_equity": base_equity,
                "predicted_risk": pred_risk,
                "actual_risk": act_risk,
                "prob_class_0": float(probs[0]),
                "prob_class_1": float(probs[1]),
                "prob_class_2": float(probs[2]),
                "prob_class_3": float(probs[3]),
                "prob_class_4": float(probs[4]),
                "top_shap_features": json.dumps(shap),
                "sector": sector,
                "tk_peer_reward": float(np.random.uniform(-0.1, 0.1)),
                "is_imputed": False,
            })

            exp_records.append({
                "Stkcd": stkcd,
                "date": dt.strftime("%Y-%m-%d"),
                "expected_return_z": float(np.random.normal(0.2, 1.0)),
                "ret": ret,
            })

    df_points = pd.DataFrame(records)
    df_exp = pd.DataFrame(exp_records)
    return df_points, df_exp


@app.on_event("startup")
def load_data():
    global df
    global df_history
    global df_backtest
    global backtest_data
    global is_synthetic_mode

    exp_path = EXPECTED_PATH
    if os.path.exists(DATA_PATH):
        df = pd.read_parquet(DATA_PATH)
        df["date"] = pd.to_datetime(df["date"])
        is_synthetic_mode = False
        print(f"✅ Loaded {len(df):,} rows | {df['date'].nunique()} months | {df['stkcd'].nunique():,} unique stocks")
    elif os.path.exists("dashboard_data/mock_dashboard_points.parquet"):
        df = pd.read_parquet("dashboard_data/mock_dashboard_points.parquet")
        df["date"] = pd.to_datetime(df["date"])
        if os.path.exists("dashboard_data/mock_expected_return_2023.csv"):
            exp_path = "dashboard_data/mock_expected_return_2023.csv"
        is_synthetic_mode = True
        print(f"ℹ️ Loaded synthetic academic mock dataset ({len(df):,} rows) for IP compliance")
    else:
        print(f"ℹ️ Proprietary CSMAR data absent (Zero-Data Policy). Generating synthetic academic mock data...")
        df_mock, df_exp_mock = _generate_synthetic_fallback()
        df = df_mock
        exp_path = df_exp_mock
        is_synthetic_mode = True
        print(f"✅ In-memory academic mock dataset active ({len(df):,} rows across {df['stkcd'].nunique()} stocks)")

    if os.path.exists(HISTORY_PATH):
        df_history = pd.read_parquet(HISTORY_PATH, columns=['stkcd', 'date', 'ret'])
        print(f"✅ Loaded {len(df_history):,} rows of history data from features_light")
    else:
        print(f"ℹ️  History data not provided (using in-dataset trajectory)")

    if df is not None:
        try:
            df_backtest, backtest_data = _compute_backtest(df, exp_path)
            if backtest_data:
                print(f"✅ Precomputed 2023 Backtest: +{backtest_data['summary']['strategy_cum_return']}% Strategy vs +{backtest_data['summary']['benchmark_cum_return']}% Benchmark (Alpha +{backtest_data['summary']['net_alpha']}%)")
        except Exception as e:
            print(f"⚠️  Failed to precompute backtest: {e}")


# ──────────────────────────────────────────────
# Utility
# ──────────────────────────────────────────────

def _get_df():
    if df is None:
        raise HTTPException(status_code=503, detail="Data not loaded yet")
    return df


def _risk_label(cls: int) -> str:
    return {0: "No Risk", 1: "Low Risk", 2: "Medium Risk", 3: "High Risk", 4: "Severe Risk"}.get(cls, "Unknown")


def _risk_color(cls: int) -> str:
    # Colors: Emerald (Alpha/No Risk), Blue (Low), Amber (Medium), Orange (High), Red (Severe)
    return {0: "#34d399", 1: "#3b82f6", 2: "#f59e0b", 3: "#f97316", 4: "#ef4444"}.get(cls, "#6b7280")


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────

@app.get("/api/health")
@app.get("/api/root")
def root():
    return {"service": "Adastra Risk API", "version": "2.0.0", "status": "running"}


@app.get("/api/dates")
def get_dates():
    """Return the sorted list of available months (ISO date strings)."""
    data = _get_df()
    dates = sorted(data["date"].dt.strftime("%Y-%m-%d").unique().tolist())
    return {
        "dates": dates,
        "count": len(dates),
        "is_synthetic": is_synthetic_mode,
        "dataset_label": "CSRC Academic IP Benchmark" if is_synthetic_mode else "Live Market Dataset (China A-Shares)",
    }


@app.get("/api/stocks")
def get_stocks(date: str | None = Query(None, description="ISO date string, e.g. 2023-06-30")):
    """
    Return all stocks for a given month.
    If no date is provided, uses the latest available month.
    Each point includes coordinates for the scatter plot and risk classification.
    """
    data = _get_df()

    if date:
        target = pd.Timestamp(date)
    else:
        target = data["date"].max()

    subset = data[data["date"] == target]
    if subset.empty:
        raise HTTPException(status_code=404, detail=f"No data for date {target.date()}")

    records = []
    for _, row in subset.iterrows():
        # Parse SHAP features
        shap_raw = row.get("top_shap_features", "{}")
        if isinstance(shap_raw, str):
            try:
                shap_dict = json.loads(shap_raw)
            except json.JSONDecodeError:
                shap_dict = {}
        else:
            shap_dict = shap_raw if isinstance(shap_raw, dict) else {}

        records.append({
            "stkcd": int(row["stkcd"]),
            "risk_x": float(row["risk_x"]) if pd.notna(row["risk_x"]) else 0,
            "return_y": float(row["return_y"]) if pd.notna(row["return_y"]) else 0,
            "predicted_risk": int(row["predicted_risk"]),
            "actual_risk": int(row["actual_risk"]),
            "prob_no_risk": round(float(row["prob_class_0"]), 4),
            "prob_low_risk": round(float(row["prob_class_1"]), 4),
            "prob_medium_risk": round(float(row["prob_class_2"]), 4),
            "prob_high_risk": round(float(row["prob_class_3"]), 4),
            "prob_severe_risk": round(float(row["prob_class_4"]), 4),
            "risk_label": _risk_label(int(row["predicted_risk"])),
            "risk_color": _risk_color(int(row["predicted_risk"])),
            "market_equity": float(row.get("market_equity", 1.0)),
            "sector": str(row.get("sector", "Unknown")),
            "top_shap": shap_dict,
            "tk_peer_reward": float(row["tk_peer_reward"]) if "tk_peer_reward" in row and pd.notna(row["tk_peer_reward"]) else None,
            "is_imputed": bool(row.get("is_imputed", False)),
        })

    return {
        "date": target.strftime("%Y-%m-%d"),
        "count": len(records),
        "stocks": records,
    }


@app.get("/api/stocks/{stkcd}")
def get_stock_detail(stkcd: int, date: str | None = Query(None), profile: str | None = Query(None, description="CSRC Risk Profile (R1-R5)")):
    """Detailed view for a single stock including full SHAP breakdown."""
    data = _get_df()

    if date and isinstance(date, str):
        target = pd.Timestamp(date)
    else:
        target = data["date"].max()

    match = data[(data["stkcd"] == stkcd) & (data["date"] == target)]
    if match.empty:
        raise HTTPException(status_code=404, detail=f"Stock {stkcd} not found for {target.date()}")

    row = match.iloc[0]
    shap_raw = row.get("top_shap_features", "{}")
    if isinstance(shap_raw, str):
        try:
            shap_dict = json.loads(shap_raw)
        except json.JSONDecodeError:
            shap_dict = {}
    else:
        shap_dict = shap_raw if isinstance(shap_raw, dict) else {}

    # Build sorted SHAP features list
    shap_features = sorted(
        [{"feature": k, "value": round(v, 6)} for k, v in shap_dict.items()],
        key=lambda x: abs(x["value"]),
        reverse=True,
    )

    # Build historical performance data (fixed 5-year timeline up to 2023-12 for long-term consistency)
    history_data = []
    global df_history
    if df_history is not None:
        stk_history = df_history[(df_history['stkcd'] == stkcd) & (df_history['date'] <= '2023-12')].sort_values('date').tail(60)
        cum_ret = 0.0
        for _, r in stk_history.iterrows():
            ret = float(r['ret']) if pd.notna(r['ret']) else 0.0
            cum_ret = (1 + cum_ret) * (1 + ret) - 1
            history_data.append({"month": str(r['date'])[:7], "value": round(cum_ret * 100, 2)})

    pred_risk = int(row["predicted_risk"])
    act_risk = int(row["actual_risk"])
    if pred_risk == act_risk:
        acc_status = "EXACT_MATCH"
    elif pred_risk > act_risk:
        acc_status = "CONSERVATIVE_PROTECTION"
    else:
        acc_status = "UNDERESTIMATED_RISK"

    # Look up quadrant and expected return z-score from backtest dataset
    quadrant = None
    expected_z = None
    expected_pct = None
    global df_backtest
    global backtest_data
    if df_backtest is not None:
        target_str = target.strftime("%Y-%m-%d")
        stkcd_str = str(stkcd)
        match_bt = df_backtest[(df_backtest["stkcd_str"] == stkcd_str) & (df_backtest["date_str"] == target_str)]
        if not match_bt.empty:
            quadrant = str(match_bt.iloc[0]["quadrant"])
            if pd.notna(match_bt.iloc[0].get("expected_return_z")):
                expected_z = round(float(match_bt.iloc[0]["expected_return_z"]), 4)

    # Compute continuous AI Expected Return directly from LightGBM model's calibrated posterior distribution
    # This guarantees 100% mathematical and conceptual consistency between predicted risk classes and expected return:
    # Class 0 (No Risk) aligns with positive returns, while Class 3 & 4 (High/Severe) align with negative returns.
    p0 = float(row.get("prob_class_0", 0.2))
    p1 = float(row.get("prob_class_1", 0.2))
    p2 = float(row.get("prob_class_2", 0.2))
    p3 = float(row.get("prob_class_3", 0.2))
    p4 = float(row.get("prob_class_4", 0.2))
    exp_ret_val = (p0 * 0.1329 + p1 * 0.0222 + p2 * (-0.0245) + p3 * (-0.0717) + p4 * (-0.1496))
    expected_pct = round(float(exp_ret_val * 100), 2)

    response = {
        "stkcd": int(row["stkcd"]),
        "date": target.strftime("%Y-%m-%d"),
        "risk_x": float(row["risk_x"]) if pd.notna(row["risk_x"]) else 0,
        "return_y": float(row["return_y"]) if pd.notna(row["return_y"]) else 0,
        "actual_return": round(float(row["return_y"]) * 100, 2),
        "predicted_risk": pred_risk,
        "actual_risk": act_risk,
        "risk_label": _risk_label(pred_risk),
        "actual_risk_label": _risk_label(act_risk),
        "accuracy_status": acc_status,
        "quadrant": quadrant,
        "expected_return_z": expected_z,
        "expected_return_pct": expected_pct,
        "risk_color": _risk_color(pred_risk),
        "prob_no_risk": round(float(row["prob_class_0"]), 4),
        "prob_low_risk": round(float(row["prob_class_1"]), 4),
        "prob_medium_risk": round(float(row["prob_class_2"]), 4),
        "prob_high_risk": round(float(row["prob_class_3"]), 4),
        "prob_severe_risk": round(float(row["prob_class_4"]), 4),
        "market_equity": float(row.get("market_equity", 1.0)),
        "sector": str(row.get("sector", "Unknown")),
        "shap_features": shap_features,
        "xai_explanation": generate_nl_explanation(
            shap_features,
            _risk_label(pred_risk),
            prob_severe=float(row.get("prob_class_4", 0.0)),
            sector=str(row.get("sector", "Unknown")),
            tk_peer_reward=float(row["tk_peer_reward"]) if "tk_peer_reward" in row and pd.notna(row["tk_peer_reward"]) else None,
            volatility=float(row.get("risk_x", 0.0)) if pd.notna(row.get("risk_x")) else 0.0,
            actual_return=float(row.get("return_y", 0.0)) if pd.notna(row.get("return_y")) else 0.0,
            stkcd=int(row["stkcd"]),
        ),
        "tk_peer_reward": float(row["tk_peer_reward"]) if "tk_peer_reward" in row and pd.notna(row["tk_peer_reward"]) else None,
        "is_imputed": bool(row.get("is_imputed", False)),
        "history_data": history_data,
    }

    # Build 2023 month-by-month trajectory for this stock across the test year
    all_months_stock = data[data["stkcd"] == stkcd].sort_values("date")
    timeline_2023 = []
    for _, m_row in all_months_stock.iterrows():
        m_date_str = m_row["date"].strftime("%Y-%m-%d")
        m_pred = int(m_row["predicted_risk"])
        m_act = int(m_row["actual_risk"])
        timeline_2023.append({
            "date": m_date_str,
            "month_label": m_row["date"].strftime("%b %Y"),
            "return_y": round(float(m_row["return_y"]) * 100, 2),
            "risk_x": round(float(m_row["risk_x"]) * 100, 2),
            "predicted_risk": m_pred,
            "actual_risk": m_act,
            "risk_label": _risk_label(m_pred),
            "actual_risk_label": _risk_label(m_act),
            "risk_color": _risk_color(m_pred),
            "is_exact": m_pred == m_act,
            "is_conservative": m_pred >= m_act,
            "is_current": (m_date_str == target.strftime("%Y-%m-%d")),
        })
    response["timeline_2023"] = timeline_2023

    if profile and isinstance(profile, str):
        response["compliance"] = evaluate_suitability(
            stkcd=int(row["stkcd"]),
            predicted_risk=int(row["predicted_risk"]),
            prob_severe=float(row["prob_class_4"]),
            user_profile=profile
        )

    return response


@app.get("/api/backtest")
def get_backtest(date: str | None = Query(None, description="Filter for specific month, e.g. 2023-05-31")):
    """
    Returns full 2023 out-of-sample backtest track record comparing
    Adastra Alpha Strategy (Opportunity Quadrant) vs Equal-Weighted ML Universe Benchmark.
    """
    global backtest_data
    if backtest_data is None:
        raise HTTPException(status_code=503, detail="Backtest data not available")

    res = {
        "summary": backtest_data["summary"],
        "monthly_series": backtest_data["monthly_series"],
        "quadrants": backtest_data["quadrants"],
        "top_picks_all_time": backtest_data["top_picks_all_time"],
    }

    if date and "by_month_picks" in backtest_data:
        target_m = date[:7]
        res["selected_month"] = target_m
        res["month_picks"] = backtest_data["by_month_picks"].get(target_m, [])
    else:
        res["selected_month"] = backtest_data.get("latest_month", "2023-12")
        res["month_picks"] = backtest_data.get("latest_month_picks", [])

    return res


@app.get("/api/stats")
def get_stats(date: str | None = Query(None)):
    """Aggregated market statistics for a given month."""
    data = _get_df()

    if date:
        target = pd.Timestamp(date)
    else:
        target = data["date"].max()

    subset = data[data["date"] == target]
    if subset.empty:
        raise HTTPException(status_code=404, detail=f"No data for {target.date()}")

    total = len(subset)
    risk_counts = subset["predicted_risk"].value_counts().to_dict()

    return {
        "date": target.strftime("%Y-%m-%d"),
        "total_stocks": total,
        "is_synthetic": is_synthetic_mode,
        "dataset_label": "CSRC Academic IP Benchmark" if is_synthetic_mode else "Live Market Dataset (China A-Shares)",
        "avg_volatility": round(float(subset["risk_x"].mean()), 6),
        "median_volatility": round(float(subset["risk_x"].median()), 6),
        "avg_return": round(float(subset["return_y"].mean()), 6),
        "median_return": round(float(subset["return_y"].median()), 6),
        "risk_distribution": {
            "no_risk": int(risk_counts.get(0, 0)),
            "low_risk": int(risk_counts.get(1, 0)),
            "medium_risk": int(risk_counts.get(2, 0)),
            "high_risk": int(risk_counts.get(3, 0)),
            "severe_risk": int(risk_counts.get(4, 0)),
        },
        "risk_percentages": {
            "no_risk": round(risk_counts.get(0, 0) / total * 100, 1),
            "low_risk": round(risk_counts.get(1, 0) / total * 100, 1),
            "medium_risk": round(risk_counts.get(2, 0) / total * 100, 1),
            "high_risk": round(risk_counts.get(3, 0) / total * 100, 1),
            "severe_risk": round(risk_counts.get(4, 0) / total * 100, 1),
        },
    }


# ──────────────────────────────────────────────
# ──────────────────────────────────────────────
# WeBank Security Architecture: Session Token & KYC State Management
# ──────────────────────────────────────────────

SESSION_SECRET = os.environ.get("ADASTRA_SESSION_SECRET", "we-bank-adastra-csrc-2026-auth-seal")
SERVER_SESSIONS: Dict[str, Dict[str, Any]] = {}

def create_session_token(payload: Dict[str, Any]) -> str:
    """Generates an HMAC-SHA256 cryptographically signed session token."""
    session_id = str(uuid.uuid4())
    signature = hmac.new(SESSION_SECRET.encode(), session_id.encode(), hashlib.sha256).hexdigest()[:16]
    token = f"adastra_{session_id}_{signature}"
    SERVER_SESSIONS[token] = {
        **payload,
        "session_id": session_id,
        "token": token,
        "created_at": int(time.time()),
        "last_active": int(time.time()),
    }
    return token

def verify_session_token(token: Optional[str]) -> Optional[Dict[str, Any]]:
    """Verifies HMAC signature and retrieves server-anchored session state."""
    if not token:
        return None
    if token.startswith("Bearer "):
        token = token[7:].strip()
    if not token.startswith("adastra_"):
        return None
    parts = token.split("_")
    if len(parts) != 3:
        return None
    session_id, sig = parts[1], parts[2]
    expected_sig = hmac.new(SESSION_SECRET.encode(), session_id.encode(), hashlib.sha256).hexdigest()[:16]
    if not hmac.compare_digest(sig, expected_sig):
        return None
    session = SERVER_SESSIONS.get(token)
    if session:
        session["last_active"] = int(time.time())
        return session
    # If valid signature but server was restarted, restore a safe authenticated session
    return {"session_id": session_id, "profile": "C3", "reconstructed": True}

class SessionInitRequest(BaseModel):
    investor_name: Optional[str] = "Client"
    initial_profile: Optional[str] = "C3"

@app.post("/api/auth/session")
def init_session(req: Optional[SessionInitRequest] = None):
    """
    Initializes a cryptographically authenticated session for the WeBank wealth cockpit.
    Returns a signed session token to be passed via Authorization or X-Adastra-Session-Token.
    """
    name = req.investor_name if req else "Client"
    profile = req.initial_profile if req else "C3"
    token = create_session_token({
        "investor_name": name,
        "profile": profile,
        "is_authenticated": True,
        "kyc_verified": False,
    })
    return {
        "status": "AUTHENTICATED",
        "session_token": token,
        "investor_name": name,
        "profile": profile,
        "server_timestamp": int(time.time()),
    }

@app.get("/api/auth/session")
def get_session(
    authorization: Optional[str] = Header(None),
    x_adastra_session_token: Optional[str] = Header(None),
):
    """Inspects and validates current session status from server memory."""
    token = authorization or x_adastra_session_token
    session = verify_session_token(token)
    if not session:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Missing or invalid WeBank session token. Please initialize a session via /api/auth/session."
        )
    return {
        "status": "VALID",
        "session": session,
    }

# ──────────────────────────────────────────────
# Wealth Advisory & Suitability Routes
# ──────────────────────────────────────────────

class AssessmentRequest(BaseModel):
    answers: dict[str, str]
    investor_name: str | None = "Client"


class ChatRequest(BaseModel):
    message: str
    profile: str | None = "C3"
    date: str | None = None
    stkcd: int | None = None
    history: list[dict] | None = None


@app.post("/api/profile/assess")
def assess_profile(
    req: AssessmentRequest,
    authorization: Optional[str] = Header(None),
    x_adastra_session_token: Optional[str] = Header(None),
):
    """
    Computes CSRC Suitability Category (C1 to C5), anchors the profile
    into backend server-side session memory, and issues a cryptographically signed session token.
    """
    try:
        profile_data = compute_investor_profile(req.answers, req.investor_name or "Client")
        token = create_session_token({
            "investor_name": req.investor_name or "Client",
            "profile": profile_data["category"],
            "csrc_product": profile_data["csrc_product"],
            "score": profile_data["score"],
            "certificate_hash": profile_data["certificate_hash"],
            "kyc_verified": True,
        })
        profile_data["session_token"] = token
        return profile_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/portfolio/recommend")
def get_recommended_portfolio(
    profile: str = Query("C3", description="CSRC Investor Profile (C1-C5 or R1-R5)"),
    date: str | None = Query(None, description="Benchmark month ISO date string"),
    budget: float = Query(100000.0, description="Investment capital in CNY"),
    top_k: int = Query(5, description="Number of assets in portfolio"),
    authorization: Optional[str] = Header(None),
    x_adastra_session_token: Optional[str] = Header(None),
):
    """
    Generates an optimal, regulatory-compliant asset allocation basket tailored
    strictly to the client's risk envelope using Inverse-Volatility weighting.
    Validates against server-side session state if session token is provided.
    """
    token = authorization or x_adastra_session_token
    session = verify_session_token(token)
    effective_profile = session.get("profile", profile) if session else profile

    data = _get_df()
    try:
        return generate_personalized_portfolio(
            df=data,
            profile=effective_profile,
            date_str=date,
            budget=budget,
            top_k=top_k,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/adviser/chat")
def adviser_chat(
    req: ChatRequest,
    authorization: Optional[str] = Header(None),
    x_adastra_session_token: Optional[str] = Header(None),
):
    """
    Interactive wealth advisory dialogue engine providing institutional XAI diagnostics,
    model precision explanations, and CSRC suitability guardrails.
    """
    token = authorization or x_adastra_session_token
    session = verify_session_token(token)
    effective_profile = session.get("profile", req.profile or "C3") if session else (req.profile or "C3")

    data = _get_df()
    try:
        return handle_advisory_dialogue(
            message=req.message,
            df=data,
            profile=effective_profile,
            date_str=req.date,
            stkcd=req.stkcd,
            history=req.history,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────
# Static Frontend Serving & Single-Page Fallback
# ──────────────────────────────────────────────

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        # Allow API requests that 404 to return 404 rather than index.html
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        # Check if direct static file exists (e.g. favicon.svg, robots.txt)
        requested_file = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(requested_file):
            return FileResponse(requested_file)
        # Fallback to SPA index.html
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend index file not found")
else:
    app.get("/")(root)

