// The seasonal preview (docs/design.md "Seasonal preview"; ui-state/preview.svelte.ts): せってい's きせつ shows another day's
// look on this phone for today: an event, a season, the weather, the time of day. The HUD's chip says it's on and a
// tap on it goes back; it lapses with the day. Read by state (data-* and <html>'s data-tod/-season), not pixels.
import { expect, test, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';

const chip = (page: Page) => page.locator('[data-preview-chip]');
const html = (page: Page) => page.locator('html');

async function pick(page: Page, ...which: string[]) {
  await fromMenu(page, 'settings');
  for (const w of which) {
    const b = page.locator(`[data-preview="${w}"]`);
    await b.scrollIntoViewIfNeeded();
    await b.click();
    await expect(b).toHaveAttribute('aria-checked', 'true');
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open] [data-settings]')).toHaveCount(0);
}

test('ハロウィン in せってい brings Halloween night now; the chip shows it, a reload keeps it, its tap goes back', async ({ page }) => {
  await page.goto('?demo&date=2026-11-19T12:00&critter=none'); // (a quiet day: no visitor to walk home before Jack comes)
  await expect(hudMenu(page)).toBeVisible();
  await expect(html(page)).toHaveAttribute('data-tod', 'day');
  await expect(chip(page)).toHaveCount(0);

  await pick(page, 'event:halloween');
  await expect(chip(page)).toBeVisible();
  await expect(chip(page)).toContainText('ハロウィン');
  await expect(html(page)).toHaveAttribute('data-tod', 'night');
  await expect(html(page)).toHaveAttribute('data-season', 'autumn');
  await expect(page.locator('[data-halloween="night"]')).toHaveCount(1);
  await expect(page.locator('[data-visitor="jack"]')).toHaveCount(1);
  // kept on this phone only, for the day it was set on
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('island.preview') ?? 'null'))).toMatchObject({ day: '2026-11-19', event: 'halloween' });

  await page.reload();
  await expect(chip(page)).toBeVisible();
  await expect(page.locator('[data-halloween="night"]')).toHaveCount(1);

  await chip(page).click();
  await expect(chip(page)).toHaveCount(0);
  await expect(page.locator('[data-halloween]')).toHaveCount(0);
  await expect(page.locator('[data-visitor="jack"]')).toHaveCount(0);
  await expect(html(page)).toHaveAttribute('data-tod', 'day');
  expect(await page.evaluate(() => localStorage.getItem('island.preview'))).toBeNull();
});

test('a season, the weather and the time of day; もどす is the real day again', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  await expect(html(page)).toHaveAttribute('data-season', 'autumn');
  await pick(page, 'season:winter', 'weather:snow', 'tod:dusk');
  await expect(html(page)).toHaveAttribute('data-season', 'winter');
  await expect(html(page)).toHaveAttribute('data-foliage', 'snow');
  await expect(html(page)).toHaveAttribute('data-tod', 'dusk');
  await expect(page.locator('.overcast[data-sky="snow"]')).toHaveCount(1);
  await expect(chip(page)).toContainText('ふゆ');

  await fromMenu(page, 'settings');
  await page.locator('[data-preview-reset]').click();
  await expect(page.locator('[data-preview-reset]')).toHaveCount(0);
  await expect(page.locator('[data-preview="season:auto"]')).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
  await expect(chip(page)).toHaveCount(0);
  await expect(html(page)).toHaveAttribute('data-season', 'autumn');
  await expect(html(page)).toHaveAttribute('data-tod', 'day');
});

test('it lapses when the day it was set on is over', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('island.preview', JSON.stringify({ day: '2026-11-03', event: 'halloween', season: null, weather: null, tod: null })));
  await page.goto('?demo&date=2026-11-04T12:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  await expect(chip(page)).toHaveCount(0);
  await expect(page.locator('[data-halloween]')).toHaveCount(0);
  await expect(html(page)).toHaveAttribute('data-tod', 'day');
});
