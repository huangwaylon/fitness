// 地図, the trip's whole-trip map (components/travel/whole: AllDaysMap, docs/travel.md "Maps"; NZ on the demo, Okinawa
// with its candidate layers and campsites). The logic tier (the gate): under drawOff() no map is made, the stub's dots
// are buttons and its state the hook's (window.__travelMap); the tab around it is the real one: the foot row's days
// (全体 · ● 11 · ● 12 …) focus a day, a stop tapped shows its card (日程で見る hands it to the list, ✕ closes), 地図で見る
// from the list rings it, a trip with no map says so in the same tab shape, the candidate layers, the locate button.
// Drawn (@render): MapLibre on the fixture tiles (never the network): a day focused fits its route, a stop tapped is
// ringed with the zoom kept, the map survives a tab switch (one map, idle while hidden); offline, the route alone with
// a note; no tile yet, 「地図を読み込み中…」. Its context let go of on close: leaks.spec.
import { expect, test, type Page, type Route } from './fixtures.ts';
import { drawn, fixtureTiles, gotoTrip, mapReady, mapSettled, mapState, mapsDrawn } from './trips.ts';
import { nz } from '../src/lib/travel/trips/nz.ts';
import { okinawa } from '../src/lib/travel/trips/okinawa.ts';

test.use({ viewport: { width: 393, height: 852 } });
// the stub unless a test draws (drawn(page) takes it off again)
test.beforeEach(({ page }) => page.addInitScript(() => localStorage.setItem('e2e.render', 'none')));

const map = (p: Page) => p.locator('dialog[open] [data-travel-map]');
const tab = (p: Page, id: string) => p.locator(`dialog[open] [data-trip-tab="${id}"]`);
/** The days with a map (a stop with a position or a leg's line), by n. */
const mapDays = (t: typeof nz) => t.days.filter((d) => t.places.some((p) => p.kind === 'stop' && p.day === d.n) || t.legs.some((l) => l.day === d.n)).map((d) => d.n);
const stopsOf = (t: typeof nz, day: number) => t.places.filter((p) => p.kind === 'stop' && p.day === day);
/** Tap a stop's dot on the drawn map (its point from the hook). */
async function tapStop(page: Page, id: string) {
  const at = await page.evaluate((s) => (window as unknown as { __travelMap: { px(id: string): [number, number] | null } }).__travelMap.px(s), id);
  const box = (await map(page).boundingBox())!;
  await page.mouse.click(box.x + at![0], box.y + at![1]);
}
/** The geolocation API answering `err` (the prompt refused: Chromium and WebKit both refuse without a grant). */
const refused = (page: Page) => page.addInitScript(() => {
  Object.defineProperty(navigator, 'geolocation', {
    value: { watchPosition: (_ok: unknown, err: (e: { code: number }) => void) => (setTimeout(() => err({ code: 1 }), 50), 1), clearWatch: () => {} }
  });
});

test('the stub: the foot row (全体 and a cell a day), opens on the day being read, a day focused, 全体 again', async ({ page }) => {
  await gotoTrip(page, 'nz');
  await expect(map(page)).toHaveAttribute('data-mode', 'stub');
  const days = mapDays(nz);
  const cells = map(page).locator('[data-map-day]');
  await expect(cells).toHaveCount(days.length + 1);
  await expect(cells.first()).toHaveText('全体');
  // a cell: the day's dot and its day of the month, 44 px wide at least, 40 tall
  const d1 = map(page).locator(`[data-map-day="${days[0]}"]`);
  await expect(d1).toHaveText(String(Number(nz.days[0].date.slice(8))));
  const b = (await d1.boundingBox())!;
  expect(b.width).toBeGreaterThanOrEqual(44);
  expect(b.height).toBeGreaterThanOrEqual(40);
  // Nov 4, before the trip: the list on its first day, so the map too
  await expect(map(page)).toHaveAttribute('data-focus', String(days[0]));
  await expect(d1).toHaveAttribute('aria-pressed', 'true');
  // day 3: its stops full, the others faded
  await map(page).locator('[data-map-day="3"]').click();
  await expect(map(page)).toHaveAttribute('data-focus', '3');
  await expect(map(page).locator(`[data-pin="${stopsOf(nz, 3)[0].id}"]`)).not.toHaveAttribute('data-faded');
  await expect(map(page).locator(`[data-pin="${stopsOf(nz, 1)[0].id}"]`).first()).toHaveAttribute('data-faded', '');
  await map(page).locator('[data-map-day="all"]').click();
  await expect(map(page)).toHaveAttribute('data-focus', 'all');
  await expect(map(page).locator('[data-pin][data-faded]')).toHaveCount(0);
});

