// ごはん's 記録 (design.md "Gohan"): the summary's tiles P · F · C a row, 塩分 · 食物繊維 under them; every entry's P · F · C as
// eaten under its amount, each tinted by its share of the person's day (model/food.ts pfcTint: an eighth light, a quarter
// strong + 「多め」), 「–」 for one its food doesn't know. On `?demo` (store/demo/rows.ts: the lunch's カレーライス（チキン）
// 1人前 510 g at 4 / 4.5 / 23 g per 100 g; ウェイ's goals kcal 2,200, protein 110 g: so F 61 g, C 316 g), tapped as on the phones.
import { expect, test, type Locator, type Page } from './fixtures.ts';

const sheet = (page: Page) => page.locator('dialog[open] [data-food-sheet]');
const press = (l: Locator, browserName: string) => (browserName === 'webkit' ? l.tap() : l.click());

async function openFood(page: Page, browserName: string, w: number, h: number, time = '12:30') {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`?demo&date=2026-11-04T${time}&critter=none&visitor=none`);
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
    // 510 g: 20.4 / 22.95 / 117.3 g of 110 / 61.1 / 316.3: 19 % (light), 38 %, 37 % (strong, 「多め」)
    await expect(pfc.locator('[data-pfc-of]')).toHaveText(['Pたんぱく質 20', 'F脂質 23多め', 'C炭水化物 117多め']);
    expect(await pfc.locator('[data-pfc-of]').evaluateAll((es) => es.map((e) => e.getAttribute('data-tint')))).toEqual(['1', '2', '2']);
    const weight = (k: string) => pfc.locator(`[data-pfc-of=${k}]`).evaluate((e) => Number(getComputedStyle(e).fontWeight));
    expect(await weight('fa')).toBeGreaterThan(await weight('p')); // strong is bold too, not colour alone
    expect(await pfc.locator('[data-pfc-of=fa]').evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    const rice = sheet(page).locator('[data-meal=b] [data-entry]').first(); // ごはん（精白米）, the いつもの's first
    await expect(rice.locator('[data-entry-pfc] [data-pfc-of]')).toHaveText(['Pたんぱく質 4', 'F脂質 0.5', 'C炭水化物 56']); // 150 g
    expect(await rice.locator('[data-entry-pfc] [data-pfc-of]').evaluateAll((es) => es.map((e) => e.getAttribute('data-tint')))).toEqual(['0', '0', '1']); // C 18 %
    expect(await rice.locator('[data-pfc-of=p]').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
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
  // (a meal out nothing in the data holds: 見つかりませんでした's カロリーだけ記録)
  await s.locator('[data-food-q]').fill('ぽこぺん亭');
  await press(s.locator('[data-food-none] [data-quick-new]'), browserName);
  const lv = s.locator('[data-custom-level=quick]');
  await lv.locator('[data-custom-n]').fill('ラーメン屋');
  await lv.locator('[data-custom-k]').fill('850');
  await lv.locator('[data-custom-nut=p]').fill('30');
  await press(lv.locator('[data-custom-save]'), browserName);
  await expect(s.locator('[data-food-added] [data-added]')).toHaveCount(1);
  await press(s.locator('[data-food-finish]'), browserName);
  const e = s.locator('[data-meal=d] [data-entry]').last(); // the dinner's 生姜焼き定食, then ラーメン屋
  await expect(e.locator('.nm')).toHaveText('ラーメン屋');
  await expect(e.locator('[data-entry-pfc] [data-pfc-of]')).toHaveText(['Pたんぱく質 30多め', 'F脂質 –', 'C炭水化物 –']); // 30 of 110 g: 27 %
  await expect(s.locator('[data-food-summary] [data-line=p]')).toHaveText(`Pたんぱく質 ${(pBefore + 30).toFixed(1)} g`);
  await expect(s.locator('[data-food-summary] [data-line=fa] [data-partial]')).toHaveText('≥');
});

/** Each tinted cell's text against its tint over the meal card, as painted (a canvas composes the computed colours). */
const tintContrasts = (l: Locator) =>
  l.evaluateAll((es) => {
    const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true })!;
    const paint = (...cs: string[]) => {
      ctx.clearRect(0, 0, 1, 1);
      for (const c of cs) { ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); }
      return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    };
    const lum = (c: number[]) => { const [r, g, b] = c.map((v) => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    return es.map((e) => {
      const card = getComputedStyle(e.closest('.meal')!).backgroundColor, bg = paint(card, getComputedStyle(e).backgroundColor);
      if (bg.join() === paint(card).join()) return 0; // no tint painted (or a colour the canvas couldn't read): fails
      const [a, b] = [lum(paint(card, getComputedStyle(e).color)), lum(bg)].sort((x, y) => y - x);
      return (a + 0.05) / (b + 0.05);
    });
  });

