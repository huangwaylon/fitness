// Memory let go of by the sheets and their rooms (docs/ops/testing.md "Memory"; leaks.spec.ts has the scenes): what a
// sheet loads is let go of with it, a kept sheet (ui-state/keptSheets.ts) goes when the page is hidden (an iOS app
// switch fires only visibilitychange, never pagehide), and a round of もようがえ or the wallet leaves no
// WebGL context, listener, DOM or ArrayBuffers behind. Measured after forced GCs (e2e/memory.ts, Chromium's CDP, hence
// @chromium); the post-deploy logic tier (not the gate's set).
import { expect, test, type Page } from './fixtures.ts';
import { BASE, loaded3d, nav } from './island.ts';
import { openRewards } from './hud.ts';
import { roomUp } from './rooms.ts';
import { hideAndShow, measure, watch, type Probe } from './memory.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00&as=B&critter=none&visitor=none';

/** The before → after on the test (MB). */
const note = (what: string, a: Probe, b: Probe) =>
  test.info().annotations.push({ type: 'memory', description: `${what}: JS heap ${a.heap} → ${b.heap} MB, ArrayBuffers ${a.ab} → ${b.ab} MB, nodes ${a.nodes} → ${b.nodes}, gl ${a.gl} → ${b.gl}, listeners ${a.ls} → ${b.ls}` });
/** Every open sheet closed (Esc: a level back first, as ごはん's search), the topmost first. */
async function closeAll(page: Page) {
  const open = page.locator('dialog[open]');
  for (let k = 0; k < 8 && (await open.count()); k++) await page.keyboard.press('Escape');
  await expect(open).toHaveCount(0);
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
    await page.waitForFunction(() => location.pathname.endsWith('/sugoroku') && ((window as { __sugoroku3d?: { frames?(): number } }).__sugoroku3d?.frames?.() ?? 0) >= 1, null, { timeout: 15_000 });
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
