// 地図's 保存した場所 layer (components/travel/whole, docs/places.md "Map"): the saved places (GET /places routed to
// invented ones, e2e/places.ts) within 2 km of the focused day's stops and legs, nearest first, a far one left out; the
// set follows the foot row's day; the layers panel's 保存した場所 row first (the phone's one switch, kept over a reload); a
// square's floating card (name, category, hours, 経路, ✕) closed by ✕, an empty map's tap, Esc, a pin, another day;
// offline, from the places' copy; /s (a shared trip) has no such row and never asks for /places nor loads the store.
// Okinawa (a past trip on the pinned day: it opens on day 1); the drawn test (@render) on the fixture tiles.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures.ts';
import { BASE, islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { routePlaces } from './places.ts';
import { KEY_OF } from './relay.ts';
import { routeShare, TOKEN } from './share.ts';
import { shot } from './shots.ts';
import { fixtureTiles, mapReady, mapSettled, mapsDrawn, mapState, openTrip } from './trips.ts';
import type { Place } from '../src/lib/contract/places.ts';
import { toTrack } from '../src/lib/contract/hikeTrack.ts';

test.use({ viewport: { width: 393, height: 852 } });
const howOf = (project: string) => (project.startsWith('webkit') ? 'tap' : 'click') as 'tap' | 'click';
const map = (p: Page) => p.locator('dialog[open] [data-travel-map]');
const pane = map;

const NOW_S = Date.parse('2026-11-04T12:00:00+09:00') / 1000;
const place = (id: string, name: string, lat: number, lng: number, o: Partial<Place> = {}): Place => ({
  id, name, lat, lng, addr: '沖縄県国頭郡本部町1', cat: 'カフェ', sub: '喫茶店', added: NOW_S - 9 * 86_400, hours: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ d, o: 600, c: 1200 })),
  tz: 'Asia/Tokyo', web: '', note: '', by: 0, ...o
});
// day 2 (Tsuha → Sesoko → 水納島 → Ufuya → the south): 'a' 0.7 km off its path, 'b' 75 m (so 'b' first); day 3 (the
// south's capes): 'k' by 喜屋武岬; 'far' near none
const PLACES = [
  place('a', 'ためし食堂', 26.655, 127.872, { cat: '和食・寿司', sub: '定食', hours: null }),
  place('b', 'てすと珈琲', 26.645, 127.866),
  place('k', '岬のそば', 26.08, 127.672, { cat: '麺', sub: 'そば' }),
  place('far', '遠くの店', 27.0, 128.3)
];

async function phone(page: Page, rows = PLACES) {
  await page.addInitScript((key) => (localStorage.setItem('island.key', key), localStorage.getItem('e2e.render') ?? localStorage.setItem('e2e.render', 'none')), KEY_OF.A);
  const relay = await routePlaces(page, rows);
  await page.goto(`${BASE}/?demo&date=2026-11-04T12:00`);
  await islandUp(page);
  await openTrip(page, 'okinawa', 'map');
  return relay;
}
/** The layers panel open (MapLayers), its 保存した場所 row. */
async function placesRow(page: Page, how: 'tap' | 'click') {
  const row = pane(page).locator('[data-map-layer="places"]');
  if (!(await row.count())) await pane(page).locator('[data-map-layers]')[how]();
  return row;
}
const squares = (page: Page) => pane(page).locator('[data-map-place]').evaluateAll((els) => els.map((e) => e.getAttribute('data-map-place')));

test('the places near the shown day, nearest first, the far one out; the day chip changes the set; the toggle kept over a reload', async ({ page }, info) => {
  const how = howOf(info.project.name);
  const relay = await phone(page);
  // day 1: none near (the panel holds the candidate layers alone)
  await expect(map(page)).toHaveAttribute('data-focus', '1');
  await expect(map(page)).toHaveAttribute('data-places', '0');
  await pane(page).locator('[data-map-layers]')[how]();
  await expect(pane(page).locator('[data-map-layer]')).toHaveText(['キャンプ場', '自然', '食べる']);
  // (the disc's dot: a layer on by default turned off, none yet)
  await expect(pane(page).locator('[data-map-layers] .on')).toHaveCount(0);
  await pane(page).locator('[data-map-layers]')[how]();
  await pane(page).locator('[data-map-day="2"]')[how]();
  await expect(map(page)).toHaveAttribute('data-places', '2');
  expect(await squares(page)).toEqual(['b', 'a']);
  await pane(page).locator('[data-map-day="3"]')[how]();
  await expect.poll(() => squares(page)).toEqual(['k']);
  await pane(page).locator('[data-map-day="2"]')[how]();
  // the row first, its square swatch, on by default
  const row = await placesRow(page, how);
  await expect(pane(page).locator('[data-map-layer]')).toHaveText(['保存した場所', 'キャンプ場', '自然', '食べる']);
  await expect(row.locator('.sw.sq')).toHaveCount(1);
  await shot(page, 'trip-places-layers');
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await row[how]();
  await expect(row).toHaveAttribute('aria-pressed', 'false');
  await expect(map(page)).toHaveAttribute('data-places', '0');
  await expect(pane(page).locator('[data-map-place]')).toHaveCount(0);
  await expect(pane(page).locator('[data-map-layers] .on')).toHaveCount(1);
  expect(relay.calls.length).toBeGreaterThan(0);
  await page.reload();
  await islandUp(page);
  await openTrip(page, 'okinawa', 'map');
  await pane(page).locator('[data-map-day="2"]')[how]();
  const again = await placesRow(page, how);
  await expect(again).toHaveAttribute('aria-pressed', 'false');
  await expect(map(page)).toHaveAttribute('data-places', '0');
  await again[how]();
  await expect(map(page)).toHaveAttribute('data-places', '2');
});

