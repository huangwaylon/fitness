// Decorating (docs/design.md "Decorating"): せってい → もようがえ opens the decorate mode; a tray item goes down as a
// ghost on fine ground in the middle of the view, a drag or a tap on the ground moves it (snapped to the half-tile
// grid), its footprint green or red, ✓ places it; a tap on a placed item picks it up to move, turn or put away (with
// とりけす). Both players' tabs show the same layout (the demo's relay, as two phones over the real one), and it stays
// across a reload and for a tab opening later.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

type W = { go(z: number): void; at(x: number, z: number): [number, number]; mine(): [number, number]; idle(): boolean };
const go = (page: Page, z: number) => page.evaluate((z) => (window as unknown as { __world: W }).__world.go(z), z);
const at = (page: Page, x: number, z: number) => page.evaluate(([x, z]) => (window as unknown as { __world: W }).__world.at(x, z), [x, z] as const);
const DATE = '2026-11-04T12:00';

async function open(page: Page, q = '') {
  await page.goto(`?demo&date=${DATE}&critter=none${q}`);
  await expect(page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(2000);
}
async function decorate(page: Page) {
  await page.bringToFront(); // a tab in the back gets no frames
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await page.locator('[data-tab="settings"]').click();
  await page.locator('[data-decor-start]').click();
  await expect(page.locator('[data-tray]')).toHaveCount(10);
  await page.waitForTimeout(400);
}
/** Tap the island's ground at a world point (the mode takes the tap). */
async function tapGround(page: Page, x: number, z: number) {
  const [cx, cy] = await at(page, x, z);
  await page.mouse.click(cx, cy);
  await page.waitForTimeout(150);
}
const ghost = (page: Page) => page.locator('[data-ghost]');
const spot = async (page: Page) => [Number(await ghost(page).getAttribute('data-x')), Number(await ghost(page).getAttribute('data-z'))];

test('place: a tray item goes down on fine ground, a drag and a tap move it on the grid, red over water, ✓ places it', async ({ page }) => {
  await open(page);
  await decorate(page);
  await expect(page.locator('[data-decor-count]')).toHaveText('0/30');
  await page.locator('[data-tray="stone-lantern"]').click();
  await expect(ghost(page)).toHaveCount(1);
  await expect(page.locator('[data-foot]')).toHaveAttribute('data-foot', 'ok');
  const [x0, z0] = await spot(page);
  expect(x0 % 12).toBe(0); // a 2 × 2 item's centre is on a grid line
  // a drag with one finger moves it (the world stays put)
  const b = (await page.locator('[data-ghost] .ghost').boundingBox())!;
  const cam = await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam());
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(b.x + b.width / 2 + i * 8, b.y + b.height / 2 + i * 2);
  await page.mouse.up();
  const [x1] = await spot(page);
  expect(x1).toBeGreaterThan(x0 + 30);
  expect(await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam())).toBe(cam);
  // a tap on the ground puts it there
  await tapGround(page, 300, 456);
  expect(await spot(page)).toEqual([300, 456]);
  await expect(page.locator('[data-foot]')).toHaveAttribute('data-foot', 'ok');
  // turned a quarter
  await page.locator('[data-act="turn"]').click();
  await expect(ghost(page)).toHaveAttribute('data-f', '1');
  // over the pond it's red, and ✓ won't place it
  await go(page, 600);
  await page.waitForTimeout(300);
  await tapGround(page, 74, 772);
  await expect(page.locator('[data-foot]')).toHaveAttribute('data-foot', 'bad');
  await expect(page.locator('[data-act="place"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-why]')).toHaveText('みずの うえには おけません');
  await go(page, 0);
  await page.waitForTimeout(300);
  await tapGround(page, 300, 456);
  await page.locator('[data-act="place"]').click();
  await expect(ghost(page)).toHaveCount(0);
  const placed = page.locator('[data-decor]');
  await expect(placed).toHaveCount(1);
  await expect(placed).toHaveAttribute('data-item', 'stone-lantern');
  await expect(placed).toHaveAttribute('data-x', '300');
  await expect(placed).toHaveAttribute('data-f', '1');
  await expect(page.locator('[data-decor-count]')).toHaveText('1/30');
  // nothing runs when still, in the mode too
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as { __world: W }).__world.idle())).toBe(true);
  // ✓ おわる: the tray goes; a tap on the item jiggles it where it stands (no walk)
  await page.locator('[data-decor-done]').click();
  await expect(page.locator('[data-tray]')).toHaveCount(0);
  const mine = await page.evaluate(() => (window as unknown as { __world: W }).__world.mine());
  await placed.click();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as unknown as { __world: W }).__world.mine())).toEqual(mine);
});

