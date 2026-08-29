import type { DestructiveHabit, TargetFirm, ViolationType } from './domain';
import type { DrawdownMetrics, SessionStats } from './analytics';

export type CoachingSource = 'rule' | 'llm' | 'saved';

export interface CoachingAccountContext {
  firm?: TargetFirm | string | null;
  initial_balance?: number;
  max_daily_drawdown_pct?: number;
  max_total_drawdown_pct?: number;
}

export interface CoachViolatingTrade {
  ticket_id: string | null;
  symbol: string;
  pnl: number;
  violations: ViolationType[];
}

export interface CoachMetrics {
  total_trades: number;
  wins: number;
  losses: number;
  win_rate: number;
  revenge_trade_count: number;
  trades_without_sl: number;
  over_leverage_count: number;
  news_trade_count: number;
}

export interface CoachPayload {
  readiness_score: number;
  actual_pnl: number;
  disciplined_pnl: number;
  money_lost_to_mistakes: number;
  metrics: CoachMetrics;
  top_destructive_habits: DestructiveHabit[];
  sessions: SessionStats[];
  drawdown: DrawdownMetrics;
  top_violating_trades: CoachViolatingTrade[];
  account?: CoachingAccountContext;
}

export interface CoachingNotes {
  summary: string;
  headline?: string;
  bullets?: string[];
  source: CoachingSource;
}

export interface CoachApiResponseBody extends CoachingNotes {}
