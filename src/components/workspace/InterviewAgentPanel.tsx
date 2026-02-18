import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Mic, MicOff, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { defaultSystemProfile, normalizeProfile } from "@/lib/aegis/schema";
import { upsertSystem } from "@/lib/aegis/storage";
import { createRealtimeVoiceSession, type RealtimeVoiceSession } from "@/lib/aegis/realtime-voice";
import { generateAndrewTurn, hasOpenAIConfigured } from "@/lib/aegis/chatgpt";
import { evaluateRiskTier } from "@/lib/aegis/risk-tier";
import type { AI_System_Profile } from "@/types/aegis";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type InterviewField = keyof AI_System_Profile;

type FieldSpec = {
  key: InterviewField;
  label: string;
  question: string;
  requiredForCore: boolean;
  requiredForDeep: boolean;
};

interface InterviewAgentPanelProps {
  profile: AI_System_Profile;
  systemId: string | null;
  onProfileChange: (profile: AI_System_Profile) => void;
  onPersist: (id: string) => void;
  onComplete: (profile: AI_System_Profile) => void;
}

const fieldSpecs: FieldSpec[] = [
  { key: "system_name", label: "System Name", question: "What is the system name?", requiredForCore: true, requiredForDeep: false },
  {
    key: "use_case_summary",
    label: "Use Case Summary",
    question: "What is the main use case and who uses this system?",
    requiredForCore: true,
    requiredForDeep: false,
  },
  { key: "model_type", label: "Model Type", question: "Model type: ML, LLM, or LLM_RAG?", requiredForCore: true, requiredForDeep: false },
  { key: "customer_facing", label: "Customer Facing", question: "Is it customer-facing?", requiredForCore: true, requiredForDeep: false },
  { key: "impact_level", label: "Impact Level", question: "Impact level: Low, Medium, or High?", requiredForCore: true, requiredForDeep: false },
  {
    key: "uses_personal_data",
    label: "Uses Personal Data",
    question: "Does it use personal data or PII?",
    requiredForCore: true,
    requiredForDeep: false,
  },
  {
    key: "decision_automation",
    label: "Decision Automation",
    question: "Decision automation: HumanReview, Partial, or FullyAutomated?",
    requiredForCore: true,
    requiredForDeep: false,
  },
  { key: "domain", label: "Domain", question: "Which domain is this in: lending, marketing, customer_support, internal_ops, or other?", requiredForCore: true, requiredForDeep: false },
  { key: "decision_context", label: "Decision Context", question: "What specific decisions does this system support or automate?", requiredForCore: true, requiredForDeep: false },
  {
    key: "affected_stakeholders",
    label: "Affected Stakeholders",
    question: "Who is affected by these decisions?",
    requiredForCore: true,
    requiredForDeep: false,
  },
  { key: "high_risk_decision", label: "High-Risk Decision", question: "Does it make high-risk decisions like eligibility, hiring, lending, healthcare, or legal outcomes?", requiredForCore: true, requiredForDeep: false },
  { key: "data_sources", label: "Data Sources", question: "What are the main data sources?", requiredForCore: true, requiredForDeep: false },
  { key: "deployment", label: "Deployment", question: "Deployment scope: internal, external, or both?", requiredForCore: true, requiredForDeep: false },

  { key: "sensitive_data_types", label: "Sensitive Data Types", question: "What sensitive data categories are involved, if any?", requiredForCore: false, requiredForDeep: true },
  { key: "data_retention_policy", label: "Data Retention", question: "What is your data retention policy for this system?", requiredForCore: false, requiredForDeep: true },
  { key: "cross_border_data_transfer", label: "Cross-border Transfer", question: "Is there cross-border data transfer?", requiredForCore: false, requiredForDeep: true },
  { key: "third_party_data_sharing", label: "Third-party Sharing", question: "Is data shared with any third party?", requiredForCore: false, requiredForDeep: true },
  { key: "model_provider", label: "Model Provider", question: "Who is the model provider?", requiredForCore: false, requiredForDeep: true },
  { key: "model_version", label: "Model Version", question: "What model version is currently deployed?", requiredForCore: false, requiredForDeep: true },
  { key: "change_management_process", label: "Change Management", question: "Do you have a defined change-management process for model updates?", requiredForCore: false, requiredForDeep: true },
  { key: "has_robustness_testing", label: "Robustness Testing", question: "Do you have robustness testing evidence?", requiredForCore: false, requiredForDeep: true },
  { key: "has_fairness_testing", label: "Fairness Testing", question: "Do you have fairness testing evidence?", requiredForCore: false, requiredForDeep: true },
  { key: "has_safety_testing", label: "Safety Testing", question: "Do you have safety testing evidence?", requiredForCore: false, requiredForDeep: true },
  { key: "has_model_card", label: "Model Card", question: "Do you have a model card or equivalent explainability artifact?", requiredForCore: false, requiredForDeep: true },
  { key: "prompt_injection_testing", label: "Prompt Injection Testing", question: "Have you tested for prompt injection attacks?", requiredForCore: false, requiredForDeep: true },
  { key: "data_leakage_testing", label: "Data Leakage Testing", question: "Have you tested for data leakage risks?", requiredForCore: false, requiredForDeep: true },
  { key: "tool_call_restrictions", label: "Tool Call Restrictions", question: "Are tool calls restricted by policy or allowlist?", requiredForCore: false, requiredForDeep: true },
  { key: "human_review_trigger", label: "Human Review Trigger", question: "When is human review triggered?", requiredForCore: false, requiredForDeep: true },
  { key: "appeal_mechanism", label: "Appeal Mechanism", question: "Is there a user appeal or recourse mechanism?", requiredForCore: false, requiredForDeep: true },
  { key: "incident_response_playbook", label: "Incident Playbook", question: "Do you have an AI incident response playbook?", requiredForCore: false, requiredForDeep: true },
  { key: "monitoring_metrics", label: "Monitoring Metrics", question: "What monitoring metrics are tracked?", requiredForCore: false, requiredForDeep: true },
  { key: "alert_threshold_defined", label: "Alert Threshold", question: "Are alert thresholds defined for model risk signals?", requiredForCore: false, requiredForDeep: true },
  { key: "fairness_method", label: "Fairness Method", question: "What fairness method or standard do you use?", requiredForCore: false, requiredForDeep: true },
  { key: "explanation_mechanism", label: "Explanation Mechanism", question: "How do you provide model explanations?", requiredForCore: false, requiredForDeep: true },
  { key: "compliance_frameworks", label: "Compliance Frameworks", question: "Which frameworks apply (e.g., NIST AI RMF, ISO 42001, EU AI Act)?", requiredForCore: false, requiredForDeep: true },
];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function yesNo(text: string, fallback: boolean) {
  const s = normalize(text);
  if (["no", "not", "don't", "do not", "none", "false", "not yet"].some((k) => s.includes(k))) return false;
  if (["yes", "true", "we do", "it does", "implemented", "available"].some((k) => s.includes(k))) return true;
  return fallback;
}

