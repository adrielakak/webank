# 🧭 PROJECT CHARTER & CORE GUIDELINE: WEADVISORY AI
> **FinTechathon 2026 — Shenzhen International FinTech Competition (International Track)**  
> **Topic B / Topic 2**: Wealth Advisory Agent  
> **Hosts**: Shenzhen University & WeBank  
> **Author / Team**: Adriel Kourlate & Team  
> **Target**: 1st Prize (RMB 100,000 + Shenzhen Finals)

---

## 🎯 1. Mission & Vision
Build **WeAdvisory AI**, an autonomous, compliant, and explainable wealth advisory agent tailored for retail investors, bridging international private wealth standards (MiFID II / Markowitz) with **WeBank's native regulatory and suitability framework (CSRC R1–R5 classification)**.

---

## ⚖️ 2. Official Evaluation Criteria & Scoring Matrix (100% + 5 pts)
1. **Task Completion (40%)**:
   - End-to-end user journey: Onboarding ➔ Risk Profiling ➔ Portfolio Optimization ➔ Explainability ➔ Order Execution Simulation.
   - Real, deterministic financial calculations (no LLM hallucinations on math).
2. **Security & Compliance (30%) — *Key Differentiator***:
   - CSRC / WeBank R1 to R5 suitability guardrail (blocking non-compliant asset allocations).
   - Multi-tier permission model & immutable cryptographic audit logs.
   - Security self-assessment report (known risks, prompt injection defense, data privacy).
3. **Innovation & Interaction (30%)**:
   - Sleek, minimalist, high-trust fintech cockpit (Dark/Light modern glassmorphism).
   - Dynamic micro-interactions powered by React Bits & Shadcn UI.
   - Explainable AI (XAI) dialogue breaking down complex quant metrics into intuitive insights.
4. **Challenge Bonus (0–5 pts)**:
   - On-chain proof of audit: Hashing investment mandates & suitability approvals on an EVM/Consortium testnet.

---

## 🏗️ 3. System Architecture & Modularity
The project is decoupled into 4 distinct, independently testable layers:

```
[ FRONTEND COCKPIT ]  <-->  [ FASTAPI / ORCHESTRATION GATEWAY ]
  - React 18 / Vite           - Conversation Manager
  - TailwindCSS / Shadcn UI   - Session State & Sandbox Context
  - React Bits Animations     - Tool Calling / Dispatcher
          |                               |
          v                               v
[ DETERMINISTIC QUANT ENGINE ]   [ COMPLIANCE & SECURITY SENTINEL ]
  - Markowitz Efficient Frontier   - CSRC R1-R5 Suitability Filter
  - Black-Litterman Model          - Hallucination Barrier
  - Monte Carlo Simulation Engine  - Cryptographic / On-Chain Audit Logger
```

---

## 🚀 4. Master 6-Phase Roadmap (Step-by-Step "Cook" Protocol)

### Phase 1: Product Conception & Functional Specifications *(CURRENT STEP)*
- [x] Target competition & topic locked (Topic B: Wealth Advisory).
- [ ] Define the exact Investment Universe (12 curated sandbox assets across R1 to R5).
- [ ] Define the R1–R5 Suitability Matrix & compliance constraints.
- [ ] Map the complete 5-step User Journey (Dialogue ➔ Diagnostics ➔ Optimization ➔ Validation ➔ Execution).
- [ ] Formalize the data contracts (JSON schemas between UI, Agents, and Quant Engine).

### Phase 2: The Deterministic Quant Engine (Python)
- [ ] Asset universe price simulation & covariance matrix calculation.
- [ ] Mean-variance portfolio optimizer (Markowitz / Max Sharpe / Min Volatility).
- [ ] Monte Carlo 1,000-path simulation engine for forward-looking risk cone.
- [ ] 100% unit-tested via `pytest` (0% LLM dependency for math).

### Phase 3: The Multi-Agent Brain & Compliance Guardrail
- [ ] **Agent 1: Profiler Agent** (extracts user risk parameters through psychometric dialogue).
- [ ] **Agent 2: Quant Advisory Agent** (translates quant output into human, clear advisory).
- [ ] **Agent 3: Compliance Sentinel** (validates recommendations against R1-R5 rules, enforces hard stops).
- [ ] Automated audit trail generation (JSON logs + SHA-256 hash).

### Phase 4: Backend API & Sandbox Environment
- [ ] FastAPI lightweight server exposing endpoints: `/api/chat`, `/api/profile`, `/api/optimize`, `/api/audit`.
- [ ] Simulated portfolio account with initial balance ($100k or ¥500k).
- [ ] Sandbox execution logger (generating the required `execution_evidence.log`).

### Phase 5: Frontend Cockpit (React + Tailwind + Shadcn + React Bits)
- [ ] Minimalist, clean fintech UI layout (Left: Conversational Advisor; Right: Interactive Cockpit).
- [ ] Dynamic asset allocation pie/donut chart & Monte Carlo interactive risk cone.
- [ ] React Bits animated transitions (aurora/dither background, smooth counters, glass cards).
- [ ] Audit log inspector modal with one-click verification.

### Phase 6: Contest Submission Deliverables Package
- [ ] Technical Documentation (`docs/ARCHITECTURE.md`, `docs/ALGORITHM.md`).
- [ ] Security Self-Assessment Report (`docs/SECURITY_REPORT.md`).
- [ ] GitHub Repository cleanup, `README.md`, single-command launch (`./run.sh`).
- [ ] 10-minute Pitch Deck (PDF/Slides in English).
- [ ] 3 to 5-minute Demo Video recording.

---

## 🛡️ 5. Golden Rules for Development
1. **Never code without a spec**: Every module must have defined inputs, outputs, and validation tests.
2. **Zero Hallucination on Numbers**: All financial returns, variances, and allocations come from Python math, never from raw LLM text generation.
3. **Keep it Clean & Minimal**: Prioritize elegance, whitespace, crisp typography, and instant feedback.
4. **Cost Discipline**: Keep operational cost at 0€ by leveraging free tier APIs, local math, and sandbox data.
5. **English Standard, WeBank DNA**: All deliverables in English, but deeply infused with WeBank's regulatory precision (R1-R5).
