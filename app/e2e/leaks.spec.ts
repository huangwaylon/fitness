// Memory leaks across the scenes (docs/ops/testing.md "Memory"): the PWA stays open for days, so going in and out of
// the rooms and the home picker must leave nothing behind. Each WebGL context made is watched (a WeakRef: alive only
// while something still holds its canvas), and the window's and document's listeners counted, after a forced GC
// (Chromium's CDP, hence @chromium). Before the fixes: one more context a home picker opened (three's dispose listeners
// on the cached home models held the picker's renderer), one more an /editor visit (and a document keydown listener),
// one more and ~700 DOM nodes a すがた visit (the page-wide white stand-in texture's listeners: world3d/stage.ts).
import { expect, test, type Page } from './fixtures.ts';
import { BASE } from './island.ts';
import { fixtureTiles, mapReady, mapsDrawn, openTrip, tripsSheet } from './trips.ts';
import { fromMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00&as=B';
/** A blank topo tile (トレイル's map: hiking.spec's). */
const TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

/** WebGL contexts alive (all; `map`: the trip map's, a `maplibregl-canvas`'s) and window/document listeners; `ab` the
 *  ArrayBuffers' bytes (MB: typed arrays, decoded models and images; outside the JS heap, `heap`) and `emb` Blink's own
 *  (decoded images, MB). */
type Probe = { gl: number; map: number; ls: number; fonts: number; nodes: number; ab: number; heap: number; emb: number };
type Leaks = Omit<Probe, 'nodes' | 'ab' | 'heap' | 'emb'>;
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
    (window as unknown as { __leaks: () => Leaks }).__leaks = () => ({ gl: gls.filter((r) => r.deref()).length, map: maps.filter((r) => r.deref()).length, ls: n, fonts: document.fonts.size });
  });
}
async function measure(page: Page): Promise<Probe> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage');
  // (the DOM nodes alive, in the document or detached and still held)
  const { metrics } = await cdp.send('Performance.getMetrics');
  // (the ArrayBuffers' bytes: JSHeapUsedSize leaves them out, and on the island they're most of the page's memory)
  const hu = (await cdp.send('Runtime.getHeapUsage')) as { usedSize: number; backingStorageSize?: number; embedderHeapUsedSize?: number };
  await cdp.detach();
  // (a WeakRef's target is collected only after the task that last read it: read in a fresh one)
  await page.evaluate(() => new Promise((ok) => setTimeout(ok, 50)));
  const p = await page.evaluate(() => (window as unknown as { __leaks: () => Leaks }).__leaks());
  const mb = (n = 0) => Math.round(n / 1e4) / 100;
  return { ...p, nodes: metrics.find((m) => m.name === 'Nodes')?.value ?? 0, ab: mb(hu.backingStorageSize), heap: mb(hu.usedSize), emb: mb(hu.embedderHeapUsedSize) };
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
const framed = (page: Page, hook: '__tent' | '__museum' | '__shop') =>
  page.waitForFunction((h) => ((window as unknown as Record<string, { stats(): { frames: number } } | undefined>)[h]?.stats()?.frames ?? 0) > 1, hook, { timeout: 30_000 });

