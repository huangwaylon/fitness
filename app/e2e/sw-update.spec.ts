// The service worker's launch and update (docs/backend.md "Service worker"): a first visit's page comes from the
// network; once installed, a navigation is this version's cached shell at once (the network not waited on, however
// slow); a deploy (a new worker, _app/version.json naming a new version) reloads the page only once the new worker
// controls it, so the reload is served the new build's own shell.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu, hudMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { ORIGIN as ITS, cors, payload } from './its.ts';

test.use({ serviceWorkers: 'allow' });
// one test at a time, in order: a deploy (scripts/serve-build.ts /__e2e/deploy) changes the worker's script for the
// whole server, so another of these running at once took it as its own new worker in the middle of its reload
test.describe.configure({ mode: 'default' });

const controlled = (page: Page) => page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60_000 });
/** A first launch's warm-up done (service-worker/index.ts `warm`: the worker's fetches of the models and art the page
 *  had before it was in), so the worker's fetches after it are the test's own. Before the goto. */
const warmed = async (page: Page) => {
  await page.addInitScript(() => navigator.serviceWorker?.addEventListener('message', (e) => (e.data as { k?: string } | null)?.k === 'warmed' && ((window as unknown as { __warmed?: boolean }).__warmed = true)));
  return () => page.waitForFunction(() => (window as unknown as { __warmed?: boolean }).__warmed === true, null, { timeout: 60_000 });
};

/** The app hidden (as iOS hides it), again until the page is a new one: the deploy taken out of sight once its worker
 *  controls the page and nothing is open (ui-state/update.ts; a hide before that reloads nothing). */
async function hideIntoDeploy(page: Page) {
  await page.evaluate(() => ((window as unknown as { __old?: boolean }).__old = true));
  await expect.poll(() => page.evaluate(() => {
    if (!(window as unknown as { __old?: boolean }).__old) return true;
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    return false;
  }).catch(() => false), { timeout: 60_000, message: 'reloaded into the deploy as the app hid' }).toBe(true);
}

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
test('a navigation is the cached shell at once; a deploy is taken as the app hides, never in front (設定 stays open)', { tag: '@chromium' }, async ({ page, context }) => {
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
  await fromMenu(page, 'settings');
  // the new worker in control, the app still in front: no reload, 設定 open (the phones before: the whole island
  // reloaded under it)
  await page.waitForFunction(() => !!sessionStorage.getItem('e2e.swChanged'), null, { timeout: 60_000 });
  await page.evaluate(() => new Promise((ok) => setTimeout(ok)));
  expect(await page.evaluate(() => [!!(window as unknown as { __before?: boolean }).__before, sessionStorage.getItem('island.reloadAt')])).toEqual([true, null]);
  await expect(page.locator('dialog[open] [data-settings]')).toBeVisible();
  // hidden with 設定 open: kept for later; closed, the next hide takes it
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
  });
  await page.evaluate(() => new Promise((ok) => setTimeout(ok)));
  expect(await page.evaluate(() => sessionStorage.getItem('island.reloadAt'))).toBeNull();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await hideIntoDeploy(page);
  // reloaded: a new page (not the one marked), by the app (its reloadAt), the HUD up
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
  // the room files it fetched before the worker was in, kept by the worker now (swLate.ts's `warm`): no reload needed;
  // every one, and the transcoder its worker fetched (not in the page's timings) with the first KTX2 pack (WebKit's
  // warm-up stalled at its first file, review 11-13 N1: checked by hand there, a worker's fetches aren't routed in it)
  const fetched = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).filter((u) => new URL(u).pathname.includes('/room/')));
  expect(fetched.length).toBeGreaterThan(20);
  await expect.poll(async () => {
    const kept = await page.evaluate(async () => (await (await caches.open('island-room-v1')).keys()).map((k) => k.url));
    const missing = fetched.filter((u) => !kept.includes(u));
    if (fetched.some((u) => u.includes('/room/tex/')) && !kept.some((u) => u.includes('/room/basis/'))) missing.push('room/basis/');
    return missing;
  }, { timeout: 30_000 }).toEqual([]);
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

