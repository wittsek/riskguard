import { DEFAULT_LINT_ACCOUNT } from '@/lib/analytics';
import {
  type AnnotationMap,
  parseAnnotationMap,
  tradeAnnotationKey,
} from '@/lib/trades/annotations';
import { TRADE_TYPES } from '@/types';
import type {
  AnnotatedTrade,
  LintResult,
  NormalizedTradeInput,
  Tables,
  TablesInsert,
  ViolationType,
} from '@/types';

export const IMPORTED_ACCOUNT_NAME = 'Imported account';
export const MAX_PERSIST_TRADES = 5_000;

export const VIOLATION_PRIORITY: readonly ViolationType[] = [
  'REVENGE_TRADE',
  'OVER_LEVERAGE',
  'NEWS_TRADING',
  'NO_OR_REMOVED_SL',
  'SL_REMOVED',
];

export function primaryViolation(violations: readonly ViolationType[]): ViolationType | null {
  if (violations.length === 0) return null;
  return VIOLATION_PRIORITY.find((type) => violations.includes(type)) ?? violations[0] ?? null;
}

export function asFiniteNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mapAnnotatedTradeToInsert(
  trade: AnnotatedTrade,
  accountId: string,
  annotations: AnnotationMap = {},
): TablesInsert<'trades'> {
  const annotation = annotations[tradeAnnotationKey(trade.ticket_id, trade.open_time)];
  return {
    account_id: accountId,
    ticket_id: trade.ticket_id,
    symbol: trade.symbol,
    trade_type: trade.trade_type,
    lot_size: trade.lot_size,
    open_price: trade.open_price,
    close_price: trade.close_price,
    sl_price: trade.sl_price,
    tp_price: trade.tp_price,
    pnl: trade.pnl,
    open_time: trade.open_time,
    close_time: trade.close_time,
    duration_seconds: trade.duration_seconds,
    is_rule_violated: trade.is_rule_violated,
    violation_type: primaryViolation(trade.violations),
    notes: annotation?.note?.trim() ? annotation.note : null,
    setup_tags: annotation?.setup_tags ?? [],
  };
}

export function mapAnnotatedTradesToInserts(
  trades: readonly AnnotatedTrade[],
  accountId: string,
  annotations: AnnotationMap = {},
): TablesInsert<'trades'>[] {
  return trades.map((trade) => mapAnnotatedTradeToInsert(trade, accountId, annotations));
}

export function parseRunAuditAnnotations(body: unknown): AnnotationMap {
  if (typeof body !== 'object' || body == null || !('annotations' in body)) return {};
  return parseAnnotationMap((body as { annotations: unknown }).annotations);
}

export function stripAnnotationColumns(
  row: TablesInsert<'trades'>,
): Omit<TablesInsert<'trades'>, 'notes' | 'setup_tags'> {
  const rest = { ...row };
  delete rest.notes;
  delete rest.setup_tags;
  return rest;
}

export function isMissingAnnotationColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  const mentionsColumn =
    lower.includes('column') || lower.includes('schema cache') || lower.includes('does not exist');
  return mentionsColumn && (lower.includes('notes') || lower.includes('setup_tags'));
}

export function mapLintResultToAuditInsert(
  result: LintResult,
  accountId: string,
  coachingSummary: string | null = null,
): TablesInsert<'audit_reports'> {
  return {
    account_id: accountId,
    readiness_score: result.readiness_score,
    actual_pnl: result.actual_pnl,
    disciplined_pnl: result.disciplined_pnl,
    money_lost_to_mistakes: result.money_lost_to_mistakes,
    top_destructive_habits: result.top_destructive_habits,
    ai_coaching_summary: coachingSummary,
  };
}

export function mapDbTradeToNormalized(row: Tables<'trades'>): NormalizedTradeInput {
  return {
    ticket_id: row.ticket_id,
    symbol: row.symbol,
    trade_type: row.trade_type,
    lot_size: asFiniteNumber(row.lot_size),
    open_price: asFiniteNumber(row.open_price),
    close_price: row.close_price == null ? null : asFiniteNumber(row.close_price),
    sl_price: row.sl_price == null ? null : asFiniteNumber(row.sl_price),
    tp_price: row.tp_price == null ? null : asFiniteNumber(row.tp_price),
    pnl: asFiniteNumber(row.pnl),
    open_time: row.open_time,
    close_time: row.close_time,
    duration_seconds: row.duration_seconds,
  };
}

export function mapDbTradesToNormalized(rows: readonly Tables<'trades'>[]): NormalizedTradeInput[] {
  return rows.map(mapDbTradeToNormalized);
}

export function importedAccountInsert(userId: string): TablesInsert<'trading_accounts'> {
  return {
    user_id: userId,
    account_name: IMPORTED_ACCOUNT_NAME,
    initial_balance: DEFAULT_LINT_ACCOUNT.initial_balance,
    target_firm: DEFAULT_LINT_ACCOUNT.target_firm,
    max_daily_drawdown_pct: DEFAULT_LINT_ACCOUNT.max_daily_drawdown_pct,
    max_total_drawdown_pct: DEFAULT_LINT_ACCOUNT.max_total_drawdown_pct,
  };
}

export function isNormalizedTrade(value: unknown): value is NormalizedTradeInput {
  if (typeof value !== 'object' || value == null) return false;
  const trade = value as Partial<NormalizedTradeInput>;
  if (typeof trade.symbol !== 'string' || trade.symbol.length === 0) return false;
  if (!TRADE_TYPES.includes(trade.trade_type as NormalizedTradeInput['trade_type'])) return false;
  if (typeof trade.lot_size !== 'number' || trade.lot_size <= 0) return false;
  if (typeof trade.open_price !== 'number' || trade.open_price <= 0) return false;
  if (typeof trade.pnl !== 'number' || !Number.isFinite(trade.pnl)) return false;
  if (typeof trade.open_time !== 'string' || typeof trade.close_time !== 'string') return false;
  if (trade.close_price != null && (typeof trade.close_price !== 'number' || trade.close_price <= 0)) {
    return false;
  }
  return true;
}

export function parseRunAuditTrades(body: unknown): NormalizedTradeInput[] | { error: string } {
  if (typeof body !== 'object' || body == null || !('trades' in body)) {
    return { error: 'Expected a JSON body with a trades array.' };
  }
  const trades = (body as { trades: unknown }).trades;
  if (!Array.isArray(trades) || trades.length === 0) {
    return { error: 'No trades to save.' };
  }
  if (trades.length > MAX_PERSIST_TRADES) {
    return { error: `Too many trades (max ${MAX_PERSIST_TRADES}).` };
  }
  if (!trades.every(isNormalizedTrade)) {
    return { error: 'Invalid trade payload.' };
  }
  return trades;
}
