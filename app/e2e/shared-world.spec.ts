// The shared island (docs/backend.md#shared-world, docs/design.md "Shared world"): both phones show the same world. The
// demo's two players are two tabs of one browser (`?demo` and `?demo&as=B`), sharing it the way two phones do over
// the relay (sync/live-local.ts plays the room: first claim wins, the day's world kept for a tab opening later).
// Every tree shakes (NH's three quick taps): an oak's branch, a palm's coconuts; the partner's tab sees the shake,
// their villager turns to it where it stands, and what's picked up on one tab is gone on the other.
import { FLOWERS } from '../src/lib/components/island/world.ts';
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

type W = { go(z: number): void; at(x: number, z: number): [number, number]; mine(): [number, number]; partner(): [number, number] };
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
  page.locator(`[data-tree="${id}"]:not([data-tree-part])`).evaluate((el) => {
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
  /** Where each person's villager and goal tree and two wild flowers stand on a tab (screen x of their middles, the same camera). */
  const layout = (p: Page) => p.evaluate((flowers) => {
    const mid = (sel: string) => {
      const r = document.querySelector(sel)!.getBoundingClientRect();
      return Math.round(r.left + r.width / 2);
    };
    const out: Record<string, number> = {};
    for (const who of ['A', 'B']) {
      out[`villager${who}`] = mid(`[data-person="${who}"] .vil`);
      out[`tree${who}`] = mid(`[data-tree-node="${who}"]`);
    }
    for (const id of flowers) out[id] = mid(`[data-flower="${id}"]`);
    return out;
  }, [FLOWERS[0].id, FLOWERS[3].id]);
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

/** Where a person's villager stands on a tab now (its own, or the partner's), world units. */
const feet = (page: Page, own: boolean) =>
  page.evaluate((own) => {
    const w = (window as unknown as { __world: W }).__world;
    return own ? w.mine() : w.partner();
  }, own);

test('two players: a tap-walk on one tab plays on the other from the same start at the same time, and ends at the same point', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  for (const p of [a, b]) await go(p, 300);
  await a.waitForTimeout(400);
  for (const [tapper, watcher, tx, tz] of [[a, b, 240, 500], [b, a, 150, 560]] as const) {
    const [x, y] = await tapper.evaluate(([tx, tz]) => (window as unknown as { __world: W }).__world.at(tx, tz), [tx, tz]);
    await tapper.mouse.click(x, y);
    // under way: the two tabs have it within a few steps of each other (one frame and the evaluate's skew apart)
    let worst = 0;
    for (let i = 0; i < 8; i++) {
      await tapper.waitForTimeout(150);
      const [p, q] = await Promise.all([feet(tapper, true), feet(watcher, false)]);
      worst = Math.max(worst, Math.hypot(p[0] - q[0], p[1] - q[1]));
    }
    console.log(`drift under way (worst of 8 samples): ${worst.toFixed(1)}u`);
    expect(worst).toBeLessThan(40);
    await tapper.waitForTimeout(2500);
    const [p, q] = await Promise.all([feet(tapper, true), feet(watcher, false)]);
    expect(Math.hypot(p[0] - q[0], p[1] - q[1])).toBeLessThan(1.5);
    expect(Math.hypot(p[0] - tx, p[1] - tz)).toBeLessThan(4);
  }
  // a tab opening later (B's phone again) has A's villager where A's tab has it
  const c = await ctx.newPage();
  await open(c, '&as=B');
  const [pa, pc] = await Promise.all([feet(a, true), feet(c, false)]);
  expect(Math.hypot(pa[0] - pc[0], pa[1] - pc[1])).toBeLessThan(1.5);
  await ctx.close();
});

test('two players: asleep at night on both tabs; a tap wakes my villager on both, and both put it back to sleep at the same moment', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  for (const [p, as] of [[a, ''], [b, '&as=B']] as const) {
    await p.goto(`?demo&date=2026-11-04T23:00&critter=none${as}`);
    await expect(p.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
    await p.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  }
  const zzz = (p: Page, who: string) => p.locator(`[data-person="${who}"] .fxa.zzz`);
  for (const p of [a, b]) for (const who of ['A', 'B']) await expect(zzz(p, who)).toHaveCount(1, { timeout: 4000 });
  await a.waitForTimeout(600);
  const v = (await a.locator('[data-person="A"] .vil').boundingBox())!;
  await a.mouse.click(v.x + v.width / 2, v.y + v.height * 0.6);
  for (const p of [a, b]) await expect(zzz(p, 'A')).toHaveCount(0, { timeout: 1500 });
  for (const p of [a, b]) await expect(zzz(p, 'B')).toHaveCount(1);
  // ten seconds later: asleep again on both (the same moment: the wake's own time on each)
  await a.waitForTimeout(9000);
  for (const p of [a, b]) await expect(zzz(p, 'A')).toHaveCount(1, { timeout: 2500 });
  await ctx.close();
});

test('two players: Gulliver woken on one tab is up on the other too, and for a tab opening later', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  for (const [p, as] of [[a, ''], [b, '&as=B']] as const) {
    await p.goto(`?demo&date=2026-11-04T12:00&visitor=gulliver&critter=none${as}`);
    await expect(p.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  }
  const g = (p: Page) => p.locator('[data-visitor="gulliver"]');
  for (const p of [a, b]) await expect(g(p)).toHaveAttribute('data-asleep', 'lie', { timeout: 5000 });
  for (let i = 0; i < 5; i++) {
    const r = (await a.locator('[data-visitor="gulliver"] .art').boundingBox())!;
    await a.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    await a.waitForTimeout(i ? 300 : 500);
  }
  await expect(g(a)).not.toHaveAttribute('data-asleep', /./);
  await expect(g(b)).not.toHaveAttribute('data-asleep', /./, { timeout: 2000 });
  const c = await ctx.newPage();
  await c.goto('?demo&date=2026-11-04T12:00&visitor=gulliver&critter=none&as=B');
  await expect(g(c)).toBeAttached({ timeout: 5000 });
  await c.waitForTimeout(800);
  await expect(g(c)).not.toHaveAttribute('data-asleep', /./);
  await ctx.close();
});

test('two players: a shake on one tab plays on the other (their villager stays where it is), and a pick-up there is gone here', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a, '&shake=branch');
  await open(b, '&as=B');
  for (const p of [a, b]) await go(p, 380);
  await a.waitForTimeout(400);
  await shake(a, 'oak-m1');
  await expect(a.locator('button[data-branch="oak-m1"]')).toHaveCount(1, { timeout: 3000 });
  // B's tab: the oak shakes and the branch falls beside it; A's villager (B's partner) doesn't run over
  await expect(b.locator('button[data-branch="oak-m1"]')).toHaveCount(1, { timeout: 6000 });
  await expect(b.locator('[data-actor="partner"].walking')).toHaveCount(0);
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
  // A waters a flower (world.ts FLOWERS): it glitters on B's tab too, the same flower
  const fl = `[data-flower="${FLOWERS[0].id}"]`;
  await a.locator(fl).click();
  await expect(a.locator(`${fl} [data-watered]`)).toBeAttached({ timeout: 4000 });
  await expect(b.locator('[data-watered]')).toHaveCount(1, { timeout: 5000 });
  await expect(b.locator(`${fl} [data-watered]`)).toHaveCount(1);
  // B's phone again, later: the day as it is
  const c = await ctx.newPage();
  await c.goto(`?demo&date=${DATE}&critter=none&as=B`);
  await expect(c.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  await expect(shells(c)).toHaveCount(2);
  await ctx.close();
});
