// がんばり, the stretch bonus (docs/design.md#economy): +1 more for each goal at 1.5× (🍎 12,000 steps, 🍐 1.5 × the
// Move goal, 🍑 90 min, 🍒 180 min), at most +2 a person a day. On the island it shows only in the tree's popup (a ★
// after the value, the row's +2, the day's がんばり line, 上限 when more were reached than the cap pays) and in the ribbon's
// total; in きろく as its own line per day and per person, and in the day. The demo's days (seeded, ?date=):
// 11-03 ウェイ steps at 1.5× (3 goals + 1); 12-07 うめ all four, Move, Stand and steps at 1.5× (4 + 2, capped).
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const sheet = (page: Page) => page.locator('dialog[open]');
const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
async function open(page: Page, date: string) {
  await page.goto(`?demo&date=${date}`);
  await expect(ribbon(page)).toBeVisible();
}
async function popup(page: Page, tree: number) {
  await page.locator('button.canopy').nth(tree).click();
  const pop = page.locator('.detail');
  await expect(pop).toBeVisible();
  await pop.evaluate((e) => Promise.all(e.getAnimations().map((a) => a.finished))); // its pop-in, for the screenshots
  return pop;
}

test('the popup: a ★ and +2 on the row at 1.5×, the day\'s がんばり line; the ribbon includes it', async ({ page }) => {
  await open(page, '2026-11-03T23:00');
  const pop = await popup(page, 0);
  await expect(pop.locator('.plate')).toHaveText('ウェイ');
  const row = (f: string) => pop.locator(`.row[data-row=${f}]`);
  await expect(row('apple')).toHaveAttribute('data-stretched', 'true');
  await expect(row('apple').locator('.amt svg.gb')).toHaveCount(1);
  await expect(row('apple').locator('b')).toHaveText('+2');
  for (const f of ['pear', 'peach', 'cherry']) {
    await expect(row(f).locator('.amt svg.gb')).toHaveCount(0);
    await expect(row(f).locator('b')).toHaveText('+1');
  }
  await expect(pop.locator('.gbl')).toHaveText('がんばり +1');
  await expect(page.locator('button.canopy').nth(0)).toHaveAttribute('aria-label', /^ウェイ: 歩数 [\d,]+ \/ 8,000歩 ✓ \+2 ★、ムーブ .*。がんばり \+1/);
  // ウェイ 3 + 1, うめ 2: the ribbon is the day's total with がんばり
  await expect(ribbon(page)).toHaveAccessibleName('きょう 6 ベル');
  await page.screenshot({ path: '/tmp/stretch/popup-1.png' });
});

test('the cap: three goals at 1.5× all show their ★, two pay +2, the line says 上限', async ({ page }) => {
  await open(page, '2026-12-07T23:00');
  const pop = await popup(page, 1);
  await expect(pop.locator('.plate')).toHaveText('うめ');
  await expect(pop.locator('.row .lbl')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド']);
  await expect(pop.locator('.row[data-stretched]')).toHaveCount(3);
  // the cap is paid in Apple's ring order (Move, Stand); steps reached it too, shown with its ★ at +1
  await expect(pop.locator('.row b')).toHaveText(['+1', '+2', '+1', '+2']);
  await expect(pop.locator('.row[data-row=apple] .amt svg.gb')).toHaveCount(1);
  await expect(pop.locator('.gbl')).toHaveText('がんばり +2（上限）');
  // the wider rows still fit the stage
  const box = (await pop.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: '/tmp/stretch/popup-cap.png' });
});

test('no stretch, no line: the popup is as before', async ({ page }) => {
  await open(page, '2026-11-04T23:00');
  const pop = await popup(page, 0);
  await expect(pop.locator('.row[data-stretched]')).toHaveCount(0);
  await expect(pop.locator('.gbl')).toHaveCount(0);
  await expect(pop.locator('.row b')).toHaveText(['+1', '+1', '+1', '+1']);
});

test('きろく: a がんばり line under the day with each person\'s ベル; the day shows ★, +2 and its がんばり', async ({ page }) => {
  await open(page, '2026-12-07T23:00');
  await ribbon(page).click();
  await expect(sheet(page).locator('.panel-body')).toBeVisible();
  await sheet(page).locator('.tab[data-tab=kiroku]').click();
  const day = sheet(page).locator('li.day:not(.head)').first();
  await expect(day.locator('.dt')).toHaveText('12/7(月)');
  await expect(day.locator('.gbk')).toHaveText('がんばり');
  await expect(day.locator('.gbv[data-person=B]')).toHaveText(/^\+2\sベル/);
  await expect(day.locator('.gbv[data-person=A]')).toHaveText('');
  await expect(day.locator('.tot')).toHaveText(/^\+12\sベル$/); // 4 + うめ 4 + 2 + 2 together
  // a day without がんばり has no second line
  const plain = sheet(page).locator('li.day:not(.head)').filter({ hasText: '12/5(土)' });
  await expect(plain.locator('.gbk')).toHaveCount(0);
  await sheet(page).locator('.panel-body').screenshot({ path: '/tmp/stretch/kiroku.png' });
  await day.locator('button.dbtn').click();
  const b = sheet(page).locator('.pc[data-person=B]');
  await expect(b.locator('.row')).toHaveCount(4);
  await expect(b.locator('.row svg.st')).toHaveCount(3);
  await expect(b.locator('.row .b')).toHaveText(['+2', '+1', '+2', '+1']);
  await expect(b.locator('.gbrow')).toContainText('がんばり');
  await expect(b.locator('.gbrow .b')).toHaveText('+2（上限）');
  await expect(sheet(page).locator('.pc[data-person=A] .gbrow')).toHaveCount(0);
  await page.waitForTimeout(600); // the page's slide-in, for the screenshot
  await sheet(page).locator('.panel-body').screenshot({ path: '/tmp/stretch/day.png' });
});

test('あそびかた: the がんばり rule and each goal\'s 1.5× target', async ({ page }) => {
  await open(page, '2026-11-03T12:00');
  await ribbon(page).click();
  await sheet(page).locator('.tab[data-tab=settings]').click();
  await sheet(page).locator('[data-push=help]').click();
  const howto = sheet(page).locator('.howto');
  await expect(howto).toContainText('目標の 1.5ばいまで できたら、がんばりで もう +1 ベル。1日 2 ベルまで！');
  await expect(howto.locator('.fruits small.st')).toHaveText(['がんばり 900 kcal', 'がんばり 90分', 'がんばり 180分', 'がんばり 12,000歩']);
  await howto.screenshot({ path: '/tmp/stretch/howto.png' });
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
      if (tree) await page.screenshot({ path: '/tmp/stretch/popup-cap-320.png' });
    }
  });
});
