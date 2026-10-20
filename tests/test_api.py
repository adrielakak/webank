"""
Unit tests for Adastra FastAPI Endpoints.
Validates core API routes, payload structures, and response serialization.
"""

import unittest
from backend.main import root, get_dates, get_stocks, get_stats, get_backtest, load_data


class TestAPIEndpoints(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Load dataset / synthetic fallback into in-memory store
        load_data()

    def test_root_endpoint(self):
        """Root endpoint returns running status and version."""
        res = root()
        self.assertEqual(res["status"], "running")
        self.assertIn("Adastra", res["service"])

    def test_get_dates_endpoint(self):
        """Returns non-empty list of available dates in YYYY-MM-DD format."""
        res = get_dates()
        self.assertIn("dates", res)
        self.assertGreater(res["count"], 0)
        first_date = res["dates"][0]
        self.assertEqual(len(first_date), 10)
        self.assertEqual(first_date.count("-"), 2)

    def test_get_stocks_endpoint(self):
        """Returns stock points with risk classifications, PCA projections, and sectors."""
        res = get_stocks(date=None)
        self.assertIn("stocks", res)
        self.assertGreater(len(res["stocks"]), 0)
        
        sample = res["stocks"][0]
        self.assertIn("stkcd", sample)
        self.assertIn("predicted_risk", sample)
        self.assertIn("risk_label", sample)
        self.assertIn("risk_x", sample)
        self.assertIn("return_y", sample)
        self.assertIn("sector", sample)
        self.assertIn(sample["predicted_risk"], [0, 1, 2, 3, 4])

    def test_get_stats_endpoint(self):
        """Returns aggregate market summary and risk breakdown."""
        res = get_stats(date=None)
        self.assertIn("total_stocks", res)
        self.assertIn("risk_distribution", res)
        self.assertGreater(res["total_stocks"], 0)

    def test_get_backtest_endpoint(self):
        """Returns 2023 out-of-sample backtest track record."""
        res = get_backtest(date=None)
        self.assertIn("summary", res)
        self.assertIn("monthly_series", res)
        self.assertIn("quadrants", res)
        self.assertIn("net_alpha", res["summary"])

    def test_session_auth_and_kyc_anchoring(self):
        """Validates HMAC-SHA256 session token creation and verification."""
        from backend.main import init_session, get_session, assess_profile, AssessmentRequest, SessionInitRequest
        
        # 1. Init session
        init_res = init_session(SessionInitRequest(investor_name="FinTech Jury", initial_profile="C3"))
        self.assertEqual(init_res["status"], "AUTHENTICATED")
        self.assertTrue(init_res["session_token"].startswith("adastra_"))

        # 2. Verify token
        sess_res = get_session(authorization=f"Bearer {init_res['session_token']}")
        self.assertEqual(sess_res["status"], "VALID")
        self.assertEqual(sess_res["session"]["investor_name"], "FinTech Jury")

        # 3. Assess profile generates server-anchored token
        req = AssessmentRequest(
            answers={
                "q1_horizon": "C",
                "q2_drawdown": "C",
                "q3_experience": "D",
                "q4_objective": "C",
                "q5_liquidity": "A"
            },
            investor_name="FinTech Jury"
        )
        assess_res = assess_profile(req)
        self.assertIn("session_token", assess_res)
        self.assertTrue(assess_res["session_token"].startswith("adastra_"))
        self.assertIn("certificate_hash", assess_res)


if __name__ == "__main__":
    unittest.main()
