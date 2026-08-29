import { buildRuleBasedCoaching } from '@/lib/ai/ruleBased';
import { defaultLintContext, lintTrades } from '@/lib/analytics';
import { parseTradeCsv } from '@/lib/parsers';
import { SAMPLE_CSV, SAMPLE_CSV_FILENAME } from '@/lib/sample/sampleCsv';
import { buildAuditCardModel, type AuditCardModel } from '@/lib/share/auditCard';
import type { CoachingNotes, CsvFormat, LintResult, NormalizedTradeInput } from '@/types';

export interface SampleAudit {
  fileName: string;
  format: CsvFormat;
  trades: NormalizedTradeInput[];
  result: LintResult;
  coaching: CoachingNotes;
  card: AuditCardModel;
}

/** Pre-runs the bundled sample book through the same lint + rule-based coach as a live audit. */
export function buildSampleAudit(): SampleAudit {
  const parsed = parseTradeCsv(SAMPLE_CSV);
  if (parsed.trades.length === 0) {
    throw new Error('Bundled sample CSV failed to parse.');
  }

  const result = lintTrades(parsed.trades, defaultLintContext());
  return {
    fileName: SAMPLE_CSV_FILENAME,
    format: parsed.format,
    trades: parsed.trades,
    result,
    coaching: buildRuleBasedCoaching(result),
    card: buildAuditCardModel(result),
  };
}
