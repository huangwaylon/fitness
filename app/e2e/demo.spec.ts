// Demo smoke test: buy, undo, the harvest recap, the ベル ledger (read-only), けんこう's goals, on `?demo` (no backend, no key).
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, hudBells, hudMenu, openRewards, unfoldMenu } from './hud.ts';
import { BASE, islandUp, islandURL, lawnTap, quiet, watchComings } from './island.ts';

/** The topmost sheet (a confirm over the panel). */
const sheet = (page: Page) => page.locator('dialog[open]').last();

/** The island is up: the HUD's menu shows and the island under it (the app asks no questions, so nothing to answer first). */
const islandReady = islandUp;

/** The HUD menu's 「ベル」 row: the island panel slides down (ごほうび; no tabs). */
async function openPanel(page: Page) {
  await openRewards(page);
  await expect(sheet(page).locator('.panel-body')).toBeVisible();
  await expect(sheet(page).locator('.navbar')).toContainText('ごほうび');
  await expect(sheet(page).locator('.tabs, [data-tab]')).toHaveCount(0);
}
/** The panel's ベル ledger (under the shop), scrolled to. */
async function openLedger(page: Page) {
  await openPanel(page);
  await sheet(page).locator('[data-ledger]').scrollIntoViewIfNeeded();
  await expect(sheet(page).locator('[data-ledger] section.week').first()).toBeVisible();
}
/** Close every open sheet (Esc), the topmost first. */
async function closeSheets(page: Page) {
  const open = page.locator('dialog[open]');
  for (let n = await open.count(); n > 0; n--) {
    await page.keyboard.press('Escape');
    await expect(open).toHaveCount(n - 1);
  }
}
/** The health popup (the HUD's dumbbell), from wherever we are. */
async function toHealth(page: Page) {
  await closeSheets(page);
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  await expect(sheet(page).locator('[data-health-sheet] .health')).toBeVisible();
  await settled(page);
}
/** A goal's chip at its card's upper right (GoalEdit), and its editor, open in place. */
const goalChip = (page: Page, id: string) => sheet(page).locator(`button[data-goal=${id}]`);
const tray = (page: Page) => sheet(page).locator('form.tray');
/** The topmost sheet's opening animation has played (the health popup zooms in). */
const settled = (page: Page) => sheet(page).evaluate((d) => Promise.all(d.getAnimations().map((a) => a.finished)));
/** The panel, from wherever we are (the open sheets are closed first). */
async function toPanel(page: Page) {
  await closeSheets(page);
  await openPanel(page);
}
/** The せってい sheet, from the HUD menu (すがた, サウンド, ことば…), from wherever we are. */
async function openSettings(page: Page) {
  await closeSheets(page);
  await fromMenu(page, 'settings');
}

test('buy: a reward comes back with とりけす', async ({ page }) => {
  await page.goto('jar?demo');
  const shop = page.locator('.shop');
  const balance = async () => Number((await page.locator('.hero .total').innerText()).replace(/\D/g, ''));
  const before = await balance();
  await shop.locator('button[data-item="dinner"]').click();
  await expect(sheet(page).locator('.price')).toContainText('70');
  await sheet(page).getByRole('button', { name: '買う！' }).click();
  await expect(page.getByText(/外食を買いました！ −70\sベル/)).toBeVisible();
  await expect.poll(balance).toBe(before - 70);
  await page.getByRole('button', { name: '取り消す' }).click();
  await expect.poll(balance).toBe(before);
  // やめる closes the confirm without spending
  await shop.locator('button[data-item="snack"]').click();
  await sheet(page).getByRole('button', { name: 'キャンセル' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(1); // the panel stays
  await expect.poll(balance).toBe(before);
});

test('ごほうび: the jar at the left of one balance, today\'s under it; exactly two rewards with their art: おやつ 40, 外食 70, no examples, no 「あと」', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  await toPanel(page);
  const wallet = sheet(page).locator('[data-wallet]');
  await expect(wallet.locator('.bigjar')).toBeVisible();
  await expect(wallet.locator('.hero .total')).toHaveText(/^\s*[\d,]+\s*ベル$/);
  await expect(wallet.getByText('ふたりのベル')).toHaveCount(0);
  // the header row: the jar left, the balance right of it, today's under the balance
  const [j, tot, tdy] = await Promise.all(['.bigjar', '.hero .total', '.hero .today'].map(async (q) => (await wallet.locator(q).boundingBox())!));
  expect(j.x + j.width).toBeLessThanOrEqual(tot.x);
  expect(tdy.y).toBeGreaterThanOrEqual(tot.y + tot.height - 1);
  expect(Math.abs(tdy.x - tot.x)).toBeLessThan(2);
  expect(tot.y).toBeLessThan(j.y + j.height / 2);
  const shop = page.locator('.shop');
  await expect(shop.locator('button.item')).toHaveCount(2);
  await expect(shop.locator('.nm')).toHaveText(['おやつ', '外食']);
  await expect(shop.locator('.pr')).toHaveText([/^40\sベル$/, /^70\sベル$/]);
  await expect(shop).not.toContainText(/たこやき|マーラータン|あと/);
  for (const id of ['snack', 'dinner']) await expect(shop.locator(`button[data-item=${id}] img`)).toHaveAttribute('src', new RegExp(`items/${id}\\.webp`));
});

test('ごほうび: a small ⓘ at each reward\'s top-right (a 44px target) shows its examples; ⓘ again, a tap elsewhere and Esc fold it, the panel stays', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  await toPanel(page);
  const shop = sheet(page).locator('.shop');
  const tip = shop.locator('[data-info-tip]');
  for (const [id, ex] of [['snack', 'たこやき'], ['dinner', 'マーラータン']]) {
    const info = shop.locator(`[data-info=${id}]`), tile = shop.locator(`button[data-item=${id}]`);
    await expect(info).toHaveAccessibleName(id === 'snack' ? 'おやつとは？' : '外食とは？');
    // small to the eye, in the tile's top-right corner, 44px to the thumb
    const [ib, tb] = [(await info.boundingBox())!, (await tile.boundingBox())!];
    expect(ib.width).toBeLessThanOrEqual(28);
    expect(ib.x + ib.width).toBeGreaterThan(tb.x + tb.width - 16);
    expect(ib.y).toBeLessThan(tb.y + 16);
    const hit = await info.evaluate((el) => { const a = getComputedStyle(el, '::after'); return el.getBoundingClientRect().width - parseFloat(a.left) - parseFloat(a.right); });
    expect(hit).toBeGreaterThanOrEqual(44);
    await expect(info).toHaveAttribute('aria-expanded', 'false');
    await info.click();
    await expect(info).toHaveAttribute('aria-expanded', 'true');
    await expect(tip).toHaveCount(1);
    await expect(tip).toContainText(ex);
    // inside the screen, as wide as the two tiles, its tail under this tile's ⓘ (once it has popped in)
    await tip.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    const b = (await tip.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(b.width).toBeGreaterThan((await shop.boundingBox())!.width - 8);
    const tail = await tip.evaluate((el) => el.getBoundingClientRect().left + parseFloat(getComputedStyle(el, '::before').left) + 7);
    expect(Math.abs(tail - (ib.x + ib.width / 2))).toBeLessThan(3);
    // no buy asked
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await info.click();
    await expect(tip).toHaveCount(0);
  }
  // a tap elsewhere folds it (the tap still lands: nothing else opens here)
  await shop.locator('[data-info=snack]').click();
  await expect(tip).toHaveCount(1);
  await sheet(page).locator('.hero .total').click();
  await expect(tip).toHaveCount(0);
  // Esc folds only it
  await shop.locator('[data-info=dinner]').click();
  await expect(tip).toContainText('マーラータン');
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);
  await expect(page.locator('dialog[open]')).toHaveCount(1);
});

