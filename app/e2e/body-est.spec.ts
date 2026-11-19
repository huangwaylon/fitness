// けんこう's estimated からだ values (design.md "Kenkou", contract/bodyEst.ts): InBody's 筋肉量 and 骨格筋量, which Apple
// Health can't carry, estimated every day from 除脂肪体重 (うめ's InBody sheet, the admin's, calibrates hers, ウェイ the
// sex's ratio), nothing typed in; 基礎代謝量 worked out from 除脂肪体重. On `?demo`, tapped as on the phones.
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

test('筋肉量 / 骨格筋量: every weigh-in’s lean mass estimated, said so; the same stat row as every card', async ({ page, browserName }) => {
  await openBody(page, browserName);
  await expect(sheet(page).locator('.bc h3')).toHaveText(['体重', '体脂肪率', 'BMI', '除脂肪体重', '筋肉量', '骨格筋量', '基礎代謝量']);
  const leanCard = sheet(page).locator('.bc[data-metric=lean_kg]');
  const lean = Number((await leanCard.locator('[data-stat=latest]').textContent())!.replace(' kg', ''));
  const leanDots = await leanCard.locator('circle.dot.pA').count();
  for (const [m, ratio] of [['muscle_kg', 0.94], ['smm_kg', 0.57]] as const) {
    const card = sheet(page).locator(`.bc[data-metric=${m}]`);
    await card.scrollIntoViewIfNeeded();
    // ウェイ has no InBody sheet: the man's ratio, a dot for every lean mass
    await expect(card.locator('.note')).toHaveText('除脂肪体重から推定（平均的な比率）');
    await expect(card.locator('[data-stat=latest]')).toHaveText(`${(Math.round(lean * ratio * 10) / 10).toFixed(1)} kg`);
    await expect(card.locator('circle.dot.pA')).toHaveCount(leanDots);
    const boxes = card.locator('.stats > div');
    const [l, r] = [(await boxes.first().boundingBox())!, (await boxes.last().boundingBox())!];
    expect(Math.abs(l.width - r.width)).toBeLessThan(1);
  }
});

test('うめ’s estimates fitted to her InBody sheet; 基礎代謝量 from 除脂肪体重 (InBody’s formula), no goal', async ({ page, browserName }) => {
  await openBody(page, browserName);
  await sheet(page).locator('.navbar select[data-pick=who]').selectOption('B');
  await sheet(page).locator('.health select[data-pick=period]').selectOption('month');
  const smm = sheet(page).locator('.bc[data-metric=smm_kg][data-person=B]');
  await smm.scrollIntoViewIfNeeded();
  await expect(smm.locator('.note')).toHaveText('除脂肪体重から推定（InBodyの記録で補正）');
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

test('the guest’s phone: no からだ card at all, so no estimate either', async ({ page }) => {
  await page.goto('?demo&as=G');
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
  await expect(sheet(page).locator('[data-group=body], .bc, [data-metric=muscle_kg], [data-metric=bmr]')).toHaveCount(0);
});
