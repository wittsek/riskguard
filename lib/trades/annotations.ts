export const SETUP_TAG_PRESETS = [
  'Breakout',
  'Pullback',
  'Reversal',
  'News',
  'Scalp',
  'Other',
] as const;

export type SetupTagPreset = (typeof SETUP_TAG_PRESETS)[number];

export const MAX_NOTE_LENGTH = 280;
export const MAX_TAG_LENGTH = 32;
export const MAX_TAGS_PER_TRADE = 8;

export interface TradeAnnotation {
  note: string;
  setup_tags: string[];
}

export type AnnotationMap = Record<string, TradeAnnotation>;

export type AnnotationFilter = 'all' | 'has_note' | 'no_note' | { tag: string };
export type AnnotationSort = 'original' | 'open_time' | 'tag' | 'has_note';

export interface AnnotatableTrade {
  ticket_id: string | null;
  open_time: string;
}

export interface AnnotatedLogTrade<T extends AnnotatableTrade = AnnotatableTrade>
  extends TradeAnnotation {
  trade: T;
  key: string;
}

const EMPTY: TradeAnnotation = { note: '', setup_tags: [] };

export function tradeAnnotationKey(
  ticketId: string | null | undefined,
  openTime: string,
): string {
  const ticket = (ticketId ?? '').trim();
  const ms = Date.parse(openTime);
  const time = Number.isFinite(ms) ? new Date(ms).toISOString() : openTime.trim();
  return `${ticket}|${time}`;
}

export function emptyAnnotation(): TradeAnnotation {
  return { note: '', setup_tags: [] };
}

export function isEmptyAnnotation(value: TradeAnnotation | null | undefined): boolean {
  if (!value) return true;
  return value.note.trim().length === 0 && value.setup_tags.length === 0;
}

export function normalizeNote(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_NOTE_LENGTH);
}

export function normalizeSetupTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of value) {
    if (typeof raw !== 'string') continue;
    const tag = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_TAG_LENGTH);
    if (!tag) continue;
    const dedupe = tag.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    tags.push(tag);
    if (tags.length >= MAX_TAGS_PER_TRADE) break;
  }
  return tags;
}

export function normalizeAnnotation(value: unknown): TradeAnnotation {
  if (typeof value !== 'object' || value == null) return emptyAnnotation();
  const row = value as { note?: unknown; notes?: unknown; setup_tags?: unknown };
  return {
    note: normalizeNote(row.note ?? row.notes),
    setup_tags: normalizeSetupTags(row.setup_tags),
  };
}

export function parseAnnotationMap(value: unknown): AnnotationMap {
  if (typeof value !== 'object' || value == null || Array.isArray(value)) return {};
  const map: AnnotationMap = {};
  for (const [rawKey, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof rawKey !== 'string' || !rawKey.includes('|')) continue;
    const annotation = normalizeAnnotation(raw);
    if (isEmptyAnnotation(annotation)) continue;
    map[rawKey] = annotation;
  }
  return map;
}

export function upsertAnnotation(
  current: TradeAnnotation | null | undefined,
  patch: Partial<TradeAnnotation> | null | undefined,
): TradeAnnotation {
  const base = current ?? emptyAnnotation();
  return {
    note: patch?.note !== undefined ? normalizeNote(patch.note) : base.note,
    setup_tags:
      patch?.setup_tags !== undefined ? normalizeSetupTags(patch.setup_tags) : base.setup_tags,
  };
}

export function mergeAnnotationMaps(
  current: AnnotationMap,
  incoming: AnnotationMap,
): AnnotationMap {
  const next: AnnotationMap = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    const merged = upsertAnnotation(next[key], value);
    if (isEmptyAnnotation(merged)) delete next[key];
    else next[key] = merged;
  }
  return next;
}

export function annotationForTrade(
  map: AnnotationMap,
  trade: AnnotatableTrade,
): TradeAnnotation {
  return map[tradeAnnotationKey(trade.ticket_id, trade.open_time)] ?? EMPTY;
}

export function mergeTradeAnnotations<T extends AnnotatableTrade>(
  trades: readonly T[],
  map: AnnotationMap,
): AnnotatedLogTrade<T>[] {
  return trades.map((trade) => {
    const key = tradeAnnotationKey(trade.ticket_id, trade.open_time);
    const annotation = map[key] ?? EMPTY;
    return {
      trade,
      key,
      note: annotation.note,
      setup_tags: annotation.setup_tags,
    };
  });
}

export function annotationsFromDbRows(
  rows: readonly {
    ticket_id?: string | null;
    open_time?: string;
    notes?: string | null;
    setup_tags?: string[] | null;
  }[],
): AnnotationMap {
  const map: AnnotationMap = {};
  for (const row of rows) {
    if (typeof row.open_time !== 'string' || !row.open_time) continue;
    const annotation = normalizeAnnotation({
      note: row.notes,
      setup_tags: row.setup_tags,
    });
    if (isEmptyAnnotation(annotation)) continue;
    map[tradeAnnotationKey(row.ticket_id ?? null, row.open_time)] = annotation;
  }
  return map;
}

export function usedSetupTags(rows: readonly Pick<TradeAnnotation, 'setup_tags'>[]): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const row of rows) {
    for (const tag of row.setup_tags) {
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tags.push(tag);
    }
  }
  return tags.sort((a, b) => a.localeCompare(b));
}

export function matchesAnnotationFilter(
  row: TradeAnnotation,
  filter: AnnotationFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'has_note') return row.note.trim().length > 0;
  if (filter === 'no_note') return row.note.trim().length === 0;
  return row.setup_tags.some((tag) => tag.toLowerCase() === filter.tag.toLowerCase());
}

export function filterAnnotatedTrades<T extends AnnotatableTrade>(
  rows: readonly AnnotatedLogTrade<T>[],
  filter: AnnotationFilter,
): AnnotatedLogTrade<T>[] {
  if (filter === 'all') return [...rows];
  return rows.filter((row) => matchesAnnotationFilter(row, filter));
}

function firstTag(tags: readonly string[]): string {
  return tags[0]?.toLowerCase() ?? '';
}

export function sortAnnotatedTrades<T extends AnnotatableTrade>(
  rows: readonly AnnotatedLogTrade<T>[],
  sort: AnnotationSort,
): AnnotatedLogTrade<T>[] {
  if (sort === 'original') return [...rows];
  return [...rows].sort((a, b) => {
    if (sort === 'has_note') {
      const noteDelta = Number(Boolean(b.note)) - Number(Boolean(a.note));
      if (noteDelta !== 0) return noteDelta;
    }
    if (sort === 'tag') {
      const tagDelta = firstTag(a.setup_tags).localeCompare(firstTag(b.setup_tags));
      if (tagDelta !== 0) return tagDelta;
    }
    const openDelta = Date.parse(a.trade.open_time) - Date.parse(b.trade.open_time);
    if (openDelta !== 0) return openDelta;
    return (a.trade.ticket_id ?? '').localeCompare(b.trade.ticket_id ?? '');
  });
}

export function applyAnnotationView<T extends AnnotatableTrade>(
  trades: readonly T[],
  map: AnnotationMap,
  filter: AnnotationFilter = 'all',
  sort: AnnotationSort = 'original',
): AnnotatedLogTrade<T>[] {
  return sortAnnotatedTrades(filterAnnotatedTrades(mergeTradeAnnotations(trades, map), filter), sort);
}
