// Island Fund service worker: caches the app shell so the PWA opens offline. (No push or notificationclick handlers:
// notifications are gone, 2026-11-02.)
import { self } from '$app/service-worker';
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';
import { MAP_META_CACHE, PHOTO_CACHE, PHOTO_CAP_BYTES, PHOTO_FRESH_MS, TILE_CACHE, TILE_CAP_BYTES, TILE_FRESH_MS, bytesEvict, carried, isSavedArea, SAVE_HEADER, saveFetch, savedTile, carryPlan, isGuidePhoto, isTileJson, swrFetch, tileJsonFetch, tileKey, AUDIO_CACHE, FOOD_CACHE, FOOD_IMG_CACHE, LISTEN_CACHE, LISTEN_INDEX, foodImgFetch, isFoodImg, ROOM_CACHE, ROOM_INDEX, SHELL, STT_CACHE, isStt, foodFetch, listenEvict, roomEvict, type RoomIndex, isAudio, isListenPack, isShellOf, isFoodData, isCritterArt, isDecorArt, isFont, isRoomAsset, isVillagerArt, installStatics, keepShell, STATIC_HASHES, type StaticFile, lruEvict, olderShells, precachable, staleCaches, staleUse } from './caches.ts';

// The app may live under a base path (BASE_PATH); the registration scope carries it.
const SCOPE = new URL(self.registration.scope).pathname;

const CACHE = `${SHELL}${version}`;
const FONTS = 'island-fonts-v1';
/** A first visit's navigation (no shell of this version cached yet) on a slow network (one bar, a captive portal) must
 *  not hang the launch: after this an older version's cached shell opens, if there is one. */
const NAV_TIMEOUT_MS = 3000;
// Villager art: 440 villagers × render + icon (~12 MB) is too much to download at install. Only the two
// default villagers are precached; every other render/icon is cached on first use, in a cache that outlives builds
// (bump the suffix if villager art is re-fetched under the same paths).
const VILLAGERS = 'island-villagers-v1';

// Precache built JS/CSS + static files (caches.ts precachable): the common font slices (the rest, many files, are
// cached on first use); the art and audio manifests are bundled into the JS (lib/art.ts, lib/sound/manifest.ts), so
// their files are never fetched. Villager art: see VILLAGERS. Audio (~14 MB of hourly music, off by default) is
// never precached: AUDIO_CACHE. Nor the maps' MapLibre (its chunk, worker and CSS, the engines) and ききみみ's parts:
// kept in the shell the first time they're used, then carried by each install (CARRIED; caches.ts carryPlan).
const CHUNKS = immutable.map((f) => f.path).filter(precachable);
const CARRIED = immutable.map((f) => f.path).filter(carried);
/** The static files, each with its content hash (vite.config.ts swPrecacheOnly writes it into the manifest). */
const STATICS = (assets as unknown as StaticFile[]).filter((f) => precachable(f.path));
/** Checked with the server past the browser's HTTP cache (a host's own max-age): a static file or the shell
 *  fetched within 10 minutes before a deploy would otherwise be stored stale for the whole version. The hashed chunks
 *  can't be stale. */
