import { describe, expect, it } from 'vitest';
import { parseTradeCsv } from './csvParser';
import { explainParseFailure } from './parseFailure';

const DEAL_CSV = `Time,Deal,Symbol,Type,Direction,Volume,Price,Order,Commission,Swap,Profit,Balance,Comment
2024.03.01 09:00:00,1001,EURUSD,buy,in,0.50,1.08000,400,-1.75,0,0,10000,
2024.03.01 12:30:00,1002,EURUSD,buy,out,0.50,1.08300,401,-1.75,-0.10,150,10148.15,
`;

describe('explainParseFailure', () => {
  it('returns null when trades were parsed', () => {
    const csv = `Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Taxes,Swap,Profit
1,2024.01.15 08:30:00,buy,0.10,eurusd,1.08750,1.08500,1.09200,2024.01.15 14:22:00,1.09120,0,0,0,10
`;
    expect(explainParseFailure(parseTradeCsv(csv))).toBeNull();
  });

  it('classifies empty and HTML reports', () => {
    const empty = explainParseFailure(parseTradeCsv(''));
    expect(empty?.kind).toBe('empty');

    const html = explainParseFailure(parseTradeCsv('<html><body>Report</body></html>'));
    expect(html?.kind).toBe('html');
    expect(html?.title).toMatch(/HTML/i);
    expect(html?.guideHref).toBe('/import#mt4');
  });

  it('classifies MT5 deal history with a single Time column', () => {
    const parsed = parseTradeCsv(DEAL_CSV);
    expect(parsed.format).toBe('MT5');
    expect(parsed.trades).toHaveLength(0);
    expect(parsed.errors[0].message).toMatch(/deal history/i);

    const failure = explainParseFailure(parsed);
    expect(failure?.kind).toBe('deal_history');
    expect(failure?.guideHref).toBe('/import#mt5');
  });

  it('classifies missing headers', () => {
    const failure = explainParseFailure(parseTradeCsv('hello,world\n1,2'));
    expect(failure?.kind).toBe('no_header');
  });
});
