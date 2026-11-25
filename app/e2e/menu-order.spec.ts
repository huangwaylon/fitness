// The leaf menu's own edit mode (docs/design.md "Island" Menu; `pref menuOrder`, `pref menuHidden`): a pill held
// 500 ms enters it (that pill never opens; a plain tap opens at once), the same finger drags it; in it a drag moves a
// pill (ベル too), a tap hides (⊖) or shows (⊕) it, ベル can't be hidden, 設定 stays put and can't be hidden; 元に戻す
// resets both (取り消す on its banner); the coins land on ベル wherever it sits; 完了, a tap outside or Esc leave it; ↑ / ↓ on a focused pill move it; 設定's メニュー row opens it; the
// order and the hidden pills survive a reload; the guest keeps its own. No text is ever selected by a long press.
// The finger: Chromium's a real touch (CDP Input.dispatchTouchEvent: touch-action, the long-press gesture, click and
// all), WebKit's touch pointer events sent in the page (Playwright has no touch drag there; a click after a lift that
// didn't move, as iOS sends). The hold is a real one: each step waits for edit mode, not a fixed time. Shots: SHOTS=<dir>.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu, hudMenu, unfoldMenu } from './hud.ts';

const VIEW = { width: 393, height: 659 };
test.use({ viewport: VIEW });
const Q = '?demo&date=2026-11-04T12:00';
const DEFAULT = ['bells', 'travel', 'wedding', 'hiking', 'places', 'english', 'todo', 'settings'];
const items = (page: Page) => page.locator('#hud-menu-items');
const pill = (page: Page, id: string) => page.locator(`[data-hud-${id}]`);

/** The menu's pills, by their data-hud-* attribute, top to bottom (unfolded, then folded again). */
async function pills(page: Page): Promise<string[]> {
  await unfoldMenu(page);
  const ids = await order(page);
  await page.keyboard.press('Escape');
  return ids;
}
const order = (page: Page) => page.locator('#hud-menu-items > button').evaluateAll((bs) => bs.map((b) => b.getAttributeNames().find((a) => a.startsWith('data-hud-'))!.slice(9)));
const editing = (page: Page) => expect(items(page)).toHaveAttribute('data-menu-editing', 'true');

/** One finger: down, moves, up. */
async function finger(page: Page, x: number, y: number) {
  if (page.context().browser()?.browserType().name() === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    const at = (x: number, y: number) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(x, y) });
    return {
      move: (x2: number, y2: number) => cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(x2, y2) }),
      up: async () => {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await cdp.detach();
      }
    };
  }
  // (the target kept, as a captured pointer's; a click after a lift within the tap's slop)
  await page.evaluate(([x, y]) => {
    const w = window as unknown as { __f: { el: Element; x: number; y: number; far: boolean } };
    const el = document.elementFromPoint(x, y)!;
    w.__f = { el, x, y, far: false };
    el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 31, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, button: 0, buttons: 1, bubbles: true, cancelable: true, composed: true }));
  }, [x, y]);
  const ev = (type: string, x2?: number, y2?: number) => page.evaluate(([type, x2, y2]) => {
    const f = (window as unknown as { __f: { el: Element; x: number; y: number; far: boolean; lx?: number; ly?: number } }).__f;
    const cx = (x2 as number | undefined) ?? f.lx ?? f.x, cy = (y2 as number | undefined) ?? f.ly ?? f.y;
    f.lx = cx;
    f.ly = cy;
    if (Math.hypot(cx - f.x, cy - f.y) > 10) f.far = true;
    f.el.dispatchEvent(new PointerEvent(type as string, { pointerId: 31, pointerType: 'touch', isPrimary: true, clientX: cx, clientY: cy, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true, composed: true }));
    if (type === 'pointerup' && !f.far) (f.el.closest('button') as HTMLElement | null)?.click();
  }, [type, x2, y2] as const);
  return { move: (x2: number, y2: number) => ev('pointermove', x2, y2), up: () => ev('pointerup') };
}