test('move and remove: a tap picks a placed item up, ✓ moves it, 🗑 puts it away and とりけす brings it back', async ({ page }) => {
  await open(page);
  await decorate(page);
  await page.locator('[data-tray="tanuki"]').click();
  await tapGround(page, 300, 456);
  await page.locator('[data-act="place"]').click();
  const item = page.locator('[data-decor]');
  await expect(item).toHaveCount(1);
  const id = await item.getAttribute('data-decor');
  // picked up: the ghost is that item, the placed one hidden
  await item.click();
  await expect(ghost(page)).toHaveAttribute('data-ghost', id!);
  await expect(page.locator('[data-decor]')).toHaveCount(0);
  await tapGround(page, 264, 480);
  await page.locator('[data-act="place"]').click();
  await expect(page.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '264');
  // ✕ puts it back where it was
  await page.locator(`[data-decor="${id}"]`).click();
  await tapGround(page, 120, 380);
  await page.locator('[data-act="cancel"]').click();
  await expect(page.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '264');
  // put away, and back with とりけす (a new one where it stood)
  await page.locator(`[data-decor="${id}"]`).click();
  await page.locator('[data-act="remove"]').click();
  await expect(page.locator('[data-decor]')).toHaveCount(0);
  await expect(page.locator('[data-decor-count]')).toHaveText('0/30');
  await page.getByRole('button', { name: 'とりけす' }).click();
  await expect(page.locator('[data-decor]')).toHaveCount(1);
  await expect(page.locator('[data-decor]')).toHaveAttribute('data-x', '264');
  await expect(page.locator('[data-decor-count]')).toHaveText('1/30');
});

test('both players see the same layout, live and after a reload; a tab opening later too', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  await decorate(a);
  await a.locator('[data-tray="garden-wagon"]').click();
  await tapGround(a, 300, 456);
  await a.locator('[data-act="place"]').click();
  const id = await a.locator('[data-decor]').getAttribute('data-decor');
  // B sees it at once, where A put it (a 5-cell wagon's centre is half a cell off the line)
  await expect(a.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '294');
  await expect(b.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '294', { timeout: 3000 });
  await expect(b.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-item', 'garden-wagon');
  // B moves it; A sees the move
  await decorate(b);
  await b.locator(`[data-decor="${id}"]`).click();
  await tapGround(b, 150, 360);
  await expect(b.locator('[data-foot]')).toHaveAttribute('data-foot', 'ok');
  await b.locator('[data-act="place"]').click();
  await expect(b.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '150');
  await expect(a.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '150', { timeout: 3000 });
  await expect(a.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-z', '360');
  // a reload keeps it; a third tab opening later finds it too
  await a.bringToFront();
  await a.reload();
  await expect(a.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  await expect(a.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '150');
  const c = await ctx.newPage();
  await open(c, '&as=B');
  await expect(c.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-z', '360');
  // A puts it away: gone on B
  await decorate(a);
  await a.locator(`[data-decor="${id}"]`).click();
  await a.locator('[data-act="remove"]').click();
  await expect(b.locator('[data-decor]')).toHaveCount(0, { timeout: 3000 });
  await ctx.close();
});
