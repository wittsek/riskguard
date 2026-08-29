import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoachingNotes, Database, LintResult } from '@/types';
import { formatAuditAlertFromPersist } from './format';
import { hasTelegramBotToken, sendTelegramMessage } from './send';

type Client = SupabaseClient<Database>;

export async function notifySavedAudit(
  supabase: Client,
  userId: string,
  saved: {
    result: Pick<LintResult, 'readiness_score' | 'money_lost_to_mistakes' | 'top_destructive_habits'>;
    coaching: Pick<CoachingNotes, 'summary' | 'headline'>;
  },
): Promise<void> {
  if (!hasTelegramBotToken()) return;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('telegram_chat_id')
      .eq('id', userId)
      .maybeSingle();
    if (error) return;

    const chatId = data?.telegram_chat_id?.trim();
    if (!chatId) return;

    await sendTelegramMessage(chatId, formatAuditAlertFromPersist(saved.result, saved.coaching));
  } catch {
    // Alerts must never fail a saved audit.
  }
}