const centre = async (page: Page, id: string) => ((b) => [b.x + b.width / 2, b.y + b.height / 2] as const)((await pill(page, id).boundingBox())!);
const pitch = async (page: Page) => {
  const [a, b] = await page.locator('[data-menu-pill]').evaluateAll((ps) => ps.slice(0, 2).map((p) => p.getBoundingClientRect().top));
  return b - a;
};

/** A long press on `id` (the menu unfolded): held till edit mode is on, then lifted. */
async function longPress(page: Page, id: string) {
  const f = await finger(page, ...(await centre(page, id)));
  await editing(page);
  await f.up();
}
/** `id` dragged by `by` places (up < 0), in steps; `hold`: the long press first, in the same gesture. */
async function drag(page: Page, id: string, by: number, hold = false) {
  const [x, y] = await centre(page, id);
  const f = await finger(page, x, y);
  if (hold) await editing(page);
  // (the pill's lift waits a frame for the layout: a few small moves before the real ones)
  const p = hold ? 54 : await pitch(page);
  for (let i = 1; i <= 10; i++) await f.move(x, y + (by * p * i) / 10);
  await f.up();
}
/** A tap on `id` while editing, once the pills stepping aside after a drag have settled (CI's tap after a drag hit a
 *  moving pill). */
async function tap(page: Page, id: string) {
  // (the step-aside's own state: its translate back to none; not its box, which the jiggle's rotation moves)
  await expect.poll(() => pill(page, id).evaluate((el) => getComputedStyle(el).translate)).toBe('none');
  // (a click, forced: a jiggling pill is never "stable"; not a CDP touch, which a loaded runner can hold past
  // Chromium's own long press, and then no click comes)
  await pill(page, id).click({ force: true });
}
async function done(page: Page) {
  await page.locator('[data-menu-done]').click();
  await expect(items(page)).not.toHaveAttribute('data-menu-editing');
}

test('a long press enters edit mode without opening the pill; a plain tap opens it at once', async ({ page }) => {
  await page.goto(Q);
  await islandUp(page);
  for (const id of ['english', 'settings', 'bells']) {
    await unfoldMenu(page);
    await longPress(page, id);
    // nothing opened, the menu still out; nothing selected
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'true');
    expect(await page.evaluate(() => getSelection()?.toString() ?? '')).toBe('');
    // the movable pills jiggle (ベル too), each with a ⊖ but ベル; 設定 holds still, no ⊖
    await expect(page.locator('[data-menu-pill] .badge')).toHaveCount(6);
    await expect(pill(page, 'settings').locator('.badge')).toHaveCount(0);
    await expect(pill(page, 'bells').locator('.badge')).toHaveCount(0);
    for (const p of ['english', 'bells']) expect(await pill(page, p).evaluate((el) => getComputedStyle(el).animationName), p).toContain('jiggle');
    expect(await pill(page, 'settings').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    // a tap on 設定 or ベル while editing opens and hides nothing
    await tap(page, 'settings');
    await tap(page, 'bells');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.locator('[data-menu-hidden]')).toHaveCount(0);
    await done(page);
    await expect(page.locator('[data-menu-pill] .badge')).toHaveCount(0);
    await page.keyboard.press('Escape');
  }
  // a plain tap: the pick runs in the tap's own click (the menu folds in it, no timer first), its sheet opens
  await unfoldMenu(page);
  const [x, y] = await centre(page, 'english');
  await page.evaluate(() => {
    const w = window as unknown as { __folded: boolean | null };
    w.__folded = null;
    // (bubbling to the window: after the pill's own handler; its state flushed in the microtask it queued, before this
    // one: folded in the tap's own task, no timer first)
    addEventListener('click', () => queueMicrotask(() => (w.__folded = document.querySelector('[data-hud-menu]')?.getAttribute('aria-expanded') === 'false')), { once: true });
  });
  const f = await finger(page, x, y);
  await f.up();
  await expect(page.locator('dialog[open] [data-english]')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __folded: boolean }).__folded)).toBe(true);
  await expect(items(page)).not.toHaveAttribute('data-menu-editing');
});

