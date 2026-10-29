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

test('tap: a check-in grows the week score', async ({ page }) => {
  await page.goto('?demo');
  const score = page.getByRole('button', { name: /^今週 \d+\/100$/ });
  await expect(score).toBeVisible();
  await answerPending(page);
  const before = Number((await score.getAttribute('aria-label'))!.match(/(\d+)\/100/)![1]);
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
    const after = Number((await score.getAttribute('aria-label'))!.match(/(\d+)\/100/)![1]);
    expect(after).toBeGreaterThan(before);
  }).toPass();
});

test('undo: a purse spend comes back with もとに戻す', async ({ page }) => {
  await page.goto('jar?demo');
  const purse = page.locator('.purse');
  const yen = async () => (await purse.locator('.purse-yen').innerText()).replace(/\D/g, '');
  const before = await yen();
  await purse.getByRole('button', { name: '使う' }).click();
  await sheet(page).locator('button.item:not([disabled])').first().click();
  await sheet(page).getByRole('button', { name: /^使う！/ }).click();
  await expect.poll(yen).not.toBe(before);
  await page.getByRole('button', { name: 'もとに戻す' }).click();
  await expect.poll(yen).toBe(before);
});

test('harvest: dropping the week into the jar', async ({ page }) => {
  await page.goto('?demo=harvest');
  await page.getByRole('button', { name: '壺に入れる！' }).click();
  await expect(page.getByText(/入れました！/)).toBeVisible();
  await page.getByRole('button', { name: '島へもどる' }).click();
  await expect(page.getByRole('button', { name: '壺に入れる！' })).toHaveCount(0);
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
