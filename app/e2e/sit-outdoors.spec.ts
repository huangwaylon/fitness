// Sitting and lying out on the island (docs/design.md "Decor: sitting"), as in the tent: a tap on a bench walks my
// villager up to it, a step in front, and there it sits on the piece's own seat (the 3D villager's 'sit'); the partner's
// tab sees it seated too (the walk is all the relay carries: standing still on the seat's spot is on it); a bench takes
// two, one villager a seat; a tap on the ground gets up and walks there, on both tabs. The hammock is lain in. A tap on
// another of the island's things (the pump) still answers where it stands: nobody walks.
import { expect, test, type Page } from '@playwright/test';
import { geo, openNear, quiet, tapOn } from './island.ts';

test.use({ viewport: { width: 390, height: 844 } });
const DATE = '2026-11-04T12:00';

type W = { go(z: number): void; at(x: number, z: number): [number, number]; mine(): [number, number]; seated(id: string): string | null; idle(): boolean };
const world = <R,>(page: Page, fn: (w: W) => R) => page.evaluate(`(${fn.toString()})(window.__world)`) as Promise<R>;
const seated = (page: Page, id: 'mine' | 'partner') => page.evaluate((id) => (window as unknown as { __world: W }).__world.seated(id), id);
/** The 3D villager's state (villager3d: 'sit', 'lie', 'walk', 'idle'), null before its model is in. */
const v3 = (page: Page, slot: string) => page.evaluate((s) => (window as unknown as { __villagers3?: { state(s: string): string | null } }).__villagers3?.state(s) ?? null, slot);

async function open(page: Page, q = '') {
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none${q}`);
  await expect(page.getByRole('button', { name: /^ごほうび · ふたりのベル / })).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await quiet(page);
  await expect.poll(() => v3(page, 'mine'), { timeout: 30_000 }).not.toBeNull();
}
/** The camera in front of a decor spot (world.ts DECOR_SLOTS as the page has it), at rest. */
/** A tap on a seat's tap area where nothing stands in front of it (a villager sitting on it covers much of it): the
 *  first such point in a fine grid over its box. */
async function tapSeat(page: Page, id: string) {
  const find = () => page.locator(`[data-sit="${id}"]`).evaluate((el) => {
    const r = el.getBoundingClientRect();
    for (let fy = 0.1; fy < 1; fy += 0.1)
      for (let fx = 0.05; fx < 1; fx += 0.075) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        if (el.contains(document.elementFromPoint(x, y))) return [x, y];
      }
    return null;
  });
  let pt: number[] | null = null;
  await expect.poll(async () => (pt = await find()), { message: `a point of ${id} clear of the villagers` }).not.toBeNull();
  await page.mouse.click(pt![0], pt![1]);
}
async function toSpot(page: Page, id: string) {
  const d = (await geo(page)).DECOR_SLOTS.find((s) => s.id === id)!;
  await page.evaluate((z) => (window as unknown as { __world: W }).__world.go(z), d.z - 110);
  await expect.poll(() => world(page, (w) => w.idle()), { timeout: 5000 }).toBe(true);
  return d;
}

test('a bench: walked up to and sat on, the partner\'s tab sees it; two to a bench; a ground tap gets up, on both', async ({ browser }) => {
  test.setTimeout(90_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  for (const p of [a, b]) await toSpot(p, 'bench-mae');
  // A taps the bench: off it walks (no sitting on the way), then on a seat of it, sitting in 3D
  await tapOn(a, a.locator('[data-sit="bench-mae"]'));
  await expect.poll(() => v3(a, 'mine'), { timeout: 3000 }).toBe('walk');
  await expect.poll(() => seated(a, 'mine'), { timeout: 8000 }).toMatch(/^seatMae[LR]$/);
  const mine = (await seated(a, 'mine'))!;
  await expect.poll(() => v3(a, 'mine'), { timeout: 5000 }).toBe('sit');
  // the partner's tab: A's villager on the same seat, sitting
  await expect.poll(() => seated(b, 'partner'), { timeout: 8000 }).toBe(mine);
  await expect.poll(() => v3(b, 'partner'), { timeout: 5000 }).toBe('sit');
  // B taps the same bench: the other seat (one villager a seat, a bench two); both tabs have it
  await tapSeat(b, 'bench-mae');
  const other = mine === 'seatMaeL' ? 'seatMaeR' : 'seatMaeL';
  await expect.poll(() => seated(b, 'mine'), { timeout: 8000 }).toBe(other);
  await expect.poll(() => seated(a, 'partner'), { timeout: 8000 }).toBe(other);
  expect(await seated(a, 'mine')).toBe(mine);
  // a tap on the ground: A gets up and walks there; off the seat on B's tab too
  // (on the lawn behind it: the beach in front has the day's finds, a tap there picks one up)
  const [tx, tz] = await openNear(a, 150, (await geo(a)).DECOR_SLOTS.find((s) => s.id === 'bench-mae')!.z + 90, 45, true);
  const [x, y] = await a.evaluate(([tx, tz]) => (window as unknown as { __world: W }).__world.at(tx, tz), [tx, tz]);
  await a.mouse.click(x, y);
  await expect.poll(() => seated(a, 'mine'), { timeout: 3000 }).toBeNull();
  await expect.poll(async () => { const [mx, mz] = await world(a, (w) => w.mine()); return Math.hypot(mx - tx, mz - tz); }, { timeout: 8000 }).toBeLessThan(10);
  await expect.poll(() => v3(a, 'mine'), { timeout: 5000 }).toBe('idle');
  await expect.poll(() => seated(b, 'partner'), { timeout: 8000 }).toBeNull();
  await ctx.close();
});

test('the hammock is lain in', async ({ page }) => {
  test.setTimeout(60_000);
  await open(page);
  await toSpot(page, 'hammock');
  await tapOn(page, page.locator('[data-sit="hammock"]'));
  await expect.poll(() => seated(page, 'mine'), { timeout: 10_000 }).toBe('seat-hammock');
  await expect.poll(() => v3(page, 'mine'), { timeout: 5000 }).toBe('lie');
});

test('another of the island\'s things (the pump) still answers where it stands: nobody walks', async ({ page }) => {
  test.setTimeout(60_000);
  await open(page);
  await toSpot(page, 'pump');
  const before = await world(page, (w) => w.mine());
  await expect(page.locator('[data-fixture="pump"]')).not.toHaveAttribute('data-sit');
  await tapOn(page, page.locator('[data-fixture="pump"]'));
  await page.waitForTimeout(800); // (proving it stays)
  const after = await world(page, (w) => w.mine());
  expect(Math.hypot(after[0] - before[0], after[1] - before[1])).toBeLessThan(2);
  expect(await seated(page, 'mine')).toBeNull();
});