test('ごほうび at 320px: the reward tiles keep no empty band over their art, and ⓘ\'s examples read in a few lines, not one per line', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('?demo');
  await islandReady(page);
  await toPanel(page);
  await settled(page);
  const shop = sheet(page).locator('.shop');
  for (const id of ['snack', 'dinner']) {
    const tile = (await shop.locator(`button[data-item=${id}]`).boundingBox())!, art = (await shop.locator(`button[data-item=${id}] .ic`).boundingBox())!;
    expect(art.y - tile.y).toBeLessThanOrEqual(8);
    await shop.locator(`[data-info=${id}]`).click();
    const tip = shop.locator('[data-info-tip]');
    const lines = await tip.evaluate((el) => { const cs = getComputedStyle(el); return Math.round((el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) / parseFloat(cs.lineHeight)); });
    expect(lines).toBeLessThanOrEqual(3);
    await page.keyboard.press('Escape');
    await expect(tip).toHaveCount(0);
  }
});

test('ごほうび, top to bottom: the header, the rewards, the ベル ledger, then the buys folded at the very bottom (their count shown); the disclosure opens and folds them', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  await toPanel(page);
  const w = sheet(page).locator('[data-wallet]');
  const ys = await w.evaluate((el) => ['.hero', '.shop', '[data-ledger]', '.hist'].map((q) => el.querySelector(q)!.getBoundingClientRect().top));
  for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThan(ys[i - 1]);
  // the buys last (only their erase confirm, a closed dialog, after them)
  expect(await w.evaluate((el) => [...el.children].filter((c) => c.tagName !== 'DIALOG').at(-1)?.classList.contains('hist'))).toBe(true);
  const toggle = w.locator('[data-hist-toggle]');
  const rows = w.locator('.hist li');
  await toggle.scrollIntoViewIfNeeded();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  const n = Number(await toggle.locator('.count').getAttribute('data-count'));
  expect(n).toBeGreaterThan(0); // the demo bought
  await expect(toggle).toContainText(`${n}件`);
  for (const r of await rows.all()) await expect(r).toBeHidden();
  expect((await toggle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(rows.first()).toBeVisible();
  await expect(rows).toHaveCount(Math.min(n, 10));
  // it grows (a transition, not a jump): the fold's height eases in
  expect(await w.locator('.fold').evaluate((el) => getComputedStyle(el).transitionProperty)).toContain('grid-template-rows');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(rows.first()).toBeHidden();
  // folded again on the next opening
  await toggle.click();
  await expect(rows.first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await openPanel(page);
  await expect(sheet(page).locator('[data-hist-toggle]')).toHaveAttribute('aria-expanded', 'false');
});

test('harvest: a recap of the week: each of us, ふたりで ぜんぶ, the total; the coins land in the jar', async ({ page }) => {
  await page.goto('?demo=harvest');
  const tally = page.locator('.overlay .tally');
  await expect(tally.locator('.trow:not(.duo)')).toHaveCount(2);
  for (const row of await tally.locator('.trow:not(.duo) .plus').all()) await expect(row).toHaveText(/^\+\d+\sベル$/);
  await expect(tally.locator('.duo')).toContainText('ふたりで全部');
  await expect(tally.locator('.duo .hint')).toHaveText(/^\d+日 · 1日 \+2\sベル$/);
  await expect(tally.locator('.total')).toContainText('今週のベル');
  await expect(tally.getByText(/バッジ|ボーナス/)).toHaveCount(0);
  await page.getByRole('button', { name: '受け取る！' }).click();
  await expect(page.getByText('お財布に入りました！')).toBeVisible();
  await page.getByRole('button', { name: '島へ戻る' }).click();
  await expect(page.getByRole('button', { name: '受け取る！' })).toHaveCount(0);
});

test('the ベル ledger: per day each of us four goals and ふたりで ぜんぶ; a day is read-only: values, ✓ and +1', async ({ page }) => {
  await page.goto('?demo');
  await openLedger(page);
  const day = sheet(page).locator('li.day:not(.head)').first();
  await expect(day.locator('.marks')).toHaveCount(2);
  await expect(day.locator('.marks').first().locator('.m')).toHaveCount(4);
  await expect(day.locator('.tot')).toHaveText(/^\+\d+\sベル$|^0\sベル$/);
  await sheet(page).getByRole('button', { name: /\(月\)/ }).first().click();
  await expect(sheet(page).locator('.pc')).toHaveCount(2);
  for (const p of ['A', 'B']) await expect(sheet(page).locator(`.pc[data-person=${p}] .row`)).toHaveCount(4);
  await expect(sheet(page).locator('.duo')).toContainText('ふたりで全部');
  await expect(sheet(page).locator('.pen-btn, .atm, input, .log')).toHaveCount(0);
  // the goals are けんこう's now: none here
  await page.locator('.titlebar .back').click();
  await expect(sheet(page).locator('[data-ledger] section.week').first()).toBeVisible();
  await expect(sheet(page).locator('[data-zukan]')).toHaveCount(0); // (the ずかん is the HUD menu's)
  await expect(sheet(page).locator('.goals, .pen-btn')).toHaveCount(0);
});

test('けんこう: body weight (from Health, no logging by hand); its goal is set at the card\'s upper right, in place', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  const bells = await hudBells(page).getAttribute('aria-label');
  await toHealth(page);
  await sheet(page).locator('[data-group=body]').click(); // からだ
  const card = sheet(page).locator('.bc[data-metric=weight]');
  await expect(card.getByRole('heading', { name: '体重' })).toBeVisible();
  await expect(card.getByRole('img', { name: /^ウェイの体重 / })).toHaveCount(1); // this phone's person's (the tab shows one person)
  await expect(card.locator('.pen-btn, .acts')).toHaveCount(0); // nothing to log or fix by hand
  await expect(sheet(page).locator('.goals')).toHaveCount(0); // no goals card: each goal is on its own card
  // the goal chip in the card's header (the demo's 66.0); a tap opens its editor in place, under the header (no level, no ‹)
  const chip = goalChip(page, 'weight-goal');
  await expect(chip).toHaveText('目標 66.0 kg 前後');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-expanded', 'true');
  await expect(sheet(page).locator('.titlebar .back')).toHaveCount(0);
  const ed = tray(page);
  await expect(card.locator('header form.tray')).toHaveCount(1);
  await expect(ed).toContainText('目標体重');
  await expect(ed.getByRole('button', { name: '目標を外す' })).toBeVisible();
  const input = ed.getByRole('textbox');
  await expect(input).toHaveValue('66.0');
  await expect(input).toHaveAttribute('inputmode', 'decimal');
  await expect(input).not.toBeFocused(); // no keyboard until the field is tapped
  expect(await input.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
  await input.fill('300.5');
  await ed.getByRole('button', { name: '決定' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.fill('65');
  await ed.getByRole('button', { name: '決定' }).click();
  await expect(ed).toHaveCount(0);
  await expect(chip).toHaveText('目標 65.0 kg 前後');
  await expect(chip).toBeFocused(); // back on its chip
  // its banner drops over the title bar (and a pointer resting on it holds it there): tap it away, as a thumb would
  const saved = sheet(page).getByRole('status');
  await expect(saved).toContainText('体重の目標を変更しました');
  await saved.getByRole('button', { name: '閉じる' }).click();
  await expect(saved).toHaveCount(0);
  await expect(sheet(page).locator('[data-group=body]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('.bc[data-metric=weight][data-person=A] svg[role=img]')).toHaveAttribute('aria-label', /目標 65\.0/);
  // −/＋ step by 0.5 kg from the goal; やめる changes nothing
  await chip.click();
  await expect(input).toHaveValue('65.0');
  await ed.getByRole('button', { name: '減らす' }).click();
  await ed.getByRole('button', { name: '減らす' }).click();
  await expect(input).toHaveValue('64.0');
  await ed.getByRole('button', { name: 'キャンセル' }).click();
  await expect(ed).toHaveCount(0);
  await expect(chip).toHaveText('目標 65.0 kg 前後');
  // weight never earns: today's ベル didn't move
  await page.keyboard.press('Escape');
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
});

test('けんこう: a goal\'s editor: one open at a time; Esc or a tap elsewhere closes it unchanged, not the sheet', async ({ page }) => {
  await page.goto('?demo');
  await toHealth(page);
  await goalChip(page, 'steps-goal').click();
  await expect(tray(page)).toHaveCount(1);
  await goalChip(page, 'move-goal').click(); // another: this one closes
  await expect(tray(page)).toHaveCount(1);
  await expect(sheet(page).locator('.mc[data-metric=move] form.tray')).toHaveCount(1);
  await expect(goalChip(page, 'steps-goal')).toHaveAttribute('aria-expanded', 'false');
  await tray(page).getByRole('textbox').fill('900');
  await page.keyboard.press('Escape');
  await expect(tray(page)).toHaveCount(0);
  await expect(sheet(page)).toBeVisible(); // the sheet stays
  await expect(goalChip(page, 'move-goal')).toHaveText('目標 600 kcal 以上');
  await goalChip(page, 'move-goal').click();
  await sheet(page).locator('.mc[data-metric=exercise] h3').click(); // elsewhere
  await expect(tray(page)).toHaveCount(0);
  await expect(goalChip(page, 'move-goal')).toHaveText('目標 600 kcal 以上');
});

test('けんこう: the body fat goal, set on its card (3–60 %), dashed on the body fat chart; cleared, no line', async ({ page }) => {
  await page.goto('?demo');
  await toHealth(page);
  await sheet(page).locator('[data-group=body]').click(); // からだ
  const fat = sheet(page).locator('.bc[data-metric=body_fat_pct][data-person=A]');
  await expect(fat.getByRole('heading', { name: '体脂肪率' })).toBeVisible();
  await expect(fat.locator('path.goal')).toHaveCount(0); // no goal yet: no line, none in its words
  await expect(fat.locator('svg[role=img]')).not.toHaveAttribute('aria-label', /目標 \d/);
  // BMI and lean mass have their own (none set in the demo): a chip each, no line
  await expect(goalChip(page, 'bmi-goal')).toHaveText('目標なし');
  await expect(goalChip(page, 'lean_kg-goal')).toHaveText('目標なし');
  await expect(sheet(page).locator('.bc[data-metric=bmi] .k-goal, .bc[data-metric=lean_kg] .k-goal')).toHaveCount(0);
  const chip = goalChip(page, 'body_fat_pct-goal');
  await chip.click();
  const input = tray(page).getByRole('textbox');
  await expect(input).toHaveAttribute('inputmode', 'decimal');
  await input.fill('61');
  await tray(page).getByRole('button', { name: '決定' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(tray(page).locator('.hint')).toHaveText('3〜60%、0.5%単位で入力してください');
  await input.fill('19.5');
  await tray(page).getByRole('button', { name: '決定' }).click();
  await expect(chip).toHaveText('目標 19.5% 以下');
  const saved = sheet(page).getByRole('status');
  await expect(saved).toContainText('体脂肪率の目標を変更しました');
  await saved.getByRole('button', { name: '閉じる' }).click();
  await expect(saved).toHaveCount(0);
  // drawn on the body fat chart as the weight goal is: the dashed line, the key and the chart's words (its own words
  // are the chip's, never in the plot: health plan C3)
  await expect(fat.locator('path.goal')).toHaveCount(1);
  await expect(fat.locator('svg[role=img]')).toHaveAttribute('aria-label', /目標 19\.5/);
  await expect(fat.locator('.key .k-goal')).toHaveCount(1);
  // cleared: no line
  await chip.click();
  await tray(page).getByRole('button', { name: '目標を外す' }).click();
  await expect(chip).toHaveText('目標なし');
  const cleared = sheet(page).getByRole('status');
  await expect(cleared).toContainText('目標を外しました');
  await cleared.getByRole('button', { name: '閉じる' }).click();
  await expect(cleared).toHaveCount(0);
  await expect(fat).toBeVisible();
  await expect(fat.locator('path.goal')).toHaveCount(0);
  await expect(fat.locator('svg[role=img]')).not.toHaveAttribute('aria-label', /目標 19\.5/);
});

test('けんこう: each からだ card wears its own NH item, as かつどう wears its fruit (no scale glyph left)', async ({ page }) => {
  await page.goto('?demo');
  await openPanel(page);
  await toHealth(page);
  await sheet(page).locator('[data-group=body]').click(); // からだ
  const art = { weight: 'analog-kitchen-scale', body_fat_pct: 'protein-shaker-bottle', bmi: 'exercise-bike', lean_kg: 'weight-bench' };
  for (const [metric, item] of Object.entries(art)) {
    const img = sheet(page).locator(`[data-metric=${metric}][data-person=A] header .ic img`);
    await expect(img, metric).toHaveCount(1);
    await expect(img, metric).toHaveAttribute('src', new RegExp(`finds/items/${item}\\.webp`));
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0), { message: metric }).toBe(true);
    expect((await sheet(page).locator(`[data-metric=${metric}][data-person=A] header .ic`).boundingBox())!.height, metric).toBeCloseTo(24, 0);
  }
  await expect(sheet(page).locator('use[href="#i-scale"]')).toHaveCount(0);
});

test('tree popup: the four goals (steps first), today’s amount / the goal with ✓ once met (a がんばり chip at 1.5×, no numbers on the rows), the day\'s ledger and today’s ふたりで ぜんぶ', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-30T12:10:00+09:00') });
  await page.clock.resume();
  await page.goto('?demo');
  await islandReady(page);
  await page.locator('button.canopy').nth(0).click();
  const pop = page.locator('.detail');
  await expect(pop.locator('.plate')).toHaveText('ウェイ');
  // it opens in screen space: wholly in view under the HUD row (measured once its pop-in has finished)
  await pop.evaluate((e) => Promise.all(e.getAnimations().map((a) => a.finished)));
  await page.waitForTimeout(300);
  const [p, r] = await Promise.all([pop, page.locator('.hud-row')].map((l) => l.boundingBox()));
  expect(p!.y).toBeGreaterThan(r!.y + r!.height);
  expect(p!.y + p!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  const rows = pop.locator('.row[data-row]'); // the goal rows (the meals row is .row.meals)
  await expect(rows).toHaveCount(4);
  await expect(rows.locator('.lbl')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド']); // steps first, then Apple's ring order
  const units = [/歩$/, /kcal$/, /分$/, /分$/];
  for (let i = 0; i < 4; i++) {
    const row = rows.nth(i);
    // today's amount against the goal, met or not; ✓ before it once met
    await expect(row.locator('.amt')).toHaveText(new RegExp(`^[\\d,]+ / [\\d,]+ ?${units[i].source}`));
    await expect(row.locator('.ck svg.ok')).toHaveCount(await row.locator('.amt.met').count());
    // no ベル on a row; a chip only at 1.5× (e2e/stretch.spec.ts has the rule's edges and the cap)
    await expect(row.locator('b')).toHaveCount(0);
    await expect(row.locator('.chip')).toHaveCount(await row.getAttribute('data-stretched') ? 1 : 0);
  }
  // the ledger: goals, this person's total (がんばり only when reached)
  await expect(pop.locator('.sum [data-v=goals]')).toHaveText(/^\+[0-4]$/);
  await expect(pop.locator('.sum .k.tot')).toHaveText('ウェイの きょう');
  await expect(pop.locator('.sum [data-v=total]')).toHaveText(/^\+?\d\sベル$/);
  await expect(pop.locator('.duo')).toHaveText(/^\s*ふたりで ぜんぶ まで：あと [1-8]つ$|^\s*ふたりで ぜんぶ！\s*\+2\s*ふたりに$/);
  // its last line: when this person's data last arrived (one home: the tree popup)
  await expect(pop.locator('.sync')).toHaveText(/^\d{2}:\d{2} に とどいた$|^きのう \d{2}:\d{2}$|^\d+\/\d+$|^まだ とどいていません$/);
  // each tree's four fruits (in the canopy, or fallen once met: e2e/trees.spec.ts)
  await expect(page.locator('.if-scene [data-fruit]')).toHaveCount(8);
});

test('partner: a tap is a high-five in place, no card: a sparkle flies between them, both hop, hearts; never a sheet event', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a transient pose or effect (a squish, a sparkle) over before a software-GL frame shows it' } }, async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  const vil = page.locator('.if-scene button.vil').nth(1);
  await expect(vil).toBeEnabled(); // after the opening beats
  await expect(vil).toHaveAttribute('aria-label', 'うめと ハイタッチ');
  const sent = () => page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'highfive').length);
  const before = await sent();
  // each villager's feet: its world node's transform (a hop moves only what's inside)
  const feet = () => Promise.all(['mine', 'partner'].map((id) => page.locator(`[data-actor="${id}"]`).evaluate((el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return [Math.round(m.m41), Math.round(m.m42)];
  })));
  const home = await feet();
  // (each effect watched for from before the tap: they're transient, over before a loaded runner's look)
  const came = await watchComings(page, {
    zap: '[data-zap]', sparklesMine: '[data-actor="mine"] .fx.sparkles', sparklesPartner: '[data-actor="partner"] .fx.sparkles',
    hearts: '[data-actor="partner"] .fx.hearts', walking: '[data-actor="mine"].walking'
  });
  await vil.click();
  await vil.click(); // a second tap while it's under way adds nothing
  await expect(page.locator('dialog[open]')).toHaveCount(0); // no card
  // a sparkle flies from mine to them; both hop face to face with the sparkles, hearts on them, and it's sent
  for (const k of ['zap', 'sparklesMine', 'sparklesPartner', 'hearts']) await expect.poll(() => came(k), { message: k }).toBeGreaterThan(0);
  await expect(page.getByText('うめさんに ハイタッチ！')).toBeVisible();
  expect(await came('zap'), 'one high-five: the second tap added nothing').toBe(1);
  expect(await came('walking'), 'nobody walked').toBe(0);
  expect(await feet()).toEqual(home); // nobody walked
  // over the relay only (here the demo's tabs): nothing for the sheet
  await page.waitForTimeout(600);
  expect(await sent()).toBe(before);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('けんこう: the Move goal, a numeric field ≥ 16px, 100–2,000 kcal, from today on; either person’s', async ({ page }) => {
  await page.goto('?demo');
  await toHealth(page);
  const chip = goalChip(page, 'move-goal');
  await expect(chip).toHaveText('目標 600 kcal 以上');
  await chip.click();
  await expect(tray(page)).toContainText('ムーブの目標（1日）');
  await expect(tray(page)).toContainText('今日から');
  const input = tray(page).getByRole('textbox');
  await expect(input).toHaveValue('600');
  await expect(input).toHaveAttribute('inputmode', 'numeric');
  expect(await input.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
  await input.fill('50');
  await tray(page).getByRole('button', { name: '決定' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.fill('2000');
  await tray(page).getByRole('button', { name: '決定' }).click();
  await expect(page.getByText('ムーブの目標を変更しました')).toBeVisible();
  await expect(chip).toHaveText('目標 2,000 kcal 以上');
  // today's tree popup reads the new goal: no day reaches 2,000 kcal, so no ✓
  await page.keyboard.press('Escape');
  await page.locator('button.canopy').nth(0).click();
  await expect(page.locator('.detail .row[data-row=pear] .amt')).toHaveText(/^[\d,]+ \/ 2,000 kcal$/);
  await expect(page.locator('.detail .row[data-row=pear] svg.ok')).toHaveCount(0);
  // the partner's goal: the popup's person dropdown switches the cards, and the chip sets the partner's
  await page.keyboard.press('Escape');
  await toHealth(page);
  const whoSel = sheet(page).locator('select[data-pick=who]');
  await whoSel.selectOption({ index: 1 });
  await expect(sheet(page).locator('.mc[data-metric=move]')).toHaveAttribute('data-person', 'B');
  await chip.click();
  await tray(page).getByRole('button', { name: '増やす' }).click(); // +10 from うめ's 450
  await expect(tray(page).getByRole('textbox')).toHaveValue('460');
  await tray(page).getByRole('textbox').fill('520');
  await tray(page).getByRole('button', { name: '決定' }).click();
  await expect(chip).toHaveText('目標 520 kcal 以上');
  await whoSel.selectOption({ index: 0 });
  await expect(chip).toHaveText('目標 2,000 kcal 以上');
});

test('けんこう: the steps goal, 8,000 for both by default, 1,000–30,000 by 500, from today on; either person’s; the tree and the chart follow it', async ({ page }) => {
  await page.goto('?demo');
  await toHealth(page);
  const chip = goalChip(page, 'steps-goal');
  await expect(chip).toHaveText('目標 8,000歩 以上');
  await chip.click();
  const input = tray(page).getByRole('textbox');
  await expect(input).toHaveAttribute('inputmode', 'numeric');
  expect(await input.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
  await expect(tray(page).locator('.hint')).toHaveText('1,000〜30,000歩、500歩単位で入力してください');
  for (const bad of ['500', '8250', '30500']) {
    await input.fill(bad);
    await tray(page).getByRole('button', { name: '決定' }).click();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
  }
  // ＋ from what the field holds, onto the 500s: 8,250 → 8,500
  await tray(page).getByRole('button', { name: '増やす' }).click();
  await expect(input).toHaveValue('8,500');
  await expect(input).toHaveAttribute('aria-invalid', 'false');
  await input.fill('30,000');
  await tray(page).getByRole('button', { name: '決定' }).click();
  await expect(page.getByText('歩数の目標を変更しました')).toBeVisible();
  await expect(chip).toHaveText('目標 30,000歩 以上');
  // today's tree popup and けんこう read the new goal: no demo day reaches 30,000 steps
  await page.keyboard.press('Escape');
  await page.locator('button.canopy').nth(0).click();
  await expect(page.locator('.detail .row[data-row=apple] .amt')).toHaveText(/^[\d,]+ \/ 30,000歩$/);
  await expect(page.locator('.detail .row[data-row=apple] svg.ok')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await toHealth(page);
  await expect(chip).toHaveText('目標 30,000歩 以上');
  // the partner's: the person dropdown, the chip sets theirs; mine stays
  const whoSel = sheet(page).locator('select[data-pick=who]');
  await whoSel.selectOption({ index: 1 });
  await expect(chip).toHaveText('目標 8,000歩 以上');
  await chip.click();
  await tray(page).getByRole('textbox').fill('6500');
  await tray(page).getByRole('button', { name: '決定' }).click();
  await expect(chip).toHaveText('目標 6,500歩 以上');
  await whoSel.selectOption({ index: 0 });
  await expect(chip).toHaveText('目標 30,000歩 以上');
});

/** A tap on goal tree `i` where nothing covers it: its canopy, else its trunk (both toggle its popup); where an open
 *  popup stands over the whole tree (the other tree's, at some cameras), its button by the keyboard, as a tap can't. */
async function tapTree(page: Page, i: number) {
  // (the camera at rest first: it eases up the island to make room for a popup, moving the trees under the finger)
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d?: { camStill(): boolean } }).__world3d?.camStill() ?? true)).toBe(true);
  const pt = await page.evaluate((i) => {
    const canopy = document.querySelectorAll('button.canopy')[i];
    for (const el of [canopy, canopy?.parentElement?.querySelector('.trunk-btn')]) {
      const r = el?.getBoundingClientRect();
      if (!el || !r) continue;
      for (let fy = 0.1; fy < 1; fy += 0.1)
        for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
          const x = r.left + r.width * fx, y = r.top + r.height * fy;
          if (el.contains(document.elementFromPoint(x, y))) return [x, y] as const;
        }
    }
    return null;
  }, i);
  if (pt) await page.mouse.click(pt[0], pt[1]);
  else await page.locator('button.canopy').nth(i).press('Enter');
}

test('tree popups: one at a time, they stay open, and a tap on the tree, the other tree or elsewhere toggles them', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandReady(page);
  await quiet(page); // (the greeting's balloon and the day's beats over)
  const canopies = page.locator('button.canopy');
  const popups = page.locator('.detail');
  await tapTree(page, 0);
  await expect(popups).toHaveCount(1);
  await expect(canopies.nth(0)).toHaveAttribute('aria-expanded', 'true');
  await page.waitForTimeout(3200); // no auto-close: it stays past 3 s
  await expect(popups).toHaveCount(1);
  await tapTree(page, 1); // the other tree: it moves there
  await expect(popups).toHaveCount(1);
  await expect(canopies.nth(0)).toHaveAttribute('aria-expanded', 'false');
  await expect(canopies.nth(1)).toHaveAttribute('aria-expanded', 'true');
  // the same tree: it closes (where the popup leaves it uncovered)
  await tapTree(page, 1);
  await expect(popups).toHaveCount(0);
  await tapTree(page, 0);
  // elsewhere, open ground on screen (the page's, near the middle): it closes
  const g = await page.evaluate(() => (window as unknown as { __world3d: { ground(x: number, y: number): { x: number; z: number } } }).__world3d.ground(205, 300));
  const lawn = await lawnTap(page, g.x, g.z);
  await page.mouse.click(lawn.x, lawn.y);
  await expect(popups).toHaveCount(0);
  await tapTree(page, 0);
  await page.keyboard.press('Escape');
  await expect(popups).toHaveCount(0);
});

test('a tap on an open tree popup closes it and reaches nothing under it (the other tree)', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  await page.locator('button.canopy').first().click();
  const popup = page.locator('.detail');
  await expect(popup).toHaveCount(1);
  // where it stands once the camera has eased up the island to make room for it (a short screen)
  await page.waitForTimeout(1000);
  const box = (await popup.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(popup).toHaveCount(0);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('navigation: every sheet and level has a visible ✕ (top-right) or ‹ (top-left) that works; no grabber', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  await expect(page.locator('.if-scene button.vil').nth(1)).toBeEnabled();
  const box = async (sel: ReturnType<Page['locator']>) => (await sel.boundingBox())!;
  const vw = page.viewportSize()!.width;
  // the panel: ✕ at its top level, ‹ + ✕ one level in (a day), ‹ goes back
  await openPanel(page);
  const bar = sheet(page).locator('.titlebar');
  const wallet = sheet(page).locator('[data-wallet]');
  await expect(bar.locator('.close')).toBeVisible();
  await expect(bar.locator('.back')).toHaveCount(0);
  // せってい (the HUD menu's): ✕ at its top, ‹ + ✕ in すがた
  await openSettings(page);
  await expect(bar.locator('.close')).toBeVisible();
  await expect(bar.locator('.back')).toHaveCount(0);
  await sheet(page).locator('[data-push=look]').click();
  await expect(bar.locator('.back')).toBeVisible();
  expect((await box(bar.locator('.back'))).width).toBeGreaterThanOrEqual(44);
  await bar.locator('.back').click();
  await expect(sheet(page).locator('[data-push=look]')).toBeVisible();
  // the ledger: a day, then ‹ back to the wallet, where it was scrolled to
  await toPanel(page);
  await sheet(page).locator('button.dbtn').first().scrollIntoViewIfNeeded();
  const y = await sheet(page).locator('.panel-body').evaluate((el) => el.scrollTop);
  await sheet(page).locator('button.dbtn').first().click();
  await expect(wallet).toBeHidden(); // a level in: only that screen
  await expect(sheet(page).locator('.pc')).toHaveCount(2);
  await bar.locator('.back').click();
  await expect(wallet).toBeVisible();
  await expect(bar.locator('.back')).toHaveCount(0);
  await expect.poll(() => sheet(page).locator('.panel-body').evaluate((el) => el.scrollTop)).toBeCloseTo(y, -1);
  // the buy confirm over the panel has ✕, which closes only the confirm
  await sheet(page).locator('.panel-body').evaluate((el) => el.scrollTo({ top: 0 }));
  await sheet(page).locator('.shop button.item:not([aria-disabled="true"])').first().click();
  await expect(page.locator('dialog[open]')).toHaveCount(2);
  const close = page.locator('dialog[open]').last().locator('.navbar .close');
  await expect(close).toBeVisible();
  const c = await box(close);
  expect(c.width).toBeGreaterThanOrEqual(44);
  expect(c.x + c.width).toBeGreaterThan(vw - 40);
  await close.click();
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await expect(wallet).toBeVisible();
  await bar.locator('.close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // the health popup: ✕ top-right, no ‹, no tabs
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  await expect(page.locator('dialog.pop[open]')).toHaveCount(1);
  await settled(page);
  const hclose = sheet(page).locator('.titlebar .close');
  await expect(hclose).toBeVisible();
  await expect(sheet(page).locator('.titlebar .back')).toHaveCount(0);
  await expect(sheet(page).locator('[data-kenkou-tab]')).toHaveText(['健康', 'ごはん']); // its two tabs at the foot
  const h = await box(hclose);
  expect(h.width).toBeGreaterThanOrEqual(44);
  expect(h.x + h.width).toBeGreaterThan(vw - 40);
  await hclose.click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('.if-scene')).toBeVisible();
});

test('サウンド: all off by default; toggles persist on this phone; ミュージック: the opening, then the hour', async ({ page }) => {
  const errors: string[] = [];
  // (WebKit reports a fetch the reload cut off, caught by the app, as a page error: "Fetch API cannot load … due to access control checks")
  page.on('pageerror', (e) => /Fetch API cannot load .* due to access control checks/.test(String(e)) || errors.push(String(e)));
  const audio: string[] = [];
  page.on('request', (r) => r.url().includes('/audio/') && audio.push(new URL(r.url()).pathname));
  await page.goto('?demo');
  await openSettings(page);
  const row = (name: string) => sheet(page).getByRole('switch', { name: new RegExp(`^${name}`) });
  for (const n of ['ミュージック', '効果音']) await expect(row(n)).toHaveAttribute('aria-checked', 'false');
  await expect(row('おしゃべり')).toHaveCount(0); // the villagers don't speak: no voice setting
  expect(audio).toEqual([]); // nothing is fetched while everything is off
  await row('効果音').click();
  await expect(row('効果音')).toHaveAttribute('aria-checked', 'true');
  await row('ミュージック').click();
  await expect(row('ミュージック')).toHaveAttribute('aria-checked', 'true');
  // the opening theme plays while the panel is up (NH's title screen); closing the panel hands over to the hour
  await expect.poll(() => audio).toContain(`${BASE}/audio/music/opening.m4a`);
  await sheet(page).getByRole('slider', { name: '音量' }).fill('4');
  await sheet(page).locator('.titlebar .close').click();
  // the hour's track: its weather's (hour, rain or snow: the real Tokyo sky) or, on an event day, the event's (events.ts)
  await expect.poll(() => audio.some((p) => /\/audio\/music\/((?:hour|rain|snow)-\d\d|halloween|turkey-day|happy-new-year|new-year-0am|new-year-2am|new-years-day)\.m4a$/.test(p))).toBe(true);
  await page.reload();
  await openSettings(page);
  await expect(row('効果音')).toHaveAttribute('aria-checked', 'true');
  await expect(row('ミュージック')).toHaveAttribute('aria-checked', 'true');
  await expect(sheet(page).getByRole('slider', { name: '音量' })).toHaveValue('4');
  expect(errors).toEqual([]);
});

test('focus ring: none on せってい’s かえる after tap → ‹ back; the keyboard still shows it', async ({ page, browserName }) => {
  await page.goto('?demo');
  await fromMenu(page, 'settings', 'tap');
  const tile = sheet(page).locator('[data-push=look]');
  await tile.tap();
  await sheet(page).locator('.titlebar .back').tap();
  await expect(tile).toBeFocused();
  // WebKit shows :focus-visible on a programmatic focus after a touch; the pointer modality hides it (ui/modality.ts)
  await expect(page.locator('html')).toHaveAttribute('data-input', 'pointer');
  const ring = () => tile.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(await ring()).toBe('none');
  // keyboard: Tab onto the next control and back: the ring shows (⌥Tab in Safari: a plain Tab skips buttons unless
  // "Press Tab to highlight each item" is on)
  const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  await page.keyboard.press(tab);
  await page.keyboard.press(`Shift+${tab}`);
  await expect(tile).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-input', 'keyboard');
  expect(await ring()).not.toBe('none');
});

test('むらびと: すがた → the むらびと tab → とくべつ (たぬきち, しずえ…) first, then むらびと; wearing しずえ makes たぬきち the host', async ({ page }) => {
  await page.goto('?demo');
  await openSettings(page);
  await sheet(page).locator('[data-push=look]').click();
  await sheet(page).locator('[data-look-tab=villager]').click();
  const dlg = sheet(page);
  await expect(dlg.locator('.grp')).toHaveText(['特別', '住民']);
  await expect(dlg.getByRole('radio').first()).toHaveAccessibleName('たぬきち');
  await dlg.getByRole('searchbox').fill('とたけけ');
  await expect(dlg.locator('.grp')).toHaveText(['特別']);
  await expect(dlg.getByRole('radio')).toHaveCount(1);
  await dlg.getByRole('searchbox').fill('しずえ');
  await dlg.getByRole('radio', { name: 'しずえ' }).click();
  await expect(dlg.locator('[data-look-status]')).toHaveText('住民 · しずえ');
  await dlg.locator('.titlebar .back').click(); // kept as the level is left
  await page.goto('?demo=harvest');
  await expect(page.locator('.bubble .who').first()).toHaveText('たぬきち');
});

test('404 at 320: the page fits the screen (ja breaks only at its spaces) and no harvest covers it', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('nope?demo=harvest');
  await expect(page.getByRole('heading', { name: /このページは見つかりませんでした/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.locator('.overlay')).toHaveCount(0);
});

test('with the undo banner up, a sheet’s footer (買う！) rises above it: a tap on 買う！ reaches 買う！', async ({ page }) => {
  await page.goto('jar?demo');
  await page.locator('.shop button.item:not([aria-disabled="true"])').first().click();
  await sheet(page).getByRole('button', { name: '買う！' }).click();
  await expect(page.getByRole('button', { name: '取り消す' })).toBeVisible();
  await page.locator('.shop button.item:not([aria-disabled="true"])').first().click();
  const buy = sheet(page).getByRole('button', { name: '買う！' });
  await expect(buy).toBeVisible();
  await sheet(page).evaluate((d) => Promise.all(d.getAnimations({ subtree: true }).map((a) => a.finished)));
  const hit = await buy.evaluate((b) => { const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!top && b.contains(top); });
  expect(hit).toBe(true);
});

test('the panel opens at the wallet\'s top every time, whichever level it closed on', async ({ page }) => {
  await page.goto('?demo');
  await openSettings(page);
  await expect(sheet(page).locator('#sec-sound')).toBeVisible();
  await sheet(page).locator('.titlebar .close').click();
  await openPanel(page);
  await expect(sheet(page).locator('[data-wallet]')).toBeVisible();
  await sheet(page).locator('button.dbtn').first().click();
  await expect(sheet(page).locator('.pc')).toHaveCount(2);
  await sheet(page).locator('.titlebar .close').click();
  await openPanel(page);
  await expect(sheet(page).locator('[data-wallet]')).toBeVisible();
  await expect(sheet(page).locator('.titlebar .back')).toHaveCount(0);
  expect(await sheet(page).locator('.panel-body').evaluate((el) => el.scrollTop)).toBe(0);
  await page.reload();
  await openPanel(page);
});

test('the old /jar link lands on the island with the panel open on ごほうび (the query kept, the link’s own param dropped)', async ({ page }) => {
  await page.goto('jar?demo');
  await expect(sheet(page).locator('[data-wallet]')).toBeVisible();
  await expect(sheet(page).locator('.shop')).toBeVisible();
  await expect(page).toHaveURL(islandURL('demo$')); // no ?panel left for a reload to reopen
  await sheet(page).locator('.titlebar .close').click();
  await openPanel(page); // then the menu's ベル row opens it as ever
});

test('the ベル ledger: no 「これまでに ためた ベル」 row: the weeks come first, under 「ためた ベル」', async ({ page }) => {
  await page.goto('?demo');
  await openLedger(page);
  await expect(sheet(page).locator('[data-ledger] h2')).toHaveText('貯めたベル');
  await expect(sheet(page).getByText('これまでに ためた ベル')).toHaveCount(0);
  await expect(sheet(page).locator('[data-ledger] .card.earned')).toHaveCount(0);
});

test('the ベル ledger opens light: the newest three weeks of ベル; 「まえの週も 見る」 adds older ones', async ({ page }) => {
  await page.goto('?demo');
  await openLedger(page);
  const weeks = sheet(page).locator('section.week');
  await expect(weeks).toHaveCount(3);
  // earnings only: the demo buys most weeks, and none of it shows here (the buys live on ごほうび)
  await expect(weeks.first()).not.toContainText(/おやつ|外食|取り消す/);
  await sheet(page).getByRole('button', { name: '前の週も見る' }).first().click();
  await expect.poll(() => weeks.count()).toBeGreaterThan(3);
});

test('the panel: titled ごほうび, no tabs, and it reaches the screen’s bottom', async ({ page }) => {
  await page.goto('?demo');
  await openPanel(page);
  await expect(sheet(page).locator('.navbar h2')).toHaveText('ごほうび');
  await expect(sheet(page).getByText('しまの てちょう')).toHaveCount(0);
  await settled(page); // its slide down
  const gap = await sheet(page).evaluate((d) => innerHeight - d.getBoundingClientRect().bottom);
  expect(Math.abs(gap)).toBeLessThanOrEqual(1);
});

/** The ベル row's number as written (the digits, grouped). */
const bellsText = (n: number) => n.toLocaleString('en-US');

// (one width and hour a test: the six in one averaged 22 s alone and ran out of its 30 s on loaded CI shards, 10 runs in
// a day)
const HUD_NOTCH = () => document.addEventListener('DOMContentLoaded', () => {
  const s = document.createElement('style');
  s.textContent = 'html:root { --safe-top: 59px !important; }';
  document.head.append(s);
});
// (the narrowest at noon and at night, the night's sky behind it; the wider two at noon)
for (const [w, h, at] of [[393, 852, '2026-10-28T12:00'], [402, 874, '2026-10-28T12:00'], [320, 568, '2026-10-28T12:00'], [320, 568, '2026-10-28T22:00']] as const)
test(`the HUD row at ${w}, ${at.slice(11)}: [the dumbbell] [the menu] in the top-right corner, the leaf at the screen's side, no jar, the sky's left clear, every target ≥ 44px, under a notch${at.endsWith('22:00') ? '; its taps stay apart: the ベル row opens the panel (ごほうび; no せってい there: the menu\'s), the dumbbell the health popup' : ''}`, async ({ page }) => {
  // an iPhone 15/16's top inset (59px): the row stays where it was, under it
  await page.addInitScript(HUD_NOTCH);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`?demo&date=${at}`);
  await islandReady(page);
  await expect(page.locator('.ribbon, .hud-jar')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^きょう / })).toHaveCount(0);
  const btn = page.getByRole('button', { name: 'けんこう', exact: true });
  await expect(page.locator('.hud-food')).toHaveCount(0); // ごはん: the dumbbell's sheet's tab
  const [mb, bb] = [(await hudMenu(page).boundingBox())!, (await btn.boundingBox())!];
  for (const b of [mb, bb]) {
    expect(b.height).toBeGreaterThanOrEqual(44);
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.y).toBeGreaterThanOrEqual(59);
    expect(Math.abs(b.y - mb.y)).toBeLessThan(1); // one row
  }
  // one cluster, right-aligned: the dumbbell, the menu, in that order, 6px apart, the leaf 14px in
  expect(Math.abs(mb.x - bb.x - bb.width - 6)).toBeLessThan(1.5);
  expect(Math.abs(w - mb.x - mb.width - 14)).toBeLessThan(1.5);
  // the sky's left clear (the sun, the moon, the balloon: a third of it from 393 up), and the menu's pills folded away
  expect(bb.x).toBeGreaterThan(w >= 393 ? w / 3 : w / 6);
  await expect(page.locator('[data-hud-bells], [data-hud-settings]')).toHaveCount(2);
  for (const pill of await page.locator('[data-hud-bells], [data-hud-settings]').all()) await expect(pill).toBeHidden();
  // NH's dumbbell, a little taller than the pill; no number, no ▶ dot
  const img = btn.locator('img');
  await expect(img).toHaveAttribute('src', /items\/dumbbell\.webp/);
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  expect((await btn.locator('.art').boundingBox())!.y).toBeLessThan(bb.y);
  await expect(btn).toHaveText('');
  await expect(btn.locator('svg')).toHaveCount(0);
  // unfolded, the pills hang under the leaf, right-aligned to it, on screen: 「ベル 121」 first
  await unfoldMenu(page); // (the spring settled: a fixed 600 ms wasn't, on a busy machine)
  const pills = page.locator('#hud-menu-items > button');
  for (const p of await pills.all()) {
    const b = (await p.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(Math.abs(b.x + b.width - (mb.x + mb.width))).toBeLessThan(1.5);
    expect(b.y).toBeGreaterThan(mb.y + mb.height);
  }
  await page.keyboard.press('Escape');
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'false');
  if (!at.endsWith('22:00')) return;
  // its taps stay apart: the ベル row opens the panel (ごほうび: no tabs, no ずかん), the dumbbell the health popup
  await expect(hudBells(page)).toHaveAttribute('aria-expanded', 'false');
  await openRewards(page);
  await expect(sheet(page).locator('.shop')).toBeVisible();
  await expect(hudBells(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(sheet(page).locator('[data-tab], [data-zukan]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await btn.click();
  await expect(sheet(page).locator('[data-health-sheet] .health')).toBeVisible();
  await expect(sheet(page).locator('[data-kenkou-tab=health]')).toHaveAttribute('aria-current', 'page');
});

test('the menu\'s 「ベル」 row shows ごほうび\'s balance, follows a buy and its とりけす, and the day\'s coins land in the leaf (the number never drops while they fly, today\'s +N flashing under the leaf)', async ({ page }) => {
  // every change of the ベル row's number, each catch squash and each +N flash, from the first paint
  await page.addInitScript(() => {
    const w = window as unknown as { nums: string[]; catches: number; flashes: string[] };
    w.nums = [];
    w.catches = 0;
    w.flashes = [];
    let last: Element | null = null;
    new MutationObserver(() => {
      const n = document.querySelector('[data-hud-bells] .num')?.textContent;
      if (n && n !== w.nums.at(-1)) w.nums.push(n);
      if (document.querySelector('.hud-menu .leaf.catch')) w.catches++;
      const f = document.querySelector('.hud-menu [data-bells-flash]');
      if (f && f !== last) w.flashes.push(f.textContent ?? '');
      last = f;
    }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
  });
  await page.goto('?demo&date=2026-10-28T22:00'); // three goals met by then
  await islandReady(page);
  const row = hudBells(page);
  // a fresh phone has seen none of today's goals: their coins fly from the fruit into the leaf
  await expect.poll(() => page.evaluate(() => (window as unknown as { catches: number }).catches), { timeout: 8000 }).toBeGreaterThan(0);
  await expect(page.locator('[data-coin-flow]')).toHaveCount(0, { timeout: 8000 });
  const bells = Number(await row.getAttribute('data-bells'));
  await expect(row.locator('.num')).toHaveText(bellsText(bells));
  const nums = await page.evaluate(() => (window as unknown as { nums: string[] }).nums.map((n) => Number(n.replace(/,/g, ''))));
  for (let i = 1; i < nums.length; i++) expect(nums[i]).toBeGreaterThanOrEqual(nums[i - 1]);
  // today's +N popped under the leaf as they landed, the last the day's total (the label says it too), then went
  const today = Number(await row.getAttribute('data-today'));
  expect(today).toBeGreaterThan(0);
  const flashes = () => page.evaluate(() => (window as unknown as { flashes: string[] }).flashes);
  await expect.poll(async () => (await flashes()).at(-1)).toBe(`+${today}`);
  await expect(page.locator('[data-bells-flash]')).toHaveCount(0, { timeout: 4000 });
  await expect(row).toHaveAttribute('aria-label', new RegExp(`^ごほうび · 二人のベル ${bells.toLocaleString('en-US')}\\sベル · 今日 ${today}\\sベル$`));
  // unfolded: 「ベル 121」, no icon, the same number as ごほうび's
  await hudMenu(page).click();
  await expect(row).toBeVisible();
  await expect(row).toHaveText(new RegExp(`^\\s*ベル\\s*${bellsText(bells)}\\s*$`));
  await expect(row.locator('img, svg, .ic')).toHaveCount(0);
  await row.click();
  const total = sheet(page).locator('.hero .total');
  await expect.poll(async () => Number((await total.innerText()).replace(/\D/g, ''))).toBe(bells);
  await expect(sheet(page).locator('.hero .today')).toHaveText(new RegExp(`^\\s*今日のベル\\s*\\+${today}\\s*ベル\\s*$`));
  // a buy takes its price out at once; とりけす puts it back (a refund, not earnings: no flash)
  const n = (await flashes()).length;
  await page.locator('.shop button[data-item="snack"]').click();
  await sheet(page).getByRole('button', { name: '買う！' }).click();
  await expect(row.locator('.num')).toHaveText(bellsText(bells - 40));
  await expect(sheet(page).locator('.hero .today')).toHaveAttribute('data-today', String(today)); // a buy isn't today's
  await page.getByRole('button', { name: '取り消す' }).click();
  await expect(row.locator('.num')).toHaveText(bellsText(bells));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800); // (proving nothing flashes: the count-up is 600 ms)
  expect(await flashes()).toHaveLength(n);
});

test('ごほうび: today’s ベル in a yuzu pill under the balance (both of us, ふたりでぜんぶ in), a faint cream 「きょうの ベル 0」 before the first', async ({ page }) => {
  await page.goto('?demo&date=2026-10-28T22:00');
  await islandReady(page);
  const row = hudBells(page);
  const today = Number(await row.getAttribute('data-today'));
  expect(today).toBeGreaterThan(0);
  await openPanel(page);
  const pill = sheet(page).locator('[data-wallet] .hero .today');
  await expect(pill).toHaveText(new RegExp(`^\\s*今日のベル\\s*\\+${today}\\s*ベル\\s*$`));
  await expect(pill).not.toHaveClass(/none/);
  await expect(pill.locator('.bag')).toHaveCount(1); // the tiny ベル bag
  // under the balance, smaller than it
  const [tb, pb] = [(await sheet(page).locator('.hero .total').boundingBox())!, (await pill.boundingBox())!];
  expect(pb.y).toBeGreaterThanOrEqual(tb.y + tb.height - 1);
  expect(pb.height).toBeLessThan(tb.height + 8);
  // just after midnight nothing's earned yet: the faint pill
  await page.goto('?demo&date=2026-10-28T00:05');
  await islandReady(page);
  await expect(row).toHaveAttribute('data-today', '0');
  await expect(row).toHaveAttribute('aria-label', / · 今日 0\sベル$/);
  await openPanel(page);
  await expect(pill).toHaveText(/^\s*今日のベル\s*0\s*ベル\s*$/);
  await expect(pill).toHaveClass(/none/);
});

test('the dumbbell opens the health popup at once: no zoom, slide or fade, no View Transition', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  await page.evaluate(() => {
    const w = window as unknown as { vts: number };
    w.vts = 0;
    const real = document.startViewTransition?.bind(document);
    if (real) document.startViewTransition = ((cb?: ViewTransitionUpdateCallback) => (w.vts++, real(cb))) as typeof document.startViewTransition;
  });
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  const dlg = page.locator('dialog.pop[open]');
  await expect(dlg).toHaveCount(1);
  // nothing in it moving as it shows (its content's slide-ins finished by the opening too)
  expect(await dlg.evaluate((d) => d.getAnimations({ subtree: true }).filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getTiming().iterations ?? 1)).length)).toBe(0);
  expect(await dlg.evaluate((d) => getComputedStyle(d).animationName)).toBe('none');
  expect(await page.evaluate(() => (window as unknown as { vts: number }).vts)).toBe(0);
});
