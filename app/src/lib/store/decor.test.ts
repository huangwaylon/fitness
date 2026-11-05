// The island's decorations on this phone (store/decor.svelte.ts): my changes merged, kept and sent (the relay and the
// sheet); the partner's heard, live or replayed; the sheet's rows merged in; the layout the same whatever the order.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import type { Intent, Relayed } from '#lib/contract/live-protocol.ts';
import type { Live, LiveStatus } from '#lib/sync/live.ts';
import { DECOR_MAX, type DecorEntry } from '#lib/contract/decor.ts';
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
  let sub: ((m: Relayed) => void) | null = null;
  const st: LiveStatus = { connected: true, me: 'A', peer: true, here: ['B'] };
  const live: Live = {
    start() {}, stop() {}, send: (i) => (sent.push(i), true), on: (fn) => ((sub = fn), () => (sub = null)),
    onChange: () => () => {}, onStatus: (fn) => (fn(st), () => {}), status: () => st, serverNow: () => Date.now()
  };
  return { live, sent, hear: (m: Record<string, unknown>) => sub?.({ v: 2, kind: 'decor', ...m } as unknown as Relayed) };
}

const T0 = Date.UTC(2026, 10, 1, 3);
let kv: Mem;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  kv = new Mem();
  configureStorage({ local: kv });
  world.reset();
  decor.reset();
});
afterEach(() => vi.useRealTimers());

const set = (id: string, at: number, who: 'A' | 'B', x = 120): DecorEntry => ({ id, at, who, item: 'tanuki', x, z: 480, f: 0, p: T0 - 9000 });

describe('the decorations on this phone', () => {
  it('my change is merged, kept, and sent to the relay and the sheet', () => {
    const r = fakeRelay(), ops: unknown[] = [];
    decor.attach(r.live, 'A');
    decor.sink = (op) => ops.push(op);
    expect(decor.set({ id: 'd000001', item: 'birdbath', x: 120, z: 480, f: 2 })).toBe(true);
    expect(decor.items).toEqual([expect.objectContaining({ id: 'd000001', item: 'birdbath', f: 2, who: 'A' })]);
    expect(r.sent).toEqual([expect.objectContaining({ kind: 'decor', id: 'd000001', x: 120 })]);
    expect(ops).toHaveLength(1);
    // moved: the same item, placed when it was; removed: gone
    vi.setSystemTime(T0 + 1000);
    decor.set({ id: 'd000001', item: 'birdbath', x: 144, z: 480, f: 2 });
    expect(decor.items[0]).toMatchObject({ x: 144, p: T0 });
    expect(decor.remove('d000001')).toBe(true);
    expect(decor.items).toEqual([]);
    // a removal is final
    expect(decor.set({ id: 'd000001', item: 'birdbath', x: 0, z: 480, f: 2 })).toBe(false);
  });

  it('hears the partner\'s (live: news; their echo of mine: nothing to play), whatever the order', () => {
    const r = fakeRelay(), news: boolean[] = [];
    decor.attach(r.live, 'A');
    decor.on((n) => news.push(n.live));
    r.hear({ ...set('d000002', T0 - 500, 'B'), t: T0 - 400 });
    expect(decor.items.map((p) => p.id)).toEqual(['d000002']);
    expect(news).toEqual([true]);
    // an older op of the same item, heard late (the day's replay): changes nothing
    r.hear({ ...set('d000002', T0 - 900, 'B', 300), t: T0 - 800 });
    expect(decor.items[0].x).toBe(120);
    expect(news).toHaveLength(1);
    // the sheet's rows: the same item later moved, merged in
    decor.rows([set('d000002', T0 - 100, 'B', 168), set('d000003', T0 - 50, 'A', 300)]);
    expect(decor.items.map((p) => [p.id, p.x])).toEqual([['d000002', 168], ['d000003', 300]]);
  });

  it('my move of what I saw always beats it, even with my clock behind its writer\'s', () => {
    const r = fakeRelay();
    decor.attach(r.live, 'A');
    r.hear({ ...set('d000004', T0 + 60_000, 'B'), t: T0 });
    decor.set({ id: 'd000004', item: 'tanuki', x: 264, z: 480, f: 0 });
    expect(decor.items[0]).toMatchObject({ x: 264, who: 'A' });
    expect((r.sent[0] as { at: number }).at).toBe(T0 + 60_001);
  });

  it('a reload shows the layout it kept; a new item past the cap is refused', () => {
    decor.attach(null, 'A');
    for (let k = 0; k < DECOR_MAX; k++) expect(decor.set({ id: `d${String(k).padStart(6, '0')}`, item: 'tanuki', x: k * 12, z: 480, f: 0 })).toBe(true);
    expect(decor.set({ id: 'd999999', item: 'tanuki', x: 0, z: 0, f: 0 })).toBe(false);
    expect(decor.room).toBe(0);
    decor.reset();
    decor.attach(null, 'A');
    expect(decor.items).toHaveLength(DECOR_MAX);
  });
});
