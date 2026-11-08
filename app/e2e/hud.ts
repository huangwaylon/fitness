// The HUD's top-right cluster (docs/design.md "Island"): [the health button] [the meal button] [the menu]. The menu
// (NH's leaf, at the screen's side) drops 「ベル 121」 (→ the panel, ごほうび), ずかん, えいご ききとり, りょこう, けっこんしき, トレイル and せってい; each opens
// its own sheet.
// Shared by the specs that reach any of them.
import { expect, type Page } from './fixtures.ts';

/** The menu's leaf (aria-expanded). */
export const hudMenu = (page: Page) => page.locator('[data-hud-menu]');

/** The menu's ベル row (the wallet's balance in data-bells, today's in data-today; hidden while folded). */
export const hudBells = (page: Page) => page.locator('[data-hud-bells]');

const PILL = { bells: '[data-hud-bells]', kikimimi: '[data-hud-kikimimi]', travel: '[data-hud-travel]', wedding: '[data-hud-wedding]', hiking: '[data-hud-hiking]', settings: '[data-hud-settings]' };
const SHEET = {
  bells: 'dialog[open] [data-wallet]', zukan: 'dialog[open] [data-zukan-sheet]', kikimimi: 'dialog[open] [data-kikimimi]', travel: 'dialog[open] [data-travel]', wedding: 'dialog[open] [data-wedding]', hiking: 'dialog[open] [data-hiking]', settings: 'dialog[open] [data-settings]'
};

/** Unfold the menu (if folded) and wait for its pills to be shown (HudMenu shows them at once; the poll guards a
 *  fold still fading out). */
export async function unfoldMenu(page: Page, how: 'click' | 'tap' = 'click') {
  const menu = hudMenu(page);
  await expect(menu).toBeVisible();
  if ((await menu.getAttribute('aria-expanded')) !== 'true') await menu[how]();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const inPlace = () => page.locator('#hud-menu-items').evaluate((el) =>
    [...el.querySelectorAll(':scope > button')].every((b) => ((s) => s.transform === 'none' && s.opacity === '1')(getComputedStyle(b))));
  await expect.poll(inPlace).toBe(true);
}

/** Unfold the menu (if folded) and tap one of its pills; its sheet (the panel, for ベル) is open when this returns.
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
  await expect(page.locator(SHEET[which])).toBeVisible();
}

/** The panel (ごほうび), from the menu's ベル row. */
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
