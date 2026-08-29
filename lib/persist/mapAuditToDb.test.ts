import { describe, expect, it } from 'vitest';
import type { AnnotatedTrade, LintResult, Tables } from '@/types';
import { tradeAnnotationKey } from '@/lib/trades/annotations';
import {
  IMPORTED_ACCOUNT_NAME,
  asFiniteNumber,
  importedAccountInsert,
  isMissingAnnotationColumnError,
  isNormalizedTrade,
  mapAnnotatedTradesToInserts,
  mapDbTradesToNormalized,
  mapLintResultToAuditInsert,
  parseRunAuditAnnotations,
  parseRunAuditTrades,
  primaryViolation,
  stripAnnotationColumns,
} from './mapAuditToDb';

const ACCOUNT_ID = '11111111-1111-4111-8111-111111111111';

function annotated(partial: Partial<AnnotatedTrade> = {}): AnnotatedTrade {
  return {
    ticket_id: '1001',
    symbol: 'EURUSD',
    trade_type: 'BUY',
    lot_size: 0.1,
    open_price: 1.08,
    close_price: 1.081,
    sl_price: 1.07,
    tp_price: 1.09,
    pnl: -80,
    disciplined_pnl: 0,
    open_time: '2024-03-04T10:00:00.000Z',
    close_time: '2024-03-04T10:20:00.000Z',
    duration_seconds: 1200,
    is_rule_violated: true,
    violations: ['REVENGE_TRADE', 'NO_OR_REMOVED_SL'],
    ...partial,
  };
}

describe('primaryViolation', () => {
  it('picks the highest-priority flag when a ticket has several', () => {
    expect(primaryViolation(['NO_OR_REMOVED_SL', 'REVENGE_TRADE'])).toBe('REVENGE_TRADE');
    expect(primaryViolation(['SL_REMOVED'])).toBe('SL_REMOVED');
    expect(primaryViolation([])).toBeNull();
  });
});

describe('mapAnnotatedTradesToInserts', () => {
  it('maps lint-annotated trades onto the trades insert shape', () => {
    const [row] = mapAnnotatedTradesToInserts([annotated()], ACCOUNT_ID);
    expect(row).toMatchObject({
      account_id: ACCOUNT_ID,
      ticket_id: '1001',
      symbol: 'EURUSD',
      trade_type: 'BUY',
      lot_size: 0.1,
      open_price: 1.08,
      pnl: -80,
      is_rule_violated: true,
      violation_type: 'REVENGE_TRADE',
      notes: null,
      setup_tags: [],
    });
  });

  it('copies session notes and setup tags onto the insert when present', () => {
    const trade = annotated();
    const [row] = mapAnnotatedTradesToInserts([trade], ACCOUNT_ID, {
      [tradeAnnotationKey(trade.ticket_id, trade.open_time)]: {
        note: 'sized up after a loss',
        setup_tags: ['Scalp'],
      },
    });
    expect(row.notes).toBe('sized up after a loss');
    expect(row.setup_tags).toEqual(['Scalp']);
  });

  it('leaves violation_type null when the ticket is clean', () => {
    const [row] = mapAnnotatedTradesToInserts(
      [annotated({ is_rule_violated: false, violations: [], pnl: 40 })],
      ACCOUNT_ID,
    );
    expect(row.violation_type).toBeNull();
    expect(row.is_rule_violated).toBe(false);
  });
});

describe('mapLintResultToAuditInsert', () => {
  it('copies summary metrics and stores the coaching string when provided', () => {
    const result = {
      readiness_score: 72,
      actual_pnl: -120,
      disciplined_pnl: 40,
      money_lost_to_mistakes: 160,
      top_destructive_habits: [
        { type: 'REVENGE_TRADE', label: 'Revenge Trading', count: 2, money_lost: 160 },
      ],
    } as LintResult;

    expect(mapLintResultToAuditInsert(result, ACCOUNT_ID)).toEqual({
      account_id: ACCOUNT_ID,
      readiness_score: 72,
      actual_pnl: -120,
      disciplined_pnl: 40,
      money_lost_to_mistakes: 160,
      top_destructive_habits: result.top_destructive_habits,
      ai_coaching_summary: null,
    });
    expect(mapLintResultToAuditInsert(result, ACCOUNT_ID, 'Wait 15 minutes after a loss.')).toEqual({
      account_id: ACCOUNT_ID,
      readiness_score: 72,
      actual_pnl: -120,
      disciplined_pnl: 40,
      money_lost_to_mistakes: 160,
      top_destructive_habits: result.top_destructive_habits,
      ai_coaching_summary: 'Wait 15 minutes after a loss.',
    });
  });
});

