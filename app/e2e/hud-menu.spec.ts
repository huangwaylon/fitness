// The HUD menu (docs/design.md "Island"): NH's leaf at the cluster's right end, at the screen's side ([the dumbbell]
// [the bowl] [the menu], top right) drops 「ベル 121」, ずかん and せってい under it, right-aligned; folded by default (the
// pills hidden), it folds again on a second tap, a tap elsewhere, Esc, or a pick; the ベル row opens the panel
// (ごほうび), the others their own sheet (the ずかん's kinds, せってい's sections).
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu, hudBells, hudMenu, unfoldMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const pills = (page: Page) => page.locator('#hud-menu-items > button');
const zukan = (page: Page) => page.locator('[data-hud-zukan]');
const settings = (page: Page) => page.locator('[data-hud-settings]');

async function open(page: Page) {
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(hudMenu(page)).toBeVisible();
}
const folded = async (page: Page) => {
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'false');
  for (const p of await pills(page).all()) await expect(p).toBeHidden();
};
/** The sea in front of the beach on this screen (client px), read from the page's island (world z < 0 is the sea),
 *  with nothing one taps over it: not a fixed screen point, which the layout's beach or a find may come to cover. */
const sea = (page: Page) =>
  page.evaluate(() => {
    const w = (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world;
    const TAPS = 'button, a, [data-flower], [data-tree], [data-bush], [data-find], [data-fixture], [data-decor], [data-visitor], [data-actor], [data-critter]';
    for (let z = -40; z < -8; z += 2)
      for (const x of [60, 120, 200, 280]) {
        const [cx, cy] = w.at(x, z);
        if (cy < innerHeight - 16 && cx > 20 && cx < innerWidth - 20 && !document.elementFromPoint(cx, cy)?.closest(TAPS)) return [cx, cy] as [number, number];
      }
    throw new Error('no sea on screen');
  });

test('folded by default; the leaf unfolds it and folds it again; a tap elsewhere and Esc fold it too', async ({ page }) => {
  await open(page);
  await folded(page);
  // the HUD's order: the dumbbell, the bowl, the leaf (a 44px target, at the screen's side, in their row); no jar
  const m = (await hudMenu(page).boundingBox())!, f = (await page.locator('.hud-food').boundingBox())!, h = (await page.locator('.hud-health').boundingBox())!;
  expect(m.width).toBeGreaterThanOrEqual(44);
  expect(m.height).toBeGreaterThanOrEqual(44);
  expect(h.x + h.width).toBeLessThanOrEqual(f.x);
  expect(f.x + f.width).toBeLessThanOrEqual(m.x);
  expect(Math.abs(393 - m.x - m.width - 14)).toBeLessThan(1.5);
  expect(Math.abs(m.y + m.height / 2 - (f.y + f.height / 2))).toBeLessThan(2);
  await expect(page.locator('.hud-jar')).toHaveCount(0);
  await hudMenu(page).click();
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(zukan(page)).toBeVisible();
  await expect(settings(page)).toBeVisible();
  // the pills hang under the leaf, right-aligned to it, 「ベル 121」 first (no icon), then ずかん, えいご ききとり, りょこう,
  // せってい, each a 44px pill, on screen, the same width
  await expect(pills(page)).toHaveCount(5);
  await expect(pills(page).nth(2)).toHaveAttribute('data-hud-kikimimi', '');
  await expect(pills(page).nth(3)).toHaveAttribute('data-hud-travel', '');
  await expect(pills(page).nth(4)).toHaveAttribute('data-hud-settings', '');
  await expect(pills(page).first()).toHaveAttribute('data-hud-bells', '');
  await expect(page.locator('[data-hud-shells]')).toHaveCount(0); // no かいがら: the shop is the building
  const bells = Number(await hudBells(page).getAttribute('data-bells'));
  await expect(hudBells(page)).toHaveText(new RegExp(`^\\s*ベル\\s*${bells.toLocaleString('en-US')}\\s*$`));
  await expect(hudBells(page).locator('img, svg')).toHaveCount(0);
  // the spring settles (each pill at rest, not a fixed wait: a busy runner's spring was still under way at 600 ms)
  await unfoldMenu(page);
  const boxes = await Promise.all((await pills(page).all()).map(async (p) => (await p.boundingBox())!));
  for (const [i, b] of boxes.entries()) {
    expect(b.height).toBeGreaterThanOrEqual(44);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThan(m.y + m.height);
    expect(Math.abs(b.x + b.width - (m.x + m.width))).toBeLessThan(1.5);
    expect(Math.abs(b.width - boxes[0].width)).toBeLessThan(1);
    if (i) expect(b.y).toBeGreaterThan(boxes[i - 1].y + boxes[i - 1].height);
  }
  // a second tap folds it
  await hudMenu(page).click();
  await folded(page);
  // a tap on the sea folds it (and nothing opens)
  await hudMenu(page).click();
  await expect(zukan(page)).toBeVisible();
  await page.mouse.click(...(await sea(page)));
  await folded(page);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // Esc folds it, focus back on the leaf
  await hudMenu(page).click();
  await expect(zukan(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await folded(page);
  await expect(hudMenu(page)).toBeFocused();
  // the ベル row: the menu folds, the panel opens (ごほうび: no tabs, no せってい)
  await hudMenu(page).click();
  await expect(hudBells(page)).toBeVisible();
  await expect(hudBells(page)).toHaveAttribute('aria-expanded', 'false');
  await hudBells(page).click();
  await expect(page.locator('dialog[open] [data-wallet]')).toBeVisible();
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('ごほうび');
  await expect(page.locator('dialog[open] [data-tab]')).toHaveCount(0);
  await expect(hudBells(page)).toHaveAttribute('aria-expanded', 'true');
  await folded(page);
});

test('by keyboard: the leaf, a pill, Enter opens its sheet, Esc closes it and the focus is back on the leaf', async ({ page }) => {
  await open(page);
  for (const [pill, sheet] of [[hudBells(page), '[data-wallet]'], [zukan(page), '[data-zukan-sheet]'], [settings(page), '[data-settings]']] as const) {
    await hudMenu(page).focus();
    await page.keyboard.press('Enter');
    await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'true');
    // (focused directly: WebKit's Tab skips buttons unless the Mac's "Tab highlights each item" is on)
    await expect(pill).toBeVisible();
    await pill.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(`dialog[open] ${sheet}`)).toBeVisible();
    await folded(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    // (the pill went inert with the fold: the dialog gives the focus back to the leaf, not to the page's body)
    await expect(hudMenu(page), sheet).toBeFocused();
  }
});

test('the guest has the ベル row too (the pair\'s wallet, to look at): it opens ごほうび, view-only', async ({ page }) => {
  await page.goto('?demo&as=G&date=2026-11-04T12:00');
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'bells');
  const dlg = page.locator('dialog[open]');
  await expect(dlg.locator('[data-guest-jar]')).toBeVisible();
  await expect(dlg.locator('[data-item]')).toHaveCount(0);
});

test('ずかん opens the ずかん (its kinds, a kind\'s page with ‹), せってい opens せってい; each folds the menu', async ({ page }) => {
  await open(page);
  await fromMenu(page, 'zukan');
  await folded(page);
  const dlg = page.locator('dialog[open]');
  await expect(dlg.locator('.navbar')).toContainText('ずかん');
  await expect(dlg.locator('[data-zukan]')).toHaveCount(7);
  await dlg.locator('[data-zukan="fish"]').click();
  await expect(dlg.locator('[data-zukan-head]')).toContainText('さかな');
  await dlg.locator('.titlebar .back').click();
  await expect(dlg.locator('[data-zukan="fish"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dlg).toHaveCount(0);
  // the next opening starts on the kinds
  await fromMenu(page, 'settings');
  await folded(page);
  await expect(dlg.locator('.navbar')).toContainText('せってい');
  for (const id of ['#sec-look', '[data-decor-start]', '#sec-sound', '#sec-lang', '#sec-sync']) await expect(dlg.locator(id)).toBeAttached(); // (もようがえ one row since fd2966b1: its はじめる)
  await dlg.locator('.titlebar .close').click();
  await expect(dlg).toHaveCount(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the pills fade in where they stand (no drop, no tipped leaf)', async ({ page }) => {
    await open(page);
    await hudMenu(page).click();
    await expect(zukan(page)).toBeVisible();
    expect(await zukan(page).evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    expect(await page.locator('[data-hud-menu] .leaf').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  });
});
