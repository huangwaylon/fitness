// The trip map (components/travel/map, docs/travel.md "Maps") on the dev page's sample Okinawa trip. The logic tier:
// under drawOff() no map is made, the stub tells its state (the day's stops, the layers, the selection, the location
// dot) and its pins are buttons. The drawn smoke (@render): MapLibre on the fixture tiles (never the network), the NH
// pins on the map, a day chip refits it, a pin selects.
import { expect, test } from '@playwright/test';
import { devMap, drawn, fixtureTiles, mapReady, mapState } from './travelMap.ts';

test.use({ viewport: { width: 393, height: 852 } });

test('the stub: the day chips, the pins, the layers, the language', async ({ page }) => {
  await devMap(page);
  const map = page.locator('[data-travel-map]');
  await expect(map).toHaveAttribute('data-mode', 'stub');
  await expect(page.locator('[data-map-stub] .tm-pin')).toHaveCount(9);
  expect((await mapState(page)).legs).toBe(8);
  // day 2: its four stops, its legs
  await page.locator('[data-day-chip="2"]').click();
  await expect(map).toHaveAttribute('data-day', '2');
  await expect(page.locator('[data-map-stub]')).toHaveAttribute('data-stops', 'churaumi bise motobu-port minna');
  expect(await mapState(page)).toMatchObject({ day: 2, legs: 4, stops: ['churaumi', 'bise', 'motobu-port', 'minna'] });
  // a pin: selected, its name below; the pin pressed
  await page.locator('[data-pin="bise"]').click();
  await expect(map).toHaveAttribute('data-selected', 'bise');
  await expect(page.locator('[data-pin="bise"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-picked]')).toHaveText('備瀬のフクギ並木');
  await expect(page.locator('[data-pin="bise"]')).toHaveAttribute('aria-label', '2 備瀬のフクギ並木');
  // the camp layer on: its two candidates, and one selects
  await page.locator('[data-layer-chip="camp"]').click();
  await expect(page.locator('[data-map-stub]')).toHaveAttribute('data-candidates', 'c-bise c-nago');
  await page.locator('[data-pin="c-nago"]').click();
  await expect(map).toHaveAttribute('data-selected', 'c-nago');
  // English: the pins' names follow
  await page.locator('[data-lang-chip]').click();
  await expect(page.locator('[data-pin="bise"]')).toHaveAttribute('aria-label', '2 Bise Fukugi Trees');
  expect((await mapState(page)).locale).toBe('en');
  // all again
  await page.locator('[data-day-chip="all"]').click();
  await expect(page.locator('[data-map-stub] .tm-pin')).toHaveCount(9);
});

test('the locate button: asks only when tapped, the dot on with a fix, off when refused', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 26.6944, longitude: 127.8779, accuracy: 25 });
  await devMap(page, 'day=2');
  const locate = page.locator('.locate');
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
  await devMap(page);
  await page.locator('.locate').click();
  await expect(page.locator('.locate')).toHaveAttribute('data-locate', 'denied');
  await expect(page.locator('.locate')).toHaveAttribute('aria-label', 'いちじょうほうが オフです');
});

test('drawn: MapLibre on the fixture tiles, the NH pins, a day chip refits, a pin selects', { tag: '@render' }, async ({ page }) => {
  test.setTimeout(90_000);
  await drawn(page);
  const net = await fixtureTiles(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // (the page itself comes as Pages' 404.html, the SPA fallback: a 404 status and its console line, not the map's)
  page.on('console', (m) => m.type() === 'error' && !/status of 404/.test(m.text()) && errors.push(m.text()));
  page.on('response', (r) => r.status() >= 400 && !r.request().isNavigationRequest() && errors.push(`${r.status()} ${r.url()}`));
  await devMap(page, 'day=2');
  await mapReady(page);
  await expect(page.locator('.maplibregl-canvas')).toHaveCount(1);
  await expect(page.locator('.maplibregl-marker.tm-pin')).toHaveCount(4);
  await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('© OpenStreetMap');
  const z2 = (await mapState(page)).zoom!;
  expect(z2).toBeGreaterThan(9);
  await page.locator('[data-day-chip="1"]').click();
  await expect(page.locator('.maplibregl-marker.tm-pin')).toHaveCount(3);
  // day 1 (Naha, a few km) fits closer than day 2 (Naha to Motobu)
  await expect.poll(async () => (await mapState(page)).zoom!, { timeout: 10_000 }).toBeGreaterThan(z2 + 1);
  await page.locator('.maplibregl-marker[data-pin="shuri"]').click();
  await expect(page.locator('[data-travel-map]')).toHaveAttribute('data-selected', 'shuri');
  expect(net.tiles.length).toBeGreaterThan(0);
  expect(net.stray).toEqual([]);
  expect(errors).toEqual([]);
});
