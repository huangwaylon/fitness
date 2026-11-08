// The island's look (docs/design.md "Seasonal look"; ui-state/preview.svelte.ts): 設定's 季節 shows another day's look on
// the whole island (`pref seasonLook`, the record's: the two-phone case is season-shared.spec): an event, a season, the
// weather, the time of day. The HUD's chip says it's on and a tap on it goes back; it stays until someone does.
// Read by state (data-* and <html>'s data-tod/-season), not pixels.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';

const chip = (page: Page) => page.locator('[data-preview-chip]');
const html = (page: Page) => page.locator('html');

/** Unfold せってい's きせつ row (folded by default) if it isn't open. */
async function unfold(page: Page) {
  const tg = page.locator('[data-preview-toggle]');
  await tg.scrollIntoViewIfNeeded();
  if ((await tg.getAttribute('aria-expanded')) !== 'true') await tg.click();
  await expect(tg).toHaveAttribute('aria-expanded', 'true');
}

async function pick(page: Page, ...which: string[]) {
  await fromMenu(page, 'settings');
  await unfold(page);
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
  await page.goto('?demo&date=2026-11-19T12:00'); // (a quiet day: no visitor to walk home before Jack comes)
  await islandUp(page);
  await expect(html(page)).toHaveAttribute('data-tod', 'day');
  await expect(chip(page)).toHaveCount(0);

  await pick(page, 'event:halloween');
  await expect(chip(page)).toBeVisible();
  await expect(chip(page)).toContainText('ハロウィン');
  await expect(html(page)).toHaveAttribute('data-tod', 'night');
  await expect(html(page)).toHaveAttribute('data-season', 'autumn');
  await expect(page.locator('[data-halloween="night"]')).toHaveCount(1);
  await expect(page.locator('[data-visitor="jack"]')).toHaveCount(1);
  // kept in the island's record, not on the phone
  expect(await page.evaluate(() => localStorage.getItem('island.preview'))).toBeNull();

  await page.reload();
  await expect(chip(page)).toBeVisible();
  await expect(page.locator('[data-halloween="night"]')).toHaveCount(1);

  await chip(page).click();
  await expect(chip(page)).toHaveCount(0);
  await expect(page.locator('[data-halloween]')).toHaveCount(0);
  await expect(page.locator('[data-visitor="jack"]')).toHaveCount(0);
  await expect(html(page)).toHaveAttribute('data-tod', 'day');
});

test('a season, the weather and the time of day; 自動に戻す is the real day again', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandUp(page);
  await expect(html(page)).toHaveAttribute('data-season', 'autumn');
  await pick(page, 'season:winter', 'weather:snow', 'tod:dusk');
  await expect(html(page)).toHaveAttribute('data-season', 'winter');
  await expect(html(page)).toHaveAttribute('data-foliage', 'snow');
  await expect(html(page)).toHaveAttribute('data-tod', 'dusk');
  await expect(page.locator('.overcast[data-sky="snow"]')).toHaveCount(1);
  await expect(chip(page)).toContainText('ふゆ');

  await fromMenu(page, 'settings');
  await expect(page.locator('[data-preview-summary]')).toHaveText('冬 · 雪 · 夕方'); // folded: what's showing
  await page.locator('[data-preview-reset]').click();
  await expect(page.locator('[data-preview-reset]')).toHaveCount(0);
  await expect(page.locator('[data-preview-summary]')).toHaveText('自動');
  await unfold(page);
  await expect(page.locator('[data-preview="season:auto"]')).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
  await expect(chip(page)).toHaveCount(0);
  await expect(html(page)).toHaveAttribute('data-season', 'autumn');
  await expect(html(page)).toHaveAttribute('data-tod', 'day');
});

test("a look an older build kept on the phone is ignored", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('island.preview', JSON.stringify({ day: '2026-11-04', event: 'halloween', season: null, weather: null, tod: null })));
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandUp(page);
  await expect(chip(page)).toHaveCount(0);
  await expect(page.locator('[data-halloween]')).toHaveCount(0);
  await expect(html(page)).toHaveAttribute('data-tod', 'day');
});

test('天気: 自動 (Tokyo\'s, its line and credit), ゲーム, or a forced sky; one heading, and 自動に戻す sets the weather back too', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandUp(page);
  await fromMenu(page, 'settings');
  await unfold(page);
  await expect(page.locator('dialog[open] h3', { hasText: '天気' })).toHaveCount(1);
  const sec = page.locator('[data-weather-section]');
  await expect(sec.locator('[data-preview="weather:auto"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sec.locator('[data-wx-credit]')).toBeVisible();
  await expect(page.locator('[data-preview-reset]')).toHaveCount(0);
  await sec.locator('[data-preview="weather:game"]').click();
  await expect(sec.locator('[data-preview="weather:game"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sec.locator('[data-wx-game]')).toBeVisible();
  await expect(page.locator('[data-preview-summary]')).toHaveText('ゲームの天気');
  await sec.locator('[data-preview="weather:rain"]').click();
  await expect(sec.locator('[data-preview="weather:rain"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sec.locator('[data-preview="weather:game"]')).toHaveAttribute('aria-checked', 'false');
  await expect(sec.locator('[data-wx-credit]')).toHaveCount(0);
  await expect(page.locator('[data-preview-summary]')).toHaveText('雨');
  await expect(page.locator('.if-scene')).toHaveAttribute('data-sky', 'rain');
  await page.locator('[data-preview-reset]').click();
  await expect(page.locator('[data-preview-summary]')).toHaveText('自動');
  await expect(sec.locator('[data-preview="weather:auto"]')).toHaveAttribute('aria-checked', 'true');
  await expect(sec).toHaveAttribute('data-weather-section', '');
  await expect(page.locator('[data-weather-mode]')).toHaveAttribute('data-weather-mode', 'real');
});
