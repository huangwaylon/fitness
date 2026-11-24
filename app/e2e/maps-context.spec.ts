// The maps' WebGL context lost and restored (iOS takes a background page's back): the trip map keeps the view the
// user panned to, 保存した場所 draws a search made while it was lost, the trail draws its track again at the zoom it had.
// No error on the page. The maps drawn (e2e.render: map), the island not; the fixture tiles (e2e/trips.ts), routed
// relay places (e2e/places.ts), Kinpu's invented track. Taps in WebKit, clicks in Chromium. (Track A's repro, kept.)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures.ts';
import { fixtureTiles, gotoTrip, mapReady, mapSettled, mapState, mapsDrawn } from './trips.ts';
import { BASE, islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { manyPlaces, routePlaces } from './places.ts';
import { KEY_OF } from './relay.ts';
import { toTrack } from '../src/lib/contract/hikeTrack.ts';

test.use({ viewport: { width: 393, height: 852 } });
const howOf = (project: string) => (project.startsWith('webkit') ? 'tap' : 'click') as 'tap' | 'click';

/** The open sheet's map loses its context (or gets it back): resolved on the canvas's own event. */
const ctx = (page: Page, how: 'lose' | 'restore') => page.evaluate((how) => new Promise<void>((res) => {
  const w = window as unknown as { __ext?: WEBGL_lose_context };
  const cv = document.querySelector('dialog[open] .maplibregl-canvas') as HTMLCanvasElement;
  if (!w.__ext) w.__ext = ((cv.getContext('webgl2') ?? cv.getContext('webgl')) as WebGLRenderingContext).getExtension('WEBGL_lose_context')!;
  cv.addEventListener(how === 'lose' ? 'webglcontextlost' : 'webglcontextrestored', () => res(), { once: true });
  if (how === 'lose') w.__ext.loseContext();
  else w.__ext.restoreContext();
}), how);
const errorsOf = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};

test('trip: a context lost and restored keeps the view the user panned to', async ({ page }) => {
  const errors = errorsOf(page);
  await mapsDrawn(page);
  await fixtureTiles(page);
  await gotoTrip(page, 'nz');
  await mapReady(page);
  await mapSettled(page);
  const c1 = (await mapState(page)).center!;
  const b = (await page.locator('dialog[open] .maplibregl-canvas').boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  for (let k = 1; k <= 12; k++) await page.mouse.move(b.x + b.width / 2 - k * 12, b.y + b.height / 2 - k * 6, { steps: 3 });
  await page.mouse.up();
  await mapSettled(page);
  const c2 = (await mapState(page)).center!;
  expect(Math.abs(c2[0] - c1[0])).toBeGreaterThan(0.005);
  await ctx(page, 'lose');
  await ctx(page, 'restore');
  await mapReady(page);
  await mapSettled(page);
  const c3 = (await mapState(page)).center!;
  expect(Math.abs(c3[0] - c2[0]) + Math.abs(c3[1] - c2[1])).toBeLessThan(0.002);
  expect(errors).toEqual([]);
});

test('保存した場所: a search while the context is lost, then restored: no error, the new matches drawn', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  const errors = errorsOf(page);
  await mapsDrawn(page);
  await fixtureTiles(page);
  await newRecord().pair(context, 'A');
  await routePlaces(page, manyPlaces(400));
  await page.goto('');
  await islandUp(page);
  await fromMenu(page, 'places', how);
  type St = { mode: string; settled: boolean; features: number };
  const st = () => page.evaluate(() => (window as unknown as { __placesMap?: { state(): St } }).__placesMap?.state() ?? null);
  const ready = () => expect.poll(async () => ((s) => s?.mode === 'ready' && s.settled)(await st()), { timeout: 30_000 }).toBe(true);
  await ready();
  expect((await st())!.features).toBe(400);
  await ctx(page, 'lose');
  await page.locator('dialog[open] [data-places] [data-places-q]').fill('テスト12');
  const all = page.locator('dialog[open] [data-places-scope="all"]');
  await expect(all).toHaveText(/^全体 \d+件$/);
  const n = Number(/(\d+)/.exec((await all.textContent()) ?? '')![1]);
  expect(n).toBeLessThan(400);
  await ctx(page, 'restore');
  await ready();
  expect((await st())!.features).toBe(n);
  expect(errors).toEqual([]);
});

test('trail: a context lost and restored: the track drawn again, the zoom kept', async ({ page }, info) => {
  const how = howOf(info.project.name);
  const errors = errorsOf(page);
  const TRACK = toTrack(readFileSync(join(import.meta.dirname, 'fixtures', 'hiking', 'tiny.gpx'), 'utf8'));
  await page.addInitScript((key) => (localStorage.setItem('e2e.render', 'map'), localStorage.setItem('island.key', key)), KEY_OF.A);
  await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: TRACK }));
  await page.route('**/hiking/net/*.json', (r) => r.fulfill({ status: 404, body: '' }));
  await routePlaces(page, []);
  await page.goto(`${BASE}/?demo&date=2026-11-04T12:00`);
  await islandUp(page);
  await fromMenu(page, 'hiking', how);
  const sheet = page.locator('dialog[open] [data-hiking]');
  await sheet.locator('[data-trail="kinpu-odarumi"]')[how]();
  const view = sheet.locator('[data-trail-view="kinpu-odarumi"]');
  type St = { mode: string; settled: boolean; track: number; z: number };
  const st = () => page.evaluate(() => (window as unknown as { __trailMap?: { state(): St } }).__trailMap?.state());
  const ready = () => expect.poll(async () => ((s) => s?.mode === 'ready' && s.settled)(await st()), { timeout: 30_000 }).toBe(true);
  await ready();
  const z0 = (await st())!.z;
  // a double tap (no ＋ −: MapLibre's own double-tap zoom, a step in about the finger)
  const c = (await view.locator('[data-trail-map] canvas').boundingBox())!;
  const [x, y] = [c.x + c.width / 2, c.y + c.height * 0.4];
  if (how === 'tap') for (let i = 0; i < 2; i++) await page.touchscreen.tap(x, y);
  else await page.mouse.dblclick(x, y);
  await expect.poll(async () => ((s) => !!s && s.settled && Math.abs(s.z - z0 - 1) < 0.01)(await st()), { timeout: 10_000 }).toBe(true);
  const s0 = (await st())!;
  await ctx(page, 'lose');
  await ctx(page, 'restore');
  await ready();
  // (the track's line drawn again a frame or so after the map is at rest)
  await expect.poll(async () => (await st())?.track ?? 0, { timeout: 10_000 }).toBeGreaterThan(0);
  const s1 = (await st())!;
  expect(s1.z).toBeCloseTo(s0.z, 2);
  expect(errors).toEqual([]);
});