// One switch for every map on this phone (DECISIONS 9: DEVICE.mapPlaces, the trail map's old island.trailPlaces read
// while it's unset): the old key's off is the trip map's too; turned on here, the trail's is on; off there, off here.
test('the one switch for every map: the trail’s old key read, turned on here then off on the trail, off here too', async ({ page }, info) => {
  const how = howOf(info.project.name);
  const track = toTrack(readFileSync(join(import.meta.dirname, 'fixtures', 'hiking', 'tiny.gpx'), 'utf8'));
  await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: track }));
  await page.route('**/hiking/net/*.json', (r) => r.fulfill({ status: 404, body: '' }));
  // (the trail map's switch from before, off; and a place by Kinpu's track, 35.00–35.01 N about 139.000 E)
  await page.addInitScript(() => localStorage.getItem('island.mapPlaces') ?? localStorage.setItem('island.trailPlaces', 'false'));
  await phone(page, [...PLACES, place('t', '峠の茶屋', 35.003, 139.001)]);
  await pane(page).locator('[data-map-day="2"]')[how]();
  const row = await placesRow(page, how);
  await expect(row).toHaveAttribute('aria-pressed', 'false');
  await expect(map(page)).toHaveAttribute('data-places', '0');
  await row[how]();
  await expect(map(page)).toHaveAttribute('data-places', '2');
  // the trail's map: on too, its square in; off there
  for (let k = 0; k < 4 && (await page.locator('dialog[open]').count()); k++) await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await fromMenu(page, 'hiking', how);
  await page.locator('dialog[open] [data-trail="kinpu-odarumi"]')[how]();
  const trail = page.locator('dialog[open] [data-trail-view="kinpu-odarumi"]');
  await expect(trail.locator('[data-trail-map]')).toHaveAttribute('data-places', '1');
  await trail.locator('[data-map-layers]')[how]();
  await expect(trail.locator('[data-map-layer="places"]')).toHaveAttribute('aria-pressed', 'true');
  await trail.locator('[data-map-layer="places"]')[how]();
  await expect(trail.locator('[data-trail-map]')).toHaveAttribute('data-places', '0');
  // the trip's map (reopened on its page as it was left): off again
  for (let k = 0; k < 4 && (await page.locator('dialog[open]').count()); k++) await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await fromMenu(page, 'travel', how);
  await pane(page).locator('[data-map-day="2"]')[how]();
  await expect(await placesRow(page, how)).toHaveAttribute('aria-pressed', 'false');
  await expect(map(page)).toHaveAttribute('data-places', '0');
});