const fresh = (path: string) => new Request(path, { cache: 'no-cache' });

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // a hashed chunk an older shell holds is the very same file: copied over, not downloaded again (each deploy
      // fetched every chunk and font anew, ~3 MB; now only what changed); one this version's own cache holds already
      // (a worker reinstalled under the same version: the e2e's deploy) kept as it is (it fetched all ~650 again)
      const olds = await Promise.all(olderShells(await caches.keys(), CACHE).map((k) => caches.open(k)));
      const chunks: string[] = [];
      for (const p of CHUNKS) {
        if (await cache.match(p)) continue;
        let hit: Response | undefined;
        for (const c of olds) if ((hit = await c.match(p))) break;
        if (hit) await cache.put(p, hit);
        else chunks.push(p);
      }
      // the build's code all or nothing: a chunk not fetched fails the install (the page keeps its worker and asks
      // again later: ui-state/reload.ts newWorker); the static files (the art, the manifest: ~300) each on its own, so
      // one that fails costs that file (served from the previous shell's copy or the network: `cached`), not the
      // install (one flaky fetch of ~370 failed it, and every resume's update with it), an unchanged one copied from an
      // older shell (caches.ts installStatics: by its content hash)
      await cache.addAll(chunks);
      // what this phone used of MapLibre and ききみみ's parts (an older shell holds it): an unchanged file copied, a
      // changed one fetched (each on its own: a miss costs only that map or game offline till it's used again)
      const held = (await Promise.all(olds.map((c) => c.keys()))).flat().map((r) => r.url);
      const plan = carryPlan(CARRIED, held);
      for (const p of plan.copy) {
        for (const c of olds) {
          const hit = await c.match(p);
          if (hit) {
            await cache.put(p, hit);
            break;
          }
        }
      }
      await Promise.allSettled(plan.fetch.map((p) => cache.add(p)));
      // (this version's own cache first: a worker reinstalled under the same version, the e2e's deploy, has its files)
      await installStatics(STATICS, cache, [cache, ...olds], (p) => fetch(fresh(p)), new URL(STATIC_HASHES, self.registration.scope).href);
      // The SPA shell (ssr = false): any navigation can be served by the scope root. Only this build's (a deploy
      // landing during the install would give a newer build's HTML, whose chunks this cache hasn't): else none, and
      // navigations go to the network till a newer worker installs its own.
      try {
        const res = await fetch(fresh(SCOPE));
        if (res.ok && isShellOf(await res.clone().text(), version)) await cache.put(SCOPE, res);
      } catch {
        /* offline at install; the shell is cached on the next navigation */
      }
      await self.skipWaiting();
    })()
  );
});

// Keep one previous shell generation: a page still running the old build (claimed below) loads its lazy chunks
// (きろく, the harvest) from it instead of a 404, until it reloads into the new build (ui-state/reload.ts).
// caches.keys() lists caches in creation order, so the newest older shell is the last one before ours.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of staleCaches(await caches.keys(), CACHE, [FONTS, VILLAGERS, AUDIO_CACHE, ROOM_CACHE, FOOD_CACHE, FOOD_IMG_CACHE, LISTEN_CACHE, STT_CACHE, PHOTO_CACHE, TILE_CACHE, MAP_META_CACHE])) await caches.delete(key); // (never a saved area: caches.ts isSavedArea)
      await self.clients.claim();
    })()
  );
});

