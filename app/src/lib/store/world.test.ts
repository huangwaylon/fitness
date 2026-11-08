// The shared island's store (store/world.svelte.ts): my changes folded, kept and sent; the partner's heard and played;
// the sheet's day rows folded in; a reload needs nothing but what's new.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import type { Intent, Relayed } from '#lib/contract/live-protocol.ts';
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
  const st: LiveStatus = { connected: true, me: 'A', peer: true, here: ['B'] };
  const live: Live = {
    start() {}, stop() {}, send: (i) => (sent.push(i), true), on: (fn) => ((sub = fn), () => (sub = null)),
    onChange: () => () => {}, onStatus: (fn) => (fn(st), () => {}), status: () => st, serverNow: () => Date.now()
  };
  return { live, sent, hear: (m: Intent & { who: 'A' | 'B'; t: number }) => sub?.({ v: 3, ...m } as Relayed) };
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
    world.rows([]); // the record's rows in (my row waits for them)
    expect(world.share({ kind: 'pick', id: 's1000', what: 'shell:conch', at: [150, 40] }).fresh).toBe(true);
    expect(r.sent).toEqual([{ kind: 'pick', id: 's1000', what: 'shell:conch', at: [150, 40] }]);
    expect(rows).toEqual([expect.objectContaining({ date: '2026-11-01', taken: ['s1000'] })]);
    r.hear({ kind: 'catch', what: 'koi', id: 'fresh:99', how: 'rod', who: 'B', t: T0 - 1000 });
    expect(world.share({ kind: 'catch', what: 'koi', id: 'fresh:99', how: 'net' }).fresh).toBe(false);
    expect(r.sent).toHaveLength(1);
    expect(caught(world.day, 'fresh:99')?.who).toBe('B');
  });

  it('a catch goes on my day row too; the partner’s row has a critter caught: my try at it is refused, nothing sent', () => {
    const r = fakeRelay();
    world.attach(r.live, 'A');
    const rows: { taken: string[] }[] = [];
    world.sink = (_date, row) => rows.push(row);
    world.rows([]);
    expect(world.share({ kind: 'catch', what: 'koi', id: 'fresh:7', how: 'net' }).fresh).toBe(true);
    expect(rows.at(-1)?.taken).toEqual(['catch:fresh:7']);
    // B caught fresh:8 offline; its row reached the record, its intent not yet the relay
    world.rows([{ at: T0 - 5000, person: 'B', data: { date: '2026-11-01', taken: ['catch:fresh:8', 'w9'], puts: [], shakes: [], watered: [], wishes: {} } }]);
    expect(caught(world.day, 'fresh:8')?.who).toBe('B');
    const n = r.sent.length;
    expect(world.share({ kind: 'catch', what: 'koi', id: 'fresh:8', how: 'net' }).fresh).toBe(false);
    expect(world.share({ kind: 'pick', id: 'w9', what: 'weed' }).fresh).toBe(false);
    expect(r.sent).toHaveLength(n);
    // the relay's own word on it (B's catch, at last) is still B's
    r.hear({ kind: 'catch', what: 'koi', id: 'fresh:8', how: 'net', who: 'B', t: T0 - 6000 });
    expect(caught(world.day, 'fresh:8')).toMatchObject({ who: 'B', what: 'koi' });
  });

  it('my day row waits for the record’s rows of this session; then it holds what they had (health A8)', () => {
    // the record replaces a day's row whole: one rebuilt before the record's was read (a phone's second key, an
    // earlier session's catches) would erase the claims it held
    const r = fakeRelay();
    world.attach(r.live, 'A');
    const rows: { date: string; taken: string[] }[] = [];
    world.sink = (date, row) => rows.push({ date, ...row });
    const mine = [{ at: T0 - 9000, person: 'A' as const, data: { date: '2026-11-01', taken: ['catch:old:1', 'w1'], puts: [], shakes: [], watered: [], wishes: {} } }];
    world.rows(mine, false); // the cache, not yet this session's fetch
    expect(world.share({ kind: 'pick', id: 'w2', what: 'weed' }).fresh).toBe(true);
    expect(r.sent).toHaveLength(1); // the relay hears it at once
    expect(rows).toEqual([]);
    world.rows(mine, true);
    expect(rows).toEqual([expect.objectContaining({ date: '2026-11-01', taken: expect.arrayContaining(['catch:old:1', 'w1', 'w2']) })]);
    world.share({ kind: 'pick', id: 'w3', what: 'weed' });
    expect(rows).toHaveLength(2);
  });

  it('the Tokyo day of the sheet’s rows and the wishes is the relay’s, not a device clock running a day ahead', () => {
    const r = fakeRelay();
    // the device's clock a day fast: the relay's (its offset from the pings) a day behind it
    r.live.serverNow = () => Date.now() - 86_400_000;
    vi.setSystemTime(T0 + 86_400_000);
    world.attach(r.live, 'A');
    const rows: { date: string }[] = [];
    world.sink = (date) => rows.push({ date });
    world.rows([{ at: T0 - 5000, person: 'B', data: { date: '2026-11-01', taken: ['w7'], puts: [], shakes: [], watered: [], wishes: {} } }]);
    expect(takenIds(world.day).has('w7')).toBe(true);
    world.share({ kind: 'pick', id: 'w8', what: 'weed' });
    expect(rows.at(-1)?.date).toBe('2026-11-01');
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
    r.hear({ kind: 'pick', id: 'w1', what: 'weed', who: 'A', t: T0 - 100 }); // my own (the relay's replay): no news
    expect(news).toEqual([{ kind: 'put', live: false }, { kind: 'shake', live: true }, { kind: 'act', live: true }]);
    expect(lying(world.day).map((p) => p.id)).toEqual(['pb1']);
  });

  it('my own changes in the relay\'s replay are folded quietly (a phone that lost its record); a burst is written once; a walk replaces my last', async () => {
    const r = fakeRelay();
    world.attach(r.live, 'A');
    const writes = vi.spyOn(kv, 'setItem');
    r.hear({ kind: 'pick', id: 'w7', what: 'weed', who: 'A', t: T0 - 50 });
    r.hear({ kind: 'pick', id: 'w8', what: 'weed', who: 'B', t: T0 - 40 });
    world.share({ kind: 'walk', to: [100, 300] });
    world.share({ kind: 'walk', to: [120, 300] });
    expect(takenIds(world.day)).toEqual(new Set(['w7', 'w8']));
    expect(world.day.walks.A?.to).toEqual([120, 300]);
    expect(writes.mock.calls.filter(([k]) => k === 'island.world')).toHaveLength(0);
    await Promise.resolve();
    const w = writes.mock.calls.filter(([k]) => k === 'island.world');
    expect(w).toHaveLength(1);
    expect((JSON.parse(w[0][1]) as { events: { kind: string }[] }).events.map((e) => e.kind)).toEqual(['pick', 'pick', 'walk']);
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
      { at: T0 - 20 * 3600_000, person: 'B', data: { ...base, date: '2026-10-31', taken: [], watered: ['fl:62:530'], wishes: { '2026-11-01': 2 } } },
      { at: T0 - 21 * 3600_000, person: 'A', data: { ...base, date: '2026-10-31', taken: [], watered: ['fl:10:724'] } },
      { at: T0, person: 'B', data: { ...base, date: '2026-10-29', taken: ['old'] } } // another day: nothing
    ]);
    expect(takenIds(world.day)).toEqual(new Set(['s9', 'w4']));
    expect(world.day.shakes.map((s) => [s.tree, s.drop, s.who])).toEqual([['oak-k1', 'nest', 'B']]);
    expect(world.wateredYesterday().sort()).toEqual(['fl:10:724', 'fl:62:530']);
    expect(world.wishesOf('B', '2026-11-01')).toBe(2);
    const rev = world.rev;
    world.rows([{ at: T0 - 3600_000, person: 'B', data: { ...base, date: '2026-11-01', taken: ['s9', 'w4'] } }]);
    expect(world.rev).toBe(rev); // nothing new: no re-derive
  });

  it('the demo\'s two players keep a day each (written once per burst, after it)', async () => {
    world.attach(null, 'A', true);
    world.share({ kind: 'pick', id: 'w1', what: 'weed' });
    world.attach(null, 'B', true);
    world.share({ kind: 'pick', id: 'w2', what: 'weed' });
    await Promise.resolve();
    expect([...kv.m.keys()].filter((k) => k.startsWith('island-demo.world')).sort()).toEqual(['island-demo.world.A', 'island-demo.world.B']);
  });
});

