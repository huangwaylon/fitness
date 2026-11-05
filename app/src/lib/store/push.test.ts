// The relay's push into the live backend (docs/backend.md#push): a sheet change fetches at once, gathered, unless the
// cache already holds it; acked events nudge the partner until Apps Script's own push is seen.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { configureCache, saveCache } from '#lib/sync/cache.ts';
import { setKey } from '#lib/sync/pairing.ts';
import type { Intent } from '#lib/contract/live-protocol.ts';
import type { SheetChange } from '#lib/sync/live.ts';
import { LiveBackend } from './live.ts';
import { asRecord } from '#lib/sync/fake-record.ts';
import type { Host } from './backend.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const relay = vi.hoisted(() => ({
  started: 0,
  stopped: 0,
  sent: [] as unknown[],
  listeners: [] as ((c: unknown) => void)[],
  status: { connected: false, me: null, peer: false } as { connected: boolean; me: null; peer: boolean; rec?: { at: string; rev: string } }
}));
vi.mock('#lib/sync/live.ts', () => ({
  LIVE_URL: 'wss://relay.test/room',
  liveRelay: () => ({
    start: () => void relay.started++,
    stop: () => void relay.stopped++,
    send: (i: unknown) => (relay.sent.push(i), true),
    onChange: (fn: (c: unknown) => void) => (relay.listeners.push(fn), () => {}),
    status: () => relay.status,
    onStatus: (fn: (s: unknown) => void) => (fn(relay.status), () => {}),
    // the shared island listens too (store/world.svelte.ts)
    on: () => () => {},
    serverNow: () => Date.now()
  })
}));

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const host = (): Host => ({ status: 'loading', syncing: false, offline: false, lastSync: null, changed() {} });
const AT = '2026-11-01T01:00:00.000Z';
const LATER = '2026-11-01T01:05:00.000Z';
const change = (c: SheetChange) => relay.listeners.forEach((f) => f(c));

let snapshots: number;
let events: string[];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.stubGlobal('location', { hash: '', search: '' });
  vi.stubGlobal('addEventListener', () => {});
  configureCache({ indexedDB: null });
  configureStorage({ local: new Mem() });
  setKey('ab'.repeat(32), 'A');
  relay.started = relay.stopped = 0;
  relay.sent = [];
  relay.listeners = [];
  relay.status = { connected: false, me: null, peer: false };
  snapshots = 0;
  events = [];
  configureTransport({
    url: 'https://script.example/exec',
    fetch: (async (_u: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { action: string; id?: string };
      if (body.action === 'events') return new Response(JSON.stringify(asRecord(() => ({ ok: true }), (b) => events.push(String(b.id)))(body)));
      snapshots++;
      const rows = { metrics: [[AT, 'B', '2026-11-01', 'steps', 900]], events: [] };
      return new Response(JSON.stringify({ ok: true, me: 'A', now: LATER, rev: 'r1', rows }));
    }) as typeof fetch
  });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function ready(): Promise<LiveBackend> {
  const b = new LiveBackend(host());
  await b.refresh({});
  expect(relay.started).toBe(1);
  snapshots = 0;
  return b;
}

const settle = async (ms = 300) => {
  await vi.advanceTimersByTimeAsync(ms);
};

describe('LiveBackend: the relay push', () => {
  it('a change newer than the cache fetches once, gathered with others arriving together', async () => {
    await ready();
    change({ who: 'B', what: 'ingest', at: LATER, rev: 'r1' });
    change({ who: 'B', what: 'event' });
    await settle(299);
    expect(snapshots).toBe(0);
    await settle(1);
    expect(snapshots).toBe(1);
  });

  it('a change the cache already holds, or my own event (the ack\'s re-read fetches it), fetches nothing', async () => {
    await ready();
    change({ who: 'B', what: 'ingest', at: AT, rev: 'r1' });
    change({ who: 'A', what: 'event', at: LATER, rev: 'r1' });
    await settle();
    expect(snapshots).toBe(0);
    change({ who: 'A', what: 'ingest', at: LATER, rev: 'r1' }); // my own Shortcut's upload
    await settle();
    expect(snapshots).toBe(1);
  });

  it('a changed revision fetches even when `at` is old (a hand edit)', async () => {
    await ready();
    change({ who: 'B', what: 'event', at: AT, rev: 'r2' });
    await settle();
    expect(snapshots).toBe(1);
  });

  it('an acked event nudges the partner until Apps Script\'s push is seen; then nudges are neither sent nor heeded', async () => {
    const b = await ready();
    b.send('harvest', { week: '2026-10-26' }, {});
    await settle(0);
    expect(events).toHaveLength(1);
    expect(relay.sent).toEqual([{ kind: 'saved' } satisfies Intent]);
    change({ who: 'B', what: 'event' }); // the partner's nudge
    await settle();
    expect(snapshots).toBeGreaterThanOrEqual(1);
    change({ who: 'B', what: 'event', at: LATER, rev: 'r1' }); // the push works
    await settle(2000);
    const n = snapshots;
    change({ who: 'B', what: 'event' });
    await settle();
    expect(snapshots).toBe(n);
    b.send('harvest', { week: '2026-10-26' }, {});
    await settle(0);
    expect(events).toHaveLength(2);
    expect(relay.sent).toHaveLength(1);
  });

  it('pairing as someone else reconnects the socket with the new key', async () => {
    const b = await ready();
    b.reset();
    expect(relay.stopped).toBe(1);
    expect(relay.started).toBe(2);
  });
});

describe('opening with the relay’s welcome (docs/backend.md#the-record)', () => {
  const cached = (o: { since?: string; fetchedAt?: number } = {}) =>
    saveCache({ v: 1, me: 'A', rows: { metrics: [[AT, 'B', '2026-11-01', 'steps', 900]], events: [] }, since: o.since ?? AT, rev: 'r1', skewMs: 0, fetchedAt: o.fetchedAt ?? Date.now() });

  it('no fetch on opening, nor on coming back, when the welcome says the cache has the record’s last change', async () => {
    void cached();
    relay.status = { connected: true, me: null, peer: false, rec: { at: AT, rev: 'r1' } };
    const b = new LiveBackend(host());
    await b.refresh({});
    expect(snapshots).toBe(0);
    await b.refresh({ fresh: true }); // a push or a sync tap always fetches
    expect(snapshots).toBe(1);
  });

  it('fetches when the record has a later change, another revision, no welcome, or the cache is 15 minutes old', async () => {
    for (const [rec, o] of [
      [{ at: LATER, rev: 'r1' }, {}], [{ at: AT, rev: 'e2' }, {}], [undefined, {}], [{ at: AT, rev: 'r1' }, { fetchedAt: Date.now() - 16 * 60_000 }]
    ] as const) {
      configureCache({ indexedDB: null });
      void cached(o);
      relay.status = { connected: true, me: null, peer: false, ...(rec ? { rec } : {}) };
      snapshots = 0;
      await new LiveBackend(host()).refresh({});
      expect(snapshots, JSON.stringify(rec)).toBe(1);
    }
  });
});
