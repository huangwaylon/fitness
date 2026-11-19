// Island care (docs/design.md "Island care"): weeds to pull, flowers to water (a hybrid now and then the next day), the
// rock by the hedge. None of it changes ベル, opens a sheet or navigates; nothing sits over a control.
import { expect, test, type Page } from './fixtures.ts';
import { careOut, daySpots, geo, islandUp, piece, pointOn, watered, type W3 } from './island.ts';
import { hudBells } from './hud.ts';

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo${q}`);
  await islandUp(page);
  return { bells: await hudBells(page).getAttribute('aria-label'), url: page.url() };
}
async function unchanged(page: Page, before: { bells: string | null; url: string }) {
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(page.url()).toBe(before.url);
  await expect(hudBells(page)).toHaveAttribute('aria-label', before.bells!);
}
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);
/** The weeds left to pull today (wherever they are). */
const weedsLeft = async (page: Page) => (await daySpots(page)).weeds.length;
/** The nearest weed on screen (the lawn runs back past the river: some lie further off than まえ shows): its foot. */
const nearestWeed = (page: Page) =>
  page.evaluate(() => (window as unknown as { __world3d: W3 }).__world3d.care().filter((c) => c.kind === 'weed' && c.shown && c.foot[1] > 0 && c.foot[1] < innerHeight)
    .sort((a, b) => b.foot[1] - a.foot[1])[0]?.foot ?? null);

test('weeds sprout on open lawn, never over a control; a tap pulls one, and it stays pulled', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const before = await open(page, '&date=2026-11-04T12:00');
    // the day's two or three (wherever they are: on the layout they sprout all over the long island; one under a
    // control on this screen isn't drawn till the camera has it clear, and at まえ today's are all under the trees'
    // buttons and the doors: weeds.first() was only there before the 3D camera was up, care:33's red)
    await expect.poll(() => weedsLeft(page)).toBeGreaterThanOrEqual(2);
    const n = await weedsLeft(page);
    expect(n).toBeLessThanOrEqual(3);
    // the camera over the first
    const z = (await daySpots(page)).weeds[0][1];
    if (z > 300) await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z - 160);
    await page.waitForTimeout(600); // measured once the camera has settled
    // every weed and dig spot on this screen on bare lawn: a few px above the anchor (the tuft), nothing but scenery
    // under it (the villagers walk about: not counted)
    const onControls = await page.evaluate(() => {
      const w = (window as unknown as { __world3d: W3 }).__world3d;
      return [...w.care(), ...w.finds().filter((f) => f.kind === 'fossil')].flatMap((t) => {
        if (!t.shown || t.foot[1] < 0 || t.foot[1] > innerHeight) return [];
        const [x, y] = [t.foot[0], t.foot[1] - 4];
        return w.controls().filter((c) => c.kind !== 'villager' && x >= c.box.left && x <= c.box.left + c.box.width && y >= c.box.top && y <= c.box.top + c.box.height).map((c) => `${c.kind}:${c.id}`);
      });
    });
    expect(onControls).toEqual([]);
    await expect.poll(() => nearestWeed(page), { message: 'a weed on screen' }).not.toBeNull();
    const [x, y] = (await nearestWeed(page))!;
    await page.mouse.click(x, y - 4);
    await expect.poll(() => weedsLeft(page)).toBe(n - 1);
    await expect.poll(() => cues(page)).toContain('scene-weed');
    await unchanged(page, before);
    await page.reload();
    await islandUp(page);
    await page.waitForTimeout(600);
    await expect.poll(() => weedsLeft(page)).toBe(n - 1);
  });

test('a tap on a flower waters it (the can, a sprinkle); a watered flower can show a hybrid the next day', async ({ page }) => {
  const before = await open(page, '&date=2026-11-03T12:00');
  // the front lawn's first clump (world.ts FLOWERS as the page has them: the scatter's own, its `fl:` ids, before the
  // layout's new ones), in view at まえ
  const wild = (await geo(page)).FLOWERS.filter((f) => f.id.startsWith('fl:'));
  const fl = wild[0], other = wild[1].id;
  const f = (await pointOn(page, 'flower', fl.id))!;
  await page.mouse.click(f.x, f.y - 6);
  await expect(page.locator('[data-fx="water"]')).toBeAttached();
  expect(await cues(page)).toContain('scene-water');
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('scene-garden')))!)).toMatchObject({ date: '2026-11-03', watered: [fl.id] });
  await unchanged(page, before);
  // NH: a watered flower keeps a glitter for the rest of the day (only that one), after a reload too
  await expect.poll(() => watered(page)).toEqual([fl.id]);
  await page.reload();
  await expect.poll(() => watered(page)).toEqual([fl.id]);
  // 2026-11-04 is a hybrid day for a flower watered the day before (care.ts, seeded): the autumn pink cosmos grows black
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandUp(page);
  expect(await watered(page)).toEqual([]); // a new day: no glitter until watered again
  await expect.poll(async () => (await piece(page, fl.id))?.look).toMatch(/black-cosmos/);
  expect((await piece(page, other))?.look).toMatch(/pink-cosmos/);
  await page.reload(); // it stays for the day
  await expect.poll(async () => (await piece(page, fl.id))?.look).toMatch(/black-cosmos/);
});

test('the rock by the hedge: a tap clonks it (now and then a sparkle or a bug)', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00');
  const [x, y] = (await careOut(page, 'rock'))[0].foot;
  await page.mouse.click(x, y - 8);
  await expect.poll(() => cues(page)).toContain('scene-clonk'); // after my villager's walk to it
  await unchanged(page, before);
});
