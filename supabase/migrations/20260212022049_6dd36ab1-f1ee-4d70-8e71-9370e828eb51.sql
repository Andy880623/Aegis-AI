
-- Add new ai_type enum values for Aegis AI interview
ALTER TYPE public.ai_type ADD VALUE IF NOT EXISTS 'Machine Learning Model';
ALTER TYPE public.ai_type ADD VALUE IF NOT EXISTS 'LLM Application';
ALTER TYPE public.ai_type ADD VALUE IF NOT EXISTS 'LLM with RAG';

-- Add new autonomy_level enum values
ALTER TYPE public.autonomy_level ADD VALUE IF NOT EXISTS 'Human review sometimes';
ALTER TYPE public.autonomy_level ADD VALUE IF NOT EXISTS 'Always human reviewed';

-- Add new columns for interview data
ALTER TABLE public.ai_features 
  ADD COLUMN IF NOT EXISTS is_customer_facing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS impact_level text DEFAULT 'Low',
  ADD COLUMN IF NOT EXISTS data_sources text;
