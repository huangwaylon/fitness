// Memory leaks across the scenes (docs/ops/testing.md "Memory"): the PWA stays open for days, so going in and out of
// the rooms and the home picker must leave nothing behind. Each WebGL context made is watched (a WeakRef: alive only
// while something still holds its canvas), and the window's and document's listeners counted, after a forced GC
// (Chromium's CDP, hence @chromium). Before the fixes: one more context a home picker opened (three's dispose listeners
// on the cached home models held the picker's renderer), one more an /editor visit (and a document keydown listener),
// one more and ~700 DOM nodes a すがた visit (the page-wide white stand-in texture's listeners: world3d/stage.ts).
import { expect, test, type Page } from './fixtures.ts';
import { BASE } from './island.ts';
import { drawn, fixtureTiles, mapReady, openTrip, tripsSheet } from './trips.ts';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00&as=B';
/** A blank topo tile (トレイル's map: hiking.spec's). */
const TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

/** WebGL contexts alive (all; `map`: the trip map's, a `maplibregl-canvas`'s) and window/document listeners. */
type Probe = { gl: number; map: number; ls: number; fonts: number; nodes: number };
async function watch(page: Page) {
  await page.addInitScript(() => {
    const gls: WeakRef<object>[] = [], maps: WeakRef<object>[] = [];
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...a: unknown[]) {
      const c = (get as (...x: unknown[]) => RenderingContext | null).apply(this, a);
      if (c && String(a[0]).startsWith('webgl') && !gls.some((r) => r.deref() === c)) {
        gls.push(new WeakRef(c));
        // MapLibre names its canvas before it asks for the context
        if (this.classList.contains('maplibregl-canvas')) maps.push(new WeakRef(c));
      }
      return c;
    } as typeof get;
    // the window's and document's listeners, net (one per listener, type and phase)
    const on = new WeakMap<object, Set<string>>();
    let n = 0;
    const add = EventTarget.prototype.addEventListener, rem = EventTarget.prototype.removeEventListener;
    const key = (t: EventTarget, type: string, o: unknown) => `${t === window ? 'w' : 'd'}:${type}:${typeof o === 'boolean' ? o : !!(o as { capture?: boolean } | undefined)?.capture}`;
    EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, f: unknown, o?: unknown) {
      if (f && (this === window || this === document)) {
        const s = on.get(f as object) ?? new Set<string>(), k = key(this, type, o);
        if (!s.has(k)) (s.add(k), on.set(f as object, s), n++);
      }
      return add.call(this, type, f as EventListener, o as AddEventListenerOptions);
    };
    EventTarget.prototype.removeEventListener = function (this: EventTarget, type: string, f: unknown, o?: unknown) {
      const s = f && (this === window || this === document) ? on.get(f as object) : null, k = key(this, type, o);
      if (s?.delete(k)) n--;
      return rem.call(this, type, f as EventListener, o as EventListenerOptions);
    };
    (window as unknown as { __leaks: () => Omit<Probe, 'nodes'> }).__leaks = () => ({ gl: gls.filter((r) => r.deref()).length, map: maps.filter((r) => r.deref()).length, ls: n, fonts: document.fonts.size });
  });
}
async function measure(page: Page): Promise<Probe> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage');
  // (the DOM nodes alive, in the document or detached and still held)
  const { metrics } = await cdp.send('Performance.getMetrics');
  await cdp.detach();
  // (a WeakRef's target is collected only after the task that last read it: read in a fresh one)
  await page.evaluate(() => new Promise((ok) => setTimeout(ok, 50)));
  const p = await page.evaluate(() => (window as unknown as { __leaks: () => Omit<Probe, 'nodes'> }).__leaks());
  return { ...p, nodes: metrics.find((m) => m.name === 'Nodes')?.value ?? 0 };
}

/** The app's own navigation (a link's click: SvelteKit's router), as a door does. */
const nav = (page: Page, path: string) => page.evaluate((h) => {
  const a = document.createElement('a');
  a.href = h;
  document.body.append(a);
  a.click();
  a.remove();
}, path);
const islandUp = (page: Page) => page.waitForFunction(() => !!(window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 30_000 });
const framed = (page: Page, hook: '__tent' | '__museum') =>
  page.waitForFunction((h) => ((window as unknown as Record<string, { stats(): { frames: number } } | undefined>)[h]?.stats()?.frames ?? 0) > 1, hook, { timeout: 30_000 });

