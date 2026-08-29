import { describe, expect, it } from 'vitest';
import { getAuthCallbackUrl, getPublicSiteOrigin } from './siteUrl';

describe('getAuthCallbackUrl', () => {
  it('uses NEXT_PUBLIC_SITE_URL when set', () => {
    expect(
      getAuthCallbackUrl({ NEXT_PUBLIC_SITE_URL: 'https://getriskguard.com/' }),
    ).toBe('https://getriskguard.com/auth/callback');
  });

  it('uses the browser origin when no env is set (local signup)', () => {
    expect(getAuthCallbackUrl({}, 'http://localhost:3000')).toBe(
      'http://localhost:3000/auth/callback',
    );
  });

  it('falls back to the production domain on the server', () => {
    expect(getPublicSiteOrigin({})).toBe('https://getriskguard.com');
    expect(getAuthCallbackUrl({})).toBe('https://getriskguard.com/auth/callback');
  });
});
