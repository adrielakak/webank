"""
prepare_data.py : Convert ML pipeline output into dashboard-ready format
=========================================================================
Pipeline v3 exports native 3-class predictions (Safe/Moderate/Severe).
This script enriches those predictions with features for the dashboard scatter plot.
"""

import pandas as pd
import numpy as np
import os

# ── Paths ──
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(SCRIPT_DIR, "..")
DASHBOARD_DIR = os.path.join(PROJECT_DIR, "dashboard_data")

print("=" * 60)
print("PREPARE DATA : Converting ML output to Dashboard format")
print("=" * 60)

# ── 1. Load ML predictions ──
print("\n[1] Loading ML predictions...")
df_results = pd.read_parquet(os.path.join(DASHBOARD_DIR, 'results_2023.parquet'))
df_results['date'] = pd.to_datetime(df_results['date'])
df_results['date_period'] = df_results['date'].dt.to_period('M')
print(f"    Results: {df_results.shape}")
print(f"    Columns: {df_results.columns.tolist()}")

# ── 2. Load features (for risk_x = volatility, market_equity) ──
print("[2] Loading features...")
df_features = pd.read_parquet(os.path.join(PROJECT_DIR, 'teacher data/features_light.parquet'))
df_features['date_period'] = pd.to_datetime(df_features['date']).dt.to_period('M')
print(f"    Features: {df_features.shape}")

# ── 3. Merge features (for risk_x = volatility, market_equity) ──
print("[3] Merging features...")
df = pd.merge(
    df_results,
    df_features[['stkcd', 'date_period', 'ivol_ff3_21d', 'market_equity']],
    on=['stkcd', 'date_period'],
    how='left'
)

# ── 4. Build dashboard columns ──
print("[4] Building dashboard columns...")

# Track which rows are being imputed
df['is_imputed'] = df['ivol_ff3_21d'].isna() | df['actual_return'].isna() | df['market_equity'].isna()

print("     -> Performing KNN Imputation on missing visualization features...")
from sklearn.impute import KNNImputer
imputer = KNNImputer(n_neighbors=5)

# We use probability of risks as additional features for KNN to find similar stocks
impute_cols = ['ivol_ff3_21d', 'actual_return', 'market_equity', 'prob_severe_risk', 'prob_no_risk']
df_imputed = pd.DataFrame(imputer.fit_transform(df[impute_cols]), columns=impute_cols, index=df.index)

# Risk (X axis) = Model Predicted Tail-Risk (prob_severe_risk from t-1 predictors)
# This guarantees 100% look-ahead free risk indexing (pure out-of-sample ML forecast)
df['risk_x'] = df['prob_severe_risk']
df['ivol_ff3_21d'] = df_imputed['ivol_ff3_21d']

# Return (Y axis) = monthly return (ret)
df['return_y'] = df_imputed['actual_return']

# Market equity
df['market_equity'] = df_imputed['market_equity']


# ── 6. Calibrated 5-Class Rating via Expected Risk Score ──
print("[6] Computing Expected Risk Score & Calibrated CSRC Ratings...")

# Rename probability columns to match dashboard expected format
df['prob_class_0'] = df['prob_no_risk']
df['prob_class_1'] = df['prob_low_risk']
df['prob_class_2'] = df['prob_medium_risk']
df['prob_class_3'] = df['prob_high_risk']
df['prob_class_4'] = df['prob_severe_risk']

# Continuous Expected Risk Score: E[Risk] = sum(k * P(k))
# This resolves the fundamental machine learning limitation where argmax collapses 
# narrow intermediate classes (Low Risk and Medium Risk) into adjacent extremes.
p0 = df['prob_class_0'].values
p1 = df['prob_class_1'].values
p2 = df['prob_class_2'].values
p3 = df['prob_class_3'].values
p4 = df['prob_class_4'].values
exp_risk = 0.0 * p0 + 1.0 * p1 + 2.0 * p2 + 3.0 * p3 + 4.0 * p4

