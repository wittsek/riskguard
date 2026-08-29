import { worstSession } from '@/lib/ai/compact';
import { formatMoney, formatWinRate } from '@/lib/utils';
import type { DestructiveHabit, LintResult, SessionStats, ViolationType } from '@/types';

export const AUDIT_CARD_FILENAME = 'riskguard-audit.png';
export const AUDIT_CARD_WIDTH = 1080;
export const AUDIT_CARD_HEIGHT = 1350;
export const AUDIT_CARD_BRAND = 'RiskGuard AI';
export const AUDIT_CARD_SITE_URL = 'getriskguard.com';

export type AuditCardChipKind = 'revenge' | 'missing_sl' | 'worst_session' | 'habit';

export interface AuditCardChip {
  kind: AuditCardChipKind;
  label: string;
  detail: string;
}

export interface AuditCardModel {
  leakAmount: string;
  leakHeadline: string;
  leakCaption: string;
  readinessScore: number;
  readinessLabel: string;
  readinessTone: 'ready' | 'work' | 'risk';
  chips: AuditCardChip[];
  actualPnl: string;
  disciplinedPnl: string;
  pnlDelta: string;
  tradeCount: number;
}

const CHIP_LABELS: Partial<Record<ViolationType, string>> = {
  REVENGE_TRADE: 'Revenge',
  NO_OR_REMOVED_SL: 'Missing SL',
  SL_REMOVED: 'SL removed',
  OVER_LEVERAGE: 'Over-leverage',
  NEWS_TRADING: 'News',
};

const SL_TYPES = new Set<ViolationType>(['NO_OR_REMOVED_SL', 'SL_REMOVED']);

export function formatLeakAmount(value: number): string {
  const abs = Math.abs(Number.isFinite(value) ? value : 0);
  return `$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function readinessBand(score: number): AuditCardModel['readinessTone'] {
  if (score >= 80) return 'ready';
  if (score >= 50) return 'work';
  return 'risk';
}

export function readinessLabel(score: number): string {
  const band = readinessBand(score);
  if (band === 'ready') return 'Prop-ready';
  if (band === 'work') return 'Needs work';
  return 'Not ready';
}

export function formatPnlDelta(actualPnl: number, disciplinedPnl: number): string {
  const gap = disciplinedPnl - actualPnl;
  if (Math.abs(gap) < 0.5) return 'In line with a disciplined book';
  if (gap > 0) return `${formatLeakAmount(gap)} behind disciplined PnL`;
  return `${formatLeakAmount(gap)} ahead of disciplined PnL`;
}

function habitChip(habit: DestructiveHabit, kind: AuditCardChipKind): AuditCardChip {
  return {
    kind,
    label: CHIP_LABELS[habit.type] ?? habit.label,
    detail: formatLeakAmount(habit.money_lost),
  };
}

function sessionChip(session: SessionStats): AuditCardChip {
  return {
    kind: 'worst_session',
    label: `Worst: ${session.label}`,
    detail: `${formatWinRate(session.win_rate)} · ${formatMoney(session.pnl)}`,
  };
}

export function selectAuditCardChips(result: Pick<LintResult, 'top_destructive_habits' | 'sessions'>, max = 3): AuditCardChip[] {
  const chips: AuditCardChip[] = [];
  const habits = result.top_destructive_habits ?? [];
  const used = new Set<ViolationType>();

  const revenge = habits.find((habit) => habit.type === 'REVENGE_TRADE');
  if (revenge) {
    chips.push(habitChip(revenge, 'revenge'));
    used.add(revenge.type);
  }

  const sl = habits.find((habit) => SL_TYPES.has(habit.type));
  if (sl) {
    chips.push(habitChip(sl, 'missing_sl'));
    used.add(sl.type);
  }

  const worst = worstSession(result.sessions ?? []);
  if (worst && chips.length < max) {
    chips.push(sessionChip(worst));
  }

  for (const habit of habits) {
    if (chips.length >= max) break;
    if (used.has(habit.type)) continue;
    chips.push(habitChip(habit, 'habit'));
    used.add(habit.type);
  }

  return chips.slice(0, max);
}

export function buildAuditCardModel(result: LintResult): AuditCardModel {
  const leak = Math.max(0, Number.isFinite(result.money_lost_to_mistakes) ? result.money_lost_to_mistakes : 0);
  const score = Math.max(0, Math.min(100, Math.round(result.readiness_score)));
  const leakAmount = formatLeakAmount(leak);

  return {
    leakAmount,
    leakHeadline: leak > 0 ? leakAmount : '$0',
    leakCaption:
      leak > 0 ? 'leaked to undisciplined trades' : 'no leak versus a disciplined book',
    readinessScore: score,
    readinessLabel: readinessLabel(score),
    readinessTone: readinessBand(score),
    chips: selectAuditCardChips(result),
    actualPnl: formatMoney(result.actual_pnl),
    disciplinedPnl: formatMoney(result.disciplined_pnl),
    pnlDelta: formatPnlDelta(result.actual_pnl, result.disciplined_pnl),
    tradeCount: result.metrics.total_trades,
  };
}