describe('a claim the room refused (its winner never heard here)', () => {
  it('is a race lost: the catch is taken back, the claim the partner’s, kept across a reload; one settled already is left', async () => {
    const r = fakeRelay();
    let refuse: ((i: Intent) => void) | null = null;
    const live: Live = { ...r.live, onAck: (fn) => ((refuse = (i) => fn(i, false, 0)), () => (refuse = null)) };
    world.attach(live, 'A');
    const lost: unknown[] = [];
    world.lost = (claim, who, isLive, kind) => void lost.push([claim, who, isLive, kind]);
    expect(world.share({ kind: 'catch', what: 'koi', id: 'fresh:3', how: 'net' }).fresh).toBe(true);
    refuse!({ v: 3, c: 17, kind: 'catch', what: 'koi', id: 'fresh:3', how: 'net' } as Intent);
    expect(lost).toEqual([['catch:fresh:3', 'B', false, 'catch']]);
    expect(caught(world.day, 'fresh:3')?.who).toBe('B');
    // a race heard as it happened (the beat) and then refused: told once
    expect(world.share({ kind: 'pick', id: 's4', what: 'shell:conch' }).fresh).toBe(true);
    r.hear({ kind: 'pick', id: 's4', what: 'shell:conch', who: 'B', t: T0 - 10 });
    refuse!({ v: 3, c: 18, kind: 'pick', id: 's4', what: 'shell:conch' } as Intent);
    expect(lost).toHaveLength(2);
    // reloaded: still theirs
    await Promise.resolve();
    world.reset();
    world.attach(fakeRelay().live, 'A');
    expect(caught(world.day, 'fresh:3')?.who).toBe('B');
    world.lost = null;
  });
});
