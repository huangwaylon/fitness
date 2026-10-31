// The night sky (docs/design.md "Shooting stars", "Fireworks"): showers of shooting stars on clear nights, never over
// the UI; a tap while one streaks across is a wish (a sparkle, a chime, a caption), and each wish is a star fragment on
// the beach the next morning from 5:00. Fireworks on August Sundays and at New Year: bursts in the sky clear of the
// UI, one more where the sky is tapped. `?shower` and `?fireworks` (with ?demo) start them now.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });
const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo${q}`);
  await expect(ribbon(page)).toBeVisible();
}

/** The most open spot of the sky (client px): the furthest from every control, the moon, the clouds and the sky's
 *  edges; null when nowhere is `need` px clear. */
const openSky = (page: Page, need = 24) => page.evaluate((need) => {
  const scene = document.querySelector('.if-scene')!.getBoundingClientRect();
  const sky = document.querySelector('.if-scene .sky')!.getBoundingClientRect();
  const top = scene.top + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top') || '0');
  const avoid = [...document.querySelectorAll('.if-scene .orb, .if-scene .cloud, button')].map((e) => e.getBoundingClientRect());
  let best: { x: number; y: number } | null = null, room = need;
  for (let y = top + 4; y < sky.bottom - 10; y += 4)
    for (let x = scene.left + 4; x < scene.right - 4; x += 4) {
      let d = Math.min(x - scene.left, scene.right - x, y - top, sky.bottom - 10 - y);
      for (const b of avoid) d = Math.min(d, Math.max(b.left - x, x - b.right, b.top - y, y - b.bottom));
      if (d > room) (room = d), (best = { x, y });
    }
  return best;
}, need);
/** Whether two client boxes overlap. */
const overlap = (a: DOMRect | { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test('a shooting star crosses the sky, never the ribbon; a tap meanwhile is a wish, and the next morning a fragment', async ({ page }) => {
  await open(page, '&date=2026-11-04T21:00&shower');
  const streak = page.locator('[data-fx="shoot"]');
  await expect(streak.first()).toBeAttached({ timeout: 10_000 }); // a meteor shower's night: one every 3–8 s
  // its path (sampled as it flies): in the sky, off the ribbon and the jar
  const rib = (await ribbon(page).boundingBox())!, jar = (await page.locator('.hud-jar').first().boundingBox())!;
  const horizon = (await page.locator('.if-scene .stage').boundingBox())!.y + 30;
  for (let i = 0; i < 6; i++) {
    const head = await page.locator('[data-fx="shoot"] .streak').first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - 3, y: r.top - 3, width: 6, height: 6 };
    }).catch(() => null);
    if (head) {
      expect(overlap(head, rib), 'over the ribbon').toBe(false);
      expect(overlap(head, jar), 'over the jar').toBe(false);
      expect(head.y).toBeLessThan(horizon);
    }
    await page.waitForTimeout(120);
  }
  // the next one: wish on it
  await expect(streak).toHaveCount(0, { timeout: 4000 });
  await expect(streak.first()).toBeAttached({ timeout: 10_000 });
  const p = (await openSky(page))!;
  expect(p).not.toBeNull();
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="wish"]').first()).toBeAttached();
  await expect(page.locator('[data-fx="wish-note"]')).toHaveText('ながれぼしに おねがい！');
  expect(await cues(page)).toContain('scene-wish');
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('scene-wish')))!)).toEqual({ '2026-11-05': 1 });
  // a second tap on the same star is just a twinkle
  await page.mouse.click(p.x + 20, p.y);
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('scene-wish')))!)).toEqual({ '2026-11-05': 1 });
  // before dawn: nothing yet; from 5:00: one fragment on the beach
  await page.goto('?demo&date=2026-11-05T04:30');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('[data-find="fragment"]')).toHaveCount(0);
  await page.goto('?demo&date=2026-11-05T08:00');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('[data-find="fragment"]')).toHaveCount(1);
  const f = (await page.locator('[data-find="fragment"]').first().boundingBox())!;
  await page.mouse.click(f.x + f.width / 2, f.y + f.height / 2);
  await expect(page.locator('[data-fx="catch"]')).toContainText(/かけらを ひろった！/);
  await expect(page.locator('[data-find="fragment"]')).toHaveCount(0);
});

test('no showers by day, nor out of the star hours (after 4:00)', async ({ page }) => {
  await open(page, '&date=2026-11-04T12:00&shower');
  await page.waitForTimeout(3000);
  await expect(page.locator('[data-fx="shoot"]')).toHaveCount(0);
  await page.goto('?demo&date=2026-11-05T04:20&shower');
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(page.locator('[data-fx="shoot"]')).toHaveCount(0);
});

for (const vp of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`fireworks at ${vp.width}: bursts in the sky clear of the UI; a tap in the sky sends one more`, async ({ page }) => {
    await page.setViewportSize(vp);
    await open(page, '&date=2026-08-02T20:00');
    const bursts = page.locator('[data-firework]');
    await expect(bursts.first()).toBeAttached({ timeout: 6000 });
    const rib = (await ribbon(page).boundingBox())!, jar = (await page.locator('.hud-jar').first().boundingBox())!;
    const sky = (await page.locator('.if-scene .fireworks').boundingBox())!;
    // each burst's whole circle (its sparks' reach) stays in the sky, off the ribbon and the jar
    for (let i = 0; i < 4; i++) {
      for (const b of await bursts.evaluateAll((els) => els.map((el) => {
        const r = el.getBoundingClientRect(), rad = Number(getComputedStyle(el).getPropertyValue('--rad'));
        return { x: r.left - rad, y: r.top - rad, width: 2 * rad, height: 2.2 * rad };
      }))) {
        expect(overlap(b, rib)).toBe(false);
        expect(overlap(b, jar)).toBe(false);
        expect(b.y).toBeGreaterThanOrEqual(sky.y - 1);
        expect(b.y + b.height).toBeLessThanOrEqual(sky.y + sky.height + 1);
      }
      await page.waitForTimeout(900);
    }
    expect(await cues(page)).toEqual(expect.arrayContaining(['scene-launch', 'scene-firework']));
    // a tap in open sky: a burst opens right there (where there's room for one)
    const p = await openSky(page, 32);
    if (p) {
      await page.mouse.click(p.x, p.y);
      await expect.poll(() => bursts.evaluateAll((els, q) => els.some((el) => {
        const r = el.getBoundingClientRect();
        return Math.abs(r.left - q.x) < 2 && Math.abs(r.top - q.y) < 2;
      }), p)).toBe(true);
    }
  });
}

test('?fireworks starts a show on any night; none on an ordinary one', async ({ page }) => {
  await open(page, '&date=2026-11-04T21:00');
  await page.waitForTimeout(3000);
  await expect(page.locator('[data-firework]')).toHaveCount(0);
  await page.goto('?demo&date=2026-11-04T21:00&fireworks');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('[data-firework]').first()).toBeAttached({ timeout: 6000 });
});
