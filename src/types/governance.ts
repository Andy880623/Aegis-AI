export type SystemType = 'Machine Learning Model' | 'LLM Application' | 'LLM with RAG';
export type ImpactLevel = 'Low' | 'Medium' | 'High';
export type AutomationLevel = 'Fully automated' | 'Human review sometimes' | 'Always human reviewed';
export type RiskTier = 'Low' | 'Medium' | 'High';

export interface InterviewData {
  system_name: string;
  system_type: SystemType;
  is_customer_facing: boolean;
  impact_level: ImpactLevel;
  automation_level: AutomationLevel;
  uses_personal_data: boolean;
  data_sources: string;
  has_robustness_testing: boolean;
  has_bias_testing: boolean;
  has_security_testing: boolean;
  has_model_card: boolean;
}

export interface ValidationGaps {
  robustness: string;
  fairness: string;
  safety: string;
  explainability: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  priority: 'high' | 'recommended';
  objective: string;
  steps: string[];
  tools: string[];
  evidence: string[];
}

export interface GovernanceResult {
  risk_tier: RiskTier;
  risk_explanation: string;
  validation_gaps: ValidationGaps;
  checklist: ChecklistItem[];
  gap_scores: {
    robustness: number;
    fairness: number;
    safety: number;
    explainability: number;
  };
}

export interface Safeguards {
  human_oversight: boolean;
  logging_monitoring: boolean;
  abuse_mitigation: boolean;
  robustness_testing?: boolean;
  bias_testing?: boolean;
  security_testing?: boolean;
  has_model_card?: boolean;
}

export interface CategoryScores {
  privacy: number;
  safety_misuse: number;
  fairness: number;
  transparency: number;
  accountability: number;
}

export interface AIFeature {
  id: string;
  name: string;
  product_name: string | null;
  team: string | null;
  stage: string | null;
  description: string | null;
  ai_type: string | null;
  model_source: string | null;
  autonomy_level: string | null;
  user_data_types: string[];
  external_data_transfer: boolean;
  target_users: string[];
  impact_types: string[];
  safeguards: Safeguards;
  is_customer_facing: boolean;
  impact_level: string | null;
  data_sources: string | null;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  ai_feature_id: string;
  risk_tier: RiskTier;
  rationale: string[];
  category_scores: CategoryScores;
  gaps: string[];
  recommendations: string[];
  created_at: string;
}

export interface Report {
  id: string;
  ai_feature_id: string;
  assessment_id: string;
  report_markdown: string;
  created_at: string;
}
