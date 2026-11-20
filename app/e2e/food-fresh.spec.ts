// ごはん's freshness (food review 11/19, W3; docs/design.md "Gohan"): an entry and a いつもの keep their foods as they were
// logged, and offer the foods as they are now. On `?demo` (its meal rows: store/demo/rows.ts), the shipped data
// route-mocked with a later fix: a いつもの's food changed → 「いつものを更新」 from today, the days before as they were;
// a portion whose weight changed → 最新の値にする takes its grams now; a recipe's ingredient of no known weight asks for
// its weight (the dish by the serving till then).
import { expect, test, type Page } from './fixtures.ts';
import { openKenkou } from './hud.ts';

const DATE = '2026-11-04T12:30';
const dlg = (page: Page) => page.locator('dialog[open]');
const sheet = (page: Page) => page.locator('dialog[open] :is(.titlebar, [data-food-sheet])');
/** The open sheet's animations finished (a level slid in: a tap lands where it was aimed). */
const slid = (page: Page) => dlg(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))));

async function openFood(page: Page) {
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none`);
  await expect(page.getByRole('button', { name: 'けんこう', exact: true })).toBeVisible({ timeout: 15_000 });
  await openKenkou(page, 'food');
  await expect(sheet(page).locator('[data-food-summary]')).toBeVisible();
}

/** dishes.json served with `fix` applied to one dish's row (by column: scripts/food-data.ts, ids without the prefix). */
async function fixDish(page: Page, id: string, fix: (cols: Record<string, unknown[]>, at: number) => void) {
  await page.route('**/food/dishes.json*', async (route) => {
    const res = await route.fetch();
    const d = (await res.json()) as { cols: Record<string, unknown[]> };
    const at = d.cols.id.indexOf(id);
    expect(at).toBeGreaterThanOrEqual(0);
    fix(d.cols, at);
    await route.fulfill({ response: res, json: d });
  });
}

test('いつものを更新: a いつもの whose food changed offers it; a tap renews it from today, yesterday as it was', async ({ page }) => {
  await fixDish(page, 'natto', (c, at) => void (c.kcal[at] = 200)); // 163 when the demo's breakfast repeat was set
  await openFood(page);
  const s = sheet(page);
  const b = s.locator('section[data-meal=b]');
  const natto = b.locator('[data-entry][data-rep]').nth(1); // (rice, then natto)
  await expect(natto).toContainText('88');
  const rf = b.locator('[data-rep-fresh=b]');
  const go = rf.locator('[data-rep-fresh-go]');
  await expect(rf).toHaveText('新しい値でいつものを更新（322→342 kcal）', { timeout: 15_000 }); // the link alone
  await expect(go).toHaveText('新しい値でいつものを更新（322→342 kcal）');
  expect(await go.evaluate((el) => el.getClientRects().length)).toBe(1); // one line at 393 px
  await expect(b.locator('[data-fresh]')).toHaveCount(0); // a いつもの's entry: its repeat's, not its own
  await go.tap();
  await expect(dlg(page).getByRole('status')).toContainText('朝ごはんのいつものを今日から更新しました');
  await expect(natto).toContainText('108');
  await expect(rf).toHaveCount(0);
  // yesterday: the old one's, unchanged; and a past day never offers it
  await s.locator('[data-nav=back]').tap();
  await expect(s.locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-03');
  await expect(natto).toContainText('88');
  await expect(s.locator('[data-rep-fresh]')).toHaveCount(0);
});

test('最新の値にする: a portion whose weight changed takes its grams now (1人前 510 → 480 g)', async ({ page }) => {
  await fixDish(page, 'curry-chicken', (c, at) => void (c.portions[at] = [{ label: '1人前', g: 480 }]));
  await openFood(page);
  const lunch = sheet(page).locator('section[data-meal=l]');
  const fresh = lunch.locator('[data-fresh]');
  await expect(fresh).toHaveText('最新の値にする（729→686 kcal）', { timeout: 15_000 });
  const curry = lunch.locator(`[data-entry="${await fresh.getAttribute('data-fresh')}"]`);
  await expect(curry).toContainText('カレーライス（チキン）');
  await expect(curry).toContainText('510g');
  await fresh.tap();
  await expect(curry).toContainText('480g');
  await expect(curry).toContainText('686');
  await expect(fresh).toHaveCount(0);
});

test('マイレシピ: an ingredient of no known weight asks for its weight; the total says so till then', async ({ page }) => {
  await openFood(page);
  const s = sheet(page);
  const h2 = s.locator('.navbar h2');
  await s.locator('[data-add=l]').tap();
  await slid(page); // (tapped mid-slide, the chip under the finger was 食品を作る: 1 in 10 under load)
  await s.locator('[data-recipe-new]').tap();
  const lv = s.locator('[data-recipe-level=edit]');
  await expect(h2).toHaveText('新しいレシピ');
  await lv.locator('[data-recipe-n]').fill('定食とごはん');
  await s.locator('[data-recipe-add]').tap();
  await s.locator('[data-food-q]').fill('ごはん');
  await s.locator('[data-food-results] li:has([data-item="mext:01088"]) [data-quick]').tap({ timeout: 15_000 });
  await s.locator('[data-food-q]').fill('');
  const teishoku = s.locator('[data-food-customs] [data-custom=mdemoa1]'); // 社食の日替わり定食, by the serving
  await teishoku.tap(); // (a custom food: its amount at once)
  await s.locator('[data-done]').tap();
  await expect(h2).toHaveText('材料を追加');
  await s.locator('[data-food-finish]').tap();
  await expect(h2).toHaveText('新しいレシピ');
  // its values counted, never a nominal 100 g: 234 + 650 kcal, the rice's 150 g and one of no weight
  await expect(lv.locator('[data-recipe-live-total]')).toHaveText('全部で 884 kcal（150g＋重さ不明 1品） · 2人前なので 1人前は 442 kcal');
  const w = lv.locator('[data-recipe-weigh="1"]');
  await expect(w).toContainText('この材料の重さ（1個あたり）');
  await w.locator('[data-recipe-weigh-g]').fill('10'); // 6,500 kcal per 100 g: no food is that dense
  await w.locator('[data-recipe-weigh-set]').tap();
  await expect(w.locator('[data-recipe-weigh-bad]')).toHaveText('この重さだと栄養が多すぎるようです。重さを確かめてください');
  await w.locator('[data-recipe-weigh-g]').fill('400');
  await w.locator('[data-recipe-weigh-set]').tap();
  await expect(lv.locator('[data-recipe-weigh]')).toHaveCount(0);
  await expect(lv.locator('[data-recipe-item="1"]')).toContainText('1個（400g）');
  await expect(lv.locator('[data-recipe-live-total]')).toHaveText('全部で 884 kcal（550g） · 2人前なので 1人前は 442 kcal');
  await expect(lv.locator('[data-recipe-live-per]')).toHaveText('442 kcal');
});
