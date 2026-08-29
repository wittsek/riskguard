import { VIOLATION_LABELS } from '@/types';
import type { CoachingNotes, LintResult } from '@/types';

const MAX_COACH_CHARS = 180;

export type AuditTelegramInput = {
  readiness_score: number;
  money_lost_to_mistakes: number;
  top_habit_label?: string | null;
  coaching_summary?: string | null;
};

export function coachingOneLiner(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  const firstLine = text.trim().split(/\n+/)[0] ?? '';
  const sentence = firstLine.split(/(?<=[.!?])\s+/)[0] ?? firstLine;
  const compact = sentence.replace(/\s+/g, ' ').trim();
  if (!compact) return null;
  if (compact.length <= MAX_COACH_CHARS) return compact;
  return `${compact.slice(0, MAX_COACH_CHARS - 1).trimEnd()}…`;
}

export function formatUsdLeak(value: number): string {
  return `$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function formatAuditTelegramMessage(input: AuditTelegramInput): string {
  const habit = input.top_habit_label?.trim() || 'None flagged';
  const lines = [
    'RiskGuard — audit saved',
    `Readiness: ${Math.round(input.readiness_score)}`,
    `Leak: ${formatUsdLeak(input.money_lost_to_mistakes)}`,
    `Top habit: ${habit}`,
  ];
  const tip = coachingOneLiner(input.coaching_summary);
  if (tip) lines.push(`Coach: ${tip}`);
  return lines.join('\n');
}

export function formatAuditAlertFromPersist(
  result: Pick<LintResult, 'readiness_score' | 'money_lost_to_mistakes' | 'top_destructive_habits'>,
  coaching?: Pick<CoachingNotes, 'summary' | 'headline'> | null,
): string {
  const top = result.top_destructive_habits[0];
  const label = top?.label?.trim() || (top ? VIOLATION_LABELS[top.type] : null);
  return formatAuditTelegramMessage({
    readiness_score: result.readiness_score,
    money_lost_to_mistakes: result.money_lost_to_mistakes,
    top_habit_label: label,
    coaching_summary: coaching?.headline || coaching?.summary,
  });
}

export function startReplyText(chatId: string): string {
  return [
    'RiskGuard bot is linked to this chat.',
    '',
    `Your chat ID is ${chatId}`,
    '',
    'Paste that number in RiskGuard → Settings → Telegram alerts, then save.',
    'You will get one short message each time an audit is saved.',
  ].join('\n');
}

export function normalizeTelegramChatId(
  raw: unknown,
): { value: string | null } | { error: string } {
  if (raw == null) return { value: null };
  if (typeof raw !== 'string' && typeof raw !== 'number') {
    return { error: 'Chat ID must be the number Telegram shows you.' };
  }
  const text = String(raw).trim();
  if (!text) return { value: null };
  if (!/^-?\d{5,20}$/.test(text)) {
    return { error: 'Paste the numeric chat ID from the bot (/start).' };
  }
  return { value: text };
}

type TelegramMessage = {
  text?: string;
  chat?: { id?: number | string };
};

export function extractTelegramStartChatId(update: unknown): string | null {
  if (typeof update !== 'object' || update == null) return null;
  const record = update as { message?: TelegramMessage; edited_message?: TelegramMessage };
  const message = record.message ?? record.edited_message;
  const text = message?.text?.trim() ?? '';
  if (!/^\/start(?:@\S+)?(?:\s|$)/i.test(text)) return null;
  const parsed = normalizeTelegramChatId(message?.chat?.id);
  return 'value' in parsed && parsed.value ? parsed.value : null;
}
