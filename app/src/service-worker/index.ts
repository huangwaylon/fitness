// Island Fund service worker: caches the app shell so the PWA opens offline, and shows the notifications (ボット →
// 保養所's 通知 and やること's reminders, the only pushes: notify.ts; lib/push/phone.ts alone subscribes).
import { self } from '$app/service-worker';
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';
import { openApp, showPush } from './notify.ts';
import { boundedCache as bounded } from './bounded.ts';
import { isOwnPhotoUrl, OWN_PHOTO_CACHE, OWN_PHOTO_PENDING, ownPhotoEvict, ownPhotoFetch } from './caches.ts';
import { artEvict, foodImgEvict, fetchKeep, MAP_META_CACHE, PHOTO_CACHE, PHOTO_CAP_BYTES, PHOTO_FRESH_MS, TILE_CACHE, TILE_CAP_BYTES, TILE_CAP_N, TILE_FRESH_MS, LIVE_KEY, liveShells, bytesEvict, carried, isSavedArea, SAVE_HEADER, saveFetch, savedTile, carryPlan, isGuidePhoto, isTileJson, swrFetch, tileJsonFetch, tileKey, AUDIO_CACHE, FOOD_CACHE, FOOD_IMG_CACHE, foodImgFetch, ENGLISH_CACHE, englishFetch, isEnglishData, isFoodImg, ROOM_CACHE, ROOM_INDEX, SHELL, foodFetch, roomEvict, roomFiles, type RoomIndex, isAudio, isShellOf, fetchShared, staleFonts, isFoodData, isCritterArt, isDecorArt, isFont, isRoomAsset, isVillagerArt, installStatics, copyChunks, keepShell, marked, netLog, type Steps, raceShell, freshNow, fromOlder, FRESH_KEY, STATIC_HASHES, type StaticFile, lruEvict, olderShells, precachable, staleCaches, staleUse, warmable } from './caches.ts';

/** When this worker started (a navigation's fetch event within WORKER_COLD_MS of it: the worker was started for it). */
const UP_AT = Date.now(), WORKER_COLD_MS = 1000;
/** The worker's network fetches, each in its log (perf.boot's swNet: the page asks at its launch's end, `net` below):
 *  every `fetch` in this file is this one. */
const nets = netLog();
const fetch: typeof self.fetch = (input, init) => nets.track(self.fetch(input, init), input instanceof Request ? input.url : String(input));

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
// never precached: AUDIO_CACHE. Nor the maps' MapLibre (its chunk, worker and CSS, the engines) and the features:
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
      const chunks = await copyChunks(CHUNKS, cache, olds, self.location.href);
      // the build's code all or nothing: a chunk not fetched fails the install (the page keeps its worker and asks
      // again later: ui-state/reload.ts newWorker); the static files (the art, the manifest: ~300) each on its own, so
      // one that fails costs that file (served from the previous shell's copy or the network: `cached`), not the
      // install (one flaky fetch of ~370 failed it, and every resume's update with it), an unchanged one copied from an
      // older shell (caches.ts installStatics: by its content hash)
      await cache.addAll(chunks);
      // what this phone used of MapLibre and the features (an older shell holds it): an unchanged file copied, a
      // changed one fetched (each on its own: a miss costs only that map or feature offline till it's used again)
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

// Keep the newest older shell and each open page's (caches.ts staleCaches): a page still running an older build
// (claimed below) loads its lazy chunks (きろく, the harvest) from its own instead of a 404, until it takes a newer build
// at a hide or its next launch (ui-state/update.ts). caches.keys() lists caches in creation order, so the newest older
// shells are the last before ours.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      for (const key of staleCaches(keys, CACHE, [FONTS, VILLAGERS, AUDIO_CACHE, ROOM_CACHE, FOOD_CACHE, FOOD_IMG_CACHE, ENGLISH_CACHE, PHOTO_CACHE, TILE_CACHE, MAP_META_CACHE, OWN_PHOTO_CACHE, OWN_PHOTO_PENDING], await openShells(keys))) await caches.delete(key); // (never a saved area: caches.ts isSavedArea; the retired ききみみ's island-listen-v1 goes here too)
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
// (the size the netLog's row takes too, when its fetch had no Content-Length)
const sizeOf = async (res: Response, url: string): Promise<number> => {
  const n = (await res.blob()).size;
  nets.sized(url, n);
  return n;
};
const boundedCache = (name: string, indexPath: string, evict: (idx: RoomIndex, now: number) => string[]) =>
  bounded(() => caches.open(name), new URL(indexPath, self.registration.scope).href, evict);
