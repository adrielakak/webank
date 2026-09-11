"""
Monte Carlo Stochastic Wealth Simulation Engine.
Simulates 1,000 forward-looking paths over a 5-year horizon using Geometric Brownian Motion.
Generates the interactive Risk Cone (P10, P50, P90) inspired by Wealthfront.
"""

from typing import List
import numpy as np
from engine.models import MonteCarloPercentilePath, PortfolioAllocation


def run_monte_carlo_simulation(
    allocation: PortfolioAllocation,
    initial_capital: float = 50000.0,
    horizon_years: int = 5,
    num_simulations: int = 1000,
    random_seed: int = 42
) -> MonteCarloPercentilePath:
    """
    Simulates portfolio trajectories using Geometric Brownian Motion.
    Returns monthly percentile paths for visualization.
    """
    np.random.seed(random_seed)
    
    mu = allocation.expected_annual_return
    sigma = max(allocation.expected_annual_volatility, 0.005)
    
    # Monthly time steps
    num_months = horizon_years * 12
    dt = 1.0 / 12.0
    
    # Pre-generate standard normal shocks: shape (num_simulations, num_months)
    shocks = np.random.normal(0, 1, size=(num_simulations, num_months))
    
    # Monthly drift and diffusion
    drift = (mu - 0.5 * (sigma ** 2)) * dt
    diffusion = sigma * np.sqrt(dt) * shocks
    monthly_growth_factors = np.exp(drift + diffusion)
    
    # Trajectory matrix: shape (num_simulations, num_months + 1)
    paths = np.zeros((num_simulations, num_months + 1))
    paths[:, 0] = initial_capital
    
    # Compound returns over time
    for t in range(1, num_months + 1):
        paths[:, t] = paths[:, t - 1] * monthly_growth_factors[:, t - 1]
        
    # Calculate percentiles at each month: P10, P50, P90
    p10_path = np.percentile(paths, 10, axis=0)
    p50_path = np.percentile(paths, 50, axis=0)
    p90_path = np.percentile(paths, 90, axis=0)
    
    # Terminal wealth values at month 60
    terminal_values = paths[:, -1]
    prob_loss = float(np.mean(terminal_values < initial_capital))
    
    # Calculate Maximum Drawdown along the median (P50) path
    running_max = np.maximum.accumulate(p50_path)
    drawdowns = (p50_path - running_max) / running_max
    max_dd = float(abs(np.min(drawdowns)))
    
    months_list = list(range(num_months + 1))
    
    return MonteCarloPercentilePath(
        months=months_list,
        p10_pessimistic=[round(float(v), 2) for v in p10_path],
        p50_median=[round(float(v), 2) for v in p50_path],
        p90_optimistic=[round(float(v), 2) for v in p90_path],
        initial_value=round(initial_capital, 2),
        terminal_p10=round(float(p10_path[-1]), 2),
        terminal_p50=round(float(p50_path[-1]), 2),
        terminal_p90=round(float(p90_path[-1]), 2),
        probability_of_loss=round(prob_loss, 4),
        max_drawdown_p50=round(max_dd, 4)
    )
