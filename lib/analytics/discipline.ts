import type {
  AnnotatedTrade,
  DrawdownMetrics,
  EquityPoint,
  LintContextInput,
  LintableTrade,
  ViolationType,
} from '@/types';
import type { ViolationIndex } from './detectViolations';
import { sortByCloseTime, ticketOf, utcDayKey } from './tradeUtils';

export const DEFAULT_RISK_CAP_PCT = 0.01;

/**
 * Disciplined PnL rule:
 * 1. Sort trades by close_time.
 * 2. REVENGE_TRADE tickets are dropped (treated as never taken) → contribution 0.
 * 3. Losing NO_OR_REMOVED_SL / SL_REMOVED tickets are capped at
 *    -(initial_balance * maxRiskPerTradePct). Default cap is 1% of initial balance.
 *    A -3.5% no-SL loss on a $10k account becomes -$100.
 * 4. Every other trade keeps its real pnl.
 * 5. Both equity curves start at initial_balance and accumulate in close_time order.
 */
export function disciplinedContribution(
  trade: LintableTrade,
  types: readonly ViolationType[],
  riskCap: number,
): number {
  if (types.includes('REVENGE_TRADE')) return 0;
  if (
    (types.includes('NO_OR_REMOVED_SL') || types.includes('SL_REMOVED')) &&
    trade.pnl < -riskCap
  ) {
    return -riskCap;
  }
  return trade.pnl;
}

export interface DisciplineSeries {
  actual_pnl: number;
  disciplined_pnl: number;
  money_lost_to_mistakes: number;
  equity_curve: EquityPoint[];
  annotated_trades: AnnotatedTrade[];
  drawdown: DrawdownMetrics;
}

export function buildDisciplineSeries(
  trades: readonly LintableTrade[],
  context: LintContextInput,
  detected: ViolationIndex,
): DisciplineSeries {
  const ordered = sortByCloseTime(trades);
  const initial = context.account.initial_balance;
  const riskCap = initial * (context.maxRiskPerTradePct ?? DEFAULT_RISK_CAP_PCT);
  const dailyLimit = context.account.max_daily_drawdown_pct || 5;
  const totalLimit = context.account.max_total_drawdown_pct || 10;

  let actualEquity = initial;
  let disciplinedEquity = initial;
  let peak = initial;
  let totalDdPct = 0;
  let maxDailyDdPct = 0;

  let dayKey = '';
  let dayPeak = initial;

  const equity_curve: EquityPoint[] = [];
  const annotated_trades: AnnotatedTrade[] = [];

  for (let i = 0; i < ordered.length; i += 1) {
    const trade = ordered[i];
    const violations = detected.byIndex.get(i) ?? [];
    const adjusted = disciplinedContribution(trade, violations, riskCap);

    actualEquity += trade.pnl;
    disciplinedEquity += adjusted;

    const closeDay = utcDayKey(trade.close_time);
    if (closeDay !== dayKey) {
      dayKey = closeDay;
      dayPeak = actualEquity - trade.pnl;
    }
    dayPeak = Math.max(dayPeak, actualEquity);
    peak = Math.max(peak, actualEquity);

    totalDdPct = Math.max(totalDdPct, ((peak - actualEquity) / initial) * 100);
    maxDailyDdPct = Math.max(maxDailyDdPct, ((dayPeak - actualEquity) / initial) * 100);

    equity_curve.push({
      index: i,
      ticket_id: ticketOf(trade, i),
      time: trade.close_time,
      actual_equity: actualEquity,
      disciplined_equity: disciplinedEquity,
      actual_pnl: trade.pnl,
      disciplined_pnl: adjusted,
    });

    annotated_trades.push({
      ticket_id: trade.ticket_id,
      symbol: trade.symbol,
      trade_type: trade.trade_type,
      lot_size: trade.lot_size,
      open_price: trade.open_price,
      close_price: trade.close_price,
      sl_price: trade.sl_price,
      tp_price: trade.tp_price,
      pnl: trade.pnl,
      disciplined_pnl: adjusted,
      open_time: trade.open_time,
      close_time: trade.close_time,
      duration_seconds: trade.duration_seconds,
      is_rule_violated: violations.length > 0,
      violations,
    });
  }

  const actual_pnl = actualEquity - initial;
  const disciplined_pnl = disciplinedEquity - initial;

  return {
    actual_pnl,
    disciplined_pnl,
    money_lost_to_mistakes: Math.max(0, disciplined_pnl - actual_pnl),
    equity_curve,
    annotated_trades,
    drawdown: {
      daily_drawdown_pct: maxDailyDdPct,
      total_drawdown_pct: totalDdPct,
      daily_limit_pct: dailyLimit,
      total_limit_pct: totalLimit,
      daily_breached: maxDailyDdPct >= dailyLimit,
      total_breached: totalDdPct >= totalLimit,
    },
  };
}
