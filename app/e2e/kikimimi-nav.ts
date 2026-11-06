// ききみみ's hub and its pages, shared by the specs (docs/kikimimi-ux.md §5): the sheet, and the way from the hub to a
// mode's page (あそぶ › the mode), みんなで, きろく.
import { expect, type Page } from './fixtures.ts';

export const kikiSheet = (p: Page) => p.locator('dialog[open] [data-kikimimi]');

/** The hub (my lobby kept alone, nothing pushed), once its chunk is in. */
export async function atHub(p: Page) {
  await expect(kikiSheet(p)).toHaveAttribute('data-kiki-at', 'hub');
  await expect(kikiSheet(p).locator('[data-kiki-page="hub"]')).toBeVisible();
}

/** From the hub: あそぶ, then a mode's page (`quiz`, `ladder`, `announce`, `review`). */
export async function toMode(p: Page, m: 'quiz' | 'ladder' | 'announce' | 'review') {
  await atHub(p);
  await kikiSheet(p).locator('[data-kiki-tile="asobu"]').click();
  await kikiSheet(p).locator(`[data-kiki-mode-tile="${m}"]`).click();
  await expect(kikiSheet(p).locator(`[data-kiki-mode-page="${m}"]`)).toBeVisible();
}

/** From the hub: a tile's page (みんなで, きろく, ずかん). */
export async function toTile(p: Page, k: 'together' | 'record' | 'zukan') {
  await atHub(p);
  await kikiSheet(p).locator(`[data-kiki-tile="${k}"]`).click();
  await expect(kikiSheet(p)).toHaveAttribute('data-kiki-at', k === 'together' ? 'lobby' : k);
}

