import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Copy, Download, FileSpreadsheet, FileText, FileType2, Loader2, ShieldAlert, Table2, TestTubeDiagonal } from "lucide-react";
import { AegisShell } from "@/components/layout/AegisShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateControls } from "@/lib/aegis/control-generator";
import {
  buildGovernanceWbsRows,
  collectValidationGapItems,
  generateGovernanceActionPlanReport,
  generateModelCardReport,
  generateRiskSummaryReport,
  type GovernanceWbsRow,
} from "@/lib/aegis/reports";
import { evaluateRiskTier } from "@/lib/aegis/risk-tier";
import { listSystems } from "@/lib/aegis/storage";
import { evaluateValidationGaps } from "@/lib/aegis/validation-gaps";
import type { AI_System_Profile, GeneratedControl, RiskTierResult, ValidationGapsResult } from "@/types/aegis";
import { generateAuditPdf } from "@/lib/aegis/report-pdf";
import { generateAuditDocx } from "@/lib/aegis/report-docx";
import { generateAuditXlsx } from "@/lib/aegis/report-xlsx";

type ReportType = "risk_summary" | "model_card" | "action_plan";

const labels: Record<ReportType, string> = {
  risk_summary: "Risk Summary Report",
  model_card: "Model Card",
  action_plan: "Governance Action Plan (WBS)",
};

