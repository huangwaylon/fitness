// The island in 3D (?island=3d, せってい's switch: docs/decisions.md "The island in 3D"): the 2D island never loads
// three; the 3D one draws its canvas under the DOM island, a tap on open lawn walks my villager, one finger scrolls
// along the island only (z, never x), two pinch the zoom, and /world3d (the POC's address) opens it.
import { expect, test, type Page } from '@playwright/test';

type W3 = {
  xRoom(k?: number): number;
  stats(): { frames: number; calls: number; tris: number; dpr: number; loading: number; fps: number };
  loaded(): boolean;
  view(): { camZ: number; zoom: number; pitch: number; camX: number };
  limits(): { min: number; max: number };
  client(x: number, z: number, lift?: number): [number, number];
  go(z: number, k?: number, x?: number): void;
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

test('the 3D camera: at the default zoom one finger scrolls along the island only, two pinch the zoom, nothing else moves it', async ({ page }) => {
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

test('the 3D camera zoomed in: one finger pans sideways too, held over the island; a pinch past the default springs back, centred', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`?${Q}&island=3d`);
  await ready(page);
  const touch = await page.context().newCDPSession(page).catch(() => null);
  test.skip(!touch, 'touch events need CDP (Chromium)');
  const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', pts: { x: number; y: number }[]) => touch!.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ ...p, id: i })) });
  const idle = () => expect.poll(() => page.evaluate(() => (window as unknown as { __world: { idle(): boolean } }).__world.idle()), { timeout: 15_000 }).toBe(true);
  const drag = async (x0: number, dx: number, n: number) => {
    await send('touchStart', [{ x: x0, y: 500 }]);
    for (let i = 1; i <= n; i++) await send('touchMove', [{ x: x0 + i * dx, y: 500 }]);
    await send('touchEnd', []);
    await idle();
  };
  // zoomed in, a sideways drag pans x (with the finger: the view moves right as it goes left), as far as the room lets it
  await w3(page, (w) => w.go(300, 1.5));
  expect(await w3(page, (w) => w.xRoom())).toBeGreaterThan(5);
  await drag(300, -24, 5);
  const panned = await w3(page, (w) => ({ ...w.view(), room: w.xRoom() }));
  expect(panned.camX).toBeGreaterThan(195 + 5);
  expect(panned.camX).toBeLessThanOrEqual(195 + panned.room + 0.01);
  // far past the edge: held at the island plus its sea margin
  await drag(380, -70, 5);
  const edge = await w3(page, (w) => ({ ...w.view(), room: w.xRoom() }));
  expect(edge.camX).toBeCloseTo(195 + edge.room, 1);

  // a pinch together past the default: it gives (zoomed out under 1 while held), x centred; let go, it springs back
  // to exactly the default, centred
  await send('touchStart', [{ x: 60, y: 420 }, { x: 330, y: 440 }]);
  for (let i = 1; i <= 6; i++) await send('touchMove', [{ x: 60 + i * 20, y: 420 }, { x: 330 - i * 20, y: 440 }]);
  const held = await w3(page, (w) => w.view());
  expect(held.zoom).toBeLessThan(1);
  expect(held.camX).toBeCloseTo(195, 3);
  await send('touchEnd', []);
  await idle();
  const back = await w3(page, (w) => w.view());
  expect(back.zoom).toBeCloseTo(1, 4);
  expect(back.camX).toBeCloseTo(195, 4);
  // and at the default a sideways drag moves nothing sideways
  await drag(300, -24, 5);
  expect((await w3(page, (w) => w.view())).camX).toBeCloseTo(195, 4);
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

test('the board\'s focus: the camera frames a thing, the finger does nothing meanwhile, and restore() goes back exactly', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`?${Q}&island=3d`);
  await ready(page);
  const before = await w3(page, (w) => w.view());
  await page.evaluate(() => (window as unknown as { __world3d: { focus(x: number, z: number, l: number): Promise<void> } }).__world3d.focus(150, 60, 20));
  const on = await w3(page, (w) => w.view());
  expect(on.zoom).toBeGreaterThan(2);
  // a drag while focused: nothing moves
  await page.mouse.move(200, 400);
  await page.mouse.down();
  await page.mouse.move(200, 600, { steps: 8 });
  await page.mouse.up();
  expect((await w3(page, (w) => w.view())).camZ).toBeCloseTo(on.camZ, 3);
  await page.evaluate(() => (window as unknown as { __world3d: { restore(): Promise<void> } }).__world3d.restore());
  const after = await w3(page, (w) => w.view());
  expect(after.camZ).toBe(before.camZ);
  expect(after.zoom).toBe(before.zoom);
  expect(after.pitch).toBe(before.pitch);
});

test('nothing drawn strays off the island: no NaN or far-flung vertex (the falling leaves\' lines), no material warnings', async ({ page }) => {
  test.setTimeout(60_000);
  const warns: string[] = [];
  page.on('console', (m) => (m.type() === 'warning' || m.type() === 'error') && /THREE/.test(m.text()) && warns.push(m.text()));
  // the autumn's falling leaves round the camera (NH's leaf models: quantized, so a baked matrix overflowed them)
  await page.goto(`?${Q}&island=3d`);
  await ready(page);
  const strays = () => page.evaluate(() => (window as unknown as { __world3d: { strays(): unknown[] } }).__world3d.strays());
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { stats(): { calls: number } } }).__world3d.stats().calls)).toBeGreaterThan(10);
  for (let i = 0; i < 12; i++) {
    expect(await strays()).toEqual([]);
    await page.waitForTimeout(300); // (sampling the flourishes as they come and go)
  }
  expect(warns).toEqual([]);
});

test('at night the glows add light without touching the canvas\'s alpha (a lamp\'s halo over the sky was a black box)', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`?demo&date=2026-11-04T22:00&critter=none&visitor=none&island=3d`);
  await ready(page);
  // at the front at the closest zoom, the far lamps' halos behind the campsite's trees
  await page.evaluate(() => {
    const w = (window as unknown as { __world3d: { go(z: number, k?: number): void; limits(): { min: number } } }).__world3d;
    w.go(w.limits().min, 99);
  });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { stats(): { calls: number } } }).__world3d.stats().calls)).toBeGreaterThan(10);
  expect(await page.evaluate(() => (window as unknown as { __world3d: { alphaBlends(): string[] } }).__world3d.alphaBlends())).toEqual([]);
});
