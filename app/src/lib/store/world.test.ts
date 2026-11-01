// The shared island's store (store/world.svelte.ts): my changes folded, kept and sent; the partner's heard and played;
// the sheet's day rows folded in; a reload needs nothing but what's new.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import type { Intent, Relayed } from '#lib/sync/live-protocol.ts';
import type { Live, LiveStatus } from '#lib/sync/live.ts';
import { caught, lying, takenIds } from '#lib/sync/world-day.ts';
import { world } from './world.svelte.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

/** A relay that records what's sent and lets the test deliver the partner's. */
function fakeRelay() {
  const sent: Intent[] = [];
  let sub: ((m: Relayed) => void) | null = null;
  const st: LiveStatus = { connected: true, me: 'A', peer: true };
  const live: Live = {
    start() {}, stop() {}, send: (i) => (sent.push(i), true), on: (fn) => ((sub = fn), () => (sub = null)),
    onChange: () => () => {}, onStatus: (fn) => (fn(st), () => {}), status: () => st, serverNow: () => Date.now()
  };
  return { live, sent, hear: (m: Intent & { who: 'A' | 'B'; t: number }) => sub?.({ v: 2, ...m } as Relayed) };
}

const T0 = Date.UTC(2026, 10, 1, 3); // 2026-11-01 12:00 Tokyo
let kv: Mem;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  kv = new Mem();
  configureStorage({ local: kv });
  world.reset();
});
afterEach(() => vi.useRealTimers());

describe('the shared island on this phone', () => {
  it('folds, keeps and sends my change; a claim the partner has already is refused and sends nothing', () => {
    const r = fakeRelay();
    world.attach(r.live, 'A');
    const rows: unknown[] = [];
    world.sink = (date, row) => rows.push({ date, ...row });
    expect(world.share({ kind: 'pick', id: 's1000', what: 'shell:conch', at: [150, 40] }).fresh).toBe(true);
    expect(r.sent).toEqual([{ kind: 'pick', id: 's1000', what: 'shell:conch', at: [150, 40] }]);
    expect(rows).toEqual([expect.objectContaining({ date: '2026-11-01', taken: ['s1000'] })]);
    r.hear({ kind: 'catch', what: 'koi', id: 'fresh:99', how: 'rod', who: 'B', t: T0 - 1000 });
    expect(world.share({ kind: 'catch', what: 'koi', id: 'fresh:99', how: 'net' }).fresh).toBe(false);
    expect(r.sent).toHaveLength(1);
    expect(caught(world.day, 'fresh:99')?.who).toBe('B');
  });

  it('hears the partner: played when it just happened, only folded when it\'s the day\'s replay; a repeat is nothing', () => {
    const r = fakeRelay();
    world.attach(r.live, 'A');
    const news: { kind: string; live: boolean }[] = [];
    world.on(({ e, live }) => news.push({ kind: e.kind, live }));
    r.hear({ kind: 'put', id: 'pb1', what: 'present', at: [200, 300], who: 'B', t: T0 - 2 * 3600_000 }); // this morning
    r.hear({ kind: 'shake', tree: 'oak-p1', drop: 'branch', who: 'B', t: T0 - 500 }); // just now
    r.hear({ kind: 'shake', tree: 'oak-p1', drop: 'branch', who: 'B', t: T0 - 500 }); // the same again
    r.hear({ kind: 'act', act: 'bush', id: 'hedge-1', pt: [80, 596], who: 'B', t: T0 - 100 });
    r.hear({ kind: 'pick', id: 'w1', what: 'weed', who: 'A', t: T0 - 100 }); // my own echo: never
    expect(news).toEqual([{ kind: 'put', live: false }, { kind: 'shake', live: true }, { kind: 'act', live: true }]);
    expect(lying(world.day).map((p) => p.id)).toEqual(['pb1']);
  });

  it('a reload keeps the day (mine and theirs) without the relay; a new Tokyo day starts empty', () => {
    const r = fakeRelay();
    world.attach(r.live, 'A');
    world.share({ kind: 'pick', id: 'w1', what: 'weed' });
    r.hear({ kind: 'pick', id: 'w2', what: 'weed', who: 'B', t: T0 - 10 });
    world.reset();
    world.attach(null, 'A');
    expect(takenIds(world.day)).toEqual(new Set(['w1', 'w2']));
    vi.setSystemTime(Date.UTC(2026, 10, 1, 15)); // 2026-11-02 00:00 Tokyo
    expect(takenIds(world.day)).toEqual(new Set());
  });

  it('the sheet\'s rows fill in what the relay didn\'t bring: today\'s picks and shakes, yesterday\'s watering, the wishes', () => {
    world.attach(null, 'A');
    const base = { puts: [], shakes: [], watered: [], wishes: {} };
    world.rows([
      { at: T0 - 3600_000, person: 'B', data: { ...base, date: '2026-11-01', taken: ['s9', 'w4'], shakes: [['oak-k1', 'nest', T0 - 3600_000]] } },
      { at: T0 - 20 * 3600_000, person: 'B', data: { ...base, date: '2026-10-31', taken: [], watered: ['B.0-1'], wishes: { '2026-11-01': 2 } } },
      { at: T0 - 21 * 3600_000, person: 'A', data: { ...base, date: '2026-10-31', taken: [], watered: ['A.1-0'] } },
      { at: T0, person: 'B', data: { ...base, date: '2026-10-29', taken: ['old'] } } // another day: nothing
    ]);
    expect(takenIds(world.day)).toEqual(new Set(['s9', 'w4']));
    expect(world.day.shakes.map((s) => [s.tree, s.drop, s.who])).toEqual([['oak-k1', 'nest', 'B']]);
    expect(world.wateredYesterday().sort()).toEqual(['A.1-0', 'B.0-1']);
    expect(world.wishesOf('B', '2026-11-01')).toBe(2);
    const rev = world.rev;
    world.rows([{ at: T0 - 3600_000, person: 'B', data: { ...base, date: '2026-11-01', taken: ['s9', 'w4'] } }]);
    expect(world.rev).toBe(rev); // nothing new: no re-derive
  });

  it('the demo\'s two players keep a day each', () => {
    world.attach(null, 'A', true);
    world.share({ kind: 'pick', id: 'w1', what: 'weed' });
    world.attach(null, 'B', true);
    world.share({ kind: 'pick', id: 'w2', what: 'weed' });
    expect([...kv.m.keys()].filter((k) => k.startsWith('island-demo.world')).sort()).toEqual(['island-demo.world.A', 'island-demo.world.B']);
  });
});
