// Every map tile host answered locally, on every context (e2e/fixtures.ts, docs/ops/testing.md "Hermetic"): a drawn
// map (a trip's 地図, a hike's trail, a saved area) never reaches the network, whichever spec makes it. OpenFreeMap
// (the trip maps) from e2e/fixtures/travel/ (a trimmed TileJSON and the tiles round Motobu; any other tile an empty
// 204); USGS and GSI (the trail maps' raster topo) a 1 px PNG. Lowest in precedence: a spec's own route (trips.ts
// fixtureTiles, which also counts the tiles; hiking's, leaks') is asked first.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BrowserContext, Route } from './fixtures.ts';

const FIX = join(import.meta.dirname, 'fixtures', 'travel');
const CORS = { 'access-control-allow-origin': '*' };
/** a 1 px PNG: a raster tile */
const TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

/** OpenFreeMap's answer from the fixtures: the TileJSON, a fixture tile (or 204); null for any other path */
export function openFreeMap(route: Route): Promise<void> | null {
  const u = new URL(route.request().url());
  if (u.pathname === '/planet') return route.fulfill({ contentType: 'application/json', body: readFileSync(join(FIX, 'tilejson.json')), headers: CORS });
  const m = /^\/planet\/fixture\/(\d+)\/(\d+)\/(\d+)\.pbf$/.exec(u.pathname);
  if (!m) return null;
  const f = join(FIX, 'tiles', m[1], m[2], `${m[3]}.pbf`);
  return existsSync(f) ? route.fulfill({ contentType: 'application/x-protobuf', body: readFileSync(f), headers: CORS }) : route.fulfill({ status: 204, headers: CORS });
}

export async function serveMapTiles(c: BrowserContext) {
  await c.route('https://tiles.openfreemap.org/**', (route) => openFreeMap(route) ?? route.fulfill({ status: 404, headers: CORS }));
  await c.route(/^https:\/\/(basemap\.nationalmap\.gov|cyberjapandata\.gsi\.go\.jp)\//, (route) => route.fulfill({ contentType: 'image/png', body: TILE, headers: CORS }));
}
