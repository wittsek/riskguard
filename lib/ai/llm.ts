import type { CoachPayload, CoachingNotes } from '@/types';
import { worstSession } from './compact';

const SYSTEM_PROMPT = `You are RiskGuard AI, a behavioral trading coach for prop-firm traders.

Write 2–4 short paragraphs (or bullet-ready markdown) in English. Be specific and actionable. Cite the linter habits you are given (revenge trading, missing/removed stop-loss, session fatigue, drawdown, over-leverage, news). Compare actual PnL versus disciplined PnL and name the dollar leak. End with exactly 3 concrete next-session rules the trader can follow tomorrow.

Include one closing line: "This is behavioral coaching, not financial advice."
Do not invent trades, tickets, or numbers that are not in the payload. Do not give investment recommendations or promise profits.
Respond as compact JSON only: {"headline":"string","summary":"markdown string","bullets":["rule1","rule2","rule3"]}`;

function userPrompt(payload: CoachPayload): string {
  const worst = worstSession(payload.sessions);
  return JSON.stringify({
    firm: payload.account?.firm ?? 'FTMO',
    initial_balance: payload.account?.initial_balance,
    daily_dd_limit_pct: payload.account?.max_daily_drawdown_pct,
    total_dd_limit_pct: payload.account?.max_total_drawdown_pct,
    readiness_score: payload.readiness_score,
    actual_pnl: payload.actual_pnl,
    disciplined_pnl: payload.disciplined_pnl,
    money_lost_to_mistakes: payload.money_lost_to_mistakes,
    metrics: payload.metrics,
    top_destructive_habits: payload.top_destructive_habits,
    sessions: payload.sessions.map((session) => ({
      label: session.label,
      trades: session.trades,
      win_rate: session.win_rate,
      pnl: session.pnl,
    })),
    worst_session: worst
      ? { label: worst.label, trades: worst.trades, win_rate: worst.win_rate, pnl: worst.pnl }
      : null,
    drawdown: payload.drawdown,
    top_violating_trades: payload.top_violating_trades,
  });
}

function parseLlmJson(text: string): Pick<CoachingNotes, 'headline' | 'summary' | 'bullets'> | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as {
      headline?: unknown;
      summary?: unknown;
      bullets?: unknown;
    };
    if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) return null;
    return {
      headline: typeof parsed.headline === 'string' ? parsed.headline.trim() : undefined,
      summary: parsed.summary.trim(),
      bullets: Array.isArray(parsed.bullets)
        ? parsed.bullets.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : undefined,
    };
  } catch {
    return null;
  }
}

export function hasOpenAiApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function generateLlmCoaching(payload: CoachPayload): Promise<CoachingNotes | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey, timeout: 12_000, maxRetries: 0 });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    max_tokens: 700,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt(payload) },
    ],
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) return null;
  const parsed = parseLlmJson(text);
  if (!parsed) return null;
  return { ...parsed, source: 'llm' };
}
