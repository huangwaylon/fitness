// The tree popup (docs/design.md "Trees"): the four goals a 2 × 2, each cell (but its mark) → 健康's 活動 at that goal's
// card, the mark its own 44px box that does nothing; every control a ≥ 44px box; the daily checks, the meals and P · F · C
// (mealChecks.ts pfcMarks: a bar against each goal as set, grams without one, protein's 「あと Ng」 or ✓) on one grid, the
// meals row and P · F · C each wholly ごはん's button; the
// sync time on the straight nameplate, no ベル; and its one closing rule (IslandScene): a tap inside its box never closes
// it, a tap outside does. The demo's 2026-11-03 at 22:00: ウェイ ate three meals, set protein 110 g, no fat or carbs goal;
// うめ set none. Taps, not clicks (iPhone Safari).
import { expect, test, type Page } from './fixtures.ts';
import { camTo, islandUp, lawnTap, tapOn, w3, walking } from './island.ts';
import { GOAL_TREES } from '../src/lib/world/world.ts';

test.use({ viewport: { width: 393, height: 852 }, hasTouch: true });

const pop = (page: Page) => page.locator('.detail');
async function open(page: Page, q = '') {
  await page.goto(`?demo&date=2026-11-03T22:00${q}`);
  await islandUp(page);
  if (q.includes('as=G')) await camTo(page, GOAL_TREES.A[1]); // (the guest's phone opens at its own villager)
  await tapOn(page, 'goal', 'A');
  await expect(pop(page)).toBeVisible();
  await pop(page).evaluate((e) => Promise.all(e.getAnimations().map((a) => a.finished))); // its pop-in
}
const box = async (l: ReturnType<Page['locator']>) => (await l.boundingBox())!;

