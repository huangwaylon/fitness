// Seasonal touches in the built app (docs/design.md "Particles and events", "Museum", "Pond"): snow on the museum's
// roof while snow lies on the ground (Dec 11 – Feb 24), petals floating on the pond in cherry-blossom week (Apr 1–10)
// and maple leaves in maple week (Nov 16–25); none of it on an ordinary day.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

async function open(page: Page, date: string) {
  await page.goto(`?demo&date=${date}&weather=clear`);
  await expect(page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
}

test('snow on the museum roof in winter only', async ({ page }) => {
  await open(page, '2027-01-12T10:00');
  await expect(page.locator('[data-roof-snow]')).toBeVisible();
  await open(page, '2026-12-05T10:00');
  await expect(page.locator('[data-roof-snow]')).toHaveCount(0);
});

for (const [date, floating] of [['2027-04-05T10:00', 'petal'], ['2026-11-20T10:00', 'maple'], ['2026-11-01T10:00', null]] as const)
  test(`the pond on ${date.slice(0, 10)}: ${floating ?? 'nothing'} floating`, async ({ page }) => {
    await open(page, date);
    if (floating) await expect(page.locator(`[data-floating="${floating}"]`)).toBeAttached();
    else await expect(page.locator('[data-floating]')).toHaveCount(0);
  });
