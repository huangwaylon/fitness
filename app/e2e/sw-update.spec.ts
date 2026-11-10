// The service worker's launch and update (docs/backend.md "Service worker"): a first visit's page comes from the
// network; once installed, a navigation is this version's cached shell at once (the network not waited on, however
// slow); a deploy (a new worker, _app/version.json naming a new version) reloads the page only once the new worker
// controls it, so the reload is served the new build's own shell.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu, hudMenu } from './hud.ts';

test.use({ serviceWorkers: 'allow' });
// one test at a time, in order: a deploy (scripts/serve-build.ts /__e2e/deploy) changes the worker's script for the
// whole server, so another of these running at once took it as its own new worker in the middle of its reload
test.describe.configure({ mode: 'default' });

const controlled = (page: Page) => page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60_000 });

/**
 * Chromium's ask to swap the old worker out again, once it can act on it. A deploy's worker installed (it called
 * skipWaiting()), Chromium tells the old one to stop as soon as it's idle, but only if it's running then: one still
 * starting up (a page's fetch had just woken it) isn't told, and is stopped only by its idle timeout, which Chromium
 * skips for a worker DevTools is attached to, as Playwright is to every service worker. The new worker then waited
 * out Chromium's 5-minute lame-duck timer (CI: ~1 run in 80, the old worker running with nothing in flight, the new
 * one installed; stopping the old one swapped them at once). So when an old worker comes up running while a new one
 * waits, the swap is asked for once more (CDP ServiceWorker.skipWaiting: what the install's own call did), and the
 * old one goes once its events are done. (Not on a phone: WebKit, and no DevTools.)
 */
async function askSwapAgain(page: Page, context: import('@playwright/test').BrowserContext) {
  const cdp = await context.newCDPSession(page);
  const versions = new Map<string, { status: string; running: string; reg: string }>();
  const scopes = new Map<string, string>();
  cdp.on('ServiceWorker.workerRegistrationUpdated', ({ registrations }) => {
    for (const r of registrations) scopes.set(r.registrationId, r.scopeURL);
  });
  cdp.on('ServiceWorker.workerVersionUpdated', ({ versions: vs }) => {
    for (const v of vs) {
      const was = versions.get(v.versionId);
      versions.set(v.versionId, { status: v.status, running: v.runningStatus, reg: v.registrationId });
      const waiting = [...versions.values()].some((w) => w.status === 'installed' && w.reg === v.registrationId);
      const cameUp = v.status === 'activated' && v.runningStatus === 'running' && was?.running === 'starting';
      const scopeURL = scopes.get(v.registrationId);
      if (waiting && cameUp && scopeURL) void cdp.send('ServiceWorker.skipWaiting', { scopeURL }).catch(() => {});
    }
  });
  await cdp.send('ServiceWorker.enable');
}

