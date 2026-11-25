// The HUD menu (docs/design.md "Island" Menu): NH's leaf at the cluster's right end ([the dumbbell] [the menu], top
// right) drops a cream card with a fixed grid, the same for everyone: 毎日 (やること, 英語, ベル), お出かけ (旅行, 地図,
// 登山), ほか (結婚式, ボット, 設定); folded by default (the card hidden, inert), it folds again on a second tap, a tap
// elsewhere, Esc, or a pick; ベル opens the panel (ごほうび), each other tile its own sheet. ボット's 「!」 is bots.spec's
// (a member's phone with its Workers mocked; demo mode has no ボット); WebKit taps, Chromium clicks.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu, hudBells, hudMenu, unfoldMenu } from './hud.ts';
import { lowContrast } from './contrast.ts';
import { shot } from './shots.ts';

test.use({ viewport: { width: 393, height: 852 } });
const card = (page: Page) => page.locator('#hud-menu-items');
const tiles = (page: Page) => page.locator('[data-menu-tile]');
const settings = (page: Page) => page.locator('[data-hud-settings]');
const howOf = (name: string) => (name.startsWith('webkit') ? 'tap' : 'click') as 'tap' | 'click';

async function open(page: Page, q = '') {
  await page.goto(`?demo&date=2026-11-04T12:00${q}`);
  await islandUp(page);
}
const folded = async (page: Page) => {
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(card(page)).toBeHidden();
  for (const p of await tiles(page).all()) await expect(p).toBeHidden();
};
/** The demo's grid (no ボット: demo mode has none), row by row. */
const NAMES = ['やること', '英語', 'ベル', '旅行', '地図', '登山', '結婚式', '設定'];
const IDS = ['todo', 'english', 'bells', 'travel', 'places', 'hiking', 'wedding', 'settings'];
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

test('folded by default; the leaf drops the grid (3 rows, labelled, 44px+ tiles on screen) and folds it again; a tap elsewhere and Esc fold it too', async ({ page }) => {
  await open(page);
  await folded(page);
  // the HUD's order: the dumbbell, the leaf (a 44px target, at the screen's side, in their row)
  const m = (await hudMenu(page).boundingBox())!, h = (await page.locator('.hud-health').boundingBox())!;
  expect(m.width).toBeGreaterThanOrEqual(44);
  expect(m.height).toBeGreaterThanOrEqual(44);
  expect(h.x + h.width).toBeLessThanOrEqual(m.x);
  expect(Math.abs(393 - m.x - m.width - 14)).toBeLessThan(1.5);
  expect(Math.abs(m.y + m.height / 2 - (h.y + h.height / 2))).toBeLessThan(2);
  await hudMenu(page).click();
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'true');
  await unfoldMenu(page);
  // the rows' labels, then the tiles in one fixed order, each named in kanji (no ずかん: 設定's; no かいがら: the shop)
  await expect(card(page).locator('.grp')).toHaveText(['毎日', 'お出かけ', 'ほか']);
  await expect(card(page).getByRole('group')).toHaveCount(3);
  await expect(card(page).getByRole('group', { name: 'お出かけ' }).getByRole('button')).toHaveCount(3);
  expect(await tiles(page).evaluateAll((ts) => ts.map((t) => t.getAttribute('data-menu-tile')))).toEqual(IDS);
  await expect(tiles(page).locator('.lbl')).toHaveText(NAMES);
  await expect(page.locator('[data-hud-zukan], [data-hud-shells], [data-hud-bots]')).toHaveCount(0);
  // ベル: its number under its name (the label says the balance); every tile a drawn icon, no sprite
  const bells = Number(await hudBells(page).getAttribute('data-bells'));
  await expect(hudBells(page).locator('.num')).toHaveText(bells.toLocaleString('en-US'));
  await expect(tiles(page).locator('.ic svg')).toHaveCount(8);
  await expect(tiles(page).locator('img')).toHaveCount(0);
  // the card: under the leaf, 12px in from both sides; the tiles 3 a row, each ≥ 44px, inside it
  const c = (await card(page).boundingBox())!;
  expect(c.y).toBeGreaterThan(m.y + m.height);
  expect(Math.abs(c.x - 12)).toBeLessThan(1.5);
  expect(Math.abs(393 - c.x - c.width - 12)).toBeLessThan(1.5);
  const boxes = await Promise.all((await tiles(page).all()).map(async (p) => (await p.boundingBox())!));
  for (const [i, b] of boxes.entries()) {
    expect(b.height, IDS[i]).toBeGreaterThanOrEqual(44);
    expect(b.width, IDS[i]).toBeGreaterThanOrEqual(44);
    expect(b.x).toBeGreaterThanOrEqual(c.x);
    expect(b.x + b.width).toBeLessThanOrEqual(c.x + c.width + 0.5);
    expect(b.y + b.height).toBeLessThanOrEqual(c.y + c.height + 0.5);
  }
  for (const r of [[0, 1, 2], [3, 4, 5]]) {
    expect(Math.abs(boxes[r[0]].y - boxes[r[2]].y)).toBeLessThan(1);
    expect(boxes[r[1]].x).toBeGreaterThan(boxes[r[0]].x + boxes[r[0]].width - 1);
  }
  expect(boxes[3].y).toBeGreaterThan(boxes[0].y + boxes[0].height);
  // no todo count on やること (the HUD's todo disc has it)
  await expect(page.locator('[data-hud-todo] .badge')).toHaveCount(0);
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
  // ベル: the menu folds, the panel opens (ごほうび: no tabs, no せってい)
  await hudMenu(page).click();
  await expect(hudBells(page)).toHaveAttribute('aria-expanded', 'false');
  await hudBells(page).click();
  await expect(page.locator('dialog[open] [data-wallet]')).toBeVisible();
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('ごほうび');
  await expect(page.locator('dialog[open] [data-tab]')).toHaveCount(0);
  await expect(hudBells(page)).toHaveAttribute('aria-expanded', 'true');
  await folded(page);
});

