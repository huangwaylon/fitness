import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { artEvict, ART_CAP_BYTES, ART_CAP_N, ART_KEEP_MS, copyChunks, fetchKeep, SHELLS_KEPT, SHELLS_UNSURE, liveShells, FOOD_IMG_CAP_N, TILE_CAP_N, TILE_CAP_BYTES, marked, netLog, raceShell, RACE_MS, FRESH_MS, freshNow, fromOlder, contentHash, installStatics, STATIC_HASHES, MAP_META_CACHE, PHOTO_CACHE, isSavedArea, saveFetch, savedTile, PRECACHED_FONT_SLICES, TILE_CACHE, bytesEvict, carried, carryPlan, isGuidePhoto, isTileJson, carriedNameOf, keepable, PAK_UNUSED_MS, ROOM_UNUSED_MS, ROOM_CAP_N, staleFonts, swrFetch, tileJsonFetch, tileKey, AUDIO_CACHE, ROOM_CAP_BYTES, ROOM_KEEP_MS, foodFetch, FOOD_CACHE, foodImgEvict, foodImgFetch, foodImgStale, FOOD_IMG_CAP_BYTES, isDecorArt, isFoodImg, isAudio, isFoodData, fetchShared, isMusic, isShellOf, keepShell, lruEvict, olderShells, precachable, roomEvict, roomFiles, staleCaches, staleFood, staleUse, warmable, WARM_MAX, type RoomIndex } from './caches.ts';

