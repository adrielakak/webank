"""
Unit tests for Explainable AI (XAI) Natural Language Generation.
Validates synthesis of TreeSHAP values into plain-English investor explanations.
"""

import unittest
from backend.xai import generate_nl_explanation


class TestXAIExplanation(unittest.TestCase):

    def test_empty_shap_features_fallback(self):
        """When no SHAP values are provided, returns an informative fallback message."""
        expl = generate_nl_explanation([], "Medium Risk")
        self.assertIn("Medium Risk", expl)
        self.assertIn("no detailed feature importance", expl)

    def test_risk_increasing_and_mitigating_factors(self):
        """Correctly identifies risk-increasing (+) and risk-mitigating (-) factors."""
        shap_features = [
            {"feature": "vol_x_neg_momentum", "value": 0.45},
            {"feature": "market_equity", "value": -0.30},
            {"feature": "financial_stress", "value": 0.20},
        ]
        expl = generate_nl_explanation(shap_features, "High Risk", prob_severe=0.15)
        
        # Check that top driver is mentioned
        self.assertIn("amplified volatility during downward momentum", expl)
        # Check mitigating factor is recognized
        self.assertIn("overall market capitalization", expl)

    def test_severe_tail_risk_warning(self):
        """When prob_severe > 0.30, an explicit tail-risk warning banner must be appended."""
        shap_features = [
            {"feature": "ivol_ff3_21d", "value": 0.55},
            {"feature": "drawdown_proxy", "value": 0.40},
        ]
        expl = generate_nl_explanation(shap_features, "Severe Risk", prob_severe=0.65)
        self.assertTrue("risk alert" in expl.lower() or "severe risk" in expl.lower())
        self.assertIn("short-term idiosyncratic volatility", expl)

    def test_feature_name_humanization(self):
        """Validates that quantitative abbreviations are translated to accessible human terms."""
        shap_features = [
            {"feature": "tk_peer_reward", "value": 0.35},
            {"feature": "news_shock_2", "value": -0.25},
        ]
        expl = generate_nl_explanation(shap_features, "Low Risk", prob_severe=0.05)
        self.assertIn("Tversky-Kahneman peer expected reward", expl)
        self.assertIn("unexpected financial news shock", expl)


if __name__ == "__main__":
    unittest.main()
