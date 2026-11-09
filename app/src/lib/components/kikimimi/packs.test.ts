// The phone's audio packs (packs.ts): a deck's home pack fetched whole, once at a time, held within a byte cap (the
// newest always), a failure not kept; any other clip fetched alone as a Range of its pack (a server answering with the
// whole pack sliced here); a clip's bytes a copy; voiceClip keys the engine's decoded clips by pack and offset and slices
// from the right pack (slow takes from the slow pack); prefetch asks for a pack holding WHOLE_AT of the deck's clips whole,
// each other clip alone, each once.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadVoice = vi.fn(async (_key: string, bytes: () => Promise<ArrayBuffer | null>) => ((await bytes()) ? ({ duration: 1 } as AudioBuffer) : null));
vi.mock('#lib/sound/sound.svelte.ts', () => ({ loadVoice: (k: string, b: () => Promise<ArrayBuffer | null>) => loadVoice(k, b) }));

const { PackStore, WHOLE_AT, packUrl, sliceUrl } = await import('./packs.ts');

/** A fake network: each pack's bytes 0, 1, 2… (mod 256), `n` long, a Range answered as a 206 (`ranges` false: the
 *  whole pack, as a server without them); counts the asks. */
function net(sizes: Record<string, number>, ranges = true) {
  const asked: string[] = [];
  let down = false;
  const get = vi.fn(async (url: string, init?: RequestInit) => {
    asked.push(url);
    if (down) throw new TypeError('offline');
    const stem = Object.keys(sizes).find((s) => url.split('?')[0].endsWith(`/listen/${s}.pak`));
    if (!stem) return new Response(null, { status: 404 });
    const all = Uint8Array.from({ length: sizes[stem] }, (_, i) => i % 256);
    const r = /bytes=(\d+)-(\d+)/.exec(new Headers(init?.headers).get('range') ?? '');
    expect(!!r, url).toBe(url.includes('?s='));
    return r && ranges ? new Response(all.slice(Number(r[1]), Number(r[2]) + 1), { status: 206 }) : new Response(all);
  });
  return { get, asked, off: (v: boolean) => (down = v) };
}

