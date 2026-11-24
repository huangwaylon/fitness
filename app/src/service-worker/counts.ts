// The worker's own counters for the log (docs/ops/observability.md): it can't send to the relay (no key, often no page
// open: a push comes to a closed app), so it counts in a small cache entry, and a page (sync/log.ts swCounts, at its
// start and each show) takes them as `use` counters: `act:sw.push` a notification shown, `act:sw.click` one tapped,
// `act:sw.install` a version installed, `swallow:sw.push` / `swallow:sw.install` / `swallow:sw.put` one failed, a
// cache write failed. Counts only, never a URL or what a notification said. One write at a time within a worker.

export const SW_COUNTS_CACHE = 'island-swlog-v1';
const KEY = 'https://counts.invalid/sw';
type Store = Pick<CacheStorage, 'open'>;

export function swCounter(store: () => Store | undefined) {
  let chain: Promise<unknown> = Promise.resolve();
  const read = async (c: Cache): Promise<Record<string, number>> => {
    const x = (await (await c.match(KEY))?.json().catch(() => null)) as unknown;
    return x && typeof x === 'object' ? (x as Record<string, number>) : {};
  };
  const run = <T>(f: (c: Cache) => Promise<T>, none: T): Promise<T> => {
    const p = chain.then(async () => {
      const s = store();
      return s ? f(await s.open(SW_COUNTS_CACHE)) : none;
    }).catch(() => none);
    chain = p;
    return p;
  };
  return {
    /** One more of `key` (never rejects). */
    count: (key: string): Promise<void> => run(async (c) => {
      const m = await read(c);
      m[key] = (Number(m[key]) || 0) + 1;
      await c.put(KEY, new Response(JSON.stringify(m), { headers: { 'content-type': 'application/json' } }));
    }, undefined),
    /** The counts since the last take, and they're gone (never rejects: {} then). */
    take: (): Promise<Record<string, number>> => run(async (c) => {
      const m = await read(c);
      await c.delete(KEY);
      return m;
    }, {})
  };
}
