import { DEFAULT_LINT_ACCOUNT } from '@/lib/analytics';
import type {
  CoachPayload,
  CoachingAccountContext,
  CoachViolatingTrade,
  DestructiveHabit,
  DrawdownMetrics,
  LintResult,
  SessionStats,
} from '@/types';

export const MAX_COACH_VIOLATING_TRADES = 8;
export const MAX_COACH_HABITS = 5;

const METRIC_KEYS = [
  'total_trades',
  'wins',
  'losses',
  'win_rate',
  'revenge_trade_count',
  'trades_without_sl',
  'over_leverage_count',
  'news_trade_count',
] as const;

function asFinite(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function defaultAccount(account?: CoachingAccountContext): CoachingAccountContext {
  return {
    firm: account?.firm ?? DEFAULT_LINT_ACCOUNT.target_firm,
    initial_balance: account?.initial_balance ?? DEFAULT_LINT_ACCOUNT.initial_balance,
    max_daily_drawdown_pct:
      account?.max_daily_drawdown_pct ?? DEFAULT_LINT_ACCOUNT.max_daily_drawdown_pct,
    max_total_drawdown_pct:
      account?.max_total_drawdown_pct ?? DEFAULT_LINT_ACCOUNT.max_total_drawdown_pct,
  };
}

function isHabit(value: unknown): value is DestructiveHabit {
  if (typeof value !== 'object' || value == null) return false;
  const habit = value as DestructiveHabit;
  return (
    typeof habit.type === 'string' &&
    typeof habit.label === 'string' &&
    typeof habit.count === 'number' &&
    typeof habit.money_lost === 'number'
  );
}

function isSession(value: unknown): value is SessionStats {
  if (typeof value !== 'object' || value == null) return false;
  const session = value as SessionStats;
  return typeof session.session === 'string' && typeof session.label === 'string';
}

function compactViolatingTrades(result: LintResult): CoachViolatingTrade[] {
  return result.annotated_trades
    .filter((trade) => trade.is_rule_violated)
    .slice()
    .sort((a, b) => b.disciplined_pnl - b.pnl - (a.disciplined_pnl - a.pnl))
    .slice(0, MAX_COACH_VIOLATING_TRADES)
    .map((trade) => ({
      ticket_id: trade.ticket_id,
      symbol: trade.symbol,
      pnl: trade.pnl,
      violations: trade.violations,
    }));
}

export function compactLintForCoach(
  result: LintResult,
  account?: CoachingAccountContext,
): CoachPayload {
  return {
    readiness_score: result.readiness_score,
    actual_pnl: result.actual_pnl,
    disciplined_pnl: result.disciplined_pnl,
    money_lost_to_mistakes: result.money_lost_to_mistakes,
    metrics: {
      total_trades: result.metrics.total_trades,
      wins: result.metrics.wins,
      losses: result.metrics.losses,
      win_rate: result.metrics.win_rate,
      revenge_trade_count: result.metrics.revenge_trade_count,
      trades_without_sl: result.metrics.trades_without_sl,
      over_leverage_count: result.metrics.over_leverage_count,
      news_trade_count: result.metrics.news_trade_count,
    },
    top_destructive_habits: result.top_destructive_habits.slice(0, MAX_COACH_HABITS),
    sessions: result.sessions,
    drawdown: result.drawdown,
    top_violating_trades: compactViolatingTrades(result),
    account: defaultAccount(account),
  };
}

export function isCoachPayload(value: unknown): value is CoachPayload {
  if (typeof value !== 'object' || value == null) return false;
  const payload = value as CoachPayload;
  if (typeof payload.readiness_score !== 'number') return false;
  if (typeof payload.actual_pnl !== 'number') return false;
  if (typeof payload.disciplined_pnl !== 'number') return false;
  if (typeof payload.money_lost_to_mistakes !== 'number') return false;
  if (typeof payload.metrics !== 'object' || payload.metrics == null) return false;
  if (!Array.isArray(payload.top_destructive_habits)) return false;
  if (!Array.isArray(payload.sessions)) return false;
  if (typeof payload.drawdown !== 'object' || payload.drawdown == null) return false;
  if (!Array.isArray(payload.top_violating_trades)) return false;
  return METRIC_KEYS.every((key) => typeof payload.metrics[key] === 'number');
}

export function looksLikeLintResult(value: unknown): value is LintResult {
  if (typeof value !== 'object' || value == null) return false;
  const result = value as LintResult;
  return (
    typeof result.readiness_score === 'number' &&
    typeof result.metrics === 'object' &&
    result.metrics != null &&
    Array.isArray(result.top_destructive_habits) &&
    Array.isArray(result.sessions) &&
    Array.isArray(result.annotated_trades)
  );
}

export function parseCoachRequest(body: unknown): CoachPayload | { error: string } {
  if (typeof body !== 'object' || body == null) {
    return { error: 'Expected a JSON coaching payload.' };
  }

  const record = body as Record<string, unknown>;
  const account = record.account as CoachingAccountContext | undefined;

  if (looksLikeLintResult(body)) {
    return compactLintForCoach(body, account);
  }

  if (isCoachPayload(body)) {
    return {
      ...body,
      top_destructive_habits: body.top_destructive_habits.filter(isHabit).slice(0, MAX_COACH_HABITS),
      sessions: body.sessions.filter(isSession),
      top_violating_trades: body.top_violating_trades.slice(0, MAX_COACH_VIOLATING_TRADES),
      account: defaultAccount(body.account ?? account),
    };
  }

  if (typeof record.readiness_score === 'number' && typeof record.metrics === 'object') {
    const metrics = record.metrics as Record<string, unknown>;
    const drawdown = (record.drawdown ?? {}) as Partial<DrawdownMetrics>;
    return {
      readiness_score: asFinite(record.readiness_score),
      actual_pnl: asFinite(record.actual_pnl),
      disciplined_pnl: asFinite(record.disciplined_pnl),
      money_lost_to_mistakes: asFinite(record.money_lost_to_mistakes),
      metrics: {
        total_trades: asFinite(metrics.total_trades),
        wins: asFinite(metrics.wins),
        losses: asFinite(metrics.losses),
        win_rate: asFinite(metrics.win_rate),
        revenge_trade_count: asFinite(metrics.revenge_trade_count),
        trades_without_sl: asFinite(metrics.trades_without_sl),
        over_leverage_count: asFinite(metrics.over_leverage_count),
        news_trade_count: asFinite(metrics.news_trade_count),
      },
      top_destructive_habits: Array.isArray(record.top_destructive_habits)
        ? record.top_destructive_habits.filter(isHabit).slice(0, MAX_COACH_HABITS)
        : [],
      sessions: Array.isArray(record.sessions) ? record.sessions.filter(isSession) : [],
      drawdown: {
        daily_drawdown_pct: asFinite(drawdown.daily_drawdown_pct),
        total_drawdown_pct: asFinite(drawdown.total_drawdown_pct),
        daily_limit_pct: asFinite(drawdown.daily_limit_pct, DEFAULT_LINT_ACCOUNT.max_daily_drawdown_pct),
        total_limit_pct: asFinite(drawdown.total_limit_pct, DEFAULT_LINT_ACCOUNT.max_total_drawdown_pct),
        daily_breached: Boolean(drawdown.daily_breached),
        total_breached: Boolean(drawdown.total_breached),
      },
      top_violating_trades: Array.isArray(record.top_violating_trades)
        ? (record.top_violating_trades as CoachViolatingTrade[]).slice(0, MAX_COACH_VIOLATING_TRADES)
        : [],
      account: defaultAccount(account),
    };
  }

  return { error: 'Invalid coaching payload.' };
}

export function worstSession(sessions: readonly SessionStats[]): SessionStats | null {
  const active = sessions.filter((session) => session.trades > 0);
  if (active.length === 0) return null;
  return active.slice().sort((a, b) => a.win_rate - b.win_rate || a.pnl - b.pnl)[0] ?? null;
}