/** Where this page came from (the worker's Server-Timing `shell`: service-worker/caches.ts marked). */
const shellOf = (page: Page) => page.evaluate(() => (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.serverTiming.find((t) => t.name === 'shell')?.description ?? null);

// (the phones, 11-11..11-14: a cold open into a waiting deploy showed the old build's HUD ~3 s, then reloaded under the
// player; now the launch's page is the network's when it's in time: a deploy's own, no reload into it)
test('a launch is the network\'s page within the race, else the cached shell at once; the island waits on no version ask (service-worker/caches.ts raceShell)', { tag: '@chromium' }, async ({ page, context }) => {
  await page.goto('?demo');
  await islandUp(page);
  await controlled(page);
  // in time: the network's page, through the worker (its navigation preload)
  const open = await page.goto('?demo');
  expect(open?.fromServiceWorker()).toBe(true);
  await islandUp(page);
  expect(await shellOf(page)).toBe('net');
  // the network's page past the race (one bar; the server answers it 3 s late): the cached shell, the island up before
  await page.goto('?demo&e2eSlow=3000');
  await islandUp(page);
  expect(await shellOf(page)).toBe('cache');
  // offline: the cached shell at once
  await context.setOffline(true);
  await page.goto('?demo');
  await islandUp(page);
  expect(await shellOf(page)).toBe('cache');
  await context.setOffline(false);
  expect(await page.evaluate(() => sessionStorage.getItem('island.reloadAt')), 'no reload of the app\'s own').toBeNull();
});

// (a notification's tap on the closed app, the user's report 2026-11-13: ボット opened on 保養所, then a launch's reload
// went back to the island; no launch reloads now: the param goes at once)
test('a cold open at ?open=its opens ボット on 保養所, and it stays', { tag: '@chromium' }, async ({ page, context }) => {
  await page.addInitScript(() => {
    localStorage.setItem('e2e.render', 'none');
    sessionStorage.setItem('e2e.docs', String(Number(sessionStorage.getItem('e2e.docs') ?? 0) + 1));
  });
  const rec = newRecord();
  await rec.pair(context, 'A');
  await context.route(`${ITS}/**`, (route) => route.request().method() === 'OPTIONS'
    ? route.fulfill({ status: 204, headers: cors() })
    : route.fulfill({ status: 200, contentType: 'application/json', headers: cors(), body: JSON.stringify(payload(rec.now())) }));
  await page.goto('');
  await islandUp(page);
  await controlled(page);
  await page.evaluate(() => sessionStorage.setItem('e2e.docs', '0'));
  await page.goto('?open=its');
  await islandUp(page);
  const sheet = page.locator('dialog[open] [data-bots]');
  await expect(sheet).toHaveAttribute('data-tab', 'its');
  await expect(sheet.locator('[data-its-verdict]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => location.search)).toBe('');
  await expect(sheet).toHaveAttribute('data-tab', 'its');
  expect(await page.evaluate(() => Number(sessionStorage.getItem('e2e.docs')))).toBe(1);
});

test('a deploy this build can\'t work with (version.json compat past its own: contract/compat.ts) is taken in front, but only once nothing is open', { tag: '@chromium' }, async ({ page, context }) => {
  await page.goto('?demo');
  await islandUp(page);
  await controlled(page);
  await fromMenu(page, 'settings');
  await askSwapAgain(page, context);
  await page.request.get('/__e2e/deploy');
  await context.route('**/_app/version.json', (route) => route.fulfill({ contentType: 'application/json', body: '{"version":"next","compat":99}' }));
  await page.evaluate(() => {
    navigator.serviceWorker.addEventListener('controllerchange', () => sessionStorage.getItem('e2e.swChanged') ?? sessionStorage.setItem('e2e.swChanged', String(Date.now())));
    (window as unknown as { __before?: boolean }).__before = true;
  });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(() => !!sessionStorage.getItem('e2e.swChanged'), null, { timeout: 60_000 });
  await page.evaluate(() => new Promise((ok) => setTimeout(ok)));
  // 設定 open: kept
  expect(await page.evaluate(() => sessionStorage.getItem('island.reloadAt'))).toBeNull();
  await expect(page.locator('dialog[open] [data-settings]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => !(window as unknown as { __before?: boolean }).__before && !!sessionStorage.getItem('island.reloadAt')).catch(() => false), { timeout: 30_000, message: 'reloaded in front once 設定 closed' }).toBe(true);
  await context.unroute('**/_app/version.json');
  await expect(hudMenu(page)).toBeVisible();
});

test('a deploy whose install fails reloads nothing; the next time the app comes back it installs, and the next hide reloads', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(120_000);
  const warm = await warmed(page);
  await page.goto('?demo');
  await islandUp(page);
  await controlled(page);
  await warm();
  const chunk = await notCached(page);
  let failed = 0;
  const fail = (route: import('@playwright/test').Route) => (failed++, route.fulfill({ status: 503, body: '' }));
  await context.route(`**${chunk}`, fail);
  const navs: string[] = [];
  page.on('framenavigated', (f) => f === page.mainFrame() && navs.push(f.url()));
  await deploy(page, context);
  // (the new worker tried and failed: its install asked for the chunk, it went redundant, the page still the old one's)
  await expect.poll(() => failed, { timeout: 30_000 }).toBeGreaterThan(0);
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!reg && !reg.installing && !reg.waiting;
  }, null, { timeout: 30_000, polling: 200 });
  // a task after it: the app's own statechange listener (newWorker false) and its effects have run, reloading nothing
  await page.evaluate(() => new Promise((ok) => setTimeout(ok)));
  expect(navs, 'no reload into the old cached shell').toEqual([]);
  expect(await page.evaluate(() => [sessionStorage.getItem('e2e.swChanged'), sessionStorage.getItem('island.reloadAt')])).toEqual([null, null]);
  // the network back: the next time the app comes to the front it asks again and installs; the next hide reloads
  await context.unroute(`**${chunk}`, fail);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForFunction(() => !!sessionStorage.getItem('e2e.swChanged'), null, { timeout: 60_000 });
  await hideIntoDeploy(page);
  await context.unroute('**/_app/version.json');
  await expect(hudMenu(page)).toBeVisible();
  const [changed, reloadAt] = await page.evaluate(() => [sessionStorage.getItem('e2e.swChanged'), sessionStorage.getItem('island.reloadAt')]);
  expect(changed, 'the new worker claimed the page').not.toBeNull();
  expect(Number(reloadAt)).toBeGreaterThanOrEqual(Number(changed));
});

// (the phones, 2026-11-14: a launch's reload came ~3 s in, under the player. The new worker installed in 0.3 s, then
// waited ~2 s to activate: the old one's fetches of art held their events open on the bounded caches' index write)
test('a deploy\'s worker takes over at once though the old one just served art: no event waits on the index\'s write (service-worker/bounded.ts)', { tag: '@chromium' }, async ({ page, context }) => {
  const warm = await warmed(page);
  await page.goto('?demo');
  await islandUp(page);
  await controlled(page);
  await warm();
  await askSwapAgain(page, context);
  await page.request.get('/__e2e/deploy');
  const ms = await page.evaluate(async () => {
    const reg = (await navigator.serviceWorker.getRegistration())!;
    // art through the old worker (kept on first use, marked in its index): new URLs, so each is fetched and kept
    await Promise.all(['ace', 'admiral'].map((n) => fetch(new URL(`art/villagers/${n}.webp?e2e=bounded`, reg.scope)).then((r) => r.blob())));
    const at: Record<string, number> = {};
    const took = new Promise<void>((done) => {
      reg.addEventListener('updatefound', () => {
        const w = reg.installing!;
        // (each change's event time: no wall clock read)
        w.addEventListener('statechange', (e) => {
          at[w.state] ??= e.timeStamp;
          if (w.state === 'activating' || w.state === 'redundant') done();
        });
      }, { once: true });
    });
    await reg.update();
    await took;
    return at.activating !== undefined && at.installed !== undefined ? at.activating - at.installed : -1;
  });
  expect(ms, 'installed → activating (ms)').toBeGreaterThanOrEqual(0);
  expect(ms, 'installed → activating (ms): the old worker idle').toBeLessThan(800);
});

test('a slow install is waited for (no reload before its worker is in); a static file that fails costs only itself; the unchanged ones are copied', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(120_000);
  const warm = await warmed(page);
  await page.goto('?demo');
  await islandUp(page);
  await controlled(page);
  await warm();
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
  await deploy(page, context);
  await hideIntoDeploy(page);
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

// The features a phone may never open (caches.ts carried: the English catalogs, the wedding board) aren't
// precached: kept in the shell when first used, carried by a deploy's install, there offline after it. The font cache
// (FONTS) let go of the slices the new build's style sheets no longer name (a re-subset's), at its activation.
test('the wedding board kept once opened and carried by a deploy (offline after); the font cache trimmed at activation', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(120_000);
  const warm = await warmed(page);
  await page.goto('?demo');
  await islandUp(page);
  await controlled(page);
  await warm();
  /** The newest shell's chunks named for a feature (vite.config.ts feature-names). */
  const shellHas = (name: string) => page.evaluate(async (n) => {
    const key = (await caches.keys()).filter((k) => k.startsWith('island-shell-')).at(-1)!;
    return (await (await caches.open(key)).keys()).filter((r) => new RegExp(`/chunks/${n}\\.[\\w-]+\\.js$`).test(r.url)).length;
  }, name);
  expect([await shellHas('wedding'), await shellHas('en')], 'not precached').toEqual([0, 0]);
  await fromMenu(page, 'wedding');
  await expect.poll(() => shellHas('wedding'), { timeout: 10_000, message: 'kept on first use' }).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // the font cache: a slice no style sheet names (an older subset's) and one they do
  const fonts = () => page.evaluate(async () => (await (await caches.open('island-fonts-v1')).keys()).map((r) => r.url.split('/').pop()!));
  const named = await page.evaluate(async () => {
    const css = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules].map((r) => r.cssText); } catch { return []; } }).join('\n');
    const file = /zen-maru-gothic-[\w-]+\.[\w-]+\.woff2/.exec(css)![0];
    const c = await caches.open('island-fonts-v1'), dir = new URL('_app/immutable/assets/', (await navigator.serviceWorker.getRegistration())!.scope).href;
    for (const f of [file, 'zen-maru-gothic-0-500-normal.0ld0ld00.woff2']) await c.put(dir + f, new Response('font', { headers: { 'content-type': 'font/woff2' } }));
    return file;
  });
  expect(await fonts()).toEqual(expect.arrayContaining([named, 'zen-maru-gothic-0-500-normal.0ld0ld00.woff2']));
  await deploy(page, context);
  await hideIntoDeploy(page);
  await context.unroute('**/_app/version.json');
  await expect(hudMenu(page)).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('e2e.swChanged')), 'the new worker claimed the page').not.toBeNull();
  expect(await shellHas('wedding'), "carried into the new worker's shell").toBeGreaterThan(0);
  await expect.poll(fonts, { timeout: 10_000 }).not.toContain('zen-maru-gothic-0-500-normal.0ld0ld00.woff2');
  expect(await fonts()).toContain(named);
  await context.setOffline(true);
  await fromMenu(page, 'wedding');
  await expect(page.locator('dialog[open] [data-wed-tab="plan"]')).toBeVisible();
  await context.setOffline(false);
});

