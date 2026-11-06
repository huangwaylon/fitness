// contract/listen.ts: ききみみ クイズ's progress rows (docs/kikimimi.md "Storage") and who gets what of them
// (contract/guest.ts rowsFor, which the demo applies too).
import { describe, expect, it } from 'vitest';
import { listenOf, listenSeen, listenSummaryJson, listenSummaryOf } from './listen.ts';
import { rowsFor } from './guest.ts';
import type { EventRow, SnapshotRows } from './api.ts';

const row = { d: '2026-11-05', g: 'ab12', lv: 2, n: 2, ms: 180_000, r: [['w2-read', 1, 0, 0], ['n2-price-1', 0, 1, 3]] };

describe('listenOf', () => {
  it('reads a row and refuses any other shape', () => {
    expect(listenOf(row)).toEqual(row);
    expect(listenOf({ ...row, p: 1 })).toEqual({ ...row, p: 1 });
    for (const bad of [null, [], 'x', { ...row, extra: 1 }, { ...row, g: 'a' }, { ...row, lv: 0 }, { ...row, n: 0 }, { ...row, ms: -1 }, { ...row, ms: 1.5 },
      { ...row, p: true }, { ...row, r: 'x' }, { ...row, r: [['w2-read', 1, 0]] }, { ...row, r: [['w2-read', 1, -2, 0]] }, { ...row, d: '2026-11-31' }])
      expect(listenOf(bad), JSON.stringify(bad)).toBeNull();
  });
  it('a later game’s row (docs/kikimimi-framework.md §4.4): `gm` and `u` optional, `pick` −1…4095, `lv` and `ok` as they were', () => {
    const tile = { ...row, gm: 'tile', u: 'u03-kawa', r: [['w2-read', 0, 4095, 0], ['n2-price-1', 1, -1, 99]] };
    expect(listenOf(tile)).toEqual(tile);
    expect(listenOf({ ...row, gm: 'quiz' })).toEqual({ ...row, gm: 'quiz' });
    for (const lv of [5, 6, 7, 8]) expect(listenOf({ ...row, lv }), String(lv)).toEqual({ ...row, lv });
    expect(listenOf({ ...row, u: 'a' })).toEqual({ ...row, u: 'a' });
    expect(listenOf({ ...row, r: [['w2-read', 1, 4, 0]] })).toEqual({ ...row, r: [['w2-read', 1, 4, 0]] });
    for (const bad of [{ ...row, gm: 'q' }, { ...row, gm: 'abcdefghi' }, { ...row, gm: '1abc' }, { ...row, gm: 'Tile' }, { ...row, gm: 3 }, { ...row, gm: null },
      { ...row, u: '' }, { ...row, u: 'abcdefghijklm' }, { ...row, u: 'U1' }, { ...row, u: 1 },
      { ...row, r: [['w2-read', 1, 4096, 0]] }, { ...row, r: [['w2-read', 1, 1.5, 0]] }, { ...row, r: [['w2-read', 2, 0, 0]] }, { ...row, lv: 0 }, { ...row, lv: 9 }])
      expect(listenOf(bad), JSON.stringify(bad)).toBeNull();
    // the other member's summary carries neither
    expect(JSON.parse(listenSummaryJson(JSON.stringify(tile))!)).toEqual({ d: '2026-11-05', g: 'ab12', n: 2, ms: 180_000 });
  });
  it('summarises without the level, the answers or the practice flag', () => {
    expect(JSON.parse(listenSummaryJson(JSON.stringify({ ...row, p: 1 }))!)).toEqual({ d: '2026-11-05', g: 'ab12', n: 2, ms: 180_000 });
    expect(listenSummaryJson('{')).toBeNull();
    expect(listenSummaryOf({ d: '2026-11-05', g: 'ab12', n: 2, ms: 180_000 })).toEqual({ d: '2026-11-05', g: 'ab12', n: 2, ms: 180_000 });
    expect(listenSummaryOf({ d: 'x' })).toBeNull();
  });
  it('lets the owner see all, the other member a summary, and nothing cross the guest', () => {
    expect([listenSeen('A', 'A'), listenSeen('A', 'B'), listenSeen('B', 'A'), listenSeen('G', 'A'), listenSeen('A', 'G'), listenSeen('G', 'G')])
      .toEqual(['all', 'summary', 'summary', 'none', 'none', 'all']);
  });
});

describe('rowsFor and listen rows', () => {
  const ev = (who: 'A' | 'B' | 'G', id: string, data: object): EventRow => ['2026-11-05T03:00:00.000Z', who, id, 'listen', JSON.stringify(data)];
  const rows: SnapshotRows = { metrics: [], events: [ev('A', 'a1', row), ev('B', 'b1', row), ev('G', 'g1', row), ev('A', 'a2', { junk: 1 })] };
  const seen = (me: 'A' | 'B' | 'G') => rowsFor(me, rows).events.map((r) => [r[1], JSON.parse(r[4])]);
  const sum = { d: '2026-11-05', g: 'ab12', n: 2, ms: 180_000 };
  it('owner whole, partner summary, guest apart', () => {
    expect(seen('A')).toEqual([['A', row], ['B', sum], ['A', { junk: 1 }]]);
    expect(seen('B')).toEqual([['A', sum], ['B', row]]);
    expect(seen('G')).toEqual([['G', row]]);
  });
  it('leaves rows without a listen row as they are', () => {
    const plain: SnapshotRows = { metrics: [], events: [['2026-11-05T03:00:00.000Z', 'A', 'p1', 'find', '{"kind":"fish","id":"tuna"}']] };
    expect(rowsFor('A', plain)).toBe(plain);
  });
});