test('a drag moves a pill, a hold-then-drag too; after a reload too; 元に戻す resets order and hidden, 取り消す takes it back', async ({ page }) => {
  await page.goto(Q);
  await islandUp(page);
  expect(await pills(page)).toEqual(DEFAULT);
  await unfoldMenu(page);
  // (the pills' layout boxes, untouched by the jiggle's rotation and a drag's translate)
  const boxes = () => page.locator('#hud-menu-items > button').evaluateAll((bs) => bs.map((b) => `${(b as HTMLElement).offsetLeft}:${(b as HTMLElement).offsetWidth}`));
  const before = await boxes();
  // held and dragged in one gesture: 英語 four places up, first among the movable pills
  await drag(page, 'english', -4, true);
  await expect.poll(() => order(page)).toEqual(['bells', 'english', 'travel', 'wedding', 'hiking', 'places', 'todo', 'settings']);
  // 元に戻す's row under 設定 never widens the column: every pill keeps its place and width through the edit
  await expect(page.locator('[data-menu-reset]')).toBeVisible();
  expect(await boxes()).toEqual(before);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // in edit mode a drag past the top goes first (above ベル), past the bottom stays above 設定
  await drag(page, 'hiking', -9);
  await expect.poll(() => order(page)).toEqual(['hiking', 'bells', 'english', 'travel', 'wedding', 'places', 'todo', 'settings']);
  await drag(page, 'travel', 9);
  await expect.poll(() => order(page)).toEqual(['hiking', 'bells', 'english', 'wedding', 'places', 'todo', 'travel', 'settings']);
  // a drag hides nothing (its click swallowed)
  await expect(page.locator('[data-menu-hidden]')).toHaveCount(0);
  await done(page);
  await page.keyboard.press('Escape');
  const mine = ['hiking', 'bells', 'english', 'wedding', 'places', 'todo', 'travel', 'settings'];
  expect(await pills(page)).toEqual(mine);
  // the pill still opens its sheet at once
  await fromMenu(page, 'hiking');
  await page.keyboard.press('Escape');
  await page.reload();
  await islandUp(page);
  expect(await pills(page)).toEqual(mine);
  // 元に戻す (with one hidden too): the default at once, 取り消す on its banner brings mine back
  await unfoldMenu(page);
  await longPress(page, 'english');
  await tap(page, 'wedding');
  await expect(pill(page, 'wedding')).toHaveAttribute('data-menu-hidden', 'true');
  await page.locator('[data-menu-reset]').click();
  await expect.poll(() => order(page)).toEqual(DEFAULT);
  await expect(page.locator('[data-menu-hidden]')).toHaveCount(0);
  await expect(page.locator('[data-menu-reset]')).toHaveCount(0);
  await page.getByRole('button', { name: '取り消す' }).click();
  await expect.poll(() => order(page)).toEqual(mine);
  await expect(pill(page, 'wedding')).toHaveAttribute('data-menu-hidden', 'true');
  // and again, kept this time
  await page.locator('[data-menu-reset]').click();
  await done(page);
  await page.keyboard.press('Escape');
  expect(await pills(page)).toEqual(DEFAULT);
});

