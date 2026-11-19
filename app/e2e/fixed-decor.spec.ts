// The fixed decor (docs/design.md "Decor"): NH's outdoor furniture standing for good and the seasons' pieces taking
// their spots; a tap answers where the piece stands (nobody walks), but for a seat (sit-outdoors.spec: walked up to and
// sat on); the shishi-odoshi tips and knocks; the sandcastle is gone at 18:00; the seasonal lamps light at night.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, feetOf, geo, is3d, islandUp, openNear, piece, tapOn, villager, w3, watered } from './island.ts';

const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);

/** The day at `when`, the camera at that end of the island and still (camStill: the pieces' tap areas placed for it;
 *  `settled` would add seconds of the island's own activity winding down, and a tap is polled to its target anyway). */
async function open(page: Page, when: string, end: 'mae' | 'oku') {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=${when}`);
  await islandUp(page);
  await camTo(page, (await geo(page)).CAMS[end], false);
}
const mine = (page: Page) => feetOf(page);

test('まえ in summer: the bench at the grass edge, the beach chair and the sandcastle; a tap on the bench sits on it, on the sandcastle answers where it is', async ({ page }) => {
  await open(page, '2026-07-20T11:00', 'mae');
  for (const id of ['bench-mae', 'beach-chair', 'sandcastle']) await expect.poll(async () => (await piece(page, id))?.fixture, id).toBe(id);
  // the seats sit (the bench, the beach chair in its summer), the sandcastle doesn't
  expect((await piece(page, 'beach-chair'))?.sit).toBe('beach-chair');
  expect((await piece(page, 'sandcastle'))?.sit).toBeNull();
  const home = await mine(page);
  await tapOn(page, 'fixture', 'sandcastle');
  await expect.poll(() => cues(page)).toContain('scene-sand');
  await page.waitForTimeout(400);
  expect(await mine(page)).toEqual(home);
  // (where it's the bench's: a palm's leaves may hang over it)
  await tapOn(page, 'fixture', 'bench-mae');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world: { seated(id: string): string | null } }).__world.seated('mine')), { timeout: 8000 }).toMatch(/^seatMae[LR]$/);
  await expect.poll(() => cues(page)).toContain('scene-bench');
  // the tide takes the sandcastle at 18:00 (the same on both phones: the date and the hour)
  await open(page, '2026-07-20T18:05', 'mae');
  await expect.poll(async () => (await piece(page, 'bench-mae'))?.fixture).toBe('bench-mae');
  expect(await piece(page, 'sandcastle')).toBeNull();
});

test('おく: the hammock, the pond bench and rod stand, the pump, the shishi-odoshi, the pull-up bar and the firewood; the shishi-odoshi tips and knocks', async ({ page }) => {
  await open(page, '2026-07-20T11:00', 'oku');
  for (const id of ['hammock', 'bench-pond', 'rod-stand', 'pump', 'shishi', 'pullup', 'firewood']) await expect.poll(async () => (await piece(page, id))?.fixture, id).toBe(id);
  await tapOn(page, 'fixture', 'shishi');
  await expect.poll(async () => (await piece(page, 'shishi'))?.tipped, { intervals: [50] }).toBe(true); // (tipped for 700 ms)
  await expect.poll(async () => (await piece(page, 'shishi'))?.tipped, { timeout: 3000 }).toBe(false);
  await expect.poll(() => cues(page)).toContain('scene-kon');
});

test('the seasons swap their pieces in: the blossom days’ picnic set and pond stone, November’s mushroom lamp lit at night, the winter’s illuminated tree', async ({ page }) => {
  await open(page, '2026-04-05T11:00', 'oku');
  // (the picnic set in the bench's place is no seat; nor the illuminated tree in the hammock's)
  await expect.poll(() => piece(page, 'bench-pond')).toMatchObject({ look: 'deco/picnic-set', sit: null });
  expect((await piece(page, 'rock-m1'))?.look).toBe('deco/pond-stone-sakura');
  await open(page, '2026-11-10T21:00', 'oku');
  await expect.poll(async () => (await piece(page, 'lantern-1'))?.look).toBe('deco/mushroom-lamp');
  // the lamp's model is NH's mushroom lamp (a lit one: world3d/things.ts LAMP), the night's lamps on
  await is3d(page);
  await expect.poll(() => w3(page, (w) => w.where('lantern-1')?.model)).toBe('deco/mushroom-lamp');
  await expect.poll(() => w3(page, (w) => w.lamps())).toContain('lantern-1');
  await expect.poll(() => w3(page, (w) => w.stats().points)).toBeGreaterThan(0);
  await open(page, '2026-12-20T11:00', 'oku');
  await expect.poll(() => piece(page, 'hammock')).toMatchObject({ look: 'deco/illumi-tree', sit: null });
});

test('the pump waters the flowers round it (each glitters for the day, on both phones as a tap’s watering)', async ({ page }) => {
  await open(page, '2026-07-20T11:00', 'oku');
  expect(await watered(page)).toEqual([]);
  await tapOn(page, 'fixture', 'pump');
  await expect.poll(() => cues(page)).toContain('scene-pump');
  await expect.poll(async () => (await watered(page)).length).toBeGreaterThanOrEqual(2);
});

test('the snowboy says a line in its voice; it melts over three days', async ({ page }) => {
  // a snow day in the island's seed with three dry days after it (weather.ts dayWeather)
  await open(page, '2027-01-09T11:00', 'mae');
  await expect.poll(async () => (await piece(page, 'snowboy'))?.look).toBe('deco/snowboy-0');
  await tapOn(page, 'fixture', 'snowboy');
  await expect(page.getByText('さむいって いいね〜').first()).toBeVisible();
  await open(page, '2027-01-11T11:00', 'mae');
  await expect.poll(async () => (await piece(page, 'snowboy'))?.look).toBe('deco/snowboy-2');
});

test('sitting: my villager on the front bench is drawn seated, and stands again elsewhere', async ({ page }) => {
  await open(page, '2026-07-20T11:00', 'mae');
  const [x, z] = (await geo(page)).SEATS.seatMaeL;
  await page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z), [x, z]);
  await expect.poll(async () => (await villager(page))?.seat).toBe('seatMaeL');
  // stood up elsewhere (open lawn, read from the page's island): not seated
  const [ox, oz] = await openNear(page, 150, 260);
  await page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z), [ox, oz]);
  await expect.poll(async () => (await villager(page))?.seat).toBeNull();
});
