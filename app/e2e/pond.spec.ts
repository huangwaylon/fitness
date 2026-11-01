// The fresh waters (docs/design.md "Fishing"): NH's fresh-water fish by where you cast (the pond, the river's reaches,
// the river mouth on the west beach, the clifftop river and the spring), each fished exactly like the sea's: a tap in
// the water near the shadow casts, the fish nibbles and bites, a tap on the bite catches it with NH's catch line, and
// the first of each is a ずかん find. `?critter=pond|river|mouth|clifftop|<fresh fish id>` (with ?demo) brings one now;
// the camera goes to where it lives (window.__world.go).
import { expect, test, type Page } from '@playwright/test';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';
import { FISH } from '../src/lib/components/island/critters.ts';
import { POND_FISH, freshPool } from '../src/lib/components/island/pondFish.ts';
import { CAMS, POND } from '../src/lib/components/island/world.ts';

const said = (id: keyof typeof CATCH_LINES) => CATCH_LINES[id][0].replace(/\s+/g, ' ');
const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
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
/** Move the camera (instantly) and let the nodes settle. */
async function cam(page: Page, z: number) {
  await page.evaluate((z) => (window as unknown as W).__world.go(z), z);
  await page.waitForTimeout(250);
}
/** The pond's water on screen (client px): its oval's box from the world. */
const pond = (page: Page) => page.evaluate(({ x, z, rx, rz }) => {
  const w = (window as unknown as W).__world;
  const [l] = w.at(x - rx, z), [r] = w.at(x + rx, z), [, near] = w.at(x, z - rz), [, far] = w.at(x, z + rz), [cx, cy] = w.at(x, z);
  return { x: cx, y: cy, w: r - l, h: near - far };
}, POND);

async function open(page: Page, q: string, z: number = CAMS.oku) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=2026-11-04T21:00${q}`);
  await expect(ribbon(page)).toBeVisible();
  await cam(page, z);
  return { bells: await ribbon(page).getAttribute('aria-label'), url: page.url() };
}

/** Cast beside the shadow, wait for the 「！」 and reel in with a tap anywhere. */
async function fish(page: Page, sel: string, reel: { x: number; y: number }) {
  const f = await at(page, sel);
  await page.mouse.click(f.x + 6, f.y);
  await expect(page.locator('[data-bobber]')).toBeAttached();
  await expect(page.locator('[data-bite]')).toHaveText('！', { timeout: 10_000 });
  await page.waitForTimeout(400);
  await page.mouse.click(reel.x, reel.y); // any tap is the reel
}

for (const vp of [{ width: 375, height: 667 }, { width: 390, height: 844 }]) {
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
    await page.screenshot({ path: `/tmp/world-build/critters-pond-${vp.width}.png` });
    await fish(page, '[data-critter="pond"]', { x: vp.width / 2, y: vp.height * 0.55 });
    // (when my villager walked round to the pond's back bank: it stands behind the water, the rod in hand)
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
    await expect(ribbon(page)).toHaveAttribute('aria-label', before.bells!);
  });
}

test('the stream at おく: a river fish (NH: River) in its reach, cast from the bank, caught with its line', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '&critter=river');
  const shadow = page.locator('[data-critter="pond"][data-water="river"]');
  await expect(shadow).toBeAttached();
  await page.waitForTimeout(600);
  const f = await at(page, '[data-water="river"]');
  expect(f.x).toBeGreaterThan(0), expect(f.x).toBeLessThan(390), expect(f.y).toBeLessThan(844);
  await page.screenshot({ path: '/tmp/world-build/critters-river.png' });
  await fish(page, '[data-water="river"]', { x: 195, y: 500 });
  await expect(page.locator('[data-fx="catch"]')).toContainText('釣', { timeout: 4000 });
  const got = (await finds(page)) as { kind: string; id: string }[];
  expect(got).toHaveLength(1);
  expect(got[0].kind).toBe('fish');
  expect(freshPool('river')).toContain(got[0].id);
});

test("NH's own waters: the salmon at the river mouth, the char on the clifftop, the koi in the pond", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, water, z] of [['salmon', 'mouth', CAMS.oku], ['char', 'clifftop', CAMS.oku], ['koi', 'pond', CAMS.oku]] as const) {
    expect(POND_FISH[id].water).toBe(water);
    await open(page, `&critter=${id}`, z);
    const s = page.locator(`[data-critter="pond"][data-water="${water}"]`);
    await expect(s, id).toBeAttached();
    await cam(page, z);
    const p = await at(page, `[data-water="${water}"]`);
    expect(p.x, id).toBeGreaterThan(-20), expect(p.x, id).toBeLessThan(410);
    expect(p.y, id).toBeGreaterThan(0), expect(p.y, id).toBeLessThan(844);
    if (water === 'clifftop') await page.screenshot({ path: '/tmp/world-build/critters-clifftop.png' });
  }
});

test('fresh-water fish come by on their own, in the fresh water their seed picks (the chunk loads with the first)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '');
  // no fresh-water shadow yet: its table isn't loaded with the island
  const chunks = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /pondFish/.test(n)));
  expect(chunks).toEqual([]);
  // within a couple of visits a shadow swims in a fresh water: the one its seed picks, the same on both phones, in
  // view or not (the camera shows it when it sees that water: docs/backend.md#shared-world)
  await expect(page.locator('[data-critter="pond"]')).toBeAttached({ timeout: 40_000 });
  const water = await page.locator('[data-critter="pond"]').first().getAttribute('data-water');
  expect(['pond', 'river', 'mouth', 'clifftop']).toContain(water);
});

test('the ずかん lists every fish, the fresh waters’ and the sea’s, in NH’s order', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('?demo&date=2026-11-04T21:00');
  await expect(ribbon(page)).toBeVisible();
  await ribbon(page).click();
  await page.locator('dialog[open] .tab[data-tab=kiroku]').click();
  const total = Object.keys(FISH).length + Object.keys(POND_FISH).length;
  await expect(page.locator('[data-zukan="fish"]')).toContainText(`0 / ${total}`);
  await page.locator('[data-zukan="fish"]').click();
  await expect(page.locator('.tile.unknown')).toHaveCount(total);
  expect(await page.locator('.tile').first().getAttribute('data-entry')).toBe('bitterling');
});

test('water bugs: a pondskater skates on the pond on a summer day; a tap nets it (a ずかん bug)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-07-04T12:00&critter=pondskater');
  await expect(ribbon(page)).toBeVisible();
  await cam(page, CAMS.oku);
  const bug = page.locator('[data-critter="pondskater"]');
  await expect(bug).toBeAttached();
  await page.waitForTimeout(800);
  // on the pond, or on the river's still reach (the east run)
  const b = await at(page, '[data-critter="pondskater"]'), p = await pond(page);
  const reach = await page.evaluate(() => [800, 900, 1000].map((z) => (window as unknown as W).__world.at(372, z)));
  const onPond = Math.abs(b.x - p.x) < p.w / 2 + 4 && Math.abs(b.y - p.y) < p.h / 2 + 4;
  const onRiver = reach.some(([x, y]) => Math.abs(b.x - x) < 26 && Math.abs(b.y - y) < 120);
  expect(onPond || onRiver).toBe(true);
  await page.mouse.click(b.x, b.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('pondskater'), { timeout: 6000 });
  expect(await finds(page)).toEqual([{ kind: 'bug', id: 'pondskater' }]);
});
