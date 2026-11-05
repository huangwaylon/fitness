import { beforeEach, describe, expect, it } from 'vitest';
import { AUDIO_CACHE, ROOM_CAP_BYTES, ROOM_KEEP_MS, foodFetch, isAudio, isFoodData, isMusic, isShellOf, keepShell, lruEvict, olderShells, precachable, roomEvict, staleCaches, staleFood, staleUse, type RoomIndex } from './caches.ts';

describe('service worker cache generations', () => {
  const keep = ['island-fonts-v1', 'island-villagers-v1'];

  it('keeps the current and the newest previous shell, and the runtime caches', () => {
    const keys = ['island-fonts-v1', 'island-shell-1', 'island-villagers-v1', 'island-shell-2', 'island-shell-3', 'island-shell-4'];
    expect(staleCaches(keys, 'island-shell-4', keep)).toEqual(['island-shell-1', 'island-shell-2']);
  });

  it('first install: nothing to delete', () => {
    expect(staleCaches(['island-shell-1'], 'island-shell-1', keep)).toEqual([]);
  });

  it('a new install copies its unchanged chunks from the older shells, the newest first', () => {
    expect(olderShells(['island-fonts-v1', 'island-shell-1', 'island-shell-2', 'island-shell-3'], 'island-shell-3')).toEqual(['island-shell-2', 'island-shell-1']);
    expect(olderShells(['island-shell-1'], 'island-shell-1')).toEqual([]);
  });

  it('drops caches from older schemes', () => {
    expect(staleCaches(['island-fonts-v0', 'island-shell-1', 'island-shell-2'], 'island-shell-2', keep)).toEqual(['island-fonts-v0']);
  });
});

describe('audio cache (an LRU per class)', () => {
  const m = (h: string) => `https://x.example/fitness/audio/music/hour-${h}.m4a?v=0a1b2c3d`;
  const kk = (id: string) => `https://x.example/fitness/audio/kk/${id}.m4a?v=0a1b2c3d`;
  const fx = (id: string) => `https://x.example/fitness/audio/sfx/${id}.m4a?v=0a1b2c3d`;

  it('keeps the 3 most recently used music files, oldest out first; a room’s track is music', () => {
    expect(lruEvict([m('07'), fx('coin'), m('08'), m('09'), m('10'), m('11')])).toEqual([m('07'), m('08')]);
    const room = 'https://x.example/fitness/audio/places/shop.m4a?v=1';
    expect(lruEvict([room, m('07'), m('08'), m('09')])).toEqual([room]);
  });

  it('K.K.’s songs have their own two: a run of songs never pushes the hours out', () => {
    expect(lruEvict([m('07'), kk('kk-a'), kk('kk-b'), kk('kk-c'), m('08')])).toEqual([kk('kk-a')]);
    expect(lruEvict([kk('kk-a'), `https://x.example/fitness/audio/kk/aircheck/kk-b.m4a?v=1`])).toEqual([]);
  });

  it('effects keep a few too (an old version of a re-cut file ages out); nothing under the limits', () => {
    expect(lruEvict([fx('coin'), m('07'), m('08')])).toEqual([]);
    const many = Array.from({ length: 10 }, (_, i) => fx(`radio-${i}`));
    expect(lruEvict(many)).toEqual(many.slice(0, 2));
  });

  it('ききみみ’s clips have their own 24: a quiz’s decks never push the effects out', () => {
    const kiki = (id: string) => `https://x.example/fitness/audio/kikimimi/${id}.m4a?v=1`;
    const clips = Array.from({ length: 26 }, (_, i) => kiki(`q${i}`));
    expect(lruEvict([fx('coin'), ...clips, fx('tap')])).toEqual(clips.slice(0, 2));
    expect([staleUse([kiki('q1'), fx('coin')], kiki('q1')), precachable('audio/kikimimi/q1.m4a')]).toEqual([false, false]);
  });

  it('a hit is re-put only when it isn’t its class’s most recent already', () => {
    const keys = [m('07'), m('08'), kk('kk-a'), fx('coin')];
    expect([staleUse(keys, m('08')), staleUse(keys, m('07')), staleUse(keys, kk('kk-a')), staleUse(keys, fx('coin'))]).toEqual([false, true, false, false]);
  });

  it('tells audio and music paths apart', () => {
    expect([isAudio('/fitness/audio/sfx/coin.m4a'), isMusic('/fitness/audio/sfx/coin.m4a'), isMusic('/fitness/audio/music/opening.m4a')]).toEqual([true, false, true]);
    // the event music sits with the hours, the rooms' too; K.K.'s songs are their own class, never precached
    expect([isMusic('/fitness/audio/music/halloween.m4a'), isMusic('/fitness/audio/places/shop.m4a'), isMusic('/fitness/audio/kk/kk-march.m4a'), precachable('audio/kk/kk-march.m4a')]).toEqual([true, true, false, false]);
    expect(isAudio('/fitness/art/fruit/peach.webp')).toBe(false);
  });

  it('the audio cache survives a new build', () => {
    expect(staleCaches([AUDIO_CACHE, 'island-shell-1', 'island-shell-2'], 'island-shell-2', [AUDIO_CACHE])).toEqual([]);
  });
});

