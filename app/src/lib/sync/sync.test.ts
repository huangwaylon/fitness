import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import type { SnapshotRows } from '#lib/contract/api.ts';
import { configureStorage, getKey, getStoredMe, type KV } from './storage.ts';
import { configureTransport, post } from './transport.ts';
import { backoffMs, enqueue, flush, holdEvent, nextRetryAt, queued, unqueue } from './queue.ts';
import { applySnapshot, configureCache, loadCache, refreshSnapshot } from './cache.ts';
import { keyFromHash, setKey } from './pairing.ts';
import { composeModel, missesLock } from '#lib/store/view.ts';
import { buildWeekView } from '#lib/model/week.ts';
import { emptyRows, mergeRows, maxAt } from '#lib/model/snapshot.ts';

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

type Handler = (body: Record<string, unknown>) => unknown;
let calls: Record<string, unknown>[] = [];
let handler: Handler = () => ({ ok: true });

function fakeFetch(): typeof fetch {
  return (async (_url: RequestInfo | URL, init?: RequestInit) => {
    expect((init?.headers as Record<string, string>)['Content-Type']).toMatch(/^text\/plain/);
    const body = JSON.parse(String(init?.body));
    calls.push(body);
    const out = handler(body);
    if (out instanceof Error) throw out;
    if (typeof out === 'string') return new Response(out, { status: 200 });
    return new Response(JSON.stringify(out), { status: 200 });
  }) as typeof fetch;
}

const KEY = 'ab'.repeat(32);

function configure(o: { storage?: KV; fetch?: typeof fetch; url?: string }): void {
  if (o.storage) configureStorage({ local: o.storage });
  configureTransport(o);
}

/** Cache + queue → WeekView, as the store composes it. */
function composeView(cache: Parameters<typeof composeModel>[0], queue: Parameters<typeof composeModel>[1], now: number) {
  const m = composeModel(cache, queue, now);
  return buildWeekView(m.state, m.me, m.now);
}

beforeEach(() => {
  calls = [];
  handler = () => ({ ok: true });
  configure({ storage: new Mem(), fetch: fakeFetch(), url: 'https://script.example/exec' });
  configureCache({ indexedDB: new IDBFactory() });
  setKey(KEY, 'A');
});

describe('post', () => {
  it('sends key + action in a text/plain body and returns the reply', async () => {
    handler = () => ({ ok: true, me: 'A' });
    const r = await post('whoami');
    expect(r).toEqual({ ok: true, me: 'A' });
    expect(calls[0]).toEqual({ key: KEY, action: 'whoami' });
  });
  it('maps failures to the error taxonomy', async () => {
    handler = () => new TypeError('Load failed');
    expect(await post('snapshot')).toEqual({ ok: false, error: 'offline' });
    handler = () => '<html>Google error</html>';
    expect((await post('snapshot')).ok === false && (await post('snapshot') as { error: string }).error).toBe('unavailable');
    for (const error of ['unauthorized', 'busy', 'bad_request', 'unavailable'] as const) {
      handler = () => ({ ok: false, error, detail: 'x' });
      expect(await post('snapshot')).toEqual({ ok: false, error, detail: 'x' });
    }
    handler = () => ({ ok: false, error: 'weird' });
    expect(await post('snapshot')).toEqual({ ok: false, error: 'unavailable' });
  });
  it('times out as unavailable', async () => {
    configure({ fetch: ((_u: unknown, init?: RequestInit) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))))) as typeof fetch });
    expect(await post('snapshot', {}, { timeoutMs: 10 })).toEqual({ ok: false, error: 'unavailable' });
  });
  it('without a key is unauthorized (no request)', async () => {
    configure({ storage: new Mem() });
    expect(getKey()).toBeNull();
    expect(await post('snapshot')).toEqual({ ok: false, error: 'unauthorized' });
    expect(calls).toHaveLength(0);
  });
  it('reads #key= from the URL hash', () => {
    expect(keyFromHash(`#key=${KEY.toUpperCase()}`)).toBe(KEY);
    expect(keyFromHash('#other=1&key=' + KEY)).toBe(KEY);
    expect(keyFromHash('#key=short')).toBeNull();
    expect(keyFromHash('#key=' + 'a'.repeat(31))).toBeNull(); // the server refuses under 32
    expect(keyFromHash('#key=' + 'a'.repeat(32))).toBe('a'.repeat(32));
    expect(keyFromHash('')).toBeNull();
  });
});

