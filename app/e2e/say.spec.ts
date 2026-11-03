// My villager's phrases (docs/design.md "Villager taps"): the say button at the island's bottom right opens the picker
// above it (only my own words: my last four, じぶんで かく…; with none yet, straight on the field); a pick shows the
// phrase in a balloon over my villager for ~4 s
// (and on the partner's phone: e2e/sync-harness.spec.ts). A tap on my villager only squishes it. The picker never
// walks anyone, never sits under the HUD, closes on ✕, Esc or a tap elsewhere; the button hides under a sheet and in
// もようがえ. Own text is capped at 20 characters and cleaned; it's shown as text. No ベル.
//   SHOTS=<dir> npm run e2e -- say      also writes iPhone-sized screenshots to <dir>/say-*.png
import { expect, test, type Page } from '@playwright/test';
import { lawnTap, quiet } from './island.ts';
import { KEYBOARD_PX, aboveKeyboard, fakeKeyboard, keyboard } from './keyboard.ts';
import { fromMenu, hudBells, hudMenu } from './hud.ts';
import { sayOwn } from './say.ts';

test.use({ viewport: { width: 390, height: 844 } });

const picker = (page: Page) => page.getByRole('dialog', { name: 'なにを いう？' });
const sayBtn = (page: Page) => page.getByRole('button', { name: 'ひとこと いう' });
const mine = (page: Page) => page.locator('[data-actor="mine"] .vil');
const balloon = (page: Page) => page.locator('[data-say="mine"]');
const shot = async (page: Page, name: string) => {
  if (process.env.SHOTS) await page.waitForTimeout(350), await page.screenshot({ path: `${process.env.SHOTS}/say-${name}.png` });
};
const feet = (page: Page) =>
  page.locator('[data-actor="mine"]').evaluate((el) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return [Math.round(m.m41), Math.round(m.m42)];
  });

async function open(page: Page, at = '2026-11-04T12:00', said?: string[]) {
  // my own words kept from before (island.says, newest first)
  if (said) await page.addInitScript((s) => localStorage.setItem('island.says', s), JSON.stringify(said));
  await page.goto(`?demo&date=${at}&critter=none`);
  await expect(hudMenu(page)).toBeVisible({ timeout: 15_000 }); // (its first paint: now and then over 5 s under CI's load)
  await expect(mine(page)).toBeEnabled();
  await quiet(page); // the opening beats are over
}

/** The picker's box clear of the HUD (the dumbbell, the bowl, the leaf) and inside the screen. */
const clearOfHud = (page: Page) =>
  page.evaluate(() => {
    const p = document.querySelector('[data-say-picker]')!.getBoundingClientRect();
    const hud = [...document.querySelectorAll('.hud-row button')].map((e) => e.getBoundingClientRect()).filter((r) => r.width);
    const over = hud.some((r) => p.left < r.right && r.left < p.right && p.top < r.bottom && r.top < p.bottom);
    return !over && p.left >= 0 && p.right <= innerWidth && p.top >= 0 && p.bottom <= innerHeight;
  });

test('the say button: small, bottom right, clear of the home indicator; a tap on my villager only squishes it', async ({ page }) => {
  await open(page);
  // a 44px target, a 36px disc drawn, 12px in from the side and the foot
  const r = (await sayBtn(page).boundingBox())!;
  expect([r.width, r.height]).toEqual([44, 44]);
  const disc = await sayBtn(page).evaluate((el) => {
    const s = getComputedStyle(el, '::before');
    return [s.width, s.height];
  });
  expect(disc).toEqual(['36px', '36px']);
  const vw = page.viewportSize()!;
  expect(Math.round(vw.width - (r.x + r.width))).toBe(8);
  expect(vw.height - (r.y + r.height)).toBeGreaterThanOrEqual(16);
  expect(vw.height - (r.y + r.height)).toBeLessThan(80);
  await expect(sayBtn(page)).toHaveAttribute('aria-expanded', 'false');
  // clear of every other control
  const over = await page.evaluate(() => {
    const me = document.querySelector('[data-say-open]')!, a = me.getBoundingClientRect();
    return [...document.querySelectorAll('button')].filter((b) => b !== me && b.checkVisibility()).filter((b) => {
      const o = b.getBoundingClientRect();
      return o.width && a.left < o.right && o.left < a.right && a.top < o.bottom && o.top < a.bottom;
    }).map((b) => b.getAttribute('aria-label') ?? b.className);
  });
  expect(over).toEqual([]);
  // my villager: the squish, no picker
  await mine(page).click();
  await expect(page.locator('[data-actor="mine"] .body[data-act="squish"]')).toBeAttached();
  await page.waitForTimeout(400);
  await expect(page.locator('[data-say-picker]')).toHaveCount(0);
  await expect(mine(page)).not.toHaveAttribute('aria-haspopup');
  await shot(page, 'button-day');
});