test('a square’s floating card: name, category, hours, 経路, ✕; closed by an empty map’s tap, Esc, a pin, another day, the layer off', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await phone(page);
  await pane(page).locator('[data-map-day="2"]')[how]();
  const float = pane(page).locator('[data-place-float]');
  await pane(page).locator('[data-map-place="b"]')[how]();
  const card = pane(page).locator('[data-place-float="b"]');
  await expect(card.locator('.nm')).toHaveText('てすと珈琲');
  await expect(card.locator('.ct')).toHaveText('喫茶店');
  await expect(card.locator('[data-hours]')).toHaveText('営業中 · 20:00まで');
  await expect(card.locator('[data-place-route]')).toHaveAttribute('href', /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=26\.645,127\.866$/);
  await expect(card.locator('[data-place-route]')).toHaveText('経路');
  await expect(pane(page).locator('[data-map-place="b"]')).toHaveClass(/sel/);
  // (its foot over the foot row, inside the map)
  const [cb, foot, slot] = await Promise.all([card.boundingBox(), pane(page).locator('.foot').boundingBox(), map(page).boundingBox()]);
  expect(cb!.y + cb!.height).toBeLessThanOrEqual(foot!.y);
  expect(cb!.y).toBeGreaterThanOrEqual(slot!.y);
  await shot(page, 'trip-places-stub-card');
  await card.getByRole('button', { name: '閉じる' })[how]();
  await expect(float).toHaveCount(0);
  // an empty map's tap (the stub's ground)
  await pane(page).locator('[data-map-place="a"]')[how]();
  await expect(pane(page).locator('[data-place-float="a"] [data-hours]')).toHaveText('営業時間は不明');
  const stub = pane(page).locator('[data-map-stub]');
  const sb = (await stub.boundingBox())!;
  // (right of the second row of pins and squares, over the card)
  await stub[how]({ position: { x: sb.width - 40, y: 124 } });
  await expect(float).toHaveCount(0);
  // Esc: the card, the sheet stays
  await pane(page).locator('[data-map-place="a"]')[how]();
  await page.keyboard.press('Escape');
  await expect(float).toHaveCount(0);
  await expect(pane(page)).toBeVisible();
  // a pin: the card goes, the pin selected (and a square lets the pin go)
  await pane(page).locator('[data-map-place="a"]')[how]();
  await stub.locator('[data-pin="s2-1"]')[how]();
  await expect(float).toHaveCount(0);
  await expect(map(page)).toHaveAttribute('data-selected', 's2-1');
  await pane(page).locator('[data-map-place="a"]')[how]();
  await expect(map(page)).toHaveAttribute('data-selected', '');
  // another day
  await pane(page).locator('[data-map-day="3"]')[how]();
  await expect(float).toHaveCount(0);
  await pane(page).locator('[data-map-day="2"]')[how]();
  // the layer off
  await pane(page).locator('[data-map-place="b"]')[how]();
  await (await placesRow(page, how))[how]();
  await expect(float).toHaveCount(0);
});

test('offline: the squares from the places’ copy (the relay out of reach)', async ({ page }, info) => {
  const how = howOf(info.project.name);
  const relay = await phone(page);
  await pane(page).locator('[data-map-day="2"]')[how]();
  await expect(map(page)).toHaveAttribute('data-places', '2');
  relay.down(true);
  await page.reload();
  await islandUp(page);
  await openTrip(page, 'okinawa', 'map');
  await pane(page).locator('[data-map-day="2"]')[how]();
  await expect(map(page)).toHaveAttribute('data-places', '2');
  await pane(page).locator('[data-map-place="b"]')[how]();
  await expect(pane(page).locator('[data-place-float="b"] .nm')).toHaveText('てすと珈琲');
});

test('/s: a shared trip’s map has no 保存した場所, never asks for /places, never loads the store', async ({ page }, info) => {
  const how = howOf(info.project.name);
  // (a paired phone opening a link: it could ask, so it must not)
  await page.addInitScript((key) => (localStorage.setItem('island.key', key), localStorage.setItem('e2e.render', 'none')), KEY_OF.A);
  const relay = await routePlaces(page, PLACES);
  const store: string[] = [];
  page.on('response', (r) => void (/\.js(\?|$)/.test(r.url()) && r.text().then((t) => t.includes('island-places') && store.push(r.url()), () => {})));
  await routeShare(page, () => ({ ok: true, kind: 'trip', ref: 'okinawa', exp: '2027-11-20T03:00:00.000Z', data: {} }));
  await page.goto(`s?demo&date=2026-11-04T12:00#${TOKEN}`);
  await page.locator('[data-trip-tab="map"]')[how]();
  const m = page.locator('[data-travel-map]');
  await expect(m).toHaveAttribute('data-mode', 'stub');
  await m.locator('[data-map-day="2"]')[how]();
  await m.locator('[data-map-layers]')[how]();
  await expect(m.locator('[data-map-layer]')).toHaveText(['キャンプ場', '自然', '食べる']);
  await expect(m.locator('[data-map-place]')).toHaveCount(0);
  await expect(m).toHaveAttribute('data-places', '0');
  await page.waitForLoadState('networkidle');
  expect(relay.calls).toEqual([]);
  expect(store).toEqual([]);
});

test('drawn: the squares near day 2 on the map, gone when toggled off', { tag: '@render' }, async ({ page }, info) => {
  const how = howOf(info.project.name);
  await mapsDrawn(page);
  await fixtureTiles(page);
  await phone(page);
  await mapReady(page);
  await pane(page).locator('[data-map-day="2"]')[how]();
  await mapSettled(page);
  // zoomed in on Sesoko (a day's fit is under the squares' z10): its square drawn ('a' may sit past the edge)
  const at = await page.evaluate(() => (window as unknown as { __travelMap: { px(id: string): [number, number] } }).__travelMap.px('s2-1'));
  const box = (await map(page).boundingBox())!;
  for (let k = 0; k < 2; k++) {
    await page.mouse.dblclick(box.x + at[0], box.y + at[1]);
    await mapSettled(page);
  }
  await expect.poll(async () => { const s = await mapState(page); return s.settled ? s.places : -1; }, { timeout: 15_000 }).toBeGreaterThan(0);
  await shot(page, 'trip-places-drawn');
  await (await placesRow(page, how))[how]();
  await expect.poll(async () => (await mapState(page)).places).toBe(0);
});
