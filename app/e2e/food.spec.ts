// ごはん (docs/design.md "Gohan"): the meal log, the HUD cluster's bowl (between the dumbbell and the leaf). Open it, search ごはん, add
// 茶碗1杯 to 朝ごはん and see the day's total go up; another person's day is read-only (no ＋, no entry to tap), and the
// guest sees the members' meals and logs its own. On `?demo` (its meal rows: model/food.ts over store/demo/rows.ts).
import { expect, test, type Page } from '@playwright/test';

const DATE = '2026-11-04T12:30';
const sheet = (page: Page) => page.locator('dialog[open]');
const total = (page: Page) => sheet(page).locator('[data-food-total]');
const kcalOf = async (page: Page) => Number((await total(page).textContent())!.replace(/[^\d]/g, ''));

/** `date`: the scene clock's (none: the page's own, e.g. `page.clock.install`). */
async function openFood(page: Page, as = '', date = `&date=${DATE}`) {
  await page.goto(`?demo${date}&critter=none&visitor=none${as}`);
  const bowl = page.getByRole('button', { name: 'ごはん', exact: true });
  await expect(bowl).toBeVisible({ timeout: 15_000 });
  await bowl.click();
  await expect(sheet(page).locator('[data-food-summary]')).toBeVisible();
  await sheet(page).evaluate((d) => Promise.all(d.getAnimations().map((a) => a.finished))); // the zoom in has played
}

/** What sticks out past the open sheet's right edge (its first three, by class): nothing, on every level. */
const overflowOf = (page: Page) => sheet(page).evaluate((d) => {
  const right = d.getBoundingClientRect().right;
  return [...d.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > right + 0.5).map((e) => e.className).slice(0, 3);
});

