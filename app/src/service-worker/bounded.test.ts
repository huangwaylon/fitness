import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { boundedCache, EVICT_MAX, TIDY_MS } from './bounded.ts';
import type { RoomIndex } from './caches.ts';

const INDEX = 'https://x/__idx';
/** An in-memory Cache: the calls the bounded cache makes. */
function memCache(files: Record<string, string> = {}) {
  const m = new Map<string, Response>(Object.entries(files).map(([k, v]) => [k, new Response(v)]));
  const key = (r: RequestInfo | URL) => (typeof r === 'string' ? r : r instanceof URL ? r.href : r.url);
  return {
    m,
    cache: {
      match: async (r: RequestInfo | URL) => m.get(key(r))?.clone(),
      keys: async () => [...m.keys()].map((u) => new Request(u)),
      put: async (r: RequestInfo | URL, res: Response) => void m.set(key(r), res),
      delete: async (r: RequestInfo | URL) => m.delete(key(r))
    } as unknown as Cache
  };
}
const indexOf = async (m: Map<string, Response>) => (await m.get(INDEX)!.clone().json()) as RoomIndex;

describe('a bounded cache\'s index', () => {
  beforeEach(() => vi.useFakeTimers({ now: 1_000_000 }));
  afterEach(() => vi.useRealTimers());

  it('a use resolves once marked, before the delayed write: no event waits TIDY_MS on it (a deploy\'s worker activates at once)', async () => {
    const { m, cache } = memCache({ 'https://x/a': 'aaaa' });
    const used = boundedCache(async () => cache, INDEX, () => []);
    let done = false;
    void used('https://x/a').then(() => (done = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(true);
    expect(m.has(INDEX)).toBe(false);
    expect(used.pending()).not.toBeNull();
    await vi.advanceTimersByTimeAsync(TIDY_MS);
    expect((await indexOf(m))['https://x/a']).toEqual([4, 1_000_000]);
    expect(used.pending()).toBeNull();
  });

  it('one write for a burst, the bound applied then', async () => {
    const { m, cache } = memCache({ 'https://x/a': 'a', 'https://x/b': 'bb' });
    const put = vi.spyOn(cache, 'put');
    const used = boundedCache(async () => cache, INDEX, (idx) => Object.keys(idx).filter((u) => u.endsWith('/a')));
    await used('https://x/a');
    await used('https://x/b', 2);
    await vi.advanceTimersByTimeAsync(TIDY_MS);
    expect(put).toHaveBeenCalledTimes(1);
    expect(m.has('https://x/a')).toBe(false);
    expect(Object.keys(await indexOf(m))).toEqual(['https://x/b']);
  });

  it('held (the launch not over): the index written, no file let go; the bound applied once the hold settles', async () => {
    const { m, cache } = memCache({ 'https://x/a': 'a', 'https://x/b': 'bb' });
    let end!: () => void;
    const hold = new Promise<void>((r) => (end = r));
    const used = boundedCache(async () => cache, INDEX, (idx) => Object.keys(idx).filter((u) => u.endsWith('/a')), { hold });
    await used('https://x/b', 2);
    await vi.advanceTimersByTimeAsync(TIDY_MS);
    expect(m.has('https://x/a')).toBe(true);
    expect(Object.keys(await indexOf(m)).sort()).toEqual(['https://x/a', 'https://x/b']);
    end();
    await vi.advanceTimersByTimeAsync(TIDY_MS);
    expect(m.has('https://x/a')).toBe(false);
    expect(Object.keys(await indexOf(m))).toEqual(['https://x/b']);
  });

  it('a lowered bound lets go at most EVICT_MAX files a write, the rest at the next (no launch behind hundreds of deletes)', async () => {
    const files = Object.fromEntries(Array.from({ length: EVICT_MAX + 50 }, (_, i) => [`https://x/f${i}`, 'x']));
    const { m, cache } = memCache(files);
    const used = boundedCache(async () => cache, INDEX, (idx) => Object.keys(idx).filter((u) => u.includes('/f')));
    await used('https://x/keep', 1);
    await vi.advanceTimersByTimeAsync(TIDY_MS);
    expect(Object.keys(await indexOf(m))).toHaveLength(51);
    await used('https://x/keep');
    await vi.advanceTimersByTimeAsync(TIDY_MS);
    expect(Object.keys(await indexOf(m))).toEqual(['https://x/keep']);
  });

  it('a write that never ran (the worker stopped) heals at the next read: the files counted from the cache\'s keys, a gone one dropped', async () => {
    const { m, cache } = memCache({ 'https://x/new': '123' });
    // an index from before: one file since deleted, the new one not in it
    await cache.put(INDEX, new Response(JSON.stringify({ 'https://x/gone': [9, 1] })));
    const used = boundedCache(async () => cache, INDEX, () => []);
    await used('https://x/other', 5);
    await vi.advanceTimersByTimeAsync(TIDY_MS);
    const idx = await indexOf(m);
    expect(idx['https://x/gone']).toBeUndefined();
    expect(idx['https://x/new']?.[0]).toBe(3);
    expect(idx['https://x/other']).toEqual([5, 1_000_000]);
  });

  it('a failed write is let go (the next use writes again), never a rejection', async () => {
    const { m, cache } = memCache({ 'https://x/a': 'a' });
    const put = vi.spyOn(cache, 'put').mockRejectedValueOnce(new Error('quota'));
    const used = boundedCache(async () => cache, INDEX, () => []);
    await used('https://x/a');
    await vi.advanceTimersByTimeAsync(TIDY_MS);
    expect(used.pending()).toBeNull();
    await used('https://x/a');
    await vi.advanceTimersByTimeAsync(TIDY_MS);
    expect(put).toHaveBeenCalledTimes(2);
    expect(m.has(INDEX)).toBe(true);
  });
});
