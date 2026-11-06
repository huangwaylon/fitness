// The trip map in the specs (components/travel/map, docs/travel.md "Maps"): its hook (window.__travelMap), the dev page,
// and OpenFreeMap answered from fixtures (e2e/fixtures/travel/: a trimmed TileJSON and the tiles round Motobu, z6-12),
// so no spec ever reaches the network. Any other tile is an empty 204; any other request to that origin fails the spec.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page } from '@playwright/test';
import { BASE } from './island.ts';

const FIX = join(import.meta.dirname, 'fixtures', 'travel');

export type MapState = {
  mode: 'stub' | 'loading' | 'ready' | 'lost';
  day: number | 'all';
  selected: string | null;
  locale: 'ja' | 'en';
  stops: string[];
  candidates: string[];
  legs: number;
  layers: string[];
  loc: string;
  zoom: number | null;
  center: [number, number] | null;
};
export const mapState = (page: Page) => page.evaluate(() => (window as unknown as { __travelMap: { state(): unknown } }).__travelMap.state()) as Promise<MapState>;

/** The dev map (routes/dev/map, the sample Okinawa trip), `q` its query (`day=2`, `lang=en`…). */
export const devMap = (page: Page, q = '') => page.goto(`${BASE}/dev/map?demo${q ? `&${q}` : ''}`);

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