// (in Chromium: WebKit's Playwright build doesn't route a service worker's own fetches)
test('a navigation is the cached shell at once; a deploy reloads once its worker is in', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(120_000);
  const first = await page.goto('?demo');
  expect(first?.fromServiceWorker()).toBe(false);
  await islandUp(page);
  await controlled(page);

  // the network for pages held until the shell is up (a gate this test opens): the reload doesn't wait for it
  let open = () => {};
  const gate = new Promise<void>((r) => (open = r));
  const held = async (route: import('@playwright/test').Route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    await gate;
    await route.fallback().catch(() => {});
  };
  await context.route('**/*', held);
  const again = await page.reload();
  expect(again?.fromServiceWorker()).toBe(true);
  // (the shell up, the network still held: its HUD; the island under it loads after)
  await expect(hudMenu(page)).toBeVisible();
  open();
  await context.unroute('**/*', held);
  await controlled(page);

  // a deploy: a changed worker, and version.json naming a new version
  // (the server's stand-in for a deploy: the worker's script changes; scripts/serve-build.ts)
  await askSwapAgain(page, context);
  await page.request.get('/__e2e/deploy');
  let asked = 0;
  await context.route('**/_app/version.json', (route) => (asked++, route.fulfill({ contentType: 'application/json', body: '{"version":"next"}' })));
  await page.evaluate(() => {
    // (the first: Chromium may install the same worker again as the reload starts, a second claim after it)
    navigator.serviceWorker.addEventListener('controllerchange', () => sessionStorage.getItem('e2e.swChanged') ?? sessionStorage.setItem('e2e.swChanged', String(Date.now())));
    (window as unknown as { __before?: boolean }).__before = true;
  });
  // (Kit checks version.json as the app comes back to the front)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  // reloaded: a new page (not the one marked), by the app (its reloadAt), the HUD up
  // (red now and then on CI, the reload never came in 60 s, never here: what the page was waiting on, said with it)
  await expect.poll(() => page.evaluate(() => !(window as unknown as { __before?: boolean }).__before && !!sessionStorage.getItem('island.reloadAt')).catch(() => false), { timeout: 60_000, message: 'the app reloaded into the new worker' }).toBe(true).catch(async (e: Error) => {
    const why = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const w = (x?: ServiceWorker | null) => x && `${x.state} ${x.scriptURL === navigator.serviceWorker.controller?.scriptURL ? '(in control)' : ''}`;
      return { installing: w(reg?.installing), waiting: w(reg?.waiting), active: w(reg?.active), reloadAt: sessionStorage.getItem('island.reloadAt'), swChanged: sessionStorage.getItem('e2e.swChanged'), open: document.querySelectorAll('dialog[open]').length };
    }).catch((x: Error) => x.message);
    throw new Error(`${e.message}\n(version.json asked ${asked}×; ${JSON.stringify(why)})`);
  });
  await context.unroute('**/_app/version.json');
  await expect(hudMenu(page)).toBeVisible();
  const [changed, reloadAt] = await page.evaluate(() => [sessionStorage.getItem('e2e.swChanged'), sessionStorage.getItem('island.reloadAt')]);
  expect(changed, 'the new worker claimed the page').not.toBeNull();
  expect(Number(reloadAt)).toBeGreaterThanOrEqual(Number(changed));
});

// (Chromium: offline as offline.spec takes it)
test('a first visit registers the worker only once the island has its models in; then it opens offline', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(120_000);
  // when the app registers it, and whether the island had loaded() then (ui-state/swLate.ts)
  await page.addInitScript(() => {
    const reg = ServiceWorkerContainer.prototype.register;
    ServiceWorkerContainer.prototype.register = function (...a: Parameters<typeof reg>) {
      const w = window as unknown as { __world3d?: { loaded(): boolean }; __reg?: boolean[] };
      (w.__reg ??= []).push(!!w.__world3d?.loaded());
      return reg.apply(this, a);
    };
  });
  await page.goto('?demo');
  await islandUp(page);
  await controlled(page);
  expect(await page.evaluate(() => (window as unknown as { __reg?: boolean[] }).__reg)).toEqual([true]);
  await context.setOffline(true);
  const again = await page.reload();
  expect(again?.fromServiceWorker()).toBe(true);
  await islandUp(page);
  await context.setOffline(false);
});

/** A hashed chunk the new build's install has to fetch (as a deploy's changed chunk: not in the cached shell to copy). */
const notCached = (page: Page) => page.evaluate(async () => {
  const key = (await caches.keys()).filter((k) => k.startsWith('island-shell-')).at(-1)!;
  const cache = await caches.open(key);
  const req = (await cache.keys()).find((r) => r.url.includes('/_app/immutable/chunks/'))!;
  await cache.delete(req);
  return new URL(req.url).pathname;
});
/** A deploy seen as the app comes back to the front (the first test's stand-ins). */
async function deploy(page: Page, context: import('@playwright/test').BrowserContext) {
  await askSwapAgain(page, context);
  await page.request.get('/__e2e/deploy');
  let asked = 0;
  await context.route('**/_app/version.json', (route) => (asked++, route.fulfill({ contentType: 'application/json', body: '{"version":"next"}' })));
  await page.evaluate(() => {
    // (the first: Chromium may install the same worker again as the reload starts, a second claim after it)
    navigator.serviceWorker.addEventListener('controllerchange', () => sessionStorage.getItem('e2e.swChanged') ?? sessionStorage.setItem('e2e.swChanged', String(Date.now())));
  });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
}

