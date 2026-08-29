import type { CoachingNotes } from './ai';
import type { LintResult } from './analytics';
import type { CsvFormat, NormalizedTradeInput } from './parser';

export type TradeAnnotationPayload = {
  note?: string;
  setup_tags?: string[];
};

export type TradeAnnotationMap = Record<string, TradeAnnotationPayload>;

export interface RunAuditRequestBody {
  trades: NormalizedTradeInput[];
  annotations?: TradeAnnotationMap;
  source?: 'upload' | 'sample';
  fileName?: string;
  format?: CsvFormat;
}

export interface RunAuditResponseBody {
  accountId: string;
  reportId: string;
  result: LintResult;
  coaching: CoachingNotes;
}

export interface LatestAuditResponseBody {
  accountId: string;
  reportId: string;
  fileName: string;
  format: CsvFormat;
  parsedAt: string;
  trades: NormalizedTradeInput[];
  result: LintResult;
  coaching: CoachingNotes;
  ai_coaching_summary: string | null;
  annotations?: TradeAnnotationMap;
}

export interface ApiErrorBody {
  error: string;
}
