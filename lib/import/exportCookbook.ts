export const SAMPLE_TRADES_HREF = '/sample-trades.csv';

export type CookbookPlatform = 'MT4' | 'MT5' | 'cTrader' | 'Myfxbook';

export interface CookbookSection {
  id: string;
  platform: CookbookPlatform;
  title: string;
  summary: string;
  honestNote?: string;
  warn?: string;
  steps: string[];
  columns: string[];
  exampleHeader: string;
}

export const COOKBOOK_SECTIONS: CookbookSection[] = [
  {
    id: 'mt4',
    platform: 'MT4',
    title: 'MetaTrader 4',
    summary: 'Copy Account History into a spreadsheet, then save as CSV. Native Save as Report is HTML.',
    honestNote:
      'MT4 desktop has no “Save as CSV”. File-menu / right-click Save as Report and Save as Detailed Report both write HTML. RiskGuard rejects HTML. The path below produces the closed-trade CSV our parser already accepts.',
    steps: [
      'Open MetaTrader 4 on the desktop and log in to the account you want to audit.',
      'Press Ctrl+T (or View → Terminal) and click the Account History tab.',
      'Right-click the list → All History (or Custom Period) so every closed trade you want is visible.',
      'Skip Save as Report / Save as Detailed Report — those files are HTML.',
      'Click a row, then Ctrl+A (or Shift-click the range). Right-click → Copy.',
      'Paste into Excel or Google Sheets. You should see Ticket, Open Time, Type, Size, Item, two Price columns, S/L, T/P, Close Time, Profit.',
      'Save as CSV UTF-8 (Excel: File → Save As → CSV; Sheets: File → Download → CSV).',
      'Drop that .csv on the leak calculator. Semicolon-delimited EU exports are fine.',
    ],
    columns: [
      'Ticket',
      'Open Time',
      'Type',
      'Size',
      'Item',
      'Price',
      'S/L',
      'T/P',
      'Close Time',
      'Price',
      'Commission',
      'Taxes',
      'Swap',
      'Profit',
    ],
    exampleHeader:
      'Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Taxes,Swap,Profit',
  },
  {
    id: 'mt5',
    platform: 'MT5',
    title: 'MetaTrader 5',
    summary: 'Export closed Positions (two Time columns). Never deal-only history.',
    warn: 'Do not export Deal history with a single Time column. We do not reconstruct deals into positions.',
    steps: [
      'Open MetaTrader 5 on the desktop and log in.',
      'Press Ctrl+T and open Toolbox → History.',
      'Right-click the history list → Positions (closed positions). Leave Deals unchecked.',
      'Right-click → All History or Custom Period.',
      'Copy the Positions table (select rows → Copy), or Report → Open XML (Excel) then keep the Closed Positions table only.',
      'In Excel or Sheets, confirm two Time columns (open and close) plus Position, Symbol, Type, Volume, Price, S/L, T/P, Profit.',
      'Save as CSV UTF-8 and drop it here. Native MT5 reports are often HTML or XLSX — convert the positions table to CSV first.',
    ],
    columns: [
      'Time',
      'Position',
      'Symbol',
      'Type',
      'Volume',
      'Price',
      'S/L',
      'T/P',
      'Time',
      'Price',
      'Commission',
      'Swap',
      'Profit',
    ],
    exampleHeader: 'Time,Position,Symbol,Type,Volume,Price,S/L,T/P,Time,Price,Commission,Swap,Profit',
  },
  {
    id: 'ctrader',
    platform: 'cTrader',
    title: 'cTrader',
    summary: 'Export closed positions with opening and closing times.',
    steps: [
      'In cTrader, open History and filter to closed positions for the dates you want.',
      'Export / Copy as CSV (not a PDF statement).',
      'Confirm Opening Time and Closing Time are both present — not a single fill timestamp.',
    ],
    columns: [
      'Closing Deal ID',
      'Opening Deal ID',
      'Opening Time',
      'Closing Time',
      'Entry Price',
      'Closing Price',
      'Commissions',
      'Swap',
      'Symbol',
      'Quantity',
      'Direction',
      'Gross Profit',
    ],
    exampleHeader:
      'Closing Deal ID,Opening Deal ID,Opening Time,Closing Time,Entry Price,Closing Price,Commissions,Swap,Symbol,Quantity,Direction,Gross Profit',
  },
  {
    id: 'myfxbook',
    platform: 'Myfxbook',
    title: 'Myfxbook',
    summary: 'Download the account CSV statement.',
    steps: [
      'Open the Myfxbook account → History / Statement.',
      'Export CSV (not the HTML widget).',
      'You need Open Date, Close Date, Symbol, Action, Lots, and Profit.',
    ],
    columns: [
      'Open Date',
      'Close Date',
      'Symbol',
      'Action',
      'Lots',
      'Open Price',
      'Close Price',
      'Pips',
      'Profit',
      'Duration',
      'Gain',
    ],
    exampleHeader:
      'Open Date,Close Date,Symbol,Action,Lots,Open Price,Close Price,Pips,Profit,Duration,Gain',
  },
];

export const GOOD_FILE_CHECKS = [
  'Real CSV (commas, semicolons, or tabs) — not .htm / .html and not Excel-only .xlsx.',
  'A header row near the top with trade columns. Extra title lines above it are OK.',
  'One row per closed trade. Balance, credit, and deposit rows are skipped automatically.',
  'Both an open time and a close time (MT5: two Time columns on Positions, not one Time on Deals).',
];
