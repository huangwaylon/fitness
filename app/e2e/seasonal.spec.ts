// Seasonal touches in the built app (docs/design.md "Particles and events", "Pond"): snow on the campsite's tent
// while snow lies on the ground (Dec 11 – Feb 24), petals floating on the pond in cherry-blossom week (Apr 1–10)
// and maple leaves in maple week (Nov 16–25); none of it on an ordinary day.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

/** The camera stop where each lives: the campsite and the pond at おく (642). */
async function open(page: Page, date: string, cam: number) {
  await page.goto(`?demo&date=${date}&weather=clear`);
  await expect(page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  await page.waitForFunction(() => !!(window as unknown as { __world?: unknown }).__world);
  // (again until it holds: the scene may still re-fit its camera as it settles in)
  await expect.poll(async () => {
    await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), cam);
    await page.waitForTimeout(250);
    return page.evaluate((z) => Math.abs((window as unknown as { __world: { cam(): number } }).__world.cam() - z), cam);
  }, { timeout: 5000 }).toBeLessThan(1.5); // (WebKit scrolls by whole px: within a px of it)
  await page.waitForTimeout(250);
}

test('snow on the campsite’s tent in winter only', async ({ page }) => {
  const tent = page.locator('[data-building="campsite"] img');
  await open(page, '2027-01-12T10:00', 642);
  await expect(tent).toHaveAttribute('src', /campsite-winter/);
  await open(page, '2026-12-05T10:00', 642);
  await expect(tent).not.toHaveAttribute('src', /campsite-winter/);
});

for (const [date, floating] of [['2027-04-05T10:00', 'petal'], ['2026-11-20T10:00', 'maple'], ['2026-11-01T10:00', null]] as const)
  test(`the pond on ${date.slice(0, 10)}: ${floating ?? 'nothing'} floating`, async ({ page }) => {
    await open(page, date, 642);
    if (floating) await expect(page.locator(`[data-floating="${floating}"]`)).toBeAttached();
    else await expect(page.locator('[data-floating]')).toHaveCount(0);
  });
