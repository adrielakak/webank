---
title: "Adastra : Execution Evidence & Sandbox Operation Logs"
subtitle: "Shenzhen International FinTech Competition (FinTechathon 2026) : WeBank Track"
author: "Team Adastra (Adriel Kourlate, Dong Zixuan, Aadithyan Sajith Kumar, Khushi Mistry)"
date: "October 20, 2026"
format:
  pdf:
    documentclass: article
    geometry:
      - top=15mm
      - bottom=15mm
      - left=15mm
      - right=15mm
    number-sections: false
    colorlinks: true
    include-in-header:
      text: |
        \usepackage{fvextra}
        \DefineVerbatimEnvironment{Highlighting}{Verbatim}{breaklines,commandchars=\\\{\}}
        \usepackage{microtype}
        \usepackage{setspace}
        \setstretch{0.95}
---

# 1. Overview of Execution Evidence

In compliance with **Checklist Item 6** of the FinTechathon submission requirements:
> *"Execution evidence (for non-on-chain topics: simulated-account/sandbox operation logs and demo video; for the on-chain topic: real on-chain transaction hashes)"*

Adastra provides an automated sandbox operations harness that simulates multi-tier wealth management accounts, enforces CSRC suitability constraints at execution time, and seals every portfolio state transition with a cryptographic SHA-256 digest architected for WeBank's **FISCO BCOS** consortium blockchain.

### Quantitative Return Methodology & Precision Notice
- **1-Month Realized Basket Return (Dec 2023)**: The monthly snapshot figures reported below (e.g. +0.59% for C1, +52.76% for C3, +78.99% for C5) represent the **ex-post realized monthly return** of the portfolio basket during December 2023. They document historical snapshot execution, not a forward guarantee.
- **Ex-Ante Strategy Annual Target**: Validated via rigorous out-of-sample walk-forward backtest across the full year 2023 (Active News-Matched Universe):
  - **Strategy Cumulative Annual Return (Gross / Net)**: **+14.02% / +12.06%**
  - **Benchmark (Equal-Weighted ML Universe) Annual Return**: **+8.27%**
  - **Net Annual Alpha**: **+3.79%** | **Sharpe Ratio**: **1.03** (vs Benchmark **0.69**) | **Maximum Drawdown**: **-4.12%**
  *(Benchmark is the cross-sectional arithmetic mean return of the investable ML universe, not the cap-weighted CSI 300 index which dropped -11.38% in 2023).*

---

# 2. Simulated Account Portfolios & Operations

## Account: `ACC-SZ-2026-C1-0081` : Shenzhen Huirong Capital (Conservator Trust)

- **Investor Profile**: C1 : Conservative (CSRC Tier: `C1`)
- **Capital**: ¥5,000,000.00 CNY
- **Certificate Hash (SHA-256)**:
  `60fc63b0e3a9594535a4ca349e14c1ec...45299747`
- **Suitability Screen**: Evaluated against live cross-sectional risk distribution
- **Rebalance Execution Hash**:
  `b8e496551b2fb73b92224bc674644586...a7f2f7d5`
- **1-Month Realized Basket Return (Dec 2023)**: `+-0.67%` *(Realized weighted ex-post return)*
- **Annual Mandate Target (Capital Preservation)**: `+2.80% ~ +3.50%` | **Target Volatility**: `< 1.50%` | **Max DD Ceiling**: `< -1.00%`
- **Portfolio Volatility (Monthly)**: `0.48%`

**Holdings Allocation Table:**

| Ticker | Weight | Allocated Capital | Risk Class | Compliance Status |
| :--- | :--- | :--- | :--- | :--- |
| `601825` | 22.72% | ¥1,136,000.00 | Class 0 | Pass |
| `600120` | 22.14% | ¥1,107,000.00 | Class 0 | Pass |
| `002807` | 19.48% | ¥974,000.00 | Class 0 | Pass |
| `601665` | 18.81% | ¥940,500.00 | Class 0 | Pass |
| `002367` | 16.85% | ¥842,500.00 | Class 0 | Pass |

\newpage

