// りょこう (docs/design.md §Trips) in the quiet kit: the menu's pill opens the trips' sheet (the island paused under
// it): the list (on now and coming first, then これまで; a trip's badge 「あと99日」 / 「2日目」; km | mi under it), a
// quiet trip (NZ): its photo with ‹ ✕ on it, the title bar once scrolled, the bottom tab bar (日程 · 地図 · 持ち物; no
// キャンプ場 without campsites), the days open outside the trip, today's alone inside it with the row that is now (the
// trip's clock), じゅんび's cards, reopening into the trip on now, ‹ back and ✕, the pill offline. A trip drawn like its
// original guide (`classic`) is the classic guide's (its own specs). The logic tier: the photos may come late, nothing
// waits on them. Pictures (SHOTS=<dir>) of each screen, by day and at night.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, hudMenu, unfoldMenu } from './hud.ts';
import { islandQuery } from './island.ts';
import { shot } from './shots.ts';
import { gotoTrips, pickTrip, tripsSheet as sheet } from './trips.ts';
import { nz } from '../src/lib/travel/trips/nz.ts';
import { okinawa } from '../src/lib/travel/trips/okinawa.ts';

test.use({ viewport: { width: 393, height: 852 } });
const rows = (p: Page) => sheet(p).locator('[data-trip]');
const tab = (p: Page, id: string) => sheet(p).locator(`[data-trip-tab="${id}"]`);
const hdr = (p: Page) => p.locator('dialog[open] .q-hdr');

test('the pill opens the list: coming first, then これまで; ✕ closes', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  // the island paused under it
  await expect(page.locator('[data-covered][data-sheet]')).toHaveCount(1);
  // NZ (Feb 2027) coming, 99 days on Auckland's calendar; then the past, newest first
  const ids = await rows(page).evaluateAll((els) => els.map((e) => [e.getAttribute('data-trip'), e.getAttribute('data-phase')]));
  expect(ids).toEqual([['nz', 'soon'], ['okinawa', 'past'], ['seattle', 'past']]);
  await expect(sheet(page).locator('[data-trip="nz"] [data-days]')).toHaveText('あと99日');
  await expect(sheet(page).locator('[data-trip="okinawa"] [data-badge]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-memories]')).toHaveText('これまで');
  await expect(sheet(page).locator('[data-units="km"]')).toHaveAttribute('aria-pressed', 'true');
  await shot(page, 'list-day');
  await hdr(page).locator('.close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('[data-sheet]')).toHaveCount(0);
  await fromMenu(page, 'travel');
  await expect(rows(page)).toHaveCount(3);
});

test('km | mi under the list: kept on this phone', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await sheet(page).locator('[data-units="mi"]').click();
  await expect(sheet(page).locator('[data-units="mi"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('island.travel.units'))).toBe('mi');
  await page.reload();
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'travel');
  await expect(sheet(page).locator('[data-units="mi"]')).toHaveAttribute('aria-pressed', 'true');
});

