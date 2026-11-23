// トレイル (components/hiking, docs/hiking.md), the logic tier: under drawOff() the trail's map is a stub that draws the
// track and the scrub's dot as SVG (no MapLibre, no tiles: nothing leaves the preview). Every trail's track is the
// invented fixture (e2e/fixtures/hiking/tiny.gpx, converted here by the app's own converter): the list, its chips, a
// trail's peek and sheet, the elevation scrub moving the map's dot, Kinpu's plan, ‹ and ✕; the track on every trail
// opened again. The in-hike map (docs/hiking.md "In-hike map"): the location disc's loop with a faked geolocation and a
// faked compass (deviceorientation's webkitCompassHeading, requestPermission granted), hike mode's strip and the
// off-route banner on scripted fixes (the page's clock skewed, never waited), OSM's other trails (the fixture net file,
// e2e/fixtures/hiking/tiny-net.json, on tiny.gpx) and the junction card. The start time moved on Ōno's plan on two paired
// phones (e2e/liveRoom.ts): the stops, the other phone, hike mode's 到着, 元に戻す. The drawn smoke (@render): MapLibre on a blank
// topo tile (never the network), the track drawn on each trail opened, not just the first (the map's chunk in before
// the track: 2026-11-07); the cone and the N disc (the compass never turns the map); the reference layer and its credit.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Browser, type Locator, type Page, type Route } from './fixtures.ts';
import { BASE, islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { drawn } from './trips.ts';
import { newIsland } from './liveRoom.ts';
import { shot } from './shots.ts';
import { toTrack } from '../src/lib/contract/hikeTrack.ts';

test.use({ viewport: { width: 393, height: 852 } });

const TRACK = toTrack(readFileSync(join(import.meta.dirname, 'fixtures', 'hiking', 'tiny.gpx'), 'utf8'));
const sheet = (p: Page) => p.locator('dialog[open] [data-hiking]');
const cards = (p: Page) => sheet(p).locator('[data-trail]');

async function openTrails(page: Page, draw = false, net: unknown = null, date = '2026-11-04T12:00') {
  if (!draw) await page.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: TRACK }));
  // a Japan trail's reference trails (lib/hiking/net.ts): none unless a test gives the fixture
  await page.route('**/hiking/net/*.json', (r) => (net ? r.fulfill({ json: net }) : r.fulfill({ status: 404, body: '' })));
  await page.goto(`${BASE}/?demo&date=${date}`);
  // (the island up first, as after any goto: drawn, the menu unfolded while the island was still mounting never had
  // its pills in place)
  await islandUp(page);
  await fromMenu(page, 'hiking');
  await expect(cards(page)).toHaveCount(14);
}