test('⊖ hides a pill (dimmed in edit mode only), ⊕ shows it again; 設定 can never be hidden; after a reload too', async ({ page }) => {
  await page.goto(Q);
  await islandUp(page);
  await unfoldMenu(page);
  await longPress(page, 'travel');
  await tap(page, 'travel');
  await tap(page, 'english');
  await expect(page.locator('[data-menu-hidden]')).toHaveCount(2);
  await expect(pill(page, 'travel')).toHaveAttribute('aria-label', '旅行を表示');
  expect(Number(await pill(page, 'travel').locator('.lbl').evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(0.7);
  // 設定 and ベル: no ⊖, a tap changes nothing
  await tap(page, 'settings');
  await tap(page, 'bells');
  await expect(page.locator('[data-menu-hidden]')).toHaveCount(2);
  await expect(pill(page, 'settings')).toBeVisible();
  await expect(pill(page, 'settings')).toHaveAttribute('aria-disabled', 'true');
  await expect(pill(page, 'bells')).not.toHaveAttribute('aria-disabled');
  await done(page);
  // out of edit mode the hidden ones are gone; 設定 last
  expect(await order(page)).toEqual(['bells', 'wedding', 'hiking', 'places', 'todo', 'settings']);
  await page.keyboard.press('Escape');
  await page.reload();
  await islandUp(page);
  expect(await pills(page)).toEqual(['bells', 'wedding', 'hiking', 'places', 'todo', 'settings']);
  // in edit mode they show again, where they were; ⊕ brings one back
  await unfoldMenu(page);
  await longPress(page, 'hiking');
  expect(await order(page)).toEqual(DEFAULT);
  await tap(page, 'travel');
  await done(page);
  expect(await order(page)).toEqual(['bells', 'travel', 'wedding', 'hiking', 'places', 'todo', 'settings']);
  // every movable one hidden: ベル and 設定 stay
  await longPress(page, 'travel');
  for (const id of ['travel', 'wedding', 'hiking', 'places', 'todo']) await tap(page, id);
  await done(page);
  expect(await order(page)).toEqual(['bells', 'settings']);
});

test('a tap outside or Esc leaves edit mode, the menu still out; ↑ / ↓ move a focused pill; 設定\'s メニュー row opens edit mode', async ({ page }) => {
  await page.goto(Q);
  await islandUp(page);
  await unfoldMenu(page);
  await longPress(page, 'wedding');
  await page.mouse.click(40, 600);
  await expect(items(page)).not.toHaveAttribute('data-menu-editing');
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  // the keyboard in edit mode (entered by the long press: 設定 has no menu row since 2026-11-20)
  await unfoldMenu(page);
  await longPress(page, 'wedding');
  await editing(page);
  await pill(page, 'travel').focus();
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => order(page)).toEqual(['bells', 'wedding', 'travel', 'hiking', 'places', 'english', 'todo', 'settings']);
  await expect(pill(page, 'travel')).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect.poll(() => order(page)).toEqual(DEFAULT);
  await page.keyboard.press('ArrowUp'); // above ベル
  await page.keyboard.press('ArrowUp'); // at the top: stays
  await expect.poll(() => order(page)).toEqual(['travel', 'bells', 'wedding', 'hiking', 'places', 'english', 'todo', 'settings']);
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => order(page)).toEqual(DEFAULT);
  // Enter on a focused pill: ⊖
  await page.keyboard.press('Enter');
  await expect(pill(page, 'travel')).toHaveAttribute('data-menu-hidden', 'true');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-menu-hidden]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(items(page)).not.toHaveAttribute('data-menu-editing');
  // the leaf folds it (out of edit mode too)
  await longPress(page, 'english');
  await hudMenu(page).click();
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'false');
  await unfoldMenu(page);
  await expect(items(page)).not.toHaveAttribute('data-menu-editing');
});

