import { describe, expect, it } from 'vitest';
import { safeInternalPath, withNextParam } from './safeNext';

describe('safeInternalPath', () => {
  it('allows relative app paths including query strings', () => {
    expect(safeInternalPath('/pricing')).toBe('/pricing');
    expect(safeInternalPath('/pricing?checkout=monthly')).toBe('/pricing?checkout=monthly');
  });

  it('rejects open redirects', () => {
    expect(safeInternalPath('https://evil.example')).toBe('/dashboard');
    expect(safeInternalPath('//evil.example')).toBe('/dashboard');
    expect(safeInternalPath('\\evil')).toBe('/dashboard');
    expect(safeInternalPath(null)).toBe('/dashboard');
  });
});

describe('withNextParam', () => {
  it('appends a safe next query', () => {
    expect(withNextParam('/register', '/pricing?checkout=yearly')).toBe(
      '/register?next=%2Fpricing%3Fcheckout%3Dyearly',
    );
    expect(withNextParam('/login', 'https://evil.example')).toBe('/login');
  });
});
