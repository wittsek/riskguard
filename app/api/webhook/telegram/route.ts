import { NextResponse } from 'next/server';
import { extractTelegramStartChatId, hasTelegramBotToken, sendTelegramMessage, startReplyText } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/**
 * Telegram webhook for /start → reply with chat ID (paste in Settings).
 *
 * Set the webhook once the app is on a public HTTPS host:
 *   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
 *     -H "Content-Type: application/json" \
 *     -d '{"url":"https://YOUR_DOMAIN/api/webhook/telegram"}'
 *
 * Local v1 without a tunnel: message @userinfobot, then paste the chat ID in Settings.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: hasTelegramBotToken(),
    path: '/api/webhook/telegram',
    setWebhook:
      'POST https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook with {"url":"https://YOUR_DOMAIN/api/webhook/telegram"}',
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const chatId = extractTelegramStartChatId(body);
  if (chatId) {
    await sendTelegramMessage(chatId, startReplyText(chatId));
  }

  return NextResponse.json({ ok: true });
}
