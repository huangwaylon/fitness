// The trip map in the specs (components/travel/map, docs/travel.md "Maps"): its hook (window.__travelMap), a trip's page
// in the trips' sheet (the menu's りょこう pill, on the demo), and OpenFreeMap answered from fixtures
// (e2e/fixtures/travel/: a trimmed TileJSON and the tiles round Motobu, z6-12), so no spec ever reaches the network. Any
// other tile is an empty 204; any other request to that origin fails the spec.
//
// To refresh the fixtures (a schema change at OpenFreeMap), from e2e/fixtures/travel/:
//   curl -s https://tiles.openfreemap.org/planet > /tmp/planet.json      # the live TileJSON; its tiles[0] is versioned
//   T=$(node -p "require('/tmp/planet.json').tiles[0]")
//   for f in tiles/*/*/*.pbf; do IFS=/ read -r _ z x y <<< "${f%.pbf}"; curl -s "$(echo $T | sed "s/{z}/$z/;s/{x}/$x/;s/{y}/$y/")" -o $f; done
//   then copy /tmp/planet.json's fields into tilejson.json, keeping its tiles as …/planet/fixture/{z}/{x}/{y}.pbf.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';
import type { MapState } from '../src/lib/components/travel/map/types.ts';
import { BASE } from './island.ts';
import { fromMenu, hudMenu } from './hud.ts';

const FIX = join(import.meta.dirname, 'fixtures', 'travel');

export const mapState = (page: Page) => page.evaluate(() => (window as unknown as { __travelMap: { state(): unknown } }).__travelMap.state()) as Promise<MapState>;

export type TripTab = 'days' | 'map' | 'pack' | 'camps';
/** From the island already up: the menu's りょこう pill, `trip`'s pass, its page `tab`. */
export async function openTrip(page: Page, trip = 'okinawa', tab: TripTab = 'map') {
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'travel');
  const sheet = page.locator('dialog[open] [data-travel]');
  await sheet.locator(`[data-trip="${trip}"]`).click();
  await expect(sheet.locator(`[data-trip-view="${trip}"]`)).toBeVisible();
  if (tab !== 'days') await sheet.locator(`[data-trip-tab="${tab}"]`).click();
  await expect(sheet.locator(`[data-pane="${tab}"]`)).toBeVisible();
}
/** The demo (Nov 4: every Okinawa page opens on day 1), then `trip`'s page `tab`; `q` more of the query (`as=B`). */
export async function gotoTrip(page: Page, trip = 'okinawa', tab: TripTab = 'map', q = '') {
  await page.goto(`${BASE}/?demo&date=2026-11-04T12:00&critter=none&visitor=none${q ? `&${q}` : ''}`);
  await openTrip(page, trip, tab);
}

/** OpenFreeMap from the fixtures; returns the requests to it that weren't the fixture's (expected: none). */
export async function fixtureTiles(page: Page): Promise<{ tiles: string[]; stray: string[] }> {
  const tiles: string[] = [], stray: string[] = [];
  await page.route('https://tiles.openfreemap.org/**', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/planet') return route.fulfill({ contentType: 'application/json', body: readFileSync(join(FIX, 'tilejson.json')), headers: { 'access-control-allow-origin': '*' } });
    const m = /^\/planet\/fixture\/(\d+)\/(\d+)\/(\d+)\.pbf$/.exec(u.pathname);
    if (m) {
      tiles.push(m.slice(1).join('/'));
      const f = join(FIX, 'tiles', m[1], m[2], `${m[3]}.pbf`);
      return existsSync(f)
        ? route.fulfill({ contentType: 'application/x-protobuf', body: readFileSync(f), headers: { 'access-control-allow-origin': '*' } })
        : route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    }
    stray.push(u.href);
    return route.abort();
  });
  return { tiles, stray };
}

/** This page draws (the logic tier's `e2e.render: none` taken off: the map is made, not its stub). */
export const drawn = (page: Page) => page.addInitScript(() => localStorage.removeItem('e2e.render'));

export const mapReady = (page: Page) =>
  expect.poll(() => page.evaluate(() => (window as unknown as { __travelMap?: { state(): { mode: string } } }).__travelMap?.state().mode), { timeout: 30_000 }).toBe('ready');
