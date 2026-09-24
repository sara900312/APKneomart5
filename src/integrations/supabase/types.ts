export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      customer_devices: {
        Row: {
          created_at: string;
          device_token: string;
          id: string;
          phone: string;
          platform: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          device_token: string;
          id?: string;
          phone: string;
          platform?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          device_token?: string;
          id?: string;
          phone?: string;
          platform?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_logs: {
        Row: {
          created_at: string;
          detail: Json;
          failure_count: number;
          id: string;
          order_code: string;
          phone: string | null;
          status: string;
          success_count: number;
        };
        Insert: {
          created_at?: string;
          detail?: Json;
          failure_count?: number;
          id?: string;
          order_code: string;
          phone?: string | null;
          status: string;
          success_count?: number;
        };
        Update: {
          created_at?: string;
          detail?: Json;
          failure_count?: number;
          id?: string;
          order_code?: string;
          phone?: string | null;
          status?: string;
          success_count?: number;
        };
        Relationships: [];
      };
      app_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          installation_id: string;
          metadata: Json | null;
          session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          installation_id: string;
          metadata?: Json | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          installation_id?: string;
          metadata?: Json | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          created_at: string;
          hidden_from_recent: boolean;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          hidden_from_recent?: boolean;
          id?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          hidden_from_recent?: boolean;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          role: "user" | "assistant";
          user_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          role: "user" | "assistant";
          user_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          role?: "user" | "assistant";
          user_id?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          area: string | null;
          created_at: string;
          delivered_at: string | null;
          customer_name: string;
          customer_phone: string;
          governorate: string | null;
          id: string;
          items: Json;
          landmark: string | null;
          notes: string | null;
          order_code: string;
          order_status: string;
          payment_method: string;
          shipping: number;
          subtotal: number;
          total: number;
          updated_at: string;
        };
        Insert: {
          area?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          customer_name: string;
          customer_phone: string;
          governorate?: string | null;
          id?: string;
          items?: Json;
          landmark?: string | null;
          notes?: string | null;
          order_code: string;
          order_status?: string;
          payment_method?: string;
          shipping?: number;
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Update: {
          area?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          customer_name?: string;
          customer_phone?: string;
          governorate?: string | null;
          id?: string;
          items?: Json;
          landmark?: string | null;
          notes?: string | null;
          order_code?: string;
          order_status?: string;
          payment_method?: string;
          shipping?: number;
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_app_event_daily_statistics: {
        Args: {
          p_end_date?: string | null;
          p_start_date?: string | null;
        };
        Returns: {
          date: string;
          total_events: number;
          unique_users: number;
          unique_installations: number;
          unique_sessions: number;
        }[];
      };
      get_app_event_statistics: {
        Args: {
          p_end_date?: string | null;
          p_start_date?: string | null;
        };
        Returns: {
          total_events: number;
          unique_users: number;
          unique_installations: number;
          unique_sessions: number;
        }[];
      };
      get_app_event_type_statistics: {
        Args: {
          p_end_date?: string | null;
          p_start_date?: string | null;
        };
        Returns: {
          event_type: string;
          total_events: number;
          unique_users: number;
          unique_installations: number;
          unique_sessions: number;
        }[];
      };
      get_ai_chat_daily_statistics: {
        Args: {
          p_end_date?: string | null;
          p_start_date?: string | null;
        };
        Returns: {
          date: string;
          unique_users: number;
          conversations_count: number;
          user_messages: number;
          assistant_messages: number;
          total_messages: number;
        }[];
      };
      get_ai_chat_statistics: {
        Args: {
          p_end_date?: string | null;
          p_start_date?: string | null;
        };
        Returns: {
          unique_users: number;
          conversations_count: number;
          user_messages: number;
          assistant_messages: number;
          total_messages: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
