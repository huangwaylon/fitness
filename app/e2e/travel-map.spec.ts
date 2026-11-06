// The trip map (components/travel/map, docs/travel.md "Maps") in a quiet trip's 地図 (NZ on the demo; Okinawa's layers
// and camps while it is a quiet trip). The logic tier: under drawOff() no map is made, the stub tells its state (the
// day's stops, the layers, the selection, the location dot) and its pins are buttons. The drawn smoke (@render):
// MapLibre on the fixture tiles (never the network), the NH pins on the map, a day chip refits it, a pin selects and is
// tagged; offline, the route alone with a note; the map's chunk not fetched, a retry.
import { expect, test, type Page } from './fixtures.ts';
import { drawn, fixtureTiles, gotoTrip, mapReady, mapState } from './trips.ts';
import { nz } from '../src/lib/travel/trips/nz.ts';
import { okinawa } from '../src/lib/travel/trips/okinawa.ts';

test.use({ viewport: { width: 393, height: 852 } });
const pane = (p: Page) => p.locator('dialog[open] [data-map-pane]');
const stopsOf = (day: number) => nz.places.filter((p) => p.kind === 'stop' && p.day === day);
/** The geolocation API answering `err` (the prompt refused: Chromium and WebKit both refuse without a grant). */
const refused = (page: Page) => page.addInitScript(() => {
  Object.defineProperty(navigator, 'geolocation', {
    value: { watchPosition: (_ok: unknown, err: (e: { code: number }) => void) => (setTimeout(() => err({ code: 1 }), 50), 1), clearWatch: () => {} }
  });
});

test('the stub: the day chips, the pins and the list, a pin and a row select', async ({ page }) => {
  await gotoTrip(page, 'nz');
  const map = pane(page).locator('[data-travel-map]');
  const stub = pane(page).locator('[data-map-stub]');
  await expect(map).toHaveAttribute('data-mode', 'stub');
  await expect(map).toHaveAttribute('data-day', '1');
  await expect(pane(page).locator('[data-stop]')).toHaveCount(stopsOf(1).length);
  // the chips: one row, each 32 px to the eye with a 44 px hit, the shown day's filled
  const chip = pane(page).locator('[data-map-day="1"]');
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  expect(Math.round((await chip.boundingBox())!.height)).toBe(32);
  // no candidate layers on NZ: no 表示 button
  await expect(pane(page).locator('[data-map-layers]')).toHaveCount(0);
  // day 2: its stops, how each is reached
  await pane(page).locator('[data-map-day="2"]').click();
  await expect(map).toHaveAttribute('data-day', '2');
  await expect(stub).toHaveAttribute('data-stops', stopsOf(2).map((p) => p.id).join(' '));
  await expect(pane(page).locator('[data-stop]').first()).toContainText('出発');
  const s = stopsOf(2)[1].id;
  await stub.locator(`[data-pin="${s}"]`).click();
  await expect(map).toHaveAttribute('data-selected', s);
  await expect(pane(page).locator(`[data-stop="${s}"]`)).toHaveAttribute('aria-pressed', 'true');
  const r = stopsOf(2)[2].id;
  await pane(page).locator(`[data-stop="${r}"]`).click();
  await expect(map).toHaveAttribute('data-selected', r);
});

