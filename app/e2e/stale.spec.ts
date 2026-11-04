// Stale-build recovery: a lazy chunk that fails to load (the deploy replaced it) reloads the page once, and the next
// open works; the failed import is not remembered. Not on a page that is leaving (its every load fails), nor offline.
import { expect, test } from '@playwright/test';
import { is3d } from './island.ts';
import { hudBells, hudMenu, openRewards, unfoldMenu } from './hud.ts';

// (in Chromium: playwright.config.ts)
test('a failed panel chunk reloads the page once, then the panel opens', { tag: '@chromium' }, async ({ page }) => {
  // (no critter or visitor coming by: each loads its own chunk when it comes, and one 404ing under the route below
  // reloaded the page before the panel was asked for, its menu then folded: CI run 41798557650)
  await page.goto('?demo&critter=none&visitor=none&date=2026-11-04T12:00');
  await expect(hudMenu(page)).toBeVisible();
  // (the 3D island's own chunks, three and its scene, come in after the HUD: all in first)
  await is3d(page);
  // The menu open and its pills in place first (their spring: on a busy runner seconds), so the only chunk asked for
  // under the route is the panel's.
  await unfoldMenu(page);
  // From now on every JS chunk 404s, as after a deploy that removed the old build's files (the page's own chunks
  // are already loaded).
  const stale = (route: import('@playwright/test').Route) => route.fulfill({ status: 404, body: '' });
  await page.route('**/_app/immutable/**/*.js', stale);
  const reloaded = page.waitForEvent('framenavigated');
  await hudBells(page).click();
  await reloaded;
  await page.unroute('**/_app/immutable/**/*.js', stale);
  await page.waitForLoadState('load');
  await openRewards(page);
  await expect(page.locator('dialog[open]').locator('[data-wallet]')).toBeVisible(); // it opens on ごほうび
});

test('a chunk that fails as the page leaves (or offline: every load fails) reloads nothing', async ({ page }) => {
  await page.goto('?demo');
  await expect(hudMenu(page)).toBeVisible();
  await page.route('**/*', (route) => route.abort('failed'));
  const navs: string[] = [];
  page.on('framenavigated', (f) => f === page.mainFrame() && navs.push(f.url()));
  await unfoldMenu(page);
  await hudBells(page).click();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('island.reloadAt'))).toBeNull();
  await page.waitForTimeout(1000);
  expect(navs).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.getItem('island.reloadAt'))).toBeNull();
});
