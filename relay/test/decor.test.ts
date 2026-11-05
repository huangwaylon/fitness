// The record's decor ops (src/store.ts decorTarget): the island's decorations, the rooms' pieces and the outdoors'
// layout, each id's latest op by the contract's rules, the caps counting what stands.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { LAYOUT_MAX } from '../../app/src/lib/contract/layout.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const T0 = Date.parse('2026-11-02T03:00:00.000Z');

let now: number;
let db: ReturnType<typeof memSql>;
let store: StoreCore;
const make = () => new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B }, now: () => now, notify: () => {} });

beforeEach(() => {
  now = T0;
  db = memSql();
  store = make();
});

let seq = 0;
const call = (body: object) => store.handle({ key: KEY_A, ...body }, 100) as Record<string, any>;
const decor = (data: object) => call({ action: 'event', id: `e${++seq}`, type: 'decor', data });
/** Many ops in batches of 50, the minute's rate limit kept. */
function many(datas: object[]): void {
  for (let i = 0; i < datas.length; i += 50) {
    now += 1000;
    const r = call({ action: 'events', events: datas.slice(i, i + 50).map((data) => ({ id: `e${++seq}`, type: 'decor', data })) });
    expect(r.results.every((x: { ok: boolean }) => x.ok)).toBe(true);
  }
}
const obj = (i: number | string, at: number) => ({ sc: 'o', id: `o${i}`, at, k: 'oak', x: 3, z: 3, f: 0 });

describe('the outdoors’ cap', () => {
  it('counts the pieces standing, not the removed ones’ rows: after LAYOUT_MAX removals a new piece still goes down', () => {
    // 2026-11-05 relay review O1 (reproduced): the tombstones counted, every placement after ~1,450 removals was full
    many(Array.from({ length: LAYOUT_MAX }, (_, i) => obj(i, T0 + i)));
    expect(decor(obj('x', T0 + 9e6))).toEqual({ ok: false, error: 'bad_request', detail: 'layout full' });
    many(Array.from({ length: LAYOUT_MAX }, (_, i) => ({ sc: 'o', id: `o${i}`, at: T0 + 5e6 + i, rm: true })));
    expect(decor(obj('x', T0 + 9e6))).toEqual({ ok: true });
    expect(decor(obj('y', T0 + 9e6))).toEqual({ ok: true });
    // a removal is never refused
    expect(decor({ sc: 'o', id: 'oz', at: T0 + 9e6, rm: true })).toEqual({ ok: true });
  }, 30_000);
});

describe('a decor op’s reads (O6)', () => {
  it('reads its own slots and the caps’ count, never every decor row; the count stays the rows’ through every kind of op', () => {
    // 2026-11-05 relay review O6: every decor op parsed every decor row
    many(Array.from({ length: 1000 }, (_, i) => obj(i, T0 + i)));
    many(Array.from({ length: 40 }, (_, i) => ({ sc: 't', id: `dpiece${String(i).padStart(3, '0')}`, at: T0 + i, item: 'f1', x: 0, z: 0, f: 0, p: T0 })));
    const before = db.reads();
    expect(decor(obj('new', T0 + 9e6))).toEqual({ ok: true });
    expect(db.reads() - before).toBeLessThan(20);
    // removals, a removed piece back, a room's pieces and a switch, the island's decorations, a move
    expect(decor({ sc: 'o', id: 'o1', at: T0 + 9e6, rm: true })).toEqual({ ok: true });
    expect(decor({ sc: 'o', id: 'o2', at: T0 + 9e6, rm: true })).toEqual({ ok: true });
    expect(decor(obj(2, T0 + 9e6 + 1))).toEqual({ ok: true });
    expect(decor(obj(3, T0 + 9e6 + 1))).toEqual({ ok: true }); // a move: no change
    expect(decor({ sc: 't', id: 'dpiece000', at: T0 + 9e6, rm: true })).toEqual({ ok: true });
    expect(decor({ sc: 't', id: 'dpiece001', at: T0 + 9e6, lt: 0 })).toEqual({ ok: true });
    expect(decor({ id: 'dlantern01', at: T0 + 9e6, item: 'stone-lantern', x: 10, z: 10, f: 0, p: T0 })).toEqual({ ok: true });
    expect(store.decorCheck()).toEqual({ ok: true, kept: { '': 1, t: 39, u: 0, v: 0, o: 1000 }, counted: { '': 1, t: 39, u: 0, v: 0, o: 1000 } });
    // a reset: everything before it void, the voided rows dropped (by their slots and `at`), counted again
    expect(decor({ sc: 'r', id: 'reset', at: T0 + 9e6 + 5 })).toEqual({ ok: true });
    expect(decor(obj('after', T0 + 9e6 + 6))).toEqual({ ok: true });
    expect(store.decorCheck()).toMatchObject({ counted: { '': 1, t: 39, o: 1 }, kept: { o: 1 } });
    expect(store.counts().events).toBeLessThan(60);
  }, 30_000);

  it('a load brings rows the counts never saw: within its batch they count, and afterwards they are counted again', () => {
    many(Array.from({ length: LAYOUT_MAX - 1 }, (_, i) => obj(i, T0 + i)));
    const at = (i: number) => new Date(T0 + 9e6 + i).toISOString();
    const r = store.load({ rows: { events: [
      [at(1), 'A', 'x1', 'decor', JSON.stringify(obj('l1', T0 + 9e6))],
      [at(2), 'A', 'x2', 'decor', JSON.stringify(obj('l2', T0 + 9e6))] // past the cap: only its id kept
    ] } });
    expect(r).toMatchObject({ ok: true, events: 1 });
    expect(decor(obj('x', T0 + 9e7))).toEqual({ ok: false, error: 'bad_request', detail: 'layout full' });
  }, 30_000);
});
