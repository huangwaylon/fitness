// ごはん (docs/design.md "Gohan"): the meal log, the HUD cluster's bowl (left of the jar). Open it, search ごはん, add
// 茶碗1杯 to 朝ごはん and see the day's total go up; another person's day is read-only (no ＋, no entry to tap), and the
// guest sees the members' meals and logs its own. On `?demo` (its meal rows: model/food.ts over store/demo/rows.ts).
import { expect, test, type Page } from '@playwright/test';

const DATE = '2026-11-04T12:30';
const sheet = (page: Page) => page.locator('dialog[open]');
const total = (page: Page) => sheet(page).locator('[data-food-total]');
const kcalOf = async (page: Page) => Number((await total(page).textContent())!.replace(/[^\d]/g, ''));

async function openFood(page: Page, as = '') {
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none${as}`);
  const bowl = page.getByRole('button', { name: 'ごはん', exact: true });
  await expect(bowl).toBeVisible({ timeout: 15_000 });
  await bowl.click();
  await expect(sheet(page).locator('[data-food-summary]')).toBeVisible();
  await sheet(page).evaluate((d) => Promise.all(d.getAnimations().map((a) => a.finished))); // the zoom in has played
}

test('the bowl sits in the top-right cluster, left of the jar (the jar beside the dumbbell); search ごはん, add 茶碗1杯 to 朝ごはん, the day’s total goes up', async ({ page }) => {
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none`);
  const [jar, bowl, bell] = await Promise.all(['.hud-jar', '.hud-food', '.hud-health'].map((s) => page.locator(s).boundingBox()));
  expect(bowl!.x + bowl!.width).toBeLessThan(jar!.x);
  expect(jar!.x + jar!.width).toBeLessThan(bell!.x);
  expect(Math.abs(bowl!.y - bell!.y)).toBeLessThan(1); // one row
  expect(bowl!.height).toBeGreaterThanOrEqual(44);

  await openFood(page);
  await expect(sheet(page).locator('.navbar h2')).toHaveText('ごはん');
  await expect(sheet(page).locator('select[data-pick=who]')).toHaveValue('A');
  await expect(sheet(page).locator('[data-meal] h3')).toHaveText(['朝ごはん', '昼ごはん', '夜ごはん', 'おやつ']);
  const before = await kcalOf(page);
  const breakfast = sheet(page).locator('section[data-meal=b] [data-entry]');
  const n = await breakfast.count();

  await sheet(page).locator('[data-add=b]').click();
  await expect(sheet(page).locator('.navbar h2')).toHaveText('朝ごはん');
  await sheet(page).locator('[data-food-q]').fill('ごはん');
  const rice = sheet(page).locator('[data-food-results] button', { hasText: 'ごはん（精白米）' }).first();
  await expect(rice).toBeVisible({ timeout: 15_000 }); // the catalog's first fetch
  await rice.click();
  await expect(sheet(page).locator('.chip[aria-pressed=true]')).toContainText('茶碗1杯'); // its default portion
  await expect(sheet(page).locator('[data-pick-meal=b]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-food-live] .k')).toContainText('234');
  await sheet(page).locator('[data-done]').click();

  await expect(sheet(page).locator('.navbar h2')).toHaveText('ごはん');
  await expect.poll(() => kcalOf(page)).toBe(before + 234);
  await expect(breakfast).toHaveCount(n + 1);
  await expect(breakfast.last()).toContainText('茶碗1杯（150g）');
  // it is mine: a tap opens its amount, with 保存 and 削除; 削除 takes it off again
  await breakfast.last().click();
  await expect(sheet(page).locator('[data-done]')).toHaveText('保存');
  await sheet(page).locator('[data-remove]').click();
  await expect.poll(() => kcalOf(page)).toBe(before);
});

// WebKit's text field is ~20 characters wide by itself: in an auto grid track it pushed the search box and the rows past
// the sheet's right edge on an iPhone 15 (the sheet clips them). Each level is checked: nothing wider than the sheet.
test('the day, the search and the amount all fit the sheet’s width', async ({ page }) => {
  const overflow = () => sheet(page).evaluate((d) => {
    const right = d.getBoundingClientRect().right;
    return [...d.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > right + 0.5).map((e) => e.className).slice(0, 3);
  });
  await openFood(page);
  expect(await overflow()).toEqual([]);
  await sheet(page).locator('[data-add=b]').click();
  await sheet(page).locator('[data-food-q]').fill('ごはん');
  const rice = sheet(page).locator('[data-food-results] button', { hasText: 'ごはん（精白米）' }).first();
  await expect(rice).toBeVisible({ timeout: 15_000 });
  expect(await overflow()).toEqual([]);
  await rice.click();
  await expect(sheet(page).locator('[data-done]')).toBeVisible();
  expect(await overflow()).toEqual([]);
});

test('another person’s day is read-only; the guest sees the members’ meals and logs its own', async ({ page }) => {
  await openFood(page);
  await expect(sheet(page).locator('[data-add]')).toHaveCount(4); // my day: ＋ per meal and ✎ the goal
  await expect(sheet(page).locator('[data-focus=kcal-goal]')).toHaveCount(1);
  await sheet(page).locator('select[data-pick=who]').selectOption('B');
  await expect(sheet(page).locator('[data-food-summary]')).toHaveClass(/pB/);
  await expect(sheet(page).locator('[data-kcal-goal]')).toHaveText('目標 1,700 kcal');
  expect(await sheet(page).locator('div.row[data-entry]').count()).toBeGreaterThan(0); // うめ's meals, shown
  await expect(sheet(page).locator('button[data-entry], [data-add], [data-focus=kcal-goal]')).toHaveCount(0); // never changed here
  // the day before: still うめ's, still read-only; きょう comes back
  await sheet(page).locator('[data-nav=back]').click();
  await expect(sheet(page).locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-03');
  await expect(sheet(page).locator('[data-add]')).toHaveCount(0);
  await sheet(page).locator('[data-nav=today]').click();
  await expect(sheet(page).locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-04');

  // the guest's phone: its own day first (empty, with ＋), both members' a pick away
  await openFood(page, '&as=G');
  const who = sheet(page).locator('select[data-pick=who]');
  await expect(who).toHaveValue('G');
  await expect(who.locator('option')).toHaveCount(3);
  await expect(sheet(page).locator('[data-add]')).toHaveCount(4);
  await who.selectOption('A');
  expect(await sheet(page).locator('div.row[data-entry]').count()).toBeGreaterThan(0);
  await expect(sheet(page).locator('[data-add]')).toHaveCount(0);
});
