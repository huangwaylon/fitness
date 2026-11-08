// Seasonal touches in the built app (docs/design.md "Particles and events", "Pond"): snow on the campsite's tent
// while snow lies on the ground (Dec 11 – Feb 24), petals floating on the pond in cherry-blossom week (Apr 1–10)
// and maple leaves in maple week (Nov 16–25); none of it on an ordinary day.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, geo, is3d, islandUp, oku, w3 } from './island.ts';

test.use({ viewport: { width: 390, height: 844 } });

/** The camera stop where each lives: the campsite and the pond at おく. */
async function open(page: Page, date: string) {
  await page.goto(`?demo&date=${date}&weather=clear`);
  await islandUp(page);
  await camTo(page, await oku(page), false);
}

// (which days: ui-state/season.test's windows, scenery.test's sceneryKey (the campsite's snow in winter only) and
// clock.test's eventsAt (cherry-blossom and maple weeks, neither on an ordinary day); here a day of each on the island)
test('snow on the campsite’s tent in winter', async ({ page }) => {
  const tent = page.locator('[data-building="campsite"] [data-look]');
  await open(page, '2027-01-12T10:00');
  await expect(tent).toHaveAttribute('data-look', 'deco/campsite-winter');
});

// (each week's own model on the water: the wiring; no week, nothing: clock.test's eventsAt)
for (const [date, floating] of [['2027-04-05T10:00', 'petal'], ['2026-11-20T10:00', 'maple']] as const)
  test(`the pond on ${date.slice(0, 10)}: ${floating} floating`, async ({ page }) => {
    await open(page, date);
    await is3d(page);
    // NH's petal or maple leaf riding the stream and afloat on the pond (world3d/floats3d.ts)
    const model = `fx/${floating === 'petal' ? 'petal' : 'maple-leaf'}`;
    await expect.poll(() => w3(page, (w) => w.where('float-0')?.model)).toBe(model);
    await expect.poll(() => w3(page, (w) => w.where('float-pond-0')?.model)).toBe(model);
    // on the pond's water, inside its banks (world.ts POND as the page has it)
    const p = await w3(page, (w) => w.where('float-pond-0')), { POND } = await geo(page);
    expect(((p!.x - POND.x) / POND.rx) ** 2 + ((-p!.z - POND.z) / POND.rz) ** 2).toBeLessThan(1);
  });
