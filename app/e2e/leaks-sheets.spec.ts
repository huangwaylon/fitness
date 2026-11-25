// Memory let go of by the sheets and their rooms (docs/ops/testing.md "Memory"; leaks.spec.ts has the scenes): what a
// sheet loads is let go of with it, a kept sheet (ui-state/keptSheets.ts) goes when the page is hidden (an iOS app
// switch fires only visibilitychange, never pagehide), and a round of もようがえ or the wallet leaves no
// WebGL context, listener, DOM or ArrayBuffers behind. Measured after forced GCs (e2e/memory.ts, Chromium's CDP, hence
// @chromium); the post-deploy logic tier (not the gate's set).
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { BASE, islandUp, loaded3d, nav } from './island.ts';
import { fromMenu, hudMenu, openRewards, unfoldMenu } from './hud.ts';
import { newIsland } from './liveRoom.ts';
import { RELAY } from './relay.ts';
import { roomUp } from './rooms.ts';
import { hideAndShow, measure, watch, watched, type Probe } from './memory.ts';
import { newRecord } from './record.ts';
import { manyPlaces, routePlaces } from './places.ts';
import { fixtureTiles, mapsDrawn, tilesOnlyOkinawa } from './trips.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00&as=B&critter=none&visitor=none';

/** The before → after on the test (MB). */
const note = (what: string, a: Probe, b: Probe) =>
  test.info().annotations.push({ type: 'memory', description: `${what}: JS heap ${a.heap} → ${b.heap} MB, ArrayBuffers ${a.ab} → ${b.ab} MB, nodes ${a.nodes} → ${b.nodes}, gl ${a.gl} → ${b.gl}, listeners ${a.ls} → ${b.ls}` });
/** Every open sheet closed (Esc: a level back first, as ごはん's search), the topmost first, and a frame let by: Chromium
 *  fires a dialog's close event with the next frame's events, rare here with the island idle, so a sheet reopened
 *  before it came was shut by it, and HudMenu's refocus listener still waited on it. */
async function closeAll(page: Page) {
  const open = page.locator('dialog[open]');
  for (let k = 0; k < 8 && (await open.count()); k++) await page.keyboard.press('Escape');
  await expect(open).toHaveCount(0);
  await page.evaluate(() => new Promise(requestAnimationFrame));
}
/** The last round against the first: nothing more held. */
function flat(a: Probe, b: Probe, abMb = 1) {
  expect(b.gl, 'WebGL contexts alive').toBeLessThanOrEqual(a.gl);
  expect(b.ls, 'window and document listeners').toBeLessThanOrEqual(a.ls);
  expect(b.ab - a.ab, 'ArrayBuffers (MB)').toBeLessThan(abMb);
  // (code compiled on first use, the caches warming: up to ~2 MB a run)
  expect(b.heap - a.heap, 'JS heap (MB)').toBeLessThan(4);
  // (the island's own life between rounds: ±200; a sheet's DOM kept is ~1,000)
  expect(b.nodes - a.nodes, 'DOM nodes alive, attached or not').toBeLessThan(400);
}

/** A tap by the page's own click() (no locator: in Chromium a locator's click leaves a console handle on the element,
 *  which held a detached island page, its GL context and all, in the probe: review 11-18), once `q` is in. */
async function press(page: Page, q: string) {
  await page.waitForFunction((q) => !!document.querySelector(q), q, { timeout: 10_000 });
  await page.evaluate((q) => (document.querySelector(q) as HTMLElement).click(), q);
}
/** English Study's sheet from the HUD's menu, on `tab`. */
async function english(page: Page, tab: 'home' | 'phrases' | 'game') {
  if ((await page.locator('[data-hud-menu]').getAttribute('aria-expanded')) !== 'true') await press(page, '[data-hud-menu]');
  await press(page, '[data-hud-english]');
  await press(page, `dialog[open] [data-en-tab="${tab}"]`);
}

