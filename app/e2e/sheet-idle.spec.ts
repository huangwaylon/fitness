// Under a full-height sheet (けんこう, ごはん: docs/design.md "Island scene") the island does nothing: the 3D island
// draws no frame (its engine paused) and no CSS animation runs in the page but the sheet's own, so nothing behind the
// sheet asks the compositor for frames while someone reads their charts; closed, the island runs again.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';
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

for (const [name, ready] of [['けんこう', '.health .mc'], ['ごはん', '[data-food-summary]']] as const)
  test(`under ${name} the island draws no frames and no animation runs behind the sheet; closed, it draws again`, async ({ page }) => {
    await page.goto('?demo&date=2026-11-04T12:30');
    await page.waitForFunction(() => (window as unknown as { __world3d?: W3 }).__world3d?.loaded(), null, { timeout: 30_000 });
    await page.getByRole('button', { name, exact: true }).click();
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
// page asks for no animation frame at all (the maps draw only when moved; no loop left running).
const infoSheets = {
  travel: async (page: Page) => { await page.locator('dialog[open] [data-trip="nz"]').click(); await page.locator('dialog[open] [data-trip-tab="map"]').click(); await mapReady(page); },
  wedding: async (page: Page) => { await page.locator('dialog[open] [data-wed-task] .head').first().click(); },
  hiking: async (page: Page) => {
    await page.locator('dialog[open] [data-trail]').first().click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __trailMap?: { state(): { mode: string } } }).__trailMap?.state().mode), { timeout: 30_000 }).toBe('ready');
  }
} as const;
for (const [k, settle] of Object.entries(infoSheets))
  test(`under ${k}'s sheet at rest the island draws no frames, nothing animates behind it, no frame is asked for`, async ({ page }) => {
    await page.addInitScript(() => {
      const W = window as unknown as { __rafs: number }, raf = requestAnimationFrame;
      W.__rafs = 0;
      window.requestAnimationFrame = (f) => (W.__rafs++, raf(f));
    });
    await drawn(page);
    await fixtureTiles(page);
    await page.route(/^https:\/\/(basemap\.nationalmap\.gov|cyberjapandata\.gsi\.go\.jp)\//, (r) => r.fulfill({ contentType: 'image/png', body: TILE, headers: { 'access-control-allow-origin': '*' } }));
    await page.goto('?demo&date=2026-11-04T12:30&critter=none&visitor=none');
    await page.waitForFunction(() => (window as unknown as { __world3d?: W3 }).__world3d?.loaded(), null, { timeout: 30_000 });
    await fromMenu(page, k as 'travel' | 'wedding' | 'hiking');
    await settle(page);
    await page.waitForTimeout(1500); // hold: the map's last tiles in and faded, the sheet's own spring over
    await sheet(page).evaluate((d) => Promise.all(d.getAnimations().map((a) => a.finished)));
    expect(await w3(page, (w) => w.stats().paused)).toBe(true);
    const f0 = await w3(page, (w) => w.stats().frames), r0 = await page.evaluate(() => (window as unknown as { __rafs: number }).__rafs);
    await page.waitForTimeout(1500); // hold: proving no frame is drawn or asked for
    expect(await w3(page, (w) => w.stats().frames)).toBe(f0);
    expect(await page.evaluate(() => (window as unknown as { __rafs: number }).__rafs) - r0, 'animation frames asked for at rest').toBe(0);
    expect(await runningBehind(page)).toEqual([]);
    expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a as CSSAnimation).animationName ?? a.constructor.name)), 'animations running at all').toEqual([]);
  });
