// がんばり, the stretch bonus (docs/design.md#economy): +1 more for each goal at 1.5× (🍎 12,000 steps, 🍐 1.5 × the
// Move goal, 🍑 90 min, 🍒 180 min), at most +2 a person a day. On the island it shows only in the tree's popup (the
// goal's mark a yuzu star with 「+2」 once its がんばり pays, ✓ when met but not paid: the marks add up to the day's ベル;
// no ベル in it) and in today's total (ごほうび's 「きょうの ベル +N」, the HUD menu's ベル row's label);
// in ごほうび's ベル ledger as its own line per day and per person, and in the day. The demo's days (seeded, ?date=):
// 11-03 ウェイ steps at 1.5× (3 goals + 1); 12-07 うめ all four, Move, Stand and steps at 1.5× (4 + 2, capped).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp, tapOn } from './island.ts';
import { hudBells, openRewards } from './hud.ts';

test.use({ viewport: { width: 390, height: 844 } });

const sheet = (page: Page) => page.locator('dialog[open]');
async function open(page: Page, date: string) {
  await page.goto(`?demo&date=${date}`);
  await islandUp(page);
}
/** Closes the open popup (a tap inside it never does: IslandScene). */
const close = (page: Page) => page.keyboard.press('Escape');
async function popup(page: Page, tree: 'A' | 'B') {
  await tapOn(page, 'goal', tree);
  const pop = page.locator('.detail');
  await expect(pop).toBeVisible();
  await pop.evaluate((e) => Promise.all(e.getAnimations().map((a) => a.finished))); // its pop-in, for the screenshots
  return pop;
}

test('the popup: a +2 star on the goal at 1.5×, no ベル in it; today’s total includes it', async ({ page }) => {
  await open(page, '2026-11-03T23:00');
  const pop = await popup(page, 'A');
  await expect(pop.locator('.plate .nm')).toHaveText('ウェイ');
  const row = (f: string) => pop.locator(`[data-row=${f}]`);
  await expect(row('apple')).toHaveAttribute('data-stretched', 'true');
  await expect(row('apple')).toHaveAttribute('data-mark', 'stretch');
  await expect(row('apple').locator('.ck .star')).toHaveText('+2');
  await expect(row('apple')).toHaveAccessibleName(/ がんばり \+2$/);
  for (const f of ['pear', 'peach', 'cherry']) await expect(row(f).locator('.star')).toHaveCount(0);
  await expect(pop).not.toContainText('ベル');
  // ウェイ 3 + 1: today's into my wallet (the ベル row's label, ごほうび's pill) is my day's with がんばり
  await expect(hudBells(page)).toHaveAttribute('aria-label', / · 今日 4\sベル$/);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/popup-1.png` });
});

test('the cap: three goals at 1.5×, the two paid a +2 star, the third ✓; today’s totals pay +2 and ふたりでぜんぶ', async ({ page }) => {
  await open(page, '2026-12-07T23:00');
  const pop = await popup(page, 'B');
  await expect(pop.locator('.plate .nm')).toHaveText('うめ');
  await expect(pop.locator('[data-stretched]')).toHaveCount(3);
  // the cap pays the first two in RING_FRUITS order (🍐 🍒): their stars say +2; 🍎's 1.5× past the cap is ✓, +1
  const marks = await pop.locator('[data-row]').evaluateAll((els) => els.map((e) => [(e as HTMLElement).dataset.row, (e as HTMLElement).dataset.mark]));
  expect(marks).toEqual([['apple', 'met'], ['pear', 'stretch'], ['peach', 'met'], ['cherry', 'stretch']]);
  await expect(pop.locator('[data-row] .star')).toHaveText(['+2', '+2']);
  // ふたりでぜんぶ is the pair's, +1 into each wallet: my ベル row's today is ウェイ 4 + 1
  await expect(hudBells(page)).toHaveAttribute('aria-label', / · 今日 5\sベル$/);
  // the wider rows still fit the stage
  const box = (await pop.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/popup-cap.png` });
  await close(page);
  await expect(page.locator('.detail')).toHaveCount(0);
  // and ごほうび says the same under each balance: ウェイ 4 + 1, うめ 6 + 1
  await openRewards(page);
  await expect(sheet(page).locator('[data-wallet] .hero .today')).toHaveText([/^\s*今日\s*\+5\s*ベル\s*$/, /^\s*今日\s*\+7\s*ベル\s*$/]);
});

test('no stretch: no star', async ({ page }) => {
  await open(page, '2026-11-04T23:00');
  const pop = await popup(page, 'A');
  await expect(pop.locator('[data-stretched]')).toHaveCount(0);
  await expect(pop.locator('.star')).toHaveCount(0);
  await expect(pop.locator('[data-mark=stretch]')).toHaveCount(0);
});

test('the ベル ledger: a がんばり line under the day with each person\'s ベル; the day shows the chip, +1 a goal and its がんばり', async ({ page }) => {
  await open(page, '2026-12-07T23:00');
  await openRewards(page);
  await expect(sheet(page).locator('.panel-body')).toBeVisible();
  await sheet(page).locator('[data-ledger]').scrollIntoViewIfNeeded();
  const day = sheet(page).locator('li.day:not(.head)').first();
  await expect(day.locator('.dt')).toHaveText('12/7（月）');
  await expect(day.locator('.gbk')).toHaveText('がんばり');
  await expect(day.locator('.gbv[data-person=B]')).toHaveText(/^\+2\sベル/);
  await expect(day.locator('.gbv[data-person=A]')).toHaveText('');
  // each one's own wallet's: ウェイ 4 + 1 (half of together), うめ 4 + 2 がんばり + 1
  await expect(day.locator('.own[data-person=A]')).toHaveAttribute('data-bells', '5');
  await expect(day.locator('.own[data-person=B]')).toHaveAttribute('data-bells', '7');
  // a day without がんばり has no second line
  const plain = sheet(page).locator('li.day:not(.head)').filter({ hasText: '12/5（土）' });
  await expect(plain.locator('.gbk')).toHaveCount(0);
  if (process.env.SHOTS) await sheet(page).locator('.panel-body').screenshot({ path: `${process.env.SHOTS}/kiroku.png` });
  await day.locator('button.dbtn').click();
  const b = sheet(page).locator('.pc[data-person=B]');
  await expect(b.locator('.row')).toHaveCount(4);
  await expect(b.locator('.row .chip')).toHaveText(['がんばり', 'がんばり', 'がんばり']);
  await expect(b.locator('.row .b')).toHaveText(['+1', '+1', '+1', '+1']);
  await expect(b.locator('.gbrow .k')).toHaveText('がんばり（上限 2）');
  await expect(b.locator('.gbrow .b')).toHaveText('+2');
  await expect(sheet(page).locator('.pc[data-person=A] .gbrow')).toHaveCount(0);
  if (process.env.SHOTS) await page.waitForTimeout(600); // the page's slide-in, for the screenshot
  if (process.env.SHOTS) await sheet(page).locator('.panel-body').screenshot({ path: `${process.env.SHOTS}/day.png` });
});

test.describe('at 320x568', () => {
  test.use({ viewport: { width: 320, height: 568 } });
  test('the capped popup fits on both trees', async ({ page }) => {
    for (const tree of ['A', 'B'] as const) {
      await open(page, '2026-12-07T23:00');
      const pop = await popup(page, tree);
      const box = (await pop.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
      if (process.env.SHOTS && tree === 'B') await page.screenshot({ path: `${process.env.SHOTS}/popup-cap-320.png` });
    }
  });
});