// English Study (lib/english): its tabs (ホーム, フレーズ: the decks, すごろく's menu) shown, closed, the page hidden (the
// kept sheet let go), four times.
test('English Study’s tabs opened, closed, the page hidden, four times: nothing left behind', { tag: '@chromium' }, async ({ page }) => {
  await watch(page);
  await page.goto(Q);
  await loaded3d(page);
  const round = async () => {
    await english(page, 'phrases');
    await expect(page.locator('dialog[open] [data-en-tab="phrases"]')).toHaveAttribute('aria-selected', 'true');
    for (const t of ['game', 'home']) await press(page, `dialog[open] [data-en-tab="${t}"]`);
    await expect(page.locator('dialog[open] [data-en-tab="home"]')).toHaveAttribute('aria-selected', 'true');
    await closeAll(page);
    await hideAndShow(page);
  };
  // (two rounds to warm: the second still compiles and caches ~4 MB on first use, flat from there)
  for (let i = 0; i < 2; i++) await round();
  const first = await measure(page);
  for (let i = 0; i < 2; i++) await round();
  const after = await measure(page);
  note('English Study', first, after);
  flat(first, after);
});

// 英語すごろく (lib/sugoroku): a game from English Study's tab on its own screen (/sugoroku, the 3D board: the island's
// WebGL context let go meanwhile), ‹ back to the island, the sheet closed, the page hidden, three times.
test('すごろく’s board and back to the island, three times: one WebGL context, nothing left behind', { tag: '@chromium' }, async ({ page }) => {
  await watch(page);
  await page.goto(`${Q}&sgSeed=e2e-1`);
  await loaded3d(page);
  const round = async () => {
    await english(page, 'game');
    // (続きから from the second round: the game left half-way)
    const resume = await page.locator('[data-sugoroku] [data-sg-resume]').count();
    if (resume) await press(page, '[data-sugoroku] [data-sg-resume]');
    else (await press(page, '[data-sugoroku] [data-sg-new]'), await press(page, '[data-sugoroku] [data-sg-start]'));
    // (its board up: drawn, its first frame; in the logic tier nothing is drawn, so the board's element is the sign)
    await page.waitForFunction(() => location.pathname.endsWith('/sugoroku') && !!document.querySelector('[data-sugoroku][data-level="play"] [data-sg-board3d]') && ((window as { __sugoroku3d?: { frames?(): number } }).__sugoroku3d?.frames?.() ?? 0) >= (localStorage.getItem('e2e.render') === 'none' ? 0 : 1), null, { timeout: 15_000 });
    await press(page, '[data-sugoroku] .navbar button');
    await loaded3d(page);
    await closeAll(page);
    await hideAndShow(page);
    // (the board's page, its context and DOM, let go of within seconds of the island's return: the first time ~4 s on
    // a Mac, then at once)
    await expect.poll(async () => (await measure(page)).gl, { message: 'one WebGL context alive: the island’s', timeout: 12_000 }).toBe(1);
  };
  await round();
  const first = await measure(page);
  for (let i = 0; i < 2; i++) await round();
  const after = await measure(page);
  note('すごろく ⇄ the island', first, after);
  flat(first, after);
});

