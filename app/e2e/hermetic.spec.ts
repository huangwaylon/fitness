// The e2e's sealed world (e2e/fixtures.ts, docs/ops/testing.md "Hermetic"): every test's scene clock is the pinned day
// unless its URL or its own device clock says otherwise, a second phone's too; nothing but the local preview resolves.
import { expect, PINNED_DATE, test, type Page } from './fixtures.ts';

const scene = (p: Page) => p.locator('.if-scene');

test('the scene clock is the pinned day (its noon: day, autumn, its seeded sky clear), whatever the real date', async ({ page }) => {
  await page.goto('?demo');
  await expect(scene(page)).toHaveAttribute('data-tod', 'day');
  await expect(scene(page)).toHaveAttribute('data-season', 'autumn');
  await expect(scene(page)).toHaveAttribute('data-sky', 'clear');
  expect(await page.evaluate(() => localStorage.getItem('e2e.date'))).toBe(PINNED_DATE);
});

test("a `?date=` wins; a page that sets its device clock owns it; a second phone's context is pinned too", async ({ page, browser }) => {
  await page.goto('?demo&date=2026-11-04T23:00');
  await expect(scene(page)).toHaveAttribute('data-tod', 'night');
  const own = await browser.newPage();
  await own.clock.install({ time: new Date('2026-07-01T12:00:00+09:00') });
  await own.goto('?demo');
  await expect(scene(own)).toHaveAttribute('data-season', 'summer');
  expect(await own.evaluate(() => localStorage.getItem('e2e.date'))).toBeNull();
  const other = await browser.newPage();
  await other.goto('?demo');
  expect(await other.evaluate(() => localStorage.getItem('e2e.date'))).toBe(PINNED_DATE);
  await own.close();
  await other.close();
});
