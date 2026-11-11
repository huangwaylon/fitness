// Memory let go of by the sheets and their rooms (docs/ops/testing.md "Memory"; leaks.spec.ts has the scenes): what a
// sheet loads is let go of with it, a kept sheet (ui-state/keptSheets.ts) goes when the page is hidden (an iOS app
// switch fires only visibilitychange, never pagehide), and a round of ききみみ, もようがえ or the wallet leaves no
// WebGL context, listener, DOM or ArrayBuffers behind. Measured after forced GCs (e2e/memory.ts, Chromium's CDP, hence
// @chromium); the post-deploy logic tier (not the gate's set).
import { expect, test, type Page } from './fixtures.ts';
import { BASE, loaded3d, nav } from './island.ts';
import { fromMenu, openRewards } from './hud.ts';
import { roomUp } from './rooms.ts';
import { hideAndShow, measure, watch, type Probe } from './memory.ts';
import { runToPhase, runToQuestion, toMode } from './kikimimi-nav.ts';

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

// A ききみみ round (docs/kikimimi.md): the quiz played solo to its results, the sheet closed, twice. Its packs (lib/
// packStore.ts: let go with the sheet), clips and lanes go with it.
test('a ききみみ quiz played to its results and closed, twice: nothing left behind', { tag: '@chromium' }, async ({ page }) => {
  await watch(page);
  await page.clock.install();
  await page.goto(`${Q}&kikimimi=fast`);
  await loaded3d(page);
  const sheet = page.locator('dialog[open] [data-kikimimi]');
  const round = async () => {
    await fromMenu(page, 'kikimimi');
    await expect(sheet).toHaveAttribute('data-phase', 'lobby');
    await toMode(page, 'quiz');
    await sheet.locator('[data-kiki-start]').click();
    for (let i = 0; i < 8; i++) {
      await runToQuestion(page, i, 'answer');
      await sheet.locator('[data-choice="0"]').click();
      await runToPhase(page, 'reveal');
      await sheet.locator('[data-kiki-next]').click();
    }
    await runToPhase(page, 'results');
    await closeAll(page);
  };
  await round();
  const first = await measure(page);
  await round();
  const after = await measure(page);
  note('a quiz round', first, after);
  flat(first, after);
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