test('the guest keeps an order and hidden pills of its own', async ({ page }) => {
  // (one page, the member's island and then the guest's: the two phones share the demo's record, as the members and
  // the guest share the relay's; one page, not two: a page behind another gets no frames, and a click on it waits)
  await page.goto(Q);
  await islandUp(page);
  await unfoldMenu(page);
  await longPress(page, 'wedding');
  await drag(page, 'wedding', 2);
  await tap(page, 'travel');
  await done(page);
  // (the hide lands a frame after the tap: polled)
  await expect.poll(() => order(page)).toEqual(['bells', 'hiking', 'places', 'wedding', 'english', 'todo', 'settings']);
  await page.goto(`${Q}&as=G`);
  await islandUp(page);
  expect(await pills(page)).toEqual(DEFAULT);
  await unfoldMenu(page);
  await longPress(page, 'english');
  await drag(page, 'english', -1);
  await tap(page, 'hiking');
  await done(page);
  await page.goto(Q);
  await islandUp(page);
  expect(await pills(page)).toEqual(['bells', 'hiking', 'places', 'wedding', 'english', 'todo', 'settings']);
  await page.goto(`${Q}&as=G`);
  await islandUp(page);
  expect(await pills(page)).toEqual(['bells', 'travel', 'wedding', 'english', 'places', 'todo', 'settings']);
});

test('ベル moves like the others, never hides; its place survives a reload and still opens ごほうび; the guest has its own', async ({ page }) => {
  await page.goto(Q);
  await islandUp(page);
  await unfoldMenu(page);
  // held and dragged in one gesture: ベル three places down
  await drag(page, 'bells', 3, true);
  const mine = ['travel', 'wedding', 'hiking', 'bells', 'places', 'english', 'todo', 'settings'];
  await expect.poll(() => order(page)).toEqual(mine);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // a tap on it while editing hides nothing (no ⊖); its name is just ベル there
  await tap(page, 'bells');
  await expect(page.locator('[data-menu-hidden]')).toHaveCount(0);
  await expect(pill(page, 'bells')).toHaveAttribute('aria-label', 'ベル');
  await done(page);
  await page.keyboard.press('Escape');
  await page.reload();
  await islandUp(page);
  expect(await pills(page)).toEqual(mine);
  // still the wallet: its number, and a tap opens ごほうび
  await expect(pill(page, 'bells')).toHaveAttribute('aria-label', /^ごほうび · ベル /);
  await fromMenu(page, 'bells');
  await page.keyboard.press('Escape');
  // the guest's own: the default, ベル first
  await page.goto(`${Q}&as=G`);
  await islandUp(page);
  expect(await pills(page)).toEqual(DEFAULT);
  await unfoldMenu(page);
  await drag(page, 'bells', 1, true);
  await done(page);
  await page.goto(Q);
  await islandUp(page);
  expect(await pills(page)).toEqual(mine);
  await page.goto(`${Q}&as=G`);
  await islandUp(page);
  expect(await pills(page)).toEqual(['travel', 'bells', 'wedding', 'hiking', 'places', 'english', 'todo', 'settings']);
});

