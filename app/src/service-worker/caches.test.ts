import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAP_META_CACHE, PHOTO_CACHE, PRECACHED_FONT_SLICES, TILE_CACHE, bytesEvict, carried, carryPlan, isGuidePhoto, isKikiPart, isTileJson, kikiPartOf, keepable, swrFetch, tileJsonFetch, tileKey, AUDIO_CACHE, LISTEN_CACHE, LISTEN_CAP_BYTES, LISTEN_KEEP_MS, ROOM_CAP_BYTES, ROOM_KEEP_MS, foodFetch, foodImgFetch, foodImgStale, isDecorArt, isFoodImg, isAudio, isFoodData, isListenPack, isMusic, isShellOf, isStt, keepShell, listenEvict, lruEvict, olderShells, precachable, roomEvict, staleCaches, staleFood, staleUse, type RoomIndex } from './caches.ts';

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

  it('a loose ききみみ clip from before the packs ages out with the effects (the kiki class is gone)', () => {
    const kiki = (id: string) => `https://x.example/fitness/audio/kikimimi/${id}.m4a?v=1`;
    const clips = Array.from({ length: 40 }, (_, i) => kiki(`q${i}`));
    expect(lruEvict([...clips, fx('coin'), fx('tap')])).toEqual(clips.slice(0, 34));
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
    // ききみみ's scene backdrops, at every scale
    for (const p of ['art/scene/cafe.webp', '/fitness/art/scene/gate@2x.webp', 'art/scene/living@3x.webp']) expect(precachable(p)).toBe(false);
  });
  it("leaves the maps' MapLibre out (its chunk, worker and CSS, the engines): kept once a map draws", () => {
    for (const p of ['_app/immutable/chunks/maplibre.D4lzds31.js', '/fitness/_app/immutable/workers/maplibre-gl-worker-Br3j0JGE.js', '_app/immutable/assets/maplibre.qvkd0SPb.css']) expect(precachable(p)).toBe(false);
    // the map's own light component and the rest of the chunks stay
    for (const p of ['_app/immutable/chunks/LRf9-Dmh.js', '_app/immutable/assets/TravelSheet.oVavZwKD.css']) expect(precachable(p)).toBe(true);
  });
  it("leaves ききみみ's parts out (levels/parts/*.json's chunks): kept once a game loads them, carried with MapLibre", () => {
    for (const p of ['_app/immutable/chunks/kiki-lv4-1.DjWTDWF4.js', '/fitness/_app/immutable/chunks/kiki-s2-call-b.CpMVfY-b.js']) expect([isKikiPart(p.replace(/^\/?/, '/')), precachable(p), carried(p)]).toEqual([true, false, true]);
    expect([kikiPartOf('https://x.test/fitness/_app/immutable/chunks/kiki-lv4-1.DjWTDWF4.js'), kikiPartOf('/_app/immutable/chunks/DjWTDWF4.js')]).toEqual(['kiki-lv4-1', null]);
    // ききみみ's code (its sheet, pages, lanes) stays precached; so does a chunk merely named like one
    for (const p of ['_app/immutable/chunks/Ckfv2d2q.js', '_app/immutable/assets/KikimimiSheet.x1.css', '_app/immutable/chunks/kikimimi.Ab1.js']) expect([precachable(p), carried(p)]).toEqual([true, false]);
    expect(carried('_app/immutable/chunks/maplibre.D4lzds31.js')).toBe(true);
  });
  it("an install copies the carried files an older shell holds, fetches a changed part by name and MapLibre's once a map drew", () => {
    const files = ['_app/immutable/chunks/kiki-lv1.NEW1.js', '_app/immutable/chunks/kiki-lv2.SAME.js', '_app/immutable/chunks/kiki-lv4.NEW4.js', '_app/immutable/chunks/maplibre.M2.js', '_app/immutable/assets/maplibre.C1.css'];
    const old = (p: string) => `https://x.test/fitness/_app/immutable/${p}`;
    // lv1 changed (another hash held), lv2 the same, lv4 never loaded (lv4-1 is another part); no map drawn
    expect(carryPlan(files, [old('chunks/kiki-lv1.OLD1.js'), old('chunks/kiki-lv2.SAME.js'), old('chunks/kiki-lv4-1.X.js'), old('chunks/Ab.js')]))
      .toEqual({ copy: ['_app/immutable/chunks/kiki-lv2.SAME.js'], fetch: ['_app/immutable/chunks/kiki-lv1.NEW1.js'] });
    // a map drew: its unchanged CSS copied, its changed chunk fetched
    expect(carryPlan(files, [old('assets/maplibre.C1.css')])).toEqual({ copy: ['_app/immutable/assets/maplibre.C1.css'], fetch: ['_app/immutable/chunks/maplibre.M2.js'] });
    expect(carryPlan(files, [])).toEqual({ copy: [], fetch: [] });
  });
  it("leaves ききみみ's recogniser out (the model, the runtime, its worker): only a phone that opted in fetches it", () => {
    const stt = ['stt/manifest.json', '/stt/whisper-tiny.en@2575352d/onnx/encoder_model_quantized.onnx.e93ec822.p0', '/fitness/stt/ort/1.31.0/ort-wasm-simd-threaded.asyncify.mjs',
      '_app/immutable/workers/stt.CGicPfKg.js', '/fitness/_app/immutable/workers/chunks/stt.Bx1.js'];
    for (const p of stt) expect([isStt(p.startsWith('/') ? p : `/${p}`), precachable(p)]).toEqual([true, false]);
    // the probe's own worker and chunks, and a path that merely holds the letters, stay
    for (const p of ['_app/immutable/workers/gpu.worker-CRCDFGqX.js', '/sttx/a.json', '/fitness/art/x/stt/y.webp', '_app/immutable/chunks/stt-Ab1.js']) expect([isStt(p.startsWith('/') ? p : `/${p}`), precachable(p)]).toEqual([false, true]);
  });
  it('leaves the app icons out: the OS fetches them when the app is added', () => {
    // the tent's room: its models, surfaces and icons, cached on first use (megabytes: never at install)
    for (const p of ['room/models/f4041.glb', '/fitness/room/wall/w4840.webp', 'room/floor/g5018.webp', 'room/icons/f4081.webp']) expect(precachable(p)).toBe(false);
    for (const p of ['icons/icon-192.png', 'icons/apple-touch-icon-180.png', '/fitness/icons/icon-512.webp']) expect(precachable(p)).toBe(false);
  });
  it("leaves ごはん's pictures out (cached on first use), and drops the sheets a new index no longer names", () => {
    for (const p of ['/food-img/index.json', '/fitness/food-img/t-meat-0-1a2b3c4d.webp']) expect([isFoodImg(p), precachable(p)]).toEqual([true, false]);
    const keys = ['https://x/fitness/food-img/t-meat-0-1a2b3c4d.webp', 'https://x/fitness/food-img/t-meat-0-99999999.webp', 'https://x/fitness/food-img/index.json'];
    expect(foodImgStale(keys, JSON.stringify({ sheets: ['t-meat-0-1a2b3c4d.webp'] }))).toEqual([keys[1]]);
    expect([foodImgStale(keys, 'not json'), foodImgStale(keys, '{}')]).toEqual([[], []]);
  });
  it('leaves the layout’s 2D art and the world’s winter and night looks out (the 3D island draws models): cached on first use', () => {
    for (const p of ['art/deco/resident-services-winter.webp', 'art/trees/cedar-winter.webp', 'art/deco/airport-lit.webp',
      'art/deco/fence-bamboo.webp', 'art/deco/garden-lantern-white.webp', 'art/trees/bamboo.webp', 'art/flowers/purple-windflowers.webp', 'art/flowers/red-tulips.webp', 'art/flowers/pink-cosmos.webp',
      'art/trees/cedar.webp', '/fitness/art/trees/oak-spring-canopy.webp', 'art/bushes/holly.webp', 'art/deco/airport.webp', 'art/deco/birthday-cake.webp', 'art/decor/treadmill-0.webp', 'art/bridges/stone-front.webp']) {
      expect([isDecorArt(p.replace(/^\/?/, '/')), precachable(p)]).toEqual([true, false]);
    }
    // the birthday hats: drawn by the DOM over the 3D villagers
    for (const p of ['art/deco/birthday-hat-blue.webp', '/fitness/art/deco/birthday-hat-pink.webp']) expect([isDecorArt(p.replace(/^\/?/, '/')), precachable(p)]).toEqual([false, true]);
  });
  it('keeps the shell, the default villagers and the scene art', () => {
    for (const p of ['_app/immutable/entry/app.js', 'art/fruit3d/peach.webp', 'art/villagers/goldie.webp', 'art/villagers/anchovy-icon.webp', 'manifest.webmanifest']) {
      expect(precachable(p)).toBe(true);
    }
  });
  it('leaves out audio, fonts, other villagers, the bundled manifests and .DS_Store (paths come without a leading slash)', () => {
    for (const p of ['audio/music/hour-07.m4a', 'audio/music/opening.m4a', 'audio/manifest.json', 'audio/sfx/coin.m4a',
      '_app/immutable/assets/zen-maru-gothic-54-500-normal.Dk3_x-9a.woff2', 'art/villagers/raymond.webp', 'art/manifest.json', 'icons/.DS_Store']) {
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

describe('the guides offline: what is precached', () => {
  it("a trip's cover and hero, and every trail's track; the other photos are cached on first view", () => {
    for (const p of ['travel/okinawa/hero.webp', '/fitness/travel/nz/cover.webp', 'hiking/tracks/kinpu-odarumi.json', '/fitness/hiking/tracks/lake-22.json']) expect([precachable(p), isGuidePhoto(`/${p.replace(/^\//, '')}`)]).toEqual([true, false]);
    for (const p of ['travel/okinawa/camps/katsuren-beach.webp', 'travel/seattle/lake-22.webp', 'hiking/photos/lake-22.webp']) expect([precachable(p), isGuidePhoto(`/${p}`)]).toEqual([false, true]);
  });

  it('the font slices that hold most of the app\'s characters, both weights, and Fredoka\'s Latin; the rest on first use', () => {
    for (const p of ['_app/immutable/assets/zen-maru-gothic-119-500-normal.BuX2_a-1.woff2', '_app/immutable/assets/zen-maru-gothic-119-700-normal.C9zz.woff2', '_app/immutable/assets/zen-maru-gothic-latin-700-normal.a1.woff2', '/fitness/_app/immutable/assets/fredoka-latin-600-normal.x.woff2']) expect(precachable(p)).toBe(true);
    for (const p of ['_app/immutable/assets/zen-maru-gothic-1190-500-normal.a.woff2', '_app/immutable/assets/zen-maru-gothic-6-700-normal.a.woff2', '_app/immutable/assets/zen-maru-gothic-latin-ext-500-normal.a.woff2', '_app/immutable/assets/fredoka-latin-ext-600-normal.a.woff2']) expect(precachable(p)).toBe(false);
  });

  it('every precached slice is one fonts.css loads (a renamed or dropped slice is caught)', () => {
    const css = readFileSync(new URL('../lib/styles/fonts.css', import.meta.url), 'utf8');
    for (const k of PRECACHED_FONT_SLICES) for (const w of [500, 700]) expect(css, `${k} ${w}`).toContain(`zen-maru-gothic-${k}-${w}-normal.woff2`);
  });
});

describe('the maps offline: tiles and the TileJSON', () => {
  const U = (s: string) => new URL(s);
  it("keys a tile by its URL; OpenFreeMap's without the week's build (last week's tile answers under this week's TileJSON)", () => {
    expect(tileKey(U('https://tiles.openfreemap.org/planet/20261101_080013_pt/12/3629/1612.pbf'))).toBe('https://tiles.openfreemap.org/planet/_/12/3629/1612.pbf');
    expect(tileKey(U('https://tiles.openfreemap.org/planet/20261108_080013_pt/12/3629/1612.pbf'))).toBe('https://tiles.openfreemap.org/planet/_/12/3629/1612.pbf');
    const usgs = 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/12/1430/657', gsi = 'https://cyberjapandata.gsi.go.jp/xyz/std/12/3629/1612.png';
    expect([tileKey(U(usgs)), tileKey(U(gsi))]).toEqual([usgs, gsi]);
  });
  it('the TileJSON is not a tile; no other host is either (the relay stays live)', () => {
    expect([isTileJson(U('https://tiles.openfreemap.org/planet')), tileKey(U('https://tiles.openfreemap.org/planet'))]).toEqual([true, null]);
    for (const u of ['https://relay.example/api/snapshot', 'https://tiles.openfreemap.org/fonts/x.pbf', 'https://example.com/12/1/2.png']) expect(tileKey(U(u))).toBeNull();
  });
  it('never keeps an opaque answer (it would cost quota unread), a partial or a failed one', () => {
    const opaque = { ok: false, status: 0, type: 'opaque' } as Response;
    expect([keepable(new Response('x')), keepable(opaque), keepable(new Response('x', { status: 206 })), keepable(new Response('', { status: 404 }))]).toEqual([true, false, false, false]);
  });
  it('a bounded cache lets the least recently used go till it fits (bytesEvict), never one used within keepMs', () => {
    const idx: RoomIndex = { a: [30, 1], b: [30, 3], c: [30, 2], d: [30, 9] };
    expect(bytesEvict(idx, 10, 70)).toEqual(['a', 'c']);
    expect(bytesEvict(idx, 10, 200)).toEqual([]);
    expect(bytesEvict(idx, 10, 0, 8)).toEqual(['a']);
  });
  it('the runtime caches outlive builds', () => {
    expect(staleCaches(['island-shell-1', PHOTO_CACHE, TILE_CACHE, MAP_META_CACHE, 'island-shell-2', 'island-shell-3'], 'island-shell-3', [PHOTO_CACHE, TILE_CACHE, MAP_META_CACHE])).toEqual(['island-shell-1']);
  });
});

describe('stale-while-revalidate (swrFetch: the guides\' photos, the tiles)', () => {
  class Mem {
    m = new Map<string, Response>();
    async match(k: string) { return this.m.get(k)?.clone(); }
    async put(k: string, r: Response) { this.m.set(k, r); }
  }
  let cache: Mem, bg: Promise<unknown>[], served: Record<string, string>, offline: boolean, calls: string[], t: number, used: [string, number | undefined][];
  const net = async (r: Request) => {
    calls.push(r.url);
    if (offline) throw new TypeError('offline');
    const b = served[r.url];
    return b === undefined ? new Response('', { status: 404 }) : new Response(b);
  };
  const get = async (url: string, key?: string) => {
    const res = await swrFetch(new Request(url), cache as unknown as Cache, net, (p) => bg.push(p), { key, freshMs: 100, now: () => t, used: (k, n) => void used.push([k, n]) }).catch(() => null);
    while (bg.length) await bg.shift();
    return res && res.ok ? await res.text() : null;
  };
  const P = 'https://x.example/travel/seattle/lake-22.webp';
  beforeEach(() => {
    cache = new Mem(); bg = []; served = { [P]: 'v1' }; offline = false; calls = []; t = 1000; used = [];
  });

  it('first view from the network, stored after; offline it answers from the cache', async () => {
    expect(await get(P)).toBe('v1');
    expect(used).toEqual([[P, 2]]);
    offline = true;
    expect(await get(P)).toBe('v1');
  });
  it('never seen and offline: the error (the page shows its placeholder); a 404 is never stored', async () => {
    offline = true;
    expect(await get(P)).toBeNull();
    offline = false;
    served = {};
    expect(await get(P)).toBeNull();
    expect(cache.m.size).toBe(0);
  });
  it('a stored copy at once; past freshMs refetched in the background, the next view the new one', async () => {
    await get(P);
    served[P] = 'v2';
    t += 50;
    expect(await get(P)).toBe('v1');
    expect(calls).toHaveLength(1); // fresh: not asked
    t += 100;
    expect(await get(P)).toBe('v1'); // stale: still at once, refetched behind it
    expect(calls).toHaveLength(2);
    expect(await get(P)).toBe('v2');
  });
  it('a failed revalidation keeps the stored copy', async () => {
    await get(P);
    t += 500;
    offline = true;
    expect(await get(P)).toBe('v1');
    expect(await get(P)).toBe('v1');
  });
  it('stores under its key (a tile under tileKey): another build\'s URL is answered from it', async () => {
    const a = 'https://tiles.openfreemap.org/planet/w1/1/0/0.pbf', b = 'https://tiles.openfreemap.org/planet/w2/1/0/0.pbf';
    served = { [a]: 'tile' };
    expect(await get(a, tileKey(new URL(a))!)).toBe('tile');
    offline = true;
    expect(await get(b, tileKey(new URL(b))!)).toBe('tile');
  });
});

describe("OpenFreeMap's TileJSON (tileJsonFetch)", () => {
  const J = 'https://tiles.openfreemap.org/planet';
  let m: Map<string, Response>, bg: Promise<unknown>[], body: string, offline: boolean, slow: number, t: number, calls: number;
  const cache = { match: async (k: string) => m.get(k)?.clone(), put: async (k: string, r: Response) => void m.set(k, r) } as unknown as Cache;
  const net = async () => {
    calls++;
    if (offline) throw new TypeError('offline');
    await new Promise((ok) => setTimeout(ok, slow));
    return new Response(body);
  };
  /** The answer once `ms` of the fake clock has run (the network's lateness, the 20 ms timeout), the stores settled. */
  const get = async (ms = 0) => {
    const p = tileJsonFetch(new Request(J), cache, net, (q) => bg.push(q), { ttlMs: 100, timeoutMs: 20, now: () => t }).catch(() => null);
    await vi.advanceTimersByTimeAsync(ms);
    const res = await p;
    const text = res?.ok ? await res.text() : null;
    await vi.runAllTimersAsync();
    while (bg.length) await bg.shift();
    return text;
  };
  beforeEach(() => {
    vi.useFakeTimers(); // (docs/ops/testing.md "Hermetic")
    m = new Map(); bg = []; body = 'w1'; offline = false; slow = 0; t = 0; calls = 0;
  });
  afterEach(() => vi.useRealTimers());

  it('within its TTL the stored copy without asking; past it the network; offline or slower than the timeout the stored copy', async () => {
    expect(await get()).toBe('w1');
    body = 'w2';
    t = 50;
    expect([await get(), calls]).toEqual(['w1', 1]);
    t = 200;
    expect(await get()).toBe('w2');
    t = 400;
    offline = true;
    expect(await get()).toBe('w2');
    offline = false;
    slow = 60;
    body = 'w3';
    expect(await get(20)).toBe('w2');
    // (the late answer stored for the next time)
    t = 401;
    expect(await get()).toBe('w3');
  });
  it('nothing stored and offline: the error (the map shows its route with the offline note)', async () => {
    offline = true;
    expect(await get()).toBeNull();
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
    if (slow) await new Promise((ok) => setTimeout(ok, slow));
    const b = served[r.url];
    return b === undefined ? new Response('', { status: 404 }) : new Response(b);
  };
  const get = async (url: string) => {
    const res = await foodFetch(new Request(url), cache as unknown as Cache, net, (p) => bg.push(p), 40);
    return res.type === 'error' ? null : await res.text();
  };
  /** The background work done (a late answer's timer run out on the fake clock first). */
  const settled = async () => {
    while (bg.length) {
      await vi.runAllTimersAsync();
      await bg.shift();
    }
  };
  const serve = (v: string) => {
    served = { [`${BASE}index.json`]: index(v) };
    for (const f of files(v)) served[f] = `${f}-body`;
  };
  beforeEach(() => {
    cache = new MemCache();
    bg = [];
    slow = 0;
    offline = false;
    vi.useFakeTimers(); // the network's lateness and the timeout on a fake clock (docs/ops/testing.md "Hermetic")
    serve('aaa');
  });
  afterEach(() => vi.useRealTimers());
  /** `p` once `ms` of fake time have passed: it must have answered by then. */
  const by = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
    let done = false;
    void p.then(() => (done = true), () => (done = true));
    await vi.advanceTimersByTimeAsync(ms);
    expect(done).toBe(true);
    return p;
  };
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
    // (the network at 200 ms, past the 40 ms timeout: settled() below runs it out on the fake clock)
    slow = 200;
    serve('bbb');
    expect(await by(get(`${BASE}index.json`), 40)).toBe(index('aaa')); // the cached copy at the timeout, not the 200 ms one
    for (const f of files('aaa')) expect(await get(f)).toBe(`${f}-body`); // its files, all cached
    await settled(); // the late answer stored, for when its files come
  });

  it('index.json with nothing cached waits for the network however slow', async () => {
    slow = 100;
    expect(await by(get(`${BASE}index.json`), 100)).toBe(index('aaa'));
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

describe('ききみみ’s packs (LISTEN_CACHE, listenEvict)', () => {
  const L = 'https://x.example/fitness/audio/listen/';
  const min = 60_000, now = 1000 * min;
  it('a pack is its own class: not the audio LRU’s, never precached, outliving builds', () => {
    expect([isListenPack('/fitness/audio/listen/lv4-2.1a2b3c4d.pak'), isListenPack('/audio/kikimimi/q1.m4a'), isListenPack('/audio/listen/x.json')]).toEqual([true, false, false]);
    expect(precachable('audio/listen/lv1.6fd21130.pak')).toBe(false);
    expect(staleCaches([LISTEN_CACHE, 'island-shell-a', 'island-shell-b'], 'island-shell-b', [LISTEN_CACHE])).toEqual([]);
  });
  it('over 30 MB, the least recently used pack first, till it fits', () => {
    const idx: RoomIndex = { [`${L}lv4.aaaaaaaa.pak`]: [12e6, now - 30 * min], [`${L}lv6.bbbbbbbb.pak`]: [12e6, now - 50 * min], [`${L}lv7.cccccccc.pak`]: [12e6, now - 40 * min] };
    expect(LISTEN_CAP_BYTES).toBe(30_000_000);
    expect(listenEvict(idx, now)).toEqual([`${L}lv6.bbbbbbbb.pak`]);
    expect(listenEvict(idx, now, 13e6).sort()).toEqual([`${L}lv6.bbbbbbbb.pak`, `${L}lv7.cccccccc.pak`]);
    expect(listenEvict(idx, now, 40e6)).toEqual([]);
  });
  it('never a pack used in the last 10 minutes (a game in progress), even over the bound', () => {
    const idx: RoomIndex = { [`${L}lv4-2.aaaaaaaa.pak`]: [20e6, now - 9 * min], [`${L}lv4-3.bbbbbbbb.pak`]: [20e6, now - min], [`${L}ladder.cccccccc.pak`]: [1e6, now - LISTEN_KEEP_MS - 1] };
    expect(LISTEN_KEEP_MS).toBe(10 * min);
    expect(listenEvict(idx, now)).toEqual([`${L}ladder.cccccccc.pak`]);
    expect(listenEvict({ [`${L}lv4.aaaaaaaa.pak`]: [LISTEN_CAP_BYTES * 2, now] }, now)).toEqual([]);
  });
  it('a pack’s older version (another hash) goes once unused for 10 minutes, under the bound too; the newest stays', () => {
    const idx: RoomIndex = { [`${L}lv4-2.aaaaaaaa.pak`]: [1e6, now - 20 * min], [`${L}lv4-2.bbbbbbbb.pak`]: [1e6, now - 15 * min], [`${L}lv4.cccccccc.pak`]: [1e6, now - 60 * min] };
    expect(listenEvict(idx, now)).toEqual([`${L}lv4-2.aaaaaaaa.pak`]);
    // a page still on the last build plays from the old version: kept while it's used (the other one, idle, goes)
    idx[`${L}lv4-2.aaaaaaaa.pak`][1] = now - min;
    idx[`${L}lv4-2.bbbbbbbb.pak`][1] = now - 2 * min;
    expect(listenEvict(idx, now)).toEqual([]);
  });
});

describe("ごはん's picture fetches (foodImgFetch)", () => {
  const BASE = 'https://x.example/fitness/food-img/';
  class MemCache {
    m = new Map<string, string>();
    failPut = false;
    key = (r: Request | string) => (typeof r === 'string' ? r : r.url);
    async match(r: Request | string) { const b = this.m.get(this.key(r)); return b === undefined ? undefined : new Response(b); }
    async put(r: Request | string, res: Response) { if (this.failPut) throw new Error('quota'); this.m.set(this.key(r), await res.text()); }
    async delete(r: Request | string) { return this.m.delete(this.key(r)); }
    async keys() { return [...this.m.keys()].map((k) => new Request(k)); }
  }
  let cache: MemCache, bg: Promise<unknown>[], served: Record<string, string>, slow: number, offline: boolean;
  const net = async (r: Request) => {
    if (offline) throw new TypeError('offline');
    if (slow) await new Promise((ok) => setTimeout(ok, slow));
    const b = served[r.url];
    return b === undefined ? new Response('', { status: 404 }) : new Response(b);
  };
  const get = async (f: string) => {
    const res = await foodImgFetch(new Request(BASE + f), cache as unknown as Cache, net, (p) => bg.push(p), 40);
    return res.type === 'error' ? null : await res.text();
  };
  /** The background work done (a late answer's timer run out on the fake clock first). */
  const settled = async () => {
    while (bg.length) {
      await vi.runAllTimersAsync();
      await bg.shift();
    }
  };
  beforeEach(() => {
    cache = new MemCache();
    bg = [];
    slow = 0;
    offline = false;
    vi.useFakeTimers(); // the network's lateness and the timeout on a fake clock (docs/ops/testing.md "Hermetic")
    served = { [`${BASE}index.json`]: JSON.stringify({ sheets: ['t-a-0-11111111.webp'] }), [`${BASE}t-a-0-11111111.webp`]: 'sheet' };
  });

  afterEach(() => vi.useRealTimers());
  /** `p` once `ms` of fake time have passed: it must have answered by then. */
  const by = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
    let done = false;
    void p.then(() => (done = true), () => (done = true));
    await vi.advanceTimersByTimeAsync(ms);
    expect(done).toBe(true);
    return p;
  };

  it('answers a sheet before it is stored, from the cache after; a failed store still shows it', async () => {
    cache.failPut = true;
    expect(await get('t-a-0-11111111.webp')).toBe('sheet');
    await settled();
    expect(cache.m.size).toBe(0);
    cache.failPut = false;
    await get('t-a-0-11111111.webp');
    await settled();
    offline = true;
    expect(await get('t-a-0-11111111.webp')).toBe('sheet');
  });

  it('takes index.json from the network, its cached copy when the network is slow or gone, and drops sheets it no longer names', async () => {
    cache.m.set(`${BASE}t-a-0-00000000.webp`, 'old');
    expect(await get('index.json')).toContain('11111111');
    await settled();
    expect([...cache.m.keys()]).toEqual([`${BASE}index.json`]);
    slow = 200;
    served[`${BASE}index.json`] = JSON.stringify({ sheets: ['t-a-0-22222222.webp'] });
    expect(await by(get('index.json'), 40)).toContain('11111111');
    await settled();
    offline = true;
    expect(await get('index.json')).toContain('22222222');
  });
});
