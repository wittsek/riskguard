import type { CoachingNotes } from './ai';
import type { SessionName } from './analytics';

export interface SessionReviewDateRange {
  start: string;
  end: string;
  label: string;
}

export interface SessionReviewWeakest {
  session: SessionName;
  label: string;
  trades: number;
  win_rate: number;
  pnl: number;
}

export interface SessionReviewCounts {
  revenge: number;
  missing_sl: number;
  other: number;
  total: number;
}

export interface SessionReviewModel {
  fingerprint: string;
  date_range: SessionReviewDateRange | null;
  trade_count: number;
  weakest_session: SessionReviewWeakest | null;
  counts: SessionReviewCounts;
  leak_usd: number;
  actual_pnl: number;
  disciplined_pnl: number;
  readiness_score: number;
  next_session_rules: string[];
  write_up: string;
}

export interface BuildSessionReviewOptions {
  /** Reuse coach bullets when present so rules are not rewritten a second way. */
  coaching?: CoachingNotes | null;
}
