// The island in 3D (?island=3d, せってい's switch: docs/decisions.md "The island in 3D"): the 2D island never loads
// three; the 3D one draws its canvas under the DOM island, a tap on open lawn walks my villager, one finger scrolls
// along the island only (z, never x), two pinch the zoom, and /world3d (the POC's address) opens it.
import { expect, test, type Page } from '@playwright/test';

type W3 = {
  stats(): { frames: number; calls: number; tris: number; dpr: number; loading: number; fps: number };
  loaded(): boolean;
  view(): { camZ: number; zoom: number };
  limits(): { min: number; max: number };
  client(x: number, z: number, lift?: number): [number, number];
  go(z: number, k?: number): void;
};
const w3 = <R,>(page: Page, fn: (w: W3) => R) => page.evaluate(`(${fn.toString()})(window.__world3d)`) as Promise<R>;
const ready = (page: Page) => page.waitForFunction(() => (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 30_000 });
const Q = 'demo&date=2026-11-04T12:00&critter=none&visitor=none';

test('the 2D island never loads three; ?island=3d draws the island in 3D and a tap on the lawn walks my villager', async ({ page }) => {
  test.setTimeout(60_000);
  const scripts: string[] = [];
  page.on('response', async (r) => {
    if (r.url().endsWith('.js')) scripts.push((await r.text().catch(() => '')).includes('WebGLRenderer') ? 'three' : 'other');
  });
  await page.goto(`?${Q}`);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(800); // (proving nothing loads three for a while)
  expect(scripts).not.toContain('three');

  await page.goto(`?${Q}&island=3d`);
  await expect(page.locator('canvas[data-w3d]')).toBeVisible();
  await ready(page);
  expect(scripts).toContain('three');
  await expect(page.locator('.if-scene[data-r3]')).toBeVisible();
  const s = await w3(page, (w) => w.stats());
  expect(s.calls).toBeGreaterThan(10);
  expect(s.dpr).toBeLessThanOrEqual(2);

  // a tap on open lawn between the villagers' homes and the stream (world 200, 300) walks mine there
  const [x, y] = await w3(page, (w) => w.client(200, 300));
  await expect.poll(() => page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.matches('.stage'), [x, y])).toBe(true);
  await page.mouse.click(x, y);
  await expect.poll(async () => {
    const [ax, az] = await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
    return Math.hypot(ax - 200, az - 300);
  }, { timeout: 10_000 }).toBeLessThan(14);
});

test('the 3D camera: one finger scrolls along the island only, two pinch the zoom, nothing else moves it', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`?${Q}&island=3d`);
  await ready(page);
  const { min, max } = await w3(page, (w) => w.limits());
  expect(max).toBeGreaterThan(min + 200);
  expect((await w3(page, (w) => w.view())).camZ).toBeCloseTo(min, 0);
  const touch = await page.context().newCDPSession(page).catch(() => null);
  test.skip(!touch, 'touch events need CDP (Chromium)');
  const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', pts: { x: number; y: number }[]) => touch!.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ ...p, id: i })) });
  // a diagonal drag: down the screen (into the island) and sideways; the camera's x never moves (the island stays centred)
  const [cx0] = await w3(page, (w) => w.client(195, 400));
  await send('touchStart', [{ x: 120, y: 420 }]);
  for (let i = 1; i <= 12; i++) await send('touchMove', [{ x: 120 + i * 10, y: 420 + i * 14 }]);
  await send('touchEnd', []);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world: { idle(): boolean } }).__world.idle()), { timeout: 10_000 }).toBe(true);
  const after = await w3(page, (w) => w.view());
  expect(after.camZ).toBeGreaterThan(min + 60);
  expect(after.zoom).toBeCloseTo(1, 3);
  const [cx1] = await w3(page, (w) => w.client(195, 400));
  expect(Math.abs(cx1 - cx0)).toBeLessThan(0.5);
  // a pinch apart zooms in, and stays a pinch (no scroll) though its fingers drift down together
  const z1 = after.camZ;
  await send('touchStart', [{ x: 150, y: 400 }, { x: 240, y: 420 }]);
  for (let i = 1; i <= 10; i++) await send('touchMove', [{ x: 150 - i * 6, y: 400 + i * 2 }, { x: 240 + i * 6, y: 420 + i * 2 }]);
  await send('touchEnd', []);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world: { idle(): boolean } }).__world.idle()), { timeout: 10_000 }).toBe(true);
  const pinched = await w3(page, (w) => w.view());
  expect(pinched.zoom).toBeGreaterThan(1.2);
  expect(Math.abs(pinched.camZ - z1)).toBeLessThan(80);
  // still: nothing moves it
  await page.waitForTimeout(600); // (proving the camera stays put)
  expect((await w3(page, (w) => w.view())).camZ).toBeCloseTo(pinched.camZ, 1);
});

test('/world3d, the POC\'s address, opens the island in 3D; without the flag the island is 2D', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`world3d/?${Q}`);
  await expect(page).toHaveURL(/island=3d/);
  await ready(page);
  await page.goto(`?${Q}`);
  await expect(page.locator('.if-scene')).toBeVisible();
  await expect(page.locator('canvas[data-w3d]')).toHaveCount(0);
});