test('a quiet trip: the photo, its pages on the tab bar, the days open, じゅんび; the title bar once scrolled; ‹ back', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await pickTrip(page, 'nz');
  // ‹ ✕ over the photo; the place in the photo's foot
  await expect(sheet(page).locator('.hd.over')).toBeVisible();
  await expect(sheet(page).locator('.hd.solid')).toHaveCount(0);
  await expect(sheet(page).locator('.hero')).toContainText('ニュージーランド');
  await expect(sheet(page).locator('[data-trip-tab]')).toHaveCount(3);
  await expect(tab(page, 'camps')).toHaveCount(0);
  await expect(tab(page, 'days')).toHaveAttribute('aria-current', 'page');
  // before the trip: every day open, its timeline
  await expect(sheet(page).locator('[data-day]')).toHaveCount(nz.days.length);
  await expect(sheet(page).locator('[data-day][data-open]')).toHaveCount(nz.days.length);
  await expect(sheet(page).locator('[data-day="2"] [data-row]')).toHaveCount(nz.days[1].rows.length);
  // a tap folds one
  await sheet(page).locator('[data-day="2"] .tog').click();
  await expect(sheet(page).locator('[data-day="2"] [data-row]')).toHaveCount(0);
  // scrolled past the photo: the title bar, the place and its dates
  await sheet(page).locator('.scroll').evaluate((el) => (el.scrollTop = 600));
  await expect(sheet(page).locator('.hd.solid')).toBeVisible();
  await expect(hdr(page).locator('h2')).toContainText('ニュージーランド');
  await expect(hdr(page).locator('h2')).toContainText('2月11日 – 16日');
  // じゅんび after the days: a card opens to its lists; the demo's trip note fills the private values
  const card = sheet(page).locator('[data-card="flights"]');
  await card.locator('.tog').click();
  await expect(card.locator('[data-row]').first()).toBeVisible();
  await expect(card.locator('[data-locked]')).toHaveCount(0);
  for (const id of ['map', 'pack']) {
    await tab(page, id).click();
    await expect(sheet(page).locator(`[data-pane="${id}"]`)).toBeVisible();
    await expect(hdr(page).locator('h2')).toContainText(id === 'map' ? '地図' : '持ち物');
  }
  await tab(page, 'map').click();
  await expect(sheet(page).locator('[data-travel-map]')).toBeVisible();
  await sheet(page).locator('[data-map-day="2"]').click();
  await expect(sheet(page).locator('[data-stop]')).toHaveCount(nz.places.filter((p) => p.kind === 'stop' && p.day === 2).length);
  await hdr(page).locator('.back').click();
  await expect(rows(page)).toHaveCount(3);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('inside a trip: on now first, today’s card open alone, the row that is now marked and in view (the trip’s clock)', async ({ page }) => {
  // Feb 12, 09:00 in Tokyo = 13:00 in Auckland: NZ's day 2
  await gotoTrips(page, '2027-02-12T09:00');
  // during a trip, the pill opens straight into it
  await expect(sheet(page).locator('[data-trip-view="nz"]')).toBeVisible();
  await hdr(page).locator('.back').click();
  await expect(rows(page).first()).toHaveAttribute('data-trip', 'nz');
  await expect(rows(page).first()).toHaveAttribute('data-phase', 'now');
  await expect(sheet(page).locator('[data-trip="nz"] [data-day-now]')).toHaveText('2日目');
  await pickTrip(page, 'nz');
  await expect(sheet(page).locator('[data-trip-status="now"]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-day][data-open]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-day="2"]')).toHaveAttribute('data-today', 'true');
  await expect(sheet(page).locator('[data-day="2"] [data-now]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-day="2"] [data-now]')).toBeInViewport();
  await shot(page, 'nz-today-day');
});

test('NZ: the eve’s flight out (Tokyo’s 18:30) opens day 1, the trip on', async ({ page }) => {
  // Feb 10, 19:00 in Tokyo (23:00 in Auckland): NZ 98 left Narita at 18:30 (its row dd −1, on Tokyo's clock)
  await gotoTrips(page, '2027-02-10T19:00');
  await expect(sheet(page).locator('[data-trip-view="nz"]')).toBeVisible();
  await expect(sheet(page).locator('[data-day="1"]')).toHaveAttribute('data-open', 'true');
  const row = sheet(page).locator('[data-day="1"] [data-row="0"]');
  await expect(row).toHaveAttribute('data-now', 'true');
  await expect(row.locator('.dd')).toHaveText('前日');
  await shot(page, 'nz-eve');
});

test('NZ day 4, 00:30: day 4 open, 「次」 on its 03:10', async ({ page }) => {
  // Feb 14, 00:30 in Auckland = Feb 13, 20:30 in Tokyo
  await gotoTrips(page, '2027-02-13T20:30');
  await expect(sheet(page).locator('[data-trip-view="nz"]')).toBeVisible();
  await expect(sheet(page).locator('[data-day][data-open]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-day="4"] [data-row="0"]')).toHaveAttribute('data-next', 'true');
  await expect(sheet(page).locator('[data-now]')).toHaveCount(0);
});

test('reopening: the trip and its page as they were left', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await pickTrip(page, 'nz');
  await tab(page, 'pack').click();
  await hdr(page).locator('.close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await fromMenu(page, 'travel');
  await expect(sheet(page).locator('[data-trip-view="nz"]')).toBeVisible();
  await expect(tab(page, 'pack')).toHaveAttribute('aria-current', 'page');
  // back to the list, and it stays there
  await hdr(page).locator('.back').click();
  await hdr(page).locator('.close').click();
  await fromMenu(page, 'travel');
  await expect(rows(page)).toHaveCount(3);
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
  await expect(rows(page)).toHaveCount(3);
});

test('a guide offline: 読み込めませんでした and もう一度 under the trip’s own header', async ({ page, context }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await context.setOffline(true);
  await sheet(page).locator('[data-trip="nz"]').click();
  // (a chunk the page already holds opens anyway: either is right, never a blank page)
  await expect(sheet(page).locator('[data-travel-failed]').or(sheet(page).locator('[data-trip-view="nz"] [data-pane]'))).toBeVisible();
  await expect(hdr(page).locator('h2')).toContainText('ニュージーランド');
  await context.setOffline(false);
});

// キャンプ場 (a quiet trip with campsites: Okinawa until its classic guide takes it)
test('キャンプ場: one chip row with counts, compact rows, a row’s sheet, an empty state, すべて表示', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await sheet(page).locator('[data-trip="okinawa"]').click();
  await expect(sheet(page).locator('[data-trip-view="okinawa"]')).toBeVisible();
  test.skip((await sheet(page).locator('[data-classic]').count()) > 0, 'Okinawa is drawn by its classic guide');
  await tab(page, 'camps').click();
  const camps = sheet(page).locator('[data-camp]');
  await expect(camps).toHaveCount(okinawa.camps!.length);
  await expect(sheet(page).locator('[data-camp-kind="wild"] .n')).toHaveText(String(okinawa.camps!.filter((c) => c.type === 'wild').length));
  await sheet(page).locator('[data-camp-kind="paid"]').click();
  await expect(camps).toHaveCount(okinawa.camps!.filter((c) => c.type === 'paid').length);
  await sheet(page).locator('[data-camp-has="shower"]').click();
  await expect(sheet(page).locator('[data-camp-count]')).toHaveAttribute('data-camp-count', String(await camps.count()));
  // the shortlist: ours first-class, ★
  await sheet(page).locator('[data-camp-kind="all"]').click();
  await sheet(page).locator('[data-camp-picks]').click();
  await expect(sheet(page).locator('[data-camp]:not([data-camp-pick])')).toHaveCount(0);
  // a row: its sheet, Maps in a new tab, 地図で見る brings it to the map
  await camps.first().click();
  const sh = page.locator('dialog[open] [data-camp-sheet]');
  await expect(sh).toBeVisible();
  await expect(sh.locator('[data-camp-maps]')).toHaveAttribute('target', '_blank');
  await shot(page, 'okinawa-camp-sheet');
  await sh.locator('[data-camp-onmap]').click();
  await expect(sheet(page).locator('[data-pane="map"]')).toBeVisible();
  await expect(sheet(page).locator('[data-map-pane]')).toHaveAttribute('data-selected', /.+/);
  // nothing passes: the empty state and the way back
  await tab(page, 'camps').click();
  await sheet(page).locator('[data-camp-kind="wild"]').click();
  for (const a of ['beach', 'toilet', 'shower']) await sheet(page).locator(`[data-camp-has="${a}"]`).click();
  if ((await camps.count()) === 0) {
    await expect(sheet(page).locator('[data-camps-empty]')).toBeVisible();
    await sheet(page).locator('[data-camps-reset]').click();
    await expect(camps).toHaveCount(okinawa.camps!.length);
  } else await expect(sheet(page).locator('[data-camps-empty]')).toHaveCount(0);
});

