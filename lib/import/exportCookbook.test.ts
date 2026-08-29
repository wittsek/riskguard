import { describe, expect, it } from 'vitest';
import { COOKBOOK_SECTIONS } from './exportCookbook';
import { parseTradeCsv } from '@/lib/parsers';

const SAMPLE_ROWS: Record<string, string> = {
  MT4: '1,2024.01.15 08:30:00,buy,0.10,eurusd,1.08750,1.08500,1.09200,2024.01.15 14:22:00,1.09120,0,0,0,10',
  MT5: '2024.03.01 09:00:00,501,EURUSD,buy,0.50,1.08000,1.07800,1.08500,2024.03.01 12:30:00,1.08300,-3.50,-0.10,150.00',
  cTrader:
    '1001,2001,2024-02-10 08:00:00,2024-02-10 10:00:00,1.09500,1.09700,-1.20,0.00,EURUSD,0.10,Buy,20.00',
  Myfxbook: '01/20/2024 09:15:00,01/20/2024 11:45:00,USDJPY,Buy,0.15,148.200,148.450,25,37.50,2h 30m,0.38',
};

describe('export cookbook headers', () => {
  it('example headers match a file the parser already accepts', () => {
    for (const section of COOKBOOK_SECTIONS) {
      const csv = `${section.exampleHeader}\n${SAMPLE_ROWS[section.platform]}`;
      const parsed = parseTradeCsv(csv);
      expect(parsed.format, section.platform).toBe(section.platform);
      expect(parsed.trades, section.platform).toHaveLength(1);
      expect(parsed.errors, section.platform).toEqual([]);
    }
  });
});
