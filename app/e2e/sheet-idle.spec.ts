// Under a full-height sheet (けんこう, ごはん, ずかん, せってい: docs/design.md "Island scene") the island does nothing: the 3D island
// draws no frame (its engine paused) and no CSS animation runs in the page but the sheet's own, so nothing behind the
// sheet asks the compositor for frames while someone reads their charts; closed, the island runs again.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, openKenkou } from './hud.ts';
import { pauseNow } from './island.ts';
import { drawn, fixtureTiles, mapReady } from './trips.ts';

/** A blank topo tile (トレイル's map: hiking.spec's). */
const TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

type W3 = { loaded(): boolean; stats(): { frames: number; paused: boolean } };
const w3 = <R,>(page: Page, fn: (w: W3) => R) => page.evaluate(`(${fn.toString()})(window.__world3d)`) as Promise<R>;
const sheet = (page: Page) => page.locator('dialog[open]');
/** The CSS animations running outside the open sheet (its own zoom has played). */
const runningBehind = (page: Page) => page.evaluate(() => document.getAnimations()
  .filter((a) => a.playState === 'running' && !(a.effect as KeyframeEffect | null)?.target?.closest('dialog[open]'))
  .map((a) => `${(a as CSSAnimation).animationName ?? a.constructor.name} on .${String(((a.effect as KeyframeEffect).target as Element).className).split(' ')[0]}`));

/** The HUD's own sheets: how each opens, and what shows once it's up. */
const hudSheets: [string, (page: Page) => Promise<unknown>, string][] = [
  ['けんこう', (page) => page.getByRole('button', { name: 'けんこう', exact: true }).click(), '.health .mc'],
  ['ごはん', (page) => openKenkou(page, 'food'), '[data-food-summary]'],
  ['ずかん', (page) => fromMenu(page, 'zukan'), '[data-zukan-sheet]'],
  ['せってい', (page) => fromMenu(page, 'settings'), '[data-settings]']
];
for (const [name, open, ready] of hudSheets)
  test(`under ${name} the island draws no frames and no animation runs behind the sheet; closed, it draws again`, async ({ page }) => {
    await page.goto('?demo&date=2026-11-04T12:30');
    await page.waitForFunction(() => (window as unknown as { __world3d?: W3 }).__world3d?.loaded(), null, { timeout: 30_000 });
    await open(page);
    await expect(sheet(page).locator(ready).first()).toBeVisible();
    await sheet(page).evaluate((d) => Promise.all(d.getAnimations().map((a) => a.finished)));
    expect(await w3(page, (w) => w.stats().paused)).toBe(true);
    const f0 = await w3(page, (w) => w.stats().frames);
    await page.waitForTimeout(1500);
    expect(await w3(page, (w) => w.stats().frames)).toBe(f0);
    expect(await runningBehind(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);
    await expect.poll(() => w3(page, (w) => w.stats().frames)).toBeGreaterThan(f0);
  });

// The info sheets (りょこう, けっこんしき, トレイル: docs/design.md "Unified kit"), each at rest on its busiest page (NZ's
// map and a trail's, drawn on fixture tiles): the island draws no frame under it, nothing behind it animates, and the
// page asks for no animation frame but the map's own (a tile in late on a slow runner, its fade: MapLibre's chunks,
// vite.config.ts maplibre-names): no loop left running, nothing kicking the paused island.
const infoSheets = {
  travel: async (page: Page) => { await page.locator('dialog[open] [data-trip="nz"]').click(); await page.locator('dialog[open] [data-trip-tab="map"]').click(); await mapReady(page); },
  wedding: async (page: Page) => { await page.locator('dialog[open] [data-wed-task] .head').first().click(); },
  hiking: async (page: Page) => {
    await page.locator('dialog[open] [data-trail]').first().click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __trailMap?: { state(): { mode: string } } }).__trailMap?.state().mode), { timeout: 30_000 }).toBe('ready');
  }
} as const;
/** Non-MapLibre animation frames asked for so far (the probe below). */
const rafs = (page: Page) => page.evaluate(() => (window as unknown as { __rafs: string[] }).__rafs.length);
for (const [k, settle] of Object.entries(infoSheets))
  test(`under ${k}'s sheet at rest the island draws no frames, nothing animates behind it, no frame is asked for`, async ({ page }) => {
    // the page's clock ours (it runs as it loads, paused for the proof), installed first so the probe wraps its rAF
    await page.clock.install({ time: new Date('2026-11-04T12:30:00+09:00') });
    await page.addInitScript(() => {
      // (each one's caller, MapLibre's left out)
      const W = window as unknown as { __rafs: string[] }, raf = window.requestAnimationFrame.bind(window);
      W.__rafs = [];
      window.requestAnimationFrame = (f) => {
        const at = new Error().stack?.split('\n').slice(2, 6).join(' | ') ?? '';
        if (!/\/maplibre\.[\w-]+\.js/.test(at)) W.__rafs.push(at);
        return raf(f);
      };
    });
    await drawn(page);
    await fixtureTiles(page);
    await page.route(/^https:\/\/(basemap\.nationalmap\.gov|cyberjapandata\.gsi\.go\.jp)\//, (r) => r.fulfill({ contentType: 'image/png', body: TILE, headers: { 'access-control-allow-origin': '*' } }));
    await page.goto('?demo&date=2026-11-04T12:30');
    await page.waitForFunction(() => (window as unknown as { __world3d?: W3 }).__world3d?.loaded(), null, { timeout: 30_000 });
    expect(await rafs(page), 'the probe sees the island\'s frames').toBeGreaterThan(0);
    await fromMenu(page, k as 'travel' | 'wedding' | 'hiking');
    await settle(page);
    await sheet(page).evaluate((d) => Promise.all(d.getAnimations().map((a) => a.finished)));
    // the clock paused: from here the page's time moves only as stepped. At rest once a second and a half of it asks
    // for no frame (the map's last tiles in and faded, the villagers' turn to the menu's tap (R18) over: however long
    // a loaded runner took), then a second and a half more asks for none (a loop never gets there)
    await pauseNow(page);
    for (let i = 0, n = await rafs(page); ; i++) {
      expect(i, 'at rest within 12 s of the page\'s time').toBeLessThan(8);
      await page.clock.runFor(1500);
      const now = await rafs(page);
      if (now === n) break;
      n = now;
    }
    expect(await w3(page, (w) => w.stats().paused)).toBe(true);
    const f0 = await w3(page, (w) => w.stats().frames), r0 = await rafs(page);
    await page.clock.runFor(1500);
    expect(await w3(page, (w) => w.stats().frames)).toBe(f0);
    expect(await page.evaluate((n) => (window as unknown as { __rafs: string[] }).__rafs.slice(n), r0), 'animation frames asked for at rest (by whom)').toEqual([]);
    // (CSS animations run on the compositor's own time, not the page's clock: one that ends is let end; one that loops
    // never does)
    await expect.poll(() => runningBehind(page)).toEqual([]);
    await expect.poll(() => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a as CSSAnimation).animationName ?? a.constructor.name)), { message: 'animations running at all' }).toEqual([]);
  });
