'use client';

export const SESSION_REVIEW_STORAGE_KEY = 'riskguard.session-review.v1';

interface ReviewDraftStore {
  [fingerprint: string]: { text: string; savedAt: string };
}

function readStore(): ReviewDraftStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(SESSION_REVIEW_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ReviewDraftStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    sessionStorage.removeItem(SESSION_REVIEW_STORAGE_KEY);
    return {};
  }
}

function writeStore(next: ReviewDraftStore) {
  if (typeof window === 'undefined') return;
  if (Object.keys(next).length === 0) sessionStorage.removeItem(SESSION_REVIEW_STORAGE_KEY);
  else sessionStorage.setItem(SESSION_REVIEW_STORAGE_KEY, JSON.stringify(next));
}

export function readReviewDraft(fingerprint: string): string | null {
  const text = readStore()[fingerprint]?.text;
  return typeof text === 'string' && text.length > 0 ? text : null;
}

export function writeReviewDraft(fingerprint: string, text: string) {
  const store = readStore();
  store[fingerprint] = { text, savedAt: new Date().toISOString() };
  writeStore(store);
}

export function clearReviewDraft(fingerprint: string) {
  const store = readStore();
  delete store[fingerprint];
  writeStore(store);
}
