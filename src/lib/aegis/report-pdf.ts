import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  AI_System_Profile,
  GeneratedControl,
  RiskTierResult,
  ValidationGapsResult,
} from "@/types/aegis";
import { buildGovernanceWbsRows, collectValidationGapItems } from "./reports";
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

const PRIMARY: [number, number, number] = [9, 78, 138];
const ACCENT: [number, number, number] = [200, 215, 230];
const MUTED: [number, number, number] = [110, 120, 135];

function header(doc: jsPDF, title: string) {
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("AEGIS AI \u00B7 AUDIT-GRADE GOVERNANCE REPORT", 12, 9);
  doc.text(title, doc.internal.pageSize.getWidth() - 12, 9, { align: "right" });
  doc.setTextColor(20, 20, 20);
}

function footer(doc: jsPDF, reportId: string) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.line(12, h - 12, w - 12, h - 12);
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`Report ID: ${reportId}`, 12, h - 6);
    doc.text(`Page ${i} of ${pages}`, w - 12, h - 6, { align: "right" });
    doc.text(
      `Confidential \u00B7 Generated ${new Date().toISOString().slice(0, 10)}`,
      w / 2,
      h - 6,
      { align: "center" }
    );
  }
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(13);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.setFont("helvetica", "bold");
  doc.text(text, 12, y);
  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.line(12, y + 1.5, doc.internal.pageSize.getWidth() - 12, y + 1.5);
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "normal");
  return y + 8;
}

function paragraph(doc: jsPDF, text: string, y: number, size = 10): number {
  doc.setFontSize(size);
  const w = doc.internal.pageSize.getWidth() - 24;
  const lines = doc.splitTextToSize(text, w);
  doc.text(lines, 12, y);
  return y + lines.length * (size * 0.42) + 2;
}

function ensureSpace(doc: jsPDF, y: number, needed = 30): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 18) {
    doc.addPage();
    return 22;
  }
  return y;
}

function lastY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