describe('write queue', () => {
  it('persists events and sends them in order until acked (duplicates count as acked)', async () => {
    enqueue('metric_set', { date: '2026-11-02', metric: 'steps', value: 5000 });
    enqueue('highfive', {});
    expect(queued()).toHaveLength(2);
    let n = 0;
    handler = () => (++n === 2 ? { ok: true, duplicate: true } : { ok: true });
    const r = await flush();
    expect(r).toMatchObject({ sent: 2, remaining: 0 });
    expect(calls.map((c) => c.type)).toEqual(['metric_set', 'highfive']);
    expect(calls[0]).toMatchObject({ action: 'event', key: KEY, data: { date: '2026-11-02', metric: 'steps', value: 5000 } });
    expect(typeof calls[0].id).toBe('string');
    expect(queued()).toEqual([]);
  });
  it('reports only acked events: one undone while an earlier event is in flight is not acked', async () => {
    const first = enqueue('metric_set', { date: '2026-11-02', metric: 'steps', value: 5000 });
    const second = enqueue('highfive', {});
    handler = (body) => {
      // While the first event is on the wire, the user taps 取り消す on the second.
      if (body.id === first.id) expect(unqueue(second.id)).toBe(true);
      return { ok: true };
    };
    const r = await flush();
    expect(r.acked.map((e) => e.id)).toEqual([first.id]);
    expect(calls.map((c) => c.id)).toEqual([first.id]);
    expect(queued()).toEqual([]);
  });
  it('keeps the event (and order) with a backoff on transient errors, then retries', async () => {
    let t = 1_000_000;
    const a = enqueue('highfive', {}, t);
    enqueue('highfive', {}, t);
    handler = () => ({ ok: false, error: 'busy' });
    let r = await flush(() => t);
    expect(r).toMatchObject({ sent: 0, remaining: 2, error: 'busy' });
    expect(queued()[0]).toMatchObject({ id: a.id, tries: 1 });
    expect(queued()[0].nextAt).toBeGreaterThan(t);
    calls = [];
    r = await flush(() => t); // not due yet
    expect(calls).toHaveLength(0);
    handler = () => ({ ok: true });
    t += 10 * 60_000;
    r = await flush(() => t);
    expect(r).toMatchObject({ sent: 2, remaining: 0 });
    expect(calls[0].id).toBe(a.id); // same client id on retry: the server dedupes
  });
  it('drops events the server can never accept, and stops on unauthorized', async () => {
    enqueue('spend', { spendId: 'x', label: '', pot: 'treat', item: 'ice', bells: 0 });
    enqueue('highfive', {});
    let n = 0;
    handler = () => (++n === 1 ? { ok: false, error: 'bad_request' } : { ok: false, error: 'unauthorized' });
    const r = await flush();
    expect(r.dropped.map((e) => e.type)).toEqual(['spend']);
    expect(r).toMatchObject({ sent: 0, remaining: 1, error: 'unauthorized' });
    expect(queued()[0]).toMatchObject({ type: 'highfive', tries: 0 });
  });
  it('a held (undo-window) event does not block later events; it still goes once due', async () => {
    const t = 1_000_000;
    const held = enqueue('spend_void', { spendId: 's1' }, t, 5000);
    const tick = enqueue('metric_set', { date: '2026-11-02', metric: 'steps', value: 5000 }, t);
    expect(nextRetryAt(t)).toBe(t); // the edit is due now, not in 5 s
    let r = await flush(() => t);
    expect(r.acked.map((e) => e.id)).toEqual([tick.id]);
    expect(queued().map((e) => e.id)).toEqual([held.id]);
    expect(nextRetryAt(t)).toBe(t + 5000);
    r = await flush(() => t + 5000);
    expect(r.acked.map((e) => e.id)).toEqual([held.id]);
    expect(calls.map((c) => c.id)).toEqual([tick.id, held.id]);
  });
  it('a backed-off event still blocks everything after it, held or not (order kept)', async () => {
    const t = 1_000_000;
    handler = () => ({ ok: false, error: 'busy' });
    const a = enqueue('highfive', {}, t);
    await flush(() => t);
    const retryAt = queued()[0].nextAt;
    enqueue('metric_set', { date: '2026-11-02', metric: 'steps', value: 5000 }, t);
    handler = () => ({ ok: true });
    calls = [];
    await flush(() => t + 1);
    expect(calls).toHaveLength(0);
    expect(nextRetryAt(t + 1)).toBe(retryAt);
    await flush(() => retryAt);
    expect(calls.map((c) => c.type)).toEqual(['highfive', 'metric_set']);
    expect(calls[0].id).toBe(a.id);
  });
  it('holdEvent keeps a held event back while its banner is held, and releases it', async () => {
    const t = 1_000_000;
    const held = enqueue('spend', { spendId: 's', label: 'x', pot: 'treat', item: 'ice', bells: 2000 }, t, 5000);
    expect(holdEvent(held.id, t + 60_000)).toBe(true);
    await flush(() => t + 5000);
    expect(calls).toHaveLength(0);
    expect(holdEvent(held.id, t + 6000)).toBe(true);
    await flush(() => t + 6000);
    expect(calls.map((c) => c.id)).toEqual([held.id]);
    expect(holdEvent(held.id, t + 9000)).toBe(false); // already sent
  });
  it('a later event on the same subject never passes a held one; other subjects still go first', async () => {
    const t = 1_000_000;
    const fix = enqueue('metric_set', { date: '2026-11-02', metric: 'steps', value: 5000 }, t, 5000);
    const island = enqueue('metric_set', { date: '2026-11-02', metric: 'steps', value: 6000 }, t + 1);
    const other = enqueue('metric_set', { date: '2026-11-02', metric: 'exercise_min', value: 30 }, t + 2);
    expect(nextRetryAt(t + 2)).toBe(t + 2); // `other` is due; the blocked later edit is not
    await flush(() => t + 2);
    expect(calls.map((c) => c.id)).toEqual([other.id]);
    expect(nextRetryAt(t + 3)).toBe(t + 5000); // wakes when the held fix goes, not every 250 ms
    await flush(() => t + 5000);
    expect(calls.map((c) => c.id)).toEqual([other.id, fix.id, island.id]); // the screen's order
  });
  it('undoing the held event lets the blocked one go', async () => {
    const t = 1_000_000;
    const fix = enqueue('metric_set', { date: '2026-11-02', metric: 'steps', value: 5 }, t, 5000);
    const later = enqueue('metric_set', { date: '2026-11-02', metric: 'steps', value: 6 }, t + 1);
    expect(unqueue(fix.id)).toBe(true);
    await flush(() => t + 2);
    expect(calls.map((c) => c.id)).toEqual([later.id]);
  });
  it('an edit that would reach the server after its lock is dropped unsent and reported', async () => {
    const t = 1_000_000;
    const late = enqueue('metric_set', { date: '2026-11-02', metric: 'steps', value: 5 }, t, 0, t + 10_000);
    const fine = enqueue('highfive', {}, t);
    const r = await flush(() => t + 10_000, (ev, now) => missesLock(ev, now, 0));
    expect(r.expired.map((e) => e.id)).toEqual([late.id]);
    expect(calls.map((c) => c.id)).toEqual([fine.id]);
    expect(queued()).toEqual([]);
  });
  it('missesLock judges by the eventual send time (held → nextAt) on the server clock', () => {
    const lockAt = 100_000;
    expect(missesLock({ nextAt: 90_000, lockAt }, 80_000, 0)).toBe(false);
    expect(missesLock({ nextAt: 100_000, lockAt }, 80_000, 0)).toBe(true); // held until the lock: refused there
    expect(missesLock({ nextAt: 90_000, lockAt }, 80_000, 15_000)).toBe(true); // the server clock is ahead
    expect(missesLock({ nextAt: 0 }, 1e12, 0)).toBe(false); // not an edit
  });
  it('a second flush while one is running shares it', async () => {
    enqueue('highfive', {});
    const [x, y] = await Promise.all([flush(), flush()]);
    expect(x).toBe(y);
    expect(calls).toHaveLength(1);
  });
  it('backoff grows and caps', () => {
    const mid = () => 0.5;
    expect(backoffMs(1, mid)).toBe(1000);
    expect(backoffMs(3, mid)).toBe(4000);
    expect(backoffMs(30, mid)).toBe(300_000);
  });
  it('pairing as the other person drops the old queue and cache', () => {
    enqueue('highfive', {});
    setKey(KEY, 'A');
    expect(queued()).toHaveLength(1);
    setKey('cd'.repeat(32), 'B');
    expect(queued()).toHaveLength(0);
  });
});