test('the rooms and the home picker, in and out: no WebGL context or window listener left behind', { tag: '@chromium' }, async ({ page }) => {
  test.setTimeout(120_000);
  await watch(page);
  await page.goto(Q);
  await islandUp(page);
  const back = async () => (await nav(page, `${BASE}/${Q}`), await islandUp(page));
  const trips = async () => {
    await nav(page, `${BASE}/shop${Q}`);
    await expect(page.locator('[data-shop]')).toBeVisible();
    await back();
    await nav(page, `${BASE}/museum${Q}`);
    await framed(page, '__museum');
    await back();
    // うめ's house, as うめ: いえを かえる opened, two homes previewed, closed
    await nav(page, `${BASE}/tent${Q}&home=B`);
    await framed(page, '__tent');
    for (let i = 0; i < 2; i++) {
      await page.locator('[data-home-look]').click();
      const models = page.locator('[data-home-picker] [data-model]');
      await expect(models.first()).toBeVisible();
      for (const k of [1, 0]) await models.nth(k).click();
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-home-picker]')).toHaveCount(0);
    }
    await back();
  };
  await trips();
  const first = await measure(page);
  for (let i = 0; i < 2; i++) await trips();
  const after = await measure(page);
  // the island's own context (and at most one an earlier island's, held a while by the page): never one a trip
  // (1 here; 2 before a lazy chunk's CSS link stopped holding the first island; before the picker's fix, 5 after one
  // round and 11 after three)
  expect(first.gl, 'WebGL contexts alive after one round').toBeLessThanOrEqual(2);
  expect(after.gl, 'WebGL contexts alive after three').toBeLessThanOrEqual(first.gl);
  expect(after.ls, 'window and document listeners').toBeLessThanOrEqual(first.ls);
});

// すがた (docs/design.md "すがた"): せってい → すがた, its 3D stage up, two tops worn and いつもの, back
// and closed, twice, as ウェイ. Its renderer goes with it (before world3d/stage.ts endRenderer: one context and ~700 DOM
// nodes more a visit, held by the page-wide white stand-in texture's dispose listeners).
test('すがた in and out, dressed: no WebGL context, listener or DOM node left behind', { tag: '@chromium' }, async ({ page }) => {
  await watch(page);
  // (as ウェイ: his island's player is NH's human player, so the island and the stage share player3d's textures)
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandUp(page);
  const sheet = page.locator('dialog[open]').first();
  const live: number[] = [];
  const round = async () => {
    await fromMenu(page, 'settings');
    await sheet.locator('[data-push=look]').click();
    await expect(sheet.locator('[data-look-preview][data-look-3d=on]')).toBeVisible({ timeout: 30_000 });
    live.push((await measure(page)).gl);
    await sheet.locator('[data-look-tab=wear]').click();
    const tops = sheet.locator('[data-closet=top] [data-item]:not([data-item=none])');
    for (const k of [1, 2]) await tops.nth(k).click();
    await sheet.locator('[data-look-tab=coord]').click();
    await sheet.locator('[data-look-chip="usual"]').click();
    await sheet.locator('.titlebar .back').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  };
  await round();
  const first = await measure(page);
  await round();
  const after = await measure(page);
  // (the island's and the stage's while it's open: 2 each visit)
  expect(live, 'WebGL contexts alive in すがた').toEqual([2, 2]);
  expect(after.gl, 'WebGL contexts alive after two').toBeLessThanOrEqual(first.gl);
  expect(after.ls, 'window and document listeners').toBeLessThanOrEqual(first.ls);
  // (a few: the island's own life between rounds; a visit's whole page was ~700)
  expect(after.nodes - first.nodes, 'DOM nodes alive, attached or not').toBeLessThan(100);
});

