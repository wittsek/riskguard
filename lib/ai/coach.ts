import type { CoachPayload, CoachingAccountContext, CoachingNotes, LintResult } from '@/types';
import { compactLintForCoach, isCoachPayload, parseCoachRequest } from './compact';
import { generateLlmCoaching, hasOpenAiApiKey } from './llm';
import { buildRuleBasedCoaching } from './ruleBased';

export interface GenerateCoachingOptions {
  account?: CoachingAccountContext;
  forceRuleBased?: boolean;
}

function toPayload(input: LintResult | CoachPayload, account?: CoachingAccountContext): CoachPayload {
  if (isCoachPayload(input)) {
    return {
      ...input,
      account: account ?? input.account,
    };
  }
  return compactLintForCoach(input, account);
}

export async function generateCoaching(
  input: LintResult | CoachPayload,
  options: GenerateCoachingOptions = {},
): Promise<CoachingNotes> {
  const payload = toPayload(input, options.account);
  const fallback = buildRuleBasedCoaching(payload);

  if (options.forceRuleBased || !hasOpenAiApiKey()) {
    return fallback;
  }

  try {
    const llm = await generateLlmCoaching(payload);
    if (llm?.summary.trim()) return llm;
  } catch {
    // Key present but the provider failed — keep the deterministic notes.
  }

  return fallback;
}

export {
  compactLintForCoach,
  parseCoachRequest,
  buildRuleBasedCoaching,
  hasOpenAiApiKey,
};
