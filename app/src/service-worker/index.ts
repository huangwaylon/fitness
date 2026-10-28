// Island Fund service worker: caches the app shell, shows web push notifications, opens the right page on tap.
import { self } from '$app/service-worker';
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';

// The app may live under a base path (GitHub Pages: /fitness/); the registration scope carries it.
const SCOPE = new URL(self.registration.scope).pathname;
/** App-relative URL ('/jar', '/?checkin=1') → absolute URL inside the scope. */
const inScope = (u: string) => new URL(u.replace(/^\//, ''), self.registration.scope).href;

const CACHE = `island-shell-${version}`;
const FONTS = 'island-fonts-v1';
const isFont = (p: string) => /\.(woff2?|ttf)$/.test(p);

// Precache built JS/CSS + static files. Font subsets (Japanese = many files) are cached on first use instead.
const PRECACHE = [...immutable.map((f) => f.path), ...assets.map((f) => f.path)].filter((p) => !isFont(p));

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE);
      // The SPA shell (ssr = false): any navigation can be served by "/".
      try {
        await cache.add('/');
      } catch {
        /* offline at install; the shell is cached on the next navigation */
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE && key !== FONTS) await caches.delete(key);
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ingest/')) return; // always live

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const res = await fetch(req);
          if (res.ok) await cache.put(SCOPE, res.clone());
          return res;
        } catch {
          return (await cache.match(SCOPE)) ?? Response.error();
        }
      })()
    );
    return;
  }

  if (isFont(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FONTS);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) await cache.put(req, res.clone());
        return res;
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      return fetch(req);
    })()
  );
});

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
}

self.addEventListener('push', (event) => {
  let data: PushPayload = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'しまの貯金箱', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag,
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = inScope((event.notification.data as { url?: string } | null)?.url || '/');
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const w of wins) {
        if (new URL(w.url).origin === self.location.origin) {
          await w.focus();
          if (w.url !== target) await w.navigate(target).catch(() => undefined);
          return;
        }
      }
      await self.clients.openWindow(target);
    })()
  );
});
