import { useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ExternalLink, Paperclip, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { AegisShell } from "@/components/layout/AegisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  addControlEvidence,
  getAllControlEvidence,
  getControlStatuses,
  listSystems,
  removeControlEvidence,
  setControlStatus,
  type ControlStatus,
} from "@/lib/aegis/storage";
import { evaluateRiskTier } from "@/lib/aegis/risk-tier";
import { evaluateValidationGaps } from "@/lib/aegis/validation-gaps";
import { controlsKnowledgeBase } from "@/lib/aegis/controls-kb";
import type { ControlEvalContext, RiskLevel } from "@/types/aegis";
import { allStandards } from "@/lib/aegis/standards";

const standardReferences = allStandards();

function derivesRiskCoverage(contextBase: Omit<ControlEvalContext, "risk">, controlId: string): RiskLevel[] {
  const levels: RiskLevel[] = [];
  const control = controlsKnowledgeBase.find((item) => item.id === controlId);
  if (!control) return levels;

  (["Low", "Medium", "High"] as RiskLevel[]).forEach((level) => {
    const fakeRisk = { level, triggers: [], rationale: [] };
    const context: ControlEvalContext = { ...contextBase, risk: fakeRisk };
    if (control.isApplicable(context)) levels.push(level);
  });
  return levels;
}

