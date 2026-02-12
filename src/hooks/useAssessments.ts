import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { Assessment, AIFeature, CategoryScores, InterviewData } from '@/types/governance';
import { runGovernanceAnalysis } from '@/lib/assessment';
import { toast } from 'sonner';

function mapDbToAssessment(db: any): Assessment {
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
      return mapDbToAssessment(data);
    },
    enabled: !!featureId,
  });
}

export function useRunAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feature, interview }: { feature: AIFeature; interview: InterviewData }) => {
      const result = runGovernanceAnalysis(interview);

      const categoryScores: CategoryScores = {
        privacy: interview.uses_personal_data ? 4 : 1,
        safety_misuse: result.gap_scores.safety,
        fairness: result.gap_scores.fairness,
        transparency: result.gap_scores.explainability,
        accountability: interview.automation_level === 'Fully automated' ? 4 : 1,
      };

      const insertData = {
        ai_feature_id: feature.id,
        risk_tier: result.risk_tier as 'Low' | 'Medium' | 'High',
        rationale: [result.risk_explanation],
        category_scores: categoryScores as unknown as Json,
        gaps: [
          result.validation_gaps.robustness,
          result.validation_gaps.fairness,
          result.validation_gaps.safety,
          result.validation_gaps.explainability,
        ],
        recommendations: result.checklist.map(c => c.title),
      };

      const { data, error } = await supabase
        .from('assessments')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return mapDbToAssessment(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assessment', variables.feature.id] });
      toast.success('AI Governance analysis complete');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });
}
