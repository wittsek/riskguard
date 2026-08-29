import { CANONICAL_SL_VIOLATION } from '@/types';
import type {
  LintContextInput,
  LintSeverity,
  LintViolation,
  LintableTrade,
  NewsWindow,
  ViolationType,
} from '@/types';
import { isMissingStopLoss, sortByCloseTime, ticketOf } from './tradeUtils';

export const DEFAULT_REVENGE_WINDOW_SECONDS = 15 * 60;
export const REVENGE_LOT_MULTIPLIER = 1.5;
const STANDARD_FX_LOT = 100_000;

export interface ViolationIndex {
  violations: LintViolation[];
  byIndex: Map<number, ViolationType[]>;
}

function severityForSl(trade: LintableTrade, riskCap: number): LintSeverity {
  if (trade.pnl <= -riskCap) return 'high';
  if (trade.pnl < 0) return 'medium';
  return 'low';
}

function newsSeverity(window: NewsWindow): LintSeverity {
  if (window.impact === 'high') return 'high';
  if (window.impact === 'medium') return 'medium';
  return 'low';
}

function equityJustBeforeOpen(
  trade: LintableTrade,
  closedOrder: LintableTrade[],
  initialBalance: number,
): number {
  const openMs = Date.parse(trade.open_time);
  let equity = initialBalance;
  for (const prior of closedOrder) {
    if (Date.parse(prior.close_time) <= openMs) equity += prior.pnl;
  }
  return Math.max(equity, 1);
}

export function detectViolations(
  trades: readonly LintableTrade[],
  context: LintContextInput,
): ViolationIndex {
  const ordered = sortByCloseTime(trades);
  const windowSeconds = context.revengeWindowSeconds ?? DEFAULT_REVENGE_WINDOW_SECONDS;
  const windowMs = windowSeconds * 1000;
  const riskCap = context.account.initial_balance * (context.maxRiskPerTradePct ?? 0.01);
  const byIndex = new Map<number, ViolationType[]>();
  const violations: LintViolation[] = [];

  const push = (
    index: number,
    trade: LintableTrade,
    type: ViolationType,
    severity: LintSeverity,
    message: string,
    extra?: Partial<LintViolation>,
  ) => {
    const list = byIndex.get(index) ?? [];
    if (!list.includes(type)) list.push(type);
    byIndex.set(index, list);
    violations.push({
      type,
      severity,
      ticket_id: ticketOf(trade, index),
      symbol: trade.symbol,
      open_time: trade.open_time,
      message,
      pnl_impact: trade.pnl < 0 ? trade.pnl : 0,
      ...extra,
    });
  };

  for (let i = 0; i < ordered.length; i += 1) {
    const trade = ordered[i];

    if (isMissingStopLoss(trade)) {
      push(
        i,
        trade,
        CANONICAL_SL_VIOLATION,
        severityForSl(trade, riskCap),
        `No stop-loss on ${trade.symbol} (${ticketOf(trade, i)}).`,
      );
    }

    if (i > 0) {
      const prev = ordered[i - 1];
      const gapMs = Date.parse(trade.open_time) - Date.parse(prev.close_time);
      const isRevenge =
        prev.pnl < 0 &&
        gapMs >= 0 &&
        gapMs <= windowMs &&
        trade.lot_size + 1e-9 >= prev.lot_size * REVENGE_LOT_MULTIPLIER;

      if (isRevenge) {
        push(
          i,
          trade,
          'REVENGE_TRADE',
          'high',
          `Re-entered ${trade.symbol} ${Math.round(gapMs / 1000)}s after a loss at ${trade.lot_size} lots (≥ ${REVENGE_LOT_MULTIPLIER}× prior size).`,
          { related_ticket_ids: [ticketOf(prev, i - 1)].filter(Boolean) as string[], meta: { gap_seconds: gapMs / 1000, prior_lot: prev.lot_size } },
        );
      }
    }

    if (context.maxLeverage != null && context.maxLeverage > 0) {
      const equity = equityJustBeforeOpen(trade, ordered, context.account.initial_balance);
      const notional = trade.lot_size * STANDARD_FX_LOT;
      const leverage = notional / equity;
      if (leverage > context.maxLeverage) {
        push(
          i,
          trade,
          'OVER_LEVERAGE',
          'high',
          `Estimated leverage ${leverage.toFixed(1)}× exceeds the ${context.maxLeverage}× cap.`,
          { meta: { leverage, notional, equity } },
        );
      }
    }

    if (context.newsWindows?.length) {
      const openMs = Date.parse(trade.open_time);
      const hit = context.newsWindows.find((window) => {
        if (window.symbol && window.symbol.toUpperCase() !== trade.symbol.toUpperCase()) {
          return false;
        }
        return openMs >= Date.parse(window.starts_at) && openMs <= Date.parse(window.ends_at);
      });
      if (hit) {
        push(
          i,
          trade,
          'NEWS_TRADING',
          newsSeverity(hit),
          `Opened during news window${hit.title ? ` (${hit.title})` : ''}.`,
          { meta: { title: hit.title, impact: hit.impact } },
        );
      }
    }
  }

  return { violations, byIndex };
}
