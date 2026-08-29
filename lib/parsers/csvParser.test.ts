import { describe, expect, it } from 'vitest';
import { parseTradeCsv } from './csvParser';
import { parseDateToUtcIso, parseNumber } from './csvUtils';

const MT4_CSV = `Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Taxes,Swap,Profit
12859374,2024.01.15 08:30:00,buy,0.10,eurusd,1.08750,1.08500,1.09200,2024.01.15 14:22:00,1.09120,0.00,0.00,-0.32,37.00
12859380,2024.01.15 09:00:00,balance,0.00,,,,0,2024.01.15 09:00:00,,,0.00,0.00,0.00,1000.00
12859390,2024.01.16 10:15:00,sell,0.20,gbpusd,1.27100,0,1.26500,2024.01.16 11:00:00,1.26850,-2.00,0.00,0.00,50.00
`;

const MT5_CSV = `Time,Position,Symbol,Type,Volume,Price,S/L,T/P,Time,Price,Commission,Swap,Profit
2024.03.01 09:00:00,501,EURUSD,buy,0.50,1.08000,1.07800,1.08500,2024.03.01 12:30:00,1.08300,-3.50,-0.10,150.00
2024.03.01 13:00:00,502,XAUUSD,sell,0.10,2050.00,2055.00,2030.00,2024.03.01 15:00:00,2040.00,-2.00,0.00,100.00
`;

const CTRADER_CSV = `Closing Deal ID,Opening Deal ID,Opening Time,Closing Time,Entry Price,Closing Price,Commissions,Swap,Symbol,Quantity,Direction,Gross Profit
1001,2001,2024-02-10 08:00:00,2024-02-10 10:00:00,1.09500,1.09700,-1.20,0.00,EURUSD,0.10,Buy,20.00
1002,2002,2024-02-11 14:00:00,2024-02-11 16:30:00,1.26500,1.26200,-1.20,-0.40,GBPUSD,0.20,Sell,60.00
`;

const MYFXBOOK_CSV = `Open Date,Close Date,Symbol,Action,Lots,Open Price,Close Price,Pips,Profit,Duration,Gain
01/20/2024 09:15:00,01/20/2024 11:45:00,USDJPY,Buy,0.15,148.200,148.450,25,37.50,2h 30m,0.38
01/21/2024 13:00:00,01/21/2024 13:40:00,USDCAD,Sell,0.10,1.35200,1.35000,20,14.80,40m,0.15
`;

