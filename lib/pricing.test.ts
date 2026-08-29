import { describe, expect, it } from 'vitest';
import {
  ACADEMY_FEATURES,
  COMMUNITY_FEATURES,
  GITHUB_REPO_URL,
  OPEN_CORE_LABEL,
  PRO_FEATURES,
  PRO_MONTHLY_USD,
  PRO_YEARLY_USD,
  REFUND_DAYS,
  REFUND_PROMISE,
  SITE_DOMAIN,
  academyWaitlistMailto,
  yearlyEquivalentMonthly,
  yearlySavings,
} from './pricing';

describe('pricing copy constants', () => {
  it('keeps Pro at hosted $19 / $149, not a $29 live-sync jump', () => {
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

  it('positions Community as the full OSS linter, not a teaser', () => {
    const blob = COMMUNITY_FEATURES.join(' ');
    expect(blob).toMatch(/linter/i);
    expect(blob).toMatch(/CSV/i);
    expect(blob).toMatch(/Docker/i);
    expect(blob).toMatch(/Forever/i);
  });

  it('positions Pro as hosted convenience + included AI, with live sync as roadmap', () => {
    const blob = PRO_FEATURES.join(' ');
    expect(blob).toMatch(/Login and go/i);
    expect(blob).toMatch(/AI coaching/i);
    expect(blob).toMatch(/Telegram/i);
    expect(blob).toMatch(/roadmap/i);
    expect(blob).toMatch(/broker sync/i);
  });

  it('keeps Academy as seats + grading waitlist, not a checkout', () => {
    const blob = ACADEMY_FEATURES.join(' ');
    expect(blob).toMatch(/seat/i);
    expect(blob).toMatch(/grading/i);
    expect(blob).toMatch(/Waitlist/i);
    expect(academyWaitlistMailto()).toMatch(/^mailto:hello@getriskguard\.com/);
    expect(academyWaitlistMailto()).toContain(encodeURIComponent('Academy waitlist'));
  });

  it('points Open-core AGPL at the public GitHub repo', () => {
    expect(GITHUB_REPO_URL).toBe('https://github.com/wittsek/riskguard');
    expect(OPEN_CORE_LABEL).toMatch(/AGPL/i);
  });
});
