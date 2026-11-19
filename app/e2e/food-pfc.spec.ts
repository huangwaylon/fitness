// ごはん's 記録 (design.md "Gohan"): the summary's tiles P · F · C a row, 塩分 · 食物繊維 under them; every entry's P · F · C as
// eaten under its amount, a lot of one tinted (model/food.ts PFC_HIGH), 「–」 for one its food doesn't know. On `?demo`
// (store/demo/rows.ts: the lunch's カレーライス（チキン） 1人前 510 g at 4 / 4.5 / 23 g per 100 g), tapped as on the phones.
import { expect, test, type Locator, type Page } from './fixtures.ts';

const sheet = (page: Page) => page.locator('dialog[open] [data-food-sheet]');
const press = (l: Locator, browserName: string) => (browserName === 'webkit' ? l.tap() : l.click());

async function openFood(page: Page, browserName: string, w: number, h: number) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto('?demo&date=2026-11-04T12:30&critter=none&visitor=none');
  await press(page.getByRole('button', { name: 'けんこう', exact: true }), browserName);
  const tab = page.locator('dialog[open] [data-kenkou-tab=food]');
  await press(tab, browserName);
  await expect(tab).toHaveAttribute('aria-current', 'page');
  await expect(sheet(page).locator('[data-food-summary]')).toBeVisible();
}

for (const [w, h] of [[393, 852], [375, 667]]) {
  test(`summary tiles at ${w} × ${h}: P · F · C on one row, 塩分 · 食物繊維 on the next`, async ({ page, browserName }) => {
    await openFood(page, browserName, w, h);
    await press(sheet(page).locator('[data-food-more] summary'), browserName);
    const box = async (k: string) => (await sheet(page).locator(`[data-food-summary] [data-nutrient=${k}]`).boundingBox())!;
    const [p, fa, c, s, fi] = await Promise.all(['p', 'fa', 'c', 's', 'fi'].map(box));
    for (const b of [fa, c]) expect(Math.abs(b.y - p.y)).toBeLessThan(1);
    expect(p.x).toBeLessThan(fa.x);
    expect(fa.x).toBeLessThan(c.x);
    expect(Math.abs(s.y - fi.y)).toBeLessThan(1);
    expect(s.y).toBeGreaterThanOrEqual(p.y + p.height);
    expect(Math.abs(s.x - p.x)).toBeLessThan(1); // the second row starts under protein
    const card = (await sheet(page).locator('[data-food-summary]').boundingBox())!;
    expect(c.x + c.width).toBeLessThanOrEqual(card.x + card.width); // inside the card
    // a goal line stays whole at its spaces: 「目標 7.5 g 以下」 on one line, not 「7. / 5」
    const salt = sheet(page).locator('[data-nutrient=s] small');
    expect(await salt.evaluate((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)))).toBe(1);
  });

  test(`an entry’s P · F · C as eaten at ${w} × ${h}: the curry’s a lot of each, the rice’s trace of fat to a decimal`, async ({ page, browserName }) => {
    await openFood(page, browserName, w, h);
    const curry = sheet(page).locator('[data-meal=l] [data-entry]').first(); // カレーライス（チキン）, the lunch's one
    await curry.scrollIntoViewIfNeeded();
    const pfc = curry.locator('[data-entry-pfc]');
    // 510 g: 20.4 / 22.95 / 117.3 g, each past its mark (20 / 15 / 70)
    await expect(pfc.locator('[data-pfc-of]')).toHaveText(['Pたんぱく質 20多め', 'F脂質 23多め', 'C炭水化物 117多め']);
    expect(await pfc.locator('[data-pfc-of=fa]').evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    const rice = sheet(page).locator('[data-meal=b] [data-entry]').first(); // ごはん（精白米）, the いつもの's first
    await expect(rice.locator('[data-entry-pfc] [data-pfc-of]')).toHaveText(['Pたんぱく質 4', 'F脂質 0.5', 'C炭水化物 56']); // 150 g
    await expect(rice.locator('[data-entry-pfc] [data-high]')).toHaveCount(0);
    expect(await rice.locator('[data-pfc-of=c]').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    // the line fits its row, left of the kcal
    const [row, line, kc] = await Promise.all([curry.boundingBox(), pfc.boundingBox(), curry.locator('.kc').boundingBox()]);
    expect(line!.x + line!.width).toBeLessThanOrEqual(kc!.x);
    expect(line!.y + line!.height).toBeLessThanOrEqual(row!.y + row!.height);
    // a tap on the row still opens its amount (my own day)
    await press(curry, browserName);
    await expect(page.locator('dialog[open] [data-remove]')).toBeVisible();
  });
}

// クイック (kcal and protein only): its fat and carbs unknown, so 「–」 on its row and the day's F and C 「≥」 (一部不明)
test('a クイック of kcal and protein: P its own, F and C 「–」 (never 0); the day’s P goes up by it', async ({ page, browserName }) => {
  await openFood(page, browserName, 393, 852);
  const s = sheet(page);
  const pBefore = Number((await s.locator('[data-food-summary] [data-line=p]').textContent())!.replace(/[^\d.]/g, ''));
  await press(s.locator('[data-add=d]'), browserName);
  await press(s.locator('[data-quick-new]'), browserName);
  const lv = s.locator('[data-custom-level=quick]');
  await lv.locator('[data-custom-n]').fill('ラーメン屋');
  await lv.locator('[data-custom-k]').fill('850');
  await lv.locator('[data-custom-nut=p]').fill('30');
  await press(lv.locator('[data-custom-save]'), browserName);
  await expect(s.locator('[data-food-added] [data-added]')).toHaveCount(1);
  await press(s.locator('[data-food-finish]'), browserName);
  const e = s.locator('[data-meal=d] [data-entry]').last(); // the dinner's 生姜焼き定食, then ラーメン屋
  await expect(e.locator('.nm')).toHaveText('ラーメン屋');
  await expect(e.locator('[data-entry-pfc] [data-pfc-of]')).toHaveText(['Pたんぱく質 30多め', 'F脂質 –', 'C炭水化物 –']);
  await expect(s.locator('[data-food-summary] [data-line=p]')).toHaveText(`Pたんぱく質 ${(pBefore + 30).toFixed(1)} g`);
  await expect(s.locator('[data-food-summary] [data-line=fa] [data-partial]')).toHaveText('≥');
});
