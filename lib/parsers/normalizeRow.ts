import type { NormalizedTradeInput, RawCsvRow } from '@/types';
import {
  durationSeconds,
  isNonTradeRow,
  normalizeHeader,
  parseDateToUtcIso,
  parseNumber,
  parseTradeType,
} from './csvUtils';

type CanonicalField =
  | 'ticket_id'
  | 'symbol'
  | 'trade_type'
  | 'lot_size'
  | 'open_price'
  | 'close_price'
  | 'sl_price'
  | 'tp_price'
  | 'pnl'
  | 'open_time'
  | 'close_time'
  | 'commission'
  | 'swap'
  | 'taxes';

const ALIASES: Record<CanonicalField, string[]> = {
  ticket_id: [
    'ticket',
    'ticket id',
    'deal',
    'order',
    'position',
    'closing deal id',
    'id',
  ],
  symbol: ['symbol', 'item', 'instrument', 'pair'],
  trade_type: ['type', 'direction', 'action', 'side', 'buy/sell'],
  lot_size: ['size', 'lots', 'volume', 'quantity', 'qty', 'lot', 'closed volume'],
  open_price: ['open price', 'openprice', 'entry price', 'price open', 'opening price'],
  close_price: [
    'close price',
    'closeprice',
    'closing price',
    'exit price',
    'price close',
  ],
  sl_price: ['s/l', 'sl', 'stop loss', 'stoploss', 's \\ l'],
  tp_price: ['t/p', 'tp', 'take profit', 'takeprofit', 't \\ p'],
  pnl: [
    'net profit',
    'net p&l',
    'net pnl',
    'net p/l',
    'profit',
    'gross profit',
    'p/l',
    'pnl',
    'pl',
  ],
  open_time: ['open time', 'opentime', 'opening time', 'open date', 'open'],
  close_time: ['close time', 'closetime', 'closing time', 'close date', 'close'],
  commission: ['commission', 'commissions', 'comm'],
  swap: ['swap', 'swaps', 'rollover'],
  taxes: ['taxes', 'tax'],
};

const GENERIC_PRICE = new Set(['price']);
const GENERIC_TIME = new Set(['time', 'date']);
const NET_PNL_HEADERS = new Set(['net profit', 'net p&l', 'net pnl', 'net p/l']);

export interface ColumnMap {
  index: Partial<Record<CanonicalField, number>>;
  pnlIsNet: boolean;
}

export function buildColumnMap(headers: string[]): ColumnMap {
  const normalized = headers.map(normalizeHeader);
  const index: ColumnMap['index'] = {};
  const used = new Set<number>();

  const take = (field: CanonicalField, i: number) => {
    if (index[field] == null && !used.has(i)) {
      index[field] = i;
      used.add(i);
    }
  };

  for (let i = 0; i < normalized.length; i += 1) {
    const header = normalized[i];
    for (const [field, aliases] of Object.entries(ALIASES) as Array<
      [CanonicalField, string[]]
    >) {
      if (aliases.includes(header)) {
        take(field, i);
        break;
      }
    }
  }

  for (let i = 0; i < normalized.length; i += 1) {
    const header = normalized[i];
    if (GENERIC_PRICE.has(header)) {
      if (index.open_price == null) take('open_price', i);
      else if (index.close_price == null) take('close_price', i);
    }
    if (GENERIC_TIME.has(header)) {
      if (index.open_time == null) take('open_time', i);
      else if (index.close_time == null) take('close_time', i);
    }
  }

  const pnlHeader = index.pnl != null ? normalized[index.pnl] : '';
  return { index, pnlIsNet: NET_PNL_HEADERS.has(pnlHeader) };
}

export function rowToRecord(headers: string[], cells: string[]): RawCsvRow {
  const record: RawCsvRow = {};
  for (let i = 0; i < headers.length; i += 1) {
    const key = headers[i] || `col_${i}`;
    if (record[key] == null) {
      record[key] = cells[i] ?? '';
    } else {
      record[`${key}__${i}`] = cells[i] ?? '';
    }
  }
  return record;
}

