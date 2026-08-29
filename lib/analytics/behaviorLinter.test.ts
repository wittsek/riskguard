import { describe, expect, it } from 'vitest';
import type { LintableTrade, NormalizedTradeInput } from '@/types';
import { lintTrades } from './behaviorLinter';
import { computeReadinessScore } from './readiness';
import { sessionForOpenTime } from './sessions';

function trade(partial: Partial<NormalizedTradeInput> & Pick<NormalizedTradeInput, 'pnl' | 'open_time' | 'close_time'>): NormalizedTradeInput {
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

describe('lintTrades — revenge trading', () => {
  it('flags a re-entry within 15 minutes at ≥ 1.5× lot after a loss', () => {
    const trades: LintableTrade[] = [
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
        lot_size: 0.15,
        open_time: '2024-03-04T10:30:00.000Z',
        close_time: '2024-03-04T10:50:00.000Z',
      }),
    ];

    const result = lintTrades(trades, { account });
    const revenge = result.violations.filter((v) => v.type === 'REVENGE_TRADE');
    expect(revenge).toHaveLength(1);
    expect(revenge[0].ticket_id).toBe('2');
    expect(result.metrics.revenge_trade_count).toBe(1);
    expect(result.annotated_trades[1].disciplined_pnl).toBe(0);
  });

  it('does not flag when the gap is over 15 minutes or size is below 1.5×', () => {
    const late = lintTrades(
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
          pnl: -10,
          lot_size: 0.2,
          open_time: '2024-03-04T10:36:00.000Z',
          close_time: '2024-03-04T10:50:00.000Z',
        }),
      ],
      { account },
    );
    expect(late.metrics.revenge_trade_count).toBe(0);

    const small = lintTrades(
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
          pnl: -10,
          lot_size: 0.14,
          open_time: '2024-03-04T10:25:00.000Z',
          close_time: '2024-03-04T10:40:00.000Z',
        }),
      ],
      { account },
    );
    expect(small.metrics.revenge_trade_count).toBe(0);
  });
});

describe('lintTrades — missing stop-loss', () => {
  it('flags null or zero SL as NO_OR_REMOVED_SL', () => {
    const result = lintTrades(
      [
        trade({
          ticket_id: 'a',
          sl_price: null,
          pnl: -20,
          open_time: '2024-03-04T08:00:00.000Z',
          close_time: '2024-03-04T08:30:00.000Z',
        }),
        trade({
          ticket_id: 'b',
          sl_price: 0,
          pnl: 10,
          open_time: '2024-03-04T09:00:00.000Z',
          close_time: '2024-03-04T09:20:00.000Z',
        }),
        trade({
          ticket_id: 'c',
          sl_price: 1.07,
          pnl: 15,
          open_time: '2024-03-04T10:00:00.000Z',
          close_time: '2024-03-04T10:20:00.000Z',
        }),
      ],
      { account },
    );

    const sl = result.violations.filter((v) => v.type === 'NO_OR_REMOVED_SL');
    expect(sl.map((v) => v.ticket_id)).toEqual(['a', 'b']);
    expect(result.metrics.trades_without_sl).toBe(2);
  });
});

describe('lintTrades — equity curves and discipline PnL', () => {
  it('accumulates actual equity and drops revenge / caps no-SL blowups', () => {
    const result = lintTrades(
      [
        trade({
          ticket_id: 'w',
          pnl: 100,
          lot_size: 0.1,
          sl_price: 1.07,
          open_time: '2024-03-04T08:00:00.000Z',
          close_time: '2024-03-04T08:30:00.000Z',
        }),
        trade({
          ticket_id: 'loss',
          pnl: -50,
          lot_size: 0.1,
          sl_price: 1.07,
          open_time: '2024-03-04T09:00:00.000Z',
          close_time: '2024-03-04T09:10:00.000Z',
        }),
        trade({
          ticket_id: 'revenge',
          pnl: -80,
          lot_size: 0.2,
          sl_price: 1.07,
          open_time: '2024-03-04T09:15:00.000Z',
          close_time: '2024-03-04T09:40:00.000Z',
        }),
        trade({
          ticket_id: 'nosl',
          pnl: -250,
          lot_size: 0.1,
          sl_price: null,
          open_time: '2024-03-04T14:00:00.000Z',
          close_time: '2024-03-04T14:30:00.000Z',
        }),
      ],
      { account },
    );

    expect(result.actual_pnl).toBe(100 - 50 - 80 - 250);
    // revenge dropped (0), no-SL capped at 1% of 10k = -100
    expect(result.disciplined_pnl).toBe(100 - 50 + 0 - 100);
    expect(result.money_lost_to_mistakes).toBe(result.disciplined_pnl - result.actual_pnl);
    expect(result.equity_curve).toHaveLength(4);
    expect(result.equity_curve[0].actual_equity).toBe(10_100);
    expect(result.equity_curve[3].disciplined_equity).toBe(10_000 + result.disciplined_pnl);
  });
});

