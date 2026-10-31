// Stale-build recovery: a lazy chunk that fails to load (the deploy replaced it) reloads the page once,
// and the next open works; the failed import is not remembered.
import { expect, test } from '@playwright/test';

test('a failed panel chunk reloads the page once, then the panel opens', async ({ page }) => {
  await page.goto('?demo');
  const ribbon = page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
  await expect(ribbon).toBeVisible();
  // From now on every JS chunk 404s, as after a deploy that removed the old build's files (the page's own chunks
  // are already loaded).
  const stale = (route: import('@playwright/test').Route) => route.fulfill({ status: 404, body: '' });
  await page.route('**/_app/immutable/**/*.js', stale);
  const reloaded = page.waitForEvent('framenavigated');
  await ribbon.click();
  await reloaded;
  await page.unroute('**/_app/immutable/**/*.js', stale);
  await page.waitForLoadState('load');
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await expect(page.locator('dialog[open]').locator('button.dbtn').first()).toBeVisible();
});
