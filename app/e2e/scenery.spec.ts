// Scenery taps (docs/design/scene-interactions.md): the bushes, flowers, grass, sea, sun and clouds answer a tap with a
// short flourish, and nothing else: no sheet, no navigation, no ベル. The trees, the villagers and the jar still work.
import { expect, test, type Page } from '@playwright/test';

/** The island is up: today's ベル ribbon shows (the app asks no questions, so nothing to answer first). */
async function islandReady(page: Page) {
  await expect(page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ })).toBeVisible();
}

/** Stage units (390 × 360, scene.ts) → page px. */
const stagePoint = (page: Page, ux: number, uy: number) =>
  page.locator('.if-scene .stage').evaluate((st, [x, y]) => {
    const r = st.getBoundingClientRect();
    return { x: r.left + (x * r.width) / 390, y: r.top + (y * r.width) / 390 };
  }, [ux, uy]);

/** The open sea just under the horizon (the scene's --horizon-y, which can sit above the stage's own). */
const openSea = (page: Page) =>
  page.locator('.if-scene .stage').evaluate((st) => {
    const cs = getComputedStyle(st);
    const r = st.getBoundingClientRect();
    return { x: r.left + r.width * 0.7, y: r.top + parseFloat(cs.getPropertyValue('--if-hy')) - parseFloat(cs.getPropertyValue('--if-st')) + 14 };
  });

const centre = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  });

test('scenery taps play a flourish and change nothing; trees, villagers and the jar still work', async ({ page }) => {
  // a fixed midday (Tokyo): without it the orb is the moon from 19:00 and the sun row below fails every evening
  await page.goto('?demo&date=2026-11-04T12:00');
  await islandReady(page);
  const ribbon = page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
  const jar = page.locator('.if-scene .jar');
  const bells = await ribbon.getAttribute('aria-label');
  const jarLabel = await jar.getAttribute('aria-label');
  const url = page.url();

  const taps: [string, () => Promise<{ x: number; y: number }>, string][] = [
    ['bush', () => stagePoint(page, 195, 58), 'bush'],
    ['flower', () => stagePoint(page, 63, 283), 'flower'],
    ['grass', () => stagePoint(page, 195, 228), 'grass'],
    ['sea', () => openSea(page), 'splash'],
    ['sun', () => centre(page, '.if-scene .orb'), 'sun']
  ];
  for (const [name, at, fx] of taps) {
    const { x, y } = await at();
    await page.mouse.click(x, y);
    await expect(page.locator(`[data-fx="${fx}"]`), name).toHaveCount(1);
    await expect(page.locator('dialog[open]'), name).toHaveCount(0);
  }
  // a flourish is gone within ~1 s, and nothing else moved
  await expect(page.locator('[data-fx]')).toHaveCount(0, { timeout: 2500 });
  expect(page.url()).toBe(url);
  await expect(ribbon).toHaveAttribute('aria-label', bells!);
  await expect(jar).toHaveAttribute('aria-label', jarLabel!);

  // the trees: a canopy tap opens its popup; a tap on the scenery then only closes it (no flourish)
  await page.locator('button.canopy').first().click();
  await expect(page.locator('.detail')).toHaveCount(1);
  const g = await stagePoint(page, 195, 228);
  await page.mouse.click(g.x, g.y);
  await expect(page.locator('.detail')).toHaveCount(0);
  await expect(page.locator('[data-fx]')).toHaveCount(0);

  // the partner opens their villager card (mine only hops: nothing to fill in, ADR 0021)
  await page.locator('.if-scene button.vil').nth(1).click();
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.locator('.if-scene button.vil').first().click();
  await page.waitForTimeout(400);
  await expect(page.locator('dialog[open]')).toHaveCount(0);

  // the jar is still the doorway to ごほうび
  await jar.click();
  await expect(page).toHaveURL(/\/jar/);
});

test('night sky: the moon twinkles and sends a shooting star; a tap in the open sky lights a star', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T22:00');
  await islandReady(page);
  await expect(page.locator('.if-scene[data-tod="night"]')).toHaveCount(1);
  const moon = await centre(page, '.if-scene .orb');
  await page.mouse.click(moon.x, moon.y);
  await expect(page.locator('[data-fx="moon"]')).toHaveCount(1);
  await expect(page.locator('[data-fx="shoot"]').first()).toBeAttached();
  await expect(page.locator('[data-fx]')).toHaveCount(0, { timeout: 2500 });
  // the open sky, away from the moon and the clouds: a star twinkles where the finger was
  const sky = await page.locator('.if-scene .stage').evaluate((st) => {
    const r = st.getBoundingClientRect();
    const o = document.querySelector('.if-scene .orb')!.getBoundingClientRect();
    const clouds = [...document.querySelectorAll('.if-scene .cloud')].map((c) => c.getBoundingClientRect());
    const top = Math.max(r.top - 40, document.querySelector('.if-scene')!.getBoundingClientRect().top + 60);
    for (let y = top; y < r.top + 20; y += 8)
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
