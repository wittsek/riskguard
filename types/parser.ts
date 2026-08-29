import type { TradeType } from './domain';

export const CSV_FORMATS = ['MT4', 'MT5', 'cTrader', 'Myfxbook', 'Unknown'] as const;
export type CsvFormat = (typeof CSV_FORMATS)[number];

export type RawCsvRow = Record<string, string>;

/** Row ready to insert into `trades` (minus account_id / id / linter fields) */
export interface NormalizedTradeInput {
  ticket_id: string | null;
  symbol: string;
  trade_type: TradeType;
  lot_size: number;
  open_price: number;
  close_price: number | null;
  sl_price: number | null;
  tp_price: number | null;
  pnl: number;
  open_time: string;
  close_time: string;
  duration_seconds: number | null;
}

export interface ParseRowError {
  row: number;
  message: string;
  raw?: RawCsvRow;
}

export interface ParseResult {
  format: CsvFormat;
  trades: NormalizedTradeInput[];
  errors: ParseRowError[];
  skipped: number;
  headers: string[];
}

export const PARSE_FAILURE_KINDS = [
  'empty',
  'html',
  'deal_history',
  'no_header',
  'no_trades',
  'unknown',
] as const;
export type ParseFailureKind = (typeof PARSE_FAILURE_KINDS)[number];

export interface ParseFailure {
  kind: ParseFailureKind;
  format: CsvFormat;
  title: string;
  message: string;
  hint: string;
  guideHref: string;
  rowErrors: ParseRowError[];
  skipped: number;
  headers: string[];
}

export interface ParseOptions {
  /**
   * IANA timezone applied when a timestamp has no offset.
   * Broker exports rarely include a zone; default is UTC.
   */
  assumeTimezone?: string;
}
