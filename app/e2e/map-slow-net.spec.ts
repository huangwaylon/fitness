// The maps on a slow network (docs/ops/testing.md "Hermetic": route mocks, no timing): what the phone already holds
// shows before the network answers. 保存した場所: relaunched with its list's copy on the phone and the relay's answer
// held, the list, the map's clusters and a row's card all there (the photo links held too); the basemap's
// TileJSON and tiles held, the clusters still drawn. A trail: its topo tiles and the places' answer held, the route and
// the saved places near it (the copy) drawn. A trip's map: OpenFreeMap held, its pins and the day's route drawn. Then
// let go, each map takes the network's answer (the tiles in: no 「地図を読み込み中…」 left), and once at rest draws
// nothing (WebGL draw calls counted: no frame loop while the map is still). WebKit with taps and Chromium.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page, type Route } from './fixtures.ts';
import { BASE, islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { manyPlaces, routePlaces } from './places.ts';
import { fixtureTiles, mapsDrawn, openTrip } from './trips.ts';
import { KEY_OF } from './relay.ts';
import { countDraws, still } from './slownet.ts';
import { toTrack } from '../src/lib/contract/hikeTrack.ts';

test.use({ viewport: { width: 393, height: 852 } });
const howOf = (name: string) => (name.startsWith('webkit') ? 'tap' : 'click') as 'tap' | 'click';
type St = Record<string, unknown>;
const st = (page: Page, hook: string) => page.evaluate((h) => (window as unknown as Record<string, { state(): St } | undefined>)[h]?.state() ?? {}, hook);
/** A hook's state, polled till `f` holds (a drawn map's worker and first frame: up to 30 s on CI's software GL). */
const until = (page: Page, hook: string, f: (s: St) => boolean) => expect.poll(async () => f(await st(page, hook)), { timeout: 30_000 }).toBe(true);

/** Requests matching `url` held unanswered (asked first: registered after the spec's own routes) till `release()`,
 *  which lets them go on to those routes. */
async function hold(page: Page, url: string | RegExp) {
  const held: Route[] = [];
  let on = true;
  await page.route(url, (r) => (on ? void held.push(r) : r.fallback()));
  return {
    count: () => held.length,
    release: async () => ((on = false), await Promise.all(held.splice(0).map((r) => r.fallback().catch(() => {}))))
  };
}

test('保存した場所 relaunched, the relay, the photo links and the basemap held: the list, the clusters and a card from the copy', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await countDraws(page);
  await mapsDrawn(page);
  await fixtureTiles(page);
  await newRecord().pair(context, 'A');
  const rows = manyPlaces(300).map((p) => ({ ...p, lat: 26.6 + (p.lat - 35.5) / 2, lng: 127.8 + (p.lng - 139.4) / 3 }));
  const relay = await routePlaces(page, rows);
  await page.addInitScript(() => localStorage.setItem('island.placesCam', JSON.stringify({ center: [127.9, 26.7], zoom: 10 })));
  await page.goto('');
  await islandUp(page);
  // the first opening: the list fetched and kept on the phone
  await fromMenu(page, 'places', how);
  await expect(page.locator('dialog[open] [data-places-meta]')).toContainText('300件');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // relaunched with the network stalled: the relay, the details, the TileJSON and its tiles never answered
  const held = await Promise.all([hold(page, /\/places(\?|$)/), hold(page, /\/places\/pics/), hold(page, /^https:\/\/tiles\.openfreemap\.org\//)]);
  await page.reload();
  await islandUp(page);
  const asked = relay.calls.length;
  await fromMenu(page, 'places', how);
  const view = page.locator('dialog[open] [data-places]');
  await expect(view.locator('[data-places-meta]')).toContainText('300件');
  await expect(view.locator('[data-place-row]').first()).toBeVisible();
  await until(page, '__placesMap', (s) => s.mode === 'ready' && Number(s.clusters) > 0);
  expect([held[0].count(), held[2].count()], 'the relay and the TileJSON asked for (held)').toEqual([1, 1]);
  // a row's card: its name and hours line from the copy, the photo links still held
  await view.locator('[data-places-q]').fill('テスト12');
  await view.locator('[data-place-row]').first()[how]();
  await expect(view.locator('[data-place-card] .name')).toHaveText(/^テスト12/);
  // let go: the relay's answer in (no new fetch asked for it), the basemap's tiles drawn
  await Promise.all(held.map((h) => h.release()));
  await expect.poll(() => relay.calls.length).toBeGreaterThan(asked);
  await until(page, '__placesMap', (s) => s.mode === 'ready' && !!s.settled);
  await expect(page.locator('dialog[open] [data-map-note="loading"]')).toHaveCount(0);
  await still(page);
});

const TRACK = toTrack(readFileSync(join(import.meta.dirname, 'fixtures', 'hiking', 'tiny.gpx'), 'utf8'));
const NOW_S = Date.parse('2026-11-04T12:00:00+09:00') / 1000;
// (tiny.gpx runs 35.000–35.010 N about 139.000 E)
const NEAR = manyPlaces(3).map((p, k) => ({ ...p, lat: 35.002 + k * 0.003, lng: 139.001, added: NOW_S - 86_400 }));

test('a trail relaunched, its topo tiles and the relay held: the route and the saved places near it (the copy) drawn', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await countDraws(page);
  await page.addInitScript((key) => (localStorage.setItem('e2e.render', 'map'), localStorage.setItem('island.key', key)), KEY_OF.A);
  await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: TRACK }));
  await page.route('**/hiking/net/*.json', (r) => r.fulfill({ status: 404, body: '' }));
  await routePlaces(page, NEAR);
  const open = async () => {
    await fromMenu(page, 'hiking', how);
    await page.locator('dialog[open] [data-trail="kinpu-odarumi"]')[how]();
    await expect(page.locator('dialog[open] [data-trail-view="kinpu-odarumi"] [data-elev]')).toBeVisible();
  };
  await page.goto(`${BASE}/?demo&date=2026-11-04T12:00`);
  await islandUp(page);
  await open();
  await expect(page.locator('dialog[open] [data-trail-map]')).toHaveAttribute('data-places', '3');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  const held = await Promise.all([hold(page, /\/places(\?|$)/), hold(page, /^https:\/\/(basemap\.nationalmap\.gov|cyberjapandata\.gsi\.go\.jp)\//)]);
  await page.reload();
  await islandUp(page);
  await open();
  await until(page, '__trailMap', (s) => s.mode === 'ready' || Number(s.track) > 0);
  await until(page, '__trailMap', (s) => Number(s.track) > 0 && Number(s.places) > 0);
  await expect(page.locator('dialog[open] [data-trail-map]')).toHaveAttribute('data-places', '3');
  expect(held[1].count(), 'the topo tiles asked for (held)').toBeGreaterThan(0);
  await Promise.all(held.map((h) => h.release()));
  await until(page, '__trailMap', (s) => !!s.settled);
  await still(page);
});

test('a trip’s map, OpenFreeMap held (the TileJSON and its tiles): the day’s pins and route drawn; let go, its tiles', async ({ page }) => {
  await countDraws(page);
  await mapsDrawn(page);
  await fixtureTiles(page);
  const held = await hold(page, /^https:\/\/tiles\.openfreemap\.org\//);
  await page.goto(`${BASE}/?demo&date=2026-11-04T12:00`);
  await islandUp(page);
  await openTrip(page, 'nz', 'map');
  await until(page, '__travelMap', (s) => s.mode === 'ready' && Number(s.legs) > 0);
  await expect(page.locator('dialog[open] [data-map-pane] .maplibregl-marker').first()).toBeVisible();
  expect(held.count(), 'OpenFreeMap asked for (held)').toBeGreaterThan(0);
  await held.release();
  await until(page, '__travelMap', (s) => !!s.settled);
  await expect(page.locator('dialog[open] [data-map-note="loading"]')).toHaveCount(0);
  await still(page);
});
