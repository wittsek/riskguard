import { describe, expect, it } from 'vitest';
import {
  PRO_MONTHLY_USD,
  PRO_YEARLY_USD,
  REFUND_DAYS,
  REFUND_PROMISE,
  SITE_DOMAIN,
  yearlyEquivalentMonthly,
  yearlySavings,
} from './pricing';

describe('pricing copy constants', () => {
  it('keeps Pro under journal-app all-in pricing', () => {
    expect(PRO_MONTHLY_USD).toBe(19);
    expect(PRO_YEARLY_USD).toBe(149);
    expect(PRO_MONTHLY_USD).toBeGreaterThanOrEqual(12);
    expect(PRO_MONTHLY_USD).toBeLessThanOrEqual(19);
    expect(yearlyEquivalentMonthly()).toBe(12.4);
    expect(yearlySavings()).toBe(79);
  });

  it('states a 14-day money-back promise on getriskguard.com', () => {
    expect(REFUND_DAYS).toBe(14);
    expect(SITE_DOMAIN).toBe('getriskguard.com');
    expect(REFUND_PROMISE).toMatch(/14 days/i);
    expect(REFUND_PROMISE).toMatch(/full refund/i);
  });
});
