// The IndexedDB snapshot cache: revisions (resync), storage failures that stay visible, and a queue that survives a
// full localStorage.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import type { SnapshotRows } from '#lib/contract/api.ts';
import { LIVE, configureStorage, onStorageProblem, type KV, type StorageProblem } from './storage.ts';
import { configureTransport } from './transport.ts';
import { enqueue, flush, queued } from './queue.ts';
import { applySnapshot, cacheWritten, configureCache, loadCache, refreshSnapshot, saveCache, SEG_ROWS } from './cache.ts';
import { setKey } from './pairing.ts';
import { asRecord } from './fake-record.ts';

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
      return new Response(JSON.stringify(asRecord(reply)(body)));
    }) as typeof fetch
  });
  configureCache({ indexedDB: idb });
  setKey('ab'.repeat(32), 'A');
  onStorageProblem((p) => problems.push(p));
});
afterEach(() => onStorageProblem(null));

describe('IndexedDB cache', () => {
  it('survives a reload', async () => {
    const r = await refreshSnapshot();
    expect(r.ok).toBe(true);
    await reload();
    const c = await loadCache();
    expect(c?.rows).toEqual(rows());
    expect(c?.rev).toBe('r1');
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
    const a = applySnapshot(null, { me: 'A', rev: 'r1', now: '2026-11-02T05:00:00.000Z', rows: rows(1) }, 0);
    const b = applySnapshot(null, { me: 'A', rev: 'r1', now: '2026-11-02T05:00:00.000Z', rows: rows(2) }, 0);
    void saveCache(a);
    await saveCache(b);
    await reload();
    expect((await loadCache())?.rows.metrics).toHaveLength(2);
  });

  /** The raw records in the `island` database's `cache` store (after writing `write`, `undefined` deletes). */
  const raw = async (write?: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const d = await new Promise<IDBDatabase>((ok) => {
      const r = idb.open('island', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('cache');
      r.onsuccess = () => ok(r.result);
    });
    const t = d.transaction('cache', 'readwrite');
    const s = t.objectStore('cache');
    for (const [k, v] of Object.entries(write ?? {})) {
      if (v === undefined) s.delete(k);
      else s.put(v, k);
    }
    const out: Record<string, unknown> = {};
    s.openCursor().onsuccess = (e) => {
      const c = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!c) return;
      out[String(c.key)] = c.value;
      c.continue();
    };
    await new Promise((ok) => { t.oncomplete = ok; });
    d.close();
    return out;
  };
  type Listed = { metrics: string[]; events: string[] };
  /** The segments the meta lists; every record on disk is the meta or one of them. */
  const listed = (disk: Record<string, unknown>): Listed => {
    const l = (disk.meta as { segs: Listed }).segs;
    expect(Object.keys(disk).sort()).toEqual(['meta', ...l.metrics, ...l.events].sort());
    return l;
  };
  const ev = (i: number): SnapshotRows['events'][number] => [new Date(Date.parse('2026-11-02T01:00:00.000Z') + i * 1000).toISOString(), 'A', `e${i}`, 'pref', '{"key":"locale","value":"en"}'];

  it('an empty poll writes only the meta; new rows write only the segment they land in', async () => {
    reply = () => ({ ok: true, me: 'A', now: '2026-11-02T05:00:00.000Z', rev: 'r1', rows: { metrics: rows().metrics, events: Array.from({ length: 2 * SEG_ROWS + 10 }, (_, i) => ev(i)) } });
    await refreshSnapshot();
    await reload();
    await loadCache();
    let disk = await raw();
    const before = listed(disk);
    expect([before.metrics.length, before.events.length]).toEqual([1, 3]);
    expect(disk.meta).toMatchObject({ v: 3, me: 'A', rev: 'r1' });
    expect(disk.meta).not.toHaveProperty('rows');
    expect(disk[before.events[1]]).toEqual(Array.from({ length: SEG_ROWS }, (_, i) => ev(SEG_ROWS + i)));
    // what is on disk now (not in memory), so a rewrite would show
    const marked = (k: string) => [...(disk[k] as unknown[])].map((r) => [...(r as unknown[]), 'marker']);
    await raw(Object.fromEntries([before.events[1], before.events[2], before.metrics[0]].map((k) => [k, marked(k)])));
    reply = () => ({ ok: true, me: 'A', now: '2026-11-02T06:00:00.000Z', rev: 'r1', rows: { metrics: [], events: [] } });
    await refreshSnapshot(() => 7);
    await cacheWritten();
    disk = await raw();
    expect(listed(disk)).toEqual(before);
    expect((disk[before.events[2]] as unknown[][])[0]).toContain('marker');
    expect(disk.meta).toMatchObject({ v: 3, fetchedAt: 7 });
    // one more event: only the last, partly filled segment is written again (a new key, in the same transaction)
    reply = () => ({ ok: true, me: 'A', now: '2026-11-02T06:00:00.000Z', rev: 'r1', rows: { events: [ev(2 * SEG_ROWS + 10)] } });
    await refreshSnapshot();
    await cacheWritten();
    disk = await raw();
    const after = listed(disk);
    expect(after.metrics).toEqual(before.metrics);
    expect(after.events.slice(0, 2)).toEqual(before.events.slice(0, 2));
    expect(after.events[2]).not.toBe(before.events[2]);
    expect((disk[before.events[1]] as unknown[][])[0]).toContain('marker');
    expect((disk[before.metrics[0]] as unknown[][])[0]).toContain('marker');
    expect(disk[after.events[2]]).toHaveLength(11);
    expect((disk[after.events[2]] as unknown[][]).flat()).not.toContain('marker');
    await reload();
    expect((await loadCache())?.rows.events).toHaveLength(2 * SEG_ROWS + 11);
  });

  it('rows changed in the middle (a compaction) rewrite from that segment on; a reload reads the same rows', async () => {
    const all = Array.from({ length: 3 * SEG_ROWS + 5 }, (_, i) => ev(i));
    const a = applySnapshot(null, { me: 'A', rev: 'r1', now: '2026-11-02T05:00:00.000Z', rows: { metrics: [], events: all } }, 0);
    await saveCache(a);
    const before = listed(await raw());
    const b = { ...a, rows: { ...a.rows, events: all.filter((_, i) => i !== SEG_ROWS + 3) } };
    await saveCache(b);
    const after = listed(await raw());
    expect(after.events).toHaveLength(4);
    expect(after.events[0]).toBe(before.events[0]);
    expect(after.events.slice(1).filter((k) => before.events.includes(k))).toEqual([]);
    await reload();
    expect((await loadCache())?.rows).toEqual(b.rows);
  });

  it('segments the meta doesn’t list (another tab’s) are deleted by the next save', async () => {
    await refreshSnapshot();
    await reload();
    await raw({ 'seg:events:stray': [ev(1)] });
    configureCache({ indexedDB: idb });
    expect((await loadCache())?.rows).toEqual(rows());
    await saveCache({ ...(await loadCache())!, fetchedAt: 9 });
    expect(await raw()).not.toHaveProperty('seg:events:stray');
  });

  it('a missing segment reads as no cache (everything fetched again), never as part of the rows', async () => {
    reply = () => ({ ok: true, me: 'A', now: '2026-11-02T05:00:00.000Z', rev: 'r1', rows: { metrics: [], events: Array.from({ length: SEG_ROWS + 1 }, (_, i) => ev(i)) } });
    await refreshSnapshot();
    await reload();
    await raw({ [listed(await raw()).events[1]]: undefined });
    configureCache({ indexedDB: idb });
    expect(await loadCache()).toBeNull();
    await refreshSnapshot();
    expect(calls.at(-1)).not.toHaveProperty('since');
    await cacheWritten();
    expect(listed(await raw()).events).toHaveLength(2);
  });

  it("an older layout (v 1's `snapshot`, v 2's `rows`) reads as no cache: fetched whole, and the save clears it", async () => {
    const old = { ...applySnapshot(null, { me: 'A', rev: 'r1', now: '2026-11-02T05:00:00.000Z', rows: rows(2) }, 3) };
    const { v: _v, rows: oldRows, ...rest } = old;
    for (const before of [{ snapshot: old }, { meta: { ...rest, v: 2 }, rows: oldRows }]) {
      await raw(Object.fromEntries(Object.keys(await raw()).map((k) => [k, undefined])));
      await raw(before);
      configureCache({ indexedDB: idb });
      expect(await loadCache()).toBeNull();
      calls = [];
      await refreshSnapshot();
      expect(calls.at(-1)).not.toHaveProperty('since');
      await cacheWritten();
      const disk = await raw();
      expect(disk).not.toHaveProperty('snapshot');
      expect(disk).not.toHaveProperty('rows');
      expect(disk.meta).toMatchObject({ v: 3, rev: 'r1' });
    }
  });

  it("the guest's cache survives a reload too", async () => {
    setKey('ef'.repeat(32), 'G');
    reply = () => ({ ok: true, me: 'G', now: '2026-11-02T05:00:00.000Z', rev: 'r1', rows: rows() });
    await refreshSnapshot();
    await reload();
    expect((await loadCache())?.me).toBe('G');
  });

  it('a clear removes every record, the old one too', async () => {
    await refreshSnapshot();
    await raw({ snapshot: { v: 1 } });
    setKey('cd'.repeat(32), 'B');
    await cacheWritten();
    expect(await raw()).toEqual({});
  });
});

