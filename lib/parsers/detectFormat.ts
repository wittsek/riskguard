import type { CsvFormat } from '@/types';
import { normalizeHeader } from './csvUtils';

const FORMAT_SIGNATURES: Record<Exclude<CsvFormat, 'Unknown'>, string[]> = {
  MT4: ['ticket', 'open time', 'item', 's/l', 't/p', 'close time', 'profit'],
  MT5: ['deal', 'symbol', 'volume', 'direction', 'order', 'balance', 'comment', 'position'],
  cTrader: [
    'closing deal id',
    'opening deal id',
    'entry price',
    'closing price',
    'quantity',
    'gross profit',
    'direction',
  ],
  Myfxbook: ['open date', 'close date', 'action', 'lots', 'pips', 'gain', 'duration'],
};

/** MT5 deal/order history: one Time column, not a closed-position open/close pair. */
export function looksLikeMt5DealHistory(headers: string[]): boolean {
  const normalized = headers.map(normalizeHeader);
  const set = new Set(normalized);
  const hasNamedOpenClose =
    set.has('open time') ||
    set.has('close time') ||
    set.has('opening time') ||
    set.has('closing time') ||
    set.has('open date') ||
    set.has('close date');
  if (hasNamedOpenClose) return false;

  const genericTimes = normalized.filter((h) => h === 'time' || h === 'date').length;
  const dealLike = set.has('deal') && (set.has('direction') || set.has('balance') || set.has('comment'));
  return dealLike && genericTimes <= 1;
}

export function detectCsvFormat(headers: string[]): CsvFormat {
  const normalized = headers.map(normalizeHeader);
  const set = new Set(normalized);

  const scores: Record<Exclude<CsvFormat, 'Unknown'>, number> = {
    MT4: 0,
    MT5: 0,
    cTrader: 0,
    Myfxbook: 0,
  };

  for (const format of Object.keys(FORMAT_SIGNATURES) as Array<keyof typeof FORMAT_SIGNATURES>) {
    for (const token of FORMAT_SIGNATURES[format]) {
      if (set.has(token) || normalized.some((h) => h.includes(token))) {
        scores[format] += 1;
      }
    }
  }

  if (set.has('item') && set.has('ticket')) scores.MT4 += 2;
  if (set.has('symbol') && (set.has('deal') || set.has('volume') || set.has('position'))) {
    scores.MT5 += 2;
  }
  if (set.has('closing deal id') || set.has('entry price')) scores.cTrader += 2;
  if (set.has('open date') && set.has('pips')) scores.Myfxbook += 2;

  const ranked = (Object.entries(scores) as Array<[Exclude<CsvFormat, 'Unknown'>, number]>).sort(
    (a, b) => b[1] - a[1],
  );

  const [best, bestScore] = ranked[0];
  if (bestScore === 0) return 'Unknown';
  if (bestScore === ranked[1][1] && bestScore < 3) return 'Unknown';
  return best;
}
