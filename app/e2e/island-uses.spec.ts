// The island's pieces used (docs/design.md "Decorating: the gym", "The outdoor catalogue"): an outdoor catalogue piece
// (`nh-<code>`) is tappable once its table is in (island/decor.svelte.ts isDecorKind: its kinds join after the module
// loads) and its seat is the walk's (store/layout.svelte.ts tells the site again: its seats into world.ts SEATS); a
// tap on the springy ride-on rides it and the island settles to its ambient rate while it rocks; a bath soaks; the
// kettlebell's spot behind it is clear of its footprint, so my villager walks over and swings it; an instrument outdoors
// is walked up to and played (tent/playPose.ts, island/islandPlay.ts). WebKit taps, Chromium clicks; SHOTS=<dir> keeps
// a picture of each at 393 × 852.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, feetOf, islandUp, tapOn } from './island.ts';

test.use({ viewport: { width: 393, height: 852 } });
const DATE = '2026-11-04T12:00';
type V3 = { state(s: string): string | null; playing(s: string): string | null };
const v3 = (page: Page) => page.evaluate(() => (window as unknown as { __villagers3?: V3 }).__villagers3?.state('mine') ?? null);
const playing = (page: Page) => page.evaluate(() => (window as unknown as { __villagers3?: V3 }).__villagers3?.playing('mine') ?? null);

/** The island with one piece of `k` put down on the lawn left of the main path (tile 8 × 12), the camera on it: its id. */
async function withPiece(page: Page, k: string): Promise<string> {
  const op = { sc: 'o', id: `use-${k}`, at: 1793708607120, k, x: 8, z: 12, f: 0, who: 'A' };
  await page.addInitScript((op) => localStorage.setItem('island-demo.layout', JSON.stringify([op])), op);
  await page.goto(`?demo&date=${DATE}`);
  await islandUp(page);
  await expect.poll(() => v3(page), { timeout: 30_000 }).not.toBeNull();
  // (tappable: the outdoor table in, its tap areas up)
  await expect.poll(() => page.evaluate((id) => (window as unknown as { __world3d: { box(k: string, id: string): { width: number } | null } }).__world3d.box('decor', id)?.width ?? 0, op.id), { timeout: 15_000 }).toBeGreaterThan(0);
  await camTo(page, 300);
  return op.id;
}
/** Close on my villager for a picture. */
async function shot(page: Page, name: string) {
  if (!process.env.SHOTS) return;
  const f = (await feetOf(page))!;
  await page.evaluate(([z, k]) => (window as unknown as { __world3d: { go(z: number, k: number): void } }).__world3d.go(z, k), [f[1] - 230, 2.5]);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { camStill(): boolean } }).__world3d.camStill())).toBe(true);
  await page.screenshot({ path: `${process.env.SHOTS}/${name}.png` });
}

test('an outdoor springy ride-on: tapped, ridden; the island settles while it rocks', async ({ page, browserName }) => {
  const id = await withPiece(page, 'nh-f4379');
  await tapOn(page, 'decor', id, { mouse: browserName !== 'webkit' });
  await expect.poll(() => v3(page), { timeout: 15_000 }).toBe('sit');
  // (the rock is the ambience's: nothing at the full rate once it's on)
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { idle(): boolean } }).__world3d.idle()), { timeout: 10_000 }).toBe(true);
  await shot(page, 'ride-on');
});

for (const [k, name] of [['nh-f4008', 'kettle-bath'], ['oil-barrel-bathtub', 'drum-can'], ['nh-f3345', 'lifeguard-chair']] as const)
  test(`the ${name}: tapped, my villager gets in`, async ({ page, browserName }) => {
      const id = await withPiece(page, k);
    await tapOn(page, 'decor', id, { mouse: browserName !== 'webkit' });
    await expect.poll(() => v3(page), { timeout: 15_000 }).toBe(k === 'nh-f3345' ? 'sit' : 'soak');
    await shot(page, name);
  });

for (const [k, use] of [['kettlebell', 'swing'], ['barbell', 'curl'], ['climbing-wall', 'climb'], ['exercise-ball', 'bounce']] as const)
  test(`the ${k}: tapped, my villager walks over and ${use}s`, async ({ page, browserName }) => {
      const id = await withPiece(page, k);
    await tapOn(page, 'decor', id, { mouse: browserName !== 'webkit' });
    await expect.poll(() => v3(page), { timeout: 15_000 }).toBe(use);
    await shot(page, k);
  });

test('an outdoor drum: walked up to and played, its pose till its riff is over', async ({ page, browserName }) => {
  const id = await withPiece(page, 'nh-f13774');
  const from = (await feetOf(page))!;
  await tapOn(page, 'decor', id, { mouse: browserName !== 'webkit' });
  await expect.poll(() => playing(page), { timeout: 15_000, intervals: [50] }).toBe('drums');
  const at = (await feetOf(page))!;
  expect(Math.hypot(at[0] - from[0], at[1] - from[1]), 'walked up to it').toBeGreaterThan(10);
  await shot(page, 'drum');
  // (over after its riff, toggles.ts PLAY_MS)
  await expect.poll(() => playing(page), { timeout: 8000 }).toBeNull();
});
