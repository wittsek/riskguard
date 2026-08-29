import { describe, expect, it } from 'vitest';
import {
  applyAnnotationView,
  annotationsFromDbRows,
  mergeAnnotationMaps,
  mergeTradeAnnotations,
  normalizeNote,
  normalizeSetupTags,
  parseAnnotationMap,
  tradeAnnotationKey,
  upsertAnnotation,
} from './annotations';

const OPEN_A = '2024-03-04T10:12:00.000Z';
const OPEN_B = '2024-03-04T14:20:00.000Z';

function trade(ticket: string | null, open = OPEN_A, symbol = 'EURUSD') {
  return { ticket_id: ticket, open_time: open, symbol };
}

describe('tradeAnnotationKey', () => {
  it('is stable for the same ticket + open time across ISO variants', () => {
    expect(tradeAnnotationKey('1004', '2024-03-04T10:12:00.000Z')).toBe(
      tradeAnnotationKey('1004', '2024-03-04T10:12:00Z'),
    );
    expect(tradeAnnotationKey(' 1004 ', OPEN_A)).toBe(`1004|${OPEN_A}`);
  });

  it('still keys rows that have no ticket', () => {
    expect(tradeAnnotationKey(null, OPEN_A)).toBe(`|${OPEN_A}`);
  });
});

describe('normalize helpers', () => {
  it('trims, dedupes, and caps tags', () => {
    expect(normalizeSetupTags([' Breakout ', 'breakout', 'News', '', 12])).toEqual([
      'Breakout',
      'News',
    ]);
    expect(normalizeSetupTags(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'])).toHaveLength(8);
  });

  it('collapses note whitespace and caps length', () => {
    expect(normalizeNote('  chased   the close  ')).toBe('chased the close');
    expect(normalizeNote('x'.repeat(400))).toHaveLength(280);
    expect(normalizeNote(null)).toBe('');
  });
});

describe('parseAnnotationMap / upsert', () => {
  it('drops empty or malformed entries', () => {
    expect(
      parseAnnotationMap({
        [`1001|${OPEN_A}`]: { note: '  chased  ', setup_tags: ['Breakout'] },
        'not-a-key': { note: 'nope', setup_tags: ['News'] },
        [`1002|${OPEN_B}`]: { note: '   ', setup_tags: [] },
      }),
    ).toEqual({
      [`1001|${OPEN_A}`]: { note: 'chased', setup_tags: ['Breakout'] },
    });
  });

  it('accepts notes from a DB-shaped payload', () => {
    expect(upsertAnnotation(undefined, { note: 'missed SL', setup_tags: ['Reversal'] })).toEqual({
      note: 'missed SL',
      setup_tags: ['Reversal'],
    });
  });
});

describe('mergeTradeAnnotations', () => {
  it('rematches the same book after a re-lint by ticket + open time', () => {
    const firstPass = [trade('1004', OPEN_A), trade('1006', OPEN_B)];
    const map = {
      [tradeAnnotationKey('1004', OPEN_A)]: { note: 'revenge size', setup_tags: ['Scalp'] },
    };

    const relint = mergeTradeAnnotations(
      [trade('1006', OPEN_B), trade('1004', '2024-03-04T10:12:00Z')],
      map,
    );

    expect(relint[1]).toMatchObject({
      note: 'revenge size',
      setup_tags: ['Scalp'],
    });
    expect(mergeTradeAnnotations(firstPass, map)[0].note).toBe(relint[1].note);
  });
});

describe('applyAnnotationView', () => {
  it('filters by tag and by has-note, then sorts', () => {
    const trades = [trade('1', OPEN_A), trade('2', OPEN_B), trade('3', '2024-03-05T01:20:00.000Z')];
    const map = mergeAnnotationMaps(
      {},
      {
        [tradeAnnotationKey('1', OPEN_A)]: { note: 'late entry', setup_tags: ['Pullback'] },
        [tradeAnnotationKey('2', OPEN_B)]: { note: '', setup_tags: ['News'] },
        [tradeAnnotationKey('3', '2024-03-05T01:20:00.000Z')]: {
          note: 'clean',
          setup_tags: ['Breakout'],
        },
      },
    );

    const noted = applyAnnotationView(trades, map, 'has_note', 'original');
    expect(noted.map((row) => row.trade.ticket_id)).toEqual(['1', '3']);

    const news = applyAnnotationView(trades, map, { tag: 'News' }, 'original');
    expect(news).toHaveLength(1);
    expect(news[0]?.trade.ticket_id).toBe('2');

    const byTag = applyAnnotationView(trades, map, 'all', 'tag');
    expect(byTag.map((row) => row.setup_tags[0])).toEqual(['Breakout', 'News', 'Pullback']);
  });
});

describe('annotationsFromDbRows', () => {
  it('hydrates a session map from trades table columns', () => {
    expect(
      annotationsFromDbRows([
        {
          ticket_id: '1004',
          open_time: OPEN_A,
          notes: 'sized up after a loss',
          setup_tags: ['Scalp', 'News'],
        },
        { ticket_id: '1005', open_time: OPEN_B, notes: null, setup_tags: [] },
      ]),
    ).toEqual({
      [tradeAnnotationKey('1004', OPEN_A)]: {
        note: 'sized up after a loss',
        setup_tags: ['Scalp', 'News'],
      },
    });
  });
});
