import type { AI_System_Profile, AegisActivityRecord, AegisSystemRecord } from "@/types/aegis";

const SEED_FLAG = "aegis:demo-seeded";
const SYSTEMS_KEY = "aegis:systems";
const ACTIVITY_KEY = "aegis:activity";
const CONTROL_PROGRESS_KEY = "aegis:control-progress";
const CONTROL_STATUS_KEY = "aegis:control-status";
const CONTROL_EVIDENCE_KEY = "aegis:control-evidence";

const demoProfile: AI_System_Profile = {
  system_name: "Atlas Customer Support Copilot",
  use_case_summary:
    "Conversational AI assistant that drafts replies for human agents in a B2B SaaS support workflow, grounded in product documentation via RAG.",
  model_type: "LLM_RAG",
  customer_facing: true,
  impact_level: "Medium",
  uses_personal_data: true,
  decision_automation: "Partial",
  domain: "customer_support",
  decision_context:
    "Suggested replies are reviewed by a human agent before being sent. The model never auto-sends customer-facing messages.",
  affected_stakeholders: ["End customers", "Support agents", "Product team"],
  high_risk_decision: false,
  data_sources: ["Zendesk tickets", "Internal product docs", "Stripe billing metadata"],
  sensitive_data_types: ["Email addresses", "Account identifiers", "Limited billing context"],
  data_retention_policy: "Conversation logs retained 90 days, then anonymized. Embeddings refreshed weekly.",
  cross_border_data_transfer: true,
  third_party_data_sharing: false,
  deployment: "external",
  model_provider: "OpenAI",
  model_version: "gpt-4o-2024-11",
  change_management_process: true,
  has_robustness_testing: true,
  has_fairness_testing: false,
  has_safety_testing: true,
  has_model_card: true,
  prompt_injection_testing: true,
  data_leakage_testing: true,
  tool_call_restrictions: true,
  human_review_trigger: "All outbound replies require agent approval; flagged tickets escalate to lead.",
  appeal_mechanism: true,
  incident_response_playbook: true,
  monitoring_metrics: ["Hallucination rate", "Agent override rate", "Latency p95", "Refusal rate"],
  alert_threshold_defined: true,
  fairness_method: "Sampled review of replies across customer segments (geography, plan tier).",
  explanation_mechanism: "Each reply links to the source documentation chunk it was grounded in.",
  compliance_frameworks: ["NIST AI RMF", "ISO 42001", "SOC 2 Type II"],
  notes: "Demo system pre-loaded by Aegis AI to showcase the end-to-end governance workflow.",
};

// Pre-selected control IDs that exist in controls-kb.ts
const completedWithEvidence = [
  "gov_001", // governance owner
  "life_002", // dataset versioning
  "rob_001", // robustness testing baseline (assumed prefix)
  "safe_001",
];
const completedNoEvidence = ["gov_002", "gov_006"];
const inProgressControls = ["gov_005", "fair_001", "expl_001"];

function safeWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota / unavailable
  }
}

