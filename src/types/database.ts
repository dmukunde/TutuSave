// Hand-written to match supabase/migrations/0001_init.sql.
// Once the Supabase CLI is authenticated, regenerate with:
//   npx supabase gen types typescript --project-id lixaobjbvpzjplkqeeiy > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          currency: string;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          timezone?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          kind: string;
          is_archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          kind: string;
          is_archived?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          kind: string;
          description: string | null;
          occurred_at: string;
          receipt_url: string | null;
          is_recurring: boolean;
          recurrence_rule: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          kind: string;
          description?: string | null;
          occurred_at?: string;
          receipt_url?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          period_type: string;
          start_date: string;
          end_date: string | null;
          rollover: boolean;
          alert_threshold_pct: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          period_type: string;
          start_date: string;
          end_date?: string | null;
          rollover?: boolean;
          alert_threshold_pct?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["budgets"]["Insert"]>;
        Relationships: [];
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          target_date: string | null;
          icon: string | null;
          color: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          target_date?: string | null;
          icon?: string | null;
          color?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["savings_goals"]["Insert"]>;
        Relationships: [];
      };
      goal_contributions: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string;
          amount: number;
          contributed_at: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_id: string;
          amount: number;
          contributed_at?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["goal_contributions"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          is_read: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          is_read?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          payload: Json;
          created_at: string;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          payload?: Json;
          created_at?: string;
          delivered_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
