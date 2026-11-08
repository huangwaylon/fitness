// The e2e's logic mode (docs/ops/test-strategy.md "Logic mode", src/lib/ui-state/testMode.ts): with drawing off the 3D
// island runs its game (its frames, the camera, the tap areas, the World's step) and makes no draw call; and the test
// API that acts on the game by what it knows, not by pixels (e2e/island.ts): `tapThing` taps a model by its id where
// the camera puts it, `settled` waits for the island at rest, `step` runs the page's clock (the engines' frames with it).
import { expect, test, type Page } from './fixtures.ts';
import { lawnTap, pauseNow, settled, step, tapThing, w3 } from './island.ts';

const Q = 'demo&date=2026-11-04T12:00&rock=clonk&render=none';
const ready = (page: Page) => page.waitForFunction(() => (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 30_000 });
const mine = (page: Page) => page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());

test('drawing off: the 3D island runs its frames and its game and draws nothing; the rock tapped by its id clonks', async ({ page }) => {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?${Q}`);
  await ready(page);
  const s = await w3(page, (w) => w.stats());
  expect(s.drawn).toBe(false);
  expect(s.calls).toBe(0);
  expect(s.frames).toBeGreaterThan(0);
  await settled(page);
  await tapThing(page, 'rock', { lift: 8 });
  await expect.poll(() => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? [])).toContain('scene-clonk');
});

test('the sim step: on the page\'s clock a ground tap walks my villager only as the clock runs', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-04T12:00:00+09:00') });
  await page.goto(`?${Q}`);
  // (the clock runs the load's timers and frames: the island comes up as it steps)
  await expect.poll(async () => (await step(page, 500), page.evaluate(() => !!(window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded())), { timeout: 30_000 }).toBe(true);
  await step(page, 3000);
  const { at: [lx, lz], x, y } = await lawnTap(page, 200, 300);
  await expect.poll(async () => (await step(page, 200), page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.matches('.stage'), [x, y]))).toBe(true);
  // the clock held (paused: installed, it ran on with the wall clock between the round trips, 15 px on a loaded runner)
  await pauseNow(page);
  const from = await mine(page);
  await page.mouse.click(x, y);
  // my villager hasn't gone far
  const held = await mine(page);
  expect(Math.hypot(held[0] - from[0], held[1] - from[1])).toBeLessThan(14);
  // ten seconds of the game's time, frame by frame (quick: nothing is drawn)
  await step(page, 10_000);
  const [ax, az] = await mine(page);
  expect(Math.hypot(ax - lx, az - lz)).toBeLessThan(14);
});
