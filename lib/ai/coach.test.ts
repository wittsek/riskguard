import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LintResult, NormalizedTradeInput } from '@/types';
import { lintTrades } from '@/lib/analytics';
import {
  MAX_COACH_VIOLATING_TRADES,
  compactLintForCoach,
  parseCoachRequest,
} from './compact';
import { generateCoaching } from './coach';
import { buildRuleBasedCoaching } from './ruleBased';

function trade(
  partial: Partial<NormalizedTradeInput> & Pick<NormalizedTradeInput, 'pnl' | 'open_time' | 'close_time'>,
): NormalizedTradeInput {
  return {
    ticket_id: partial.ticket_id ?? 'T',
    symbol: partial.symbol ?? 'EURUSD',
    trade_type: partial.trade_type ?? 'BUY',
    lot_size: partial.lot_size ?? 0.1,
    open_price: partial.open_price ?? 1.08,
    close_price: partial.close_price ?? 1.081,
    sl_price: partial.sl_price === undefined ? 1.07 : partial.sl_price,
    tp_price: partial.tp_price ?? 1.09,
    pnl: partial.pnl,
    open_time: partial.open_time,
    close_time: partial.close_time,
    duration_seconds: partial.duration_seconds ?? 600,
  };
}

const account = {
  initial_balance: 10_000,
  max_daily_drawdown_pct: 5,
  max_total_drawdown_pct: 10,
  target_firm: 'FTMO' as const,
};

/** Revenge re-entry plus a missing-SL blowup — the required fixture. */
export function revengeAndMissingSlLint(): LintResult {
  return lintTrades(
    [
      trade({
        ticket_id: '1',
        pnl: -50,
        lot_size: 0.1,
        open_time: '2024-03-04T10:00:00.000Z',
        close_time: '2024-03-04T10:20:00.000Z',
      }),
      trade({
        ticket_id: '2',
        pnl: -80,
        lot_size: 0.2,
        open_time: '2024-03-04T10:28:00.000Z',
        close_time: '2024-03-04T10:50:00.000Z',
      }),
      trade({
        ticket_id: '3',
        symbol: 'XAUUSD',
        sl_price: null,
        pnl: -240,
        open_time: '2024-03-04T14:20:00.000Z',
        close_time: '2024-03-04T15:10:00.000Z',
      }),
    ],
    { account },
  );
}

describe('buildRuleBasedCoaching', () => {
  it('writes an actionable summary from revenge + missing SL lint output', () => {
    const result = revengeAndMissingSlLint();
    expect(result.metrics.revenge_trade_count).toBeGreaterThan(0);
    expect(result.metrics.trades_without_sl).toBeGreaterThan(0);

    const notes = buildRuleBasedCoaching(result);

    expect(notes.source).toBe('rule');
    expect(notes.summary.length).toBeGreaterThan(80);
    expect(notes.headline).toMatch(/leak|mistake|Revenge|Stop/i);
    expect(notes.summary).toMatch(/Revenge/i);
    expect(notes.summary).toMatch(/Stop-Loss|stop/i);
    expect(notes.summary).toMatch(/Readiness/);
    expect(notes.summary).toContain(String(result.readiness_score));
    expect(notes.summary).toMatch(/money lost to mistakes/i);
    expect(notes.summary).toMatch(/not financial advice/i);
    expect(notes.bullets).toHaveLength(3);
    expect(notes.bullets?.some((rule) => /15 minutes|re-entry/i.test(rule))).toBe(true);
    expect(notes.bullets?.some((rule) => /stop/i.test(rule))).toBe(true);
  });

  it('still returns notes when the book is clean', () => {
    const result = lintTrades(
      [
        trade({
          ticket_id: 'clean',
          pnl: 40,
          sl_price: 1.07,
          open_time: '2024-03-04T10:00:00.000Z',
          close_time: '2024-03-04T10:20:00.000Z',
        }),
      ],
      { account },
    );
    const notes = buildRuleBasedCoaching(result);
    expect(notes.summary).toMatch(/did not flag|risk rules/i);
    expect(notes.source).toBe('rule');
  });
});

describe('compactLintForCoach / parseCoachRequest', () => {
  it('sends aggregates and a capped violating-trade list, not the full book', () => {
    const result = revengeAndMissingSlLint();
    const payload = compactLintForCoach(result, account);

    expect(payload.readiness_score).toBe(result.readiness_score);
    expect(payload.money_lost_to_mistakes).toBe(result.money_lost_to_mistakes);
    expect(payload.top_violating_trades.length).toBeGreaterThan(0);
    expect(payload.top_violating_trades.length).toBeLessThanOrEqual(MAX_COACH_VIOLATING_TRADES);
    expect(payload).not.toHaveProperty('annotated_trades');
    expect(payload).not.toHaveProperty('equity_curve');
    expect('error' in parseCoachRequest(payload)).toBe(false);
    expect(parseCoachRequest({})).toEqual({ error: 'Invalid coaching payload.' });
  });
});

describe('generateCoaching', () => {
  const originalKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses the rule-based path when no API key is set', async () => {
    delete process.env.OPENAI_API_KEY;
    const result = revengeAndMissingSlLint();
    const notes = await generateCoaching(result);
    expect(notes.source).toBe('rule');
    expect(notes.summary).toBe(buildRuleBasedCoaching(result).summary);
  });

  it('skips the LLM when forceRuleBased is set even if a key exists', async () => {
    process.env.OPENAI_API_KEY = 'sk-test-not-used';
    const notes = await generateCoaching(revengeAndMissingSlLint(), { forceRuleBased: true });
    expect(notes.source).toBe('rule');
    expect(notes.summary).toMatch(/Revenge/i);
  });
});