// ごはん's catalog (components/food/foodUi.ts holdFoodDb): a search (the catalog and the lazy products, ~15 MB), the
// sheet closed, the page hidden: the kept sheet let go, and the catalog and the pictures' index with it. Before
// (review 11/10 r2): the sheet kept through an app switch and the catalog for the page's life (23.1 → 37.0 MB after
// the hide); with the sheet let go, HealthSheet's bound ‹ and lead still held ごはん and its catalog (+15.2 MB).
test('ごはん searched, closed, the page hidden: the kept sheet and the food catalog let go of', { tag: '@chromium' }, async ({ page }) => {
  await page.goto(Q);
  await loaded3d(page);
  const kenkou = page.getByRole('button', { name: 'けんこう', exact: true });
  const food = page.locator('dialog [data-food-sheet]');
  // (the baseline: 健康 opened and closed, let go by a hide)
  await kenkou.click();
  await expect(page.locator('dialog[open] [data-kenkou-tab=health]')).toHaveAttribute('aria-current', 'page');
  await closeAll(page);
  await hideAndShow(page);
  const base = await measure(page);
  await kenkou.click();
  await page.locator('dialog[open] [data-kenkou-tab=food]').click();
  await page.locator('dialog[open] [data-add=s]').click();
  await page.locator('dialog[open] [data-food-q]').fill('サラダチキン');
  await expect.poll(() => page.locator('dialog[open] [data-food-results] [data-brand]').count(), { timeout: 20_000 }).toBeGreaterThan(0);
  const searched = await measure(page);
  await closeAll(page);
  await expect(food, 'kept after the close').toHaveCount(1);
  await hideAndShow(page);
  await expect(food, 'let go on the hide').toHaveCount(0);
  const after = await measure(page);
  note('ごはん searched, closed, hidden', base, after);
  expect(searched.heap - base.heap, 'the catalog in while searching (MB): else this measures nothing').toBeGreaterThan(5);
  expect(after.heap - base.heap, 'JS heap after the hide over the baseline (MB)').toBeLessThan(2.5);
});

// もようがえ (docs/design.md "The tent"): the tray opened, a few pieces, walls and floors picked (their models and
// textures previewed) and cancelled, done, back on the island, twice.
test('もようがえ: pieces, walls and floors tried in the tent, back on the island, twice: nothing left behind', { tag: '@chromium' }, async ({ page }) => {
  await watch(page);
  await page.addInitScript(() => localStorage.removeItem('island-demo.tent'));
  await page.goto(Q);
  await loaded3d(page);
  const round = async () => {
    await nav(page, `${BASE}/tent${Q}`);
    await roomUp(page, 'tent', { frames: 1 });
    await page.locator('[data-tent-edit-open]').click();
    for (const tab of ['furniture', 'wall', 'floor']) {
      await page.locator(`[data-tab="${tab}"]`).click();
      const items = page.locator('[data-tent-items] [data-tent-item]');
      for (const k of [0, 3, 6]) {
        await items.nth(k).click();
        await expect(items.nth(k)).toHaveAttribute('aria-pressed', 'true');
      }
      if (await page.locator('[data-act="cancel"]').count()) await page.locator('[data-act="cancel"]').click();
    }
    await page.locator('[data-tent-done]').click();
    await nav(page, `${BASE}/${Q}`);
    await loaded3d(page);
  };
  await round();
  const first = await measure(page);
  await round();
  const after = await measure(page);
  note('もようがえ', first, after);
  flat(first, after, 1.5);
});

// The wallet (ごほうび: the balance, the shop's list, the ledger's weeks and its history), opened and closed.
test('the wallet opened, its ledger and history shown, closed, three times: nothing left behind', { tag: '@chromium' }, async ({ page }) => {
  await watch(page);
  await page.goto(Q);
  await loaded3d(page);
  const sheet = page.locator('dialog[open]');
  const round = async () => {
    await openRewards(page);
    await expect(sheet.locator('[data-wallet]')).toBeVisible();
    await sheet.locator('[data-ledger]').scrollIntoViewIfNeeded();
    await expect(sheet.locator('[data-ledger] section.week').first()).toBeVisible();
    const hist = sheet.locator('[data-hist-toggle]');
    if (await hist.count()) await hist.first().click();
    await closeAll(page);
  };
  await round();
  const first = await measure(page);
  for (let i = 0; i < 2; i++) await round();
  const after = await measure(page);
  note('the wallet', first, after);
  flat(first, after);
});

