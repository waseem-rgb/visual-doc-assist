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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      doctor_profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          license_number: string | null
          phone: string | null
          specialization: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          license_number?: string | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          license_number?: string | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      "head to Toe sub areas": {
        Row: {
          Body_part: string | null
          "Specific rules": string | null
          View: string | null
        }
        Insert: {
          Body_part?: string | null
          "Specific rules"?: string | null
          View?: string | null
        }
        Update: {
          Body_part?: string | null
          "Specific rules"?: string | null
          View?: string | null
        }
        Relationships: []
      }
      Medication_new: {
        Row: {
          brand_names: string | null
          category: string | null
          common_dosages: string | null
          contraindication: string | null
          created_at: string | null
          dosage_form: string | null
          generic_name: string | null
          id: string | null
          indication: string | null
          name: string | null
          side_effects: string | null
        }
        Insert: {
          brand_names?: string | null
          category?: string | null
          common_dosages?: string | null
          contraindication?: string | null
          created_at?: string | null
          dosage_form?: string | null
          generic_name?: string | null
          id?: string | null
          indication?: string | null
          name?: string | null
          side_effects?: string | null
        }
        Update: {
          brand_names?: string | null
          category?: string | null
          common_dosages?: string | null
          contraindication?: string | null
          created_at?: string | null
          dosage_form?: string | null
          generic_name?: string | null
          id?: string | null
          indication?: string | null
          name?: string | null
          side_effects?: string | null
        }
        Relationships: []
      }
      "New Master": {
        Row: {
          "Basic Investigations": string | null
          "Common Treatments": string | null
          "Part of body_and general full body symptom": string | null
          "prescription_Y-N": string | null
          "Probable Diagnosis": string | null
          "Short Summary": string | null
          Symptoms: string | null
        }
        Insert: {
          "Basic Investigations"?: string | null
          "Common Treatments"?: string | null
          "Part of body_and general full body symptom"?: string | null
          "prescription_Y-N"?: string | null
          "Probable Diagnosis"?: string | null
          "Short Summary"?: string | null
          Symptoms?: string | null
        }
        Update: {
          "Basic Investigations"?: string | null
          "Common Treatments"?: string | null
          "Part of body_and general full body symptom"?: string | null
          "prescription_Y-N"?: string | null
          "Probable Diagnosis"?: string | null
          "Short Summary"?: string | null
          Symptoms?: string | null
        }
        Relationships: []
      }
      prescription_requests: {
        Row: {
          ai_diagnosis: string | null
          assigned_doctor_id: string | null
          basic_investigations: string | null
          body_part: string
          chief_complaint: string | null
          clinical_history: string | null
          common_treatments: string | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          database_diagnosis: string | null
          id: string
          patient_age: string
          patient_gender: string
          patient_name: string
          patient_phone: string | null
          physical_examination: string | null
          prescription_required: boolean
          probable_diagnosis: string | null
          selected_diagnosis_type: string | null
          short_summary: string | null
          status: Database["public"]["Enums"]["request_status"]
          symptoms: string | null
          updated_at: string
        }
        Insert: {
          ai_diagnosis?: string | null
          assigned_doctor_id?: string | null
          basic_investigations?: string | null
          body_part: string
          chief_complaint?: string | null
          clinical_history?: string | null
          common_treatments?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          database_diagnosis?: string | null
          id?: string
          patient_age: string
          patient_gender: string
          patient_name: string
          patient_phone?: string | null
          physical_examination?: string | null
          prescription_required?: boolean
          probable_diagnosis?: string | null
          selected_diagnosis_type?: string | null
          short_summary?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          symptoms?: string | null
          updated_at?: string
        }
        Update: {
          ai_diagnosis?: string | null
          assigned_doctor_id?: string | null
          basic_investigations?: string | null
          body_part?: string
          chief_complaint?: string | null
          clinical_history?: string | null
          common_treatments?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          database_diagnosis?: string | null
          id?: string
          patient_age?: string
          patient_gender?: string
          patient_name?: string
          patient_phone?: string | null
          physical_examination?: string | null
          prescription_required?: boolean
          probable_diagnosis?: string | null
          selected_diagnosis_type?: string | null
          short_summary?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          symptoms?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor_id: string
          doctor_signature: string | null
          follow_up_notes: string | null
          id: string
          instructions: string | null
          license_info: string | null
          medications: string | null
          patient_age: string
          patient_gender: string
          patient_name: string
          pdf_bucket: string | null
          pdf_url: string | null
          prescription_date: string | null
          request_id: string | null
          selected_diagnosis_type: string | null
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          doctor_signature?: string | null
          follow_up_notes?: string | null
          id?: string
          instructions?: string | null
          license_info?: string | null
          medications?: string | null
          patient_age: string
          patient_gender: string
          patient_name: string
          pdf_bucket?: string | null
          pdf_url?: string | null
          prescription_date?: string | null
          request_id?: string | null
          selected_diagnosis_type?: string | null
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          doctor_signature?: string | null
          follow_up_notes?: string | null
          id?: string
          instructions?: string | null
          license_info?: string | null
          medications?: string | null
          patient_age?: string
          patient_gender?: string
          patient_name?: string
          pdf_bucket?: string | null
          pdf_url?: string | null
          prescription_date?: string | null
          request_id?: string | null
          selected_diagnosis_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "prescription_requests"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor"
      request_status: "pending" | "in_progress" | "completed"
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
      app_role: ["admin", "doctor"],
      request_status: ["pending", "in_progress", "completed"],
    },
  },
} as const
