import type {
  AI_System_Profile,
  GeneratedControl,
  RiskTierResult,
  ValidationGapsResult,
} from "@/types/aegis";
import type { ResidualRiskResult } from "@/lib/aegis/residual-risk";

function sectionList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- None";
}

export type WbsPhase = "Now (0-30 days)" | "Next (30-90 days)" | "Later (90+ days)";

export interface GovernanceWbsRow {
  wbsId: string;
  phase: WbsPhase;
  controlId: string;
  workPackage: string;
  description: string;
  priority: string;
  objective: string;
  deliverable: string;
  suggestedOwner: string;
  dueWindow: string;
  status: string;
}

export function collectValidationGapItems(gaps: ValidationGapsResult): string[] {
  return [
    ...gaps.robustness.gaps,
    ...gaps.fairness.gaps,
    ...gaps.safety.gaps,
    ...gaps.explainability.gaps,
  ];
}

function ownerByCategory(category: GeneratedControl["category"]) {
  if (category === "Governance/Accountability") return "AI Governance Lead";
  if (category === "Lifecycle") return "ML Platform Lead";
  if (category === "Robustness") return "ML Engineer";
  if (category === "Fairness") return "Responsible AI Lead";
  if (category === "Safety") return "Trust & Safety Lead";
  if (category === "Explainability") return "Model Risk Manager";
  if (category === "Monitoring") return "MLOps Lead";
  return "Business Process Owner";
}

export function buildGovernanceWbsRows(controls: GeneratedControl[]): GovernanceWbsRow[] {
  const phases: Array<{ id: string; name: WbsPhase; dueWindow: string; controls: GeneratedControl[] }> = [
    {
      id: "1",
      name: "Now (0-30 days)",
      dueWindow: "0-30 days",
      controls: controls.filter((item) => item.priority === "High"),
    },
    {
      id: "2",
      name: "Next (30-90 days)",
      dueWindow: "30-90 days",
      controls: controls.filter((item) => item.priority === "Recommended"),
    },
    {
      id: "3",
      name: "Later (90+ days)",
      dueWindow: "90+ days",
      controls: controls.filter((item) => item.priority === "Optional"),
    },
  ];

  return phases.flatMap((phase) =>
    phase.controls.map((control, index) => ({
      wbsId: `${phase.id}.${index + 1}`,
      phase: phase.name,
      controlId: control.id,
      workPackage: control.title,
      description: control.description,
      priority: control.priority,
      objective: control.how_to_template.objective,
      deliverable: control.how_to_template.evidence[0] || "Implementation evidence package",
      suggestedOwner: ownerByCategory(control.category),
      dueWindow: phase.dueWindow,
      status: "Not Started",
    }))
  );
}

