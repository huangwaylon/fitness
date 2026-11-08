// What the synced stores share (store/synced.svelte.ts), through the three of them: the demo's own record, who may
// write, another tab's write folded in as it lands, a subscriber's throw, and a relay let go of.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, DEMO, LIVE, type KV } from '#lib/sync/storage.ts';
import type { Relayed } from '#lib/contract/live-protocol.ts';
import type { Live, LiveStatus } from '#lib/sync/live.ts';
import type { TentEntry } from '#lib/contract/tent.ts';
import type { LayoutEntry } from '#lib/contract/layout.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}
function fakeRelay() {
  const subs = new Set<(m: Relayed) => void>();
  const st: LiveStatus = { connected: true, me: 'A', peer: true, here: ['B'] };
  const live: Live = {
    start() {}, stop() {}, send: () => true, on: (fn) => (subs.add(fn), () => subs.delete(fn)),
    onChange: () => () => {}, onStatus: (fn) => (fn(st), () => {}), status: () => st, serverNow: () => Date.now()
  };
  return { live, subs, hear: (m: Record<string, unknown>) => subs.forEach((f) => f({ v: 3, kind: 'decor', ...m } as unknown as Relayed)) };
}

// (a window to hear another tab's `storage` events on, there before the stores first attach: they listen once)
const win = new EventTarget();
vi.stubGlobal('window', win);
const { decor } = await import('./decor.svelte.ts');
const { tent } = await import('./tent.svelte.ts');
const { layout } = await import('./layout.svelte.ts');
const { world } = await import('./world.svelte.ts');

const T0 = Date.UTC(2026, 10, 1, 3);
let kv: Mem;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  kv = new Mem();
  configureStorage({ local: kv });
  world.reset();
  for (const s of [decor, tent, layout]) (s.reset(), s.attach(null, null));
});
afterEach(() => vi.useRealTimers());

const piece = (id: string, who: string, at = T0): Record<string, unknown> => ({ sc: 't', id, at, item: 'f4041', x: 0, z: 0, f: 0, p: at, who });
const storageEvent = (key: string, value: unknown) => win.dispatchEvent(Object.assign(new Event('storage'), { key, newValue: JSON.stringify(value) }));

describe('the synced stores', () => {
  it('the demo keeps its own record: switching clears the map, and back the live one is read again', () => {
    tent.attach(null, 'A');
    tent.set({ id: 'd000001', item: 'f4041', x: 0, z: 0, f: 0 });
    expect(JSON.parse(kv.getItem(LIVE.tent)!)).toHaveLength(1);
    tent.attach(null, 'A', true);
    expect(tent.pieces).toEqual([]);
    tent.set({ id: 'd000002', item: 'f4041', x: 1, z: 1, f: 0 });
    expect((JSON.parse(kv.getItem(DEMO.tent)!) as TentEntry[]).map((e) => e.id)).toEqual(['d000002']);
    tent.attach(null, 'A');
    expect(tent.pieces.map((p) => p.id)).toEqual(['d000001']);
  });

  it('who may write: the guest’s tent rows are kept, its island decorations never', () => {
    tent.rows([piece('d000003', 'G') as TentEntry]);
    expect(tent.pieces.map((p) => p.who)).toEqual(['G']);
    decor.rows([{ id: 'd000004', at: T0, item: 'tanuki', x: 120, z: 480, f: 0, p: T0, who: 'G' } as never]);
    expect(decor.items).toEqual([]);
  });

  it('another tab’s write is folded in as it lands (the tent’s and the layout’s), a stranger’s key ignored', async () => {
    tent.attach(null, 'A');
    layout.attach(null, 'A');
    void tent.pieces, layout.current; // (read: loaded)
    const rev = tent.rev;
    storageEvent(LIVE.tent, [piece('d000005', 'B')]);
    expect(tent.pieces.map((p) => p.id)).toEqual(['d000005']);
    expect(tent.rev).toBeGreaterThan(rev);
    storageEvent('other.key', [piece('d000006', 'B')]);
    expect(tent.pieces.map((p) => p.id)).toEqual(['d000005']);
    const told: string[] = [];
    layout.on((n) => told.push(n.who));
    const op = { sc: 'o', id: 'palm-1', at: T0 + 5, k: 'palm', x: 40, z: 40, f: 0, who: 'B' } as LayoutEntry;
    storageEvent(LIVE.layout, [op]);
    expect(layout.entries.map((e) => e.id)).toContain('palm-1');
    expect(told).toEqual(['B']);
  });

  it('a subscriber’s throw never stops the next; a relay let go of is heard no more', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = fakeRelay(), heard: string[] = [];
    decor.attach(r.live, 'A');
    decor.on(() => {
      throw new Error('boom');
    });
    decor.on((n) => heard.push(n.e.id));
    r.hear({ id: 'd000007', at: T0, item: 'tanuki', x: 120, z: 480, f: 0, p: T0, who: 'B', t: T0 });
    expect(heard).toEqual(['d000007']);
    expect(err).toHaveBeenCalledWith('decor:', expect.any(Error));
    decor.attach(null, 'A');
    expect(r.subs.size).toBe(0);
    err.mockRestore();
  });
});
