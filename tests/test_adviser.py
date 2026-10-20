"""
Unit tests for Adastra Wealth Advisory Engine.
Validates questionnaire scoring, CSRC C1-C5 classification, and portfolio optimization constraints.
"""

import unittest
import pandas as pd
from backend.adviser import compute_investor_profile, generate_personalized_portfolio


class TestAdviserEngine(unittest.TestCase):

    def test_conservative_profiling_c1(self):
        """Answers indicating short horizon and zero loss tolerance must yield C1 (Conservative)."""
        answers = {
            "q1_horizon": "A",      # 2 pts
            "q2_drawdown": "A",     # 0 pts
            "q3_experience": "A",   # 2 pts
            "q4_objective": "A",    # 2 pts
            "q5_liquidity": "A",    # 2 pts
        }
        profile = compute_investor_profile(answers, investor_name="Test Investor C1")
        self.assertEqual(profile["category"], "C1")
        self.assertIn(0, profile["allowed_risk_levels"])
        self.assertNotIn(4, profile["allowed_risk_levels"])
        self.assertIn("certificate_hash", profile)
        self.assertEqual(len(profile["certificate_hash"]), 64)

    def test_balanced_profiling_c3(self):
        """Answers indicating medium horizon and moderate drawdown must yield C3 (Balanced)."""
        answers = {
            "q1_horizon": "C",      # 12 pts
            "q2_drawdown": "C",     # 16 pts
            "q3_experience": "C",   # 12 pts
            "q4_objective": "C",    # 12 pts
            "q5_liquidity": "B",    # 6 pts -> Total 58 pts (C3: 46-65)
        }
        profile = compute_investor_profile(answers, investor_name="Test Investor C3")
        self.assertEqual(profile["category"], "C3")
        self.assertIn(0, profile["allowed_risk_levels"])
        self.assertIn(1, profile["allowed_risk_levels"])
        self.assertIn(2, profile["allowed_risk_levels"])

    def test_aggressive_profiling_c5(self):
        """Answers indicating maximum risk appetite must yield C5 (Aggressive)."""
        answers = {
            "q1_horizon": "D",      # 20 pts
            "q2_drawdown": "E",     # 30 pts
            "q3_experience": "E",   # 20 pts
            "q4_objective": "E",    # 20 pts
            "q5_liquidity": "C",    # 10 pts -> Total 100 pts (C5: 86-100)
        }
        profile = compute_investor_profile(answers, investor_name="Test Investor C5")
        self.assertEqual(profile["category"], "C5")
        self.assertIn(4, profile["allowed_risk_levels"])

    def test_portfolio_allocation_suitability_enforcement(self):
        """Allocations must strictly enforce suitability boundaries and normalize to 100%."""
        dummy_df = pd.DataFrame([
            {"stkcd": 600519, "date": pd.Timestamp("2023-12-31"), "predicted_risk": 0, "prob_class_4": 0.01, "return_y": 0.08, "risk_x": 0.02, "market_equity": 2000000, "sector": "Consumer"},
            {"stkcd": 600036, "date": pd.Timestamp("2023-12-31"), "predicted_risk": 1, "prob_class_4": 0.03, "return_y": 0.06, "risk_x": 0.03, "market_equity": 1000000, "sector": "Financials"},
            {"stkcd": 300750, "date": pd.Timestamp("2023-12-31"), "predicted_risk": 2, "prob_class_4": 0.09, "return_y": 0.12, "risk_x": 0.05, "market_equity": 800000, "sector": "CleanTech"},
            {"stkcd": 688981, "date": pd.Timestamp("2023-12-31"), "predicted_risk": 3, "prob_class_4": 0.28, "return_y": 0.15, "risk_x": 0.08, "market_equity": 500000, "sector": "Semiconductors"},
            {"stkcd": 300059, "date": pd.Timestamp("2023-12-31"), "predicted_risk": 4, "prob_class_4": 0.75, "return_y": 0.20, "risk_x": 0.12, "market_equity": 300000, "sector": "Financials"},
        ])

        # For C1 Conservative client:
        portfolio_c1 = generate_personalized_portfolio(df=dummy_df, profile="C1", budget=100000.0, top_k=5)
        self.assertEqual(portfolio_c1["profile"], "R1")
        # Ensure only predicted_risk == 0 is allocated
        for asset in portfolio_c1["holdings"]:
            self.assertEqual(asset["predicted_risk"], 0)

        # Check total weight normalizes to 100.0% (within numerical tolerance)
        total_weight = sum(a["weight"] for a in portfolio_c1["holdings"])
        self.assertAlmostEqual(total_weight, 100.0, places=1)

    def test_dialogue_crash_diagnostic_300699(self):
        """Dialogue query for 300699 crash must trigger specific XAI diagnostic report."""
        from backend.adviser import handle_advisory_dialogue
        dummy_df = pd.DataFrame([
            {"stkcd": 300699, "date": pd.Timestamp("2023-01-31"), "predicted_risk": 0, "actual_risk": 2, "prob_class_4": 0.13, "return_y": -0.0008, "risk_x": 0.012, "sector": "Tech"},
            {"stkcd": 300699, "date": pd.Timestamp("2023-03-31"), "predicted_risk": 1, "actual_risk": 4, "prob_class_4": 0.171, "return_y": -0.2339, "risk_x": 0.015, "sector": "Tech"},
        ])
        res = handle_advisory_dialogue("Why did AI predict Low Risk on 300699 before the -23.39% crash?", df=dummy_df, profile="R3", date_str="2023-01-31")
        self.assertIn("300699", res["reply"])
        self.assertIn("-23.39%", res["reply"])
        self.assertIn("CSRC Asymmetric Tail-Risk Guardrail", res["reply"])
        self.assertEqual(res.get("referenced_stkcd"), 300699)

    def test_dialogue_guardrails_kahneman_tversky(self):
        """Dialogue queries on loss aversion and guardrails must return institutional framework."""
        from backend.adviser import handle_advisory_dialogue
        dummy_df = pd.DataFrame([
            {"stkcd": 600519, "date": pd.Timestamp("2023-12-31"), "predicted_risk": 0, "actual_risk": 0, "prob_class_4": 0.01, "return_y": 0.05, "risk_x": 0.02, "sector": "Consumer"}
        ])
        res = handle_advisory_dialogue("How does Kahneman-Tversky loss aversion (2.5x) shape our risk model?", df=dummy_df, profile="R3")
        self.assertIn("Kahneman-Tversky", res["reply"])
        self.assertIn("2.5x", res["reply"])
        self.assertIn("Conservative Miss", res["reply"])


if __name__ == "__main__":
    unittest.main()

