import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Report, AIFeature, Assessment } from '@/types/governance';
import { generateMarkdownSummary } from '@/lib/assessment';
import { toast } from 'sonner';

export function useReport(featureId: string, assessmentId: string | undefined) {
  return useQuery({
    queryKey: ['report', featureId, assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('ai_feature_id', featureId)
        .eq('assessment_id', assessmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Report | null;
    },
    enabled: !!featureId && !!assessmentId,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feature, assessment }: { feature: AIFeature; assessment: Assessment }) => {
      const markdown = generateMarkdownSummary(feature, assessment);

      const { data, error } = await supabase
        .from('reports')
        .insert({
          ai_feature_id: feature.id,
          assessment_id: assessment.id,
          report_markdown: markdown,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Report;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['report', variables.feature.id, variables.assessment.id] 
      });
      toast.success('Governance summary generated');
    },
    onError: (error) => {
      toast.error(`Failed to generate summary: ${error.message}`);
    },
  });
}
