import { formatMoney, formatPct, formatWinRate } from '@/lib/utils';
import type { CoachPayload, CoachingNotes, DestructiveHabit, LintResult } from '@/types';
import { compactLintForCoach, isCoachPayload, worstSession } from './compact';

const DISCLAIMER = 'This is behavioral coaching, not financial advice.';

const HABIT_RULES: Record<string, string> = {
  REVENGE_TRADE:
    'After any loss, wait 15 minutes and keep the next size at or below the prior lot — no immediate re-entry.',
  NO_OR_REMOVED_SL:
    'Hard-code a stop at 1% of account equity before every entry. No ticket goes live without a stop.',
  SL_REMOVED: 'Leave the original stop in place. Do not move or cancel it once the trade is live.',
  OVER_LEVERAGE: 'Cut size so notional stays inside the leverage cap before you click buy or sell.',
  NEWS_TRADING: 'Stay flat through high-impact news unless the playbook explicitly allows the window.',
};

function asPayload(input: LintResult | CoachPayload): CoachPayload {
  return isCoachPayload(input) ? input : compactLintForCoach(input);
}

function formatLeak(value: number): string {
  return `$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function habitLine(habit: DestructiveHabit): string {
  return `${habit.label} (${habit.count} trade${habit.count === 1 ? '' : 's'}, ${formatLeak(habit.money_lost)})`;
}

function nextSessionRules(payload: CoachPayload): string[] {
  const rules: string[] = [];
  const seen = new Set<string>();
  const add = (rule: string) => {
    if (!seen.has(rule)) {
      seen.add(rule);
      rules.push(rule);
    }
  };

  for (const habit of payload.top_destructive_habits) {
    const rule = HABIT_RULES[habit.type];
    if (rule) add(rule);
  }

  const worst = worstSession(payload.sessions);
  if (worst && (worst.win_rate < 0.45 || worst.pnl < 0)) {
    add(
      `Stand down in the ${worst.label} session after two losses, or skip it until the playbook has a defined edge there (${formatWinRate(worst.win_rate)} win rate, ${formatMoney(worst.pnl)}).`,
    );
  }

  const dd = payload.drawdown;
  const firm = payload.account?.firm ?? 'the prop firm';
  if (dd.daily_breached || dd.daily_drawdown_pct >= dd.daily_limit_pct * 0.6) {
    add(
      `If daily drawdown reaches ${formatPct(dd.daily_limit_pct * 0.6, 0)} of the ${formatPct(dd.daily_limit_pct, 0)} ${firm} cap, stop for the day.`,
    );
  }

  add('Size every trade to a 1% stop and walk away after the daily loss limit — protect the evaluation first.');
  add('Journal the first losing trade of the session before you are allowed a second entry.');

  return rules.slice(0, 3);
}

function headlineFor(payload: CoachPayload): string {
  const top = payload.top_destructive_habits[0];
  if (payload.money_lost_to_mistakes > 0 && top) {
    return `${top.label} is the main leak — ${formatLeak(payload.money_lost_to_mistakes)} versus a disciplined book.`;
  }
  if (payload.money_lost_to_mistakes > 0) {
    return `Mistakes leaked ${formatLeak(payload.money_lost_to_mistakes)} versus a disciplined book.`;
  }
  return `Readiness ${payload.readiness_score}: this book stayed inside the risk rules.`;
}

export function buildRuleBasedCoaching(input: LintResult | CoachPayload): CoachingNotes {
  const payload = asPayload(input);
  const headline = headlineFor(payload);
  const bullets = nextSessionRules(payload);
  const top = payload.top_destructive_habits;
  const worst = worstSession(payload.sessions);
  const firm = payload.account?.firm ?? 'FTMO';

  const habitSentence =
    top.length === 0
      ? 'The linter did not flag revenge trading, missing stops, or other destructive habits on this file.'
      : `Top leaks: ${top.map(habitLine).join('; ')}.`;

  const sessionSentence = worst
    ? ` Weakest session is ${worst.label} (${worst.trades} trades, ${formatWinRate(worst.win_rate)} win rate, ${formatMoney(worst.pnl)}).`
    : '';

  const dd = payload.drawdown;
  const ddSentence = ` Peak daily drawdown is ${formatPct(dd.daily_drawdown_pct)} against a ${formatPct(dd.daily_limit_pct, 0)} ${firm} daily cap${dd.daily_breached ? ' — that limit was breached' : ''}.`;

  const paragraphs = [
    `Readiness sits at ${payload.readiness_score}/100 across ${payload.metrics.total_trades} trades. Actual PnL is ${formatMoney(payload.actual_pnl)}; a disciplined book would have been ${formatMoney(payload.disciplined_pnl)}. Money lost to mistakes: ${formatLeak(payload.money_lost_to_mistakes)}.`,
    `${habitSentence}${sessionSentence}${ddSentence}`,
    `Next-session rules:\n${bullets.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}`,
    DISCLAIMER,
  ];

  return {
    headline,
    summary: paragraphs.join('\n\n'),
    bullets,
    source: 'rule',
  };
}
