// Seasonal touches in the built app (docs/design.md "Particles and events", "Museum", "Pond"): snow on the museum's
// roof while snow lies on the ground (Dec 11 – Feb 24), petals floating on the pond in cherry-blossom week (Apr 1–10)
// and maple leaves in maple week (Nov 16–25); none of it on an ordinary day.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

/** The camera stop where each lives: the museum at おく (1380), the pond at ひろば (860). */
async function open(page: Page, date: string, cam: number) {
  await page.goto(`?demo&date=${date}&weather=clear`);
  await expect(page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  await page.waitForFunction(() => !!(window as unknown as { __world?: unknown }).__world);
  // (again until it holds: the scene may still re-fit its camera as it settles in)
  await expect.poll(async () => {
    await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), cam);
    await page.waitForTimeout(250);
    return page.evaluate(() => Math.round((window as unknown as { __world: { cam(): number } }).__world.cam()));
  }, { timeout: 5000 }).toBe(cam);
  await page.waitForTimeout(250);
}

test('snow on the museum roof in winter only', async ({ page }) => {
  await open(page, '2027-01-12T10:00', 1380);
  await expect(page.locator('[data-roof-snow]')).toBeVisible();
  await open(page, '2026-12-05T10:00', 1380);
  await expect(page.locator('[data-roof-snow]')).toHaveCount(0);
});

for (const [date, floating] of [['2027-04-05T10:00', 'petal'], ['2026-11-20T10:00', 'maple'], ['2026-11-01T10:00', null]] as const)
  test(`the pond on ${date.slice(0, 10)}: ${floating ?? 'nothing'} floating`, async ({ page }) => {
    await open(page, date, 860);
    if (floating) await expect(page.locator(`[data-floating="${floating}"]`)).toBeAttached();
    else await expect(page.locator('[data-floating]')).toHaveCount(0);
  });
