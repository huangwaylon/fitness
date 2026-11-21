// Back on screen or reconnected, the write queue's backoff is cut short (health A4, sync #7): iOS often skips `online`
// after a suspend, so a write backed off to minutes waited them out with the network up. At most once per 30 s.
// Hidden, the held day rows go at once, keepalive (health A5, sync #11).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, LIVE, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { configureCache } from '#lib/sync/cache.ts';
import { setKey } from '#lib/sync/pairing.ts';
import { enqueue, queued } from '#lib/sync/queue.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { t } from '#lib/i18n/index.ts';
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
const host = (): Host => ({ status: 'loading', syncing: false, offline: false, lastSync: null, current: false, changed() {} });

/** The record's newest row (what a snapshot brings). */
const NEWEST = '2026-11-05T03:00:00.000Z';
let kv: Mem;
let sends = 0;
/** Snapshots asked for, and the next ones that fail (the record `unavailable`). */
let snaps = 0, failing = 0;
let keepalive: boolean[] = [];
/** The record refuses every event. */
let refuse = false;
/** The page's and the document's listeners. */
let on: Record<string, () => void> = {};
const doc = { visibilityState: 'visible', addEventListener: (t: string, f: () => void) => void (on[`doc:${t}`] = f) };
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.stubGlobal('location', { hash: '', search: '' });
  on = {};
  keepalive = [];
  refuse = false;
  toasts.dismiss();
  vi.stubGlobal('addEventListener', (t: string, f: () => void) => void (on[t] = f));
  vi.stubGlobal('document', doc);
  doc.visibilityState = 'visible';
  configureCache({ indexedDB: null });
  kv = new Mem();
  configureStorage({ local: kv });
  setKey('ab'.repeat(32), 'A');
  sends = 0;
  snaps = failing = 0;
  relay.clear();
  relay.set({ connected: false });
  configureTransport({
    url: 'https://relay.example/api',
    fetch: (async (_u: unknown, init?: RequestInit) => {
      const b = JSON.parse(String(init?.body));
      if (b.action === 'events') {
        sends++;
        keepalive.push(!!init?.keepalive);
        if (refuse) return new Response(JSON.stringify({ ok: true, results: b.events.map((e: { id: string }) => ({ id: e.id, ok: false, error: 'bad_request' })) }));
        // (each with its row's `at`: no re-read after the ack, whose own retryNow would hide the test's)
        return new Response(JSON.stringify({ ok: true, results: b.events.map((e: { id: string }) => ({ id: e.id, ok: true, at: '2026-11-05T03:00:01.000Z' })) }));
      }
      snaps++;
      if (failing > 0 && failing--) return new Response('{"ok":false,"error":"unavailable"}');
      return new Response(JSON.stringify({ ok: true, me: 'A', now: NEWEST, rev: 'r1', rows: { metrics: [], events: [[NEWEST, 'B', 'e1', 'pref', '{"key":"villagerName","value":"x"}']] } }));
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

  it('`online` sends a backed-off write at once, even right after a show; it fetches only after a failed fetch, not while the welcome says the cache is current', async () => {
    const h = host();
    const b = new LiveBackend(h);
    relay.set({ connected: true, rec: { at: NEWEST, rev: 'r1' } } as never);
    await b.refresh({});
    expect(snaps).toBe(1);
    backedOff();
    await visible(b);
    await settle();
    expect(sends).toBe(1);
    backedOff();
    on.online();
    await settle();
    expect(sends).toBe(2); // (no 30 s floor for `online`)
    expect(snaps).toBe(1); // (inside the refresh floor)
    await vi.advanceTimersByTimeAsync(31_000);
    on.online();
    await settle();
    expect(snaps).toBe(1); // (past it: the welcome says the cache has the record's last change)
    // a fetch fails (the train's tunnel): the next `online` fetches
    failing = 1;
    await b.refresh({});
    expect([snaps, h.offline]).toEqual([2, true]);
    on.online();
    await settle();
    expect([snaps, h.offline]).toEqual([3, false]);
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

  it('hidden: a row the record refuses says so, as any flush does (2026-11-21: never read, no toast)', async () => {
    const b = new LiveBackend(host());
    const opening = b.refresh({});
    await vi.advanceTimersByTimeAsync(2100);
    await opening;
    enqueue('tally', { date: '2026-11-05', counts: { 'fish:koi': 1 } }, Date.now(), 60_000);
    refuse = true;
    doc.visibilityState = 'hidden';
    on['doc:visibilitychange']();
    await settle();
    expect(keepalive).toEqual([true]);
    expect(queued()).toEqual([]);
    expect(toasts.current?.text).toBe(t('state.saveFailed'));
  });
});
