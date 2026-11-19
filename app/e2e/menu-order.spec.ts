// The leaf menu's order, each person's own (docs/design.md "Island" Menu, "Settings"; `pref menuOrder`): 設定 →
// メニュー → 並び順's level drags a pill by its grip, the menu follows at once and after a reload; 元に戻す puts the
// default back (取り消す on its banner); ↑ / ↓ on a grip move it too; the guest keeps an order of its own.
// The drag is a finger: Chromium's a real touch (CDP Input.dispatchTouchEvent: touch-action, pointer capture and all),
// WebKit's touch pointer events sent in the page (Playwright has no touch drag there). Shots: SHOTS=<dir>.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu, unfoldMenu } from './hud.ts';

const VIEW = { width: 393, height: 659 };
test.use({ viewport: VIEW });
const Q = '?demo&date=2026-11-04T12:00';
const DEFAULT = ['bells', 'travel', 'wedding', 'hiking', 'english', 'settings'];

/** The menu's pills, by their data-hud-* attribute, top to bottom (unfolded, then folded again). */
async function pills(page: Page): Promise<string[]> {
  await unfoldMenu(page);
  const ids = await page.locator('#hud-menu-items > button').evaluateAll((bs) => bs.map((b) => b.getAttributeNames().find((a) => a.startsWith('data-hud-') && a !== 'data-hud-bells-each')!.slice(9)));
  await page.keyboard.press('Escape');
  return ids;
}

/** 設定 → メニュー's 変更: the order's level. */
async function level(page: Page) {
  await fromMenu(page, 'settings');
  const go = page.locator('dialog[open] [data-push="menu"]');
  await go.scrollIntoViewIfNeeded();
  await go.click();
  await expect(page.locator('dialog[open] [data-menu-order]')).toBeVisible();
  // (the level's slide in done: a grip's box is where the finger lands)
  await page.locator('dialog[open] [data-menu-page]').evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
}
const rows = (page: Page) => page.locator('dialog[open] [data-menu-row]').evaluateAll((rs) => rs.map((r) => r.getAttribute('data-menu-row')));

/** A finger on `id`'s grip, dragged by `by` rows (up < 0), in steps, then lifted. */
async function drag(page: Page, id: string, by: number) {
  const grip = page.locator(`dialog[open] [data-menu-grip="${id}"]`);
  const b = (await grip.boundingBox())!;
  const pitch = (await page.locator(`dialog[open] [data-menu-row="${id}"]`).boundingBox())!.height;
  const x = b.x + b.width / 2, y0 = b.y + b.height / 2;
  const ys = [...Array(8)].map((_, i) => y0 + (by * pitch * (i + 1)) / 8);
  if (page.context().browser()?.browserType().name() === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    const at = (y: number) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(y0) });
    for (const y of ys) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(y) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
  } else {
    await grip.evaluate((el, { x, y0, ys }) => {
      const ev = (type: string, y: number) => el.dispatchEvent(new PointerEvent(type, { pointerId: 31, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true, composed: true }));
      ev('pointerdown', y0);
      for (const y of ys) ev('pointermove', y);
      ev('pointerup', ys[ys.length - 1]);
    }, { x, y0, ys });
  }
}

