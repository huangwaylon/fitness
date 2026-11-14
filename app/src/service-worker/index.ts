// Island Fund service worker: caches the app shell so the PWA opens offline, and shows the ITS bot's notifications
// (ボット → 保養所's 通知, the only push: notify.ts; nothing else in the app subscribes).
import { self } from '$app/service-worker';
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';
import { openApp, showPush } from './notify.ts';
import { boundedCache as bounded } from './bounded.ts';
import { ART_CAP_BYTES, ART_KEEP_MS, foodImgEvict, fetchKeep, MAP_META_CACHE, PHOTO_CACHE, PHOTO_CAP_BYTES, PHOTO_FRESH_MS, TILE_CACHE, TILE_CAP_BYTES, TILE_FRESH_MS, bytesEvict, carried, isSavedArea, SAVE_HEADER, saveFetch, savedTile, carryPlan, isGuidePhoto, isTileJson, swrFetch, tileJsonFetch, tileKey, AUDIO_CACHE, FOOD_CACHE, FOOD_IMG_CACHE, LISTEN_CACHE, LISTEN_INDEX, foodImgFetch, isFoodImg, ROOM_CACHE, ROOM_INDEX, SHELL, STT_CACHE, isStt, foodFetch, listenEvict, roomEvict, roomFiles, type RoomIndex, isAudio, isListenPack, isShellOf, fetchShared, staleFonts, isFoodData, isCritterArt, isDecorArt, isFont, isRoomAsset, isVillagerArt, installStatics, keepShell, marked, raceShell, freshNow, fromOlder, FRESH_KEY, STATIC_HASHES, type StaticFile, lruEvict, olderShells, precachable, staleCaches, staleUse, warmable } from './caches.ts';

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

// Keep SHELLS_KEPT older shell generations: a page still running an older build (claimed below) loads its lazy chunks
// (きろく, the harvest) from its own instead of a 404, until it takes a newer build at a hide or its next launch
// (ui-state/update.ts). caches.keys() lists caches in creation order, so the newest older shells are the last before ours.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of staleCaches(await caches.keys(), CACHE, [FONTS, VILLAGERS, AUDIO_CACHE, ROOM_CACHE, FOOD_CACHE, FOOD_IMG_CACHE, LISTEN_CACHE, STT_CACHE, PHOTO_CACHE, TILE_CACHE, MAP_META_CACHE])) await caches.delete(key); // (never a saved area: caches.ts isSavedArea)
      await self.clients.claim();
      // the navigations' network answer asked as each starts (the launch's race: fetch below), not once this worker is up
      await self.registration.navigationPreload?.enable().catch(() => {});
      // the font slices this build's style sheets no longer name (a re-subset's: caches.ts staleFonts); never a failed
      // activation over it
      try {
        const shell = await caches.open(CACHE), fonts = await caches.open(FONTS);
        const sheets = (await shell.keys()).filter((r) => new URL(r.url).pathname.endsWith('.css'));
        const css = (await Promise.all(sheets.map(async (r) => (await shell.match(r))?.text() ?? ''))).join('\n');
        for (const u of staleFonts((await fonts.keys()).map((r) => r.url), css)) await fonts.delete(u);
      } catch {
        /* kept till the next activation */
      }
    })()
  );
});

// The bounded caches (bounded.ts): a use marked at once, the index written a moment later outside every event.
const sizeOf = async (res: Response): Promise<number> => (await res.blob()).size;
const boundedCache = (name: string, indexPath: string, evict: (idx: RoomIndex, now: number) => string[]) =>
  bounded(() => caches.open(name), new URL(indexPath, self.registration.scope).href, evict);
/** The fetches on their way, by URL (fetchShared): the packs' and the room's, once at a time. */
const flying = new Map<string, Promise<Response>>();
const roomUsed = boundedCache(ROOM_CACHE, ROOM_INDEX, (idx, now) => roomEvict(idx, now));
const listenUsed = boundedCache(LISTEN_CACHE, LISTEN_INDEX, (idx, now) => listenEvict(idx, now));
const photoUsed = boundedCache(PHOTO_CACHE, '__photo-index', (idx, now) => bytesEvict(idx, now, PHOTO_CAP_BYTES));
const tileUsed = boundedCache(TILE_CACHE, '__tile-index', (idx, now) => bytesEvict(idx, now, TILE_CAP_BYTES));
const artUsed = boundedCache(VILLAGERS, '__art-index', (idx, now) => bytesEvict(idx, now, ART_CAP_BYTES, ART_KEEP_MS));
const foodImgUsed = boundedCache(FOOD_IMG_CACHE, '__food-img-index', (idx, now) => foodImgEvict(idx, now));

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

/** Ours first (a static file may change under the same path), then the older shells', newest first (caches.match
 *  answers the oldest: a version with no shell of its own opened a build three deploys back, review 11-14 #3). */