const rowsA = (): SnapshotRows => ({
  metrics: [['2026-11-02T01:00:00.000Z', 'A', '2026-11-02', 'steps', 5000]],
  workouts: [],
  presence: [],
  events: [['2026-11-02T01:00:00.000Z', 'A', 'e1', 'pref', '{"key":"locale","value":"en"}']]
});

describe('snapshot cache', () => {
  it('merges `since` pages, dedupes by natural key and orders by server time', () => {
    const base = rowsA();
    const merged = mergeRows(base, {
      metrics: [['2026-11-02T01:00:00.000Z', 'A', '2026-11-02', 'steps', 5000], ['2026-11-02T03:00:00.000Z', 'A', '2026-11-02', 'steps', 7000]],
      events: [['2026-11-02T01:00:00.000Z', 'A', 'e1', 'pref', '{"key":"locale","value":"en"}'], ['2026-11-02T00:30:00.000Z', 'B', 'e0', 'highfive', '{}']]
    });
    expect(merged.metrics.map((r) => r[4])).toEqual([5000, 7000]);
    expect(merged.events.map((r) => r[2])).toEqual(['e0', 'e1']);
    expect(maxAt(merged)).toBe('2026-11-02T03:00:00.000Z');
    expect(maxAt(emptyRows())).toBeNull();
  });
  it('fetches everything first, then only rows since the newest `at`', async () => {
    handler = (b) => (b.since
      ? { ok: true, me: 'A', now: '2026-11-02T05:00:00.000Z', rows: { metrics: [['2026-11-02T04:00:00.000Z', 'A', '2026-11-02', 'steps', 9000]], workouts: [], presence: [], events: [] } }
      : { ok: true, me: 'A', now: '2026-11-02T02:00:00.000Z', rows: rowsA() });
    const first = await refreshSnapshot(() => Date.parse('2026-11-02T02:00:10.000Z'));
    expect(calls[0].since).toBeUndefined();
    expect(first.ok && first.cache.since).toBe('2026-11-02T01:00:00.000Z');
    expect(first.ok && first.cache.skewMs).toBe(-10_000);
    const second = await refreshSnapshot();
    expect(calls[1].since).toBe('2026-11-02T01:00:00.000Z');
    expect(second.ok && second.cache.rows.metrics).toHaveLength(2);
    expect((await loadCache())?.since).toBe('2026-11-02T04:00:00.000Z');
  });
  it('overlapping refreshes share one request, so neither merges from a stale cache', async () => {
    handler = () => ({ ok: true, me: 'A', now: '2026-11-02T02:00:00.000Z', rows: rowsA() });
    const [x, y] = await Promise.all([refreshSnapshot(), refreshSnapshot()]);
    expect(x).toBe(y);
    expect(calls).toHaveLength(1);
    await refreshSnapshot();
    expect(calls).toHaveLength(2); // a later refresh is a new request
  });
  it('a reply for another person starts from scratch', () => {
    const prev = applySnapshot(null, { me: 'A', now: '2026-11-02T02:00:00.000Z', rows: rowsA() }, 0);
    const next = applySnapshot(prev, { me: 'B', now: '2026-11-02T02:00:00.000Z', rows: emptyRows() }, 0);
    expect(next.rows.metrics).toEqual([]);
  });
  it('a `since` page answered for someone else is refetched whole, never kept as their history', async () => {
    handler = () => ({ ok: true, me: 'A', now: '2026-11-02T02:00:00.000Z', rows: rowsA() });
    await refreshSnapshot();
    const rowsB: SnapshotRows = { ...emptyRows(), metrics: [['2026-11-01T01:00:00.000Z', 'B', '2026-11-01', 'steps', 4000]] };
    // the key now answers for B (keys swapped in the script's properties) while this phone still says A
    handler = (b) => ({ ok: true, me: 'B', now: '2026-11-02T03:00:00.000Z', rows: b.since ? emptyRows() : rowsB });
    const r = await refreshSnapshot();
    expect(calls.map((c) => c.since ?? null)).toEqual([null, '2026-11-02T01:00:00.000Z', null]);
    expect(r.ok && r.cache.me).toBe('B');
    expect(r.ok && r.cache.rows.metrics).toEqual(rowsB.metrics);
  });
  it('pairing again while a fetch is in flight discards its reply: no old rows or `me` come back', async () => {
    let pairMidway = () => {};
    handler = () => {
      pairMidway();
      return { ok: true, me: 'A', now: '2026-11-02T02:00:00.000Z', rows: rowsA() };
    };
    pairMidway = () => setKey('cd'.repeat(32), 'B');
    const r = await refreshSnapshot();
    expect(r.ok).toBe(false);
    expect(getStoredMe()).toBe('B');
    expect(await loadCache()).toBeNull();
  });
});

