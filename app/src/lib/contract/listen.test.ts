// contract/listen.ts: English Study's progress rows (docs/english.md "Progress") and who gets what of them
// (contract/guest.ts rowsFor, which the demo applies too).
import { describe, expect, it } from 'vitest';
import { TV_GM, listenOf, listenSeen, listenSummaryJson, listenSummaryOf } from './listen.ts';
import { rowsFor } from './guest.ts';
import type { EventRow, SnapshotRows } from './api.ts';

const tv = { d: '2026-11-05', g: 'tv12ab', gm: TV_GM, u: 'waitress', ms: 600_000, f: 1, r: [['g1', 1, 1, 0], ['d1', 0, 4, 1]] };
const sum = { d: '2026-11-05', g: 'tv12ab', ms: 600_000, gm: TV_GM, f: 1 };
/** A row written before 2026-11-18, with ききみみ's `lv` and `n`. */
const old = { ...tv, lv: 7, n: 1 };

describe('listenOf', () => {
  it('reads a clip’s row, finished (`f`) or part-way, answers or none; refuses any other shape', () => {
    expect(listenOf(tv)).toEqual(tv);
    expect(listenOf(old)).toEqual(tv); // (read, not kept)
    const { f: _f, ...part } = { ...tv, r: [] };
    expect(listenOf(part)).toEqual(part);
    expect(listenOf({ ...tv, r: [] })).toEqual({ ...tv, r: [] }); // (まとめ reached with nothing answered: never locked)
    expect(listenOf({ ...tv, r: [['g1', 1, -1, 99], ['d1', 0, 4095, 0]] })).toMatchObject({ r: [['g1', 1, -1, 99], ['d1', 0, 4095, 0]] });
    for (const bad of [null, [], 'x', { ...tv, extra: 1 }, { ...tv, g: 'a' }, { ...tv, lv: 0 }, { ...tv, lv: 9 }, { ...tv, n: 0 }, { ...tv, n: 4 }, { ...tv, ms: -1 }, { ...tv, ms: 1.5 },
      { ...tv, f: 2 }, { ...tv, f: true }, { ...tv, u: undefined }, { ...tv, u: '' }, { ...tv, u: 'abcdefghijklm' }, { ...tv, u: 'U1' },
      { ...tv, r: 'x' }, { ...tv, r: [['g1', 1, 0]] }, { ...tv, r: [['g1', 1, -2, 0]] }, { ...tv, r: [['g1', 1, 4096, 0]] }, { ...tv, r: [['g1', 2, 0, 0]] }, { ...tv, d: '2026-11-31' }])
      expect(listenOf(bad), JSON.stringify(bad)).toBeNull();
  });
  it('the retired ききみみ’s rows are no row: a quiz’s (no `gm`), another game’s, a story’s, a unit’s lesson, a practice', () => {
    for (const bad of [{ ...tv, gm: undefined }, { ...tv, gm: 'tile' }, { ...tv, gm: 'story', r: [] }, { ...tv, l: 3, tm: 5 }, { ...tv, p: 1 }])
      expect(listenOf(bad), JSON.stringify(bad)).toBeNull();
    expect(listenSummaryJson(JSON.stringify({ ...tv, gm: 'tile' }))).toBeNull();
  });
  it('the summary: the day, the session, the minutes and `f`; never the clip or the answers', () => {
    expect(JSON.parse(listenSummaryJson(JSON.stringify(tv))!)).toEqual(sum);
    expect(JSON.parse(listenSummaryJson(JSON.stringify(old))!)).toEqual(sum);
    expect(listenSummaryOf({ ...sum, n: 1 })).toEqual(sum); // (an older relay's summary)
    const { f: _f, ...part } = tv;
    const { f: _g, ...partSum } = sum;
    expect(JSON.parse(listenSummaryJson(JSON.stringify(part))!)).toEqual(partSum);
    expect(listenSummaryOf(sum)).toEqual(sum);
    expect(listenSummaryOf({ ...sum, u: 'waitress', stamped: 1 })).toEqual(sum);
    for (const odd of [{ ...sum, gm: 'tile' }, { ...sum, gm: undefined }, { ...sum, f: 2 }, { d: 'x' }]) expect(listenSummaryOf(odd), JSON.stringify(odd)).toBeNull();
    expect(listenSummaryJson('{')).toBeNull();
  });
  it('lets the owner see all and anyone else a summary, the guest and the members alike', () => {
    expect([listenSeen('A', 'A'), listenSeen('A', 'B'), listenSeen('B', 'A'), listenSeen('G', 'A'), listenSeen('A', 'G'), listenSeen('G', 'G')])
      .toEqual(['all', 'summary', 'summary', 'summary', 'summary', 'all']);
  });
});

describe('rowsFor and listen rows', () => {
  const ev = (who: 'A' | 'B' | 'G', id: string, data: object): EventRow => ['2026-11-05T03:00:00.000Z', who, id, 'listen', JSON.stringify(data)];
  const rows: SnapshotRows = { metrics: [], events: [ev('A', 'a1', tv), ev('B', 'b1', tv), ev('G', 'g1', tv), ev('A', 'a2', { junk: 1 })] };
  const seen = (me: 'A' | 'B' | 'G') => rowsFor(me, rows).events.map((r) => [r[1], JSON.parse(r[4])]);
  it('owner whole, everyone else a summary: the partner, the guest, the members on the guest’s phone', () => {
    expect(seen('A')).toEqual([['A', tv], ['B', sum], ['G', sum], ['A', { junk: 1 }]]);
    expect(seen('B')).toEqual([['A', sum], ['B', tv], ['G', sum]]);
    expect(seen('G')).toEqual([['A', sum], ['B', sum], ['G', tv]]);
  });
  it('leaves rows without a listen row as they are', () => {
    const plain: SnapshotRows = { metrics: [], events: [['2026-11-05T03:00:00.000Z', 'A', 'p1', 'find', '{"kind":"fish","id":"tuna"}']] };
    expect(rowsFor('A', plain)).toBe(plain);
  });
});
