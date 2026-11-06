// Where my villager is (docs/design.md "Walking", "Buildings"): out of the shop's or the museum's door it stands just
// in front of it, facing out, and stays there (on the default island and on the user's, the shop at x7 z49 and the
// museum at x9 z18); the other phone sees it gone while it's in the shop, then come out there; a reload, or the next
// day, finds it where it was, on both phones.
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from './fixtures.ts';
import { islandURL } from './island.ts';
import { is3d, lawnTap, settled, tapOn } from './island';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&visitor=none&critter=none&date=2026-11-04T12:00';
type Pt = [number, number];
type W = { mine(): Pt; partner(): Pt; go(z: number): void; site(): { doors: Record<string, Pt> }; exit(id: string): { at: Pt; face: string } };
const w = <R,>(page: Page, fn: (w: W) => R) => page.evaluate(`(${fn.toString()})(window.__world)`) as Promise<R>;
const far = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** The user's island (layout/record-2026-11-03.json, then the shop and the museum where they put them), as the demo
 *  keeps a layout. */
const RECORD = JSON.parse(readFileSync(new URL('../src/lib/layout/record-2026-11-03.json', import.meta.url), 'utf8')) as object[];
const USERS = [...RECORD, { who: 'A', sc: 'o', id: 'shop', at: 1.8e12, k: 'shop', x: 7, z: 49, f: 0 }, { who: 'A', sc: 'o', id: 'museum', at: 1.8e12 + 1, k: 'museum', x: 9, z: 18, f: 0 }];
const onUsers = (page: Page) => page.addInitScript((ops) => localStorage.getItem('island-demo.layout') || localStorage.setItem('island-demo.layout', JSON.stringify(ops)), USERS);

/** In by the door (a tap on it walks up and goes in). */
async function goIn(page: Page, id: 'shop' | 'museum') {
  const door = await w(page, (w) => w.site().doors);
  await page.evaluate(`window.__world.go(${door[id][1] - 120})`);
  await settled(page);
  await tapOn(page, page.locator(`[data-building="${id}"] .door`));
  await expect(page).toHaveURL(new RegExp(`/${id}/?\\?`), { timeout: 20_000 });
  await expect(page.locator(id === 'shop' ? '[data-shop]' : '[data-museum]')).toBeVisible();
}
/** Out by ‹ 島へ. */
async function goOut(page: Page) {
  await page.getByRole('button', { name: '島へ' }).click();
  await expect(page).toHaveURL(islandURL());
}
async function inAndOut(page: Page, id: 'shop' | 'museum') {
  await goIn(page, id);
  await goOut(page);
}

for (const island of ['default', 'user'] as const)
  for (const id of ['shop', 'museum'] as const)
    test(`out of the ${id}'s door on the ${island} island: just in front of it, facing out, and there it stays`, async ({ page }) => {
      test.slow(); // (the island twice and a room: drawn under software GL, the full tier, over 30 s)
      if (island === 'user') await onUsers(page);
      await page.goto(Q);
      expect(await is3d(page)).toBe(true);
      await inAndOut(page, id);
      const exit = await page.evaluate((id) => (window as unknown as { __world: W }).__world.exit(id), id);
      const door = (await w(page, (w) => w.site().doors))[id];
      // a step out in front of the door (the door faces us on both islands)
      expect(far(exit.at, door)).toBeLessThan(45);
      expect(exit.at[1]).toBeLessThan(door[1]);
      await expect.poll(() => w(page, (w) => w.mine()).then((p) => far(p, exit.at))).toBeLessThan(2);
      // nothing takes it anywhere after (no put home a moment later)
      await page.waitForTimeout(1500); // (proving nothing happens for a while)
      expect(far(await w(page, (w) => w.mine()), exit.at)).toBeLessThan(2);
    });

test('the other phone sees me gone while I’m in the shop, then come out of its door', async ({ context }) => {
  test.slow();
  await context.addInitScript((ops) => localStorage.getItem('island-demo.layout') || localStorage.setItem('island-demo.layout', JSON.stringify(ops)), USERS);
  const a = await context.newPage(), b = await context.newPage();
  await a.goto(Q);
  await b.goto(`${Q}&as=B`);
  expect(await is3d(a)).toBe(true);
  const inside = () => b.locator('[data-actor="partner"]').getAttribute('data-inside');
  expect(await inside()).toBeNull();
  await a.bringToFront();
  await goIn(a, 'shop');
  // in the shop: nowhere on B's island (as in the museum and the rooms), not standing at its door
  await expect.poll(inside, { timeout: 6000 }).toBe('true');
  await goOut(a);
  const exit = await a.evaluate(() => (window as unknown as { __world: W }).__world.exit('shop'));
  await expect.poll(inside, { timeout: 6000 }).toBeNull();
  await expect.poll(() => w(b, (w) => w.partner()).then((p) => far(p, exit.at)), { timeout: 10_000 }).toBeLessThan(3);
});

test('the other phone opening the next day finds my villager where I left it, not at home', async ({ context }) => {
  test.slow();
  const a = await context.newPage();
  await a.goto(Q);
  expect(await is3d(a)).toBe(true);
  const home = await w(a, (w) => w.mine());
  await a.evaluate(`window.__world.go(${home[1] + 60})`);
  await settled(a);
  const lawn = await lawnTap(a, home[0] + 60, home[1] + 140);
  await a.mouse.click(lawn.x, lawn.y);
  await expect.poll(() => w(a, (w) => w.mine()).then((p) => far(p, lawn.at))).toBeLessThan(3);
  const at = await w(a, (w) => w.mine());
  await a.close();
  // B's phone, the next morning, A's closed all along: A's villager where its last walk ended (the relay's, carried)
  const b = await context.newPage();
  await b.goto(`${Q.replace('2026-11-04T12:00', '2026-11-05T09:00')}&as=B`);
  await b.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await expect.poll(() => w(b, (w) => w.partner()).then((p) => far(p, at)), { timeout: 10_000 }).toBeLessThan(3);
});

test('a reload, and the next day, find my villager where it was', async ({ page }) => {
  test.slow();
  await page.goto(Q);
  expect(await is3d(page)).toBe(true);
  const home = await w(page, (w) => w.mine());
  await page.evaluate(`window.__world.go(${home[1] + 60})`);
  await settled(page);
  const lawn = await lawnTap(page, home[0] + 60, home[1] + 140);
  await page.mouse.click(lawn.x, lawn.y);
  await expect.poll(() => w(page, (w) => w.mine()).then((p) => far(p, lawn.at))).toBeLessThan(3);
  const at = await w(page, (w) => w.mine());
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await expect.poll(() => w(page, (w) => w.mine()).then((p) => far(p, at))).toBeLessThan(2);
  await page.waitForTimeout(1500); // (proving nothing takes it home after)
  expect(far(await w(page, (w) => w.mine()), at)).toBeLessThan(2);
  // the next morning, the app opened again: still there (only a new player starts at home)
  await page.goto(Q.replace('2026-11-04T12:00', '2026-11-05T09:00'));
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await expect.poll(() => w(page, (w) => w.mine()).then((p) => far(p, at))).toBeLessThan(2);
});
