// Tap-to-walk and the campsite's door (spec §3–4, docs/design.md "Walking", "Buildings"): a tap on the ground sends
// my villager there along nav.ts's way (never through the water), a cream ring marks the spot, the camera follows a
// run it can't see (snapping off meanwhile, back after; a touch takes it back), and the campsite is one tap: walk to
// its door, its line about today's guest.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test.use({ viewport: { width: 390, height: 844 } });

type W = {
  go(z: number): void; cam(): number; at(x: number, z: number): [number, number]; put(x: number, z: number): void;
  mine(): [number, number]; following(): boolean; snapping(): string; stops(): number[];
};
const call = <T,>(page: Page, fn: (w: W, a: number[]) => T, args: number[] = []) =>
  page.evaluate(([f, a]) => new Function('w', 'a', `return (${f})(w, a)`)((window as unknown as { __world: W }).__world, a), [fn.toString(), args] as const) as Promise<T>;
const SHOTS = process.env.SHOTS_DIR;
const shot = async (page: Page, name: string) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

async function open(page: Page, q = '&date=2026-07-01T10:00', cam?: number) {
  await page.goto(`?demo&season=summer${q}`);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(600);
  if (cam !== undefined) {
    await call(page, (w, [z]) => w.go(z), [cam]);
    await page.waitForTimeout(300);
  }
}

/** My villager's feet every ~30 ms until it stops (or `ms` runs out). */
async function track(page: Page, ms = 8000): Promise<[number, number][]> {
  return page.evaluate(async (ms) => {
    const w = (window as unknown as { __world: W }).__world, out: [number, number][] = [];
    const t0 = performance.now();
    let still = 0;
    while (performance.now() - t0 < ms) {
      await new Promise((r) => setTimeout(r, 30));
      const p = w.mine();
      const last = out.at(-1);
      out.push([p[0], p[1]]);
      still = last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.01 ? still + 1 : 0;
      if (still > 12 && out.length > 20) break;
    }
    return out;
  }, ms);
}

test('a tap by the campsite runs my villager up the path, never through the water; a ring marks the spot', async ({ page }) => {
  await open(page, undefined, 300);
  const [x, y] = await call(page, (w) => w.at(240, 860));
  await page.mouse.click(x, y);
  await expect(page.locator('.tap-ring')).toHaveCount(1);
  await shot(page, 'tap-ring');
  const path = await track(page);
  const end = path.at(-1)!;
  expect(Math.hypot(end[0] - 240, end[1] - 860)).toBeLessThan(3);
  // never in the pond (74, 772: rx 46, rz 26)
  for (const [px, pz] of path) expect(((px - 74) / 46) ** 2 + ((pz - 772) / 26) ** 2).toBeGreaterThan(1);
  await shot(page, 'after-run');
});

test('a tap on the pond walks to its bank, facing the water; the walk stays for the session', async ({ page }) => {
  await open(page, undefined, 560);
  const [x, y] = await call(page, (w) => w.at(74, 772));
  await page.mouse.click(x, y);
  const end = (await track(page)).at(-1)!;
  // on the bank: out of the water (rx 46, rz 26) by the pad, within reach of it
  const d = Math.hypot((end[0] - 74) / 46, (end[1] - 772) / 26);
  expect(d).toBeGreaterThan(1);
  expect(Math.hypot(end[0] - 74, end[1] - 772)).toBeLessThan(80);
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(400);
  const again = await call(page, (w) => w.mine());
  expect(Math.hypot(again[0] - end[0], again[1] - end[1])).toBeLessThan(2);
});

test('the camera follows a run up the island (snapping off), gives it back after, and a touch takes it back at once', async ({ page }) => {
  await open(page);
  const [front] = await call(page, (w) => w.stops());
  expect(await call(page, (w) => w.cam())).toBe(front);
  // far up by the campsite: a far tap (θ > 35°), the camera eases there with the walker
  const [x, y] = await call(page, (w) => w.at(240, 860));
  await page.mouse.click(x, y);
  await expect.poll(() => call(page, (w) => w.following())).toBe(true);
  expect(await call(page, (w) => w.snapping())).toBe('none');
  // while following, my villager stays on screen
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(250);
    const sy = await call(page, (w) => w.at(...w.mine())[1]);
    expect(sy).toBeLessThan(844);
    expect(sy).toBeGreaterThan(100);
  }
  await expect.poll(() => call(page, (w) => w.following()), { timeout: 8000 }).toBe(false);
  expect(await call(page, (w) => w.cam())).toBeGreaterThan(400);
  await shot(page, 'followed');
  await expect.poll(() => call(page, (w) => w.snapping())).toBe('');

  // a touch on the scroller ends a follow at once (my villager back home, out of view: a far tap up by the campsite)
  await call(page, (w) => w.put(132, 214));
  const [x2, y2] = await call(page, (w) => w.at(150, 860));
  await page.mouse.click(x2, y2);
  await expect.poll(() => call(page, (w) => w.following())).toBe(true);
  await page.locator('[data-world-scroller]').dispatchEvent('touchstart');
  expect(await call(page, (w) => w.following())).toBe(false);
});

test('the campsite: walk to the door, its line about today’s guest (nobody inside)', async ({ page }) => {
  await open(page, '&date=2026-07-01T10:00&visitor=none', 642);
  await page.locator('[data-building="campsite"] .door').click();
  const box = page.locator('[data-fx="talk"]');
  await expect(box).toContainText('キャンプサイト', { timeout: 8000 });
  const end = await call(page, (w) => w.mine());
  expect(Math.hypot(end[0] - 196, end[1] - (984 - 16))).toBeLessThan(30);
  await shot(page, 'campsite-door');
  for (let i = 0; i < 4 && (await box.count()); i++) await box.click().catch(() => {});
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('a tap at the tent’s foot knocks at its door (the footprint snaps to the door)', async ({ page }) => {
  await open(page, '&date=2026-07-01T10:00&visitor=none', 642);
  // the ground just inside the tent's footprint (taps on the art itself are the door button's)
  await page.addStyleTag({ content: '[data-building] .door { pointer-events: none !important; }' });
  const [x, y] = await call(page, (w) => w.at(150, 1000));
  await page.mouse.click(x, y);
  await expect(page.locator('[data-fx="talk"]')).toContainText('キャンプサイト', { timeout: 8000 });
});