describe('parseTradeCsv', () => {
  it('parses MT4 history, skips balance rows, and nets commission/swap into pnl', () => {
    const result = parseTradeCsv(MT4_CSV);

    expect(result.format).toBe('MT4');
    expect(result.errors).toEqual([]);
    expect(result.skipped).toBe(1);
    expect(result.trades).toHaveLength(2);

    const [buy, sell] = result.trades;
    expect(buy.ticket_id).toBe('12859374');
    expect(buy.symbol).toBe('EURUSD');
    expect(buy.trade_type).toBe('BUY');
    expect(buy.lot_size).toBe(0.1);
    expect(buy.open_price).toBe(1.0875);
    expect(buy.close_price).toBe(1.0912);
    expect(buy.sl_price).toBe(1.085);
    expect(buy.tp_price).toBe(1.092);
    expect(buy.pnl).toBeCloseTo(36.68);
    expect(buy.open_time).toBe('2024-01-15T08:30:00.000Z');
    expect(buy.close_time).toBe('2024-01-15T14:22:00.000Z');
    expect(buy.duration_seconds).toBe(5 * 3600 + 52 * 60);

    expect(sell.trade_type).toBe('SELL');
    expect(sell.sl_price).toBeNull();
    expect(sell.pnl).toBeCloseTo(48);
  });

  it('parses MT5 closed-position exports', () => {
    const result = parseTradeCsv(MT5_CSV);

    expect(result.format).toBe('MT5');
    expect(result.errors).toEqual([]);
    expect(result.trades).toHaveLength(2);
    expect(result.trades[0].symbol).toBe('EURUSD');
    expect(result.trades[0].ticket_id).toBe('501');
    expect(result.trades[0].pnl).toBeCloseTo(146.4);
    expect(result.trades[1].symbol).toBe('XAUUSD');
    expect(result.trades[1].duration_seconds).toBe(2 * 3600);
  });

  it('parses cTrader deal exports', () => {
    const result = parseTradeCsv(CTRADER_CSV);

    expect(result.format).toBe('cTrader');
    expect(result.errors).toEqual([]);
    expect(result.trades).toHaveLength(2);
    expect(result.trades[0].trade_type).toBe('BUY');
    expect(result.trades[0].ticket_id).toBe('1001');
    expect(result.trades[1].trade_type).toBe('SELL');
    expect(result.trades[1].duration_seconds).toBe(2.5 * 3600);
  });

  it('parses Myfxbook history', () => {
    const result = parseTradeCsv(MYFXBOOK_CSV);

    expect(result.format).toBe('Myfxbook');
    expect(result.errors).toEqual([]);
    expect(result.trades).toHaveLength(2);
    expect(result.trades[0].symbol).toBe('USDJPY');
    expect(result.trades[0].lot_size).toBe(0.15);
    expect(result.trades[0].pnl).toBe(37.5);
    expect(result.trades[1].trade_type).toBe('SELL');
  });

  it('returns per-row errors without aborting the file', () => {
    const csv = `Ticket,Open Time,Type,Size,Item,Price,S/L,T/P,Close Time,Price,Commission,Taxes,Swap,Profit
1,2024.01.15 08:30:00,buy,0.10,eurusd,1.08750,1.08500,1.09200,2024.01.15 14:22:00,1.09120,0,0,0,10
2,not-a-date,buy,0.10,eurusd,1.08,0,0,2024.01.15 14:22:00,1.09,0,0,0,5
3,2024.01.16 10:00:00,sell,0.20,gbpusd,1.27,0,0,2024.01.16 11:00:00,1.26,0,0,0,20
`;
    const result = parseTradeCsv(csv);

    expect(result.trades.map((t) => t.ticket_id)).toEqual(['1', '3']);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/open_time/i);
    expect(result.errors[0].row).toBeGreaterThan(1);
  });

  it('handles semicolon-delimited EU exports', () => {
    const csv = `Ticket;Open Time;Type;Size;Item;Price;S/L;T/P;Close Time;Price;Commission;Taxes;Swap;Profit
9;2024.01.15 08:30:00;buy;0,10;EURUSD;1,08750;1,08500;1,09200;2024.01.15 14:22:00;1,09120;0;0;0;37,00
`;
    const result = parseTradeCsv(csv);
    expect(result.format).toBe('MT4');
    expect(result.trades).toHaveLength(1);
    expect(result.trades[0].lot_size).toBeCloseTo(0.1);
    expect(result.trades[0].open_price).toBeCloseTo(1.0875);
    expect(result.trades[0].pnl).toBeCloseTo(37);
  });

  it('rejects empty input and HTML reports', () => {
    expect(parseTradeCsv('').errors[0].message).toMatch(/empty/i);
    expect(parseTradeCsv('<html><body>Report</body></html>').errors[0].message).toMatch(/HTML/i);
  });

  it('rejects MT5 deal history with a single Time column', () => {
    const csv = `Time,Deal,Symbol,Type,Direction,Volume,Price,Order,Commission,Swap,Profit,Balance,Comment
2024.03.01 09:00:00,1001,EURUSD,buy,in,0.50,1.08000,400,-1.75,0,0,10000,
2024.03.01 12:30:00,1002,EURUSD,buy,out,0.50,1.08300,401,-1.75,-0.10,150,10148.15,
`;
    const result = parseTradeCsv(csv);
    expect(result.format).toBe('MT5');
    expect(result.trades).toHaveLength(0);
    expect(result.errors[0].message).toMatch(/deal history/i);
    expect(result.errors[0].message).toMatch(/single Time column/i);
  });

  it('converts offset timestamps to UTC', () => {
    const csv = `Open Date,Close Date,Symbol,Action,Lots,Open Price,Close Price,Pips,Profit,Duration,Gain
2024-01-20T10:00:00+02:00,2024-01-20T12:00:00+02:00,EURUSD,Buy,0.10,1.09,1.10,10,10,2h,0.1
`;
    const result = parseTradeCsv(csv);
    expect(result.trades[0].open_time).toBe('2024-01-20T08:00:00.000Z');
    expect(result.trades[0].close_time).toBe('2024-01-20T10:00:00.000Z');
    expect(result.trades[0].duration_seconds).toBe(7200);
  });
});

describe('parseNumber / parseDateToUtcIso', () => {
  it('parses US and EU number formats', () => {
    expect(parseNumber('1,234.56')).toBe(1234.56);
    expect(parseNumber('1.234,56')).toBe(1234.56);
    expect(parseNumber('(12.50)')).toBe(-12.5);
    expect(parseNumber('')).toBeNull();
  });

  it('parses broker-style dates as UTC by default', () => {
    expect(parseDateToUtcIso('2024.01.15 08:30:00')).toBe('2024-01-15T08:30:00.000Z');
    expect(parseDateToUtcIso('15.01.2024 08:30')).toBe('2024-01-15T08:30:00.000Z');
  });
});
