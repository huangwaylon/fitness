// Stale-build recovery (round 9): a lazy chunk that fails to load (the deploy replaced it) reloads the page once,
// and the next open works; the failed import is not remembered.
import { expect, test } from '@playwright/test';

test('a failed きろく chunk reloads the page once, then きろく opens', async ({ page }) => {
  await page.goto('?demo');
  const phone = page.getByRole('button', { name: 'しまフォンを開く' });
  await expect(phone).toBeVisible();
  // From now on every JS chunk 404s, as after a deploy that removed the old build's files (the page's own chunks
  // are already loaded).
  const stale = (route: import('@playwright/test').Route) => route.fulfill({ status: 404, body: '' });
  await page.route('**/_app/immutable/**/*.js', stale);
  const reloaded = page.waitForEvent('framenavigated');
  await phone.click();
  await page.locator('.app[data-app=kiroku]').click();
  await reloaded;
  await page.unroute('**/_app/immutable/**/*.js', stale);
  await page.waitForLoadState('load');
  await page.getByRole('button', { name: 'しまフォンを開く' }).click();
  await page.locator('.app[data-app=kiroku]').click();
  await expect(page.locator('dialog[open]').getByRole('button', { name: /^今週/ })).toBeVisible();
});
