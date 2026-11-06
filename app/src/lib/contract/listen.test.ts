// contract/listen.ts: ききみみ クイズ's progress rows (docs/kikimimi.md "Storage") and who gets what of them
// (contract/guest.ts rowsFor, which the demo applies too).
import { describe, expect, it } from 'vitest';
import { CHECK_LESSON, STAMP_MIN, STORY_GM, listenOf, listenSeen, listenSummaryJson, listenSummaryOf, stampsUnit, type ListenRow } from './listen.ts';
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
  it('a bedtime story (STORY_GM): no answers, only its minutes; any other game needs one', () => {
    const story = { d: '2026-11-05', g: 'st12ab', gm: STORY_GM, u: 'st-johnny', lv: 4, n: 1, ms: 600_000, r: [] };
    expect(listenOf(story)).toEqual(story);
    expect(listenOf({ ...story, gm: undefined })).toBeNull();
    expect(listenOf({ ...story, gm: 'tile' })).toBeNull();
    expect(JSON.parse(listenSummaryJson(JSON.stringify(story))!)).toEqual({ d: '2026-11-05', g: 'st12ab', n: 1, ms: 600_000 });
  });
  it('a unit’s lesson (docs/curriculum-units.md §10): `l` 1-5 with `u`, `tm` 0-6 with `l`', () => {
    const lesson = { ...row, gm: 'unit', u: 'tr-hotel', l: 3, tm: 5 };
    expect(listenOf(lesson)).toEqual(lesson);
    for (const l of [1, 5]) expect(listenOf({ ...row, u: 'tr-hotel', l }), String(l)).toEqual({ ...row, u: 'tr-hotel', l });
    for (const tm of [0, 6]) expect(listenOf({ ...row, u: 'tr-hotel', l: 3, tm }), String(tm)).toEqual({ ...row, u: 'tr-hotel', l: 3, tm });
    for (const bad of [{ ...row, l: 1 }, { ...row, u: 'tr-hotel', l: 0 }, { ...row, u: 'tr-hotel', l: 6 }, { ...row, u: 'tr-hotel', l: 1.5 }, { ...row, u: 'tr-hotel', l: '3' },
      { ...row, u: 'tr-hotel', tm: 5 }, { ...row, u: 'tr-hotel', l: 3, tm: -1 }, { ...row, u: 'tr-hotel', l: 3, tm: 7 }, { ...row, u: 'tr-hotel', l: 3, tm: 2.5 }, { ...row, u: 'tr-hotel', l: 3, tm: null }])
      expect(listenOf(bad), JSON.stringify(bad)).toBeNull();
  });
  const six = (rights: number, rp = 0): ListenRow['r'] => Array.from({ length: 6 }, (_, i) => [`it-${i}`, i < rights ? 1 : 0, 0, i < rights ? rp : 0]);
  it('a stamp (§3, §10): a チェック with ≥ 5 of 6 right on the first listen, or a team’s ≥ 5; never another lesson, a replay’s right or no unit', () => {
    expect([CHECK_LESSON, STAMP_MIN]).toEqual([3, 5]);
    const check: Parameters<typeof stampsUnit>[0] = { u: 'tr-hotel', l: 3, r: six(5) };
    expect(stampsUnit(check)).toBe(true);
    expect(stampsUnit({ ...check, r: six(6) })).toBe(true);
    expect(stampsUnit({ ...check, r: six(4) })).toBe(false);
    expect(stampsUnit({ ...check, r: six(6, 1) })).toBe(false); // right only after a replay
    expect(stampsUnit({ ...check, r: six(3), tm: 5 })).toBe(true); // a pair's pass carries the weaker player
    expect(stampsUnit({ ...check, r: six(3), tm: 4 })).toBe(false);
    expect(stampsUnit({ ...check, l: 2 })).toBe(false);
    expect(stampsUnit({ ...check, l: undefined })).toBe(false);
    expect(stampsUnit({ ...check, u: undefined })).toBe(false);
  });
  it('the summary: a stamped unit and `stamped`, never its answers, the team’s count or a lesson not passed', () => {
    const pass = { ...row, gm: 'unit', u: 'tr-hotel', l: 3, r: six(5) };
    const sum = { d: '2026-11-05', g: 'ab12', n: 2, ms: 180_000 };
    expect(JSON.parse(listenSummaryJson(JSON.stringify(pass))!)).toEqual({ ...sum, u: 'tr-hotel', stamped: 1 });
    expect(JSON.parse(listenSummaryJson(JSON.stringify({ ...pass, r: six(2), tm: 6 }))!)).toEqual({ ...sum, u: 'tr-hotel', stamped: 1 });
    expect(JSON.parse(listenSummaryJson(JSON.stringify({ ...pass, r: six(4) }))!)).toEqual(sum);
    expect(JSON.parse(listenSummaryJson(JSON.stringify({ ...pass, l: 1 }))!)).toEqual(sum);
    expect(listenSummaryOf({ ...sum, u: 'tr-hotel', stamped: 1 })).toEqual({ ...sum, u: 'tr-hotel', stamped: 1 });
    for (const odd of [{ ...sum, stamped: 1 }, { ...sum, u: 'tr-hotel' }, { ...sum, u: 'TR', stamped: 1 }, { ...sum, u: 'tr-hotel', stamped: true }])
      expect(listenSummaryOf(odd), JSON.stringify(odd)).toEqual(sum);
  });
  it('summarises without the level, the answers or the practice flag', () => {
    expect(JSON.parse(listenSummaryJson(JSON.stringify({ ...row, p: 1 }))!)).toEqual({ d: '2026-11-05', g: 'ab12', n: 2, ms: 180_000 });
    expect(listenSummaryJson('{')).toBeNull();
    expect(listenSummaryOf({ d: '2026-11-05', g: 'ab12', n: 2, ms: 180_000 })).toEqual({ d: '2026-11-05', g: 'ab12', n: 2, ms: 180_000 });
    expect(listenSummaryOf({ d: 'x' })).toBeNull();
  });
  it('lets the owner see all and anyone else a summary, the guest and the members alike', () => {
    expect([listenSeen('A', 'A'), listenSeen('A', 'B'), listenSeen('B', 'A'), listenSeen('G', 'A'), listenSeen('A', 'G'), listenSeen('G', 'G')])
      .toEqual(['all', 'summary', 'summary', 'summary', 'summary', 'all']);
  });
});

