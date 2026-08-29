export const SUBSCRIPTION_TIERS = ['free', 'pro', 'academy'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const TARGET_FIRMS = ['FTMO', 'FundedNext', 'Custom'] as const;
export type TargetFirm = (typeof TARGET_FIRMS)[number];

export const TRADE_TYPES = ['BUY', 'SELL'] as const;
export type TradeType = (typeof TRADE_TYPES)[number];

/** Canonical + alias values stored on trades.violation_type */
export const VIOLATION_TYPES = [
  'REVENGE_TRADE',
  'SL_REMOVED',
  'NO_OR_REMOVED_SL',
  'OVER_LEVERAGE',
  'NEWS_TRADING',
] as const;
export type ViolationType = (typeof VIOLATION_TYPES)[number];

/** Preferred label when SL is missing or was taken off the ticket */
export const CANONICAL_SL_VIOLATION: ViolationType = 'NO_OR_REMOVED_SL';

export const VIOLATION_LABELS: Record<ViolationType, string> = {
  REVENGE_TRADE: 'Revenge Trading',
  NO_OR_REMOVED_SL: 'Missing / Removed Stop-Loss',
  SL_REMOVED: 'Stop-Loss Removed',
  OVER_LEVERAGE: 'Over-Leverage',
  NEWS_TRADING: 'News Trading',
};

export interface Profile {
  id: string;
  full_name: string | null;
  telegram_chat_id: string | null;
  stripe_customer_id: string | null;
  subscription_tier: SubscriptionTier;
  created_at: string;
}

export interface TradingAccount {
  id: string;
  user_id: string;
  account_name: string;
  initial_balance: number;
  target_firm: TargetFirm | null;
  max_daily_drawdown_pct: number;
  max_total_drawdown_pct: number;
  created_at: string;
}

export interface Trade {
  id: string;
  account_id: string;
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
}

export interface DestructiveHabit {
  type: ViolationType;
  label: string;
  count: number;
  money_lost: number;
}

export interface AuditReport {
  id: string;
  account_id: string;
  readiness_score: number | null;
  actual_pnl: number | null;
  disciplined_pnl: number | null;
  money_lost_to_mistakes: number | null;
  top_destructive_habits: DestructiveHabit[] | null;
  ai_coaching_summary: string | null;
  created_at: string;
}

export type ProfileInsert = Omit<Profile, 'created_at' | 'subscription_tier' | 'stripe_customer_id'> & {
  subscription_tier?: SubscriptionTier;
  stripe_customer_id?: string | null;
};

export type TradingAccountInsert = Omit<TradingAccount, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type TradeInsert = Omit<Trade, 'id' | 'is_rule_violated' | 'violation_type'> & {
  id?: string;
  is_rule_violated?: boolean;
  violation_type?: ViolationType | null;
};

export type AuditReportInsert = Omit<AuditReport, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};
