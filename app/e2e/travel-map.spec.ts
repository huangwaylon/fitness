// The trip map (components/travel/map, docs/travel.md "Maps") in the trips' sheet: Okinawa's and NZ's ちず on the demo.
// The logic tier: under drawOff() no map is made, the stub tells its state (the day's stops, the layers, the selection,
// the location dot) and its pins are buttons. The drawn smoke (@render): MapLibre on the fixture tiles (never the
// network), the NH pins on the map, a day chip refits it, a pin selects and is tagged; offline, the route alone with a
// note; the map's chunk not fetched, a retry.
import { expect, test, type Page } from '@playwright/test';
import { drawn, fixtureTiles, gotoTrip, mapReady, mapState } from './travelMap.ts';

test.use({ viewport: { width: 393, height: 852 } });
const pane = (p: Page) => p.locator('dialog[open] [data-map-pane]');
/** The geolocation API answering `err` (the prompt refused: Chromium and WebKit both refuse without a grant). */
const refused = (page: Page) => page.addInitScript(() => {
  Object.defineProperty(navigator, 'geolocation', {
    value: { watchPosition: (_ok: unknown, err: (e: { code: number }) => void) => (setTimeout(() => err({ code: 1 }), 50), 1), clearWatch: () => {} }
  });
});

test('the stub: the day chips, the pins and the list, the layers, a camp pin opens its card', async ({ page }) => {
  await gotoTrip(page);
  const map = pane(page).locator('[data-travel-map]');
  const stub = pane(page).locator('[data-map-stub]');
  await expect(map).toHaveAttribute('data-mode', 'stub');
  // day 1 (past the trip): its eight stops, numbered as the list is, its legs
  await expect(map).toHaveAttribute('data-day', '1');
  await expect(stub.locator('.tm-pin')).toHaveCount(8);
  await expect(pane(page).locator('[data-stop]')).toHaveCount(8);
  await expect(stub.locator('[data-pin="s1-0"]')).toHaveAttribute('aria-label', '1 那覇空港');
  expect(await mapState(page)).toMatchObject({ legs: 7, candidates: [] });
  // day 2: its six stops, its legs
  await pane(page).locator('[data-map-day="2"]').click();
  await expect(map).toHaveAttribute('data-day', '2');
  await expect(stub).toHaveAttribute('data-stops', 's2-0 s2-1 s2-2 s2-3 s2-4 s2-5');
  expect(await mapState(page)).toMatchObject({ legs: 6 });
  // a pin: selected on the map and in the list, its name read out
  await stub.locator('[data-pin="s2-1"]').click();
  await expect(map).toHaveAttribute('data-selected', 's2-1');
  await expect(stub.locator('[data-pin="s2-1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(pane(page).locator('[data-stop="s2-1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(pane(page).locator('[aria-live]')).toHaveText('DIVENUTS 瀬底');
  // a row: the map follows
  await pane(page).locator('[data-stop="s2-3"]').click();
  await expect(map).toHaveAttribute('data-selected', 's2-3');
  // the layer chips: a full 44 px each, each with its dot's colour (camp, nature, food apart)
  const chips = pane(page).locator('[data-map-layer]');
  await expect(chips).toHaveCount(3);
  const dots = await chips.evaluateAll((cs) => cs.map((c) => { const r = c.getBoundingClientRect(); return [Math.round(r.height), getComputedStyle(c.querySelector('.dot')!).backgroundColor]; }));
  for (const [h] of dots) expect(h).toBeGreaterThanOrEqual(44);
  expect(new Set(dots.map(([, c]) => c)).size).toBe(3);
  // the camp layer on: its 26 sites; a camp's pin opens its card in a sheet, ✕ back to the map
  await pane(page).locator('[data-map-layer="camp"]').click();
  await expect(pane(page).locator('[data-map-layer="camp"]')).toHaveAttribute('aria-pressed', 'true');
  expect((await mapState(page)).candidates).toHaveLength(26);
  await stub.locator('[data-pin="katsuren-beach"]').click();
  const card = page.locator('dialog[open] [data-map-camp="katsuren-beach"]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-camp-maps]')).toHaveAttribute('target', '_blank');
  await page.getByRole('dialog', { name: '勝連ビーチ' }).locator('.bar .close').click();
  await expect(card).toHaveCount(0);
  await expect(map).toHaveAttribute('data-selected', 'katsuren-beach');
  // camps off, nature on: a nature pin selects, no card
  await pane(page).locator('[data-map-layer="camp"]').click();
  await pane(page).locator('[data-map-layer="nature"]').click();
  expect(await mapState(page)).toMatchObject({ layers: ['nature'] });
  await stub.locator('[data-pin="n-kouri-island"]').click();
  await expect(map).toHaveAttribute('data-selected', 'n-kouri-island');
  await expect(page.locator('dialog[open] [data-map-camp]')).toHaveCount(0);
});

test("NZ day 1: New Lynn's two stops one pin 「2·6」, both rows marked; the day chips stay under the tabs; a pin doesn't scroll the map away", async ({ page }) => {
  await gotoTrip(page, 'nz');
  const stub = pane(page).locator('[data-map-stub]');
  await expect(stub.locator('.tm-pin')).toHaveCount(5);
  const lynn = stub.locator('[data-pin="s1-1"]');
  await expect(lynn).toHaveAttribute('aria-label', '2·6 ニューリン');
  await lynn.click();
  await expect(pane(page).locator('[data-travel-map]')).toHaveAttribute('data-selected', 's1-1');
  for (const id of ['s1-1', 's1-5']) await expect(pane(page).locator(`[data-stop="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(pane(page).locator('[data-stop="s1-2"]')).toHaveAttribute('aria-pressed', 'false');
  // the map still in sight below the day chips
  const chips = pane(page).locator('.days');
  const slot = pane(page).locator('.slot');
  const [c, s] = [(await chips.boundingBox())!, (await slot.boundingBox())!];
  expect(s.y).toBeGreaterThanOrEqual(c.y + c.height - 1);
  // scrolled to the list's end: the day chips stuck under the page's tabs
  await pane(page).evaluate((el) => {
    let sc = el.parentElement;
    while (sc && !/(auto|scroll)/.test(getComputedStyle(sc).overflowY)) sc = sc.parentElement;
    sc!.scrollTop = sc!.scrollHeight;
  });
  const tabs = (await page.locator('dialog[open] .tabs').boundingBox())!;
  await expect.poll(async () => Math.abs((await chips.boundingBox())!.y - (tabs.y + tabs.height))).toBeLessThan(2);
  await expect(pane(page).locator('[data-map-day="3"]')).toBeInViewport();
});

test('the locate button: asks only when tapped, the dot on with a fix, off when refused', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 26.6944, longitude: 127.8779, accuracy: 25 });
  await gotoTrip(page);
  const locate = page.locator('dialog[open] .locate');
  await expect(locate).toHaveAttribute('data-locate', 'off');
  // nothing asked before the tap
  await page.waitForTimeout(300);
  expect((await mapState(page)).loc).toBe('off');
  await locate.click();
  await expect(locate).toHaveAttribute('data-locate', 'on');
  await expect(locate).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('dialog[open] [data-map-note]')).toHaveCount(0);
  const box = (await locate.boundingBox())!;
  expect([box.width, box.height]).toEqual([44, 44]);
});

test('the locate button far from the trip (Tokyo): on, and a note instead of a flight there', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 35.68, longitude: 139.77, accuracy: 25 });
  await gotoTrip(page);
  await page.locator('dialog[open] .locate').click();
  await expect(page.locator('dialog[open] .locate')).toHaveAttribute('data-locate', 'on');
  await expect(page.locator('dialog[open] [data-map-note="far"]')).toHaveText('たびさきから とおいよ');
});

test('the locate button refused: denied, a note says where to turn it on, and the watch stops', async ({ page, context }) => {
  await context.clearPermissions();
  await refused(page);
  await gotoTrip(page);
  const locate = page.locator('dialog[open] .locate');
  await locate.click();
  await expect(locate).toHaveAttribute('data-locate', 'denied');
  await expect(locate).toHaveAttribute('aria-label', 'いちじょうほうが オフです');
  await expect(page.locator('dialog[open] [data-map-note="denied"]')).toHaveText('いちじょうほうが オフです\nせってい › Safari › いちじょうほう');
});

test('drawn: MapLibre on the fixture tiles, the NH pins, a day chip refits, a pin selects', { tag: '@render' }, async ({ page }) => {
  test.setTimeout(90_000);
  await drawn(page);
  const net = await fixtureTiles(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  await gotoTrip(page);
  await mapReady(page);
  const markers = page.locator('dialog[open] .maplibregl-marker.tm-pin');
  await expect(page.locator('dialog[open] .maplibregl-canvas')).toHaveCount(1);
  await expect(markers).toHaveCount(8);
  await expect(page.locator('dialog[open] .maplibregl-ctrl-attrib')).toContainText('© OpenStreetMap');
  // the labels drawn in the app's font (its slices fetched: no glyph PBFs)
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').some((r) => /zen-maru-gothic-.+-700-normal.*\.woff2/.test(r.name))), { timeout: 15_000 }).toBe(true);
  const c1 = (await mapState(page)).center!;
  await page.locator('dialog[open] [data-map-day="3"]').click();
  await expect(markers).toHaveCount(9);
  // day 3 (the south, then back up to Naha) fits somewhere else than day 1 (Naha to the north)
  await expect.poll(async () => (await mapState(page)).center![1], { timeout: 10_000 }).toBeLessThan(c1[1] - 0.05);
  await page.waitForTimeout(1000); // the fit's flight (700 ms) over
  const c3 = (await mapState(page)).center!;
  // a pin: selected, tagged with its name, the map brought to it; day 3's chip again: back to the route
  const pin = page.locator('dialog[open] .maplibregl-marker[data-pin="s3-2"]');
  await pin.click();
  await expect(page.locator('dialog[open] [data-travel-map]')).toHaveAttribute('data-selected', 's3-2');
  await expect(pin.locator('.tm-tag')).toBeVisible();
  await expect(pin.locator('.tm-tag')).toHaveText('浜辺の茶屋 新原');
  await expect.poll(async () => Math.abs((await mapState(page)).center![1] - c3[1]), { timeout: 10_000 }).toBeGreaterThan(0.01);
  await page.locator('dialog[open] [data-map-day="3"]').click();
  await expect.poll(async () => Math.abs((await mapState(page)).center![1] - c3[1]), { timeout: 10_000 }).toBeLessThan(0.002);
  expect(net.tiles.length).toBeGreaterThan(0);
  expect(net.stray).toEqual([]);
  expect(errors).toEqual([]);
});

test('drawn, offline: the map chunk never asked for, a retry; back online, drawn with no tiles: the route and a note, never "ready"', { tag: '@render' }, async ({ page, context }) => {
  test.setTimeout(90_000);
  await drawn(page);
  await page.route('https://tiles.openfreemap.org/**', (r) => r.abort('internetdisconnected'));
  await gotoTrip(page, 'okinawa', 'days');
  // offline (the chunk is never precached): a word and a retry, no locate button
  await context.setOffline(true);
  await page.locator('dialog[open] [data-trip-tab="map"]').click();
  const map = pane(page).locator('[data-travel-map]');
  await expect(map).toHaveAttribute('data-mode', 'failed');
  await expect(map.locator('[data-map-retry]')).toHaveText('もういちど');
  await expect(map.locator('.locate')).toHaveCount(0);
  await map.locator('[data-map-retry]').click();
  await expect(map).toHaveAttribute('data-mode', 'failed');
  // online again: drawn by itself, but its tiles don't come: the route alone, said so
  await context.setOffline(false);
  await expect(map).toHaveAttribute('data-mode', 'offline', { timeout: 30_000 });
  await expect(map.locator('[data-map-note="offline"]')).toHaveText('ちずは オフライン — ルートだけ');
  await expect(page.locator('dialog[open] .maplibregl-marker.tm-pin')).toHaveCount(8);
});