function nowMinus(daysAgo: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

function buildSystem(): AegisSystemRecord {
  return {
    id: "sys_demo_atlas",
    created_at: nowMinus(14),
    updated_at: nowMinus(1, 3),
    profile: demoProfile,
  };
}

function buildActivity(systemId: string, systemName: string): AegisActivityRecord[] {
  return [
    {
      id: "act_demo_5",
      type: "reported",
      system_id: systemId,
      system_name: systemName,
      details: "Generated NIST AI RMF report (PDF + DOCX + XLSX).",
      created_at: nowMinus(0, 4),
    },
    {
      id: "act_demo_4",
      type: "assessed",
      system_id: systemId,
      system_name: systemName,
      details: "Residual risk recalculated → Low (after 4 controls completed).",
      created_at: nowMinus(1, 2),
    },
    {
      id: "act_demo_3",
      type: "updated",
      system_id: systemId,
      system_name: systemName,
      details: "Uploaded evidence: prompt-injection test report (PDF, 412 KB).",
      created_at: nowMinus(3),
    },
    {
      id: "act_demo_2",
      type: "assessed",
      system_id: systemId,
      system_name: systemName,
      details: "Inherent risk computed → Medium (customer-facing + personal data).",
      created_at: nowMinus(10),
    },
    {
      id: "act_demo_1",
      type: "created",
      system_id: systemId,
      system_name: systemName,
      details: "Created AI system profile via guided interview.",
      created_at: nowMinus(14),
    },
  ];
}

function buildEvidence(systemId: string) {
  const map: Record<string, Record<string, unknown[]>> = {};
  map[systemId] = {
    gov_001: [
      {
        id: "ev_demo_1",
        name: "AI Governance Owner Charter.pdf",
        size: 184320,
        mime_type: "application/pdf",
        uploaded_at: nowMinus(12),
      },
    ],
    life_002: [
      {
        id: "ev_demo_2",
        name: "dataset-manifest-v3.json",
        size: 24576,
        mime_type: "application/json",
        uploaded_at: nowMinus(7),
      },
    ],
    rob_001: [
      {
        id: "ev_demo_3",
        name: "Robustness Test Report Q1.pdf",
        size: 421888,
        mime_type: "application/pdf",
        uploaded_at: nowMinus(5),
      },
    ],
    safe_001: [
      {
        id: "ev_demo_4",
        name: "Prompt Injection Eval.pdf",
        size: 312320,
        mime_type: "application/pdf",
        uploaded_at: nowMinus(3),
      },
      {
        id: "ev_demo_5",
        name: "tool-allowlist.yaml",
        size: 1840,
        mime_type: "text/yaml",
        uploaded_at: nowMinus(3),
      },
    ],
  };
  return map;
}

function buildControlState(systemId: string) {
  const status: Record<string, Record<string, "not_started" | "in_progress" | "completed">> = {};
  status[systemId] = {};
  for (const id of completedWithEvidence) status[systemId][id] = "completed";
  for (const id of completedNoEvidence) status[systemId][id] = "completed";
  for (const id of inProgressControls) status[systemId][id] = "in_progress";

  const progress: Record<string, string[]> = {};
  progress[systemId] = [...completedWithEvidence, ...completedNoEvidence];

  return { status, progress };
}

/**
 * Seed demo data into localStorage on first visit.
 * Idempotent — checks the SEED_FLAG before writing.
 * Only seeds if the user has no existing systems (prevents wiping real data).
 */
export function seedDemoDataIfNeeded(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(SEED_FLAG) === "true") return;

    const existingRaw = localStorage.getItem(SYSTEMS_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as unknown[]) : [];
    if (Array.isArray(existing) && existing.length > 0) {
      // User already has systems — don't overwrite, just mark as seeded.
      localStorage.setItem(SEED_FLAG, "true");
      return;
    }

    const system = buildSystem();
    safeWrite(SYSTEMS_KEY, [system]);
    safeWrite(ACTIVITY_KEY, buildActivity(system.id, system.profile.system_name));
    safeWrite(CONTROL_EVIDENCE_KEY, buildEvidence(system.id));
    const { status, progress } = buildControlState(system.id);
    safeWrite(CONTROL_STATUS_KEY, status);
    safeWrite(CONTROL_PROGRESS_KEY, progress);

    localStorage.setItem(SEED_FLAG, "true");
  } catch {
    // Storage may be unavailable (private mode); silently skip.
  }
}

/** Force re-seed by clearing the flag and any existing demo system. */
export function resetDemoData(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SEED_FLAG);
    localStorage.removeItem(SYSTEMS_KEY);
    localStorage.removeItem(ACTIVITY_KEY);
    localStorage.removeItem(CONTROL_PROGRESS_KEY);
    localStorage.removeItem(CONTROL_STATUS_KEY);
    localStorage.removeItem(CONTROL_EVIDENCE_KEY);
    seedDemoDataIfNeeded();
  } catch {
    // ignore
  }
}