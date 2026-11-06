// りょこう (docs/design.md §Trips): the menu's pill opens the trips' sheet (the island paused under it): the
// boarding passes (on now and coming first, then おもいで, stamped), Orville's line on the day's first opening; a trip
// (NZ's; Okinawa and Seattle are the old site's classic guides, travel-classic.spec): its pages (にってい, ちず, もちもの),
// today's card open and the row that is now (or next) marked with ?date inside a trip, reopening into the trip on now,
// ‹ back and ✕, the pill offline. The logic tier: the photos may come late, nothing waits on them. Pictures
// (SHOTS=<dir>) of each screen, by day and at night.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, hudMenu, unfoldMenu } from './hud.ts';
import { islandQuery } from './island.ts';
import { shot } from './shots.ts';
import { gotoTrips, pickTrip, tripsSheet as sheet } from './trips.ts';

test.use({ viewport: { width: 393, height: 852 } });
const passes = (p: Page) => sheet(p).locator('[data-trip]');
const tab = (p: Page, id: string) => sheet(p).locator(`[data-trip-tab="${id}"]`);

test('the pill opens the passes: coming first, then おもいで stamped; Orville once a day; ✕ closes', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  // the island paused under it
  await expect(page.locator('[data-covered][data-sheet]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-orville]')).toBeVisible();
  // NZ (Feb 2027) coming, 99 days on Auckland's calendar; then the memories, newest first, each stamped
  const ids = await passes(page).evaluateAll((els) => els.map((e) => [e.getAttribute('data-trip'), e.getAttribute('data-phase')]));
  expect(ids).toEqual([['nz', 'soon'], ['okinawa', 'past'], ['seattle', 'past']]);
  await expect(sheet(page).locator('[data-trip="nz"] [data-days]')).toHaveText('99');
  await expect(sheet(page).locator('[data-trip="okinawa"] [data-stamp]')).toBeVisible();
  await expect(sheet(page).locator('[data-memories]')).toBeVisible();
  await shot(page, 'list-day');
  await page.locator('dialog[open] .titlebar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('[data-sheet]')).toHaveCount(0);
  // the second opening of the day: no Orville
  await fromMenu(page, 'travel');
  await expect(passes(page)).toHaveCount(3);
  await expect(sheet(page).locator('[data-orville]')).toHaveCount(0);
});

