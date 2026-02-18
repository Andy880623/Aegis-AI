export type ModelType = "ML" | "LLM" | "LLM_RAG";
export type ImpactLevel = "Low" | "Medium" | "High";
export type DecisionAutomation = "HumanReview" | "Partial" | "FullyAutomated";
export type Domain =
  | "lending"
  | "marketing"
  | "customer_support"
  | "internal_ops"
  | "other"
  | "hiring"
  | "pricing"
  | "fraud";
export type Deployment = "internal" | "external" | "both";
export type RiskLevel = "Low" | "Medium" | "High";
export type ControlPriority = "High" | "Recommended" | "Optional";
export type ControlCategory =
  | "Governance/Accountability"
  | "Lifecycle"
  | "Robustness"
  | "Fairness"
  | "Safety"
  | "Explainability"
  | "Monitoring"
  | "Human Oversight";

export interface AI_System_Profile {
  system_name: string;
  use_case_summary: string;
  model_type: ModelType;
  customer_facing: boolean;
  impact_level: ImpactLevel;
  uses_personal_data: boolean;
  decision_automation: DecisionAutomation;
  domain: Domain;
  decision_context: string;
  affected_stakeholders: string[];
  high_risk_decision: boolean;
  data_sources: string[];
  sensitive_data_types: string[];
  data_retention_policy: string;
  cross_border_data_transfer: boolean;
  third_party_data_sharing: boolean;
  deployment: Deployment;
  model_provider: string;
  model_version: string;
  change_management_process: boolean;
  has_robustness_testing: boolean;
  has_fairness_testing: boolean;
  has_safety_testing: boolean;
  has_model_card: boolean;
  prompt_injection_testing: boolean;
  data_leakage_testing: boolean;
  tool_call_restrictions: boolean;
  human_review_trigger: string;
  appeal_mechanism: boolean;
  incident_response_playbook: boolean;
  monitoring_metrics: string[];
  alert_threshold_defined: boolean;
  fairness_method: string;
  explanation_mechanism: string;
  compliance_frameworks: string[];
  notes?: string;
}

export interface RiskTierResult {
  level: RiskLevel;
  triggers: string[];
  rationale: string[];
}

export interface GapDimension {
  required: boolean;
  gaps: string[];
}

export interface ValidationGapsResult {
  robustness: GapDimension;
  fairness: GapDimension;
  safety: GapDimension;
  explainability: GapDimension;
}

export interface ControlTemplate {
  objective: string;
  steps: string[];
  suggested_tools: string[];
  evidence: string[];
}

export interface ControlDefinition {
  id: string;
  title: string;
  category: ControlCategory;
  description: string;
  applicability_rules: string[];
  priority_rule: string;
  how_to_template: ControlTemplate;
  isApplicable: (context: ControlEvalContext) => boolean;
  getPriority: (context: ControlEvalContext) => ControlPriority;
}

export interface GeneratedControl extends ControlDefinition {
  priority: ControlPriority;
}

export interface ControlEvalContext {
  profile: AI_System_Profile;
  risk: RiskTierResult;
  gaps: ValidationGapsResult;
}

export interface AegisSystemRecord {
  id: string;
  created_at: string;
  updated_at: string;
  profile: AI_System_Profile;
}

export interface AegisActivityRecord {
  id: string;
  type: "created" | "updated" | "assessed" | "reported";
  system_id: string;
  system_name: string;
  created_at: string;
  details: string;
}