test('a deploy whose install fails reloads nothing, and the next time the app comes back it installs and reloads', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.goto('?demo');
  await islandUp(page);
  await controlled(page);
  const chunk = await notCached(page);
  const fail = (route: import('@playwright/test').Route) => route.fulfill({ status: 503, body: '' });
  await context.route(`**${chunk}`, fail);
  const navs: string[] = [];
  page.on('framenavigated', (f) => f === page.mainFrame() && navs.push(f.url()));
  await deploy(page, context);
  // (the new worker tried and failed: redundant, the page still the old one's, no reload)
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!reg && !reg.installing && !reg.waiting;
  }, null, { timeout: 30_000, polling: 200 });
  await page.waitForTimeout(3000);
  expect(navs, 'no reload into the old cached shell').toEqual([]);
  expect(await page.evaluate(() => [sessionStorage.getItem('e2e.swChanged'), sessionStorage.getItem('island.reloadAt')])).toEqual([null, null]);
  // the network back: the next time the app comes to the front it asks again, installs, and then reloads
  await context.unroute(`**${chunk}`, fail);
  const reloaded = page.waitForEvent('framenavigated', { timeout: 60_000 });
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await reloaded;
  await context.unroute('**/_app/version.json');
  await expect(hudMenu(page)).toBeVisible();
  const [changed, reloadAt] = await page.evaluate(() => [sessionStorage.getItem('e2e.swChanged'), sessionStorage.getItem('island.reloadAt')]);
  expect(changed, 'the new worker claimed the page').not.toBeNull();
  expect(Number(reloadAt)).toBeGreaterThanOrEqual(Number(changed));
});

test('a slow install is waited for (no reload before its worker is in); a static file that fails costs only itself; the unchanged ones are copied', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.goto('?demo');
  await islandUp(page);
  await controlled(page);
  const chunk = await notCached(page);
  // the manifest gone from the old shell, so the install fetches it (the unchanged static files are copied: below)
  await page.evaluate(async () => {
    const key = (await caches.keys()).filter((k) => k.startsWith('island-shell-')).at(-1)!;
    await (await caches.open(key)).delete('manifest.webmanifest');
  });
  // (the worker's own fetches of static files till the reload: after it, the page's art comes through it too)
  const statics = new Set<string>();
  let installing = true;
  context.on('request', (r) => {
    const p = new URL(r.url()).pathname;
    if (installing && r.serviceWorker() && /\/(art|hiking|travel)\/|\.webmanifest$/.test(p)) statics.add(p.split('/').at(-1)!);
  });
  // the chunk takes 20 s (past the old 15 s wait, which then reloaded into the old shell); the manifest 404s
  const slow = async (route: import('@playwright/test').Route) => {
    await new Promise((r) => setTimeout(r, 20_000));
    await route.fallback().catch(() => {});
  };
  const gone = (route: import('@playwright/test').Route) => route.fulfill({ status: 404, body: '' });
  await context.route(`**${chunk}`, slow);
  await context.route('**/manifest.webmanifest', gone);
  const reloaded = page.waitForEvent('framenavigated', { timeout: 60_000 });
  await deploy(page, context);
  await reloaded;
  installing = false;
  await context.unroute('**/_app/version.json');
  await context.unroute(`**${chunk}`, slow);
  await context.unroute('**/manifest.webmanifest', gone);
  await expect(hudMenu(page)).toBeVisible();
  // the static files copied by their hashes (caches.ts installStatics): only the one not held was fetched
  expect([...statics]).toEqual(['manifest.webmanifest']);
  const [changed, reloadAt] = await page.evaluate(() => [sessionStorage.getItem('e2e.swChanged'), sessionStorage.getItem('island.reloadAt')]);
  expect(changed, 'the new worker claimed the page').not.toBeNull();
  expect(Number(reloadAt)).toBeGreaterThanOrEqual(Number(changed));
});