// (Okinawa and Seattle are classic guides now, the old site's look: e2e/travel-classic.spec.ts.)
test('a trip: its pages, ‹ back to the list', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await pickTrip(page, 'nz');
  // the bar has the place (one line); the year is the hero's
  await expect(page.locator('dialog[open] .titlebar h2')).toHaveText('ニュージーランド');
  await expect(sheet(page).locator('[data-trip-tab]')).toHaveCount(3);
  await expect(tab(page, 'days')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-day]')).toHaveCount(6);
  // before the trip: every day closed; a tap opens one, its timeline
  await expect(sheet(page).locator('[data-day][data-open]')).toHaveCount(0);
  await sheet(page).locator('[data-day="1"] .tog').click();
  await expect(sheet(page).locator('[data-day="1"] [data-row]').first()).toBeVisible();
  for (const id of ['map', 'pack']) {
    await tab(page, id).click();
    await expect(sheet(page).locator(`[data-pane="${id}"]`)).toBeVisible();
  }
  await tab(page, 'map').click();
  await expect(sheet(page).locator('[data-travel-map]')).toBeVisible();
  await sheet(page).locator('[data-map-day="2"]').click();
  const stop = sheet(page).locator('[data-stop]').nth(1);
  const id = await stop.getAttribute('data-stop');
  await stop.click();
  await expect(sheet(page).locator('[data-map-pane]')).toHaveAttribute('data-selected', id!);
  await page.locator('dialog[open] .titlebar .back').click();
  await expect(passes(page)).toHaveCount(3);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('NZ: the eve’s flight out (Tokyo’s 18:30) opens day 1, the trip on', async ({ page }) => {
  // Feb 10, 19:00 in Tokyo (23:00 in Auckland): NZ 98 left Narita at 18:30 (its row dd −1, on Tokyo's clock)
  await gotoTrips(page, '2027-02-10T19:00');
  await expect(sheet(page).locator('[data-trip="nz"]')).toHaveAttribute('data-phase', 'now');
  await pickTrip(page, 'nz');
  await expect(page.locator('dialog[open] .titlebar h2')).toHaveText('ニュージーランド');
  await expect(sheet(page).locator('[data-day="1"]')).toHaveAttribute('data-open', 'true');
  const row = sheet(page).locator('[data-day="1"] [data-row="0"]');
  await expect(row).toHaveAttribute('data-now', 'true');
  await expect(row.locator('.dd')).toHaveText('前日');
  await shot(page, 'nz-eve');
});

test('NZ day 4, 00:30: day 4 open, 「つぎ」 on its 03:10', async ({ page }) => {
  // Feb 14, 00:30 in Auckland = Feb 13, 20:30 in Tokyo
  await gotoTrips(page, '2027-02-13T20:30');
  // during a trip, the pill opens straight into it
  await page.locator('dialog[open] .titlebar .close').click();
  await fromMenu(page, 'travel');
  await expect(sheet(page).locator('[data-trip-view="nz"]')).toBeVisible();
  await expect(sheet(page).locator('[data-day][data-open]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-day="4"] [data-row="0"]')).toHaveAttribute('data-next', 'true');
  await expect(sheet(page).locator('[data-now]')).toHaveCount(0);
});

test('reopening: the trip and its page as they were left', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await pickTrip(page, 'nz');
  await tab(page, 'pack').click();
  await page.locator('dialog[open] .titlebar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await fromMenu(page, 'travel');
  await expect(sheet(page).locator('[data-trip-view="nz"]')).toBeVisible();
  await expect(tab(page, 'pack')).toHaveAttribute('aria-pressed', 'true');
  // back to the list, and it stays there
  await page.locator('dialog[open] .titlebar .back').click();
  await page.locator('dialog[open] .titlebar .close').click();
  await fromMenu(page, 'travel');
  await expect(passes(page)).toHaveCount(3);
});

test('a long open day keeps its strip under the tabs as it scrolls', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await pickTrip(page, 'nz');
  await sheet(page).locator('[data-day="5"] .tog').click();
  await sheet(page).locator('[data-day="5"] [data-row="8"]').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const pin = sheet(page).locator('[data-day="5"] .pin');
  await expect(pin).toContainText('5');
  const [p, t] = await Promise.all([pin.boundingBox(), sheet(page).locator('.tabs').boundingBox()]);
  expect(Math.abs(p!.y - (t!.y + t!.height - 18))).toBeLessThan(2);
  await shot(page, 'nz-day5-pin');
});

test('offline before the first opening: the pill says so, もういちど opens it once back', async ({ page, context }) => {
  await page.goto(islandQuery('demo&date=2026-11-04T12:00'));
  await expect(hudMenu(page)).toBeVisible();
  await context.setOffline(true);
  await unfoldMenu(page);
  await page.locator('[data-hud-travel]').click();
  const banner = page.getByText('オフラインです');
  await expect(banner).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await shot(page, 'offline-pill');
  await context.setOffline(false);
  // Chromium fetches the chunk again; WebKit keeps a failed import for the page's life, so it reloads: the pill again
  const how = Promise.race([page.waitForEvent('load').then(() => 'reload'), sheet(page).waitFor().then(() => 'open')]);
  await page.getByRole('button', { name: 'もういちど' }).click();
  if ((await how) === 'reload') await fromMenu(page, 'travel');
  await expect(passes(page)).toHaveCount(3);
});

test.describe('pictures', () => {
  test.skip(!process.env.SHOTS, 'SHOTS=<dir> only');
  for (const [tod, hour] of [['day', '12:00'], ['night', '21:30']] as const) {
    test(`every screen, ${tod}`, async ({ page }) => {
      await gotoTrips(page, `2026-11-04T${hour}`);
      await shot(page, `list-${tod}`);
      await pickTrip(page, 'nz');
      await shot(page, `nz-${tod}`);
      await sheet(page).locator('[data-day="6"] .tog').click();
      await sheet(page).locator('[data-day="6"]').evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await shot(page, `nz-day6-${tod}`);
      await page.locator('dialog[open] .titlebar .back').click();
    });
  }
  test('English, inside the NZ trip', async ({ page }) => {
    await page.goto(islandQuery('demo&date=2027-02-13T08:00'));
    await fromMenu(page, 'settings');
    await page.locator('dialog[open] [role="radio"][lang="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.keyboard.press('Escape');
    await fromMenu(page, 'travel');
    await expect(passes(page)).toHaveCount(3);
    await shot(page, 'list-en-nz-now');
    await pickTrip(page, 'nz');
    await shot(page, 'nz-today-en');
  });
});
