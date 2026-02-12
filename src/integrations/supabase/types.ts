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
      appointments: {
        Row: {
          address: string | null
          caregiver_id: string
          client_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          scheduled_date: string
          start_time: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          caregiver_id: string
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          scheduled_date: string
          start_time: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          caregiver_id?: string
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          start_time?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_caregiver_id_fkey"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["audit_action_type"]
          care_group_id: string | null
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["audit_action_type"]
          care_group_id?: string | null
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["audit_action_type"]
          care_group_id?: string | null
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_care_group_id_fkey"
            columns: ["care_group_id"]
            isOneToOne: false
            referencedRelation: "care_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      care_group_users: {
        Row: {
          care_group_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["care_group_role"]
          user_id: string
        }
        Insert: {
          care_group_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["care_group_role"]
          user_id: string
        }
        Update: {
          care_group_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["care_group_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_group_users_care_group_id_fkey"
            columns: ["care_group_id"]
            isOneToOne: false
            referencedRelation: "care_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      care_groups: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      caregivers: {
        Row: {
          active: boolean | null
          availability: string | null
          avatar_url: string | null
          bio: string | null
          certifications: string[] | null
          created_at: string
          experience_years: number | null
          hourly_rate: number | null
          id: string
          resume_url: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          hourly_rate?: number | null
          id: string
          resume_url?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          resume_url?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregivers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          caregiver_id: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          shift_id: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          shift_id: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          shift_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          name: string
          plan_type: Database["public"]["Enums"]["company_plan_type"]
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name: string
          plan_type?: Database["public"]["Enums"]["company_plan_type"]
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
          plan_type?: Database["public"]["Enums"]["company_plan_type"]
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          type?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          activities: string | null
          author_id: string
          content: string
          created_at: string
          elderly_id: string
          id: string
          meals: string | null
          mood: string | null
        }
        Insert: {
          activities?: string | null
          author_id: string
          content: string
          created_at?: string
          elderly_id: string
          id?: string
          meals?: string | null
          mood?: string | null
        }
        Update: {
          activities?: string | null
          author_id?: string
          content?: string
          created_at?: string
          elderly_id?: string
          id?: string
          meals?: string | null
          mood?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_entries_elderly_id_fkey"
            columns: ["elderly_id"]
            isOneToOne: false
            referencedRelation: "elderly"
            referencedColumns: ["id"]
          },
        ]
      }
      elderly: {
        Row: {
          birth_date: string | null
          created_at: string
          emergency_contact: string | null
          emergency_phone: string | null
          id: string
          medical_conditions: string | null
          name: string
          notes: string | null
          photo_url: string | null
          responsible_id: string
          special_needs: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          medical_conditions?: string | null
          name: string
          notes?: string | null
          photo_url?: string | null
          responsible_id: string
          special_needs?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          medical_conditions?: string | null
          name?: string
          notes?: string | null
          photo_url?: string | null
          responsible_id?: string
          special_needs?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elderly_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          blood_pressure: string | null
          blood_sugar: number | null
          created_at: string
          elderly_id: string
          heart_rate: number | null
          id: string
          notes: string | null
          recorded_at: string
          recorded_by: string
          temperature: number | null
          weight: number | null
        }
        Insert: {
          blood_pressure?: string | null
          blood_sugar?: number | null
          created_at?: string
          elderly_id: string
          heart_rate?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by: string
          temperature?: number | null
          weight?: number | null
        }
        Update: {
          blood_pressure?: string | null
          blood_sugar?: number | null
          created_at?: string
          elderly_id?: string
          heart_rate?: number | null
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string
          temperature?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_records_elderly_id_fkey"
            columns: ["elderly_id"]
            isOneToOne: false
            referencedRelation: "elderly"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_reminders: {
        Row: {
          administered_by: string | null
          created_at: string
          id: string
          medication_id: string
          notes: string | null
          scheduled_time: string
          status: Database["public"]["Enums"]["reminder_status"]
        }
        Insert: {
          administered_by?: string | null
          created_at?: string
          id?: string
          medication_id: string
          notes?: string | null
          scheduled_time: string
          status?: Database["public"]["Enums"]["reminder_status"]
        }
        Update: {
          administered_by?: string | null
          created_at?: string
          id?: string
          medication_id?: string
          notes?: string | null
          scheduled_time?: string
          status?: Database["public"]["Enums"]["reminder_status"]
        }
        Relationships: [
          {
            foreignKeyName: "medication_reminders_administered_by_fkey"
            columns: ["administered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_reminders_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean | null
          created_at: string
          dosage: string | null
          elderly_id: string
          end_date: string | null
          frequency: string | null
          id: string
          name: string
          notes: string | null
          schedule_times: Json | null
          start_date: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          dosage?: string | null
          elderly_id: string
          end_date?: string | null
          frequency?: string | null
          id?: string
          name: string
          notes?: string | null
          schedule_times?: Json | null
          start_date?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          dosage?: string | null
          elderly_id?: string
          end_date?: string | null
          frequency?: string | null
          id?: string
          name?: string
          notes?: string | null
          schedule_times?: Json | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_elderly_id_fkey"
            columns: ["elderly_id"]
            isOneToOne: false
            referencedRelation: "elderly"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          created_at: string
          enabled: boolean
          gateway: string
          id: string
          public_key: string | null
          secret_key: string | null
          settings: Json | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          gateway: string
          id?: string
          public_key?: string | null
          secret_key?: string | null
          settings?: Json | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          gateway?: string
          id?: string
          public_key?: string | null
          secret_key?: string | null
          settings?: Json | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          cta_text: string
          description: string | null
          features: Json
          id: string
          name: string
          period: string | null
          popular: boolean
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_text?: string
          description?: string | null
          features?: Json
          id?: string
          name: string
          period?: string | null
          popular?: boolean
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_text?: string
          description?: string | null
          features?: Json
          id?: string
          name?: string
          period?: string | null
          popular?: boolean
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          appointment_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          appointment_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          care_group_id: string
          caregiver_id: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          start_time: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
        }
        Insert: {
          care_group_id: string
          caregiver_id: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
        }
        Update: {
          care_group_id?: string
          caregiver_id?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_care_group_id_fkey"
            columns: ["care_group_id"]
            isOneToOne: false
            referencedRelation: "care_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_period: string
          created_at: string
          end_date: string | null
          id: string
          plan_id: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_role_to_user: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      has_care_group_role: {
        Args: {
          _care_group_id: string
          _role: Database["public"]["Enums"]["care_group_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_care_group_member: {
        Args: { _care_group_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "cuidador" | "cliente"
      audit_action_type: "CREATE" | "UPDATE" | "DELETE"
      care_group_role: "responsavel" | "cuidador" | "admin_empresa"
      company_plan_type: "basic" | "premium" | "professional" | "enterprise"
      reminder_status: "pending" | "administered" | "skipped"
      shift_status: "scheduled" | "active" | "completed" | "cancelled"
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
      app_role: ["admin", "cuidador", "cliente"],
      audit_action_type: ["CREATE", "UPDATE", "DELETE"],
      care_group_role: ["responsavel", "cuidador", "admin_empresa"],
      company_plan_type: ["basic", "premium", "professional", "enterprise"],
      reminder_status: ["pending", "administered", "skipped"],
      shift_status: ["scheduled", "active", "completed", "cancelled"],
    },
  },
} as const
