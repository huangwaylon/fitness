// The sky's clouds and sun move with the sky's height continuously (Clouds.svelte, Sky.svelte): a pinch out or the
// camera along the island moves the horizon, and the clouds once switched lanes at a 190px sky (a container query) —
// the default view's own height — so they jumped as a pinch crossed it and snapped back on its release (the user's
// report, 2026-11-28). Logic tier: DOM boxes only.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';

test.use({ viewport: { width: 390, height: 844 } });

type Sample = { band: number; c: number[]; orb: number };
/** The sky band's height and each cloud's and the sun's top in it (px), once the island has drawn two frames since
 *  the camera moved (its engine's frame count, not the page's clock). */
async function sample(page: Page): Promise<Sample> {
  const f0 = await page.evaluate(() => (window as unknown as { __world3d: { stats(): { frames: number } } }).__world3d.stats().frames);
  await page.waitForFunction((f0) => (window as unknown as { __world3d: { stats(): { frames: number } } }).__world3d.stats().frames >= f0 + 2, f0);
  return page.evaluate(() => {
    const band = document.querySelector('.sky:not(.lights) .band')!.getBoundingClientRect();
    const c = [...document.querySelectorAll('.sky:not(.lights) .cloud')].map((e) => e.getBoundingClientRect().top - band.top);
    const orb = document.querySelector('.sky.lights .orb')!.getBoundingClientRect().top - document.querySelector('.sky.lights .band')!.getBoundingClientRect().top;
    return { band: band.height, c, orb };
  });
}
const go = (page: Page, z: number, k: number) => page.evaluate(([z, k]) => (window as unknown as { __world3d: { go(z: number, k: number): void } }).__world3d.go(z, k), [z, k] as const);

/** No step of a sweep moves a cloud or the sun more than the sky's own height changed (and a px or two). */
function smooth(steps: Sample[], what: string) {
  for (let i = 1; i < steps.length; i++) {
    const a = steps[i - 1], b = steps[i], slack = Math.abs(b.band - a.band) + 2;
    b.c.forEach((y, j) => expect(Math.abs(y - a.c[j]), `${what}: cloud ${j + 1}, sky ${a.band.toFixed(0)} → ${b.band.toFixed(0)}px`).toBeLessThanOrEqual(slack));
    expect(Math.abs(b.orb - a.orb), `${what}: the sun, sky ${a.band.toFixed(0)} → ${b.band.toFixed(0)}px`).toBeLessThanOrEqual(slack);
  }
}

test('the clouds and the sun glide with the sky as a pinch zooms out and as the camera goes along the island, never jump', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandUp(page);
  // (a phone's status bar: the sky band starts below the safe area, so the default view's band is under 190px and the
  // widest's over it, as on an iPhone in the home-screen app)
  await page.addStyleTag({ content: ':root { --safe-top: 30px; }' });
  const { min, max } = await page.evaluate(() => (window as unknown as { __world3d: { limits(): { min: number; max: number } } }).__world3d.limits());
  const pinch: Sample[] = [];
  for (let i = 0; i <= 20; i++) (await go(page, 600, 1 - i / 100), pinch.push(await sample(page)));
  expect(pinch.length).toBe(21);
  // (the sweep crosses the old 190px switch)
  expect(Math.min(...pinch.map((s) => s.band))).toBeLessThan(185);
  expect(Math.max(...pinch.map((s) => s.band))).toBeGreaterThan(195);
  smooth(pinch, 'pinch out');
  // zoomed out, along the island to its far end (the camera lifts as the ground rises: the horizon moves)
  const along: Sample[] = [];
  for (let z = min; z <= max; z += 50) (await go(page, z, 0.8), along.push(await sample(page)));
  smooth(along, 'zoomed out, along the island');
});
