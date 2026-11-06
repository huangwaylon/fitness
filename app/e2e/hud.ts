// The HUD's top-right cluster (docs/design.md "Island"): [the health button] [the meal button] [the menu]. The menu
// (NH's leaf, at the screen's side) drops 「ベル 121」 (→ the panel, ごほうび), ずかん, えいご ききとり, りょこう, けっこんしき and せってい; each opens
// its own sheet.
// Shared by the specs that reach any of them.
import { expect, type Page } from './fixtures.ts';

/** The menu's leaf (aria-expanded). */
export const hudMenu = (page: Page) => page.locator('[data-hud-menu]');

/** The menu's ベル row (the wallet's balance in data-bells, today's in data-today; hidden while folded). */
export const hudBells = (page: Page) => page.locator('[data-hud-bells]');

const PILL = { bells: '[data-hud-bells]', zukan: '[data-hud-zukan]', kikimimi: '[data-hud-kikimimi]', travel: '[data-hud-travel]', wedding: '[data-hud-wedding]', settings: '[data-hud-settings]' };
const SHEET = {
  bells: 'dialog[open] [data-wallet]', zukan: 'dialog[open] [data-zukan-sheet]', kikimimi: 'dialog[open] [data-kikimimi]', travel: 'dialog[open] [data-travel]', wedding: 'dialog[open] [data-wedding]', settings: 'dialog[open] [data-settings]'
};

/** Unfold the menu (if folded) and wait for its pills to be in place. They drop out of the leaf one after the other
 *  (HudMenu's spring): せってい waits 110 ms at its start, small over the ベル row, then moves 110 px down. Playwright
 *  finds a pill still there "stable" and aims at it, and on a busy runner its spring starts before the tap lands: the
 *  tap hit the ベル row or the leaf (CI run 41798557650: せってい never opened). */
export async function unfoldMenu(page: Page, how: 'click' | 'tap' = 'click') {
  const menu = hudMenu(page);
  await expect(menu).toBeVisible();
  if ((await menu.getAttribute('aria-expanded')) !== 'true') await menu[how]();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  // (each pill where it rests: its spring's transform and fade over)
  const inPlace = () => page.locator('#hud-menu-items').evaluate((el) =>
    [...el.querySelectorAll(':scope > button')].every((b) => ((s) => s.transform === 'none' && s.opacity === '1')(getComputedStyle(b))));
  await expect.poll(inPlace).toBe(true);
}

/** Unfold the menu (if folded) and tap one of its pills; its sheet (the panel, for ベル) is open when this returns. */
export async function fromMenu(page: Page, which: keyof typeof PILL, how: 'click' | 'tap' = 'click') {
  await unfoldMenu(page, how);
  const pill = page.locator(PILL[which]);
  await expect(pill).toBeVisible();
  await pill[how]();
  await expect(page.locator(SHEET[which])).toBeVisible();
}

/** The panel (ごほうび), from the menu's ベル row. */
export const openRewards = (page: Page) => fromMenu(page, 'bells');

