import type { AI_System_Profile, RiskTierResult, ValidationGapsResult } from "@/types/aegis";

const FAIRNESS_DOMAINS = new Set(["lending", "hiring", "pricing", "fraud", "marketing"]);

export function evaluateValidationGaps(
  profile: AI_System_Profile,
  risk: RiskTierResult
): ValidationGapsResult {
  const robustnessRequired = profile.model_type !== "ML" || profile.impact_level === "High";
  const fairnessRequired = FAIRNESS_DOMAINS.has(profile.domain) || profile.impact_level === "High";
  const safetyRequired =
    profile.model_type !== "ML" || profile.deployment === "external" || profile.deployment === "both";
  const explainabilityRequired = risk.level === "High" || profile.impact_level === "High";

  return {
    robustness: {
      required: robustnessRequired,
      gaps:
        robustnessRequired && !profile.has_robustness_testing
          ? ["Robustness testing is required but not yet in place."]
          : [],
    },
    fairness: {
      required: fairnessRequired,
      gaps:
        fairnessRequired && !profile.has_fairness_testing
          ? ["Fairness evaluation is required but not yet documented."]
          : [],
    },
    safety: {
      required: safetyRequired,
      gaps:
        safetyRequired && !profile.has_safety_testing
          ? ["Safety testing is required but not yet documented."]
          : [],
    },
    explainability: {
      required: explainabilityRequired,
      gaps:
        explainabilityRequired && !profile.has_model_card
          ? ["Model card or equivalent explainability artifact is required."]
          : [],
    },
  };
}