test('the coins land on ベル where it sits: moved down the open menu, they fly to its number there', async ({ page }) => {
  // (22:00: three goals met; a fresh phone flies them into the leaf first)
  await page.goto('?demo&date=2026-10-28T22:00');
  await islandUp(page);
  await expect(page.locator('[data-coin-flow]')).toHaveCount(0, { timeout: 8000 });
  await unfoldMenu(page);
  await drag(page, 'bells', 3, true);
  await expect.poll(() => order(page)).toEqual(['travel', 'wedding', 'hiking', 'bells', 'places', 'english', 'todo', 'settings']);
  await done(page);
  // today's coins unseen again, then a change of the record (a pill hidden) with the menu open: they fly in again
  await page.evaluate(() => {
    localStorage.removeItem('bells-seen');
    // (each catch squash on ベル's number, as it happens: it lasts 260 ms)
    const num = document.querySelector('[data-hud-bells] .num')!, w = window as unknown as { __caught: number };
    w.__caught = 0;
    new MutationObserver(() => void (num.classList.contains('catch') && w.__caught++)).observe(num, { attributes: true, attributeFilter: ['class'] });
  });
  await longPress(page, 'english');
  await tap(page, 'english');
  await done(page);
  const coin = page.locator('[data-coin-flow] .cx').first();
  await expect(coin).toBeAttached({ timeout: 8000 });
  // where its last frame sits (its flight's two animations at their end, paused there a moment)
  const end = await coin.evaluate((cx) => {
    const anims = cx.getAnimations({ subtree: true }).filter((a) => /cf-[xy]$/.test((a as CSSAnimation).animationName));
    for (const a of anims) {
      a.pause();
      a.currentTime = Number(a.effect!.getComputedTiming().endTime) - 1;
    }
    const r = cx.querySelector('.cy')!.getBoundingClientRect();
    for (const a of anims) a.play();
    return [r.x + r.width / 2, r.y + r.height / 2];
  });
  const num = (await pill(page, 'bells').locator('.num').boundingBox())!;
  const leaf = (await page.locator('.hud-menu .leaf').boundingBox())!;
  expect(Math.abs(end[0] - (num.x + num.width / 2)), 'x').toBeLessThan(8);
  expect(Math.abs(end[1] - (num.y + num.height / 2)), 'y').toBeLessThan(8);
  // (well below the leaf and ベル's old first place)
  expect(end[1] - (leaf.y + leaf.height)).toBeGreaterThan(3 * 44);
  // and it squashes there as they land
  await expect.poll(() => page.evaluate(() => (window as unknown as { __caught: number }).__caught), { timeout: 8000 }).toBeGreaterThan(0);
});

test('no text selection or iOS callout: the menu, the HUD, the island and the sheets; fields still select', async ({ page, browserName }) => {
  await page.goto(Q);
  await islandUp(page);
  await unfoldMenu(page);
  const style = (sel: string) => page.locator(sel).first().evaluate((el) => ((s) => [s.webkitUserSelect || s.userSelect, (s as unknown as Record<string, string>).webkitTouchCallout ?? 'none'])(getComputedStyle(el)));
  for (const sel of ['[data-hud-english] .lbl', '[data-hud-bells] .num', '.hud-health', '.scene', '.scene canvas']) expect((await style(sel))[0], sel).toBe('none');
  // the island and the HUD: no callout either (WebKit's -webkit-touch-callout; the canvas's touches are the world's,
  // so its long press has nothing to wait on: its style is the check)
  if (browserName === 'webkit') for (const sel of ['.scene', '.scene canvas', '[data-hud-bells]']) expect((await style(sel))[1], sel).toBe('none');
  // a long press on two pills selects nothing (Chromium: a real touch, held till edit mode is on)
  for (const id of ['bells', 'hiking']) {
    const f = await finger(page, ...(await centre(page, id)));
    await editing(page);
    await f.up();
    expect(await page.evaluate(() => getSelection()?.toString() ?? ''), id).toBe('');
    await done(page);
  }
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  // a sheet's text doesn't select; a field does (its caret, a selection in it, typing)
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
  await field.evaluate((el: HTMLInputElement) => el.setSelectionRange(5, 5));
  await field.pressSequentially('!');
  await expect(field).toHaveValue('こんにちは!');
});

test('shots: the menu and its edit mode, day and night', async ({ page }) => {
  test.skip(!process.env.SHOTS, 'SHOTS=<dir> only');
  for (const [tod, q] of [['day', Q], ['night', '?demo&date=2026-11-04T22:00']] as const) {
    await page.goto(q);
    await islandUp(page);
    await unfoldMenu(page);
    await page.screenshot({ path: `${process.env.SHOTS}/menu-${tod}.png` });
    await longPress(page, 'english');
    await tap(page, 'hiking');
    await drag(page, 'bells', 2);
    await page.screenshot({ path: `${process.env.SHOTS}/edit-${tod}.png` });
    await done(page);
    await page.screenshot({ path: `${process.env.SHOTS}/menu-bells-moved-${tod}.png` });
    await longPress(page, 'english');
    await page.locator('[data-menu-reset]').click();
    await done(page);
  }
});
