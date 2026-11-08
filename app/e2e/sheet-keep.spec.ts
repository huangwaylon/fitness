// The sheets kept mounted between openings (Sheet's `keep`, ui-state/keptSheets.ts; docs/perf-plan.md A5): けんこう,
// ごはん, けっこんしき, りょこう and トレイル's list. A reopening is the same content, not built again, and still as an opening
// should be (けんこう on 1週 · かつどう at its top, its charts drawn in the first frame); at most three kept, the least
// recently opened let go; a level holding a map (りょこう's 地図, a trail) let go at the close.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, openKenkou } from './hud.ts';
import { gotoTrip, tripsSheet } from './trips.ts';

const sheet = (page: Page) => page.locator('dialog[open]');
const health = (page: Page) => page.getByRole('button', { name: 'けんこう', exact: true });
const loaded = (page: Page) => page.waitForFunction(() => (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 30_000 });
/** Tag what's in the open sheet under `sel`: a reopening built afresh has lost it. */
const tag = (page: Page, sel: string) => sheet(page).locator(sel).first().evaluate((el) => el.setAttribute('data-kept-tag', ''));
const closed = async (page: Page) => {
  await page.keyboard.press('Escape');
  await expect(sheet(page)).toHaveCount(0);
};

test('けんこう reopened: the same content, its charts in the first frame, at its top; on 1週 · かつどう again', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:30');
  await loaded(page);
  await health(page).click();
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
  await tag(page, '.health');
  await sheet(page).locator('[data-health-sheet]').evaluate((el) => el.scrollTo({ top: 300 }));
  await closed(page);
  // the tap, and the first frame the sheet is shown in: its content there, its charts drawn
  // (a frame first: the dialog's close event, queued by Esc, has closed the sheet's `open` by then)
  const svgs = await health(page).evaluate((b) => new Promise<number>((r) => {
    const f = () => (document.querySelector('dialog[open]') ? r(document.querySelectorAll('dialog[open] .health .chart svg').length) : requestAnimationFrame(f));
    requestAnimationFrame(() => {
      (b as HTMLElement).click();
      requestAnimationFrame(f);
    });
  }));
  expect(svgs).toBeGreaterThan(0);
  await expect(sheet(page).locator('.health[data-kept-tag]')).toHaveCount(1);
  await expect.poll(() => sheet(page).locator('[data-health-sheet]').evaluate((el) => el.scrollTop)).toBe(0);
  // another period and からだ, closed: the next opening is on 1週 · かつどう, still the same content
  await sheet(page).locator('.health select[data-pick=period]').selectOption('month');
  await sheet(page).locator('[data-group=body]').click();
  await closed(page);
  await health(page).click();
  await expect(sheet(page).locator('.health[data-kept-tag]')).toHaveCount(1);
  await expect(sheet(page).locator('.health select[data-pick=period]')).toHaveValue('week');
  await expect(sheet(page).locator('[data-group=activity]')).toHaveAttribute('aria-pressed', 'true');
});

const FOOD = '?demo&date=2026-11-04T12:30&critter=none&visitor=none';
async function openFood(page: Page) {
  await openKenkou(page, 'food');
  await expect(sheet(page).locator('[data-food-summary]')).toBeVisible();
}

