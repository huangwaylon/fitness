// Scenery taps (docs/design.md "Scene interactions"): the bushes, flowers, grass, sun and clouds answer a tap with a
// short flourish, and nothing else: no sheet, no navigation, no ベル. The trees, the villagers and the HUD still work.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, feetOf, float, fxSince, geo, islandUp, lawnTap, oku, pageNow, piece, pointOn, tapOn, type W3 } from './island.ts';
import { hudBells } from './hud.ts';

/** The island is up (its first paint: now and then over 5 s under CI's load). */
const islandReady = (page: Page) => islandUp(page, { timeout: 15_000 });

type W = { at: (x: number, z: number) => [number, number]; go: (z: number) => void };
/** Open lawn at まえ: behind the partner's head, in front of the dig spots, between the trees. */
const lawn = (page: Page) => lawnTap(page, 240, 380);
/** The sea in front of the beach (まえ's foot), left of the beach's finds: as far out as this screen shows. */
const sea = (page: Page) =>
  page.evaluate(() => {
    const w = (window as unknown as { __world: W }).__world;
    for (let z = -40; z < -8; z += 2) {
      const [x, y] = w.at(60, z);
      if (y < innerHeight - 16) return { x, y };
    }
    const [x, y] = w.at(60, -8);
    return { x, y };
  });

/** A point on the sun / moon the finger can reach: its core (the middle 70%: SceneTaps' reach), where nothing of the
 *  HUD lies over the sky (the HUD's row can overlap a low orb on a short sky). */
const orb = (page: Page) =>
  page.locator('.if-scene .orb').evaluate((el) => {
    const b = el.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2, r = b.width * 0.3;
    for (let d = 0; d <= r; d += 4)
      for (const [dx, dy] of [[0, d], [0, -d], [d, 0], [-d, 0], [d, d], [-d, d], [d, -d], [-d, -d]]) {
        const hit = document.elementFromPoint(cx + dx, cy + dy);
        if (hit?.closest('.if-scene') && !hit.closest('button')) return { x: cx + dx, y: cy + dy };
      }
    return { x: cx, y: cy };
  });


test('scenery taps play a flourish and change nothing; trees, villagers and the health button still work', async ({ page }) => {
  // a fixed midday (Tokyo): without it the orb is the moon from 19:00 and the sun row below fails every evening
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandReady(page);
  const bellsRow = hudBells(page);
  const health = page.locator('.hud-health');
  const bells = await bellsRow.getAttribute('aria-label');
  const url = page.url();

  // (open lawn is a walk: my villager runs there, its tap ring on the ground instead of a dust puff)
  const taps: [string, () => Promise<{ x: number; y: number }>, string | { fx: string }][] = [
    ['bush', async () => (await pointOn(page, 'bush', 'plumeria-w'))!, { fx: 'leaves' }], // the white plumeria at the beach's edge (the ground's flourishes: the 3D island's, fxLog)
    // (one of the front lawn's: in view at まえ)
    ['flower', async () => (await pointOn(page, 'flower', (await geo(page)).FLOWERS.filter((f) => f.z < 600).sort((a, b) => a.z - b.z)[0].id))!, { fx: 'drops' }],
    ['grass', () => lawn(page), { fx: 'ring' }],
    ['sun', () => orb(page), '[data-fx="sun"]']
  ];
  for (const [name, at, sel] of taps) {
    const t0 = await pageNow(page), { x, y } = await at();
    await page.mouse.click(x, y);
    if (typeof sel === 'string') await expect(page.locator(sel), name).toHaveCount(1);
    else await expect.poll(() => fxSince(page, sel.fx, t0), { message: name }).toBe(1);
    await expect(page.locator('dialog[open]'), name).toHaveCount(0);
  }
  // the sea casts the line there (any water: no reach), and the next tap reels it in
  const s = await sea(page);
  await page.mouse.click(s.x, s.y);
  await expect.poll(() => float(page), { message: 'sea' }).not.toBeNull();
  await page.waitForTimeout(400);
  await page.mouse.click(s.x, s.y);
  await expect.poll(() => float(page), { message: 'reeled' }).toBeNull();
  await expect(page.locator('dialog[open]'), 'sea').toHaveCount(0);
  // a flourish is gone within ~1 s, and nothing else moved
  await expect(page.locator('[data-fx]')).toHaveCount(0, { timeout: 4000 }); // a flourish waits for my villager's walk (≤ 0.9 s)
  expect(page.url()).toBe(url);
  await expect(bellsRow).toHaveAttribute('aria-label', bells!);

  // the trees: a canopy tap opens its popup; a tap on the scenery then only closes it (no flourish)
  await tapOn(page, 'goal', 'A');
  await expect(page.locator('.detail')).toHaveCount(1);
  // (lawn outside the popup's box, once the camera is still: a tap inside it never closes it, IslandScene)
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { camStill(): boolean } }).__world3d.camStill())).toBe(true);
  const pop = (await page.locator('.detail').boundingBox())!;
  const below = await page.evaluate((y) => (window as unknown as { __world3d: { ground(x: number, y: number): { x: number; z: number } } }).__world3d.ground(205, y), Math.min(page.viewportSize()!.height - 60, pop.y + pop.height + 70));
  const g = await lawnTap(page, below.x, below.z);
  expect(g.y, 'the lawn under the popup').toBeGreaterThan(pop.y + pop.height);
  await page.mouse.click(g.x, g.y);
  await expect(page.locator('.detail')).toHaveCount(0);
  await expect(page.locator('[data-fx]')).toHaveCount(0);

  // neither villager opens a sheet (the partner is a high-five, mine a squish)
  await tapOn(page, 'villager', 'partner');
  await page.waitForTimeout(400);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await tapOn(page, 'villager', 'mine');
  await page.waitForTimeout(400);
  await expect(page.locator('dialog[open]')).toHaveCount(0);

  // the dumbbell is still the doorway to けんこう
  await health.click();
  await expect(page.locator('dialog[open] [data-health-sheet]')).toBeVisible();
});