test('the list: 予定 (a photo card), 行きたい and 歩いた (rows); the region and level chips, the sort sheet; a row opens its trail, ‹ back, ✕ closes', async ({ page }) => {
  await openTrails(page);
  const list = sheet(page).locator('[data-trail-list]');
  const order = () => cards(page).evaluateAll((xs) => xs.map((x) => x.getAttribute('data-trail')));
  await expect(list.locator('.ttl')).toHaveText('梅ちゃんのトレイル');
  // Nov 4: Akigawa's and Ōno's plans are to come (the sooner first); Akagi (walked Nov 7: its record), Utsukushigahara and
  // Kinpu (its plan gone) walked
  await expect(list.locator('[data-section]')).toHaveText(['予定2', '行きたい9', '歩いた3']);
  await expect(cards(page).first()).toHaveAttribute('data-trail', 'akigawa-shiroyama');
  await expect(cards(page).nth(1)).toHaveAttribute('data-trail', 'ono-yama');
  expect((await order()).slice(-3)).toEqual(['akagi-kurobi', 'utsukushigahara', 'kinpu-odarumi']);
  const lake = sheet(page).locator('[data-trail="lake-22"]');
  await expect(lake.locator('.fig')).toHaveText('9.8 km · 444 m · 約3時間15分');
  await expect(sheet(page).locator('[data-trail="akagi-kurobi"] .sub')).toHaveText('2026年11月7日（土）');

  await list.locator('[data-region="jp"]').click();
  await expect(cards(page)).toHaveCount(6);
  await list.locator('[data-filter="hard"]').click();
  await expect(list.locator('[data-filter="hard"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(cards(page)).toHaveCount(1); // 富士山
  await list.locator('[data-filter="moderate"]').click(); // any of the levels
  await expect(cards(page)).toHaveCount(6);
  await list.locator('[data-region="us"]').click();
  await list.locator('[data-filter="moderate"]').click();
  await list.locator('[data-filter="veryhard"]').click();
  await expect(cards(page)).toHaveCount(4);
  // すべて clears the region and the levels
  await expect(list.locator('[data-region="all"]')).toHaveAttribute('aria-pressed', 'false');
  await list.locator('[data-region="all"]').click();
  await expect(list.locator('[data-region="all"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(cards(page)).toHaveCount(14);

  await list.locator('[data-sort]').click();
  await page.locator('dialog[open] [data-sort-dist]').click();
  await expect(list.locator('[data-sort]')).toHaveText('距離が短い順');
  const want = list.locator('[data-trail]:not(.card)');
  expect((await order())[2]).toBe('talapus-lake'); // 行きたい's shortest
  await expect(want.nth(9)).toHaveAttribute('data-trail', 'akagi-kurobi'); // 歩いた's shortest
  await list.locator('[data-sort]').click();
  await page.locator('dialog[open] [data-sort-auto]').click();
  await expect(list.locator('[data-sort]')).toHaveText('おすすめ順');
  expect((await order())[2]).toBe('lake-22');

  await sheet(page).locator('[data-trail="snow-lake"]').click();
  const view = sheet(page).locator('[data-trail-view="snow-lake"]');
  await expect(view).toBeVisible();
  await expect(sheet(page)).toHaveAttribute('data-level', 'trail');
  await expect(view.locator('.pk-title')).toHaveText('スノーレイク・トレイル');
  await view.locator('.nav.back').click();
  await expect(view).toHaveCount(0);
  await expect(sheet(page).locator('[data-trail-list]')).toBeVisible();
  await sheet(page).locator('.nav.close:visible').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('a trail: the peek shows the whole chart; the scrub moves the map\'s dot and stays; a tap clears it; the sheet up and down', async ({ page }) => {
  await openTrails(page);
  await sheet(page).locator('[data-trail="lake-22"]').click();
  const view = sheet(page).locator('[data-trail-view="lake-22"]');
  const map = view.locator('[data-trail-map]');
  const elev = view.locator('[data-elev]');
  await expect(map).toHaveAttribute('data-mode', 'stub');
  await expect(view.locator('[data-map-stub] polyline')).toHaveCount(1);
  await expect(elev).toBeVisible();
  await expect(elev.locator('[data-elev-range]')).toHaveText(/^\d+〜\d+ m$/);
  // the peek reaches just under the chart: the chart all on screen, the sheet's top above it
  // (once the sheet has eased up to it)
  await expect.poll(async () => ((b) => b.y + b.height)((await elev.boundingBox())!)).toBeLessThanOrEqual(852);
  await expect(view).toHaveAttribute('data-sheet', 'peek');
  // 歩きはじめる below the fold: a quiet row under the chart, seen with the sheet open
  await expect(view.locator('[data-hike-start]')).not.toBeInViewport();

  // press at the middle: the readout and the map's dot; drag to three quarters; let go: it stays
  // (the sheet's height eases: wait for the chart to stand still)
  let last = '';
  await expect.poll(async () => {
    const b = JSON.stringify(await elev.locator('svg').boundingBox());
    const still = b === last;
    last = b;
    return still;
  }).toBe(true);
  const svg = (await elev.locator('svg').boundingBox())!;
  const y = svg.y + svg.height / 2;
  await page.mouse.move(svg.x + svg.width * 0.5, y);
  await page.mouse.down();
  await expect(elev.locator('[data-scrub-tip]')).toBeVisible();
  await expect(elev.locator('[data-scrub-tip]')).toHaveText(/^\d+ m\d+\.\d km$/);
  const half = Number(await elev.getAttribute('data-held'));
  expect(Math.abs(half - TRACK.len / 2)).toBeLessThan(TRACK.len * 0.02);
  const at1 = await map.getAttribute('data-scrub');
  expect(at1).not.toBe('');
  await expect(view.locator('[data-scrub-dot]')).toHaveCount(1);
  await page.mouse.move(svg.x + svg.width * 0.75, y, { steps: 4 });
  await expect.poll(async () => Number(await elev.getAttribute('data-held'))).toBeGreaterThan(TRACK.len * 0.7);
  await page.mouse.up();
  await expect(elev.locator('[data-scrub-tip]')).toBeVisible();
  expect(await map.getAttribute('data-scrub')).not.toBe(at1);
  // a tap on the held readout clears it, and the map's dot with it
  await page.mouse.click(svg.x + svg.width * 0.2, y);
  await expect(elev.locator('[data-scrub-tip]')).toHaveCount(0);
  await expect(map).toHaveAttribute('data-scrub', '');
  await expect(view.locator('[data-scrub-dot]')).toHaveCount(0);

  // the grip: up to 90 %, the sections in reach; Esc folds it; Esc again closes the sheet
  await view.locator('[data-sheet-grip]').click();
  await expect(view).toHaveAttribute('data-sheet', 'full');
  await expect(view.locator('[data-hike-start]')).toBeInViewport();
  await expect(view.locator('.facts dd').first()).toHaveText('往復');
  await expect(view.locator('.attrib')).toHaveText('コース情報・写真：AllTrails ／ 地図 © USGS National Map');
  await page.keyboard.press('Escape');
  await expect(view).toHaveAttribute('data-sheet', 'peek');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test("Kinpu's plan: the date, the timeline (a stay's badge, a leg's minutes), its private values locked; openTrail lands on the trail, ‹ the list", async ({ page }) => {
  await openTrails(page);
  await sheet(page).locator('.nav.close:visible').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.evaluate(() => (window as unknown as { __hiking: { openTrail(s: string): void } }).__hiking.openTrail('kinpu-odarumi'));
  const view = sheet(page).locator('[data-trail-view="kinpu-odarumi"]');
  await expect(view).toBeVisible();
  const plan = view.locator('[data-plan]');
  await expect(plan.locator('.date')).toHaveText('2026年6月27日（土）');
  await expect(plan.locator('.head .lbl')).toHaveText('山行日'); // gone by on Nov 4: not 山行予定
  await expect(plan.locator('[data-plan-actual]')).toHaveCount(0); // (gone by, but no record of its hike: Trail.walked)
  await expect(plan.locator('[data-stop]')).toHaveCount(11);
  await expect(plan.locator('[data-stop]').nth(5)).toContainText('金峰山（甲州御岳山）');
  await expect(plan.locator('.stay')).toHaveText('滞在 2時間');
  await expect(plan.locator('.leg').first()).toHaveText('39分');
  // (the demo has no `hiking` note: the link hidden, the party and the planner locked)
  await expect(plan.locator('[data-plan-link]')).toHaveCount(0);
  await expect(plan.locator('.lock')).toHaveCount(2);
  await expect(view.locator('.attrib')).toContainText('国土地理院');
  await view.locator('.nav.back').click();
  await expect(sheet(page).locator('[data-trail-list]')).toBeVisible();
});

test("a trail walked on YAMAP: its Commons photo on the card, the record's rows in 詳細情報, YAMAP's and the photo's credits", async ({ page }) => {
  await openTrails(page);
  const card = sheet(page).locator('[data-trail="akagi-kurobi"]');
  await expect(card.locator('img')).toHaveAttribute('src', /hiking\/photos\/akagi-kurobi\.webp$/);
  await expect(card.locator('.fig')).toHaveText('5.3 km · 568 m · 約5時間');
  await card.click();
  const view = sheet(page).locator('[data-trail-view="akagi-kurobi"]');
  await expect(view.locator('[data-walked] dd')).toHaveText('2026年11月7日（土）');
  await expect(view.locator('.facts')).toContainText('568 m ／ 569 m');
  await expect(view.locator('.facts')).toContainText('3時間37分');
  await expect(view.locator('.attrib')).toHaveText(
    '軌跡・記録：YAMAP ／ 写真：大沼越しの黒檜山・駒ヶ岳 © Koda6029（CC BY-SA 4.0、Wikimedia Commons、トリミング・縮小） ／ 出典：国土地理院（地理院タイル）'
  );
  await expect(view.locator('[data-photo-credit] a').first()).toHaveAttribute('href', /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  await expect(view.locator('[data-photo-credit] a').last()).toHaveAttribute('href', /^https:\/\/creativecommons\.org\/licenses\/by-sa\/4\.0\/$/);
});

test("Akigawa's YAMAP plan, tapped from the list: its Commons photo, the plan's figures, a coming hike's timeline (the hour's rest), its private values locked, the plan's credits", async ({ page }, info) => {
  const how = info.project.name.startsWith('webkit') ? 'tap' : 'click';
  await openTrails(page);
  const card = sheet(page).locator('[data-trail="akigawa-shiroyama"]');
  await expect(card.locator('img')).toHaveAttribute('src', /hiking\/photos\/akigawa-shiroyama\.webp$/);
  await expect(card.locator('.stats')).toContainText('11.2km');
  await expect(card.locator('.stats')).toContainText('514m');
  await expect(card.locator('.stats')).toContainText('約4時間');
  await card.locator('.hit').scrollIntoViewIfNeeded();
  await card.locator('.hit')[how]();
  const view = sheet(page).locator('[data-trail-view="akigawa-shiroyama"]');
  await expect(view.locator('.pk-title')).toHaveText('秋川渓谷（戸倉城山・瀬音の湯）');
  const plan = view.locator('[data-plan]');
  await expect(plan.locator('.date')).toHaveText('2026年11月21日（土）');
  await expect(plan.locator('.head .lbl')).toHaveText('山行予定'); // to come on Nov 4
  await expect(plan.locator('[data-plan-actual]')).toHaveCount(0);
  await expect(plan.locator('[data-stop]')).toHaveCount(11);
  await expect(plan.locator('[data-stop]').nth(1)).toContainText('城山（戸倉城山）');
  await expect(plan.locator('[data-stop]').last()).toContainText('広徳寺（総門）');
  await expect(plan.locator('.stay')).toHaveText('滞在 1時間');
  await expect(plan.locator('.leg').first()).toHaveText('1時間18分');
  await expect(plan.locator('.meta')).toContainText('5:00');
  await expect(plan.locator('.foot')).toContainText('標準 100% · コース定数 15');
  await expect(plan.locator('[data-plan-link]')).toHaveCount(0);
  await expect(plan.locator('.lock')).toHaveCount(2);
  await expect(view.locator('.attrib')).toHaveText(
    'コース・計画：YAMAP ／ 写真：Akigawa River in the autumn © Hiroaki Kaneko（CC BY-SA 2.0、Wikimedia Commons、トリミング・縮小） ／ 出典：国土地理院（地理院タイル）'
  );
  await view.locator('.nav.back')[how]();
  await expect(sheet(page).locator('[data-trail-list]')).toBeVisible();
});

test("Ōno's YAMAP plan, tapped from the list: its Commons photo, the plan's figures, the timeline (the summit's hour), its private values locked, the plan's credits", async ({ page }, info) => {
  const how = info.project.name.startsWith('webkit') ? 'tap' : 'click';
  await openTrails(page);
  const card = sheet(page).locator('[data-trail="ono-yama"]');
  await expect(card.locator('img')).toHaveAttribute('src', /hiking\/photos\/ono-yama\.webp$/);
  await expect(card.locator('.stats')).toContainText('10.3km');
  await expect(card.locator('.stats')).toContainText('664m');
  await expect(card.locator('.stats')).toContainText('約4時間40分');
  await card.locator('.hit').scrollIntoViewIfNeeded();
  await card.locator('.hit')[how]();
  const view = sheet(page).locator('[data-trail-view="ono-yama"]');
  await expect(view.locator('.pk-title')).toHaveText('大野山（谷峨駅〜山北駅）');
  const plan = view.locator('[data-plan]');
  await expect(plan.locator('.date')).toHaveText('2026年11月23日（月）');
  await expect(plan.locator('.head .lbl')).toHaveText('山行予定');
  await expect(plan.locator('[data-plan-actual]')).toHaveCount(0);
  await expect(plan.locator('[data-stop]')).toHaveCount(8);
  await expect(plan.locator('[data-stop]').first()).toContainText('谷峨駅バス停');
  await expect(plan.locator('[data-stop]').nth(5)).toContainText('大野山');
  await expect(plan.locator('[data-stop]').last()).toContainText('山北駅');
  await expect(plan.locator('.stay')).toHaveText('滞在 1時間');
  await expect(plan.locator('.leg').first()).toHaveText('8分');
  await expect(plan.locator('.meta')).toContainText('5:38');
  await expect(plan.locator('.foot')).toContainText('標準 100% · コース定数 18');
  await expect(plan.locator('[data-plan-link]')).toHaveCount(0);
  await expect(plan.locator('.lock')).toHaveCount(2);
  // the descent's 地蔵岩コース split has no fork card (OSM lacks the path): a tip says it
  await expect(view.locator('.tips')).toContainText('下山は（約4.8km地点）地蔵岩コースへ入らず、イヌクビリ・山北駅方面へ。');
  await expect(view.locator('.attrib')).toHaveText(
    'コース・計画：YAMAP ／ 写真：Mt.Oono 04 © Σ64（CC BY 3.0、Wikimedia Commons、トリミング・縮小） ／ 出典：国土地理院（地理院タイル）'
  );
  await view.locator('.nav.back')[how]();
  await expect(sheet(page).locator('[data-trail-list]')).toBeVisible();
});

test('a plan gone by with no record of its hike (Ōno the day after): 山行日, but its figures not called 実際', async ({ page }) => {
  await openTrails(page, false, null, '2026-11-24T09:00');
  await sheet(page).locator('.nav.close:visible').click();
  await page.evaluate(() => (window as unknown as { __hiking: { openTrail(s: string): void } }).__hiking.openTrail('ono-yama'));
  const plan = sheet(page).locator('[data-trail-view="ono-yama"] [data-plan]');
  await expect(plan.locator('.head .lbl')).toHaveText('山行日');
  await expect(plan.locator('[data-plan-actual]')).toHaveCount(0);
});

// (an iPhone 15/16's insets; and the home-screen app's 16px more under the status bar, docs/design.md)
for (const [ui, top] of [['Safari', '59px'], ['home screen', 'calc(59px + 16px)']] as const)
test(`the full sheet stops under ‹ ✕ (${ui}): none of its content under the floating buttons, at its top or held dragged past it, scrolled to the end`, async ({ page }) => {
  await page.addInitScript((t) => document.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style');
    s.textContent = `html:root { --safe-top: 59px !important; --safe-bottom: 34px !important; --ui-top: ${t} !important; }`;
    document.head.append(s);
  }), top);
  await openTrails(page);
  await sheet(page).locator('[data-trail="kinpu-odarumi"]').click();
  const view = sheet(page).locator('[data-trail-view="kinpu-odarumi"]');
  await expect(view.locator('[data-elev]')).toBeVisible();
  const buttons = await Promise.all(['.nav.back', '.nav.close'].map(async (s) => (await view.locator(s).boundingBox())!));
  const foot = Math.max(...buttons.map((b) => b.y + b.height));
  const sheetTop = async () => (await view.locator('.sheet').boundingBox())!.y;
  /** The sheet's top once it stands still (its height eases). */
  const settled = async () => {
    let last = NaN;
    await expect.poll(async () => last === (last = await sheetTop())).toBe(true);
    return last;
  };
  const clear = async () => expect(await settled()).toBeGreaterThanOrEqual(foot);

  // held: dragged far past the top, it stops there too
  const g = (await view.locator('[data-sheet-grip]').boundingBox())!;
  await page.mouse.move(g.x + g.width / 2, g.y + 4);
  await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, 0, { steps: 6 });
  await clear();
  await page.mouse.up();
  await expect(view).toHaveAttribute('data-sheet', 'full');
  await clear();
  // its title, and the last of the body scrolled to the end, below the buttons
  expect((await view.locator('.pk-title').boundingBox())!.y).toBeGreaterThanOrEqual(foot);
  await view.locator('.body').evaluate((b) => (b.scrollTop = b.scrollHeight));
  const end = (await view.locator('.attrib').boundingBox())!;
  expect(end.y).toBeGreaterThanOrEqual(foot);
  expect(end.y + end.height).toBeLessThanOrEqual(852);
  // the buttons stay where they were, ‹ still takes you back
  expect((await view.locator('.nav.back').boundingBox())!).toEqual(buttons[0]);
  await view.locator('.nav.back').click();
  await expect(sheet(page).locator('[data-trail-list]')).toBeVisible();
});

/** Each trail in turn, then the first again, the sheet closed and opened between; `drawnTrack` whether its track is on its map. */
async function reopen(page: Page, drawnTrack: (view: ReturnType<Page['locator']>) => Promise<void>) {
  for (const [i, slug] of [[0, 'lake-22'], [1, 'snow-lake'], [0, 'lake-22'], [-1, ''], [2, 'lake-valhalla'], [0, 'lake-22']] as const) {
    if (i < 0) {
      await sheet(page).locator('.nav.close:visible').click();
      await expect(page.locator('dialog[open]')).toHaveCount(0);
      await fromMenu(page, 'hiking');
      continue;
    }
    await sheet(page).locator(`[data-trail="${slug}"]`).click();
    const view = sheet(page).locator(`[data-trail-view="${slug}"]`);
    await expect(view.locator('[data-elev]')).toBeVisible();
    await drawnTrack(view);
    await view.locator('.nav.back').click();
    await expect(view).toHaveCount(0);
  }
}

test('the track on every trail opened, again after ‹ and after ✕', async ({ page }) => {
  await openTrails(page);
  await reopen(page, (view) => expect(view.locator('[data-map-stub] polyline')).toHaveCount(1));
});

/** A blank 1×1 topo tile (a PNG), for every tile asked. */
const TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
type TrailMapHook = { __trailMap?: { state(): { mode: string; track?: number; box?: [number, number] | null } } };

test('drawn: the track on the map of every trail opened, not just the first', { tag: '@render' }, async ({ page }) => {
  test.setTimeout(120_000);
  await drawn(page);
  await page.route(/^https:\/\/(basemap\.nationalmap\.gov|cyberjapandata\.gsi\.go\.jp)\//, (r) => r.fulfill({ contentType: 'image/png', body: TILE, headers: { 'access-control-allow-origin': '*' } }));
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openTrails(page, true);
  await reopen(page, async (view) => {
    await expect(view.locator('[data-trail-map]')).toHaveAttribute('data-mode', 'ready', { timeout: 30_000 });
    await expect.poll(() => page.evaluate(() => (window as unknown as TrailMapHook).__trailMap?.state().track ?? 0), { timeout: 15_000 }).toBeGreaterThan(0);
  });
  expect(errors).toEqual([]);
});

// The route fitted between the controls (‹ ✕, the save pill, ＋ −: the safe area's top under them) and the sheet's peek,
// not under ‹ and the pill (review 11/10 r3 N6: the start dot behind ‹ with the 59 px safe area).
test('drawn: the route between the map’s controls and the sheet', { tag: '@render' }, async ({ page }) => {
  // (the map drawn, the island under the sheet not: its software-GL frames took this test past 30 s on CI's runner)
  await page.addInitScript(() => localStorage.setItem('e2e.render', 'map'));
  await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => document.documentElement.style.setProperty('--safe-top', '59px', 'important')));
  await page.route(/^https:\/\/(basemap\.nationalmap\.gov|cyberjapandata\.gsi\.go\.jp)\//, (r) => r.fulfill({ contentType: 'image/png', body: TILE, headers: { 'access-control-allow-origin': '*' } }));
  await openTrails(page, true);
  await sheet(page).locator('[data-trail="lake-22"]').click();
  const view = sheet(page).locator('[data-trail-view="lake-22"]');
  await expect(view.locator('[data-trail-map]')).toHaveAttribute('data-mode', 'ready', { timeout: 30_000 });
  const box = () => page.evaluate(() => (window as unknown as TrailMapHook).__trailMap?.state().box ?? null);
  await expect.poll(box, { timeout: 15_000 }).not.toBeNull();
  const map = (await view.locator('[data-trail-map]').boundingBox())!;
  const foot = Math.max(...(await Promise.all(['.offline', '.zoom'].map(async (s) => { const b = (await view.locator(s).boundingBox())!; return b.y + b.height; }))));
  const peek = (await view.locator('.sheet').boundingBox())!.y;
  expect(foot).toBeGreaterThan(59 + 52); // (the safe area applied)
  await expect.poll(async () => { const [top, bottom] = (await box())!; return top + map.y >= foot && bottom + map.y <= peek; }).toBe(true);
});

// The maps' one status rule (MapStatus): no tile 2 s in, 「地図を読み込み中…」; the tiles failing, the offline note; each
// under the map's own top controls (the offline note was under オフライン用に保存, unreadable: ux-audit 11/23).
test('drawn: the loading note, then the offline note, under the save pill', { tag: '@render' }, async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('e2e.render', 'map'));
  const held: Route[] = [];
  let fail = false;
  await page.route(/^https:\/\/(basemap\.nationalmap\.gov|cyberjapandata\.gsi\.go\.jp)\//, (r) => (fail ? r.abort() : void held.push(r)));
  await openTrails(page, true);
  await sheet(page).locator('[data-trail="lake-22"]').click();
  const view = sheet(page).locator('[data-trail-view="lake-22"]');
  const note = view.locator('[data-map-note]');
  await expect(note).toHaveAttribute('data-map-note', 'loading', { timeout: 15_000 });
  await expect(note).toHaveText('地図を読み込み中…');
  fail = true;
  await Promise.all(held.splice(0).map((r) => r.abort()));
  await expect(note).toHaveAttribute('data-map-note', 'offline');
  const [pill, box] = await Promise.all([view.locator('.offline').boundingBox(), note.boundingBox()]);
  expect(box!.y).toBeGreaterThanOrEqual(pill!.y + pill!.height);
});

// ── the in-hike map (docs/hiking.md "In-hike map") ──

const NET = JSON.parse(readFileSync(join(import.meta.dirname, 'fixtures', 'hiking', 'tiny-net.json'), 'utf8')) as { trk: string };
type Tap = 'tap' | 'click';
const howOf = (name: string): Tap => (name.startsWith('webkit') ? 'tap' : 'click');

/** The phone's compass, faked: requestPermission answers granted (counted), `__heading(h, acc)` sends a reading as iOS
 *  does (webkitCompassHeading, magnetic); the wake lock a stand-in whose `__wl` the test can let go; watchPosition's
 *  options kept (`__geoOpts`); `__skew(ms)` moves the page's clock on (the hike's timing, never waited for). */
async function fakePhone(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    const D = (window.DeviceOrientationEvent ?? class extends Event {}) as unknown as Record<string, unknown>;
    if (!window.DeviceOrientationEvent) w.DeviceOrientationEvent = D;
    w.__asked = 0;
    D.requestPermission = () => ((w.__asked = (w.__asked as number) + 1), Promise.resolve('granted'));
    w.__heading = (h: number, acc = 10) => dispatchEvent(Object.assign(new Event('deviceorientation'), { webkitCompassHeading: h, webkitCompassAccuracy: acc }));
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: async () => {
          const s = Object.assign(new EventTarget(), { released: false, release: async () => ((s.released = true), s.dispatchEvent(new Event('release'))) });
          w.__wl = s;
          return s;
        }
      }
    });
    const geo = navigator.geolocation, watch = geo.watchPosition.bind(geo);
    w.__geoOpts = [];
    geo.watchPosition = (ok, err, o) => ((w.__geoOpts as unknown[]).push(o), watch(ok, err, o));
    let skew = 0;
    const now = Date.now.bind(Date);
    Date.now = () => now() + skew;
    w.__skew = (ms: number) => (skew += ms);
  });
}

