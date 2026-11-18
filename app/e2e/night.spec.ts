// Night's text contrast (docs/design.md "Text colours by surface"): at night (22:00) the theme's text is cream for the
// navy chrome, so an always-cream surface (a card, a stage, a game sheet) whose text inherits it reads cream on cream
// (~1.1:1) unless it carries .obj-cream and its own colour; a day-only ink on the themed navy reads ~1.3:1. Each test
// opens sheets at night and holds every visible text at 3:1 or more on what it sits on (e2e/contrast.ts). The logic tier.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu, openKenkou } from './hud.ts';
import { lowContrast } from './contrast.ts';

test.use({ viewport: { width: 393, height: 659 } });
const NIGHT = '?demo&date=2026-11-04T22:00';

/** The texts under 3:1 now (a gradient or a filter on the way down: the background a guess, left out). */
async function low(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('data-tod', 'night');
  // (each finite animation at its end: a score's bump flashes gold for a moment)
  await page.evaluate(() => document.getAnimations().forEach((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.finish()));
  const lows = await lowContrast(page);
  return lows.filter((l) => !l.flags.some((f) => f === 'img' || f === 'filter')).map((l) => `${l.ratio}:1 ${l.fg} on ${l.bg} “${l.text}” ${l.sel}`);
}

/** WebKit taps (the phones' input), Chromium clicks. */
const howOf = (name: string) => (name.startsWith('webkit') ? 'tap' : 'click') as 'tap' | 'click';

async function island(page: Page) {
  await page.goto(NIGHT);
  await islandUp(page);
}

test('the menu’s sheets read at night', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  for (const which of ['bells', 'english', 'travel', 'wedding', 'hiking', 'settings'] as const) {
    await fromMenu(page, which, how);
    expect(await low(page), which).toEqual([]);
    await page.locator('dialog[open]').getByRole('button', { name: '閉じる' }).first()[how]();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }
});

test('けんこう and ごはん read at night', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  await openKenkou(page, 'health');
  expect(await low(page), 'health').toEqual([]);
  const food = page.locator('dialog[open] [data-kenkou-tab=food]');
  await food[how]();
  await expect(food).toHaveAttribute('aria-current', 'page');
  expect(await low(page), 'food').toEqual([]);
});

test('the look’s cream stage keeps the day’s text at night (its 回せます and the strip’s kind)', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  await fromMenu(page, 'settings', how);
  await page.locator('dialog[open]').getByRole('button', { name: '変更' })[how]();
  // (コーデ: the stage with no colour dots, 回せます at its foot)
  await page.locator('[data-look-tab="coord"]')[how]();
  const stage = page.locator('[data-look-stage]');
  await expect(stage.locator('.hint')).toBeVisible();
  expect(await stage.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(74, 58, 44)');
  expect(await low(page)).toEqual([]);
});

test('/speech: the page follows the hour, its cards stay cream with ink', async ({ page }) => {
  await page.goto(`speech${NIGHT}`);
  await expect(page.locator('[data-speech] .card').first()).toBeVisible();
  expect(await low(page)).toEqual([]);
});

test('英語すごろく’s results read at night (the team’s stars and かいがら on the navy card)', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  await fromMenu(page, 'english', how);
  await page.locator('dialog[open] [data-en-tab="game"]')[how]();
  const sh = page.locator('[data-sugoroku]');
  await sh.locator('[data-sg-new]')[how]();
  await sh.locator('[data-sg-start]')[how]();
  await expect(sh).toHaveAttribute('data-level', 'play');
  expect(await low(page), 'play').toEqual([]);
  await sh.locator('[data-sg-menu]')[how]();
  await sh.locator('dialog[open] [data-sg-end]')[how]();
  await sh.locator('[data-sg-end-yes]')[how]();
  await expect(sh).toHaveAttribute('data-level', 'results');
  expect(await low(page), 'results').toEqual([]);
});

test('the board’s cream pager keeps the day’s sunk ‹ › at night (not night’s navy on cream)', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  await page.getByRole('button', { name: 'けいじばんを みる' })[how]();
  const view = page.getByRole('dialog', { name: 'けいじばん' });
  await expect(view).toBeVisible({ timeout: 10_000 });
  const older = view.locator('[data-board-older]');
  await expect(older).toHaveAttribute('aria-disabled', 'true');
  expect(await older.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(234, 215, 172)');
  expect(await low(page)).toEqual([]);
});
