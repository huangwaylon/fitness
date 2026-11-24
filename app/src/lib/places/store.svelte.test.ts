// 保存した場所's list on this phone (store.svelte.ts) against a fake relay and copy: a delta that changes nothing keeps
// the rows (and so the search index) as they were; another person paired on this phone gets their own list, never the
// last one's (a member's notes never reach the guest), and a fetch in flight for the last one is dropped.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { placesPayload, type Place } from '../contract/places.ts';

const h = vi.hoisted(() => ({
  me: 'A' as string | null,
  answers: [] as (() => Promise<unknown>)[],
  urls: [] as string[],
  writes: [] as { who: string; notes: boolean }[],
  copy: null as unknown
}));
/** A body that never comes (lie-fi), erroring only when the fetch's signal aborts. */
const hung = (signal?: AbortSignal | null) =>
  new Response(new ReadableStream({ start: (c) => signal?.addEventListener('abort', () => c.error(new DOMException('aborted', 'AbortError'))) }));
vi.mock('../keyed.ts', () => ({
  keyed: (url: string, _k: unknown, init: { signal?: AbortSignal } = {}) => {
    h.urls.push(url);
    const next = h.answers.shift() ?? (() => Promise.resolve(null));
    return next().then((body) => (body === 'offline' ? { ok: false, why: 'unreached' } : { ok: true, res: body === 'hang' ? hung(init.signal) : new Response(JSON.stringify(body)) }));
  }
}));
vi.mock('../sync/storage.ts', () => ({ getKey: () => 'k', getStoredMe: () => h.me }));
vi.mock('../sync/transport.ts', () => ({ relayUrl: (p: string) => `https://relay${p}` }));
vi.mock('./cache.ts', () => ({
  readCache: () => Promise.resolve(h.copy),
  writeCache: (c: { who: string; rows: Place[] }) => (h.writes.push({ who: c.who, notes: c.rows.some((r) => r.note) }), Promise.resolve())
}));

const row = (id: string, note?: string): Place => ({ id, name: `p${id}`, lat: 35, lng: 139, addr: '', cat: 'その他', sub: '', added: 1, hours: null, tz: 'Asia/Tokyo', web: '', ...(note !== undefined ? { note, by: 0 } : {}) });
const full = (rows: Place[], ver: number, member = true) => placesPayload(rows, { ver, full: true, syncedAt: 1000 * ver, ...(member ? { people: ['A'] } : {}) });
const delta = (rows: Place[], ver: number, syncedAt = 1000 * ver) => placesPayload(rows, { ver, full: false, syncedAt, gone: [] });
const answer = (b: unknown) => h.answers.push(() => Promise.resolve(b));

type Mod = typeof import('./store.svelte.ts');
let m: Mod;
beforeEach(async () => {
  vi.resetModules();
  Object.assign(h, { me: 'A', answers: [], urls: [], writes: [], copy: null });
  m = await import('./store.svelte.ts');
});

describe('the places store', () => {
  it('a delta of nothing keeps the rows and the index; one with changes merges', async () => {
    answer(full([row('1', 'memo'), row('2', '')], 5));
    await m.places.load();
    const rows = m.places.rows, ix = m.places.index;
    expect(rows).toHaveLength(2);
    answer(delta([], 5, 5000));
    await m.places.load(true);
    expect(h.urls.at(-1)).toBe('https://relay/places?since=5');
    expect(m.places.rows).toBe(rows);
    expect(m.places.index).toBe(ix);
    expect(h.writes).toHaveLength(1); // (nothing new to keep)
    answer(delta([], 5, 9000)); // the relay read the list again, nothing changed
    await m.places.load(true);
    expect(m.places.rows).toBe(rows);
    expect(m.places.syncedAt).toBe(9000);
    answer(delta([row('3', '')], 6));
    await m.places.load(true);
    expect(m.places.rows!.map((r) => r.id).sort()).toEqual(['1', '2', '3']);
  });

  it('another person paired here: their own list read afresh, the last one’s fetch in flight dropped', async () => {
    answer(full([row('1', 'memo')], 5));
    await m.places.load();
    expect(m.places.rows![0].note).toBe('memo');
    let release!: (v: unknown) => void;
    h.answers.push(() => new Promise((r) => (release = r)));
    const late = m.places.load(true); // A's, still on its way
    await vi.waitFor(() => expect(h.urls).toHaveLength(2));
    h.me = 'G';
    answer(full([row('1')], 5, false));
    await m.places.load();
    expect(h.urls.at(-1)).toBe('https://relay/places'); // the whole list, not A's delta
    expect(m.places.rows![0].note).toBeUndefined();
    release(delta([row('9', 'secret')], 6));
    await late;
    expect(m.places.rows!.map((r) => r.id)).toEqual(['1']);
    expect(m.places.rows!.some((r) => r.note)).toBe(false);
    expect(h.writes.filter((w) => w.who === 'G').every((w) => !w.notes)).toBe(true);
  });

  it('offline: the outcome said, the rows kept', async () => {
    answer(full([row('1', '')], 5));
    await m.places.load();
    answer('offline');
    await m.places.load(true);
    expect(m.places.net).toBe('offline');
    expect(m.places.rows).toHaveLength(1);
  });

  it('an answer not the payload: failed, counted for the log (swallow:places.payload), the rows kept', async () => {
    const tags: string[] = [];
    (await import('../quiet.ts')).quietSink((t) => tags.push(t), () => {});
    answer(full([row('1', '')], 5));
    await m.places.load();
    answer({ nope: true });
    await m.places.load(true);
    expect([m.places.net, m.places.rows?.length, tags]).toEqual(['failed', 1, ['places.payload']]);
  });

  it('lie-fi: the headers in and the body never: the fetch given up at its deadline, offline, the rows kept, the next one asked', async () => {
    answer(full([row('1', '')], 5));
    await m.places.load();
    vi.useFakeTimers();
    try {
      answer('hang');
      const p = m.places.load(true);
      await vi.advanceTimersByTimeAsync(45_000);
      await p;
      expect([m.places.net, m.places.busy, m.places.rows!.length]).toEqual(['offline', false, 1]);
    } finally {
      vi.useRealTimers();
    }
    answer(delta([row('2', '')], 6));
    await m.places.load(true);
    expect(m.places.rows).toHaveLength(2);
  });

  it('prime: the copy read into the store, no fetch', async () => {
    h.copy = { who: 'A', ver: 3, syncedAt: 1, rows: [row('7', '')] };
    await m.places.prime();
    expect(m.places.rows!.map((r) => r.id)).toEqual(['7']);
    expect(h.urls).toEqual([]);
  });
});
