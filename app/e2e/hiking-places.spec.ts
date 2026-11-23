// トレイル's 保存した場所 layer (docs/hiking.md "Saved places"), the logic tier: the saved places (GET /places routed to
// invented ones, e2e/places.ts) within 2 km of the trail's track drawn on its map (the stub's squares), nearest first;
// the layers panel's 保存した場所 row (the maps' one MapLayers, under ＋ −) toggles them, on by default, kept on this
// phone over a reload; a square's tap: the floating card (name, category, the hours line, 経路, ✕), closed by ✕, a tap
// on empty map, Esc and the sheet raised. Every trail's track is the invented fixture (tiny.gpx).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures.ts';
import { BASE, islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { shot } from './shots.ts';
import { routePlaces } from './places.ts';
import { KEY_OF } from './relay.ts';
import { toTrack } from '../src/lib/contract/hikeTrack.ts';
import type { Place } from '../src/lib/contract/places.ts';

test.use({ viewport: { width: 393, height: 852 } });
const TRACK = toTrack(readFileSync(join(import.meta.dirname, 'fixtures', 'hiking', 'tiny.gpx'), 'utf8'));
const sheet = (p: Page) => p.locator('dialog[open] [data-hiking]');
const howOf = (project: string) => (project.startsWith('webkit') ? 'tap' : 'click') as 'tap' | 'click';

const NOW_S = Date.parse('2026-11-04T12:00:00+09:00') / 1000;
const near = (id: string, name: string, lat: number, lng: number, o: Partial<Place> = {}): Place => ({
  id, name, lat, lng, addr: '神奈川県足柄下郡箱根町1', cat: '温泉', sub: '温泉', added: NOW_S - 9 * 86_400, hours: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ d, o: 600, c: 1200 })), tz: 'Asia/Tokyo', web: '', note: '', by: 0, ...o
});
// the track runs 35.000–35.010 N about 139.000 E
const PLACES = [
  near('1', 'てすと温泉', 35.003, 139.001),
  near('2', 'ためし茶屋', 35.012, 139.012, { cat: 'カフェ', sub: '喫茶店', hours: null }),
  near('3', '遠くの店', 35.1, 139.1, { cat: '麺', sub: 'ラーメン' })
];

async function openKinpu(page: Page, render: 'none' | 'map' = 'none') {
  await page.addInitScript(([key, render]) => (localStorage.setItem('e2e.render', render), localStorage.setItem('island.key', key)), [KEY_OF.A, render]);
  await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: TRACK }));
  await page.route('**/hiking/net/*.json', (r) => r.fulfill({ status: 404, body: '' }));
  await routePlaces(page, PLACES);
  await page.goto(`${BASE}/?demo&date=2026-11-04T12:00`);
  await islandUp(page);
  await fromMenu(page, 'hiking');
  await sheet(page).locator('[data-trail="kinpu-odarumi"]').click();
  const view = sheet(page).locator('[data-trail-view="kinpu-odarumi"]');
  await expect(view.locator('[data-elev]')).toBeVisible();
  return view;
}

/** The layers panel open (MapLayers), its 保存した場所 row. */
async function placesRow(view: ReturnType<Page['locator']>, how: 'tap' | 'click') {
  const row = view.locator('[data-map-layer="places"]');
  if (!(await row.count())) await view.locator('[data-map-layers]')[how]();
  return row;
}