// ごはん's barcode scanner (components/food/FoodScan.svelte): opened over a meal's search (the camera a blank canvas's
// stream, the decoder reading it), ‹ back, three times: every camera track stopped, the decoder's wasm memory let go
// (purged with the level), no listener left.
test('the barcode scanner opened and left, three times: the camera stopped, the decoder let go', { tag: '@chromium' }, async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __scanTracks: MediaStreamTrack[] };
    w.__scanTracks = [];
    MediaDevices.prototype.getUserMedia = async () => {
      const cv = Object.assign(document.createElement('canvas'), { width: 640, height: 480 });
      cv.getContext('2d')!.fillRect(0, 0, 640, 480);
      const s = cv.captureStream(5);
      w.__scanTracks.push(...s.getTracks());
      return s;
    };
  });
  await page.goto(Q);
  await loaded3d(page);
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  await page.locator('dialog[open] [data-kenkou-tab=food]').click();
  await page.locator('dialog[open] [data-add=s]').click();
  // (the search's lazy datasets in first, the products and the chain menus, ~50 MB: else their arrival is the growth)
  await page.locator('dialog[open] [data-food-q]').fill('サラダチキン');
  await expect.poll(() => page.locator('dialog[open] [data-food-results] [data-brand]').count(), { timeout: 20_000 }).toBeGreaterThan(0);
  await page.locator('dialog[open] [data-food-q]').fill('チキン');
  await expect(page.locator('dialog[open] [data-shop-chip]').first()).toBeVisible({ timeout: 20_000 });
  await page.locator('dialog[open] [data-food-q]').fill('');
  const round = async () => {
    await page.locator('dialog[open] [data-food-scan]').click();
    await expect(page.locator('dialog[open] [data-food-scan-level]')).toHaveAttribute('data-phase', 'reading');
    // (a few frames read)
    await page.waitForFunction(() => performance.getEntriesByName('scan:decode').length > 0);
    await page.locator('dialog[open] .navbar').getByRole('button', { name: '戻る' }).click();
    await expect(page.locator('dialog[open] [data-food-scan-level]')).toHaveCount(0);
    await page.evaluate(() => performance.clearMeasures('scan:decode'));
  };
  await round();
  const first = await measure(page);
  for (let i = 0; i < 2; i++) await round();
  const after = await measure(page);
  expect(await page.evaluate(() => (window as unknown as { __scanTracks: MediaStreamTrack[] }).__scanTracks.filter((t) => t.readyState === 'live').length)).toBe(0);
  note('the barcode scanner', first, after);
  flat(first, after);
});

// 保存した場所 (docs/places.md "Map"), drawn, on a paired phone (invented places): opened from the menu, searched, a
// row's card (the map flown to it, the chosen one's ring drawn), a long press's pin, closed, three times. Hermetic: the
// basemap's TileJSON bounded off Japan, so no tile is asked for and the map's load (mode ready) waits on nothing but
// the style and the places' own source (waiting on every basemap tile, routed, ran out the test's 30 s on CI's runner:
// run 45077916024; the clusters, a next try, depend on the view the last round left); then on the ring it drew. No
// map's context outlives its sheet (map.remove() loses it: WebKit keeps only so many live), no listener, font face,
// DOM node or ArrayBuffer more after the last round than after the first.
test('保存した場所’s map opened, searched, a card and a pin, closed, three times: nothing left behind', { tag: '@chromium' }, async ({ page, context }) => {
  await watch(page);
  await mapsDrawn(page);
  const net = await fixtureTiles(page);
  await tilesOnlyOkinawa(page);
  await newRecord().pair(context, 'A');
  await routePlaces(page, manyPlaces(150));
  await page.goto('');
  await islandUp(page);
  const view = page.locator('dialog[open] [data-places]');
  type St = { mode?: string; ring?: number };
  const map = (f: (s: St) => boolean) => expect.poll(() => page.evaluate(() => (window as unknown as { __placesMap?: { state(): St } }).__placesMap?.state() ?? {}).then(f)).toBe(true);
  const live: number[] = [];
  const round = async () => {
    await fromMenu(page, 'places');
    // (its load: the style and the places' own source in; no basemap tile to wait for)
    await map((s) => s.mode === 'ready');
    await view.locator('[data-places-q]').fill('テスト1');
    await view.locator('[data-place-row]').first().click();
    await expect(view.locator('[data-place-card]')).toBeVisible();
    await map((s) => s.ring === 1);
    await page.evaluate(() => (window as unknown as { __placesMap: { longPress(lng: number, lat: number): void } }).__placesMap.longPress(139.7, 35.66));
    live.push((await watched(page)).map);
    await closeAll(page);
  };
  await round();
  const first = await measure(page);
  for (let i = 0; i < 2; i++) await round();
  const after = await measure(page);
  expect([net.tiles, net.stray], 'basemap tiles asked for').toEqual([[], []]);
  note('保存した場所 ×3', first, after);
  expect(live.every((n) => n >= 1), "the map's context seen while it is open").toBe(true);
  expect([first.map, after.map], 'map contexts alive after the sheet closed').toEqual([0, 0]);
  expect(after.fonts, "the map's font faces in document.fonts").toBeLessThanOrEqual(first.fonts);
  flat(first, after);
});