function cell(cells: string[], i: number | undefined): string | undefined {
  if (i == null) return undefined;
  return cells[i];
}

function nullablePrice(raw: string | undefined): number | null {
  const n = parseNumber(raw);
  if (n == null || n === 0) return null;
  return n;
}

export type NormalizeOutcome =
  | { kind: 'trade'; trade: NormalizedTradeInput }
  | { kind: 'skip'; reason: string }
  | { kind: 'error'; message: string };

export function normalizeTradeRow(
  cells: string[],
  columns: ColumnMap,
  options?: { assumeTimezone?: string },
): NormalizeOutcome {
  const typeRaw = cell(cells, columns.index.trade_type);
  const symbolRaw = cell(cells, columns.index.symbol);

  if (isNonTradeRow(typeRaw, symbolRaw)) {
    return { kind: 'skip', reason: 'non-trade row' };
  }

  const symbol = (symbolRaw ?? '').trim().toUpperCase().replace(/\s+/g, '');
  const tradeType = parseTradeType(typeRaw);
  const lotSize = parseNumber(cell(cells, columns.index.lot_size));
  const openPrice = parseNumber(cell(cells, columns.index.open_price));
  const closePrice = nullablePrice(cell(cells, columns.index.close_price));
  const slPrice = nullablePrice(cell(cells, columns.index.sl_price));
  const tpPrice = nullablePrice(cell(cells, columns.index.tp_price));
  const profit = parseNumber(cell(cells, columns.index.pnl));
  const commission = parseNumber(cell(cells, columns.index.commission)) ?? 0;
  const swap = parseNumber(cell(cells, columns.index.swap)) ?? 0;
  const taxes = parseNumber(cell(cells, columns.index.taxes)) ?? 0;
  const openTime = parseDateToUtcIso(cell(cells, columns.index.open_time), options?.assumeTimezone);
  const closeTime = parseDateToUtcIso(
    cell(cells, columns.index.close_time),
    options?.assumeTimezone,
  );

  const missing: string[] = [];
  if (!symbol) missing.push('symbol');
  if (!tradeType) missing.push('trade_type');
  if (lotSize == null) missing.push('lot_size');
  if (openPrice == null) missing.push('open_price');
  if (profit == null) missing.push('pnl');
  if (!openTime) missing.push('open_time');
  if (!closeTime) missing.push('close_time');

  if (missing.length > 0) {
    if (!symbol && !tradeType && lotSize == null && openPrice == null && !openTime) {
      return { kind: 'skip', reason: 'empty or summary row' };
    }
    return { kind: 'error', message: `Missing or invalid fields: ${missing.join(', ')}` };
  }

  if (lotSize! <= 0) {
    return { kind: 'error', message: 'lot_size must be greater than 0' };
  }
  if (openPrice! <= 0) {
    return { kind: 'error', message: 'open_price must be greater than 0' };
  }

  const closeMs = Date.parse(closeTime!);
  const openMs = Date.parse(openTime!);
  if (closeMs < openMs) {
    return { kind: 'error', message: 'close_time is before open_time' };
  }

  const pnl = columns.pnlIsNet ? profit! : profit! + commission + swap + taxes;
  const ticket = (cell(cells, columns.index.ticket_id) ?? '').trim();

  return {
    kind: 'trade',
    trade: {
      ticket_id: ticket || null,
      symbol,
      trade_type: tradeType!,
      lot_size: lotSize!,
      open_price: openPrice!,
      close_price: closePrice,
      sl_price: slPrice,
      tp_price: tpPrice,
      pnl,
      open_time: openTime!,
      close_time: closeTime!,
      duration_seconds: durationSeconds(openTime!, closeTime!),
    },
  };
}
