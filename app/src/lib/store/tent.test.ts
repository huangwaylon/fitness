// The tent's room on this phone (store/tent.svelte.ts): my changes merged, kept and sent (the relay and the sheet, with
// the room's scope); the partner's heard; the sheet's rows merged in; the island's decorations never mixed in.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import type { Intent, Relayed } from '#lib/contract/live-protocol.ts';
import type { Live, LiveStatus } from '#lib/sync/live.ts';
import { TENT_MAX, TENT_WALL, type TentEntry } from '#lib/contract/tent.ts';
import { tent } from './tent.svelte.ts';
import { decor } from './decor.svelte.ts';
import { world } from './world.svelte.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}
function fakeRelay() {
  const sent: Intent[] = [];
  const subs = new Set<(m: Relayed) => void>();
  const st: LiveStatus = { connected: true, me: 'A', peer: true, here: ['B'] };
  const live: Live = {
    start() {}, stop() {}, send: (i) => (sent.push(i), true), on: (fn) => (subs.add(fn), () => subs.delete(fn)),
    onChange: () => () => {}, onStatus: (fn) => (fn(st), () => {}), status: () => st, serverNow: () => Date.now()
  };
  return { live, sent, hear: (m: Record<string, unknown>) => subs.forEach((f) => f({ v: 2, kind: 'decor', ...m } as unknown as Relayed)) };
}

const T0 = Date.UTC(2026, 10, 1, 3);
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  configureStorage({ local: new Mem() });
  world.reset();
  tent.reset();
  decor.reset();
});
afterEach(() => vi.useRealTimers());

describe('the tent on this phone', () => {
  it('my change is merged, kept, and sent with the room’s scope; a removal is final', () => {
    const r = fakeRelay(), ops: unknown[] = [];
    tent.attach(r.live, 'A');
    tent.sink = (op) => ops.push(op);
    expect(tent.set({ id: 'd000001', item: 'f4041', x: 0, z: 0, f: 0 })).toBe(true);
    expect(tent.pieces).toEqual([expect.objectContaining({ id: 'd000001', item: 'f4041', who: 'A' })]);
    expect(r.sent).toEqual([expect.objectContaining({ kind: 'decor', sc: 't', id: 'd000001', x: 0 })]);
    expect(ops).toEqual([expect.objectContaining({ sc: 't' })]);
    vi.setSystemTime(T0 + 1000);
    tent.set({ id: 'd000001', item: 'f4041', x: 3, z: 2, f: 1 });
    expect(tent.pieces[0]).toMatchObject({ x: 3, z: 2, f: 1, p: T0 });
    expect(tent.remove('d000001')).toBe(true);
    expect(tent.pieces).toEqual([]);
    expect(tent.set({ id: 'd000001', item: 'f4041', x: 0, z: 0, f: 0 })).toBe(false);
  });

  it('the wallpaper and the floor: the latest wins, never a piece, never capped', () => {
    tent.attach(null, 'A');
    expect(tent.wall).toBeNull();
    expect(tent.surface('wall', 'w4795')).toBe(true);
    expect(tent.surface('wall', 'w4795')).toBe(false);
    tent.surface('floor', 'g5044');
    expect([tent.wall, tent.floor, tent.pieces.length]).toEqual(['w4795', 'g5044', 0]);
    for (let i = 0; i < TENT_MAX; i++) tent.set({ id: `dp${String(i).padStart(5, '0')}`, item: 'f4081', x: 0, z: 0, f: 0 });
    expect(tent.room).toBe(0);
    expect(tent.set({ id: 'dlate0001', item: 'f4081', x: 0, z: 0, f: 0 })).toBe(false);
    expect(tent.surface('wall', 'w4833')).toBe(true);
  });

  it('hears the partner’s ops (and tells of them), never the island’s; the island never takes the tent’s', () => {
    const r = fakeRelay(), heard: unknown[] = [];
    tent.attach(r.live, 'A');
    decor.attach(r.live, 'A');
    tent.on((n) => heard.push(n));
    r.hear({ sc: 't', id: 'd000007', at: T0, item: 'f1432', x: 7, z: 7, f: 0, p: T0, who: 'B', t: T0 });
    r.hear({ id: 'd000008', at: T0, item: 'tanuki', x: 120, z: 480, f: 0, p: T0, who: 'B', t: T0 });
    expect(tent.pieces.map((p) => p.id)).toEqual(['d000007']);
    expect(decor.items.map((p) => p.id)).toEqual(['d000008']);
    expect(heard).toEqual([expect.objectContaining({ live: true, was: null })]);
  });

  it('merges the sheet’s rows whatever their order', () => {
    tent.attach(null, 'B');
    const rows: TentEntry[] = [
      { sc: 't', id: 'd000001', at: T0 + 5, item: 'f4041', x: 2, z: 0, f: 0, p: T0, who: 'A' },
      { sc: 't', id: 'd000001', at: T0 + 2, item: 'f4041', x: 6, z: 0, f: 0, p: T0, who: 'B' },
      { sc: 't', id: TENT_WALL, at: T0, item: 'w4833', x: 0, z: 0, f: 0, p: T0, who: 'B' }
    ];
    tent.rows(rows);
    expect(tent.pieces[0].x).toBe(2);
    tent.reset();
    tent.attach(null, 'B');
    tent.rows([...rows].reverse());
    expect([tent.pieces[0].x, tent.wall]).toEqual([2, 'w4833']);
  });
});
