// The bite's 「！」 over the angler's head (the user: "I want it to appear correctly above the player's head and face
// towards the user… account for zoom and all"): world3d/biteMark.ts draws it in the island's world on the head as it's
// posed (the head bone and its top), bent with the island at its anchor, square on to the camera, NH's size held to
// 30–52 px. Held up here (__world3d.pinBite: a fish's bite lasts a second) and read as drawn, against the head on
// screen: at zoom 1, 2 and 3.2, panned up the island and sideways, standing and seated on the front bench. The real
// bite's is fishing3d.spec's (and the partner's, on the other phone, fish-sync.spec's).
import { expect, test, type Page } from './fixtures.ts';
import { geo, loaded3d } from './island.ts';
import { overHead, type Mark } from './biteMark.ts';

test.use({ viewport: { width: 393, height: 852 } });
const SHOTS = process.env.SHOTS;

type W3 = {
  loaded(): boolean; go(z: number, k?: number, x?: number): void; pan(dy: number, dx?: number): void; camStill(): boolean;
  bite(slot: string): Mark | null; pinBite(slot: string | null): void; view(): { camZ: number; zoom: number; camX: number };
};
const w3 = <R,>(page: Page, fn: (w: W3) => R) => page.evaluate(`(${fn.toString()})(window.__world3d)`) as Promise<R>;
const mark = (page: Page) => w3(page, (w) => w.bite('mine'));
const still = (page: Page) => expect.poll(() => w3(page, (w) => w.camStill()), { timeout: 8000 }).toBe(true);

/** The ground's height under a mark (u). */
const ground = (page: Page, m: Mark) =>
  page.evaluate(([x, z]) => (window as unknown as { __world: { height(x: number, z: number): Promise<number> } }).__world.height(x, z), [m.at[0], -m.at[2]] as const);
/** The camera on my villager at zoom k, then the 「！」 over its head; its size on screen (px) and where it is (u). */
async function at(page: Page, k: number, tag: string, dx = 0): Promise<Mark> {
  const [x, z] = await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
  await page.evaluate(([z, k, x]) => (window as unknown as { __world3d: W3 }).__world3d.go(z, k, x), [z - 10, k, x + dx] as const);
  await still(page);
  // (its pop in over: at its size)
  await expect.poll(async () => { const m = await mark(page); return m ? m.s / m.size : 0; }, { timeout: 3000 }).toBeGreaterThan(0.99);
  await expect.poll(async () => overHead(await mark(page)), { timeout: 3000, message: tag }).toEqual([]);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/bite-${tag}.png` });
  return (await mark(page))!;
}

test('the bite’s 「！」 is over my villager’s head at every zoom, panned, standing and seated', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('?demo&date=2026-11-04T12:00');
  await loaded3d(page);
  // my 3D villager in (its head bone: the anchor)
  await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3?: { state(s: string): string | null } }).__villagers3?.state('mine') ?? null), { timeout: 30_000 }).toBe('idle');
  await w3(page, (w) => w.pinBite('mine'));
  // standing, at each zoom: NH's size in the world held to 30 px at the widest and 52 fully in
  const sizes: number[] = [];
  for (const k of [1, 2, 3.2]) sizes.push((await at(page, k, `stand-${k}`)).px);
  expect(sizes[0]).toBeCloseTo(30, 0);
  expect(sizes[1]).toBeGreaterThan(30);
  expect(sizes[2]).toBeCloseTo(52, 0);
  // panned (a finger's drag up the island, and sideways zoomed in): it stays on the head
  const stand = await at(page, 2, 'stand-2-left', -16), standUp = stand.at[1] - (await ground(page, stand));
  await page.evaluate(() => (window as unknown as { __world3d: W3 }).__world3d.pan(40));
  await still(page);
  await expect.poll(async () => overHead(await mark(page)), { timeout: 3000, message: 'panned' }).toEqual([]);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/bite-panned.png` });
  // seated on the front bench: over its own head there
  const seat = (await geo(page)).SEATS.seatMaeL;
  await page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z), seat);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3: { state(s: string): string | null } }).__villagers3.state('mine')), { timeout: 8000 }).toBe('sit');
  // (sat down: its pose settled)
  await page.waitForTimeout(800);
  for (const k of [1, 3.2]) {
    const m = await at(page, k, `seated-${k}`);
    // (on the bench its head is about as high as standing: a villager's short legs a little higher, a human player's
    // longer ones lower, ~15 % of its standing height; never up at a standing head's height over a seated one)
    const dy = m.at[1] - (await ground(page, m)) - standUp;
    expect(dy, 'its head’s height seated').toBeLessThan(12);
    expect(dy, 'its head’s height seated').toBeGreaterThan(-0.25 * standUp);
  }
  // let go: it pops out
  await w3(page, (w) => w.pinBite(null));
  await expect.poll(async () => (await mark(page))?.shown, { timeout: 2000 }).toBe(false);
});
