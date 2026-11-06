// りょこう (docs/travel.md "The sheet"): the menu's pill opens the trips' sheet (the island paused under it): the
// boarding passes (on now and coming first, then おもいで, stamped), Orville's line on the day's first opening; a trip:
// its pages (にってい, ちず, もちもの, キャンプ for Okinawa; no ちず for Seattle), today's card open and the row that is
// now (or next) marked with ?date inside a trip, reopening into the trip on now, the campsites' filter and its empty
// state, ‹ back and ✕, the pill offline. The logic tier: the photos may come late, nothing waits on them. Pictures
// (SHOTS=<dir>) of each screen, by day and at night.
import { expect, test, type Page } from '@playwright/test';
import { fromMenu, hudMenu, unfoldMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const PIN = 'critter=none&visitor=none';
const sheet = (p: Page) => p.locator('dialog[open] [data-travel]');
const passes = (p: Page) => sheet(p).locator('[data-trip]');

async function open(page: Page, date: string) {
  await page.goto(`?demo&date=${date}&${PIN}`);
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'travel');
  await expect(passes(page)).toHaveCount(3);
}
/** A trip from the list: its view, the plan page first. */
async function trip(page: Page, id: string) {
  await sheet(page).locator(`[data-trip="${id}"]`).click();
  await expect(sheet(page).locator(`[data-trip-view="${id}"]`)).toBeVisible();
}
const tab = (p: Page, id: string) => sheet(p).locator(`[data-trip-tab="${id}"]`);
/** A picture under SHOTS once Orville's line has typed out and the photos on screen are in. */
async function shot(page: Page, name: string, full = false) {
  if (!process.env.SHOTS) return;
  await expect(page.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await page.locator('dialog[open] img').evaluateAll((imgs) => Promise.all((imgs as HTMLImageElement[]).filter((i) => i.loading !== 'lazy' || i.getBoundingClientRect().top < innerHeight).map((i) => i.decode().catch(() => {}))));
  // (the opening, the level's slide and a card's fold all over: not a frame of them)
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity && !!((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest('dialog[open]')).map((a) => a.finished.catch(() => {}))));
  await page.screenshot({ path: `${process.env.SHOTS}/${name}.png`, fullPage: full });
}

