// ごはん's freshness (food review 11/19, W3; the automatic recalculation, 2026-11-20; docs/design.md "Gohan"): an entry
// keeps its food as it was logged, a いつもの takes its foods as they are now from today by itself. On `?demo` (its meal
// rows: store/demo/rows.ts), the shipped data route-mocked with a later fix (and index.json's `at`, when it shipped): a
// いつもの's food changed a little → taken from today, said once on its row, the days before as they were; changed too
// much → the link asks; a day's entries → its one 「この日の記録を最新の値にする（n件）」 (a portion's weight changed: its
// grams now), 取り消す; a マイ食品 edited → 以前の記録にも反映する on its 保存; a recipe's ingredient of no known weight
// asks for its weight (the dish by the serving till then).
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

/** dishes.json served with `fix` applied to one dish's row (by column: scripts/food-data.ts, ids without the prefix),
 *  and index.json saying the data shipped at `at` (ms; null: an older index, without one). */
async function fixDish(page: Page, id: string, fix: (cols: Record<string, unknown[]>, at: number) => void, at: number | null = Date.parse('2026-11-01T00:00:00Z')) {
  await page.route('**/food/index.json*', async (route) => {
    const res = await route.fetch();
    const { at: _at, ...index } = (await res.json()) as Record<string, unknown>;
    await route.fulfill({ response: res, json: at === null ? index : { ...index, at } });
  });
  await page.route('**/food/dishes.json*', async (route) => {
    const res = await route.fetch();
    const d = (await res.json()) as { cols: Record<string, unknown[]> };
    const i = d.cols.id.indexOf(id);
    expect(i).toBeGreaterThanOrEqual(0);
    fix(d.cols, i);
    await route.fulfill({ response: res, json: d });
  });
}

