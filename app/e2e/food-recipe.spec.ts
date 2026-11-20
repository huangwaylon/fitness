// マイレシピ's weight and servings (docs/design.md "Gohan"), on `?demo` (ウェイ's 「おうちカレー」 4人前:
// store/demo/rows.ts): できあがりの重さ spreads the dish's values over the pot as weighed (1人前 its share, 全部 the
// pot); its ingredients shown and logged as their foods are now (the shipped data route-mocked with a later fix),
// a change too big to take unasked offered to its owner (材料を最新の値にする); a recipe of 2人前 or more says what one serving holds, and its
// amount's 1人前 / 全部 chips their kcal, 全部 picked again when I last logged it so.
import { expect, test, type Page } from './fixtures.ts';
import { openKenkou } from './hud.ts';

const DATE = '2026-11-04T12:30';
const dlg = (page: Page) => page.locator('dialog[open]');
const sheet = (page: Page) => page.locator('dialog[open] :is(.titlebar, [data-food-sheet])');
/** The open sheet's animations finished (a level slid in: a tap lands where it was aimed). */
const slid = (page: Page) => dlg(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))));

async function openFood(page: Page, as = '') {
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none${as}`);
  await expect(page.getByRole('button', { name: 'けんこう', exact: true })).toBeVisible({ timeout: 15_000 });
  await openKenkou(page, 'food');
  await expect(sheet(page).locator('[data-food-summary]')).toBeVisible();
}

/** A meal's search → おうちカレー's amount. */
async function curryAmount(page: Page, meal = 'd') {
  await sheet(page).locator(`[data-add=${meal}]`).tap();
  await slid(page);
  await sheet(page).locator('[data-food-recipes] [data-recipe=cdemoa1]').tap();
  await slid(page);
}

/** The amount's live kcal (not its grams). */
const liveKcal = async (page: Page) => Number((await sheet(page).locator('[data-food-live] .k').textContent())!.replace(/（.*/, '').replace(/[^\d]/g, ''));

test('できあがりの重さ: set, the curry logs by it (1人前 its quarter, the kcal the same, per 100 g less)', async ({ page }) => {
  await openFood(page);
  await curryAmount(page);
  const s = sheet(page);
  // 4人前: its chips say their kcal; 1人前 picked (my last entry of it was 1人前)
  await expect(s.locator('[data-portion="1人前"]')).toHaveText('1人前562 kcal');
  await expect(s.locator('[data-portion="全部"]')).toHaveText('全部2,247 kcal');
  await expect(s.locator('[data-portion="1人前"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(s.locator('[data-food-g]')).toHaveText('（458g）');
  await s.locator('[data-food-per]').tap();
  await expect(s.locator('#food-per')).toContainText('123 kcal');
  await s.locator('[data-amount-open]').tap();
  await slid(page);
  const lv = s.locator('[data-recipe-level=edit]');
  await expect(lv.locator('[data-recipe-live-total]')).toHaveText('全部で 2,247 kcal（1,830g） · 4人前なので 1人前は 562 kcal');
  await expect(lv.locator('[data-recipe-cw]')).toHaveValue('');
  await expect(lv.locator('#rcp-cw-hint')).toHaveText('鍋ごと量って、鍋の重さを引いた重さ');
  // too light for what it holds: said, 保存 waits
  await lv.locator('[data-recipe-cw]').fill('300');
  await expect(lv.locator('[data-recipe-cw-bad]')).toHaveText('この重さだと栄養が多すぎるようです。重さを確かめてください');
  await expect(lv.locator('[data-recipe-save]')).toHaveAttribute('aria-disabled', 'true');
  await lv.locator('[data-recipe-cw]').fill('2000');
  await expect(lv.locator('[data-recipe-cw-bad]')).toHaveCount(0);
  await expect(lv.locator('[data-recipe-live-total]')).toHaveText('全部で 2,247 kcal（2,000g） · 4人前なので 1人前は 562 kcal');
  await lv.locator('[data-recipe-save]').tap();
  await expect(dlg(page).getByRole('status')).toContainText('「おうちカレー」を保存しました');
  // back in the search: its amount again, 1人前 500 g, the kcal as before; per 100 g over the pot's 2,000 g
  await s.locator('[data-food-recipes] [data-recipe=cdemoa1]').tap();
  await slid(page);
  await expect(s.locator('[data-food-g]')).toHaveText('（500g）');
  expect(await liveKcal(page)).toBe(562);
  await s.locator('[data-food-per]').tap();
  await expect(s.locator('#food-per')).toContainText('112 kcal');
  await s.locator('[data-portion="全部"]').tap();
  await expect(s.locator('[data-food-g]')).toHaveText('（2,000g）');
  await s.locator('[data-done]').tap();
  await expect(dlg(page).getByRole('status')).toContainText('夜ごはんに追加しました');
  // logged 全部 last: its amount starts there next time
  await s.locator('[data-food-recipes] [data-recipe=cdemoa1]').tap();
  await slid(page);
  await expect(s.locator('[data-portion="全部"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await liveKcal(page)).toBe(2246); // (112.3 kcal per 100 g, kept to one decimal, × 2,000 g)
});

test('できあがりの重さ: a dish with an ingredient of no known weight logs by weight once the pot is weighed', async ({ page }) => {
  await openFood(page);
  const s = sheet(page);
  const h2 = s.locator('.navbar h2');
  await s.locator('[data-add=l]').tap();
  await slid(page);
  await s.locator('[data-recipe-new]').tap();
  const lv = s.locator('[data-recipe-level=edit]');
  await lv.locator('[data-recipe-n]').fill('定食とごはん');
  await s.locator('[data-recipe-add]').tap();
  await s.locator('[data-food-q]').fill('ごはん');
  await s.locator('[data-food-results] li:has([data-item="mext:01088"]) [data-quick]').tap({ timeout: 15_000 });
  await s.locator('[data-food-q]').fill('');
  await s.locator('[data-food-customs] [data-custom=mdemoa1]').tap(); // 社食の日替わり定食, by the serving
  await s.locator('[data-done]').tap();
  await expect(h2).toHaveText('材料を追加');
  await s.locator('[data-food-finish]').tap();
  await expect(h2).toHaveText('新しいレシピ');
  await expect(lv.locator('[data-recipe-live-total]')).toHaveText('全部で 884 kcal（150g＋重さ不明 1品） · 2人前なので 1人前は 442 kcal');
  // the pot weighed: no ingredient's weight asked, the dish's 700 g
  await lv.locator('[data-recipe-cw]').fill('700');
  await expect(lv.locator('[data-recipe-live-total]')).toHaveText('全部で 884 kcal（700g） · 2人前なので 1人前は 442 kcal');
  await lv.locator('[data-recipe-save]').tap(); // 保存して追加: a serving logged too
  await expect(h2).toHaveText('昼ごはん');
  await expect(s.locator('[data-food-added] [data-added]')).toContainText('350g');
  // its amount: by weight (a grams field), 1人前 350 g, 全部 700 g
  await s.locator('[data-food-recipes] [data-recipe]').first().tap(); // (the latest changed first: this one)
  await slid(page);
  await expect(s.locator('[data-grams]')).toHaveValue('350');
  await expect(s.locator('[data-portion="1人前"]')).toHaveText('1人前442 kcal');
  await expect(s.locator('[data-portion="全部"]')).toHaveText('全部884 kcal');
  await expect(s.locator('[data-food-g]')).toHaveText('（350g）');
});

/** foods.json (MEXT) served with `fix` applied to one food's row (by column, its id without the prefix). */
async function fixFood(page: Page, id: string, fix: (cols: Record<string, unknown[]>, at: number) => void) {
  await page.route('**/food/foods.json*', async (route) => {
    const res = await route.fetch();
    const d = (await res.json()) as { cols: Record<string, unknown[]> };
    const at = d.cols.id.indexOf(id);
    expect(at).toBeGreaterThanOrEqual(0);
    fix(d.cols, at);
    await route.fulfill({ response: res, json: d });
  });
}

test('an ingredient’s food fixed since: shown and logged as it is now, said quietly in the editor', async ({ page }) => {
  await fixFood(page, '06153', (c, at) => void (c.kcal[at] = 40)); // たまねぎ 400 g: 132 → 160 kcal
  await openFood(page);
  await curryAmount(page);
  const s = sheet(page);
  await expect(s.locator('[data-portion="1人前"]')).toHaveText('1人前569 kcal', { timeout: 15_000 }); // (2,275 ÷ 4)
  await s.locator('[data-amount-open]').tap();
  await slid(page);
  const lv = s.locator('[data-recipe-level=edit]');
  await expect(lv.locator('[data-recipe-fresh]')).toHaveText('材料の値が新しくなりました');
  await expect(lv.locator('[data-recipe-fresh-go]')).toHaveCount(0);
  await expect(lv.locator('[data-recipe-item="1"]')).toContainText('160');
  await expect(lv.locator('[data-recipe-live-total]')).toHaveText('全部で 2,275 kcal（1,830g） · 4人前なので 1人前は 569 kcal');
  await expect(lv.locator('[data-recipe-save]')).toHaveAttribute('aria-disabled', 'true'); // nothing of mine to save
  await s.getByRole('button', { name: '戻る' }).tap();
  await slid(page);
  await s.locator('[data-done]').tap();
  await expect(dlg(page).getByRole('status')).toContainText('夜ごはんに追加しました');
  await s.locator('[data-food-finish]').tap();
  await expect(s.locator('section[data-meal=d] [data-entry]').last()).toContainText('569');
});

test('a change too big to take unasked: kept as it was, offered to its owner, said to the others', async ({ page }) => {
  await fixFood(page, '17051', (c, at) => void (c.salt[at] = 13)); // the roux's 80 g: salt 8.5 → 10.4 g
  const s = sheet(page);
  // うめ's phone: ウェイ's recipe, read-only: said, no link; its amount as kept (the curry's 1人前 562 kcal, salt as before)
  await openFood(page, '&as=B');
  await curryAmount(page);
  await s.locator('[data-amount-open]').tap();
  await slid(page);
  const view = s.locator('[data-recipe-level=view]');
  await expect(view.locator('[data-recipe-fresh=big]')).toHaveText('材料の値が大きく変わっています', { timeout: 15_000 });
  await expect(view.locator('[data-recipe-fresh-go]')).toHaveCount(0);
  // ウェイ's: the link, and a tap saves the recipe so
  await openFood(page);
  await curryAmount(page);
  await s.locator('[data-amount-open]').tap();
  await slid(page);
  const lv = s.locator('[data-recipe-level=edit]');
  const line = lv.locator('[data-recipe-fresh=big]');
  await expect(line).toHaveText('材料の値が大きく変わっています · 最新の値にする（塩分 9.2→11.2 g）', { timeout: 15_000 });
  await expect(lv.locator('[data-recipe-save]')).toHaveAttribute('aria-disabled', 'true');
  await line.locator('[data-recipe-fresh-go]').tap();
  await expect(dlg(page).getByRole('status')).toContainText('材料を最新の値にしました');
  await expect(lv.locator('[data-recipe-fresh]')).toHaveCount(0);
  await expect(lv.locator('[data-recipe-save]')).toHaveAttribute('aria-disabled', 'true'); // saved
  await expect(lv.locator('[data-recipe-item="4"]')).toContainText('80g');
});
