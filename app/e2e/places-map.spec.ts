// 保存した場所's map drawn (docs/places.md "Map"; places.spec.ts has the logic tier's stub): MapLibre on the fixture
// tiles (e2e/mapTiles.ts), a paired phone, invented places (e2e/places.ts). The matches clustered at the opening view;
// a cluster's tap zooms in to where it splits; a row's flight draws the badges (each drawn as the map first asks for
// it) and the chosen one's ring; the view kept over a reopen. Taps in WebKit, clicks in Chromium.
import { expect, test, type BrowserContext, type Page, type Route } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { manyPlaces, routePlaces } from './places.ts';
import { fixtureTiles, mapsDrawn } from './trips.ts';

test.use({ viewport: { width: 393, height: 852 } });
type St = { mode: string; settled: boolean; clusters: number; badges: number; ring: number; loc: number; cluster: [number, number] | null; z: number; features: number };
const st = (p: Page) => p.evaluate(() => (window as unknown as { __placesMap?: { state(): St } }).__placesMap?.state() ?? null);
const view = (p: Page) => p.locator('dialog[open] [data-places]');
const settled = (p: Page) => expect.poll(async () => ((s) => s?.mode === 'ready' && s.settled)(await st(p)), { timeout: 30_000 }).toBe(true);

test('drawn: the matches clustered, a cluster’s tap zooms in, a row’s flight draws the badges and the ring, the view kept', async ({ page, context }, info) => {
  const how = info.project.name.startsWith('webkit') ? 'tap' : 'click';
  await mapsDrawn(page);
  await fixtureTiles(page);
  await newRecord().pair(context, 'A');
  await routePlaces(page, manyPlaces(400));
  await page.goto('');
  await islandUp(page);
  await fromMenu(page, 'places', how);
  await settled(page);
  const s0 = (await st(page))!;
  expect(s0).toMatchObject({ mode: 'ready', features: 400, badges: 0, ring: 0 });
  expect(s0.clusters).toBeGreaterThan(0);
  // a cluster's tap: in to where it splits
  const box = (await page.locator('dialog[open] .maplibregl-canvas').boundingBox())!;
  const [x, y] = s0.cluster!;
  if (how === 'tap') await page.touchscreen.tap(box.x + x, box.y + y);
  else await page.mouse.click(box.x + x, box.y + y);
  await expect.poll(async () => (await st(page))!.z, { timeout: 10_000 }).toBeGreaterThan(s0.z + 0.5);
  await settled(page);
  // a row: flown to (z15 at least), the badges drawn, the chosen one ringed
  await view(page).locator('[data-places-q]').fill('テスト12');
  await view(page).locator('[data-place-row]').first()[how]();
  await expect(view(page).locator('[data-place-card]')).toBeVisible();
  await expect.poll(async () => { const s = (await st(page))!; return s.settled && s.z >= 15 && s.ring === 1 && s.badges > 0; }, { timeout: 15_000 }).toBe(true);
  const z1 = (await st(page))!.z;
  // the view kept on this phone (written a moment after the map stops), and the map opens on it again
  await expect.poll(() => page.evaluate(() => (JSON.parse(localStorage.getItem('island.placesCam') ?? 'null') as { zoom: number } | null)?.zoom)).toBeGreaterThanOrEqual(15);
  for (let k = 0; k < 4 && (await page.locator('dialog[open]').count()); k++) await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await fromMenu(page, 'places', how);
  await settled(page);
  expect(Math.abs((await st(page))!.z - z1)).toBeLessThan(0.2);
});

test('drawn, a fresh phone: the map opens about the places (none kept, far from Tokyo); my location a sky dot, the disc a sky icon (no fill: following is the trail’s)', async ({ page, context }, info) => {
  const how = info.project.name.startsWith('webkit') ? 'tap' : 'click';
  await mapsDrawn(page);
  await fixtureTiles(page);
  await newRecord().pair(context, 'A');
  // (Motobu, the fixture tiles' town: a first open before the list was in fell back to Tokyo, この範囲 0)
  await routePlaces(page, manyPlaces(40).map((p, k) => ({ ...p, lat: 26.66 + (k % 8) * 0.01, lng: 127.86 + Math.floor(k / 8) * 0.01 })));
  await page.goto('');
  await islandUp(page);
  await fromMenu(page, 'places', how);
  await settled(page);
  await expect(view(page).locator('[data-places-meta]')).not.toContainText('この範囲');
  await expect(view(page).locator('[data-places-none-here]')).toHaveCount(0);
  expect((await st(page))!.z).toBeGreaterThan(11);
  // the location on: a sky icon on the card, the dot drawn
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 26.69, longitude: 127.88, accuracy: 40 });
  const disc = view(page).locator('.locate');
  await disc[how]();
  await expect(disc).toHaveAttribute('data-locate', 'on');
  await expect(disc).not.toHaveClass(/\bon\b/);
  await expect.poll(async () => (await st(page))!.loc, { timeout: 10_000 }).toBe(1);
  // the trail's disc: 56 px drawn in a 64 hit
  const box = (await disc.boundingBox())!;
  expect([box.width, box.height]).toEqual([64, 64]);
  expect(await disc.evaluate((b) => ((s) => [s.top, s.left])(getComputedStyle(b, '::before')))).toEqual(['4px', '4px']);
});

