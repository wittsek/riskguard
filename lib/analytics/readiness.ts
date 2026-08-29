import type { DrawdownMetrics } from '@/types';

/**
 * Prop Readiness Score (0–100):
 * - 45% daily drawdown headroom vs the account daily limit (default 5%).
 * - 35% total drawdown headroom vs the account max total limit (default 10%).
 * - 20% clean-trade ratio (1 − unique violated trades / total trades).
 * - If daily or total drawdown is already breached, the score is capped at 40.
 * - Empty books score 0 (not enough evidence to call the account ready).
 */
export function computeReadinessScore(
  drawdown: DrawdownMetrics,
  violatedTradeCount: number,
  totalTrades: number,
): number {
  if (totalTrades === 0) return 0;

  const dailyUsage = drawdown.daily_limit_pct > 0
    ? Math.min(1, drawdown.daily_drawdown_pct / drawdown.daily_limit_pct)
    : 0;
  const totalUsage = drawdown.total_limit_pct > 0
    ? Math.min(1, drawdown.total_drawdown_pct / drawdown.total_limit_pct)
    : 0;
  const density = Math.min(1, violatedTradeCount / totalTrades);

  let score =
    100 * (0.45 * (1 - dailyUsage) + 0.35 * (1 - totalUsage) + 0.2 * (1 - density));

  if (drawdown.daily_breached || drawdown.total_breached) {
    score = Math.min(score, 40);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
