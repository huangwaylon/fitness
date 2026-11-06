// The site's Content-Security-Policy (scripts/headers.ts: build-pages/_headers, served by serve-build.ts as Cloudflare
// Pages serves it; the same policy in index.html's <meta>, vite.config.ts `csp`): a click-through of the island, its
// sheets, the music, the shop, the museum, the tent, the editor and the trip map with no violation (every `securitypolicyviolation`
// event and every console line of a refused load, the page's and its workers').
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { is3d, islandQuery } from './island.ts';
import { drawn, fixtureTiles, gotoTrip, mapReady } from './trips.ts';

const Q = islandQuery('demo&date=2026-11-04T12:00');

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

/** The app's own navigation (a link's click: SvelteKit's router), as a door does. */
const nav = (page: Page, path: string) => page.evaluate((h) => {
  const a = document.createElement('a');
  a.href = h;
  document.body.append(a);
  a.click();
  a.remove();
}, path);
const framed = (page: Page, hook: string) =>
  page.waitForFunction((h) => ((window as unknown as Record<string, { stats(): { frames: number } } | undefined>)[h]?.stats()?.frames ?? 0) > 1, hook, { timeout: 30_000 });

test('the island, its sheets, the music and the rooms: no CSP violation', async ({ page }) => {
  test.setTimeout(120_000);
  const seen = await watch(page);
  const audio: string[] = [];
  page.on('request', (r) => r.url().includes('/audio/') && audio.push(r.url()));
  await page.goto(Q);
  await expect.poll(() => is3d(page), { timeout: 30_000 }).toBe(true);
  // the first tap unlocks the sound: the hour's music plays (from a blob: URL)
  const s = (await page.locator('.if-scene').boundingBox())!;
  await page.mouse.click(s.x + s.width / 2, s.y + 60);
  await expect.poll(() => audio.some((u) => u.includes('/audio/music/'))).toBe(true);
  for (const which of ['bells', 'zukan', 'travel', 'settings'] as const) {
    await fromMenu(page, which);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }
  for (const name of ['けんこう', 'ごはん']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }
  await nav(page, `shop${Q}`);
  await expect(page.locator('[data-shop]')).toBeVisible();
  await nav(page, `museum${Q}`);
  await framed(page, '__museum');
  await nav(page, `tent${Q}`);
  await framed(page, '__tent');
  await nav(page, `editor/${Q}`);
  await page.waitForFunction(() => !!(window as unknown as { __editor?: unknown }).__editor, null, { timeout: 30_000 });
  await page.waitForTimeout(1000);
  expect(seen).toEqual([]);
});

// The trip map (docs/travel.md "Maps"): drawn (not the logic tier's stub), its worker (our own file), its fonts (the
// app's woff2 slices, fetched and handed to the FontFace API), OpenFreeMap's TileJSON and tiles (the fixtures, at their
// real URLs: the one third-party connect-src) and the locate button: no violation.
test('the trip map: its worker, fonts, tiles and the location dot, no CSP violation', async ({ page, context }) => {
  test.setTimeout(60_000);
  const seen = await watch(page);
  await drawn(page);
  const net = await fixtureTiles(page);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 26.6944, longitude: 127.8779, accuracy: 25 });
  await gotoTrip(page);
  await mapReady(page);
  await page.locator('dialog[open] [data-map-layer="camp"]').click();
  await page.locator('dialog[open] .locate').click();
  await expect(page.locator('dialog[open] .locate')).toHaveAttribute('data-locate', 'on');
  // the labels drawn: their font slices fetched
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').some((r) => /zen-maru-gothic-.+-700-normal.*\.woff2/.test(r.name)))).toBe(true);
  await page.waitForTimeout(1000); // hold: proves no CSP violation follows the map's draw
  expect(net.tiles.length).toBeGreaterThan(0);
  expect(net.stray).toEqual([]);
  expect(seen).toEqual([]);
});
