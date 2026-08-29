import { describe, expect, it } from 'vitest';
import { SAMPLE_CSV_FILENAME } from './sampleCsv';
import { buildSampleAudit } from './buildSampleAudit';

describe('buildSampleAudit', () => {
  it('lints the bundled sample without network or keys', () => {
    const sample = buildSampleAudit();

    expect(sample.fileName).toBe(SAMPLE_CSV_FILENAME);
    expect(sample.trades).toHaveLength(15);
    expect(sample.result.metrics.total_trades).toBe(15);
    expect(sample.result.metrics.revenge_trade_count).toBeGreaterThan(0);
    expect(sample.result.metrics.trades_without_sl).toBeGreaterThan(0);
    expect(sample.result.money_lost_to_mistakes).toBeGreaterThan(0);
    expect(sample.result.equity_curve).toHaveLength(15);
    expect(sample.result.top_destructive_habits.length).toBeGreaterThan(0);
    expect(sample.coaching.source).toBe('rule');
    expect(sample.coaching.summary.length).toBeGreaterThan(0);
    expect(sample.card.tradeCount).toBe(15);
    expect(sample.card.leakHeadline).toMatch(/^\$\d/);
    expect(sample.card.chips.some((chip) => chip.kind === 'revenge')).toBe(true);
  });
});
