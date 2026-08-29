import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OPENAI_MODEL,
  hasLlmApiKey,
  openRouterHeaders,
  resolveLlmConfig,
} from './provider';

describe('resolveLlmConfig', () => {
  it('is unset when no key is present', () => {
    expect(resolveLlmConfig({})).toBeNull();
    expect(hasLlmApiKey({})).toBe(false);
  });

  it('uses OPENAI_API_KEY and defaults the model on the official API', () => {
    expect(resolveLlmConfig({ OPENAI_API_KEY: 'sk-test' })).toEqual({
      apiKey: 'sk-test',
      model: DEFAULT_OPENAI_MODEL,
      baseURL: undefined,
      timeoutMs: 20_000,
    });
  });

  it('prefers LLM_* over OPENAI_* aliases', () => {
    expect(
      resolveLlmConfig({
        OPENAI_API_KEY: 'sk-openai',
        OPENAI_BASE_URL: 'https://api.openai.com/v1',
        OPENAI_MODEL: 'gpt-4o-mini',
        LLM_API_KEY: 'sk-or',
        LLM_BASE_URL: 'https://openrouter.ai/api/v1',
        LLM_MODEL: 'stealth/ox-alpha',
        LLM_TIMEOUT_MS: '45000',
      }),
    ).toEqual({
      apiKey: 'sk-or',
      model: 'stealth/ox-alpha',
      baseURL: 'https://openrouter.ai/api/v1',
      timeoutMs: 45_000,
    });
  });

  it('requires an explicit model when a custom base URL is set', () => {
    expect(
      resolveLlmConfig({
        LLM_API_KEY: 'ollama',
        LLM_BASE_URL: 'http://127.0.0.1:11434/v1',
      }),
    ).toBeNull();

    expect(
      resolveLlmConfig({
        LLM_API_KEY: 'ollama',
        LLM_BASE_URL: 'http://127.0.0.1:11434/v1',
        LLM_MODEL: 'llama3.1',
      })?.model,
    ).toBe('llama3.1');
  });
});

describe('openRouterHeaders', () => {
  it('adds referer headers only for OpenRouter', () => {
    expect(openRouterHeaders('https://openrouter.ai/api/v1')).toMatchObject({
      'HTTP-Referer': 'https://getriskguard.com',
    });
    expect(openRouterHeaders('https://api.groq.com/openai/v1')).toBeUndefined();
  });
});