for (const [time, tod] of [['12:30', 'day'], ['22:30', 'night']]) {
  test(`the tints read at 4.5:1 by ${tod}`, async ({ page, browserName }) => {
    await openFood(page, browserName, 393, 852, time);
    await expect(page.locator('html')).toHaveAttribute('data-tod', tod);
    const tinted = sheet(page).locator('[data-entry-pfc] [data-tint="1"], [data-entry-pfc] [data-tint="2"]');
    await expect(sheet(page).locator('[data-entry-pfc] [data-tint="1"]').first()).toBeAttached();
    await expect(sheet(page).locator('[data-entry-pfc] [data-tint="2"]').first()).toBeAttached();
    const cs = await tintContrasts(tinted);
    expect(cs.length).toBeGreaterThan(2);
    for (const c of cs) expect(c).toBeGreaterThanOrEqual(4.5);
  });
}

// いつものだけ (model/food.ts uncounted): the demo's ウェイ has a 毎日 breakfast いつもの and meals logged to 11/4; two
// days on, 11/5 holds the breakfast alone. That day says so softly in the goal bar's place (no 少なめ chip, every ＋ still
// on screen), and グラフ's average leaves it out of its n日分; salt there reads against the goal, with the food that gave
// the most.
test('a past day of いつもの alone: a soft note on its day, out of グラフ’s average; salt’s average with its biggest source', async ({ page, browserName }) => {
  await page.clock.install({ time: new Date('2026-11-04T23:40:00+09:00') });
  await page.clock.resume();
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('?demo&critter=none&visitor=none');
  await press(page.getByRole('button', { name: 'けんこう', exact: true }), browserName);
  await press(page.locator('dialog[open] [data-kenkou-tab=food]'), browserName);
  const s = sheet(page);
  await expect(s.locator('[data-food-summary]')).toBeVisible();
  await expect(s.locator('[data-food-rep-only]')).toHaveCount(0); // 11/4: logged
  const days = async () => Number((await s.locator('[data-avg-range]').textContent())!.match(/(\d+)日分/)![1]);
  await press(s.locator('[data-tab=chart]'), browserName);
  await expect(s.locator('[data-avg-range]')).toHaveText(/〜11\/3 · \d+日分$/);
  const before = await days();
  await page.clock.fastForward('48:00:00');
  await press(s.locator('[data-tab=log]'), browserName);
  await expect(s.locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-06');
  await expect(s.locator('[data-food-rep-only]')).toHaveCount(0); // today: still going
  await press(s.locator('[data-nav=back]'), browserName);
  await expect(s.locator('[data-food-date]')).toHaveAttribute('data-food-date', '2026-11-05');
  await expect(s.locator('[data-food-rep-only]')).toHaveText('いつものだけなので平均に入りません');
  await expect(s.locator('[data-food-chip]')).toHaveCount(0);
  for (const k of ['b', 'l', 'd', 's']) await expect(s.locator(`[data-add=${k}]`)).toBeInViewport({ ratio: 1 });

  // グラフ: to 11/5 now, 11/4 in, 11/5 not
  await press(s.locator('[data-tab=chart]'), browserName);
  await expect(s.locator('[data-avg-range]')).toHaveText(/〜11\/5 · \d+日分$/);
  expect(await days()).toBe(before + 1);
  const salt = s.locator('[data-avg-nutrient=s]');
  await expect(salt.locator('[data-avg-note]')).toContainText(/目標\s[\d.]+\sg\s以下$/);
  await expect(salt.locator('[data-avg-salty]')).toHaveText(/^塩分が多いのは .+ · \d+回$/);
});

/** The open sheet's animations finished and its scroll still (a tap lands where it was aimed). */
async function settled(page: Page) {
  await page.locator('dialog[open]').evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {}))));
  let last = -1;
  await expect.poll(async () => {
    const v = await sheet(page).evaluate((e) => e.scrollTop);
    const still = v === last;
    last = v;
    return still;
  }).toBe(true);
}
/** A meal search's first row named `name` → its amount level (the row opened in place, then its くわしく ›). */
async function amountOf(page: Page, browserName: string, q: string, name: RegExp) {
  const s = sheet(page);
  await s.locator('[data-food-q]').fill(q);
  const row = s.locator('[data-food-results]').getByRole('button', { name }).first();
  await row.waitFor({ timeout: 20_000 });
  await settled(page);
  await press(row, browserName);
  await settled(page);
  await press(s.locator('[data-food-open-more]'), browserName);
  await expect(s.locator('[data-food-live]')).toBeVisible();
}

