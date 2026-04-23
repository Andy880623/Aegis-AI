import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, TrendingDown } from "lucide-react";
import { AegisShell } from "@/components/layout/AegisShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSystems } from "@/lib/aegis/storage";
import { evaluateResidualRisk, type ResidualRiskResult } from "@/lib/aegis/residual-risk";
import type { RiskLevel } from "@/types/aegis";

function riskBadgeVariant(level: RiskLevel): "default" | "secondary" | "destructive" {
  if (level === "High") return "destructive";
  if (level === "Medium") return "secondary";
  return "default";
}

function statusLabel(status: string) {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In Progress";
  return "Not Started";
}

export default function ResidualRisk() {
  const systems = useMemo(() => listSystems(), []);
  const [selectedSystemId, setSelectedSystemId] = useState(systems[0]?.id ?? "");
  const [result, setResult] = useState<ResidualRiskResult | null>(null);

  const selectedSystem = systems.find((item) => item.id === selectedSystemId) ?? null;

  // Recompute whenever the selected system changes or the user returns to the page
  useEffect(() => {
    if (!selectedSystem) {
      setResult(null);
      return;
    }
    setResult(evaluateResidualRisk(selectedSystem.id, selectedSystem.profile));
  }, [selectedSystem]);

  const recompute = () => {
    if (!selectedSystem) return;
    setResult(evaluateResidualRisk(selectedSystem.id, selectedSystem.profile));
  };

  return (
    <AegisShell>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Residual Risk Assessment</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Re-evaluates exposure after controls and evidence have been applied. The residual tier
              updates automatically as control status and uploaded evidence change.
            </p>
          </div>
          <Button variant="outline" onClick={recompute}>
            Recalculate
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System</CardTitle>
          </CardHeader>
          <CardContent>
            {systems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No system found. Complete an Inherent Risk Assessment first.
              </p>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {result ? (
          <>
            {/* Summary card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Inherent vs Residual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Inherent</span>
                    <Badge variant={riskBadgeVariant(result.inherent.level)}>
                      {result.inherent.level} · {result.inherentScore}/100
                    </Badge>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Residual</span>
                    <Badge variant={riskBadgeVariant(result.residualLevel)}>
                      {result.residualLevel} · {result.residualScore}/100
                    </Badge>
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-sm text-primary">
                    <TrendingDown className="h-4 w-4" />
                    <span className="font-medium">{result.reductionPercent}% risk reduction</span>
                  </div>
                </div>

                {/* Score comparison bars */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Inherent</span>
                      <span>{result.inherentScore}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-destructive/70"
                        style={{ width: `${result.inherentScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Residual</span>
                      <span>{result.residualScore}/100</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${result.residualScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">Controls completed</p>
                    <p className="mt-1 text-lg font-semibold">
                      {result.controlsCompletedCount} / {result.controlsApplicableCount}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">Evidence files</p>
                    <p className="mt-1 text-lg font-semibold">{result.evidenceFilesCount}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs text-muted-foreground">Residual tier</p>
                    <p className="mt-1 text-lg font-semibold">{result.residualLevel}</p>
                  </div>
                </div>

                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm space-y-1">
                  {result.rationale.map((line, idx) => (
                    <p key={idx} className="text-muted-foreground">• {line}</p>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link to="/controls">
                    <Button variant="outline">Update Controls</Button>
                  </Link>
                  <Link to="/reports">
                    <Button>Export to Report</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Per-control breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Per-Control Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Control</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Evidence</TableHead>
                        <TableHead className="text-right">Risk Reduction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.breakdown.map((row) => (
                        <TableRow key={row.control.id}>
                          <TableCell>
                            <div className="font-medium text-sm">{row.control.id}</div>
                            <div className="text-xs text-muted-foreground">{row.control.title}</div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.control.priority === "High"
                                  ? "destructive"
                                  : row.control.priority === "Recommended"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {row.control.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.status === "completed"
                                  ? "default"
                                  : row.status === "in_progress"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {statusLabel(row.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.evidenceCount > 0
                              ? `${row.evidenceCount} file${row.evidenceCount === 1 ? "" : "s"}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                row.reductionPercent >= 75
                                  ? "text-primary font-medium"
                                  : row.reductionPercent > 0
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }
                            >
                              {row.reductionPercent}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AegisShell>
  );
}