test('the stub: a stop tapped, its card 「time name 日程で見る ✕」; ✕ closes; 日程で見る opens 日程 on that stop', async ({ page }) => {
  await gotoTrip(page, 'nz');
  await map(page).locator('[data-map-day="3"]').click();
  const s = stopsOf(nz, 3).at(-1)!;
  await map(page).locator(`[data-pin="${s.id}"]`).click();
  await expect(map(page)).toHaveAttribute('data-selected', s.id);
  // a ring never refocuses: the day kept
  await expect(map(page)).toHaveAttribute('data-focus', '3');
  const card = map(page).locator('[data-map-card]');
  await expect(card).toContainText(s.name.ja!);
  await expect(card.locator('[data-map-go]')).toHaveText('日程で見る');
  await card.locator('[data-map-close]').click();
  await expect(card).toHaveCount(0);
  await expect(map(page)).toHaveAttribute('data-selected', '');
  await map(page).locator(`[data-pin="${s.id}"]`).click();
  await card.locator('[data-map-go]').click();
  await expect(tab(page, 'days')).toHaveAttribute('aria-current', 'page');
  await expect(map(page)).toBeHidden();
  await expect(page.locator(`dialog[open] [data-line="${s.id}"]`).first()).toBeInViewport();
});

test('the stub: 地図で見る on a stop’s line opens 地図 on its day, the stop ringed', async ({ page }) => {
  await gotoTrip(page, 'nz', 'days');
  const id = stopsOf(nz, 3)[2].id;
  const line = page.locator(`dialog[open] [data-line="${id}"]`);
  await line.locator('.ln').click();
  await line.locator(`[data-on-map="${id}"]`).click();
  await expect(map(page)).toBeVisible();
  await expect(map(page)).toHaveAttribute('data-focus', '3');
  await expect(map(page)).toHaveAttribute('data-selected', id);
  await expect(map(page).locator(`[data-map-card="${id}"]`)).toBeVisible();
});

test('a trip without a map (Seattle, an English guide): 「No map for this trip」 in the same tab shape', async ({ page }) => {
  await gotoTrip(page, 'seattle', 'days');
  await tab(page, 'map').click();
  await expect(map(page).locator('[data-map-empty]')).toHaveText('No map for this trip');
  await expect(map(page)).toHaveAttribute('data-mode', 'none');
  await expect(map(page).locator('[data-map-day], .locate, [data-map-layers]')).toHaveCount(0);
  await expect(tab(page, 'map')).toHaveAttribute('aria-current', 'page');
  await expect(tab(page, 'days')).toBeVisible();
});

test('Okinawa: the one layer button, its three layers off at first; the campsites on, a camp’s card (✕ back); a nature dot its name', async ({ page }) => {
  await gotoTrip(page, 'okinawa');
  await expect(map(page)).toHaveAttribute('data-mode', 'stub');
  const btn = map(page).locator('[data-map-layers]');
  await expect(btn).toHaveAttribute('aria-expanded', 'false');
  expect((await mapState(page)).layers).toEqual([]);
  const box = (await btn.boundingBox())!;
  expect([box.width, box.height]).toEqual([44, 44]);
  await btn.click();
  await expect(map(page).locator('[data-map-layer]')).toHaveText(['キャンプ場', '自然', '食べる']);
  await map(page).locator('[data-map-layer="camp"]').click();
  await expect(map(page).locator('[data-map-layer="camp"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await mapState(page)).candidates.length).toBe(okinawa.places.filter((p) => p.kind === 'camp').length);
  await map(page).locator('[data-pin="katsuren-beach"]').click();
  const camp = page.locator('dialog[open] [data-camp-sheet="katsuren-beach"]');
  await expect(camp).toBeVisible();
  // (one word for "open in Google Maps" on every map's card: DECISIONS 7)
  await expect(camp.locator('[data-link]')).toHaveAttribute('target', '_blank');
  await expect(camp.locator('[data-link]')).toHaveText('Googleマップ');
  await camp.locator('xpath=ancestor::dialog[1]').locator('.bar .nav.close').click();
  await expect(camp).toHaveCount(0);
  await expect(map(page)).toHaveAttribute('data-selected', 'katsuren-beach');
  await map(page).locator('[data-map-layer="camp"]').click();
  await map(page).locator('[data-map-layer="nature"]').click();
  await expect.poll(async () => (await mapState(page)).layers).toEqual(['nature']);
  await map(page).locator('[data-pin="n-kouri-island"]').click();
  await expect(map(page)).toHaveAttribute('data-selected', 'n-kouri-island');
  await expect(map(page).locator('[data-map-card="n-kouri-island"]')).toContainText(okinawa.places.find((p) => p.id === 'n-kouri-island')!.name.ja!);
  await expect(page.locator('dialog[open] [data-camp-sheet]')).toHaveCount(0);
});

test('the locate button: asks only when tapped, the dot on with a fix', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -36.9, longitude: 174.69, accuracy: 25 });
  // each ask of the location noted, and whether the button had been tapped by then (a deterministic "never by itself")
  await page.addInitScript(() => {
    const w = window as unknown as { __asks: boolean[]; __tapped?: boolean }, g = navigator.geolocation;
    w.__asks = [];
    for (const k of ['watchPosition', 'getCurrentPosition'] as const) {
      const f = g[k].bind(g) as (...a: unknown[]) => number;
      (g as unknown as Record<string, unknown>)[k] = (...a: unknown[]) => (w.__asks.push(!!w.__tapped), f(...a));
    }
  });
  await gotoTrip(page, 'nz');
  const locate = map(page).locator('.locate');
  await expect(locate).toHaveAttribute('data-locate', 'off');
  expect((await mapState(page)).loc).toBe('off');
  await page.evaluate(() => ((window as unknown as { __tapped: boolean }).__tapped = true));
  await locate.click();
  await expect(locate).toHaveAttribute('data-locate', 'on');
  await expect(locate).toHaveAttribute('aria-pressed', 'true');
  await expect(map(page).locator('[data-map-note]')).toHaveCount(0);
  const box = (await locate.boundingBox())!;
  expect([box.width, box.height]).toEqual([44, 44]);
  const asks = await page.evaluate(() => (window as unknown as { __asks: boolean[] }).__asks);
  expect(asks.length).toBeGreaterThan(0);
  expect(asks.filter((t) => !t)).toEqual([]);
});

