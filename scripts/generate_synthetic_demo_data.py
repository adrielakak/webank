#!/usr/bin/env python3
"""
Synthetic / Randomized Data Generator for Academic Evaluation & IP Compliance.

In accordance with institutional copyright regulations and commercial database licensing 
(e.g., CSMAR / GTA Information Technology Co.), raw proprietary financial time-series 
must not be publicly distributed.

This script generates synthetic, randomized dummy data following the exact schema required 
by the Adastra platform, allowing judges and evaluators to run the full application 
locally without requiring access to commercial databases.
"""

import os
import json
import numpy as np
import pandas as pd

def generate_mock_datasets(output_dir="dashboard_data", n_stocks=50, random_seed=42):
    np.random.seed(random_seed)
    os.makedirs(output_dir, exist_ok=True)
    
    dates_2023 = pd.date_range("2023-01-31", "2023-12-31", freq="ME")
    sectors = ["Technology", "Financials", "Consumer Goods", "Healthcare", "Industrials", "Materials"]
    stkcds = [int(x) for x in np.random.choice(range(100000, 999999), size=n_stocks, replace=False)]
    
    records = []
    exp_records = []
    
    for stkcd in stkcds:
        sector = np.random.choice(sectors)
        base_vol = float(np.random.uniform(0.015, 0.045))
        base_equity = float(np.random.uniform(500, 50000))
        
        for dt in dates_2023:
            ret = float(np.random.normal(0.01, 0.08))
            vol = float(np.clip(base_vol + np.random.normal(0, 0.005), 0.01, 0.09))
            
            # Synthetic 5-class Dirichlet probabilities
            alpha = [1.2, 1.0, 1.1, 0.8, 0.6]
            probs = np.random.dirichlet(alpha)
            pred_risk = int(np.argmax(probs))
            
            # Map actual return to risk class
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
    
    mock_pts_path = os.path.join(output_dir, "mock_dashboard_points.parquet")
    mock_exp_path = os.path.join(output_dir, "mock_expected_return_2023.csv")
    
    df_points.to_parquet(mock_pts_path, index=False)
    df_exp.to_csv(mock_exp_path, index=False)
    
    print(f"Generated {len(df_points):,} synthetic rows across {n_stocks} stocks.")
    print(f" Mock files created:\n  - {mock_pts_path}\n  - {mock_exp_path}")
    print("100% compliant with commercial data licensing & IP protection rules.")

if __name__ == "__main__":
    generate_mock_datasets()
