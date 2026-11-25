// りょこう (docs/design.md §Trips) on the unified kit: the menu's pill opens the trips' sheet (the island paused under
// it): the list's boarding passes on its 旅 tab (coming, then これまで; しまの そら便; the stub 「あと 99 日」 /
// 「いま 2 日目」, a past trip's 「行ってきた」 stamp; km | mi on the 設定 tab), a trip (NZ): the title bar, the tab
// bar (日程 · 地図 · 準備 · 持ち物), 日程's every day on one page (a boarding pass a day, its stub held at the top; a
// stop's line and its details on a tap; 地図で見る; the line we're heading to lit by the trip's clock, the page opened
// on it), 地図 on the day being read, 準備's cards (and Okinawa's campsites: the filter, a site's card), reopening into
// the trip on now, ‹ back and ✕, the pill offline; Seattle's hikes (トレイル's trail in the app). The logic tier: the
// photos may come late, nothing waits on them. Pictures (SHOTS=<dir>) of each screen, by day and at night.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, unfoldMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { shot } from './shots.ts';
import { gotoTrips, pickTrip, tripsSheet as sheet } from './trips.ts';
import { nz } from '../src/lib/travel/trips/nz.ts';
import { okinawa } from '../src/lib/travel/trips/okinawa.ts';
import { lines } from '../src/lib/components/travel/ledger.ts';

test.use({ viewport: { width: 393, height: 852 } });
const rows = (p: Page) => sheet(p).locator('[data-trip]');
const tab = (p: Page, id: string) => sheet(p).locator(`[data-trip-tab="${id}"]`);
const hdr = (p: Page) => p.locator('dialog[open] .navbar');
const scroller = (p: Page) => sheet(p).locator('.scroll');
const days = (p: Page) => sheet(p).locator('[data-itinerary] section[data-day]');
/** A line by its id ('s3-2'), or a day's lines (its n). */
const line = (p: Page, k: string | number) => sheet(p).locator(typeof k === 'number' ? `section[data-day="${k}"] [data-line]` : `[data-line="${k}"]`);
const listTab = (p: Page, id: string) => sheet(p).locator(`[data-travel-tab="${id}"]`);
const tripIds = (p: Page) => rows(p).evaluateAll((els) => els.map((e) => [e.getAttribute('data-trip'), e.getAttribute('data-phase')]));

test('the pill opens the list: 旅 (coming first, then これまで), and 設定; ✕ closes', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  // the island paused under it
  await expect(page.locator('[data-covered][data-sheet]')).toHaveCount(1);
  // two tabs (a tablist, its panel labelled by the tab), 旅 shown
  await expect(sheet(page).locator('[data-travel-tab]')).toHaveText(['旅', '設定']);
  await expect(listTab(page, 'trips')).toHaveAttribute('aria-selected', 'true');
  await expect(sheet(page).locator('#travel-panel')).toHaveAttribute('aria-labelledby', 'travel-tab-trips');
  // Zao (Jan 2027) and NZ (Feb 2027) coming, NZ's 99 days counted at home; then the past, newest first, each stamped
  expect(await tripIds(page)).toEqual([['zao', 'soon'], ['nz', 'soon'], ['okinawa', 'past'], ['seattle', 'past']]);
  await expect(sheet(page).locator('[data-trip="nz"] [data-days]')).toHaveText('99');
  await expect(sheet(page).locator('[data-trip="nz"]')).toHaveAttribute('aria-label', /あと99日$/);
  await expect(sheet(page).locator('[data-trip="nz"]')).toContainText('TYO ✈ AKL');
  await expect(sheet(page).locator('[data-trip="nz"]')).toContainText('しまの そら便');
  await expect(sheet(page).locator('[data-trip="okinawa"] [data-stamp]')).toHaveText('行ってきた2026');
  await expect(sheet(page).locator('[data-trip="nz"] [data-stamp]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-memories]')).toHaveText('これまで');
  await shot(page, 'list-day');
  await hdr(page).locator('.close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('[data-sheet]')).toHaveCount(0);
  await fromMenu(page, 'travel');
  await expect(rows(page)).toHaveCount(4);
});

