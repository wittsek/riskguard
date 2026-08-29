import { describe, expect, it } from 'vitest';
import { hostedProGate } from './requireHostedPro';

describe('hostedProGate', () => {
  it('does not paywall when Stripe is not configured (Community self-host)', async () => {
    const res = await hostedProGate(
      {} as never,
      'user-1',
      {},
    );
    expect(res).toBeNull();
  });
});
