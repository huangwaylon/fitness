// The trees' fruit through a day (docs/design.md "Trees"): each person's tree beside their villager; grey in the canopy
// at 0, colouring with progress; once met it falls to the ground (once); a tap picks it up and it stays gone for the
// Tokyo day (this phone's fruit-day); all four met, the canopy glints and a gold fruit falls too. Only the tree's
// owner picks its fruit up (into their pocket: 60 かいがら, the gold one 150); another's tap opens the popup. Picking up
// never changes ベル. The demo's progress follows ?date= (no sync before 06:40; most
// goals settled by 23:00). The popup's 朝 / 昼 / 夜 fill as meals are logged in ごはん.
import { expect, test, type Page } from './fixtures.ts';
import { fruitOn, goalTree, islandUp, tapOn, walking, type W3 } from './island.ts';
import { hudBells, openKenkou } from './hud.ts';
import type { BoxKind } from '../src/lib/components/island/probe.ts';

test.use({ viewport: { width: 390, height: 844 } });

async function open(page: Page, date: string) {
  await page.goto(`?demo&date=${date}`);
  await islandUp(page);
}
/** Both trees' fruit (`__world3d.fruit`), each with its tree. */
const fruit = async (page: Page) => (await Promise.all(['A', 'B'].map(async (tree) => (await fruitOn(page, tree)).map((f) => ({ ...f, tree }))))).flat();
const staged = async (page: Page, stage: string) => (await fruit(page)).filter((f) => f.stage === stage);
/** Thing (`kind`, `id`)'s box on screen (`__world3d.box`). */
const boxOf = async (page: Page, kind: BoxKind, id: string) => (await page.evaluate(([kind, id]) => (window as unknown as { __world3d: W3 }).__world3d.box(kind, id), [kind, id] as const))!;

test('each person’s tree stands beside their villager, on the outer side, level with them', async ({ page }) => {
  await open(page, '2026-11-04T12:00');
  const at = async (kind: BoxKind, id: string) => ((b) => ({ x: b.left, y: b.top, width: b.width, height: b.height }))(await boxOf(page, kind, id));
  const [ta, tb, va, vb] = [await at('row', 'A'), await at('row', 'B'), await at('villager', 'mine'), await at('villager', 'partner')];
  const [l, r] = ta.x < tb.x ? [ta, tb] : [tb, ta];
  expect(l.x + l.width / 2).toBeLessThan(va.x); // the left tree left of my villager
  expect(r.x + r.width / 2).toBeGreaterThan(vb.x + vb.width); // the right one right of the partner's
  for (const [t, v] of [[l, va], [r, vb]]) expect(Math.abs(t.y + t.height / 2 - (v.y + v.height))).toBeLessThan(40); // level: the fruit row by their feet
});

test('at 0 every fruit hangs grey in its canopy: nothing on the ground, no glints', async ({ page }) => {
  await open(page, '2026-11-04T05:30');
  await expect.poll(async () => (await fruit(page)).length).toBe(8);
  expect(await staged(page, 'tree')).toHaveLength(8);
  for (const f of await fruit(page)) expect(f.grey, f.f).toBe(1);
  await page.waitForTimeout(1800);
  for (const t of ['A', 'B']) expect((await goalTree(page, t))?.glints, t).toBe(false);
  // the canopy still opens its popup
  await tapOn(page, 'goal', 'A');
  await expect(page.locator('.detail')).toBeVisible();
});

test('met fruit falls to the ground in colour; unmet ones colour with progress; a tap picks one up, it stays gone after a reload and the next day starts over', async ({ page }) => {
  await open(page, '2026-11-04T23:00');
  await expect.poll(async () => (await staged(page, 'fall')).length, { timeout: 5000 }).toBe(0); // every met fruit has fallen
  const met = (await staged(page, 'ground')).length;
  expect(met).toBeGreaterThan(0);
  for (const f of await staged(page, 'ground')) expect(f.grey, f.f).toBe(0);
  for (const f of await staged(page, 'tree')) expect(f.grey, f.f).toBeGreaterThan(0), expect(f.grey, f.f).toBeLessThan(0.55); // 50–95% of the goal by night
  // a tree with all four met glints, and its gold fruit lies in front of the four
  for (const p of ['A', 'B']) {
    const mine = await fruitOn(page, p), all = mine.filter((f) => f.stage === 'ground' && f.f !== 'gold').length === 4;
    expect((await goalTree(page, p))?.glints, p).toBe(all);
    expect(mine.filter((f) => f.f === 'gold'), p).toHaveLength(all ? 1 : 0);
  }
  await page.waitForTimeout(1700); // the drops' bounce is over

  // the partner's fallen fruit isn't mine to pick up: a tap opens their tree's popup, the fruit stays
  const theirs = (await fruitOn(page, 'B')).find((f) => f.stage === 'ground');
  if (theirs) {
    const tb = await boxOf(page, 'fruit', `B:${theirs.f}`);
    await page.mouse.click(tb.left + tb.width / 2, tb.top + tb.height / 2);
    await expect(page.locator('.detail')).toBeVisible();
    expect((await fruitOn(page, 'B')).filter((f) => f.f === theirs.f && f.stage === 'ground')).toHaveLength(1);
    // (a second tap closes it: a shake wants a third)
    await page.mouse.click(tb.left + tb.width / 2, tb.top + tb.height / 2);
    await expect(page.locator('.detail')).toHaveCount(0);
  }

  // pick one of mine up: it hops away into my pocket; ベル don't move
  const bells = await hudBells(page).getAttribute('aria-label');
  const id = (await fruitOn(page, 'A')).find((f) => f.stage === 'ground')!.f;
  const there = async () => (await fruitOn(page, 'A')).some((f) => f.f === id);
  const b = await boxOf(page, 'fruit', `A:${id}`);
  await page.mouse.click(b.left + b.width / 2, b.top + b.height / 2);
  await expect.poll(there).toBe(false);
  await expect(page.locator('.detail')).toHaveCount(0); // a pick-up, not the popup
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);

  // a reload: still gone, and the others lie there without falling again
  await page.reload();
  await islandUp(page);
  expect(await there()).toBe(false);
  await expect.poll(async () => (await staged(page, 'ground')).length).toBe(met - 1);
  const falling = async () => (await fruit(page)).filter((f) => f.stage === 'fall' || f.dropping).length;
  expect(await falling()).toBe(0);
  await page.waitForTimeout(1800);
  expect(await falling()).toBe(0);

  // the next Tokyo day: everything back in the canopy, grey
  await open(page, '2026-11-05T05:30');
  await expect.poll(async () => (await staged(page, 'tree')).length).toBe(8);
});

