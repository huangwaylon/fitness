// けんこう's typed-in からだ values (design.md "Kenkou", contract/bodyIn.ts): InBody's 筋肉量 and 骨格筋量, which Apple
// Health can't carry, typed in on their cards (the day tapped on the chart, else today), charted like the others;
// 基礎代謝量 worked out from 除脂肪体重. On `?demo` (うめ has entries, ウェイ none), tapped as on the phones.
import { expect, test, type Locator, type Page } from './fixtures.ts';

const sheet = (page: Page) => page.locator('dialog[open]');
const press = (l: Locator, browserName: string, position?: { x: number; y: number }) => (browserName === 'webkit' ? l.tap({ position }) : l.click({ position }));

async function openBody(page: Page, browserName: string) {
  await page.clock.install({ time: new Date('2026-10-31T12:10:00+09:00') });
  await page.clock.resume();
  await page.goto('?demo');
  await press(page.getByRole('button', { name: 'けんこう', exact: true }), browserName);
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
  await press(sheet(page).locator('[data-group=body]'), browserName);
  await expect(sheet(page).locator('.health .bc')).toHaveCount(7);
}

test('筋肉量: typed in for today, then for a day tapped on the chart; charted; cleared; the same row as every card', async ({ page, browserName }) => {
  await openBody(page, browserName);
  await expect(sheet(page).locator('.bc h3')).toHaveText(['体重', '体脂肪率', 'BMI', '除脂肪体重', '筋肉量', '骨格筋量', '基礎代謝量']);
  const card = sheet(page).locator('.bc[data-metric=muscle_kg]');
  await card.scrollIntoViewIfNeeded();
  // ウェイ has none yet: the nudge, and the chip for today
  await expect(card.locator('.none')).toHaveText('まだ記録がありません。InBodyの数字を入れてみましょう');
  const chip = card.locator('button[data-goal=muscle_kg-in]');
  await expect(chip).toHaveText('10/31の記録');
  await press(chip, browserName);
  const tray = card.locator('form.tray');
  await expect(tray).toContainText('10/31の筋肉量');
  await expect(tray.locator('.hint')).toHaveText('10〜100 kg、InBodyの数字をそのまま');
  const input = tray.getByRole('textbox');
  await expect(input).toHaveAttribute('inputmode', 'decimal');
  await input.fill('101');
  await press(tray.getByRole('button', { name: '決定' }), browserName);
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.fill('35.1');
  await press(tray.getByRole('button', { name: '決定' }), browserName);
  await expect(tray).toHaveCount(0);
  await expect(sheet(page).getByRole('status')).toContainText('筋肉量を記録しました');
  await expect(card.locator('[data-stat=latest]')).toHaveText('35.1 kg');
  await expect(card.locator('.stats dt').first()).toHaveText('最新 10/31');
  await expect(card.locator('[data-stat=since]')).toHaveText('–');
  await expect(card.locator('circle.dot.pA')).toHaveCount(1);
  // another day: tap 10/27's slot on the chart, then the chip says that day; −/＋ start from the last value
  const chart = card.locator('.chart');
  const cb = (await chart.boundingBox())!;
  const slot = (cb.width - 44) / 7;
  await press(chart, browserName, { x: 38 + slot * 2.5, y: cb.height / 2 });
  await expect(chip).toHaveText('10/27の記録');
  await press(chip, browserName);
  await expect(input).toHaveValue('');
  await press(tray.getByRole('button', { name: '増やす' }), browserName);
  await expect(input).toHaveValue('35.2');
  await press(tray.getByRole('button', { name: '決定' }), browserName);
  await expect(card.locator('circle.dot.pA')).toHaveCount(2);
  await expect(card.locator('.stats dt').last()).toHaveText('4日前より');
  await expect(card.locator('[data-stat=since]')).toHaveText('−0.1 kg');
  // cleared: that day's dot goes
  await press(chip, browserName);
  await expect(input).toHaveValue('35.2');
  await press(tray.getByRole('button', { name: 'この日の記録を消す' }), browserName);
  await expect(card.locator('circle.dot.pA')).toHaveCount(1);
  await expect(card.locator('[data-stat=since]')).toHaveText('–');
  // the stat row: two equal boxes, as on every からだ card
  const boxes = card.locator('.stats > div');
  const [l, r] = [(await boxes.first().boundingBox())!, (await boxes.last().boundingBox())!];
  expect(Math.abs(l.width - r.width)).toBeLessThan(1);
});

test('うめ’s 骨格筋量 from her entries; 基礎代謝量 from 除脂肪体重 (InBody’s formula), no goal and no entry', async ({ page, browserName }) => {
  await openBody(page, browserName);
  await sheet(page).locator('.navbar select[data-pick=who]').selectOption('B');
  await sheet(page).locator('.health select[data-pick=period]').selectOption('month');
  const smm = sheet(page).locator('.bc[data-metric=smm_kg][data-person=B]');
  await smm.scrollIntoViewIfNeeded();
  expect(await smm.locator('circle.dot.pB').count()).toBeGreaterThan(3);
  await expect(smm.locator('[data-stat=since]')).toHaveText(/^[+−±]\d+\.\d kg$/);
  const bmr = sheet(page).locator('.bc[data-metric=bmr][data-person=B]');
  await bmr.scrollIntoViewIfNeeded();
  await expect(bmr.locator('.note')).toHaveText('除脂肪体重から計算（InBodyと同じ式）');
  await expect(bmr.locator('button[data-goal]')).toHaveCount(0);
  // 370 + 21.6 × the latest lean mass, whole kcal
  const lean = Number((await sheet(page).locator('.bc[data-metric=lean_kg] [data-stat=latest]').textContent())!.replace(' kg', ''));
  await expect(bmr.locator('[data-stat=latest]')).toHaveText(`${Math.round(370 + 21.6 * lean).toLocaleString('en')} kcal`);
  await expect(bmr.locator('[data-stat=since]')).toHaveText(/^[+−±][\d,]+ kcal$/);
});

test('the guest’s phone: no からだ card at all, so no typed-in value either', async ({ page }) => {
  await page.goto('?demo&as=G');
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
  await expect(sheet(page).locator('[data-group=body], .bc, [data-metric=muscle_kg], [data-metric=bmr]')).toHaveCount(0);
});