test('the pill opens the passes: coming first, then おもいで stamped; Orville once a day; ✕ closes', async ({ page }) => {
  await open(page, '2026-11-04T12:00');
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

test('a trip: its pages, ‹ back to the list; Seattle has no map', async ({ page }) => {
  await open(page, '2026-11-04T12:00');
  await trip(page, 'okinawa');
  // the bar has the place (one line); the year is the hero's
  await expect(page.locator('dialog[open] .titlebar h2')).toHaveText('沖縄');
  await expect(sheet(page).locator('[data-trip-tab]')).toHaveCount(4);
  await expect(tab(page, 'days')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-day]')).toHaveCount(3);
  // past the trip: every day closed; a tap opens one, its timeline
  await expect(sheet(page).locator('[data-day][data-open]')).toHaveCount(0);
  await sheet(page).locator('[data-day="1"] .tog').click();
  await expect(sheet(page).locator('[data-day="1"] [data-row]')).toHaveCount(12);
  // じゅんび after the days: a card opens to its figures; the demo's trip note fills the private values
  await sheet(page).locator('[data-card="flights"] .tog').click();
  await expect(sheet(page).locator('[data-card="flights"] dl')).toBeVisible();
  await expect(sheet(page).locator('[data-card="flights"] [data-locked]')).toHaveCount(0);
  for (const id of ['map', 'pack', 'camps']) {
    await tab(page, id).click();
    await expect(sheet(page).locator(`[data-pane="${id}"]`)).toBeVisible();
  }
  await tab(page, 'map').click();
  await expect(sheet(page).locator('[data-travel-map]')).toBeVisible();
  await sheet(page).locator('[data-map-day="2"]').click();
  await expect(sheet(page).locator('[data-stop]')).toHaveCount(6);
  await sheet(page).locator('[data-stop="s2-1"]').click();
  await expect(sheet(page).locator('[data-map-pane]')).toHaveAttribute('data-selected', 's2-1');
  await page.locator('dialog[open] .titlebar .back').click();
  await expect(passes(page)).toHaveCount(3);
  await trip(page, 'seattle');
  await expect(sheet(page).locator('[data-trip-tab]')).toHaveCount(2);
  await expect(tab(page, 'map')).toHaveCount(0);
  await expect(sheet(page).locator('[data-day]')).toHaveCount(18);
  await sheet(page).locator('[data-day="2"] .tog').click();
  await expect(sheet(page).locator('[data-day="2"] [data-hike="mod"]')).toBeVisible();
  await expect(sheet(page).locator('[data-day="2"] a[data-link]')).toHaveAttribute('target', '_blank');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('inside a trip: on now first, today’s card open, the row that is now marked (the trip’s clock)', async ({ page }) => {
  // Oct 11, 09:00 in Tokyo = Okinawa's day 2, the dive
  await open(page, '2026-10-11T09:00');
  await expect(passes(page).first()).toHaveAttribute('data-trip', 'okinawa');
  await expect(passes(page).first()).toHaveAttribute('data-phase', 'now');
  await expect(sheet(page).locator('[data-trip="okinawa"] [data-day-now]')).toHaveText('2');
  await trip(page, 'okinawa');
  await expect(sheet(page).locator('[data-trip-status="now"]')).toBeVisible();
  await expect(sheet(page).locator('[data-day][data-open]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-day="2"]')).toHaveAttribute('data-today', 'true');
  await expect(sheet(page).locator('[data-day="2"] [data-now]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-day="2"] [data-now]')).toBeInViewport();
  await shot(page, 'okinawa-today-day');
});

test('NZ: the eve’s flight out (Tokyo’s 18:30) opens day 1, the trip on', async ({ page }) => {
  // Feb 10, 19:00 in Tokyo (23:00 in Auckland): NZ 98 left Narita at 18:30 (its row dd −1, on Tokyo's clock)
  await open(page, '2027-02-10T19:00');
  await expect(sheet(page).locator('[data-trip="nz"]')).toHaveAttribute('data-phase', 'now');
  await trip(page, 'nz');
  await expect(page.locator('dialog[open] .titlebar h2')).toHaveText('ニュージーランド');
  await expect(sheet(page).locator('[data-day="1"]')).toHaveAttribute('data-open', 'true');
  const row = sheet(page).locator('[data-day="1"] [data-row="0"]');
  await expect(row).toHaveAttribute('data-now', 'true');
  await expect(row.locator('.dd')).toHaveText('前日');
  await shot(page, 'nz-eve');
});

test('NZ day 4, 00:30: day 4 open, 「つぎ」 on its 03:10', async ({ page }) => {
  // Feb 14, 00:30 in Auckland = Feb 13, 20:30 in Tokyo
  await open(page, '2027-02-13T20:30');
  // during a trip, the pill opens straight into it
  await page.locator('dialog[open] .titlebar .close').click();
  await fromMenu(page, 'travel');
  await expect(sheet(page).locator('[data-trip-view="nz"]')).toBeVisible();
  await expect(sheet(page).locator('[data-day][data-open]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-day="4"] [data-row="0"]')).toHaveAttribute('data-next', 'true');
  await expect(sheet(page).locator('[data-now]')).toHaveCount(0);
});

test('reopening: the trip and its page as they were left', async ({ page }) => {
  await open(page, '2026-11-04T12:00');
  await trip(page, 'okinawa');
  await tab(page, 'pack').click();
  await page.locator('dialog[open] .titlebar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await fromMenu(page, 'travel');
  await expect(sheet(page).locator('[data-trip-view="okinawa"]')).toBeVisible();
  await expect(tab(page, 'pack')).toHaveAttribute('aria-pressed', 'true');
  // back to the list, and it stays there
  await page.locator('dialog[open] .titlebar .back').click();
  await page.locator('dialog[open] .titlebar .close').click();
  await fromMenu(page, 'travel');
  await expect(passes(page)).toHaveCount(3);
});

test('a long open day keeps its strip under the tabs as it scrolls', async ({ page }) => {
  await open(page, '2026-11-04T12:00');
  await trip(page, 'okinawa');
  await sheet(page).locator('[data-day="3"] .tog').click();
  await sheet(page).locator('[data-day="3"] [data-row="8"]').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const pin = sheet(page).locator('[data-day="3"] .pin');
  await expect(pin).toContainText('3');
  const [p, t] = await Promise.all([pin.boundingBox(), sheet(page).locator('.tabs').boundingBox()]);
  expect(Math.abs(p!.y - (t!.y + t!.height - 18))).toBeLessThan(2);
  await shot(page, 'okinawa-day3-pin');
});

test('offline before the first opening: the pill says so, もういちど opens it once back', async ({ page, context }) => {
  await page.goto(`?demo&date=2026-11-04T12:00&${PIN}`);
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

test('キャンプ: the filter chips with their counts, an empty state, すべて みる', async ({ page }) => {
  await open(page, '2026-11-04T12:00');
  await trip(page, 'okinawa');
  await tab(page, 'camps').click();
  const camps = sheet(page).locator('[data-camp]');
  await expect(camps).toHaveCount(26);
  await expect(sheet(page).locator('[data-camp-kind="wild"] .n')).toHaveText('15');
  await sheet(page).locator('[data-camp-kind="paid"]').click();
  await expect(camps).toHaveCount(11);
  await sheet(page).locator('[data-camp-has="shower"]').click();
  await expect(sheet(page).locator('[data-camp-count]')).toHaveAttribute('data-camp-count', String(await camps.count()));
  // our nights' sites carry their yuzu chip
  await sheet(page).locator('[data-camp-kind="all"]').click();
  await sheet(page).locator('[data-camp-has="shower"]').click();
  await expect(sheet(page).locator('[data-camp][data-camp-pick]')).not.toHaveCount(0);
  // free with showers and toilets and a beach: none, if so its empty state and the way back
  await sheet(page).locator('[data-camp-kind="wild"]').click();
  for (const a of ['beach', 'toilet', 'shower']) await sheet(page).locator(`[data-camp-has="${a}"]`).click();
  const n = await camps.count();
  if (n === 0) {
    await expect(sheet(page).locator('[data-camps-empty]')).toBeVisible();
    await sheet(page).locator('[data-camps-reset]').click();
    await expect(camps).toHaveCount(26);
  } else await expect(sheet(page).locator('[data-camps-empty]')).toHaveCount(0);
});

test.describe('pictures', () => {
  test.skip(!process.env.SHOTS, 'SHOTS=<dir> only');
  for (const [tod, hour] of [['day', '12:00'], ['night', '21:30']] as const) {
    test(`every screen, ${tod}`, async ({ page }) => {
      await open(page, `2026-11-04T${hour}`);
      await shot(page, `list-${tod}`);
      await trip(page, 'okinawa');
      await shot(page, `okinawa-${tod}`);
      await sheet(page).locator('[data-day="1"] .tog').click();
      await sheet(page).locator('[data-day="1"]').scrollIntoViewIfNeeded();
      await shot(page, `okinawa-day1-${tod}`);
      await sheet(page).locator('[data-day="1"] .tog').click();
      await sheet(page).locator('[data-card="the-jimny"] .tog').click();
      await sheet(page).locator('[data-card="the-jimny"]').evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await shot(page, `okinawa-prep-${tod}`);
      await tab(page, 'camps').click();
      await sheet(page).locator('[data-camp-has="shower"]').click();
      await shot(page, `okinawa-camps-${tod}`);
      await tab(page, 'map').click();
      await shot(page, `okinawa-map-${tod}`);
      await tab(page, 'pack').click();
      await shot(page, `okinawa-pack-${tod}`);
      await page.locator('dialog[open] .titlebar .back').click();
      await trip(page, 'seattle');
      await sheet(page).locator('[data-day="2"] .tog').click();
      await sheet(page).locator('[data-day="2"]').evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await shot(page, `seattle-hike-${tod}`);
      await page.locator('dialog[open] .titlebar .back').click();
      await trip(page, 'nz');
      await shot(page, `nz-${tod}`);
      await sheet(page).locator('[data-day="6"] .tog').click();
      await sheet(page).locator('[data-day="6"]').evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await shot(page, `nz-day6-${tod}`);
      await page.locator('dialog[open] .titlebar .back').click();
    });
  }
  test('English, inside the NZ trip', async ({ page }) => {
    await page.goto(`?demo&date=2027-02-13T08:00&${PIN}`);
    await fromMenu(page, 'settings');
    await page.locator('dialog[open] [role="radio"][lang="en"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.keyboard.press('Escape');
    await fromMenu(page, 'travel');
    await expect(passes(page)).toHaveCount(3);
    await shot(page, 'list-en-nz-now');
    await trip(page, 'nz');
    await shot(page, 'nz-today-en');
  });
});
