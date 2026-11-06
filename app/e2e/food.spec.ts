// ごはん (docs/design.md "Gohan"): the meal log, the HUD cluster's bowl (between the dumbbell and the leaf). Open it, search ごはん, add
// 茶碗1杯 to 朝ごはん and see the day's total go up; another person's day is read-only (no ＋, no entry to tap), and the
// guest sees the members' meals and logs its own. On `?demo` (its meal rows: model/food.ts over store/demo/rows.ts).
import { expect, test, type Page } from './fixtures.ts';

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

/** What sticks out past the open sheet's right edge (its first three, by class): nothing, on every level (once a
 *  level's slide-in has played). */
const overflowOf = (page: Page) => sheet(page).evaluate(async (d) => {
  await Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished));
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
  // back in the meal's search for the next food, this one listed at its top; おわり → the day
  await expect(sheet(page).locator('.navbar h2')).toHaveText('朝ごはん');
  await expect(sheet(page).locator('[data-food-added] [data-added]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-food-q]')).toBeFocused();
  await sheet(page).locator('[data-food-finish]').click();

  await expect(sheet(page).locator('.navbar h2')).toHaveText('ごはん');
  await expect.poll(() => kcalOf(page)).toBe(before + 234);
  await expect(breakfast).toHaveCount(n + 1);
  await expect(breakfast.last()).toContainText('茶碗1杯（150g）');
  // it is mine: a tap opens its amount, with ほぞん and けす; けす takes it off again
  await breakfast.last().click();
  await expect(sheet(page).locator('[data-done]')).toHaveText('ほぞん');
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
  await expect(sheet(page).locator('button[data-goal=kcal-goal]')).toHaveCount(1);
  await sheet(page).locator('select[data-pick=who]').selectOption('B');
  await expect(sheet(page).locator('[data-food-summary]')).toHaveClass(/pB/);
  await expect(sheet(page).locator('[data-goal=kcal-goal]')).toHaveText('目標 1,700 kcal 前後');
  expect(await sheet(page).locator('div.row[data-entry]').count()).toBeGreaterThan(0); // うめ's meals, shown
  await expect(sheet(page).locator('button[data-entry], [data-add], button[data-goal], button[data-repeat], [data-repeat-new]')).toHaveCount(0); // never changed here
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
// breakfast is the demo's repeat already) late on 11/4: 朝ごはん → いつものに する → 毎日, and past midnight 11/5 has
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
  await expect(sheet(page).locator('[data-done]')).toHaveText('ほぞん');
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
  await expect(lv.locator('[data-rep-fromday]')).toHaveText('この日の内容を いつものに する'); // 11/4 differs from it now
  expect(await overflowOf(page)).toEqual([]);
  await sheet(page).getByRole('button', { name: 'もどる' }).click(); // ‹
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
  // today's rows still carry the old one's id, but they are the same foods and amounts: nothing to take from the day
  await sheet(page).locator('section[data-meal=b] button[data-repeat]').click();
  await expect(lv.locator('[data-rep-save]')).toBeVisible();
  await expect(lv.locator('[data-rep-fromday]')).toHaveCount(0);
});