test('the list tab shown is kept from one opening to the next', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await listTab(page, 'settings').click();
  await hdr(page).locator('.close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await fromMenu(page, 'travel');
  await expect(listTab(page, 'settings')).toHaveAttribute('aria-selected', 'true');
  await expect(sheet(page).locator('[data-travel-settings]')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('island.travelTab'))).toBe('settings');
});

test('a stale kept tab falls back to 旅', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('island.travelTab', 'past'));
  await gotoTrips(page, '2026-11-04T12:00');
  await expect(listTab(page, 'trips')).toHaveAttribute('aria-selected', 'true');
  await expect(rows(page)).toHaveCount(4);
});

test('‹ from a trip lands on 旅, on its pass', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await pickTrip(page, 'okinawa');
  await expect(listTab(page, 'trips')).toHaveCount(0);
  await hdr(page).locator('.back').click();
  await expect(listTab(page, 'trips')).toHaveAttribute('aria-selected', 'true');
  await expect(sheet(page).locator('[data-trip="okinawa"]')).toBeFocused();
});

// The days to go turn at Tokyo's midnight, where the travellers are till they leave (結婚式 counts the same), not at
// Auckland's (20:00 in Tokyo: review 11/10 r3 N8, 「あと 91 日」 at noon read 90 at 21:30)
test('the countdown counts at home: the same at 21:30 as at noon, one fewer after midnight', async ({ page }) => {
  for (const [at, days] of [['2026-11-12T21:30', '91'], ['2026-11-13T00:10', '90']] as const) {
    await gotoTrips(page, at);
    await expect(sheet(page).locator('[data-trip="nz"] [data-days]')).toHaveText(days);
  }
});