test('saved places within 2 km of the track: the layers panel’s toggle (kept on this phone), a square’s floating card and what closes it', async ({ page }, info) => {
  const how = howOf(info.project.name);
  let view = await openKinpu(page);
  const map = () => view.locator('[data-trail-map]');
  await expect(map()).toHaveAttribute('data-places', '2');
  // (no reference trails: no line key; the panel holds the one row)
  await expect(view.locator('[data-legend]')).toHaveCount(0);
  const toggle = await placesRow(view, how);
  await expect(view.locator('[data-map-layer]')).toHaveText(['保存した場所']);
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await view.locator('[data-map-layers]')[how]();
  // a square: its card (the nearest first), ringed; ✕
  await view.locator('[data-map-place="1"]')[how]();
  const card = view.locator('[data-place-float="1"]');
  await expect(card.locator('.nm')).toHaveText('てすと温泉');
  await expect(card.locator('.ct')).toHaveText('温泉');
  await expect(card.locator('[data-hours]')).toHaveText('営業中 · 20:00まで');
  await expect(card.locator('[data-place-route]')).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=35.003,139.001');
  await shot(page, 'shot-trail-stub');
  // (its foot 8 px over the discs' stack, clear of the locate disc)
  const [cb, disc] = await Promise.all([card.boundingBox(), view.locator('[data-locate]').boundingBox()]);
  expect(cb!.y + cb!.height).toBeLessThanOrEqual(disc!.y);
  await expect(view.locator('[data-map-place="1"]')).toHaveClass(/sel/);
  await card.getByRole('button', { name: '閉じる' })[how]();
  await expect(card).toHaveCount(0);
  // a tap on empty map closes it; Esc closes it (the sheet stays); the sheet raised closes it
  const float = view.locator('[data-place-float]');
  await view.locator('[data-map-place="2"]')[how]();
  await expect(view.locator('[data-place-float="2"] [data-hours]')).toHaveText('営業時間は不明');
  // (top right of the drawing: between the save pill and ＋ −)
  const stub = view.locator('[data-map-stub]');
  await stub[how]({ position: { x: (await stub.boundingBox())!.width - 60, y: 4 } });
  await expect(float).toHaveCount(0);
  await view.locator('[data-map-place="2"]')[how]();
  await expect(float).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(float).toHaveCount(0);
  await expect(view).toHaveAttribute('data-sheet', 'peek');
  await view.locator('[data-map-place="1"]')[how]();
  await view.locator('[data-sheet-grip]')[how]();
  await expect(view).toHaveAttribute('data-sheet', 'full');
  await expect(float).toHaveCount(0);
  await view.locator('[data-sheet-grip]')[how]();
  await expect(view).toHaveAttribute('data-sheet', 'peek');
  // off: gone (the card too), and still off after a reload
  await view.locator('[data-map-place="1"]')[how]();
  await (await placesRow(view, how))[how]();
  await expect(view.locator('[data-map-layer="places"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(map()).toHaveAttribute('data-places', '0');
  await expect(float).toHaveCount(0);
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'hiking');
  await sheet(page).locator('[data-trail="kinpu-odarumi"]').click();
  view = sheet(page).locator('[data-trail-view="kinpu-odarumi"]');
  const row = await placesRow(view, how);
  await expect(row).toHaveAttribute('aria-pressed', 'false');
  await expect(map()).toHaveAttribute('data-places', '0');
  await row[how]();
  await expect(map()).toHaveAttribute('data-places', '2');
});

// drawn (MapLibre on the 1 px topo tile, e2e/mapTiles.ts): the two squares in (each category's drawn as the map first
// asks for it; zoomed out a step, the second is past the fitted track's edge), still both when the map turns (the
// in-hike map's rotation), none when toggled off
test('drawn: the squares near the track, turned with the map, toggled off', async ({ page }, info) => {
  const how = howOf(info.project.name);
  const view = await openKinpu(page, 'map');
  type St = { mode: string; settled: boolean; places: number };
  const st = () => page.evaluate(() => (window as unknown as { __trailMap?: { state(): St } }).__trailMap?.state());
  await expect.poll(async () => { const s = await st(); return s?.mode === 'ready' && s.settled; }, { timeout: 30_000 }).toBe(true);
  await view.locator('.zoom .disc').nth(1)[how]();
  await expect.poll(async () => { const s = await st(); return s?.settled && s.places; }).toBe(2);
  await page.evaluate(() => (window as unknown as { __trailMap: { rotate(deg: number): void } }).__trailMap.rotate(90));
  await expect.poll(async () => (await st())?.places).toBe(2);
  await (await placesRow(view, how))[how]();
  await expect.poll(async () => (await st())?.places).toBe(0);
});

// A drawn square tapped (MapLibre's own hit: the map's one tap router, map/gl.ts): its floating card, and over the
// square its name on a cream halo (DECISIONS 3: the trail's tag, 18236fad1). Where it is on screen: the fitted track's
// box (the hook's `box`, its north and south ends' px) gives the metres a px, the fit's centre is the track's (left and
// right pads alike, north up), so てすと温泉 (35.003 N, 139.001 E) projects from the track's ends (Mercator's x a degree
// cos(lat) of its y). The tag: the pixels above the square change once the choice is let go (the ring is the square's size).
test('drawn: a square tapped opens its card, its name tagged over it', async ({ page }, info) => {
  const how = howOf(info.project.name);
  const view = await openKinpu(page, 'map');
  type St = { mode: string; settled: boolean; places: number; box: [number, number] | null; bearing: number };
  const st = () => page.evaluate(() => (window as unknown as { __trailMap?: { state(): St } }).__trailMap?.state());
  await expect.poll(async () => { const s = await st(); return s?.mode === 'ready' && s.settled && s.places; }, { timeout: 30_000 }).toBeGreaterThan(0);
  const s = (await st())!;
  expect(s.bearing).toBe(0);
  const [top, bottom] = s.box!;
  const canvas = view.locator('.maplibregl-canvas');
  const cb = (await canvas.boundingBox())!;
  const [n, south, lonMid] = [35.01, 35.0, 139.00015];
  const perLat = (bottom - top) / (n - south), perLon = perLat * Math.cos((35.005 * Math.PI) / 180);
  const at = { x: cb.x + cb.width / 2 + (139.001 - lonMid) * perLon, y: cb.y + top + (n - 35.003) * perLat };
  if (how === 'tap') await page.touchscreen.tap(at.x, at.y);
  else await page.mouse.click(at.x, at.y);
  await expect(view.locator('[data-place-float="1"] .nm')).toHaveText('てすと温泉');
  // the map eased up if the square would sit under the card (revealAbove): at rest, the square found again from the box
  // (two reads alike: the reveal's ease may not have begun at the first)
  let last = NaN;
  await expect.poll(async () => { const t = (await st())!, same = t.settled && Math.abs(t.box![0] - last) < 0.5; last = t.box![0]; return same; }).toBe(true);
  const dy = last - top;
  const above = { x: Math.round(at.x - 40), y: Math.round(at.y + dy - 34), width: 80, height: 16 };
  const tagged = await page.screenshot({ clip: above });
  // Esc: the card and the choice gone, the map where it was: the pixels above the square no longer the tag's
  await page.keyboard.press('Escape');
  await expect(view.locator('[data-place-float]')).toHaveCount(0);
  await expect.poll(async () => (await page.screenshot({ clip: above })).equals(tagged), { timeout: 10_000 }).toBe(false);
  expect(Math.abs((await st())!.box![0] - top - dy)).toBeLessThan(1);
});