// グラフ (design.md "Gohan"): the kcal eaten over けんこう's periods, its range row (no Move card: けんこう has it). On the
// demo's 11/4: ウェイ's meals from 11/1 (11/4 still going), so 1週 has three finished bars and today's outlined.
test('グラフ: the kcal eaten per day with the average line; the period, ‹ and whose day; it fits the sheet', async ({ page }) => {
  await openFood(page);
  const tabs = sheet(page).locator('[data-tab]');
  await expect(tabs).toHaveText(['きろく', 'グラフ']);
  await expect(sheet(page).locator('[data-tab=log]')).toHaveAttribute('aria-pressed', 'true'); // きろく on opening
  await expect(sheet(page).locator('select[data-pick=period]')).toHaveCount(0);
  await sheet(page).locator('[data-tab=chart]').click();
  await expect(sheet(page).locator('[data-tab=chart]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('select[data-pick=period]')).toHaveValue('week');
  await expect(sheet(page).locator('[data-food-summary]')).toHaveCount(0);

  const card = sheet(page).locator('[data-food-chart=k]');
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
  await expect(sheet(page).locator('[data-metric]')).toHaveCount(0); // no Move card: けんこう has it
  expect(await overflowOf(page)).toEqual([]);

  // ‹: nothing before the first meal (the Move card's older activity no longer opens the past here)
  await expect(sheet(page).locator('[data-nav=back]')).toHaveAttribute('aria-disabled', 'true');

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
  await sheet(page).locator('[data-tab=log]').click();
  await expect(sheet(page).locator('[data-food-summary]')).toHaveClass(/pB/);
});

test('グラフ on the guest’s phone: its own kcal only, a member’s too', async ({ page }) => {
  await openFood(page, '&as=G');
  await sheet(page).locator('[data-tab=chart]').click();
  // nothing logged yet: each intake card says so under its goal (the guest's own, set there)
  await expect(sheet(page).locator('[data-food-chart] [data-food-empty]')).toHaveCount(7);
  await expect(sheet(page).locator('[data-food-chart=k] button[data-goal]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-metric]')).toHaveCount(0);
  await sheet(page).locator('select[data-pick=who]').selectOption('A');
  await expect(sheet(page).locator('[data-food-chart=k] path.bar')).toHaveCount(4);
  expect(await overflowOf(page)).toEqual([]);
});

// "Warn, allow" (design.md "Gohan"): a kcal goal under my resting energy (the demo's profile: ウェイ, a man) or the safe
// floor gets a gentle note under the field as it's typed, and still saves; none for a usual goal or another nutrient.
test('a low kcal goal: a gentle note under the field (the resting energy), and it still saves; none for a usual one', async ({ page }) => {
  await openFood(page);
  const kcal = sheet(page).locator('button[data-goal=kcal-goal]');
  await kcal.click();
  const tray = sheet(page).locator('[data-food-summary] form.tray');
  const warn = tray.locator('[data-goal-warn]');
  await expect(warn).toHaveCount(0); // 2,200: a usual goal
  await tray.getByRole('textbox').fill('1300');
  await expect(warn).toHaveText(/^きそたいしゃ（約1,[5-9]\d\d kcal）より ひくい めやす です。きんにくが へりやすく なります$/);
  await tray.getByRole('textbox').fill('1900');
  await expect(warn).toHaveCount(0);
  await tray.getByRole('textbox').fill('1300');
  await expect(warn).toHaveCount(1);
  await tray.getByRole('button', { name: 'けってい' }).click(); // allowed
  await expect(kcal).toHaveText('目標 1,300 kcal 前後');
  await expect(tray).toHaveCount(0);
  // the same note on グラフ's kcal card; not on another nutrient's
  await sheet(page).locator('[data-tab=chart]').click();
  const k = sheet(page).locator('[data-food-chart=k]');
  await k.locator('button[data-goal]').click();
  await expect(k.locator('form.tray [data-goal-warn]')).toContainText('きそたいしゃ');
  await k.locator('form.tray').getByRole('button', { name: 'やめる' }).click();
  const p = sheet(page).locator('[data-food-chart=p]');
  await p.locator('button[data-goal]').click();
  await p.locator('form.tray').getByRole('textbox').fill('10');
  await expect(p.locator('form.tray [data-goal-warn]')).toHaveCount(0);
});

// The goals (design.md "Gohan"): kcal at the summary's and the kcal chart's upper right, protein, fat, carbs and salt
// on their charts, each set in place with けんこう's control (GoalEdit), mine only; protein's default 1.6 g × the latest
// weigh-in until set, the others none.
test('the goals: set in place on my cards (kcal, protein, salt), shown on the day\'s summary; anyone else\'s read-only', async ({ page }) => {
  await openFood(page);
  // きろく: the kcal goal's chip; a tap opens its tray in the summary, no level
  const kcal = sheet(page).locator('button[data-goal=kcal-goal]');
  await expect(kcal).toHaveText('目標 2,200 kcal 前後');
  await kcal.click();
  const tray = sheet(page).locator('[data-food-summary] form.tray');
  await expect(tray).toContainText('カロリーの目標（1日）');
  await expect(tray.getByRole('textbox')).toHaveValue('2,200');
  await tray.getByRole('button', { name: 'ふやす' }).click();
  await tray.getByRole('button', { name: 'けってい' }).click();
  await expect(kcal).toHaveText('目標 2,250 kcal 前後');
  await expect(sheet(page).getByRole('status')).toContainText('カロリーの目標を かえました');
  await sheet(page).getByRole('status').getByRole('button', { name: 'とじる' }).click();
  // the nutrient tiles: protein's default goal (1.6 g × ウェイ's weigh-in), salt's from the demo's profile (a man: 7.5 g,
  // model/profile.ts saltDefault), fat and carbs none yet
  await expect(sheet(page).locator('[data-nutrient=p] small')).toHaveText(/^目標 \d+\sg\s以上$/); // (no-break spaces: it wraps only after 目標)
  await expect(sheet(page).locator('[data-nutrient=s] small')).toHaveText(/^目標 7\.5\sg\s以下$/);
  await expect(sheet(page).locator('[data-nutrient=fa] small, [data-nutrient=c] small')).toHaveCount(0);

  // グラフ: a card each, kcal, protein, fat, carbs, salt, fibre, alcohol; each with its goal's chip
  await sheet(page).locator('[data-tab=chart]').click();
  const cards = sheet(page).locator('[data-food-chart]');
  await expect(cards).toHaveCount(7);
  expect(await cards.evaluateAll((cs) => cs.map((c) => c.getAttribute('data-food-chart')))).toEqual(['k', 'p', 'fa', 'c', 's', 'fi', 'al']);
  await expect(sheet(page).locator('[data-food-chart] h3')).toHaveText(['たべた カロリー', 'たんぱく質', '脂質', '炭水化物', '塩分', '食物繊維', 'アルコール']);
  // each its direction: kcal near a value, protein at least, fat at most, carbs near a value, salt at most, fibre at
  // least, alcohol at most
  expect(await cards.evaluateAll((cs) => cs.map((c) => c.getAttribute('data-goal-dir')))).toEqual(['target', 'atLeast', 'atMost', 'target', 'atMost', 'atLeast', 'atMost']);
  await expect(sheet(page).locator('[data-food-chart=k] [data-goal-line]')).toHaveText(/^目標 2,250\skcal\s前後$/);
  await expect(sheet(page).locator('[data-food-chart=k] button[data-goal]')).toHaveText('目標 2,250 kcal 前後');
  const protein = sheet(page).locator('[data-food-chart=p]');
  await expect(protein.locator('[data-intake-avg]')).toHaveText(/^\d+\.\d g$/);
  await expect(protein.locator('path.bar')).toHaveCount(4);
  await expect(protein.locator('path.goal')).toHaveCount(1); // the default, dashed
  const salt = sheet(page).locator('[data-food-chart=s]');
  await expect(salt.locator('button[data-goal]')).toHaveText('目標 7.5 g 以下'); // the profile's default
  await expect(salt.locator('path.goal')).toHaveCount(1);
  // salt: 0.5 g steps from 7.5; 7.3 refused
  await salt.locator('button[data-goal]').click();
  const sTray = salt.locator('form.tray');
  await expect(sTray).toContainText('塩分の目標（1日）');
  await sTray.getByRole('textbox').fill('7.3');
  await sTray.getByRole('button', { name: 'けってい' }).click();
  await expect(sTray.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  await expect(sTray.locator('.hint')).toHaveText('1〜20 g、0.5 gずつで入れてね');
  await sTray.getByRole('textbox').fill('');
  await sTray.getByRole('button', { name: 'へらす' }).click();
  await expect(sTray.getByRole('textbox')).toHaveValue('7.0');
  await sTray.getByRole('button', { name: 'けってい' }).click();
  await expect(salt.locator('button[data-goal]')).toHaveText('目標 7.0 g 以下');
  await expect(salt.locator('path.goal')).toHaveCount(1);
  // protein: set over the default, then cleared back to it
  await protein.locator('button[data-goal]').click();
  await protein.locator('form.tray').getByRole('textbox').fill('130');
  await protein.locator('form.tray').getByRole('button', { name: 'けってい' }).click();
  await expect(protein.locator('button[data-goal]')).toHaveText('目標 130 g 以上');
  await protein.locator('button[data-goal]').click();
  await protein.locator('form.tray').getByRole('button', { name: '目標をなくす' }).click();
  await expect(protein.locator('button[data-goal]')).not.toHaveText('目標 130 g 以上');
  expect(await overflowOf(page)).toEqual([]);

  // きろく shows them: salt's goal on its tile
  await sheet(page).locator('[data-tab=log]').click();
  await expect(sheet(page).locator('[data-nutrient=s] small')).toHaveText('目標 7.0 g 以下');
  // うめ's: shown, never set here
  await sheet(page).locator('select[data-pick=who]').selectOption('B');
  await expect(sheet(page).locator('span[data-goal=kcal-goal]')).toHaveText('目標 1,700 kcal 前後');
  await sheet(page).locator('[data-tab=chart]').click();
  await expect(sheet(page).locator('[data-food-chart] span[data-goal]')).toHaveCount(7);
  await expect(sheet(page).locator('[data-food-chart] button[data-goal]')).toHaveCount(0);
});

// マイレシピ: from a meal's search, レシピを つくる (under the field, beside 食品を つくる): a recipe of mine from two
// ingredients (ごはん 茶碗1杯 150 g = 234 kcal and 100 g typed = 156 kcal), 2人前; ほぞん comes back to the search, which
// lists it at 195 kcal a serving; picked, its amount logs one serving (1人前) to the meal and きろく's total rises by it.
// Its amount opens it again (mine: the editor; けす asked twice). Everything fits the sheet's width.
test('マイレシピ: made from a meal’s search (2 ingredients, 2人前), listed there, logged as a serving; its amount opens the editor', async ({ page }) => {
  await openFood(page);
  const before = await kcalOf(page);
  const h2 = sheet(page).locator('.navbar h2');
  await expect(sheet(page).locator('[data-tab]')).toHaveText(['きろく', 'グラフ']);
  await sheet(page).locator('[data-add=l]').click();
  // the two ＋ buttons side by side, right under the field, inside the sheet (once the level has slid in)
  expect(await overflowOf(page)).toEqual([]);
  const [box, rb, cb] = await Promise.all([sheet(page).locator('form[role=search]'), sheet(page).locator('[data-recipe-new]'),
    sheet(page).locator('[data-custom-new]')].map(async (l) => (await l.boundingBox())!));
  await expect(sheet(page).locator('[data-recipe-new]')).toHaveText('レシピを つくる');
  await expect(sheet(page).locator('[data-custom-new]')).toHaveText('食品を つくる');
  expect(rb.y).toBeGreaterThan(box.y + box.height - 1);
  expect(rb.y).toBeLessThan(box.y + box.height + 24);
  expect(Math.abs(rb.y - cb.y)).toBeLessThan(1);
  expect(cb.x).toBeGreaterThan(rb.x + rb.width);

  await sheet(page).locator('[data-recipe-new]').click();
  await expect(h2).toHaveText('あたらしい レシピ');
  const lv = sheet(page).locator('[data-recipe-level=edit]');
  await expect(lv.locator('[data-recipe-save]')).toHaveAttribute('aria-disabled', 'true'); // no name, no ingredient yet
  await expect(lv.locator('[data-recipe-remove]')).toHaveCount(0);
  await lv.locator('[data-recipe-n]').fill('テストごはん');
  await expect(lv.locator('[data-recipe-sv]')).toHaveText('2人前');
  const pick = async (grams?: string) => {
    await sheet(page).locator('[data-recipe-add]').click();
    await expect(h2).toHaveText('ざいりょうを ついか');
    await expect(sheet(page).locator('[data-food-recipes], [data-recipe-new]')).toHaveCount(0); // no recipe in a recipe
    await sheet(page).locator('[data-food-q]').fill('ごはん');
    const rice = sheet(page).locator('[data-food-results] button', { hasText: 'ごはん（精白米）' }).first();
    await expect(rice).toBeVisible({ timeout: 15_000 });
    await rice.click();
    await expect(sheet(page).locator('[data-pick-meal]')).toHaveCount(0); // an ingredient: no meal
    if (grams) await sheet(page).locator('[data-grams]').fill(grams);
    await expect(sheet(page).locator('[data-done]')).toHaveText('ついか');
    expect(await overflowOf(page)).toEqual([]);
    await sheet(page).locator('[data-done]').click();
    await expect(h2).toHaveText('あたらしい レシピ');
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

  // back in the search: listed first (the latest changed), a serving's kcal
  await expect(h2).toHaveText('昼ごはん');
  const row = sheet(page).locator('[data-food-recipes] [data-recipe]').first();
  await expect(row.locator('.nm')).toHaveText('テストごはん');
  await expect(row).toContainText('195 kcal');
  await expect(row).toContainText('2人前');
  await row.click();
  await expect(h2).toHaveText('ごはんに ついか');
  await expect(sheet(page).locator('.chip[aria-pressed=true]')).toContainText('1人前');
  await expect(sheet(page).locator('[data-pick-meal=l]')).toHaveAttribute('aria-pressed', 'true'); // the meal's own
  await expect(sheet(page).locator('[data-food-live] .k')).toContainText('195');
  expect(await overflowOf(page)).toEqual([]);
  await sheet(page).locator('[data-done]').click();
  await sheet(page).locator('[data-food-finish]').click(); // おわり: the day
  await expect(h2).toHaveText('ごはん');
  await expect.poll(() => kcalOf(page)).toBe(before + 195);
  await expect(sheet(page).locator('section[data-meal=l] [data-entry]').last()).toContainText('テストごはん');
  await expect(sheet(page).locator('section[data-meal=l] [data-entry]').last()).toContainText('1人前（125g）');

  // mine: its amount opens the editor, ほぞん waits until something changes; けす asks twice, back to the search
  await sheet(page).locator('[data-add=d]').click();
  await sheet(page).locator('[data-food-recipes] [data-recipe]', { hasText: 'テストごはん' }).click();
  await expect(sheet(page).locator('[data-amount-open]')).toHaveText('レシピを ひらく');
  await sheet(page).locator('[data-amount-open]').click();
  await expect(h2).toHaveText('レシピ');
  await expect(lv.locator('[data-recipe-n]')).toHaveValue('テストごはん');
  await expect(lv.locator('[data-recipe-save]')).toHaveAttribute('aria-disabled', 'true');
  const rm = lv.locator('[data-recipe-remove]');
  await rm.click();
  await expect(rm).toHaveText('ほんとうに けす？');
  await rm.click();
  await expect(h2).toHaveText('夜ごはん');
  await expect(sheet(page).locator('[data-food-recipes] [data-recipe]', { hasText: 'テストごはん' })).toHaveCount(0);
});

// Everyone's recipes: うめ's phone finds ウェイ's おうちカレー in a meal's search; its amount opens it read-only, whose
// ごはんに ついか comes back to the amount; logged; and copied (a recipe of うめ's own, opened in the editor).
test('マイレシピ: someone else’s recipe in the meal search is read-only from its amount, logged and copied', async ({ page }) => {
  await openFood(page, '&as=B');
  const before = await kcalOf(page);
  const h2 = sheet(page).locator('.navbar h2');
  await sheet(page).locator('[data-add=d]').click();
  const curry = sheet(page).locator('[data-food-recipes] [data-recipe]', { hasText: 'おうちカレー' });
  await expect(curry).toHaveCount(1);
  await expect(curry).toContainText('4人前');
  await curry.click();
  const per = Number((await sheet(page).locator('[data-food-live] .k').textContent())!.replace(/[^\d]/g, ''));
  expect(per).toBeGreaterThan(0);
  await sheet(page).locator('[data-amount-open]').click();
  const view = sheet(page).locator('[data-recipe-level=view]');
  await expect(view.locator('[data-recipe-name]')).toHaveText('おうちカレー');
  await expect(view).toContainText('の レシピ');
  await expect(view.locator('input, button[data-recipe-item], [data-recipe-add], [data-recipe-save], [data-recipe-remove], [data-sv-step]')).toHaveCount(0);
  await expect(view.locator('[data-recipe-items] li')).toHaveCount(6);
  expect(await overflowOf(page)).toEqual([]);

  await view.locator('[data-recipe-log]').click();
  await expect(h2).toHaveText('ごはんに ついか');
  await expect(sheet(page).locator('[data-pick-meal=d]')).toHaveAttribute('aria-pressed', 'true');
  await sheet(page).locator('[data-done]').click();
  await sheet(page).locator('[data-food-finish]').click(); // おわり: the day
  await expect.poll(async () => Math.abs((await kcalOf(page)) - (before + per))).toBeLessThanOrEqual(1); // (the day sums unrounded kcal)
  await expect(sheet(page).locator('section[data-meal=d] [data-entry]').last()).toContainText('おうちカレー');

  // the copy: mine now, in the editor (its name, servings and ingredients), and in the search as うめ's too
  const now = await kcalOf(page);
  await sheet(page).locator('[data-add=s]').click();
  await curry.click();
  await sheet(page).locator('[data-amount-open]').click();
  await view.locator('[data-recipe-copy]').click();
  const lv = sheet(page).locator('[data-recipe-level=edit]');
  await expect(lv.locator('[data-recipe-n]')).toHaveValue('おうちカレー');
  await expect(lv.locator('[data-recipe-sv]')).toHaveText('4人前');
  await expect(lv.locator('[data-recipe-item]')).toHaveCount(6);
  await expect(lv.locator('[data-recipe-remove]')).toHaveCount(1);
  await sheet(page).getByRole('button', { name: 'もどる' }).click(); // ‹: the amount
  await expect(h2).toHaveText('ごはんに ついか');
  await sheet(page).getByRole('button', { name: 'もどる' }).click(); // ‹: the search
  await expect(curry).toHaveCount(2);

  // typed: the matching ones; one → its amount (the meal's own) → ついか
  await sheet(page).locator('[data-food-q]').fill('カレー');
  await expect(curry.first()).toBeVisible();
  await curry.first().click();
  await expect(sheet(page).locator('[data-pick-meal=s]')).toHaveAttribute('aria-pressed', 'true');
  await sheet(page).locator('[data-done]').click();
  await sheet(page).locator('[data-food-finish]').click(); // おわり: the day
  await expect.poll(async () => Math.abs((await kcalOf(page)) - (now + per))).toBeLessThanOrEqual(1);
});

// The title bar (the user: "move the user selector to the left of the title in the same row"): whose day left of
// ごはん, the title still centred, ✕ at the right; a level's ‹ takes the pill's place.
// グラフ's period sits in the range row, right of きょう, at the row's right end.
test('whose day sits in the title bar, left of ごはん; a level’s ‹ takes its place; グラフ’s period beside きょう; きろく’s art', async ({ page }) => {
  await openFood(page);
  const bar = sheet(page).locator('.navbar');
  const who = bar.locator('select[data-pick=who]');
  await expect(who).toHaveValue('A');
  await expect(who).toHaveAccessibleName('だれの ごはん');
  const [w, ttl, x, d] = await Promise.all([who, bar.locator('h2'), bar.locator('button.close'), sheet(page)].map(async (l) => (await l.boundingBox())!));
  expect(w.x + w.width).toBeLessThanOrEqual(ttl.x + 1);
  expect(Math.abs(w.y + w.height / 2 - (ttl.y + ttl.height / 2))).toBeLessThan(4);
  expect(Math.abs(ttl.x + ttl.width / 2 - (d.x + d.width / 2))).toBeLessThan(3); // centred
  expect(x.x).toBeGreaterThan(ttl.x + ttl.width);
  expect(w.height).toBeGreaterThanOrEqual(44);
  await expect(sheet(page).locator('.food select[data-pick=who]')).toHaveCount(0); // not under the tabs any more
  await expect.poll(() => sheet(page).locator('[data-tab=log] img').evaluate((i: HTMLImageElement) => i.dataset.src ?? i.src)).toContain('rice-cooker');

  await sheet(page).locator('[data-add=b]').click(); // a level: ‹, no pill
  await expect(bar.locator('h2')).toHaveText('朝ごはん');
  await expect(who).toHaveCount(0);
  await expect(bar.getByRole('button', { name: 'もどる' })).toBeVisible();
  await bar.getByRole('button', { name: 'もどる' }).click();
  await expect(who).toBeVisible();

  await sheet(page).locator('[data-tab=chart]').click();
  await expect(who).toBeVisible();
  expect(await overflowOf(page)).toEqual([]); // (the tab's content has slid in)
  const [tabs, today, per] = await Promise.all([sheet(page).locator('[data-tab=chart]'), sheet(page).locator('[data-nav=today]'),
    sheet(page).locator('select[data-pick=period]')].map(async (l) => (await l.boundingBox())!));
  const back = (await sheet(page).locator('[data-nav=back]').boundingBox())!;
  const pressed = (await sheet(page).locator('[data-nav=back]').getAttribute('aria-disabled')) === 'true' ? 4 : 0; // (off: 4px lower)
  expect(Math.abs(per.y + per.height / 2 - (back.y + back.height / 2 - pressed))).toBeLessThan(3); // in the range row
  expect(per.x).toBeGreaterThan(today.x + today.width); // right of きょう
  expect(Math.abs(per.x + per.width - (tabs.x + tabs.width))).toBeLessThan(3); // at the row's right end
  expect(per.height).toBeGreaterThanOrEqual(44);
});

test('a いつもの’s entry: opened and ‹ leaves the day the repeat’s; ほぞん takes the day out of it; けす has とりけす', async ({ page }) => {
  await openFood(page);
  const b = sheet(page).locator('section[data-meal=b]');
  const reps = b.locator('[data-entry][data-rep]');
  const n = await reps.count();
  expect(n).toBeGreaterThan(0); // the demo's: ウェイ's breakfast, every day
  await reps.first().click();
  await expect(sheet(page).locator('[data-done]')).toHaveText('ほぞん'); // open at once
  await expect(sheet(page).locator('.chip[aria-pressed=true]')).toContainText('茶碗1杯');
  await sheet(page).getByRole('button', { name: 'もどる' }).click();
  await expect(reps).toHaveCount(n); // ‹ changed nothing
  await expect(reps.first()).toBeFocused(); // back on what opened it
  await reps.first().click();
  await sheet(page).locator('[data-done]').click(); // ほぞん, unchanged: the day is its own now
  await expect(reps).toHaveCount(0);
  await expect(b.locator('[data-entry]')).toHaveCount(n);
  await expect(b.locator('button[data-repeat]')).toHaveText('毎日'); // still the repeat's days on the chip

  // けす: one tap, the banner low with とりけす, which puts it back
  const before = await kcalOf(page);
  const first = await b.locator('[data-entry] .nm').first().textContent();
  await b.locator('[data-entry]').first().click();
  await sheet(page).locator('[data-remove]').click();
  await expect(b.locator('[data-entry]')).toHaveCount(n - 1);
  const banner = sheet(page).locator('.banner');
  await expect(banner).toContainText(`「${first}」を けしました`);
  const [bb, d] = [(await banner.boundingBox())!, (await sheet(page).boundingBox())!];
  expect(bb.y).toBeGreaterThan(d.y + d.height / 2); // docked low, off the day's top
  await banner.getByRole('button', { name: 'とりけす' }).click();
  await expect(b.locator('[data-entry]')).toHaveCount(n);
  await expect.poll(() => kcalOf(page)).toBe(before);
  await expect(b.locator('[data-entry] .nm')).toContainText([first!]);
});

test('＋ focuses the search; counted portions step whole, rice by half; drinks in ml; the confirmation low', async ({ page }) => {
  await openFood(page);
  await sheet(page).locator('[data-add=d]').click();
  await expect(sheet(page).locator('[data-food-q]')).toBeFocused(); // in the tap: the iPhone's keyboard comes up
  await sheet(page).locator('[data-food-q]').fill('焼き鳥');
  const yakitori = sheet(page).locator('[data-food-results] button', { hasText: '焼き鳥' }).first();
  await expect(yakitori).toBeVisible({ timeout: 15_000 });
  await yakitori.click();
  await expect(sheet(page).locator('.chip[aria-pressed=true]')).toContainText('1本');
  await sheet(page).locator('[data-step="1"]').click();
  await expect(sheet(page).locator('.mult')).toHaveText('×2'); // a whole 本
  await sheet(page).locator('[data-step="1"]').click();
  await expect(sheet(page).locator('.mult')).toHaveText('×3');
  await sheet(page).locator('[data-step="-1"]').click();
  await sheet(page).locator('[data-step="-1"]').click();
  await sheet(page).locator('[data-step="-1"]').click();
  await expect(sheet(page).locator('.mult')).toHaveText('×1'); // never under one
  await sheet(page).getByRole('button', { name: 'もどる' }).click();

  await sheet(page).locator('[data-food-q]').fill('ごはん');
  const rice = sheet(page).locator('[data-food-results] button', { hasText: 'ごはん（精白米）' }).first();
  await expect(rice).toBeVisible();
  await expect(rice.locator('.kc small')).toHaveText('茶碗1杯（150g）'); // the portion with its weight, once
  await rice.click();
  await sheet(page).locator('[data-step="1"]').click();
  await expect(sheet(page).locator('.mult')).toHaveText('×1.5'); // 茶碗: by half
  await sheet(page).getByRole('button', { name: 'もどる' }).click();

  // a piece food's 1人前 steps by the piece: おにぎり ＋ is two of them, not ×1.5
  await sheet(page).locator('[data-food-q]').fill('おにぎり');
  await sheet(page).locator('[data-food-results] [data-item="dishes:onigiri-shake"]').click();
  await expect(sheet(page).locator('.chip[aria-pressed=true]')).toContainText('1人前');
  await sheet(page).locator('[data-step="1"]').click();
  await expect(sheet(page).locator('.mult')).toHaveText('×2');
  await sheet(page).getByRole('button', { name: 'もどる' }).click();

  await sheet(page).locator('[data-food-q]').fill('生ビール');
  const beer = sheet(page).locator('[data-food-results] button', { hasText: '生ビール' }).first();
  await expect(beer).toBeVisible();
  await beer.click();
  await expect(sheet(page).locator('.grams .u')).toHaveText('ml');
  await sheet(page).locator('[data-step="1"]').click();
  await expect(sheet(page).locator('.mult')).toHaveText('×2'); // a whole ジョッキ
  await sheet(page).locator('[data-done]').click();
  const banner = sheet(page).locator('.banner');
  await expect(banner).toHaveText(/夜ごはんに ついかしました/);
  const [bb, d] = [(await banner.boundingBox())!, (await sheet(page).boundingBox())!];
  expect(bb.y).toBeGreaterThan(d.y + d.height / 2);
  await sheet(page).locator('[data-food-finish]').click(); // おわり: the day
  await expect(sheet(page).locator('section[data-meal=d] [data-entry] .amt').last()).not.toHaveText(/）（/); // never a weight twice
});

test('whose day is kept for the session; an empty past day says きろく なし (no 0 kcal, no tiles); › shows tomorrow’s いつもの only', async ({ page }) => {
  await openFood(page);
  const who = sheet(page).locator('select[data-pick=who]');
  await who.selectOption('B');
  await page.keyboard.press('Escape');
  await expect(sheet(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'ごはん', exact: true }).click();
  await expect(who).toHaveValue('B'); // kept, as けんこう's
  await who.selectOption('A');

  // tomorrow: ウェイ's breakfast いつもの fills it, shown only
  await sheet(page).locator('[data-nav=on]').click();
  await expect(sheet(page).locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-05');
  expect(await sheet(page).locator('section[data-meal=b] div.row[data-rep]').count()).toBeGreaterThan(0);
  await expect(sheet(page).locator('[data-add], button[data-entry], button[data-goal], [data-repeat-new]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-nav=on]')).toHaveAttribute('aria-disabled', 'true'); // no further
  await sheet(page).locator('[data-nav=today]').click();

  // 10/31: before ウェイ's first meal (11/1)
  for (let i = 0; i < 4; i++) await sheet(page).locator('[data-nav=back]').click();
  await expect(sheet(page).locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-10-31');
  await expect(sheet(page).locator('[data-food-total]')).toHaveText('きろく なし');
  await expect(sheet(page).locator('[data-nutrient], [data-food-chip]')).toHaveCount(0);

  // the guest's first view: 0 kcal today, no zero tiles
  await openFood(page, '&as=G');
  await expect(sheet(page).locator('[data-food-total]')).toHaveText('0 kcal');
  await expect(sheet(page).locator('[data-nutrient]')).toHaveCount(0);
});

test('search rows: a product’s brand on its second line, the same name, brand and kcal once; ✓n says 一致; no つくる while typing', async ({ page }) => {
  await openFood(page);
  await sheet(page).locator('[data-add=s]').click();
  await expect(sheet(page).locator('[data-recipe-new]')).toBeVisible();
  await sheet(page).locator('[data-food-q]').fill('サラダチキン');
  await expect(sheet(page).locator('[data-recipe-new], [data-custom-new]')).toHaveCount(0); // room for the results
  const rows = sheet(page).locator('[data-food-results] button.it');
  await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  // ✓n in words on the row itself (a title alone never shows on an iPhone)
  await expect(sheet(page).locator('[data-food-results] [data-verified]').first()).toHaveText(/^✓\d+ 一致$/);
  await expect.poll(() => sheet(page).locator('[data-food-results] [data-brand]').count(), { timeout: 20_000 }).toBeGreaterThan(0); // the products, lazily
  const keys = await rows.evaluateAll((bs) => bs.map((b) => `${b.querySelector('.nm')?.textContent}|${b.querySelector('[data-brand]')?.textContent ?? ''}|${b.getAttribute('data-per100')}`));
  expect(new Set(keys).size).toBe(keys.length);
  expect(await overflowOf(page)).toEqual([]);
});

// The everyday name (foodUi.ts glossOf): an older snapshot's catalogue name now, else the data's vetted gloss (none
// shipped yet: never a raw alias or the English); and each row's category tile (FoodThumb, 48 px; the recipe's
// ingredients 40 px), the rows no taller.
test('search rows: a category tile, no raw alias or English under the name, the rows as tall; the recipe’s ingredients’ tiles and 鶏もも肉', async ({ page }) => {
  await openFood(page, '&as=B');
  await sheet(page).locator('[data-add=d]').click();
  await sheet(page).locator('[data-food-q]').fill('キャッサバでん粉');
  const row = sheet(page).locator('[data-food-results] button.it', { hasText: 'キャッサバでん粉' }).first();
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.locator('[data-gloss]')).toHaveCount(0); // its alias タピオカ: until the data vets it
  await expect(row.locator('.meta')).not.toContainText('100gあたり');
  await sheet(page).locator('[data-food-q]').fill('コーヒー牛乳');
  const milk = sheet(page).locator('[data-food-results] button.it', { hasText: 'コーヒー牛乳' }).first();
  await expect(milk).toBeVisible();
  await expect(milk.locator('[data-gloss]')).toHaveCount(0); // never Coffee milk
  await sheet(page).locator('[data-food-q]').fill('うど');
  const rows = sheet(page).locator('[data-food-results] button.it');
  await expect(rows.first()).toBeVisible();
  for (let i = 0; i < 3; i++) {
    const th = rows.nth(i).locator('[data-thumb]');
    await expect(th).toHaveAttribute('data-thumb', 'cat'); // no pictures yet: the category's tile
    const [b, r] = await Promise.all([th.boundingBox(), rows.nth(i).boundingBox()]);
    expect([b!.width, b!.height].map(Math.round)).toEqual([48, 48]);
    expect(r!.height).toBeLessThanOrEqual(72);
  }
  await expect(sheet(page).locator('[data-food-results] button.it', { hasText: 'うど 生' }).first().locator('[data-thumb]')).toHaveAttribute('data-cat', '野菜');
  expect(await overflowOf(page)).toEqual([]);

  await sheet(page).locator('[data-food-q]').fill('');
  await sheet(page).locator('[data-food-recipes] [data-recipe]', { hasText: 'おうちカレー' }).click();
  await sheet(page).locator('[data-amount-open]').click();
  const th = sheet(page).locator('[data-recipe-level=view] [data-recipe-items] [data-thumb]');
  await expect(th).toHaveCount(6);
  await sheet(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished))); // the level's slide-in
  const b = await th.first().boundingBox();
  expect([b!.width, b!.height].map(Math.round)).toEqual([40, 40]);
  await expect(th.first()).toHaveAttribute('data-cat', '肉');
  await expect(sheet(page).locator('[data-recipe-items] li').first().locator('[data-gloss]')).toHaveText('鶏もも肉'); // the snapshot's older name
  expect(await overflowOf(page)).toEqual([]);
});

// The amount's picture (FoodThumb, 160 px across the card; its category's tile until there are pictures) above the
// name, and no line under it without an everyday name or a 「これは…」 description.
test('the amount: the category’s picture above the name, no line under it without a gloss or a description', async ({ page }) => {
  await openFood(page);
  await sheet(page).locator('[data-add=s]').click();
  await sheet(page).locator('[data-food-q]').fill('キャッサバでん粉');
  await sheet(page).locator('[data-food-results] button.it', { hasText: 'キャッサバでん粉' }).first().click({ timeout: 15_000 });
  const head = sheet(page).locator('.card.head');
  await sheet(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished))); // the level's slide-in
  const [pic, name, card] = await Promise.all([head.locator('[data-thumb]').boundingBox(), head.locator('h3').boundingBox(), head.boundingBox()]);
  expect(Math.round(pic!.height)).toBe(160);
  expect(pic!.width).toBeGreaterThan(card!.width - 40); // the card's width
  expect(pic!.y + pic!.height).toBeLessThan(name!.y);
  await expect(head.locator('[data-thumb]')).toHaveAttribute('data-thumb', 'cat');
  await expect(head.locator('[data-food-about]')).toHaveCount(0);
  expect(await overflowOf(page)).toEqual([]);
});

test('category tiles: the night’s tint is darker than the day’s', async ({ page }) => {
  const tint = async (time: string) => {
    await openFood(page, '', `&date=2026-11-04T${time}`);
    await sheet(page).locator('[data-add=s]').click();
    await sheet(page).locator('[data-food-q]').fill('うど');
    const th = sheet(page).locator('[data-food-results] [data-thumb]').first();
    await expect(th).toBeVisible({ timeout: 15_000 });
    return th.evaluate((e) => getComputedStyle(e).backgroundColor);
  };
  const day = await tint('12:30');
  expect(await tint('21:30')).not.toBe(day);
});

// マイ食品 (the user: "create my own food and record its calories for future use in case there's a food not in the
// existing database"): a search that finds nothing offers じぶんで つくる, the typed text its name; ほぞん goes on to its
// amount (by the serving: no weight, so no grams), logged at once; next time the search offers it, and its amount
// opens it (mine: its editor, けす asked twice).
test('マイ食品: made from a search that finds nothing (no weight), logged at once; offered next time, its amount opens the editor', async ({ page }) => {
  await openFood(page);
  const before = await kcalOf(page);
  const h2 = sheet(page).locator('.navbar h2');
  await sheet(page).locator('[data-add=l]').click();
  await sheet(page).locator('[data-food-q]').fill('会社の弁当');
  const none = sheet(page).locator('[data-food-none]');
  await expect(none).toBeVisible({ timeout: 15_000 }); // the catalog's first fetch, then nothing
  await expect(none).toContainText('「会社の弁当」は 見つかりませんでした');
  await none.locator('[data-custom-make]').click();
  await expect(h2).toHaveText('あたらしい マイ食品');
  const lv = sheet(page).locator('[data-custom-level=edit]');
  const save = lv.locator('[data-custom-save]');
  await expect(lv.locator('[data-custom-n]')).toHaveValue('会社の弁当');
  await expect(lv.locator('[data-custom-u]')).toHaveValue(''); // 1食 its placeholder: typing 1杯 gives 1杯, not 1食1杯
  await expect(lv.locator('[data-custom-u]')).toHaveAttribute('placeholder', '1食');
  await expect(lv.locator('[data-custom-g]')).toHaveValue('');
  await expect(save).toHaveAttribute('aria-disabled', 'true'); // no kcal yet
  await expect(lv.locator('[data-custom-remove]')).toHaveCount(0);
  expect(await overflowOf(page)).toEqual([]);
  await lv.locator('[data-custom-k]').fill('６５０'); // full-width, as the Japanese keyboard types it
  await expect(save).toHaveAttribute('aria-disabled', 'false');
  await expect(save).toHaveText('ほぞんして ついか'); // made from a meal: saved and one serving logged, in one tap
  await save.click();

  // back in the meal's search, one serving (1食) of it added
  await expect(h2).toHaveText('昼ごはん');
  await expect(sheet(page).locator('[data-food-added] [data-added]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-food-added] [data-added] .meta')).toHaveText('1食');
  await sheet(page).locator('[data-food-finish]').click(); // おわり: the day

  await expect(h2).toHaveText('ごはん');
  await expect.poll(() => kcalOf(page)).toBe(before + 650);
  const row = sheet(page).locator('section[data-meal=l] [data-entry]').last();
  await expect(row).toContainText('会社の弁当');
  await expect(row.locator('.amt')).toHaveText('1食'); // never a nominal weight
  // tapped: its amount by the serving: whole servings, no grams anywhere
  await row.click();
  await expect(sheet(page).locator('[data-grams]')).toHaveCount(0);
  await expect(sheet(page).locator('.chip[aria-pressed=true]')).toHaveText('1食');
  await expect(sheet(page).locator('.amt .head')).toContainText('1食あたり 650 kcal');
  await expect(sheet(page).locator('.amt .head')).not.toContainText('100g');
  await sheet(page).locator('[data-step="1"]').click();
  await expect(sheet(page).locator('[data-food-live] .k')).toContainText('1,300');
  await expect(sheet(page).locator('[data-amount-open]')).toHaveCount(0); // an entry: no opening its food
  expect(await overflowOf(page)).toEqual([]);
  await sheet(page).getByRole('button', { name: 'もどる' }).click();

  // the next search: under マイ食品 (all of them before anything is typed; the matching ones when typed)
  await sheet(page).locator('[data-add=d]').click();
  const mine = sheet(page).locator('[data-food-customs] [data-custom]', { hasText: '会社の弁当' });
  await expect(mine).toHaveCount(1);
  await sheet(page).locator('[data-food-q]').fill('弁当');
  await expect(mine).toBeVisible();
  await expect(mine).toContainText('650 kcal');
  await expect(sheet(page).locator('[data-food-results]')).toBeVisible({ timeout: 15_000 });
  await expect(sheet(page).locator('[data-custom-make]')).toHaveCount(0); // something found: the ＋ under the field only

  // its amount → my editor (ほぞん waits; けす asked twice), back to the search
  await mine.click();
  await expect(sheet(page).locator('[data-amount-open]')).toHaveText('マイ食品を ひらく');
  expect(await overflowOf(page)).toEqual([]);
  await sheet(page).locator('[data-amount-open]').click();
  await expect(h2).toHaveText('マイ食品');
  await expect(lv.locator('[data-custom-k]')).toHaveValue('650');
  await expect(save).toHaveAttribute('aria-disabled', 'true');
  const rm = lv.locator('[data-custom-remove]');
  await rm.click();
  await expect(rm).toHaveText('ほんとうに けす？');
  await rm.click();
  await expect(h2).toHaveText('夜ごはん');
  await expect(mine).toHaveCount(0);
  await sheet(page).getByRole('button', { name: 'もどる' }).click();
  await expect.poll(() => kcalOf(page)).toBe(before + 650); // the meal logged stays
});

// With a weight: made while picking a recipe's ingredient (the editor goes on to the ingredient's amount, by grams too),
// P/F/C typed; a weight too light for its kcal is refused before ほぞん; the recipe's totals include it.
test('マイ食品 with a weight, made while adding a recipe ingredient: P/F/C, its amount by grams, the recipe total includes it', async ({ page }) => {
  await openFood(page);
  const h2 = sheet(page).locator('.navbar h2');
  await sheet(page).locator('[data-add=l]').click();
  await sheet(page).locator('[data-recipe-new]').click();
  const rl = sheet(page).locator('[data-recipe-level=edit]');
  await rl.locator('[data-recipe-n]').fill('バーと ごはん');
  await sheet(page).locator('[data-recipe-add]').click();
  await expect(sheet(page).locator('[data-food-customs] [data-custom]')).toHaveCount(2); // the demo's, everyone's
  await expect(sheet(page).locator('[data-custom-new]')).toHaveText('食品を つくる'); // alone under the field
  expect(await overflowOf(page)).toEqual([]);
  await sheet(page).locator('[data-food-q]').fill('てづくりバー');
  const none = sheet(page).locator('[data-food-none]');
  await expect(none).toBeVisible({ timeout: 15_000 });
  await none.locator('[data-custom-make]').click();
  const lv = sheet(page).locator('[data-custom-level=edit]');
  const save = lv.locator('[data-custom-save]');
  await expect(lv.locator('[data-custom-n]')).toHaveValue('てづくりバー');
  await lv.locator('[data-custom-u]').fill('1本');
  await lv.locator('[data-custom-k]').fill('240');
  await lv.locator('[data-custom-g]').fill('10'); // 2,400 kcal per 100 g: no food is that dense
  await expect(lv.locator('[data-custom-g]')).toHaveAttribute('aria-invalid', 'true');
  await expect(lv.locator('[data-custom-g-hint]')).toContainText('多すぎます');
  await expect(save).toHaveAttribute('aria-disabled', 'true');
  await lv.locator('[data-custom-g]').fill('１２０');
  await lv.locator('[data-custom-nut=p]').fill('20');
  await lv.locator('[data-custom-nut=fa]').fill('8');
  await lv.locator('[data-custom-nut=c]').fill('22.5');
  await expect(lv.locator('[data-custom-g]')).toHaveAttribute('aria-invalid', 'false');
  expect(await overflowOf(page)).toEqual([]);
  await save.click();

  // the ingredient's amount: its serving (with its weight), 100g, the grams field
  await expect(h2).toHaveText('ざいりょう');
  await expect(sheet(page).locator('.chip[aria-pressed=true]')).toHaveText('1本120g');
  await expect(sheet(page).locator('[data-portion="100g"]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-grams]')).toHaveValue('120');
  await expect(sheet(page).locator('[data-food-live] .k')).toContainText('240');
  await expect(sheet(page).locator('[data-food-live]')).toContainText('20.0');
  await expect(sheet(page).locator('[data-pick-meal]')).toHaveCount(0);
  await sheet(page).locator('[data-done]').click();

  await expect(h2).toHaveText('あたらしい レシピ');
  await expect(rl.locator('[data-recipe-n]')).toHaveValue('バーと ごはん'); // the draft kept across the levels
  await expect(rl.locator('[data-recipe-item]')).toHaveCount(1);
  await expect(rl.locator('[data-recipe-item]').first()).toContainText('てづくりバー');
  await expect(rl.locator('[data-recipe-item]').first()).toContainText('1本（120g）');
  await expect(rl.locator('[data-recipe-live-total]')).toHaveText('ぜんぶで 240 kcal（120g）');
  await expect(rl.locator('[data-recipe-live-per]')).toHaveText('120 kcal'); // 2人前
  await rl.locator('[data-recipe-save]').click();
  // back in the meal's search: the recipe (a serving's kcal), and the custom food with its weight
  await expect(h2).toHaveText('昼ごはん');
  await expect(sheet(page).locator('[data-food-recipes] [data-recipe]', { hasText: 'バーと ごはん' })).toContainText('120 kcal');
  await expect(sheet(page).locator('[data-food-customs] [data-custom]', { hasText: 'てづくりバー' })).toContainText('1本（120g）');
});

// Everyone's: うめ's phone finds ウェイ's 社食の日替わり定食 in a meal's search; its amount opens it read-only (no field,
// no けす), whose ごはんに ついか comes back to the amount; logged (by the serving) and copied (a custom food of うめ's
// own, in the editor); ウェイ's phone sees うめ's おにぎり (by weight) in its search.
test('マイ食品: someone else’s is read-only from its amount, logged and copied; the partner’s are in the search', async ({ page }) => {
  await openFood(page, '&as=B');
  const before = await kcalOf(page);
  const h2 = sheet(page).locator('.navbar h2');
  await sheet(page).locator('[data-add=l]').click();
  const teishoku = sheet(page).locator('[data-food-customs] [data-custom]', { hasText: '社食の日替わり定食' });
  await expect(teishoku).toHaveCount(1);
  await expect(teishoku).toContainText('1個');
  await teishoku.click();
  await sheet(page).locator('[data-amount-open]').click();
  const view = sheet(page).locator('[data-custom-level=view]');
  await expect(view.locator('[data-custom-name]')).toHaveText('社食の日替わり定食');
  await expect(view).toContainText('の マイ食品');
  await expect(view.locator('[data-custom-kcal]')).toHaveText('650 kcal');
  await expect(view.locator('input, [data-custom-save], [data-custom-remove]')).toHaveCount(0);
  expect(await overflowOf(page)).toEqual([]);

  await view.locator('[data-custom-log]').click();
  await expect(h2).toHaveText('昼ごはん');
  await expect(sheet(page).locator('[data-grams]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-pick-meal=l]')).toHaveAttribute('aria-pressed', 'true');
  await sheet(page).locator('[data-done]').click();
  await sheet(page).locator('[data-food-finish]').click(); // おわり: the day
  await expect(h2).toHaveText('ごはん');
  await expect.poll(() => kcalOf(page)).toBe(before + 650);
  await expect(sheet(page).locator('section[data-meal=l] [data-entry]').last()).toContainText('社食の日替わり定食');
  await expect(sheet(page).locator('section[data-meal=l] [data-entry] .amt').last()).toHaveText('1個');

  // the copy: うめ's own, in the editor (けす there), in the search beside ウェイ's
  await page.mouse.move(0, 0); // (a pointer resting on the banner holds it)
  await expect(sheet(page).locator('.banner')).toHaveCount(0, { timeout: 10_000 }); // docked low, it covers the search's rows
  await sheet(page).locator('[data-add=d]').click();
  await teishoku.click();
  await sheet(page).locator('[data-amount-open]').click();
  await view.locator('[data-custom-copy]').click();
  const lv = sheet(page).locator('[data-custom-level=edit]');
  await expect(lv.locator('[data-custom-n]')).toHaveValue('社食の日替わり定食');
  await expect(lv.locator('[data-custom-k]')).toHaveValue('650');
  await expect(lv.locator('[data-custom-remove]')).toHaveCount(1);
  await sheet(page).getByRole('button', { name: 'もどる' }).click(); // ‹: the amount
  await sheet(page).getByRole('button', { name: 'もどる' }).click(); // ‹: the search
  await expect(teishoku).toHaveCount(2);

  // ウェイ's phone: うめ's おにぎり in a meal's search, by weight (its serving and 100g)
  await openFood(page);
  await sheet(page).locator('[data-add=s]').click();
  await sheet(page).locator('[data-food-q]').fill('おにぎり');
  const oni = sheet(page).locator('[data-food-customs] [data-custom]', { hasText: '手作りおにぎり（鮭）' });
  await expect(oni).toContainText('1個（110g）');
  await oni.click();
  await expect(sheet(page).locator('[data-grams]')).toHaveValue('110');
  await expect(sheet(page).locator('[data-food-live] .k')).toContainText('180');
});

// Several foods a trip (the user approved, 2026-11-05: "after ついか, stay in the meal's search"): a row's own ＋ logs
// it as it comes (its default portion), the field cleared and focused for the next; ついか from an amount comes back
// to the search too; the trip's foods are listed under the field, ✕ takes one back; おわり → the day.
test('several foods a trip: a row’s ＋ logs it at once, ついか comes back to the search, ✕ takes one back, おわり ends it', async ({ page }) => {
  await openFood(page);
  const s = sheet(page);
  const dinner = s.locator('section[data-meal=d] [data-entry]');
  const n0 = await dinner.count();
  await s.locator('[data-add=d]').click();
  const q = s.locator('[data-food-q]');
  const added = s.locator('[data-food-added] [data-added]');
  await expect(s.locator('[data-food-added]')).toHaveCount(0); // nothing yet
  await q.fill('ごはん');
  const quickOf = (id: string) => s.locator(`[data-food-results] li:has([data-item="${id}"]) [data-quick]`);
  await expect(quickOf('mext:01088')).toBeVisible({ timeout: 15_000 });
  await expect(quickOf('mext:01088')).toHaveAttribute('aria-label', '「ごはん（精白米）」を そのまま ついか');
  await quickOf('mext:01088').click();
  await expect(added).toHaveCount(1);
  await expect(q).toHaveValue('');
  await expect(q).toBeFocused(); // in the tap: the keyboard stays up
  await expect(added.first()).toContainText('茶碗1杯（150g）');
  await q.fill('みそ汁');
  await quickOf('dishes:miso-tofu-wakame').click();
  await expect(added).toHaveCount(2);
  // one by its amount: ついか comes back here, the field focused
  await q.fill('卵');
  await s.locator('[data-food-results] [data-item="mext:12004"]').click();
  await s.locator('[data-step="1"]').click();
  await s.locator('[data-done]').click();
  await expect(s.locator('.navbar h2')).toHaveText('夜ごはん');
  await expect(added).toHaveCount(3);
  await expect(added.last()).toContainText('1個（M）×2（100g）');
  await expect(q).toBeFocused();
  await expect(s.locator('[data-food-added] h3')).toHaveText('ついかした もの（3）');
  expect(await overflowOf(page)).toEqual([]);
  // ✕: taken back (it was only just logged)
  await s.locator('[data-food-added] [data-unadd]').nth(1).click();
  await expect(added).toHaveCount(2);
  await expect(s.locator('[data-food-added]')).not.toContainText('味噌汁');
  await s.locator('[data-food-finish]').click();
  await expect(s.locator('.navbar h2')).toHaveText('ごはん');
  await expect(dinner).toHaveCount(n0 + 2);
  await expect(dinner.nth(n0)).toContainText('ごはん（精白米）');
  await expect(dinner.nth(n0 + 1)).toContainText('卵（全卵・生）');
});

// The balance views (docs/design.md "Gohan", the food review's approved features): each meal's protein chip (the leaf's at
// a third of the day's goal), the day's PFC balance against the 食事摂取基準's ranges, the week's average, and the fibre
// and alcohol cards with their goals (fibre from the profile: ウェイ, a man of 35, 22 g; alcohol 20 g until set).
test('the balance views: a meal’s protein chip, the PFC bar, the week’s average, fibre and alcohol with their goals', async ({ page }) => {
  await openFood(page);
  const s = sheet(page);
  // each meal with entries has its protein, green once at the per-meal target (its words say the target)
  const chips = s.locator('[data-meal] [data-meal-protein]');
  expect(await chips.count()).toBeGreaterThan(0);
  for (const c of await chips.all()) {
    const n = Number(await c.getAttribute('data-meal-protein'));
    const aim = Number((await c.locator('.sr-only').textContent())!.replace(/\D/g, ''));
    await expect(c).toHaveText(new RegExp(`^たんぱく質 ${Math.round(n)}g（めやす ${aim}g）$`));
    expect([aim, (await c.getAttribute('data-met')) === ''].join()).toBe([aim, n >= aim].join());
  }
  // the breakfast (いつもの: rice and natto, 11.6 g) is under ウェイ's per-meal aim
  await expect(s.locator('section[data-meal=b] [data-meal-protein]')).toHaveText(/^たんぱく質 12g/);
  await expect(s.locator('section[data-meal=b] [data-meal-protein]')).not.toHaveAttribute('data-met');
  // the day's PFC: three shares adding up to 100 %, each against its range
  const pfc = s.locator('[data-food-summary] [data-pfc=day]');
  await expect(pfc.locator('[data-pfc-of]')).toHaveCount(3);
  const pcts = await pfc.locator('.bar i').evaluateAll((is) => is.map((i) => Number(i.getAttribute('data-pct'))));
  expect(Math.abs(pcts.reduce((a, b) => a + b, 0) - 100)).toBeLessThanOrEqual(2);
  await expect(pfc.locator('[data-pfc-of=p] small')).toContainText('13〜20%');
  await expect(pfc.locator('[data-pfc-of=fa] small')).toContainText('20〜30%');
  await expect(pfc.locator('[data-pfc-of=c] small')).toContainText('50〜65%');
  await expect(pfc.locator('.bar')).toHaveAttribute('aria-label', /^たんぱく質 \d+%、脂質 \d+%、炭水化物 \d+%$/);
  // fibre: the day's tile with its default goal (the 食事摂取基準's by the profile)
  await expect(s.locator('[data-food-summary] [data-nutrient=fi] small')).toHaveText(/^目標 22\sg\s以上$/);
  // the week: the 7 finished days to yesterday, 記録 n日, with its own PFC bar
  const wk = s.locator('[data-food-week]');
  await expect(wk.locator('h3')).toHaveText('さいきん 7日の 平均');
  await expect(wk.locator('[data-week-range]')).toHaveText(/^10\/28〜11\/3 · 記録 [1-7]日$/);
  await expect(wk.locator('[data-week-kcal]')).toHaveText(/^[\d,]+ kcal$/);
  await expect(wk.locator('[data-pfc=week] [data-pfc-of]')).toHaveCount(3);
  // a past day's week ends that day
  await s.locator('[data-nav=back]').click();
  await expect(wk.locator('[data-week-range]')).toHaveText(/^10\/28〜11\/3 /);
  await s.locator('[data-nav=back]').click();
  await expect(wk.locator('[data-week-range]')).toHaveText(/^10\/27〜11\/2 /);
  expect(await overflowOf(page)).toEqual([]);

  // グラフ: fibre at least its default, alcohol at most 20 g
  await s.locator('[data-tab=chart]').click();
  const fi = s.locator('[data-food-chart=fi]');
  await expect(fi.locator('button[data-goal]')).toHaveText('目標 22 g 以上');
  await expect(fi.locator('path.bar')).toHaveCount(4);
  await expect(fi.locator('path.goal')).toHaveCount(1);
  await expect(s.locator('[data-food-chart=al] button[data-goal]')).toHaveText('目標 20 g 以下');
  // fibre's goal set in place: whole grams, 5–60
  await fi.locator('button[data-goal]').click();
  const tray = fi.locator('form.tray');
  await expect(tray).toContainText('食物繊維の目標（1日）');
  await tray.getByRole('textbox').fill('25');
  await tray.getByRole('button', { name: 'けってい' }).click();
  await expect(fi.locator('button[data-goal]')).toHaveText('目標 25 g 以上');
  await s.locator('[data-tab=log]').click();
  await expect(s.locator('[data-food-summary] [data-nutrient=fi] small')).toHaveText(/^目標 25\sg\s以上$/);
});

// Copy a meal (the user approved, 2026-11-05): on my day an empty meal offers 「きのうと おなじ」 (my own the day
// before) and 「〇〇と おなじ」 (another's that day: everyone sees every meal, so the guest too), each with what it holds;
// one tap copies it in as new entries of mine, its banner's とりけす takes them out again.
test('copy a meal: the members’ on the guest’s phone, きのうと おなじ on mine; one tap, new entries of mine; とりけす', async ({ page }) => {
  await openFood(page, '&as=G');
  const s = sheet(page);
  const lunch = s.locator('section[data-meal=l]');
  await expect(lunch.locator('[data-entry]')).toHaveCount(0);
  await expect(lunch.locator('[data-copy]')).toHaveCount(2); // ウェイ's and うめ's lunches; no day before of its own
  const a = lunch.locator('[data-copy=A]');
  await expect(a).toContainText('と おなじ');
  await expect(a).toContainText(/1品 \d+ kcal/);
  expect(await overflowOf(page)).toEqual([]);
  const before = await kcalOf(page).catch(() => 0);

  await a.click();
  await expect(lunch.locator('[data-entry]')).toHaveCount(1);
  await expect(lunch.locator('[data-entry]')).toContainText('カレーライス（チキン）');
  await expect(lunch.locator('[data-copy]')).toHaveCount(0); // not empty any more
  const banner = s.locator('.banner');
  await expect(banner).toContainText('昼ごはんに 1品 コピーしました');
  await expect.poll(() => kcalOf(page)).toBeGreaterThan(before);
  await banner.getByRole('button', { name: 'とりけす' }).click();
  await expect(lunch.locator('[data-entry]')).toHaveCount(0);

  await lunch.locator('[data-copy=B]').click();
  await expect(lunch.locator('[data-entry]')).toContainText('おにぎり（鮭）');
  // mine: it opens its amount (ほぞん / けす)
  await lunch.locator('[data-entry]').click();
  await expect(s.locator('[data-done]')).toHaveText('ほぞん');
  await s.getByRole('button', { name: 'もどる' }).click();
  // うめ's day is untouched, read-only, nothing to copy there
  await s.locator('select[data-pick=who]').selectOption('B');
  await expect(s.locator('section[data-meal=l] [data-entry]')).toHaveCount(1);
  await expect(s.locator('[data-copy]')).toHaveCount(0);

  // my own the day before: ウェイ's dinner yesterday (焼き鮭定食)
  await openFood(page);
  const dinner = sheet(page).locator('section[data-meal=d]');
  await expect(dinner.locator('[data-entry]')).toHaveCount(0);
  const prev = dinner.locator('[data-copy=prev]');
  await expect(prev).toContainText('きのうと おなじ');
  await prev.click();
  await expect(dinner.locator('[data-entry]')).toHaveCount(1);
  await expect(dinner.locator('[data-entry]')).toContainText('焼き鮭定食');
});

// 最新の値にする (docs/design.md "Gohan"): the food data fixed since an entry was logged (here: the shipped dishes.json
// served with カレーライス（チキン） at 150 kcal / 100 g, not the 143 the demo's lunch was logged with). My entry offers the
// food as it is now; a tap re-snapshots it (an ordinary edit); nothing changes by itself; anyone else's day never offers it.
test('最新の値にする: an entry whose food was corrected since offers its values now; a tap takes them, mine only', async ({ page }) => {
  await page.route('**/food/dishes.json*', async (route) => {
    const res = await route.fetch();
    const d = (await res.json()) as { items: { id: string; kcal: number }[] };
    for (const it of d.items) if (it.id === 'dishes:curry-chicken') it.kcal = 150;
    await route.fulfill({ response: res, json: d });
  });
  await openFood(page);
  const s = sheet(page);
  const before = await kcalOf(page);
  const lunch = s.locator('section[data-meal=l]');
  const curry = lunch.locator('[data-entry]', { hasText: 'カレーライス（チキン）' });
  await expect(curry).toContainText('729');
  // the catalogue comes a moment after the day: only the corrected food offers it
  const fresh = s.locator('[data-fresh]');
  await expect(fresh).toHaveCount(1, { timeout: 15_000 });
  await expect(lunch.locator('[data-fresh]')).toHaveText('最新の値にする（729→765 kcal）');
  await lunch.locator('[data-fresh]').click();
  await expect(s.getByRole('status')).toContainText('「カレーライス（チキン）」を 最新の値に しました');
  await expect(curry).toContainText('765');
  await expect(fresh).toHaveCount(0);
  expect(await kcalOf(page)).toBe(before + 36);
  // the partner's day: read-only, never offered (only the owner edits an entry)
  await s.locator('select[data-pick=who]').selectOption('B');
  await expect(s.locator('[data-food-summary]')).toHaveClass(/pB/);
  await expect(s.locator('[data-entry]').first()).toBeVisible();
  await expect(fresh).toHaveCount(0);
});

// クイック (the user approved, 2026-11-05: "kcal and protein only, for eating out"): from the search's ⚡ button (its
// form: a name, クイック if blank, kcal needed, the nutrients optional) or a kcal typed in the search (its ＋ logs it at
// once); one entry by the serving, no マイ食品 saved.
test('クイック: the form from ⚡ (a name, kcal, protein), a kcal typed logged at once; one entry each, no マイ食品', async ({ page }) => {
  await openFood(page);
  const s = sheet(page);
  const h2 = s.locator('.navbar h2');
  const before = await kcalOf(page);
  await s.locator('[data-add=d]').click();
  await s.locator('[data-quick-new]').click();
  await expect(h2).toHaveText('クイック ついか');
  const lv = s.locator('[data-custom-level=quick]');
  await expect(lv.locator('[data-custom-k]')).toBeFocused(); // in the tap: the number pad comes up
  await expect(lv.locator('[data-custom-n]')).toHaveAttribute('placeholder', 'クイック');
  await expect(lv.locator('[data-custom-u], [data-custom-g]')).toHaveCount(0); // no serving, no weight
  const add = lv.locator('[data-custom-save]');
  await expect(add).toHaveText('ついか');
  await expect(add).toHaveAttribute('aria-disabled', 'true'); // kcal first
  await lv.locator('[data-custom-n]').fill('ラーメン屋');
  await lv.locator('[data-custom-k]').fill('850');
  await lv.locator('[data-custom-nut=p]').fill('30');
  expect(await overflowOf(page)).toEqual([]);
  await add.click();
  // back in the meal's search, listed
  await expect(h2).toHaveText('夜ごはん');
  const added = s.locator('[data-food-added] [data-added]');
  await expect(added).toHaveCount(1);
  await expect(added.first()).toContainText('ラーメン屋');
  await expect(added.first()).toContainText('850 kcal');
  // a kcal typed: offered as クイック, its ＋ logs it at once
  await s.locator('[data-food-q]').fill('６５０');
  const row = s.locator('[data-food-quick] li');
  await expect(row).toContainText('クイック');
  await expect(row).toContainText('650 kcal');
  await row.locator('[data-quick]').click();
  await expect(added).toHaveCount(2);
  await s.locator('[data-food-finish]').click();
  await expect.poll(() => kcalOf(page)).toBe(before + 1500);
  const rows = s.locator('section[data-meal=d] [data-entry]');
  await expect(rows.filter({ hasText: 'ラーメン屋' }).locator('.amt')).toHaveText('1食');
  await expect(rows.filter({ hasText: 'クイック' })).toHaveCount(1);
  // nothing saved as a マイ食品
  await s.locator('[data-add=s]').click();
  await expect(s.locator('[data-food-customs]')).not.toContainText('ラーメン屋');
});

// The tap counts the food review measured (2026-11; before: a repeat meal 3 taps an item from さいきん, a new 3-item
// breakfast 9 taps + 7 characters, a konbini lunch 8 + 10, a 650 kcal meal out 4 + 8 as a new マイ食品), from the open
// sheet. The user's targets: a repeat meal in ≤ 3, a new 3-item breakfast in ≤ 5 plus typing.
test('tap counts: the same meal as yesterday in 1, a new 3-item meal in 5, a konbini lunch in 6, a meal out by kcal in 3', async ({ page }) => {
  await openFood(page);
  const s = sheet(page);
  const c = { taps: 0, chars: 0 };
  const tap = async (sel: string) => { c.taps++; await s.locator(sel).first().click(); };
  const type = async (text: string) => { c.chars += text.length; await s.locator('[data-food-q]').fill(text); };
  const count = (k: string) => s.locator(`section[data-meal=${k}] [data-entry]`).count();
  const run = async (name: string, go: () => Promise<void>) => {
    c.taps = c.chars = 0;
    await go();
    console.log(`TAPS ${name}: ${c.taps} taps + ${c.chars} characters`);
    return { ...c };
  };
  // the same dinner as yesterday (焼き鮭定食)
  const same = await run('the same meal as yesterday', async () => {
    await tap('section[data-meal=d] [data-copy=prev]');
    await expect.poll(() => count('d')).toBe(1);
  });
  // ご飯 + みそ汁 + 卵, each by its row's ＋
  const n0 = await count('s');
  const fresh = await run('a new 3-item meal', async () => {
    await tap('[data-add=s]');
    for (const [q, id] of [['ごはん', 'mext:01088'], ['みそ汁', 'dishes:miso-tofu-wakame'], ['卵', 'mext:12004']]) {
      await type(q);
      await expect(s.locator(`[data-food-results] li:has([data-item="${id}"]) [data-quick]`)).toBeVisible({ timeout: 15_000 });
      await tap(`[data-food-results] li:has([data-item="${id}"]) [data-quick]`);
    }
    await tap('[data-food-finish]');
    await expect.poll(() => count('s')).toBe(n0 + 3);
  });
  // おにぎり ×2 (＋ steps by the piece) + サラダチキン
  const l0 = await count('l');
  const konbini = await run('a konbini lunch', async () => {
    await tap('[data-add=l]');
    await type('おにぎり');
    await tap('[data-food-results] [data-item="dishes:onigiri-shake"]');
    await tap('[data-step="1"]');
    await expect(s.locator('.mult')).toHaveText('×2');
    await tap('[data-done]');
    await type('サラダチキン');
    await tap('[data-food-results] li:has([data-item="eatout:saladchicken"]) [data-quick]');
    await tap('[data-food-finish]');
    await expect.poll(() => count('l')).toBe(l0 + 2);
  });
  // a 650 kcal meal out: its kcal typed, its ＋
  const out = await run('a meal out by kcal', async () => {
    await tap('[data-add=d]');
    await type('650');
    await tap('[data-food-quick] [data-quick]');
    await tap('[data-food-finish]');
    await expect.poll(() => count('d')).toBe(2);
  });
  expect([same, fresh, konbini, out]).toEqual([{ taps: 1, chars: 0 }, { taps: 5, chars: 7 }, { taps: 6, chars: 10 }, { taps: 3, chars: 3 }]);
});
