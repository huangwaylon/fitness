// がんばり, the stretch bonus (docs/design.md#economy): +1 more for each goal at 1.5× (🍎 12,000 steps, 🍐 1.5 × the
// Move goal, 🍑 90 min, 🍒 180 min), at most +2 a person a day. On the island it shows only in the tree's popup (a
// 「がんばり」 chip on every row at 1.5×, a faint ghost of it until then, no numbers on the rows; the ledger: もくひょう,
// がんばり (always, +0 faint) with 「（上限 2）」 when more were reached than the cap pays, this person's total, then
// ふたりでぜんぶ, the pair's) and in today's total (ごほうび's 「きょうの ベル +N」, the HUD menu's ベル row's label);
// in ごほうび's ベル ledger as its own line per day and per person, and in the day. The demo's days (seeded, ?date=):
// 11-03 ウェイ steps at 1.5× (3 goals + 1); 12-07 うめ all four, Move, Stand and steps at 1.5× (4 + 2, capped).
import { expect, test, type Page } from './fixtures.ts';
import { hudBells, hudMenu, openRewards } from './hud.ts';

test.use({ viewport: { width: 390, height: 844 } });

const sheet = (page: Page) => page.locator('dialog[open]');
async function open(page: Page, date: string) {
  await page.goto(`?demo&date=${date}`);
  await expect(hudMenu(page)).toBeVisible();
}
/** A tap where an element is (a world node: Playwright's own click would scroll the island's sticky stage to it). */
async function tap(page: Page, l: ReturnType<Page['locator']>) {
  const r = (await l.boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}
async function popup(page: Page, tree: number) {
  await tap(page, page.locator('button.canopy').nth(tree));
  const pop = page.locator('.detail');
  await expect(pop).toBeVisible();
  await pop.evaluate((e) => Promise.all(e.getAnimations().map((a) => a.finished))); // its pop-in, for the screenshots
  return pop;
}

test('the popup: a がんばり chip on the row at 1.5×, the ledger adds up; today’s total includes it', async ({ page }) => {
  await open(page, '2026-11-03T23:00');
  const pop = await popup(page, 0);
  await expect(pop.locator('.plate')).toHaveText('ウェイ');
  const row = (f: string) => pop.locator(`.row[data-row=${f}]`);
  await expect(row('apple')).toHaveAttribute('data-stretched', 'true');
  await expect(row('apple').locator('.chip')).toHaveText('がんばり');
  await expect(pop.locator('.row b')).toHaveCount(0); // no numbers on the rows
  for (const f of ['pear', 'peach', 'cherry']) await expect(row(f).locator('.chip')).toHaveCount(0);
  await expect(pop.locator('.sum .k')).toHaveText(['もくひょう', 'がんばり', 'ウェイの きょう']);
  await expect(pop.locator('.sum .v')).toHaveText(['+3', '+1', /^\+4\sベル$/]);
  await expect(pop.locator('.duo')).toHaveText('ふたりで ぜんぶ まで：あと 3つ');
  await expect(page.locator('button.canopy').nth(0)).toHaveAttribute('aria-label', /^ウェイ: 歩数 [\d,]+ \/ 8,000歩 ✓ がんばり、ムーブ .*。もくひょう \+3、がんばり \+1、ウェイの きょう \+4\sベル/);
  // ウェイ 3 + 1, うめ 2: today's total (the ベル row's label, ごほうび's pill) is the day's with がんばり
  await expect(hudBells(page)).toHaveAttribute('aria-label', / · きょう 6\sベル$/);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/popup-1.png` });
});

test('the cap: three goals at 1.5× all show the same chip, the ledger pays +2 with 上限 2; the popups and ふたりでぜんぶ add up to today’s total', async ({ page }) => {
  await open(page, '2026-12-07T23:00');
  const pop = await popup(page, 1);
  await expect(pop.locator('.plate')).toHaveText('うめ');
  await expect(pop.locator('.row .lbl')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド']);
  await expect(pop.locator('.row[data-stretched]')).toHaveCount(3);
  // every stretched row shows the same chip, whichever the cap pays
  await expect(pop.locator('.row .chip')).toHaveText(['がんばり', 'がんばり', 'がんばり']);
  await expect(pop.locator('.row[data-row=peach] .chip')).toHaveCount(0);
  await expect(pop.locator('.row .ghost')).toHaveCount(0); // the cap is paid: no ghost hints at more
  await expect(pop.locator('.sum .k')).toHaveText(['もくひょう', 'がんばり（上限 2）', 'うめの きょう']);
  await expect(pop.locator('.sum .v')).toHaveText(['+4', '+2', /^\+6\sベル$/]);
  await expect(pop.locator('.duo')).toHaveText(/^\s*ふたりで ぜんぶ！\s*\+2\s*ふたりに$/);
  // ふたりでぜんぶ is the pair's: in both popups, counted once: ウェイ 4 + うめ 6 + 2 = today's 12
  await expect(hudBells(page)).toHaveAttribute('aria-label', / · きょう 12\sベル$/);
  // the wider rows still fit the stage
  const box = (await pop.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/popup-cap.png` });
  await tap(page, pop); // a tap on the popup closes it
  await page.waitForTimeout(700); // the camera back from making room for it
  const other = await popup(page, 0);
  await expect(other.locator('.sum .v')).toHaveText(['+4', '+0', /^\+4\sベル$/]);
  await expect(other.locator('.sum .k')).toHaveText(['もくひょう', 'がんばり', 'ウェイの きょう']);
  await expect(other.locator('.duo')).toHaveText(/^\s*ふたりで ぜんぶ！\s*\+2\s*ふたりに$/);
  // and ごほうび says the same 12 under the balance
  await tap(page, other);
  await expect(page.locator('.detail')).toHaveCount(0);
  await page.waitForTimeout(700); // (a tap on a popup eats the click after it for 700 ms: IslandScene)
  await openRewards(page);
  await expect(sheet(page).locator('[data-wallet] .hero .today')).toHaveText(/^\s*きょうの ベル\s*\+12\s*ベル\s*$/);
});