describe('lintTrades — sessions', () => {
  it('buckets UTC open hours into Asian / London / NY / off-hours', () => {
    expect(sessionForOpenTime('2024-03-04T02:00:00.000Z')).toBe('asian');
    expect(sessionForOpenTime('2024-03-04T09:00:00.000Z')).toBe('london');
    expect(sessionForOpenTime('2024-03-04T15:00:00.000Z')).toBe('new_york');
    expect(sessionForOpenTime('2024-03-04T22:30:00.000Z')).toBe('off_hours');

    const result = lintTrades(
      [
        trade({
          ticket_id: 'as',
          pnl: 20,
          open_time: '2024-03-04T02:00:00.000Z',
          close_time: '2024-03-04T02:20:00.000Z',
        }),
        trade({
          ticket_id: 'ld',
          pnl: -10,
          open_time: '2024-03-04T09:00:00.000Z',
          close_time: '2024-03-04T09:20:00.000Z',
        }),
      ],
      { account },
    );

    const asian = result.sessions.find((s) => s.session === 'asian');
    const london = result.sessions.find((s) => s.session === 'london');
    expect(asian?.trades).toBe(1);
    expect(asian?.win_rate).toBe(1);
    expect(asian?.pnl).toBe(20);
    expect(london?.wins).toBe(0);
    expect(london?.pnl).toBe(-10);
  });
});

describe('lintTrades — drawdown and readiness', () => {
  it('measures peak-to-trough daily/total DD vs account limits', () => {
    const result = lintTrades(
      [
        trade({
          ticket_id: '1',
          pnl: 200,
          sl_price: 1.07,
          open_time: '2024-03-04T08:00:00.000Z',
          close_time: '2024-03-04T08:30:00.000Z',
        }),
        trade({
          ticket_id: '2',
          pnl: -800,
          sl_price: 1.07,
          open_time: '2024-03-04T09:00:00.000Z',
          close_time: '2024-03-04T09:30:00.000Z',
        }),
      ],
      { account },
    );

    // Peak 10200, trough 9400 → 800 / 10000 = 8%
    expect(result.drawdown.total_drawdown_pct).toBeCloseTo(8);
    expect(result.drawdown.daily_drawdown_pct).toBeCloseTo(8);
    expect(result.drawdown.daily_limit_pct).toBe(5);
    expect(result.drawdown.total_limit_pct).toBe(10);
    expect(result.drawdown.daily_breached).toBe(true);
    expect(result.drawdown.total_breached).toBe(false);
    expect(result.readiness_score).toBeLessThanOrEqual(40);
  });

  it('scores higher when drawdown is small and violations are rare', () => {
    const clean = computeReadinessScore(
      {
        daily_drawdown_pct: 1,
        total_drawdown_pct: 2,
        daily_limit_pct: 5,
        total_limit_pct: 10,
        daily_breached: false,
        total_breached: false,
      },
      0,
      10,
    );
    const messy = computeReadinessScore(
      {
        daily_drawdown_pct: 4,
        total_drawdown_pct: 8,
        daily_limit_pct: 5,
        total_limit_pct: 10,
        daily_breached: false,
        total_breached: false,
      },
      5,
      10,
    );
    expect(clean).toBeGreaterThan(messy);
    expect(clean).toBeGreaterThan(70);
  });

  it('parses the bundled sample CSV and finds revenge plus missing SL', async () => {
    const { parseTradeCsv } = await import('@/lib/parsers');
    const { SAMPLE_CSV } = await import('@/lib/sample/sampleCsv');
    const parsed = parseTradeCsv(SAMPLE_CSV);
    expect(parsed.errors).toEqual([]);
    expect(parsed.trades).toHaveLength(15);

    const result = lintTrades(parsed.trades, { account });
    expect(result.metrics.revenge_trade_count).toBe(2);
    expect(result.metrics.trades_without_sl).toBe(2);
    expect(result.money_lost_to_mistakes).toBeGreaterThan(0);
    expect(result.equity_curve).toHaveLength(15);
  });

  it('accepts a full LintContext object', () => {
    const result = lintTrades({
      account,
      trades: [
        trade({
          ticket_id: 'x',
          pnl: 12,
          open_time: '2024-03-04T08:00:00.000Z',
          close_time: '2024-03-04T08:10:00.000Z',
        }),
      ],
    });
    expect(result.metrics.total_trades).toBe(1);
    expect(result.actual_pnl).toBe(12);
  });
});
