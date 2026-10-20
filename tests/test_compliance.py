"""
Unit tests for CSRC Suitability Engine & Cryptographic Audit Trails.
Validates R1-R5 suitability matching, edge cases, and SHA-256 tamper-evidence.
"""

import unittest
import hashlib
import json
from backend.compliance import evaluate_suitability


class TestComplianceSuitability(unittest.TestCase):

    def test_r1_conservative_allow_only_no_risk(self):
        """R1 (Conservative) must only accept predicted_risk == 0."""
        # Risk 0 (No Risk) -> compliant
        res_0 = evaluate_suitability(stkcd=600519, predicted_risk=0, prob_severe=0.01, user_profile="R1")
        self.assertTrue(res_0["is_compliant"])
        self.assertIn("Compliant with R1", res_0["reason"])

        # Risk 1 (Low Risk) -> blocked
        res_1 = evaluate_suitability(stkcd=600519, predicted_risk=1, prob_severe=0.05, user_profile="R1")
        self.assertFalse(res_1["is_compliant"])

        # Risk 4 (Severe Risk) -> blocked
        res_4 = evaluate_suitability(stkcd=600519, predicted_risk=4, prob_severe=0.85, user_profile="R1")
        self.assertFalse(res_4["is_compliant"])

    def test_r2_steady_allow_up_to_medium_risk(self):
        """R2 (Steady) allows No Risk (0), Low (1), and Medium (2), but blocks High (3) and Severe (4)."""
        res_0 = evaluate_suitability(stkcd=300750, predicted_risk=0, prob_severe=0.02, user_profile="R2")
        res_2 = evaluate_suitability(stkcd=300750, predicted_risk=2, prob_severe=0.08, user_profile="R2")
        self.assertTrue(res_0["is_compliant"])
        self.assertTrue(res_2["is_compliant"])

        res_3 = evaluate_suitability(stkcd=300750, predicted_risk=3, prob_severe=0.25, user_profile="R2")
        res_4 = evaluate_suitability(stkcd=300750, predicted_risk=4, prob_severe=0.60, user_profile="R2")
        self.assertFalse(res_3["is_compliant"])
        self.assertFalse(res_4["is_compliant"])

    def test_r3_balanced_warning_on_severe_tail_risk(self):
        """R3 allows all assets, but flags explicit warnings on high/severe tail risk."""
        res_severe = evaluate_suitability(stkcd=1, predicted_risk=4, prob_severe=0.45, user_profile="R3")
        self.assertTrue(res_severe["is_compliant"])
        self.assertIn("Warning", res_severe["reason"])

        # Severe Risk (4) even with tail risk under 40% (e.g. 34.6% as in stock 002150) must trigger warning
        res_severe_sub_40 = evaluate_suitability(stkcd=2150, predicted_risk=4, prob_severe=0.346, user_profile="R3")
        self.assertTrue(res_severe_sub_40["is_compliant"])
        self.assertIn("Warning R3 (Balanced): Highly risky asset (Severe Risk)", res_severe_sub_40["reason"])

        # High Risk (3) must also trigger warning
        res_high = evaluate_suitability(stkcd=1, predicted_risk=3, prob_severe=0.15, user_profile="R3")
        self.assertTrue(res_high["is_compliant"])
        self.assertIn("Warning R3 (Balanced): High risk asset", res_high["reason"])

        res_normal = evaluate_suitability(stkcd=1, predicted_risk=1, prob_severe=0.05, user_profile="R3")
        self.assertTrue(res_normal["is_compliant"])
        self.assertIn("Compliant with R3", res_normal["reason"])

    def test_r4_r5_unrestricted(self):
        """R4 and R5 investors have full access to the cross-sectional universe."""
        for prof in ["R4", "R5", "r4", "r5"]:
            res = evaluate_suitability(stkcd=688981, predicted_risk=4, prob_severe=0.90, user_profile=prof)
            self.assertTrue(res["is_compliant"])

    def test_cryptographic_audit_hash_integrity(self):
        """Each suitability evaluation must return a valid, deterministic SHA-256 audit digest."""
        res = evaluate_suitability(stkcd=600036, predicted_risk=1, prob_severe=0.03, user_profile="R2")
        audit_hash = res.get("audit_hash")
        
        self.assertIsNotNone(audit_hash)
        self.assertEqual(len(audit_hash), 64)
        # Hexadecimal string check
        int(audit_hash, 16)

        # Modifying any parameter must alter the cryptographic digest (tamper-evidence)
        res_tampered = evaluate_suitability(stkcd=600036, predicted_risk=2, prob_severe=0.03, user_profile="R2")
        self.assertNotEqual(audit_hash, res_tampered["audit_hash"])


if __name__ == "__main__":
    unittest.main()