test('単位は設定タブに: km | mi kept on this phone, none in the title bar', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await listTab(page, 'settings').click();
  const mi = sheet(page).locator('[data-units="mi"]');
  await expect(mi).toBeVisible();
  await expect(sheet(page).locator('[data-units="km"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => Math.round((await mi.boundingBox())!.height)).toBe(36);
  await expect(sheet(page).locator('[data-units]')).toHaveCount(2);
  await expect(page.locator('.navbar [data-units]')).toHaveCount(0);
  await mi.click();
  await expect(sheet(page).locator('[data-units="mi"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('island.travel.units'))).toBe('mi');
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'travel');
  await expect(sheet(page).locator('[data-units="mi"]')).toHaveAttribute('aria-pressed', 'true');
  // a trip's pages have none (設定 is the one place)
  await listTab(page, 'trips').click();
  await pickTrip(page, 'nz');
  await expect(sheet(page).locator('[data-units]')).toHaveCount(0);
});

test('Okinawa (over): 日程 地図 準備 持ち物; every day on one page from its top; 準備: the cards, then the campsites (one criterion at a time, a site’s card)', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await pickTrip(page, 'okinawa');
  await expect(sheet(page).locator('[data-trip-tab]')).toHaveText(['日程', '地図', '準備', '持ち物']);
  // a past trip: every day, from the top, nothing lit
  await expect(days(page)).toHaveCount(okinawa.days.length);
  expect(await scroller(page).evaluate((el) => el.scrollTop)).toBe(0);
  await expect(sheet(page).locator('[data-now]')).toHaveCount(0);
  await expect(line(page, 1)).toHaveCount(lines(okinawa, okinawa.days[0]).length);
  // the airport bus: its timetable's hour, not the road's free-flow minutes; the night's camp 泊, booked
  await expect(line(page, 's1-1').locator('.how')).toHaveText('09:40発 · バス 1時間');
  await expect(line(page, 's1-7').locator('[data-stay]')).toHaveText('泊');
  await expect(line(page, 's1-7').locator('[data-unbooked]')).toHaveCount(0);

  await tab(page, 'prep').click();
  const flights = sheet(page).locator('[data-card="flights"]');
  await expect(flights.locator('.row.kv')).toHaveCount(okinawa.logistics[0].stats!.length);
  await expect(flights.locator('[data-locked]')).toHaveCount(0);
  const camps = sheet(page).locator('[data-camp]');
  await expect(camps).toHaveCount(okinawa.camps!.length);
  await expect(sheet(page).locator('[data-camp-filter]')).toHaveText([`すべて${okinawa.camps!.length}`, '無料', '有料', 'ビーチ', 'トイレ', 'シャワー']);
  await expect(sheet(page).locator('[data-camp-filter="all"]')).toHaveAttribute('aria-pressed', 'true');
  await sheet(page).locator('[data-camp-filter="paid"]').click();
  await expect(camps).toHaveCount(okinawa.camps!.filter((c) => c.type === 'paid').length);
  await sheet(page).locator('[data-camp-filter="shower"]').click();
  await expect(sheet(page).locator('[data-camp-filter="paid"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(camps).toHaveCount(okinawa.camps!.filter((c) => c.shower).length);
  // a row: its card over the trip (the photo, the facts, Maps out); Esc closes only it
  const first = okinawa.camps!.find((c) => c.shower)!;
  await camps.first().click();
  const card = page.locator(`dialog[open] [data-camp-sheet="${first.id}"]`);
  await expect(card).toBeVisible();
  await expect(card.locator('img')).toHaveCount(1);
  await expect(card.locator('.row.kv')).toHaveCount(3);
  await expect(card.locator('[data-link]')).toHaveAttribute('target', '_blank');
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await expect(sheet(page).locator('[data-pane="prep"]')).toBeVisible();
});

test('Seattle (over, English only): 日程 地図 (none to show) 持ち物; a colour a day; a hike day’s figures under its heading, its photo, level, facts and trail in トレイル on a tap', async ({ page }) => {
  await gotoTrips(page, '2026-11-04T12:00');
  await pickTrip(page, 'seattle');
  await expect(sheet(page).locator('[data-trip-tab]')).toHaveText(['日程', '地図', '持ち物']);
  await expect(days(page)).toHaveCount(18);
  const dc = (n: number) => sheet(page).locator(`section[data-day="${n}"]`).evaluate((el) => getComputedStyle(el).getPropertyValue('--dc'));
  expect(await dc(1)).not.toBe(await dc(2));
  const day2 = sheet(page).locator('section[data-day="2"]');
  await expect(day2.locator('.hike')).toContainText('9.8');
  await expect(day2.locator('[data-day-tip]')).toHaveCount(0);
  // the drive's hour is the leg's now, not the row's words; the list's own words in the guide's English, never a mix
  await expect(line(page, 'r5-1').locator('.how')).toHaveText('Leave 8:30 · Drive 1 h');
  await expect(sheet(page).locator('[data-day-head="10"]')).toHaveText(/Sat, Jul 11\s*Day 10\s*The Enchantments/);
  await expect(day2.locator('.hike')).toContainText(' up · ');
  // a heading with details is a button, and the button itself carries the day's name (its parts are hidden)
  await expect(day2.locator('[data-day-head="2"]')).toHaveAccessibleName(/^Day 2 .+/);
  await expect(day2.locator('[data-day-head="2"]')).toHaveAttribute('aria-expanded', 'false');
  await day2.locator('[data-day-head="2"]').click();
  const tip = day2.locator('[data-day-tip="2"]');
  await expect(tip.locator('img')).toHaveCount(1);
  await expect(tip.locator('.sticker')).toHaveText('Moderate');
  await expect(tip).toContainText('Granite Falls, WA');
  await expect(tip.locator('.row.kv dd')).toHaveText(['1h 30m', 'Out & back', 'NW Forest Pass or day-use fee']);
  // トレイル's own Lake 22 over the trip; ✕ back to the day
  await tip.locator('[data-trail-open="lake-22"]').click();
  await expect(page.locator('dialog[open] [data-hiking] [data-trail-view="lake-22"]')).toBeVisible();
  await page.locator('dialog[open] [data-hiking] .nav.close:visible').click();
  await expect(page.locator('dialog[open] [data-hiking]')).toHaveCount(0);
  await expect(tip).toBeVisible();
});

test('NZ before the trip: every day on one page, a boarding pass each; a stop’s details; 地図で見る and back by 日程で見る; 地図 on the day being read; 日程 where it was left; 準備; ‹ back', async ({ page }) => {
  // the map's stub (its stops as buttons: travel-map.spec draws it)
  await page.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await gotoTrips(page, '2026-11-04T12:00');
  await pickTrip(page, 'nz');
  await expect(hdr(page).locator('h2')).toContainText('ニュージーランド');
  await expect(sheet(page).locator('[data-trip-tab]')).toHaveText(['日程', '地図', '準備', '持ち物']);
  await expect(tab(page, 'days')).toHaveAttribute('aria-current', 'page');
  await expect(days(page)).toHaveCount(nz.days.length);
  // the stub: ● the date, n日目, the title (the date in ink, the day's colour the dot's alone)
  const head3 = sheet(page).locator('[data-day-head="3"]');
  await expect(head3).toHaveText(/2\/13（土）\s*3日目\s*マーケット、そして南へ/);
  // (its parts hidden from the reader: the heading carries the day's name)
  await expect(sheet(page).locator('section[data-day="3"] h2')).toHaveAccessibleName('3日目 2/13（土） マーケット、そして南へ');
  // the day's lines: a stop's arrival and how we got there (「発」 on the first leg only), each fact once
  expect(await line(page, 3).evaluateAll((els) => els.map((e) => e.getAttribute('data-line')))).toEqual(lines(nz, nz.days[2]).map((l) => l.id));
  expect(lines(nz, nz.days[2]).map((l) => l.id)).toEqual(['s3-1', 's3-2', 's3-3']);
  await expect(line(page, 's3-1').locator('.how')).toHaveText('07:35発 · 車 19分');
  await expect(line(page, 's3-2').locator('.how')).toHaveText('車 2時間31分');
  await expect(line(page, 's3-2').locator('.sub')).toHaveText(/12:15\s*洞窟ツアー/);
  await expect(line(page, 's3-3').locator('[data-stay]')).toHaveText('泊未予約');
  const day3 = sheet(page).locator('section[data-day="3"]');
  for (const hidden of ['193', '日没', '09:15']) await expect(day3).not.toContainText(hidden);
  // a stop's details on a tap: the later leg, the note, km, then 地図で見る and Googleマップ
  await line(page, 's3-2').locator('.ln').click();
  const more = sheet(page).locator('[data-more="s3-2"]');
  await expect(more).toContainText('09:15パーネルを出発');
  await expect(more).toContainText('ツアーは事前予約');
  await expect(more).toContainText('193 km');
  await expect(more.locator('a')).toHaveAttribute('target', '_blank');
  // the day holding an open line is drawn in full (never content-visibility'd away); the days below are lazy
  await expect(day3).not.toHaveClass(/lazy/);
  await expect(sheet(page).locator('section[data-day="6"]')).toHaveClass(/lazy/);
  await more.locator('[data-on-map="s3-2"]').click();
  const map = sheet(page).locator('[data-travel-map]');
  await expect(map).toHaveAttribute('data-focus', '3');
  await expect(map).toHaveAttribute('data-selected', 's3-2');
  await expect(hdr(page).locator('h2')).toContainText('地図');
  // its card's 日程で見る: back to the stop's line, opened, in view
  await map.locator('[data-map-card="s3-2"] [data-map-go]').click();
  await expect(tab(page, 'days')).toHaveAttribute('aria-current', 'page');
  await expect(sheet(page).locator('[data-more="s3-2"]')).toBeInViewport();
  // 地図で見る on the same stop again rings it again, after the map's own pick (and its 日程で見る) in between
  await more.locator('[data-on-map="s3-2"]').click();
  await expect(map).toHaveAttribute('data-selected', 's3-2');
  await map.locator('[data-pin="s3-3"]').click();
  await expect(map).toHaveAttribute('data-selected', 's3-3');
  await map.locator('[data-map-card="s3-3"] [data-map-go]').click();
  await expect(sheet(page).locator('[data-more="s3-3"]')).toBeInViewport();
  await line(page, 's3-2').locator('.ln').click();
  await more.locator('[data-on-map="s3-2"]').click();
  await expect(map).toHaveAttribute('data-selected', 's3-2');
  await map.locator('[data-map-card="s3-2"] [data-map-go]').click();
  await expect(sheet(page).locator('[data-more="s3-2"]')).toBeInViewport();
  // 準備 and back to 日程: where it was left
  await tab(page, 'prep').click();
  await tab(page, 'days').click();
  await expect(line(page, 's3-2')).toBeInViewport();
  // day 5 read (its stub held at the top of the page: sticky inside its card), then 地図: day 5
  const top = await scroller(page).evaluate((el) => el.getBoundingClientRect().top);
  await scroller(page).evaluate((el) => {
    const s = el.querySelector<HTMLElement>('section[data-day="5"]')!;
    el.scrollTop += s.getBoundingClientRect().top - el.getBoundingClientRect().top + 200;
  });
  await expect.poll(() => sheet(page).locator('section[data-day="5"] .dh').evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBe(Math.round(top));
  await tab(page, 'map').click();
  await expect(map).toHaveAttribute('data-focus', '5');
  await expect(map).toHaveAttribute('data-selected', '');
  // 準備: a card opens to its lists; the demo's trip note fills the private values
  await tab(page, 'prep').click();
  const card = sheet(page).locator('[data-card="flights"]');
  await card.locator('.tog').click();
  await expect(card).toHaveAttribute('data-open', 'true');
  await expect(card.locator('li').first()).toBeVisible();
  await expect(card.locator('[data-locked]')).toHaveCount(0);
  await tab(page, 'pack').click();
  await expect(hdr(page).locator('h2')).toContainText('持ち物');
  await hdr(page).locator('.back').click();
  await expect(rows(page)).toHaveCount(4);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('inside a trip: on now first; 日程 opens on the stop we are heading to, the one line lit, the ones before it quiet (the trip’s clock)', async ({ page }) => {
  // Feb 13, 10:30 in Tokyo = 14:30 in Auckland: NZ's day 3, on the road from Waitomo to New Plymouth
  await gotoTrips(page, '2027-02-13T10:30');
  // during a trip, the pill opens straight into it
  await expect(sheet(page).locator('[data-trip-view="nz"]')).toBeVisible();
  const lit = sheet(page).locator('[data-now]');
  await expect(lit).toHaveCount(1);
  await expect(lit).toHaveAttribute('data-line', 's3-3');
  await expect(lit).toHaveAttribute('data-now', 'moving');
  await expect(lit.locator('.how')).toHaveText('いま移動中 · あと1時間40分 · 181 km');
  // the page opened on it: a third of the way down
  await expect.poll(async () => {
    const y = (await lit.boundingBox())!.y;
    return y > 852 * 0.2 && y < 852 * 0.5;
  }).toBe(true);
  await expect(line(page, 's3-2')).toHaveClass(/past/);
  await expect(line(page, 's2-1')).toHaveClass(/past/);
  await expect(line(page, 's4-1')).not.toHaveClass(/past/);
  await hdr(page).locator('.back').click();
  await expect(rows(page).first()).toHaveAttribute('data-trip', 'nz');
  await expect(rows(page).first()).toHaveAttribute('data-phase', 'now');
  await expect(sheet(page).locator('[data-trip="nz"] [data-day-now]')).toHaveText('3');
  await expect(rows(page).first()).toHaveAttribute('aria-label', /3日目$/);
  await shot(page, 'list-now');
});

test('NZ: the eve’s flight out (Tokyo’s 18:30) lit, 前日 over its time, the trip on', async ({ page }) => {
  // Feb 10, 19:00 in Tokyo (23:00 in Auckland): NZ 98 left Narita at 18:30 (its row dd −1, on Tokyo's clock)
  await gotoTrips(page, '2027-02-10T19:00');
  await expect(sheet(page).locator('[data-trip-view="nz"]')).toBeVisible();
  const lit = line(page, 'r1-0');
  await expect(lit).toHaveAttribute('data-now', 'here');
  await expect(lit.locator('.t small')).toHaveText('前日');
  await expect(lit.locator('.how')).toHaveText('いま');
  await expect(lit).toBeInViewport();
});

test('NZ day 4, 00:30: 次 on the trailhead, its time to go', async ({ page }) => {
  // Feb 14, 00:30 in Auckland = Feb 13, 20:30 in Tokyo
  await gotoTrips(page, '2027-02-13T20:30');
  await expect(sheet(page).locator('[data-trip-view="nz"]')).toBeVisible();
  await expect(sheet(page).locator('[data-now]')).toHaveCount(1);
  await expect(line(page, 's4-1')).toHaveAttribute('data-now', 'next');
  await expect(line(page, 's4-1').locator('.how')).toHaveText('次 · あと3時間');
  await expect(line(page, 's3-3')).toHaveClass(/past/);
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
  await expect(rows(page)).toHaveCount(4);
});

test('offline before the first opening: the pill says so, もう一度 opens it once back', async ({ page, context }) => {
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandUp(page);
  await context.setOffline(true);
  await unfoldMenu(page);
  await page.locator('[data-hud-travel]').click();
  const banner = page.getByText('オフラインです');
  await expect(banner).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await shot(page, 'offline-pill');
  await context.setOffline(false);
  // (offline, the chunk wasn't asked for: lazySheet's unreachable; WebKit would keep its failed preloads, and the
  // retry reloaded the page) back online, もう一度 opens it in place, no reload
  let reloads = 0;
  page.on('load', () => reloads++);
  await page.getByRole('button', { name: 'もう一度' }).click();
  await expect(rows(page)).toHaveCount(4);
  expect(reloads).toBe(0);
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

test.describe('pictures', () => {
  test.skip(!process.env.SHOTS, 'SHOTS=<dir> only');
  const toDay = (p: Page, n: number, by = 0) =>
    scroller(p).evaluate((el, [n, by]) => {
      const s = el.querySelector<HTMLElement>(`section[data-day="${n}"]`)!;
      el.scrollTop += s.getBoundingClientRect().top - el.getBoundingClientRect().top + by;
    }, [n, by] as const).then(() => frames(p));
  /** A frame's turn (the page's own polling): a lazy day (content-visibility) jumped to is drawn the frame after. */
  const frames = (p: Page) => p.waitForFunction(() => true, null, { polling: 'raf' });
  for (const [tod, hour] of [['day', '12:00'], ['night', '21:30']] as const) {
    test(`every screen, ${tod}`, async ({ page }) => {
      await gotoTrips(page, `2026-11-04T${hour}`);
      await shot(page, `01-list-${tod}`);
      await pickTrip(page, 'nz');
      await shot(page, `02-nz-top-${tod}`);
      await toDay(page, 3, 140);
      await shot(page, `02b-nz-middle-${tod}`);
      await line(page, 's3-2').locator('.ln').click();
      await line(page, 's3-2').evaluate((el) => el.scrollIntoView({ block: 'center' }));
      await frames(page);
      await shot(page, `02c-nz-expanded-${tod}`);
      await tab(page, 'prep').click();
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
  test('inside the NZ trip, on the road (day 3)', async ({ page }) => {
    await gotoTrips(page, '2027-02-13T10:30');
    await expect(sheet(page).locator('[data-now]')).toBeInViewport();
    await shot(page, '02n-nz-now');
  });
  test('Okinawa and Seattle', async ({ page }) => {
    await gotoTrips(page, '2026-11-04T12:00');
    await pickTrip(page, 'okinawa');
    await shot(page, '07-okinawa');
    await hdr(page).locator('.back').click();
    await pickTrip(page, 'seattle');
    await shot(page, '08-seattle');
    await toDay(page, 11, -60);
    await shot(page, '08b-seattle-middle');
  });
});