test('the say button: the picker above it; a phrase of mine shows in my villager’s balloon for a few seconds', async ({ page }) => {
  await open(page, undefined, ['がんばろう！', 'やっほー！']);
  const bells = await hudBells(page).getAttribute('aria-label');
  const home = await feet(page);
  await sayBtn(page).click();
  await expect(picker(page)).toBeVisible();
  await expect(sayBtn(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(picker(page).locator('[data-say-recent]')).toHaveText(['がんばろう！', 'やっほー！']);
  expect(await clearOfHud(page)).toBe(true);
  await page.waitForTimeout(300); // its pop-in is over
  // above the button, its right edge by the button's
  const p = (await picker(page).boundingBox())!, s = (await sayBtn(page).boundingBox())!;
  expect(p.y + p.height).toBeLessThanOrEqual(s.y);
  expect(p.y + p.height).toBeGreaterThan(s.y - 24);
  expect(Math.abs(p.x + p.width - (s.x + s.width))).toBeLessThanOrEqual(5);
  // every target a thumb’s size
  for (const b of await picker(page).locator('button').all()) {
    const r = (await b.boundingBox())!;
    expect(Math.min(r.width, r.height)).toBeGreaterThanOrEqual(44);
  }
  await shot(page, 'picker-day');
  await picker(page).getByRole('button', { name: 'がんばろう！' }).click();
  await expect(picker(page)).toHaveCount(0);
  await expect(balloon(page)).toHaveText(/がんばろう！/);
  await expect(balloon(page).locator('.who')).toHaveText('ウェイ');
  await expect(page.locator('[data-actor="mine"] .body[data-act="hop"]')).toBeAttached();
  await shot(page, 'balloon-day');
  // by my villager: above it, its tail at it
  const b = (await balloon(page).boundingBox())!, v = (await mine(page).boundingBox())!;
  expect(b.y + b.height).toBeLessThanOrEqual(v.y + 4);
  expect(Math.abs(b.x + b.width / 2 - (v.x + v.width / 2))).toBeLessThan(b.width / 2 + 40);
  // a newer one replaces it
  await sayBtn(page).click();
  await picker(page).getByRole('button', { name: 'やっほー！' }).click();
  await expect(balloon(page)).toHaveCount(1);
  await expect(balloon(page)).toHaveText(/やっほー！/);
  // gone after ~4 s
  await expect(balloon(page)).toHaveCount(0, { timeout: 5500 });
  expect(await feet(page)).toEqual(home); // nobody walked
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
});

test('the picker closes on ✕, Esc and a tap elsewhere (which walks nobody); the button again only closes it', async ({ page }) => {
  await open(page);
  const home = await feet(page), lawn = await lawnTap(page, 240, 380);
  await sayBtn(page).click();
  await picker(page).getByRole('button', { name: 'とじる' }).click();
  await expect(picker(page)).toHaveCount(0);
  await expect(sayBtn(page)).toBeFocused();
  await sayBtn(page).click();
  await page.keyboard.press('Escape');
  await expect(picker(page)).toHaveCount(0);
  await sayBtn(page).click();
  // open lawn (found before the picker was up)
  await page.mouse.click(lawn.x, lawn.y);
  await expect(picker(page)).toHaveCount(0);
  await expect(page.locator('[data-ring="mine"]')).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(await feet(page)).toEqual(home);
  await sayBtn(page).click();
  await expect(picker(page)).toBeVisible();
  await sayBtn(page).click();
  await expect(picker(page)).toHaveCount(0);
  await expect(balloon(page)).toHaveCount(0);
});

test('my own words: at most 20, cleaned, shown as text, Enter sends, kept as a quick pick', async ({ page }) => {
  await open(page);
  await sayBtn(page).click();
  // nothing of mine yet: straight on the field
  const field = picker(page).locator('[data-say-field]');
  await expect(field).toBeFocused();
  // いう does nothing until there's something to say
  await expect(picker(page).locator('[data-say-send]')).toHaveAttribute('aria-disabled', 'true');
  await field.fill('あいうえおかきくけこさしすせそたちつてとなにぬねの');
  await expect(field).toHaveValue('あいうえおかきくけこさしすせそたちつてと');
  await expect(picker(page).locator('.count')).toHaveText('20/20');
  await field.fill('  <b>ジム</b>\u202E\u0007いく！  ');
  await shot(page, 'write');
  await field.press('Enter');
  await expect(picker(page)).toHaveCount(0);
  await expect(balloon(page).locator('.text')).toHaveText('<b>ジム</b>いく！');
  await expect(balloon(page).locator('b:not(.who)')).toHaveCount(0); // text, never markup
  // the next time: a quick pick
  await sayBtn(page).click();
  await expect(picker(page).locator('[data-say-recent]')).toHaveText(['<b>ジム</b>いく！']);
  await picker(page).locator('[data-say-recent]').click();
  await expect(balloon(page).locator('.text')).toHaveText('<b>ジム</b>いく！');
  expect(await page.evaluate(() => localStorage.getItem('island.says'))).toBe(JSON.stringify(['<b>ジム</b>いく！']));
});

test('only my own words: no presets; none yet, the field at once; after five, the newest four, newest first', async ({ page }) => {
  await open(page);
  await sayBtn(page).click();
  await expect(picker(page)).toBeVisible();
  // the user: "get rid of all the default messages. only custom messages"
  await expect(picker(page).locator('[data-say-preset], [data-say-recent]')).toHaveCount(0);
  for (const gone of ['やっほー！', 'おつかれさま！', 'がんばろう！', 'やったね！', 'いっしょに あるこう！', 'おやすみ〜'])
    await expect(picker(page).getByText(gone)).toHaveCount(0);
  // nothing kept yet: straight on the field, no lone button, no もどる
  await expect(picker(page).locator('[data-say-field]')).toBeFocused();
  await expect(picker(page).getByRole('button', { name: 'じぶんで かく…' })).toHaveCount(0);
  await expect(picker(page).getByRole('button', { name: 'もどる' })).toHaveCount(0);
  await shot(page, 'first');
  await page.keyboard.press('Escape');
  for (const w of ['ジム', 'さんぽ', 'ねむい', 'ごはん', 'はしる']) {
    await sayOwn(page, w);
    await expect(balloon(page).locator('.text')).toHaveText(w);
  }
  await sayBtn(page).click();
  await expect(picker(page).locator('[data-say-recent]')).toHaveText(['はしる', 'ごはん', 'ねむい', 'さんぽ']);
  await expect(picker(page).locator('[data-say-field]')).toHaveCount(0);
  await page.waitForTimeout(300); // its pop-in is over
  for (const b of await picker(page).locator('button').all()) {
    const r = (await b.boundingBox())!;
    expect(Math.min(r.width, r.height)).toBeGreaterThanOrEqual(44);
  }
  expect(await clearOfHud(page)).toBe(true);
  await shot(page, 'recent-four');
  // じぶんで かく… and もどる back to them; a quick pick goes first again
  await picker(page).getByRole('button', { name: 'じぶんで かく…' }).click();
  await expect(picker(page).locator('[data-say-field]')).toBeFocused();
  await picker(page).getByRole('button', { name: 'もどる' }).click();
  await picker(page).getByRole('button', { name: 'ねむい' }).click();
  await expect(balloon(page).locator('.text')).toHaveText('ねむい');
  expect(await page.evaluate(() => localStorage.getItem('island.says'))).toBe(JSON.stringify(['ねむい', 'はしる', 'ごはん', 'さんぽ']));
});

test('じぶんで かく: the picker stays above the keyboard as it comes and goes (iOS: the simulated one)', async ({ page }) => {
  await fakeKeyboard(page);
  await open(page);
  await sayBtn(page).click();
  await expect(picker(page).locator('[data-say-field]')).toBeFocused(); // (nothing of mine yet: straight on it)
  await keyboard(page, KEYBOARD_PX);
  await expect.poll(async () => (await aboveKeyboard(page, '[data-say-picker]')).ok).toBe(true);
  expect((await aboveKeyboard(page, '[data-say-picker]')).bottom).toBeLessThanOrEqual(844 - KEYBOARD_PX);
  await shot(page, 'keyboard');
  // gone again: back over the button
  await keyboard(page, 0);
  const btn = (await sayBtn(page).boundingBox())!;
  await expect.poll(async () => (await aboveKeyboard(page, '[data-say-picker]')).bottom).toBeLessThanOrEqual(btn.y);
  expect((await aboveKeyboard(page, '[data-say-picker]')).bottom).toBeGreaterThan(844 - KEYBOARD_PX);
});

test('at night: the picker and the balloon in their cream, over the night tint', async ({ page }) => {
  await open(page, '2026-11-04T22:00', ['おやすみ〜']);
  await sayBtn(page).click();
  await expect(picker(page)).toBeVisible();
  const bg = await picker(page).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(255, 249, 227)');
  await shot(page, 'picker-night');
  await picker(page).getByRole('button', { name: 'おやすみ〜' }).click();
  await expect(balloon(page)).toBeVisible();
  // not tinted itself
  expect(await page.locator('[data-say="mine"]').evaluate((el) => getComputedStyle(el).filter)).toBe('none');
  await shot(page, 'balloon-night');
});

test('the say button hides under the island panel and in もようがえ (its picker with it)', async ({ page }) => {
  await open(page);
  await sayBtn(page).click();
  await expect(picker(page)).toBeVisible();
  // the panel: the leaf's tap closes the picker (a control: it still acts), its ベル row opens the panel over the island
  // (fromMenu waits for the panel itself: its chunk loads on the first open, and an Esc before it is there would leave
  // it opening afterwards, over the HUD, which is how this used to time out on CI)
  await fromMenu(page, 'bells');
  await expect(picker(page)).toHaveCount(0);
  await expect(sayBtn(page)).toHaveCount(0);
  // もようがえ (せってい, the HUD menu's), once the panel is gone and the menu folded
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'false');
  await fromMenu(page, 'settings');
  await page.locator('[data-decor-start]').click();
  // (the old decorations' tray, or on the island's layout its own もようがえ: IslandEdit)
  await expect(page.locator('[data-tray]').first().or(page.locator('[data-island-edit]'))).toBeVisible();
  await expect(sayBtn(page)).toHaveCount(0);
});
