import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { Assessment, AIFeature, CategoryScores } from '@/types/governance';
import { runHeuristicAssessment } from '@/lib/assessment';
import { toast } from 'sonner';

type DbAssessment = {
  id: string;
  ai_feature_id: string;
  risk_tier: string;
  rationale: string[] | null;
  category_scores: unknown;
  gaps: string[] | null;
  recommendations: string[] | null;
  created_at: string;
};

function mapDbToAssessment(db: DbAssessment): Assessment {
  const categoryScores = db.category_scores as CategoryScores | null;
  return {
    id: db.id,
    ai_feature_id: db.ai_feature_id,
    risk_tier: db.risk_tier as Assessment['risk_tier'],
    rationale: db.rationale || [],
    category_scores: categoryScores ?? {
      privacy: 0,
      safety_misuse: 0,
      fairness: 0,
      transparency: 0,
      accountability: 0,
    },
    gaps: db.gaps || [],
    recommendations: db.recommendations || [],
    created_at: db.created_at,
  };
}

export function useLatestAssessment(featureId: string) {
  return useQuery({
    queryKey: ['assessment', featureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('ai_feature_id', featureId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return mapDbToAssessment(data as DbAssessment);
    },
    enabled: !!featureId,
  });
}

export function useRunAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feature: AIFeature) => {
      // Run heuristic assessment (can be replaced with LLM call later)
      const result = runHeuristicAssessment(feature);

      const insertData = {
        ai_feature_id: feature.id,
        risk_tier: result.risk_tier as 'Low' | 'Medium' | 'High',
        rationale: result.rationale,
        category_scores: result.category_scores as unknown as Json,
        gaps: result.gaps,
        recommendations: result.recommendations,
      };

      const { data, error } = await supabase
        .from('assessments')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return mapDbToAssessment(data as DbAssessment);
    },
    onSuccess: (_, feature) => {
      queryClient.invalidateQueries({ queryKey: ['assessment', feature.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-features'] });
      toast.success('Governance assessment completed');
    },
    onError: (error) => {
      toast.error(`Assessment failed: ${error.message}`);
    },
  });
}
