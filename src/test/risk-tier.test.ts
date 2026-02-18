import { describe, expect, it } from "vitest";
import { evaluateRiskTier } from "@/lib/aegis/risk-tier";
import { defaultSystemProfile } from "@/lib/aegis/schema";

describe("evaluateRiskTier", () => {
  it("returns High when customer-facing and impact is High", () => {
    const result = evaluateRiskTier({
      ...defaultSystemProfile,
      customer_facing: true,
      impact_level: "High",
    });
    expect(result.level).toBe("High");
  });

  it("returns High when personal data + fully automated + non-low impact", () => {
    const result = evaluateRiskTier({
      ...defaultSystemProfile,
      uses_personal_data: true,
      decision_automation: "FullyAutomated",
      impact_level: "Medium",
    });
    expect(result.level).toBe("High");
  });

  it("returns Medium when customer-facing only", () => {
    const result = evaluateRiskTier({
      ...defaultSystemProfile,
      customer_facing: true,
      uses_personal_data: false,
      impact_level: "Low",
      decision_automation: "HumanReview",
    });
    expect(result.level).toBe("Medium");
  });

  it("returns Medium when uses personal data only", () => {
    const result = evaluateRiskTier({
      ...defaultSystemProfile,
      customer_facing: false,
      uses_personal_data: true,
      impact_level: "Low",
      decision_automation: "HumanReview",
    });
    expect(result.level).toBe("Medium");
  });

  it("returns Medium when impact level is Medium and no other signal", () => {
    const result = evaluateRiskTier({
      ...defaultSystemProfile,
      customer_facing: false,
      uses_personal_data: false,
      impact_level: "Medium",
      decision_automation: "HumanReview",
    });
    expect(result.level).toBe("Medium");
  });

  it("returns Low when no high/medium rule applies", () => {
    const result = evaluateRiskTier({
      ...defaultSystemProfile,
      customer_facing: false,
      uses_personal_data: false,
      impact_level: "Low",
      decision_automation: "HumanReview",
    });
    expect(result.level).toBe("Low");
  });
});

