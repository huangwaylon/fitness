// マイレシピ and マイ食品 are everyone's to edit (the user 2026-11-20; contract/food.ts sharedAccept), on `?demo`
// (ウェイ's 「おうちカレー」 cdemoa1 and 「社食の日替わり定食」 mdemoa1: store/demo/rows.ts): on うめ's phone and the
// guest's, ウェイ's recipe and custom food open in the editor from their amount, who made them over the name, no 削除
// (their creator's alone), 「コピーして編集」 in its place; an edit is saved, shown at once, still ウェイ's. On his own
// phone: 削除 as ever, no copy.
import { expect, test, type Page } from './fixtures.ts';
import { openFood } from './hud.ts';

const dlg = (page: Page) => page.locator('dialog[open]');
const sheet = (page: Page) => page.locator('dialog[open] :is(.titlebar, [data-food-sheet])');
/** The open sheet's animations finished (a level slid in, a row opened: a tap lands where aimed). */
const slid = (page: Page) => dlg(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))));


/** A meal's search → the recipe's editor (its amount's レシピを見る). */
async function openCurry(page: Page, meal: string) {
  const s = sheet(page);
  await s.locator(`[data-add=${meal}]`).tap();
  await slid(page);
  await s.locator('[data-food-recipes] [data-recipe=cdemoa1]').tap();
  await slid(page);
  await s.locator('[data-amount-open]').tap();
  await slid(page);
}

/** ウェイ's custom food's row in a meal's search. */
const teishokuRow = (page: Page) => sheet(page).locator('[data-food-customs] [data-custom=mdemoa1]');

/** A meal's search → the custom food's editor (its row opened in place, くわしく ›, then 食品を見る). */
async function openTeishoku(page: Page, meal: string) {
  const s = sheet(page);
  await s.locator(`[data-add=${meal}]`).tap();
  await slid(page);
  await teishokuRow(page).tap();
  await slid(page);
  await s.locator('[data-food-open-more]').tap();
  await slid(page);
  await s.locator('[data-amount-open]').tap();
  await slid(page);
}

/** Back to the day (each level's ‹), nothing asked (nothing unsaved). */
async function toDay(page: Page) {
  const s = sheet(page);
  while (await s.locator('[data-food-summary]').count() === 0) {
    await s.getByRole('button', { name: '戻る' }).tap();
    await slid(page);
  }
}

for (const [as, who] of [['B', 'うめ'], ['G', 'the guest']] as const) {
  test(`${who} edits ウェイ's recipe and custom food (still his), never removes them`, async ({ page }) => {
    await openFood(page, { as });
    const s = sheet(page);

    // the recipe: the editor, ウェイ's name over it, no 削除, the copy instead
    await openCurry(page, 'd');
    const lv = s.locator('[data-recipe-level=edit]');
    await expect(lv.locator('[data-recipe-n]')).toHaveValue('おうちカレー');
    await expect(lv.locator('[data-recipe-by=A]')).toContainText('のレシピ');
    await expect(lv.locator('[data-recipe-remove]')).toHaveCount(0);
    await expect(lv.locator('[data-recipe-copy]')).toHaveCount(1);
    await expect(lv.locator('[data-recipe-sv]')).toHaveText('4人前');
    await expect(lv.locator('[data-recipe-save]')).toHaveAttribute('aria-disabled', 'true'); // nothing changed yet
    await lv.locator('[data-sv-step="1"]').tap();
    await lv.locator('[data-recipe-n]').fill('おうちカレー（大鍋）');
    await lv.locator('[data-recipe-save]').tap();
    await expect(dlg(page).getByRole('status')).toContainText('「おうちカレー（大鍋）」を保存しました');
    await slid(page);
    // in the search as edited, one row (no copy made); open again: still ウェイ's, as saved
    const row = s.locator('[data-food-recipes] [data-recipe=cdemoa1]');
    await expect(row).toContainText('おうちカレー（大鍋）');
    await expect(row).toContainText('5人前');
    await expect(s.locator('[data-food-recipes] [data-recipe]')).toHaveCount(1); // (no copy made)
    await row.tap();
    await slid(page);
    await s.locator('[data-amount-open]').tap();
    await slid(page);
    await expect(lv.locator('[data-recipe-sv]')).toHaveText('5人前');
    await expect(lv.locator('[data-recipe-by=A]')).toBeVisible();
    await expect(lv.locator('[data-recipe-remove]')).toHaveCount(0);
    await toDay(page);

    // the custom food: the editor (its picture changeable), ウェイ's name, no 削除
    await openTeishoku(page, 'l');
    const cv = s.locator('[data-custom-level=edit]');
    await expect(cv.locator('[data-custom-n]')).toHaveValue('社食の日替わり定食');
    await expect(cv.locator('[data-custom-by=A]')).toContainText('のマイ食品');
    await expect(cv.locator('[data-custom-photo=set]')).toHaveCount(1);
    await expect(cv.locator('[data-custom-remove]')).toHaveCount(0);
    await expect(cv.locator('[data-custom-copy]')).toHaveCount(1);
    await cv.locator('[data-custom-k]').fill('700');
    await cv.locator('[data-custom-save]').tap();
    await expect(dlg(page).getByRole('status')).toContainText('保存しました');
    await slid(page);
    await expect(s.locator('[data-food-customs] [data-custom]')).toHaveCount(2); // (うめ's おにぎり and it: no copy made)
    await expect(s.locator('[data-food-customs]')).toContainText('社食の日替わり定食');
    await expect(s.locator('[data-food-customs]')).toContainText('700');
  });
}

test('ウェイ’s own recipe and custom food: 削除 as ever, no copy, no maker line', async ({ page }) => {
  await openFood(page);
  const s = sheet(page);
  await openCurry(page, 'd');
  const lv = s.locator('[data-recipe-level=edit]');
  await expect(lv.locator('[data-recipe-remove]')).toHaveCount(1);
  await expect(lv.locator('[data-recipe-copy], [data-recipe-by]')).toHaveCount(0);
  await toDay(page);
  await openTeishoku(page, 'l');
  const cv = s.locator('[data-custom-level=edit]');
  await expect(cv.locator('[data-custom-remove]')).toHaveCount(1);
  await expect(cv.locator('[data-custom-copy], [data-custom-by]')).toHaveCount(0);
});
