/**
 * OpenAI-compatible chat client config. Any host that speaks
 * `/v1/chat/completions` works (OpenAI, OpenRouter, Groq, Together, Ollama, …).
 */

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 20_000;

export interface LlmProviderConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  timeoutMs: number;
}

export type LlmEnv = Record<string, string | undefined>;

export function resolveLlmConfig(
  env: LlmEnv = process.env,
): LlmProviderConfig | null {
  const apiKey = env.LLM_API_KEY?.trim() || env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const baseURL = env.LLM_BASE_URL?.trim() || env.OPENAI_BASE_URL?.trim() || undefined;
  const model =
    env.LLM_MODEL?.trim() ||
    env.OPENAI_MODEL?.trim() ||
    (baseURL ? undefined : DEFAULT_OPENAI_MODEL);
  if (!model) return null;

  const timeoutRaw = env.LLM_TIMEOUT_MS?.trim();
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  if (timeoutRaw) {
    const parsed = Number(timeoutRaw);
    if (Number.isFinite(parsed) && parsed >= 1_000) {
      timeoutMs = Math.min(parsed, 120_000);
    }
  }

  return { apiKey, model, baseURL, timeoutMs };
}

export function hasLlmApiKey(env: LlmEnv = process.env): boolean {
  return resolveLlmConfig(env) !== null;
}

/** @deprecated Use hasLlmApiKey — kept for existing imports. */
export function hasOpenAiApiKey(): boolean {
  return hasLlmApiKey();
}

export function openRouterHeaders(baseURL?: string): Record<string, string> | undefined {
  if (!baseURL?.includes('openrouter.ai')) return undefined;
  return {
    'HTTP-Referer': 'https://getriskguard.com',
    'X-Title': 'RiskGuard AI',
  };
}

export { DEFAULT_OPENAI_MODEL };
