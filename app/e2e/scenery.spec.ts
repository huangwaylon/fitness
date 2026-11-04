// Scenery taps (docs/design.md "Scene interactions"): the bushes, flowers, grass, sea, sun and clouds answer a tap with a
// short flourish, and nothing else: no sheet, no navigation, no ベル. The trees, the villagers and the HUD still work.
import { expect, test, type Page } from '@playwright/test';
import { camTo, geo, lawnTap, oku } from './island.ts';
import { hudBells, hudMenu } from './hud.ts';

/** The island is up: the HUD's leaf menu shows (the app asks no questions, so nothing to answer first). */
async function islandReady(page: Page) {
  // (its first paint: now and then over 5 s under CI's load)
  await expect(hudMenu(page)).toBeVisible({ timeout: 15_000 });
}

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

const centre = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  });

test('scenery taps play a flourish and change nothing; trees, villagers and the health button still work', async ({ page }) => {
  // a fixed midday (Tokyo): without it the orb is the moon from 19:00 and the sun row below fails every evening
  await page.goto('?demo&date=2026-11-04T12:00&critter=none');
  await islandReady(page);
  const bellsRow = hudBells(page);
  const health = page.locator('.hud-health');
  const bells = await bellsRow.getAttribute('aria-label');
  const url = page.url();

  // (open lawn is a walk: my villager runs there, its tap ring on the ground instead of a dust puff)
  const taps: [string, () => Promise<{ x: number; y: number }>, string][] = [
    ['bush', () => centre(page, '[data-bush="plumeria-w"]'), '[data-fx="bush"]'], // the white plumeria at the beach's edge
    // (one of the front lawn's: in view at まえ)
    ['flower', async () => centre(page, `[data-flower="${(await geo(page)).FLOWERS.filter((f) => f.z < 600).sort((a, b) => a.z - b.z)[0].id}"]`), '[data-fx="flower"]'],
    ['grass', () => lawn(page), '.if-scene .tap-ring'],
    ['sea', () => sea(page), '[data-fx="splash"]'],
    ['sun', () => orb(page), '[data-fx="sun"]']
  ];
  for (const [name, at, sel] of taps) {
    const { x, y } = await at();
    await page.mouse.click(x, y);
    await expect(page.locator(sel), name).toHaveCount(1);
    await expect(page.locator('dialog[open]'), name).toHaveCount(0);
  }
  // a flourish is gone within ~1 s, and nothing else moved
  await expect(page.locator('[data-fx]')).toHaveCount(0, { timeout: 4000 }); // a flourish waits for my villager's walk (≤ 0.9 s)
  expect(page.url()).toBe(url);
  await expect(bellsRow).toHaveAttribute('aria-label', bells!);

  // the trees: a canopy tap opens its popup; a tap on the scenery then only closes it (no flourish)
  await page.locator('button.canopy').first().click();
  await expect(page.locator('.detail')).toHaveCount(1);
  const g = await lawn(page);
  await page.mouse.click(g.x, g.y);
  await expect(page.locator('.detail')).toHaveCount(0);
  await expect(page.locator('[data-fx]')).toHaveCount(0);

  // neither villager opens a sheet (the partner is a high-five, mine a squish)
  await page.locator('.if-scene button.vil').nth(1).click();
  await page.waitForTimeout(400);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.locator('.if-scene button.vil').first().click();
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
  // the open sky, away from the moon and the clouds: a star twinkles where the finger was
  const sky = await page.locator('.if-scene').evaluate((sc) => {
    const r = sc.getBoundingClientRect(), horizon = r.top + parseFloat(getComputedStyle(sc).getPropertyValue('--horizon-y'));
    const o = document.querySelector('.if-scene .orb')!.getBoundingClientRect();
    const clouds = [...document.querySelectorAll('.if-scene .cloud')].map((c) => c.getBoundingClientRect());
    for (let y = r.top + 60; y < horizon - 10; y += 8)
      for (let x = r.left + 30; x < r.right - 30; x += 12) {
        const clear = (b: DOMRect) => Math.abs(x - (b.left + b.width / 2)) > Math.max(44, b.width) / 2 + 10 || Math.abs(y - (b.top + b.height / 2)) > Math.max(44, b.height) / 2 + 10;
        const hit = document.elementFromPoint(x, y);
        if (clear(o) && clouds.every(clear) && hit && !hit.closest('button, a, [role="button"], [tabindex]')) return { x, y };
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
    await page.goto(`?demo&date=${when}&critter=none&visitor=none`);
    await islandReady(page);
    await page.waitForFunction(() => (window as unknown as { __world?: W }).__world);
    // (held there and at rest: the campfire's box is read for the tap where the island draws it)
    await camTo(page, await oku(page));
  };
  await go('2026-11-04T12:00');
  await expect(page.locator('[data-campfire="campfire"]')).toBeVisible();
  await expect(page.locator('[data-lit="campfire"]')).toHaveCount(0);
  await go('2026-11-04T22:00');
  await expect(page.locator('[data-lit="campfire"] .tongue')).toHaveCount(3);
  const home = await page.locator('[data-actor="mine"]').evaluate((el) => getComputedStyle(el).transform);
  const f = await centre(page, '[data-campfire="campfire"]');
  await page.mouse.click(f.x, f.y);
  await expect(page.locator('[data-fx="fire"] .ember')).toHaveCount(5);
  expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('scene-campfire');
  await page.waitForTimeout(400);
  expect(await page.locator('[data-actor="mine"]').evaluate((el) => getComputedStyle(el).transform)).toBe(home); // nobody walked
});
