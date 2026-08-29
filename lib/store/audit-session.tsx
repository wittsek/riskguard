'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  CoachingNotes,
  CsvFormat,
  LatestAuditResponseBody,
  LintResult,
  NormalizedTradeInput,
  ParseFailure,
  ParseRowError,
  RunAuditResponseBody,
} from '@/types';
import { compactLintForCoach } from '@/lib/ai/compact';
import { buildRuleBasedCoaching } from '@/lib/ai/ruleBased';
import { lintTrades, defaultLintContext } from '@/lib/analytics';
import { useAuth } from '@/lib/auth/auth-context';
import { explainParseFailure, parseTradeCsv } from '@/lib/parsers';
import { SAMPLE_CSV, SAMPLE_CSV_FILENAME } from '@/lib/sample/sampleCsv';
import { mergeAnnotationStore, readAnnotationStore } from '@/lib/store/trade-annotations';
import { parseAnnotationMap } from '@/lib/trades/annotations';

const STORAGE_KEY = 'riskguard.audit-session.v1';

export type CoachingStatus = 'idle' | 'loading' | 'ready';

export interface StoredAudit {
  trades: NormalizedTradeInput[];
  result: LintResult;
  source: 'upload' | 'sample' | 'saved';
  fileName: string;
  format: CsvFormat;
  parsedAt: string;
  errors: ParseRowError[];
  savedReportId?: string;
  coaching?: CoachingNotes | null;
  coachingStatus?: CoachingStatus;
}

interface AuditSessionValue {
  session: StoredAudit | null;
  hydrated: boolean;
  error: ParseFailure | null;
  persistStatus: 'idle' | 'saving' | 'saved' | 'error';
  persistError: string | null;
  runCsv: (csvText: string, fileName: string, source?: StoredAudit['source']) => StoredAudit | null;
  loadSample: () => StoredAudit | null;
  saveToAccount: () => Promise<boolean>;
  loadLatestSaved: () => Promise<StoredAudit | null>;
  clear: () => void;
}

const AuditSessionContext = createContext<AuditSessionValue | null>(null);

function persist(next: StoredAudit | null) {
  if (typeof window === 'undefined') return;
  if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  else sessionStorage.removeItem(STORAGE_KEY);
}

export function buildAuditFromCsv(
  csvText: string,
  fileName: string,
  source: StoredAudit['source'] = 'upload',
): { audit: StoredAudit | null; error: ParseFailure | null } {
  const parsed = parseTradeCsv(csvText);
  if (parsed.trades.length === 0) {
    return { audit: null, error: explainParseFailure(parsed) };
  }

  const result = lintTrades(parsed.trades, defaultLintContext());
  return {
    audit: {
      trades: parsed.trades,
      result,
      source,
      fileName,
      format: parsed.format,
      parsedAt: new Date().toISOString(),
      errors: parsed.errors,
      coaching: buildRuleBasedCoaching(result),
      coachingStatus: 'loading',
    },
    error: null,
  };
}

function fromLatestPayload(payload: LatestAuditResponseBody): StoredAudit {
  const stored = payload.coaching ?? (payload.ai_coaching_summary
    ? { summary: payload.ai_coaching_summary, source: 'saved' as const }
    : null);
  mergeAnnotationStore(parseAnnotationMap(payload.annotations));
  return {
    trades: payload.trades,
    result: payload.result,
    source: 'saved',
    fileName: payload.fileName,
    format: payload.format,
    parsedAt: payload.parsedAt,
    errors: [],
    savedReportId: payload.reportId,
    coaching: stored ?? buildRuleBasedCoaching(payload.result),
    coachingStatus: stored ? 'ready' : 'loading',
  };
}