// A cache bounded by bytes (the room's, caches.ts roomEvict; ききみみ's packs', listenEvict): its index (each file's
// bytes and last use) in memory while the worker runs, kept in the cache itself a moment after a change, with the files
// it lets go deleted then. Read back (and matched to the cache's files: one put as the worker was stopped is counted
// then) the first time the cache is asked for. A cache from before the index is counted whole once, every file used now
// in the cache's order (the room's older versions go at once; the rest only after its keep time unused).
const sizeOf = async (res: Response): Promise<number> => (await res.blob()).size;
function boundedCache(name: string, indexPath: string, evict: (idx: RoomIndex, now: number) => string[]): (url: string, bytes?: number) => Promise<void> {
  const indexUrl = new URL(indexPath, self.registration.scope).href;
  let index: Promise<RoomIndex> | null = null;
  const indexOf = (cache: Cache): Promise<RoomIndex> =>
    (index ??= (async () => {
      let idx: RoomIndex = {};
      try {
        const kept = await cache.match(indexUrl);
        if (kept) idx = (await kept.json()) as RoomIndex;
      } catch {
        idx = {};
      }
      const urls = (await cache.keys()).map((k) => k.url).filter((u) => u !== indexUrl);
      const have = new Set(urls), now = Date.now();
      for (const u of Object.keys(idx)) if (!have.has(u)) delete idx[u];
      for (let i = 0; i < urls.length; i++) {
        if (idx[urls[i]]) continue;
        const res = await cache.match(urls[i]);
        idx[urls[i]] = [res ? await sizeOf(res).catch(() => 0) : 0, now - urls.length + i];
      }
      return idx;
    })().catch((e: unknown) => {
      index = null;
      throw e;
    }));
  let tidy: Promise<void> | null = null;
  /** A file used (and its bytes, when it was just stored); the index kept and the files over the bound let go a
   *  moment later (one write for a burst of files). */
  return async (url, bytes) => {
    const cache = await caches.open(name);
    const idx = await indexOf(cache);
    idx[url] = [bytes ?? idx[url]?.[0] ?? 0, Date.now()];
    return (tidy ??= new Promise((r) => setTimeout(r, 2000)).then(async () => {
      tidy = null;
      for (const u of evict(idx, Date.now())) {
        await cache.delete(u);
        delete idx[u];
      }
      await cache.put(indexUrl, new Response(JSON.stringify(idx), { headers: { 'content-type': 'application/json' } }));
    }));
  };
}
const roomUsed = boundedCache(ROOM_CACHE, ROOM_INDEX, (idx, now) => roomEvict(idx, now));
const listenUsed = boundedCache(LISTEN_CACHE, LISTEN_INDEX, (idx, now) => listenEvict(idx, now));
const photoUsed = boundedCache(PHOTO_CACHE, '__photo-index', (idx, now) => bytesEvict(idx, now, PHOTO_CAP_BYTES));
const tileUsed = boundedCache(TILE_CACHE, '__tile-index', (idx, now) => bytesEvict(idx, now, TILE_CAP_BYTES));

/** The saved areas' caches (offline phase B, lib/offline/save.ts), listed again at most every 2 s (a burst of tiles
 *  asks once). */
let areas: { at: number; names: Promise<string[]> } | null = null;
const savedAreas = (): Promise<string[]> => {
  if (!areas || Date.now() - areas.at > 2000) areas = { at: Date.now(), names: caches.keys().then((k) => k.filter(isSavedArea), () => []) };
  return areas.names;
};

/** A map tile (its key: caches.ts tileKey): the saved areas' first (never revalidated: an area keeps the build it was
 *  saved at, outside the seen tiles' bound), then the seen tiles, else the network (kept after). The one place a tile
 *  is looked up. The page's own fetch of a tile to save (SAVE_HEADER) skips both: caches.ts saveFetch. */
async function serveTile(event: FetchEvent, key: string): Promise<Response> {
  const seen = await caches.open(TILE_CACHE);
  if (event.request.headers.has(SAVE_HEADER)) return saveFetch(event.request, seen, key, (r) => fetch(r));
  const saved = await savedTile(caches, await savedAreas(), key);
  if (saved) return saved;
  // offline, a tile neither saved nor seen isn't asked of the network at all (a map past its saved area)
  return swrFetch(event.request, seen, (r) => (self.navigator.onLine === false ? Promise.reject(new TypeError('offline')) : fetch(r)), (p) => event.waitUntil(p), { key, freshMs: TILE_FRESH_MS, used: (k, n) => event.waitUntil(tileUsed(k, n).catch(() => {})) });
}