/** Kinpu (a Japan trail) with the fixture net file (`net`, or none: 404). */
async function openKinpu(page: Page, net: unknown = NET, draw = false) {
  await openTrails(page, draw, net);
  await sheet(page).locator('[data-trail="kinpu-odarumi"]').click();
  const view = sheet(page).locator('[data-trail-view="kinpu-odarumi"]');
  await expect(view.locator('[data-elev]')).toBeVisible();
  return view;
}
const at = (page: Page, lat: number, lon: number, accuracy = 8) => page.context().setGeolocation({ latitude: lat, longitude: lon, accuracy });
const skew = (page: Page, ms: number) => page.evaluate((m) => (window as unknown as { __skew(n: number): void }).__skew(m), ms);

/** 歩きはじめる: a row under the chart, below the peek's fold (tracking is occasional): the sheet opened to it, then
 *  tapped (the sheet folds back to the peek, the strip). */
async function startHike(view: ReturnType<typeof sheet>, how: Tap) {
  const start = view.locator('[data-hike-start]');
  await expect(view).toHaveAttribute('data-sheet', 'peek');
  await expect(start).not.toBeInViewport();
  await view.locator('[data-sheet-grip]')[how]();
  await expect(view).toHaveAttribute('data-sheet', 'full');
  await expect(start).toBeInViewport();
  await start[how]();
  await expect(view).toHaveAttribute('data-sheet', 'peek');
}
const asked = (page: Page) => page.evaluate(() => (window as unknown as { __asked: number }).__asked);
/** A compass reading, as iOS sends it (magnetic). */
const heading = (page: Page, h: number, acc = 10) =>
  page.evaluate(([d, a]) => (window as unknown as { __heading(h: number, a: number): void }).__heading(d, a), [h, acc]);
