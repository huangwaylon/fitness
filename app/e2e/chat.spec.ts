// Villager taps (docs/design.md "Villager taps"): a tap on my villager hops and says nothing (no balloon, no sheet);
// a tap on the partner still opens their card. No ベル.
import { expect, test, type Page } from '@playwright/test';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });

test('a tap on my villager: its squish, no balloon, no sheet, no ベル', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  const bells = await ribbon(page).getAttribute('aria-label');
  await page.waitForTimeout(2600); // the opening beats are over
  for (let i = 0; i < 3; i++) {
    await page.locator('.vil').first().click();
    await expect(page.locator('[data-actor="mine"] .body[data-act="squish"]')).toBeAttached();
    await page.waitForTimeout(400);
    await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }
  await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
});

test('a tap on the partner still opens their card (no balloon)', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(ribbon(page)).toBeVisible();
  await page.locator('.vil').nth(1).click();
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
});
