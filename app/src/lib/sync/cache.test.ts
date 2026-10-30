// The IndexedDB snapshot cache (round 9): the one-time migration from localStorage, revisions (resync), storage
// failures that stay visible, and a queue that survives a full localStorage.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import type { SnapshotRows } from '#lib/contract/api.ts';
import { LIVE, configureStorage, onStorageProblem, type KV, type StorageProblem } from './storage.ts';
import { configureTransport } from './transport.ts';
import { enqueue, flush, queued } from './queue.ts';
import { applySnapshot, cacheWritten, configureCache, loadCache, refreshSnapshot, saveCache } from './cache.ts';
import { setKey } from './pairing.ts';

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

const rows = (n = 1): SnapshotRows => ({
  metrics: Array.from({ length: n }, (_, i) => [`2026-11-02T0${i}:00:00.000Z`, 'A', '2026-11-02', 'steps', 1000 * (i + 1)] as SnapshotRows['metrics'][number]),
  workouts: [],
  presence: [],
  events: [['2026-11-02T01:00:00.000Z', 'A', 'e1', 'pref', '{"key":"locale","value":"en"}']]
});

let kv: Mem;
let idb: IDBFactory;
let calls: Record<string, unknown>[];
let reply: (body: Record<string, unknown>) => unknown;
let problems: StorageProblem[];

/** A new page load: same storage, nothing in memory. */
const reload = async () => {
  await cacheWritten();
  configureCache({ indexedDB: idb });
};

beforeEach(() => {
  kv = new Mem();
  idb = new IDBFactory();
  calls = [];
  problems = [];
  reply = () => ({ ok: true, me: 'A', now: '2026-11-02T05:00:00.000Z', rev: 'r1', rows: rows() });
  configureStorage({ local: kv });
  configureTransport({
    url: 'https://script.example/exec',
    fetch: (async (_u: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      calls.push(body);
      return new Response(JSON.stringify(reply(body)));
    }) as typeof fetch
  });
  configureCache({ indexedDB: idb });
  setKey('ab'.repeat(32), 'A');
  onStorageProblem((p) => problems.push(p));
});
afterEach(() => onStorageProblem(null));

describe('IndexedDB cache', () => {
  it('survives a reload, without touching localStorage', async () => {
    const r = await refreshSnapshot();
    expect(r.ok).toBe(true);
    await reload();
    const c = await loadCache();
    expect(c?.rows).toEqual(rows());
    expect(c?.rev).toBe('r1');
    expect(kv.m.has(LIVE.legacyCache)).toBe(false);
  });

  it('migrates the localStorage cache of older builds once, then removes it', async () => {
    const legacy = applySnapshot(null, { me: 'A', now: '2026-11-02T05:00:00.000Z', rows: rows(3) }, 0);
    kv.m.set(LIVE.legacyCache, JSON.stringify(legacy));
    await reload();
    expect((await loadCache())?.rows).toEqual(legacy.rows);
    expect(kv.m.has(LIVE.legacyCache)).toBe(false);
    await reload();
    expect((await loadCache())?.rows.metrics).toHaveLength(3); // now from IndexedDB
  });

  it('ignores a corrupt legacy cache', async () => {
    kv.m.set(LIVE.legacyCache, '{"v":1,"rows":');
    await reload();
    expect(await loadCache()).toBeNull();
  });

  it('pairing as the other person drops the stored cache', async () => {
    await refreshSnapshot();
    setKey('cd'.repeat(32), 'B');
    expect(await loadCache()).toBeNull();
    await reload();
    expect(await loadCache()).toBeNull();
  });

  it('without IndexedDB it works from memory and says so', async () => {
    configureCache({ indexedDB: { open: () => { throw new DOMException('no', 'InvalidStateError'); } } as unknown as IDBFactory });
    const r = await refreshSnapshot();
    expect(r.ok).toBe(true);
    expect((await loadCache())?.rows).toEqual(rows());
    expect(problems).toContain('unavailable');
  });

  it('the last save wins, in order', async () => {
    const a = applySnapshot(null, { me: 'A', now: '2026-11-02T05:00:00.000Z', rows: rows(1) }, 0);
    const b = applySnapshot(null, { me: 'A', now: '2026-11-02T05:00:00.000Z', rows: rows(2) }, 0);
    void saveCache(a);
    await saveCache(b);
    await reload();
    expect((await loadCache())?.rows.metrics).toHaveLength(2);
  });
});

describe('resync (rev, sheets-architecture.md §2.1)', () => {
  it('the same rev merges `since` pages', async () => {
    await refreshSnapshot();
    reply = () => ({ ok: true, me: 'A', now: '2026-11-02T06:00:00.000Z', rev: 'r1', rows: { metrics: [['2026-11-02T05:30:00.000Z', 'A', '2026-11-02', 'steps', 9000]] } });
    const r = await refreshSnapshot();
    expect(calls.map((c) => c.since)).toEqual([undefined, '2026-11-02T01:00:00.000Z']);
    expect(r.ok && r.cache.rows.metrics).toHaveLength(2);
  });

  it('a new rev drops the cache and fetches everything (a row deleted by hand disappears)', async () => {
    reply = () => ({ ok: true, me: 'A', now: '2026-11-02T05:00:00.000Z', rev: 'r1', rows: rows(3) });
    await refreshSnapshot();
    reply = (b) => ({ ok: true, me: 'A', now: '2026-11-02T06:00:00.000Z', rev: 'r2', rows: b.since ? { metrics: [] } : rows(1) });
    const r = await refreshSnapshot();
    expect(calls.map((c) => c.since)).toEqual([undefined, '2026-11-02T02:00:00.000Z', undefined]);
    expect(r.ok && r.cache.rows.metrics).toHaveLength(1);
    expect(r.ok && r.cache.rev).toBe('r2');
    await reload();
    expect((await loadCache())?.rev).toBe('r2');
  });

  it('a cache from before revisions resyncs once', async () => {
    kv.m.set(LIVE.legacyCache, JSON.stringify(applySnapshot(null, { me: 'A', now: '2026-11-02T05:00:00.000Z', rows: rows(2) }, 0)));
    await reload();
    await refreshSnapshot();
    await refreshSnapshot();
    expect(calls.map((c) => c.since)).toEqual(['2026-11-02T01:00:00.000Z', undefined, '2026-11-02T01:00:00.000Z']);
  });

  it('a failed fetch keeps the old cache', async () => {
    await refreshSnapshot();
    reply = () => ({ ok: false, error: 'busy' });
    expect((await refreshSnapshot()).ok).toBe(false);
    expect((await loadCache())?.rows).toEqual(rows());
  });
});

describe('a full localStorage', () => {
  it('keeps queued taps in memory (still sent), and reports it', async () => {
    kv.full = true;
    const ev = enqueue('highfive', {});
    expect(queued().map((e) => e.id)).toEqual([ev.id]);
    expect(problems).toEqual(['full']);
    const r = await flush();
    expect(r.acked.map((e) => e.id)).toEqual([ev.id]);
    expect(queued()).toEqual([]);
    kv.full = false;
    enqueue('highfive', {});
    expect(JSON.parse(kv.m.get(LIVE.queue)!)).toHaveLength(1); // back on disk once there is room
  });

  it('a corrupt stored queue reads as empty, not as a crash', () => {
    kv.m.set(LIVE.queue, '{"oops":1}');
    expect(queued()).toEqual([]);
    kv.m.set(LIVE.queue, '[{"id":"x","type":"highfive","data":{}},null,3]');
    expect(queued().map((e) => e.id)).toEqual(['x']);
  });
});
