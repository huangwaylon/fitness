// The phone's packs (packStore.ts; ききみみ's audio, the players' parts): a pack fetched whole, once though its files are
// asked for at once, held within a byte cap (the newest always, one on its way never let go), a failure not kept; a
// file's bytes a copy cut from it; prefetch asks for each pack once, the first first, and nothing more after a clear;
// with idleMs, all let go that long after the last ask.
import { describe, expect, it, vi } from 'vitest';
import { PackStore } from './packStore.ts';

/** A fake network: each pack's bytes 0, 1, 2… (mod 256), `n` long (a Range never asked: the store asks whole); counts
 *  the asks; `hold` keeps the answers until `go`. */
function net(sizes: Record<string, number>) {
  const asked: string[] = [];
  let down = false, held: { url: string; go: () => void }[] | null = null;
  const get = vi.fn(async (url: string, init?: RequestInit) => {
    asked.push(url);
    expect(new Headers(init?.headers).has('range')).toBe(false);
    if (held) await new Promise<void>((go) => held!.push({ url, go }));
    if (down) throw new TypeError('offline');
    const stem = Object.keys(sizes).find((s) => url === `/p/${s}.pak`);
    return stem ? new Response(Uint8Array.from({ length: sizes[stem] }, (_, i) => i % 256)) : new Response(null, { status: 404 });
  });
  return {
    get, asked, off: (v: boolean) => (down = v), hold: () => (held = []),
    /** The answers held let go (`url`: that one only, the rest still held). */
    go: (url?: string) => {
      const h = held ?? [];
      held = url ? h.filter((x) => x.url !== url) : null;
      h.filter((x) => !url || x.url === url).forEach((x) => x.go());
    }
  };
}
const store = (n: ReturnType<typeof net>, cap?: number) => new PackStore({ url: (s) => `/p/${s}.pak`, get: n.get, cap, tag: 't' });
const count = (n: ReturnType<typeof net>, stem: string) => n.asked.filter((u) => u === `/p/${stem}.pak`).length;

describe('PackStore', () => {
  it('fetches a pack whole, once though five of its files are asked for at once; each a copy cut from it', async () => {
    const n = net({ 'a.1': 1000 });
    const s = store(n);
    const got = await Promise.all([0, 1, 2, 3, 4].map((i) => s.bytes(['a.1', i * 100 + 10, 3])));
    expect(got.map((b) => [...new Uint8Array(b!)])).toEqual([0, 1, 2, 3, 4].map((i) => [i * 100 + 10, i * 100 + 11, i * 100 + 12].map((x) => x % 256)));
    expect(n.asked).toEqual(['/p/a.1.pak']);
    // a cut is a copy (the engine's decode detaches it): the pack is still whole for the next
    expect((await s.pack('a.1'))!.byteLength).toBe(1000);
    expect(await s.bytes(['a.1', 999, 5])).toBeNull(); // past its end
  });

  it('holds packs within its cap, least recently used out (the newest always, one on its way never); a failure isn’t kept', async () => {
    const n = net({ a: 400, b: 400, c: 400, d: 400, e: 400, big: 2000 });
    const s = store(n, 1000);
    await s.pack('a');
    await s.pack('b');
    await s.pack('a'); // a is the newest now
    await s.pack('c'); // b goes
    await s.pack('a');
    await s.pack('b');
    expect([count(n, 'a'), count(n, 'b')]).toEqual([1, 2]);
    // one on its way when a big one lands is kept: its files asked meanwhile share its fetch
    n.hold();
    s.clear();
    const late = s.pack('d'), big = s.pack('big');
    n.go('/p/big.pak');
    expect((await big)!.byteLength).toBe(2000); // alone over the cap: held all the same
    const also = s.bytes(['d', 0, 4]);
    n.go();
    expect([await late, await also].every((b) => b !== null)).toBe(true);
    expect([count(n, 'big'), count(n, 'd')]).toEqual([1, 1]);
    n.off(true);
    expect(await s.pack('zzz')).toBeNull();
    n.off(false);
    expect(await s.pack('nope')).toBeNull(); // a 404
    n.off(true);
    expect(await s.pack('e')).toBeNull();
    n.off(false);
    expect(await s.pack('e')).not.toBeNull(); // tried again
    s.clear();
    await s.pack('big');
    expect(count(n, 'big')).toBe(2);
  });

  it('the pack just in is kept though a newer one is still on its way (review 5: it was let go, then fetched again)', async () => {
    const n = net({ a: 400, big: 2000, e: 400 });
    const s = store(n, 1000);
    await s.pack('a');
    n.hold();
    const big = s.pack('big'), e = s.pack('e');
    n.go('/p/big.pak');
    await big;
    await s.bytes(['big', 0, 4]); // (its files asked as it lands: from it, not a second fetch)
    expect([count(n, 'big'), count(n, 'a')]).toEqual([1, 1]);
    n.go();
    await e;
  });

  it('prefetch: each pack once, in order, the first first; a clear meanwhile (the sheet closed) stops the rest', async () => {
    const n = net({ x: 100, home: 1000, y: 100 });
    const s = store(n);
    n.hold();
    s.prefetch(['x', 'home', 'home', 'y', 'x']);
    expect(n.asked).toEqual(['/p/x.pak']);
    n.go();
    await vi.waitFor(() => expect(n.asked).toEqual(['/p/x.pak', '/p/home.pak', '/p/y.pak']));
    await s.bytes(['home', 100, 2]);
    expect(n.asked).toHaveLength(3);
    // closed while its first is on its way: nothing after it
    const t = net({ x: 100, y: 100 });
    const s2 = store(t);
    t.hold();
    s2.prefetch(['x', 'y']);
    s2.clear();
    t.go();
    await s2.pack('x'); // (asked again after the clear)
    await new Promise((r) => setTimeout(r, 0));
    expect(t.asked).toEqual(['/p/x.pak', '/p/x.pak']);
  });

  it('dropOnHide: every pack let go as the page is hidden or goes (pagehide), asked again after', async () => {
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' }), win = new EventTarget();
    vi.stubGlobal('document', doc);
    vi.stubGlobal('window', win);
    const n = net({ a: 10 });
    const s = new PackStore({ url: (x) => `/p/${x}.pak`, get: n.get, tag: 't', dropOnHide: true });
    await s.pack('a');
    await s.pack('a');
    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    await s.pack('a');
    win.dispatchEvent(new Event('pagehide'));
    await s.pack('a');
    expect(count(n, 'a')).toBe(3);
    vi.unstubAllGlobals();
  });

  it('idleMs: every pack let go that long after the last ask, never while one is on its way', async () => {
    vi.useFakeTimers();
    const n = net({ a: 10, b: 10 });
    const s = new PackStore({ url: (x) => `/p/${x}.pak`, get: n.get, tag: 't', idleMs: 1000 });
    await s.pack('a');
    await vi.advanceTimersByTimeAsync(900);
    await s.pack('a'); // an ask holds it another second
    await vi.advanceTimersByTimeAsync(900);
    expect(count(n, 'a')).toBe(1);
    n.hold();
    const b = s.pack('b');
    await vi.advanceTimersByTimeAsync(2500); // b still on its way: a kept too
    await s.pack('a');
    expect(count(n, 'a')).toBe(1);
    n.go();
    await b;
    await vi.advanceTimersByTimeAsync(1000);
    await s.pack('a');
    await s.pack('b');
    expect([count(n, 'a'), count(n, 'b')]).toEqual([2, 2]); // let go, asked again
    vi.useRealTimers();
  });
});
