// The HUD's top-right cluster (docs/design.md "Island"): [the menu] [the jar] [the health button]. The menu (NH's leaf)
// drops ずかん and せってい; each opens its own sheet. Shared by the specs that reach either.
import { expect, type Page } from '@playwright/test';

/** The menu's leaf (aria-expanded). */
export const hudMenu = (page: Page) => page.locator('[data-hud-menu]');

/** Unfold the menu (if folded) and tap one of its pills; its sheet is open when this returns. */
export async function fromMenu(page: Page, which: 'zukan' | 'settings', how: 'click' | 'tap' = 'click') {
  const menu = hudMenu(page);
  await expect(menu).toBeVisible();
  if ((await menu.getAttribute('aria-expanded')) !== 'true') await menu[how]();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const pill = page.locator(which === 'zukan' ? '[data-hud-zukan]' : '[data-hud-settings]');
  await expect(pill).toBeVisible();
  await pill[how]();
  await expect(page.locator(which === 'zukan' ? 'dialog[open] [data-zukan-sheet]' : 'dialog[open] [data-settings]')).toBeVisible();
}