// The museum (docs/design.md "The museum", "First person"): in first person and out, the eye button on and off, a
// bench sat on and left. In the museum only its own context is alive, the island it came from gone (before the fixes
// one more: the island's hooks, its sleep clock and a lazy chunk's CSS link held a whole island, its DOM and context).
test('the museum in first person and out, the eye button, a bench: no context or listener left, the island gone inside', { tag: '@chromium' }, async ({ page }) => {
  test.setTimeout(120_000);
  /** A function of the museum's hooks (MuseumRoom.svelte hooks()), its value. */
  const mu = <T>(fn: string) => page.evaluate(`(${fn})(window.__museum)`) as Promise<T>;
  await watch(page);
  await page.goto(Q);
  await islandUp(page);
  const back = async () => (await nav(page, `${BASE}/${Q}`), await islandUp(page));
  const inside: number[] = [];
  // the eye button: on (at the eyes) or off (the room's camera)
  const eye = async (on: boolean) => {
    await page.locator('[data-fpv]').click();
    await expect.poll(() => mu<boolean>(`m => (f => !!f && f.on === ${on} && f.inside === ${on} && !f.busy)(m.fpv())`), { timeout: 15_000 }).toBe(true);
  };
  const round = async () => {
    await nav(page, `${BASE}/museum${Q}`);
    await framed(page, '__museum');
    await eye(true);
    await back();
    // in again: in first person from the first frame (kept on this phone), then off
    await nav(page, `${BASE}/museum${Q}`);
    await framed(page, '__museum');
    await expect.poll(() => mu<boolean>('m => !!m.fpv()?.inside && !m.fpv().busy'), { timeout: 15_000 }).toBe(true);
    await eye(false);
    // a bench: a tap sits my villager on it, a tap on the floor gets it up
    await page.evaluate('window.__museum.put(150, 10)');
    await expect.poll(() => mu<boolean>('m => m.still()'), { timeout: 10_000 }).toBe(true);
    const [bx, by] = await mu<[number, number]>('m => m.benchPx("dmbench1", 0)');
    await page.mouse.click(bx, by);
    await expect.poll(() => mu<boolean>('m => !!m.seat() && m.still()'), { timeout: 15_000 }).toBe(true);
    const [fx, fy] = await mu<[number, number]>('m => m.px(150, 15)');
    await page.mouse.click(fx, fy);
    await expect.poll(() => mu<boolean>('m => !m.seat() && m.still()'), { timeout: 15_000 }).toBe(true);
    inside.push((await measure(page)).gl);
    await back();
  };
  await round();
  const first = await measure(page);
  for (let i = 0; i < 2; i++) await round();
  const after = await measure(page);
  expect(inside, 'WebGL contexts alive in the museum (its own only)').toEqual([1, 1, 1]);
  expect(after.gl, 'WebGL contexts alive after three').toBeLessThanOrEqual(first.gl);
  expect(after.ls, 'window and document listeners').toBeLessThanOrEqual(first.ls);
});

// The trip map (docs/travel.md "Maps"), drawn: in and out three times (its trip's ちず in the trips' sheet on the
// island, then the shop, a page without WebGL, between). Its context goes with it (map.remove() loses it; before engine.ts read the workers' abort Error's stack, that Error held
// the last map and its context till the next), and so do its listeners (MapLibre's one page-wide visibilitychange
// listener, added with the first map, stays: none more after it).
test('the trip map in and out: no WebGL context or window listener left behind', { tag: '@chromium' }, async ({ page }) => {
  test.setTimeout(120_000);
  await watch(page);
  await drawn(page);
  await fixtureTiles(page);
  await page.goto(`${BASE}/shop${Q}`);
  await expect(page.locator('[data-shop]')).toBeVisible();
  const made: number[] = [];
  const round = async () => {
    await nav(page, `${BASE}/${Q}`);
    await openTrip(page);
    await mapReady(page);
    made.push((await page.evaluate(() => (window as unknown as { __leaks: () => Probe }).__leaks())).map);
    await page.locator('dialog[open] [data-map-day="2"]').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await nav(page, `${BASE}/shop${Q}`);
    await expect(page.locator('[data-shop]')).toBeVisible();
  };
  await round();
  const first = await measure(page);
  for (let i = 0; i < 2; i++) await round();
  const after = await measure(page);
  // each round's map had its context (the probe sees them), and none outlives its sheet; the rest (at most an
  // island's, held a while by the page, as in the island's own rounds above) doesn't grow
  expect(made.map((n) => n >= 1), "the map's context seen while it is open").toEqual([true, true, true]);
  expect([first.map, after.map], 'map contexts alive after the map closed').toEqual([0, 0]);
  expect(after.gl, 'WebGL contexts alive after three').toBeLessThanOrEqual(first.gl);
  expect(after.ls, 'window and document listeners').toBeLessThanOrEqual(first.ls);
});

