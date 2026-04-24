import type { AI_System_Profile, AegisActivityRecord, AegisSystemRecord } from "@/types/aegis";

const SEED_FLAG = "aegis:demo-seeded";
const SEED_VERSION = "v2"; // bump to re-seed existing visitors
const SYSTEMS_KEY = "aegis:systems";
const ACTIVITY_KEY = "aegis:activity";
const CONTROL_PROGRESS_KEY = "aegis:control-progress";
const CONTROL_STATUS_KEY = "aegis:control-status";
const CONTROL_EVIDENCE_KEY = "aegis:control-evidence";

// =====================================================================
// SYSTEM 1 — Medium risk · LLM_RAG · customer support copilot
// =====================================================================
const atlasProfile: AI_System_Profile = {
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

// =====================================================================
// SYSTEM 2 — High risk · ML · automated pricing decisions
// =====================================================================
const lumenProfile: AI_System_Profile = {
  system_name: "Lumen Dynamic Pricing Engine",
  use_case_summary:
    "Machine-learning model that sets real-time prices for an e-commerce marketplace. Decisions are applied automatically without human review and directly affect customer transactions.",
  model_type: "ML",
  customer_facing: true,
  impact_level: "High",
  uses_personal_data: true,
  decision_automation: "FullyAutomated",
  domain: "pricing",
  decision_context:
    "Prices update every 5 minutes based on demand, inventory, and customer segment signals. There is no human in the loop for individual pricing decisions.",
  affected_stakeholders: ["End customers", "Merchants", "Revenue team", "Legal"],
  high_risk_decision: true,
  data_sources: [
    "Order history",
    "Customer segments",
    "Competitor scraping feed",
    "Inventory levels",
  ],
  sensitive_data_types: ["Customer identifiers", "Purchase history", "Geolocation"],
  data_retention_policy: "Training data retained 24 months. Inference logs retained 12 months.",
  cross_border_data_transfer: true,
  third_party_data_sharing: true,
  deployment: "external",
  model_provider: "In-house",
  model_version: "lumen-pricing-v4.2",
  change_management_process: true,
  has_robustness_testing: false,
  has_fairness_testing: false,
  has_safety_testing: false,
  has_model_card: false,
  prompt_injection_testing: false,
  data_leakage_testing: false,
  tool_call_restrictions: false,
  human_review_trigger: "No per-decision review. Daily anomaly report reviewed by revenue lead.",
  appeal_mechanism: false,
  incident_response_playbook: false,
  monitoring_metrics: ["Price variance", "Revenue impact", "Customer complaints"],
  alert_threshold_defined: false,
  fairness_method: "",
  explanation_mechanism: "",
  compliance_frameworks: ["NIST AI RMF"],
  notes: "High-risk demo: fully automated pricing with personal data and weak validation maturity.",
};

// =====================================================================
// SYSTEM 3 — Low risk · LLM · internal-only knowledge search
// =====================================================================
const sageProfile: AI_System_Profile = {
  system_name: "Sage Internal Knowledge Search",
  use_case_summary:
    "Internal-only natural-language search over engineering wiki and runbooks. Used by employees to find documentation faster.",
  model_type: "LLM",
  customer_facing: false,
  impact_level: "Low",
  uses_personal_data: false,
  decision_automation: "HumanReview",
  domain: "internal_ops",
  decision_context:
    "Returns ranked document snippets to engineers; users always read the source before acting. No automated decisions are made.",
  affected_stakeholders: ["Engineering team", "Internal employees"],
  high_risk_decision: false,
  data_sources: ["Confluence wiki", "GitHub README files", "Internal runbooks"],
  sensitive_data_types: [],
  data_retention_policy: "Query logs retained 30 days for relevance tuning, then deleted.",
  cross_border_data_transfer: false,
  third_party_data_sharing: false,
  deployment: "internal",
  model_provider: "Anthropic",
  model_version: "claude-3-5-haiku",
  change_management_process: true,
  has_robustness_testing: true,
  has_fairness_testing: false,
  has_safety_testing: true,
  has_model_card: true,
  prompt_injection_testing: true,
  data_leakage_testing: true,
  tool_call_restrictions: true,
  human_review_trigger: "All results are advisory; users review source documents before acting.",
  appeal_mechanism: false,
  incident_response_playbook: true,
  monitoring_metrics: ["Click-through rate", "Query latency", "Refusal rate"],
  alert_threshold_defined: true,
  fairness_method: "",
  explanation_mechanism: "Each answer cites the source document and section.",
  compliance_frameworks: ["NIST AI RMF"],
  notes: "Low-risk demo: internal-only, no personal data, mature validation practices.",
};

// ---------------------------------------------------------------------
// Per-system control state
// ---------------------------------------------------------------------
type SystemSeed = {
  id: string;
  profile: AI_System_Profile;
  createdDaysAgo: number;
  updatedDaysAgo: number;
  updatedHoursAgo?: number;
  completedWithEvidence: string[];
  completedNoEvidence: string[];
  inProgress: string[];
  evidence: Record<string, Array<{ name: string; size: number; mime_type: string; daysAgo: number }>>;
  activity: Array<{
    type: AegisActivityRecord["type"];
    details: string;
    daysAgo: number;
    hoursAgo?: number;
  }>;
};

const SYSTEM_SEEDS: SystemSeed[] = [
  {
    id: "sys_demo_atlas",
    profile: atlasProfile,
    createdDaysAgo: 14,
    updatedDaysAgo: 1,
    updatedHoursAgo: 3,
    completedWithEvidence: ["gov_001", "life_002", "rob_001", "safe_001"],
    completedNoEvidence: ["gov_002", "gov_006"],
    inProgress: ["gov_005", "fair_001", "expl_001"],
    evidence: {
      gov_001: [{ name: "AI Governance Owner Charter.pdf", size: 184320, mime_type: "application/pdf", daysAgo: 12 }],
      life_002: [{ name: "dataset-manifest-v3.json", size: 24576, mime_type: "application/json", daysAgo: 7 }],
      rob_001: [{ name: "Robustness Test Report Q1.pdf", size: 421888, mime_type: "application/pdf", daysAgo: 5 }],
      safe_001: [
        { name: "Prompt Injection Eval.pdf", size: 312320, mime_type: "application/pdf", daysAgo: 3 },
        { name: "tool-allowlist.yaml", size: 1840, mime_type: "text/yaml", daysAgo: 3 },
      ],
    },
    activity: [
      { type: "reported", details: "Generated NIST AI RMF report (PDF + DOCX + XLSX).", daysAgo: 0, hoursAgo: 4 },
      { type: "assessed", details: "Residual risk recalculated → Low (after 4 controls completed).", daysAgo: 1, hoursAgo: 2 },
      { type: "updated", details: "Uploaded evidence: prompt-injection test report (PDF, 412 KB).", daysAgo: 3 },
      { type: "assessed", details: "Inherent risk computed → Medium (customer-facing + personal data).", daysAgo: 10 },
      { type: "created", details: "Created AI system profile via guided interview.", daysAgo: 14 },
    ],
  },
  {
    id: "sys_demo_lumen",
    profile: lumenProfile,
    createdDaysAgo: 6,
    updatedDaysAgo: 0,
    updatedHoursAgo: 8,
    // High-risk system with weak control coverage — plenty of red on the dashboard
    completedWithEvidence: ["gov_001"],
    completedNoEvidence: ["gov_002"],
    inProgress: ["gov_003", "gov_004", "gov_007", "life_002", "rob_001", "fair_001"],
    evidence: {
      gov_001: [
        { name: "Pricing Governance Charter.pdf", size: 142336, mime_type: "application/pdf", daysAgo: 5 },
      ],
    },
    activity: [
      { type: "assessed", details: "Inherent risk computed → High (fully automated + customer-facing + personal data).", daysAgo: 0, hoursAgo: 8 },
      { type: "updated", details: "Started 6 controls; awaiting evidence on robustness and fairness testing.", daysAgo: 2 },
      { type: "updated", details: "Added 'Competitor scraping feed' as a data source.", daysAgo: 4 },
      { type: "created", details: "Created AI system profile via guided interview.", daysAgo: 6 },
    ],
  },
  {
    id: "sys_demo_sage",
    profile: sageProfile,
    createdDaysAgo: 28,
    updatedDaysAgo: 2,
    // Low-risk system with strong coverage — mostly green
    completedWithEvidence: ["gov_001", "gov_002", "life_002", "rob_001", "safe_001", "expl_001"],
    completedNoEvidence: ["gov_006"],
    inProgress: [],
    evidence: {
      gov_001: [{ name: "Sage Owner Charter.pdf", size: 96256, mime_type: "application/pdf", daysAgo: 25 }],
      gov_002: [{ name: "Internal AI Policy v2.pdf", size: 218112, mime_type: "application/pdf", daysAgo: 20 }],
      life_002: [{ name: "wiki-snapshot-manifest.json", size: 18432, mime_type: "application/json", daysAgo: 14 }],
      rob_001: [{ name: "Search Relevance Eval.pdf", size: 256000, mime_type: "application/pdf", daysAgo: 10 }],
      safe_001: [{ name: "Internal Prompt Injection Test.pdf", size: 198656, mime_type: "application/pdf", daysAgo: 7 }],
      expl_001: [{ name: "Citation Coverage Report.pdf", size: 142848, mime_type: "application/pdf", daysAgo: 5 }],
    },
    activity: [
      { type: "reported", details: "Generated quarterly governance report (PDF).", daysAgo: 2 },
      { type: "assessed", details: "Residual risk recalculated → Low (6 controls completed with evidence).", daysAgo: 5 },
      { type: "updated", details: "Uploaded citation coverage report.", daysAgo: 5 },
      { type: "assessed", details: "Inherent risk computed → Low (internal-only, no personal data).", daysAgo: 26 },
      { type: "created", details: "Created AI system profile via guided interview.", daysAgo: 28 },
    ],
  },
];

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

function buildAll() {
  const systems: AegisSystemRecord[] = [];
  const activity: AegisActivityRecord[] = [];
  const evidenceMap: Record<string, Record<string, Array<{ id: string; name: string; size: number; mime_type: string; uploaded_at: string }>>> = {};
  const statusMap: Record<string, Record<string, "not_started" | "in_progress" | "completed">> = {};
  const progressMap: Record<string, string[]> = {};

  let actCounter = 0;
  let evCounter = 0;

  for (const seed of SYSTEM_SEEDS) {
    systems.push({
      id: seed.id,
      created_at: nowMinus(seed.createdDaysAgo),
      updated_at: nowMinus(seed.updatedDaysAgo, seed.updatedHoursAgo ?? 0),
      profile: seed.profile,
    });

    for (const a of seed.activity) {
      actCounter += 1;
      activity.push({
        id: `act_demo_${actCounter}`,
        type: a.type,
        system_id: seed.id,
        system_name: seed.profile.system_name,
        details: a.details,
        created_at: nowMinus(a.daysAgo, a.hoursAgo ?? 0),
      });
    }

    const sysEvidence: Record<string, Array<{ id: string; name: string; size: number; mime_type: string; uploaded_at: string }>> = {};
    for (const [controlId, files] of Object.entries(seed.evidence)) {
      sysEvidence[controlId] = files.map((f) => {
        evCounter += 1;
        return {
          id: `ev_demo_${evCounter}`,
          name: f.name,
          size: f.size,
          mime_type: f.mime_type,
          uploaded_at: nowMinus(f.daysAgo),
        };
      });
    }
    evidenceMap[seed.id] = sysEvidence;

    const sysStatus: Record<string, "not_started" | "in_progress" | "completed"> = {};
    for (const id of seed.completedWithEvidence) sysStatus[id] = "completed";
    for (const id of seed.completedNoEvidence) sysStatus[id] = "completed";
    for (const id of seed.inProgress) sysStatus[id] = "in_progress";
    statusMap[seed.id] = sysStatus;
    progressMap[seed.id] = [...seed.completedWithEvidence, ...seed.completedNoEvidence];
  }

  // Newest activity first
  activity.sort((a, b) => b.created_at.localeCompare(a.created_at));
  // Newest system first
  systems.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return { systems, activity, evidenceMap, statusMap, progressMap };
}

/**
 * Seed demo data into localStorage on first visit.
 * Idempotent within a seed version — bump SEED_VERSION to re-seed existing visitors.
 * Only seeds if the user has no existing systems (prevents wiping real data).
 */
export function seedDemoDataIfNeeded(): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(SEED_FLAG) === SEED_VERSION) return;

    const existingRaw = localStorage.getItem(SYSTEMS_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as unknown[]) : [];

    // Detect whether the only existing systems are demo systems from a prior seed.
    // If yes, we may safely refresh them. If the user has any non-demo system, leave everything alone.
    const hasUserData =
      Array.isArray(existing) &&
      existing.some((s: unknown) => {
        if (typeof s !== "object" || s === null) return false;
        const id = (s as { id?: unknown }).id;
        return typeof id !== "string" || !id.startsWith("sys_demo_");
      });

    if (hasUserData) {
      // User has real data — never overwrite. Just mark this seed version as applied.
      localStorage.setItem(SEED_FLAG, SEED_VERSION);
      return;
    }

    const { systems, activity, evidenceMap, statusMap, progressMap } = buildAll();
    safeWrite(SYSTEMS_KEY, systems);
    safeWrite(ACTIVITY_KEY, activity);
    safeWrite(CONTROL_EVIDENCE_KEY, evidenceMap);
    safeWrite(CONTROL_STATUS_KEY, statusMap);
    safeWrite(CONTROL_PROGRESS_KEY, progressMap);

    localStorage.setItem(SEED_FLAG, SEED_VERSION);
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