export default function ReportsPage() {
  const systems = listSystems();
  const [activeReport, setActiveReport] = useState<ReportType>("risk_summary");
  const [systemId, setSystemId] = useState(systems[0]?.id ?? "");
  const [exporting, setExporting] = useState<null | "pdf" | "docx" | "xlsx">(null);

  const selectedSystem = systems.find((item) => item.id === systemId) ?? null;

  const computed = useMemo(() => {
    if (!selectedSystem) return null;
    const risk = evaluateRiskTier(selectedSystem.profile);
    const gaps = evaluateValidationGaps(selectedSystem.profile, risk);
    const controls = generateControls({ profile: selectedSystem.profile, risk, gaps }).selected;
    const riskMarkdown = generateRiskSummaryReport(selectedSystem.profile, risk, gaps, controls);
    const modelCardMarkdown = generateModelCardReport(selectedSystem.profile, risk, gaps);
    const actionPlanMarkdown = generateGovernanceActionPlanReport(selectedSystem.profile, controls);
    const wbsRows = buildGovernanceWbsRows(controls);
    const gapItems = collectValidationGapItems(gaps);

    return {
      risk,
      gaps,
      controls,
      riskMarkdown,
      modelCardMarkdown,
      actionPlanMarkdown,
      wbsRows,
      gapItems,
    };
  }, [selectedSystem]);

  const copyCurrent = async () => {
    if (!computed) return;
    const content =
      activeReport === "risk_summary"
        ? computed.riskMarkdown
        : activeReport === "model_card"
          ? computed.modelCardMarkdown
          : computed.actionPlanMarkdown;
    await navigator.clipboard.writeText(content);
  };

  const downloadCurrent = () => {
    if (!selectedSystem || !computed) return;
    const safeSystemName = makeSafeFileName(selectedSystem.profile.system_name || "aegis");

    if (activeReport === "action_plan") {
      const html = buildWbsExcelHtml(selectedSystem.profile.system_name || "Untitled System", computed.wbsRows);
      downloadBlob(
        new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }),
        `${safeSystemName}-governance-action-plan-wbs.xls`
      );
      return;
    }

    const html =
      activeReport === "risk_summary"
        ? buildRiskSummaryWordHtml(selectedSystem.profile, computed.risk, computed.gaps, computed.controls, computed.gapItems)
        : buildModelCardWordHtml(selectedSystem.profile, computed.risk, computed.gapItems);
    const suffix = activeReport === "risk_summary" ? "risk-summary-report" : "model-card";
    downloadBlob(new Blob([html], { type: "application/msword;charset=utf-8" }), `${safeSystemName}-${suffix}.doc`);
  };

  const exportAuditPack = async (kind: "pdf" | "docx" | "xlsx") => {
    if (!selectedSystem || !computed) return;
    setExporting(kind);
    try {
      const safeSystemName = makeSafeFileName(selectedSystem.profile.system_name || "aegis");
      const payload = {
        profile: selectedSystem.profile,
        risk: computed.risk,
        gaps: computed.gaps,
        controls: computed.controls,
        systemId: selectedSystem.id,
      };
      let blob: Blob;
      let filename: string;
      if (kind === "pdf") {
        blob = generateAuditPdf(payload);
        filename = `${safeSystemName}-audit-report.pdf`;
      } else if (kind === "docx") {
        blob = await generateAuditDocx(payload);
        filename = `${safeSystemName}-audit-report.docx`;
      } else {
        blob = generateAuditXlsx(payload);
        filename = `${safeSystemName}-audit-workbook.xlsx`;
      }
      downloadBlob(blob, filename);
    } catch (err) {
      console.error("Audit export failed", err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <AegisShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Polished report previews with editable Word and WBS Excel exports.
          </p>
        </div>

        {systems.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No system data yet. Complete a governance interview first.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">System</p>
                  <select
                    value={systemId}
                    onChange={(event) => setSystemId(event.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    {systems.map((system) => (
                      <option key={system.id} value={system.id}>
                        {system.profile.system_name || "Untitled system"}
                      </option>
                    ))}
                  </select>
                </div>
                <SummaryMetric title="Risk Tier" value={computed?.risk.level ?? "-"} icon={ShieldAlert} />
                <SummaryMetric title="Controls Selected" value={computed?.controls.length ?? 0} icon={TestTubeDiagonal} />
                <SummaryMetric title="Report" value={labels[activeReport]} icon={FileText} />
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileType2 className="h-4 w-4 text-primary" />
                  Audit-Grade Report Pack
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  One-click export of the full governance dossier — cover, TOC, risk determination, control matrix,
                  AI-verified evidence log, standards alignment (EU AI Act / NIST / ISO 42001 / UK / SG / TW FSC), WBS,
                  and sign-off page. Suitable for external audit and financial supervisory review.
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => exportAuditPack("pdf")}
                  disabled={!computed || exporting !== null}
                  className="gap-2"
                >
                  {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Download PDF Report
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportAuditPack("docx")}
                  disabled={!computed || exporting !== null}
                  className="gap-2"
                >
                  {exporting === "docx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileType2 className="h-4 w-4" />}
                  Download Word (.docx)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportAuditPack("xlsx")}
                  disabled={!computed || exporting !== null}
                  className="gap-2"
                >
                  {exporting === "xlsx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                  Download Excel WBS (.xlsx)
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Report Selector</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(Object.keys(labels) as ReportType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`w-full rounded-lg border px-3 py-3 text-left ${
                        activeReport === type
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:bg-muted/50"
                      }`}
                      onClick={() => setActiveReport(type)}
                    >
                      <p className="text-sm font-medium">{labels[type]}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {type === "risk_summary" && "Executive risk view with visual cards and priorities."}
                        {type === "model_card" && "Model overview, intended use, data, limitations, and governance."}
                        {type === "action_plan" && "Editable WBS table for execution planning in Excel."}
                      </p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{labels[activeReport]}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copyCurrent} disabled={!computed}>
                        <Copy className="mr-1 h-4 w-4" />
                        Copy Text
                      </Button>
                      <Button size="sm" onClick={downloadCurrent} disabled={!computed}>
                        <Download className="mr-1 h-4 w-4" />
                        {activeReport === "action_plan" ? "Download Excel" : "Download Word"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border bg-surface p-4 md:p-6">
                    {computed ? (
                      <>
                        {activeReport === "risk_summary" ? (
                          <RiskSummaryPreview
                            systemName={selectedSystem?.profile.system_name || "Untitled System"}
                            risk={computed.risk}
                            gapItems={computed.gapItems}
                            controls={computed.controls}
                          />
                        ) : null}
                        {activeReport === "model_card" ? (
                          <MarkdownPreview content={computed.modelCardMarkdown} />
                        ) : null}
                        {activeReport === "action_plan" ? (
                          <WbsPreview rows={computed.wbsRows} />
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AegisShell>
  );
}

function SummaryMetric({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function RiskSummaryPreview({
  systemName,
  risk,
  gapItems,
  controls,
}: {
  systemName: string;
  risk: RiskTierResult;
  gapItems: string[];
  controls: GeneratedControl[];
}) {
  const highControls = controls.filter((item) => item.priority === "High").slice(0, 6);
  const riskColor =
    risk.level === "High"
      ? "from-rose-500/20 to-red-500/10 border-rose-500/30"
      : risk.level === "Medium"
        ? "from-amber-500/20 to-orange-500/10 border-amber-500/30"
        : "from-emerald-500/20 to-green-500/10 border-emerald-500/30";

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border bg-gradient-to-br p-5 ${riskColor}`}>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Risk Summary</p>
        <h2 className="mt-2 text-2xl font-semibold">{systemName}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant={risk.level === "High" ? "destructive" : risk.level === "Medium" ? "secondary" : "default"}>
            Risk Tier: {risk.level}
          </Badge>
          <Badge variant="outline">Validation Gaps: {gapItems.length}</Badge>
          <Badge variant="outline">High-priority Controls: {highControls.length}</Badge>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-background/80 p-4">
          <h3 className="text-sm font-semibold">Top Risk Triggers</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {(risk.triggers.length ? risk.triggers : ["No triggers identified"]).slice(0, 5).map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-background/80 p-4">
          <h3 className="text-sm font-semibold">Validation Gaps</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {(gapItems.length ? gapItems : ["No immediate gaps identified"]).slice(0, 6).map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background/80 p-4">
        <h3 className="text-sm font-semibold">Priority Controls</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {highControls.length > 0 ? (
            highControls.map((control) => (
              <Badge key={control.id} variant="outline">
                {control.id} {control.title}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No high-priority controls identified.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function WbsPreview({ rows }: { rows: GovernanceWbsRow[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Table2 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">WBS preview (download for editable Excel)</p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-semibold">WBS</th>
              <th className="px-3 py-2 font-semibold">Phase</th>
              <th className="px-3 py-2 font-semibold">Control</th>
              <th className="px-3 py-2 font-semibold">Work Package</th>
              <th className="px-3 py-2 font-semibold">Owner</th>
              <th className="px-3 py-2 font-semibold">Deliverable</th>
              <th className="px-3 py-2 font-semibold">Due</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${row.wbsId}-${row.controlId}`} className="border-t border-border">
                  <td className="px-3 py-2">{row.wbsId}</td>
                  <td className="px-3 py-2">{row.phase}</td>
                  <td className="px-3 py-2">{row.controlId}</td>
                  <td className="px-3 py-2">{row.workPackage}</td>
                  <td className="px-3 py-2">{row.suggestedOwner}</td>
                  <td className="px-3 py-2">{row.deliverable}</td>
                  <td className="px-3 py-2">{row.dueWindow}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-muted-foreground">
                  No controls available for WBS export.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-3 text-sm leading-6">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-2xl font-semibold text-foreground mt-2 first:mt-0">
              {line.slice(2)}
            </h1>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-lg font-semibold text-foreground mt-5 border-b border-border pb-1">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-base font-semibold text-foreground mt-4">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={i} className="text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary">
              {line.slice(2)}
            </p>
          );
        }
        if (line.startsWith("Date:") || line.startsWith("System:")) {
          const [k, ...v] = line.split(":");
          return (
            <p key={i} className="text-muted-foreground">
              <span className="font-medium text-foreground">{k}:</span> {v.join(":").trim()}
            </p>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-1" />;
        }
        if (line.startsWith("---")) {
          return <div key={i} className="my-3 border-t border-border" />;
        }
        return (
          <p key={i} className="text-muted-foreground">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function buildRiskSummaryWordHtml(
  profile: AI_System_Profile,
  risk: RiskTierResult,
  gaps: ValidationGapsResult,
  controls: GeneratedControl[],
  gapItems: string[]
) {
  const highControls = controls.filter((item) => item.priority === "High").slice(0, 12);

  return buildWordHtmlDocument(`
    <h1>Risk Summary Report</h1>
    <p><strong>Date:</strong> ${escapeHtml(new Date().toISOString().slice(0, 10))}</p>
    <p><strong>System:</strong> ${escapeHtml(profile.system_name || "Untitled System")}</p>
    <h2>Profile Snapshot</h2>
    <ul>
      <li>Model Type: ${escapeHtml(profile.model_type)}</li>
      <li>Customer Facing: ${profile.customer_facing ? "Yes" : "No"}</li>
      <li>Impact Level: ${escapeHtml(profile.impact_level)}</li>
      <li>Uses Personal Data: ${profile.uses_personal_data ? "Yes" : "No"}</li>
      <li>Decision Automation: ${escapeHtml(profile.decision_automation)}</li>
      <li>Domain: ${escapeHtml(profile.domain)}</li>
      <li>Deployment: ${escapeHtml(profile.deployment)}</li>
    </ul>
    <h2>Risk Tier</h2>
    <p><strong>Level:</strong> ${escapeHtml(risk.level)}</p>
    <p><strong>Triggers</strong></p>
    ${toHtmlList(risk.triggers)}
    <p><strong>Rationale</strong></p>
    ${toHtmlList(risk.rationale)}
    <h2>Validation Gaps</h2>
    <ul>
      <li>Robustness Required: ${gaps.robustness.required ? "Yes" : "No"}</li>
      <li>Fairness Required: ${gaps.fairness.required ? "Yes" : "No"}</li>
      <li>Safety Required: ${gaps.safety.required ? "Yes" : "No"}</li>
      <li>Explainability Required: ${gaps.explainability.required ? "Yes" : "No"}</li>
    </ul>
    <p><strong>Gap Details</strong></p>
    ${toHtmlList(gapItems)}
    <h2>Priority Controls</h2>
    ${toHtmlList(highControls.map((item) => `${item.id}: ${item.title}`))}
  `);
}

function buildModelCardWordHtml(profile: AI_System_Profile, risk: RiskTierResult, gapItems: string[]) {
  return buildWordHtmlDocument(`
    <h1>Model Card</h1>
    <h2>1. System Overview</h2>
    <ul>
      <li>Name: ${escapeHtml(profile.system_name || "Untitled System")}</li>
      <li>Model Type: ${escapeHtml(profile.model_type)}</li>
      <li>Domain: ${escapeHtml(profile.domain)}</li>
      <li>Deployment: ${escapeHtml(profile.deployment)}</li>
      <li>Customer Facing: ${profile.customer_facing ? "Yes" : "No"}</li>
    </ul>
    <h2>2. Intended Use</h2>
    <ul>
      <li>Primary use case for this system.</li>
      <li>Intended user segments.</li>
      <li>Known non-intended uses.</li>
    </ul>
    <h2>3. Data</h2>
    <ul>
      <li>Uses Personal Data: ${profile.uses_personal_data ? "Yes" : "No"}</li>
    </ul>
    <p><strong>Data Sources</strong></p>
    ${toHtmlList(profile.data_sources)}
    <h2>4. Evaluation and Validation</h2>
    <ul>
      <li>Robustness testing in place: ${profile.has_robustness_testing ? "Yes" : "No"}</li>
      <li>Fairness testing in place: ${profile.has_fairness_testing ? "Yes" : "No"}</li>
      <li>Safety testing in place: ${profile.has_safety_testing ? "Yes" : "No"}</li>
      <li>Explainability artifact in place: ${profile.has_model_card ? "Yes" : "No"}</li>
    </ul>
    <h2>5. Risk and Limitations</h2>
    <p><strong>Risk Tier:</strong> ${escapeHtml(risk.level)}</p>
    <p><strong>Validation gaps</strong></p>
    ${toHtmlList(gapItems)}
    <h2>6. Governance and Oversight</h2>
    <ul>
      <li>Decision Automation: ${escapeHtml(profile.decision_automation)}</li>
      <li>Human review checkpoints and escalation path.</li>
      <li>Monitoring commitments and review cadence.</li>
    </ul>
    <h2>7. Change Log</h2>
    <ul>
      <li>Date:</li>
      <li>Summary of model/prompt/policy updates:</li>
    </ul>
  `);
}

function buildWbsExcelHtml(systemName: string, rows: GovernanceWbsRow[]) {
  const header = `
    <tr>
      <th>WBS ID</th>
      <th>Phase</th>
      <th>Control ID</th>
      <th>Work Package</th>
      <th>Description</th>
      <th>Priority</th>
      <th>Objective</th>
      <th>Deliverable</th>
      <th>Suggested Owner</th>
      <th>Due Window</th>
      <th>Status</th>
    </tr>
  `;

  const body = rows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.wbsId)}</td>
        <td>${escapeHtml(row.phase)}</td>
        <td>${escapeHtml(row.controlId)}</td>
        <td>${escapeHtml(row.workPackage)}</td>
        <td>${escapeHtml(row.description)}</td>
        <td>${escapeHtml(row.priority)}</td>
        <td>${escapeHtml(row.objective)}</td>
        <td>${escapeHtml(row.deliverable)}</td>
        <td>${escapeHtml(row.suggestedOwner)}</td>
        <td>${escapeHtml(row.dueWindow)}</td>
        <td>${escapeHtml(row.status)}</td>
      </tr>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: Arial, sans-serif; }
      h1 { margin-bottom: 8px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #d5d7da; padding: 6px; vertical-align: top; }
      th { background: #f4f6f8; text-align: left; }
    </style>
  </head>
  <body>
    <h1>Governance Action Plan WBS</h1>
    <p>System: ${escapeHtml(systemName)}</p>
    <table>
      <thead>${header}</thead>
      <tbody>${body}</tbody>
    </table>
  </body>
</html>`;
}

function buildWordHtmlDocument(body: string) {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: Calibri, Arial, sans-serif; margin: 24px; line-height: 1.45; color: #1f2937; }
      h1 { font-size: 26px; margin-bottom: 10px; }
      h2 { font-size: 18px; margin-top: 18px; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
      p { margin: 6px 0; }
      ul { margin: 6px 0 6px 22px; }
      li { margin: 3px 0; }
    </style>
  </head>
  <body>${body}</body>
</html>`;
}

function toHtmlList(items: string[]) {
  const values = items.length ? items : ["None"];
  return `<ul>${values.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function makeSafeFileName(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "aegis";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