test('the room cache: a file\'s older version goes, and a cache from before the index is counted whole; a warm launch\'s KTX2s count as used', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(90_000);
  const warm = await warmed(page);
  await page.goto('?demo');
  await islandUp(page);
  await controlled(page);
  await warm();
  const room = () => page.evaluate(async () => {
    const c = await caches.open('island-room-v1');
    return (await c.keys()).map((k) => new URL(k.url).pathname + new URL(k.url).search);
  });
  const index = () => page.evaluate(async () => {
    const c = await caches.open('island-room-v1');
    const r = await c.match(new URL('__room-index', (await navigator.serviceWorker.getRegistration())!.scope).href);
    return r ? ((await r.json()) as Record<string, [number, number]>) : {};
  });
  const ktx2Since = async (t: number) => Object.entries(await index()).filter(([u, [, at]]) => u.includes('/room/tex/') && u.includes('.ktx2p') && at >= t).length;
  // the island's models in the room cache (the first launch's, warmed); a warm launch reads its textures back from
  // IndexedDB (world3d/ktx2.ts), never fetching their KTX2s, and tells the worker they were used (the room's index):
  // else the island's own looked least recently used, the first let go past the cap
  await expect.poll(() => ktx2Since(0), { timeout: 20_000 }).toBeGreaterThan(10);
  const fetched: string[] = [];
  const onReq = (r: import('@playwright/test').Request) => void (r.url().includes('.ktx2p') && fetched.push(r.url()));
  page.on('request', onReq);
  const since = await page.evaluate(() => Date.now());
  await page.reload();
  await islandUp(page);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { ktx2(): { kept: number } } }).__world3d.ktx2().kept)).toBeGreaterThan(20);
  await expect.poll(() => ktx2Since(since), { timeout: 20_000 }).toBeGreaterThan(10);
  page.off('request', onReq);
  expect(fetched, 'the textures read back from IndexedDB').toEqual([]);
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
  await page.locator('dialog[open] [data-kikimimi] [data-kiki-tile="asobu"]').click();
  await page.locator('dialog[open] [data-kikimimi] [data-kiki-mode-tile="quiz"]').click(); // (a game in sight: its deck's first pack)
  const listen = () => page.evaluate(async () => {
    const c = await caches.open('island-listen-v1');
    const idx = await c.match(new URL('__listen-index', (await navigator.serviceWorker.getRegistration())!.scope).href);
    return { keys: (await c.keys()).map((k) => { const u = new URL(k.url); return u.pathname + u.search; }), index: idx ? ((await idx.json()) as Record<string, [number, number]>) : {} };
  });
  // (the quiz's deck, はまべ's: its pack whole, as Pages answers a Range; never a slice `?s=`)
  const pack = /\/audio\/listen\/lv\d\.[0-9a-f]{8}\.pak$/;
  await expect.poll(async () => Object.entries((await listen()).index).filter(([u, [n]]) => pack.test(u) && n > 100_000).length, { timeout: 20_000 }).toBe(1);
  expect((await listen()).keys.filter((p) => p.includes('?s='))).toEqual([]);
  // and not in the audio LRU's cache
  expect(await page.evaluate(async () => (await (await caches.open('island-audio-v1')).keys()).filter((k) => k.url.includes('/audio/listen/')).length)).toBe(0);
});
