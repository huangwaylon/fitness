// The HUD menu (docs/design.md "Island"): NH's leaf at the cluster's left end ([the menu] [the jar] [the dumbbell], top
// right) drops ずかん and せってい under it; folded by default (the pills hidden), it folds again on a second tap, a tap
// elsewhere, Esc, or a pick; each pill opens its own sheet (the ずかん's kinds, せってい's sections), and neither lives in
// the panel's tabs any more.
import { expect, test, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const pills = (page: Page) => page.locator('[data-hud-zukan], [data-hud-settings]');
const zukan = (page: Page) => page.locator('[data-hud-zukan]');
const settings = (page: Page) => page.locator('[data-hud-settings]');

async function open(page: Page) {
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(hudMenu(page)).toBeVisible();
}
const folded = async (page: Page) => {
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'false');
  for (const p of await pills(page).all()) await expect(p).toBeHidden();
};

test('folded by default; the leaf unfolds it and folds it again; a tap elsewhere and Esc fold it too', async ({ page }) => {
  await open(page);
  await folded(page);
  // the leaf: a 44px target, left of the jar, in the jar's row
  const m = (await hudMenu(page).boundingBox())!, j = (await page.locator('.hud-jar').boundingBox())!;
  expect(m.width).toBeGreaterThanOrEqual(44);
  expect(m.height).toBeGreaterThanOrEqual(44);
  expect(m.x + m.width).toBeLessThanOrEqual(j.x);
  await hudMenu(page).click();
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(zukan(page)).toBeVisible();
  await expect(settings(page)).toBeVisible();
  // the pills hang under the leaf, ずかん first, each a 44px pill, on screen
  await page.waitForTimeout(600); // the spring settles
  const z = (await zukan(page).boundingBox())!, s = (await settings(page).boundingBox())!;
  for (const b of [z, s]) {
    expect(b.height).toBeGreaterThanOrEqual(44);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThan(m.y + m.height);
  }
  expect(s.y).toBeGreaterThan(z.y + z.height);
  // a second tap folds it
  await hudMenu(page).click();
  await folded(page);
  // a tap on the sea folds it (and nothing opens)
  await hudMenu(page).click();
  await expect(zukan(page)).toBeVisible();
  await page.mouse.click(40, 600);
  await folded(page);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // Esc folds it, focus back on the leaf
  await hudMenu(page).click();
  await expect(zukan(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await folded(page);
  await expect(hudMenu(page)).toBeFocused();
  // the jar while it is open: the menu folds, the panel opens (its two tabs: no せってい)
  await hudMenu(page).click();
  await expect(zukan(page)).toBeVisible();
  await page.locator('.hud-jar').click();
  await expect(page.locator('dialog[open] .tabs .tab')).toHaveText(['きろく', 'ごほうび']);
  await folded(page);
});

test('ずかん opens the ずかん (its kinds, a kind\'s page with ‹), せってい opens せってい; each folds the menu', async ({ page }) => {
  await open(page);
  await fromMenu(page, 'zukan');
  await folded(page);
  const dlg = page.locator('dialog[open]');
  await expect(dlg.locator('.navbar')).toContainText('ずかん');
  await expect(dlg.locator('[data-zukan]')).toHaveCount(7);
  await dlg.locator('[data-zukan="fish"]').click();
  await expect(dlg.locator('[data-zukan-head]')).toContainText('さかな');
  await dlg.locator('.titlebar .back').click();
  await expect(dlg.locator('[data-zukan="fish"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dlg).toHaveCount(0);
  // the next opening starts on the kinds
  await fromMenu(page, 'settings');
  await folded(page);
  await expect(dlg.locator('.navbar')).toContainText('せってい');
  for (const id of ['#sec-villager', '#sec-decor', '#sec-sound', '#sec-lang', '#sec-sync', '#sec-help']) await expect(dlg.locator(id)).toBeAttached();
  await dlg.locator('.titlebar .close').click();
  await expect(dlg).toHaveCount(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the pills fade in where they stand (no drop, no tipped leaf)', async ({ page }) => {
    await open(page);
    await hudMenu(page).click();
    await expect(zukan(page)).toBeVisible();
    expect(await zukan(page).evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    expect(await page.locator('[data-hud-menu] .leaf').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  });
});
