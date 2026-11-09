// The fresh waters (docs/design.md "Fishing"): NH's fresh-water fish by where you cast (the pond, the river's reaches,
// the river mouth on the west beach, the clifftop river and the spring), each fished exactly like the sea's: a tap in
// the water near the shadow casts, the fish nibbles and bites, a tap on the bite catches it with NH's catch line, and
// the first of each is a ずかん find. `?critter=pond|river|mouth|clifftop|<fresh fish id>` (with ?demo) brings one now;
// the camera goes to where it lives (window.__world.go).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';
import { FISH } from '../src/lib/components/island/critters.ts';
import { POND_FISH, freshPool } from '../src/lib/components/island/pondFish.ts';
import { camTo, castIn, geo, reelOnBite, type Geo } from './island';
import { fromMenu, hudBells } from './hud.ts';

const said = (id: keyof typeof CATCH_LINES) => CATCH_LINES[id][0].replace(/\s+/g, ' ');
const at = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);
const finds = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? [])
    .filter((e: { type: string }) => e.type === 'find').map((e: { data: unknown }) => e.data));
type W = { __world: { go(z: number): void; at(x: number, z: number): [number, number] } };
/** Move the camera (instantly), held there (camTo: a single move was now and then undone by the scene's own fit as it
 *  opened, the camera back at まえ with the water's shadow out of view) and still. */
const cam = (page: Page, z: number) => camTo(page, z, false);
/** The pond's water on screen (client px): its oval's box from the world. */
const pond = (page: Page) => page.evaluate(() => {
  const w = (window as unknown as W & { __world: { geo(): Geo } }).__world, { x, z, rx, rz } = w.geo().POND;
  const [l] = w.at(x - rx, z), [r] = w.at(x + rx, z), [, near] = w.at(x, z - rz), [, far] = w.at(x, z + rz), [cx, cy] = w.at(x, z);
  return { x: cx, y: cy, w: r - l, h: near - far };
});

/** The island's camera stop (world.ts CAMS as the page's island has them: the layout's on it). */
const stop = async (page: Page, s: 'mae' | 'oku') => (await geo(page)).CAMS[s];
async function open(page: Page, q: string, at: 'mae' | 'oku' = 'oku') {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=2026-11-04T21:00${q}`);
  await islandUp(page);
  await cam(page, await stop(page, at));
  return { bells: await hudBells(page).getAttribute('aria-label'), url: page.url() };
}

/** Cast by the shadow in `water` from its bank (NH casts from where it stands: my villager put there, the camera on
 *  it), wait for the 「！」 and reel in with a tap where it cast (a fixed point could be a building's door: with the line
 *  out a door goes in, and the bite was missed). */
async function fish(page: Page, water: string) {
  const [x, y] = await castIn(page, water);
  await expect(page.locator('[data-bobber]')).toBeAttached();
  // any tap is the reel, the moment it bites (e2e/island.ts reelOnBite)
  await reelOnBite(page, x, y, 15_000);
}

// (one width: the target phones, iPhone 15 and 16, are 393 wide)
for (const vp of [{ width: 390, height: 844 }]) {
  test(`pond fishing at ${vp.width}: cast in the pond, the bite, a tap catches it, a ずかん find (no ベル)`, async ({ page }) => {
    await page.setViewportSize(vp);
    const before = await open(page, '&critter=carp');
    const shadow = page.locator('[data-critter="pond"][data-water="pond"]');
    await expect(shadow).toBeAttached();
    await expect(page.locator('[data-critter="fish"]')).toHaveCount(0); // the sea's own stays away while one is pinned
    await page.waitForTimeout(600);
    // the shadow swims in the pond, under no control
    const p = await pond(page), f = await at(page, '[data-critter="pond"]');
    expect(Math.abs(f.x - p.x)).toBeLessThan(p.w / 2);
    expect(Math.abs(f.y - p.y)).toBeLessThan(p.h / 2);
    expect(await page.evaluate(({ x, y }) => !document.elementFromPoint(x, y)?.closest('button'), f)).toBe(true);
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/critters-pond-${vp.width}.png` });
    await fish(page, 'pond');
    // (in place: the line runs from the bank)
    const plate = page.locator('[data-fx="catch"]');
    await expect(plate).toContainText(said('carp'));
    await expect(shadow).toHaveCount(0);
    expect(await cues(page)).toEqual(expect.arrayContaining(['scene-cast', 'scene-bite', 'scene-reel', 'scene-catch']));
    expect(await finds(page)).toEqual([{ kind: 'fish', id: 'carp' }]);
    // the plate's next page: it's in the ずかん now
    const box = page.locator('[data-fx="catch"].placed .catch-plate');
    await expect(box).toHaveAttribute('data-pages', '2');
    await box.click(); // finish
    await box.click(); // turn
    await expect(box.locator('.pg.now')).toContainText('ずかんに のったよ！');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    expect(page.url()).toBe(before.url);
    await expect(hudBells(page)).toHaveAttribute('aria-label', before.bells!);
  });
}

