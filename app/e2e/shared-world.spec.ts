// The shared island (docs/backend.md#shared-world, docs/design.md "Shared world"): both phones show the same world. The
// demo's two players are two tabs of one browser (`?demo` and `?demo&as=B`), sharing it the way two phones do over
// the relay (sync/live-local.ts plays the room: first claim wins, the day's world kept for a tab opening later).
// Every tree shakes (NH's three quick taps): an oak's branch, a palm's coconuts; the partner's tab sees the shake,
// their villager walks over, and what's picked up on one tab is gone on the other.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

type W = { go(z: number): void; at(x: number, z: number): [number, number] };
const go = (page: Page, z: number) => page.evaluate((z) => (window as unknown as { __world: W }).__world.go(z), z);
const DATE = '2026-11-04T12:00';

async function open(page: Page, q = '') {
  await page.goto(`?demo&date=${DATE}&critter=none${q}`);
  await expect(page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(2600); // the opening beats are over
}

/** A point on a tree's leaves the finger reaches (its tap area's middle, else the nearest part nothing covers). */
const leaves = (page: Page, id: string) =>
  page.locator(`[data-tree="${id}"]`).evaluate((el) => {
    const b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    for (let d = 0; d < b.height / 2; d += 3)
      for (const [dx, dy] of [[0, d], [0, -d], [d, 0], [-d, 0]])
        if (document.elementFromPoint(cx + dx, cy + dy)?.closest('[data-tree]') === el) return { x: cx + dx, y: cy + dy };
    return { x: cx, y: cy };
  });
async function shake(page: Page, id: string) {
  for (let i = 0; i < 3; i++) {
    const p = await leaves(page, id);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(140);
  }
}

test('every tree shakes: three quick taps on an oak drop a branch beside it; one tap only rustles', async ({ page }) => {
  await open(page, '&shake=branch');
  await go(page, 380);
  await page.waitForTimeout(400);
  const p = await leaves(page, 'oak-m1');
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(1400); // a run has to be quick: this one is over
  await expect(page.locator('button[data-branch]')).toHaveCount(0);
  await shake(page, 'oak-m1');
  const twig = page.locator('button[data-branch="oak-m1"]');
  await expect(twig).toHaveCount(1, { timeout: 3000 });
  await page.waitForTimeout(700);
  await twig.click();
  await expect(twig).toHaveCount(0, { timeout: 3000 });
  // a reload finds today's island as it was: the branch is gone, and stays gone
  await page.reload();
  await expect(page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.locator('button[data-branch]')).toHaveCount(0);
});

test('a palm drops its two coconuts, once a day: a tap picks one up (NH’s line)', async ({ page }) => {
  await open(page, '&shake=coconut');
  await shake(page, 'palm-2');
  const nuts = page.locator('button[data-coconut]');
  await expect(nuts).toHaveCount(2, { timeout: 3000 });
  await page.waitForTimeout(700);
  await nuts.first().click();
  await expect(page.locator('[data-fx="catch"]')).toContainText('ヤシのみを ひろった！', { timeout: 4000 });
  await expect(nuts).toHaveCount(1);
});

test('two players: a shake on one tab plays on the other (their villager walks over), and a pick-up there is gone here', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a, '&shake=branch');
  await open(b, '&as=B');
  for (const p of [a, b]) await go(p, 380);
  await a.waitForTimeout(400);
  await shake(a, 'oak-m1');
  await expect(a.locator('button[data-branch="oak-m1"]')).toHaveCount(1, { timeout: 3000 });
  // B's tab: A's villager (B's partner) runs to the oak and the branch falls beside it
  await expect(b.locator('button[data-branch="oak-m1"]')).toHaveCount(1, { timeout: 6000 });
  await b.waitForTimeout(800);
  await b.locator('button[data-branch="oak-m1"]').click();
  await expect(b.locator('button[data-branch]')).toHaveCount(0, { timeout: 3000 });
  await expect(a.locator('button[data-branch]')).toHaveCount(0, { timeout: 3000 });
  // a third tab opening later (B's phone again) finds the day as it is: no branch, and the nest rule shared
  const c = await ctx.newPage();
  await open(c, '&as=B');
  await go(c, 380);
  await expect(c.locator('button[data-branch]')).toHaveCount(0);
  await ctx.close();
});