export function generateRiskSummaryReport(
  profile: AI_System_Profile,
  risk: RiskTierResult,
  gaps: ValidationGapsResult,
  controls: GeneratedControl[],
  residual?: ResidualRiskResult,
) {
  const today = new Date().toISOString().slice(0, 10);
  const residualSection = residual
    ? `

## Residual Risk Assessment
- Inherent: **${residual.inherent.level}** (score ${residual.inherentScore}/100)
- Residual: **${residual.residualLevel}** (score ${residual.residualScore}/100)
- Risk Reduction: ${residual.reductionPercent}%
- Controls Completed: ${residual.controlsCompletedCount} / ${residual.controlsApplicableCount}
- Evidence Files on Record: ${residual.evidenceFilesCount}

### Mitigation Rationale
${sectionList(residual.rationale)}

### Top Mitigated Controls
${sectionList(
  [...residual.breakdown]
    .sort((a, b) => b.reductionPercent - a.reductionPercent)
    .slice(0, 8)
    .map((b) => `${b.control.id} ${b.control.title} — ${b.reductionPercent}% mitigation (${b.status})`),
)}
`
    : "";

  return `# Risk Summary Report

Date: ${today}
System: ${profile.system_name}

## Profile Snapshot
- Model Type: ${profile.model_type}
- Customer Facing: ${profile.customer_facing ? "Yes" : "No"}
- Impact Level: ${profile.impact_level}
- Uses Personal Data: ${profile.uses_personal_data ? "Yes" : "No"}
- Decision Automation: ${profile.decision_automation}
- Domain: ${profile.domain}
- Deployment: ${profile.deployment}

## Risk Tier
- Level: **${risk.level}**
- Triggers:
${sectionList(risk.triggers)}
- Rationale:
${sectionList(risk.rationale)}

## Validation Gaps
- Robustness Required: ${gaps.robustness.required ? "Yes" : "No"}
${sectionList(gaps.robustness.gaps)}
- Fairness Required: ${gaps.fairness.required ? "Yes" : "No"}
${sectionList(gaps.fairness.gaps)}
- Safety Required: ${gaps.safety.required ? "Yes" : "No"}
${sectionList(gaps.safety.gaps)}
- Explainability Required: ${gaps.explainability.required ? "Yes" : "No"}
${sectionList(gaps.explainability.gaps)}

## Priority Controls
${sectionList(controls.filter((c) => c.priority === "High").slice(0, 12).map((c) => `${c.id}: ${c.title}`))}${residualSection}
`;
}

export function generateModelCardReport(
  profile: AI_System_Profile,
  risk: RiskTierResult,
  gaps: ValidationGapsResult
) {
  return `# Model Card

## 1. System Overview
- Name: ${profile.system_name}
- Model Type: ${profile.model_type}
- Domain: ${profile.domain}
- Deployment: ${profile.deployment}
- Customer Facing: ${profile.customer_facing ? "Yes" : "No"}

## 2. Intended Use
- Primary use case for this system.
- Intended user segments.
- Known non-intended uses.

## 3. Data
- Uses Personal Data: ${profile.uses_personal_data ? "Yes" : "No"}
- Data Sources:
${sectionList(profile.data_sources)}

## 4. Evaluation and Validation
- Robustness testing in place: ${profile.has_robustness_testing ? "Yes" : "No"}
- Fairness testing in place: ${profile.has_fairness_testing ? "Yes" : "No"}
- Safety testing in place: ${profile.has_safety_testing ? "Yes" : "No"}
- Explainability artifact in place: ${profile.has_model_card ? "Yes" : "No"}

## 5. Risk and Limitations
- Risk Tier: ${risk.level}
- Key limitations and caveats should be documented here.
- Validation gaps:
${sectionList(collectValidationGapItems(gaps))}

## 6. Governance and Oversight
- Decision Automation: ${profile.decision_automation}
- Human review checkpoints and escalation path.
- Monitoring commitments and review cadence.

## 7. Change Log
- Date:
- Summary of model/prompt/policy updates:
`;
}

export function generateGovernanceActionPlanReport(
  profile: AI_System_Profile,
  controls: GeneratedControl[]
) {
  const rows = buildGovernanceWbsRows(controls);
  const nowControls = rows.filter((item) => item.phase === "Now (0-30 days)");
  const nextControls = rows.filter((item) => item.phase === "Next (30-90 days)");
  const laterControls = rows.filter((item) => item.phase === "Later (90+ days)");

  return `# Governance Action Plan

System: ${profile.system_name}

## Now (0-30 days)
${sectionList(nowControls.map((item) => `${item.controlId} ${item.workPackage}`))}

## Next (30-90 days)
${sectionList(nextControls.map((item) => `${item.controlId} ${item.workPackage}`))}

## Later (90+ days)
${sectionList(laterControls.map((item) => `${item.controlId} ${item.workPackage}`))}

## Evidence Checklist
${sectionList(
  rows
    .slice(0, 30)
    .map((item) => `[ ] ${item.controlId} - ${item.deliverable}`)
)}
`;
}
