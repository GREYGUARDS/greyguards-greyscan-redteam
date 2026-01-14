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
      brand_people: {
        Row: {
          brand_name: string
          created_at: string
          discovered_at: string
          id: string
          person_name: string
          person_role: string
          user_id: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          discovered_at?: string
          id?: string
          person_name: string
          person_role: string
          user_id: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          discovered_at?: string
          id?: string
          person_name?: string
          person_role?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_injects: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          inject_type: string
          is_aggressive: boolean | null
          is_sent: boolean | null
          reach: number | null
          sent_at: string | null
          sentiment: string | null
          session_id: string
          source: string
          timestamp_offset: number
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string
          id?: string
          inject_type: string
          is_aggressive?: boolean | null
          is_sent?: boolean | null
          reach?: number | null
          sent_at?: string | null
          sentiment?: string | null
          session_id: string
          source: string
          timestamp_offset?: number
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          inject_type?: string
          is_aggressive?: boolean | null
          is_sent?: boolean | null
          reach?: number | null
          sent_at?: string | null
          sentiment?: string | null
          session_id?: string
          source?: string
          timestamp_offset?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercise_injects_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exercise_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_responses: {
        Row: {
          created_at: string | null
          custom_response: string | null
          effectiveness: number
          id: string
          inject_id: string
          response_label: string
          response_time_seconds: number
          response_type: string
          session_id: string
          team_id: string
          was_correct: boolean
        }
        Insert: {
          created_at?: string | null
          custom_response?: string | null
          effectiveness: number
          id?: string
          inject_id: string
          response_label: string
          response_time_seconds: number
          response_type: string
          session_id: string
          team_id: string
          was_correct: boolean
        }
        Update: {
          created_at?: string | null
          custom_response?: string | null
          effectiveness?: number
          id?: string
          inject_id?: string
          response_label?: string
          response_time_seconds?: number
          response_type?: string
          session_id?: string
          team_id?: string
          was_correct?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "exercise_responses_inject_id_fkey"
            columns: ["inject_id"]
            isOneToOne: false
            referencedRelation: "exercise_injects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exercise_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_responses_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "exercise_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_sessions: {
        Row: {
          blue_team_score: Json | null
          brand_name: string
          completed_at: string | null
          created_at: string
          duration: number
          id: string
          red_team_score: Json | null
          scenario_narrative: string | null
          scenario_title: string | null
          session_code: string
          started_at: string | null
          status: string
          team_mode: string
        }
        Insert: {
          blue_team_score?: Json | null
          brand_name: string
          completed_at?: string | null
          created_at?: string
          duration?: number
          id?: string
          red_team_score?: Json | null
          scenario_narrative?: string | null
          scenario_title?: string | null
          session_code: string
          started_at?: string | null
          status?: string
          team_mode?: string
        }
        Update: {
          blue_team_score?: Json | null
          brand_name?: string
          completed_at?: string | null
          created_at?: string
          duration?: number
          id?: string
          red_team_score?: Json | null
          scenario_narrative?: string | null
          scenario_title?: string | null
          session_code?: string
          started_at?: string | null
          status?: string
          team_mode?: string
        }
        Relationships: []
      }
      exercise_teams: {
        Row: {
          decisions_correct: number | null
          decisions_total: number | null
          id: string
          is_connected: boolean | null
          joined_at: string | null
          narrative_control: number | null
          reputation_damage: number | null
          session_id: string
          team_name: string | null
          team_type: string
        }
        Insert: {
          decisions_correct?: number | null
          decisions_total?: number | null
          id?: string
          is_connected?: boolean | null
          joined_at?: string | null
          narrative_control?: number | null
          reputation_damage?: number | null
          session_id: string
          team_name?: string | null
          team_type: string
        }
        Update: {
          decisions_correct?: number | null
          decisions_total?: number | null
          id?: string
          is_connected?: boolean | null
          joined_at?: string | null
          narrative_control?: number | null
          reputation_damage?: number | null
          session_id?: string
          team_name?: string | null
          team_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_teams_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exercise_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mdm_alerts: {
        Row: {
          alert_type: string
          brand_name: string
          created_at: string
          current_frequency: number | null
          frequency_change_percent: number | null
          id: string
          is_read: boolean
          narrative_description: string
          narrative_id: string
          previous_frequency: number | null
          severity: string
          user_id: string
        }
        Insert: {
          alert_type: string
          brand_name: string
          created_at?: string
          current_frequency?: number | null
          frequency_change_percent?: number | null
          id?: string
          is_read?: boolean
          narrative_description: string
          narrative_id: string
          previous_frequency?: number | null
          severity: string
          user_id: string
        }
        Update: {
          alert_type?: string
          brand_name?: string
          created_at?: string
          current_frequency?: number | null
          frequency_change_percent?: number | null
          id?: string
          is_read?: boolean
          narrative_description?: string
          narrative_id?: string
          previous_frequency?: number | null
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      mdm_narratives_history: {
        Row: {
          brand_name: string
          created_at: string
          detected_at: string
          frequency: number
          id: string
          keywords: string[]
          narrative_description: string
          narrative_id: string
          narrative_type: string
          severity: string
          user_id: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          detected_at?: string
          frequency?: number
          id?: string
          keywords?: string[]
          narrative_description: string
          narrative_id: string
          narrative_type: string
          severity: string
          user_id: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          detected_at?: string
          frequency?: number
          id?: string
          keywords?: string[]
          narrative_description?: string
          narrative_id?: string
          narrative_type?: string
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      person_mdm_narratives: {
        Row: {
          brand_name: string
          created_at: string
          detected_at: string
          frequency: number
          id: string
          keywords: string[]
          narrative_description: string
          narrative_id: string
          narrative_type: string
          person_id: string
          severity: string
          user_id: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          detected_at?: string
          frequency?: number
          id?: string
          keywords?: string[]
          narrative_description: string
          narrative_id: string
          narrative_type: string
          person_id: string
          severity: string
          user_id: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          detected_at?: string
          frequency?: number
          id?: string
          keywords?: string[]
          narrative_description?: string
          narrative_id?: string
          narrative_type?: string
          person_id?: string
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_mdm_narratives_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "brand_people"
            referencedColumns: ["id"]
          },
        ]
      }
      person_mentions_history: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          mention_count: number
          negative_count: number
          neutral_count: number
          person_id: string
          positive_count: number
          sentiment_score: number
          user_id: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          mention_count?: number
          negative_count?: number
          neutral_count?: number
          person_id: string
          positive_count?: number
          sentiment_score: number
          user_id: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          mention_count?: number
          negative_count?: number
          neutral_count?: number
          person_id?: string
          positive_count?: number
          sentiment_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_mentions_history_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "brand_people"
            referencedColumns: ["id"]
          },
        ]
      }
      sentiment_history: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          negative_count: number
          neutral_count: number
          positive_count: number
          sentiment_score: number
          total_mentions: number
          user_id: string | null
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          negative_count: number
          neutral_count: number
          positive_count: number
          sentiment_score: number
          total_mentions: number
          user_id?: string | null
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          negative_count?: number
          neutral_count?: number
          positive_count?: number
          sentiment_score?: number
          total_mentions?: number
          user_id?: string | null
        }
        Relationships: []
      }
      user_brand_access: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
