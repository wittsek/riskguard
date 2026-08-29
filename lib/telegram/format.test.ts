import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LintResult } from '@/types';
import {
  coachingOneLiner,
  extractTelegramStartChatId,
  formatAuditAlertFromPersist,
  formatAuditTelegramMessage,
  normalizeTelegramChatId,
  startReplyText,
} from './format';
import { sendTelegramMessage } from './send';

function startUpdate(chatId: number | string, text = '/start') {
  return {
    update_id: 1,
    message: {
      message_id: 1,
      text,
      chat: { id: chatId, type: 'private' },
    },
  };
}

describe('normalizeTelegramChatId', () => {
  it('accepts numeric private and group chat ids', () => {
    expect(normalizeTelegramChatId('123456789')).toEqual({ value: '123456789' });
    expect(normalizeTelegramChatId(-1001234567890)).toEqual({ value: '-1001234567890' });
    expect(normalizeTelegramChatId('  42  ')).toEqual({
      error: 'Paste the numeric chat ID from the bot (/start).',
    });
    expect(normalizeTelegramChatId('')).toEqual({ value: null });
    expect(normalizeTelegramChatId('   ')).toEqual({ value: null });
    expect(normalizeTelegramChatId('@bot')).toEqual({
      error: 'Paste the numeric chat ID from the bot (/start).',
    });
  });
});

describe('coachingOneLiner', () => {
  it('takes the first sentence and drops the rest', () => {
    expect(coachingOneLiner('Cut size after a loss. Then journal it.\nSecond paragraph.')).toBe(
      'Cut size after a loss.',
    );
  });

  it('returns null for blank copy and truncates long lines', () => {
    expect(coachingOneLiner('   ')).toBeNull();
    const long = `${'Revenge trading leaked a lot of money '.repeat(12)}.`;
    const line = coachingOneLiner(long);
    expect(line).toBeTruthy();
    expect(line!.length).toBeLessThanOrEqual(180);
    expect(line!.endsWith('…')).toBe(true);
  });
});

describe('formatAuditTelegramMessage', () => {
  it('includes readiness, leak dollars, top habit, and a coach one-liner', () => {
    const text = formatAuditTelegramMessage({
      readiness_score: 62.4,
      money_lost_to_mistakes: 1240,
      top_habit_label: 'Revenge Trading',
      coaching_summary: 'Wait 15 minutes after a loss. Do not double size.',
    });

    expect(text).toBe(
      [
        'RiskGuard — audit saved',
        'Readiness: 62',
        'Leak: $1,240',
        'Top habit: Revenge Trading',
        'Coach: Wait 15 minutes after a loss.',
      ].join('\n'),
    );
  });

  it('omits the coach line and uses a fallback habit when none exist', () => {
    const text = formatAuditTelegramMessage({
      readiness_score: 91,
      money_lost_to_mistakes: 0,
    });

    expect(text).toContain('Readiness: 91');
    expect(text).toContain('Leak: $0');
    expect(text).toContain('Top habit: None flagged');
    expect(text).not.toContain('Coach:');
  });
});

describe('formatAuditAlertFromPersist', () => {
  it('reuses lint + coach data from a saved audit', () => {
    const result = {
      readiness_score: 54,
      money_lost_to_mistakes: 370,
      top_destructive_habits: [
        { type: 'REVENGE_TRADE' as const, label: 'Revenge Trading', count: 3, money_lost: 240 },
      ],
    } satisfies Pick<LintResult, 'readiness_score' | 'money_lost_to_mistakes' | 'top_destructive_habits'>;

    const text = formatAuditAlertFromPersist(result, {
      headline: 'Revenge Trading is the main leak.',
      summary: 'Longer body that should not appear.',
    });

    expect(text).toContain('Readiness: 54');
    expect(text).toContain('Leak: $370');
    expect(text).toContain('Top habit: Revenge Trading');
    expect(text).toContain('Coach: Revenge Trading is the main leak.');
    expect(text).not.toContain('Longer body');
  });

  it('falls back to the first habit label on a typed LintResult', () => {
    const result = {
      readiness_score: 40,
      money_lost_to_mistakes: 80,
      top_destructive_habits: [
        { type: 'OVER_LEVERAGE' as const, label: 'Over-Leverage', count: 2, money_lost: 80 },
      ],
    } satisfies Pick<LintResult, 'readiness_score' | 'money_lost_to_mistakes' | 'top_destructive_habits'>;

    expect(formatAuditAlertFromPersist(result)).toContain('Top habit: Over-Leverage');
  });
});

describe('extractTelegramStartChatId', () => {
  it('reads /start and /start@BotName', () => {
    expect(extractTelegramStartChatId(startUpdate(991122))).toBe('991122');
    expect(extractTelegramStartChatId(startUpdate(991122, '/start@RiskGuardBot'))).toBe('991122');
  });

  it('ignores other updates', () => {
    expect(extractTelegramStartChatId(startUpdate(991122, 'hello'))).toBeNull();
    expect(extractTelegramStartChatId({ update_id: 2 })).toBeNull();
    expect(extractTelegramStartChatId(null)).toBeNull();
  });
});

describe('startReplyText', () => {
  it('tells the user to paste the chat id in Settings', () => {
    expect(startReplyText('991122')).toContain('991122');
    expect(startReplyText('991122')).toMatch(/Settings/i);
  });
});

describe('sendTelegramMessage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('does not call Telegram when the bot token is missing', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('TELEGRAM_BOT_TOKEN', '');

    await expect(sendTelegramMessage('12345', 'hello')).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