/** The cone's heading (true, deg) once it is over `min`: a few readings sent at each look, as a phone streams them
 *  (the compass smooths each and tells ~15 a second; one a look took most of the drawn tier's 30 s on CI's runner). */
const settle = (page: Page, map: Locator, h: number, min: number) =>
  expect.poll(async () => {
    await page.evaluate((d) => { for (let i = 0; i < 4; i++) (window as unknown as { __heading(h: number, a: number): void }).__heading(d, 10); }, h);
    return Number(await map.getAttribute('data-heading'));
  }, { intervals: [50] }).toBeGreaterThan(min);

test('the location disc: off → 追従 → off, a label for each; the compass asked on the tap into 追従 (once a session), the cone while following, never the map turned; the calibration hint', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await context.grantPermissions(['geolocation']);
  await at(page, 35.002, 139.0001);
  await fakePhone(page);
  const view = await openKinpu(page);
  const disc = view.locator('[data-locate]'), map = view.locator('[data-trail-map]'), toast = view.locator('[data-cam-toast]');
  await expect(disc).toHaveAttribute('data-locate', 'off');
  await expect(view.locator('[data-compass]')).toHaveCount(0);
  // big: a 64px hit
  expect(((b) => [b.width, b.height])((await disc.boundingBox())!)).toEqual([64, 64]);

  await disc[how]();
  await expect(disc).toHaveAttribute('data-locate', 'follow');
  await expect(toast).toHaveText('追従中');
  await expect(view.locator('[data-loc-dot]')).toHaveCount(1);
  expect(await asked(page)).toBe(1);
  // a reading (magnetic 100°): the cone takes the true heading (Japan: ~7.5° west); the camera stays as it was
  await settle(page, map, 100, 90);
  expect(Number(await map.getAttribute('data-heading'))).toBeLessThan(95);
  await expect(map).toHaveAttribute('data-cam', 'follow');
  await expect(view.locator('[data-compass]')).toHaveCount(0);
  // a poor reading brings the calibration hint, a good one takes it away
  await heading(page, 100, -1);
  await expect(view.locator('[data-calib]')).toHaveText('方位が不正確です。スマホを8の字に動かしてください');
  await heading(page, 100, 10);
  await expect(view.locator('[data-calib]')).toHaveCount(0);

  await disc[how]();
  await expect(disc).toHaveAttribute('data-locate', 'off');
  await expect(toast).toHaveText('現在地オフ');
  await expect(view.locator('[data-loc-dot]')).toHaveCount(0);
  // off: the compass with it (no cone)
  await expect(map).toHaveAttribute('data-heading', '');
  await expect(toast).toHaveCount(0); // (1 s)

  // again: no second ask (the session's answer), the cone back
  await disc[how]();
  await expect(disc).toHaveAttribute('data-locate', 'follow');
  await settle(page, map, 200, 185);
  expect(await asked(page)).toBe(1);
});

