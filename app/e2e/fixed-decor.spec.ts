// The fixed decor (docs/design.md "Decor"): NH's outdoor furniture standing for good and the seasons' pieces taking
// their spots; a tap answers where the piece stands (nobody walks); the shishi-odoshi tips and knocks; the sandcastle
// is gone at 18:00; the seasonal lamps light at night.
import { expect, test, type Page } from '@playwright/test';
import { geo, is3d, tapOn, w3 } from './island.ts';

type W = { at: (x: number, z: number) => [number, number]; go: (z: number) => void; cam(): number };
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);

async function open(page: Page, when: string, end: 'mae' | 'oku') {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=${when}&critter=none&visitor=none`);
  await expect(page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __world?: W }).__world);
  const camZ = (await geo(page)).CAMS[end];
  await expect.poll(async () => {
    await page.evaluate((z) => (window as unknown as { __world: W }).__world.go(z), camZ);
    await page.waitForTimeout(250);
    return page.evaluate((z) => Math.abs((window as unknown as { __world: W }).__world.cam() - z), camZ);
  }, { timeout: 5000 }).toBeLessThan(1.5); // (WebKit scrolls by whole px: within a px of it)
}
const centre = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height * 0.6 };
  });
const mine = (page: Page) => page.locator('[data-actor="mine"]').evaluate((el) => getComputedStyle(el).transform);

test('まえ in summer: the bench at the grass edge, the beach chair and the sandcastle; a tap on the bench creaks it where it is', async ({ page }) => {
  await open(page, '2026-07-20T11:00', 'mae');
  for (const id of ['bench-mae', 'beach-chair', 'sandcastle']) await expect(page.locator(`[data-fixture="${id}"]`), id).toBeVisible();
  const home = await mine(page);
  // (where it's the bench's: a palm's leaves may hang over it)
  await tapOn(page, page.locator('[data-fixture="bench-mae"]'));
  await expect.poll(() => cues(page)).toContain('scene-bench');
  await page.waitForTimeout(400);
  expect(await mine(page)).toBe(home);
  // the tide takes the sandcastle at 18:00 (the same on both phones: the date and the hour)
  await open(page, '2026-07-20T18:05', 'mae');
  await expect(page.locator('[data-fixture="bench-mae"]')).toBeVisible();
  await expect(page.locator('[data-fixture="sandcastle"]')).toHaveCount(0);
});

test('おく: the hammock, the pond bench and rod stand, the pump, the shishi-odoshi, the pull-up bar and the firewood; the shishi-odoshi tips and knocks', async ({ page }) => {
  await open(page, '2026-07-20T11:00', 'oku');
  for (const id of ['hammock', 'bench-pond', 'rod-stand', 'pump', 'shishi', 'pullup', 'firewood']) await expect(page.locator(`[data-fixture="${id}"]`), id).toBeAttached();
  const s = await centre(page, '[data-fixture="shishi"]');
  await page.mouse.click(s.x, s.y);
  await expect(page.locator('[data-fixture="shishi"][data-tipped]')).toHaveCount(1);
  await expect(page.locator('[data-fixture="shishi"][data-tipped]')).toHaveCount(0, { timeout: 3000 });
  await expect.poll(() => cues(page)).toContain('scene-kon');
});

test('the seasons swap their pieces in: the blossom days’ picnic set and pond stone, November’s mushroom lamp lit at night, the winter’s illuminated tree', async ({ page }) => {
  await open(page, '2026-04-05T11:00', 'oku');
  await expect(page.locator('[data-fixture="bench-pond"]')).toHaveAttribute('data-look', 'deco/picnic-set');
  await expect(page.locator('[data-scenery-id="rock-m1"] [data-look]')).toHaveAttribute('data-look', 'deco/pond-stone-sakura');
  await open(page, '2026-11-10T21:00', 'oku');
  await expect(page.locator('[data-scenery-id="lantern-1"] [data-look]')).toHaveAttribute('data-look', 'deco/mushroom-lamp');
  if (await is3d(page)) {
    // the 3D island: the lamp's model is NH's mushroom lamp (a lit one: world3d/things.ts LAMP), the night's lamps on
    await expect.poll(() => w3(page, (w) => w.where('lantern-1')?.model)).toBe('deco/mushroom-lamp');
    await expect.poll(() => w3(page, (w) => w.lamps())).toContain('lantern-1');
    await expect.poll(() => w3(page, (w) => w.stats().points)).toBeGreaterThan(0);
  } else await expect(page.locator('[data-glow="lantern-1"]')).toHaveCount(1);
  await open(page, '2026-12-20T11:00', 'oku');
  await expect(page.locator('[data-fixture="hammock"]')).toHaveAttribute('data-look', 'deco/illumi-tree');
});

test('the pump waters the flowers round it (each glitters for the day, on both phones as a tap’s watering)', async ({ page }) => {
  await open(page, '2026-07-20T11:00', 'oku');
  await expect(page.locator('[data-watered]')).toHaveCount(0);
  const p = await centre(page, '[data-fixture="pump"]');
  await page.mouse.click(p.x, p.y);
  await expect.poll(() => cues(page)).toContain('scene-pump');
  await expect.poll(() => page.locator('[data-watered]').count()).toBeGreaterThanOrEqual(2);
});

test('the snowboy says a line in its voice; it melts over three days', async ({ page }) => {
  // a snow day in the island's seed with three dry days after it (weather.ts dayWeather)
  await open(page, '2027-01-09T11:00', 'mae');
  await expect(page.locator('[data-fixture="snowboy"]')).toHaveAttribute('data-look', 'deco/snowboy-0');
  const s = await centre(page, '[data-fixture="snowboy"]');
  await page.mouse.click(s.x, s.y);
  await expect(page.getByText('さむいって いいね〜').first()).toBeVisible();
  await open(page, '2027-01-11T11:00', 'mae');
  await expect(page.locator('[data-fixture="snowboy"]')).toHaveAttribute('data-look', 'deco/snowboy-2');
});

test('sitting: my villager on the front bench is drawn seated, and stands again elsewhere', async ({ page }) => {
  await open(page, '2026-07-20T11:00', 'mae');
  const [x, z] = (await geo(page)).SEATS.seatMaeL;
  await page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z), [x, z]);
  await expect(page.locator('[data-actor="mine"]')).toHaveAttribute('data-seat', 'seatMaeL');
  // stood up elsewhere: not seated
  await page.evaluate(() => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(150, 260));
  await expect(page.locator('[data-actor="mine"][data-seat]')).toHaveCount(0);
});
