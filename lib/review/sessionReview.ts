import { buildRuleBasedCoaching, worstSession } from '@/lib/ai';
import { formatMoney, formatWinRate } from '@/lib/utils';
import type {
  AnnotatedTrade,
  BuildSessionReviewOptions,
  CoachingNotes,
  LintResult,
  SessionReviewDateRange,
  SessionReviewModel,
  SessionReviewWeakest,
  SessionStats,
} from '@/types';

const SL_TYPES = new Set(['NO_OR_REMOVED_SL', 'SL_REMOVED']);
const RULE_COUNT = 3;
const PADDING_RULES = [
  'If the linter stays clean, keep size unchanged and skip any session that is not in the playbook.',
  'Protect the evaluation: stop at the daily loss limit even when the book looks disciplined.',
  'Trade only written setups — no impulse entries after a win streak.',
];

function asFinite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function formatUtcDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatLeakUsd(value: number): string {
  return `$${Math.abs(asFinite(value)).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function dateRangeFromTrades(
  trades: readonly Pick<AnnotatedTrade, 'open_time' | 'close_time'>[],
): SessionReviewDateRange | null {
  if (trades.length === 0) return null;
  let start = trades[0].open_time;
  let end = trades[0].close_time || trades[0].open_time;
  for (const trade of trades) {
    if (trade.open_time < start) start = trade.open_time;
    const close = trade.close_time || trade.open_time;
    if (close > end) end = close;
  }
  const startLabel = formatUtcDate(start);
  const endLabel = formatUtcDate(end);
  return {
    start,
    end,
    label: startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`,
  };
}

export function reviewFingerprint(result: LintResult): string {
  const range = dateRangeFromTrades(result.annotated_trades);
  return [
    result.metrics.total_trades,
    result.readiness_score,
    asFinite(result.money_lost_to_mistakes).toFixed(2),
    asFinite(result.actual_pnl).toFixed(2),
    range?.start ?? '',
    range?.end ?? '',
  ].join('|');
}

function toWeakest(session: SessionStats): SessionReviewWeakest {
  return {
    session: session.session,
    label: session.label,
    trades: session.trades,
    win_rate: session.win_rate,
    pnl: session.pnl,
  };
}

function nextSessionRules(result: LintResult, coaching?: CoachingNotes | null): string[] {
  const fromCoach = (coaching?.bullets ?? []).map((rule) => rule.trim()).filter(Boolean);
  if (fromCoach.length >= RULE_COUNT) return fromCoach.slice(0, RULE_COUNT);

  const fallback = (buildRuleBasedCoaching(result).bullets ?? [])
    .map((rule) => rule.trim())
    .filter(Boolean);
  const rules = [...fromCoach];
  for (const rule of [...fallback, ...PADDING_RULES]) {
    if (rules.length >= RULE_COUNT) break;
    if (!rules.includes(rule)) rules.push(rule);
  }
  return rules.slice(0, RULE_COUNT);
}

export function formatSessionReviewMarkdown(model: Omit<SessionReviewModel, 'write_up'>): string {
  const weakest = model.weakest_session
    ? `${model.weakest_session.label} (${formatWinRate(model.weakest_session.win_rate)} win rate, ${formatMoney(model.weakest_session.pnl)} across ${model.weakest_session.trades} trade${model.weakest_session.trades === 1 ? '' : 's'})`
    : 'No session with trades';

  const bookLine = model.date_range
    ? `${model.date_range.label} · ${model.trade_count} trade${model.trade_count === 1 ? '' : 's'}`
    : `${model.trade_count} trade${model.trade_count === 1 ? '' : 's'}`;

  const habitLine =
    model.counts.revenge === 0 && model.counts.missing_sl === 0 && model.counts.other === 0
      ? 'The linter did not flag revenge trading, missing stops, or other destructive habits on this book.'
      : `The linter flagged ${model.counts.revenge} revenge trade${model.counts.revenge === 1 ? '' : 's'}, ${model.counts.missing_sl} missing stop-loss, and ${model.counts.other} other violation${model.counts.other === 1 ? '' : 's'}.`;

  const rules =
    model.next_session_rules.length === 0
      ? '_No next-session rules._'
      : model.next_session_rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n');

  return [
    '# Session review',
    '',
    `**Book:** ${bookLine}`,
    `**Readiness:** ${model.readiness_score}/100`,
    '',
    '## Snapshot',
    '',
    `- Weakest UTC session: ${weakest}`,
    `- Revenge trades: ${model.counts.revenge}`,
    `- Missing stop-loss: ${model.counts.missing_sl}`,
    `- Other violations: ${model.counts.other}`,
    `- Leak vs disciplined book: ${formatLeakUsd(model.leak_usd)} leaked`,
    `- Actual PnL: ${formatMoney(model.actual_pnl)} · Disciplined PnL: ${formatMoney(model.disciplined_pnl)}`,
    '',
    habitLine,
    '',
    '## Next-session rules',
    '',
    rules,
    '',
    '## My notes',
    '',
    '_Tweak this write-up — you are not starting from a blank page._',
  ].join('\n');
}

export function buildSessionReview(
  result: LintResult,
  options: BuildSessionReviewOptions = {},
): SessionReviewModel {
  const dateRange = dateRangeFromTrades(result.annotated_trades);
  const worst = worstSession(result.sessions);
  const coaching = options.coaching ?? buildRuleBasedCoaching(result);
  const other = result.violations.filter(
    (violation) => violation.type !== 'REVENGE_TRADE' && !SL_TYPES.has(violation.type),
  ).length;

  const model = {
    fingerprint: reviewFingerprint(result),
    date_range: dateRange,
    trade_count: result.metrics.total_trades,
    weakest_session: worst ? toWeakest(worst) : null,
    counts: {
      revenge: result.metrics.revenge_trade_count,
      missing_sl: result.metrics.trades_without_sl,
      other,
      total: result.violations.length,
    },
    leak_usd: asFinite(result.money_lost_to_mistakes),
    actual_pnl: asFinite(result.actual_pnl),
    disciplined_pnl: asFinite(result.disciplined_pnl),
    readiness_score: result.readiness_score,
    next_session_rules: nextSessionRules(result, coaching),
  };

  return {
    ...model,
    write_up: formatSessionReviewMarkdown(model),
  };
}