/** A paired phone, the maps drawn, the fixture tiles, invented places about Motobu (the tiles' town): the island up. */
async function motobu(page: Page, context: BrowserContext) {
  await mapsDrawn(page);
  await fixtureTiles(page);
  await newRecord().pair(context, 'A');
  await routePlaces(page, manyPlaces(16).map((p, k) => ({ ...p, lat: 26.66 + (k % 8) * 0.01, lng: 127.86 + Math.floor(k / 8) * 0.01 })));
  await page.goto('');
  await islandUp(page);
}

// The maps' one status rule (MapStatus, DECISIONS 5): no tile 2 s in, 「地図を読み込み中…」 under the bar's controls,
// gone with the first; the credit's pill (DECISIONS 4) over the peek, hidden while the sheet is at full.
test('drawn: no tile yet, 「地図を読み込み中…」, gone with the first tile; the credit hidden at the full sheet', async ({ page, context }, info) => {
  const how = info.project.name.startsWith('webkit') ? 'tap' : 'click';
  await motobu(page, context);
  // (the tiles held: asked before fixtureTiles' route, page.route's latest first)
  const TILES = /^https:\/\/tiles\.openfreemap\.org\/planet\/fixture\//;
  const held: Route[] = [];
  await page.route(TILES, (r) => void held.push(r));
  await fromMenu(page, 'places', how);
  const note = view(page).locator('[data-map-note]');
  await expect(note).toHaveAttribute('data-map-note', 'loading', { timeout: 15_000 });
  await expect(note).toHaveText('地図を読み込み中…');
  const [n, zoom] = await Promise.all([note.boundingBox(), view(page).locator('.zoom').boundingBox()]);
  expect(n!.y).toBeGreaterThanOrEqual(zoom!.y + zoom!.height);
  await page.unroute(TILES);
  await Promise.all(held.splice(0).map((r) => r.fallback()));
  await settled(page);
  await expect(note).toHaveCount(0);
  const credit = view(page).locator('.maplibregl-ctrl-bottom-left');
  await expect(credit.locator('.maplibregl-ctrl-attrib')).toContainText('OpenStreetMap');
  await expect(credit).toBeVisible();
  await view(page).locator('[data-sheet-grip]')[how]();
  await expect(view(page)).toHaveAttribute('data-sheet', 'full');
  await expect(credit).toBeHidden();
  await view(page).locator('[data-sheet-grip]')[how]();
  await expect(view(page)).toHaveAttribute('data-sheet', 'peek');
  await expect(credit).toBeVisible();
});

// Failed while offline (no service worker here: MapLibre's chunk in no cache, map/cached.ts): the places rule, a note
// and no もう一度 panel (DECISIONS 5); back online, drawn by itself.
// Failed while offline (no service worker here: MapLibre's chunk in no cache, map/cached.ts, so offline the map isn't
// tried): the places rule, a note and no もう一度 panel (DECISIONS 5); back online, drawn by itself. (The sheet's own
// chunk needs a first opening online: offline before it, the pill says so, as りょこう's.)
test('drawn, offline with the engine in no cache: the places note, no failed panel; back online drawn by itself', async ({ page, context }, info) => {
  const how = info.project.name.startsWith('webkit') ? 'tap' : 'click';
  await motobu(page, context);
  await fromMenu(page, 'places', how);
  await settled(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await context.setOffline(true);
  await fromMenu(page, 'places', how);
  const map = view(page).locator('[data-places-map]');
  await expect(map).toHaveAttribute('data-mode', 'failed');
  await expect(view(page).locator('[data-map-note="offline"]')).toHaveText('地図はオフラインです（場所のみ表示）');
  await expect(view(page).locator('[data-map-failed]')).toHaveCount(0);
  await context.setOffline(false);
  await settled(page);
  await expect(view(page).locator('[data-map-note]')).toHaveCount(0);
});
