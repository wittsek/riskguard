/** Marketing prices and refund copy. No Stripe — CTAs go to /register, GitHub, or the calculator. */

export const SITE_DOMAIN = 'getriskguard.com';
export const SUPPORT_EMAIL = 'hello@getriskguard.com';
export const GITHUB_REPO_URL = 'https://github.com/wittsek/ai-trading';
export const OPEN_CORE_LABEL = 'Open-core · AGPL';

export const PRO_MONTHLY_USD = 19;
export const PRO_YEARLY_USD = 149;
export const REFUND_DAYS = 14;

export const PRICING_PATH = '/pricing';
export const SAMPLE_AUDIT_PATH = '/audit/sample';
export const SAMPLE_AUDIT_ALIAS_PATH = '/example';

export const REFUND_PROMISE = `If Pro isn't useful in ${REFUND_DAYS} days, email us for a full refund.`;

export const COMMUNITY_FEATURES = [
  'Full behavior linter — revenge, missing SL, discipline PnL, static prop check',
  'CSV import (MT4 / MT5) and leak calculator',
  'Docker / self-host — your own API keys',
  'Forever. No account required.',
] as const;

export const PRO_FEATURES = [
  'Login and go — no Docker to babysit',
  'Cloud save and audit history',
  'Managed AI coaching quota in the bill',
  'Hosted Telegram alerts (no 24/7 server of your own)',
  'Discord alerts — Pro roadmap',
  'Live prop buffer / broker sync — Pro roadmap',
] as const;

export const ACADEMY_FEATURES = [
  'Multi-seat desks for coaches and students',
  'Student grading against the linter',
  'Waitlist only — not for sale yet',
] as const;

export function yearlyEquivalentMonthly(yearly = PRO_YEARLY_USD): number {
  return Math.round((yearly / 12) * 10) / 10;
}

export function yearlySavings(monthly = PRO_MONTHLY_USD, yearly = PRO_YEARLY_USD): number {
  return monthly * 12 - yearly;
}

export function academyWaitlistMailto(): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Academy waitlist')}`;
}