test('night sky: the moon twinkles; a tap in the open sky lights a star (shooting stars come in showers: sky.spec)', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T22:00');
  await islandReady(page);
  await expect(page.locator('.if-scene[data-tod="night"]')).toHaveCount(1);
  const moon = await orb(page);
  await page.mouse.click(moon.x, moon.y);
  await expect(page.locator('[data-fx="moon"]')).toHaveCount(1);
  await expect(page.locator('[data-fx="shoot"]')).toHaveCount(0);
  await expect(page.locator('[data-fx]')).toHaveCount(0, { timeout: 2500 });
  // the open sky, away from the moon and the clouds (and from a roof or a tree top reaching into it: their tap areas,
  // the 3D pick's): a star twinkles where the finger was
  const sky = await page.locator('.if-scene').evaluate((sc) => {
    const r = sc.getBoundingClientRect(), horizon = r.top + Number((sc as HTMLElement).dataset.horizon);
    const o = document.querySelector('.if-scene .orb')!.getBoundingClientRect();
    const clouds = [...document.querySelectorAll('.if-scene .cloud')].map((c) => c.getBoundingClientRect());
    const pick = (window as unknown as { __world3d: W3 }).__world3d.pick;
    for (let y = r.top + 60; y < horizon - 10; y += 8)
      for (let x = r.left + 30; x < r.right - 30; x += 12) {
        const clear = (b: DOMRect) => Math.abs(x - (b.left + b.width / 2)) > Math.max(44, b.width) / 2 + 10 || Math.abs(y - (b.top + b.height / 2)) > Math.max(44, b.height) / 2 + 10;
        const hit = document.elementFromPoint(x, y);
        if (clear(o) && clouds.every(clear) && hit && !hit.closest('button, a, [role="button"], [tabindex]') && !pick(x, y)) return { x, y };
      }
    return null;
  });
  expect(sky, 'an open patch of night sky').not.toBeNull();
  await page.mouse.click(sky!.x, sky!.y);
  await expect(page.locator('[data-fx="star"]')).toHaveCount(1);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('the campfire by the tent: unlit by day, its flames and light at night; a tap pokes it where it is (embers, a crackle)', async ({ page }) => {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  const go = async (when: string) => {
    await page.goto(`?demo&date=${when}`);
    await islandReady(page);
    await page.waitForFunction(() => (window as unknown as { __world?: W }).__world);
    // (held there and at rest: the campfire's box is read for the tap where the island draws it)
    await camTo(page, await oku(page));
  };
  await go('2026-11-04T12:00');
  await expect.poll(() => piece(page, 'campfire')).toMatchObject({ lit: false });
  await go('2026-11-04T22:00');
  await expect.poll(async () => (await piece(page, 'campfire'))?.lit).toBe(true);
  const home = await feetOf(page);
  const f = (await pointOn(page, 'campfire', 'campfire'))!, t0 = await pageNow(page);
  await page.mouse.click(f.x, f.y);
  await expect.poll(() => fxSince(page, 'sparks', t0)).toBe(1); // (the embers: the 3D island's)
  expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('scene-campfire');
  await page.waitForTimeout(400);
  expect(await feetOf(page)).toEqual(home); // nobody walked
});