test('the bowl sits in the top-right cluster, between the dumbbell and the leaf; search ごはん, add 茶碗1杯 to 朝ごはん, the day’s total goes up', async ({ page }) => {
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none`);
  const [leaf, bowl, bell] = await Promise.all(['[data-hud-menu]', '.hud-food', '.hud-health'].map((s) => page.locator(s).boundingBox()));
  expect(bell!.x + bell!.width).toBeLessThan(bowl!.x);
  expect(bowl!.x + bowl!.width).toBeLessThan(leaf!.x);
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
  await openFood(page);
  expect(await overflowOf(page)).toEqual([]);
  await sheet(page).locator('[data-add=b]').click();
  await sheet(page).locator('[data-food-q]').fill('ごはん');
  const rice = sheet(page).locator('[data-food-results] button', { hasText: 'ごはん（精白米）' }).first();
  await expect(rice).toBeVisible({ timeout: 15_000 });
  expect(await overflowOf(page)).toEqual([]);
  await rice.click();
  await expect(sheet(page).locator('[data-done]')).toBeVisible();
  expect(await overflowOf(page)).toEqual([]);
});

test('another person’s day is read-only; the guest sees the members’ meals and logs its own', async ({ page }) => {
  await openFood(page);
  await expect(sheet(page).locator('[data-add]')).toHaveCount(4); // my day: ＋ per meal and ✎ the goal
  await expect(sheet(page).locator('[data-focus=kcal-goal]')).toHaveCount(1);
  await sheet(page).locator('select[data-pick=who]').selectOption('B');
  await expect(sheet(page).locator('[data-food-summary]')).toHaveClass(/pB/);
  await expect(sheet(page).locator('[data-kcal-goal]')).toHaveText('目標 1,700 kcal');
  expect(await sheet(page).locator('div.row[data-entry]').count()).toBeGreaterThan(0); // うめ's meals, shown
  await expect(sheet(page).locator('button[data-entry], [data-add], [data-focus=kcal-goal], button[data-repeat], [data-repeat-new]')).toHaveCount(0); // never changed here
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

// いつもの (a repeat): the days it fills come from it, marked 🔁 (never copied into the record). From うめ's phone (A's
// breakfast is the demo's repeat already) late on 11/4: 朝ごはん → 🔁 くりかえす → 毎日, and past midnight 11/5 has
// the same items 🔁. One day's item changed (11/4) changes that day only; やめる (on 11/5) leaves 11/6 empty and 11/5 kept.
test('いつもの: a recurring 朝ごはん fills the next day; one day’s edit stays on that day; stopping empties tomorrow, today kept', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T23:40:00+09:00') });
  await page.clock.resume();
  await openFood(page, '&as=B', '');
  const b = sheet(page).locator('section[data-meal=b]');
  const rows = b.locator('[data-entry]');
  const day = sheet(page).locator('[data-food-date]');
  const names = () => rows.locator('.nm').allTextContents();
  const amounts = () => rows.locator('.amt').allTextContents();
  await expect(day).toHaveAttribute('data-food-date', '2026-11-04');
  const items = await names();
  expect(items.length).toBeGreaterThan(0);
  const before = await amounts();
  const kcal = await kcalOf(page);
  await expect(b.locator('[data-repeat]')).toHaveCount(0);

  await b.locator('[data-repeat-new]').click();
  await expect(sheet(page).locator('.navbar h2')).toHaveText('朝ごはんの いつもの');
  const lv = sheet(page).locator('[data-food-repeat=b]');
  await expect(lv.locator('[data-days=every]')).toHaveAttribute('aria-pressed', 'true'); // 毎日 first
  await expect(lv.locator('[data-day][aria-pressed=true]')).toHaveCount(7);
  await expect(lv.locator('li .nm')).toHaveText(items);
  expect(await overflowOf(page)).toEqual([]);
  // 平日, then 毎日 again: the presets set the seven days
  await lv.locator('[data-days=weekdays]').click();
  await expect(lv.locator('[data-day][aria-pressed=true]')).toHaveCount(5);
  await lv.locator('[data-days=every]').click();
  await lv.locator('[data-rep-start]').click();

  // today looks the same, its items now the repeat's
  await expect(sheet(page).locator('.navbar h2')).toHaveText('ごはん');
  await expect(b.locator('button[data-repeat]')).toHaveText('毎日');
  await expect(b.locator('[data-repeat-new]')).toHaveCount(0);
  await expect(rows).toHaveCount(items.length);
  await expect(b.locator('[data-entry][data-rep]')).toHaveCount(items.length);
  expect(await names()).toEqual(items);
  expect(await kcalOf(page)).toBe(kcal);

  // past midnight: 11/5's breakfast is the same, 🔁
  await page.clock.fastForward('30:00');
  await expect(day).toHaveAttribute('data-food-date', '2026-11-05');
  await expect(b.locator('[data-entry][data-rep]')).toHaveCount(items.length);
  expect(await names()).toEqual(items);
  expect(await amounts()).toEqual(before);

  // 11/4's first item, one portion more: 11/4 changes (its items its own now, nothing doubled), 11/5 doesn't
  await sheet(page).locator('[data-nav=back]').click();
  await expect(day).toHaveAttribute('data-food-date', '2026-11-04');
  await rows.first().click();
  await expect(sheet(page).locator('[data-done]')).toHaveText('保存');
  await sheet(page).locator('[data-step="1"]').click();
  await sheet(page).locator('[data-done]').click();
  await expect(sheet(page).locator('.navbar h2')).toHaveText('ごはん');
  await expect(rows).toHaveCount(items.length);
  await expect(b.locator('[data-entry][data-rep]')).toHaveCount(0);
  expect(await names()).toEqual(items);
  const edited = await amounts();
  expect(edited[0]).not.toBe(before[0]);
  expect(edited.slice(1)).toEqual(before.slice(1));
  await expect(b.locator('button[data-repeat]')).toHaveText('毎日'); // still my repeat, to manage
  await b.locator('button[data-repeat]').click();
  await expect(lv.locator('[data-rep-fromday]')).toHaveText('この日の内容で くりかえす'); // 11/4 differs from it now
  expect(await overflowOf(page)).toEqual([]);
  await sheet(page).locator('.navbar button').first().click(); // ‹
  await sheet(page).locator('[data-nav=on]').click();
  await expect(day).toHaveAttribute('data-food-date', '2026-11-05');
  await expect(b.locator('[data-entry][data-rep]')).toHaveCount(items.length);
  expect(await amounts()).toEqual(before);

  // やめる (asked twice): 11/5 keeps its breakfast; 11/6 has none
  await b.locator('button[data-repeat]').click();
  await expect(lv.locator('[data-rep-fromday]')).toHaveCount(0); // 11/5 is the repeat's own
  const stop = lv.locator('[data-rep-stop]');
  await stop.click();
  await expect(stop).toHaveText('ほんとうに やめる？');
  await stop.click();
  await expect(sheet(page).locator('.navbar h2')).toHaveText('ごはん');
  await expect(b.locator('[data-entry][data-rep]')).toHaveCount(items.length);
  await expect(b.locator('[data-repeat]')).toHaveText('毎日'); // filling today still: shown, not managed
  await expect(b.locator('button[data-repeat], [data-repeat-new]')).toHaveCount(0);
  await page.clock.fastForward('24:00:00');
  await expect(day).toHaveAttribute('data-food-date', '2026-11-06');
  await expect(b.locator('[data-entry]')).toHaveCount(0);
  await expect(b.locator('[data-repeat]')).toHaveCount(0);
  await sheet(page).locator('[data-nav=back]').click();
  await expect(b.locator('[data-entry][data-rep]')).toHaveCount(items.length);
  await sheet(page).locator('[data-nav=back]').click();
  expect(await amounts()).toEqual(edited);
});

test('いつもの: someone else’s repeat is shown, 🔁, never managed; the level fits the sheet’s width', async ({ page }) => {
  await openFood(page, '&as=B');
  await sheet(page).locator('select[data-pick=who]').selectOption('A');
  const b = sheet(page).locator('section[data-meal=b]');
  await expect(b.locator('span[data-repeat]')).toContainText('毎日'); // the demo's: A's breakfast, every day
  expect(await b.locator('div.row[data-rep]').count()).toBeGreaterThan(0);
  await expect(sheet(page).locator('button[data-repeat], [data-repeat-new], button[data-entry]')).toHaveCount(0);

  // A's own phone: the chip opens the repeat (its items, the days, the three actions), nothing past the sheet's edge
  await openFood(page);
  await sheet(page).locator('section[data-meal=b] button[data-repeat]').click();
  const lv = sheet(page).locator('[data-food-repeat=b]');
  await expect(lv.locator('[data-rep-save]')).toHaveAttribute('aria-disabled', 'true'); // nothing changed yet
  await expect(lv.locator('[data-rep-stop]')).toBeVisible();
  expect(await overflowOf(page)).toEqual([]);
  await lv.locator('[data-day="5"]').click(); // 土 off
  await expect(lv.locator('[data-rep-save]')).toHaveAttribute('aria-disabled', 'false');
  await lv.locator('[data-rep-save]').click();
  await expect(sheet(page).locator('section[data-meal=b] button[data-repeat]')).toHaveText('月火水木金日'); // the one going on (from tomorrow); today keeps the old one's items
});

// グラフ (design.md "Gohan"): the kcal eaten over けんこう's periods, its range row and its 🍐 Move card under it. On the
// demo's 11/4: ウェイ's meals from 11/1 (11/4 still going), so 1週 has three finished bars and today's outlined.
test('グラフ: the kcal eaten per day with the average line, the Move card under it; the period, ‹ and whose day; it fits the sheet', async ({ page }) => {
  await openFood(page);
  const tabs = sheet(page).locator('[data-tab]');
  await expect(tabs).toHaveText(['きろく', 'グラフ', 'レシピ']);
  await expect(sheet(page).locator('[data-tab=log]')).toHaveAttribute('aria-pressed', 'true'); // きろく on opening
  await expect(sheet(page).locator('select[data-pick=period]')).toHaveCount(0);
  await sheet(page).locator('[data-tab=chart]').click();
  await expect(sheet(page).locator('[data-tab=chart]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('select[data-pick=period]')).toHaveValue('week');
  await expect(sheet(page).locator('[data-food-summary]')).toHaveCount(0);

  const card = sheet(page).locator('[data-food-chart]');
  await expect(card).toHaveAttribute('data-person', 'A');
  await expect(card.locator('path.bar')).toHaveCount(4);
  await expect(card.locator('path.bar.now')).toHaveCount(1); // today: drawn, outlined
  const avg = Number((await card.locator('[data-intake-avg]').textContent())!.replace(/[^\d]/g, ''));
  expect(avg).toBeGreaterThan(0);
  await expect(card.locator('line.avg')).toHaveAttribute('data-avg', String(avg)); // the flat line at the average
  await expect(card.locator('path.goal')).toHaveCount(1); // ウェイ's kcal goal, dashed
  await expect(card.locator('.key')).toContainText('平均');
  await expect(card.locator('[data-intake-basis]')).toHaveText('1日の平均（3日分）'); // the finished days with a meal (today out)
  await expect(card.locator('.sub')).toContainText('記録 3日');
  await expect(sheet(page).locator('[data-metric=move][data-person=A]')).toBeVisible(); // the calories burned
  expect(await overflowOf(page)).toEqual([]);

  // ‹: the week before (no meal yet: no bar, no average line), › back
  const range = sheet(page).locator('[data-food-range]');
  const now = await range.textContent();
  await sheet(page).locator('[data-nav=back]').click();
  await expect(range).not.toHaveText(now!);
  await expect(card.locator('path.bar')).toHaveCount(0); // before the first meal: no bar, no stub, no average
  await expect(card.locator('rect.none, line.avg')).toHaveCount(0);
  await expect(card.locator('[data-intake-avg]')).toHaveText('–');
  await expect(sheet(page).locator('[data-metric=move]')).toBeVisible();
  await sheet(page).locator('[data-nav=on]').click();
  await expect(range).toHaveText(now!);

  // 3か月: a bar per week (each the daily average of its days with a meal), the same average
  await sheet(page).locator('select[data-pick=period]').selectOption('quarter');
  await expect(sheet(page).locator('.rl small')).toHaveText('1週ごとの 1日平均');
  await expect(card.locator('path.bar')).toHaveCount(1);
  await expect(card.locator('line.avg')).toHaveAttribute('data-avg', String(avg));
  expect(await overflowOf(page)).toEqual([]);

  // whose day: うめ's, still グラフ and 3か月
  await sheet(page).locator('select[data-pick=who]').selectOption('B');
  await expect(sheet(page).locator('[data-tab=chart]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('select[data-pick=period]')).toHaveValue('quarter');
  await expect(card).toHaveAttribute('data-person', 'B');
  await expect(sheet(page).locator('[data-metric=move][data-person=B]')).toBeVisible();
  await sheet(page).locator('[data-tab=log]').click();
  await expect(sheet(page).locator('[data-food-summary]')).toHaveClass(/pB/);
});

test('グラフ on the guest’s phone: its own kcal only (no Health of its own), a member’s with their Move card', async ({ page }) => {
  await openFood(page, '&as=G');
  await sheet(page).locator('[data-tab=chart]').click();
  await expect(sheet(page).locator('.card.empty')).toBeVisible(); // nothing logged yet
  await expect(sheet(page).locator('[data-metric]')).toHaveCount(0);
  await sheet(page).locator('select[data-pick=who]').selectOption('A');
  await expect(sheet(page).locator('[data-food-chart] path.bar')).toHaveCount(4);
  await expect(sheet(page).locator('[data-metric=move][data-person=A]')).toBeVisible();
  expect(await overflowOf(page)).toEqual([]);
});

// マイレシピ (the レシピ tab): a recipe of mine from two ingredients (ごはん 茶碗1杯 150 g = 234 kcal and 100 g typed = 156
// kcal), 2人前: its card says 195 kcal a serving and 390 in all; ごはんに ついか logs one serving (1人前, the meal the
// clock suggests: 昼 at 12:30) and きろく's total rises by it. Everything fits the sheet's width.
test('マイレシピ: make a recipe of 2 ingredients, 2人前; its card shows a serving’s kcal; ごはんに ついか adds a serving to the day', async ({ page }) => {
  await openFood(page);
  const before = await kcalOf(page);
  await expect(sheet(page).locator('[data-tab]')).toHaveText(['きろく', 'グラフ', 'レシピ']);
  await sheet(page).locator('[data-tab=recipe]').click();
  await expect(sheet(page).locator('[data-recipe]').first()).toBeVisible(); // the demo's おうちカレー (A's)
  await expect(sheet(page).locator('select[data-pick]')).toHaveCount(0); // everyone's: no whose day, no period
  await expect(sheet(page).locator('[data-food-date], [data-food-range]')).toHaveCount(0);
  expect(await overflowOf(page)).toEqual([]);

  await sheet(page).locator('[data-recipe-new]').click();
  await expect(sheet(page).locator('.navbar h2')).toHaveText('あたらしい レシピ');
  const lv = sheet(page).locator('[data-recipe-level=edit]');
  await expect(lv.locator('[data-recipe-save]')).toHaveAttribute('aria-disabled', 'true'); // no name, no ingredient yet
  await expect(lv.locator('[data-recipe-remove]')).toHaveCount(0);
  await lv.locator('[data-recipe-n]').fill('テストごはん');
  await expect(lv.locator('[data-recipe-sv]')).toHaveText('2人前');
  const pick = async (grams?: string) => {
    await sheet(page).locator('[data-recipe-add]').click();
    await expect(sheet(page).locator('.navbar h2')).toHaveText('ざいりょうを ついか');
    await expect(sheet(page).locator('[data-food-recipes]')).toHaveCount(0); // no recipe in a recipe
    await sheet(page).locator('[data-food-q]').fill('ごはん');
    const rice = sheet(page).locator('[data-food-results] button', { hasText: 'ごはん（精白米）' }).first();
    await expect(rice).toBeVisible({ timeout: 15_000 });
    await rice.click();
    await expect(sheet(page).locator('[data-pick-meal]')).toHaveCount(0); // an ingredient: no meal
    if (grams) await sheet(page).locator('[data-grams]').fill(grams);
    await expect(sheet(page).locator('[data-done]')).toHaveText('ついか');
    expect(await overflowOf(page)).toEqual([]);
    await sheet(page).locator('[data-done]').click();
    await expect(sheet(page).locator('.navbar h2')).toHaveText('あたらしい レシピ');
  };
  await pick();
  await pick('100');
  await expect(lv.locator('[data-recipe-item]')).toHaveCount(2);
  await expect(lv.locator('[data-recipe-item]').first()).toContainText('茶碗1杯（150g）');
  await expect(lv.locator('[data-recipe-n]')).toHaveValue('テストごはん'); // the draft kept across the levels
  await expect(lv.locator('[data-recipe-live-per]')).toHaveText('195 kcal');
  await expect(lv.locator('[data-recipe-live-total]')).toHaveText('ぜんぶで 390 kcal（250g）');
  // 3人前 and back: the serving follows
  await lv.locator('[data-sv-step="1"]').click();
  await expect(lv.locator('[data-recipe-live-per]')).toHaveText('130 kcal');
  await lv.locator('[data-sv-step="-1"]').click();
  expect(await overflowOf(page)).toEqual([]);
  await lv.locator('[data-recipe-save]').click();

  await expect(sheet(page).locator('.navbar h2')).toHaveText('ごはん');
  const card = sheet(page).locator('[data-recipe]').first(); // the latest changed first
  await expect(card.locator('.nm')).toHaveText('テストごはん');
  await expect(card).toHaveAttribute('data-owner', 'A');
  await expect(card.locator('[data-recipe-per]')).toHaveText('195 kcal');
  await expect(card.locator('[data-recipe-total]')).toHaveText('ぜんぶで 390 kcal');
  await expect(card).toContainText('2人前');
  expect(await overflowOf(page)).toEqual([]);

  await card.locator('[data-recipe-log]').click();
  await expect(sheet(page).locator('.navbar h2')).toHaveText('ごはんに ついか');
  await expect(sheet(page).locator('.chip[aria-pressed=true]')).toContainText('1人前');
  await expect(sheet(page).locator('[data-pick-meal=l]')).toHaveAttribute('aria-pressed', 'true'); // 12:30
  await expect(sheet(page).locator('[data-food-live] .k')).toContainText('195');
  await sheet(page).locator('[data-done]').click();
  await expect(sheet(page).locator('[data-tab=log]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => kcalOf(page)).toBe(before + 195);
  await expect(sheet(page).locator('section[data-meal=l] [data-entry]').last()).toContainText('テストごはん');
  await expect(sheet(page).locator('section[data-meal=l] [data-entry]').last()).toContainText('1人前（125g）');

  // mine: the card opens the editor, ほぞん waits until something changes; けす asks twice
  await sheet(page).locator('[data-tab=recipe]').click();
  await card.locator('[data-recipe-open]').click();
  await expect(sheet(page).locator('.navbar h2')).toHaveText('レシピ');
  await expect(lv.locator('[data-recipe-save]')).toHaveAttribute('aria-disabled', 'true');
  const rm = lv.locator('[data-recipe-remove]');
  await rm.click();
  await expect(rm).toHaveText('ほんとうに けす？');
  await rm.click();
  await expect(sheet(page).locator('[data-recipe] .nm', { hasText: 'テストごはん' })).toHaveCount(0);
});

// Everyone's recipes: うめ's phone sees ウェイ's おうちカレー read-only, logs a serving of it, and copies it (a recipe of
// うめ's own, opened in the editor). From a meal's ＋ the search offers マイレシピ too.
test('マイレシピ: someone else’s recipe is read-only, logged and copied; the meal search offers recipes', async ({ page }) => {
  await openFood(page, '&as=B');
  const before = await kcalOf(page);
  await sheet(page).locator('[data-tab=recipe]').click();
  const curry = sheet(page).locator('[data-recipe][data-owner=A]', { hasText: 'おうちカレー' });
  await expect(curry).toContainText('4人前');
  const per = Number((await curry.locator('[data-recipe-per]').textContent())!.replace(/[^\d]/g, ''));
  expect(per).toBeGreaterThan(0);
  await curry.locator('[data-recipe-open]').click();
  const view = sheet(page).locator('[data-recipe-level=view]');
  await expect(view.locator('[data-recipe-name]')).toHaveText('おうちカレー');
  await expect(view).toContainText('の レシピ');
  await expect(view.locator('input, button[data-recipe-item], [data-recipe-add], [data-recipe-save], [data-recipe-remove], [data-sv-step]')).toHaveCount(0);
  await expect(view.locator('[data-recipe-items] li')).toHaveCount(6);
  expect(await overflowOf(page)).toEqual([]);

  await view.locator('[data-recipe-log]').click();
  await expect(sheet(page).locator('[data-food-live] .k')).toContainText(String(per));
  await sheet(page).locator('[data-pick-meal=d]').click();
  await sheet(page).locator('[data-done]').click();
  await expect.poll(async () => Math.abs((await kcalOf(page)) - (before + per))).toBeLessThanOrEqual(1); // (the day sums unrounded kcal)
  await expect(sheet(page).locator('section[data-meal=d] [data-entry]').last()).toContainText('おうちカレー');

  // the copy: mine now, in the editor (its name, servings and ingredients), and listed as うめ's
  await sheet(page).locator('[data-tab=recipe]').click();
  await curry.locator('[data-recipe-open]').click();
  await view.locator('[data-recipe-copy]').click();
  const lv = sheet(page).locator('[data-recipe-level=edit]');
  await expect(lv.locator('[data-recipe-n]')).toHaveValue('おうちカレー');
  await expect(lv.locator('[data-recipe-sv]')).toHaveText('4人前');
  await expect(lv.locator('[data-recipe-item]')).toHaveCount(6);
  await expect(lv.locator('[data-recipe-remove]')).toHaveCount(1);
  await sheet(page).locator('.navbar button').first().click(); // ‹
  await expect(sheet(page).locator('[data-recipe][data-owner=B]', { hasText: 'おうちカレー' })).toHaveCount(1);
  await expect(curry).toHaveCount(1);

  // a meal's ＋: マイレシピ after 最近, and the matching ones when typed; one → its amount → 追加
  await sheet(page).locator('[data-tab=log]').click();
  const now = await kcalOf(page);
  await sheet(page).locator('[data-add=s]').click();
  await expect(sheet(page).locator('[data-food-recipes] [data-recipe]')).toHaveCount(2);
  await sheet(page).locator('[data-food-q]').fill('カレー');
  const hit = sheet(page).locator('[data-food-recipes] button', { hasText: 'おうちカレー' }).first();
  await expect(hit).toBeVisible();
  await hit.click();
  await expect(sheet(page).locator('[data-pick-meal=s]')).toHaveAttribute('aria-pressed', 'true'); // the meal's own
  await sheet(page).locator('[data-done]').click();
  await expect.poll(async () => Math.abs((await kcalOf(page)) - (now + per))).toBeLessThanOrEqual(1);
});