test('the locate button far from the trip (Tokyo): on, and a note instead of a flight there', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 35.68, longitude: 139.77, accuracy: 25 });
  await gotoTrip(page, 'nz');
  await map(page).locator('.locate').click();
  await expect(map(page).locator('.locate')).toHaveAttribute('data-locate', 'on');
  await expect(map(page).locator('[data-map-note="far"]')).toHaveText('旅先から離れています');
});

test('the locate button refused: denied, a note says where to turn it on (two lines), the slash', async ({ page, context }) => {
  await context.clearPermissions();
  await refused(page);
  await gotoTrip(page, 'nz');
  const locate = map(page).locator('.locate');
  await locate.click();
  await expect(locate).toHaveAttribute('data-locate', 'denied');
  await expect(locate).toHaveAttribute('aria-label', '位置情報がオフです');
  const note = map(page).locator('[data-map-note="denied"]');
  await expect(note).toHaveText('位置情報がオフです\n設定の Safari › 位置情報');
  expect(await note.evaluate((el) => {
    const s = getComputedStyle(el);
    return Math.round((el.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom)) / parseFloat(s.lineHeight));
  })).toBe(2);
  await expect(locate.locator('.slash')).toHaveCount(1);
});

test('drawn: a day focused fits its route, 全体 the whole trip; a stop tapped is ringed with the zoom kept', { tag: '@render' }, async ({ page }) => {
  await drawn(page);
  const net = await fixtureTiles(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await gotoTrip(page, 'okinawa');
  await mapReady(page);
  await mapSettled(page);
  await expect(map(page).locator('.maplibregl-canvas')).toHaveCount(1);
  await expect(map(page).locator('.maplibregl-ctrl-attrib')).toContainText('© OpenStreetMap');
  expect((await mapState(page)).stops).toBe(okinawa.places.filter((p) => p.kind === 'stop').length);
  expect((await mapState(page)).legs).toBeGreaterThan(0);
  // 全体: zoomed out past any one day's
  await map(page).locator('[data-map-day="all"]').click();
  await expect.poll(async () => (await mapState(page)).focus).toBeNull();
  await mapSettled(page);
  const z0 = (await mapState(page)).zoom!;
  const day = mapDays(okinawa).at(-1)!;
  await map(page).locator(`[data-map-day="${day}"]`).click();
  await expect.poll(async () => (await mapState(page)).zoom!, { timeout: 10_000 }).toBeGreaterThan(z0 + 0.3);
  await mapSettled(page);
  const st = stopsOf(okinawa, day);
  const [lng, lat] = (await mapState(page)).center!;
  expect(lng).toBeGreaterThan(Math.min(...st.map((p) => p.lon)) - 0.05);
  expect(lng).toBeLessThan(Math.max(...st.map((p) => p.lon)) + 0.05);
  expect(lat).toBeGreaterThan(Math.min(...st.map((p) => p.lat)) - 0.05);
  expect(lat).toBeLessThan(Math.max(...st.map((p) => p.lat)) + 0.05);
  // a stop tapped: ringed, its card; the zoom exactly kept
  const before = await mapState(page);
  const s = st[Math.floor(st.length / 2)];
  await tapStop(page, s.id);
  await expect(map(page)).toHaveAttribute('data-selected', s.id);
  await expect(map(page).locator('[data-map-card]')).toContainText(s.name.ja!);
  await mapSettled(page);
  const after = await mapState(page);
  expect(after.zoom).toBe(before.zoom);
  expect(after.focus).toBe(day);
  // an empty spot tapped (left, mid-height): the card closes
  const box = (await map(page).boundingBox())!;
  await page.mouse.click(box.x + 8, box.y + box.height / 3);
  await expect(map(page).locator('[data-map-card]')).toHaveCount(0);
  expect(net.stray).toEqual([]);
  expect(errors).toEqual([]);
});

test('drawn: the map kept across a tab switch (one map, its canvas the same), idle while hidden', { tag: '@render' }, async ({ page }) => {
  await drawn(page);
  await fixtureTiles(page);
  await gotoTrip(page, 'okinawa');
  await mapReady(page);
  await mapSettled(page);
  await map(page).locator('.maplibregl-canvas').evaluate((c) => ((c as unknown as { __mark: number }).__mark = 1));
  for (const t of ['days', 'pack', 'days']) {
    await tab(page, t).click();
    await expect(map(page)).toBeHidden();
    expect((await mapState(page)).active).toBe(false);
  }
  await tab(page, 'map').click();
  await expect(map(page)).toBeVisible();
  expect(await map(page).locator('.maplibregl-canvas').evaluate((c) => (c as unknown as { __mark?: number }).__mark)).toBe(1);
  const s = await mapState(page);
  expect(s.made).toBe(1);
  expect(s.active).toBe(true);
  await expect(map(page)).toHaveAttribute('data-focus', '1');
});

test('drawn, offline: the map chunk never asked for, a note; back online, drawn with no tiles: the route and a note, never "ready"', { tag: '@render' }, async ({ page, context }) => {
  await drawn(page);
  await page.route('https://tiles.openfreemap.org/**', (r) => r.abort('internetdisconnected'));
  await gotoTrip(page, 'nz', 'days');
  // offline before a map ever drew (no service worker here: the chunk in no cache): a note (no retry: it would fail
  // too), no locate button
  await context.setOffline(true);
  await tab(page, 'map').click();
  await expect(map(page)).toHaveAttribute('data-mode', 'failed');
  await expect(map(page).locator('[data-map-note="offline"]')).toHaveText('地図はオフラインです（ルートのみ表示）');
  await expect(map(page).locator('[data-map-failed]')).toHaveCount(0);
  await expect(map(page).locator('.locate')).toHaveCount(0);
  // online again: drawn by itself, but its tiles don't come: the route alone, said so
  await context.setOffline(false);
  await expect(map(page)).toHaveAttribute('data-mode', 'offline', { timeout: 20_000 });
  await expect(map(page).locator('[data-map-note="offline"]')).toHaveText('地図はオフラインです（ルートのみ表示）');
  expect((await mapState(page)).stops).toBeGreaterThan(0);
});

// The maps' one status rule (MapStatus, DECISIONS 5): no tile 2 s in, 「地図を読み込み中…」 under the map's own top
// controls (the layers and locate buttons), gone with the first tile, the map then 'ready'.
test('drawn: no tile yet, 「地図を読み込み中…」 under the top right buttons (Okinawa’s); gone with the first tile', { tag: '@render' }, async ({ page }) => {
  await mapsDrawn(page);
  await fixtureTiles(page);
  const TILES = /^https:\/\/tiles\.openfreemap\.org\/planet\/fixture\//;
  const held: Route[] = [];
  await page.route(TILES, (r) => void held.push(r));
  await gotoTrip(page, 'okinawa');
  const note = map(page).locator('[data-map-note]');
  await expect(note).toHaveAttribute('data-map-note', 'loading', { timeout: 15_000 });
  await expect(note).toHaveText('地図を読み込み中…');
  const [n, locate] = await Promise.all([note.boundingBox(), map(page).locator('.locate').boundingBox()]);
  expect(n!.y).toBeGreaterThanOrEqual(locate!.y + locate!.height);
  await page.unroute(TILES);
  await Promise.all(held.splice(0).map((r) => r.fallback()));
  await mapReady(page);
  await expect(note).toHaveCount(0);
});
