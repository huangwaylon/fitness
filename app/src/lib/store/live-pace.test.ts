// The write queue paced (review 5 net P2-1): an editor burst (2 ops a second) went as one /api request per op, past the
// record's 120 a minute for a person (`busy`, then 5-30 s backoffs with ops waiting). Now a send within SEND_PACE_MS
// of the last request's start waits for one trailing flush, which takes everything gathered meanwhile.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { configureCache } from '#lib/sync/cache.ts';
import { setKey } from '#lib/sync/pairing.ts';
import { queued } from '#lib/sync/queue.ts';
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

let kv: Mem;
let sends = 0;
let keepalive: boolean[] = [];
/** The record's limit, as relay/src/store.ts RATE_PER_MINUTE: a person's requests in the last minute. */
let starts: number[] = [];
let busy = 0;
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
  starts = [];
  busy = 0;
  relay.clear();
  relay.set({ connected: false });
  configureTransport({
    url: 'https://relay.example/api',
    fetch: (async (_u: unknown, init?: RequestInit) => {
      const b = JSON.parse(String(init?.body));
      if (b.action === 'events') {
        sends++;
        keepalive.push(!!init?.keepalive);
        const now = Date.now();
        starts = [...starts.filter((t) => now - t < 60_000), now];
        // a round trip of 70 ms (the phones' p50)
        await new Promise((r) => setTimeout(r, 70));
        if (starts.length > 120) {
          busy++;
          return new Response(JSON.stringify({ ok: false, error: 'busy' }));
        }
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


const open = async () => {
  const b = new LiveBackend(host());
  const opening = b.refresh({});
  await vi.advanceTimersByTimeAsync(2100);
  await opening;
  return b;
};

describe('the write queue paced', () => {
  it('an editor burst of 125 ops in a minute: no more than one request per SEND_PACE_MS, none refused busy', async () => {
    const b = await open();
    for (let i = 0; i < 125; i++) {
      b.send('decor', { op: 'move', id: `d${i}`, x: i }, {});
      await vi.advanceTimersByTimeAsync(480);
    }
    await vi.advanceTimersByTimeAsync(5000);
    // (2026-11-10, before the pace: 123 requests, 2 refused busy; after: 101, none)
    expect(busy).toBe(0);
    expect(sends).toBeLessThanOrEqual(Math.ceil(60_000 / 600) + 2);
    expect(queued()).toEqual([]);
  });

  it('a drag (125 ops at 10 a second): about one request per SEND_PACE_MS, several ops each', async () => {
    const b = await open();
    for (let i = 0; i < 125; i++) {
      b.send('decor', { op: 'move', id: 'd1', x: i }, {});
      await vi.advanceTimersByTimeAsync(100);
    }
    await vi.advanceTimersByTimeAsync(5000);
    // (2026-11-10, before the pace: 123 requests, 3 refused busy; after: 22, none)
    expect([busy, sends <= Math.ceil(12_500 / 600) + 2]).toEqual([0, true]);
    expect(queued()).toEqual([]);
  });

  it('the first op after a quiet spell goes at once; one right after it waits for the trailing flush, with the rest', async () => {
    const b = await open();
    b.send('decor', { op: 'move', id: 'd1', x: 1 }, {});
    await vi.advanceTimersByTimeAsync(100);
    expect(sends).toBe(1);
    b.send('decor', { op: 'move', id: 'd2', x: 2 }, {});
    b.send('decor', { op: 'move', id: 'd3', x: 3 }, {});
    await vi.advanceTimersByTimeAsync(300);
    expect(sends).toBe(1);
    await vi.advanceTimersByTimeAsync(300);
    expect(sends).toBe(2);
    expect(queued()).toEqual([]);
    await vi.advanceTimersByTimeAsync(5000);
    b.send('decor', { op: 'move', id: 'd4', x: 4 }, {});
    await vi.advanceTimersByTimeAsync(100);
    expect(sends).toBe(3);
  });

  it('hidden: the trailing flush is not waited for (keepalive, at once)', async () => {
    const b = await open();
    b.send('decor', { op: 'move', id: 'd1', x: 1 }, {});
    await vi.advanceTimersByTimeAsync(100);
    b.send('island', { date: '2026-11-05', taken: ['catch:a'] }, { holdMs: 60_000 });
    b.send('decor', { op: 'move', id: 'd2', x: 2 }, {});
    doc.visibilityState = 'hidden';
    on['doc:visibilitychange']();
    await vi.advanceTimersByTimeAsync(100);
    expect(keepalive).toEqual([false, true]);
    expect(queued()).toEqual([]);
  });
});
