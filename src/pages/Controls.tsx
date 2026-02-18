import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { AegisShell } from "@/components/layout/AegisShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  getCompletedControls,
  listSystems,
  setControlCompleted,
} from "@/lib/aegis/storage";
import { evaluateRiskTier } from "@/lib/aegis/risk-tier";
import { evaluateValidationGaps } from "@/lib/aegis/validation-gaps";
import { controlsKnowledgeBase } from "@/lib/aegis/controls-kb";
import type { ControlEvalContext, RiskLevel } from "@/types/aegis";

const nistReferences = [
  { name: "NIST AI RMF 1.0", url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10" },
  { name: "NIST AI RMF Playbook", url: "https://www.nist.gov/itl/ai-risk-management-framework/nist-ai-rmf-playbook" },
  { name: "NIST SP 800-53 Rev.5", url: "https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final" },
  { name: "NIST SP 1270 (Bias in AI)", url: "https://www.nist.gov/publications/towards-standard-identifying-and-managing-bias-artificial-intelligence" },
];

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

  const selectedSystem = systems.find((item) => item.id === selectedSystemId) ?? null;
  const result = useMemo(() => {
    if (!selectedSystem) return null;
    const risk = evaluateRiskTier(selectedSystem.profile);
    const gaps = evaluateValidationGaps(selectedSystem.profile, risk);
    const contextBase = { profile: selectedSystem.profile, gaps };
    const completedSet = new Set(getCompletedControls(selectedSystem.id));

    const rows = controlsKnowledgeBase.map((control) => {
      const context: ControlEvalContext = { profile: selectedSystem.profile, risk, gaps };
      const applicable = control.isApplicable(context);
      const priority = applicable ? control.getPriority(context) : "Optional";
      return {
        ...control,
        applicable,
        priority,
        coverage: derivesRiskCoverage(contextBase, control.id),
        completed: completedSet.has(control.id),
      };
    });

    return { risk, gaps, rows };
  }, [selectedSystem, version]);

  return (
    <AegisShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Control Catalog & Execution</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            NIST-referenced control inventory with risk-aligned execution checklist.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">NIST References</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {nistReferences.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <span>{item.name}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
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
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={control.completed}
                        disabled={!control.applicable}
                        onCheckedChange={(next) => {
                          if (!selectedSystem) return;
                          setControlCompleted(selectedSystem.id, control.id, !!next);
                          setVersion((prev) => prev + 1);
                        }}
                      />
                      <span className="text-xs text-muted-foreground">Done</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AegisShell>
  );
}
