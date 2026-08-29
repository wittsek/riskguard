export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function detectDelimiter(headerLine: string): string {
  const candidates = [',', ';', '\t'] as const;
  let best: (typeof candidates)[number] = ',';
  let bestCount = -1;
  for (const d of candidates) {
    const count = splitCsvLine(headerLine, d).length;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

export function splitCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  headerLineNumber: number;
}

const HEADER_HINTS = [
  'ticket',
  'symbol',
  'item',
  'profit',
  'open time',
  'close time',
  'open date',
  'close date',
  'direction',
  'volume',
  'lots',
  'deal',
];

export function looksLikeHeader(cells: string[]): boolean {
  const normalized = cells.map(normalizeHeader).filter(Boolean);
  if (normalized.length < 3) return false;
  let hits = 0;
  for (const cell of normalized) {
    if (HEADER_HINTS.some((hint) => cell === hint || cell.includes(hint))) {
      hits += 1;
    }
  }
  return hits >= 2;
}

export function parseCsvTable(csvText: string): ParsedCsv {
  const text = stripBom(csvText).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = text.split('\n');

  let delimiter = ',';
  let headerLineNumber = 1;
  let headerCells: string[] = [];
  let startIndex = -1;

  for (let i = 0; i < Math.min(rawLines.length, 40); i += 1) {
    const line = rawLines[i];
    if (!line.trim()) continue;
    const guessed = detectDelimiter(line);
    const cells = splitCsvLine(line, guessed);
    if (looksLikeHeader(cells)) {
      delimiter = guessed;
      headerCells = cells;
      headerLineNumber = i + 1;
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex === -1) {
    throw new Error('Could not find a CSV header row with trade columns.');
  }

  const rows: string[][] = [];
  for (let i = startIndex; i < rawLines.length; i += 1) {
    const line = rawLines[i];
    if (!line.trim()) continue;
    rows.push(splitCsvLine(line, delimiter));
  }

  return { headers: headerCells, rows, headerLineNumber };
}

export function parseNumber(raw: string | undefined): number | null {
  if (raw == null) return null;
  let value = raw.trim();
  if (!value) return null;

  const negative = /^\(.*\)$/.test(value);
  value = value.replace(/[()]/g, '');
  value = value.replace(/[$€£%\s]/g, '');
  if (!value || value === '-' || value === '—') return null;

  const hasDot = value.includes('.');
  const hasComma = value.includes(',');

  if (hasDot && hasComma) {
    if (value.lastIndexOf(',') > value.lastIndexOf('.')) {
      value = value.replace(/\./g, '').replace(',', '.');
    } else {
      value = value.replace(/,/g, '');
    }
  } else if (hasComma) {
    const commaCount = (value.match(/,/g) ?? []).length;
    value = commaCount > 1 ? value.replace(/,/g, '') : value.replace(',', '.');
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -Math.abs(parsed) : parsed;
}

const TZ_OFFSET = /([+-]\d{2}:?\d{2}|Z)$/i;

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function utcIso(y: number, m: number, d: number, hh: number, mm: number, ss: number): string {
  return `${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:${pad(ss)}.000Z`;
}

function applyTimezoneOffset(isoUtcGuess: string, assumeTimezone?: string): string {
  if (!assumeTimezone || assumeTimezone.toUpperCase() === 'UTC') {
    return isoUtcGuess;
  }

  try {
    const asUtc = new Date(isoUtcGuess);
    if (Number.isNaN(asUtc.getTime())) return isoUtcGuess;

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: assumeTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(asUtc);

    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const zonedAsUtc = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    );
    const offsetMs = zonedAsUtc - asUtc.getTime();
    return new Date(asUtc.getTime() - offsetMs).toISOString();
  } catch {
    return isoUtcGuess;
  }
}

export function parseDateToUtcIso(
  raw: string | undefined,
  assumeTimezone?: string,
): string | null {
  if (raw == null) return null;
  const value = raw.trim();
  if (!value) return null;

  if (TZ_OFFSET.test(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const patterns: RegExp[] = [
    /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/,
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (!match) continue;

    let year: number;
    let month: number;
    let day: number;
    if (match[1].length === 4) {
      year = Number(match[1]);
      month = Number(match[2]);
      day = Number(match[3]);
    } else {
      const a = Number(match[1]);
      const b = Number(match[2]);
      year = Number(match[3]);
      if (a > 12) {
        day = a;
        month = b;
      } else if (b > 12) {
        month = a;
        day = b;
      } else {
        day = a;
        month = b;
      }
    }

    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6] ?? 0);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const iso = utcIso(year, month, day, hour, minute, second);
    return applyTimezoneOffset(iso, assumeTimezone);
  }

  const ampm = value.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i,
  );
  if (ampm) {
    let hour = Number(ampm[4]);
    const mer = ampm[7].toUpperCase();
    if (mer === 'PM' && hour < 12) hour += 12;
    if (mer === 'AM' && hour === 12) hour = 0;
    const first = Number(ampm[1]);
    const second = Number(ampm[2]);
    const year = Number(ampm[3]);
    const month = first > 12 ? second : first;
    const day = first > 12 ? first : second;
    const iso = utcIso(year, month, day, hour, Number(ampm[5]), Number(ampm[6] ?? 0));
    return applyTimezoneOffset(iso, assumeTimezone);
  }

  const fallback = new Date(value);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toISOString();
  }
  return null;
}

const NON_TRADE_TYPES = new Set([
  'balance',
  'credit',
  'deposit',
  'withdrawal',
  'withdraw',
  'charge',
  'correction',
  'bonus',
  'transfer',
  'commission',
  'swap',
  'financing',
  'dividend',
]);

export function isNonTradeRow(typeRaw: string | undefined, symbolRaw?: string): boolean {
  const type = (typeRaw ?? '').trim().toLowerCase();
  const symbol = (symbolRaw ?? '').trim().toLowerCase();
  if (NON_TRADE_TYPES.has(type)) return true;
  if (NON_TRADE_TYPES.has(symbol)) return true;
  if (type.includes('balance') || type.includes('credit') || type.includes('deposit')) {
    return true;
  }
  return false;
}

export function parseTradeType(raw: string | undefined): 'BUY' | 'SELL' | null {
  if (raw == null) return null;
  const value = raw.trim().toLowerCase();
  if (!value) return null;

  if (
    value === 'buy' ||
    value === 'long' ||
    value.startsWith('buy ') ||
    value === 'in' ||
    value === '0'
  ) {
    return 'BUY';
  }
  if (
    value === 'sell' ||
    value === 'short' ||
    value.startsWith('sell ') ||
    value === 'out' ||
    value === '1'
  ) {
    return 'SELL';
  }
  return null;
}

export function durationSeconds(openIso: string, closeIso: string): number | null {
  const open = Date.parse(openIso);
  const close = Date.parse(closeIso);
  if (Number.isNaN(open) || Number.isNaN(close)) return null;
  return Math.round((close - open) / 1000);
}

export function isBlankRow(cells: string[]): boolean {
  return cells.every((c) => !c.trim());
}

export function looksLikeSummaryRow(cells: string[]): boolean {
  const joined = cells.join(' ').toLowerCase();
  return (
    joined.includes('closed p/l') ||
    joined.includes('total') ||
    /^(closed trades|open trades|pending orders|results|deals)$/i.test(cells[0]?.trim() ?? '')
  );
}
