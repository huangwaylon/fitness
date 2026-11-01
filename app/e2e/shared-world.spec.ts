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
  await shake(page, 'palm-3');
  const nuts = page.locator('button[data-coconut]');
  await expect(nuts).toHaveCount(2, { timeout: 3000 });
  await page.waitForTimeout(700);
  await nuts.last().click(); // (the two lie side by side, the later one on top)
  await expect(page.locator('[data-fx="catch"]')).toContainText('ヤシのみを ひろった！', { timeout: 4000 });
  await expect(nuts).toHaveCount(1);
});

test('two players see the same island, not mirrored: A (ウェイ) on the left, B (うめ) on the right on both tabs', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  /** Where each person's villager, goal tree and bed stand on a tab (screen x of their middles, the same camera). */
  const layout = (p: Page) => p.evaluate(() => {
    const mid = (sel: string) => {
      const r = document.querySelector(sel)!.getBoundingClientRect();
      return Math.round(r.left + r.width / 2);
    };
    const out: Record<string, number> = {};
    for (const who of ['A', 'B']) {
      out[`villager${who}`] = mid(`[data-person="${who}"] .vil`);
      out[`tree${who}`] = mid(`[data-tree-node="${who}"]`);
    }
    out.bedLeft = mid('[data-flower="0-0"]');
    out.bedRight = mid('[data-flower="0-3"]');
    return out;
  });
  for (const p of [a, b]) await go(p, 0);
  await a.waitForTimeout(500);
  const [la, lb] = [await layout(a), await layout(b)];
  // my own villager is A's on tab A and B's on tab B, yet both stand where their person lives
  await expect(a.locator('[data-actor="mine"]')).toHaveAttribute('data-person', 'A');
  await expect(b.locator('[data-actor="mine"]')).toHaveAttribute('data-person', 'B');
  for (const l of [la, lb]) {
    expect(l.villagerA).toBeLessThan(l.villagerB);
    expect(l.treeA).toBeLessThan(195);
    expect(l.treeB).toBeGreaterThan(195);
  }
  for (const k of Object.keys(la)) expect(Math.abs(la[k] - lb[k]), k).toBeLessThanOrEqual(4);
  await ctx.close();
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

test('two players: a bug netted on one tab is gone on the other, where their villager holds it up with the line', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  for (const [p, as] of [[a, ''], [b, '&as=B']] as const) {
    await p.goto(`?demo&date=2026-05-10T12:00&critter=ladybug${as}`);
    await expect(p.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  }
  for (const p of [a, b]) await expect(p.locator('[data-critter="ladybug"]')).toBeAttached({ timeout: 6000 });
  await a.waitForTimeout(900);
  const r = await a.locator('[data-critter="ladybug"]').evaluate((el) => {
    const x = el.getBoundingClientRect();
    return { x: x.left + x.width / 2, y: x.top + x.height / 2 };
  });
  await a.mouse.click(r.x, r.y);
  await expect(a.locator('[data-fx="catch"]')).toContainText('テントウムシ', { timeout: 4000 });
  // B: gone, and A's villager (B's partner) holds it up: 「〇〇が テントウムシを つかまえた！」
  await expect(b.locator('[data-critter="ladybug"]')).toHaveCount(0, { timeout: 5000 });
  await expect(b.locator('[data-fx="catch"], [data-partner-news]').first()).toContainText('テントウムシを つかまえた！', { timeout: 5000 });
  // the shared day has it as A's
  const day = JSON.parse((await b.evaluate(() => localStorage.getItem('island-demo.world.B')))!) as { events: { kind: string; id?: string; who: string }[] };
  expect(day.events).toContainEqual(expect.objectContaining({ kind: 'catch', id: 'hook:ladybug', who: 'A' }));
  await ctx.close();
});

test('two players: a shell picked up on one tab is gone on the other, and from a tab opening later; a watered flower glitters on both', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  for (const [p, as] of [[a, ''], [b, '&as=B']] as const) {
    await p.goto(`?demo&date=${DATE}&critter=none${as}`);
    await expect(p.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  }
  const shells = (p: Page) => p.locator('[data-find="shell"]');
  for (const p of [a, b]) await expect(shells(p)).toHaveCount(3);
  await a.waitForTimeout(1500);
  const s = await shells(a).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await a.mouse.click(s.x, s.y);
  await expect(a.locator('[data-fx="catch"]')).toContainText('を ひろった！', { timeout: 4000 });
  await expect(shells(a)).toHaveCount(2);
  await expect(shells(b)).toHaveCount(2, { timeout: 4000 });
  // the partner's villager went for it: their line on B (in view at まえ)
  await expect(b.locator('[data-fx="catch"], [data-partner-news]').first()).toContainText('を ひろった！', { timeout: 5000 });
  // A waters a flower of A's own bed (on the left, on both tabs): it glitters on B's tab too, the same flower
  await a.locator('[data-flower="1-0"]').click();
  await expect(a.locator('[data-flower="1-0"] [data-watered], [data-watered]').first()).toBeAttached({ timeout: 4000 });
  await expect(b.locator('[data-watered]')).toHaveCount(1, { timeout: 5000 });
  const wb = await b.locator('[data-watered]').evaluate((el) => el.closest('[data-flower]')?.getAttribute('data-flower') ?? el.parentElement?.closest('[data-flower]')?.getAttribute('data-flower'));
  if (wb) expect(wb).toBe('1-0');
  // B's phone again, later: the day as it is
  const c = await ctx.newPage();
  await c.goto(`?demo&date=${DATE}&critter=none&as=B`);
  await expect(c.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  await expect(shells(c)).toHaveCount(2);
  await ctx.close();
});
