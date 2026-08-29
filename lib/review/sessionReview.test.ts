import { describe, expect, it } from 'vitest';
import { revengeAndMissingSlLint } from '@/lib/ai/coach.test';
import { buildRuleBasedCoaching } from '@/lib/ai/ruleBased';
import { lintTrades } from '@/lib/analytics';
import { buildSampleAudit } from '@/lib/sample/buildSampleAudit';
import type { NormalizedTradeInput } from '@/types';
import { buildSessionReview } from './sessionReview';

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

describe('buildSessionReview', () => {
  it('auto-fills revenge, missing SL, weakest session, leak, readiness, and 3 rules', () => {
    const result = revengeAndMissingSlLint();
    expect(result.metrics.revenge_trade_count).toBeGreaterThan(0);
    expect(result.metrics.trades_without_sl).toBeGreaterThan(0);

    const review = buildSessionReview(result);
    const coach = buildRuleBasedCoaching(result);

    expect(review.trade_count).toBe(3);
    expect(review.date_range?.label).toMatch(/Mar 4, 2024/);
    expect(review.counts.revenge).toBe(result.metrics.revenge_trade_count);
    expect(review.counts.missing_sl).toBe(result.metrics.trades_without_sl);
    expect(review.weakest_session).not.toBeNull();
    expect(review.weakest_session?.label).toMatch(/London|New York|Asian/);
    expect(review.leak_usd).toBe(result.money_lost_to_mistakes);
    expect(review.readiness_score).toBe(result.readiness_score);
    expect(review.next_session_rules).toHaveLength(3);
    expect(review.next_session_rules).toEqual(coach.bullets);

    expect(review.write_up).toMatch(/# Session review/);
    expect(review.write_up).toContain(`Revenge trades: ${result.metrics.revenge_trade_count}`);
    expect(review.write_up).toContain(`Missing stop-loss: ${result.metrics.trades_without_sl}`);
    expect(review.write_up).toContain(`Readiness:** ${result.readiness_score}/100`);
    expect(review.write_up).toMatch(/Weakest UTC session: (London|New York|Asian)/);
    expect(review.write_up).toMatch(/leaked/);
    expect(review.write_up).toContain(review.next_session_rules[0]);
    expect(review.write_up).toMatch(/My notes/);
  });

  it('fills the sample book the same way as a live audit', () => {
    const sample = buildSampleAudit();
    const review = buildSessionReview(sample.result, { coaching: sample.coaching });

    expect(review.trade_count).toBe(15);
    expect(review.date_range?.label).toMatch(/Mar 4, 2024/);
    expect(review.date_range?.label).toMatch(/Mar 5, 2024/);
    expect(review.counts.revenge).toBe(2);
    expect(review.counts.missing_sl).toBe(2);
    expect(review.weakest_session?.label).toBe('London');
    expect(review.weakest_session?.win_rate).toBeLessThan(0.5);
    expect(review.leak_usd).toBe(sample.result.money_lost_to_mistakes);
    expect(review.readiness_score).toBe(sample.result.readiness_score);
    expect(review.next_session_rules).toEqual(sample.coaching.bullets?.slice(0, 3));
    expect(review.write_up).toContain('Revenge trades: 2');
    expect(review.write_up).toContain('Missing stop-loss: 2');
    expect(review.write_up).toContain('London');
  });

  it('reuses provided coach rules instead of rewriting them', () => {
    const result = revengeAndMissingSlLint();
    const custom = ['Rule A from coach.', 'Rule B from coach.', 'Rule C from coach.'];
    const review = buildSessionReview(result, {
      coaching: { summary: 'custom', bullets: custom, source: 'llm' },
    });
    expect(review.next_session_rules).toEqual(custom);
    expect(review.write_up).toContain('1. Rule A from coach.');
  });

  it('still writes a review when the book is clean', () => {
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
      {
        account: {
          initial_balance: 10_000,
          max_daily_drawdown_pct: 5,
          max_total_drawdown_pct: 10,
          target_firm: 'FTMO',
        },
      },
    );
    const review = buildSessionReview(result);
    expect(review.counts.revenge).toBe(0);
    expect(review.counts.missing_sl).toBe(0);
    expect(review.write_up).toMatch(/did not flag/);
    expect(review.next_session_rules).toHaveLength(3);
  });
});
