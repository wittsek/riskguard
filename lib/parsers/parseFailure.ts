import type { ParseFailure, ParseResult } from '@/types';

const DEAL_HISTORY_RE = /deal history|single time column/i;
const HTML_RE = /html/i;
const EMPTY_RE = /empty/i;
const HEADER_RE = /header row/i;

export function explainParseFailure(result: ParseResult): ParseFailure | null {
  if (result.trades.length > 0) return null;

  const first = result.errors[0]?.message ?? '';
  const format = result.format;
  const base = {
    format,
    rowErrors: result.errors.slice(0, 5),
    skipped: result.skipped,
    headers: result.headers,
  };

  if (EMPTY_RE.test(first)) {
    return {
      ...base,
      kind: 'empty',
      title: 'That file is empty',
      message: first,
      hint: 'Export a closed-position history, or download the sample CSV to confirm the dropzone works.',
      guideHref: '/import',
    };
  }

  if (HTML_RE.test(first)) {
    return {
      ...base,
      kind: 'html',
      title: 'This looks like an HTML report',
      message: first,
      hint: 'MT4 and MT5 “Save as Report” write HTML. Copy the History table into Excel or Sheets and save as CSV.',
      guideHref: '/import#mt4',
    };
  }

  if (DEAL_HISTORY_RE.test(first)) {
    return {
      ...base,
      kind: 'deal_history',
      format: format === 'Unknown' ? 'MT5' : format,
      title: 'This looks like MT5 deal history',
      message: first,
      hint: 'Switch History to Positions (two Time columns). Do not export Deals with a single Time column.',
      guideHref: '/import#mt5',
    };
  }

  if (HEADER_RE.test(first)) {
    return {
      ...base,
      kind: 'no_header',
      title: 'Could not find trade columns',
      message: first,
      hint: 'A good file starts with a header row (Ticket or Time, Symbol, Type, Profit). HTML saved as .csv still fails — re-export as real CSV.',
      guideHref: '/import#good-file',
    };
  }

  if (result.skipped > 0 && result.errors.length === 0) {
    return {
      ...base,
      kind: 'no_trades',
      title: 'No closed trades in that file',
      message: `Detected ${format}. ${result.skipped} row(s) were skipped (balance, credit, or summary).`,
      hint: 'Export closed buy/sell history, not just deposits. See the cookbook for the columns we accept.',
      guideHref: format === 'MT5' ? '/import#mt5' : '/import#mt4',
    };
  }

  if (first) {
    return {
      ...base,
      kind: 'no_trades',
      title: 'No closed trades found',
      message: first,
      hint:
        format !== 'Unknown'
          ? `Detected ${format}, but rows were missing open/close times, symbol, or profit.`
          : 'Export an MT4/MT5/cTrader/Myfxbook closed-position CSV.',
      guideHref: format === 'MT5' ? '/import#mt5' : '/import',
    };
  }

  return {
    ...base,
    kind: 'unknown',
    title: 'Could not read that file',
    message: 'No closed trades found in that file. Export an MT4/MT5/cTrader/Myfxbook history CSV.',
    hint: 'Open the export cookbook for the exact clicks and a sample file.',
    guideHref: '/import',
  };
}