describe('mapDbTradesToNormalized', () => {
  it('coerces numeric strings from Postgres NUMERIC columns', () => {
    const row = {
      id: '22222222-2222-4222-8222-222222222222',
      account_id: ACCOUNT_ID,
      ticket_id: '1001',
      symbol: 'XAUUSD',
      trade_type: 'SELL',
      lot_size: '0.20' as unknown as number,
      open_price: '2150.5' as unknown as number,
      close_price: '2142' as unknown as number,
      sl_price: null,
      tp_price: null,
      pnl: '-240.00' as unknown as number,
      open_time: '2024-03-04T14:20:00.000Z',
      close_time: '2024-03-04T15:10:00.000Z',
      duration_seconds: 3000,
      is_rule_violated: true,
      violation_type: 'NO_OR_REMOVED_SL',
      notes: null,
      setup_tags: [],
    } satisfies Tables<'trades'>;

    expect(mapDbTradesToNormalized([row])[0]).toMatchObject({
      ticket_id: '1001',
      symbol: 'XAUUSD',
      trade_type: 'SELL',
      lot_size: 0.2,
      open_price: 2150.5,
      close_price: 2142,
      pnl: -240,
    });
  });
});

describe('asFiniteNumber / importedAccountInsert / parseRunAuditTrades', () => {
  it('falls back when a value is not finite', () => {
    expect(asFiniteNumber('nope', 7)).toBe(7);
    expect(asFiniteNumber(12)).toBe(12);
  });

  it('builds the default imported account payload', () => {
    const insert = importedAccountInsert('user-1');
    expect(insert.account_name).toBe(IMPORTED_ACCOUNT_NAME);
    expect(insert.user_id).toBe('user-1');
    expect(insert.initial_balance).toBe(10_000);
    expect(insert.target_firm).toBe('FTMO');
  });

  it('accepts a valid run-audit body and rejects empty or malformed ones', () => {
    const trade = {
      ticket_id: '1',
      symbol: 'EURUSD',
      trade_type: 'BUY' as const,
      lot_size: 0.1,
      open_price: 1.08,
      close_price: 1.081,
      sl_price: 1.07,
      tp_price: 1.09,
      pnl: 10,
      open_time: '2024-03-04T10:00:00.000Z',
      close_time: '2024-03-04T10:20:00.000Z',
      duration_seconds: 1200,
    };
    expect(isNormalizedTrade(trade)).toBe(true);
    expect(parseRunAuditTrades({ trades: [trade] })).toEqual([trade]);
    expect(parseRunAuditTrades({ trades: [] })).toEqual({ error: 'No trades to save.' });
    expect(parseRunAuditTrades({ trades: [{ ...trade, lot_size: 0 }] })).toEqual({
      error: 'Invalid trade payload.',
    });
  });

  it('parses optional annotations without rejecting a body that omits them', () => {
    expect(parseRunAuditAnnotations({ trades: [] })).toEqual({});
    expect(
      parseRunAuditAnnotations({
        annotations: {
          '1001|2024-03-04T10:00:00.000Z': { note: 'late', setup_tags: ['Pullback'] },
        },
      }),
    ).toEqual({
      '1001|2024-03-04T10:00:00.000Z': { note: 'late', setup_tags: ['Pullback'] },
    });
    expect(isMissingAnnotationColumnError('column notes does not exist')).toBe(true);
    const stripped = stripAnnotationColumns({
      account_id: ACCOUNT_ID,
      symbol: 'EURUSD',
      trade_type: 'BUY',
      lot_size: 0.1,
      open_price: 1.08,
      pnl: 10,
      open_time: '2024-03-04T10:00:00.000Z',
      close_time: '2024-03-04T10:20:00.000Z',
      notes: 'x',
      setup_tags: ['News'],
    });
    expect(stripped).not.toHaveProperty('notes');
    expect(stripped).not.toHaveProperty('setup_tags');
  });
});
