// ごはん's open never waits on the food catalog (docs/perf-plan.md A4): the day renders from its entries' snapshots, the
// catalog (index.json, then the datasets, parsed in a worker) comes at idle after the open's zoom (foodUi.ts
// foodDbSoon), and the search works the moment it's opened.
import { expect, test } from './fixtures.ts';

test('opening ごはん renders the day with no catalog fetch on the open path; the search still finds ごはん', async ({ page }) => {
  // the page's own fetch of index.json (the catalog's first request) and the bowl's tap, on the page's clock
  await page.addInitScript(() => {
    const w = window as unknown as { __ix?: number; __tap?: number };
    const f = window.fetch;
    window.fetch = (input, init) => {
      if (w.__ix === undefined && String(input instanceof Request ? input.url : input).includes('/food/index.json')) w.__ix = performance.now();
      return f(input, init);
    };
    addEventListener('pointerdown', (e) => void ((e.target as Element).closest?.('.hud-food') && (w.__tap ??= performance.now())), { capture: true });
  });
  await page.goto('?demo&date=2026-11-04T12:30&critter=none&visitor=none');
  const bowl = page.getByRole('button', { name: 'ごはん', exact: true });
  await expect(bowl).toBeVisible({ timeout: 15_000 });
  await bowl.click();
  const sheet = page.locator('dialog[open]');
  await expect(sheet.locator('section[data-meal=b] [data-entry]').first()).toBeVisible(); // the day, from its snapshots
  // the catalog's first request (index.json, the page's own fetch) never before the open's 600 ms (timers never fire early)
  const at = () => page.evaluate(() => ((w) => (w.__ix === undefined || w.__tap === undefined ? null : w.__ix - w.__tap))(window as unknown as { __ix?: number; __tap?: number }));
  await expect.poll(at).not.toBeNull(); // loaded at idle all the same
  expect(await at()).toBeGreaterThanOrEqual(600);

  await sheet.locator('[data-add=b]').click();
  await sheet.locator('[data-food-q]').fill('ごはん');
  await expect(sheet.locator('[data-food-results] button', { hasText: 'ごはん（精白米）' }).first()).toBeVisible({ timeout: 15_000 });
});
