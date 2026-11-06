// The phone's audio packs (packs.ts): a pack fetched whole (never a Range), once at a time, held within a byte cap
// (the newest always), a failure not kept; a clip's bytes the copy of its slice; voiceClip keys the engine's decoded
// clips by pack and offset and slices from the right pack (slow takes from the slow pack); prefetch asks once a pack.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadVoice = vi.fn(async (_key: string, bytes: () => Promise<ArrayBuffer | null>) => ((await bytes()) ? ({ duration: 1 } as AudioBuffer) : null));
vi.mock('#lib/sound/sound.svelte.ts', () => ({ loadVoice: (k: string, b: () => Promise<ArrayBuffer | null>) => loadVoice(k, b) }));

const { PackStore, packUrl } = await import('./packs.ts');

/** A fake network: each pack's bytes 0, 1, 2… (mod 256), `n` long; counts the asks, records each request's headers. */
function net(sizes: Record<string, number>) {
  const asked: string[] = [];
  let down = false;
  const get = vi.fn(async (url: string, init?: RequestInit) => {
    asked.push(url);
    expect(new Headers(init?.headers).has('range')).toBe(false);
    if (down) throw new TypeError('offline');
    const stem = Object.keys(sizes).find((s) => url.endsWith(`/listen/${s}.pak`));
    if (!stem) return new Response(null, { status: 404 });
    return new Response(Uint8Array.from({ length: sizes[stem] }, (_, i) => i % 256));
  });
  return { get, asked, off: (v: boolean) => (down = v) };
}

describe('PackStore', () => {
  it('fetches a pack whole, once though asked twice at once; a clip is a copy of its slice', async () => {
    const n = net({ 'lv1.aaaa': 1000 });
    const s = new PackStore(n.get);
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
    expect(await s.bytes(['c', 0, 4])).toBeNull(); // let go, and offline now
    n.off(false);
    expect(await s.bytes(['c', 0, 4])).not.toBeNull(); // tried again
    s.clear();
    await s.pack('big');
    expect(n.asked.filter((u) => u.endsWith('/big.pak')).length).toBe(2);
  });

  it('prefetch asks for each pack once, the first alone (the rest once it is in)', async () => {
    const n = net({ x: 10, y: 10, z: 10 });
    const s = new PackStore(n.get);
    s.prefetch(['x', 'y', 'x', 'z']);
    expect(n.asked.map((u) => u.split('/').at(-1))).toEqual(['x.pak']);
    await s.pack('x');
    await vi.waitFor(() => expect(n.asked.map((u) => u.split('/').at(-1))).toEqual(['x.pak', 'y.pak', 'z.pak']));
    s.prefetch(['y']);
    await s.pack('z');
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
    expect(n.asked.filter((u) => u.endsWith('lv1.1111.pak')).length).toBe(1); // held already
    vi.unstubAllGlobals();
  });
});
