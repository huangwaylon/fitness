// The HUD's top-right cluster (docs/design.md "Island"): [the health button] [the menu]. The health button opens
// けんこう and ごはん's sheet (two tabs: openKenkou). The menu (NH's leaf, at the screen's side) drops its fixed grid:
// やること, 英語, ベル (→ the panel, ごほうび), 旅行, 地図, 登山, 結婚式, ボット (a phone with a bot) and 設定; each tile
// opens its own sheet.
// Shared by the specs that reach any of them.
import { expect, type Page } from './fixtures.ts';

/** The menu's leaf (aria-expanded). */
export const hudMenu = (page: Page) => page.locator('[data-hud-menu]');

/** The menu's ベル tile (the wallet's balance in data-bells, today's in data-today; hidden while folded). */
export const hudBells = (page: Page) => page.locator('[data-hud-bells]');

const PILL = { bells: '[data-hud-bells]', english: '[data-hud-english]', travel: '[data-hud-travel]', wedding: '[data-hud-wedding]', hiking: '[data-hud-hiking]', places: '[data-hud-places]', bots: '[data-hud-bots]', todo: '[data-hud-todo]', settings: '[data-hud-settings]' };
const SHEET = {
  bells: 'dialog[open] [data-wallet]', zukan: 'dialog[open] [data-zukan-sheet]', english: 'dialog[open] [data-english]', travel: 'dialog[open] [data-travel]', wedding: 'dialog[open] [data-wedding]', hiking: 'dialog[open] [data-hiking]', places: 'dialog[open] [data-places]', bots: 'dialog[open] [data-bots]', todo: 'dialog[open] [data-todo]', settings: 'dialog[open] [data-settings]'
};

/** Unfold the menu (if folded) and wait for its card to be shown (HudMenu shows it at once; the poll guards a fold
 *  still fading out). */
export async function unfoldMenu(page: Page, how: 'click' | 'tap' = 'click') {
  const menu = hudMenu(page);
  await expect(menu).toBeVisible();
  if ((await menu.getAttribute('aria-expanded')) !== 'true') await menu[how]();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const inPlace = () => page.locator('#hud-menu-items').evaluate((el) => ((s) => s.transform === 'none' && s.opacity === '1')(getComputedStyle(el)));
  await expect.poll(inPlace).toBe(true);
}

/** Unfold the menu (if folded) and tap one of its tiles; its sheet (the panel, for ベル) is open when this returns.
 *  ずかん: 設定's last row (設定 closes, the ずかん's sheet in its place). */
export async function fromMenu(page: Page, which: keyof typeof SHEET, how: 'click' | 'tap' = 'click') {
  if (which === 'zukan') {
    await fromMenu(page, 'settings', how);
    const row = page.locator('dialog[open] [data-settings-zukan]');
    await row.scrollIntoViewIfNeeded();
    await row[how]();
    await expect(page.locator(SHEET.zukan)).toBeVisible();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    return;
  }
  await unfoldMenu(page, how);
  const pill = page.locator(PILL[which]);
  await expect(pill).toBeVisible();
  await pill[how]();
  // (a miss says which: the tap lost, the menu still unfolded, or the sheet late, a WebKit-under-load flake's question)
  await expect(page.locator(SHEET[which])).toBeVisible().catch(async (e: Error) => {
    const why = await page.evaluate(() => ({ menu: document.querySelector('[data-hud-menu]')?.getAttribute('aria-expanded'), dialogs: document.querySelectorAll('dialog[open]').length, focus: document.activeElement?.outerHTML.slice(0, 80) })).catch((x: Error) => x.message);
    throw new Error(`${e.message}\n${JSON.stringify(why)}`);
  });
}

/** けんこう and ごはん's sheet, from the HUD's dumbbell, on that tab (it opens on the one shown last). */
export async function openKenkou(page: Page, tab: 'health' | 'food' = 'health', how: 'click' | 'tap' = 'click') {
  await page.getByRole('button', { name: 'けんこう', exact: true })[how]();
  const t = page.locator(`dialog[open] [data-kenkou-tab=${tab}]`);
  await t[how]();
  await expect(t).toHaveAttribute('aria-current', 'page');
}

/** ごはん's sheet, on a page already loaded (no second boot): its summary shown. */
export async function openFoodSheet(page: Page, how: 'click' | 'tap' = 'click') {
  await openKenkou(page, 'food', how);
  await expect(page.locator('dialog[open] [data-food-sheet] [data-food-summary]')).toBeVisible();
}

/** The demo booted as `as` at `date` (null: the page's own clock, e.g. `page.clock.install`), no critter or visitor
 *  about, then ごはん's sheet. */
export async function openFood(page: Page, { as, date = '2026-11-04T12:30', how = 'click' }: { as?: 'A' | 'B' | 'G'; date?: string | null; how?: 'click' | 'tap' } = {}) {
  await page.goto(`?demo${date ? `&date=${date}` : ''}&critter=none&visitor=none${as ? `&as=${as}` : ''}`);
  await expect(page.getByRole('button', { name: 'けんこう', exact: true })).toBeVisible({ timeout: 15_000 });
  await openFoodSheet(page, how);
}

/** The panel (ごほうび), from the menu's ベル tile. */
export const openRewards = (page: Page) => fromMenu(page, 'bells');


/** 設定's 島の天気 (in 季節's fold: unfolded here), with 設定 open. */
export async function weatherSection(page: Page) {
  const tg = page.locator('dialog[open] [data-preview-toggle]');
  if ((await tg.getAttribute('aria-expanded')) !== 'true') await tg.click();
  const sec = page.locator('dialog[open] [data-weather-section]');
  await sec.scrollIntoViewIfNeeded();
  await expect(sec.locator('[data-wx-mode="real"]')).toBeVisible();
  return sec;
}
