// The HUD menu (docs/design.md "Island"): NH's leaf at the cluster's right end, at the screen's side ([the dumbbell]
// [the bowl] [the menu], top right) drops 「ベル 121」 … せってい under it, right-aligned; folded by default (the
// pills hidden), it folds again on a second tap, a tap elsewhere, Esc, or a pick; the ベル row opens the panel
// (ごほうび), the others their own sheet (せってい's sections, ずかん from its last one).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu, hudBells, hudMenu, unfoldMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const pills = (page: Page) => page.locator('#hud-menu-items > button');
const settings = (page: Page) => page.locator('[data-hud-settings]');

async function open(page: Page) {
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandUp(page);
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
    const w3 = (window as unknown as { __world3d: { pick(cx: number, cy: number): object | null } }).__world3d;
    for (let z = -40; z < -8; z += 2)
      for (const x of [60, 120, 200, 280]) {
        const [cx, cy] = w.at(x, z);
        if (cy < innerHeight - 16 && cx > 20 && cx < innerWidth - 20 && !w3.pick(cx, cy)) return [cx, cy] as [number, number];
      }
    throw new Error('no sea on screen');
  });

test('folded by default; the leaf unfolds it and folds it again; a tap elsewhere and Esc fold it too', async ({ page }) => {
  await open(page);
  await folded(page);
  // the HUD's order: the dumbbell, the leaf (a 44px target, at the screen's side, in their row); no jar, no bowl
  const m = (await hudMenu(page).boundingBox())!, h = (await page.locator('.hud-health').boundingBox())!;
  expect(m.width).toBeGreaterThanOrEqual(44);
  expect(m.height).toBeGreaterThanOrEqual(44);
  expect(h.x + h.width).toBeLessThanOrEqual(m.x);
  expect(Math.abs(393 - m.x - m.width - 14)).toBeLessThan(1.5);
  expect(Math.abs(m.y + m.height / 2 - (h.y + h.height / 2))).toBeLessThan(2);
  await expect(page.locator('.hud-food')).toHaveCount(0);
  await expect(page.locator('.hud-jar')).toHaveCount(0);
  await hudMenu(page).click();
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(settings(page)).toBeVisible();
  // the pills hang under the leaf, right-aligned to it, 「ベル 121」 first (no icon), then by default 旅行, 結婚式, 登山, 英語
  // (English Study), 設定 (in kanji), each a 44px pill, on screen, the same width (no ずかん: 設定's; ボット, a paired
  // member's between 英語 and 設定, isn't in demo: its.spec.ts, bots.spec.ts). Each found by its data-hud-* (a person's
  // own order moves them: menu-order.spec.ts)
  await expect(pills(page)).toHaveCount(6);
  await expect(page.locator('[data-hud-zukan]')).toHaveCount(0);
  const ids = await pills(page).evaluateAll((bs) => bs.map((b) => b.getAttributeNames().find((a) => /^data-hud-(?!bells-)/.test(a))));
  expect(ids).toEqual(['data-hud-bells', 'data-hud-travel', 'data-hud-wedding', 'data-hud-hiking', 'data-hud-english', 'data-hud-settings']);
  await expect(page.locator('[data-hud-bots]')).toHaveCount(0);
  await expect(pills(page).locator('.lbl')).toHaveText(['ベル', '旅行', '結婚式', '登山', '英語', '設定']);
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
  await expect(settings(page)).toBeVisible();
  await page.mouse.click(...(await sea(page)));
  await folded(page);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // Esc folds it, focus back on the leaf
  await hudMenu(page).click();
  await expect(settings(page)).toBeVisible();
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
  for (const [pill, sheet] of [[hudBells(page), '[data-wallet]'], [page.locator('[data-hud-wedding]'), '[data-wedding]'], [page.locator('[data-hud-hiking]'), '[data-trail-list]'], [settings(page), '[data-settings]']] as const) {
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

test('the guest has the ベル row too (the pair\'s wallet, to look at): it opens ごほうび, view-only; no ボット', async ({ page }) => {
  await page.goto('?demo&as=G&date=2026-11-04T12:00');
  await islandUp(page);
  await unfoldMenu(page);
  await expect(pills(page).locator('.lbl')).toHaveText(['ベル', '旅行', '結婚式', '登山', '英語', '設定']);
  await expect(page.locator('[data-hud-bots]')).toHaveCount(0);
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
  await expect(dlg.locator('.navbar')).toContainText('図鑑');
  await expect(dlg.locator('[data-zukan]')).toHaveCount(8); // (the seven kinds and なかま)
  await dlg.locator('[data-zukan="fish"]').click();
  await expect(dlg.locator('[data-zukan-head]')).toContainText('魚');
  await dlg.locator('.titlebar .back').click();
  await expect(dlg.locator('[data-zukan="fish"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dlg).toHaveCount(0);
  // the next opening starts on the kinds
  await fromMenu(page, 'settings');
  await folded(page);
  await expect(dlg.locator('.navbar')).toContainText('設定');
  for (const id of ['#sec-look', '#sec-profile', '#sec-sound', '#sec-lang', '#sec-season']) await expect(dlg.locator(id)).toBeAttached();
  // 言語: one dropdown, 日本語 by default; English turns the sheet English, and back
  const lang = dlg.locator('select[data-pick="lang"]');
  await expect(lang).toHaveValue('ja');
  await lang.selectOption('en');
  await expect(dlg.locator('.navbar')).toContainText('Settings');
  await lang.selectOption('ja');
  await expect(dlg.locator('.navbar')).toContainText('設定');
  await dlg.locator('.titlebar .close').click();
  await expect(dlg).toHaveCount(0);
});

// A sheet's own strings come in Japanese only (i18n addStrings): switched to English, 旅行's, loaded before the
// switch, turn English with it.
test('English after a sheet’s strings came in Japanese: its strings English too', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandUp(page);
  const dlg = page.locator('dialog[open]');
  await fromMenu(page, 'travel');
  await expect(dlg.locator('.navbar')).toContainText('旅行');
  await page.keyboard.press('Escape');
  await fromMenu(page, 'settings');
  await dlg.locator('select[data-pick="lang"]').selectOption('en');
  await expect(dlg.locator('.navbar')).toContainText('Settings');
  await dlg.locator('.titlebar .close').click();
  await fromMenu(page, 'travel');
  await expect(dlg.locator('.navbar')).toContainText('Trips');
});

test('in a person’s own order (edit mode: menu-order.spec.ts): the pills move, each still found by its data-hud-* and opening its sheet', async ({ page }) => {
  await open(page);
  // 設定's メニュー row: the menu out in edit mode; 英語 up three places by ↑ (the long press and the drag: menu-order.spec.ts)
  await fromMenu(page, 'settings');
  await page.locator('dialog[open] [data-menu-edit]').click();
  await expect(page.locator('#hud-menu-items')).toHaveAttribute('data-menu-editing', 'true');
  await page.locator('[data-hud-english]').focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowUp');
  await page.locator('[data-menu-done]').click();
  await expect(pills(page).locator('.lbl')).toHaveText(['ベル', '英語', '旅行', '結婚式', '登山', '設定']);
  await expect(pills(page).nth(1)).toHaveAttribute('data-hud-english', '');
  await fromMenu(page, 'english');
  await page.keyboard.press('Escape');
  await fromMenu(page, 'settings');
});
