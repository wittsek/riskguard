import type { ParseOptions, ParseResult, ParseRowError } from '@/types';
import {
  isBlankRow,
  looksLikeSummaryRow,
  parseCsvTable,
} from './csvUtils';
import { detectCsvFormat, looksLikeMt5DealHistory } from './detectFormat';
import { buildColumnMap, normalizeTradeRow, rowToRecord } from './normalizeRow';

export { detectCsvFormat } from './detectFormat';

export function parseTradeCsv(csvText: string, options: ParseOptions = {}): ParseResult {
  const errors: ParseRowError[] = [];

  if (!csvText || !csvText.trim()) {
    return {
      format: 'Unknown',
      trades: [],
      errors: [{ row: 0, message: 'CSV content is empty' }],
      skipped: 0,
      headers: [],
    };
  }

  const trimmed = csvText.trimStart();
  if (trimmed.startsWith('<') || /<html/i.test(trimmed.slice(0, 200))) {
    return {
      format: 'Unknown',
      trades: [],
      errors: [
        {
          row: 0,
          message:
            'HTML trade reports are not supported. MetaTrader Save as Report is HTML — copy Account History into Excel or Sheets and save as CSV.',
        },
      ],
      skipped: 0,
      headers: [],
    };
  }

  let table;
  try {
    table = parseCsvTable(csvText);
  } catch (error) {
    return {
      format: 'Unknown',
      trades: [],
      errors: [
        {
          row: 0,
          message: error instanceof Error ? error.message : 'Failed to parse CSV',
        },
      ],
      skipped: 0,
      headers: [],
    };
  }

  const format = detectCsvFormat(table.headers);
  const columns = buildColumnMap(table.headers);

  if (
    looksLikeMt5DealHistory(table.headers) ||
    (format === 'MT5' && columns.index.open_time != null && columns.index.close_time == null)
  ) {
    return {
      format: format === 'Unknown' ? 'MT5' : format,
      trades: [],
      errors: [
        {
          row: 0,
          message:
            'This looks like MT5 deal history with a single Time column. Export closed Positions (open and close Time), not Deals. We do not reconstruct deal-only files.',
        },
      ],
      skipped: 0,
      headers: table.headers,
    };
  }

  const trades: ParseResult['trades'] = [];
  let skipped = 0;

  table.rows.forEach((cells, offset) => {
    const rowNumber = table.headerLineNumber + 1 + offset;
    const raw = rowToRecord(table.headers, cells);

    if (isBlankRow(cells) || looksLikeSummaryRow(cells)) {
      skipped += 1;
      return;
    }

    const outcome = normalizeTradeRow(cells, columns, {
      assumeTimezone: options.assumeTimezone,
    });

    if (outcome.kind === 'trade') {
      trades.push(outcome.trade);
      return;
    }
    if (outcome.kind === 'skip') {
      skipped += 1;
      return;
    }

    errors.push({ row: rowNumber, message: outcome.message, raw });
  });

  return { format, trades, errors, skipped, headers: table.headers };
}
