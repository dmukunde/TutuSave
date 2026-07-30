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
          currency: string | null;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          currency?: string | null;
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
      shared_goals: {
        Row: {
          id: string;
          created_by: string;
          name: string;
          target_amount: number;
          currency: string;
          target_date: string | null;
          split_type: string;
          status: string;
          milestones_reached: number[];
          created_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          name: string;
          target_amount: number;
          currency: string;
          target_date?: string | null;
          split_type: string;
          status?: string;
          milestones_reached?: number[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shared_goals"]["Insert"]>;
        Relationships: [];
      };
      shared_goal_members: {
        Row: {
          id: string;
          shared_goal_id: string;
          user_id: string | null;
          invited_email: string | null;
          role: string;
          status: string;
          split_value: number | null;
          invite_token: string;
          invited_at: string;
          expires_at: string | null;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          shared_goal_id: string;
          user_id?: string | null;
          invited_email?: string | null;
          role?: string;
          status?: string;
          split_value?: number | null;
          invite_token?: string;
          invited_at?: string;
          expires_at?: string | null;
          joined_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["shared_goal_members"]["Insert"]>;
        Relationships: [];
      };
      shared_goal_contributions: {
        Row: {
          id: string;
          shared_goal_id: string;
          contributed_by: string;
          amount: number;
          contributed_at: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shared_goal_id: string;
          contributed_by: string;
          amount: number;
          contributed_at?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shared_goal_contributions"]["Insert"]>;
        Relationships: [];
      };
      shared_goal_activity: {
        Row: {
          id: string;
          shared_goal_id: string;
          actor_id: string | null;
          activity_type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          shared_goal_id: string;
          actor_id?: string | null;
          activity_type: string;
          payload?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shared_goal_activity"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_shared_goal_member: {
        Args: { p_goal_id: string; p_user_id: string };
        Returns: boolean;
      };
      get_shared_goal_invite: {
        Args: { p_token: string };
        Returns: {
          shared_goal_id: string;
          goal_name: string;
          invited_by_name: string;
          invited_email: string | null;
          member_status: string;
          expires_at: string | null;
        }[];
      };
      accept_shared_goal_invite: {
        Args: { p_token: string };
        Returns: string;
      };
      advance_shared_goal_status: {
        Args: { p_goal_id: string; p_milestones: number[]; p_status: string | null };
        Returns: undefined;
      };
      notify_shared_goal_members: {
        Args: {
          p_goal_id: string;
          p_event_type: string;
          p_activity_type: string;
          p_actor_id: string | null;
          p_payload: Json;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