// スープ半分 (contract/food.ts FoodSnap `hs`): a food in a broth (foodUi.ts isBroth) has the chip on its amount level; on,
// the salt shown and logged is half (kcal as it is), the entry says so, and reopening it has the chip on; off again, all.
test('スープ半分: a broth’s amount counts half its salt, the entry says so and keeps it; ごはん has no chip', async ({ page, browserName }) => {
  await openFood(page, browserName, 393, 852);
  const s = sheet(page);
  const num = (x: string | null) => Number(x!.replace(/[^\d.]/g, ''));
  const salt = () => s.locator('[data-food-summary] [data-line=s]').textContent().then(num);
  const before = await salt();
  await press(s.locator('[data-add=d]'), browserName);
  await amountOf(page, browserName, 'かけそば', /^かけそば/);
  const chip = s.locator('[data-food-half]');
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await expect(s.locator('[data-food-half-note]')).toHaveCount(0); // (said only while on)
  // the soup's share said by the app; the data note never says its own (plausible.test.ts)
  await expect(s.locator('[data-food-soup]')).toHaveText('スープを全部飲んだ場合');
  await expect(s.locator('[data-food-note]')).toHaveText(/^一般的な推定値/);
  await expect(s.locator('.ctl [data-food-half]')).toBeVisible(); // in the amount's card
  const live = s.locator('[data-food-live]');
  const shown = () => live.locator('[data-salt]').textContent().then(num);
  const kcal = await live.locator('.k').textContent();
  const all = await shown();
  expect(all).toBeGreaterThan(0);
  await press(chip, browserName);
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(s.locator('[data-food-half-note]')).toHaveText('塩分だけ半分に数えます');
  await expect(s.locator('[data-food-soup=half]')).toHaveText('スープは半分飲んだ場合');
  await expect(s.locator('[data-food-note]')).not.toContainText('全部');
  await expect.poll(shown).toBeCloseTo(all / 2, 1);
  await expect(live.locator('.k')).toHaveText(kcal!);
  await press(s.locator('[data-done]'), browserName);
  await press(s.locator('[data-food-finish]'), browserName);
  const e = s.locator('[data-meal=d] [data-entry]').last();
  await expect(e.locator('[data-entry-half]')).toHaveText(' · スープ半分');
  await expect.poll(salt).toBeCloseTo(before + all / 2, 0);
  // reopened: on; off and saved: all of it
  await press(e, browserName);
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await press(chip, browserName);
  await press(s.locator('[data-done]'), browserName);
  await expect(s.locator('[data-meal=d] [data-entry-half]')).toHaveCount(0);
  await expect.poll(salt).toBeCloseTo(before + all, 0);

  // ごはん: no broth, no chip
  await press(s.locator('[data-add=d]'), browserName);
  await amountOf(page, browserName, 'ごはん', /^ごはん/);
  await expect(chip).toHaveCount(0);
});

// Not a broth to leave: a 鍋 whose values count only the broth eaten (its note's 「喫食分」), an おでん piece.
test('no スープ半分 for 寄せ鍋 (its broth eaten already counted) nor おでん 大根', async ({ page, browserName }) => {
  await openFood(page, browserName, 393, 852);
  const s = sheet(page);
  await press(s.locator('[data-add=d]'), browserName);
  await amountOf(page, browserName, '寄せ鍋', /^寄せ鍋/);
  await expect(s.locator('[data-food-note]')).toContainText('喫食分');
  await expect(s.locator('[data-food-half]')).toHaveCount(0);
  await expect(s.locator('[data-food-soup]')).toHaveCount(0);
  await press(page.locator('dialog[open]').getByRole('button', { name: '戻る' }), browserName); // ‹ to the search
  await amountOf(page, browserName, 'おでん 大根', /^おでん 大根/);
  await expect(s.locator('[data-food-half]')).toHaveCount(0);
  await expect(s.locator('[data-food-soup]')).toHaveCount(0);
});
