// Island Fund service worker: caches the app shell so the PWA opens offline. (No push or notificationclick handlers:
// notifications are gone, 2026-11-02.)
import { self } from '$app/service-worker';
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';
import { AUDIO_CACHE, FOOD_CACHE, ROOM_CACHE, ROOM_INDEX, SHELL, foodFetch, roomEvict, type RoomIndex, isAudio, isShellOf, isFoodData, isCritterArt, isDecorArt, isFont, isRoomAsset, isVillagerArt, keepShell, lruEvict, olderShells, precachable, staleCaches, staleUse } from './caches.ts';

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

// Precache built JS/CSS + static files (caches.ts precachable): font subsets (Japanese = many files) are cached on
// first use instead; the art and audio manifests are bundled into the JS (lib/art.ts, lib/sound/manifest.ts), so
// their files are never fetched. Villager art: see VILLAGERS. Audio (~14 MB of hourly music, off by default) is
// never precached: AUDIO_CACHE.
const PRECACHE = [...immutable.map((f) => f.path), ...assets.map((f) => f.path)].filter(precachable);
/** Checked with the server past the browser's HTTP cache (a host's own max-age): a static file or the shell
 *  fetched within 10 minutes before a deploy would otherwise be stored stale for the whole version. Revalidated, not
 *  reloaded: an unchanged file (most of the art, each deploy) is a 304 from the HTTP cache's copy, not a download. The
 *  hashed chunks can't be stale. */
const fresh = (path: string) => new Request(path, { cache: 'no-cache' });
const HASHED = new Set(immutable.map((f) => f.path));

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // a hashed chunk an older shell holds is the very same file: copied over, not downloaded again (each deploy
      // fetched every chunk and font anew, ~3 MB; now only what changed)
      const olds = await Promise.all(olderShells(await caches.keys(), CACHE).map((k) => caches.open(k)));
      const chunks: string[] = [], statics: Request[] = [];
      for (const p of PRECACHE) {
        if (!HASHED.has(p)) {
          statics.push(fresh(p));
          continue;
        }
        let hit: Response | undefined;
        for (const c of olds) if ((hit = await c.match(p))) break;
        if (hit) await cache.put(p, hit);
        else chunks.push(p);
      }
      // the build's code all or nothing: a chunk not fetched fails the install (the page keeps its worker and asks
      // again later: ui-state/reload.ts newWorker); the static files (the art, the manifest: ~300) each on its own, so
      // one that fails costs that file (served from the previous shell's copy or the network: `cached`), not the
      // install (one flaky fetch of ~370 failed it, and every resume's update with it)
      await cache.addAll(chunks);
      await Promise.allSettled(statics.map(async (r) => {
        const res = await fetch(r);
        if (res.ok) await cache.put(r, res);
      }));
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
      for (const key of staleCaches(await caches.keys(), CACHE, [FONTS, VILLAGERS, AUDIO_CACHE, ROOM_CACHE, FOOD_CACHE])) await caches.delete(key);
      await self.clients.claim();
    })()
  );
});

// The room cache's bound (caches.ts roomEvict): its index (each file's bytes and last use) in memory while the worker
// runs, kept in the cache itself a moment after a change, with the files it lets go deleted then. Read back (and
// matched to the cache's files: one put as the worker was stopped is counted then) the first time the room is asked
// for. A cache from before the index is counted whole once, every file used now in the cache's order (the older
// versions go at once; the rest only after ROOM_KEEP_MS unused).
const ROOM_INDEX_URL = new URL(ROOM_INDEX, self.registration.scope).href;
let roomIndex: Promise<RoomIndex> | null = null;
const sizeOf = async (res: Response): Promise<number> => (await res.blob()).size;
function roomIndexOf(cache: Cache): Promise<RoomIndex> {
  return (roomIndex ??= (async () => {
    let idx: RoomIndex = {};
    try {
      const kept = await cache.match(ROOM_INDEX_URL);
      if (kept) idx = (await kept.json()) as RoomIndex;
    } catch {
      idx = {};
    }
    const urls = (await cache.keys()).map((k) => k.url).filter((u) => u !== ROOM_INDEX_URL);
    const have = new Set(urls), now = Date.now();
    for (const u of Object.keys(idx)) if (!have.has(u)) delete idx[u];
    for (let i = 0; i < urls.length; i++) {
      if (idx[urls[i]]) continue;
      const res = await cache.match(urls[i]);
      idx[urls[i]] = [res ? await sizeOf(res).catch(() => 0) : 0, now - urls.length + i];
    }
    return idx;
  })().catch((e: unknown) => {
    roomIndex = null;
    throw e;
  }));
}
let roomTidy: Promise<void> | null = null;
/** A room file used (and its bytes, when it was just stored); the index kept and the files over the bound let go a
 *  moment later (one write for a model's burst of files). */
async function roomUsed(url: string, bytes?: number): Promise<void> {
  const cache = await caches.open(ROOM_CACHE);
  const idx = await roomIndexOf(cache);
  idx[url] = [bytes ?? idx[url]?.[0] ?? 0, Date.now()];
  return (roomTidy ??= new Promise((r) => setTimeout(r, 2000)).then(async () => {
    roomTidy = null;
    for (const u of roomEvict(idx, Date.now())) {
      await cache.delete(u);
      delete idx[u];
    }
    await cache.put(ROOM_INDEX_URL, new Response(JSON.stringify(idx), { headers: { 'content-type': 'application/json' } }));
  }));
}

/** Ours first (a static file may change under the same path), then the previous generation's. */
async function cached(req: Request | string): Promise<Response | undefined> {
  return (await (await caches.open(CACHE)).match(req)) ?? (await caches.match(req));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // the relay (the record, the room): always live

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

  // fonts, villagers, critters, the decor and the tent's room: cached on first use (critters and the decor share the
  // villagers' on-use art cache; the room has its own)
  if (isFont(url.pathname) || isVillagerArt(url.pathname) || isCritterArt(url.pathname) || isDecorArt(url.pathname) || isRoomAsset(url.pathname)) {
    const font = isFont(url.pathname), room = isRoomAsset(url.pathname);
    event.respondWith(
      (async () => {
        // the two default villagers are precached (fonts never are)
        const precached = font || room ? undefined : await caches.open(CACHE).then((c) => c.match(req));
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