describe('precache', () => {
  it('leaves the critters (fish, bugs, junk), the beach finds and the presents out: they are cached on first use', () => {
    for (const p of ['art/critters/sea-bass.webp', '/fitness/art/critters/common-butterfly.webp', 'art/finds/cowrie.webp', '/fitness/art/finds/t-rex-skull.webp', 'art/presents/froggy-chair.webp']) expect(precachable(p)).toBe(false);
  });
  it('leaves the app icons out: the OS fetches them when the app is added', () => {
    // the tent's room: its models, surfaces and icons, cached on first use (megabytes: never at install)
    for (const p of ['room/models/f4041.glb', '/fitness/room/wall/w4840.webp', 'room/floor/g5018.webp', 'room/icons/f4081.webp']) expect(precachable(p)).toBe(false);
    for (const p of ['icons/icon-192.png', 'icons/apple-touch-icon-180.png', '/fitness/icons/icon-512.webp']) expect(precachable(p)).toBe(false);
  });
  it('leaves the world’s winter and night looks and its decor out: cached on first use', () => {
    for (const p of ['art/deco/resident-services-winter.webp', 'art/trees/cedar-winter.webp', 'art/deco/airport-lit.webp',
      'art/deco/fence-bamboo.webp', 'art/deco/garden-lantern-white.webp', 'art/trees/bamboo.webp', 'art/flowers/purple-windflowers.webp', 'art/flowers/red-tulips.webp', 'art/flowers/pink-cosmos.webp']) expect(precachable(p)).toBe(false);
    for (const p of ['art/deco/resident-services.webp', 'art/trees/cedar.webp', 'art/bridges/stone-front.webp']) expect(precachable(p)).toBe(true);
  });
  it('keeps the shell, the default villagers and the scene art', () => {
    for (const p of ['_app/immutable/entry/app.js', 'art/fruit3d/peach.webp', 'art/villagers/goldie.webp', 'art/villagers/anchovy-icon.webp', 'manifest.webmanifest']) {
      expect(precachable(p)).toBe(true);
    }
  });
  it('leaves out audio, fonts, other villagers, the bundled manifests and .DS_Store (paths come without a leading slash)', () => {
    for (const p of ['audio/music/hour-07.m4a', 'audio/music/opening.m4a', 'audio/manifest.json', 'audio/sfx/coin.m4a',
      '_app/immutable/assets/zen-maru-gothic-54-500-normal.woff2', 'art/villagers/raymond.webp', 'art/manifest.json', 'icons/.DS_Store']) {
      expect(precachable(p)).toBe(false);
    }
    expect(precachable('/fitness/audio/music/hour-07.m4a')).toBe(false);
  });
});