test("NZ day 1: New Lynn's two stops one pin 「2·6」, both rows marked; the map stays held at the top as the stops scroll", async ({ page }) => {
  await gotoTrip(page, 'nz');
  const stub = pane(page).locator('[data-map-stub]');
  await expect(stub.locator('.tm-pin')).toHaveCount(5);
  const lynn = stub.locator('[data-pin="s1-1"]');
  await expect(lynn).toHaveAttribute('aria-label', '2·6 ニューリン');
  await lynn.click();
  await expect(pane(page).locator('[data-travel-map]')).toHaveAttribute('data-selected', 's1-1');
  for (const id of ['s1-1', 's1-5']) await expect(pane(page).locator(`[data-stop="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(pane(page).locator('[data-stop="s1-2"]')).toHaveAttribute('aria-pressed', 'false');
  // scrolled to the list's end: the map and the chips held under the title bar
  const slot = pane(page).locator('.slot');
  const top = (await slot.boundingBox())!.y;
  await page.locator('dialog[open] .scroll').evaluate((el) => (el.scrollTop = el.scrollHeight));
  await expect.poll(async () => Math.abs((await slot.boundingBox())!.y - top)).toBeLessThan(2);
  await expect(pane(page).locator('[data-map-day="1"]')).toBeInViewport();
});

test('Okinawa’s layers in the 表示 menu; a camp’s dot opens its sheet', async ({ page }) => {
  await gotoTrip(page, 'okinawa', 'days').catch(() => {});
  test.skip((await page.locator('dialog[open] [data-classic]').count()) > 0, 'Okinawa is drawn by its classic guide');
  await page.locator('dialog[open] [data-trip-tab="map"]').click();
  const map = pane(page).locator('[data-travel-map]');
  const stub = pane(page).locator('[data-map-stub]');
  await pane(page).locator('[data-map-layers]').click();
  const items = pane(page).locator('[data-map-layer]');
  await expect(items).toHaveCount(3);
  for (const b of await items.all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await pane(page).locator('[data-map-layer="camp"]').click();
  await expect(pane(page).locator('[data-map-layer="camp"]')).toHaveAttribute('aria-checked', 'true');
  expect((await mapState(page)).candidates).toHaveLength(okinawa.camps!.length);
  await stub.locator('[data-pin="katsuren-beach"]').click();
  const card = page.locator('dialog[open] [data-map-camp="katsuren-beach"]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-camp-maps]')).toHaveAttribute('target', '_blank');
  await page.getByRole('dialog', { name: '勝連ビーチ' }).locator('.close').click();
  await expect(card).toHaveCount(0);
  await expect(map).toHaveAttribute('data-selected', 'katsuren-beach');
});

test('the locate button: asks only when tapped, the dot on with a fix, off when refused', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -36.9, longitude: 174.69, accuracy: 25 });
  await gotoTrip(page, 'nz');
  const locate = page.locator('dialog[open] .locate');
  await expect(locate).toHaveAttribute('data-locate', 'off');
  // nothing asked before the tap
  await page.waitForTimeout(300); // hold: proves no location request starts by itself
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
  await gotoTrip(page, 'nz');
  await page.locator('dialog[open] .locate').click();
  await expect(page.locator('dialog[open] .locate')).toHaveAttribute('data-locate', 'on');
  await expect(page.locator('dialog[open] [data-map-note="far"]')).toHaveText('旅先から離れています');
});

test('the locate button refused: denied, a note says where to turn it on, and the watch stops', async ({ page, context }) => {
  await context.clearPermissions();
  await refused(page);
  await gotoTrip(page, 'nz');
  const locate = page.locator('dialog[open] .locate');
  await locate.click();
  await expect(locate).toHaveAttribute('data-locate', 'denied');
  await expect(locate).toHaveAttribute('aria-label', '位置情報がオフです');
  await expect(page.locator('dialog[open] [data-map-note="denied"]')).toHaveText('位置情報がオフです\n設定 › Safari › 位置情報');
});

test('drawn: MapLibre on the fixture tiles, the NH pins, a day chip refits, a pin selects', { tag: '@render' }, async ({ page }) => {
  test.setTimeout(90_000);
  await drawn(page);
  const net = await fixtureTiles(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  await gotoTrip(page, 'nz');
  await mapReady(page);
  const markers = page.locator('dialog[open] .maplibregl-marker.tm-pin');
  await expect(page.locator('dialog[open] .maplibregl-canvas')).toHaveCount(1);
  await expect(markers).toHaveCount(5);
  await expect(page.locator('dialog[open] .maplibregl-ctrl-attrib')).toContainText('© OpenStreetMap');
  const c1 = (await mapState(page)).center!;
  // day 2 (Auckland to Taranaki, south) fits somewhere else than day 1 (round Auckland)
  await page.locator('dialog[open] [data-map-day="2"]').click();
  await expect.poll(async () => (await mapState(page)).center![1], { timeout: 10_000 }).toBeLessThan(c1[1] - 0.05);
  await page.waitForTimeout(1000); // hold: the fit's flight (700 ms) settles before the centre is read (no moving state exposed)
  const c2 = (await mapState(page)).center!;
  // a pin: selected, tagged with its name, the map brought to it; day 2's chip again: back to the route
  const id = stopsOf(2).at(-1)!.id;
  const pin = page.locator(`dialog[open] .maplibregl-marker[data-pin="${id}"]`);
  await pin.click();
  await expect(page.locator('dialog[open] [data-travel-map]')).toHaveAttribute('data-selected', id);
  await expect(pin.locator('.tm-tag')).toBeVisible();
  await expect.poll(async () => Math.abs((await mapState(page)).center![1] - c2[1]) + Math.abs((await mapState(page)).center![0] - c2[0]), { timeout: 10_000 }).toBeGreaterThan(0.01);
  await page.locator('dialog[open] [data-map-day="2"]').click();
  await expect.poll(async () => Math.abs((await mapState(page)).center![1] - c2[1]), { timeout: 10_000 }).toBeLessThan(0.002);
  expect(net.stray).toEqual([]);
  expect(errors).toEqual([]);
});

test('drawn, offline: the map chunk never asked for, a retry; back online, drawn with no tiles: the route and a note, never "ready"', { tag: '@render' }, async ({ page, context }) => {
  test.setTimeout(90_000);
  await drawn(page);
  await page.route('https://tiles.openfreemap.org/**', (r) => r.abort('internetdisconnected'));
  await gotoTrip(page, 'nz', 'days');
  // offline (the chunk is never precached): a word and a retry, no locate button
  await context.setOffline(true);
  await page.locator('dialog[open] [data-trip-tab="map"]').click();
  const map = pane(page).locator('[data-travel-map]');
  await expect(map).toHaveAttribute('data-mode', 'failed');
  await expect(map.locator('[data-map-retry]')).toHaveText('もう一度');
  await expect(map.locator('.locate')).toHaveCount(0);
  await map.locator('[data-map-retry]').click();
  await expect(map).toHaveAttribute('data-mode', 'failed');
  // online again: drawn by itself, but its tiles don't come: the route alone, said so
  await context.setOffline(false);
  await expect(map).toHaveAttribute('data-mode', 'offline', { timeout: 30_000 });
  await expect(map.locator('[data-map-note="offline"]')).toHaveText('地図はオフライン — ルートのみ');
  await expect(page.locator('dialog[open] .maplibregl-marker.tm-pin')).toHaveCount(5);
});