async function cached(req: Request | string): Promise<Response | undefined> {
  return (await (await caches.open(CACHE)).match(req)) ?? (await fromOlder(caches, CACHE, req));
}

/** When the network last named this build the deployed one (caches.ts FRESH_KEY), or null. */
async function freshAt(): Promise<number | null> {
  const r = await (await caches.open(CACHE)).match(FRESH_KEY).catch(() => undefined);
  const at = r ? Number(await r.text()) : NaN;
  return Number.isFinite(at) ? at : null;
}
const markFresh = (fresh: boolean): Promise<unknown> =>
  caches.open(CACHE).then((c) => (fresh ? c.put(FRESH_KEY, new Response(String(Date.now()))) : c.delete(FRESH_KEY))).catch(() => {});

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

  // A navigation (docs/backend.md "Service worker" › Navigations): with this version's shell cached, the network's page
  // if it is in within RACE_MS (caches.ts raceShell: a deploy's page boots at once, its new chunks from the network
  // below, the rest from the cache), else the cached shell; offline, the cached shell at once. The network's answer is
  // the navigation preload's (asked as the navigation starts, not once this worker is up: activate). The browser checks
  // for a new worker on each navigation (every deploy changes it): the new one installs its build's shell and chunks,
  // skips waiting and claims the page. No shell of this version yet (a first visit, or offline at install): network
  // first, an older version's shell offline or after 3 s; the response becomes this version's shell if it is this
  // build's (keepShell).
  // Kit's version check (the page's, on a show and when a newer worker claims it): the network's, as ever, and what it
  // says kept for the launches' race (this build the deployed one: none needed for FRESH_MS)
  if (url.pathname === `${SCOPE}_app/version.json`) {
    event.respondWith(fetch(req).then(async (res) => {
      const v = res.ok ? ((await res.clone().json().catch(() => null)) as { version?: unknown } | null)?.version : undefined;
      if (typeof v === 'string') event.waitUntil(markFresh(v === version));
      return res;
    }));
    return;
  }

  if (req.mode === 'navigate') {
    const own = caches.open(CACHE).then((c) => c.match(SCOPE)).catch(() => undefined);
    const preload = (event.preloadResponse as Promise<Response | undefined> | undefined)?.catch(() => undefined) ?? Promise.resolve(undefined);
    const online = self.navigator.onLine !== false;
    const ask = () => preload.then((r) => r ?? fetch(req));
    const net = own.then((hit) => (hit ? null : ask()));
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
        if (hit) {
          // offline, or the boot watchdog's reload (app.html: a network page that didn't start), this shell at once;
          // the network named this build the deployed one lately: no race
          if (!online || url.searchParams.get('shell') === 'cache') return marked({ res: hit, from: 'cache', ms: 0 });
          if (freshNow(await freshAt())) return marked({ res: hit, from: 'skip', ms: 0 });
          const raced = await raceShell(hit, ask(), version);
          if (raced.from !== 'cache') event.waitUntil(markFresh(raced.from === 'same'));
          return marked(raced);
        }
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

  // ききみみ's packs whole: cache first and never revalidated (the hash is in the name), fetched whole (lib/packStore.ts;
  // a Range request goes to the network), once at a time (fetchShared), stored after the answer; each use marks the pack
  // in the index, the least recently used going past the cache's bytes, never one used in the last 10 minutes
  // (caches.ts listenEvict).
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
        return fetchShared(flying, req.url, () => fetch(req).then((res) => {
          if (res.ok && res.status === 200) {
            const copy = res.clone(), sized = res.clone();
            event.waitUntil((async () => {
              await cache.put(req, copy);
              await listenUsed(req.url, await sizeOf(sized));
            })().catch(() => {}));
          }
          return res;
        }));
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

  // ごはん's pictures (caches.ts FOOD_IMG_CACHE, foodImgFetch): a sheet from the cache, else the network (stored after),
  // bounded by bytes (foodImgEvict); index.json from the network within 2.5 s, else its last copy
  if (isFoodImg(url.pathname)) {
    const used = (u: string, n?: number) => event.waitUntil(foodImgUsed(u, n).catch(() => {}));
    event.respondWith(caches.open(FOOD_IMG_CACHE).then((cache) => foodImgFetch(req, cache, (r) => fetch(r, r.url.endsWith('.webp') ? undefined : { cache: 'no-cache' }), (p) => event.waitUntil(p), undefined, used)));
    return;
  }

  // the guides' photos (a trip's cover precached) and the wedding's banner: kept once seen, revalidated in the background after a day
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

  // fonts, villagers, critters, the decor and the tent's room: cached on first use
  if (isFont(url.pathname) || isVillagerArt(url.pathname) || isCritterArt(url.pathname) || isDecorArt(url.pathname) || isRoomAsset(url.pathname)) {
    event.respondWith(onUse(req, (p) => event.waitUntil(p)));
    return;
  }

  event.respondWith((async () => (await cached(req)) ?? fetch(req))());
});