/** The fetches on their way, by URL (fetchShared): the packs' and the room's, once at a time. */
const flying = new Map<string, Promise<Response>>();
const roomUsed = boundedCache(ROOM_CACHE, ROOM_INDEX, (idx, now) => roomEvict(idx, now));
const photoUsed = boundedCache(PHOTO_CACHE, '__photo-index', (idx, now) => bytesEvict(idx, now, PHOTO_CAP_BYTES));
const tileUsed = boundedCache(TILE_CACHE, '__tile-index', (idx, now) => bytesEvict(idx, now, TILE_CAP_BYTES, 0, TILE_CAP_N));
const artUsed = boundedCache(VILLAGERS, '__art-index', (idx, now) => artEvict(idx, now));
const foodImgUsed = boundedCache(FOOD_IMG_CACHE, '__food-img-index', (idx, now) => foodImgEvict(idx, now));
const ownPhotoUsed = boundedCache(OWN_PHOTO_CACHE, '__own-photo-index', (idx) => ownPhotoEvict(idx));

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

/** The open pages' builds as each said them (the app's `live` message, ui-state/swLate.ts) to this worker or the one
 *  before it (LIVE_KEY in its shell and in the newest older one), by client id. */
async function saidBuilds(keys: readonly string[]): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const k of [olderShells(keys, CACHE)[0], CACHE]) {
    if (!k || !keys.includes(k)) continue;
    const r = await (await caches.open(k)).match(LIVE).catch(() => undefined);
    Object.assign(out, await r?.json().catch(() => ({})));
  }
  return out;
}
const LIVE = new URL(LIVE_KEY, self.registration.scope).href;
const openPages = async (): Promise<string[]> => (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).map((c) => c.id);
/** The open pages' shells, or null (one hasn't said its build: caches.ts liveShells); never a failed activation. */
const openShells = (keys: readonly string[]): Promise<string[] | null> =>
  Promise.all([openPages(), saidBuilds(keys)]).then(([open, said]) => liveShells(open, said), () => null);