test.describe('pictures', () => {
  test.skip(!process.env.SHOTS, 'SHOTS=<dir> only');
  for (const [tod, hour] of [['day', '12:00'], ['night', '21:30']] as const) {
    test(`every screen, ${tod}`, async ({ page }) => {
      await gotoTrips(page, `2026-11-04T${hour}`);
      await shot(page, `01-list-${tod}`);
      await pickTrip(page, 'nz');
      await shot(page, `02-nz-${tod}`);
      await sheet(page).locator('[data-day="2"]').evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await shot(page, `02b-nz-scrolled-${tod}`);
      await sheet(page).locator('[data-prep]').evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await shot(page, `03-nz-prep-${tod}`);
      await tab(page, 'map').click();
      await shot(page, `04-nz-map-${tod}`);
      await tab(page, 'pack').click();
      await shot(page, `06-nz-pack-${tod}`);
      await sheet(page).locator('[data-pack-edit]').click();
      await sheet(page).locator('[data-pack-acts="nz-0-2"]').click();
      await shot(page, `06b-nz-pack-edit-${tod}`);
      await page.keyboard.press('Escape');
    });
  }
  test('inside the NZ trip, day 2', async ({ page }) => {
    await gotoTrips(page, '2027-02-12T09:00');
    await shot(page, '02n-nz-now');
  });
});