describe('resync (rev, docs/backend.md#revision)', () => {
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

  it('a failed fetch keeps the old cache', async () => {
    await refreshSnapshot();
    reply = () => ({ ok: false, error: 'busy' });
    expect((await refreshSnapshot()).ok).toBe(false);
    expect((await loadCache())?.rows).toEqual(rows());
  });

  it('refreshSnapshot recovers after a malformed ok reply ', async () => {
    reply = () => ({ ok: true, me: 'A', now: '2026-11-02T05:00:00.000Z' }); // no rows: mergeRows throws
    const warn = console.warn;
    console.warn = () => {};
    try {
      const r = await refreshSnapshot();
      expect(r.ok).toBe(false);
    } finally {
      console.warn = warn;
    }
    reply = () => ({ ok: true, me: 'A', now: '2026-11-02T05:00:00.000Z', rev: 'r1', rows: rows() });
    const r = await refreshSnapshot();
    expect(calls).toHaveLength(2); // a new request, not the failed one handed back
    expect(r.ok && r.cache.rows).toEqual(rows());
  });

  it('a flush that throws does not wedge later flushes ', async () => {
    const ev = enqueue('harvest', { week: '2026-10-26' });
    await expect(flush(() => { throw new Error('boom'); })).rejects.toThrow('boom');
    const r = await flush();
    expect(r.acked.map((e) => e.id)).toEqual([ev.id]);
  });
});

describe('a full localStorage', () => {
  it('keeps queued taps in memory (still sent), and reports it', async () => {
    kv.full = true;
    const ev = enqueue('harvest', { week: '2026-10-26' });
    expect(queued().map((e) => e.id)).toEqual([ev.id]);
    expect(problems).toEqual(['full']);
    const r = await flush();
    expect(r.acked.map((e) => e.id)).toEqual([ev.id]);
    expect(queued()).toEqual([]);
    kv.full = false;
    enqueue('harvest', { week: '2026-10-26' });
    expect(JSON.parse(kv.m.get(LIVE.queue)!)).toHaveLength(1); // back on disk once there is room
  });

  it('a corrupt stored queue reads as empty, not as a crash', () => {
    kv.m.set(LIVE.queue, '{"oops":1}');
    expect(queued()).toEqual([]);
    kv.m.set(LIVE.queue, '[{"id":"x","type":"harvest","data":{"week":"2026-10-26"}},null,3]');
    expect(queued().map((e) => e.id)).toEqual(['x']);
  });
});