test('one tap on each tile opens its sheet and folds the menu', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await open(page);
  await unfoldMenu(page, how);
  await shot(page, `menu-open-${info.project.name}`);
  for (const id of IDS as ('todo' | 'english' | 'bells' | 'travel' | 'places' | 'hiking' | 'wedding' | 'settings')[]) {
    await fromMenu(page, id, how);
    await folded(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }
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

test('the guest sees the same grid: ベル shows its own wallet, 0, and opens ごほうび as a member’s, every reward out of reach', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await open(page, '&as=G');
  await unfoldMenu(page, how);
  await expect(card(page).locator('.grp')).toHaveText(['毎日', 'お出かけ', 'ほか']);
  await expect(tiles(page).locator('.lbl')).toHaveText(NAMES);
  await expect(hudBells(page).locator('.num')).toHaveText('0');
  await shot(page, `menu-guest-${info.project.name}`);
  await fromMenu(page, 'bells', how);
  const dlg = page.locator('dialog[open]');
  await expect(dlg.locator('[data-item]')).toHaveCount(2);
  for (const item of await dlg.locator('[data-item]').all()) await expect(item).toHaveAttribute('aria-disabled', 'true');
});

test('at night the card stays the day’s cream and every label reads (3:1+); 英語’s dot while today’s study isn’t done', async ({ page }, info) => {
  await page.goto('?demo&date=2026-11-04T22:00');
  await islandUp(page);
  await expect(page.locator('html')).toHaveAttribute('data-tod', 'night');
  await unfoldMenu(page, howOf(info.project.name));
  await expect(card(page)).toHaveCSS('background-color', 'rgb(255, 249, 227)');
  expect((await lowContrast(page, { root: '#hud-menu-items' })).map((l) => `${l.ratio}:1 “${l.text}” ${l.sel}`)).toEqual([]);
  await expect(page.locator('[data-hud-english] [data-hud-english-dot]')).toBeVisible();
  await shot(page, `menu-night-${info.project.name}`);
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
// switch, turn English with it; the menu's own names too.
test('English after a sheet’s strings came in Japanese: its strings English too', async ({ page }) => {
  await open(page);
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
  await page.keyboard.press('Escape');
  await unfoldMenu(page);
  await expect(card(page).locator('.grp')).toHaveText(['Daily', 'Going out', 'More']);
});

test('no text selection or iOS callout on the menu, the HUD, the island and the sheets (fields still select); the coins’ landing is ベル’s number while open', async ({ page, browserName }) => {
  await open(page);
  await unfoldMenu(page);
  const style = (sel: string) => page.locator(sel).first().evaluate((el) => ((s) => [s.webkitUserSelect || s.userSelect, (s as unknown as Record<string, string>).webkitTouchCallout ?? 'none'])(getComputedStyle(el)));
  for (const sel of ['[data-hud-english] .lbl', '[data-hud-bells] .num', '.grp', '.hud-health', '.scene', '.scene canvas']) expect((await style(sel))[0], sel).toBe('none');
  if (browserName === 'webkit') for (const sel of ['.scene', '.scene canvas', '[data-hud-bells]', '[data-hud-travel]']) expect((await style(sel))[1], sel).toBe('none');
  // (HudCoins' target: the open menu's ベル number, inside its tile)
  const [num, tile] = [await page.locator('.ribbon-wrap .hud-menu.open [data-hud-bells] .num').boundingBox(), (await hudBells(page).boundingBox())!];
  expect(num!.y).toBeGreaterThan(tile.y);
  expect(num!.y + num!.height).toBeLessThanOrEqual(tile.y + tile.height);
  await page.keyboard.press('Escape');
  await fromMenu(page, 'settings');
  expect((await style('dialog[open] .sec-label'))[0]).toBe('none');
  await page.keyboard.press('Escape');
  await page.locator('[data-say-open]').click();
  const write = page.locator('[data-say-write]');
  if (await write.isVisible()) await write.click();
  const field = page.locator('[data-say-field]');
  expect((await style('[data-say-field]'))[0]).toBe('text');
  await field.fill('こんにちは');
  await field.selectText();
  expect(await field.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd])).toEqual([0, 5]);
});
