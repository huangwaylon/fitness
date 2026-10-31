// Island Fund service worker: caches the app shell so the PWA opens offline. (No web push: ADR 0016.)
import { self } from '$app/service-worker';
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';
import { AUDIO_CACHE, SHELL, isAudio, isFont, isMusic, isVillagerArt, keepShell, lruEvict, precachable, staleCaches } from './caches.ts';

// The app may live under a base path (GitHub Pages: /fitness/); the registration scope carries it.
const SCOPE = new URL(self.registration.scope).pathname;

const CACHE = `${SHELL}${version}`;
const FONTS = 'island-fonts-v1';
/** A slow network (one bar, a captive portal) must not hang the launch: after this the cached shell opens. */
const NAV_TIMEOUT_MS = 3000;
// Villager art: ~160 villagers × render + icon is too much to download at install. Only the two
// default villagers are precached; every other render/icon is cached on first use, in a cache that outlives builds
// (bump the suffix if villager art is re-fetched under the same paths).
const VILLAGERS = 'island-villagers-v1';

// Precache built JS/CSS + static files (caches.ts precachable): font subsets (Japanese = many files) are cached on
// first use instead; the art and audio manifests are bundled into the JS (lib/art.ts, lib/sound/manifest.ts), so
// their files are never fetched. Villager art: see VILLAGERS. Audio (~14 MB of hourly music, off by default) is
// never precached: AUDIO_CACHE.
const PRECACHE = [...immutable.map((f) => f.path), ...assets.map((f) => f.path)].filter(precachable);
/** Past the browser's HTTP cache (GitHub Pages: max-age 600): a static file or the shell fetched within 10 minutes
 *  before a deploy would otherwise be stored stale for the whole version. The hashed chunks can't be stale. */
const fresh = (path: string) => new Request(path, { cache: 'reload' });
const HASHED = new Set(immutable.map((f) => f.path));

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE.map((p) => (HASHED.has(p) ? p : fresh(p))));
      // The SPA shell (ssr = false): any navigation can be served by the scope root.
      try {
        await cache.add(fresh(SCOPE));
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
      for (const key of staleCaches(await caches.keys(), CACHE, [FONTS, VILLAGERS, AUDIO_CACHE])) await caches.delete(key);
      await self.clients.claim();
    })()
  );
});

/** Ours first (a static file may change under the same path), then the previous generation's. */
async function cached(req: Request | string): Promise<Response | undefined> {
  return (await (await caches.open(CACHE)).match(req)) ?? (await caches.match(req));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // the Apps Script backend: always live

  // Network first (a fresh shell points at the current chunks), the cached shell when offline or after 3 s. The
  // response becomes the offline shell only where this version has none (keepShell); off the response's path.
  if (req.mode === 'navigate') {
    const net = fetch(req);
    // cloned in the first callback on `net`, before respondWith below can hand the body to the page
    event.waitUntil(
      net.then((res) => {
        const copy = res.clone();
        return caches.open(CACHE).then((c) => keepShell(c, SCOPE, copy));
      }).catch(() => {})
    );
    event.respondWith(
      (async () => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const late = new Promise<null>((r) => (timer = setTimeout(r, NAV_TIMEOUT_MS, null)));
        const first = await Promise.race([net.catch(() => null), late]);
        clearTimeout(timer);
        if (first) return first;
        return (await cached(SCOPE)) ?? net.catch(() => Response.error());
      })()
    );
    return;
  }

  // Audio: cache first, fetched whole by the sound engine (it plays music from a blob, so no Range requests reach
  // here; one that does goes to the network). A hit is re-put to mark it recently used; only MUSIC_KEEP music files
  // are kept (least recently used out).
  if (isAudio(url.pathname)) {
    if (req.headers.has('range')) return;
    event.respondWith(
      (async () => {
        const cache = await caches.open(AUDIO_CACHE);
        const hit = await cache.match(req);
        if (hit && !isMusic(url.pathname)) return hit;
        const res = hit ?? (await fetch(req));
        if (res.ok && res.status === 200) {
          const put = (async () => {
            if (hit) await cache.delete(req);
            await cache.put(req, res.clone());
            for (const old of lruEvict((await cache.keys()).map((k) => k.url))) await cache.delete(old);
          })();
          event.waitUntil(put.catch(() => {}));
        }
        return res;
      })()
    );
    return;
  }

  if (isFont(url.pathname) || isVillagerArt(url.pathname)) {
    const runtime = isFont(url.pathname) ? FONTS : VILLAGERS;
    event.respondWith(
      (async () => {
        const precached = await caches.open(CACHE).then((c) => c.match(req));
        if (precached) return precached;
        const cache = await caches.open(runtime);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) await cache.put(req, res.clone());
        return res;
      })()
    );
    return;
  }

  event.respondWith((async () => (await cached(req)) ?? fetch(req))());
});
