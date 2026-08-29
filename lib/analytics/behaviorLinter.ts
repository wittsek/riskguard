import { VIOLATION_LABELS } from '@/types';
import type {
  BehaviorMetrics,
  DestructiveHabit,
  LintContext,
  LintContextInput,
  LintResult,
  LintableTrade,
  ViolationType,
} from '@/types';
import { detectViolations } from './detectViolations';
import { buildDisciplineSeries } from './discipline';
import { computeReadinessScore } from './readiness';
import { computeSessionStats } from './sessions';

export const DEFAULT_LINT_ACCOUNT: LintContextInput['account'] = {
  initial_balance: 10_000,
  max_daily_drawdown_pct: 5,
  max_total_drawdown_pct: 10,
  target_firm: 'FTMO',
};

export function defaultLintContext(): LintContextInput {
  return { account: { ...DEFAULT_LINT_ACCOUNT } };
}

function isLintContext(value: unknown): value is LintContext {
  if (typeof value !== 'object' || value == null) return false;
  const record = value as LintContext;
  return Array.isArray(record.trades) && record.account != null;
}

function resolveContext(context?: LintContextInput): LintContextInput {
  return {
    ...context,
    account: {
      ...DEFAULT_LINT_ACCOUNT,
      ...context?.account,
    },
  };
}

function buildMetrics(
  trades: readonly LintableTrade[],
  typesByTrade: ViolationType[][],
): BehaviorMetrics {
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;

  const count = (type: ViolationType) =>
    typesByTrade.filter((list) => list.includes(type)).length;

  return {
    total_trades: trades.length,
    wins: wins.length,
    losses: losses.length,
    win_rate: trades.length === 0 ? 0 : wins.length / trades.length,
    profit_factor: grossLoss === 0 ? null : grossProfit / grossLoss,
    average_rr: avgWin > 0 && avgLoss > 0 ? avgWin / avgLoss : null,
    trades_without_sl: count('NO_OR_REMOVED_SL') + count('SL_REMOVED'),
    revenge_trade_count: count('REVENGE_TRADE'),
    over_leverage_count: count('OVER_LEVERAGE'),
    news_trade_count: count('NEWS_TRADING'),
    sl_removed_count: count('NO_OR_REMOVED_SL') + count('SL_REMOVED'),
  };
}

function topHabits(
  annotated: LintResult['annotated_trades'],
): DestructiveHabit[] {
  const bucket = new Map<ViolationType, { count: number; money_lost: number }>();

  for (const trade of annotated) {
    const leak = Math.max(0, trade.disciplined_pnl - trade.pnl);
    for (const type of trade.violations) {
      const current = bucket.get(type) ?? { count: 0, money_lost: 0 };
      current.count += 1;
      current.money_lost += leak;
      bucket.set(type, current);
    }
  }

  return Array.from(bucket.entries())
    .map(([type, stats]) => ({
      type,
      label: VIOLATION_LABELS[type],
      count: stats.count,
      money_lost: stats.money_lost,
    }))
    .sort((a, b) => b.money_lost - a.money_lost || b.count - a.count);
}

function runLint(trades: readonly LintableTrade[], context: LintContextInput): LintResult {
  const detected = detectViolations(trades, context);
  const series = buildDisciplineSeries(trades, context, detected);
  const typesByTrade = series.annotated_trades.map((row) => row.violations);
  const violated = series.annotated_trades.filter((row) => row.is_rule_violated).length;

  return {
    violations: detected.violations,
    metrics: buildMetrics(trades, typesByTrade),
    readiness_score: computeReadinessScore(series.drawdown, violated, trades.length),
    actual_pnl: series.actual_pnl,
    disciplined_pnl: series.disciplined_pnl,
    money_lost_to_mistakes: series.money_lost_to_mistakes,
    top_destructive_habits: topHabits(series.annotated_trades),
    sessions: computeSessionStats(trades),
    equity_curve: series.equity_curve,
    drawdown: series.drawdown,
    annotated_trades: series.annotated_trades,
  };
}

export function lintTrades(context: LintContext): LintResult;
export function lintTrades(
  trades: readonly LintableTrade[],
  context?: LintContextInput,
): LintResult;
export function lintTrades(
  tradesOrContext: readonly LintableTrade[] | LintContext,
  context?: LintContextInput,
): LintResult {
  if (isLintContext(tradesOrContext)) {
    return runLint(tradesOrContext.trades, resolveContext(tradesOrContext));
  }
  return runLint(tradesOrContext, resolveContext(context));
}
