import type {
  AI_System_Profile,
  ControlPriority,
  GeneratedControl,
  RiskLevel,
  RiskTierResult,
} from "@/types/aegis";
import { generateControls } from "@/lib/aegis/control-generator";
import { evaluateRiskTier } from "@/lib/aegis/risk-tier";
import { evaluateValidationGaps } from "@/lib/aegis/validation-gaps";
import {
  getAllControlEvidence,
  getControlStatuses,
  type ControlStatus,
} from "@/lib/aegis/storage";

/**
 * Numeric inherent score per risk level (0-100). Used as the starting point
 * before applying control-driven mitigation.
 */
const INHERENT_SCORE: Record<RiskLevel, number> = {
  Low: 20,
  Medium: 55,
  High: 85,
};

/**
 * Reduction multiplier per status (Standard policy chosen by user):
 *   - completed + evidence on file → 100% of the control's weight is mitigated
 *   - completed without evidence   → 50% of the control's weight is mitigated
 *   - in_progress                  → 25%
 *   - not_started                  → 0%
 */
function statusReductionFactor(status: ControlStatus, hasEvidence: boolean): number {
  if (status === "completed") return hasEvidence ? 1 : 0.5;
  if (status === "in_progress") return 0.25;
  return 0;
}

/** High-priority controls weigh twice as much in the residual calculation. */
function priorityWeight(priority: ControlPriority): number {
  if (priority === "High") return 2;
  if (priority === "Recommended") return 1;
  return 0.5;
}

function classifyResidual(score: number): RiskLevel {
  if (score >= 70) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

export interface ResidualControlBreakdown {
  control: GeneratedControl;
  status: ControlStatus;
  hasEvidence: boolean;
  evidenceCount: number;
  weight: number;
  reductionFactor: number;
  reductionPoints: number;
  reductionPercent: number;
}

export interface ResidualRiskResult {
  inherent: RiskTierResult;
  inherentScore: number;
  residualLevel: RiskLevel;
  residualScore: number;
  reductionPercent: number;
  controlsCompletedCount: number;
  controlsApplicableCount: number;
  evidenceFilesCount: number;
  breakdown: ResidualControlBreakdown[];
  rationale: string[];
}

export function evaluateResidualRisk(
  systemId: string,
  profile: AI_System_Profile,
): ResidualRiskResult {
  const inherent = evaluateRiskTier(profile);
  const gaps = evaluateValidationGaps(profile, inherent);
  const generated = generateControls({ profile, risk: inherent, gaps });

  const statusMap = getControlStatuses(systemId);
  const evidenceMap = getAllControlEvidence(systemId);

  const inherentScore = INHERENT_SCORE[inherent.level];

  const breakdown: ResidualControlBreakdown[] = generated.selected.map((control) => {
    const status = statusMap[control.id] ?? "not_started";
    const evidenceCount = evidenceMap[control.id]?.length ?? 0;
    const hasEvidence = evidenceCount > 0;
    const weight = priorityWeight(control.priority);
    const reductionFactor = statusReductionFactor(status, hasEvidence);
    return {
      control,
      status,
      hasEvidence,
      evidenceCount,
      weight,
      reductionFactor,
      reductionPoints: weight * reductionFactor,
      reductionPercent: reductionFactor * 100,
    };
  });

  const totalWeight = breakdown.reduce((sum, item) => sum + item.weight, 0) || 1;
  const totalReductionPoints = breakdown.reduce((sum, item) => sum + item.reductionPoints, 0);
  const mitigationCoverage = totalReductionPoints / totalWeight; // 0..1

  // Residual cannot drop below a floor of inherent / 4 — there is always residual exposure.
  const rawResidual = inherentScore * (1 - mitigationCoverage);
  const floor = inherentScore / 4;
  const residualScore = Math.max(floor, Math.round(rawResidual));
  const residualLevel = classifyResidual(residualScore);

  const reductionPercent =
    inherentScore === 0 ? 0 : Math.round(((inherentScore - residualScore) / inherentScore) * 100);

  const controlsCompletedCount = breakdown.filter((b) => b.status === "completed").length;
  const evidenceFilesCount = breakdown.reduce((sum, b) => sum + b.evidenceCount, 0);

  const rationale: string[] = [];
  rationale.push(
    `Inherent risk classified as ${inherent.level} (score ${inherentScore}/100).`,
  );
  rationale.push(
    `${controlsCompletedCount} of ${breakdown.length} applicable controls marked completed; ${evidenceFilesCount} evidence file(s) on record.`,
  );
  rationale.push(
    `Aggregate mitigation coverage: ${(mitigationCoverage * 100).toFixed(0)}% of weighted control surface.`,
  );
  if (inherent.level !== residualLevel) {
    rationale.push(`Residual risk downgraded from ${inherent.level} to ${residualLevel}.`);
  } else {
    rationale.push(
      `Residual risk remains at ${residualLevel}. Increase control completion or evidence to drive further reduction.`,
    );
  }

  return {
    inherent,
    inherentScore,
    residualLevel,
    residualScore,
    reductionPercent,
    controlsCompletedCount,
    controlsApplicableCount: breakdown.length,
    evidenceFilesCount,
    breakdown,
    rationale,
  };
}