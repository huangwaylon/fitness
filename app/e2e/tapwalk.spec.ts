// Tap-to-walk and the campsite's door (spec §3–4, docs/design.md "Walking", "Buildings"): a tap on empty ground sends
// my villager there along nav.ts's way (never through the water), a cream ring marks the spot, the walk stays for the
// day, the camera stays where the finger left it; a tap on the water acts in place (no walk): a ripple. The tent's door
// is the one exception: my villager walks up to it, then goes in.
import { expect, test, type Page } from '@playwright/test';
import { camTo, campDoor, geo, lawnTap, openNear, tapOn } from './island.ts';
import { mkdirSync } from 'node:fs';

/** A tap on the tent where it is the tent's (a villager may stand in front of its door). */
async function tapTent(p: Page) {
  await tapOn(p, p.locator('[data-building="campsite"] .door'));
}

test.use({ viewport: { width: 390, height: 844 } });

type W = {
  go(z: number): void; cam(): number; at(x: number, z: number): [number, number]; put(x: number, z: number): void;
  mine(): [number, number]; stops(): number[];
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
  if (cam !== undefined) await camTo(page, cam, false);
}

/** The camera at おく (the campsite's end: world.ts CAMS as the page has them), held there (camTo). */
const oku = async (page: Page) => camTo(page, (await geo(page)).CAMS.oku, false);

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
  await open(page);
  const g = await geo(page), door = campDoor(g);
  // the lawn in front of the campsite (clear of the day's weeds: a weed's thumb-sized box reaches far up the 3D
  // island's far end), the camera in front of it
  await camTo(page, door[1] - 408, false);
  const to = await openNear(page, door[0], door[1] - 108, 45, true);
  const [x, y] = await call(page, (w, [x, z]) => w.at(x, z), to);
  await page.mouse.click(x, y);
  await expect(page.locator('.tap-ring')).toHaveCount(1);
  await shot(page, 'tap-ring');
  const path = await track(page);
  const end = path.at(-1)!;
  expect(Math.hypot(end[0] - to[0], end[1] - to[1])).toBeLessThan(3);
  // never in the pond
  const { x: ox, z: oz, rx, rz } = g.POND;
  for (const [px, pz] of path) expect(((px - ox) / rx) ** 2 + ((pz - oz) / rz) ** 2).toBeGreaterThan(1);
  await shot(page, 'after-run');
});

test('a tap on the pond casts from where my villager stands and walks nowhere; the grass reels in, then walks; a walk stays for the session', async ({ page }) => {
  // (no critters: nothing bites while the line is out)
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await open(page, '&date=2026-07-01T10:00&critter=none');
  const { POND } = await geo(page);
  await camTo(page, POND.z - 212, false);
  const home = await call(page, (w) => w.mine());
  const [x, y] = await call(page, (w, [x, z]) => w.at(x, z), [POND.x, POND.z]);
  await page.mouse.click(x, y);
  // any water casts (fishing has no reach): the line out to it, my villager where it stood
  await expect.poll(() => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? [])).toContain('scene-cast');
  await expect(page.locator('.tap-ring')).toHaveCount(0);
  expect((await track(page, 1500)).at(-1)).toEqual(home);
  // the first tap on the grass is the reel (NH reels in to move): it stays put
  // (well off its bank: a tap within a finger's slack of the water casts)
  const { at: grass, x: gx, y: gy } = await lawnTap(page, POND.x + 80, POND.z - 60);
  await page.mouse.click(gx, gy);
  await expect(page.locator('[data-bobber]')).toHaveCount(0);
  expect((await track(page, 600)).at(-1)).toEqual(home);
  // the next walks there, and it's still there after a reload
  // (on this screen with nothing over it: lawnTap; open ground off screen or under a thumb's tap area took the tap elsewhere)
  await page.mouse.click(gx, gy);
  const end = (await track(page)).at(-1)!;
  expect(Math.hypot(end[0] - grass[0], end[1] - grass[1])).toBeLessThan(3);
  await page.reload();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(400);
  const again = await call(page, (w) => w.mine());
  expect(Math.hypot(again[0] - end[0], again[1] - end[1])).toBeLessThan(2);
});

test('the camera never moves for a walk: a run up the island leaves it where the finger left it', async ({ page }) => {
  await open(page);
  const [front] = await call(page, (w) => w.stops());
  expect(await call(page, (w) => w.cam())).toBe(front);
  const { x, y } = await lawnTap(page, 230, 500);
  await page.mouse.click(x, y);
  await expect(page.locator('.tap-ring')).toHaveCount(1);
  await page.waitForTimeout(2500);
  expect(await call(page, (w) => w.cam())).toBe(front);
});

test('the campsite: a tap from far off walks my villager up to the door (no ring), then it goes in', async ({ page }) => {
  await open(page, '&date=2026-07-01T10:00&visitor=none');
  await oku(page);
  const home = await call(page, (w) => w.mine());
  await tapTent(page);
  await page.waitForTimeout(300);
  // on its way (not in yet), no ring: it's going in, not to a spot
  expect(page.url()).not.toMatch(/\/tent\?/);
  expect(await call(page, (w) => w.mine())).not.toEqual(home);
  await expect(page.locator('.tap-ring')).toHaveCount(0);
  await expect(page).toHaveURL(/\/tent\?/, { timeout: 8000 });
});

test('the campsite: near its door my villager goes straight in', async ({ page }) => {
  await open(page, '&date=2026-07-01T10:00&visitor=none');
  await oku(page);
  const door = campDoor(await geo(page));
  // (about where it stands just out of the tent: buildings.ts outOf)
  await call(page, (w, [x, z]) => w.put(x, z), [door[0] - 12, door[1] - 30]);
  await tapTent(page);
  await expect(page).toHaveURL(/\/tent\?/, { timeout: 1500 });
});

test('the campsite: a tap on the lawn on the way up is the end of going in', async ({ page }) => {
  await open(page, '&date=2026-07-01T10:00&visitor=none');
  await oku(page);
  await tapTent(page);
  await page.waitForTimeout(250);
  const door = campDoor(await geo(page)), lawn = await openNear(page, door[0] - 76, door[1] - 68);
  const [x, y] = await call(page, (w, [x, z]) => w.at(x, z), lawn);
  await page.mouse.click(x, y);
  await page.waitForTimeout(4000);
  expect(page.url()).not.toMatch(/\/tent\?/);
});

test('a tap at the tent’s foot goes in too (the footprint is the campsite’s)', async ({ page }) => {
  await open(page, '&date=2026-07-01T10:00&visitor=none');
  await oku(page);
  // the ground just inside the tent's footprint (taps on the art itself are the door button's)
  await page.addStyleTag({ content: '[data-building] .door { pointer-events: none !important; }' });
  const b = (await geo(page)).BUILDINGS.find((b) => b.id === 'campsite')!;
  const [x, y] = await call(page, (w, [x, z]) => w.at(x, z), [b.x - 26, b.z + 16]);
  await page.mouse.click(x, y);
  await expect(page.locator('.tap-ring')).toHaveCount(0);
  await expect(page).toHaveURL(/\/tent\?/, { timeout: 8000 });
});
