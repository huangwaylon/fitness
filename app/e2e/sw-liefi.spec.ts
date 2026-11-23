// A launch waits on no network (the launch round 11-23, docs/backend.md "Service worker" › Navigations): once the app
// has been opened online, a launch on lie-fi (connected, every request hung, never answered) and offline is this
// version's cached shell, the HUD, and each sheet seen before with its cached data, all before any network request
// answers: an order, not a timing (the hung requests are let go only after the last check). Chromium only: WebKit's
// Playwright build neither routes a service worker's fetches nor takes it offline.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, hudMenu, openKenkou } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { routePlaces } from './places.ts';
import { shellOf } from './swShell.ts';

test.use({ serviceWorkers: 'allow', viewport: { width: 393, height: 852 } });

/** Each menu sheet and a row of its content (its data the cached copy's: the record's, the bundled, 保存した場所's). */
const SHEETS = [
  ['travel', 'dialog[open] [data-travel] [data-trip]'],
  ['hiking', 'dialog[open] [data-hiking] [data-trail]'],
  ['places', 'dialog[open] [data-places] [data-place-row]'],
  ['todo', 'dialog[open] [data-todo]'],
  ['bells', 'dialog[open] [data-wallet]'],
  ['settings', 'dialog[open] [data-settings]']
] as const;

async function everySheet(page: Page) {
  await expect(hudMenu(page)).toBeVisible();
  for (const [which, row] of SHEETS) {
    await fromMenu(page, which);
    await expect(page.locator(row).first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }
  for (const tab of ['health', 'food'] as const) {
    await openKenkou(page, tab);
    await expect(page.locator(`dialog[open] [data-kenkou-tab=${tab}]`)).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }
}

/** Opened online once, paired, 保存した場所 answered: each sheet's chunk kept by the worker, its data in its cache. */
async function visited(page: Page, context: import('@playwright/test').BrowserContext) {
  await page.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  const rec = newRecord();
  await rec.pair(context, 'A');
  const places = await routePlaces(page);
  await page.goto('');
  await islandUp(page);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 20_000 });
  await everySheet(page);
  return { rec, places };
}

test('lie-fi: the cached shell, the HUD and every sheet seen before, with its data, before any request answers', { tag: '@chromium' }, async ({ page, context }) => {
  await visited(page, context);
  // lie-fi: every request the routes see (the relay, version.json, 保存した場所's, a file no cache holds) hangs, let go
  // only after the last check; the navigation's own page (the navigation preload: no route sees it) the server holds
  // 3 s (serve-build `?e2eSlow=`). The worker's record that the network named this build lately dropped, so the launch
  // asks for the page (caches.ts FRESH_KEY: else `skip`, no ask).
  await page.evaluate(async () => {
    const key = (await caches.keys()).filter((k) => k.startsWith('island-shell-')).at(-1)!;
    await (await caches.open(key)).delete('__fresh');
  });
  const hung: string[] = [];
  let release = () => {};
  const gate = new Promise<void>((r) => (release = r));
  const hang = async (route: import('@playwright/test').Route) => {
    hung.push(route.request().url());
    await gate;
    await route.abort('timedout').catch(() => {});
  };
  await context.route('**/*', hang);
  await page.route('**/*', hang);
  const again = await page.goto('?e2eSlow=3000', { waitUntil: 'commit' });
  expect(again?.fromServiceWorker()).toBe(true);
  await everySheet(page);
  expect(hung.length, 'the network was asked (and never answered)').toBeGreaterThan(0);
  // the page answered before the network's page was read, and the worker's check read it after (`same`): till 11-23
  // the answer waited 400 ms on it and then gave it up (`cache`)
  await expect.poll(() => shellOf(page), { timeout: 15_000 }).toBe('same');
  release();
});

test('offline: the cached shell, the HUD and every sheet seen before, with its data', { tag: '@chromium' }, async ({ page, context }) => {
  const { rec, places } = await visited(page, context);
  // (the relay's and 保存した場所's routes out of reach too)
  rec.offline(true);
  places.down(true);
  await context.setOffline(true);
  const off = await page.reload({ waitUntil: 'commit' });
  expect(off?.fromServiceWorker()).toBe(true);
  await everySheet(page);
  await context.setOffline(false);
});