test('the compass refused: the copy says where to allow it once, the map keeps following with no cone; off → 追従 → off as ever', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await context.grantPermissions(['geolocation']);
  await at(page, 35.002, 139.0001);
  await fakePhone(page);
  await page.addInitScript(() => {
    const w = window as unknown as { __asked: number };
    (window.DeviceOrientationEvent as unknown as Record<string, unknown>).requestPermission = () => (w.__asked++, Promise.resolve('denied'));
  });
  const view = await openKinpu(page);
  const disc = view.locator('[data-locate]');
  await disc[how]();
  await expect(view.locator('[data-compass-denied]')).toHaveText('向きを表示するには、コンパスへのアクセスを許可してください');
  await expect(disc).toHaveAttribute('data-locate', 'follow');
  await expect(view.locator('[data-loc-dot]')).toHaveCount(1);
  await heading(page, 100);
  await expect(view.locator('[data-trail-map]')).toHaveAttribute('data-heading', '');
  await disc[how]();
  await expect(disc).toHaveAttribute('data-locate', 'off');
  await disc[how]();
  await expect(disc).toHaveAttribute('data-locate', 'follow');
  expect(await asked(page)).toBe(1); // (once a session: the refusal sticks)
});

test('the location refused: the disc grey and struck through, the maps’ one copy (where to allow it) under the save pill, not over it', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await fakePhone(page);
  await page.addInitScript(() => {
    navigator.geolocation.watchPosition = (_ok, err) => (setTimeout(() => err?.({ code: 1, message: '', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError)), 1);
  });
  const view = await openKinpu(page);
  const disc = view.locator('[data-locate]');
  await disc[how]();
  await expect(disc).toHaveAttribute('data-locate', 'denied');
  await expect(disc.locator('.slash')).toHaveCount(1);
  const slot = view.locator('[data-top-slot="loc"]');
  await expect(slot.locator('p')).toHaveText(['位置情報がオフです', '設定 › アプリ › Safari › 位置情報']);
  // (the slot under オフライン用に保存: the pill still seen and tapped)
  const [pill, card] = await Promise.all([view.locator('.offline').boundingBox(), slot.boundingBox()]);
  expect(card!.y).toBeGreaterThanOrEqual(pill!.y + pill!.height);
  expect((await slot.locator('p').nth(1).boundingBox())!.height).toBeLessThan(30); // (one line at 393 px)
});

