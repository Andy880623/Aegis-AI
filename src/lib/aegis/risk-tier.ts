import type { AI_System_Profile, RiskTierResult } from "@/types/aegis";

export function evaluateRiskTier(profile: AI_System_Profile): RiskTierResult {
  const triggers: string[] = [];
  const rationale: string[] = [];

  const highRuleCustomerHighImpact = profile.customer_facing && profile.impact_level === "High";
  const highRuleDataFullAuto =
    profile.uses_personal_data &&
    profile.decision_automation === "FullyAutomated" &&
    profile.impact_level !== "Low";
  const mediumRuleBaseline =
    profile.customer_facing || profile.uses_personal_data || profile.impact_level === "Medium";

  if (highRuleCustomerHighImpact) {
    triggers.push("customer_facing_and_high_impact");
    rationale.push("Customer-facing system with High impact is classified as High risk.");
  }

  if (highRuleDataFullAuto) {
    triggers.push("personal_data_fully_automated_non_low_impact");
    rationale.push(
      "Uses personal data with fully automated decisions and impact above Low, therefore High risk."
    );
  }

  if (highRuleCustomerHighImpact || highRuleDataFullAuto) {
    return { level: "High", triggers, rationale };
  }

  if (mediumRuleBaseline) {
    triggers.push("baseline_medium_rule");
    rationale.push(
      "At least one baseline risk signal is present (customer-facing, personal data, or Medium impact)."
    );
    return { level: "Medium", triggers, rationale };
  }

  triggers.push("low_default_rule");
  rationale.push("No High or Medium rule matched. Classified as Low risk by default.");
  return { level: "Low", triggers, rationale };
}

