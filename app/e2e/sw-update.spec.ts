// The service worker's launch and update (docs/backend.md "Service worker"): a first visit's page comes from the
// network; once installed, a navigation is this version's cached shell at once (the network not waited on, however
// slow); a deploy (a new worker, _app/version.json naming a new version) reloads the page only once the new worker
// controls it, so the reload is served the new build's own shell.
import { expect, test, type Page } from '@playwright/test';
import { hudMenu } from './hud.ts';

test.use({ serviceWorkers: 'allow' });

const controlled = (page: Page) => page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60_000 });

// (in Chromium: WebKit's Playwright build doesn't route a service worker's own fetches)
test('a navigation is the cached shell at once; a deploy reloads once its worker is in', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(120_000);
  const first = await page.goto('?demo&critter=none&visitor=none');
  expect(first?.fromServiceWorker()).toBe(false);
  await expect(hudMenu(page)).toBeVisible();
  await controlled(page);

  // the network for pages hangs 20 s: the reload doesn't wait for it
  const slow = async (route: import('@playwright/test').Route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    await new Promise((r) => setTimeout(r, 20_000));
    await route.fallback().catch(() => {});
  };
  await context.route('**/*', slow);
  const t = Date.now();
  const again = await page.reload();
  expect(again?.fromServiceWorker()).toBe(true);
  await expect(hudMenu(page)).toBeVisible();
  expect(Date.now() - t).toBeLessThan(10_000);
  await context.unroute('**/*', slow);
  await controlled(page);

  // a deploy: a changed worker, and version.json naming a new version
  // (the server's stand-in for a deploy: the worker's script changes; scripts/serve-build.ts)
  await page.request.get('/__e2e/deploy');
  await context.route('**/_app/version.json', (route) => route.fulfill({ contentType: 'application/json', body: '{"version":"next"}' }));
  await page.evaluate(() => {
    navigator.serviceWorker.addEventListener('controllerchange', () => sessionStorage.setItem('e2e.swChanged', String(Date.now())));
  });
  const reloaded = page.waitForEvent('framenavigated', { timeout: 60_000 });
  // (Kit checks version.json as the app comes back to the front)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await reloaded;
  await context.unroute('**/_app/version.json');
  await expect(hudMenu(page)).toBeVisible();
  const [changed, reloadAt] = await page.evaluate(() => [sessionStorage.getItem('e2e.swChanged'), sessionStorage.getItem('island.reloadAt')]);
  expect(changed, 'the new worker claimed the page').not.toBeNull();
  expect(Number(reloadAt)).toBeGreaterThanOrEqual(Number(changed));
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
  await page.request.get('/__e2e/deploy');
  await context.route('**/_app/version.json', (route) => route.fulfill({ contentType: 'application/json', body: '{"version":"next"}' }));
  await page.evaluate(() => {
    navigator.serviceWorker.addEventListener('controllerchange', () => sessionStorage.setItem('e2e.swChanged', String(Date.now())));
  });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
}

test('a deploy whose install fails reloads nothing, and the next time the app comes back it installs and reloads', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.goto('?demo&critter=none&visitor=none');
  await expect(hudMenu(page)).toBeVisible();
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

test('a slow install is waited for (no reload before its worker is in); a static file that fails costs only itself', { tag: '@chromium' }, async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.goto('?demo&critter=none&visitor=none');
  await expect(hudMenu(page)).toBeVisible();
  await controlled(page);
  const chunk = await notCached(page);
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
  await context.unroute('**/_app/version.json');
  await context.unroute(`**${chunk}`, slow);
  await context.unroute('**/manifest.webmanifest', gone);
  await expect(hudMenu(page)).toBeVisible();
  const [changed, reloadAt] = await page.evaluate(() => [sessionStorage.getItem('e2e.swChanged'), sessionStorage.getItem('island.reloadAt')]);
  expect(changed, 'the new worker claimed the page').not.toBeNull();
  expect(Number(reloadAt)).toBeGreaterThanOrEqual(Number(changed));
});
