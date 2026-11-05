// The island's layout on this phone (store/layout.svelte.ts): my ops merged, kept and sent; a second tab of the app
// sharing the same storage never has its ops written over.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, LIVE, type KV } from '#lib/sync/storage.ts';
import type { Intent, Relayed } from '#lib/contract/live-protocol.ts';
import type { Live, LiveStatus } from '#lib/sync/live.ts';
import type { LayoutEntry, LayoutOp } from '#lib/contract/layout.ts';
import { layout } from './layout.svelte.ts';
import { clashesWith } from '#lib/layout/resolve.ts';
import { validate } from '#lib/layout/validate.ts';
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

  /** Two palms of the default and a tile one of them may stand on, clear of everything. */
  function setup() {
    const r = fakeRelay();
    layout.attach(r.live, 'A');
    const [p1, p2] = layout.ofKind('palm');
    return { r, p1, p2, to: { x: p1.x + 1, z: p1.z } };
  }
  const tileOf = (id: string) => [layout.obj(id)!.x, layout.obj(id)!.z];

  it('E13: the partner’s piece lands on the tile mine moved to, theirs earlier: mine moves to the nearest clear tile, as an op', () => {
    const { r, p1, p2, to } = setup();
    expect(validate(layout.current).filter((i) => i.code === 'overlap')).toEqual([]);
    layout.apply([move(p1.id, to.x, to.z, T0 + 2000)]);
    r.sent.length = 0;
    r.hear({ sc: 'o', id: p2.id, at: T0 + 1000, k: 'palm', x: to.x, z: to.z, f: 0, who: 'B', t: T0 + 1000 });
    expect(clashesWith(layout.current, layout.obj(p2.id)!).map((o) => o.id)).toEqual([p1.id]);
    vi.advanceTimersByTime(1);
    // theirs stays; mine moved, sent as a normal op of mine
    expect(tileOf(p2.id)).toEqual([to.x, to.z]);
    expect(tileOf(p1.id)).not.toEqual([to.x, to.z]);
    expect(clashesWith(layout.current, layout.obj(p1.id)!)).toEqual([]);
    expect(r.sent).toEqual([expect.objectContaining({ kind: 'decor', sc: 'o', id: p1.id, x: tileOf(p1.id)[0], z: tileOf(p1.id)[1] })]);
    expect(validate(layout.current).filter((i) => i.level === 'error')).toEqual([]);
  });

  it('E13, the other phone: the partner’s op is the later one: mine stays, theirs is theirs to move', () => {
    const { r, p1, p2, to } = setup();
    layout.apply([move(p1.id, to.x, to.z, T0 + 1000)]);
    r.sent.length = 0;
    r.hear({ sc: 'o', id: p2.id, at: T0 + 2000, k: 'palm', x: to.x, z: to.z, f: 0, who: 'B', t: T0 + 2000 });
    vi.advanceTimersByTime(1);
    expect(tileOf(p1.id)).toEqual([to.x, to.z]);
    expect(r.sent).toEqual([]);
    // and its move, when it comes, ends it: nothing more from either side
    r.hear({ sc: 'o', id: p2.id, at: T0 + 3000, k: 'palm', x: to.x + 3, z: to.z, f: 0, who: 'B', t: T0 + 3000 });
    vi.advanceTimersByTime(1);
    expect(r.sent).toEqual([]);
  });

  it('the guest never moves the outdoors; my own two pieces on one tile are mine to sort out', () => {
    const { r, p1, p2, to } = setup();
    layout.attach(r.live, 'G');
    r.hear({ sc: 'o', id: p2.id, at: T0 + 1000, k: 'palm', x: to.x, z: to.z, f: 0, who: 'A', t: T0 + 1000 });
    vi.advanceTimersByTime(1);
    expect(r.sent).toEqual([]);
    layout.attach(r.live, 'A');
    layout.apply([move(p1.id, to.x, to.z, T0 + 2000)]);
    r.sent.length = 0;
    vi.advanceTimersByTime(1);
    expect(r.sent).toEqual([]);
  });
});
