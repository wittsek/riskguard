import type { LintableTrade } from '@/types';

export function sortByCloseTime(trades: readonly LintableTrade[]): LintableTrade[] {
  return [...trades].sort((a, b) => {
    const close = Date.parse(a.close_time) - Date.parse(b.close_time);
    if (close !== 0) return close;
    return Date.parse(a.open_time) - Date.parse(b.open_time);
  });
}

export function ticketOf(trade: LintableTrade, index: number): string | null {
  return trade.ticket_id ?? `row-${index}`;
}

export function isMissingStopLoss(trade: LintableTrade): boolean {
  return trade.sl_price == null || trade.sl_price === 0;
}

export function utcDayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function utcHour(iso: string): number {
  return new Date(iso).getUTCHours();
}
