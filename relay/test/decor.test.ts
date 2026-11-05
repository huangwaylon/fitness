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
  });
});
