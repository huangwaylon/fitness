// The live backend says so when the phone can't keep data, once per kind and session.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { IDBFactory } from 'fake-indexeddb';
import { cacheWritten, configureCache, type SnapshotCache } from '#lib/sync/cache.ts';
import { ackedEvents, enqueue, flush, queued } from '#lib/sync/queue.ts';
import { buildWeekView } from '#lib/model/week.ts';
import { ACKED_MAX_UNSEEN_MS, composeModel, pendingAcked } from './view.ts';
import { setKey } from '#lib/sync/pairing.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { t } from '#lib/i18n/index.ts';
import { LiveBackend } from './live.ts';
import type { Host } from './backend.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

class Mem implements KV {
  m = new Map<string, string>();
  full = false;
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) {
    if (this.full) throw new DOMException('quota', 'QuotaExceededError');
    this.m.set(k, v);
  }
  removeItem(k: string) { this.m.delete(k); }
}

const host = (): Host => ({ status: 'loading', syncing: false, offline: false, lastSync: null, changed() {} });

// LiveBackend schedules retries and re-reads (setTimeout): fake them, so none fires into a later test.
const TIMERS = ['setTimeout', 'clearTimeout'] as const;

beforeEach(() => {
  vi.useFakeTimers({ toFake: [...TIMERS] });
  vi.stubGlobal('location', { hash: '', search: '' });
  vi.stubGlobal('addEventListener', () => {});
  configureCache({ indexedDB: null });
  configureTransport({ url: 'https://script.example/exec', fetch: (async () => new Response('{"ok":false,"error":"busy"}')) as typeof fetch });
  toasts.dismiss();
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('LiveBackend storage problems', () => {
  it('a full localStorage: the tap still counts (in memory) and a banner says so, once', async () => {
    const kv = new Mem();
    configureStorage({ local: kv });
    setKey('ab'.repeat(32), 'A');
    const h = host();
    const b = new LiveBackend(h);
    await b.refresh({});
    expect(h.offline || h.status === 'error').toBe(true); // the fake server is busy
    kv.full = true;
    expect(b.send('highfive', {}, {}).ok).toBe(true);
    expect(queued()).toHaveLength(1);
    expect(toasts.current?.text).toBe(t('state.storageFull'));
    toasts.dismiss();
    b.send('highfive', {}, {});
    expect(toasts.current).toBeNull();
  });
});

describe('LiveBackend sync recovery', () => {
  it('a malformed reply stops the spinner, and the next refresh fetches again', async () => {
    configureStorage({ local: new Mem() });
    setKey('ab'.repeat(32), 'A');
    let body: unknown = { ok: true, me: 'A', now: '2026-11-02T05:00:00.000Z' }; // no rows
    let calls = 0;
    configureTransport({ url: 'https://script.example/exec', fetch: (async () => (calls++, new Response(JSON.stringify(body)))) as typeof fetch });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const h = host();
    const b = new LiveBackend(h);
    await b.refresh({});
    expect(h.syncing).toBe(false);
    expect(h.status).toBe('error');
    body = { ok: true, me: 'A', now: '2026-11-02T05:00:00.000Z', rev: 'r1', rows: { metrics: [], events: [] } };
    await b.refresh({});
    expect(calls).toBe(2);
    expect(h.syncing).toBe(false);
    expect(h.status).toBe('ready');
    warn.mockRestore();
  });
});

describe('LiveBackend after a long time offline', () => {
  it('a sync (or the online event) sends what backed off for minutes at once, not after the rest of its wait', async () => {
    configureStorage({ local: new Mem() });
    setKey('ab'.repeat(32), 'A');
    let online = false;
    const sent: string[] = [];
    configureTransport({
      url: 'https://script.example/exec',
      fetch: (async (_u: unknown, init?: RequestInit) => {
        if (!online) throw new TypeError('Load failed');
        const body = JSON.parse(String(init?.body)) as { action: string; id?: string };
        if (body.action === 'event') sent.push(body.id!);
        return new Response(JSON.stringify({ ok: true, me: 'A', now: new Date().toISOString(), rev: 'r1', rows: { metrics: [], events: [] } }));
      }) as typeof fetch
    });
    const ev = enqueue('highfive', {});
    for (let i = 0; i < 9; i++) {
      await flush(() => queued()[0].nextAt); // each retry fails offline: the backoff grows to minutes
    }
    expect(queued()[0].nextAt - Date.now()).toBeGreaterThan(60_000);
    online = true;
    const h = host();
    await new LiveBackend(h).refresh({});
    expect(sent).toEqual([ev.id]);
    expect(queued()).toEqual([]);
    expect(h.offline).toBe(false);
  });
});

describe('LiveBackend: an acked edit the server stamped after its lock', () => {
  it('says so after the next fetch (the model refuses it, so it would vanish silently)', async () => {
    configureStorage({ local: new Mem() });
    setKey('ab'.repeat(32), 'A');
    const lockAt = Date.now() + 10 * 60_000;
    const stamped: [string, string, string, string, string][] = [];
    configureTransport({
      url: 'https://script.example/exec',
      fetch: (async (_u: unknown, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as { action: string; id?: string; type?: string; data?: unknown };
        if (body.action === 'event') {
          stamped.push([new Date(lockAt + 1).toISOString(), 'A', body.id!, body.type!, JSON.stringify(body.data)]); // a slow server: past the lock
          return new Response('{"ok":true}');
        }
        return new Response(JSON.stringify({ ok: true, me: 'A', now: new Date().toISOString(), rev: 'r1', rows: { metrics: [], events: stamped } }));
      }) as typeof fetch
    });
    const b = new LiveBackend(host());
    await b.refresh({});
    expect(b.send('metric_set', { date: '2026-11-17', metric: 'steps', value: 1 }, { lockAt }).ok).toBe(true);
    await flush(); // the send's flush, in flight
    expect(toasts.current).toBeNull();
    await b.refresh({});
    expect(toasts.current?.text).toBe(t('kiroku.missedLock'));
  });
});

describe('LiveBackend cold open after an ack (no flash of the old state)', () => {
  const NOW = Date.parse('2026-11-18T12:00:00.000Z'); // Wed 21:00 JST
  const GOAL = { key: 'moveGoal', value: 450 };
  type Row = [string, string, string, string, string];
  let idb: IDBFactory;
  let serverEvents: Row[];
  let snapshots: number;
  let hang: boolean;
  let hung: (() => void)[];
  /** Let the requests that were left hanging answer now. */
  const release = () => hung.splice(0).forEach((f) => f());

  const reply = () => ({ ok: true, me: 'A', now: new Date(NOW).toISOString(), rev: 'r1', rows: { metrics: [], events: serverEvents } });
  const goal = (b: LiveBackend) => {
    const m = composeModel(b.cache()!, b.events().list, NOW);
    return buildWeekView(m.state, m.me, m.now).people.A.moveGoal;
  };
  /** A new page load: same localStorage and IndexedDB, nothing in memory; resolves once it painted from the cache. */
  const coldOpen = async () => {
    await cacheWritten();
    configureCache({ indexedDB: idb });
    let painted!: () => void;
    const ready = new Promise<void>((ok) => (painted = ok));
    const h: Host = { ...host(), changed: () => painted() };
    const b = new LiveBackend(h);
    void b.refresh({});
    await ready;
    return { b, h };
  };

  beforeEach(async () => {
    configureStorage({ local: new Mem() });
    idb = new IDBFactory();
    configureCache({ indexedDB: idb });
    serverEvents = [];
    snapshots = 0;
    hang = false;
    hung = [];
    vi.useFakeTimers({ toFake: ['Date', ...TIMERS] });
    vi.setSystemTime(NOW);
    configureTransport({
      url: 'https://script.example/exec',
      fetch: (async (_u: unknown, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as { action: string; id?: string; type?: string; data?: unknown };
        if (body.action === 'event') {
          serverEvents.push(['2026-11-18T12:00:05.000Z', 'A', body.id!, body.type!, JSON.stringify(body.data)]);
          return new Response('{"ok":true}');
        }
        snapshots++;
        if (hang) return new Promise<Response>((ok) => hung.push(() => ok(new Response(JSON.stringify(reply())))));
        return new Response(JSON.stringify(reply()));
      }) as typeof fetch
    });
    setKey('ab'.repeat(32), 'A');
    const b = new LiveBackend(host());
    await b.refresh({}); // the cache, before the tap
  });

  afterEach(() => {
    release();
    vi.useRealTimers();
  });

  it('an event acked just before closing shows on the next open with no fetch, and a later snapshot takes over', async () => {
    const ev = enqueue('pref', GOAL, NOW);
    expect((await flush(() => NOW)).acked.map((e) => e.id)).toEqual([ev.id]);
    expect(queued()).toEqual([]);
    expect(ackedEvents().map((e) => e.id)).toEqual([ev.id]);

    hang = true; // the network never answers: the paint must not need it
    const before = snapshots;
    const { b } = await coldOpen();
    expect(snapshots - before).toBeLessThanOrEqual(1); // the background refresh may start, but nothing waited for it
    expect(goal(b)).toBe(450);
    expect(b.events().unsent.size).toBe(0);

    // the next snapshot brings the server row: the provisional copy goes, and the server row counts
    hang = false;
    release();
    const { b: c } = await coldOpen();
    await c.refresh({});
    expect(goal(c)).toBe(450);
    expect(c.events().list).toEqual([]);
    expect(ackedEvents()).toEqual([]);
  });

  it('an unacked event survives a reload too (still queued)', async () => {
    hang = true;
    configureTransport({ url: 'https://script.example/exec', fetch: (async () => new Response('{"ok":false,"error":"busy"}')) as typeof fetch });
    const ev = enqueue('pref', GOAL, NOW);
    await flush(() => NOW);
    const { b } = await coldOpen();
    expect(b.events().unsent.has(ev.id)).toBe(true);
    expect(goal(b)).toBe(450);
  });

  it('an acked event a much later fetch still lacks (deleted in the sheet) stops showing', () => {
    const cache: SnapshotCache = { v: 1, me: 'A', rows: { metrics: [], events: [] }, since: null, skewMs: 0, fetchedAt: NOW };
    const ev = { id: 'x', ackedAt: NOW - 1000 };
    expect(pendingAcked({ ...cache }, [ev])).toEqual([ev]);
    expect(pendingAcked({ ...cache, fetchedAt: NOW - 1000 + ACKED_MAX_UNSEEN_MS }, [ev])).toEqual([]);
  });
});
