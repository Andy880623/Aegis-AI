import * as XLSX from "xlsx";
import type {
  AI_System_Profile,
  GeneratedControl,
  RiskTierResult,
  ValidationGapsResult,
} from "@/types/aegis";
import { buildGovernanceWbsRows } from "./reports";
import { clausesForCategory, formatCitation, allStandards } from "./standards";
import { listEvidenceForSystem, VERDICT_LABEL, complianceSummary } from "./evidence";

interface ReportInput {
  profile: AI_System_Profile;
  risk: RiskTierResult;
  gaps: ValidationGapsResult;
  controls: GeneratedControl[];
  systemId: string | null;
  reportId?: string;
}

function autoWidth(rows: (string | number | boolean)[][]): { wch: number }[] {
  if (!rows.length) return [];
  const cols = rows[0].length;
  const widths: number[] = new Array(cols).fill(10);
  for (const row of rows) {
    for (let i = 0; i < cols; i++) {
      const v = row[i] == null ? "" : String(row[i]);
      const longest = Math.max(...v.split("\n").map((line) => line.length));
      widths[i] = Math.min(60, Math.max(widths[i], longest + 2));
    }
  }
  return widths.map((w) => ({ wch: w }));
}

function aoaSheet(rows: (string | number | boolean)[][]) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = autoWidth(rows);
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  return ws;
}

export function generateAuditXlsx(input: ReportInput): Blob {
  const reportId = input.reportId ?? `AEGIS-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toISOString().slice(0, 10);
  const summary = complianceSummary(input.systemId);
  const wb = XLSX.utils.book_new();

  // Cover
  const cover: (string | number)[][] = [
    ["AEGIS AI GOVERNANCE - AUDIT-GRADE WORKBOOK"],
    [],
    ["System", input.profile.system_name || "Untitled System"],
    ["Risk Tier", input.risk.level],
    ["Report ID", reportId],
    ["Issued", today],
    ["Controls Recommended", input.controls.length],
    ["High-priority Controls", input.controls.filter((c) => c.priority === "High").length],
    ["Evidence: PASS", summary.pass],
    ["Evidence: PARTIAL", summary.partial],
    ["Evidence: FAIL", summary.fail],
    ["Evidence: PENDING (no submission)", Math.max(0, input.controls.length - summary.total)],
    [],
    ["Standards Coverage"],
    ...allStandards().map((s) => [s.short, s.name]),
    [],
    ["Tabs in this workbook:", "Cover, Profile, Risk, Gaps, Controls, WBS, Evidence, Standards"],
    ["Confidentiality", "Prepared for external audit, financial supervision, and internal model risk review."],
  ];
  XLSX.utils.book_append_sheet(wb, aoaSheet(cover), "Cover");

  // Profile
  const profile: (string | number | boolean)[][] = [
    ["Attribute", "Value"],
    ["System Name", input.profile.system_name || "-"],
    ["Use Case", input.profile.use_case_summary || "-"],
    ["Model Type", input.profile.model_type],
    ["Domain", input.profile.domain],
    ["Deployment", input.profile.deployment],
    ["Customer Facing", input.profile.customer_facing ? "Yes" : "No"],
    ["Impact Level", input.profile.impact_level],
    ["Uses Personal Data", input.profile.uses_personal_data ? "Yes" : "No"],
    ["Decision Automation", input.profile.decision_automation],
    ["Cross-border Transfer", input.profile.cross_border_data_transfer ? "Yes" : "No"],
    ["Third-party Sharing", input.profile.third_party_data_sharing ? "Yes" : "No"],
    ["Model Provider", input.profile.model_provider || "-"],
    ["Model Version", input.profile.model_version || "-"],
    ["Change Management", input.profile.change_management_process ? "Yes" : "No"],
    ["Data Sources", input.profile.data_sources.join("; ") || "-"],
    ["Sensitive Data Types", input.profile.sensitive_data_types.join("; ") || "-"],
    ["Compliance Frameworks", input.profile.compliance_frameworks.join("; ") || "-"],
  ];
  XLSX.utils.book_append_sheet(wb, aoaSheet(profile), "Profile");

  // Risk
  const risk: (string | number)[][] = [
    ["Type", "#", "Item"],
    ...input.risk.triggers.map((t, i) => ["Trigger", i + 1, t]),
    ...input.risk.rationale.map((r, i) => ["Rationale", i + 1, r]),
  ];
  XLSX.utils.book_append_sheet(wb, aoaSheet(risk), "Risk");

  // Gaps
  const gaps: (string | number)[][] = [
    ["Dimension", "Required", "Gaps"],
    ["Robustness", input.gaps.robustness.required ? "Yes" : "No", input.gaps.robustness.gaps.join("; ") || "None"],
    ["Fairness", input.gaps.fairness.required ? "Yes" : "No", input.gaps.fairness.gaps.join("; ") || "None"],
    ["Safety", input.gaps.safety.required ? "Yes" : "No", input.gaps.safety.gaps.join("; ") || "None"],
    ["Explainability", input.gaps.explainability.required ? "Yes" : "No", input.gaps.explainability.gaps.join("; ") || "None"],
  ];
  XLSX.utils.book_append_sheet(wb, aoaSheet(gaps), "Gaps");

  // Controls
  const controls: (string | number)[][] = [
    ["Control ID", "Title", "Category", "Priority", "Description", "Objective", "Aligned Standards"],
    ...input.controls.map((c) => [
      c.id,
      c.title,
      c.category,
      c.priority,
      c.description,
      c.how_to_template.objective,
      clausesForCategory(c.category).map(formatCitation).join(" | "),
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, aoaSheet(controls), "Controls");

  // WBS
  const wbs = buildGovernanceWbsRows(input.controls);
  const wbsRows: (string | number)[][] = [
    ["WBS ID", "Phase", "Control ID", "Work Package", "Description", "Priority", "Objective", "Deliverable", "Suggested Owner", "Due Window", "Status", "% Complete", "Evidence Submitted", "Notes"],
    ...wbs.map((r) => [
      r.wbsId, r.phase, r.controlId, r.workPackage, r.description, r.priority,
      r.objective, r.deliverable, r.suggestedOwner, r.dueWindow, r.status, 0, "", "",
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, aoaSheet(wbsRows), "WBS");

  // Evidence
  const evidence = listEvidenceForSystem(input.systemId);
  const evRows: (string | number)[][] = [
    ["Control ID", "Verdict", "Confidence %", "Kind", "Filename", "AI Auditor Rationale", "Matched Requirements", "Missing Requirements", "Citations", "Submitted At"],
    ...(evidence.length === 0
      ? [["—", "PENDING", 0, "—", "", "No evidence submitted yet", "", "", "", ""]]
      : evidence.map((e) => [
          e.control_id,
          VERDICT_LABEL[e.verdict],
          Math.round(e.confidence * 100),
          e.kind,
          e.filename || "",
          e.rationale,
          e.matched_requirements.join("; "),
          e.missing_requirements.join("; "),
          e.citations.join(" | "),
          new Date(e.created_at).toISOString(),
        ])),
  ];
  XLSX.utils.book_append_sheet(wb, aoaSheet(evRows), "Evidence");

  // Standards
  const std: (string | number)[][] = [
    ["Standard", "Full Name", "Region", "Authority", "Reference URL"],
    ...allStandards().map((s) => [s.short, s.name, s.region, s.authority, s.url]),
  ];
  XLSX.utils.book_append_sheet(wb, aoaSheet(std), "Standards");

  const arr = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
