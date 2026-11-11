// りょこう in the specs: the trips' sheet (the menu's りょこう pill, on the demo), a trip's page in it, and the trip map
// (components/travel/map, docs/travel.md "Maps"): its hook (window.__travelMap) and OpenFreeMap answered from fixtures
// (e2e/fixtures/travel/: a trimmed TileJSON and the tiles round Motobu, z6-12), so no spec ever reaches the network. Any
// other tile is an empty 204; any other request to that origin fails the spec.
//
// To refresh the fixtures (a schema change at OpenFreeMap), from e2e/fixtures/travel/:
//   curl -s https://tiles.openfreemap.org/planet > /tmp/planet.json      # the live TileJSON; its tiles[0] is versioned
//   T=$(node -p "require('/tmp/planet.json').tiles[0]")
//   for f in tiles/*/*/*.pbf; do IFS=/ read -r _ z x y <<< "${f%.pbf}"; curl -s "$(echo $T | sed "s/{z}/$z/;s/{x}/$x/;s/{y}/$y/")" -o $f; done
//   then copy /tmp/planet.json's fields into tilejson.json, keeping its tiles as …/planet/fixture/{z}/{x}/{y}.pbf.
import { expect, type Page } from './fixtures.ts';
import { openFreeMap } from './mapTiles.ts';
import type { MapState } from '../src/lib/components/travel/map/types.ts';
import { BASE } from './island.ts';
import { fromMenu, hudMenu } from './hud.ts';

export const mapState = (page: Page) => page.evaluate(() => (window as unknown as { __travelMap: { state(): unknown } }).__travelMap.state()) as Promise<MapState>;

type TripTab = 'days' | 'map' | 'pack' | 'camps';
/** The trips' sheet. */
export const tripsSheet = (page: Page) => page.locator('dialog[open] [data-travel]');
/** From the island already up: the menu's りょこう pill: the list (or the trip on now). */
async function openTrips(page: Page) {
  // the island's first models in first: drawn (drawn(), software GL on CI) their load starved the menu's spring, and
  // its unfold timed out. (A boolean, not island.ts is3d's wait: the JSHandle a waitForFunction returns to the island's
  // hooks object kept every island alive, which leaks.spec counts.)
  await page.waitForFunction(() => {
    const w = window as unknown as { __world?: unknown; __world3d?: { loaded(): boolean } };
    return !!w.__world && (!document.querySelector('.if-scene[data-r3]') || !!w.__world3d?.loaded());
  }, null, { timeout: 30_000 });
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'travel');
  // the list, or (during a trip) that trip
  await expect(tripsSheet(page).locator('[data-trip], [data-trip-view]').first()).toBeVisible();
}
/** From the passes: `trip`'s, its page `tab` (the plan, にってい, first). */
export async function pickTrip(page: Page, trip: string, tab: TripTab = 'days') {
  const sheet = tripsSheet(page);
  await sheet.locator(`[data-trip="${trip}"]`).click();
  await expect(sheet.locator(`[data-trip-view="${trip}"]`)).toBeVisible();
  if (tab !== 'days') await sheet.locator(`[data-trip-tab="${tab}"]`).click();
  await expect(sheet.locator(`[data-pane="${tab}"]`)).toBeVisible();
}
/** From the island already up: the menu's りょこう pill, `trip`'s pass, its page `tab`. */
export async function openTrip(page: Page, trip = 'nz', tab: TripTab = 'map') {
  await openTrips(page);
  await pickTrip(page, trip, tab);
}
/** The demo on `date` (Nov 4 by default: before NZ, its days open, its map on day 1), the list; `q` more of the query (`as=B`). */
export async function gotoTrips(page: Page, date = '2026-11-04T12:00', q = '') {
  await page.goto(`${BASE}/?demo&date=${date}${q ? `&${q}` : ''}`);
  await openTrips(page);
}
/** The demo (Nov 4: before NZ), then `trip`'s page `tab`; `q` more of the query. */
export async function gotoTrip(page: Page, trip = 'nz', tab: TripTab = 'map', q = '') {
  await gotoTrips(page, undefined, q);
  await pickTrip(page, trip, tab);
}

/** OpenFreeMap from the fixtures (e2e/mapTiles.ts, every context's already), counted: the fixture tiles asked for, and
 *  the requests to it that weren't the fixture's (expected: none). */
export async function fixtureTiles(page: Page): Promise<{ tiles: string[]; stray: string[] }> {
  const tiles: string[] = [], stray: string[] = [];
  await page.route('https://tiles.openfreemap.org/**', (route) => {
    const m = /^\/planet\/fixture\/(\d+)\/(\d+)\/(\d+)\.pbf$/.exec(new URL(route.request().url()).pathname);
    if (m) tiles.push(m.slice(1).join('/'));
    const done = openFreeMap(route);
    if (done) return done;
    stray.push(route.request().url());
    return route.abort();
  });
  return { tiles, stray };
}

/** This page draws (the logic tier's `e2e.render: none` taken off: the map is made, not its stub). */
export const drawn = (page: Page) => page.addInitScript(() => localStorage.removeItem('e2e.render'));
/** Only the maps draw (`e2e.render: map`, ui-state/testMode.ts mapStub): the map made, the 3D island still in logic
 *  mode (drawn under CI's software GL it held the page's main thread past a 60 s test: csp.spec's trip map). */
export const mapsDrawn = (page: Page) => page.addInitScript(() => localStorage.setItem('e2e.render', 'map'));

export const mapReady = (page: Page) =>
  expect.poll(() => page.evaluate(() => (window as unknown as { __travelMap?: { state(): { mode: string } } }).__travelMap?.state().mode), { timeout: 30_000 }).toBe('ready');