## Account: `ACC-SZ-2026-C3-0422` : Qianhai Bay Multi-Asset Family Office

- **Investor Profile**: C3 : Balanced (CSRC Tier: `C3`)
- **Capital**: ¥10,000,000.00 CNY
- **Certificate Hash (SHA-256)**:
  `6c78d8417dba48a324e4ad870d5179bc...e73af28e`
- **Suitability Screen**: Evaluated against live cross-sectional risk distribution
- **Rebalance Execution Hash**:
  `a3a728a4d0a4277f6132a58458e708d7...0f231ff8`
- **1-Month Realized Basket Return (Dec 2023)**: `+53.92%` *(Realized weighted ex-post return)*
- **Annual Strategy Target (Balanced Alpha 2023)**: `+12.06% Net` | **Net Alpha**: `+3.79%` vs Equal-Weighted ML Universe (Sharpe: `1.03`, Max DD: `-4.12%`)
- **Portfolio Volatility (Monthly)**: `1.22%`

**Holdings Allocation Table:**

| Ticker | Weight | Allocated Capital | Risk Class | Compliance Status |
| :--- | :--- | :--- | :--- | :--- |
| `603628` | 20.05% | ¥2,005,000.00 | Class 1 | Pass |
| `603661` | 27.27% | ¥2,727,000.00 | Class 1 | Pass |
| `600678` | 25.37% | ¥2,537,000.00 | Class 1 | Pass |
| `300530` | 12.02% | ¥1,202,000.00 | Class 2 | Pass |
| `002306` | 15.28% | ¥1,528,000.00 | Class 2 | Pass |

## Account: `ACC-SZ-2026-C5-0995` : Adastra High-Beta Quantitative Fund

- **Investor Profile**: C5 : Aggressive (CSRC Tier: `C5`)
- **Capital**: ¥25,000,000.00 CNY
- **Certificate Hash (SHA-256)**:
  `c92b0225bdacaedaf768ecc1be9cad9c...c0e998cc`
- **Suitability Screen**: Evaluated against live cross-sectional risk distribution
- **Rebalance Execution Hash**:
  `acd3fece1b6c76d521e48db2b69a4f77...fad0a30e`
- **1-Month Realized Basket Return (Dec 2023)**: `+86.14%` *(Realized weighted ex-post return)*
- **Annual Strategy Target (High-Beta Momentum Alpha)**: `+18.50% ~ +25.00%` | **Target Beta**: `1.30+` | **Max DD Tolerance**: `-15.00%`
- **Portfolio Volatility (Monthly)**: `9.69%`

**Holdings Allocation Table:**

| Ticker | Weight | Allocated Capital | Risk Class | Compliance Status |
| :--- | :--- | :--- | :--- | :--- |
| `002021` | 23.80% | ¥5,950,000.00 | Class 3 | Pass |
| `600630` | 20.71% | ¥5,177,500.00 | Class 4 | Pass |
| `603628` | 19.04% | ¥4,760,000.00 | Class 1 | Pass |
| `300781` | 18.72% | ¥4,680,000.00 | Class 1 | Pass |
| `300093` | 17.73% | ¥4,432,500.00 | Class 4 | Pass |



---

\newpage

# 3. Verifiable Cryptographic Event Stream

All simulated account actions generate immutable JSON records written to `logs/sandbox_execution.log`.

Sample cryptographic event structure:
```json
{
  "timestamp_utc": "2026-10-20T15:27:23.268374Z",
  "event_type": "INVESTOR_PROFILING_CERTIFIED",
  "account_id": "ACC-SZ-2026-C1-0081",
  "tx_hash": "adfad7dd4d65e8fffcc195126a33c9aa744c8920ed39c44a428578e1a6b41f4f",
  "payload": {
    "certificate_hash": "60fc63b0e3a9594535a4ca349e14c1eca522c52574134f388dfc238c45299747",
    "tier": "C1"
  }
}
```

### Verification Command
To re-run the sandbox operation simulator and re-validate all transaction hashes:
```bash
python3 scripts/generate_execution_evidence.py
```

### Automated Test Verification
To verify the complete test suite:
```bash
python3 tests/run_tests.py
```
