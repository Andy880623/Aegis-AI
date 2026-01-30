import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { AIFeature, AIFeatureFormData, Safeguards } from '@/types/governance';
import { toast } from 'sonner';

type DbAIFeature = {
  id: string;
  name: string;
  product_name: string | null;
  team: string | null;
  stage: string;
  description: string | null;
  ai_type: string | null;
  model_source: string | null;
  autonomy_level: string | null;
  user_data_types: string[] | null;
  external_data_transfer: boolean | null;
  target_users: string[] | null;
  impact_types: string[] | null;
  safeguards: unknown;
  created_at: string;
  updated_at: string;
};

function mapDbToFeature(db: DbAIFeature): AIFeature {
  const safeguards = db.safeguards as Safeguards | null;
  return {
    id: db.id,
    name: db.name,
    product_name: db.product_name,
    team: db.team,
    stage: db.stage as AIFeature['stage'],
    description: db.description,
    ai_type: db.ai_type as AIFeature['ai_type'],
    model_source: db.model_source as AIFeature['model_source'],
    autonomy_level: db.autonomy_level as AIFeature['autonomy_level'],
    user_data_types: (db.user_data_types || []) as AIFeature['user_data_types'],
    external_data_transfer: db.external_data_transfer ?? false,
    target_users: (db.target_users || []) as AIFeature['target_users'],
    impact_types: (db.impact_types || []) as AIFeature['impact_types'],
    safeguards: safeguards ?? {
      human_oversight: false,
      logging_monitoring: false,
      abuse_mitigation: false,
    },
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
      return (data as DbAIFeature[]).map(mapDbToFeature);
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
      return mapDbToFeature(data as DbAIFeature);
    },
    enabled: !!id,
  });
}

export function useCreateAIFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: AIFeatureFormData) => {
      const insertData = {
        name: formData.name,
        product_name: formData.product_name || null,
        team: formData.team || null,
        stage: formData.stage as 'Idea' | 'In Development' | 'Beta' | 'Live',
        description: formData.description || null,
        ai_type: (formData.ai_type || null) as 'LLM feature' | 'Recommendation-Ranking' | 'Classification-Detection' | 'Other' | null,
        model_source: (formData.model_source || null) as 'Internal model' | 'External API' | 'Open-source self-hosted' | null,
        autonomy_level: (formData.autonomy_level || null) as 'Suggestion only' | 'Human reviews output' | 'Fully automated' | null,
        user_data_types: formData.user_data_types,
        external_data_transfer: formData.external_data_transfer,
        target_users: formData.target_users,
        impact_types: formData.impact_types,
        safeguards: formData.safeguards as unknown as Json,
      };

      const { data, error } = await supabase
        .from('ai_features')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return mapDbToFeature(data as DbAIFeature);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-features'] });
      toast.success('AI feature created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create feature: ${error.message}`);
    },
  });
}

export function useUpdateAIFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: formData }: { id: string; data: Partial<AIFeatureFormData> }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.product_name !== undefined) updateData.product_name = formData.product_name || null;
      if (formData.team !== undefined) updateData.team = formData.team || null;
      if (formData.stage !== undefined) updateData.stage = formData.stage;
      if (formData.description !== undefined) updateData.description = formData.description || null;
      if (formData.ai_type !== undefined) updateData.ai_type = formData.ai_type || null;
      if (formData.model_source !== undefined) updateData.model_source = formData.model_source || null;
      if (formData.autonomy_level !== undefined) updateData.autonomy_level = formData.autonomy_level || null;
      if (formData.user_data_types !== undefined) updateData.user_data_types = formData.user_data_types;
      if (formData.external_data_transfer !== undefined) updateData.external_data_transfer = formData.external_data_transfer;
      if (formData.target_users !== undefined) updateData.target_users = formData.target_users;
      if (formData.impact_types !== undefined) updateData.impact_types = formData.impact_types;
      if (formData.safeguards !== undefined) updateData.safeguards = formData.safeguards;

      const { data, error } = await supabase
        .from('ai_features')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapDbToFeature(data as DbAIFeature);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ai-features'] });
      queryClient.invalidateQueries({ queryKey: ['ai-feature', variables.id] });
      toast.success('AI feature updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update feature: ${error.message}`);
    },
  });
}

export function useDeleteAIFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_features')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-features'] });
      toast.success('AI feature deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete feature: ${error.message}`);
    },
  });
}