// The info sheets (りょこう, けっこんしき, トレイル: docs/design.md "Unified kit"), drawn, in and out three times on the
// island: NZ's pages (its map on the fixture tiles), Okinawa's 地図 (Motobu's labels drawn in Zen Maru; its campsites on),
// a wedding task opened and メモ, three trails' maps (a blank topo tile). After each round no map's context, no listener,
// no font face and no DOM node more than after the first (before remove.ts: each guide's map left its ~19 Zen Maru
// faces in document.fonts, each holding its woff2, 171 → 235 over three).
test('the info sheets in and out (the trips, Okinawa’s map and campsites, the wedding board, three trails): nothing left behind', { tag: '@chromium' }, async ({ page }) => {
  test.setTimeout(180_000);
  await watch(page);
  await drawn(page);
  await fixtureTiles(page);
  await page.route(/^https:\/\/(basemap\.nationalmap\.gov|cyberjapandata\.gsi\.go\.jp)\//, (r) => r.fulfill({ contentType: 'image/png', body: TILE, headers: { 'access-control-allow-origin': '*' } }));
  await page.goto(Q);
  await islandUp(page);
  const sheet = page.locator('dialog[open]');
  const closed = async () => (await page.keyboard.press('Escape'), await expect(sheet).toHaveCount(0));
  const trailUp = () => expect.poll(() => page.evaluate(() => (window as unknown as { __trailMap?: { state(): { mode: string } } }).__trailMap?.state().mode), { timeout: 30_000 }).toBe('ready');
  const round = async () => {
    // NZ: each page, the map's drawn; ‹ to the passes; Okinawa's 地図 drawn with its campsites, a camp's card, キャンプ場, ‹
    await openTrip(page, 'nz', 'days');
    for (const tab of ['map', 'pack', 'days']) {
      await tripsSheet(page).locator(`[data-trip-tab="${tab}"]`).click();
      await expect(tripsSheet(page).locator(`[data-pane="${tab}"]`)).toBeVisible();
      if (tab === 'map') await mapReady(page);
    }
    await sheet.locator('.navbar .back').click();
    await tripsSheet(page).locator('[data-trip="okinawa"]').click();
    await sheet.locator('[data-trip-tab="map"]').click();
    await mapReady(page);
    await sheet.locator('[data-map-layers]').click();
    await sheet.locator('[data-map-layer="camp"]').click();
    await tripsSheet(page).locator('[data-trip-tab="camps"]').click();
    await tripsSheet(page).locator('[data-camp]').first().click();
    await expect(page.locator('dialog[open] [data-camp-sheet]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open] [data-camp-sheet]')).toHaveCount(0);
    await tripsSheet(page).locator('[data-trip-tab="days"]').click();
    await sheet.locator('.navbar .back').first().click();
    await expect(tripsSheet(page).locator('[data-trip]').first()).toBeVisible();
    await closed();
    // the wedding board: a task opened, メモ, back to the plan
    await fromMenu(page, 'wedding');
    await sheet.locator('[data-wed-task] .head').first().click();
    await sheet.locator('[data-wed-tab="notes"]').click();
    await expect(sheet.locator('[data-wed-tab="notes"]')).toHaveAttribute('aria-current', 'page');
    await sheet.locator('[data-wed-tab="plan"]').click();
    await closed();
    // three trails, each its map drawn, ‹ between
    await fromMenu(page, 'hiking');
    for (const k of [0, 1, 2]) {
      await sheet.locator('[data-trail]').nth(k).click();
      await trailUp();
      await sheet.locator('[data-trail-view] .nav.back').click();
      await expect(sheet.locator('[data-trail-list]')).toBeVisible();
    }
    await closed();
  };
  await round();
  const first = await measure(page);
  for (let i = 0; i < 2; i++) await round();
  const after = await measure(page);
  expect([first.map, after.map], 'map contexts alive after the sheets closed').toEqual([0, 0]);
  expect(after.gl, 'WebGL contexts alive after three').toBeLessThanOrEqual(first.gl);
  expect(after.ls, 'window and document listeners').toBeLessThanOrEqual(first.ls);
  expect(after.fonts, "the maps' font faces in document.fonts").toBeLessThanOrEqual(first.fonts);
  // (a few: the island's own life between rounds)
  expect(after.nodes - first.nodes, 'DOM nodes alive, attached or not').toBeLessThan(100);
});
