const SEND_TIMEOUT_MS = 4_000;

export function getTelegramBotToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token || null;
}

export function hasTelegramBotToken(): boolean {
  return getTelegramBotToken() != null;
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  const token = getTelegramBotToken();
  const id = chatId.trim();
  if (!token || !id || !text.trim()) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: id,
        text,
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
