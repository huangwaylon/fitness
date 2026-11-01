// My villager's phrases (docs/design.md "Villager taps"): a tap on my villager squishes it and opens the picker by it
// (six presets, my own last few, じぶんで かく…); a pick shows the phrase in a balloon over it for ~4 s (and on the
// partner's phone: e2e/sync-harness.spec.ts). The picker never walks anyone, never sits under the HUD, closes on ✕, Esc
// or a tap elsewhere. Own text is capped at 20 characters and cleaned; it's shown as text. No ベル.
//   SHOTS=<dir> npm run e2e -- say      also writes iPhone-sized screenshots to <dir>/say-*.png
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
const picker = (page: Page) => page.getByRole('dialog', { name: 'なにを いう？' });
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

async function open(page: Page, at = '2026-11-04T12:00') {
  await page.goto(`?demo&date=${at}&critter=none`);
  await expect(ribbon(page)).toBeVisible();
  await expect(mine(page)).toBeEnabled();
  await page.waitForTimeout(2600); // the opening beats are over
}

/** The picker's box clear of the HUD (the ribbon, the jar) and inside the screen. */
const clearOfHud = (page: Page) =>
  page.evaluate(() => {
    const p = document.querySelector('[data-say-picker]')!.getBoundingClientRect();
    const hud = [...document.querySelectorAll('.hud button, .ribbon, .hud-jar')].map((e) => e.getBoundingClientRect()).filter((r) => r.width);
    const over = hud.some((r) => p.left < r.right && r.left < p.right && p.top < r.bottom && r.top < p.bottom);
    return !over && p.left >= 0 && p.right <= innerWidth && p.top >= 0 && p.bottom <= innerHeight;
  });

test('a tap on my villager: its squish and the picker by it; a preset shows in its balloon for a few seconds', async ({ page }) => {
  await open(page);
  const bells = await ribbon(page).getAttribute('aria-label');
  const home = await feet(page);
  await mine(page).click();
  await expect(page.locator('[data-actor="mine"] .body[data-act="squish"]')).toBeAttached();
  await expect(picker(page)).toBeVisible();
  await expect(mine(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(picker(page).locator('[data-say-preset]')).toHaveText(['やっほー！', 'おつかれさま！', 'がんばろう！', 'やったね！', 'いっしょに あるこう！', 'おやすみ〜']);
  expect(await clearOfHud(page)).toBe(true);
  await page.waitForTimeout(300); // its pop-in is over
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
  await mine(page).click();
  await picker(page).getByRole('button', { name: 'やっほー！' }).click();
  await expect(balloon(page)).toHaveCount(1);
  await expect(balloon(page)).toHaveText(/やっほー！/);
  // gone after ~4 s
  await expect(balloon(page)).toHaveCount(0, { timeout: 5500 });
  expect(await feet(page)).toEqual(home); // nobody walked
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
});

test('the picker closes on ✕, Esc and a tap elsewhere (which walks nobody); a tap on my villager again only closes it', async ({ page }) => {
  await open(page);
  const home = await feet(page);
  await mine(page).click();
  await picker(page).getByRole('button', { name: 'とじる' }).click();
  await expect(picker(page)).toHaveCount(0);
  await mine(page).click();
  await page.keyboard.press('Escape');
  await expect(picker(page)).toHaveCount(0);
  await mine(page).click();
  // open lawn
  const [x, y] = await page.evaluate(() => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(240, 380));
  await page.mouse.click(x, y);
  await expect(picker(page)).toHaveCount(0);
  await expect(page.locator('[data-ring="mine"]')).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(await feet(page)).toEqual(home);
  await mine(page).click();
  await expect(picker(page)).toBeVisible();
  await mine(page).click();
  await expect(picker(page)).toHaveCount(0);
  await expect(balloon(page)).toHaveCount(0);
});

test('my own words: at most 20, cleaned, shown as text, Enter sends, kept as a quick pick', async ({ page }) => {
  await open(page);
  await mine(page).click();
  await picker(page).getByRole('button', { name: 'じぶんで かく…' }).click();
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
  await mine(page).click();
  await expect(picker(page).locator('[data-say-recent]')).toHaveText(['<b>ジム</b>いく！']);
  await picker(page).locator('[data-say-recent]').click();
  await expect(balloon(page).locator('.text')).toHaveText('<b>ジム</b>いく！');
  expect(await page.evaluate(() => localStorage.getItem('island.says'))).toBe(JSON.stringify(['<b>ジム</b>いく！']));
});

test('at night: the picker and the balloon in their cream, over the night tint', async ({ page }) => {
  await open(page, '2026-11-04T22:00');
  await mine(page).click();
  await expect(picker(page)).toBeVisible();
  const bg = await picker(page).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(255, 249, 227)');
  await shot(page, 'picker-night');
  await picker(page).getByRole('button', { name: 'おやすみ〜' }).click();
  await expect(balloon(page)).toBeVisible();
  // over the tint (the stage's layers: the balloons' above it), not tinted itself
  const z = await page.evaluate(() => ({
    says: Number(getComputedStyle(document.querySelector('.says')!).zIndex),
    tint: Math.max(...[...document.querySelectorAll('.stage > .tint')].map((e) => Number(getComputedStyle(e).zIndex) || 0)),
    filter: getComputedStyle(document.querySelector('[data-say="mine"]')!).filter
  }));
  expect(z.says).toBeGreaterThan(z.tint);
  expect(z.filter).toBe('none');
  await shot(page, 'balloon-night');
});