export function generateAuditPdf(input: ReportInput): Blob {
  const reportId = input.reportId ?? `AEGIS-${Date.now().toString(36).toUpperCase()}`;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Cover
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("AEGIS AI GOVERNANCE", 24, 50);
  doc.setFontSize(28);
  doc.text("AI Risk &", 24, 80);
  doc.text("Compliance Report", 24, 95);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`System: ${input.profile.system_name || "Untitled System"}`, 24, 120);
  doc.text(`Risk Tier: ${input.risk.level}`, 24, 130);
  doc.text(`Report ID: ${reportId}`, 24, 140);
  doc.text(`Issued: ${new Date().toISOString().slice(0, 10)}`, 24, 150);
  doc.setFontSize(9);
  doc.text("Prepared for external audit, financial supervision, and internal model risk review.", 24, pageH - 40, { maxWidth: pageW - 48 });
  doc.text("Aligned with EU AI Act, NIST AI RMF, ISO/IEC 42001, UK AI Principles, SG AI Verify, TW FSC AI Guidelines.", 24, pageH - 32, { maxWidth: pageW - 48 });
  doc.setTextColor(20, 20, 20);

  // TOC
  doc.addPage();
  header(doc, "Table of Contents");
  let y = 24;
  y = sectionTitle(doc, "Table of Contents", y);
  const toc = [
    "1. Executive Summary",
    "2. System Profile",
    "3. Risk Tier Determination",
    "4. Validation Gap Analysis",
    "5. Control Recommendations",
    "6. Evidence & AI Verification Log",
    "7. Standards Alignment Matrix",
    "8. Action Plan (WBS)",
    "9. Sign-off & References",
  ];
  doc.setFontSize(11);
  toc.forEach((t) => {
    doc.text(t, 16, y);
    y += 7;
  });

  // 1. Executive Summary
  doc.addPage();
  header(doc, "Executive Summary");
  y = 24;
  y = sectionTitle(doc, "1. Executive Summary", y);
  const summary = complianceSummary(input.systemId);
  const highCount = input.controls.filter((c) => c.priority === "High").length;
  const gapItems = collectValidationGapItems(input.gaps);
  y = paragraph(
    doc,
    `This report presents the governance posture of "${input.profile.system_name || "the subject AI system"}" as assessed by the Aegis AI platform. The system is classified as ${input.risk.level} risk based on its model type, customer exposure, decision automation, and use of personal data. A total of ${input.controls.length} controls have been recommended (${highCount} high priority), and ${gapItems.length} validation gaps have been identified across robustness, fairness, safety, and explainability dimensions.`,
    y
  );
  y += 2;
  y = paragraph(
    doc,
    `AI-verified evidence has been collected for ${summary.total} control(s): ${summary.pass} verified (PASS), ${summary.partial} partial, and ${summary.fail} insufficient. Evidence is evaluated by an automated AI auditor against control objectives, required artifacts, and aligned regulatory clauses. Manual attestation alone is not accepted as compliance.`,
    y
  );

  // 2. System Profile
  y = ensureSpace(doc, y + 6, 60);
  y = sectionTitle(doc, "2. System Profile", y);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2 },
    head: [["Attribute", "Value"]],
    body: [
      ["System Name", input.profile.system_name || "-"],
      ["Use Case", input.profile.use_case_summary || "-"],
      ["Model Type", input.profile.model_type],
      ["Domain", input.profile.domain],
      ["Deployment", input.profile.deployment],
      ["Customer Facing", input.profile.customer_facing ? "Yes" : "No"],
      ["Impact Level", input.profile.impact_level],
      ["Personal Data", input.profile.uses_personal_data ? "Yes" : "No"],
      ["Decision Automation", input.profile.decision_automation],
      ["Cross-border Transfer", input.profile.cross_border_data_transfer ? "Yes" : "No"],
      ["Third-party Sharing", input.profile.third_party_data_sharing ? "Yes" : "No"],
      ["Model Provider", input.profile.model_provider || "-"],
      ["Model Version", input.profile.model_version || "-"],
    ],
  });
  y = lastY(doc) + 6;

  // 3. Risk Tier
  y = ensureSpace(doc, y, 50);
  y = sectionTitle(doc, "3. Risk Tier Determination", y);
  y = paragraph(doc, `Determined Risk Tier: ${input.risk.level}`, y);
  autoTable(doc, {
    startY: y,
    theme: "striped",
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    styles: { fontSize: 9 },
    head: [["#", "Trigger / Rationale"]],
    body: [
      ...input.risk.triggers.map((t, i) => [`T${i + 1}`, t]),
      ...input.risk.rationale.map((r, i) => [`R${i + 1}`, r]),
    ],
  });
  y = lastY(doc) + 6;

  // 4. Validation Gaps
  y = ensureSpace(doc, y, 60);
  y = sectionTitle(doc, "4. Validation Gap Analysis", y);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 2 },
    head: [["Dimension", "Required", "Identified Gaps"]],
    body: [
      ["Robustness", input.gaps.robustness.required ? "Yes" : "No", input.gaps.robustness.gaps.join("; ") || "None"],
      ["Fairness", input.gaps.fairness.required ? "Yes" : "No", input.gaps.fairness.gaps.join("; ") || "None"],
      ["Safety", input.gaps.safety.required ? "Yes" : "No", input.gaps.safety.gaps.join("; ") || "None"],
      ["Explainability", input.gaps.explainability.required ? "Yes" : "No", input.gaps.explainability.gaps.join("; ") || "None"],
    ],
  });
  y = lastY(doc) + 6;

  // 5. Controls
  doc.addPage();
  header(doc, "Control Recommendations");
  y = 24;
  y = sectionTitle(doc, "5. Control Recommendations", y);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2, valign: "top" },
    columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 45 }, 2: { cellWidth: 28 }, 3: { cellWidth: 22 } },
    head: [["ID", "Control", "Category", "Priority", "Aligned Standards"]],
    body: input.controls.map((c) => [
      c.id,
      c.title,
      c.category,
      c.priority,
      clausesForCategory(c.category).map(formatCitation).join("\n"),
    ]),
  });

  // 6. Evidence
  doc.addPage();
  header(doc, "Evidence & AI Verification Log");
  y = 24;
  y = sectionTitle(doc, "6. Evidence & AI Verification Log", y);
  const evidence = listEvidenceForSystem(input.systemId);
  if (evidence.length === 0) {
    y = paragraph(doc, "No AI-verified evidence has been submitted for this system. All controls remain in PENDING state.", y);
  } else {
    autoTable(doc, {
      startY: y,
      theme: "grid",
      headStyles: { fillColor: PRIMARY, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2, valign: "top" },
      columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 22 }, 2: { cellWidth: 18 }, 3: { cellWidth: 60 }, 4: { cellWidth: 30 } },
      head: [["Control", "Verdict", "Conf.", "AI Auditor Rationale", "Submitted"]],
      body: evidence.map((e) => [
        e.control_id,
        VERDICT_LABEL[e.verdict],
        `${Math.round(e.confidence * 100)}%`,
        e.rationale,
        new Date(e.created_at).toISOString().slice(0, 10),
      ]),
    });
  }

  // 7. Standards
  doc.addPage();
  header(doc, "Standards Alignment Matrix");
  y = 24;
  y = sectionTitle(doc, "7. Standards Alignment Matrix", y);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2, valign: "top" },
    head: [["Standard", "Region", "Authority", "Reference"]],
    body: allStandards().map((s) => [s.short, s.region, s.authority, s.url]),
  });

  // 8. WBS
  doc.addPage();
  header(doc, "Action Plan (WBS)");
  y = 24;
  y = sectionTitle(doc, "8. Action Plan (Work Breakdown Structure)", y);
  const wbs = buildGovernanceWbsRows(input.controls);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2, valign: "top" },
    head: [["WBS", "Phase", "Control", "Work Package", "Owner", "Due", "Status"]],
    body: wbs.map((r) => [r.wbsId, r.phase, r.controlId, r.workPackage, r.suggestedOwner, r.dueWindow, r.status]),
  });

  // 9. Sign-off
  doc.addPage();
  header(doc, "Sign-off & References");
  y = 24;
  y = sectionTitle(doc, "9. Sign-off", y);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 6, minCellHeight: 22 },
    head: [["Role", "Name", "Signature", "Date"]],
    body: [
      ["AI Governance Lead", "", "", ""],
      ["Model Risk Manager", "", "", ""],
      ["Chief Compliance Officer", "", "", ""],
      ["External Auditor", "", "", ""],
    ],
  });
  y = lastY(doc) + 8;
  y = sectionTitle(doc, "References", y);
  doc.setFontSize(8);
  allStandards().forEach((s) => {
    y = ensureSpace(doc, y, 8);
    doc.text(`- ${s.name} - ${s.authority} (${s.region}). ${s.url}`, 12, y, { maxWidth: pageW - 24 });
    y += 6;
  });

  footer(doc, reportId);
  return doc.output("blob");
}
