// Demo smoke test (round 9 acceptance): tap, undo, harvest, きろく edit, on `?demo` (no backend, no key).
import { expect, test, type Page } from '@playwright/test';

const sheet = (page: Page) => page.locator('dialog[open]');

/** The island is up: today's ベル ribbon shows (the app asks no questions, so nothing to answer first). */
async function islandReady(page: Page) {
  await expect(page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
}

/** `きょう 620 ベル` → 620. */
const bellsOf = (label: string | null) => Number((label ?? '').replace(/,/g, '').match(/(\d+)\s*ベル/)![1]);

test('buy: a treat comes back with とりけす', async ({ page }) => {
  await page.goto('jar?demo');
  const pot = page.locator('.treats');
  const balance = async () => (await page.locator('.hero .total').innerText()).replace(/\D/g, '');
  const before = await balance();
  await pot.locator('button.item:not([aria-disabled="true"])').first().click();
  await sheet(page).getByRole('button', { name: '買う！' }).click();
  await expect.poll(balance).not.toBe(before);
  await page.getByRole('button', { name: 'とりけす' }).click();
  await expect.poll(balance).toBe(before);
  // やめる closes the confirm without spending
  await pot.locator('button.item:not([aria-disabled="true"])').first().click();
  await sheet(page).getByRole('button', { name: 'やめる' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect.poll(balance).toBe(before);
});

test('wallet (ADR 0022): one balance (the island plate’s), one list of five treats, no sections, pots or bars', async ({ page }) => {
  await page.goto('?demo');
  const plate = await page.locator('.if-scene .jar .jar-plate').innerText();
  await page.locator('.if-scene .jar').click();
  await expect(page.locator('.jar-screen')).toBeVisible();
  await expect(page.locator('.hero .total')).toContainText(plate.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  // the demo's list: the five defaults (and whatever the demo couple added after them)
  const names = await page.locator('.treats .nm').allInnerTexts();
  expect(names.slice(0, 5)).toEqual(['おやつ', 'カフェ・デザート', '外ごはん', 'ほしいもの', '旅のごほうび']);
  await expect(page.locator('[data-pot], [data-section], .rope')).toHaveCount(0);
});

test('menu: adding a treat to the shared list (ADR 0022)', async ({ page }) => {
  await page.goto('jar?demo');
  const pot = page.locator('.treats');
  await pot.getByRole('button', { name: 'メニューを かえる' }).click();
  await sheet(page).getByRole('button', { name: /ふやす/ }).click();
  await sheet(page).locator('input.lbl').last().fill('たいやき');
  await sheet(page).locator('input.num').last().fill('250');
  await sheet(page).getByRole('button', { name: '保存' }).click();
  await expect(pot.getByRole('button', { name: /^たいやき 250\sベル/ })).toBeVisible();
});

test('harvest: five badges per person, the together bonus, and the bonus lands in the wallet', async ({ page }) => {
  await page.goto('?demo=harvest');
  const tally = page.locator('.overlay .tally');
  await expect(tally.getByText('バッジ', { exact: true })).toBeVisible();
  await expect(tally.locator('.trow:not(.duo) .badges')).toHaveCount(2);
  for (const row of await tally.locator('.trow:not(.duo) .badges').all()) await expect(row.locator('.b')).toHaveCount(5);
  await expect(tally.locator('.duo')).toContainText('ふたりボーナス');
  await page.getByRole('button', { name: '受け取る！' }).click();
  await expect(page.getByText('おさいふに 入りました！')).toBeVisible();
  await page.getByRole('button', { name: '島へもどる' }).click();
  await expect(page.getByRole('button', { name: '受け取る！' })).toHaveCount(0);
});

test('きろく: editing a day’s steps', async ({ page }) => {
  await page.goto('?demo');
  await page.getByRole('button', { name: 'しまフォンを開く' }).click();
  await page.locator('.app[data-app=kiroku]').click();
  await sheet(page).getByRole('button', { name: /^今週/ }).click();
  await sheet(page).getByRole('button', { name: /\(月\)$/ }).click();
  // the day: the five ring fruits, each with its value and ベル
  await expect(sheet(page).locator('.pc').first().locator('.row.fr')).toHaveCount(5);
  await sheet(page).getByRole('button', { name: /^歩数/ }).click();
  const pad = sheet(page);
  await pad.getByRole('button', { name: 'クリア' }).click();
  for (const k of '12345') await pad.getByRole('button', { name: k, exact: true }).click();
  await pad.getByRole('button', { name: 'けってい' }).click();
  await expect(sheet(page).getByText('12,345', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'とりけす' })).toBeVisible();
});

test('きろく: the weight trend, logging a weight and a goal (ADR 0020)', async ({ page }) => {
  await page.goto('?demo');
  const ribbon = page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
  await expect(ribbon).toBeVisible();
  const bells = await ribbon.getAttribute('aria-label');
  await page.getByRole('button', { name: 'しまフォンを開く' }).click();
  await page.locator('.app[data-app=kiroku]').click();
  await expect(sheet(page).getByRole('heading', { name: '体重のながれ' })).toBeVisible();
  await sheet(page).getByRole('button', { name: /の体重のながれ/ }).first().click();
  await expect(sheet(page).getByRole('img', { name: /の体重 12週間/ })).toBeVisible();
  await sheet(page).getByRole('button', { name: '体重を記録' }).click();
  const input = sheet(page).getByRole('textbox');
  await expect(input).toHaveAttribute('inputmode', 'decimal');
  await input.fill('20,0');
  await input.fill('300.5');
  await sheet(page).getByRole('button', { name: 'けってい' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.fill('66,4');
  await sheet(page).getByRole('button', { name: 'けってい' }).click();
  await expect(page.getByText('体重を記録しました')).toBeVisible();
  await expect(sheet(page).locator('.recent tbody tr').first()).toContainText('66.4');
  // the goal is set in きろく's 目標 card (one place for both goals) and drawn on the weight screen
  await sheet(page).locator('.titlebar .back').click();
  await sheet(page).getByRole('button', { name: '体重 ✎' }).click();
  await sheet(page).getByRole('textbox').fill('65');
  await sheet(page).getByRole('button', { name: 'けってい' }).click();
  await expect(sheet(page).locator('.goals')).toContainText('65.0 kg');
  await sheet(page).getByRole('button', { name: /の体重のながれ/ }).first().click();
  await expect(sheet(page).getByText('目標 65.0 kg')).toBeVisible();
  // weight never earns: today's ベル didn't move
  await page.keyboard.press('Escape');
  await expect(ribbon).toHaveAttribute('aria-label', bells!);
});

test('tree popup: the five ring fruits, today against the goal, today’s ベル and the week toward each badge (ADR 0021)', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-30T12:10:00+09:00') });
  await page.clock.resume();
  await page.goto('?demo');
  await islandReady(page);
  await page.locator('button.canopy').nth(0).click();
  const pop = page.locator('.detail');
  await expect(pop.locator('.plate')).toHaveText('ウェイ');
  const rows = pop.locator('.row:not(.hd)');
  await expect(rows).toHaveCount(5);
  await expect(rows.locator('.lbl')).toHaveText(['エクササイズ', 'ムーブ', 'スタンド', '歩数', 'ジム']);
  await expect(rows.nth(0).locator('.amt')).toHaveText(/^[\d,]+\/60分$/);
  await expect(rows.nth(1).locator('.amt')).toHaveText(/^[\d,]+\/[\d,]+kcal$/);
  await expect(rows.nth(2).locator('.amt')).toHaveText(/^[\d,]+\/180分$/);
  await expect(rows.nth(3).locator('.amt')).toHaveText(/^[\d,]+\/8,000歩$/);
  // the week: days met / 5 · 5 · 5 · 4 · 3 (or a ✓ once the badge is met)
  const weeks = await rows.evaluateAll((els) => els.map((e) => (e.querySelector('.wk.badge') ? 'ok' : e.querySelector('.wk')!.textContent!.trim())));
  weeks.forEach((w, i) => expect(w === 'ok' || w.endsWith(`/${[5, 5, 5, 4, 3][i]}`), `${i}: ${w}`).toBe(true));
  // a v1 week has no milestone pips and no nudge
  await expect(pop.locator('.steps i')).toHaveCount(0);
  await expect(pop.locator('.next')).toHaveCount(0);
  // ground fruit: five kinds under each tree
  await expect(page.locator('.fruit.k0')).toHaveCount(10);
});

test('tree popup, v2 milestones (from 11-02): four pips per ring fruit, none for the gym, one 「あと…で +N」 nudge', async ({ page }) => {
  await page.goto('?demo&date=2026-11-03T12:10'); // ?date= moves the demo's calendar too (no pinned clock)
  await islandReady(page);
  await page.locator('button.canopy').nth(0).click();
  const rows = page.locator('.detail .row:not(.hd)');
  await expect(rows.nth(2).locator('.amt')).toHaveText(/^[\d,]+\/120分$/);
  const pips = await rows.evaluateAll((els) => els.map((e) => e.querySelectorAll('.steps i').length));
  expect(pips).toEqual([4, 4, 4, 4, 0]);
  const next = page.locator('.detail .next');
  if (await next.count()) await expect(next).toHaveText(/^あと [\d,]+ ?(分|kcal|歩)で \+[\d,]+$/);
});

test('partner: a villager card (their line, when their data came, ハイタッチ), no numbers', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  await page.waitForTimeout(1500); // the opening beats (villagers are disabled until then)
  await page.locator('.if-scene button.vil').nth(1).click();
  const card = sheet(page);
  await expect(card.getByRole('heading', { name: 'うめ' })).toBeVisible(); // the title bar
  await expect(card.locator('.say')).not.toBeEmpty();
  await expect(card.getByText(/に とどいた|まだ とどいていません/)).toBeVisible();
  await expect(card.getByText(/ベル/)).toHaveCount(0);
  await card.getByRole('button', { name: /ハイタッチ/ }).click();
  await expect(page.getByText('うめさんに ハイタッチ！')).toBeVisible();
});

test('きろく: the Move goal (ADR 0021), mine only, a numeric field ≥ 16px, 100–2,000 kcal, from today on', async ({ page }) => {
  await page.goto('?demo');
  await page.getByRole('button', { name: 'しまフォンを開く' }).click();
  await page.locator('.app[data-app=kiroku]').click();
  const goals = sheet(page).locator('.goals');
  await expect(goals).toContainText('600 kcal');
  await goals.getByRole('button', { name: /^ムーブ（1日） ✎/ }).click();
  const input = sheet(page).getByRole('textbox');
  await expect(input).toHaveAttribute('inputmode', 'numeric');
  expect(await input.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
  await input.fill('50');
  await sheet(page).getByRole('button', { name: 'けってい' }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await input.fill('450');
  await sheet(page).getByRole('button', { name: 'けってい' }).click();
  await expect(page.getByText('ムーブの目標を かえました')).toBeVisible();
  await expect(goals).toContainText('450 kcal');
  // today's tree popup reads the new goal
  await page.keyboard.press('Escape');
  await page.locator('button.canopy').nth(0).click();
  await expect(page.locator('.detail .row:not(.hd)').nth(1).locator('.amt')).toHaveText(/\/450kcal$/);
});

test('tree popups: one at a time, they stay open, and a tap on the tree, the other tree or elsewhere toggles them', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  const canopies = page.locator('button.canopy');
  const popups = page.locator('.detail');
  await canopies.nth(0).click();
  await expect(popups).toHaveCount(1);
  await expect(canopies.nth(0)).toHaveAttribute('aria-expanded', 'true');
  await page.waitForTimeout(3200); // no auto-close (it used to close after 2.6 s)
  await expect(popups).toHaveCount(1);
  await canopies.nth(1).click(); // the other tree: it moves there
  await expect(popups).toHaveCount(1);
  await expect(canopies.nth(0)).toHaveAttribute('aria-expanded', 'false');
  await expect(canopies.nth(1)).toHaveAttribute('aria-expanded', 'true');
  await canopies.nth(1).click(); // the same tree: it closes
  await expect(popups).toHaveCount(0);
  await canopies.nth(0).click();
  await page.mouse.click(20, 300); // the sky: it closes
  await expect(popups).toHaveCount(0);
  await canopies.nth(0).click();
  await page.keyboard.press('Escape');
  await expect(popups).toHaveCount(0);
});

test('navigation: every sheet and app has a visible ✕ (top-right) or ‹ (top-left) that works; no grabber', async ({ page }) => {
  await page.goto('?demo');
  await islandReady(page);
  await page.waitForTimeout(1500);
  const box = async (sel: ReturnType<Page['locator']>) => (await sel.boundingBox())!;
  const vw = page.viewportSize()!.width;
  await expect(page.locator('.grabber')).toHaveCount(0);
  // the partner's card: ✕ top-right
  await page.locator('.if-scene button.vil').nth(1).click();
  let close = sheet(page).locator('.navbar .close');
  await expect(close).toBeVisible();
  let b = await box(close);
  expect(b.width).toBeGreaterThanOrEqual(44);
  expect(b.x + b.width).toBeGreaterThan(vw - 40);
  await close.click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // the phone: ✕ on the home screen, ‹ + ✕ in every app, ‹ goes back a level
  await page.getByRole('button', { name: 'しまフォンを開く' }).click();
  const bar = sheet(page).locator('.titlebar');
  await expect(bar.locator('.close')).toBeVisible();
  await expect(bar.locator('.back')).toHaveCount(0);
  for (const app of ['kiroku', 'help', 'villager', 'lang', 'sync', 'sound']) {
    await page.locator(`.app[data-app=${app}]`).click();
    await expect(bar.locator('.back')).toBeVisible();
    b = await box(bar.locator('.back'));
    expect(b.width).toBeGreaterThanOrEqual(44);
    await bar.locator('.back').click();
    await expect(page.locator(`.app[data-app=${app}]`)).toBeVisible();
  }
  // きろく: week → day, then ‹ ‹ back to the list
  await page.locator('.app[data-app=kiroku]').click();
  await sheet(page).getByRole('button', { name: /^今週/ }).click();
  await sheet(page).getByRole('button', { name: /\(月\)$/ }).click();
  await bar.locator('.back').click();
  await expect(sheet(page).locator('.days')).toBeVisible();
  await bar.locator('.back').click();
  await expect(sheet(page).locator('.pills')).toBeVisible();
  await bar.locator('.close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // the wallet: ‹ 島へ top-left; the buy confirm and the editor have ✕
  await page.locator('.if-scene .jar').click();
  await expect(page.locator('.jar-screen a.back')).toBeVisible();
  await page.locator('.treats button.item:not([aria-disabled="true"])').first().click();
  close = sheet(page).locator('.navbar .close');
  await expect(close).toBeVisible();
  await close.click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.locator('.treats .edit').click();
  await sheet(page).locator('.navbar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.locator('.jar-screen a.back').click();
  await expect(page.locator('.if-scene')).toBeVisible();
});

test('サウンド: all off by default; toggles persist on this phone; ミュージック: the opening, then the hour', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const audio: string[] = [];
  page.on('request', (r) => r.url().includes('/audio/') && audio.push(new URL(r.url()).pathname));
  await page.goto('?demo');
  await page.getByRole('button', { name: 'しまフォンを開く' }).click();
  await sheet(page).getByRole('button', { name: 'サウンド' }).click();
  const row = (name: string) => sheet(page).getByRole('switch', { name: new RegExp(`^${name}`) });
  for (const n of ['ミュージック', '効果音', 'おしゃべり']) await expect(row(n)).toHaveAttribute('aria-checked', 'false');
  expect(audio).toEqual([]); // nothing is fetched while everything is off
  await row('効果音').click();
  await expect(row('効果音')).toHaveAttribute('aria-checked', 'true');
  await row('ミュージック').click();
  await expect(row('ミュージック')).toHaveAttribute('aria-checked', 'true');
  // the opening theme plays while the phone is up (NH's title screen); closing the phone hands over to the hour
  await expect(sheet(page).getByText('いまはオープニングテーマ')).toBeVisible();
  await expect.poll(() => audio).toContain('/fitness/audio/music/opening.m4a');
  await sheet(page).getByRole('slider', { name: '音量' }).fill('4');
  await sheet(page).locator('.titlebar .close').click();
  await expect.poll(() => audio.some((p) => /\/audio\/music\/hour-\d\d\.m4a$/.test(p))).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: 'しまフォンを開く' }).click();
  await sheet(page).getByRole('button', { name: 'サウンド' }).click();
  await expect(row('効果音')).toHaveAttribute('aria-checked', 'true');
  await expect(row('ミュージック')).toHaveAttribute('aria-checked', 'true');
  await expect(row('おしゃべり')).toHaveAttribute('aria-checked', 'false');
  await expect(sheet(page).getByRole('slider', { name: '音量' })).toHaveValue('4');
  expect(errors).toEqual([]);
});

test('focus ring: none on a しまフォン tile after tap → ‹ back; the keyboard still shows it', async ({ page }) => {
  await page.goto('?demo');
  await page.getByRole('button', { name: 'しまフォンを開く' }).tap();
  const tile = sheet(page).locator('.app[data-app=help]');
  await tile.tap();
  await sheet(page).locator('.titlebar .back').tap();
  await expect(tile).toBeFocused();
  // WebKit shows :focus-visible on a programmatic focus after a touch; the pointer modality hides it (ui/modality.ts)
  await expect(page.locator('html')).toHaveAttribute('data-input', 'pointer');
  const ring = () => tile.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(await ring()).toBe('none');
  // keyboard: Tab onto the next tile and back: the ring shows
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(tile).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('data-input', 'keyboard');
  expect(await ring()).not.toBe('none');
});

test('村人: とくべつ (たぬきち, しずえ…) first, then むらびと; picking しずえ makes たぬきち the host', async ({ page }) => {
  await page.goto('?demo');
  await page.getByRole('button', { name: 'しまフォンを開く' }).click();
  await page.locator('.app[data-app=villager]').click();
  const dlg = sheet(page);
  await expect(dlg.locator('.grp')).toHaveText(['とくべつ', 'むらびと']);
  await expect(dlg.getByRole('radio').first()).toHaveAccessibleName('たぬきち');
  await dlg.getByRole('searchbox').fill('とたけけ');
  await expect(dlg.locator('.grp')).toHaveText(['とくべつ']);
  await expect(dlg.getByRole('radio')).toHaveCount(1);
  await dlg.getByRole('searchbox').fill('しずえ');
  await dlg.getByRole('radio', { name: 'しずえ' }).click();
  await expect(dlg.locator('.vk')).toHaveText('とくべつ');
  await page.goto('?demo=harvest');
  await expect(page.locator('.bubble .who').first()).toHaveText('たぬきち');
});