test('hike mode: 歩きはじめる (a row under the chart, the sheet opened to it); the strip is the peek (歩いた · のこり · のぼり · 山頂到着 ごろ), fresh fixes; off the route after 3 fixes over 20 s, back on it; the wake switch; 終了 and its 取り消す', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await context.grantPermissions(['geolocation']);
  await at(page, 35.0, 139.0);
  await fakePhone(page);
  const view = await openKinpu(page, null);
  await startHike(view, how);
  const strip = view.locator('[data-hike-strip]'), map = view.locator('[data-trail-map]');
  await expect(strip.locator('dt')).toHaveText(['歩いた', 'のこり', 'のぼり', '山頂到着']);
  await expect(strip.locator('dd').first()).toHaveText('0.0km');
  await expect(strip.locator('dd').nth(3)).toHaveText(/^\d{1,2}:\d\dごろ$/);
  await expect(view.locator('[data-locate]')).toHaveAttribute('data-locate', 'follow');
  // the strip is the peek: the chart behind a tap
  await expect(view.locator('[data-elev]')).not.toBeInViewport();
  const opts = await page.evaluate(() => (window as unknown as { __geoOpts: PositionOptions[] }).__geoOpts);
  expect(opts.at(-1)!.maximumAge).toBeLessThanOrEqual(2000);

  // up the trail: walked and left move, the map's walked part with them
  await at(page, 35.004, 139.0001);
  await expect.poll(async () => Number(await map.getAttribute('data-walked'))).toBeGreaterThan(400);
  await expect(strip.locator('dd').first()).toHaveText(/^0\.[45]km$/);

  // 100 m west: 3 fixes over 20 s (the clock moved on), then the banner and the line
  for (const [i, lat] of [35.002, 35.0021, 35.0022].entries()) {
    if (i) await skew(page, 10_000);
    await at(page, lat, 138.9989);
    if (i < 2) await expect(view.locator('[data-off-route]')).toHaveCount(0);
  }
  await expect(view.locator('[data-off-route]')).toHaveText(/^ルートから(90|100|110)m外れています$/);
  await expect(map).toHaveAttribute('data-off', '1');
  await at(page, 35.0024, 139.0001);
  await expect(view.locator('[data-back-on-route]')).toHaveText('ルートに戻りました');
  await expect(map).toHaveAttribute('data-off', '0');

  // the wake switch; the system letting go (Low Power Mode) turns it off
  const wake = view.locator('[data-wake]');
  await expect(wake).toContainText('電池の減りが早くなります');
  await wake[how]();
  await expect(wake).toHaveAttribute('aria-checked', 'true');
  await page.evaluate(() => (window as unknown as { __wl: { release(): Promise<void> } }).__wl.release());
  await expect(wake).toHaveAttribute('aria-checked', 'false');

  // the chart behind a tap, 現在地 on it
  await view.locator('[data-sheet-grip]')[how]();
  await expect(view.locator('[data-elev] [data-here]')).toHaveText('現在地');
  await view.locator('[data-sheet-grip]')[how]();
  const walked = Number(await map.getAttribute('data-walked'));

  // 終了: the banner's 取り消す puts the hike back where it was matched; 終了 again, the start row back under the chart
  await view.locator('[data-hike-end]')[how]();
  await expect(strip).toHaveCount(0);
  await expect(map).toHaveAttribute('data-walked', '');
  const act = page.locator('[data-toast-act]');
  await expect(act).toHaveText('取り消す');
  await expect(act.locator('..')).toContainText('ナビを終了しました');
  await act[how]();
  await expect(strip).toBeVisible();
  // (a fresh fix of the same spot may match a few metres off: the place is the one it was, not 0)
  await expect.poll(async () => Math.abs(Number(await map.getAttribute('data-walked')) - walked)).toBeLessThan(30);
  await expect(view.locator('[data-hike-start]')).toHaveCount(0);
  await view.locator('[data-hike-end]')[how]();
  await expect(strip).toHaveCount(0);
  await view.locator('[data-sheet-grip]')[how]();
  await expect(view.locator('[data-hike-start]')).toBeVisible();
  await expect(view.locator('[data-hike-start]')).toContainText('のこり距離・到着時刻・ルート外れを表示');
});

