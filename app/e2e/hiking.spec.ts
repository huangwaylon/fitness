// トレイル (components/hiking, docs/hiking.md), the logic tier: under drawOff() the trail's map is a stub that draws the
// track and the scrub's dot as SVG (no MapLibre, no tiles: nothing leaves the preview). Every trail's track is the
// invented fixture (e2e/fixtures/hiking/tiny.gpx, converted here by the app's own converter): the list, its chips, a
// trail's peek and sheet, the elevation scrub moving the map's dot, Kinpu's plan, ‹ and ✕; the track on every trail
// opened again. The drawn smoke (@render): MapLibre on a blank topo tile (never the network), the track drawn on each
// trail opened, not just the first (the map's chunk in before the track: 2026-11-07).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures.ts';
import { BASE, islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { drawn } from './trips.ts';
import { toTrack } from '../src/lib/contract/hikeTrack.ts';

test.use({ viewport: { width: 393, height: 852 } });

const TRACK = toTrack(readFileSync(join(import.meta.dirname, 'fixtures', 'hiking', 'tiny.gpx'), 'utf8'));
const sheet = (p: Page) => p.locator('dialog[open] [data-hiking]');
const cards = (p: Page) => sheet(p).locator('[data-trail]');

async function openTrails(page: Page, draw = false) {
  if (!draw) await page.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: TRACK }));
  await page.goto(`${BASE}/?demo&date=2026-11-04T12:00`);
  // (the island up first, as after any goto: drawn, the menu unfolded while the island was still mounting never had
  // its pills in place)
  await islandUp(page);
  await fromMenu(page, 'hiking');
  await expect(cards(page)).toHaveCount(13);
}

test('the list: 予定 (a photo card), 行きたい and 歩いた (rows); the region and level chips, the sort sheet; a row opens its trail, ‹ back, ✕ closes', async ({ page }) => {
  await openTrails(page);
  const list = sheet(page).locator('[data-trail-list]');
  const order = () => cards(page).evaluateAll((xs) => xs.map((x) => x.getAttribute('data-trail')));
  await expect(list.locator('.ttl')).toHaveText('梅ちゃんのトレイル');
  // Nov 4: Akigawa's plan is to come; Akagi (walked Nov 7: its record), Utsukushigahara and Kinpu (its plan gone) walked
  await expect(list.locator('[data-section]')).toHaveText(['予定1', '行きたい9', '歩いた3']);
  await expect(cards(page).first()).toHaveAttribute('data-trail', 'akigawa-shiroyama');
  expect((await order()).slice(-3)).toEqual(['akagi-kurobi', 'utsukushigahara', 'kinpu-odarumi']);
  const lake = sheet(page).locator('[data-trail="lake-22"]');
  await expect(lake.locator('.fig')).toHaveText('9.8 km · 444 m · 約3時間15分');
  await expect(sheet(page).locator('[data-trail="akagi-kurobi"] .sub')).toHaveText('2026年11月7日（土）');

  await list.locator('[data-region="jp"]').click();
  await expect(cards(page)).toHaveCount(5);
  await list.locator('[data-filter="hard"]').click();
  await expect(list.locator('[data-filter="hard"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(cards(page)).toHaveCount(1); // 富士山
  await list.locator('[data-filter="moderate"]').click(); // any of the levels
  await expect(cards(page)).toHaveCount(5);
  await list.locator('[data-region="us"]').click();
  await list.locator('[data-filter="moderate"]').click();
  await list.locator('[data-filter="veryhard"]').click();
  await expect(cards(page)).toHaveCount(4);
  // すべて clears the region and the levels
  await expect(list.locator('[data-region="all"]')).toHaveAttribute('aria-pressed', 'false');
  await list.locator('[data-region="all"]').click();
  await expect(list.locator('[data-region="all"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(cards(page)).toHaveCount(13);

  await list.locator('[data-sort]').click();
  await page.locator('dialog[open] [data-sort-dist]').click();
  await expect(list.locator('[data-sort]')).toHaveText('距離が短い順');
  const want = list.locator('[data-trail]:not(.card)');
  expect((await order())[1]).toBe('talapus-lake'); // 行きたい's shortest
  await expect(want.nth(9)).toHaveAttribute('data-trail', 'akagi-kurobi'); // 歩いた's shortest
  await list.locator('[data-sort]').click();
  await page.locator('dialog[open] [data-sort-auto]').click();
  await expect(list.locator('[data-sort]')).toHaveText('おすすめ順');
  expect((await order())[1]).toBe('lake-22');

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
  await expect(plan.locator('[data-plan-actual]')).toHaveText('実際'); // its figures the hike's, not the trail's
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
  await drawn(page);
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
