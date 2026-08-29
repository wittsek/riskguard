/** Marketing prices and refund copy. No Stripe — CTAs go to /register or the calculator. */

export const SITE_DOMAIN = 'getriskguard.com';
export const SUPPORT_EMAIL = 'hello@getriskguard.com';

export const PRO_MONTHLY_USD = 19;
export const PRO_YEARLY_USD = 149;
export const REFUND_DAYS = 14;

export const PRICING_PATH = '/pricing';
export const SAMPLE_AUDIT_PATH = '/audit/sample';
export const SAMPLE_AUDIT_ALIAS_PATH = '/example';

export const REFUND_PROMISE = `If Pro isn't useful in ${REFUND_DAYS} days, email us for a full refund.`;

export function yearlyEquivalentMonthly(yearly = PRO_YEARLY_USD): number {
  return Math.round((yearly / 12) * 10) / 10;
}

export function yearlySavings(monthly = PRO_MONTHLY_USD, yearly = PRO_YEARLY_USD): number {
  return monthly * 12 - yearly;
}
