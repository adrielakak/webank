#!/usr/bin/env python3
"""
Test Runner for Adastra
Executes all test cases in the tests/ directory with summary reporting.
"""

import os
import sys
import unittest
import time

# Ensure repository root is on sys.path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)


def run_all_tests():
    print("=" * 70)
    print("🧪  Adastra : Automated Test Suite Runner")
    print("    Shenzhen International FinTech Competition (FinTechathon 2026)")
    print("=" * 70)
    
    loader = unittest.TestLoader()
    start_dir = "tests"
    suite = loader.discover(start_dir, pattern="test_*.py")

    start_time = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    elapsed = time.time() - start_time

    print("\n" + "=" * 70)
    print(f"📊  Test Summary:")
    print(f"    - Tests Run:     {result.testsRun}")
    print(f"    - Failures:      {len(result.failures)}")
    print(f"    - Errors:        {len(result.errors)}")
    print(f"    - Time Elapsed:  {elapsed:.3f}s")
    
    if result.wasSuccessful():
        print("    - Status:        ✅ ALL TESTS PASSED")
        print("=" * 70)
        return 0
    else:
        print("    - Status:        ❌ TESTS FAILED")
        print("=" * 70)
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
