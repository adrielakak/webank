def generate_nl_explanation(
    shap_features: list,
    risk_label: str,
    prob_severe: float = 0.0,
    sector: str = "Equities",
    tk_peer_reward: float | None = None,
    volatility: float = 0.0,
    actual_return: float = 0.0,
    stkcd: int | None = None,
) -> str:
    """
    Generates a natural language explanation for the AI's risk prediction based on SHAP values
    and firm-specific financial characteristics (sector, volatility, peer contagion, return).
    Handles all 5 CSRC risk categories:
      - 'No Risk' (0)
      - 'Low Risk' (1)
      - 'Medium Risk' (2)
      - 'High Risk' (3)
      - 'Severe Risk' (4)
    """
    if not shap_features:
        return f"This asset is classified as {risk_label}, but no detailed feature importance is available."

    # Feature name mapping for accessible human terms
    pretty_names = {
        "peer_momentum": "its momentum relative to sector peers",
        "market_equity": "its overall market capitalization",
        "ivol_ff3_21d": "short-term idiosyncratic volatility",
        "ivol_capm_252d": "long-term market volatility",
        "rvol_21d": "recent realized volatility",
        "rmax5_21d": "extreme short-term return swings",
        "be_me": "its book-to-market valuation",
        "ret_12_1": "its 12-month historical momentum",
        "ret_3_1": "medium-term 3-month momentum trend",
        "ret_1_0": "its 1-month short-term momentum",
        "turnover_126d": "its trading volume turnover",
        "sue": "recent earnings surprises",
        "age": "how long it has been publicly traded",
        "seas_1_1an": "its seasonal performance patterns",
        "tk_peer_reward": "Tversky-Kahneman peer expected reward",
        "tk_peer_reward_x": "Tversky-Kahneman peer expected reward",
        "tk_peer_reward_lag1": "historical peer momentum structure",
        "price_peer_reward": "price-peer group expected reward",
        "price_peer_reward_lag1": "price-similar peer momentum",
        "vol_x_neg_momentum": "amplified volatility during downward momentum",
        "financial_stress": "composite financial stress indicator",
        "drawdown_proxy": "proximity to 52-week peak drawdown",
        "distance_to_sma": "deviation from its 6-month moving average",
        "ocf_me": "its operating cash flow to market equity ratio",
        "at_me": "its asset to market equity ratio",
        "z_score": "Altman Z-score financial distress proxy",
        "kz_index": "Kaplan-Zingales financial constraint index",
        "size_vol_ratio": "capitalization-to-volatility resilience ratio",
        "eq_dur": "equity cash-flow duration",
        "prc": "nominal share price level",
        "zero_trades_21d": "liquidity illiquidity friction",
        "mispricing_perf": "abnormal cross-sectional pricing residual",
    }

    def format_feature(feat_name: str) -> str:
        if "shock" in feat_name:
            parts = feat_name.split("_")
            comp_num = parts[2] if len(parts) > 2 else "NLP"
            return f"unexpected financial news shock (Topic {comp_num})"
        if "pca" in feat_name:
            return "macroeconomic news topic embedding"
        return pretty_names.get(feat_name, feat_name.replace("_", " "))

    normalized_label = risk_label.strip()

    # Sort features by absolute impact (descending)
    sorted_features = sorted(shap_features, key=lambda x: abs(x["value"]), reverse=True)
    non_age_features = [f for f in sorted_features if f["feature"] != "age"]
    top_drivers = non_age_features[:3] if len(non_age_features) >= 2 else sorted_features[:3]

    # Explicit signed separation if available (e.g. In unit tests)
    explicit_positive = [f for f in sorted_features if f["value"] > 0]
    explicit_negative = [f for f in sorted_features if f["value"] < 0]

    # For display, distinguish risk-increasing vs risk-mitigating
    if explicit_positive and explicit_negative:
        risk_increasing = explicit_positive[:2]
        risk_mitigating = [f for f in explicit_negative if f["feature"] not in {x["feature"] for x in risk_increasing}][:2]
    else:
        # Contextual classification based on risk tier and feature type
        defensive_features = {"market_equity", "ocf_me", "tk_peer_reward", "size_vol_ratio", "price_peer_reward_lag1", "z_score", "be_me", "sue"}
        stress_features = {"ivol_capm_252d", "rvol_21d", "vol_x_neg_momentum", "drawdown_proxy", "financial_stress", "zero_trades_21d", "rmax5_21d"}
        
        # Deprioritize raw age if richer financial signals exist
        non_age_features = [f for f in sorted_features if f["feature"] != "age"]
        candidate_pool = non_age_features if len(non_age_features) >= 3 else sorted_features

        risk_increasing = [f for f in candidate_pool if f["feature"] in stress_features or "vol" in f["feature"] or "shock" in f["feature"]]
        increasing_names = {x["feature"] for x in risk_increasing}
        risk_mitigating = [f for f in candidate_pool if f["feature"] in defensive_features or f["feature"] not in increasing_names]
        
        if not risk_increasing and ("High" in normalized_label or "Severe" in normalized_label):
            risk_increasing = candidate_pool[:2]
            increasing_names = {x["feature"] for x in risk_increasing}
            risk_mitigating = [f for f in candidate_pool if f["feature"] not in increasing_names][:2]
        
        if not risk_mitigating:
            risk_mitigating = [f for f in candidate_pool if f["feature"] not in increasing_names][:2]

    # Build firm header
    firm_ctx = ""
    if stkcd is not None:
        sector_str = sector if sector and sector != "Unknown" else "A-Share"
        firm_ctx = f"For {sector_str} enterprise Stock {stkcd}: "
    elif sector and sector != "Equities" and sector != "Unknown":
        firm_ctx = f"Within the {sector} sector: "

    explanation = firm_ctx + f"The AI has classified this asset as {normalized_label.upper()}. "

    # Detailed regime-specific synthesis
    if "No Risk" in normalized_label or normalized_label == "0":
        if risk_mitigating:
            drivers_str = ", ".join([format_feature(f["feature"]) for f in risk_mitigating])
            explanation += f"This prime safety rating is heavily supported by strong fundamentals such as {drivers_str}, significantly neutralizing downside exposure. "
        if risk_increasing:
            drivers_str = ", ".join([format_feature(f["feature"]) for f in risk_increasing])
            explanation += f"Minor resistance was observed in {drivers_str}, but insufficient to compromise the asset's defensive quality. "
        else:
            explanation += "Downside volatility remains well below market crash thresholds. "

    elif "Low Risk" in normalized_label or normalized_label == "1":
        drivers_str = ", ".join([format_feature(f["feature"]) for f in top_drivers])
        explanation += f"The asset displays favorable risk-adjusted stability, primarily governed by {drivers_str}. Downside probability remains low relative to cross-sectional peer distributions. "

    elif "High Risk" in normalized_label or normalized_label == "3":
        if risk_increasing:
            drivers_str = ", ".join([format_feature(f["feature"]) for f in risk_increasing])
            explanation += f"Caution is advised: elevated vulnerability signals are detected, primarily driven by {drivers_str}. "
        if risk_mitigating:
            drivers_str = ", ".join([format_feature(f["feature"]) for f in risk_mitigating])
            explanation += f"While {drivers_str} provides partial stabilization, tail-risk metrics exceed the safe threshold. "

    elif "Severe" in normalized_label or normalized_label == "4":
        if risk_increasing:
            drivers_str = ", ".join([format_feature(f["feature"]) for f in risk_increasing])
            explanation += f"High-severity risk alert: the asset displays acute warning signals in {drivers_str}, which historically correlate with abrupt price declines or crash regimes. "
        if risk_mitigating:
            drivers_str = ", ".join([format_feature(f["feature"]) for f in risk_mitigating])
            explanation += f"Despite marginal mitigation from {drivers_str}, the model identifies critical downside tail-risk. "

    else:  # Medium Risk (2) or default
        drivers_str = ", ".join([format_feature(f["feature"]) for f in top_drivers])
        explanation += f"The model views this as a balanced asset. Key cross-sectional drivers include {drivers_str}, balancing potential upside with moderate market fluctuations. "

    # Firm-specific behavioral & volatility telemetry
    details = []
    if volatility > 0:
        if volatility < 0.012:
            details.append(f"Idiosyncratic volatility ({volatility*100:.2f}%) sits comfortably in the safest market quartile")
        elif volatility > 0.025:
            details.append(f"Elevated idiosyncratic volatility ({volatility*100:.2f}%) signals heightened turbulence")
        else:
            details.append(f"Realized volatility ({volatility*100:.2f}%) aligns with cross-sectional median")

    if tk_peer_reward is not None:
        if tk_peer_reward > 0.05:
            details.append(f"Tversky-Kahneman prospect theory reflects strong positive sentiment momentum (+{tk_peer_reward*100:.1f}%) spillover from its 100 nearest market peers")
        elif tk_peer_reward < -0.05:
            details.append(f"Behavioral contagion alert: negative peer momentum ({tk_peer_reward*100:.1f}%) suggests retail loss aversion spillover")

    if details:
        explanation += " " + ". ".join(details) + "."

    # Kahneman-Tversky Tail-Risk Guardrail note for capital preservation
    if prob_severe >= 0.15:
        explanation += f" ⚠️ Tail-Risk Guardrail Active: Bayesian posterior detects a {round(prob_severe * 100, 1)}% crash tail probability. The CSRC Suitability Guardrail restricts conservative allocations to preserve client capital."

    return explanation.strip()

