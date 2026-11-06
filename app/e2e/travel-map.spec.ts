// The trip map (components/travel/map, docs/travel.md "Maps") in the trips' sheet: Okinawa's ちず on the demo. The logic
// tier: under drawOff() no map is made, the stub tells its state (the day's stops, the layers, the selection, the
// location dot) and its pins are buttons. The drawn smoke (@render): MapLibre on the fixture tiles (never the network),
// the NH pins on the map, a day chip refits it, a pin selects.
import { expect, test, type Page } from '@playwright/test';
import { drawn, fixtureTiles, gotoTrip, mapReady, mapState } from './travelMap.ts';

test.use({ viewport: { width: 393, height: 852 } });
const pane = (p: Page) => p.locator('dialog[open] [data-map-pane]');

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
  expect(await mapState(page)).toMatchObject({ day: 1, legs: 7, candidates: [] });
  // day 2: its six stops, its legs
  await pane(page).locator('[data-map-day="2"]').click();
  await expect(map).toHaveAttribute('data-day', '2');
  await expect(stub).toHaveAttribute('data-stops', 's2-0 s2-1 s2-2 s2-3 s2-4 s2-5');
  expect(await mapState(page)).toMatchObject({ day: 2, legs: 6 });
  // a pin: selected on the map and in the list
  await stub.locator('[data-pin="s2-1"]').click();
  await expect(map).toHaveAttribute('data-selected', 's2-1');
  await expect(stub.locator('[data-pin="s2-1"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(pane(page).locator('[data-stop="s2-1"]')).toHaveAttribute('aria-pressed', 'true');
  // a row: the map follows
  await pane(page).locator('[data-stop="s2-3"]').click();
  await expect(map).toHaveAttribute('data-selected', 's2-3');
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
  const box = (await locate.boundingBox())!;
  expect([box.width, box.height]).toEqual([44, 44]);
});

test('the locate button refused: denied, and the watch stops', async ({ page, context }) => {
  await context.clearPermissions();
  // the prompt answered no (Chromium and WebKit both refuse without a grant in a headless context)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: { watchPosition: (_ok: unknown, err: (e: { code: number }) => void) => (setTimeout(() => err({ code: 1 }), 50), 1), clearWatch: () => {} }
    });
  });
  await gotoTrip(page);
  const locate = page.locator('dialog[open] .locate');
  await locate.click();
  await expect(locate).toHaveAttribute('data-locate', 'denied');
  await expect(locate).toHaveAttribute('aria-label', 'いちじょうほうが オフです');
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
  const c1 = (await mapState(page)).center!;
  await page.locator('dialog[open] [data-map-day="3"]').click();
  await expect(markers).toHaveCount(9);
  // day 3 (the south, then back up to Naha) fits somewhere else than day 1 (Naha to the north)
  await expect.poll(async () => (await mapState(page)).center![1], { timeout: 10_000 }).toBeLessThan(c1[1] - 0.05);
  await page.locator('dialog[open] .maplibregl-marker[data-pin="s3-2"]').click();
  await expect(page.locator('dialog[open] [data-travel-map]')).toHaveAttribute('data-selected', 's3-2');
  expect(net.tiles.length).toBeGreaterThan(0);
  expect(net.stray).toEqual([]);
  expect(errors).toEqual([]);
});
