import type { ControlCategory } from "@/types/aegis";

export type StandardId =
  | "EU_AI_ACT"
  | "NIST_AI_RMF"
  | "ISO_42001"
  | "UK_AI_PRINCIPLES"
  | "SG_AI_VERIFY"
  | "TW_FSC_AI";

export interface StandardSource {
  id: StandardId;
  name: string;
  region: string;
  authority: string;
  url: string;
  short: string;
}

export const STANDARDS: Record<StandardId, StandardSource> = {
  EU_AI_ACT: {
    id: "EU_AI_ACT",
    name: "EU AI Act (Regulation 2024/1689)",
    region: "European Union",
    authority: "European Commission",
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    short: "EU AI Act",
  },
  NIST_AI_RMF: {
    id: "NIST_AI_RMF",
    name: "NIST AI Risk Management Framework 1.0",
    region: "United States",
    authority: "NIST",
    url: "https://www.nist.gov/itl/ai-risk-management-framework",
    short: "NIST AI RMF",
  },
  ISO_42001: {
    id: "ISO_42001",
    name: "ISO/IEC 42001:2023 — AI Management System",
    region: "International",
    authority: "ISO/IEC",
    url: "https://www.iso.org/standard/81230.html",
    short: "ISO 42001",
  },
  UK_AI_PRINCIPLES: {
    id: "UK_AI_PRINCIPLES",
    name: "UK Pro-Innovation AI Regulation Principles",
    region: "United Kingdom",
    authority: "UK Government / DSIT",
    url: "https://www.gov.uk/government/publications/ai-regulation-a-pro-innovation-approach",
    short: "UK AI Principles",
  },
  SG_AI_VERIFY: {
    id: "SG_AI_VERIFY",
    name: "Singapore AI Verify Framework / Model AI Governance Framework",
    region: "Singapore",
    authority: "IMDA / PDPC",
    url: "https://aiverifyfoundation.sg/",
    short: "SG AI Verify",
  },
  TW_FSC_AI: {
    id: "TW_FSC_AI",
    name: "Core Principles and Policies for the Use of AI in the Financial Industry",
    region: "Taiwan",
    authority: "Financial Supervisory Commission (FSC)",
    url: "https://www.fsc.gov.tw/en/home.jsp?id=253&parentpath=0,2",
    short: "TW FSC AI Guidelines",
  },
};

export interface StandardClause {
  standard: StandardId;
  clause: string;
  title: string;
}

// Map control categories to representative clauses across each standard.
// Citations are deliberately concise; full text lives in the standard URL.
export const CATEGORY_CLAUSES: Record<ControlCategory, StandardClause[]> = {
  "Governance/Accountability": [
    { standard: "EU_AI_ACT", clause: "Art. 17", title: "Quality management system" },
    { standard: "NIST_AI_RMF", clause: "GOVERN 1-6", title: "Govern function" },
    { standard: "ISO_42001", clause: "Cl. 5", title: "Leadership & accountability" },
    { standard: "UK_AI_PRINCIPLES", clause: "P5", title: "Accountability & governance" },
    { standard: "SG_AI_VERIFY", clause: "MGF §3", title: "Internal governance structures" },
    { standard: "TW_FSC_AI", clause: "P1", title: "Establish governance & accountability" },
  ],
  Lifecycle: [
    { standard: "EU_AI_ACT", clause: "Art. 9", title: "Risk management system" },
    { standard: "NIST_AI_RMF", clause: "MAP 1-5", title: "Map context & risks" },
    { standard: "ISO_42001", clause: "Cl. 8", title: "Operation & lifecycle controls" },
    { standard: "SG_AI_VERIFY", clause: "MGF §4", title: "Operations management" },
    { standard: "TW_FSC_AI", clause: "P3", title: "Lifecycle risk management" },
  ],
  Robustness: [
    { standard: "EU_AI_ACT", clause: "Art. 15", title: "Accuracy, robustness & cybersecurity" },
    { standard: "NIST_AI_RMF", clause: "MEASURE 2.5-2.7", title: "Performance & robustness" },
    { standard: "ISO_42001", clause: "Annex A.6.2.4", title: "AI system performance" },
    { standard: "TW_FSC_AI", clause: "P4", title: "System resilience & robustness" },
  ],
  Fairness: [
    { standard: "EU_AI_ACT", clause: "Art. 10", title: "Data & data governance (bias)" },
    { standard: "NIST_AI_RMF", clause: "MEASURE 2.11", title: "Bias evaluation" },
    { standard: "UK_AI_PRINCIPLES", clause: "P3", title: "Fairness" },
    { standard: "SG_AI_VERIFY", clause: "Pillar: Fairness", title: "Fairness testing" },
    { standard: "TW_FSC_AI", clause: "P2", title: "Fair treatment of customers" },
  ],
  Safety: [
    { standard: "EU_AI_ACT", clause: "Art. 9 & 15", title: "Safety risk controls" },
    { standard: "NIST_AI_RMF", clause: "MANAGE 2.3", title: "Treat safety risks" },
    { standard: "UK_AI_PRINCIPLES", clause: "P1", title: "Safety, security & robustness" },
    { standard: "ISO_42001", clause: "Annex A.6.2.6", title: "AI system safety" },
  ],
  Explainability: [
    { standard: "EU_AI_ACT", clause: "Art. 13", title: "Transparency & info to users" },
    { standard: "NIST_AI_RMF", clause: "MEASURE 2.8-2.9", title: "Explainability & interpretability" },
    { standard: "UK_AI_PRINCIPLES", clause: "P2", title: "Transparency & explainability" },
    { standard: "SG_AI_VERIFY", clause: "Pillar: Explainability", title: "Model explainability" },
    { standard: "TW_FSC_AI", clause: "P5", title: "Transparency & explainability" },
  ],
  Monitoring: [
    { standard: "EU_AI_ACT", clause: "Art. 72", title: "Post-market monitoring" },
    { standard: "NIST_AI_RMF", clause: "MANAGE 4", title: "Continuous monitoring" },
    { standard: "ISO_42001", clause: "Cl. 9", title: "Performance evaluation" },
    { standard: "TW_FSC_AI", clause: "P6", title: "Continuous monitoring & review" },
  ],
  "Human Oversight": [
    { standard: "EU_AI_ACT", clause: "Art. 14", title: "Human oversight" },
    { standard: "NIST_AI_RMF", clause: "GOVERN 3.2", title: "Human-AI configuration" },
    { standard: "UK_AI_PRINCIPLES", clause: "P4", title: "Contestability & redress" },
    { standard: "SG_AI_VERIFY", clause: "MGF §5", title: "Human-over-the-loop" },
    { standard: "TW_FSC_AI", clause: "P7", title: "Human oversight & accountability" },
  ],
};

export function clausesForCategory(category: ControlCategory): StandardClause[] {
  return CATEGORY_CLAUSES[category] ?? [];
}

export function getStandard(id: StandardId): StandardSource {
  return STANDARDS[id];
}

export function allStandards(): StandardSource[] {
  return Object.values(STANDARDS);
}

export function formatCitation(clause: StandardClause): string {
  const std = STANDARDS[clause.standard];
  return `${std.short} ${clause.clause} — ${clause.title}`;
}