test('ごはん reopened: the same content in the first frame; an opening’s resets (きろく, today, no level, 出典 closed, the top); whose day and くわしく kept', async ({ page }) => {
  await page.goto(FOOD);
  await expect(health(page)).toBeVisible({ timeout: 15_000 });
  await openFood(page);
  // ごはん's title bar and scroller (健康's, hidden beside it, left out)
  const s = page.locator('dialog[open] :is(.titlebar, [data-food-sheet])');
  await tag(page, '[data-food-summary]');
  // whose day and くわしく: the session's; the past day, 出典 and the scroll: this opening's
  await s.locator('[data-food-more] summary').click();
  await s.locator('select[data-pick=who]').selectOption('B');
  await s.locator('[data-nav=back]').click();
  await expect(s.locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-03');
  await s.locator('[data-food-credits] button').click();
  await sheet(page).locator('[data-food-sheet]').evaluate((el) => el.scrollTo({ top: 400 }));
  await closed(page);
  // the dumbbell's tap, and the first frame the sheet shows: on ごはん (the tab shown last), the day there already (not
  // built again)
  const first = await health(page).evaluate((b) => new Promise<boolean>((r) => {
    const f = () => (document.querySelector('dialog[open]') ? r(!!document.querySelector('dialog[open] [data-food-summary]')) : requestAnimationFrame(f));
    requestAnimationFrame(() => {
      (b as HTMLElement).click();
      requestAnimationFrame(f);
    });
  }));
  expect(first).toBe(true);
  await expect(s.locator('[data-food-summary][data-kept-tag]')).toHaveCount(1);
  await expect(s.locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-04');
  await expect(s.locator('select[data-pick=who]')).toHaveValue('B');
  await expect(s.locator('[data-food-credits] button')).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => sheet(page).locator('[data-food-sheet]').evaluate((el) => el.scrollTop)).toBe(0);
  await s.locator('select[data-pick=who]').selectOption('A');
  await expect(s.locator('[data-food-more]')).toHaveAttribute('open', '');
  // グラフ, closed: きろく again
  await s.locator('[data-tab=chart]').click();
  await closed(page);
  await openFood(page);
  await expect(s.locator('[data-tab=log]')).toHaveAttribute('aria-pressed', 'true');
  // a meal's search, a query and a row opened in place under it, closed: the day, nothing of it left
  await s.locator('[data-add=d]').click();
  await s.locator('[data-food-q]').fill('卵');
  await s.locator('[data-food-results] [data-item="mext:12004"]').click({ timeout: 15_000 });
  await expect(s.locator('[data-food-open-add]')).toBeVisible();
  await s.locator('.navbar button.nav.close').click(); // (✕: Esc closes the row first, the sheet stays)
  await expect(s).toHaveCount(0);
  await openFood(page);
  await expect(s.locator('.navbar h2')).toHaveText('ごはん');
  await expect(s.locator('[data-food-q], [data-food-open-add]')).toHaveCount(0);
  // an amount with 100gあたり open, closed: the day; the next amount's 100gあたり closed
  await s.locator('section[data-meal=b] button[data-entry]').first().click();
  await s.locator('[data-food-per]').click();
  await expect(s.locator('[data-food-per]')).toHaveAttribute('aria-expanded', 'true');
  await closed(page);
  await openFood(page);
  await expect(s.locator('[data-food-per]')).toHaveCount(0);
  await s.locator('section[data-meal=b] button[data-entry]').first().click();
  await expect(s.locator('[data-food-per]')).toHaveAttribute('aria-expanded', 'false');
});

test('ごはん kept closed: an entry logged on the other phone meanwhile shows on the reopening', async ({ context, page }) => {
  await page.goto(FOOD);
  await expect(health(page)).toBeVisible({ timeout: 15_000 });
  await openFood(page);
  await tag(page, '[data-food-summary]');
  const dinner = sheet(page).locator('section[data-meal=d] [data-entry]');
  const n0 = await dinner.count();
  await closed(page);
  // the other phone (the demo's second tab, the same person: its record shared through localStorage) logs ごはん
  const other = await context.newPage();
  await other.goto(FOOD);
  await expect(health(other)).toBeVisible({ timeout: 15_000 });
  await openFood(other);
  await sheet(other).locator('[data-add=d]').click();
  await sheet(other).locator('[data-food-q]').fill('ごはん');
  await sheet(other).locator('[data-food-results] li:has([data-item="mext:01088"]) [data-quick]').click({ timeout: 15_000 });
  await expect(sheet(other).locator('[data-food-added] [data-added]')).toHaveCount(1);
  await other.close();
  await page.bringToFront();
  await openFood(page);
  await expect(sheet(page).locator('[data-food-summary][data-kept-tag]')).toHaveCount(1);
  await expect(dinner).toHaveCount(n0 + 1);
  await expect(dinner.last()).toContainText('ごはん（精白米）');
});

test('three kept at most: the least recently opened let go', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:30');
  await loaded(page);
  await health(page).click();
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
  await tag(page, '.health');
  await closed(page);
  for (const k of ['wedding', 'travel', 'hiking'] as const) {
    await fromMenu(page, k);
    await closed(page);
  }
  // けんこう (opened first) let go; the other three kept, closed
  await expect(page.locator('[data-kept-tag]')).toHaveCount(0);
  await expect(page.locator('dialog:not([open]) :is([data-wedding], [data-travel], [data-hiking])')).toHaveCount(3);
  await fromMenu(page, 'wedding');
  await tag(page, '[data-wedding]');
  await closed(page);
  await fromMenu(page, 'wedding');
  await expect(sheet(page).locator('[data-wedding][data-kept-tag]')).toHaveCount(1);
});

test('りょこう: kept on a trip’s page, where it was left; on 地図 let go at the close (no map held closed)', async ({ page }) => {
  await gotoTrip(page, 'nz', 'pack');
  await tag(page, '[data-trip-view="nz"]');
  await closed(page);
  await fromMenu(page, 'travel');
  await expect(tripsSheet(page).locator('[data-trip-view="nz"][data-kept-tag]')).toHaveCount(1);
  await expect(tripsSheet(page).locator('[data-pane="pack"]')).toBeVisible();
  await tripsSheet(page).locator('[data-trip-tab="map"]').click();
  await expect(tripsSheet(page).locator('[data-pane="map"]')).toBeVisible();
  await closed(page);
  await expect(page.locator('[data-travel]')).toHaveCount(0);
  await expect(page.locator('[data-map-pane]')).toHaveCount(0);
});