test('the popup: checks, meals, P · F · C in that order; the sync time on the nameplate; no ベル; P · F · C opens ごはん on that day', async ({ page }) => {
  await open(page);
  const p = pop(page);
  await expect(p.locator('.plate .nm')).toHaveText('ウェイ');
  // the time only, its meaning for VoiceOver; the plate straight, on one line
  const sync = p.locator('.plate [data-sync]');
  await expect(sync).toHaveText(/^\d{2}:\d{2}$/);
  await expect(sync).toHaveAccessibleName(/^\d{2}:\d{2} に とどいた$/);
  const plate = await box(p.locator('.plate'));
  expect(plate.height).toBeLessThan(30);
  expect(await p.locator('.plate').evaluate((e) => getComputedStyle(e).rotate)).toBe('none');
  await expect(p).not.toContainText('ベル');
  const ys = await Promise.all(['[data-row=cherry]', '[data-checks]', '[data-meals]', '[data-tree-pfc]'].map(async (s) => (await box(p.locator(s))).y));
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  // protein against its goal (a bar, a tick, the grams still to eat), fat and carbs grams only (no goal set)
  const row = p.locator('[data-tree-pfc=A]');
  await expect(row.locator('[data-pfc]')).toHaveCount(3);
  const prot = row.locator('[data-pfc=p]');
  await expect(prot).toHaveAttribute('data-state', /^(under|met)$/);
  await expect(prot.locator('.tk')).toBeVisible();
  const left = Number(await prot.locator('[data-left]').getAttribute('data-left'));
  expect(left).toBeGreaterThanOrEqual(0);
  if (left) await expect(prot.locator('[data-left]')).toHaveText(`あと ${left}g`);
  else await expect(prot.locator('[data-left] svg')).toBeVisible();
  for (const k of ['fa', 'c']) {
    await expect(row.locator(`[data-pfc=${k}]`)).toHaveAttribute('data-state', 'none');
    await expect(row.locator(`[data-pfc=${k}] .g`)).toHaveText(/^\d+g$/);
  }
  await expect(row).toHaveAccessibleName(/^ウェイの きょうの えいよう: たんぱくしつ \d+ \/ 110g（\d+%）(たっせい| あと \d+g)、ししつ \d+g（もくひょう なし）、たんすいかぶつ \d+g（もくひょう なし）$/);
  expect((await box(row)).height).toBeGreaterThanOrEqual(16);
  await row.tap();
  const sheet = page.locator('dialog[open]');
  await expect(sheet.locator('[data-kenkou-tab=food]')).toHaveAttribute('aria-current', 'page');
  await expect(sheet.locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-03');
  await expect(sheet.locator('.titlebar [data-who]')).toHaveAttribute('data-who', 'A');
  await expect.poll(() => walking(page)).toBe(false);
});

test('a goal not set: grams only, nothing to go (うめ); the guest sees what the members see (ごはん goals aren’t からだ)', async ({ page }) => {
  await open(page, '&as=G');
  await expect(pop(page).locator('[data-tree-pfc=A] [data-pfc=p] .tk')).toBeVisible();
  await expect(pop(page).locator('[data-tree-pfc=A] [data-left]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await tapOn(page, 'goal', 'B');
  const row = pop(page).locator('[data-tree-pfc=B]');
  await expect(row.locator('[data-pfc]')).toHaveCount(3);
  for (const k of ['p', 'fa', 'c']) await expect(row.locator(`[data-pfc=${k}]`)).toHaveAttribute('data-state', 'none');
  await expect(row.locator('.tk, [data-left]')).toHaveCount(0);
});

test('a tap inside the popup never closes it nor reaches what’s under it; a tap outside closes it', async ({ page }) => {
  await open(page);
  const p = pop(page), r = await box(p);
  // its padding (left edge, mid-height), its top-right corner, every goal's mark (a box of its own: nothing happens)
  const points: [number, number][] = [[r.x + 3, r.y + r.height / 2], [r.x + r.width - 4, r.y + 6]];
  for (const f of ['apple', 'pear', 'peach', 'cherry']) {
    const ck = await box(p.locator(`[data-row=${f}] .ck`));
    points.push([ck.x + ck.width / 2, ck.y + ck.height / 2]);
  }
  for (const [x, y] of points) {
    await page.touchscreen.tap(x, y);
    await expect(p).toBeVisible();
  }
  await p.locator('.plate').tap();
  await expect(p).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect.poll(() => walking(page)).toBe(false);
  // outside: open ground on screen
  const g = await page.evaluate(() => (window as unknown as { __world3d: { ground(x: number, y: number): { x: number; z: number } } }).__world3d.ground(205, 700));
  const lawn = await lawnTap(page, g.x, g.z);
  await page.touchscreen.tap(lawn.x, lawn.y);
  await expect(p).toHaveCount(0);
});

test('the goals a 2 × 2 (🍎 🍐 / 🍑 🍒), roomy; each control a ≥ 44px box, 8px or more from the next; a mark and its value apart', async ({ page }) => {
  await open(page);
  const p = pop(page);
  const cells = await Promise.all(['apple', 'pear', 'peach', 'cherry'].map((f) => box(p.locator(`[data-row=${f}]`))));
  const [a, b, c, d] = cells;
  expect(Math.abs(a.y - b.y)).toBeLessThan(2);
  expect(Math.abs(c.y - d.y)).toBeLessThan(2);
  expect(Math.abs(a.x - c.x)).toBeLessThan(2);
  // 16px between the columns, 12px between the rows (393 × 852)
  expect(b.x - (a.x + a.width)).toBeGreaterThanOrEqual(15.5);
  expect(c.y - (a.y + a.height)).toBeGreaterThanOrEqual(11.5);
  const big = async (sel: string) => {
    for (const bx of await Promise.all((await p.locator(sel).all()).map(box))) expect([bx.width, bx.height].every((v) => v >= 44), `${sel} ${JSON.stringify(bx)}`).toBe(true);
  };
  for (const sel of ['[data-row]', '[data-row] .ck', '[data-check]', '[data-tree-food]', '[data-tree-pfc]']) await big(sel);
  // the mark's box ends before the value starts; the art apart: the fruit ≥ 6px from the mark, the mark ≥ 12px from the
  // value's box (a ring 9px and 15px; the star, 6px wider, 3px less each side)
  for (const f of ['apple', 'pear', 'peach', 'cherry']) {
    const [ic, ck, ok, amt] = await Promise.all(['.ic', '.ck', '.ck .ok', '.amt'].map((s) => box(p.locator(`[data-row=${f}] ${s}`))));
    expect(ck.x + ck.width).toBeLessThanOrEqual(amt.x + 0.5);
    expect(ok.x - (ic.x + ic.width), f).toBeGreaterThanOrEqual(6);
    expect(amt.x - (ok.x + ok.width), f).toBeGreaterThanOrEqual(12);
  }
  // the four in view on the iPhone 15's stage
  const r = await box(p);
  expect(r.x).toBeGreaterThanOrEqual(0);
  expect(r.x + r.width).toBeLessThanOrEqual(393);
});

for (const [f, metric, tree] of [['pear', 'move', 'A'], ['cherry', 'stand', 'B']] as const) {
  test(`a tap on a goal’s value (${f}) opens 健康's 活動 at its card, the tree’s person’s; a tap on its mark doesn’t`, async ({ page }) => {
    await open(page);
    if (tree === 'B') {
      await page.keyboard.press('Escape');
      await tapOn(page, 'goal', 'B');
      await expect(pop(page).locator('.plate .nm')).toHaveText('うめ');
    }
    await pop(page).locator(`[data-row=${f}] .ck`).tap();
    await expect(pop(page)).toBeVisible();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await pop(page).locator(`[data-row=${f}] .amt`).tap();
    const sheet = page.locator('dialog[open]');
    await expect(sheet.locator('[data-kenkou-tab=health]')).toHaveAttribute('aria-current', 'page');
    await expect(sheet.locator('[data-group=activity]')).toHaveAttribute('aria-pressed', 'true');
    await expect(sheet.locator('.titlebar [data-who]')).toHaveAttribute('data-who', tree);
    const card = sheet.locator(`[data-metric=${metric}]`);
    await expect(card).toBeInViewport();
    await expect.poll(() => walking(page)).toBe(false);
  });
}

/** The three rows on one grid: each row's box, and per row its three items' label and status boxes. */
async function rows(p: ReturnType<Page['locator']>) {
  return Promise.all(['[data-checks]', '[data-meals]', '[data-tree-pfc]'].map(async (sel) => {
    const row = p.locator(sel), items = await row.locator('[data-check], [data-meal], [data-pfc]').all();
    return { sel, box: await box(row), items: await Promise.all(items.map(async (it) => ({ it: await box(it), lb: await box(it.locator('.lb')), st: await box(it.locator('.mk, .v')), fs: await it.locator('.lb').evaluate((e) => getComputedStyle(e).fontSize) }))) };
  }));
}
/** One system: the same left and right edges as the 2 × 2's cells, the same height (≥ 44) 4px apart, three items each
 *  equal columns, each cell’s label + status group centred in its column, every label the same size. */
async function oneGrid(page: Page) {
  const p = pop(page), rs = await rows(p);
  const pop0 = await box(p);
  for (const r of rs) {
    expect(r.items, r.sel).toHaveLength(3);
    // its own grid: even side margins in the popup (not the 2 × 2's edges), the same for every row
    expect(Math.abs((r.box.x - pop0.x) - (pop0.x + pop0.width - (r.box.x + r.box.width))), `${r.sel} even margins`).toBeLessThanOrEqual(2);
    expect(Math.abs(r.box.x - rs[0].box.x), `${r.sel} left`).toBeLessThanOrEqual(1);
    expect(Math.abs(r.box.height - rs[0].box.height), `${r.sel} height`).toBeLessThanOrEqual(1);
    expect(r.box.height).toBeGreaterThanOrEqual(44);
    for (const [i, it] of r.items.entries()) {
      // each cell's item group (label + status) centred in its column, every cell of all three rows
      const gl = Math.min(it.lb.x, it.st.x), gr = Math.max(it.lb.x + it.lb.width, it.st.x + it.st.width);
      expect(Math.abs((gl - it.it.x) - (it.it.x + it.it.width - gr)), `${r.sel} ${i}: group centred in its column`).toBeLessThanOrEqual(2);
      expect(Math.abs(it.it.width - rs[0].items[0].it.width), `${r.sel} ${i}: equal columns`).toBeLessThanOrEqual(2);
      expect(Math.abs(it.it.x - rs[0].items[i].it.x), `${r.sel} ${i}: column`).toBeLessThanOrEqual(2);
      expect(it.st.x - (it.lb.x + it.lb.width), `${r.sel} ${i}: label to status`).toBeLessThanOrEqual(8);
      expect(it.fs, `${r.sel} ${i}: label size`).toBe(rs[0].items[0].fs);
      // the columns 8px or more apart
      if (i) expect(it.it.x - (r.items[i - 1].it.x + r.items[i - 1].it.width), `${r.sel} ${i}: gap`).toBeGreaterThanOrEqual(8);
    }
  }
  for (let i = 1; i < rs.length; i++) expect(Math.round(rs[i].box.y - (rs[i - 1].box.y + rs[i - 1].box.height)), `gap ${i}`).toBe(4);
  // the values in one type: the grams and 「あと Ng」 as large as the labels
  for (const s of await p.locator('[data-tree-pfc] .g, [data-tree-pfc] .left').evaluateAll((els) => els.filter((e) => e.textContent).map((e) => getComputedStyle(e).fontSize))) expect(s).toBe(rs[0].items[0].fs);
}

test('the checks, the meals and P · F · C: one grid (the 2 × 2’s edges, one row height, the statuses in columns); no きろく button, the whole meals row opens ごはん for that person', async ({ page }) => {
  await open(page);
  const p = pop(page);
  await expect(p.locator('[data-meals] button, [data-meals] .ic, [data-tree-pfc] .ic, [data-checks] .ic')).toHaveCount(0);
  await expect(p).not.toContainText('きろく');
  await oneGrid(page);
  // my tree's row: its name says what a tap does and each meal's state
  const meals = p.locator('[data-meals]');
  await expect(meals).toHaveAccessibleName(/^ごはんを きろく する: 朝ごはん (きろくずみ|まだ)、昼ごはん (きろくずみ|まだ)、夜ごはん (きろくずみ|まだ)$/);
  // a tap at the row's far right (past 夜) opens ごはん on that day, ウェイ's
  const r = await box(meals);
  await page.touchscreen.tap(r.x + r.width - 6, r.y + r.height / 2);
  const sheet = page.locator('dialog[open]');
  await expect(sheet.locator('[data-kenkou-tab=food]')).toHaveAttribute('aria-current', 'page');
  await expect(sheet.locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-03');
  await expect(sheet.locator('.titlebar [data-who]')).toHaveAttribute('data-who', 'A');
  await expect.poll(() => walking(page)).toBe(false);
  // the other tree's row: its person's day (a look)
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await tapOn(page, 'goal', 'B');
  await expect(pop(page).locator('.plate .nm')).toHaveText('うめ');
  await expect(pop(page).locator('[data-meals]')).toHaveAccessibleName(/^うめの ごはんを みる: /);
  await pop(page).locator('[data-meals] [data-meal=b]').tap();
  await expect(sheet.locator('.titlebar [data-who]')).toHaveAttribute('data-who', 'B');
  await expect(sheet.locator('[data-kenkou-tab=food]')).toHaveAttribute('aria-current', 'page');
});

test.describe('at 393 × 659 (the gate’s)', () => {
  test.use({ viewport: { width: 393, height: 659 } });
  test('the rows on one grid', async ({ page }) => {
    await open(page);
    await oneGrid(page);
  });
});

test.describe('at 375 × 667 (iPhone SE)', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  test('the popup wholly in view, the other tree’s middle clear of it by half a thumb, the rows on one grid', async ({ page }) => {
    await open(page);
    const r = await box(pop(page));
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.x + r.width).toBeLessThanOrEqual(375);
    expect(r.y + r.height).toBeLessThanOrEqual(667);
    const b = await w3(page, (w) => w.box('goal', 'B'));
    expect(b!.left + b!.width / 2 - (r.x + r.width)).toBeGreaterThanOrEqual(22);
    await oneGrid(page);
  });
});
