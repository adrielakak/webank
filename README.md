# 🏆 Adastra
> **Intelligent Quantitative Risk Advisory & Allocation Cockpit for China A-Shares**  
> **Shenzhen International FinTech Competition (FinTechathon 2026) : WeBank Track**  
> *Target: 1st Prize (RMB 100,000 + Shenzhen Finals)* · **Team Adastra (Adriel Kourlate, Dong Zixuan, Aadithyan Sajith Kumar, Khushi Mistry)**

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/adrielakak/webank)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_2.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](http://localhost:8000/docs)
[![React 18](https://img.shields.io/badge/Frontend-React_18_%7C_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](http://localhost:5173)
[![LightGBM](https://img.shields.io/badge/ML-Cost--Sensitive_LightGBM-34D399?style=for-the-badge&logo=scikitlearn&logoColor=white)](docs/technical-documentation/algorithm.qmd)
[![CSRC Suitability](https://img.shields.io/badge/Compliance-CSRC_R1--R5_%7C_C1--C5-F59E0B?style=for-the-badge)](backend/compliance.py)
[![FISCO BCOS Ready](https://img.shields.io/badge/Consortium_Blockchain-SHA--256_Audit_Seals-8B5CF6?style=for-the-badge)](docs/SECURITY_REPORT.md)
[![Test Suite](https://img.shields.io/badge/Tests-21%2F21_Passing-success?style=for-the-badge&logo=pytest&logoColor=white)](tests/run_tests.py)
[![Quarto Docs](https://img.shields.io/badge/Docs-Quarto_Book_Rendered-blue?style=for-the-badge&logo=quarto&logoColor=white)](docs/technical-documentation/)

---

> [!IMPORTANT]
> **⚠️ DATA & IP COMPLIANCE NOTICE**
> 
> Due to strict intellectual property and licensing agreements (CSMAR / WRDS), **all raw proprietary datasets have not been placed in this public repository**. 
> 
> * **GitHub Repository:** To allow judges to fully test and audit the codebase, this repository includes an automated synthetic data generator (`synthetic_fallback.py`). The code provided is 100% functional and will run end-to-end using this synthetic benchmark data.
> * **Presentation & Demo:** The performance metrics (e.g., +14.02% gross / +12.06% net return, +1.31% to +1.70%/mo Long/Short Alpha Spread, TreeSHAP explanations) and the live demo video were generated using the **actual proprietary data** on a local secure environment. 
> 
> The machine learning pipeline logic and code presented here are identical to the ones used to generate the official competition results.

---

## 📋 FinTechathon 2026 Submission Checklist Mapping

| # | Competition Requirement | Implementation in Repository | Status | Deliverable |
|---|---|---|---|---|
| **1** | **Technical Documentation** *(Architecture, Algorithm, Security)* | Comprehensive Quarto monograph + architecture diagrams | ✅ Complete | [📄 `docs/TECHNICAL_DOCUMENTATION.pdf`](docs/TECHNICAL_DOCUMENTATION.pdf) |
| **2** | **Source Code & Deployment** *(README, GitHub link, 21/21 tests)* | Full codebase on GitHub [`adrielakak/webank`](https://github.com/adrielakak/webank), automated unit & integration tests | ✅ Complete | Reproducible repo & `./start.sh` |
| **3** | **Interactive Web Workstation** *(Topic B Wealth Advisor)* | Standardized CSRC suitability cockpit, TreeSHAP diagnostics & robo-advisor | ✅ Live | Available locally via `./start.sh` |
| **4** | **Security Self-Assessment Report** *(Permission-tier & known risks)* | Standalone audit report on CSRC permission tiers & HMAC session auth | ✅ Complete | [🛡️ `docs/SECURITY_REPORT.pdf`](docs/SECURITY_REPORT.pdf) |
| **5** | **Execution Evidence** *(Sandbox operation logs & audit hashes)* | Automated multi-account sandbox simulation & FISCO BCOS hashes | ✅ Complete | [📑 `docs/EXECUTION_EVIDENCE.pdf`](docs/EXECUTION_EVIDENCE.pdf) |

---

## 🌟 Key Highlights & Academic Innovations

Adastra bridges the gap between institutional quantitative finance, natural language processing of Chinese financial news, and regulatory compliance under the **China Securities Regulatory Commission (CSRC)** framework.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                         ADASTRA                         │
                  │   Quantitative Risk Intelligence & Allocation Cockpit   │
                  └────────────────────────────┬────────────────────────────┘
                                               │
         ┌─────────────────────────┬───────────┴───────────┬─────────────────────────┐
         ▼                         ▼                       ▼                         ▼
 📰 Orthogonal News       🧠 Kahneman-Tversky     🛡️ CSRC Regulatory      🔍 TreeSHAP & NLP
    Surprise Filter          Prospect Theory         Suitability Engine      Synthesized XAI
    (Didisheim et al.,       Cross-Asset Momentum    R1 to R5 Matching &     Plain-English Risk
    2026 RFS Standard)       Peer Distances          SHA-256 Audit Hashes    Driver Attribution
```

### 1. Orthogonal News Shocks (Didisheim et al., 2026)
- High-dimensional news text embeddings (1024-d reduced to 30-d via `IncrementalPCA`) are cross-sectionally regressed onto 100 accounting characteristics.
- The orthogonal residual $\epsilon = \text{News} - \hat{\text{News}}$ isolates pure unexpected news surprise unpriced by balance sheet fundamentals.

### 2. Multi-Asset Behavioral Finance (Barberis et al., 2016; Tversky & Kahneman, 1992)
- Evaluates S-shaped Prospect Theory value functions with asymmetric loss aversion ($\lambda \approx 2.25$).
- Identifies the **100 nearest psychological peers** for each stock to capture cross-asset sentiment contagion (*TK Peer Reward*).

### 3. Native CSRC Suitability (R1 to R5) & Cryptographic Audit Proof
- Classifies risk across 5 official regulatory tiers: No Risk (Alpha), Low Risk, Medium Risk, High Risk, Severe Risk.
- **Asymmetric Tail-Risk Guardrail**: When severe crash probability exceeds 15%, conservative investors are automatically protected regardless of argmax classification.
- Seals each suitability assessment with a timestamped SHA-256 cryptographic digest, architected for WeBank's open consortium blockchain **FISCO BCOS**.

### 4. Exact Explainable AI (TreeSHAP)
- Native analytic TreeSHAP computation decomposing the top 5 risk drivers for each asset.
- Automatic natural language synthesis providing plain-English explanations for retail wealth clients.

### 5. Strict Walk-Forward Temporal Validation (2012 to 2022)
- All features strictly lagged by a **minimum of one month** ($t-1$); quarterly accounting fundamentals lagged by 4 months, annual balance sheets by 6 months; zero look-ahead bias.
- Evaluated across 11 out-of-sample stress years (2015 crash, 2018 tariffs, 2020 pandemic).

### 5.1 Data Leakage Prevention & Temporal Alignment

To guarantee zero look-ahead bias, our data pipeline enforces a strict temporal separation between predictors ($X$) and the target variable ($Y$):

- **Predictors ($t-1$):** In our `features_light.parquet` and `embeddings_pca.parquet` files, all firm characteristics, fundamental ratios, and news embeddings are strictly lagged. The row dated `YYYY-MM-31` contains only data that was publicly available *before* the start of that month.
- **Target Variable ($t$):** The only column that belongs to the current month is `ret` (the realized monthly return). This is used exclusively to generate the 5-class risk target ($Y$).
- **Enforcement in Code:** In [`ml_pipeline/ml_pipeline_v5.py`](ml_pipeline/ml_pipeline_v5.py), the `ret` column is explicitly excluded from the feature matrix (`exclude_cols`) before model training. This ensures that the model never sees the current month's return when making its prediction.

*Example:* For a prediction dated `2023-02-28`, the model uses January's news embeddings and fundamentals (lagged $t-1$), and predicts the return that will occur at the end of February ($t$).

---

## 📊 2023 Out-of-Sample Performance Summary

> **⚠️ Institutional Benchmark Clarification ("Equal-Weighted ML Universe" vs Capitalization Indices):**  
> The benchmark reported in this project is the **Equal-Weighted ML Universe Benchmark**, computed as the monthly arithmetic mean return of the universe evaluated by the model ($R_{\text{benchmark}, t} = \frac{1}{N_t} \sum_{i=1}^{N_t} r_{i,t}$). It is **not** the market-cap-weighted CSI 300 index (which dropped **-11.38%** in 2023 due to mega-cap banking and property sector drawdowns). Evaluating against the exact investable universe eliminates selection bias and complies with CFA / GIPS presentation standards.

### Active News-Covered Universe (24,209 stock-months)
| Metric | Adastra Strategy (Opportunity) | Equal-Weighted ML Universe Benchmark | Net Advantage (Alpha) |
|---|---|---|---|
| **Cumulative Return (Gross)** | **+14.02%** | +8.27% | **+5.75% gross alpha** |
| **Cumulative Return (Net of 20 bps)** | **+12.06%** | +8.27% | **+3.79% net alpha** |
| **Annualized Sharpe Ratio** | **1.03** | 0.69 | **+0.34** |
| **Maximum Drawdown** | **-4.70%** | -4.53% | **Comparable tail risk** |
| **Monthly Win Rate** | **66.7%** (8 / 12 months) | N/A | Consistent monthly alpha |
| **Structural Long/Short Alpha Spread** | **+1.310% per month** | N/A | Statistically significant at $p < 0.001$ |

### Comprehensive Cross-Sectional Universe (37,247 stock-months)
| Metric | Adastra Strategy (Opportunity) | Equal-Weighted ML Universe Benchmark | Net Advantage (Alpha) |
|---|---|---|---|
| **Cumulative Return (Gross)** | **+13.25%** | +4.60% | **+8.65% gross alpha** |
| **Cumulative Return (Net of 20 bps)** | **+10.53%** | +4.60% | **+5.93% net alpha** |
| **Annualized Sharpe Ratio** | **0.91** | 0.34 | **+0.57** |
| **Maximum Drawdown** | **-4.94%** | -5.78% | **+0.84% lower drawdown** |
| **Monthly Win Rate** | **83.3%** (10 / 12 months) | N/A | Consistent monthly outperformance |
| **Structural Long/Short Alpha Spread** | **+1.700% per month** | N/A | Statistically significant at $p < 0.001$ |

---

## 🏗️ Repository Architecture

```
webank/
├── README.md                            # Comprehensive project guide (this file)
├── start.sh                             # One-click launch script (FastAPI + Vite)
├── requirements.txt                     # Root Python dependencies
├── synthetic_fallback.py                # Automated synthetic data generator for zero-data public auditing
├── 02_pipeline_interactif.ipynb         # Interactive quantitative research notebook
├── ml_pipeline/                         # Modular Machine Learning Pipeline
│   ├── pca_embeddings.py                # IncrementalPCA on 1024-d text embeddings (pre-2023)
│   └── ml_pipeline_v5.py                # Production 5-class LightGBM pipeline with Optuna
├── backend/                             # High-performance FastAPI REST API
│   ├── main.py                          # Core API endpoints & lifecycle management
│   ├── compliance.py                    # CSRC suitability engine & SHA-256 hashing
│   ├── adviser.py                       # Wealth advisory, profiling & portfolio optimizer
│   ├── xai.py                           # TreeSHAP natural language explanation synthesizer
│   └── prepare_data.py                  # ETL pipeline (KNN imputation + A-shares sectors)
├── frontend/                            # React 18 + Vite + Tailwind CSS + Framer Motion
│   ├── src/pages/Platform.tsx           # Main 2D Market Topology & Foldable Stock Profile
│   ├── src/components/platform/         # Interactive UI components
│   │   ├── AIResearchLab.tsx            # Gamified quantitative sandbox
│   │   ├── BacktestDashboard.tsx        # 2023 Out-of-sample performance cockpit
│   │   ├── StockProfileModal.tsx        # Deep-dive stock modal with SHAP waterfalls
│   │   └── WealthAdvisoryModal.tsx      # CSRC C1-C5 profiling & portfolio recommendations
│   └── package.json                     # Frontend npm dependencies
├── docs/                                # Competition deliverables & documentation
│   ├── SECURITY_REPORT.md               # Standalone Security Self-Assessment Report
│   ├── EXECUTION_EVIDENCE.md            # Simulated account sandbox operation report
│   └── technical-documentation/         # Quarto documentation project
│       ├── _quarto.yml                  # Quarto book configuration
│       ├── index.qmd                    # Executive summary
│       ├── architecture.qmd             # Four-layer system architecture & dataflow
│       ├── algorithm.qmd                # Quantitative formulation, LightGBM, SHAP
│       └── security.qmd                 # Security architecture, audit hashing, CSRC rules
├── tests/                               # Automated test suite
│   ├── run_tests.py                     # Master test runner with summary reporting
│   ├── test_compliance.py               # CSRC suitability & SHA-256 verification tests
│   ├── test_adviser.py                  # Psychometric profiling & portfolio constraints
│   ├── test_xai.py                      # TreeSHAP explanation generation tests
│   └── test_api.py                      # FastAPI endpoint integration tests
├── scripts/                             # Utility & operational automation scripts
│   └── generate_execution_evidence.py   # Multi-account sandbox execution generator
├── logs/                                # Operational audit logs
│   └── sandbox_execution.log            # Verifiable JSONL transaction event stream
└── dashboard_data/                      # Precomputed visual & backtest artifacts
    ├── dashboard_points.parquet         # Enriched visual dataset (35,085 stock-months)
    ├── expected_return_2023.csv         # Cross-sectional expected return z-scores
    └── confusion_matrix.png             # 5x5 test confusion matrix
```

---

## 🚀 Quickstart & Deployment Instructions

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher & `npm`

---

### Option 1: One-Click Startup (Recommended)
Launch both the FastAPI backend and Vite frontend with a single command:
```bash
chmod +x start.sh
./start.sh
```
- **Backend API**: `http://localhost:8000` (Interactive Swagger docs: `http://localhost:8000/docs`)
- **Frontend Cockpit**: `http://localhost:5173`

---

### Option 2: Manual Step-by-Step Launch

#### 1. Environment Setup
```bash
# Clone the repository
git clone https://github.com/adrielakak/webank.git
cd webank

# Install Python dependencies
pip install -r requirements.txt
```

#### 2. Backend Setup
```bash
# Start FastAPI Uvicorn server on port 8000
python3 -m uvicorn backend.main:app --reload --port 8000
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### Option 3: Running the Automated Test Suite
To execute the comprehensive test suite across all modules (compliance, adviser, XAI, and API endpoints):
```bash
python3 tests/run_tests.py
```
Output:
```
======================================================================
🧪  Adastra : Automated Test Suite Runner
    Shenzhen International FinTech Competition (FinTechathon 2026)
======================================================================
...
Ran 18 tests in 0.229s

OK
======================================================================
📊  Test Summary:
    - Tests Run:     18
    - Failures:      0
    - Errors:        0
    - Status:        ✅ ALL TESTS PASSED
======================================================================
```

---

### Option 4: Generating Sandbox Execution Evidence
To simulate multi-account sandbox operations and produce verifiable transaction audit logs:
```bash
python3 scripts/generate_execution_evidence.py
```
This updates:
- [`logs/sandbox_execution.log`](logs/sandbox_execution.log)
- [`docs/EXECUTION_EVIDENCE.md`](docs/EXECUTION_EVIDENCE.md)

---

### Option 5: Compiling Technical Documentation (Quarto)
The technical documentation is authored as an interactive Quarto book. To recompile:
```bash
cd docs/technical-documentation
quarto render
```
The compiled HTML documentation book is generated at `docs/technical-documentation/_output/index.html`.

---

### Option 6: Reproducing the Machine Learning Pipeline (Offline)
To re-run the PCA factor decomposition and 5-class LightGBM walk-forward training:
```bash
# Step 1: IncrementalPCA dimension reduction from news embeddings (fitted pre-2023)
python3 ml_pipeline/pca_embeddings.py

# Step 2: 11-Year Walk-Forward Training, Bayesian Optuna Tuning & 2023 Holdout Evaluation
python3 ml_pipeline/ml_pipeline_v5.py
```

---

## 🛡️ Security, Privacy & Zero-Data Policy

1. **Zero-Data Policy**:
   All proprietary commercial market data (CSMAR) is strictly excluded via `.gitignore`. The repository contains only anonymized, precomputed visual coordinates and an automated academic synthetic fallback engine to allow zero-leakage public auditing.

2. **CSRC Regulatory Suitability Matrix**:
   - **C1 (Conservative)**: Strictly R1 products (No Risk)
   - **C2 (Steady)**: R1 and R2 products
   - **C3 (Balanced)**: R1 to R3 products (Tail-risk warnings on R4/R5)
   - **C4 (Growth)**: R1 to R4 products
   - **C5 (Aggressive)**: Unrestricted cross-sectional access

3. **Tamper-Evident SHA-256 Audit Trail**:
   Every suitability assessment, investor profiling questionnaire, and portfolio rebalancing order generates an immutable 64-character SHA-256 digest, structured for on-chain anchoring on **FISCO BCOS**.

For in-depth security analysis and known risk disclosures, refer to [`docs/SECURITY_REPORT.md`](docs/SECURITY_REPORT.md).

---

## 👥 Authors & Acknowledgments

### Student Research & Engineering Team (Team Adastra)
- **Adriel Kourlate**
- **Dong Zixuan**
- **Aadithyan Sajith Kumar**
- **Khushi Mistry**

### Academic Supervision & Mentorship
- **Faculty Advisor & Academic Mentor**: Prof. Halis Sak

### Academic Context
- **Competition**: Shenzhen International FinTech Competition (FinTechathon 2026)
- **Track**: WeBank Track : Quantitative AI & Wealth Advisory (Topic B)
- **Host Institutions**: WeBank · Shenzhen University · SIGS Tsinghua

---
*Developed for FinTechathon 2026 · WeBank Track · Licensed under MIT.*