test('いつもの takes a newer small fix by itself from today, says so once; yesterday as it was', async ({ page }) => {
  await fixDish(page, 'natto', (c, at) => void (c.kcal[at] = 200)); // 163 when the demo's breakfast repeat was set
  await openFood(page);
  const s = sheet(page);
  const b = s.locator('section[data-meal=b]');
  const natto = b.locator('[data-entry][data-rep]').nth(1); // (rice, then natto)
  await expect(natto).toContainText('108', { timeout: 15_000 }); // 88 → 108 kcal (+23 %): no tap
  const note = b.locator('[data-rep-note=b]');
  await expect(note).toHaveText('11/4から新しい値で記録します（閉じる）');
  await expect(b.locator('[data-rep-fresh]')).toHaveCount(0); // nothing left to ask
  await expect(s.locator('[data-day-fresh]')).toHaveCount(0); // a いつもの's entries: its repeat's, not the day's
  // yesterday: the old one's, unchanged, no note
  await s.locator('[data-nav=back]').tap();
  await expect(s.locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-03');
  await expect(natto).toContainText('88');
  await expect(note).toHaveCount(0);
  await s.locator('[data-nav=on]').tap();
  await expect(note).toBeVisible();
  // a reload: once only (the repeat is already the new one: nothing taken again), the note kept till tapped
  await page.reload();
  await expect(page.getByRole('button', { name: 'けんこう', exact: true })).toBeVisible({ timeout: 15_000 });
  await openKenkou(page, 'food');
  await expect(natto).toContainText('108');
  await expect(note).toBeVisible();
  await note.tap();
  await expect(note).toHaveCount(0);
  await expect(natto).toContainText('108');
});

test('いつもの: a change too big (+59 %), or data of no known shipping time, is not taken: the link asks', async ({ page }) => {
  await fixDish(page, 'natto', (c, at) => void (c.kcal[at] = 260));
  await openFood(page);
  const b = sheet(page).locator('section[data-meal=b]');
  const natto = b.locator('[data-entry][data-rep]').nth(1);
  const go = b.locator('[data-rep-fresh-go=b]');
  await expect(go).toHaveText('新しい値でいつものを更新（322→374 kcal）', { timeout: 15_000 });
  await expect(natto).toContainText('88');
  await expect(b.locator('[data-rep-note]')).toHaveCount(0);
  await go.tap();
  await expect(dlg(page).getByRole('status')).toContainText('朝ごはんのいつものを今日から更新しました');
  await expect(natto).toContainText('140');
  await expect(go).toHaveCount(0);
});

test('いつもの: an index without its shipping time takes nothing by itself', async ({ page }) => {
  await fixDish(page, 'natto', (c, at) => void (c.kcal[at] = 200), null);
  await openFood(page);
  const b = sheet(page).locator('section[data-meal=b]');
  await expect(b.locator('[data-rep-fresh-go=b]')).toHaveText('新しい値でいつものを更新（322→342 kcal）', { timeout: 15_000 });
  await expect(b.locator('[data-entry][data-rep]').nth(1)).toContainText('88');
});

test('この日の記録を最新の値にする: the day’s one link (a portion whose weight changed: 1人前 510 → 480 g), 取り消す', async ({ page }) => {
  await fixDish(page, 'curry-chicken', (c, at) => void (c.portions[at] = [{ label: '1人前', g: 480 }]));
  await openFood(page);
  const s = sheet(page);
  const curry = s.locator('section[data-meal=l] [data-entry]'); // (the day's one lunch)
  const link = s.locator('[data-day-fresh]');
  await expect(link).toHaveText('この日の記録を最新の値にする（1件）', { timeout: 15_000 });
  await expect(curry).toContainText('カレーライス（チキン）');
  await expect(curry).toContainText('510g');
  await s.locator('[data-day-fresh-go]').tap();
  const banner = dlg(page).getByRole('status');
  await expect(banner).toContainText('1件を最新の値にしました');
  await expect(curry).toContainText('480g');
  await expect(curry).toContainText('686');
  await expect(link).toHaveCount(0);
  await banner.getByRole('button', { name: '取り消す' }).tap();
  await expect(curry).toContainText('カレーライス（チキン）');
  await expect(curry).toContainText('510g');
  await expect(curry).toContainText('729');
  await expect(link).toBeVisible();
});

/** Back to the day (each level's ‹; a banner shown goes with the level left by hand). */
async function home(page: Page) {
  const s = sheet(page);
  while (!(await s.locator('[data-food-summary]').isVisible())) {
    await s.getByRole('button', { name: '戻る' }).tap();
    await slid(page);
  }
}

test('マイ食品 edited: 以前の記録（1件）にも反映する on its 保存 (off by default), the banner’s 取り消す puts it back', async ({ page }) => {
  await openFood(page);
  const s = sheet(page);
  const h2 = s.locator('.navbar h2');
  // log one serving of 社食の日替わり定食 (650 kcal) to today's dinner
  const custom = s.locator('[data-food-customs] [data-custom=mdemoa1]');
  /** 社食の日替わり定食 open in the dinner's search. */
  const pick = async () => {
    await s.locator('[data-add=d]').tap();
    await slid(page);
    await custom.tap();
    await slid(page);
  };
  await pick();
  await s.locator('[data-food-open-add]').tap();
  await home(page);
  const row = s.locator('section[data-meal=d] [data-entry]'); // (the dinner's only one)
  await expect(row).toContainText('社食の日替わり定食');
  await expect(row).toContainText('650');
  const lv = s.locator('[data-custom-level=edit]');
  const sw = lv.locator('[data-past-fresh]');
  /** Its editor (the search's row, くわしく, マイ食品を開く), kcal `k` typed, the switch on or not, 保存. */
  const edit = async (k: string, on: boolean) => {
    await pick();
    await s.locator('[data-food-open-more]').tap();
    await slid(page);
    await s.locator('[data-amount-open]').tap();
    await expect(h2).toHaveText('マイ食品');
    await expect(sw).toHaveCount(0); // nothing changed yet
    await lv.locator('[data-custom-k]').fill(k);
    await expect(sw).toHaveAccessibleName(/以前の記録（1件）にも反映する/);
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    if (on) await sw.tap(), await expect(sw).toHaveAttribute('aria-checked', 'true');
    await lv.locator('[data-custom-save]').tap();
  };
  await edit('700', true);
  await expect(dlg(page).getByRole('status')).toContainText('1件に反映しました');
  await home(page);
  await expect(row).toContainText('700');
  await expect(s.locator('[data-day-fresh]')).toHaveCount(0);
  // again, 取り消す: the entry as it was, the day's link offering the food's values now, by hand
  await edit('750', true);
  const banner = dlg(page).getByRole('status');
  await expect(banner).toContainText('1件に反映しました');
  await banner.getByRole('button', { name: '取り消す' }).tap();
  await home(page);
  await expect(row).toContainText('700');
  await expect(s.locator('[data-day-fresh]')).toHaveText('この日の記録を最新の値にする（1件）');
  // left off: only the food changes
  await edit('800', false);
  await home(page);
  await expect(row).toContainText('700');
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
