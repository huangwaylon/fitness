// The HUD's top-right cluster (docs/design.md "Island"): [the health button] [the meal button] [the menu]. The menu
// (NH's leaf, at the screen's side) drops 「ベル 121」 (→ the panel, ごほうび), ずかん and せってい; each opens its own sheet.
// Shared by the specs that reach any of them.
import { expect, type Page } from '@playwright/test';

/** The menu's leaf (aria-expanded). */
export const hudMenu = (page: Page) => page.locator('[data-hud-menu]');

/** The menu's ベル row (the wallet's balance in data-bells, today's in data-today; hidden while folded). */
export const hudBells = (page: Page) => page.locator('[data-hud-bells]');

const PILL = { bells: '[data-hud-bells]', zukan: '[data-hud-zukan]', settings: '[data-hud-settings]' };
const SHEET = { bells: 'dialog[open] [data-wallet]', zukan: 'dialog[open] [data-zukan-sheet]', settings: 'dialog[open] [data-settings]' };

/** Unfold the menu (if folded) and tap one of its pills; its sheet (the panel, for ベル) is open when this returns. */
export async function fromMenu(page: Page, which: keyof typeof PILL, how: 'click' | 'tap' = 'click') {
  const menu = hudMenu(page);
  await expect(menu).toBeVisible();
  if ((await menu.getAttribute('aria-expanded')) !== 'true') await menu[how]();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const pill = page.locator(PILL[which]);
  await expect(pill).toBeVisible();
  await pill[how]();
  await expect(page.locator(SHEET[which])).toBeVisible();
}

/** The panel (ごほうび), from the menu's ベル row. */
export const openRewards = (page: Page) => fromMenu(page, 'bells');

