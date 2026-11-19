// The tree popup (docs/design.md "Trees"): the four goals a 2 × 2, each cell (but its mark) → 健康's 活動 at that goal's
// card, the mark its own 44px box that does nothing; every control a ≥ 44px box; the daily checks above the meals, P · F · C under them (mealChecks.ts
// pfcMarks: a bar against each goal as set, grams without one, protein's 「あと Ng」 or ✓; the row ごはん's button), the
// sync time on the straight nameplate, no ベル; and its one closing rule (IslandScene): a tap inside its box never closes
// it, a tap outside does. The demo's 2026-11-03 at 22:00: ウェイ ate three meals, set protein 110 g, no fat or carbs goal;
// うめ set none. Taps, not clicks (iPhone Safari).
import { expect, test, type Page } from './fixtures.ts';
import { camTo, islandUp, lawnTap, tapOn, walking } from './island.ts';
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

test('the goals a 2 × 2 (🍎 🍐 / 🍑 🍒); each control a ≥ 44px box, 8px from the next cell; a mark and its value apart', async ({ page }) => {
  await open(page);
  const p = pop(page);
  const cells = await Promise.all(['apple', 'pear', 'peach', 'cherry'].map((f) => box(p.locator(`[data-row=${f}]`))));
  const [a, b, c, d] = cells;
  expect(Math.abs(a.y - b.y)).toBeLessThan(2);
  expect(Math.abs(c.y - d.y)).toBeLessThan(2);
  expect(Math.abs(a.x - c.x)).toBeLessThan(2);
  expect(b.x - (a.x + a.width)).toBeGreaterThanOrEqual(8);
  expect(c.y - (a.y + a.height)).toBeGreaterThanOrEqual(8);
  const big = async (sel: string) => {
    for (const bx of await Promise.all((await p.locator(sel).all()).map(box))) expect([bx.width, bx.height].every((v) => v >= 44), `${sel} ${JSON.stringify(bx)}`).toBe(true);
  };
  for (const sel of ['[data-row]', '[data-row] .ck', '[data-check]', '[data-tree-food]', '[data-tree-pfc]']) await big(sel);
  // the mark's box ends where the value starts: neither reaches the other
  for (const f of ['apple', 'pear', 'peach', 'cherry']) {
    const [ck, amt] = await Promise.all([box(p.locator(`[data-row=${f}] .ck`)), box(p.locator(`[data-row=${f}] .amt`))]);
    expect(ck.x + ck.width).toBeLessThanOrEqual(amt.x + 0.5);
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
