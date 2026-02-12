import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { AIFeature, Safeguards, InterviewData } from '@/types/governance';
import { toast } from 'sonner';

function mapDbToFeature(db: any): AIFeature {
  const safeguards = db.safeguards as Safeguards | null;
  return {
    id: db.id,
    name: db.name,
    product_name: db.product_name,
    team: db.team,
    stage: db.stage,
    description: db.description,
    ai_type: db.ai_type,
    model_source: db.model_source,
    autonomy_level: db.autonomy_level,
    user_data_types: (db.user_data_types || []),
    external_data_transfer: db.external_data_transfer ?? false,
    target_users: (db.target_users || []),
    impact_types: (db.impact_types || []),
    safeguards: safeguards ?? {
      human_oversight: false,
      logging_monitoring: false,
      abuse_mitigation: false,
    },
    is_customer_facing: db.is_customer_facing ?? false,
    impact_level: db.impact_level,
    data_sources: db.data_sources,
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

export function useAIFeatures() {
  return useQuery({
    queryKey: ['ai-features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_features')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapDbToFeature);
    },
  });
}

export function useAIFeature(id: string) {
  return useQuery({
    queryKey: ['ai-feature', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_features')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return mapDbToFeature(data);
    },
    enabled: !!id,
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interview: InterviewData) => {
      const safeguards: Safeguards = {
        human_oversight: interview.automation_level !== 'Fully automated',
        logging_monitoring: false,
        abuse_mitigation: false,
        robustness_testing: interview.has_robustness_testing,
        bias_testing: interview.has_bias_testing,
        security_testing: interview.has_security_testing,
        has_model_card: interview.has_model_card,
      };

      const insertData = {
        name: interview.system_name,
        ai_type: interview.system_type as any,
        autonomy_level: interview.automation_level as any,
        is_customer_facing: interview.is_customer_facing,
        impact_level: interview.impact_level,
        data_sources: interview.data_sources || null,
        user_data_types: interview.uses_personal_data
          ? ['sensitive: health/financial/identity']
          : ['none'],
        external_data_transfer: false,
        target_users: interview.is_customer_facing ? ['general users'] : ['internal employees'],
        impact_types: interview.impact_level === 'High'
          ? ['affects eligibility/access']
          : [],
        safeguards: safeguards as unknown as Json,
        description: interview.data_sources || null,
      };

      const { data, error } = await supabase
        .from('ai_features')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return mapDbToFeature(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-features'] });
    },
    onError: (error) => {
      toast.error(`Failed to save interview: ${error.message}`);
    },
  });
}
