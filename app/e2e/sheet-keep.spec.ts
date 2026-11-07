// The sheets kept mounted between openings (Sheet's `keep`, ui-state/keptSheets.ts; docs/perf-plan.md A5): けんこう,
// けっこんしき, りょこう and トレイル's list. A reopening is the same content, not built again, and still as an opening
// should be (けんこう on 1週 · かつどう at its top, its charts drawn in the first frame); at most three kept, the least
// recently opened let go; a level holding a map (りょこう's 地図, a trail) let go at the close.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';
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
