import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { evaluateRiskTier } from "@/lib/aegis/risk-tier";
import type { AI_System_Profile } from "@/types/aegis";

export type QuestionnaireFieldStatus = "Auto-filled" | "Confirmed" | "Missing";

interface GovernanceOutputPanelProps {
  profile: AI_System_Profile;
  onChange: (profile: AI_System_Profile) => void;
  fieldStatuses: Partial<Record<keyof AI_System_Profile, QuestionnaireFieldStatus>>;
  onConfirmField: (key: keyof AI_System_Profile) => void;
}

export function GovernanceOutputPanel({
  profile,
  onChange,
  fieldStatuses,
  onConfirmField,
}: GovernanceOutputPanelProps) {
  const risk = evaluateRiskTier(profile);

  const update = <K extends keyof AI_System_Profile>(key: K, value: AI_System_Profile[K]) => {
    onChange({ ...profile, [key]: value });
  };

  const deepDiveRecommended = risk.level !== "Low";

  return (
    <Card className="bg-surface h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Governance Questionnaire (Core + Deep Dive)</CardTitle>
          <Badge variant={risk.level === "High" ? "destructive" : risk.level === "Medium" ? "secondary" : "default"}>
            Current Risk Signal: {risk.level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto">
        <SectionTitle
          title="Core Intake (Minimum for Risk Identification)"
          subtitle="Interview auto-fills these fields. You can manually edit all of them."
        />

        <Field label="System Name" fieldKey="system_name" status={fieldStatuses.system_name} onConfirmField={onConfirmField}>
          <Input value={profile.system_name} onChange={(e) => update("system_name", e.target.value)} />
        </Field>

        <Field label="Use Case Summary" fieldKey="use_case_summary" status={fieldStatuses.use_case_summary} onConfirmField={onConfirmField}>
          <Textarea
            value={profile.use_case_summary}
            onChange={(e) => update("use_case_summary", e.target.value)}
            rows={3}
            placeholder="What does this AI system do, for whom, and in what business context?"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Model Type" fieldKey="model_type" status={fieldStatuses.model_type} onConfirmField={onConfirmField}>
            <Select value={profile.model_type} onValueChange={(v) => update("model_type", v as AI_System_Profile["model_type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ML">ML</SelectItem>
                <SelectItem value="LLM">LLM</SelectItem>
                <SelectItem value="LLM_RAG">LLM_RAG</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Impact Level" fieldKey="impact_level" status={fieldStatuses.impact_level} onConfirmField={onConfirmField}>
            <Select value={profile.impact_level} onValueChange={(v) => update("impact_level", v as AI_System_Profile["impact_level"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Decision Automation" fieldKey="decision_automation" status={fieldStatuses.decision_automation} onConfirmField={onConfirmField}>
            <Select
              value={profile.decision_automation}
              onValueChange={(v) => update("decision_automation", v as AI_System_Profile["decision_automation"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HumanReview">HumanReview</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="FullyAutomated">FullyAutomated</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Deployment" fieldKey="deployment" status={fieldStatuses.deployment} onConfirmField={onConfirmField}>
            <Select value={profile.deployment} onValueChange={(v) => update("deployment", v as AI_System_Profile["deployment"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">internal</SelectItem>
                <SelectItem value="external">external</SelectItem>
                <SelectItem value="both">both</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Domain" fieldKey="domain" status={fieldStatuses.domain} onConfirmField={onConfirmField}>
            <Select value={profile.domain} onValueChange={(v) => update("domain", v as AI_System_Profile["domain"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lending">lending</SelectItem>
                <SelectItem value="marketing">marketing</SelectItem>
                <SelectItem value="customer_support">customer_support</SelectItem>
                <SelectItem value="internal_ops">internal_ops</SelectItem>
                <SelectItem value="other">other</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Data Sources (comma separated)" fieldKey="data_sources" status={fieldStatuses.data_sources} onConfirmField={onConfirmField}>
            <Input
              value={profile.data_sources.join(", ")}
              onChange={(e) => update("data_sources", splitCsv(e.target.value))}
            />
          </Field>
        </div>

        <ToggleRow label="Customer facing" fieldKey="customer_facing" status={fieldStatuses.customer_facing} onConfirmField={onConfirmField} value={profile.customer_facing} onChange={(v) => update("customer_facing", v)} />
        <ToggleRow label="Uses personal data" fieldKey="uses_personal_data" status={fieldStatuses.uses_personal_data} onConfirmField={onConfirmField} value={profile.uses_personal_data} onChange={(v) => update("uses_personal_data", v)} />

        <Field label="Decision Context" fieldKey="decision_context" status={fieldStatuses.decision_context} onConfirmField={onConfirmField}>
          <Textarea
            value={profile.decision_context}
            onChange={(e) => update("decision_context", e.target.value)}
            rows={3}
            placeholder="Describe what decisions are being supported or automated."
          />
        </Field>

        <Field label="Affected Stakeholders (comma separated)" fieldKey="affected_stakeholders" status={fieldStatuses.affected_stakeholders} onConfirmField={onConfirmField}>
          <Input
            value={profile.affected_stakeholders.join(", ")}
            onChange={(e) => update("affected_stakeholders", splitCsv(e.target.value))}
          />
        </Field>

        <ToggleRow
          label="High-risk decision (eligibility, employment, lending, healthcare, legal, etc.)"
          fieldKey="high_risk_decision"
          status={fieldStatuses.high_risk_decision}
          onConfirmField={onConfirmField}
          value={profile.high_risk_decision}
          onChange={(v) => update("high_risk_decision", v)}
        />

        <SectionTitle
          title="Deep Dive (Expanded Governance Signals)"
          subtitle={
            deepDiveRecommended
              ? "Recommended for Medium/High risk systems."
              : "Optional for Low risk systems, but improves traceability."
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Sensitive Data Types (comma separated)" fieldKey="sensitive_data_types" status={fieldStatuses.sensitive_data_types} onConfirmField={onConfirmField}>
            <Input
              value={profile.sensitive_data_types.join(", ")}
              onChange={(e) => update("sensitive_data_types", splitCsv(e.target.value))}
              placeholder="health, financial, biometric, children data"
            />
          </Field>
          <Field label="Data Retention Policy" fieldKey="data_retention_policy" status={fieldStatuses.data_retention_policy} onConfirmField={onConfirmField}>
            <Input
              value={profile.data_retention_policy}
              onChange={(e) => update("data_retention_policy", e.target.value)}
              placeholder="e.g. 90 days rolling"
            />
          </Field>
        </div>

        <ToggleRow
          label="Cross-border data transfer"
          fieldKey="cross_border_data_transfer"
          status={fieldStatuses.cross_border_data_transfer}
          onConfirmField={onConfirmField}
          value={profile.cross_border_data_transfer}
          onChange={(v) => update("cross_border_data_transfer", v)}
        />
        <ToggleRow
          label="Third-party data sharing"
          fieldKey="third_party_data_sharing"
          status={fieldStatuses.third_party_data_sharing}
          onConfirmField={onConfirmField}
          value={profile.third_party_data_sharing}
          onChange={(v) => update("third_party_data_sharing", v)}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Model Provider" fieldKey="model_provider" status={fieldStatuses.model_provider} onConfirmField={onConfirmField}>
            <Input value={profile.model_provider} onChange={(e) => update("model_provider", e.target.value)} />
          </Field>
          <Field label="Model Version" fieldKey="model_version" status={fieldStatuses.model_version} onConfirmField={onConfirmField}>
            <Input value={profile.model_version} onChange={(e) => update("model_version", e.target.value)} />
          </Field>
        </div>

        <ToggleRow
          label="Change management process defined"
          fieldKey="change_management_process"
          status={fieldStatuses.change_management_process}
          onConfirmField={onConfirmField}
          value={profile.change_management_process}
          onChange={(v) => update("change_management_process", v)}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            label="Has robustness testing"
            fieldKey="has_robustness_testing"
            status={fieldStatuses.has_robustness_testing}
            onConfirmField={onConfirmField}
            value={profile.has_robustness_testing}
            onChange={(v) => update("has_robustness_testing", v)}
          />
          <ToggleRow
            label="Has fairness testing"
            fieldKey="has_fairness_testing"
            status={fieldStatuses.has_fairness_testing}
            onConfirmField={onConfirmField}
            value={profile.has_fairness_testing}
            onChange={(v) => update("has_fairness_testing", v)}
          />
          <ToggleRow
            label="Has safety testing"
            fieldKey="has_safety_testing"
            status={fieldStatuses.has_safety_testing}
            onConfirmField={onConfirmField}
            value={profile.has_safety_testing}
            onChange={(v) => update("has_safety_testing", v)}
          />
          <ToggleRow
            label="Has model card"
            fieldKey="has_model_card"
            status={fieldStatuses.has_model_card}
            onConfirmField={onConfirmField}
            value={profile.has_model_card}
            onChange={(v) => update("has_model_card", v)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            label="Prompt injection testing"
            fieldKey="prompt_injection_testing"
            status={fieldStatuses.prompt_injection_testing}
            onConfirmField={onConfirmField}
            value={profile.prompt_injection_testing}
            onChange={(v) => update("prompt_injection_testing", v)}
          />
          <ToggleRow
            label="Data leakage testing"
            fieldKey="data_leakage_testing"
            status={fieldStatuses.data_leakage_testing}
            onConfirmField={onConfirmField}
            value={profile.data_leakage_testing}
            onChange={(v) => update("data_leakage_testing", v)}
          />
          <ToggleRow
            label="Tool call restrictions"
            fieldKey="tool_call_restrictions"
            status={fieldStatuses.tool_call_restrictions}
            onConfirmField={onConfirmField}
            value={profile.tool_call_restrictions}
            onChange={(v) => update("tool_call_restrictions", v)}
          />
          <ToggleRow
            label="Appeal mechanism available"
            fieldKey="appeal_mechanism"
            status={fieldStatuses.appeal_mechanism}
            onConfirmField={onConfirmField}
            value={profile.appeal_mechanism}
            onChange={(v) => update("appeal_mechanism", v)}
          />
        </div>

        <ToggleRow
          label="Incident response playbook available"
          fieldKey="incident_response_playbook"
          status={fieldStatuses.incident_response_playbook}
          onConfirmField={onConfirmField}
          value={profile.incident_response_playbook}
          onChange={(v) => update("incident_response_playbook", v)}
        />

        <Field label="Human Review Trigger" fieldKey="human_review_trigger" status={fieldStatuses.human_review_trigger} onConfirmField={onConfirmField}>
          <Input
            value={profile.human_review_trigger}
            onChange={(e) => update("human_review_trigger", e.target.value)}
            placeholder="e.g. confidence < 0.8 or high-impact decisions"
          />
        </Field>

        <Field label="Monitoring Metrics (comma separated)" fieldKey="monitoring_metrics" status={fieldStatuses.monitoring_metrics} onConfirmField={onConfirmField}>
          <Input
            value={profile.monitoring_metrics.join(", ")}
            onChange={(e) => update("monitoring_metrics", splitCsv(e.target.value))}
            placeholder="latency, hallucination rate, override rate"
          />
        </Field>

        <ToggleRow
          label="Alert thresholds defined"
          fieldKey="alert_threshold_defined"
          status={fieldStatuses.alert_threshold_defined}
          onConfirmField={onConfirmField}
          value={profile.alert_threshold_defined}
          onChange={(v) => update("alert_threshold_defined", v)}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Fairness Method" fieldKey="fairness_method" status={fieldStatuses.fairness_method} onConfirmField={onConfirmField}>
            <Input
              value={profile.fairness_method}
              onChange={(e) => update("fairness_method", e.target.value)}
              placeholder="e.g. equalized odds / demographic parity"
            />
          </Field>
          <Field label="Explanation Mechanism" fieldKey="explanation_mechanism" status={fieldStatuses.explanation_mechanism} onConfirmField={onConfirmField}>
            <Input
              value={profile.explanation_mechanism}
              onChange={(e) => update("explanation_mechanism", e.target.value)}
              placeholder="e.g. model card + feature attribution"
            />
          </Field>
        </div>

        <Field label="Compliance Frameworks (comma separated)" fieldKey="compliance_frameworks" status={fieldStatuses.compliance_frameworks} onConfirmField={onConfirmField}>
          <Input
            value={profile.compliance_frameworks.join(", ")}
            onChange={(e) => update("compliance_frameworks", splitCsv(e.target.value))}
            placeholder="NIST AI RMF, ISO 42001, EU AI Act"
          />
        </Field>

        <Field label="Notes" fieldKey="notes" status={fieldStatuses.notes} onConfirmField={onConfirmField}>
          <Textarea value={profile.notes || ""} onChange={(e) => update("notes", e.target.value)} rows={5} />
        </Field>
      </CardContent>
    </Card>
  );
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  children,
  fieldKey,
  status,
  onConfirmField,
}: {
  label: string;
  children: ReactNode;
  fieldKey: keyof AI_System_Profile;
  status?: QuestionnaireFieldStatus;
  onConfirmField: (key: keyof AI_System_Profile) => void;
}) {
  const statusVariant =
    status === "Confirmed" ? "default" : status === "Auto-filled" ? "secondary" : "outline";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant}>{status || "Missing"}</Badge>
          {status !== "Confirmed" ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => onConfirmField(fieldKey)}
            >
              Confirm
            </button>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  fieldKey,
  status,
  onConfirmField,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  fieldKey: keyof AI_System_Profile;
  status?: QuestionnaireFieldStatus;
  onConfirmField: (key: keyof AI_System_Profile) => void;
}) {
  const statusVariant =
    status === "Confirmed" ? "default" : status === "Auto-filled" ? "secondary" : "outline";
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
      <div className="space-y-1">
        <p className="text-sm">{label}</p>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant}>{status || "Missing"}</Badge>
          {status !== "Confirmed" ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => onConfirmField(fieldKey)}
            >
              Confirm
            </button>
          ) : null}
        </div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