/** The page hidden or shown as a screen lock does (visibilityState and its event). */
const shown = (page: Page, on: boolean) =>
  page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'visible' : 'hidden') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, on);

test('a screen lock mid-hike: the dot greyed till a fresh fix; the app killed and opened again: hike mode back, on the way walked; 終了 forgets it', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await context.grantPermissions(['geolocation']);
  await at(page, 35.0, 139.0);
  await fakePhone(page);
  let view = await openKinpu(page, null);
  await startHike(view, how);
  const map = () => view.locator('[data-trail-map]');
  await at(page, 35.004, 139.0001);
  await expect.poll(async () => Number(await map().getAttribute('data-walked'))).toBeGreaterThan(400);
  await expect(map()).toHaveAttribute('data-loc-stale', '0');
  await shown(page, false);
  await expect(map()).toHaveAttribute('data-loc-stale', '1');
  await shown(page, true);
  await at(page, 35.0041, 139.0001);
  await expect(map()).toHaveAttribute('data-loc-stale', '0');
  const walked = Number(await map().getAttribute('data-walked'));

  // killed (a reload), the trail opened again: in hike mode at once, from where it was; the record holds no position
  await shown(page, false);
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('island.hikeNow') ?? 'null'));
  expect(Object.keys(kept).sort()).toEqual(['d', 'dir', 'slug', 't']);
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'hiking');
  await sheet(page).locator('[data-trail="kinpu-odarumi"]').click();
  view = sheet(page).locator('[data-trail-view="kinpu-odarumi"]');
  await expect(view.locator('[data-hike-strip]')).toBeVisible();
  await expect.poll(async () => Math.abs(Number(await map().getAttribute('data-walked')) - walked)).toBeLessThan(60);
  await view.locator('[data-hike-end]')[how]();
  expect(await page.evaluate(() => localStorage.getItem('island.hikeNow'))).toBeNull();
});

test("OSM's other trails: drawn with the line key, toggled in the layers panel; the junction card for the fork ahead (names only: 44° apart), the route's way highlighted; a stale file draws no forks", async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await context.grantPermissions(['geolocation']);
  await at(page, 35.0045, 139.0001);
  await fakePhone(page);
  const view = await openKinpu(page);
  const map = view.locator('[data-trail-map]'), legend = view.locator('[data-map-layer="ref"]');
  await expect(map).toHaveAttribute('data-ref', '5');
  await expect(map).toHaveAttribute('data-forks', '2');
  await expect(view.locator('[data-legend]')).toHaveText(/^このルート\s*参考ルート$/);
  await view.locator('[data-map-layers]')[how]();
  await expect(legend).toHaveText('参考ルート');
  await legend[how]();
  await expect(view.locator('[data-legend]')).toHaveCount(0);
  await expect(map).toHaveAttribute('data-ref', '0');
  await expect(legend).toHaveAttribute('aria-pressed', 'false');
  await legend[how]();
  await expect(map).toHaveAttribute('data-ref', '5');
  await expect(view.locator('[data-osm-credit]')).toHaveText('参考ルート：© OpenStreetMap contributors');

  await startHike(view, how);
  const card = view.locator('[data-top-slot="fork"]');
  await expect(card.locator('[data-junction]')).toHaveText(/^分岐まで\d0m · ルートは地図の太線$/);
  await expect(card.locator('[data-junction-names]')).toHaveText('このルート：東峰 / 左：沢コース / 東山荘');
  await expect(card.locator('[data-junction-names] .take')).toHaveText('このルート：東峰');
  // (read aloud at 50 m steps: the screen's 10 m figure hidden from it)
  await expect(card.locator('[data-junction]')).toHaveAttribute('aria-hidden', 'true');
  await expect(card.locator('.sr-only').first()).toHaveText(/^分岐まで(50|100|150)m · ルートは地図の太線$/);
  await expect(map).toHaveAttribute('data-hl', '1');
  // the reference layer off: no card (the panel shut as the sheet rose to 歩きはじめる)
  await view.locator('[data-map-layers]')[how]();
  await legend[how]();
  await expect(card).toHaveCount(0);
  await expect(map).toHaveAttribute('data-hl', '0');
});

test('a net file built from another track: its lines drawn, no forks, no junction card', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await context.grantPermissions(['geolocation']);
  await at(page, 35.0045, 139.0001);
  await fakePhone(page);
  const view = await openKinpu(page, { ...NET, trk: '00000000' });
  const map = view.locator('[data-trail-map]');
  await expect(map).toHaveAttribute('data-ref', '5');
  await expect(map).toHaveAttribute('data-forks', '0');
  await startHike(view, how);
  await expect(view.locator('[data-hike-strip]')).toBeVisible();
  await expect.poll(async () => Number(await map.getAttribute('data-walked'))).toBeGreaterThan(400);
  await expect(view.locator('[data-top-slot="fork"]')).toHaveCount(0);
});

type TrailMapLive = { __trailMap?: { state(): { mode: string; bearing: number; cam: string; net: number; forks: number; cone: number; acc: number; attrib: string }; rotate(deg: number): void } };
const mapState = (page: Page) => page.evaluate(() => (window as unknown as TrailMapLive).__trailMap!.state());

