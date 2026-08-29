import type {
  SubscriptionTier,
  TargetFirm,
  TradeType,
  ViolationType,
} from './domain';
import type { DestructiveHabit } from './domain';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          telegram_chat_id: string | null;
          stripe_customer_id: string | null;
          subscription_tier: SubscriptionTier;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          telegram_chat_id?: string | null;
          stripe_customer_id?: string | null;
          subscription_tier?: SubscriptionTier;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          telegram_chat_id?: string | null;
          stripe_customer_id?: string | null;
          subscription_tier?: SubscriptionTier;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      trading_accounts: {
        Row: {
          id: string;
          user_id: string | null;
          account_name: string;
          initial_balance: number;
          target_firm: string | null;
          max_daily_drawdown_pct: number;
          max_total_drawdown_pct: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          account_name: string;
          initial_balance: number;
          target_firm?: string | null;
          max_daily_drawdown_pct?: number;
          max_total_drawdown_pct?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          account_name?: string;
          initial_balance?: number;
          target_firm?: string | null;
          max_daily_drawdown_pct?: number;
          max_total_drawdown_pct?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trading_accounts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      trades: {
        Row: {
          id: string;
          account_id: string | null;
          ticket_id: string | null;
          symbol: string;
          trade_type: TradeType;
          lot_size: number;
          open_price: number;
          close_price: number | null;
          sl_price: number | null;
          tp_price: number | null;
          pnl: number;
          open_time: string;
          close_time: string;
          duration_seconds: number | null;
          is_rule_violated: boolean;
          violation_type: ViolationType | null;
          notes: string | null;
          setup_tags: string[];
        };
        Insert: {
          id?: string;
          account_id?: string | null;
          ticket_id?: string | null;
          symbol: string;
          trade_type: TradeType;
          lot_size: number;
          open_price: number;
          close_price?: number | null;
          sl_price?: number | null;
          tp_price?: number | null;
          pnl: number;
          open_time: string;
          close_time: string;
          duration_seconds?: number | null;
          is_rule_violated?: boolean;
          violation_type?: ViolationType | null;
          notes?: string | null;
          setup_tags?: string[];
        };
        Update: {
          id?: string;
          account_id?: string | null;
          ticket_id?: string | null;
          symbol?: string;
          trade_type?: TradeType;
          lot_size?: number;
          open_price?: number;
          close_price?: number | null;
          sl_price?: number | null;
          tp_price?: number | null;
          pnl?: number;
          open_time?: string;
          close_time?: string;
          duration_seconds?: number | null;
          is_rule_violated?: boolean;
          violation_type?: ViolationType | null;
          notes?: string | null;
          setup_tags?: string[];
        };
        Relationships: [
          {
            foreignKeyName: 'trades_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'trading_accounts';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_reports: {
        Row: {
          id: string;
          account_id: string | null;
          readiness_score: number | null;
          actual_pnl: number | null;
          disciplined_pnl: number | null;
          money_lost_to_mistakes: number | null;
          top_destructive_habits: DestructiveHabit[] | Json | null;
          ai_coaching_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id?: string | null;
          readiness_score?: number | null;
          actual_pnl?: number | null;
          disciplined_pnl?: number | null;
          money_lost_to_mistakes?: number | null;
          top_destructive_habits?: DestructiveHabit[] | Json | null;
          ai_coaching_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string | null;
          readiness_score?: number | null;
          actual_pnl?: number | null;
          disciplined_pnl?: number | null;
          money_lost_to_mistakes?: number | null;
          top_destructive_habits?: DestructiveHabit[] | Json | null;
          ai_coaching_summary?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_reports_account_id_fkey';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'trading_accounts';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_tier: SubscriptionTier;
      target_firm: TargetFirm;
      trade_type: TradeType;
      violation_type: ViolationType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