describe('rowsFor and listen rows', () => {
  const ev = (who: 'A' | 'B' | 'G', id: string, data: object): EventRow => ['2026-11-05T03:00:00.000Z', who, id, 'listen', JSON.stringify(data)];
  const rows: SnapshotRows = { metrics: [], events: [ev('A', 'a1', row), ev('B', 'b1', row), ev('G', 'g1', row), ev('A', 'a2', { junk: 1 })] };
  const seen = (me: 'A' | 'B' | 'G') => rowsFor(me, rows).events.map((r) => [r[1], JSON.parse(r[4])]);
  const sum = { d: '2026-11-05', g: 'ab12', n: 2, ms: 180_000 };
  it('owner whole, everyone else a summary: the partner, the guest, the members on the guest’s phone', () => {
    expect(seen('A')).toEqual([['A', row], ['B', sum], ['G', sum], ['A', { junk: 1 }]]);
    expect(seen('B')).toEqual([['A', sum], ['B', row], ['G', sum]]);
    expect(seen('G')).toEqual([['A', sum], ['B', sum], ['G', row]]);
  });
  it('a stamped チェック reaches everyone else as its unit and `stamped`, the guest’s too', () => {
    const pass = { ...row, gm: 'unit', u: 'tr-hotel', l: 3, tm: 5 };
    const both: SnapshotRows = { metrics: [], events: [ev('A', 'a1', pass), ev('G', 'g1', pass)] };
    const stamp = { ...sum, u: 'tr-hotel', stamped: 1 };
    expect(rowsFor('B', both).events.map((r) => JSON.parse(r[4]))).toEqual([stamp, stamp]);
    expect(rowsFor('A', both).events.map((r) => JSON.parse(r[4]))).toEqual([pass, stamp]);
    expect(rowsFor('G', both).events.map((r) => JSON.parse(r[4]))).toEqual([stamp, pass]);
  });
  it('leaves rows without a listen row as they are', () => {
    const plain: SnapshotRows = { metrics: [], events: [['2026-11-05T03:00:00.000Z', 'A', 'p1', 'find', '{"kind":"fish","id":"tuna"}']] };
    expect(rowsFor('A', plain)).toBe(plain);
  });
});
