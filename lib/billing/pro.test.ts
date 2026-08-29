import { describe, expect, it } from 'vitest';
import { isPro, proRequiredBody, PRO_REQUIRED_CODE } from './pro';

describe('isPro', () => {
  it('is true only for the pro tier', () => {
    expect(isPro('pro')).toBe(true);
    expect(isPro('free')).toBe(false);
    expect(isPro('academy')).toBe(false);
    expect(isPro(null)).toBe(false);
    expect(isPro(undefined)).toBe(false);
    expect(isPro('')).toBe(false);
  });
});

describe('proRequiredBody', () => {
  it('returns a 402-ready payload with a pricing link', () => {
    expect(proRequiredBody()).toEqual({
      error: 'Cloud Pro is required for this hosted feature.',
      code: PRO_REQUIRED_CODE,
      upgrade_url: '/pricing',
    });
  });
});