describe('the offline shell from a navigation (keepShell)', () => {
  const fakeCache = (has: boolean) => {
    const puts: string[] = [];
    return { puts, cache: { match: async () => (has ? new Response('old') : undefined), put: async (k: RequestInfo | URL) => void puts.push(String(k)) } };
  };

  const html = (v: string) => `<html><script>__sveltekit_x = {\n base: "",\n version: "${v}"\n };</script></html>`;
  it('kept when this version has no shell yet (offline at install)', async () => {
    const c = fakeCache(false);
    await keepShell(c.cache as unknown as Cache, '/fitness/', new Response(html('2026-11-05.abc1234')), '2026-11-05.abc1234');
    expect(c.puts).toEqual(['/fitness/']);
  });

  it('never another build’s HTML (a deploy since: its chunks are in no cache of this version)', async () => {
    const c = fakeCache(false);
    await keepShell(c.cache as unknown as Cache, '/fitness/', new Response(html('2026-11-06.def5678')), '2026-11-05.abc1234');
    expect(c.puts).toEqual([]);
    expect(isShellOf(html('2026-11-05.abc1234'), '2026-11-05.abc1234')).toBe(true);
    expect(isShellOf(html('2026-11-05.abc12345'), '2026-11-05.abc1234')).toBe(false);
  });

  it('never over the version’s own shell (a newer build’s HTML would point at chunks no cache holds)', async () => {
    const c = fakeCache(true);
    await keepShell(c.cache as unknown as Cache, '/fitness/', new Response(html('2026-11-05.abc1234')), '2026-11-05.abc1234');
    expect(c.puts).toEqual([]);
  });

  it('never an error page', async () => {
    const c = fakeCache(false);
    await keepShell(c.cache as unknown as Cache, '/fitness/', new Response('nope', { status: 404 }), '2026-11-05.abc1234');
    expect(c.puts).toEqual([]);
  });
});

describe('food data cache', () => {
  it('is never precached, and kept apart from the art', () => {
    for (const p of ['food/index.json', 'food/products.json', '/fitness/food/verify.json']) expect(precachable(p)).toBe(false);
    expect(isFoodData('/fitness/food/foods.json')).toBe(true);
    expect(isFoodData('/fitness/art/fruit/peach.webp')).toBe(false);
  });
  it('a new data version drops the other versions’ files, never index.json', () => {
    const f = (file: string, v?: string) => `https://x.example/fitness/food/${file}${v ? `?v=${v}` : ''}`;
    expect(staleFood([f('index.json'), f('foods.json', 'aaa'), f('products.json', 'aaa'), f('foods.json', 'bbb')], 'bbb')).toEqual([f('foods.json', 'aaa'), f('products.json', 'aaa')]);
    expect(staleFood([f('index.json'), f('foods.json', 'bbb')], 'bbb')).toEqual([]);
  });
});