test('drawn: the N disc only after a two-finger turn, back to north on a tap; the compass draws the cone and never turns the map; the accuracy circle; OSM drawn and credited', { tag: '@render' }, async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await page.addInitScript(() => localStorage.setItem('e2e.render', 'map'));
  await page.route(/^https:\/\/(basemap\.nationalmap\.gov|cyberjapandata\.gsi\.go\.jp)\//, (r) => r.fulfill({ contentType: 'image/png', body: TILE, headers: { 'access-control-allow-origin': '*' } }));
  await context.grantPermissions(['geolocation']);
  await at(page, 35.002, 139.0001, 25);
  await fakePhone(page);
  const view = await openKinpu(page, NET, true);
  await expect(view.locator('[data-trail-map]')).toHaveAttribute('data-mode', 'ready', { timeout: 30_000 });
  // fitted north up; OSM's trails drawn, their forks, the credit
  expect((await mapState(page)).bearing).toBe(0);
  await expect.poll(async () => (await mapState(page)).net, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect.poll(async () => (await mapState(page)).forks).toBeGreaterThan(0);
  expect((await mapState(page)).attrib).toContain('© OpenStreetMap contributors');

  const compass = view.locator('[data-compass]'), disc = view.locator('[data-locate]');
  // following with the compass: the cone and the 25 m circle drawn; heading readings never turn the map
  await disc[how]();
  await expect(disc).toHaveAttribute('data-locate', 'follow');
  for (const h of [120, 140, 160]) {
    await settle(page, view.locator('[data-trail-map]'), h, h - 15);
    expect((await mapState(page)).bearing).toBe(0);
  }
  await expect.poll(async () => (await mapState(page)).cone).toBeGreaterThan(0);
  expect((await mapState(page)).acc).toBe(25);
  expect((await mapState(page)).bearing).toBe(0);
  await expect(compass).toHaveCount(0);

  // a two-finger turn: the N disc, still following, the turn kept as more readings come
  await page.evaluate(() => (window as unknown as TrailMapLive).__trailMap!.rotate(40));
  await expect.poll(async () => (await mapState(page)).bearing).toBe(40);
  await expect(compass).toBeVisible();
  await expect(disc).toHaveAttribute('data-locate', 'follow');
  await settle(page, view.locator('[data-trail-map]'), 250, 235);
  expect((await mapState(page)).bearing).toBe(40);
  // its tap: north up, the disc gone
  await compass[how]();
  await expect.poll(async () => (await mapState(page)).bearing).toBe(0);
  await expect(compass).toHaveCount(0);
});


// ---------------------------------------------------------------- the start time (hike_start: docs/hiking.md "Start time")

/** A paired phone on `island` (the live app over the test's own relay: e2e/liveRoom.ts) at Ōno's trail, every track the
 *  fixture's, the location granted (none set yet). */
async function startPhone(browser: Browser, island: ReturnType<typeof newIsland>, who: 'A' | 'B' | 'G', how: Tap) {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', hasTouch: how === 'tap' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await island.pair(context, who);
  await context.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: TRACK }));
  await context.route('**/hiking/net/*.json', (r) => r.fulfill({ status: 404, body: '' }));
  await context.grantPermissions(['geolocation']);
  const page = await context.newPage();
  await page.goto('');
  await islandUp(page, { timeout: 20_000 });
  await fromMenu(page, 'hiking', how);
  await sheet(page).locator('[data-trail="ono-yama"]')[how]();
  const view = sheet(page).locator('[data-trail-view="ono-yama"]');
  await expect(view.locator('[data-elev]')).toBeVisible();
  // the sheet up, the plan card in it
  await view.locator('[data-sheet-grip]')[how]();
  await expect(view).toHaveAttribute('data-sheet', 'full');
  return { page, view, plan: view.locator('[data-plan]') };
}
const stops = (plan: Locator) => plan.locator('[data-stop] .time');
const ONO = ['10:00', '10:08', '10:28', '10:53', '10:59', '12:16', '13:26', '15:38'];
const ONO_1130 = ['11:30', '11:38', '11:58', '12:23', '12:29', '13:46', '14:56', '17:08'];
/** A clock's minutes ('13:46ごろ' → 826). */
const mins = (s: string | null) => {
  const m = /(\d{1,2}):(\d\d)/.exec(s ?? '')!;
  return +m[1] * 60 + +m[2];
};

test('the start time: Ōno’s moved on one phone shifts every stop, the stay and the finish (日の入り後), the other phone and hike mode’s 到着 with it; 元に戻す anywhere puts the plan back', async ({ browser }, info) => {
  const how = howOf(info.project.name), shots = info.project.name === 'webkit';
  const island = newIsland();
  const a = await startPhone(browser, island, 'A', how);
  const chip = a.plan.locator('[data-start-chip]');
  await expect(chip).toHaveText('出発 10:00');
  await expect(stops(a.plan)).toHaveText(ONO);
  await expect(a.plan.locator('[data-start-reset], [data-start-was], [data-plan-late]')).toHaveCount(0);
  if (shots) await shotOf(a, 'shot-card-before');

  // 11:30 on the picker (iOS's wheel: the input over the chip)
  await chip[how]();
  if (shots) await shot(a.page, 'shot-picker');
  await a.plan.locator('[data-start-input]').fill('11:30');
  await expect(chip).toHaveText('出発 11:30');
  await expect(stops(a.plan)).toHaveText(ONO_1130);
  await expect(a.plan.locator('.stay')).toHaveText('滞在 1時間');
  await expect(a.plan.locator('.leg').first()).toHaveText('8分');
  await expect(a.plan.locator('.meta')).toContainText('5:38');
  await expect(a.plan.locator('[data-start-was]')).toHaveText('予定 10:00 → 11:30');
  await expect(a.plan.locator('[data-plan-late]')).toHaveText('日の入り後に下山');
  if (shots) await shotOf(a, 'shot-card-changed');

  // the other phone (the guest: its rights the same) sees it
  const g = await startPhone(browser, island, 'G', how);
  await expect(g.plan.locator('[data-start-chip]')).toHaveText('出発 11:30');
  await expect(stops(g.plan)).toHaveText(ONO_1130);

  // hike mode: before a fix the plan's finish (予定), then the arrival counted from the start still ahead (the plan's
  // day, Nov 23, after the phones' pinned Nov 4)
  await a.view.locator('[data-sheet-grip]')[how]();
  await expect(a.view).toHaveAttribute('data-sheet', 'peek');
  await startHike(a.view, how);
  const arrive = a.view.locator('[data-hike-strip] dd').nth(3);
  await expect(arrive).toHaveText('17:08予定');
  await expect(a.view.locator('[data-hike-late]')).toHaveText('日の入り後に下山');
  await a.page.context().setGeolocation({ latitude: 35.0, longitude: 139.0, accuracy: 8 });
  await expect(arrive).toHaveText(/^\d{1,2}:\d\dごろ$/);
  const moved = mins(await arrive.textContent());
  expect(moved).toBeGreaterThan(11 * 60 + 30);
  expect(moved).toBeLessThanOrEqual(17 * 60 + 8);

  // 元に戻す on the guest's phone: the plan's own again on both, hike mode's arrival 90 minutes sooner
  await g.plan.locator('[data-start-reset]')[how]();
  await expect(stops(g.plan)).toHaveText(ONO);
  await expect(g.plan.locator('[data-start-chip]')).toHaveText('出発 10:00');
  await expect(g.plan.locator('[data-start-reset], [data-start-was], [data-plan-late]')).toHaveCount(0);
  await expect.poll(async () => mins(await arrive.textContent())).toBe(moved - 90);
  await a.view.locator('[data-hike-end]')[how]();
  await expect(stops(a.plan)).toHaveText(ONO);
  await expect(a.plan.locator('[data-start-reset]')).toHaveCount(0);
  for (const c of browser.contexts()) await c.close();
});

/** A shot for a person's eye (SHOTS=<dir>): the plan card at the sheet's top. */
async function shotOf(p: { page: Page; view: Locator; plan: Locator }, name: string) {
  await p.plan.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await shot(p.page, name);
}