// The leaf's grid (HudMenu: the NookPhone tiles), unfolded and folded ten times, a tile's sheet opened and closed on
// every other: its dismiss listeners and the tiles' DOM go with the fold.
test('the menu grid unfolded and folded ten times: no listener or DOM node left behind', { tag: '@chromium' }, async ({ page }) => {
  await watch(page);
  await page.goto(Q);
  await loaded3d(page);
  const round = async (i: number) => {
    if (i % 2) await fromMenu(page, 'settings');
    else await unfoldMenu(page);
    await closeAll(page);
    if ((await hudMenu(page).getAttribute('aria-expanded')) === 'true') await hudMenu(page).click();
    await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'false');
  };
  await round(0);
  await round(1);
  const first = await measure(page);
  for (let i = 2; i < 10; i++) await round(i);
  const after = await measure(page);
  note('the menu grid ×10', first, after);
  flat(first, after);
});

/** The page's own warm-up over (a paired phone's ~4 MB of ArrayBuffers in the 1-2 s after islandUp, the island not
 *  drawn: before it a 5-round test measured the page's loading, not its sheet): two reads 300 ms apart within 0.1 MB. */
async function warmedUp(page: Page) {
  let was = -1;
  await expect.poll(async () => {
    const ab = (await measure(page)).ab, moved = Math.abs(ab - was);
    was = ab;
    return moved;
  }, { message: 'ArrayBuffers settled', intervals: [300], timeout: 15_000 }).toBeLessThan(0.1);
}

/** A paired phone on a test island (no 3D: e2e.render none), `watch`ed; `items` on the record as A's. */
async function todoPhone(browser: Browser, items: { text: string; due?: string }[]) {
  const island = newIsland();
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await island.pair(context, 'A');
  const at = island.now();
  items.forEach((x, i) => expect(island.event('A', 'todo', { id: `dleak001i${i}`, at: at + 1 + i, text: x.text, ord: i, done: 0, ...(x.due && { due: x.due }) })).toMatchObject({ ok: true }));
  const page = await context.newPage();
  await watch(page);
  await page.goto('');
  await islandUp(page, { timeout: 20_000 });
  return { page, context };
}