export default function ControlsPage() {
  const systems = listSystems();
  const [selectedSystemId, setSelectedSystemId] = useState(systems[0]?.id ?? "");
  const [version, setVersion] = useState(0);
  const [expandedExamples, setExpandedExamples] = useState<Record<string, boolean>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const selectedSystem = systems.find((item) => item.id === selectedSystemId) ?? null;
  const result = useMemo(() => {
    if (!selectedSystem) return null;
    const risk = evaluateRiskTier(selectedSystem.profile);
    const gaps = evaluateValidationGaps(selectedSystem.profile, risk);
    const contextBase = { profile: selectedSystem.profile, gaps };
    const statusMap = getControlStatuses(selectedSystem.id);
    const evidenceMap = getAllControlEvidence(selectedSystem.id);

    const rows = controlsKnowledgeBase.map((control) => {
      const context: ControlEvalContext = { profile: selectedSystem.profile, risk, gaps };
      const applicable = control.isApplicable(context);
      const priority = applicable ? control.getPriority(context) : "Optional";
      return {
        ...control,
        applicable,
        priority,
        coverage: derivesRiskCoverage(contextBase, control.id),
        status: (statusMap[control.id] ?? "not_started") as ControlStatus,
        evidence: evidenceMap[control.id] ?? [],
      };
    });

    const applicableRows = rows.filter((r) => r.applicable);
    const completedCount = applicableRows.filter((r) => r.status === "completed").length;
    return { risk, gaps, rows, applicableCount: applicableRows.length, completedCount };
  }, [selectedSystem, version]);

  const handleStatusChange = (controlId: string, status: ControlStatus) => {
    if (!selectedSystem) return;
    setControlStatus(selectedSystem.id, controlId, status);
    setVersion((prev) => prev + 1);
  };

  const handleEvidenceUpload = (controlId: string, files: FileList | null) => {
    if (!selectedSystem || !files) return;
    Array.from(files).forEach((file) => {
      addControlEvidence(selectedSystem.id, controlId, {
        name: file.name,
        size: file.size,
        mime_type: file.type || "application/octet-stream",
      });
    });
    setVersion((prev) => prev + 1);
  };

  const handleEvidenceRemove = (controlId: string, evidenceId: string) => {
    if (!selectedSystem) return;
    removeControlEvidence(selectedSystem.id, controlId, evidenceId);
    setVersion((prev) => prev + 1);
  };

  return (
    <AegisShell>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Control Catalog & Execution</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Multi-standard control inventory aligned to the EU AI Act, NIST AI RMF, ISO 42001,
              and regional AI guidelines. Mark each control's status and upload evidence to drive
              residual risk reduction.
            </p>
          </div>
          <Link to="/residual">
            <Button className="gap-2">
              View Residual Risk
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standards & Regulatory References</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {standardReferences.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">{item.short}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.region} · {item.authority}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
              </a>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Identification Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {systems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No system found. Complete a governance interview first.
              </p>
            ) : (
              <>
                <select
                  value={selectedSystemId}
                  onChange={(event) => setSelectedSystemId(event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {systems.map((system) => (
                    <option key={system.id} value={system.id}>
                      {system.profile.system_name || "Untitled System"}
                    </option>
                  ))}
                </select>
                {result ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Current identified risk:</span>
                    <Badge variant={result.risk.level === "High" ? "destructive" : result.risk.level === "Medium" ? "secondary" : "default"}>
                      {result.risk.level}
                    </Badge>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        {result ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Control List (Complete item by item)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.rows.map((control) => (
                <div
                  key={control.id}
                  className={`rounded-md border p-3 ${control.applicable ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {control.id} | {control.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{control.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{control.category}</Badge>
                        <Badge variant="outline">Priority: {control.priority}</Badge>
                        <Badge variant="outline">Risk Coverage: {control.coverage.join(", ") || "N/A"}</Badge>
                        <Badge variant={control.applicable ? "default" : "secondary"}>
                          {control.applicable ? "Applicable after risk identification" : "Not currently required"}
                        </Badge>
                      </div>
                      <Collapsible
                        open={!!expandedExamples[control.id]}
                        onOpenChange={(open) =>
                          setExpandedExamples((prev) => ({ ...prev, [control.id]: open }))
                        }
                        className="mt-3"
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                          >
                            {expandedExamples[control.id] ? "Hide example" : "See example"}
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${
                                expandedExamples[control.id] ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 space-y-3 rounded-md border border-dashed border-primary/30 bg-background/60 p-3 text-xs">
                            <div>
                              <p className="font-semibold text-foreground">Compliant implementation example</p>
                              <p className="mt-1 text-muted-foreground">
                                Scenario: {selectedSystem?.profile.system_name || "This AI system"} applies{" "}
                                {control.title.toLowerCase()} with documented ownership and evidence.
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-foreground">Objective</p>
                              <p className="mt-1 text-muted-foreground">{control.how_to_template.objective}</p>
                            </div>

                            <div>
                              <p className="font-semibold text-foreground">Implementation steps (example)</p>
                              <ol className="mt-1 space-y-1 text-muted-foreground">
                                {control.how_to_template.steps.map((step, index) => (
                                  <li key={`${control.id}-step-${index}`}>{index + 1}. {step}</li>
                                ))}
                              </ol>
                            </div>

                            <div>
                              <p className="font-semibold text-foreground">Artifacts to keep for audit</p>
                              <ul className="mt-1 space-y-1 text-muted-foreground">
                                {control.how_to_template.evidence.map((item) => (
                                  <li key={`${control.id}-evidence-${item}`}>- {item}</li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <p className="font-semibold text-foreground">Suggested tools</p>
                              <ul className="mt-1 space-y-1 text-muted-foreground">
                                {control.how_to_template.suggested_tools.map((item) => (
                                  <li key={`${control.id}-tool-${item}`}>- {item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                    <div className="flex flex-col items-end gap-2 min-w-[200px]">
                      <select
                        value={control.status}
                        disabled={!control.applicable}
                        onChange={(event) =>
                          handleStatusChange(control.id, event.target.value as ControlStatus)
                        }
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        <span>
                          {control.evidence.length} file{control.evidence.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <input
                        ref={(el) => (fileInputs.current[control.id] = el)}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          handleEvidenceUpload(control.id, event.target.files);
                          event.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!control.applicable}
                        onClick={() => fileInputs.current[control.id]?.click()}
                        className="gap-1 h-7 text-xs"
                      >
                        <Upload className="h-3 w-3" />
                        Upload evidence
                      </Button>
                    </div>
                  </div>
                  {control.evidence.length > 0 && (
                    <div className="mt-3 rounded-md border border-dashed border-border bg-muted/20 p-2 space-y-1">
                      {control.evidence.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 text-muted-foreground truncate">
                            <Paperclip className="h-3 w-3 shrink-0" />
                            <span className="truncate">{file.name}</span>
                            <span className="text-muted-foreground/70">
                              ({Math.round(file.size / 1024)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEvidenceRemove(control.id, file.id)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Remove evidence"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AegisShell>
  );
}