function splitTokens(raw: string) {
  return raw
    .split(/[;,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function fieldFilled(profile: AI_System_Profile, key: InterviewField) {
  const value = profile[key];
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null;
}

function nextMissingField(profile: AI_System_Profile, stage: "core" | "deep") {
  const candidates = fieldSpecs.filter((spec) => (stage === "core" ? spec.requiredForCore : spec.requiredForDeep));
  return candidates.find((spec) => !fieldFilled(profile, spec.key)) ?? null;
}

function mergeTranscriptIntoProfile(answer: string, profile: AI_System_Profile): AI_System_Profile {
  const s = normalize(answer);
  const next = { ...profile };

  if (!next.system_name && answer.trim().length >= 4 && /system|agent|assistant|copilot|tool/.test(s)) {
    next.system_name = answer.trim().slice(0, 90);
  }

  if (!next.use_case_summary && answer.trim().length > 20) {
    next.use_case_summary = answer.trim().slice(0, 280);
  }

  if (s.includes("customer-facing") || s.includes("customer facing") || s.includes("end users")) next.customer_facing = true;
  if (s.includes("internal only") || s.includes("not customer-facing")) next.customer_facing = false;

  if (s.includes("personal data") || s.includes("pii")) next.uses_personal_data = true;
  if (s.includes("no personal data") || s.includes("without pii")) next.uses_personal_data = false;

  if (s.includes("high impact") || s.includes("critical impact")) next.impact_level = "High";
  if (s.includes("medium impact") || s.includes("moderate impact")) next.impact_level = "Medium";
  if (s.includes("low impact")) next.impact_level = "Low";

  if (s.includes("fully automated") || s.includes("autonomous")) next.decision_automation = "FullyAutomated";
  if (s.includes("partial automation") || s.includes("human in the loop") || s.includes("assisted")) next.decision_automation = "Partial";
  if (s.includes("human review") || s.includes("manual approval")) next.decision_automation = "HumanReview";

  if (s.includes("llm rag") || s.includes("rag")) next.model_type = "LLM_RAG";
  else if (s.includes("llm") || s.includes("gpt") || s.includes("language model")) next.model_type = "LLM";
  else if (s.includes("ml") || s.includes("machine learning")) next.model_type = "ML";

  if (s.includes("external deployment") || s.includes("public deployment")) next.deployment = "external";
  if (s.includes("internal deployment") || s.includes("private deployment")) next.deployment = next.deployment === "external" ? "both" : "internal";
  if (s.includes("hybrid deployment") || s.includes("both internal and external")) next.deployment = "both";

  if (s.includes("lending") || s.includes("loan") || s.includes("credit")) next.domain = "lending";
  if (s.includes("marketing") || s.includes("campaign") || s.includes("ad targeting")) next.domain = "marketing";
  if (s.includes("customer support") || s.includes("helpdesk")) next.domain = "customer_support";
  if (s.includes("internal ops") || s.includes("internal operations")) next.domain = "internal_ops";

  if (!next.decision_context && /(decision|approve|deny|rank|recommend|classify|eligibility)/.test(s)) {
    next.decision_context = answer.trim().slice(0, 280);
  }

  if (!next.affected_stakeholders.length && /(users|customers|employees|patients|students|applicants)/.test(s)) {
    next.affected_stakeholders = splitTokens(answer);
  }

  if (/(eligibility|hiring|loan approval|medical|legal|insurance pricing)/.test(s)) {
    next.high_risk_decision = true;
  }

  if (answer.includes(",") && /(data source|source|from)/.test(s)) {
    const sources = splitTokens(answer);
    if (sources.length) next.data_sources = sources;
  }

  if (/(health|financial|biometric|children|location|identity)/.test(s)) {
    next.sensitive_data_types = Array.from(new Set([...next.sensitive_data_types, ...splitTokens(answer)]));
  }

  if (s.includes("retain") || s.includes("retention")) next.data_retention_policy = answer.trim().slice(0, 180);

  if (s.includes("cross-border") || s.includes("cross border") || s.includes("international transfer")) {
    next.cross_border_data_transfer = yesNo(answer, next.cross_border_data_transfer);
  }

  if (s.includes("third-party") || s.includes("third party") || s.includes("vendor sharing")) {
    next.third_party_data_sharing = yesNo(answer, next.third_party_data_sharing);
  }

  if (s.includes("openai") || s.includes("anthropic") || s.includes("vendor") || s.includes("provider")) {
    next.model_provider = answer.trim().slice(0, 120);
  }

  if (/v\d|version|model id/.test(s)) next.model_version = answer.trim().slice(0, 120);

  if (s.includes("change management") || s.includes("release process")) {
    next.change_management_process = yesNo(answer, next.change_management_process);
  }

  if (s.includes("robustness testing")) next.has_robustness_testing = !s.includes("no robustness testing");
  if (s.includes("fairness testing")) next.has_fairness_testing = !s.includes("no fairness testing");
  if (s.includes("safety testing")) next.has_safety_testing = !s.includes("no safety testing");
  if (s.includes("model card")) next.has_model_card = !s.includes("no model card");

  if (s.includes("prompt injection")) next.prompt_injection_testing = !s.includes("no prompt injection");
  if (s.includes("data leakage")) next.data_leakage_testing = !s.includes("no data leakage");
  if (s.includes("allowlist") || s.includes("tool restriction") || s.includes("tool policy")) {
    next.tool_call_restrictions = yesNo(answer, next.tool_call_restrictions);
  }

  if (s.includes("human review") && !next.human_review_trigger) next.human_review_trigger = answer.trim().slice(0, 180);
  if (s.includes("appeal") || s.includes("recourse")) next.appeal_mechanism = yesNo(answer, next.appeal_mechanism);
  if (s.includes("incident playbook") || s.includes("incident response")) {
    next.incident_response_playbook = yesNo(answer, next.incident_response_playbook);
  }

  if (s.includes("metric") || s.includes("monitor")) {
    const parsed = splitTokens(answer);
    if (parsed.length) next.monitoring_metrics = parsed;
  }

  if (s.includes("alert threshold")) next.alert_threshold_defined = yesNo(answer, next.alert_threshold_defined);
  if (s.includes("equalized") || s.includes("demographic parity") || s.includes("fairness method")) {
    next.fairness_method = answer.trim().slice(0, 180);
  }
  if (s.includes("shap") || s.includes("lime") || s.includes("explain") || s.includes("model card")) {
    next.explanation_mechanism = answer.trim().slice(0, 180);
  }
  if (s.includes("nist") || s.includes("iso") || s.includes("eu ai act")) {
    next.compliance_frameworks = Array.from(new Set([...next.compliance_frameworks, ...splitTokens(answer)]));
  }

  const appendedNotes = [next.notes || "", answer].filter(Boolean).join("\n");
  next.notes = appendedNotes.slice(0, 2000);
  return next;
}

function completionPercent(profile: AI_System_Profile) {
  const core = fieldSpecs.filter((s) => s.requiredForCore);
  const deep = fieldSpecs.filter((s) => s.requiredForDeep);
  const coreDone = core.filter((s) => fieldFilled(profile, s.key)).length;
  const deepDone = deep.filter((s) => fieldFilled(profile, s.key)).length;
  const baselineCoreDone = core.filter((s) => fieldFilled(defaultSystemProfile, s.key)).length;
  const baselineDeepDone = deep.filter((s) => fieldFilled(defaultSystemProfile, s.key)).length;

  const total = core.length + deep.length;
  const baseline = baselineCoreDone + baselineDeepDone;
  const current = coreDone + deepDone;
  const denominator = Math.max(1, total - baseline);
  const adjusted = ((current - baseline) / denominator) * 100;

  return Math.max(0, Math.min(100, Math.round(adjusted)));
}

function profileIsReady(profile: AI_System_Profile) {
  return nextMissingField(profile, "core") === null;
}

function buildGuidedQuestion(profile: AI_System_Profile) {
  const coreMissing = nextMissingField(profile, "core");
  if (coreMissing) {
    return {
      stage: "core" as const,
      question: `Continue the interview. Ask exactly one concise question to collect: ${coreMissing.label}. Question: ${coreMissing.question}`,
    };
  }

  const risk = evaluateRiskTier(profile);
  if (risk.level === "Low") {
    return {
      stage: "done" as const,
      question:
        "Core intake is complete. Briefly confirm if the user wants to continue with deep-dive governance details or finalize now.",
    };
  }

  const deepMissing = nextMissingField(profile, "deep");
  if (deepMissing) {
    return {
      stage: "deep" as const,
      question: `Core is complete and risk is ${risk.level}. Ask exactly one deep-dive question for: ${deepMissing.label}. Question: ${deepMissing.question}`,
    };
  }

  return {
    stage: "done" as const,
    question: "All required core and deep-dive fields are complete. Ask the user to finalize the interview.",
  };
}

export function InterviewAgentPanel({ profile, systemId, onProfileChange, onPersist, onComplete }: InterviewAgentPanelProps) {
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi, I am Aegis. I will complete Core risk intake first, then Deep Dive if needed.",
    },
  ]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState("");

  const sessionRef = useRef<RealtimeVoiceSession | null>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const progress = useMemo(() => completionPercent(profile), [profile]);
  const openAIConnected = hasOpenAIConfigured();

  const askNextGuidedQuestion = (targetProfile: AI_System_Profile) => {
    const guidance = buildGuidedQuestion(targetProfile);
    setStatus(`Interview stage: ${guidance.stage.toUpperCase()}`);
    if (connected) {
      sessionRef.current?.promptAssistant(guidance.question);
    }
  };

  const ensureSession = () => {
    if (sessionRef.current) return sessionRef.current;

    sessionRef.current = createRealtimeVoiceSession({
      onUserTranscript: (text) => {
        setChat((prev) => [...prev, { role: "user", text }]);
        const patched = mergeTranscriptIntoProfile(text, profileRef.current);
        onProfileChange(patched);
        askNextGuidedQuestion(patched);
      },
      onAssistantTranscript: (text) => {
        setChat((prev) => [...prev, { role: "assistant", text }]);
      },
      onConnectionChange: (isConnected) => {
        setConnected(isConnected);
        setStatus(isConnected ? "Realtime call connected." : "Realtime call disconnected.");
      },
      onStatus: (message) => {
        setStatus(message);
      },
      onError: (message) => {
        setStatus(message);
      },
    });

    return sessionRef.current;
  };

  useEffect(() => {
    return () => {
      sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, []);

  const startCall = async () => {
    setIsBusy(true);
    try {
      const session = ensureSession();
      await session.start();
      askNextGuidedQuestion(profileRef.current);
    } finally {
      setIsBusy(false);
    }
  };

  const stopCall = () => {
    sessionRef.current?.stop();
    setConnected(false);
  };

  const sendText = async () => {
    const text = input.trim();
    if (!text) return;

    setChat((prev) => [...prev, { role: "user", text }]);
    const patched = mergeTranscriptIntoProfile(text, profileRef.current);
    onProfileChange(patched);

    if (connected) {
      sessionRef.current?.sendText(text);
      askNextGuidedQuestion(patched);
    } else if (openAIConnected) {
      try {
        setIsBusy(true);
        const turn = await generateAndrewTurn([...chat, { role: "user", text }], patched);
        const next = { ...patched, ...turn.profile_patch };
        onProfileChange(next);
        if (turn.assistant_reply) {
          setChat((prev) => [...prev, { role: "assistant", text: turn.assistant_reply }]);
        }
        askNextGuidedQuestion(next);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to get response from ChatGPT.");
      } finally {
        setIsBusy(false);
      }
    } else {
      setStatus("Not connected. Start live call or configure OpenAI key in Settings.");
    }

    setInput("");
  };

  const saveProfile = () => {
    const record = upsertSystem(systemId, normalizeProfile(profile));
    onPersist(record.id);
    setStatus("Interview draft saved.");
  };

  const finalize = () => {
    const normalized = normalizeProfile(profile);
    const record = upsertSystem(systemId, normalized);
    onPersist(record.id);
    onComplete(normalized);
    setStatus("Interview completed. Questionnaire is ready for downstream governance steps.");
  };

  return (
    <Card className="h-full bg-surface">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Aegis Realtime Voice Interview
          </span>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </CardTitle>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-muted-foreground">
          ChatGPT Realtime: {openAIConnected ? "Configured" : "Not configured"} | Call: {connected ? "Live" : "Idle"}
        </div>
      </CardHeader>

      <CardContent className="flex h-[calc(100vh-220px)] flex-col gap-3">
        <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3 space-y-3">
          {chat.map((message, idx) => (
            <div
              key={`${message.role}-${idx}`}
              className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
                message.role === "assistant" ? "bg-aiBubble text-foreground" : "ml-auto bg-userBubble text-primary-foreground"
              }`}
            >
              {message.text}
            </div>
          ))}
          {isBusy ? (
            <div className="max-w-[88%] rounded-lg px-3 py-2 text-sm bg-aiBubble text-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting realtime call...
            </div>
          ) : null}
        </div>

        {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}

        <div className="flex gap-2">
          {!connected ? (
            <Button type="button" onClick={startCall} disabled={isBusy || !openAIConnected}>
              <Mic className="mr-1 h-4 w-4" />
              Start live call
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={stopCall}>
              <MicOff className="mr-1 h-4 w-4" />
              End call
            </Button>
          )}

          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type and send to Aegis during the call"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void sendText();
              }
            }}
          />
          <Button type="button" onClick={() => void sendText()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={saveProfile} className="gap-2">
            <Save className="h-4 w-4" />
            Save interview
          </Button>
          <Button type="button" onClick={finalize} disabled={!profileIsReady(profile)}>
            Complete interview and keep questionnaire editable
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