export function AuditSessionProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, configured } = useAuth();
  const [session, setSession] = useState<StoredAudit | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<ParseFailure | null>(null);
  const [persistStatus, setPersistStatus] = useState<AuditSessionValue['persistStatus']>('idle');
  const [persistError, setPersistError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const sessionRef = useRef<StoredAudit | null>(null);
  const coachGen = useRef(0);
  sessionRef.current = session;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredAudit;
        if (parsed.result && !parsed.coaching?.summary) {
          parsed.coaching = buildRuleBasedCoaching(parsed.result);
          parsed.coachingStatus = 'loading';
        }
        setSession(parsed);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  const applySession = useCallback((next: StoredAudit | null) => {
    setSession(next);
    persist(next);
  }, []);

  const requestCoaching = useCallback(
    async (audit: StoredAudit) => {
      const token = ++coachGen.current;
      try {
        const response = await fetch('/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(compactLintForCoach(audit.result)),
        });
        const data = (await response.json()) as CoachingNotes & { error?: string };
        if (token !== coachGen.current) return;
        const current = sessionRef.current;
        if (!current || current.parsedAt !== audit.parsedAt) return;
        if (!response.ok || !data.summary) {
          applySession({ ...current, coachingStatus: 'ready' });
          return;
        }
        applySession({ ...current, coaching: data, coachingStatus: 'ready' });
      } catch {
        if (token !== coachGen.current) return;
        const current = sessionRef.current;
        if (current && current.parsedAt === audit.parsedAt) {
          applySession({ ...current, coachingStatus: 'ready' });
        }
      }
    },
    [applySession],
  );

  const runCsv = useCallback(
    (csvText: string, fileName: string, source: StoredAudit['source'] = 'upload') => {
      const { audit, error: nextError } = buildAuditFromCsv(csvText, fileName, source);
      setError(nextError);
      setPersistStatus('idle');
      setPersistError(null);
      coachGen.current += 1;
      applySession(audit);
      return audit;
    },
    [applySession],
  );

  const loadSample = useCallback(() => runCsv(SAMPLE_CSV, SAMPLE_CSV_FILENAME, 'sample'), [runCsv]);

  const saveToAccount = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || savingRef.current) return false;
    savingRef.current = true;
    setPersistStatus('saving');
    setPersistError(null);
    try {
      const response = await fetch('/api/run-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trades: current.trades,
          annotations: readAnnotationStore(),
          source: current.source === 'saved' ? 'upload' : current.source,
          fileName: current.fileName,
          format: current.format,
        }),
      });
      const data = (await response.json()) as Partial<RunAuditResponseBody> & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Could not save audit.');
      const next: StoredAudit = {
        ...current,
        savedReportId: data.reportId,
        coaching: data.coaching ?? current.coaching,
        coachingStatus: data.coaching ? 'ready' : current.coachingStatus,
      };
      applySession(next);
      setPersistStatus('saved');
      return true;
    } catch (err) {
      setPersistStatus('error');
      setPersistError(err instanceof Error ? err.message : 'Could not save audit.');
      return false;
    } finally {
      savingRef.current = false;
    }
  }, [applySession]);

  const loadLatestSaved = useCallback(async () => {
    try {
      const response = await fetch('/api/audits/latest');
      if (response.status === 401 || response.status === 404 || response.status === 503) {
        return null;
      }
      const data = (await response.json()) as LatestAuditResponseBody & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Could not load saved audit.');
      const next = fromLatestPayload(data);
      setError(null);
      setPersistStatus('saved');
      setPersistError(null);
      applySession(next);
      return next;
    } catch (err) {
      setPersistError(err instanceof Error ? err.message : 'Could not load saved audit.');
      return null;
    }
  }, [applySession]);

  useEffect(() => {
    if (!hydrated || authLoading || !configured || !user) return;
    if (session) return;
    void loadLatestSaved();
  }, [hydrated, authLoading, configured, user, session, loadLatestSaved]);

  useEffect(() => {
    if (!hydrated || authLoading || !configured || !user || !session) return;
    if (session.savedReportId || persistStatus !== 'idle') return;
    void saveToAccount();
  }, [hydrated, authLoading, configured, user, session, persistStatus, saveToAccount]);

  useEffect(() => {
    if (!hydrated || !session || session.coachingStatus !== 'loading') return;
    void requestCoaching(session);
  }, [hydrated, session?.parsedAt, session?.coachingStatus, requestCoaching, session]);

  const clear = useCallback(() => {
    coachGen.current += 1;
    setSession(null);
    setError(null);
    setPersistStatus('idle');
    setPersistError(null);
    persist(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      hydrated,
      error,
      persistStatus,
      persistError,
      runCsv,
      loadSample,
      saveToAccount,
      loadLatestSaved,
      clear,
    }),
    [
      session,
      hydrated,
      error,
      persistStatus,
      persistError,
      runCsv,
      loadSample,
      saveToAccount,
      loadLatestSaved,
      clear,
    ],
  );

  return <AuditSessionContext.Provider value={value}>{children}</AuditSessionContext.Provider>;
}

export function useAuditSession() {
  const ctx = useContext(AuditSessionContext);
  if (!ctx) throw new Error('useAuditSession must be used within AuditSessionProvider');
  return ctx;
}
