#!/usr/bin/env python3
"""
synthetic_fallback.py : Automated Synthetic Benchmark Data Generator
=====================================================================
Generates mathematically calibrated academic synthetic datasets for zero-data public evaluation,
ensuring 100% functional end-to-end testing without exposing commercial proprietary data (CSMAR / WRDS).
"""

import os
import sys

# Ensure repository root is in python path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from scripts.generate_synthetic_demo_data import generate_mock_datasets

if __name__ == "__main__":
    print("============================================================")
    print("🤖 ADASTRA : GENERATING SYNTHETIC ACADEMIC EVALUATION DATA")
    print("============================================================")
    generate_mock_datasets()
    print("✅ Synthetic benchmark data generated successfully in dashboard_data/")
