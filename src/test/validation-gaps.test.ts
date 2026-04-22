import { describe, expect, it } from "vitest";
import { defaultSystemProfile } from "@/lib/aegis/schema";
import { evaluateRiskTier } from "@/lib/aegis/risk-tier";
import { evaluateValidationGaps } from "@/lib/aegis/validation-gaps";
import type { AI_System_Profile } from "@/types/aegis";

describe("evaluateValidationGaps", () => {
  it("requires robustness for LLM systems", () => {
    const profile: AI_System_Profile = { ...defaultSystemProfile, model_type: "LLM", has_robustness_testing: false };
    const gaps = evaluateValidationGaps(profile, evaluateRiskTier(profile));
    expect(gaps.robustness.required).toBe(true);
    expect(gaps.robustness.gaps.length).toBeGreaterThan(0);
  });

  it("requires fairness for marketing domain", () => {
    const profile: AI_System_Profile = { ...defaultSystemProfile, domain: "marketing", has_fairness_testing: false };
    const gaps = evaluateValidationGaps(profile, evaluateRiskTier(profile));
    expect(gaps.fairness.required).toBe(true);
    expect(gaps.fairness.gaps[0]).toContain("Fairness evaluation");
  });

  it("requires safety for external deployment", () => {
    const profile: AI_System_Profile = { ...defaultSystemProfile, model_type: "ML", deployment: "external", has_safety_testing: false };
    const gaps = evaluateValidationGaps(profile, evaluateRiskTier(profile));
    expect(gaps.safety.required).toBe(true);
    expect(gaps.safety.gaps[0]).toContain("Safety testing");
  });

  it("requires explainability for High risk", () => {
    const profile: AI_System_Profile = {
      ...defaultSystemProfile,
      customer_facing: true,
      impact_level: "High",
      has_model_card: false,
    };
    const risk = evaluateRiskTier(profile);
    const gaps = evaluateValidationGaps(profile, risk);
    expect(risk.level).toBe("High");
    expect(gaps.explainability.required).toBe(true);
    expect(gaps.explainability.gaps.length).toBe(1);
  });

  it("does not add gap when required control already exists", () => {
    const profile: AI_System_Profile = {
      ...defaultSystemProfile,
      model_type: "LLM",
      has_robustness_testing: true,
    };
    const gaps = evaluateValidationGaps(profile, evaluateRiskTier(profile));
    expect(gaps.robustness.required).toBe(true);
    expect(gaps.robustness.gaps).toHaveLength(0);
  });
});