/** Ours first (a static file may change under the same path), then the previous generation's. */
async function cached(req: Request | string): Promise<Response | undefined> {
  return (await (await caches.open(CACHE)).match(req)) ?? (await caches.match(req));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    // the maps' tiles: a saved area's, else as a map draws them, kept, bounded (60 MB, least recently used out),
    // refetched in the background past TILE_FRESH_MS; the TileJSON from the network within its TTL's rule, offline
    // with none kept a saved area's copy (the build its tiles are)
    const tile = tileKey(url);
    if (tile) event.respondWith(serveTile(event, tile));
    else if (isTileJson(url)) {
      event.respondWith(caches.open(MAP_META_CACHE).then((cache) => tileJsonFetch(req, cache, (r) => fetch(r), (p) => event.waitUntil(p))).catch(() => null)
        .then(async (res) => (res?.ok ? res : ((await savedTile(caches, await savedAreas(), req.url)) ?? res ?? Response.error()))));
    }
    return; // the relay (the record, the room): always live
  }

  // Stale-while-revalidate: this version's cached shell at once (its chunks are in the same cache: installed together),
  // never a wait on the network. The revalidation is the worker's own: the browser checks for a new service worker on
  // each navigation (every deploy changes it: its version), the new one installs its build's shell and chunks, skips
  // waiting and claims the page; the page sees the deploy (Kit's _app/version.json check on resume) and reloads once
  // the new worker controls it (ui-state/reload.ts updateReload). No shell of this version yet (a first visit, or
  // offline at install): network first, an older version's shell offline or after 3 s; the response becomes this
  // version's shell if it is this build's (keepShell).
  if (req.mode === 'navigate') {
    const own = caches.open(CACHE).then((c) => c.match(SCOPE)).catch(() => undefined);
    const net = own.then((hit) => (hit ? null : fetch(req)));
    // cloned in the first callback on `net`, before respondWith below can hand the body to the page
    event.waitUntil(
      net.then((res) => {
        if (!res) return;
        const copy = res.clone();
        return caches.open(CACHE).then((c) => keepShell(c, SCOPE, copy, version));
      }).catch(() => {})
    );
    event.respondWith(
      (async () => {
        const hit = await own;
        if (hit) return hit;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const late = new Promise<null>((r) => (timer = setTimeout(r, NAV_TIMEOUT_MS, null)));
        const first = await Promise.race([net.catch(() => null), late]);
        clearTimeout(timer);
        if (first) return first;
        return (await cached(SCOPE)) ?? net.then((r) => r ?? Response.error(), () => Response.error());
      })()
    );
    return;
  }

  // ききみみ's recogniser (caches.ts isStt: the model, the runtime, its worker): from STT_CACHE, which the page fills on
  // the probe's tap (lib/mic/models.ts ensureStt), else the network; never stored here (the parts would be twice)
  if (isStt(url.pathname)) {
    event.respondWith(caches.open(STT_CACHE).then((c) => c.match(req)).then((hit) => hit ?? fetch(req)));
    return;
  }

  // ききみみ's packs: cache first and never revalidated (the hash is in the name), fetched whole (packs.ts; a Range
  // request goes to the network), stored after the answer; each use marks the pack in the index, the least recently
  // used going past the cache's bytes, never one used in the last 10 minutes (caches.ts listenEvict).
  if (isListenPack(url.pathname)) {
    if (req.headers.has('range')) return;
    event.respondWith(
      (async () => {
        const cache = await caches.open(LISTEN_CACHE);
        const hit = await cache.match(req);
        if (hit) {
          event.waitUntil(listenUsed(req.url).catch(() => {}));
          return hit;
        }
        const res = await fetch(req);
        if (res.ok && res.status === 200) {
          const copy = res.clone(), sized = res.clone();
          event.waitUntil((async () => {
            await cache.put(req, copy);
            await listenUsed(req.url, await sizeOf(sized));
          })().catch(() => {}));
        }
        return res;
      })()
    );
    return;
  }

  // Audio: cache first and never revalidated (every URL carries its file's hash: caches.ts), fetched whole by the sound
  // engine (it plays music from a blob, so no Range requests reach here; one that does goes to the network). A hit
  // that isn't its class's newest is re-put to mark it recently used; each class keeps its few (least recently used
  // out: lruEvict).
  if (isAudio(url.pathname)) {
    if (req.headers.has('range')) return;
    event.respondWith(
      (async () => {
        const cache = await caches.open(AUDIO_CACHE);
        const hit = await cache.match(req);
        const res = hit ?? (await fetch(req));
        if (res.ok && res.status === 200) {
          const copy = res.clone();
          const put = (async () => {
            if (hit) {
              if (!staleUse((await cache.keys()).map((k) => k.url), req.url)) return;
              await cache.delete(req);
            }
            await cache.put(req, copy);
            for (const old of lruEvict((await cache.keys()).map((k) => k.url))) await cache.delete(old);
          })();
          event.waitUntil(put.catch(() => {}));
        }
        return res;
      })()
    );
    return;
  }

  // The food data (lib/food/load.ts): a versioned file cache first; index.json, which names the version, from the
  // network within FOOD_INDEX_TIMEOUT_MS, else its last copy; an old version dropped once a new one is whole (caches.ts).
  if (isFoodData(url.pathname)) {
    event.respondWith(caches.open(FOOD_CACHE).then((cache) => foodFetch(req, cache, (r) => fetch(r), (p) => event.waitUntil(p))));
    return;
  }

  // ごはん's pictures (caches.ts FOOD_IMG_CACHE, foodImgFetch): a sheet from the cache, else the network (stored after);
  // index.json from the network within 2.5 s, else its last copy
  if (isFoodImg(url.pathname)) {
    event.respondWith(caches.open(FOOD_IMG_CACHE).then((cache) => foodImgFetch(req, cache, (r) => fetch(r, r.url.endsWith('.webp') ? undefined : { cache: 'no-cache' }), (p) => event.waitUntil(p))));
    return;
  }

  // the guides' photos (a trip's cover and hero precached): kept once seen, revalidated in the background after a day
  if (isGuidePhoto(url.pathname)) {
    event.respondWith((async () => {
      const pre = await caches.open(CACHE).then((c) => c.match(req));
      if (pre) return pre;
      const cache = await caches.open(PHOTO_CACHE);
      return swrFetch(req, cache, (r) => fetch(r, { cache: 'no-cache' }), (p) => event.waitUntil(p), { freshMs: PHOTO_FRESH_MS, used: (k, n) => event.waitUntil(photoUsed(k, n).catch(() => {})) });
    })());
    return;
  }

  // the maps' MapLibre the first time a map draws, a ききみみ part the first time a game loads it: kept in this
  // version's shell (the install carries them on)
  if (carried(url.pathname)) {
    event.respondWith((async () => {
      const hit = await cached(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) {
        const copy = res.clone();
        event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}));
      }
      return res;
    })());
    return;
  }

  // fonts, villagers, critters, the decor and the tent's room: cached on first use (critters and the decor share the
  // villagers' on-use art cache; the room has its own)
  if (isFont(url.pathname) || isVillagerArt(url.pathname) || isCritterArt(url.pathname) || isDecorArt(url.pathname) || isRoomAsset(url.pathname)) {
    const font = isFont(url.pathname), room = isRoomAsset(url.pathname);
    event.respondWith(
      (async () => {
        // the two default villagers and the common font slices are precached
        const precached = room ? undefined : await caches.open(CACHE).then((c) => c.match(req));
        if (precached) return precached;
        const cache = await caches.open(font ? FONTS : room ? ROOM_CACHE : VILLAGERS);
        const hit = await cache.match(req);
        if (hit) {
          if (room) event.waitUntil(roomUsed(req.url).catch(() => {}));
          return hit;
        }
        const res = await fetch(req);
        if (res.ok) {
          const sized = room ? res.clone() : null;
          await cache.put(req, res.clone());
          if (sized) event.waitUntil(sizeOf(sized).then((n) => roomUsed(req.url, n)).catch(() => {}));
        }
        return res;
      })()
    );
    return;
  }

  event.respondWith((async () => (await cached(req)) ?? fetch(req))());
});