test('a drag moves a pill; the menu follows, after a reload too; 元に戻す restores the default, 取り消す takes it back', async ({ page }) => {
  await page.goto(Q);
  await islandUp(page);
  expect(await pills(page)).toEqual(DEFAULT);
  await level(page);
  await expect(page.locator('dialog[open] .navbar h2')).toHaveText('メニューの並び順');
  // ベル first and 設定 last, fixed (no grip); 元に戻す has nothing to do yet
  await expect(page.locator('dialog[open] [data-menu-fixed]')).toHaveText(['ベル', '設定']);
  await expect(page.locator('dialog[open] [data-menu-fixed] [data-menu-grip]')).toHaveCount(0);
  await expect(page.locator('dialog[open] [data-menu-reset]')).toHaveAttribute('aria-disabled', 'true');
  for (const g of await page.locator('dialog[open] [data-menu-grip]').all()) {
    const b = (await g.boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
  // 英語 dragged three rows up: first among them
  await drag(page, 'english', -3);
  await expect.poll(() => rows(page)).toEqual(['english', 'travel', 'wedding', 'hiking']);
  // a drag past the top stays inside the movable rows
  await drag(page, 'hiking', -9);
  await expect.poll(() => rows(page)).toEqual(['hiking', 'english', 'travel', 'wedding']);
  await expect(page.locator('dialog[open] [data-menu-reset]')).not.toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  const mine = ['bells', 'hiking', 'english', 'travel', 'wedding', 'settings'];
  expect(await pills(page)).toEqual(mine);
  // the pill still opens its sheet at once
  await fromMenu(page, 'hiking');
  await page.keyboard.press('Escape');
  await page.reload();
  await islandUp(page);
  expect(await pills(page)).toEqual(mine);
  // 元に戻す: the default at once, 取り消す on its banner brings mine back
  await level(page);
  await page.locator('dialog[open] [data-menu-reset]').click();
  await expect.poll(() => rows(page)).toEqual(['travel', 'wedding', 'hiking', 'english']);
  await expect(page.locator('dialog[open] [data-menu-reset]')).toHaveAttribute('aria-disabled', 'true');
  const undo = page.getByRole('button', { name: '取り消す' });
  await undo.click();
  await expect.poll(() => rows(page)).toEqual(['hiking', 'english', 'travel', 'wedding']);
  // and again, kept this time: the menu is the default one
  await page.locator('dialog[open] [data-menu-reset]').click();
  await page.keyboard.press('Escape');
  expect(await pills(page)).toEqual(DEFAULT);
});

test('↑ / ↓ on a focused grip move its row one place', async ({ page }) => {
  await page.goto(Q);
  await islandUp(page);
  await level(page);
  await page.locator('dialog[open] [data-menu-grip="travel"]').focus();
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => rows(page)).toEqual(['wedding', 'travel', 'hiking', 'english']);
  await expect(page.locator('dialog[open] [data-menu-grip="travel"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp'); // at the top: stays
  await expect.poll(() => rows(page)).toEqual(['travel', 'wedding', 'hiking', 'english']);
});

test('the guest keeps an order of its own', async ({ browser }) => {
  // (one context: the two phones share the demo's record, as the members and the guest share the relay's)
  const ctx = await browser.newContext({ viewport: VIEW });
  const a = await ctx.newPage();
  await a.goto(Q);
  await islandUp(a);
  await level(a);
  await drag(a, 'wedding', 2);
  await expect.poll(() => rows(a)).toEqual(['travel', 'hiking', 'english', 'wedding']);
  const g = await ctx.newPage();
  await g.goto(`${Q}&as=G`);
  await islandUp(g);
  expect(await pills(g)).toEqual(DEFAULT);
  await level(g);
  await drag(g, 'english', -1);
  await expect.poll(() => rows(g)).toEqual(['travel', 'wedding', 'english', 'hiking']);
  await g.keyboard.press('Escape');
  await a.reload();
  await islandUp(a);
  expect(await pills(a)).toEqual(['bells', 'travel', 'hiking', 'english', 'wedding', 'settings']);
  await g.reload();
  await islandUp(g);
  expect(await pills(g)).toEqual(['bells', 'travel', 'wedding', 'english', 'hiking', 'settings']);
  await ctx.close();
});

test('shots: the level and the menu, day and night', async ({ page }) => {
  test.skip(!process.env.SHOTS, 'SHOTS=<dir> only');
  for (const [tod, q] of [['day', Q], ['night', '?demo&date=2026-11-04T22:00']] as const) {
    await page.goto(q);
    await islandUp(page);
    await level(page);
    await drag(page, 'english', -2);
    await expect.poll(() => rows(page)).toEqual(['travel', 'english', 'wedding', 'hiking']);
    await page.screenshot({ path: `${process.env.SHOTS}/level-${tod}.png` });
    await page.keyboard.press('Escape');
    await unfoldMenu(page);
    await page.screenshot({ path: `${process.env.SHOTS}/menu-${tod}.png` });
    await page.keyboard.press('Escape');
    await level(page);
    await page.locator('dialog[open] [data-menu-reset]').click();
    await page.keyboard.press('Escape');
  }
});
