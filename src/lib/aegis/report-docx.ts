import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  ShadingType,
  LevelFormat,
} from "docx";
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

const NAVY = "094E8A";
const LIGHT = "F1F5F9";
const BORDER = "D5DBE3";

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: BORDER };
const allBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function p(text: string, opts: { bold?: boolean; size?: number; color?: string } = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, size: opts.size ?? 20, color: opts.color })],
    spacing: { after: 80 },
  });
}

function h1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, color: NAVY })],
    spacing: { before: 240, after: 160 },
  });
}

function h2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, color: NAVY })],
    spacing: { before: 200, after: 120 },
  });
}

function cell(text: string, opts: { header?: boolean; width?: number } = {}) {
  return new TableCell({
    borders: allBorders,
    shading: opts.header ? { fill: NAVY, type: ShadingType.CLEAR, color: "auto" } : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: opts.header,
            color: opts.header ? "FFFFFF" : "1F2937",
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function buildTable(headers: string[], rows: string[][], colWidths: number[]) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => cell(h, { header: true, width: colWidths[i] })),
      }),
      ...rows.map(
        (r) =>
          new TableRow({
            children: r.map((c, i) => cell(c, { width: colWidths[i] })),
          })
      ),
    ],
  });
}

export async function generateAuditDocx(input: ReportInput): Promise<Blob> {
  const reportId = input.reportId ?? `AEGIS-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toISOString().slice(0, 10);
  const summary = complianceSummary(input.systemId);
  const highCount = input.controls.filter((c) => c.priority === "High").length;
  const gapItems = collectValidationGapItems(input.gaps);
  const evidence = listEvidenceForSystem(input.systemId);
  const wbs = buildGovernanceWbsRows(input.controls);
  // Content width on US Letter with 1" margins = 9360 DXA
  const W = 9360;

  const cover = [
    new Paragraph({ spacing: { before: 1200 }, children: [new TextRun({ text: "AEGIS AI GOVERNANCE", bold: true, color: NAVY, size: 24 })] }),
    new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: "AI Risk & Compliance Report", bold: true, size: 56, color: NAVY })] }),
    new Paragraph({ spacing: { before: 480 }, children: [new TextRun({ text: `System: ${input.profile.system_name || "Untitled System"}`, size: 26 })] }),
    p(`Risk Tier: ${input.risk.level}`, { size: 24 }),
    p(`Report ID: ${reportId}`, { size: 24 }),
    p(`Issued: ${today}`, { size: 24 }),
    new Paragraph({ spacing: { before: 1600 }, children: [new TextRun({ text: "Prepared for external audit, financial supervision, and internal model risk review.", italics: true, size: 18, color: "475569" })] }),
    new Paragraph({ children: [new TextRun({ text: "Aligned with EU AI Act, NIST AI RMF, ISO/IEC 42001, UK AI Principles, SG AI Verify, and TW FSC AI Guidelines.", italics: true, size: 18, color: "475569" })] }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const toc = [
    h1("Table of Contents"),
    ...[
      "1. Executive Summary",
      "2. System Profile",
      "3. Risk Tier Determination",
      "4. Validation Gap Analysis",
      "5. Control Recommendations",
      "6. Evidence & AI Verification Log",
      "7. Standards Alignment Matrix",
      "8. Action Plan (WBS)",
      "9. Sign-off & References",
    ].map((t) => p(t, { size: 22 })),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const exec = [
    h1("1. Executive Summary"),
    p(
      `This report presents the governance posture of "${input.profile.system_name || "the subject AI system"}" as assessed by the Aegis AI platform. The system is classified as ${input.risk.level} risk based on its model type, customer exposure, decision automation, and use of personal data. A total of ${input.controls.length} controls have been recommended (${highCount} high priority), and ${gapItems.length} validation gaps have been identified across robustness, fairness, safety, and explainability dimensions.`
    ),
    p(
      `AI-verified evidence has been collected for ${summary.total} control(s): ${summary.pass} verified (PASS), ${summary.partial} partial, and ${summary.fail} insufficient. Evidence is evaluated by an automated AI auditor against control objectives, required artifacts, and aligned regulatory clauses. Manual attestation alone is not accepted as compliance.`
    ),
  ];

  const profile = [
    h1("2. System Profile"),
    buildTable(
      ["Attribute", "Value"],
      [
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
      [3000, 6360]
    ),
  ];

  const riskSection = [
    h1("3. Risk Tier Determination"),
    p(`Determined Risk Tier: ${input.risk.level}`, { bold: true }),
    h2("Triggers"),
    ...(input.risk.triggers.length ? input.risk.triggers.map((t) => p(`\u2022 ${t}`)) : [p("No triggers identified.")]),
    h2("Rationale"),
    ...(input.risk.rationale.length ? input.risk.rationale.map((r) => p(`\u2022 ${r}`)) : [p("No rationale recorded.")]),
  ];

  const gapsSection = [
    h1("4. Validation Gap Analysis"),
    buildTable(
      ["Dimension", "Required", "Identified Gaps"],
      [
        ["Robustness", input.gaps.robustness.required ? "Yes" : "No", input.gaps.robustness.gaps.join("; ") || "None"],
        ["Fairness", input.gaps.fairness.required ? "Yes" : "No", input.gaps.fairness.gaps.join("; ") || "None"],
        ["Safety", input.gaps.safety.required ? "Yes" : "No", input.gaps.safety.gaps.join("; ") || "None"],
        ["Explainability", input.gaps.explainability.required ? "Yes" : "No", input.gaps.explainability.gaps.join("; ") || "None"],
      ],
      [2200, 1500, 5660]
    ),
  ];

  const controlsSection = [
    new Paragraph({ children: [new PageBreak()] }),
    h1("5. Control Recommendations"),
    buildTable(
      ["ID", "Control", "Category", "Priority", "Aligned Standards"],
      input.controls.map((c) => [
        c.id,
        c.title,
        c.category,
        c.priority,
        clausesForCategory(c.category).map(formatCitation).join("\n"),
      ]),
      [900, 2700, 1800, 1100, 2860]
    ),
  ];

  const evidenceRows: string[][] =
    evidence.length === 0
      ? [["—", "—", "—", "No AI-verified evidence has been submitted yet.", "—"]]
      : evidence.map((e) => [
          e.control_id,
          VERDICT_LABEL[e.verdict],
          `${Math.round(e.confidence * 100)}%`,
          e.rationale,
          new Date(e.created_at).toISOString().slice(0, 10),
        ]);
  const evidenceSection = [
    new Paragraph({ children: [new PageBreak()] }),
    h1("6. Evidence & AI Verification Log"),
    buildTable(
      ["Control", "Verdict", "Conf.", "AI Auditor Rationale", "Submitted"],
      evidenceRows,
      [1100, 1300, 900, 4660, 1400]
    ),
  ];

  const stdSection = [
    new Paragraph({ children: [new PageBreak()] }),
    h1("7. Standards Alignment Matrix"),
    buildTable(
      ["Standard", "Region", "Authority", "Reference"],
      allStandards().map((s) => [s.short, s.region, s.authority, s.url]),
      [1800, 1800, 2400, 3360]
    ),
  ];

  const wbsSection = [
    new Paragraph({ children: [new PageBreak()] }),
    h1("8. Action Plan (Work Breakdown Structure)"),
    buildTable(
      ["WBS", "Phase", "Control", "Work Package", "Owner", "Due"],
      wbs.map((r) => [r.wbsId, r.phase, r.controlId, r.workPackage, r.suggestedOwner, r.dueWindow]),
      [800, 1700, 1100, 2960, 1700, 1100]
    ),
  ];

  const signoff = [
    new Paragraph({ children: [new PageBreak()] }),
    h1("9. Sign-off & References"),
    h2("Sign-off"),
    buildTable(
      ["Role", "Name", "Signature", "Date"],
      [
        ["AI Governance Lead", "", "", ""],
        ["Model Risk Manager", "", "", ""],
        ["Chief Compliance Officer", "", "", ""],
        ["External Auditor", "", "", ""],
      ],
      [2800, 2200, 2360, 2000]
    ),
    h2("References"),
    ...allStandards().map((s) =>
      p(`\u2022 ${s.name} \u2014 ${s.authority} (${s.region}). ${s.url}`, { size: 18 })
    ),
  ];

  const doc = new Document({
    creator: "Aegis AI Governance Platform",
    title: `Aegis Audit Report - ${input.profile.system_name}`,
    description: `Audit-grade AI governance report for ${input.profile.system_name}`,
    styles: {
      default: { document: { run: { font: "Calibri", size: 20 } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `AEGIS AI \u00B7 ${input.profile.system_name || "Report"} \u00B7 ${reportId}`, size: 16, color: "64748B" })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `Confidential \u00B7 Generated ${today} \u00B7 Page `, size: 16, color: "64748B" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "64748B" }),
                  new TextRun({ text: " of ", size: 16, color: "64748B" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "64748B" }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...cover,
          ...toc,
          ...exec,
          ...profile,
          ...riskSection,
          ...gapsSection,
          ...controlsSection,
          ...evidenceSection,
          ...stdSection,
          ...wbsSection,
          ...signoff,
        ],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}