describe('service worker cache generations', () => {
  const keep = ['island-fonts-v1', 'island-villagers-v1'];

  it('keeps the current, the newest older shell and each open page\'s (a page a few deploys behind loads its own chunks), and the runtime caches; a page whose build isn\'t known: the SHELLS_UNSURE newest older', () => {
    const keys = ['island-fonts-v1', 'island-shell-1', 'island-villagers-v1', 'island-shell-2', 'island-shell-3', 'island-shell-4', 'island-shell-5', 'island-shell-6'];
    expect([SHELLS_KEPT, SHELLS_UNSURE]).toEqual([1, 1]);
    // every page said its build: one on 5 (a deploy behind), one on 2 (four behind, a sheet left open)
    expect(staleCaches(keys, 'island-shell-6', keep, ['island-shell-5', 'island-shell-2'])).toEqual(['island-shell-1', 'island-shell-3', 'island-shell-4']);
    // none open, or all on this build
    expect(staleCaches(keys, 'island-shell-6', keep, [])).toEqual(['island-shell-1', 'island-shell-2', 'island-shell-3', 'island-shell-4']);
    expect(staleCaches(keys, 'island-shell-6', keep, ['island-shell-6'])).toEqual(['island-shell-1', 'island-shell-2', 'island-shell-3', 'island-shell-4']);
    // one didn't say (not yet): the newest older alone (three till 2026-11-21: ~1,100 entries more); a page further
    // behind loads a chunk that went from the network, else its chunk.fail reloads it into the deployed build
    expect(staleCaches(keys, 'island-shell-6', keep, null)).toEqual(['island-shell-1', 'island-shell-2', 'island-shell-3', 'island-shell-4']);
    expect(staleCaches(keys, 'island-shell-6', keep)).toEqual(['island-shell-1', 'island-shell-2', 'island-shell-3', 'island-shell-4']);
  });

  it('the open pages\' shells: each one\'s build as it said it, null when one hasn\'t', () => {
    expect(liveShells([], {})).toEqual([]);
    expect(liveShells(['a', 'b', 'c'], { a: '5', b: '2', c: '5', gone: '1' })).toEqual(['island-shell-5', 'island-shell-2']);
    expect(liveShells(['a', 'b'], { a: '5' })).toBeNull();
    expect(liveShells(['a'], { a: 5 })).toBeNull();
  });

  it('drops the food cache of an older layout (island-food-v1: schema 1, datasets as objects) and keeps FOOD_CACHE', () => {
    expect(FOOD_CACHE).toBe('island-food-v2');
    expect(staleCaches(['island-food-v1', FOOD_CACHE, 'island-shell-1'], 'island-shell-1', [...keep, FOOD_CACHE])).toEqual(['island-food-v1']);
  });

  it("drops the retired ききみみ's caches: its packs (island-listen-v1, ≤ 30 MB) and its mic's recogniser (island-stt-v1, ~67 MB)", () => {
    expect(staleCaches(['island-listen-v1', 'island-stt-v1', 'island-shell-1'], 'island-shell-1', keep)).toEqual(['island-listen-v1', 'island-stt-v1']);
  });

  it('first install: nothing to delete', () => {
    expect(staleCaches(['island-shell-1'], 'island-shell-1', keep)).toEqual([]);
  });

  it('a new install copies its unchanged chunks from the older shells, the newest first', () => {
    expect(olderShells(['island-fonts-v1', 'island-shell-1', 'island-shell-2', 'island-shell-3'], 'island-shell-3')).toEqual(['island-shell-2', 'island-shell-1']);
    expect(olderShells(['island-shell-1'], 'island-shell-1')).toEqual([]);
  });

  it('never drops a saved map area (offline phase B), nor lets the seen tiles\' bound reach one', () => {
    const keys = ['island-offline-trip-nz', 'island-shell-1', 'island-offline-trail-lake-22', 'island-shell-2', 'island-shell-3'];
    expect(staleCaches(keys, 'island-shell-3', keep, [])).toEqual(['island-shell-1']);
    expect(isSavedArea('island-offline-trip-nz')).toBe(true);
    expect(isSavedArea(TILE_CACHE)).toBe(false);
    // the bound's index holds the seen tiles only: an area's tiles are never in it
    expect(bytesEvict({ a: [70_000_000, 1] }, 10, 60_000_000)).toEqual(['a']);
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
  it("leaves the maps' MapLibre out (its chunk, worker and CSS, the engines): kept once a map draws", () => {
    for (const p of ['_app/immutable/chunks/maplibre.D4lzds31.js', '/fitness/_app/immutable/workers/maplibre-gl-worker-Br3j0JGE.js', '_app/immutable/assets/maplibre.qvkd0SPb.css']) expect(precachable(p)).toBe(false);
    // the map's own light component and the rest of the chunks stay
    for (const p of ['_app/immutable/chunks/LRf9-Dmh.js', '_app/immutable/assets/TravelSheet.oVavZwKD.css']) expect(precachable(p)).toBe(true);
  });
  it('carries MapLibre; a plain chunk has no carried name', () => {
    expect(carried('_app/immutable/chunks/maplibre.D4lzds31.js')).toBe(true);
    expect(carriedNameOf('/_app/immutable/chunks/DjWTDWF4.js')).toBeNull();
  });
  it('leaves the features a phone may never open out (the English catalogs, the wedding board): kept once used', () => {
    const feats = ['_app/immutable/chunks/en.Ba527raq.js', '/fitness/_app/immutable/chunks/en-travel.DVtnZiTH.js', '_app/immutable/chunks/wedding.DQVcQLzo.js'];
    for (const p of feats) expect([precachable(p), carried(p)]).toEqual([false, true]);
    expect(feats.map(carriedNameOf)).toEqual(['en', 'en-travel', 'wedding']);
    // their CSS, the menu's openers and a chunk merely named like one stay
    for (const p of ['_app/immutable/assets/WeddingSheet.x1.css', '_app/immutable/chunks/Co_ed_l8.js', '_app/immutable/chunks/weddings.Ab1.js', '_app/immutable/chunks/enx.Ab1.js', '_app/immutable/chunks/hiking.Ab1.js']) expect([precachable(p), carried(p)]).toEqual([true, false]);
  });
  it("ごはん's barcode decoder (its chunk and its wasm) left out, kept once used, carried by the name scan", () => {
    const scan = ['_app/immutable/chunks/scan.B1x2.js', '/fitness/_app/immutable/assets/zxing_reader.Dq9-z.wasm'];
    for (const p of scan) expect([precachable(p), carried(p)]).toEqual([false, true]);
    expect(scan.map(carriedNameOf)).toEqual(['scan', 'scan']);
    expect(carryPlan(['_app/immutable/chunks/scan.N1.js', '_app/immutable/assets/zxing_reader.N2.wasm'], ['https://x.test/_app/immutable/chunks/scan.O1.js']).fetch).toEqual(['_app/immutable/chunks/scan.N1.js', '_app/immutable/assets/zxing_reader.N2.wasm']);
    for (const p of ['_app/immutable/chunks/scanner.Ab1.js', '_app/immutable/assets/other.Ab1.wasm']) expect(carried(p)).toBe(false);
  });
  it("英語すごろく's word lists left out, kept once used, carried by the name sg (all four once one is held)", () => {
    const sg = ['_app/immutable/chunks/sg.A1.js', '/fitness/_app/immutable/chunks/sg.B2.js'];
    for (const p of sg) expect([precachable(p), carried(p)]).toEqual([false, true]);
    expect(sg.map(carriedNameOf)).toEqual(['sg', 'sg']);
    expect(carryPlan(['_app/immutable/chunks/sg.N1.js', '_app/immutable/chunks/sg.N2.js'], ['https://x.test/_app/immutable/chunks/sg.O1.js']).fetch).toEqual(['_app/immutable/chunks/sg.N1.js', '_app/immutable/chunks/sg.N2.js']);
    for (const p of ['_app/immutable/chunks/sgx.Ab1.js', '_app/immutable/chunks/sugoroku.Ab1.js']) expect(carried(p)).toBe(false);
  });
  it('an install fetches a changed feature chunk by its name (the board: all of its chunks), the rest at first use', () => {
    const files = ['_app/immutable/chunks/en.N1.js', '_app/immutable/chunks/en-food.N2.js', '_app/immutable/chunks/en-tent.N5.js', '_app/immutable/chunks/wedding.N3.js', '_app/immutable/chunks/wedding.N4.js'];
    const old = (p: string) => `https://x.test/_app/immutable/chunks/${p}`;
    expect(carryPlan(files, [old('en.O1.js'), old('wedding.O3.js'), old('en-tent.N5.js')]))
      .toEqual({ copy: ['_app/immutable/chunks/en-tent.N5.js'], fetch: ['_app/immutable/chunks/en.N1.js', '_app/immutable/chunks/wedding.N3.js', '_app/immutable/chunks/wedding.N4.js'] });
  });
  it("an install copies the carried files an older shell holds, fetches a changed chunk by name and MapLibre's once a map drew", () => {
    const files = ['_app/immutable/chunks/en-food.NEW1.js', '_app/immutable/chunks/en-tent.SAME.js', '_app/immutable/chunks/en-gym.NEW4.js', '_app/immutable/chunks/maplibre.M2.js', '_app/immutable/assets/maplibre.C1.css'];
    const old = (p: string) => `https://x.test/fitness/_app/immutable/${p}`;
    // en-food changed (another hash held), en-tent the same, en-gym never loaded (en-gym-x is another chunk); no map drawn
    expect(carryPlan(files, [old('chunks/en-food.OLD1.js'), old('chunks/en-tent.SAME.js'), old('chunks/en-gym-x.X.js'), old('chunks/Ab.js')]))
      .toEqual({ copy: ['_app/immutable/chunks/en-tent.SAME.js'], fetch: ['_app/immutable/chunks/en-food.NEW1.js'] });
    // a map drew: its unchanged CSS copied, its changed chunk fetched
    expect(carryPlan(files, [old('assets/maplibre.C1.css')])).toEqual({ copy: ['_app/immutable/assets/maplibre.C1.css'], fetch: ['_app/immutable/chunks/maplibre.M2.js'] });
    expect(carryPlan(files, [])).toEqual({ copy: [], fetch: [] });
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
    // the products' ids (off.json, the build's cut): only its index's version kept
    const off = ['https://x/fitness/food-img/off.json?v=o1', 'https://x/fitness/food-img/off.json?v=o2'];
    expect(foodImgStale(off, JSON.stringify({ sheets: [], off: 'o2' }))).toEqual([off[0]]);
  });
  it('leaves the layout’s 2D art and the world’s winter and night looks out (the 3D island draws models): cached on first use', () => {
    for (const p of ['art/deco/resident-services-winter.webp', 'art/trees/cedar-winter.webp', 'art/deco/airport-lit.webp',
      'art/deco/fence-bamboo.webp', 'art/deco/garden-lantern-white.webp', 'art/trees/bamboo.webp', 'art/flowers/purple-windflowers.webp', 'art/flowers/red-tulips.webp', 'art/flowers/pink-cosmos.webp',
      'art/trees/cedar.webp', '/fitness/art/trees/oak-spring-canopy.webp', 'art/bushes/holly.webp', 'art/deco/airport.webp', 'art/deco/birthday-cake.webp', 'art/decor/treadmill-0.webp', 'art/bridges/stone-front.webp']) {
      expect([isDecorArt(p.replace(/^\/?/, '/')), precachable(p)]).toEqual([true, false]);
    }
    // the birthday hats too: the 3D island draws them as models (R4 step 8), no DOM over it
    for (const p of ['art/deco/birthday-hat-blue.webp', '/fitness/art/deco/birthday-hat-pink.webp']) expect([isDecorArt(p.replace(/^\/?/, '/')), precachable(p)]).toEqual([true, false]);
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

describe("an install's hashed chunks (copyChunks: kept, copied from an older shell, else fetched)", () => {
  const B = 'https://x/app/';
  /** A cache of URLs (each body its URL) that counts its matches. */
  const cacheOf = (urls: string[]) => {
    const m = new Map(urls.map((u) => [u, u]));
    const c = { matches: 0, keys: async () => [...m.keys()].map((u) => new Request(u)), match: async (u: string) => (c.matches++, m.has(u) ? new Response(m.get(u)) : undefined), put: async (u: string, r: Response) => void m.set(new URL(u, B).href, await r.text()), has: (u: string) => m.has(u) };
    return c;
  };
  it('one held already kept, one an older shell holds copied (the newest first), the rest to fetch in order; a match only for a copy', async () => {
    const own = cacheOf([`${B}_app/a.js`]), newer = cacheOf([`${B}_app/b.js`]), older = cacheOf([`${B}_app/b.js`, `${B}_app/c.js`]);
    const fetch = await copyChunks(['_app/a.js', '_app/b.js', '_app/d.js', '_app/c.js', '_app/e.js'], own, [newer, older], B);
    expect(fetch).toEqual(['_app/d.js', '_app/e.js']);
    expect([own.has(`${B}_app/b.js`), own.has(`${B}_app/c.js`)]).toEqual([true, true]);
    expect([newer.matches, older.matches]).toEqual([1, 1]);
  });
});

describe("an install's static files (installStatics: copied when unchanged, by content hash)", () => {
  const KEY = `https://x.test/${STATIC_HASHES}`;
  /** A shell: its files by path (the index's key too). */
  const shell = (files: Record<string, string> = {}) => {
    const m = new Map<string, Response>(Object.entries(files).map(([k, v]) => [k, new Response(v)]));
    return {
      m,
      match: async (k: RequestInfo | URL) => m.get(String(k))?.clone(),
      put: async (k: RequestInfo | URL, r: Response) => void m.set(String(k), r)
    };
  };
  const text = async (c: ReturnType<typeof shell>, k: string) => (await c.match(k))!.text();
  const hashOf = (s: string) => contentHash(new TextEncoder().encode(s));

  it('hashes as the build does: SHA-256, its first 8 bytes in hex', async () => {
    expect(await hashOf('abc')).toBe('ba7816bf8f01cfea');
  });

  it("copies a file an older shell recorded at the build's hash; fetches the changed, the new and the unrecorded", async () => {
    const [a, b, c, d] = await Promise.all(['A', 'B', 'C2', 'D'].map(hashOf));
    // the previous shell: a and b recorded; c at its old bytes; e held but never recorded (a failed fetch's gap)
    const prev = shell({ 'art/a.webp': 'A', 'art/b.webp': 'B', 'art/c.webp': 'C1', 'art/e.webp': 'E' });
    await prev.put(KEY, new Response(JSON.stringify({ 'art/a.webp': a, 'art/b.webp': b, 'art/c.webp': await hashOf('C1') })));
    const asked: string[] = [];
    const net = async (p: string) => (asked.push(p), new Response({ 'art/c.webp': 'C2', 'art/d.webp': 'D', 'art/e.webp': 'E' }[p] ?? '', { status: p in { 'art/c.webp': 1, 'art/d.webp': 1, 'art/e.webp': 1 } ? 200 : 404 }));
    const cache = shell();
    const files = [{ path: 'art/a.webp', hash: a }, { path: 'art/b.webp', hash: b }, { path: 'art/c.webp', hash: c }, { path: 'art/d.webp', hash: d }, { path: 'art/e.webp', hash: await hashOf('E') }];
    expect(await installStatics(files, cache, [prev], net, KEY)).toEqual({ copied: 2, fetched: 3 });
    expect(asked.sort()).toEqual(['art/c.webp', 'art/d.webp', 'art/e.webp']);
    expect(await Promise.all(['art/a.webp', 'art/b.webp', 'art/c.webp', 'art/d.webp'].map((p) => text(cache, p)))).toEqual(['A', 'B', 'C2', 'D']);
    // the next install copies all five
    const again: string[] = [];
    expect(await installStatics(files, shell(), [cache], async (p) => (again.push(p), new Response('')), KEY)).toEqual({ copied: 5, fetched: 0 });
    expect(again).toEqual([]);
  });

  it('records the hash of the bytes stored: a file the server answered with another build fetches again', async () => {
    const want = await hashOf('NEW');
    const first = shell();
    await installStatics([{ path: 'm.json', hash: want }], first, [], async () => new Response('OLD'), KEY);
    expect(JSON.parse(await text(first, KEY))).toEqual({ 'm.json': await hashOf('OLD') });
    const asked: string[] = [];
    await installStatics([{ path: 'm.json', hash: want }], shell(), [first], async (p) => (asked.push(p), new Response('NEW')), KEY);
    expect(asked).toEqual(['m.json']);
  });

  it('a fetch that fails costs that file (not recorded, not the install); a shell from before the hashes fetches all once', async () => {
    const h = await hashOf('X');
    const old = shell({ 'x.webp': 'X', 'y.webp': 'Y' }); // no index: an install from before
    const cache = shell();
    const net = async (p: string) => (p === 'y.webp' ? Promise.reject(new TypeError('offline')) : new Response('X'));
    expect(await installStatics([{ path: 'x.webp', hash: h }, { path: 'y.webp', hash: await hashOf('Y') }], cache, [old], net, KEY)).toEqual({ copied: 0, fetched: 1 });
    expect(JSON.parse(await text(cache, KEY))).toEqual({ 'x.webp': h });
    // a broken index: the same
    const broken = shell({ 'x.webp': 'X' });
    await broken.put(KEY, new Response('{'));
    expect(await installStatics([{ path: 'x.webp', hash: h }], shell(), [broken], async () => new Response('X'), KEY)).toEqual({ copied: 0, fetched: 1 });
  });

  it('the newest shell that recorded the file at this hash and still holds it', async () => {
    const h = await hashOf('Z');
    const newer = shell(), older = shell({ 'z.webp': 'Z' });
    await newer.put(KEY, new Response(JSON.stringify({ 'z.webp': h }))); // recorded, the file gone
    await older.put(KEY, new Response(JSON.stringify({ 'z.webp': h })));
    const cache = shell();
    expect(await installStatics([{ path: 'z.webp', hash: h }], cache, [newer, older], async () => new Response('net'), KEY)).toEqual({ copied: 1, fetched: 0 });
    expect(await text(cache, 'z.webp')).toBe('Z');
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
  it("a trip's cover and every trail's track; the other photos (the heroes, the wedding's banner) and the trails' net files are cached on first view", () => {
    for (const p of ['travel/okinawa/hero.webp', '/fitness/travel/nz/hero.webp', 'wedding/hero.webp', '/fitness/wedding/hero.webp']) expect([precachable(p), isGuidePhoto(`/${p.replace(/^\//, '')}`)]).toEqual([false, true]);
    for (const p of ['/fitness/travel/nz/cover.webp', 'hiking/tracks/kinpu-odarumi.json', '/fitness/hiking/tracks/lake-22.json']) expect([precachable(p), isGuidePhoto(`/${p.replace(/^\//, '')}`)]).toEqual([true, false]);
    for (const p of ['travel/okinawa/camps/katsuren-beach.webp', 'travel/seattle/lake-22.webp', 'hiking/photos/lake-22.webp', 'hiking/net/kinpu-odarumi.json', 'fitness/hiking/net/akagi-kurobi.json', 'hiking/net/LICENSE']) expect([precachable(p), isGuidePhoto(`/${p}`)]).toEqual([false, true]);
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
    // and by count: past maxN entries, the least recently used, within the bytes or not (never one used within keepMs)
    expect(bytesEvict(idx, 10, 200, 0, 2)).toEqual(['a', 'c']);
    expect(bytesEvict(idx, 10, 70, 0, 1)).toEqual(['a', 'c', 'b']);
    expect(bytesEvict(idx, 10, 200, 7.5, 1)).toEqual(['a', 'c']);
    expect([TILE_CAP_N, TILE_CAP_BYTES]).toEqual([300, 30_000_000]);
  });
  it('the runtime caches outlive builds', () => {
    expect(staleCaches(['island-shell-1', PHOTO_CACHE, TILE_CACHE, MAP_META_CACHE, 'island-shell-2', 'island-shell-3'], 'island-shell-3', [PHOTO_CACHE, TILE_CACHE, MAP_META_CACHE], [])).toEqual(['island-shell-1']);
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
  it('a new index drops the files it no longer names (a file’s other versions, a dataset gone), never index.json', () => {
    const f = (file: string, v?: string) => `https://x.example/fitness/food/${file}${v ? `?v=${v}` : ''}`;
    const keep = [f('foods.json', 'f1'), f('kalori.json', 'k2')];
    expect(staleFood([f('index.json'), f('foods.json', 'f1'), f('kalori.json', 'k1'), f('kalori.json', 'k2'), f('gone.json', 'f1')], keep)).toEqual([f('kalori.json', 'k1'), f('gone.json', 'f1')]);
    expect(staleFood([f('index.json'), ...keep], keep)).toEqual([]);
  });
});

describe('food data fetches (foodFetch)', () => {
  const BASE = 'https://x.example/fitness/food/';
  const index = (v: string) => JSON.stringify({ version: v, datasets: [{ file: 'foods.json' }, { file: 'products.json' }], files: { 'foods.json': v, 'products.json': v, 'verify.json': v } });
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

  it('each file under its own version: a refresh of one refetches that one, the rest answered from the cache', async () => {
    // (index.json's `files`: foods.json and verify.json unchanged, products.json new)
    const own = (p: string) => JSON.stringify({ version: `all-${p}`, files: { 'foods.json': 'f1', 'products.json': p, 'verify.json': 'v1' }, datasets: [{ file: 'foods.json' }, { file: 'products.json' }] });
    const urls = (p: string) => [`${BASE}foods.json?v=f1`, `${BASE}products.json?v=${p}`, `${BASE}verify.json?v=v1`];
    const serveOwn = (p: string) => {
      served = { [`${BASE}index.json`]: own(p) };
      for (const u of urls(p)) served[u] = `${u}-body`;
    };
    serveOwn('p1');
    expect(await get(`${BASE}index.json`)).toBe(own('p1'));
    for (const u of urls('p1')) await get(u);
    await settled();
    serveOwn('p2');
    const asked: string[] = [];
    const spy = async (r: Request) => (asked.push(r.url), net(r));
    const getVia = async (url: string) => (await foodFetch(new Request(url), cache as unknown as Cache, spy, (p) => bg.push(p), 40)).text();
    expect(await getVia(`${BASE}index.json`)).toBe(own('p2'));
    for (const u of urls('p2')) expect(await getVia(u)).toBe(`${u}-body`);
    await settled();
    expect(asked).toEqual([`${BASE}index.json`, `${BASE}products.json?v=p2`]);
    expect([...cache.m.keys()].sort()).toEqual([`${BASE}index.json`, ...urls('p2')].sort());
  });

  for (const dir of ['jan', 'kal'] as const) it(`a shard (${dir}/: the barcodes', the chain menus' by id): cached on use, kept while the index names its version (${dir === 'jan' ? 'jan' : 'kalori.json’s'}), dropped when it changes; never at the install`, async () => {
    const janIndex = (v: string, j: string) => {
      const x = JSON.parse(index(v));
      return JSON.stringify(dir === 'jan' ? { ...x, jan: j } : { ...x, files: { ...x.files, 'kalori.json': j } });
    };
    served[`${BASE}index.json`] = janIndex('aaa', 'j1');
    const shard = (j: string) => `${BASE}${dir}/81.json?v=${j}`;
    served[shard('j1')] = 'shard-1';
    expect(await get(`${BASE}index.json`)).toBe(janIndex('aaa', 'j1'));
    for (const f of files('aaa')) await get(f);
    expect(await get(shard('j1'))).toBe('shard-1');
    await settled();
    expect(cache.m.has(shard('j1'))).toBe(true);
    expect(cache.m.has(`${BASE}${dir}/index.json`)).toBe(false);
    // a new deploy, the same shards: kept
    serve('bbb');
    served[`${BASE}index.json`] = janIndex('bbb', 'j1');
    expect(await get(`${BASE}index.json`)).toBe(janIndex('bbb', 'j1'));
    for (const f of files('bbb')) await get(f);
    await settled();
    expect(cache.m.has(shard('j1'))).toBe(true);
    // the shards changed: the old one goes once the new index is whole
    served[`${BASE}index.json`] = janIndex('bbb', 'j2');
    await get(`${BASE}index.json`);
    await settled();
    expect(cache.m.has(shard('j1'))).toBe(false);
    expect(isFoodData(`/fitness/food/${dir}/81.json`)).toBe(true);
    expect(precachable(`food/${dir}/81.json`)).toBe(false);
    // the 3-digit shards (before 2026-11-16) under the old version: dropped by the new one's sweep; the other folder's version keeps none
    expect(staleFood([`${BASE}${dir}/881.json?v=j1`, `${BASE}${dir}/81.json?v=j2`], [], { [dir]: 'j2' })).toEqual([`${BASE}${dir}/881.json?v=j1`]);
    expect(staleFood([`${BASE}${dir}/81.json?v=j2`], [], { [dir === 'jan' ? 'kal' : 'jan']: 'j2' })).toEqual([`${BASE}${dir}/81.json?v=j2`]);
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
    const idx: RoomIndex = { [`${R}models/a.glb?v=1`]: [10, now - 5 * day], [`${R}models/a.glb?v=2`]: [10, now - 4 * day], [`${R}wall/w.webp`]: [5, now - 6 * day] };
    expect(roomEvict(idx, now)).toEqual([`${R}models/a.glb?v=1`]);
  });
  it('over the bound, the least recently used first, till it fits', () => {
    const idx: RoomIndex = { [`${R}a.glb?v=1`]: [20, now - 4 * day], [`${R}b.glb?v=1`]: [20, now - 6 * day], [`${R}c.glb?v=1`]: [20, now - 5 * day] };
    expect(roomEvict(idx, now, 45)).toEqual([`${R}b.glb?v=1`]);
    expect(roomEvict(idx, now, 20).sort()).toEqual([`${R}b.glb?v=1`, `${R}c.glb?v=1`]);
    expect(roomEvict(idx, now, 60)).toEqual([]);
  });
  it('never what was used lately (what the island shows now), even over the bound', () => {
    const idx: RoomIndex = { [`${R}world3d/tree.glb?v=1`]: [50, now - 1000], [`${R}player/mesh/x.glb?v=1`]: [50, now - ROOM_KEEP_MS - 1] };
    expect(roomEvict(idx, now, 10)).toEqual([`${R}player/mesh/x.glb?v=1`]);
    expect(roomEvict({ [`${R}world3d/tree.glb?v=1`]: [ROOM_CAP_BYTES * 2, now] }, now)).toEqual([]);
  });
  it('the island\'s KTX2s read back from the page\'s own cache (a `used` message) outlive packs used since; untold, they went first', () => {
    // (fetched once at the first launch 10 days ago; every launch since read their textures from IndexedDB)
    const tex = [`${R}tex/aaaa.ktx2p?e=1`, `${R}tex/bbbb.ktx2p?e=1`];
    const idx: RoomIndex = { [tex[0]]: [2_000_000, now - 10 * day], [tex[1]]: [1_400_000, now - 10 * day], [`${R}villagers3d/judy.glb`]: [1_500_000, now - 5 * day], [`${R}shop/counter.glb?v=1`]: [1_000_000, now - 4 * day] };
    expect(roomEvict(idx, now, 3_000_000).sort()).toEqual(tex);
    for (const u of roomFiles([...tex, 'https://y/room/tex/cccc.ktx2p', `${R.replace('/room/', '/art/')}x.webp`, 7], 'https://x')) idx[u] = [idx[u][0], now - 60_000];
    expect(roomEvict(idx, now, 3_000_000).sort()).toEqual([`${R}shop/counter.glb?v=1`, `${R}villagers3d/judy.glb`]);
    expect(Object.keys(idx)).toHaveLength(4);
  });
  it('roomFiles: ours, under /room/, each once', () => {
    expect(roomFiles([`${R}tex/a.ktx2p?e=1`, `${R}tex/a.ktx2p?e=1`, 'https://y/room/b.glb', 'https://x/art/c.webp', 'not a url', null], 'https://x')).toEqual([`${R}tex/a.ktx2p?e=1`]);
  });
  it('a player\'s pack is never precached; a part\'s old slice (?s=from-to, till 2026-11-10) goes at once', () => {
    expect(precachable('room/player/everyday.1a2b3c4d.pak')).toBe(false);
    const P = `${R}player/top-3.aaaaaaaa.pak`;
    const idx: RoomIndex = { [`${P}?s=0-99`]: [100, now - 50 * day], [`${P}?s=100-199`]: [100, now], [P]: [600_000, now - 6 * day], [`${R}player/hat.bbbbbbbb.pak?s=0-9`]: [10, now] };
    expect(roomEvict(idx, now).sort()).toEqual([`${R}player/hat.bbbbbbbb.pak?s=0-9`, `${P}?s=0-99`, `${P}?s=100-199`]);
  });
  it('a pack unused for 7 days goes whatever the bound (a repack renamed its groups, leaving the old ones); a model stays', () => {
    const idx: RoomIndex = {
      [`${R}pack/wall.2724d759.pak`]: [320_000, now - PAK_UNUSED_MS - 1], [`${R}pack/m-wall-19.8e75d3b0.pak`]: [64_000, now - PAK_UNUSED_MS + 1000],
      [`${R}player/everyday.1a2b3c4d.pak`]: [333_000, now - 8 * day], [`${R}models/a.glb?v=1`]: [10, now - 10 * day]
    };
    expect(roomEvict(idx, now).sort()).toEqual([`${R}pack/wall.2724d759.pak`, `${R}player/everyday.1a2b3c4d.pak`]);
  });
  it('any other file unused for 14 days goes whatever the bound (a visitor\'s model, a tray\'s icons seen once)', () => {
    const idx: RoomIndex = { [`${R}villagers3d/judy.glb`]: [10, now - ROOM_UNUSED_MS - 1], [`${R}icons/a.webp`]: [1, now - ROOM_UNUSED_MS + 1000], [`${R}world3d/tree.glb?v=1`]: [10, now] };
    expect(roomEvict(idx, now)).toEqual([`${R}villagers3d/judy.glb`]);
  });
  it('by count: past ROOM_CAP_N files the least recently used go, never one used within ROOM_KEEP_MS (the phones: ~1,600 of ~22 KB, far under the bytes)', () => {
    expect(ROOM_CAP_N).toBe(1000);
    const idx: RoomIndex = Object.fromEntries(Array.from({ length: ROOM_CAP_N + 3 }, (_, i) => [`${R}icons/${i}.webp`, [20_000, now - 5 * day + i]]));
    expect(roomEvict(idx, now)).toEqual([`${R}icons/0.webp`, `${R}icons/1.webp`, `${R}icons/2.webp`]);
    for (const u in idx) idx[u] = [20_000, now - 1000];
    expect(roomEvict(idx, now), 'all used lately: none').toEqual([]);
  });
  it('offline: neither the count nor the unused rule lets a file go (it couldn\'t be had again); the bytes\' bound and a stale version still do', () => {
    const many: RoomIndex = Object.fromEntries(Array.from({ length: ROOM_CAP_N + 3 }, (_, i) => [`${R}icons/${i}.webp`, [20_000, now - 5 * day + i]]));
    many[`${R}villagers3d/judy.glb`] = [10, now - ROOM_UNUSED_MS - 1];
    expect(roomEvict(many, now, undefined, undefined, undefined, false)).toEqual([]);
    const idx: RoomIndex = { [`${R}models/a.glb?v=1`]: [10, now - 5 * day], [`${R}models/a.glb?v=2`]: [10, now - 4 * day], [`${R}b.glb`]: [50, now - 6 * day] };
    expect(roomEvict(idx, now, 30, undefined, undefined, false)).toEqual([`${R}models/a.glb?v=1`, `${R}b.glb`]);
  });
  it('the font cache: the slices the build’s style sheets no longer name go (a re-subset); none if they name no font', () => {
    const F = 'https://x/fitness/_app/immutable/assets/';
    const keys = [`${F}zen-maru-gothic-93-500-normal.AAA.woff2`, `${F}zen-maru-gothic-93-500-normal.OLD.woff2`, `${F}zen-maru-gothic-90-700-normal.BBB.woff2`];
    const css = "@font-face{src:url(/fitness/_app/immutable/assets/zen-maru-gothic-93-500-normal.AAA.woff2) format('woff2')}@font-face{src:url(./zen-maru-gothic-90-700-normal.BBB.woff2)}";
    expect(staleFonts(keys, css)).toEqual([keys[1]]);
    expect(staleFonts(keys, 'body{color:red}')).toEqual([]);
  });
});

describe('the ずかん’s icon packs (the art cache, artEvict)', () => {
  const A = 'https://x.example/fitness/art/finds/pack/';
  const h = 3600_000, now = 1000 * h;
  it('cached on use in the art cache, never precached', () => {
    for (const p of ['art/finds/pack/tops.eeb71a81.pak', 'art/finds/pack/index.04376759.json']) expect([precachable(p), warmable([`https://x.example/${p}`], 'https://x.example').length]).toEqual([false, 1]);
  });
  it('a pack whose hash changed (a repack) goes at once, used lately or not; the newest name stays', () => {
    const idx: RoomIndex = {
      [`${A}tops.aaaaaaaa.pak`]: [2e5, now - 2 * h], [`${A}tops.bbbbbbbb.pak`]: [2e5, now - h], [`${A}tops-2.cccccccc.pak`]: [2e5, now - 90 * h],
      [`${A}index.dddddddd.json`]: [3e4, now - 3 * h], [`${A}index.eeeeeeee.json`]: [3e4, now], 'https://x.example/fitness/art/finds/items/fan.webp': [2e3, now - 99 * h]
    };
    expect(artEvict(idx, now).sort()).toEqual([`${A}index.dddddddd.json`, `${A}tops.aaaaaaaa.pak`]);
  });
  it('then the bound as before: the least recently used past 30 MB, never one used within 24 h', () => {
    expect([ART_CAP_BYTES, ART_KEEP_MS]).toEqual([30_000_000, 24 * h]);
    const idx: RoomIndex = { [`${A}tops.aaaaaaaa.pak`]: [20e6, now - 30 * h], [`${A}dress.bbbbbbbb.pak`]: [20e6, now - h] };
    expect(artEvict(idx, now)).toEqual([`${A}tops.aaaaaaaa.pak`]);
    idx[`${A}tops.aaaaaaaa.pak`][1] = now - 2 * h;
    expect(artEvict(idx, now)).toEqual([]);
  });
  it('and past ART_CAP_N files, the least recently used, never one used within 24 h', () => {
    expect(ART_CAP_N).toBe(500);
    const idx: RoomIndex = {};
    for (let i = 0; i < 520; i++) idx[`https://x.example/fitness/art/villagers/v${i}.webp`] = [9e3, now - (i < 30 ? 48 * h : h) - i];
    const out = artEvict(idx, now);
    expect(out).toHaveLength(20);
    expect(out.every((u) => idx[u][1] < now - 24 * h)).toBe(true);
    // all used today: none goes
    for (const u of Object.keys(idx)) idx[u][1] = now - h;
    expect(artEvict(idx, now)).toEqual([]);
  });
});

describe('fetchShared', () => {
  it('one fetch at a time per URL: a second ask meanwhile shares its answer, each its own copy; after it, a new fetch; a failure not kept', async () => {
    const flying = new Map<string, Promise<Response>>();
    let n = 0, go: () => void = () => {};
    const get = () => (n++, new Promise<Response>((r) => (go = () => r(new Response('pack')))));
    const a = fetchShared(flying, '/p.pak', get), b = fetchShared(flying, '/p.pak', get);
    go();
    expect(await Promise.all([(await a).text(), (await b).text()])).toEqual(['pack', 'pack']);
    expect(n).toBe(1);
    await Promise.resolve();
    const c = fetchShared(flying, '/p.pak', get);
    go();
    expect(await (await c).text()).toBe('pack');
    expect(n).toBe(2);
    await expect(fetchShared(flying, '/q.pak', () => Promise.reject(new TypeError('offline')))).rejects.toThrow('offline');
    await Promise.resolve();
    expect(flying.size).toBe(0);
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

  it('marks each sheet used for the bound (its bytes once stored), and the bound lets the oldest sheets go, never index.json', async () => {
    const marks: [string, number | undefined][] = [];
    const f = 't-a-0-11111111.webp';
    await foodImgFetch(new Request(BASE + f), cache as unknown as Cache, net, (p) => bg.push(p), 40, (u, n) => void marks.push([u, n]));
    await settled();
    await foodImgFetch(new Request(BASE + f), cache as unknown as Cache, net, (p) => bg.push(p), 40, (u, n) => void marks.push([u, n]));
    expect(marks).toEqual([[BASE + f, 5], [BASE + f, undefined]]);
    const MB = 1_000_000;
    const idx: RoomIndex = { [`${BASE}index.json`]: [1000, 1], [`${BASE}a.webp`]: [25 * MB, 2], [`${BASE}b.webp`]: [20 * MB, 3], [`${BASE}c.webp`]: [10 * MB, 4] };
    expect(FOOD_IMG_CAP_BYTES).toBe(40 * MB);
    expect(foodImgEvict(idx, 10)).toEqual([`${BASE}a.webp`]);
    // and past FOOD_IMG_CAP_N sheets, the least recently used (index.json not counted)
    expect(FOOD_IMG_CAP_N).toBe(300);
    expect(foodImgEvict(idx, 10, 40 * MB, 1)).toEqual([`${BASE}a.webp`, `${BASE}b.webp`]);
  });

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

describe('saved areas in the worker (offline phase B)', () => {
  const key = 'https://tiles.openfreemap.org/planet/_/12/3629/1612.pbf';
  it('a tile from the first saved area holding it; an area not there is never made', async () => {
    const asked: { key: string; cacheName?: string }[] = [];
    const held: Record<string, string> = { 'island-offline-b': 'B' };
    const store = { match: async (k: string, o?: { cacheName?: string }) => (asked.push({ key: k, cacheName: o?.cacheName }), held[o?.cacheName ?? ''] ? new Response(held[o!.cacheName!]) : undefined) };
    const hit = await savedTile(store, ['island-offline-a', 'island-offline-b', 'island-offline-c'], key);
    expect(await hit?.text()).toBe('B');
    expect(asked.map((a) => a.cacheName)).toEqual(['island-offline-a', 'island-offline-b']);
    expect(await savedTile(store, [], key)).toBeUndefined();
  });

  it("the page's save fetch: OpenFreeMap's from the network without the header; a raster tile's seen copy first", async () => {
    const nets: Request[] = [];
    const net = async (r: Request) => (nets.push(r), new Response('net'));
    const seen = { match: async () => new Response('seen') };
    const ofm = new Request('https://tiles.openfreemap.org/planet/20261101_080013_pt/12/3629/1612.pbf', { headers: { 'x-island-save': '1' } });
    expect(await (await saveFetch(ofm, seen, key, net)).text()).toBe('net');
    expect(nets[0].headers.has('x-island-save')).toBe(false);
    const usgs = 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/14/5000/2600';
    expect(await (await saveFetch(new Request(usgs), seen, usgs, net)).text()).toBe('seen');
    expect(await (await saveFetch(new Request(usgs), { match: async () => undefined }, usgs, net)).text()).toBe('net');
  });
});

describe('a cache-first miss (fetchKeep)', () => {
  it('storage full: the copy fails, the answer still comes (health, sync #23)', async () => {
    const waits: Promise<unknown>[] = [];
    const res = await fetchKeep(new Request('https://x.test/a.webp'), async () => new Response('art'), async () => {
      throw new DOMException('quota', 'QuotaExceededError');
    }, (p) => void waits.push(p));
    expect(await res.text()).toBe('art');
    await expect(Promise.all(waits)).resolves.toBeDefined();
  });

  it('a failed answer is never kept', async () => {
    const kept: Response[] = [];
    const res = await fetchKeep(new Request('https://x.test/b.webp'), async () => new Response('', { status: 404 }), async (r) => void kept.push(r), () => {});
    expect(res.status).toBe(404);
    expect(kept).toEqual([]);
  });
});

describe("a first launch's files kept once the worker is in (warmable)", () => {
  const O = 'https://island.test';
  it('the room\'s and the on-use art, ours only, each once; not the precached villagers, the chunks, a relay or a bad URL', () => {
    const urls = [`${O}/room/world3d/tree.glb?v=1`, `${O}/room/tex/ab.ktx2p?e=2`, `${O}/room/world3d/tree.glb?v=1`, `${O}/room/player/everyday.12345678.pak`, `${O}/art/villagers/goldie.webp`,
      `${O}/art/villagers/bob-icon.webp`, `${O}/terrain/nh/sand.webp?v=3`, `${O}/art/critters/fish/koi.webp`, `${O}/_app/immutable/chunks/x.js`, 'https://relay.test/room/x', 'nope', 7];
    expect(warmable(urls, O)).toEqual([`${O}/room/world3d/tree.glb?v=1`, `${O}/room/tex/ab.ktx2p?e=2`, `${O}/room/player/everyday.12345678.pak`, `${O}/art/villagers/bob-icon.webp`, `${O}/terrain/nh/sand.webp?v=3`, `${O}/art/critters/fish/koi.webp`]);
  });
  it('at most WARM_MAX', () => {
    expect(warmable(Array.from({ length: WARM_MAX + 5 }, (_, i) => `${O}/room/m${i}.glb`), O)).toHaveLength(WARM_MAX);
  });
});

describe('a launch races the network for the shell (raceShell)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const V = '2026-11-14.aaaaaaa';
  const html = (v: string) => `<html><script>__sveltekit = { version: ${JSON.stringify(v)} }</script></html>`;
  const page = (body = html('next'), init: ResponseInit = {}, type = 'basic') => {
    const r = new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8' }, ...init });
    Object.defineProperty(r, 'type', { value: type });
    return r;
  };
  const own = () => page(html(V));
  const later = <T,>(ms: number, v: T) => new Promise<T>((r) => setTimeout(r, ms, v));
  /** A page whose headers come at `head` ms and its body at `body` ms. */
  const slowBody = (head: number, body: number) => later(head, page(new ReadableStream({ start: (c) => void setTimeout(() => (c.enqueue(new TextEncoder().encode(html('next'))), c.close()), body - head) }) as unknown as BodyInit));

  it('another build\'s whole page in time: still the cached shell, every chunk its own (`new`: the deploy taken at the next hide, never booted under this worker), the race\'s ms said', async () => {
    const p = raceShell(own(), later(120, page()), V);
    await vi.advanceTimersByTimeAsync(120);
    const { res, from, ms } = await p;
    expect([from, ms]).toEqual(['new', 120]);
    expect(await res.text()).toBe(html(V));
  });
  it('the race\'s ms from the navigation\'s event: a page in before the race began (the preload\'s) says how long it took, not 0', async () => {
    const t0 = Date.now();
    await vi.advanceTimersByTimeAsync(90);
    const { from, ms } = await raceShell(own(), Promise.resolve(page()), V, RACE_MS, Date.now, t0);
    expect([from, ms]).toEqual(['new', 90]);
  });
  it('this build\'s own page from the network: the cached shell (its chunks all cached), `same`', async () => {
    const p = raceShell(own(), later(80, page(html(V))), V);
    await vi.advanceTimersByTimeAsync(80);
    const { res, from } = await p;
    expect(from).toBe('same');
    expect(await res.text()).toBe(html(V));
  });
  it('headers in time but the body late (one bar): the cached shell at RACE_MS, not a wait on the body (review 11-14 #1)', async () => {
    const p = raceShell(own(), slowBody(50, 5000), V);
    await vi.advanceTimersByTimeAsync(RACE_MS);
    const { res, from, ms } = await p;
    expect([from, ms]).toEqual(['cache', RACE_MS]);
    expect(await res.text()).toBe(html(V));
    await vi.advanceTimersByTimeAsync(5000);
  });
  it('late altogether: the cached shell at RACE_MS, the late answer let go', async () => {
    const late = page();
    const cancel = vi.spyOn(late.body!, 'cancel');
    const p = raceShell(own(), later(RACE_MS + 500, late), V);
    await vi.advanceTimersByTimeAsync(RACE_MS);
    expect((await p).from).toBe('cache');
    await vi.advanceTimersByTimeAsync(500);
    expect(cancel).not.toHaveBeenCalled(); // (read, not cancelled: its text, dropped)
  });
  it('offline (no ask) or a failed one: the cached shell at once', async () => {
    expect((await raceShell(own(), null, V)).from).toBe('cache');
    expect((await raceShell(own(), Promise.reject(new TypeError('offline')), V)).from).toBe('cache');
  });
  it('the SPA fallback (404.html is index.html) names its build; an error, a redirect, or not HTML does not', async () => {
    expect((await raceShell(own(), Promise.resolve(page(html('next'), { status: 404 })), V)).from).toBe('new');
    expect((await raceShell(own(), Promise.resolve(page('oops', { status: 503 })), V)).from).toBe('cache');
    const json = new Response('{}', { headers: { 'content-type': 'application/json' } });
    Object.defineProperty(json, 'type', { value: 'basic' });
    expect((await raceShell(own(), Promise.resolve(json), V)).from).toBe('cache');
    expect((await raceShell(own(), Promise.resolve(page('', {}, 'opaqueredirect')), V)).from).toBe('cache');
  });
  it('freshNow: the network named this build the deployed one within FRESH_MS', () => {
    expect(freshNow(1000, 1000 + FRESH_MS - 1)).toBe(true);
    expect(freshNow(1000, 1000 + FRESH_MS)).toBe(false);
    expect(freshNow(null, 5)).toBe(false);
    expect(freshNow(5000, 1000), 'a clock moved back: race').toBe(false);
  });
  it('marked: the answer says where it came from and the race\'s ms (Server-Timing), its own headers (the CSP) kept', async () => {
    const res = marked({ res: page('x', { headers: { 'content-type': 'text/html', 'content-security-policy': "script-src 'sha256-a'" } }), from: 'new', ms: 183 });
    expect(res.headers.get('server-timing')).toBe('shell;desc=new;dur=183');
    expect(res.headers.get('content-security-policy')).toBe("script-src 'sha256-a'");
    expect(await res.text()).toBe('x');
  });
  it('marked: with the fetch event\'s clock, a t0 entry (the page\'s pre) and whether the worker had just started', () => {
    const res = marked({ res: page('x'), from: 'skip', ms: 0 }, { t0: 1763150000123, cold: true });
    expect(res.headers.get('server-timing')).toBe('shell;desc=skip;dur=0, t0;desc=1;dur=1763150000123');
  });
  it('marked: the worker\'s steps (ms from the fetch event: perf.boot swUp, swOwn, swFresh, swAns), one not over left out', () => {
    const res = marked({ res: page('x'), from: 'skip', ms: 0 }, { t0: 1000, cold: true, steps: { up: 40.4, own: 212.6, fresh: undefined } }, 1231);
    expect(res.headers.get('server-timing')).toBe('shell;desc=skip;dur=0, t0;desc=1;dur=1000, sw;desc=up;dur=40, sw;desc=own;dur=213, sw;desc=ans;dur=231');
  });
  it('netLog: the worker\'s network fetches since a time, its room files and KB (Content-Length, else the size its index took), the last `keep`', async () => {
    const log = netLog(3);
    await log.track(Promise.resolve(new Response('', { headers: { 'content-length': '2048' } })), 'https://x/room/world3d/a.glb', 100);
    const chunked = await log.track(Promise.resolve(new Response('a'.repeat(3000))), 'https://x/room/b.glb', 200);
    expect((await chunked.text()).length, 'the page\'s answer whole').toBe(3000);
    await log.track(Promise.resolve(new Response('', { headers: { 'content-length': '1024' } })), 'https://x/room/c.ktx2', 300);
    expect(log.since(150), 'no Content-Length, no size yet: 0').toEqual({ swNet: 2, swRoom: 2, swKB: 1 });
    log.sized('https://x/room/b.glb', 3072);
    log.sized('https://x/room/c.ktx2', 9999);
    expect(log.since(150), 'the index\'s size; a Content-Length kept').toEqual({ swNet: 2, swRoom: 2, swKB: 4 });
    expect(log.since(0)).toEqual({ swNet: 3, swRoom: 3, swKB: 6 });
    await log.track(Promise.resolve(new Response('')), 'https://x/d', 400);
    expect(log.since(0), 'the first gone past keep').toEqual({ swNet: 3, swRoom: 2, swKB: 4 });
  });
  it('fromOlder: the older shells\' copy newest first (caches.match answers the oldest: review 11-14 #3)', async () => {
    const store = new Map<string, Map<string, string>>([['island-shell-A', new Map([['/', 'A']])], ['island-shell-B', new Map([['/', 'B']])], ['island-shell-C', new Map([['/x', 'C']])], ['island-shell-D', new Map()]]);
    const cs = { keys: async () => [...store.keys()], open: async (k: string) => ({ match: async (r: string) => (store.get(k)!.has(r) ? new Response(store.get(k)!.get(r)) : undefined) }) } as unknown as CacheStorage;
    expect(await (await fromOlder(cs, 'island-shell-D', '/'))!.text()).toBe('B');
    expect(await fromOlder(cs, 'island-shell-D', '/none')).toBeUndefined();
  });
});
