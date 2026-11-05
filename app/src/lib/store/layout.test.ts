// The island's layout on this phone (store/layout.svelte.ts): my ops merged, kept and sent; a second tab of the app
// sharing the same storage never has its ops written over.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, LIVE, type KV } from '#lib/sync/storage.ts';
import type { Intent, Relayed } from '#lib/contract/live-protocol.ts';
import type { Live, LiveStatus } from '#lib/sync/live.ts';
import type { LayoutEntry, LayoutOp } from '#lib/contract/layout.ts';
import { layout } from './layout.svelte.ts';
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
  return { live, sent, hear: (m: Record<string, unknown>) => subs.forEach((f) => f({ v: 3, kind: 'decor', ...m } as unknown as Relayed)) };
}

const T0 = Date.UTC(2026, 10, 1, 3);
let kv: Mem;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  kv = new Mem();
  configureStorage({ local: kv });
  world.reset();
  layout.reset();
});
afterEach(() => vi.useRealTimers());

/** A palm moved to (x, z) at `at`. */
const move = (id: string, x: number, z: number, at: number): LayoutOp => ({ sc: 'o', id, at, k: 'palm', x, z, f: 0 });
const stored = () => (JSON.parse(kv.getItem(LIVE.layout) ?? '[]') as LayoutEntry[]).map((e) => e.id).sort();

describe('the layout on this phone', () => {
  it('a second tab’s ops in storage are merged in before mine are written, never written over', () => {
    const r = fakeRelay();
    layout.attach(r.live, 'A');
    void layout.current;
    // the other tab (its socket replaced this one's: this one hears nothing of it) wrote its op
    kv.setItem(LIVE.layout, JSON.stringify([{ ...move('o-tab2', 10, 10, T0 + 1), who: 'A' }]));
    layout.apply([move('o-tab1', 20, 20, T0 + 2)]);
    expect(stored()).toEqual(['o-tab1', 'o-tab2']);
    expect(layout.obj('o-tab2')).toMatchObject({ x: 10, z: 10 });
  });
});
