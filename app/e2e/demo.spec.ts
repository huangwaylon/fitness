// Demo smoke test (round 9 acceptance): tap, undo, harvest, きろく edit, on `?demo` (no backend, no key).
import { expect, test, type Page } from '@playwright/test';

const sheet = (page: Page) => page.locator('dialog[open]');

/** The demo usually opens on しずえ's 「…は筋トレでしたか？」 (one or more): answer them until the check-in shows. */
async function answerPending(page: Page) {
  const checkin = page.locator('.below > .btn');
  const yes = page.getByRole('button', { name: 'はい', exact: true });
  await expect(checkin.or(yes).first()).toBeVisible();
  for (let i = 0; i < 5 && !(await checkin.isVisible()); i++) {
    if (await yes.isVisible()) await yes.click();
    await page.waitForTimeout(300);
  }
  await expect(checkin).toBeVisible();
}

/** `きょう 620 ベル` → 620. */
const bellsOf = (label: string | null) => Number((label ?? '').replace(/,/g, '').match(/(\d+)\s*ベル/)![1]);

test('tap: a check-in adds today’s ベル', async ({ page }) => {
  await page.goto('?demo');
  const ribbon = page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
  await expect(ribbon).toBeVisible();
  await answerPending(page);
  const before = bellsOf(await ribbon.getAttribute('aria-label'));
  await page.locator('.below > .btn').click();
  const switches = sheet(page).getByRole('switch');
  await expect(switches.first()).toBeVisible();
  const i = (await switches.evaluateAll((els) => els.map((e) => e.getAttribute('aria-checked')))).indexOf('false');
  expect(i).toBeGreaterThanOrEqual(0);
  const habit = switches.nth(i);
  await habit.click();
  await expect(habit).toHaveAttribute('aria-checked', 'true');
  await sheet(page).getByRole('button', { name: '保存' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(async () => {
    expect(bellsOf(await ribbon.getAttribute('aria-label'))).toBe(before + 100);
  }).toPass();
  // the coins land in the jar: its plate counts up to the pots' new total
  const jar = page.locator('.if-scene .jar');
  await expect(async () => {
    expect(bellsOf(await jar.locator('.jar-plate').innerText())).toBe(bellsOf(await jar.getAttribute('aria-label')));
  }).toPass({ timeout: 8000 });
});

test('buy: a treat comes back with もとに戻す', async ({ page }) => {
  await page.goto('jar?demo');
  const pot = page.locator('[data-pot=treat]');
  const balance = async () => (await pot.locator('.balance').innerText()).replace(/\D/g, '');
  const before = await balance();
  await pot.locator('button.item:not([disabled])').first().click();
  await sheet(page).getByRole('button', { name: '買う！' }).click();
  await expect.poll(balance).not.toBe(before);
  await page.getByRole('button', { name: 'もとに戻す' }).click();
  await expect.poll(balance).toBe(before);
});

test('menu: adding a treat to the shared menu', async ({ page }) => {
  await page.goto('jar?demo');
  const pot = page.locator('[data-pot=treat]');
  await pot.getByRole('button', { name: /へんしゅう/ }).click();
  await sheet(page).getByRole('button', { name: /おやつを追加/ }).click();
  await sheet(page).locator('input.lbl').last().fill('たいやき');
  await sheet(page).locator('input.num').last().fill('250');
  await sheet(page).getByRole('button', { name: '保存' }).click();
  await expect(pot.getByRole('button', { name: /^たいやき 250\sベル/ })).toBeVisible();
});

test('harvest: the bonus lands in the pots', async ({ page }) => {
  await page.goto('?demo=harvest');
  await page.getByRole('button', { name: '受け取る！' }).click();
  await expect(page.getByText(/壺に入りました！/)).toBeVisible();
  await page.getByRole('button', { name: '島へもどる' }).click();
  await expect(page.getByRole('button', { name: '受け取る！' })).toHaveCount(0);
});

test('きろく: editing a day’s steps', async ({ page }) => {
  await page.goto('?demo');
  await page.getByRole('button', { name: 'しまフォンを開く' }).click();
  await page.locator('.app[data-app=kiroku]').click();
  await sheet(page).getByRole('button', { name: /^今週/ }).click();
  await sheet(page).getByRole('button', { name: /^月/ }).click();
  await sheet(page).getByRole('button', { name: /^歩数/ }).click();
  const pad = sheet(page);
  await pad.getByRole('button', { name: 'クリア' }).click();
  for (const k of '12345') await pad.getByRole('button', { name: k, exact: true }).click();
  await pad.getByRole('button', { name: 'けってい' }).click();
  await expect(sheet(page).getByText('12,345', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'もとに戻す' })).toBeVisible();
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
  await sheet(page).getByRole('button', { name: /目標を(決める|変える)/ }).click();
  await sheet(page).getByRole('textbox').fill('65');
  await sheet(page).getByRole('button', { name: 'けってい' }).click();
  await expect(sheet(page).getByText('目標 65.0 kg')).toBeVisible();
  // weight never earns: today's ベル didn't move
  await page.keyboard.press('Escape');
  await expect(ribbon).toHaveAttribute('aria-label', bells!);
});

test('tree popups: one at a time, they stay open, and a tap on the tree, the other tree or elsewhere toggles them', async ({ page }) => {
  await page.goto('?demo');
  await answerPending(page);
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
