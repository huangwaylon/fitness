// The tree popup (docs/design.md "Trees"): the daily checks above the meals, P · F · C under them (mealChecks.ts
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
  // its padding (left edge, mid-height), the gap between a goal's fruit and its ✓, the nameplate, a label
  const ic = await box(p.locator('[data-row=apple] .ic')), ck = await box(p.locator('[data-row=apple] .ck'));
  const points: [number, number][] = [[r.x + 4, r.y + r.height / 2], [r.x + r.width - 4, r.y + 8], [(ic.x + ic.width + ck.x) / 2, ic.y + ic.height / 2]];
  for (const [x, y] of points) {
    await page.touchscreen.tap(x, y);
    await expect(p).toBeVisible();
  }
  await p.locator('.plate').tap();
  await p.locator('[data-row=pear] .amt').tap();
  await expect(p).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect.poll(() => walking(page)).toBe(false);
  // outside: open ground on screen
  const g = await page.evaluate(() => (window as unknown as { __world3d: { ground(x: number, y: number): { x: number; z: number } } }).__world3d.ground(205, 700));
  const lawn = await lawnTap(page, g.x, g.z);
  await page.touchscreen.tap(lawn.x, lawn.y);
  await expect(p).toHaveCount(0);
});