test('the popup’s 朝 / 昼 / 夜: a meal logged in ごはん fills its circle with a ✓', async ({ page }) => {
  await open(page, '2026-11-04T12:30');
  // my tree's (A's) popup
  const circles = page.locator('.detail [data-meals] [data-meal]');
  await tapOn(page, 'goal', 'A');
  await expect(circles).toHaveText(['朝', '昼', '夜']);
  const meal = await circles.evaluateAll((els) => els.find((e) => !e.hasAttribute('data-logged'))?.dataset.meal);
  expect(meal).toBeTruthy();
  await expect(page.locator(`.detail [data-meal=${meal}] .ok.todo`)).toBeVisible();

  // log it in ごはん (the dumbbell's sheet, its tab), then back on the island the popup shows it ✓
  await openKenkou(page, 'food');
  const sheet = page.locator('dialog[open]');
  await sheet.locator(`[data-add=${meal}]`).click();
  await sheet.locator('[data-food-q]').fill('ごはん');
  const rice = sheet.locator('[data-food-results] button', { hasText: 'ごはん（精白米）' }).first();
  await expect(rice).toBeVisible({ timeout: 15_000 }); // the catalog's first fetch
  await rice.click(); // opened in place
  await sheet.evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})))); // (its height in)
  await sheet.locator('[data-food-open-add]').click();
  await sheet.locator('[data-food-finish]').click();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  if (!(await circles.count())) await tapOn(page, 'goal', 'A');
  await expect(page.locator(`.detail [data-meal=${meal}]`)).toHaveAttribute('data-logged', 'true');
  await expect(page.locator(`.detail [data-meal=${meal}] svg.ok`)).toBeVisible();
});

test('the popup’s meals row opens ごはん on today, on the tree’s person’s day, in place (no walk, the island paused)', async ({ page }) => {
  await open(page, '2026-11-04T12:30');
  const sheet = page.locator('dialog[open]');
  // my tree's (a log), 健康 shown last (the dumbbell's default) and still ごはん opens
  await tapOn(page, 'goal', 'A');
  const go = page.locator('.detail [data-tree-food=A]');
  await expect(go).toHaveAccessibleName(/^ごはんを きろく する: /);
  await go.click();
  await expect(sheet.locator('[data-kenkou-tab=food]')).toHaveAttribute('aria-current', 'page');
  await expect(sheet.locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-04');
  await expect(sheet.locator('.titlebar [data-who]')).toHaveAttribute('data-who', 'A');
  await expect(sheet.locator('[data-add=b]')).toBeVisible(); // my own day: ＋ per meal
  await expect(page.locator('.detail')).toHaveCount(0); // the popup closed under the sheet
  await expect.poll(() => walking(page)).toBe(false); // a button: never a walk
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { stats(): { paused: boolean } } }).__world3d.stats().paused)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);

  // the partner's tree: a look, their day (read-only), today again
  await tapOn(page, 'goal', 'B');
  const see = page.locator('.detail [data-tree-food=B]');
  await expect(see).toHaveAccessibleName(/^うめの ごはんを みる: /);
  await see.click();
  await expect(sheet.locator('.titlebar [data-who]')).toHaveAttribute('data-who', 'B');
  await expect(sheet.locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-04');
  await expect(sheet.locator('[data-add]')).toHaveCount(0);
  await expect.poll(() => walking(page)).toBe(false);
});

test('with nothing fallen, the fruit row still opens the popup; from the keyboard it picks up the first fallen fruit', async ({ page }) => {
  await open(page, '2026-11-04T05:30');
  await tapOn(page, 'row', 'A');
  await expect(page.locator('.detail')).toBeVisible();
  await open(page, '2026-11-04T23:00');
  await expect.poll(async () => (await staged(page, 'fall')).length, { timeout: 5000 }).toBe(0);
  const row = page.locator('button.row-btn[tabindex="0"]').first(); // r4-dom: the row's keyboard way (a11y: goes with the world's buttons, user decision 3)
  await expect(row).toHaveAttribute('aria-label', /を ひろう$/);
  const before = (await staged(page, 'ground')).length;
  await row.focus();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await staged(page, 'ground')).length).toBe(before - 1);
});
