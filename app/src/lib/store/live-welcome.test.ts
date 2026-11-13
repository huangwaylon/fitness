// The live backend catches up on each welcome (docs/backend.md#live-sync): a record change made while the socket was
// down (an app switch, the relay restarting) is fetched as soon as the welcome says so, inside the 30 s floor; once per
// record mark, and never twice with the opening's own refresh.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { configureCache } from '#lib/sync/cache.ts';
import { setKey } from '#lib/sync/pairing.ts';
import type { LiveStatus } from '#lib/sync/live.ts';
import type { Host } from './backend.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

/** The phone's one relay, faked: its status set by the test. */
const relay = vi.hoisted(() => {
  let st: { connected: boolean; me: null; peer: boolean; here: never[]; rec?: { at: string; rev: string } } = { connected: false, me: null, peer: false, here: [] };
  const subs = new Set<(s: typeof st) => void>();
  return {
    clear: () => subs.clear(),
    set(s: Partial<typeof st>) {
      st = { ...st, ...s };
      for (const f of subs) f(st);
    },
    live: {
      start() {}, stop() {}, send: () => false, on: () => () => {}, onChange: () => () => {},
      onStatus(fn: (s: typeof st) => void) {
        subs.add(fn);
        fn(st);
        return () => void subs.delete(fn);
      },
      status: () => st, serverNow: () => Date.now()
    }
  };
});
vi.mock('#lib/sync/live.ts', () => ({ LIVE_URL: 'wss://relay.example/room', liveRelay: () => relay.live }));
vi.mock('./world.svelte.ts', () => ({ world: { attach() {} } }));
const { LiveBackend } = await import('./live.ts');

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}
const host = (): Host => ({ status: 'loading', syncing: false, offline: false, lastSync: null, current: false, changed() {} });

let snapshots = 0;
/** The next snapshots that fail (the record `unavailable`). */
let failing = 0;
/** The record's newest row: what a snapshot brings (`since`). */
let newest = '2026-11-05T03:00:00.000Z';
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.stubGlobal('location', { hash: '', search: '' });
  vi.stubGlobal('addEventListener', () => {});
  configureCache({ indexedDB: null });
  configureStorage({ local: new Mem() });
  setKey('ab'.repeat(32), 'A');
  snapshots = 0;
  failing = 0;
  newest = '2026-11-05T03:00:00.000Z';
  relay.clear();
  relay.set({ connected: false, rec: undefined });
  configureTransport({
    url: 'https://relay.example/api',
    fetch: (async () => {
      snapshots++;
      if (failing > 0 && failing--) return new Response('{"ok":false,"error":"unavailable"}');
      return new Response(JSON.stringify({ ok: true, me: 'A', now: newest, rev: 'r1', rows: { metrics: [], events: [[newest, 'B', `e${snapshots}`, 'pref', '{"key":"villagerName","value":"x"}']] } }));
    }) as typeof fetch
  });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const welcome = (at: string) => relay.set({ connected: true, rec: { at, rev: 'r1' } } as Partial<LiveStatus> as never);
const down = () => relay.set({ connected: false, rec: undefined });
const settle = async () => {
  await vi.advanceTimersByTimeAsync(400);
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

describe('LiveBackend on each welcome', () => {
  it('fetches when the welcome is past the cache, inside the floor; not when it isn’t, and once per mark', async () => {
    const b = new LiveBackend(host());
    const opening = b.refresh({});
    await vi.advanceTimersByTimeAsync(2100); // (no welcome yet: the opening fetches anyway)
    await opening;
    expect(snapshots).toBe(1);
    // a reconnect with nothing new: no fetch
    welcome(newest);
    await settle();
    expect(snapshots).toBe(1);
    // the socket down, the partner writes, a new welcome says so: fetched at once
    down();
    newest = '2026-11-05T03:00:05.000Z';
    welcome(newest);
    await settle();
    expect(snapshots).toBe(2);
    // the same mark again (a guest's snapshot may never reach it): not fetched twice
    down();
    welcome(newest);
    await settle();
    expect(snapshots).toBe(2);
  });

  it('an app switch inside the 30 s floor: the visible refresh fetches when the welcome says the cache is behind', async () => {
    const b = new LiveBackend(host());
    welcome(newest);
    await b.refresh({});
    expect(snapshots).toBe(1);
    await b.refresh({ background: true });
    expect(snapshots).toBe(1); // (the floor: nothing new)
    newest = '2026-11-05T03:00:09.000Z';
    // (the welcome's catch-up already on its way: the visible refresh goes now, and the gathered one finds it current)
    down();
    welcome(newest);
    await b.refresh({ background: true });
    expect(snapshots).toBe(2);
    await settle();
    expect(snapshots).toBe(2);
  });

  it('the opening waits for the first welcome and fetches once', async () => {
    const b = new LiveBackend(host());
    await b.refresh({});
    expect(snapshots).toBe(1);
    // the app opened again (the first one gone)
    relay.clear();
    const c = new LiveBackend(host());
    const opening = c.refresh({});
    newest = '2026-11-05T03:00:30.000Z';
    welcome(newest);
    await opening;
    await settle();
    expect(snapshots).toBe(2);
  });

  it('a failed catch-up is tried again while the socket is up: 10 s, then 30 s, until it works', async () => {
    const b = new LiveBackend(host());
    welcome(newest);
    await b.refresh({});
    expect(snapshots).toBe(1);
    // the partner writes while the socket is down; the welcome's fetch fails twice
    down();
    newest = '2026-11-05T03:00:05.000Z';
    failing = 2;
    welcome(newest);
    await settle();
    expect(snapshots).toBe(2);
    await vi.advanceTimersByTimeAsync(9_000);
    expect(snapshots).toBe(2);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(snapshots).toBe(3); // 10 s on: failed again
    await vi.advanceTimersByTimeAsync(29_000);
    expect(snapshots).toBe(3);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(snapshots).toBe(4); // 30 s on: it works, and nothing more
    expect(b.cache()?.since).toBe(newest);
    await vi.advanceTimersByTimeAsync(300_000);
    expect(snapshots).toBe(4);
    // a later failure starts over at 10 s
    down();
    newest = '2026-11-05T03:00:09.000Z';
    failing = 1;
    welcome(newest);
    await settle();
    expect(snapshots).toBe(5);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(snapshots).toBe(6);
  });

  it('no retry with the socket down: the reconnect\'s welcome fetches', async () => {
    const b = new LiveBackend(host());
    welcome(newest);
    await b.refresh({});
    down();
    newest = '2026-11-05T03:00:05.000Z';
    failing = 1;
    welcome(newest);
    await settle();
    expect(snapshots).toBe(2);
    down();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(snapshots).toBe(2);
    // the same mark again: fetched, the failed one was never marked fetched
    welcome(newest);
    await settle();
    expect(snapshots).toBe(3);
    expect(b.cache()?.since).toBe(newest);
  });
});
