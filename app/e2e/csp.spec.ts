// The site's Content-Security-Policy (scripts/headers.ts: build-pages/_headers, served by serve-build.ts as Cloudflare
// Pages serves it; the same policy in index.html's <meta>, vite.config.ts `csp`): a click-through of the island, its
// sheets, the music, the shop, the museum, the tent, the editor and the trip map with no violation (every `securitypolicyviolation`
// event and every console line of a refused load, the page's and its workers').
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, openKenkou } from './hud.ts';
import { is3d, nav } from './island.ts';
import { roomUp } from './rooms.ts';
import { fixtureTiles, gotoTrip, mapReady, mapsDrawn } from './trips.ts';

const Q = '?demo&date=2026-11-04T12:00';

async function watch(page: Page): Promise<string[]> {
  const seen: string[] = [];
  page.on('console', (m) => /content security policy|refused to/i.test(m.text()) && seen.push(`console: ${m.text()}`));
  await page.exposeFunction('__cspSaw', (s: string) => seen.push(s));
  await page.addInitScript(() => {
    localStorage.setItem('island.sound', JSON.stringify({ music: true, sfx: true, volume: 0.8 }));
    document.addEventListener('securitypolicyviolation', (e) =>
      (window as unknown as { __cspSaw(s: string): void }).__cspSaw(`${e.effectiveDirective}: ${e.blockedURI} (${e.sourceFile}:${e.lineNumber})`));
  });
  return seen;
}

/** The island up, the watch on: what it saw. */
async function island(page: Page) {
  const seen = await watch(page);
  await page.goto(Q);
  await expect.poll(() => is3d(page), { timeout: 30_000 }).toBe(true);
  return seen;
}
/** Nothing seen, after a moment for a violation reported after the last load. */
async function none(page: Page, seen: string[]) {
  await page.waitForTimeout(1000); // hold: a violation reported after the last load still counts
  expect(seen).toEqual([]);
}

// One test a surface (they shard apart, each well inside 30 s): the island and its music, the HUD's sheets, the rooms.
test('the island and its music: no CSP violation', async ({ page }) => {
  const audio: string[] = [];
  page.on('request', (r) => r.url().includes('/audio/') && audio.push(r.url()));
  const seen = await island(page);
  // the first tap unlocks the sound: the hour's music plays (from a blob: URL)
  const s = (await page.locator('.if-scene').boundingBox())!;
  await page.mouse.click(s.x + s.width / 2, s.y + 60);
  await expect.poll(() => audio.some((u) => u.includes('/audio/music/'))).toBe(true);
  await none(page, seen);
});

test('the menu’s sheets (ベル, ずかん, りょこう, 設定): no CSP violation', async ({ page }) => {
  const seen = await island(page);
  for (const which of ['bells', 'zukan', 'travel', 'settings'] as const) {
    await fromMenu(page, which);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }
  await none(page, seen);
});

test('健康 and ごはん (one sheet from the dumbbell, each tab shown): no CSP violation', async ({ page }) => {
  const seen = await island(page);
  for (const tab of ['health', 'food'] as const) {
    await openKenkou(page, tab);
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }
  await none(page, seen);
});

/** The rooms, each from the island as a door goes (the app's own navigation), up once it shows or draws. */
const rooms: [string, string, (page: Page) => Promise<unknown>][] = [
  ['the shop', 'shop', (page) => expect(page.locator('[data-shop]')).toBeVisible()],
  ['the museum', 'museum', (page) => roomUp(page, 'museum', { frames: 1 })],
  ['the tent', 'tent', (page) => roomUp(page, 'tent', { frames: 1 })],
  ['the editor', 'editor/', (page) => page.waitForFunction(() => !!(window as unknown as { __editor?: unknown }).__editor, null, { timeout: 30_000 })]
];
for (const [name, path, up] of rooms)
  test(`${name}: no CSP violation`, async ({ page }) => {
    const seen = await island(page);
    await nav(page, `${path}${Q}`);
    await up(page);
    await none(page, seen);
  });

// ボット's メニュー (lib/kalori/status.ts): connect-src names status.json itself, so it's read and nothing else on
// raw.githubusercontent.com is (both routed: only the policy can refuse).
test('connect-src: the Kalori status.json only, no other raw.githubusercontent.com file', async ({ page }) => {
  const seen = await island(page);
  const RAW = 'https://raw.githubusercontent.com/huangwaylon/fitness';
  await page.route(`${RAW}/**`, (r) => r.fulfill({ status: 200, contentType: 'text/plain', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{}' }));
  const get = (u: string) => page.evaluate((x) => fetch(x).then((r) => r.status, () => 'refused'), u);
  expect(await get(`${RAW}/kalori-status/status.json`)).toBe(200);
  expect(await get(`${RAW}/main/README.md`)).toBe('refused');
  await expect.poll(() => seen.some((x) => x.includes('connect-src') || /refused to connect/i.test(x))).toBe(true);
});

// The trip map (docs/travel.md "Maps"): drawn (not the logic tier's stub), its worker (our own file), its fonts (the
// app's woff2 slices, fetched and handed to the FontFace API), OpenFreeMap's TileJSON and tiles (the fixtures, at their
// real URLs: the one third-party connect-src) and the locate button: no violation.
test('the trip map: its worker, fonts, tiles and the location dot, no CSP violation', async ({ page, context }) => {
  test.setTimeout(60_000);
  const seen = await watch(page);
  await mapsDrawn(page); // (the map made; the island needn't draw)
  const net = await fixtureTiles(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 26.6944, longitude: 127.8779, accuracy: 25 });
  await gotoTrip(page);
  await mapReady(page);
  await page.locator('dialog[open] .locate').click();
  await expect(page.locator('dialog[open] .locate')).toHaveAttribute('data-locate', 'on');
  // the labels drawn: their font slices fetched
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').some((r) => /zen-maru-gothic-.+-700-normal.*\.woff2/.test(r.name)))).toBe(true);
  await page.waitForTimeout(1000); // hold: proves no CSP violation follows the map's draw
  expect(net.tiles.length).toBeGreaterThan(0);
  expect(net.stray).toEqual([]);
  expect(seen).toEqual([]);
});