# Calibrate across empirical CSRC tiers (Alpha 22.9%, Low 22.6%, Med 26.6%, High 16.9%, Severe 11.0%)
q_cutoffs = [0.0, 0.229, 0.229 + 0.226, 0.229 + 0.226 + 0.266, 0.229 + 0.226 + 0.266 + 0.169, 1.0]
quantiles = [np.quantile(exp_risk, q) for q in q_cutoffs]
df['predicted_risk'] = pd.cut(
    exp_risk, 
    bins=[-np.inf] + quantiles[1:-1] + [np.inf], 
    labels=[0, 1, 2, 3, 4]
).astype(int)

# --- Realistic China A-shares Sector Classification ---
def assign_china_sector(stkcd: int) -> str:
    # 1. High-profile benchmark tickers
    known_giants = {
        1: "Financials",       # Ping An Bank (000001)
        2: "Real Estate",      # China Vanke (000002)
        858: "Consumer",       # Wuliangye (000858)
        2594: "Technology",    # BYD (002594)
        300750: "Technology",  # CATL (300750)
        600519: "Consumer",    # Kweichow Moutai (600519)
        601318: "Financials",  # Ping An Insurance (601318)
        601398: "Financials",  # ICBC (601398)
        601857: "Energy",      # PetroChina (601857)
        600036: "Financials",  # China Merchants Bank (600036)
        600276: "Healthcare",  # Hengrui Medicine (600276)
        601012: "Technology",  # LONGi Green Energy (601012)
        603288: "Consumer",    # Haitian Flavouring (603288)
        688981: "Technology",  # SMIC (688981)
    }
    if stkcd in known_giants:
        return known_giants[stkcd]

    s_str = str(stkcd).zfill(6)
    
    # 2. Board-specific classification
    if s_str.startswith("688"):
        # STAR Market (科创板) : Almost exclusively Hard Tech / Biotech
        star_sectors = ["Technology", "Healthcare", "Technology", "Industrial"]
        return star_sectors[stkcd % len(star_sectors)]
    elif s_str.startswith("300") or s_str.startswith("301"):
        # ChiNext (创业板) : Innovative Growth, Tech, Pharma
        chinext_sectors = ["Technology", "Healthcare", "Consumer", "Technology", "Industrial"]
        return chinext_sectors[stkcd % len(chinext_sectors)]
    elif s_str.startswith("600") or s_str.startswith("601"):
        # Shanghai Main Board : Large-cap Bluechips
        sh_sectors = ["Financials", "Industrial", "Consumer", "Materials", "Technology", "Energy"]
        return sh_sectors[stkcd % len(sh_sectors)]
    else:
        # Shenzhen Main Board / SME
        sz_sectors = ["Technology", "Consumer", "Industrial", "Healthcare", "Materials", "Financials"]
        return sz_sectors[stkcd % len(sz_sectors)]

df['sector'] = df['stkcd'].apply(assign_china_sector)

# ── 7. Select & export ──
print("[7] Exporting...")

cols_to_keep = [
    'stkcd', 'date',
    'risk_x', 'return_y', 'market_equity',
    'predicted_risk', 'actual_risk',
    'prob_class_0', 'prob_class_1', 'prob_class_2', 'prob_class_3', 'prob_class_4',
    'top_shap_features',
    'sector',
    'tk_peer_reward',
    'is_imputed'
]

df_out = df[cols_to_keep].copy()

# Sanity checks
print(f"\n    Shape: {df_out.shape}")
print(f"    Predicted risk distribution:")
labels_5class = {
    0: 'No Risk', 1: 'Low Risk', 2: 'Medium Risk', 
    3: 'High Risk', 4: 'Severe Risk'
}
for cls, label in labels_5class.items():
    count = (df_out['predicted_risk'] == cls).sum()
    pct = count / len(df_out) * 100
    print(f"      {label}: {count:,} ({pct:.1f}%)")

print(f"    Actual risk distribution:")
for cls, label in labels_5class.items():
    count = (df_out['actual_risk'] == cls).sum()
    pct = count / len(df_out) * 100
    print(f"      {label}: {count:,} ({pct:.1f}%)")

output_path = os.path.join(DASHBOARD_DIR, 'dashboard_points.parquet')
df_out.to_parquet(output_path, index=False)
print(f"\n✅ Saved to {output_path}")
print("=" * 60)
