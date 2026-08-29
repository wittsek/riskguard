import { describe, expect, it } from 'vitest';
import { lintTrades } from '@/lib/analytics';
import { parseTradeCsv } from '@/lib/parsers';
import { SAMPLE_CSV } from '@/lib/sample/sampleCsv';
import type { DestructiveHabit, LintResult, SessionStats } from '@/types';
import {
  buildAuditCardModel,
  formatLeakAmount,
  formatPnlDelta,
  readinessLabel,
  selectAuditCardChips,
} from './auditCard';

function habit(partial: Partial<DestructiveHabit> & Pick<DestructiveHabit, 'type'>): DestructiveHabit {
  return {
    label: partial.label ?? partial.type,
    count: partial.count ?? 2,
    money_lost: partial.money_lost ?? 120,
    ...partial,
  };
}

function session(partial: Partial<SessionStats> & Pick<SessionStats, 'session' | 'label'>): SessionStats {
  return {
    trades: partial.trades ?? 4,
    wins: partial.wins ?? 1,
    losses: partial.losses ?? 3,
    win_rate: partial.win_rate ?? 0.25,
    pnl: partial.pnl ?? -200,
    ...partial,
  };
}

function emptyResult(overrides: Partial<LintResult> = {}): LintResult {
  return {
    violations: [],
    metrics: {
      total_trades: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
      profit_factor: null,
      average_rr: null,
      trades_without_sl: 0,
      revenge_trade_count: 0,
      over_leverage_count: 0,
      news_trade_count: 0,
      sl_removed_count: 0,
    },
    readiness_score: 100,
    actual_pnl: 0,
    disciplined_pnl: 0,
    money_lost_to_mistakes: 0,
    top_destructive_habits: [],
    sessions: [],
    equity_curve: [],
    drawdown: {
      daily_drawdown_pct: 0,
      total_drawdown_pct: 0,
      daily_limit_pct: 5,
      total_limit_pct: 10,
      daily_breached: false,
      total_breached: false,
    },
    annotated_trades: [],
    ...overrides,
  };
}

describe('audit card formatters', () => {
  it('formats leak dollars without a plus sign', () => {
    expect(formatLeakAmount(435)).toBe('$435');
    expect(formatLeakAmount(0)).toBe('$0');
    expect(formatLeakAmount(-80)).toBe('$80');
  });

  it('labels readiness bands', () => {
    expect(readinessLabel(80)).toBe('Prop-ready');
    expect(readinessLabel(50)).toBe('Needs work');
    expect(readinessLabel(49)).toBe('Not ready');
  });

  it('describes the actual vs disciplined gap', () => {
    expect(formatPnlDelta(-365, 70)).toBe('$435 behind disciplined PnL');
    expect(formatPnlDelta(100, 100)).toBe('In line with a disciplined book');
    expect(formatPnlDelta(200, 150)).toBe('$50 ahead of disciplined PnL');
  });
});

describe('selectAuditCardChips', () => {
  it('prefers revenge, missing SL, and the worst session', () => {
    const chips = selectAuditCardChips({
      top_destructive_habits: [
        habit({ type: 'NEWS_TRADING', money_lost: 10 }),
        habit({ type: 'REVENGE_TRADE', money_lost: 180 }),
        habit({ type: 'NO_OR_REMOVED_SL', money_lost: 240 }),
      ],
      sessions: [
        session({ session: 'london', label: 'London', win_rate: 0.2, pnl: -280, trades: 6 }),
        session({ session: 'asian', label: 'Asian', win_rate: 0.6, pnl: 40, trades: 4 }),
      ],
    });

    expect(chips.map((chip) => chip.kind)).toEqual(['revenge', 'missing_sl', 'worst_session']);
    expect(chips[0]?.detail).toBe('$180');
    expect(chips[1]?.label).toBe('Missing SL');
    expect(chips[2]?.label).toBe('Worst: London');
  });

  it('stays empty when there are no habits or sessions', () => {
    expect(selectAuditCardChips({ top_destructive_habits: [], sessions: [] })).toEqual([]);
  });
});

describe('buildAuditCardModel', () => {
  it('does not throw on an empty lint result', () => {
    const model = buildAuditCardModel(emptyResult());
    expect(model.leakHeadline).toBe('$0');
    expect(model.leakCaption).toContain('no leak');
    expect(model.readinessScore).toBe(100);
    expect(model.chips).toEqual([]);
    expect(model.tradeCount).toBe(0);
  });

  it('mirrors the sample CSV lint numbers', () => {
    const parsed = parseTradeCsv(SAMPLE_CSV);
    const result = lintTrades(parsed.trades, {
      account: {
        initial_balance: 10_000,
        max_daily_drawdown_pct: 5,
        max_total_drawdown_pct: 10,
        target_firm: 'FTMO',
      },
    });
    const model = buildAuditCardModel(result);

    expect(model.leakHeadline).toBe(formatLeakAmount(result.money_lost_to_mistakes));
    expect(model.readinessScore).toBe(result.readiness_score);
    expect(model.actualPnl).toContain(String(Math.abs(Math.round(result.actual_pnl))));
    expect(model.disciplinedPnl).toContain(String(Math.abs(Math.round(result.disciplined_pnl))));
    expect(model.tradeCount).toBe(15);
    expect(model.chips.some((chip) => chip.kind === 'revenge')).toBe(true);
    expect(model.chips.some((chip) => chip.kind === 'missing_sl')).toBe(true);
    expect(model.chips.some((chip) => chip.kind === 'worst_session')).toBe(true);
  });
});
