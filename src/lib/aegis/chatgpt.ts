import type { AI_System_Profile } from "@/types/aegis";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

type AndrewTurnResult = {
  assistant_reply: string;
  profile_patch: Partial<AI_System_Profile>;
  ready_for_assessment: boolean;
};

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

const allowedModelTypes = new Set(["ML", "LLM", "LLM_RAG"]);
const allowedImpactLevels = new Set(["Low", "Medium", "High"]);
const allowedDecisionAutomation = new Set(["HumanReview", "Partial", "FullyAutomated"]);
const allowedDomains = new Set(["lending", "marketing", "customer_support", "internal_ops", "other"]);
const allowedDeployment = new Set(["internal", "external", "both"]);

export function getOpenAIConfig() {
  const envKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim() || "";
  const envModel = (import.meta.env.VITE_OPENAI_MODEL as string | undefined)?.trim() || "";

  return {
    apiKey: envKey,
    model: envModel || "gpt-4.1-mini",
  };
}

export function hasOpenAIConfigured() {
  return !!getOpenAIConfig().apiKey;
}

function boolOrUndefined(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}

function stringArrayOrUndefined(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const next = value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  return next.length ? next : [];
}

function sanitizePatch(patch: unknown): Partial<AI_System_Profile> {
  if (!patch || typeof patch !== "object") return {};
  const raw = patch as Record<string, unknown>;
  const next: Partial<AI_System_Profile> = {};

  if (typeof raw.system_name === "string") next.system_name = raw.system_name.trim();
  if (allowedModelTypes.has(String(raw.model_type))) next.model_type = raw.model_type as AI_System_Profile["model_type"];
  if (typeof raw.customer_facing === "boolean") next.customer_facing = raw.customer_facing;
  if (allowedImpactLevels.has(String(raw.impact_level))) next.impact_level = raw.impact_level as AI_System_Profile["impact_level"];
  if (typeof raw.uses_personal_data === "boolean") next.uses_personal_data = raw.uses_personal_data;
  if (allowedDecisionAutomation.has(String(raw.decision_automation))) {
    next.decision_automation = raw.decision_automation as AI_System_Profile["decision_automation"];
  }
  if (allowedDomains.has(String(raw.domain))) next.domain = raw.domain as AI_System_Profile["domain"];
  if (allowedDeployment.has(String(raw.deployment))) next.deployment = raw.deployment as AI_System_Profile["deployment"];
  if (typeof raw.has_robustness_testing === "boolean") next.has_robustness_testing = raw.has_robustness_testing;
  if (typeof raw.has_fairness_testing === "boolean") next.has_fairness_testing = raw.has_fairness_testing;
  if (typeof raw.has_safety_testing === "boolean") next.has_safety_testing = raw.has_safety_testing;
  if (typeof raw.has_model_card === "boolean") next.has_model_card = raw.has_model_card;
  if (typeof raw.notes === "string") next.notes = raw.notes.trim();

  const sources = stringArrayOrUndefined(raw.data_sources);
  if (sources) next.data_sources = sources;

  return next;
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function parseTurn(rawText: string): AndrewTurnResult {
  const jsonChunk = extractFirstJsonObject(rawText);
  if (!jsonChunk) {
    return {
      assistant_reply: rawText.trim() || "I need a bit more detail before finalizing risk identification.",
      profile_patch: {},
      ready_for_assessment: false,
    };
  }

  try {
    const parsed = JSON.parse(jsonChunk) as Record<string, unknown>;
    return {
      assistant_reply:
        typeof parsed.assistant_reply === "string"
          ? parsed.assistant_reply.trim()
          : "Thanks. Please continue with risk-relevant details.",
      profile_patch: sanitizePatch(parsed.profile_patch),
      ready_for_assessment: boolOrUndefined(parsed.ready_for_assessment) ?? false,
    };
  } catch {
    return {
      assistant_reply: rawText.trim() || "I need a bit more detail before finalizing risk identification.",
      profile_patch: {},
      ready_for_assessment: false,
    };
  }
}

function buildSystemPrompt(profile: AI_System_Profile) {
  return [
    "You are Aegis, an AI governance interviewer.",
    "Speak in concise professional English.",
    "Goal: perform risk identification interview only.",
    "Ask dynamic follow-up questions based on user answers.",
    "Never ask unrelated questions.",
    "Extract and update these fields when evidence exists:",
    "system_name, model_type, customer_facing, impact_level, uses_personal_data, decision_automation, domain, data_sources, deployment, has_robustness_testing, has_fairness_testing, has_safety_testing, has_model_card, notes.",
    "Return STRICT JSON object with keys:",
    "assistant_reply (string), profile_patch (object), ready_for_assessment (boolean).",
    "Set ready_for_assessment=true only when enough risk-identification information is present.",
    `Current profile snapshot: ${JSON.stringify(profile)}`,
  ].join("\n");
}

function extractOutputText(payload: Record<string, unknown>): string {
  if (typeof payload.output_text === "string") return payload.output_text;

  const output = payload.output;
  if (!Array.isArray(output)) return "";
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      const text = (block as Record<string, unknown>).text;
      if (typeof text === "string" && text.trim()) return text;
    }
  }
  return "";
}

export async function generateAndrewTurn(
  history: ChatMessage[],
  profile: AI_System_Profile
): Promise<AndrewTurnResult> {
  const { apiKey, model } = getOpenAIConfig();
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  const conversation = history
    .slice(-12)
    .map((message) => `${message.role === "assistant" ? "Aegis" : "User"}: ${message.text}`)
    .join("\n");

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: buildSystemPrompt(profile) }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: `Conversation:\n${conversation}\n\nReturn strict JSON now.` }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const outputText = extractOutputText(payload);
  return parseTurn(outputText);
}
