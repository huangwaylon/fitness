// マイ食品's own pictures in the service worker (caches.ts ownPhotoFetch, OWN_PHOTO_*): the relay's /img/<id> only, the
// one waiting to upload first, then the kept one, else the network's (kept when ok); at most OWN_PHOTO_MAX kept.
import { describe, expect, it } from 'vitest';
import { isOwnPhotoUrl, OWN_PHOTO_CACHE, OWN_PHOTO_MAX, OWN_PHOTO_PENDING, ownPhotoEvict, ownPhotoFetch, staleCaches } from './caches.ts';

const SELF = 'https://island-fund.pages.dev';
const RELAY = 'https://relay.example';
const ID = '0123456789abcdef0123456789abcdef';

class MemCache {
  m = new Map<string, Uint8Array>();
  async match(k: string) { const b = this.m.get(k); return b ? new Response(b as Uint8Array<ArrayBuffer>, { headers: { 'content-type': 'image/jpeg' } }) : undefined; }
  async put(k: string, r: Response) { this.m.set(k, new Uint8Array(await r.arrayBuffer())); }
}

describe('own pictures (the service worker)', () => {
  it('only a relay\'s /img/<32 hex>', () => {
    expect(isOwnPhotoUrl(new URL(`${RELAY}/img/${ID}`), SELF)).toBe(true);
    expect(isOwnPhotoUrl(new URL(`${SELF}/img/${ID}`), SELF)).toBe(false);
    expect(isOwnPhotoUrl(new URL(`${RELAY}/img/${ID}x`), SELF)).toBe(false);
    expect(isOwnPhotoUrl(new URL(`${RELAY}/api`), SELF)).toBe(false);
  });

  it('serves the pending one, then the kept one, else the network\'s (kept); a 404 is not kept; offline throws', async () => {
    const url = `${RELAY}/img/${ID}`, pending = new MemCache(), cache = new MemCache(), bg: Promise<unknown>[] = [], used: [string, number?][] = [];
    let calls = 0, offline = false, status = 200;
    const net = async () => {
      calls++;
      if (offline) throw new TypeError('offline');
      return new Response(status === 200 ? new Uint8Array([1, 2, 3]) : null, { status, headers: { 'content-type': 'image/jpeg' } });
    };
    const get = () => ownPhotoFetch(new Request(url), pending, cache, net, (p) => bg.push(p), (u, n) => used.push([u, n]));
    status = 404;
    expect((await get()).status).toBe(404);
    await Promise.all(bg);
    expect(cache.m.size).toBe(0);
    status = 200;
    expect(new Uint8Array(await (await get()).arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    await Promise.all(bg);
    expect(cache.m.get(url)).toEqual(new Uint8Array([1, 2, 3]));
    expect(used).toEqual([[url, 3]]);
    offline = true;
    expect((await get()).ok).toBe(true);
    expect(calls).toBe(2);
    expect(used.at(-1)).toEqual([url, undefined]);
    await pending.put(url, new Response(new Uint8Array([9])));
    expect(new Uint8Array(await (await get()).arrayBuffer())).toEqual(new Uint8Array([9]));
    cache.m.clear();
    pending.m.clear();
    await expect(get()).rejects.toThrow('offline');
  });

  it('keeps OWN_PHOTO_MAX, the least recently used out; both caches outlive a build', () => {
    expect(OWN_PHOTO_MAX).toBe(300);
    const idx = Object.fromEntries(Array.from({ length: 305 }, (_, i) => [`u${i}`, [30_000, 1000 + ((i * 7) % 305)] as [number, number]]));
    const out = ownPhotoEvict(idx);
    expect(out).toHaveLength(5);
    const oldest = Object.keys(idx).sort((a, b) => idx[a][1] - idx[b][1]).slice(0, 5);
    expect(out).toEqual(oldest);
    expect(ownPhotoEvict({ a: [1, 1] })).toEqual([]);
    expect(staleCaches([OWN_PHOTO_CACHE, OWN_PHOTO_PENDING, 'island-shell-1'], 'island-shell-1', [OWN_PHOTO_CACHE, OWN_PHOTO_PENDING])).toEqual([]);
  });
});
