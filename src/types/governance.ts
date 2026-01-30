export type FeatureStage = 'Idea' | 'In Development' | 'Beta' | 'Live';
export type AIType = 'LLM feature' | 'Recommendation-Ranking' | 'Classification-Detection' | 'Other';
export type ModelSource = 'Internal model' | 'External API' | 'Open-source self-hosted';
export type AutonomyLevel = 'Suggestion only' | 'Human reviews output' | 'Fully automated';
export type RiskTier = 'Low' | 'Medium' | 'High';

export type UserDataType = 
  | 'none'
  | 'account info'
  | 'user-generated content'
  | 'sensitive: health/financial/identity'
  | 'internal confidential'
  | 'public';

export type TargetUser = 
  | 'internal employees'
  | 'general users'
  | 'enterprise customers'
  | 'minors';

export type ImpactType = 
  | 'affects eligibility/access'
  | 'financial outcomes'
  | 'content visibility/moderation'
  | 'none';

export interface Safeguards {
  human_oversight: boolean;
  logging_monitoring: boolean;
  abuse_mitigation: boolean;
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
  stage: FeatureStage;
  description: string | null;
  ai_type: AIType | null;
  model_source: ModelSource | null;
  autonomy_level: AutonomyLevel | null;
  user_data_types: UserDataType[];
  external_data_transfer: boolean;
  target_users: TargetUser[];
  impact_types: ImpactType[];
  safeguards: Safeguards;
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

export interface AIFeatureFormData {
  name: string;
  product_name: string;
  team: string;
  stage: FeatureStage;
  description: string;
  ai_type: AIType | '';
  model_source: ModelSource | '';
  autonomy_level: AutonomyLevel | '';
  user_data_types: UserDataType[];
  external_data_transfer: boolean;
  target_users: TargetUser[];
  impact_types: ImpactType[];
  safeguards: Safeguards;
}