describe('PackStore', () => {
  it('fetches a pack whole, once though asked twice at once; a clip is a copy of its slice', async () => {
    const n = net({ 'lv1.aaaa': 1000 });
    const s = new PackStore(n.get);
    void s.pack('lv1.aaaa');
    const [a, b] = await Promise.all([s.bytes(['lv1.aaaa', 10, 5]), s.bytes(['lv1.aaaa', 300, 3])]);
    expect([...new Uint8Array(a!)]).toEqual([10, 11, 12, 13, 14]);
    expect([...new Uint8Array(b!)]).toEqual([44, 45, 46]);
    expect(n.asked).toEqual([packUrl('lv1.aaaa')]);
    expect(packUrl('lv1.aaaa')).toMatch(/\/audio\/listen\/lv1\.aaaa\.pak$/);
    // a slice is a copy (the engine's decode detaches it): the pack's bytes are still whole for the next
    expect((await s.pack('lv1.aaaa'))!.byteLength).toBe(1000);
    expect(await s.bytes(['lv1.aaaa', 999, 5])).toBeNull(); // past its end
  });

  it('holds packs within its cap, least recently used out (the newest always); a failure isn’t kept', async () => {
    const n = net({ a: 400, b: 400, c: 400, big: 2000 });
    const s = new PackStore(n.get, 1000);
    await s.pack('a');
    await s.pack('b');
    await s.pack('a'); // a is the newest now
    await s.pack('c'); // b goes
    await s.pack('a');
    await s.pack('b');
    expect(n.asked.filter((u) => u.endsWith('/b.pak')).length).toBe(2);
    expect(n.asked.filter((u) => u.endsWith('/a.pak')).length).toBe(1);
    expect((await s.pack('big'))!.byteLength).toBe(2000); // alone over the cap: still held, the rest go
    await s.pack('big');
    expect(n.asked.filter((u) => u.endsWith('/big.pak')).length).toBe(1);
    n.off(true);
    expect(await s.pack('zzz')).toBeNull();
    n.off(false);
    expect(await s.pack('nope')).toBeNull(); // a 404
    n.off(true);
    expect(await s.bytes(['c', 0, 4])).toBeNull(); // let go (its slice asked alone), and offline now
    n.off(false);
    expect(await s.bytes(['c', 0, 4])).not.toBeNull(); // tried again
    s.clear();
    await s.pack('big');
    expect(n.asked.filter((u) => u.endsWith('/big.pak')).length).toBe(2);
  });

  it('a clip of a pack not held comes alone, as a Range (a whole answer sliced here), once though asked twice', async () => {
    for (const ranges of [true, false]) {
      const n = net({ 'lv4.bbbb': 1000 }, ranges);
      const s = new PackStore(n.get);
      const [a, b] = await Promise.all([s.bytes(['lv4.bbbb', 300, 4]), s.bytes(['lv4.bbbb', 300, 4])]);
      expect([...new Uint8Array(a!)]).toEqual([44, 45, 46, 47]);
      expect(b).not.toBe(a); // (each a copy)
      expect(n.asked).toEqual([sliceUrl(['lv4.bbbb', 300, 4])]);
      expect(sliceUrl(['lv4.bbbb', 300, 4])).toMatch(/\/listen\/lv4\.bbbb\.pak\?s=300-303$/);
    }
  });

  it('prefetch: a pack holding WHOLE_AT of the deck’s clips whole, the others’ clips alone; the first first, each once', async () => {
    const n = net({ home: 2000, x: 1000, y: 1000 });
    const s = new PackStore(n.get);
    const home = Array.from({ length: WHOLE_AT }, (_, k) => ['home', k * 100, 50] as const);
    s.prefetch([['x', 0, 40], ...home, ['y', 500, 40], ['x', 0, 40]]);
    expect(n.asked).toEqual([sliceUrl(['x', 0, 40])]);
    await s.slice(['x', 0, 40]);
    await vi.waitFor(() => expect(n.asked).toEqual([sliceUrl(['x', 0, 40]), packUrl('home'), sliceUrl(['y', 500, 40])]));
    expect([...new Uint8Array((await s.bytes(['home', 100, 2]))!)]).toEqual([100, 101]); // from the pack held
    expect(n.asked).toHaveLength(3);
  });
});

describe('voiceClip', () => {
  beforeEach(() => {
    loadVoice.mockClear();
  });

  it('decodes a loaded clip by pack and offset from its pack (the slow take from the slow pack); a clip not loaded is null', async () => {
    const { addClips } = await import('#lib/kikimimi/clips.ts');
    const sizes: Record<string, number> = { 'lv1.1111': 100, 'lv1-slow.2222': 100 };
    const n = net(sizes);
    vi.stubGlobal('fetch', n.get);
    const { voiceClip, prefetchClips } = await import('./packs.ts');
    addClips(['lv1.1111', 'lv1-slow.2222'], { q1: [231, 'abcd1234', 0, 20, 30, 1, 40, 50] }, {});
    expect(await voiceClip('q1')).not.toBeNull();
    expect(loadVoice.mock.calls[0][0]).toBe('lv1.1111:20');
    expect(new Uint8Array((await loadVoice.mock.calls[0][1]())!)[0]).toBe(20);
    expect(await voiceClip('q1', true)).not.toBeNull();
    expect(loadVoice.mock.calls[1][0]).toBe('lv1-slow.2222:40');
    expect(await voiceClip('nope')).toBeNull();
    prefetchClips(['q1', 'nope']);
    expect(n.asked.filter((u) => u.includes('lv1.1111.pak')).length).toBe(1); // (its slice, held already)
    vi.unstubAllGlobals();
  });
});