/** A font, a villager's, critter's or decor's art, or a room file: its cache's copy, else fetched and kept (critters
 *  and the decor share the villagers' on-use art cache, bounded by bytes: ART_CAP_BYTES; the room has its own). */
async function onUse(req: Request, waitUntil: (p: Promise<unknown>) => void): Promise<Response> {
  const path = new URL(req.url).pathname, font = isFont(path), room = isRoomAsset(path);
  // the two default villagers and the common font slices are precached
  const precached = room ? undefined : await caches.open(CACHE).then((c) => c.match(req));
  if (precached) return precached;
  const cache = await caches.open(font ? FONTS : room ? ROOM_CACHE : VILLAGERS);
  const used = font ? null : room ? roomUsed : artUsed;
  const hit = await cache.match(req);
  if (hit) {
    if (used) waitUntil(used(req.url).catch(() => {}));
    return hit;
  }
  // (once at a time: a player's pack asked by two tabs, fetchShared)
  return fetchShared(flying, req.url, () => fetchKeep(req, fetch, async (copy) => {
    const sized = used ? copy.clone() : null;
    await cache.put(req, copy);
    if (sized) await used!(req.url, await sizeOf(sized));
  }, waitUntil));
}

// A first launch's models and art (the page's, fetched before this worker was in: ui-state/swLate.ts): kept now, from
// the browser's HTTP cache (force-cache: no network, no revalidation, for what it holds), as their first use through the
// worker would have; else the next launch revalidated each (~77 requests) and kept them only then, or fetched them all
// again (~1.5 MB) had the HTTP cache let them go. Not through onUse: its answer is a tee'd clone (fetchShared), and
// cancelling one branch of a tee settles only once the other is read or cancelled (the Streams spec, as WebKit does
// it): the loop stalled at its first file and a WebKit first launch kept 27 of ~165 (review 11-13 N1). Each file's
// use is marked in its index's memory (`used`; the write follows on its own: bounded.ts).
async function warm(u: string, kept: Promise<unknown>[]): Promise<void> {
  const req = new Request(u, { cache: 'force-cache' });
  const room = isRoomAsset(new URL(u).pathname);
  const cache = await caches.open(room ? ROOM_CACHE : VILLAGERS);
  if (await cache.match(req)) return;
  const res = await fetch(req);
  if (!res.ok || res.status !== 200) return;
  const sized = res.clone();
  await cache.put(req, res);
  kept.push((room ? roomUsed : artUsed)(u, await sizeOf(sized)));
}
self.addEventListener('message', (event) => {
  const d = event.data as { k?: string; urls?: unknown } | null;
  // the bounded caches' index writes in flight done, then said (sw-update.spec reads an index only after: its write is
  // a moment after a use, outside every event, bounded.ts)
  if (d?.k === 'flush') {
    event.waitUntil(Promise.all([roomUsed, listenUsed, photoUsed, tileUsed, artUsed, foodImgUsed].map((u) => u.pending())).then(() => (event.source as Client | null)?.postMessage({ k: 'flushed' })));
    return;
  }
  if (!Array.isArray(d?.urls)) return;
  // The KTX2 files whose textures the page read back from its own cache (world3d/ktx2.ts usedFile: no fetch, so never
  // seen here): used now, in the room's index, so the island's own aren't the least recently used past the cap.
  if (d.k === 'used') {
    event.waitUntil((async () => {
      const cache = await caches.open(ROOM_CACHE), kept: Promise<unknown>[] = [];
      for (const u of roomFiles(d.urls as unknown[], self.location.origin)) if (await cache.match(u)) kept.push(roomUsed(u));
      await Promise.allSettled(kept);
    })().catch(() => {}));
    return;
  }
  if (d.k !== 'warm') return;
  event.waitUntil((async () => {
    const kept: Promise<unknown>[] = [];
    for (const u of warmable(d.urls as unknown[], self.location.origin)) {
      try {
        await warm(u, kept);
      } catch {
        /* offline, gone: kept on its next use */
      }
    }
    await Promise.allSettled(kept);
    // (done: sw-update.spec counts the install's own fetches only after it)
    (event.source as Client | null)?.postMessage({ k: 'warmed' });
  })());
});

// An ITS notification (lib/its/push.ts subscribed this phone): shown at once, nothing fetched first (iOS drops a
// subscription whose push shows nothing); the app icon's badge set too, inside the same promise and never in its way.
self.addEventListener('push', (event) => {
  event.waitUntil(showPush(self.registration, self.navigator as Navigator & { setAppBadge?: (n: number) => Promise<void> }, event.data, SCOPE));
});

// A tap on it: the app forward on ボット → 保養所 (an open window told, else opened at ?open=its).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(openApp(self.clients, SCOPE));
});