test('the stream at おく: a river fish (NH: River) in its reach, cast from the bank, caught with its line', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '&critter=river');
  const shadow = page.locator('[data-critter="pond"][data-water="river"]');
  await expect(shadow).toBeAttached();
  // (in view as it swims its reach: by the screen's foot it may be just under it a moment, the hunt's WebKit red)
  await expect.poll(async () => { const f = await at(page, '[data-water="river"]'); return f.x > 0 && f.x < 390 && f.y < 844; }, { timeout: 8000, message: 'the river fish on the screen' }).toBe(true);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/critters-river.png` });
  await fish(page, 'river');
  await expect(page.locator('[data-fx="catch"]')).toContainText('釣', { timeout: 4000 });
  const got = (await finds(page)) as { kind: string; id: string }[];
  expect(got).toHaveLength(1);
  expect(got[0].kind).toBe('fish');
  expect(freshPool('river')).toContain(got[0].id);
});

test("NH's own waters: the salmon at the river mouth, the char on the clifftop, the koi in the pond", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, water, end] of [['salmon', 'mouth', 'mae'], ['char', 'clifftop', 'oku'], ['koi', 'pond', 'oku']] as const) {
    expect(POND_FISH[id].water).toBe(water);
    await open(page, `&critter=${id}`, end);
    const z = await stop(page, end);
    const s = page.locator(`[data-critter="pond"][data-water="${water}"]`);
    await expect(s, id).toBeAttached();
    await cam(page, z);
    const p = await at(page, `[data-water="${water}"]`);
    expect(p.x, id).toBeGreaterThan(-20), expect(p.x, id).toBeLessThan(410);
    expect(p.y, id).toBeGreaterThan(0), expect(p.y, id).toBeLessThan(844);
    if (process.env.SHOTS && water === 'clifftop') await page.screenshot({ path: `${process.env.SHOTS}/critters-clifftop.png` });
  }
});

test.describe(() => {
  test.use({ ambient: 'on' }); // (the critters' own visits: ambient life, e2e/fixtures.ts)
  test('fresh-water fish come by on their own, in the fresh water their seed picks (the chunk loads with the first)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, '');
    // no fresh-water shadow yet: its table isn't loaded with the island
    const chunks = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /pondFish/.test(n)));
    expect(chunks).toEqual([]);
    // within a couple of visits a shadow swims in a fresh water: the one its seed picks, the same on both phones, in
    // view or not (the camera shows it when it sees that water: docs/backend.md#shared-world)
    // (the first: by then more than one fresh water may have its shadow, one a water at most)
    await expect(page.locator('[data-critter="pond"]').first()).toBeAttached({ timeout: 40_000 });
    const water = await page.locator('[data-critter="pond"]').first().getAttribute('data-water');
    expect(['pond', 'river', 'mouth', 'clifftop']).toContain(water);
  });
});

test('the ずかん lists every fish, the fresh waters’ and the sea’s, in NH’s order', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('?demo&date=2026-11-04T21:00');
  await islandUp(page);
  await fromMenu(page, 'zukan');
  const total = Object.keys(FISH).length + Object.keys(POND_FISH).length;
  await expect(page.locator('[data-zukan="fish"]')).toContainText(`0 / ${total}`);
  await page.locator('[data-zukan="fish"]').click();
  await expect(page.locator('.tile.unknown')).toHaveCount(total);
  expect(await page.locator('.tile').first().getAttribute('data-entry')).toBe('bitterling');
});

test('water bugs: a pondskater skates on fresh water on a summer day; a tap nets it (a ずかん bug)', async ({ page }) => {
  // (drawn under CI's software GL, a frame or two a second, its model comes late and trails the skater's quick glides
  // between frames, and the tap misses it; the logic tier runs it, as fishing3d.spec's bite)
  test.fixme(!!process.env.CI && process.env.E2E_RENDER !== 'none', 'CI drawn tier: the skater trails its glides under its software GL');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-07-04T12:00&critter=pondskater');
  await islandUp(page, { timeout: 15_000 });
  // (the camera stays where it opened: the skater comes on a fresh water in view then, the pond from まえ; a camera
  // moved to おく as it came left it off screen, its model faded out, and no bug-<n> was ever found shown)
  const bug = page.locator('[data-critter="pondskater"]');
  await expect(bug).toBeAttached();
  await page.waitForTimeout(800);
  // its 3D model (taps go by the model's spot, not the sprite's box): the world point and where it's drawn
  const model = () => page.evaluate(() => {
    type W3 = { where(id: string): { x: number; y: number; z: number; hidden?: boolean } | null; modelAt(id: string, lift?: number): [number, number] | null };
    const w = (window as unknown as { __world3d: W3 }).__world3d;
    // (bug-<n>: n counts every critter that came, the waters' shadows too)
    for (let n = 0; n < 1000; n++) {
      const p = w.where(`bug-${n}`);
      const at = w.modelAt(`bug-${n}`);
      if (p && at) return { x: p.x, z: -p.z, at };
    }
    return null;
  });
  // at rest between its glides (one glides 12 u in a third of a second, then rests a second or more: a spot read
  // mid-glide is behind it by the time the tap lands on a slow runner)
  let m = await model();
  await expect.poll(async () => {
    const was = m;
    await page.waitForTimeout(120);
    m = await model();
    return was && m ? Math.hypot(m.at[0] - was.at[0], m.at[1] - was.at[1]) : Infinity;
  }, { message: 'the skater at rest', timeout: 10_000 }).toBeLessThan(2);
  // on the water (NH: rivers and ponds): the island's fresh water under it, by the world's points (whichever water was
  // in view as it came: the pond, the river's reaches, the clifftop's)
  const ground = await page.evaluate(([x, z]) => (window as unknown as { __world: { ground(x: number, z: number): { fresh: string | null } } }).__world.ground(x, z), [m!.x, m!.z] as const);
  expect(ground.fresh).not.toBeNull();
  await page.mouse.click(m!.at[0], m!.at[1]);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('pondskater'), { timeout: 6000 });
  expect(await finds(page)).toEqual([{ kind: 'bug', id: 'pondskater' }]);
});
