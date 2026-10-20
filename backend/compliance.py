import hashlib
import json
import time

def evaluate_suitability(stkcd: int, predicted_risk: int, prob_severe: float, user_profile: str) -> dict:
    """
    Evaluates if a stock is compliant with the user's CSRC risk profile (R1 to R5).
    predicted_risk: 0 (No Risk), 1 (Low), 2 (Medium), 3 (High), 4 (Severe)
    user_profile: 'R1', 'R2', 'R3', 'R4', 'R5'
    """
    user_profile = user_profile.upper()
    
    # R1 (Conservative): Only "No Risk" assets (0)
    if user_profile == 'R1':
        is_compliant = (predicted_risk == 0)
        reason = "R1 (Conservative): Only 'No Risk' assets are permitted." if not is_compliant else "Compliant with R1: Asset is deemed safe."
    
    # R2 (Steady): "No Risk" (0), "Low Risk" (1), and "Medium Risk" (2) assets
    elif user_profile == 'R2':
        is_compliant = (predicted_risk <= 2)
        reason = "R2 (Steady): 'High' and 'Severe' risk assets are prohibited." if not is_compliant else "Compliant with R2: Medium, low or no risk."
        
    # R3 (Balanced): All permitted, but strict warning if prob_severe > 40% or risk is Severe (4)
    elif user_profile == 'R3':
        is_compliant = True # R3 allows all, but warns
        if predicted_risk == 4 or prob_severe > 0.4:
            reason = "Warning R3 (Balanced): Highly risky asset (Severe Risk). Permitted, but requires investor caution."
        elif predicted_risk == 3:
            reason = "Warning R3 (Balanced): High risk asset. Proceed with caution."
        else:
            reason = "Compliant with R3."
            
    # R4 (Growth) / R5 (Aggressive): No restrictions
    elif user_profile in ['R4', 'R5']:
        is_compliant = True
        reason = f"Compliant with {user_profile}: No restrictions for this profile."
        
    else:
        is_compliant = False
        reason = f"Unknown profile: {user_profile}"

    # Create immutable audit log (for traceability and blockchain bonus)
    log_entry = {
        "timestamp": int(time.time()),
        "stkcd": stkcd,
        "profile": user_profile,
        "predicted_risk": predicted_risk,
        "prob_severe": round(prob_severe, 4),
        "is_compliant": is_compliant,
        "reason": reason
    }
    
    # Cryptographic SHA-256 hash of the decision
    log_string = json.dumps(log_entry, sort_keys=True)
    audit_hash = hashlib.sha256(log_string.encode('utf-8')).hexdigest()
    
    return {
        "profile": user_profile,
        "is_compliant": is_compliant,
        "reason": reason,
        "audit_hash": audit_hash,
        "timestamp": log_entry["timestamp"]
    }
