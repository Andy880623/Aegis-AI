export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_features: {
        Row: {
          ai_type: Database["public"]["Enums"]["ai_type"] | null
          autonomy_level: Database["public"]["Enums"]["autonomy_level"] | null
          created_at: string
          data_sources: string | null
          description: string | null
          external_data_transfer: boolean | null
          id: string
          impact_level: string | null
          impact_types: string[] | null
          is_customer_facing: boolean | null
          model_source: Database["public"]["Enums"]["model_source"] | null
          name: string
          product_name: string | null
          safeguards: Json | null
          stage: Database["public"]["Enums"]["feature_stage"] | null
          target_users: string[] | null
          team: string | null
          updated_at: string
          user_data_types: string[] | null
        }
        Insert: {
          ai_type?: Database["public"]["Enums"]["ai_type"] | null
          autonomy_level?: Database["public"]["Enums"]["autonomy_level"] | null
          created_at?: string
          data_sources?: string | null
          description?: string | null
          external_data_transfer?: boolean | null
          id?: string
          impact_level?: string | null
          impact_types?: string[] | null
          is_customer_facing?: boolean | null
          model_source?: Database["public"]["Enums"]["model_source"] | null
          name: string
          product_name?: string | null
          safeguards?: Json | null
          stage?: Database["public"]["Enums"]["feature_stage"] | null
          target_users?: string[] | null
          team?: string | null
          updated_at?: string
          user_data_types?: string[] | null
        }
        Update: {
          ai_type?: Database["public"]["Enums"]["ai_type"] | null
          autonomy_level?: Database["public"]["Enums"]["autonomy_level"] | null
          created_at?: string
          data_sources?: string | null
          description?: string | null
          external_data_transfer?: boolean | null
          id?: string
          impact_level?: string | null
          impact_types?: string[] | null
          is_customer_facing?: boolean | null
          model_source?: Database["public"]["Enums"]["model_source"] | null
          name?: string
          product_name?: string | null
          safeguards?: Json | null
          stage?: Database["public"]["Enums"]["feature_stage"] | null
          target_users?: string[] | null
          team?: string | null
          updated_at?: string
          user_data_types?: string[] | null
        }
        Relationships: []
      }
      assessments: {
        Row: {
          ai_feature_id: string
          category_scores: Json | null
          created_at: string
          gaps: string[] | null
          id: string
          rationale: string[] | null
          recommendations: string[] | null
          risk_tier: Database["public"]["Enums"]["risk_tier"]
        }
        Insert: {
          ai_feature_id: string
          category_scores?: Json | null
          created_at?: string
          gaps?: string[] | null
          id?: string
          rationale?: string[] | null
          recommendations?: string[] | null
          risk_tier: Database["public"]["Enums"]["risk_tier"]
        }
        Update: {
          ai_feature_id?: string
          category_scores?: Json | null
          created_at?: string
          gaps?: string[] | null
          id?: string
          rationale?: string[] | null
          recommendations?: string[] | null
          risk_tier?: Database["public"]["Enums"]["risk_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "assessments_ai_feature_id_fkey"
            columns: ["ai_feature_id"]
            isOneToOne: false
            referencedRelation: "ai_features"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          ai_feature_id: string
          assessment_id: string
          created_at: string
          id: string
          report_markdown: string
        }
        Insert: {
          ai_feature_id: string
          assessment_id: string
          created_at?: string
          id?: string
          report_markdown: string
        }
        Update: {
          ai_feature_id?: string
          assessment_id?: string
          created_at?: string
          id?: string
          report_markdown?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_ai_feature_id_fkey"
            columns: ["ai_feature_id"]
            isOneToOne: false
            referencedRelation: "ai_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ai_type:
        | "LLM feature"
        | "Recommendation-Ranking"
        | "Classification-Detection"
        | "Other"
        | "Machine Learning Model"
        | "LLM Application"
        | "LLM with RAG"
      autonomy_level:
        | "Suggestion only"
        | "Human reviews output"
        | "Fully automated"
        | "Human review sometimes"
        | "Always human reviewed"
      feature_stage: "Idea" | "In Development" | "Beta" | "Live"
      model_source:
        | "Internal model"
        | "External API"
        | "Open-source self-hosted"
      risk_tier: "Low" | "Medium" | "High"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_type: [
        "LLM feature",
        "Recommendation-Ranking",
        "Classification-Detection",
        "Other",
        "Machine Learning Model",
        "LLM Application",
        "LLM with RAG",
      ],
      autonomy_level: [
        "Suggestion only",
        "Human reviews output",
        "Fully automated",
        "Human review sometimes",
        "Always human reviewed",
      ],
      feature_stage: ["Idea", "In Development", "Beta", "Live"],
      model_source: [
        "Internal model",
        "External API",
        "Open-source self-hosted",
      ],
      risk_tier: ["Low", "Medium", "High"],
    },
  },
} as const
