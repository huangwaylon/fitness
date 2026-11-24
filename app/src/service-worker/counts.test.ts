// The worker's counters (counts.ts) on a stand-in cache: counted one write at a time, taken once and gone; a store
// that fails never throws to the push or the install that counted.
import { describe, expect, it } from 'vitest';
import { swCounter, SW_COUNTS_CACHE } from './counts.ts';

function fakeCaches() {
  const stores = new Map<string, Map<string, string>>();
  const caches = {
    open: async (name: string) => {
      const m = stores.get(name) ?? new Map<string, string>();
      stores.set(name, m);
      return {
        match: async (k: string) => (m.has(k) ? new Response(m.get(k)) : undefined),
        put: async (k: string, r: Response) => void m.set(k, await r.text()),
        delete: async (k: string) => m.delete(k)
      } as unknown as Cache;
    }
  };
  return { caches, stores };
}

describe('the worker\'s counters', () => {
  it('count up in their own cache (many at once, none lost); taken once, then gone', async () => {
    const { caches, stores } = fakeCaches();
    const c = swCounter(() => caches);
    await Promise.all([c.count('act:sw.push'), c.count('act:sw.push'), c.count('swallow:sw.put'), c.count('act:sw.click')]);
    expect([...stores.keys()]).toEqual([SW_COUNTS_CACHE]);
    // (a worker started again reads what the last one left)
    expect(await swCounter(() => caches).take()).toEqual({ 'act:sw.push': 2, 'swallow:sw.put': 1, 'act:sw.click': 1 });
    expect(await c.take()).toEqual({});
  });

  it('no Cache API, or one that throws: nothing counted, nothing thrown', async () => {
    expect(await swCounter(() => undefined).take()).toEqual({});
    const broken = swCounter(() => ({ open: () => Promise.reject(new Error('blocked')) }));
    await expect(broken.count('act:sw.push')).resolves.toBeUndefined();
    expect(await broken.take()).toEqual({});
  });
});