describe('optimistic view', () => {
  it('shows queued events at once, judged like the server will (open weeks, server clock)', () => {
    const cache = applySnapshot(null, { me: 'A', now: '2026-11-04T12:00:00.000Z', rows: rowsA() }, Date.parse('2026-11-04T12:00:00.000Z'));
    const now = Date.parse('2026-11-04T12:00:00.000Z'); // Wed 21:00 JST
    expect(composeView(cache, [], now).people.A.rings.apple.today).toBe(0);
    const q = [
      { id: 'q1', type: 'metric_set' as const, data: { date: '2026-11-04', metric: 'steps', value: 9000 }, queuedAt: now, tries: 0, nextAt: now },
      { id: 'q2', type: 'metric_set' as const, data: { date: '2026-10-27', metric: 'steps', value: 9000 }, queuedAt: now, tries: 0, nextAt: now }, // locked week
      { id: 'q3', type: 'pref' as const, data: { key: 'locale', value: 'ja' }, queuedAt: now, tries: 0, nextAt: now }
    ];
    const v = composeView(cache, q, now);
    expect(v.people.A.rings.apple).toMatchObject({ today: 9000, met: true });
    expect([...composeModel(cache, q, now).state.metricSets.A.keys()]).toEqual(['2026-11-04|steps']);
    expect(v.locale).toBe('ja');
    // Once the server has the event (same id), the queued copy is ignored.
    const acked = { ...cache, rows: mergeRows(cache.rows, { events: [['2026-11-04T12:00:01.000Z', 'A', 'q3', 'pref', '{"key":"locale","value":"en"}']] }) };
    expect(composeView(acked, q, now).locale).toBe('en');
  });
  it('an unsent edit that would land after the lock is not shown; live events ignore a stray `person`', () => {
    const now = Date.parse('2026-11-04T12:00:00.000Z'); // Wed 21:00 JST: the week of 11-02 locks Wed 11-11 04:00
    const cache = applySnapshot(null, { me: 'A', now: '2026-11-04T12:00:00.000Z', rows: rowsA() }, now);
    const lockAt = Date.parse('2026-11-10T19:00:00.000Z');
    const set = (id: string, nextAt: number, extra = {}) => ({ id, type: 'metric_set' as const, data: { date: '2026-11-04', metric: 'steps', value: 9000 }, queuedAt: now, tries: 0, nextAt, lockAt, ...extra });
    expect(composeView(cache, [set('ok', now + 5000)], now).people.A.rings.apple.today).toBe(9000);
    expect(composeView(cache, [set('late', lockAt)], now).people.A.rings.apple.today).toBe(0);
    // Already acked (not in the pending set): shown whatever its nextAt, the server judged it.
    expect(composeModel(cache, [set('acked', lockAt)], now, new Set()).state.metricSets.A.size).toBe(1);
    // A crafted `person` on a live queued event is ignored: it is always me.
    expect(composeModel(cache, [set('p', now, { person: 'B' })], now).state.metricSets.B.size).toBe(0);
  });
  it('the same event listed twice is applied once', () => {
    const now = Date.parse('2026-11-04T12:00:00.000Z');
    const cache = applySnapshot(null, { me: 'A', now: '2026-11-04T12:00:00.000Z', rows: rowsA() }, now);
    const ev = (id: string, value: number) => ({ id, type: 'pref' as const, data: { key: 'moveGoal', value }, queuedAt: now, tries: 0, nextAt: now });
    // 500, then 700, then the 500 again as a duplicate (acked copy + queued copy): still 700.
    expect(composeView(cache, [ev('a', 500), ev('b', 700), ev('a', 500)], now).people.A.moveGoal).toBe(700);
  });
});
