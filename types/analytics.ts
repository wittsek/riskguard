import type {
  DestructiveHabit,
  Trade,
  TradeType,
  TradingAccount,
  ViolationType,
} from './domain';
import type { NormalizedTradeInput } from './parser';

export type LintSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export const SESSION_NAMES = ['asian', 'london', 'new_york', 'off_hours'] as const;
export type SessionName = (typeof SESSION_NAMES)[number];

export interface NewsWindow {
  symbol?: string;
  starts_at: string;
  ends_at: string;
  title?: string;
  impact?: 'low' | 'medium' | 'high';
}

export type LintableTrade = Trade | NormalizedTradeInput;

export interface LintContext {
  account: Pick<
    TradingAccount,
    'initial_balance' | 'max_daily_drawdown_pct' | 'max_total_drawdown_pct' | 'target_firm'
  >;
  trades: LintableTrade[];
  newsWindows?: NewsWindow[];
  /** Seconds between a loss and a re-entry that counts as revenge trading */
  revengeWindowSeconds?: number;
  /** Position notional / equity above this ratio is OVER_LEVERAGE */
  maxLeverage?: number;
  /**
   * Fraction of initial_balance used as the disciplined per-trade loss cap.
   * Default 0.01 (1%).
   */
  maxRiskPerTradePct?: number;
}

/** LintContext without the redundant trades array — used when trades are passed separately. */
export type LintContextInput = Omit<LintContext, 'trades'>;

export interface LintViolation {
  type: ViolationType;
  severity: LintSeverity;
  ticket_id: string | null;
  symbol?: string;
  open_time?: string;
  message: string;
  pnl_impact: number;
  related_ticket_ids?: string[];
  meta?: Record<string, unknown>;
}

export interface BehaviorMetrics {
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  profit_factor: number | null;
  average_rr: number | null;
  trades_without_sl: number;
  revenge_trade_count: number;
  over_leverage_count: number;
  news_trade_count: number;
  sl_removed_count: number;
}

export interface SessionStats {
  session: SessionName;
  label: string;
  trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  pnl: number;
}

export interface EquityPoint {
  index: number;
  ticket_id: string | null;
  time: string;
  actual_equity: number;
  disciplined_equity: number;
  actual_pnl: number;
  disciplined_pnl: number;
}

export interface DrawdownMetrics {
  /** Peak-to-trough within a UTC day, as % of initial_balance */
  daily_drawdown_pct: number;
  /** Peak-to-trough over the full curve, as % of initial_balance */
  total_drawdown_pct: number;
  daily_limit_pct: number;
  total_limit_pct: number;
  daily_breached: boolean;
  total_breached: boolean;
}

export interface AnnotatedTrade {
  ticket_id: string | null;
  symbol: string;
  trade_type: TradeType;
  lot_size: number;
  open_price: number;
  close_price: number | null;
  sl_price: number | null;
  tp_price: number | null;
  pnl: number;
  disciplined_pnl: number;
  open_time: string;
  close_time: string;
  duration_seconds: number | null;
  is_rule_violated: boolean;
  violations: ViolationType[];
}

export interface LintResult {
  violations: LintViolation[];
  metrics: BehaviorMetrics;
  readiness_score: number;
  actual_pnl: number;
  disciplined_pnl: number;
  money_lost_to_mistakes: number;
  top_destructive_habits: DestructiveHabit[];
  sessions: SessionStats[];
  equity_curve: EquityPoint[];
  drawdown: DrawdownMetrics;
  annotated_trades: AnnotatedTrade[];
}
