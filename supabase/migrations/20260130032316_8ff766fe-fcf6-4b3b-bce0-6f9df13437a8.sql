-- Create enum types for the AI features
CREATE TYPE public.feature_stage AS ENUM ('Idea', 'In Development', 'Beta', 'Live');
CREATE TYPE public.ai_type AS ENUM ('LLM feature', 'Recommendation-Ranking', 'Classification-Detection', 'Other');
CREATE TYPE public.model_source AS ENUM ('Internal model', 'External API', 'Open-source self-hosted');
CREATE TYPE public.autonomy_level AS ENUM ('Suggestion only', 'Human reviews output', 'Fully automated');
CREATE TYPE public.risk_tier AS ENUM ('Low', 'Medium', 'High');

-- Create AI Features table
CREATE TABLE public.ai_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_name TEXT,
  team TEXT,
  stage feature_stage DEFAULT 'Idea',
  description TEXT,
  ai_type ai_type,
  model_source model_source,
  autonomy_level autonomy_level,
  user_data_types TEXT[] DEFAULT '{}',
  external_data_transfer BOOLEAN DEFAULT false,
  target_users TEXT[] DEFAULT '{}',
  impact_types TEXT[] DEFAULT '{}',
  safeguards JSONB DEFAULT '{"human_oversight": false, "logging_monitoring": false, "abuse_mitigation": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create Assessments table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_feature_id UUID REFERENCES public.ai_features(id) ON DELETE CASCADE NOT NULL,
  risk_tier risk_tier NOT NULL,
  rationale TEXT[] DEFAULT '{}',
  category_scores JSONB DEFAULT '{"privacy": 0, "safety_misuse": 0, "fairness": 0, "transparency": 0, "accountability": 0}'::jsonb,
  gaps TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_feature_id UUID REFERENCES public.ai_features(id) ON DELETE CASCADE NOT NULL,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  report_markdown TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.ai_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create public access policies (internal tool, no auth required)
CREATE POLICY "Allow public read access on ai_features" ON public.ai_features FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on ai_features" ON public.ai_features FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on ai_features" ON public.ai_features FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on ai_features" ON public.ai_features FOR DELETE USING (true);

CREATE POLICY "Allow public read access on assessments" ON public.assessments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on assessments" ON public.assessments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on assessments" ON public.assessments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on assessments" ON public.assessments FOR DELETE USING (true);

CREATE POLICY "Allow public read access on reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on reports" ON public.reports FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on reports" ON public.reports FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for ai_features
CREATE TRIGGER update_ai_features_updated_at
  BEFORE UPDATE ON public.ai_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();