test('the room cache: a file\'s older version goes, and a cache from before the index is counted whole', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(90_000);
  await page.goto('?demo');
  await islandUp(page);
  await controlled(page);
  // the island's models through the worker into the room cache
  await page.reload();
  await islandUp(page);
  const room = () => page.evaluate(async () => {
    const c = await caches.open('island-room-v1');
    return (await c.keys()).map((k) => new URL(k.url).pathname + new URL(k.url).search);
  });
  await expect.poll(async () => (await room()).filter((u) => u.includes('/room/world3d/')).length, { timeout: 30_000 }).toBeGreaterThan(5);
  await expect.poll(async () => (await room()).includes('/__room-index'), { timeout: 10_000 }).toBe(true);
  // an older version of one of them put before it (a re-converted model's last ?v=), and no index (a cache from before it)
  const real = await page.evaluate(async () => {
    const c = await caches.open('island-room-v1');
    const k = (await c.keys()).find((r) => r.url.includes('/room/world3d/') && r.url.includes('?v='))!;
    const res = (await c.match(k))!;
    const old = k.url.replace(/\?v=[^&]+/, '?v=0');
    await c.delete(k);
    await c.put(old, new Response('old', { headers: { 'content-type': 'model/gltf-binary' } }));
    await c.put(k, res);
    await c.delete(new URL('__room-index', (await navigator.serviceWorker.getRegistration())!.scope).href);
    return { url: new URL(k.url).pathname + new URL(k.url).search, old: new URL(old).pathname + new URL(old).search };
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send('ServiceWorker.enable');
  await cdp.send('ServiceWorker.stopAllWorkers');
  await page.reload();
  await islandUp(page);
  await expect.poll(async () => (await room()).includes(real.old), { timeout: 20_000 }).toBe(false);
  expect(await room()).toContain(real.url);
  const index = () => page.evaluate(async () => {
    const c = await caches.open('island-room-v1');
    const r = await c.match(new URL('__room-index', (await navigator.serviceWorker.getRegistration())!.scope).href);
    return r ? ((await r.json()) as Record<string, [number, number]>) : {};
  });
  // (every file in it, with its bytes, once the island's loads settle: it's kept 2 s after a change)
  await expect.poll(async () => Object.keys(await index()).length - ((await room()).length - 1), { timeout: 30_000 }).toBe(0);
  expect(Object.entries(await index()).find(([u]) => u.endsWith(real.url))?.[1][0]).toBeGreaterThan(100);
});

// (in Chromium, as the room's)
test('ききみみ’s packs: the lobby’s deck’s pack goes into the listen cache whole, once, with its bytes in the index', { tag: '@chromium' }, async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('?demo&kikimimi=fast');
  await islandUp(page);
  await controlled(page);
  await fromMenu(page, 'kikimimi');
  await expect(page.locator('dialog[open] [data-kikimimi]')).toHaveAttribute('data-phase', 'lobby');
  const listen = () => page.evaluate(async () => {
    const c = await caches.open('island-listen-v1');
    const idx = await c.match(new URL('__listen-index', (await navigator.serviceWorker.getRegistration())!.scope).href);
    return { keys: (await c.keys()).map((k) => { const u = new URL(k.url); return u.pathname + u.search; }), index: idx ? ((await idx.json()) as Record<string, [number, number]>) : {} };
  });
  // (level 1's deck: its pack whole, as Pages answers a Range; never a slice `?s=`)
  const pack = /\/audio\/listen\/lv1\.[0-9a-f]{8}\.pak$/;
  await expect.poll(async () => Object.entries((await listen()).index).filter(([u, [n]]) => pack.test(u) && n > 100_000).length, { timeout: 20_000 }).toBe(1);
  expect((await listen()).keys.filter((p) => p.includes('?s='))).toEqual([]);
  // and not in the audio LRU's cache
  expect(await page.evaluate(async () => (await (await caches.open('island-audio-v1')).keys()).filter((k) => k.url.includes('/audio/listen/')).length)).toBe(0);
});
