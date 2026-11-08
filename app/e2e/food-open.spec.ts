// ごはん's open never waits on the food catalog: the day renders from its entries' snapshots, the
// catalog (index.json, then the datasets, parsed in a worker) comes at idle once ごはん has shown 600 ms (foodUi.ts
// foodDbSoon), never while the sheet shows 健康 alone, and the search works the moment it's opened.
import { expect, test } from './fixtures.ts';

test('opening ごはん renders the day with no catalog fetch on the open path (none at all under 健康); the search still finds ごはん', async ({ page }) => {
  // the page's own fetch of index.json (the catalog's first request) and the ごはん tab's tap, on the page's clock
  await page.addInitScript(() => {
    const w = window as unknown as { __ix?: number; __tap?: number };
    const f = window.fetch;
    window.fetch = (input, init) => {
      if (w.__ix === undefined && String(input instanceof Request ? input.url : input).includes('/food/index.json')) w.__ix = performance.now();
      return f(input, init);
    };
    addEventListener('pointerdown', (e) => void ((e.target as Element).closest?.('[data-kenkou-tab=food]') && (w.__tap ??= performance.now())), { capture: true });
  });
  await page.goto('?demo&date=2026-11-04T12:30&critter=none&visitor=none');
  const dumbbell = page.getByRole('button', { name: 'けんこう', exact: true });
  await expect(dumbbell).toBeVisible({ timeout: 15_000 });
  await dumbbell.click();
  const sheet = page.locator('dialog[open]');
  await expect(sheet.locator('.health .mc').first()).toBeVisible();
  // 健康 shown: ごはん isn't mounted, its catalog never asked for (well past the 600 ms and an idle)
  await page.waitForTimeout(1500); // hold: proving a fetch never happens (past the 600 ms timer and its idle)
  await expect(sheet.locator('[data-food-sheet]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __ix?: number }).__ix ?? null)).toBeNull();

  await sheet.locator('[data-kenkou-tab=food]').click();
  await expect(sheet.locator('section[data-meal=b] [data-entry]').first()).toBeVisible(); // the day, from its snapshots
  // the catalog's first request (index.json, the page's own fetch) never before the open's 600 ms (timers never fire early)
  const at = () => page.evaluate(() => ((w) => (w.__ix === undefined || w.__tap === undefined ? null : w.__ix - w.__tap))(window as unknown as { __ix?: number; __tap?: number }));
  await expect.poll(at).not.toBeNull(); // loaded at idle all the same
  expect(await at()).toBeGreaterThanOrEqual(600);

  await sheet.locator('[data-add=b]').click();
  await sheet.locator('[data-food-q]').fill('ごはん');
  await expect(sheet.locator('[data-food-results] button', { hasText: 'ごはん（精白米）' }).first()).toBeVisible({ timeout: 15_000 });
});

test('the dumbbell opens on the tab shown last; 健康 again hides ごはん (kept) and resets it to the day', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:30&critter=none&visitor=none');
  const dumbbell = page.getByRole('button', { name: 'けんこう', exact: true });
  await expect(dumbbell).toBeVisible({ timeout: 15_000 });
  await dumbbell.click();
  const sheet = page.locator('dialog[open]');
  const tab = (id: string) => sheet.locator(`[data-kenkou-tab=${id}]`);
  await expect(tab('health')).toHaveAttribute('aria-current', 'page');
  await expect(sheet.locator('.navbar h2')).toHaveText('健康');
  await tab('food').click();
  await expect(tab('food')).toHaveAttribute('aria-current', 'page');
  await expect(sheet.locator('.navbar h2')).toHaveText('ごはん');
  await expect(sheet.locator('[data-health-sheet]')).toBeHidden();
  // a level (a meal's search): ‹ and its title in the switch's place; ‹, then 健康 and back: ごはん on its day again
  await sheet.locator('[data-add=b]').click();
  await expect(sheet.locator('[data-food-q]')).toBeVisible();
  await expect(tab('health')).toHaveCount(0);
  await sheet.locator('.navbar button.back').click();
  await tab('health').click();
  await expect(sheet.locator('.navbar h2')).toHaveText('健康');
  await expect(sheet.locator('.health .mc').first()).toBeVisible();
  await expect(sheet.locator('[data-food-sheet]')).toBeHidden();
  await tab('food').click();
  await expect(sheet.locator('[data-food-q]')).toHaveCount(0);
  await expect(sheet.locator('[data-food-summary]')).toBeVisible();
  // closed on ごはん: the next opening is on ごはん
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await dumbbell.click();
  await expect(tab('food')).toHaveAttribute('aria-current', 'page');
  await expect(sheet.locator('[data-food-summary]')).toBeVisible();
});
