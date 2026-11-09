// A file's slice of its pack (packStore.ts) from a host that answers a Range with the whole pack (Cloudflare Pages):
// sliced here, and the pack held, so the pack's other files come from memory (one fetch for them all).
import { describe, expect, it, vi } from 'vitest';
import { PackStore } from './packStore.ts';

describe('PackStore, a whole answer to a Range', () => {
  it('slices it, and holds the pack: its other files cut from memory, no fetch', async () => {
    const all = Uint8Array.from({ length: 500 }, (_, i) => i % 256);
    const get = vi.fn(async () => new Response(all.slice()));
    const s = new PackStore({ url: (stem) => `/p/${stem}.pak`, get, tag: 't' });
    expect([...new Uint8Array((await s.bytes(['a.1', 10, 3]))!)]).toEqual([10, 11, 12]);
    expect(s.holds('a.1')).toBe(true);
    expect([...new Uint8Array((await s.bytes(['a.1', 300, 2]))!)]).toEqual([44, 45]);
    expect(get).toHaveBeenCalledTimes(1);
    expect(s.sliceUrl(['a.1', 10, 3])).toBe('/p/a.1.pak?s=10-12');
    // (past its end: none)
    expect(await s.bytes(['a.1', 499, 5])).toBeNull();
  });
});
