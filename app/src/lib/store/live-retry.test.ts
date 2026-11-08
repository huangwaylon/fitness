// Back on screen or reconnected, the write queue's backoff is cut short (health A4, sync #7): iOS often skips `online`
// after a suspend, so a write backed off to minutes waited them out with the network up. At most once per 30 s.
// Hidden, the held day rows go at once, keepalive (health A5, sync #11).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, LIVE, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { configureCache } from '#lib/sync/cache.ts';
import { setKey } from '#lib/sync/pairing.ts';
import { enqueue, queued } from '#lib/sync/queue.ts';
import type { Host } from './backend.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const relay = vi.hoisted(() => {
  let st: { connected: boolean; me: null; peer: boolean; here: never[] } = { connected: false, me: null, peer: false, here: [] };
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
const host = (): Host => ({ status: 'loading', syncing: false, offline: false, lastSync: null, changed() {} });

let kv: Mem;
let sends = 0;
let keepalive: boolean[] = [];
/** The page's and the document's listeners. */
let on: Record<string, () => void> = {};
const doc = { visibilityState: 'visible', addEventListener: (t: string, f: () => void) => void (on[`doc:${t}`] = f) };
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.stubGlobal('location', { hash: '', search: '' });
  on = {};
  keepalive = [];
  vi.stubGlobal('addEventListener', (t: string, f: () => void) => void (on[t] = f));
  vi.stubGlobal('document', doc);
  doc.visibilityState = 'visible';
  configureCache({ indexedDB: null });
  kv = new Mem();
  configureStorage({ local: kv });
  setKey('ab'.repeat(32), 'A');
  sends = 0;
  relay.clear();
  relay.set({ connected: false });
  configureTransport({
    url: 'https://relay.example/api',
    fetch: (async (_u: unknown, init?: RequestInit) => {
      const b = JSON.parse(String(init?.body));
      if (b.action === 'events') {
        sends++;
        keepalive.push(!!init?.keepalive);
        // (each with its row's `at`: no re-read after the ack, whose own retryNow would hide the test's)
        return new Response(JSON.stringify({ ok: true, results: b.events.map((e: { id: string }) => ({ id: e.id, ok: true, at: '2026-11-05T03:00:01.000Z' })) }));
      }
      return new Response(JSON.stringify({ ok: true, me: 'A', now: '2026-11-05T03:00:00.000Z', rev: 'r1', rows: { metrics: [], events: [] } }));
    }) as typeof fetch
  });
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** A write that failed 9 times offline: its next try 256 s away. */
const backedOff = () => {
  const ev = enqueue('pref', { key: 'moveGoal', value: 450 });
  kv.setItem(LIVE.queue, JSON.stringify(queued().map((x) => (x.id === ev.id ? { ...x, tries: 9, nextAt: Date.now() + 256_000 } : x))));
  return ev;
};
/** The app back on screen (a refresh may wait for a welcome: WELCOME_WAIT_MS). */
const visible = async (b: InstanceType<typeof LiveBackend>) => {
  const p = b.refresh({ background: true });
  await vi.advanceTimersByTimeAsync(2100);
  await p;
};
const settle = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
  await vi.advanceTimersByTimeAsync(10);
};

describe('the write queue when the app comes back', () => {
  it('a visible refresh sends a backed-off write at once; another within 30 s waits out its backoff', async () => {
    const b = new LiveBackend(host());
    const opening = b.refresh({});
    await vi.advanceTimersByTimeAsync(2100);
    await opening;
    backedOff();
    await visible(b);
    await settle();
    expect(sends).toBe(1);
    expect(queued()).toEqual([]);
    backedOff();
    await vi.advanceTimersByTimeAsync(10_000);
    await visible(b);
    await settle();
    expect(sends).toBe(1);
    await vi.advanceTimersByTimeAsync(19_000);
    await visible(b);
    await settle();
    expect(sends).toBe(2);
  });

  it('the socket’s welcome sends it too', async () => {
    const b = new LiveBackend(host());
    const opening = b.refresh({});
    await vi.advanceTimersByTimeAsync(2100);
    await opening;
    backedOff();
    relay.set({ connected: true });
    await settle();
    expect(sends).toBe(1);
  });

  it('hidden (or pagehide): the tally and island rows still held go now, keepalive; a buy’s undo window keeps its time', async () => {
    const b = new LiveBackend(host());
    const opening = b.refresh({});
    await vi.advanceTimersByTimeAsync(2100);
    await opening;
    enqueue('tally', { date: '2026-11-05', counts: { 'fish:koi': 1 } }, Date.now(), 60_000);
    enqueue('island', { date: '2026-11-05', taken: ['catch:a'] }, Date.now(), 120_000);
    const buy = enqueue('buy', { item: 'x', price: 1, d: '2026-11-05' }, Date.now(), 5_000);
    doc.visibilityState = 'hidden';
    on['doc:visibilitychange']();
    await settle();
    expect(sends).toBe(1);
    expect(keepalive).toEqual([true]);
    expect(queued().map((e) => e.id)).toEqual([buy.id]);
    // pagehide alike (nothing held now: no request)
    on.pagehide();
    await settle();
    expect(sends).toBe(1);
  });
});