// やること's HUD disc and its peek (TodoPeek, its own chunk): opened and shut five times (a tap on the disc, Esc, a tap
// elsewhere, by turns): the peek's dismiss listeners and its rows go with it.
test('the やること peek opened and shut five times: no listener or DOM node left behind', { tag: '@chromium' }, async ({ browser }) => {
  const { page, context } = await todoPhone(browser, [
    { text: 'ゴミ出し', due: '2026-11-04' }, { text: '区役所', due: '2026-11-02' }, { text: '歯医者', due: '2026-11-05T09:30' }, { text: '日付なし' }
  ]);
  const disc = page.locator('[data-hud-disc]'), peek = page.locator('[data-todo-peek]');
  await expect(disc).toHaveAttribute('data-n', '2');
  const round = async (i: number) => {
    await disc.click();
    await expect(peek.locator('[data-peek-item]')).toHaveCount(3);
    if (i % 3 === 0) await disc.click();
    else if (i % 3 === 1) await page.keyboard.press('Escape');
    else await page.mouse.click(196, 600);
    await expect(peek).toHaveCount(0);
    await expect(disc).toHaveAttribute('aria-expanded', 'false');
  };
  await warmedUp(page);
  await round(0);
  const first = await measure(page);
  for (let i = 1; i < 5; i++) await round(i);
  const after = await measure(page);
  note('the やること peek ×5', first, after);
  flat(first, after);
  expect(after.nodes - first.nodes, 'DOM nodes alive (no island drawn: the peek alone)').toBeLessThan(60);
  await context.close();
});

// ボット → Jobs, polled (bots/poll.svelte.ts: a read as it mounts, the next pollMs, 60 s, on): the sheet closed stops
// the loop: its timer cleared, its visibilitychange and online listeners gone, its read aborted. The page's 60 s
// timeouts (the polls' delay: the app's other long timers are other lengths) counted as they're set, fire or are cleared.
test('ボット’s Jobs tab, polling, opened and closed four times: its timer and listeners gone with it', { tag: '@chromium' }, async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await page.addInitScript(() => {
    const live = new Set<unknown>();
    const set0 = window.setTimeout, clear0 = window.clearTimeout;
    window.setTimeout = ((f: TimerHandler, ms?: number, ...a: unknown[]) => {
      if (ms !== 60_000) return set0(f, ms, ...a);
      const id = set0((...x: unknown[]) => (live.delete(id), typeof f === 'function' && f(...x)), ms, ...a);
      live.add(id);
      return id;
    }) as typeof setTimeout;
    window.clearTimeout = ((id?: number) => (live.delete(id), clear0(id))) as typeof clearTimeout;
    (window as unknown as { __polls: () => number }).__polls = () => live.size;
  });
  await watch(page);
  const rec = newRecord();
  await rec.pair(context, 'A');
  let reads = 0;
  await page.route(/raw\.githubusercontent\.com|gym-bot|its-bot/, (route) => route.abort('blockedbyclient'));
  await page.route(`${RELAY}/jobs`, (route) => {
    const req = route.request();
    const h = { 'Access-Control-Allow-Origin': req.headers().origin ?? '*', 'Access-Control-Allow-Headers': 'Authorization, X-Request-Id' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: h });
    reads++;
    const now = rec.now();
    const body = { ok: true, v: 1, now, ext: { at: now, by: 'app', err: null }, jobs: [{ id: 'tick', runs: [{ t: now - 180_000, st: 'ok' }], days: [] }], alerts: [] };
    return route.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify(body) });
  });
  await page.goto('');
  await islandUp(page);
  await warmedUp(page);
  const timers = () => page.evaluate(() => (window as unknown as { __polls: () => number }).__polls());
  const base = await timers();
  const closed: number[] = [];
  const round = async () => {
    const n = reads;
    await fromMenu(page, 'bots');
    await page.locator('dialog[open] [data-bots-tab="jobs"]').click();
    await expect(page.locator('dialog[open] [data-bots]')).toHaveAttribute('data-tab', 'jobs');
    await expect.poll(() => reads, { message: 'the tab read /jobs as it mounted' }).toBeGreaterThan(n);
    await expect.poll(timers, { message: "the poll's next read scheduled" }).toBeGreaterThan(base);
    await closeAll(page);
    closed.push(await timers());
  };
  await round();
  const first = await measure(page);
  for (let i = 0; i < 3; i++) await round();
  const after = await measure(page);
  note('ボット → Jobs ×4', first, after);
  expect([base, ...closed], '60 s timers pending before and after each close (the polls cleared)').toEqual([0, 0, 0, 0, 0]);
  flat(first, after);
});