test('the rooms and the home picker, in and out: no WebGL context or window listener left behind', { tag: '@chromium' }, async ({ page }) => {
  test.setTimeout(120_000);
  await watch(page);
  await page.goto(Q);
  await islandUp(page);
  const back = async () => (await nav(page, `${BASE}/${Q}`), await islandUp(page));
  /** The contexts alive in each room: its own only (the island's gone with its renderer). */
  const inRoom: number[] = [];
  const trips = async () => {
    // the shop: its room (the twins, the day's stock) up, a piece's card and the counter's list opened
    await nav(page, `${BASE}/shop${Q}`);
    await framed(page, '__shop');
    inRoom.push((await measure(page)).gl);
    await page.waitForFunction(() => !!(window as unknown as { __shop?: object }).__shop);
    await page.evaluate(() => (window as unknown as { __shop: { talk(): void } }).__shop.talk());
    await page.locator('[data-shop-tab="buy"]').click();
    await page.locator('[data-shop-close]').click();
    await back();
    await nav(page, `${BASE}/museum${Q}`);
    await framed(page, '__museum');
    inRoom.push((await measure(page)).gl);
    await back();
    // うめ's house, as うめ: いえを かえる opened, two homes previewed, closed
    await nav(page, `${BASE}/tent${Q}&home=B`);
    await framed(page, '__tent');
    inRoom.push((await measure(page)).gl);
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
  // the island's own context: never one a trip (2 before a lazy chunk's CSS link stopped holding the first island;
  // before the picker's fix, 5 after one round and 11 after three); in a room the room's alone (2 before things.ts
  // freed every cached model's textures with the island: a lazy find's held the dead island's renderer)
  expect(inRoom, 'WebGL contexts alive in the shop, the museum and the tent').toEqual(inRoom.map(() => 1));
  expect(first.gl, 'WebGL contexts alive after one round').toBe(1);
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
// bench sat on and left, its lazy wings woken (the fossils', the art's and the sea creatures', each with a find on
// show: their packs fetched and drawn). In the museum only its own context is alive, the island it came from gone
// (before the fixes one more: the island's hooks, its sleep clock and a lazy chunk's CSS link held a whole island, its
// DOM and context).
test('the museum in first person and out, the eye button, a bench, its fossils, art and sea creatures: no context or listener left, the island gone inside', { tag: '@chromium' }, async ({ page }) => {
  test.setTimeout(150_000);
  await page.addInitScript(() => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse('2026-11-04T09:00:00+09:00');
    const finds = [['fossil', 't-rex-skull'], ['fossil', 'amber'], ['item', 'famous-painting'], ['item', 'gallant-statue'], ['sea', 'octopus'], ['sea', 'sea-star']];
    const events = finds.map(([kind, id], i) => ({ id: `seed-${i}`, type: 'find', data: { kind, id }, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person: 'A' }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events }));
  });
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
    await page.evaluate("window.__museum.spot('room:fish').then(([x, z]) => window.__museum.put(x, z))");
    await expect.poll(() => mu<boolean>('m => m.still()'), { timeout: 10_000 }).toBe(true);
    const [bx, by] = await mu<[number, number]>('m => m.benchPx("dmbench1", 0)');
    await page.mouse.click(bx, by);
    await expect.poll(() => mu<boolean>('m => !!m.seat() && m.still()'), { timeout: 15_000 }).toBe(true);
    const [fx, fy] = await page.evaluate("window.__museum.spot('room:fish').then(([x, z]) => window.__museum.px(x, z))") as [number, number];
    await page.mouse.click(fx, fy);
    await expect.poll(() => mu<boolean>('m => !m.seat() && m.still()'), { timeout: 15_000 }).toBe(true);
    // the lazy wings: each woken where it is, its finds drawn
    for (const [name, id] of [['fossil:t-rex-skull', 't-rex-skull'], ['art:famous-painting', 'famous-painting'], ['tank:reef', 'octopus']] as const) {
      await page.evaluate(`window.__museum.spot('${name}').then(([x, z]) => window.__museum.put(x, z))`);
      await expect.poll(() => mu<boolean>(`m => m.shown().includes("${id}") && !m.stats().loading && m.still()`), { timeout: 20_000 }).toBe(true);
    }
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
// island, then the shop between: a page off the island). Its context goes with it (map.remove() loses it; before engine.ts read the workers' abort Error's stack, that Error held
// the last map and its context till the next), and so do its listeners (MapLibre's one page-wide visibilitychange
// listener, added with the first map, stays: none more after it).
test('the trip map in and out: no WebGL context or window listener left behind', { tag: '@chromium' }, async ({ page }) => {
  test.setTimeout(120_000);
  await watch(page);
  await mapsDrawn(page); // (the map made; the island needn't draw)
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
// no font face and no DOM node more than after the first (before glmap.ts removeMap: each guide's map left its ~19 Zen Maru
// faces in document.fonts, each holding its woff2, 171 → 235 over three).
test('the info sheets in and out (the trips, Okinawa’s map and campsites, the wedding board, three trails): nothing left behind', { tag: '@chromium' }, async ({ page }) => {
  test.setTimeout(180_000);
  await watch(page);
  await mapsDrawn(page); // (the maps made; the island needn't draw: on a 2-core runner, drawn, this ran past its time)
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

/** ArrayBuffer growth's note on the test (MB: the report's numbers, before → after). */
const note = (what: string, a: Probe, b: Probe) =>
  test.info().annotations.push({ type: 'memory', description: `${what}: ArrayBuffers ${a.ab} → ${b.ab} MB, JS heap ${a.heap} → ${b.heap} MB, Blink ${a.emb} → ${b.emb} MB` });

// The editor (docs/island-layout.md "The editor") with its 3D preview: four strokes painted, each a new layout the
// preview builds its ground for (layout/fields.ts: ~4 MB of rasters a layout). Undo keeps each action, never the
// layouts it went between: a layout held by the history held its fields too (before the fix ~9 MB a stroke: 27.6 →
// 116.4 MB of ArrayBuffers after ten, ~1.8 GB at the history's 200). (Four: on CI's two cores a stroke's ground takes ~3 s.)
test.describe('the editor', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('with its 3D preview, four strokes painted: no layout’s fields kept by the history', { tag: '@chromium' }, async ({ page }) => {
    await watch(page);
    await page.goto('editor/?demo&date=2026-11-04T12:00');
    type H = { __editor?: { tileScreen(c: number, r: number): [number, number]; layout(): { kind(c: number, r: number): string } }; __preview3d?: { frames(): number } };
    await page.waitForFunction(() => !!(window as unknown as H).__editor && ((window as unknown as H).__preview3d?.frames() ?? 0) > 0, null, { timeout: 60_000 });
    await page.getByRole('button', { name: '塗る' }).click();
    const kind = (c: number, r: number) => page.evaluate(([c, r]) => (window as unknown as H).__editor!.layout().kind(c, r), [c, r] as const);
    /** A stroke over three tiles of row `r` in `brush`, its new layout drawn by the preview. */
    const stroke = async (r: number, brush: string) => {
      await page.locator(`[data-brush="${brush}"]`).click();
      const f0 = await page.evaluate(() => (window as unknown as H).__preview3d!.frames());
      const [a, b] = await page.evaluate(([r]) => [(window as unknown as H).__editor!.tileScreen(5, r), (window as unknown as H).__editor!.tileScreen(7, r)], [r] as const);
      await page.mouse.move(a[0], a[1]);
      await page.mouse.down();
      for (let i = 1; i <= 6; i++) await page.mouse.move(a[0] + ((b[0] - a[0]) * i) / 6, a[1]);
      await page.mouse.up();
      await expect.poll(() => kind(6, r)).toBe(brush);
      await page.waitForFunction((f) => (window as unknown as H).__preview3d!.frames() > f, f0, { timeout: 30_000 });
    };
    // (rows of grass by the plaza: sand on two, then grass back on them, each stroke a change)
    const rows = [12, 13];
    expect(await Promise.all(rows.map((r) => kind(6, r)))).toEqual(rows.map(() => 'grass'));
    await stroke(11, 'sand');
    const first = await measure(page);
    for (const brush of ['sand', 'grass']) for (const r of rows) await stroke(r, brush);
    const after = await measure(page);
    note('the editor, four strokes', first, after);
    expect(after.ab - first.ab, 'ArrayBuffers grown over four strokes (MB)').toBeLessThan(2);
    expect(after.gl, 'WebGL contexts alive').toBeLessThanOrEqual(first.gl);
  });
});

// いえを かえる (docs/island-layout.md "Homes"): half the walls and roofs of a house and every door shown in its
// preview, the picker closed and back on the island. The preview's models and colours are the island's homes' cache
// (world3d/home.ts): the picker closed, all but the island's homes' go (before the fix every one stayed for the page's
// life: +2.0-2.4 MB of ArrayBuffers on the island after this sweep, +7.2 MB after every wall, roof and door).
test('いえを かえる’s walls, roofs and doors swept: back on the island, the previews’ models and colours let go of', { tag: '@chromium' }, async ({ page }) => {
  await watch(page);
  await page.goto(Q);
  await islandUp(page);
  const shown = page.locator('[data-home-picker] [data-home-preview]');
  /** A swatch tapped, its house built in the preview (a token of what's on show: `has`). */
  const pick = async (sel: string, has: (tokens: string[]) => boolean) => {
    await page.locator(sel).click();
    await expect.poll(async () => has(((await shown.getAttribute('data-shown')) ?? '').split(' ')), { timeout: 20_000 }).toBe(true);
  };
  /** In うめ's house, the picker opened (its house on show, then, `all`, every other wall and roof and every door), back
   *  on the island. */
  const sweep = async (all: boolean) => {
    await nav(page, `${BASE}/tent${Q}&home=B`);
    await framed(page, '__tent');
    await page.locator('[data-home-look]').click();
    await page.locator('[data-home-picker] [data-model="house"]').click();
    if (all) for (const part of ['wall', 'roof'] as const) {
      const ids = await page.locator(`[data-home-picker] [data-${part}]`).evaluateAll((bs, p) => bs.map((b) => (b as HTMLElement).dataset[p]!), part);
      for (const id of ids.filter((_, i) => i % 2 === 0)) await pick(`[data-home-picker] [data-${part}="${id}"]`, (ts) => ts.some((t) => t.endsWith(id)));
    }
    const doors = !all ? [] : await page.locator('[data-home-picker] [data-door]').evaluateAll((bs) => bs.map((b) => (b as HTMLElement).dataset.door!));
    for (const id of doors) await pick(`[data-home-picker] [data-door="${id}"]`, (ts) => ts.some((t) => t.startsWith(`${id}.`)));
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-home-picker]')).toHaveCount(0);
    await nav(page, `${BASE}/${Q}`);
    await islandUp(page);
  };
  // (the baseline after a visit with no sweep: the room's own packs and models as they stay)
  await sweep(false);
  const base = await measure(page);
  await sweep(true);
  const after = await measure(page);
  note('いえを かえる, half the walls and roofs, every door', base, after);
  expect(after.ab - base.ab, 'ArrayBuffers on the island after the sweep (MB)').toBeLessThan(1);
  expect(after.gl, 'WebGL contexts alive').toBeLessThanOrEqual(base.gl);
});