test('no stretch: no chip, only its faint ghosts, and がんばり +0 in the ledger', async ({ page }) => {
  await open(page, '2026-11-04T23:00');
  const pop = await popup(page, 0);
  await expect(pop.locator('.row[data-stretched]')).toHaveCount(0);
  await expect(pop.locator('.chip')).toHaveCount(0);
  await expect(pop.locator('.row .ghost')).toHaveCount(4);
  await expect(pop.locator('.sum .k')).toHaveText(['もくひょう', 'がんばり', 'ウェイの きょう']);
  await expect(pop.locator('.sum [data-v=stretch]')).toHaveText('+0');
  await expect(pop.locator('.sum [data-v=stretch]')).toHaveClass(/zero/);
});

test('the ベル ledger: a がんばり line under the day with each person\'s ベル; the day shows the chip, +1 a goal and its がんばり', async ({ page }) => {
  await open(page, '2026-12-07T23:00');
  await openRewards(page);
  await expect(sheet(page).locator('.panel-body')).toBeVisible();
  await sheet(page).locator('[data-ledger]').scrollIntoViewIfNeeded();
  const day = sheet(page).locator('li.day:not(.head)').first();
  await expect(day.locator('.dt')).toHaveText('12/7(月)');
  await expect(day.locator('.gbk')).toHaveText('がんばり');
  await expect(day.locator('.gbv[data-person=B]')).toHaveText(/^\+2\sベル/);
  await expect(day.locator('.gbv[data-person=A]')).toHaveText('');
  await expect(day.locator('.tot')).toHaveText(/^\+12\sベル$/); // 4 + うめ 4 + 2 + 2 together
  // a day without がんばり has no second line
  const plain = sheet(page).locator('li.day:not(.head)').filter({ hasText: '12/5(土)' });
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
    for (const tree of [0, 1]) {
      await open(page, '2026-12-07T23:00');
      const pop = await popup(page, tree);
      const box = (await pop.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
      if (process.env.SHOTS && tree) await page.screenshot({ path: `${process.env.SHOTS}/popup-cap-320.png` });
    }
  });
});
