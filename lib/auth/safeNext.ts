/** Relative in-app path only — blocks open redirects (`//host`, protocol-relative). */
export function safeInternalPath(
  next: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return fallback;
  }
  return trimmed;
}

export function withNextParam(href: string, next: string | null | undefined): string {
  const safe = next ? safeInternalPath(next, '') : '';
  if (!safe) return href;
  const join = href.includes('?') ? '&' : '?';
  return `${href}${join}next=${encodeURIComponent(safe)}`;
}