/** A page's build, said (`live`): kept in this shell with the other open pages' (the gone ones dropped). */
async function keepSaid(id: string, v: string): Promise<void> {
  const open = new Set(await openPages()), shell = await caches.open(CACHE);
  const was = ((await (await shell.match(LIVE))?.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const now: Record<string, unknown> = { [id]: v };
  for (const [k, x] of Object.entries(was)) if (open.has(k) && k !== id) now[k] = x;
  await shell.put(LIVE, new Response(JSON.stringify(now), { headers: { 'content-type': 'application/json' } }));
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
    // the maps' tiles: a saved area's, else as a map draws them, kept, bounded (TILE_CAP_BYTES, TILE_CAP_N: least recently used out),
    // refetched in the background past TILE_FRESH_MS; the TileJSON from the network within its TTL's rule, offline
    // with none kept a saved area's copy (the build its tiles are)
    const tile = tileKey(url);
    // マイ食品's own pictures (caches.ts ownPhotoFetch): one waiting to upload, else kept, else the relay's
    if (isOwnPhotoUrl(url, self.location.origin)) {
      const used = (u: string, n?: number) => event.waitUntil(ownPhotoUsed(u, n).catch(() => {}));
      event.respondWith(Promise.all([caches.open(OWN_PHOTO_PENDING), caches.open(OWN_PHOTO_CACHE)]).then(([p, c]) => ownPhotoFetch(req, p, c, (r) => fetch(r), (x) => event.waitUntil(x), used)));
      return;
    }
    if (tile) event.respondWith(serveTile(event, tile));
    else if (isTileJson(url)) {
      event.respondWith(caches.open(MAP_META_CACHE).then((cache) => tileJsonFetch(req, cache, (r) => fetch(r), (p) => event.waitUntil(p))).catch(() => null)
        .then(async (res) => (res?.ok ? res : ((await savedTile(caches, await savedAreas(), req.url)) ?? res ?? Response.error()))));
    }
    return; // the relay (the record, the room): always live
  }

  // A navigation (docs/backend.md "Service worker" › Navigations): with this version's shell cached, that shell, every
  // chunk of it in this cache; the network's page raced for RACE_MS only to learn whether this build is still the
  // deployed one (caches.ts raceShell; a deploy's page is never booted under this worker: the new build is taken at the
  // next hide, ui-state/update.ts); offline, at once. The network's answer is the navigation preload's (asked as the
  // navigation starts, not once this worker is up: activate). The browser checks for a new worker on each navigation
  // (every deploy changes it): the new one installs its build's shell and chunks, skips waiting and claims the page
  // (the page then sees the deploy: update.ts watchClaims). No shell of this version yet (a first visit, or offline at install): network
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
    const t0 = Date.now();
    // the shell and when the network last named it the deployed one (FRESH_KEY), looked up side by side (in a row, on
    // a worker just started, review 11-20 P1), each one's ms kept for the page (perf.boot swOwn, swFresh; swUp: the
    // worker's start to this event, when it started for it)
    const cold = t0 - UP_AT < WORKER_COLD_MS, steps: Steps = cold ? { up: t0 - UP_AT } : {};
    const own = caches.open(CACHE).then((c) => c.match(SCOPE)).catch(() => undefined).finally(() => (steps.own = Date.now() - t0));
    const fresh = freshAt().catch(() => null).finally(() => (steps.fresh = Date.now() - t0));
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
          const at = { t0, cold, steps };
          if (!online || url.searchParams.get('shell') === 'cache') return marked({ res: hit, from: 'cache', ms: 0 }, at);
          if (freshNow(await fresh)) return marked({ res: hit, from: 'skip', ms: 0 }, at);
          const raced = await raceShell(hit, ask(), version, undefined, undefined, t0);
          if (raced.from !== 'cache') event.waitUntil(markFresh(raced.from === 'same'));
          return marked(raced, at);
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

  // English Study's banks (caches.ts ENGLISH_CACHE): cache first, the network's kept
  if (isEnglishData(url.pathname)) {
    event.respondWith(caches.open(ENGLISH_CACHE).then((cache) => englishFetch(req, cache, (r) => fetch(r), (p) => event.waitUntil(p))));
    return;
  }

  // ごはん's pictures (caches.ts FOOD_IMG_CACHE, foodImgFetch): a sheet from the cache, else the network (stored after),
  // bounded by bytes (foodImgEvict); index.json from the network within 2.5 s, else its last copy
  if (isFoodImg(url.pathname)) {
    const used = (u: string, n?: number) => event.waitUntil(foodImgUsed(u, n).catch(() => {}));
    event.respondWith(caches.open(FOOD_IMG_CACHE).then((cache) => foodImgFetch(req, cache, (r) => fetch(r, r.url.endsWith('.webp') ? undefined : { cache: 'no-cache' }), (p) => event.waitUntil(p), undefined, used)));
    return;
  }

  // the guides' photos (a trip's cover precached) and the wedding's banner: kept once seen, revalidated in the background
  // after a day; none kept and no network, a saved area's copy (a trail's net file: lib/offline/save.ts)
  if (isGuidePhoto(url.pathname)) {
    event.respondWith((async () => {
      const pre = await caches.open(CACHE).then((c) => c.match(req));
      if (pre) return pre;
      const cache = await caches.open(PHOTO_CACHE);
      const res = await swrFetch(req, cache, (r) => fetch(r, { cache: 'no-cache' }), (p) => event.waitUntil(p), { freshMs: PHOTO_FRESH_MS, used: (k, n) => event.waitUntil(photoUsed(k, n).catch(() => {})) }).catch(() => null);
      return res?.ok ? res : ((await savedTile(caches, await savedAreas(), req.url)) ?? res ?? Response.error());
    })());
    return;
  }

  // the maps' MapLibre the first time a map draws, a feature's chunk the first time it's used: kept in this
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
    if (sized) await used!(req.url, await sizeOf(sized, req.url));
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
  kept.push((room ? roomUsed : artUsed)(u, await sizeOf(sized, u)));
}
self.addEventListener('message', (event) => {
  const d = event.data as { k?: string; urls?: unknown; since?: unknown; v?: unknown } | null;
  // a page's build (ui-state/swLate.ts, at its start and each new worker's claim): its shell kept while it's open
  if (d?.k === 'live') {
    const id = (event.source as Client | null)?.id;
    if (id && typeof d.v === 'string' && d.v.length < 80) event.waitUntil(keepSaid(id, d.v).catch(() => {}));
    return;
  }
  // the launch's end (world3d/boot.ts swFetches): this worker's network fetches since the page's start
  if (d?.k === 'net') return void event.ports[0]?.postMessage(nets.since(Number(d.since) || 0));
  // the bounded caches' index writes in flight done, then said (sw-update.spec reads an index only after: its write is
  // a moment after a use, outside every event, bounded.ts)
  if (d?.k === 'flush') {
    event.waitUntil(Promise.all([roomUsed, photoUsed, tileUsed, artUsed, foodImgUsed, ownPhotoUsed].map((u) => u.pending())).then(() => (event.source as Client | null)?.postMessage({ k: 'flushed' })));
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

// A notification (ITS's or a やること reminder: lib/push/phone.ts subscribed this phone): shown at once, nothing fetched
// first (iOS drops a subscription whose push shows nothing); ITS's sets the app icon's badge too, never in its way.
self.addEventListener('push', (event) => {
  event.waitUntil(showPush(self.registration, self.navigator as Navigator & { setAppBadge?: (n: number) => Promise<void> }, event.data, SCOPE));
});

// A tap on it: the app forward where it says (やること at the item, else ボット → 保養所): an open window told, else opened
// at ?open=….
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(openApp(self.clients, SCOPE, event.notification.data));
});
