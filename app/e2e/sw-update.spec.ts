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