describe('food data fetches (foodFetch)', () => {
  const BASE = 'https://x.example/fitness/food/';
  const index = (v: string) => JSON.stringify({ version: v, datasets: [{ file: 'foods.json' }, { file: 'products.json' }] });
  const files = (v: string) => ['foods.json', 'products.json', 'verify.json'].map((f) => `${BASE}${f}?v=${v}`);
  /** A Cache in memory (keys in insertion order, as CacheStorage's). */
  class MemCache {
    m = new Map<string, string>();
    key = (r: Request | string) => (typeof r === 'string' ? r : r.url);
    async match(r: Request | string) { const b = this.m.get(this.key(r)); return b === undefined ? undefined : new Response(b); }
    async put(r: Request | string, res: Response) { this.m.set(this.key(r), await res.text()); }
    async delete(r: Request | string) { return this.m.delete(this.key(r)); }
    async keys() { return [...this.m.keys()].map((k) => new Request(k)); }
  }
  let cache: MemCache;
  let bg: Promise<unknown>[];
  /** The network: each URL's body, `slow` ms late; `offline` fails every request. */
  let served: Record<string, string>;
  let slow: number;
  let offline: boolean;
  const net = async (r: Request) => {
    if (offline) throw new TypeError('offline');
    await new Promise((ok) => setTimeout(ok, slow));
    const b = served[r.url];
    return b === undefined ? new Response('', { status: 404 }) : new Response(b);
  };
  const get = async (url: string) => {
    const res = await foodFetch(new Request(url), cache as unknown as Cache, net, (p) => bg.push(p), 40);
    return res.type === 'error' ? null : await res.text();
  };
  const settled = async () => { while (bg.length) await bg.shift(); };
  const serve = (v: string) => {
    served = { [`${BASE}index.json`]: index(v) };
    for (const f of files(v)) served[f] = `${f}-body`;
  };
  beforeEach(() => {
    cache = new MemCache();
    bg = [];
    slow = 0;
    offline = false;
    serve('aaa');
  });
  const loadAll = async (v: string) => {
    expect(await get(`${BASE}index.json`)).toBe(index(v));
    for (const f of files(v)) expect(await get(f)).toBe(`${f}-body`);
    await settled();
  };

  it('index.json from the network; offline or slower than the timeout, its cached copy at once', async () => {
    await loadAll('aaa');
    offline = true;
    expect(await get(`${BASE}index.json`)).toBe(index('aaa'));
    offline = false;
    // (the network at 200 ms, past the 40 ms timeout: settled() below waits it out, so no slower than it needs to be)
    slow = 200;
    serve('bbb');
    const t0 = Date.now();
    expect(await get(`${BASE}index.json`)).toBe(index('aaa')); // the cached copy, not the 200 ms one
    expect(Date.now() - t0).toBeLessThan(150);
    for (const f of files('aaa')) expect(await get(f)).toBe(`${f}-body`); // its files, all cached
    await settled(); // the late answer stored, for when its files come
  });

  it('index.json with nothing cached waits for the network however slow', async () => {
    slow = 100;
    expect(await get(`${BASE}index.json`)).toBe(index('aaa'));
    offline = true;
    expect(await get(`${BASE}foods.json?v=aaa`)).toBeNull();
  });

  it('a new version replaces the old only once every file it names is cached: cut off midway, the old stays whole', async () => {
    await loadAll('aaa');
    serve('bbb');
    expect(await get(`${BASE}index.json`)).toBe(index('bbb'));
    expect(await get(files('bbb')[0])).toBe(`${files('bbb')[0]}-body`);
    await settled();
    // offline midway: the cached index still names aaa, and every aaa file is there
    offline = true;
    expect(await get(`${BASE}index.json`)).toBe(index('aaa'));
    for (const f of files('aaa')) expect(await get(f)).toBe(`${f}-body`);
    // back online, the rest of bbb: now bbb is the cached one and aaa goes
    offline = false;
    expect(await get(`${BASE}index.json`)).toBe(index('bbb'));
    for (const f of files('bbb')) await get(f);
    await settled();
    expect([...cache.m.keys()].sort()).toEqual([`${BASE}index.json`, ...files('bbb')].sort());
    offline = true;
    expect(await get(`${BASE}index.json`)).toBe(index('bbb'));
  });

  it('never stores a failed answer', async () => {
    served = {};
    expect(await get(`${BASE}foods.json?v=aaa`)).toBe('');
    expect(await get(`${BASE}index.json`)).toBe('');
    await settled();
    expect(cache.m.size).toBe(0);
  });
});

describe('the room cache\'s bound (roomEvict)', () => {
  const R = 'https://x/room/';
  const day = 24 * 3600_000, now = 100 * day;
  it('a file\'s older versions go at once (a re-converted model\'s old ?v=), the newest stays', () => {
    const idx: RoomIndex = { [`${R}models/a.glb?v=1`]: [10, now - 50 * day], [`${R}models/a.glb?v=2`]: [10, now - 40 * day], [`${R}wall/w.webp`]: [5, now - 60 * day] };
    expect(roomEvict(idx, now)).toEqual([`${R}models/a.glb?v=1`]);
  });
  it('over the bound, the least recently used first, till it fits', () => {
    const idx: RoomIndex = { [`${R}a.glb?v=1`]: [20, now - 10 * day], [`${R}b.glb?v=1`]: [20, now - 30 * day], [`${R}c.glb?v=1`]: [20, now - 20 * day] };
    expect(roomEvict(idx, now, 45)).toEqual([`${R}b.glb?v=1`]);
    expect(roomEvict(idx, now, 20).sort()).toEqual([`${R}b.glb?v=1`, `${R}c.glb?v=1`]);
    expect(roomEvict(idx, now, 60)).toEqual([]);
  });
  it('never what was used lately (what the island shows now), even over the bound', () => {
    const idx: RoomIndex = { [`${R}world3d/tree.glb?v=1`]: [50, now - 1000], [`${R}player/mesh/x.glb?v=1`]: [50, now - ROOM_KEEP_MS - 1] };
    expect(roomEvict(idx, now, 10)).toEqual([`${R}player/mesh/x.glb?v=1`]);
    expect(roomEvict({ [`${R}world3d/tree.glb?v=1`]: [ROOM_CAP_BYTES * 2, now] }, now)).toEqual([]);
  });
});
