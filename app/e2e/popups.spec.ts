// Every discovery popup (docs/design.md "Critters", "Beach finds", "Balloon", "Shooting stars", "Visitors: life"): the
// catch plate (a fish, its first-find page, a shell, a present), the wish's caption and Gulliver's sleep talk keep at
// least 12px from the screen's sides and foot and never sit over the HUD (the ribbon, the jar, the sync chip).
import { expect, test, type Page } from '@playwright/test';
import { reelOnBite } from './island.ts';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
const centre = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

async function open(page: Page, q: string) {
  await page.goto(`?demo&${q}`);
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(1500);
}

/** The popup's margins to the screen and any HUD control under it (polled briefly: it may still be popping in). */
async function expectClear(page: Page, sel: string) {
  const measure = () => page.locator(sel).first().evaluate((el) => {
    const b = el.getBoundingClientRect();
    const hud = [...document.querySelectorAll('button, .news')].filter((e) => !e.closest('.stage') && !e.closest('[data-fx]')).filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width && r.left < b.right && b.left < r.right && r.top < b.bottom && b.top < r.bottom;
    }).map((e) => e.className);
    return { hud, top: b.top >= 0, edges: b.width > 0 && Math.min(b.left, innerWidth - b.right, innerHeight - b.bottom) >= 11.5 };
  });
  await expect.poll(measure, { message: `${sel}: 12px from the sides and foot, off the HUD`, timeout: 1500 }).toEqual({ hud: [], top: true, edges: true });
}
const plate = '[data-fx="catch"].placed .catch-plate';
/** The open sky's roomiest point: away from the sun or moon, the clouds and every control (as sky.spec's). */
const openSky = (page: Page) => page.evaluate(() => {
  const scene = document.querySelector('.if-scene')!.getBoundingClientRect(), sky = document.querySelector('.if-scene .sky')!.getBoundingClientRect();
  const avoid = [...document.querySelectorAll('.if-scene .orb, .if-scene .cloud, button')].map((e) => e.getBoundingClientRect());
  let best = { x: scene.left + scene.width / 2, y: scene.top + 40 }, room = 0;
  for (let y = scene.top + 4; y < sky.bottom - 10; y += 4)
    for (let x = scene.left + 4; x < scene.right - 4; x += 4) {
      let d = Math.min(x - scene.left, scene.right - x, y - scene.top, sky.bottom - 10 - y);
      for (const b of avoid) d = Math.min(d, Math.max(b.left - x, x - b.right, b.top - y, y - b.bottom));
      if (d > room) (room = d), (best = { x, y });
    }
  return best;
});

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test.describe(`at ${w}`, () => {
    test.use({ viewport: { width: w, height: h } });

    test('the catch plate and its first-find page', {
      tag: '@quarantine',
      annotation: { type: 'quarantine', description: 'owner: engine agent (fishing, the catch plate), 2026-11-03: red main at 67f69641, the reel missed the 1.6 s bite under CI load; reelOnBite (e2e/island.ts) is the fix, back in the gate after 5 green full-tier runs' }
    }, async ({ page }) => {
      await open(page, 'date=2026-11-04T21:00&critter=sea-bass');
      await expect(page.locator('[data-critter="fish"]')).toBeAttached();
      await page.waitForTimeout(500);
      const f = await centre(page, '[data-critter="fish"]');
      await page.mouse.click(f.x + (f.x < w / 2 ? 40 : -40), f.y);
      // the reel, the moment it bites (the bobber's where the cast put it)
      await expect(page.locator('[data-bobber]')).toBeAttached();
      const b = await centre(page, '[data-bobber]');
      await reelOnBite(page, b.x < w / 2 ? w - 20 : 20, b.y);
      await expect(page.locator(plate)).toBeVisible();
      await expectClear(page, plate);
      // (a tap where it is: Playwright's own click would scroll the island's sticky stage to it, moving the camera)
      while ((await page.locator(plate).getAttribute('data-page')) !== '1') {
        const r = (await page.locator(plate).boundingBox())!;
        await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
        await page.waitForTimeout(120);
      }
      await expect(page.locator(plate)).toContainText('ずかんに のったよ！');
      await expectClear(page, plate);
    });

    test('a shell picked up', async ({ page }) => {
      await open(page, 'date=2026-11-04T12:00&critter=none');
      const s = await centre(page, '[data-find="shell"]');
      // a villager wandering the beach may stand over it for a moment (the tap would be theirs): tap once it's clear
      await expect.poll(() => page.evaluate(({ x, y }) => !document.elementFromPoint(x, y)?.closest('[data-actor]'), s), { timeout: 10_000 }).toBe(true);
      await page.mouse.click(s.x, s.y);
      await expect(page.locator(plate)).toBeVisible({ timeout: 4000 });
      await expectClear(page, plate);
    });

    test('a balloon present opened', async ({ page }) => {
      await open(page, 'date=2026-11-04T12:00&critter=none&balloon');
      const balloon = page.locator('.if-scene .balloon');
      await expect.poll(async () => { const r = await balloon.boundingBox(); return !!r && r.x > 40 && r.x + r.width < w - 40; }, { timeout: 15_000 }).toBe(true);
      const r = (await balloon.boundingBox())!;
      await page.mouse.click(r.x + r.width / 2, r.y + r.height * 0.25);
      await expect(page.locator('[data-find="present"]')).toHaveCount(1, { timeout: 4000 });
      await page.waitForTimeout(1000); // landed and settled
      const g = await centre(page, '[data-find="present"] > *');
      // a villager wandering past may stand over it for a moment (it lies behind them): tap once it's clear
      await expect.poll(() => page.evaluate(({ x, y }) => !document.elementFromPoint(x, y)?.closest('[data-actor]'), g), { timeout: 10_000 }).toBe(true);
      await page.mouse.click(g.x, g.y);
      await expect(page.locator(plate)).toContainText('てにいれた', { timeout: 4000 });
      await expectClear(page, plate);
    });

    test('a wish on a shooting star', async ({ page }) => {
      test.skip(h < 600, 'a short sky beside the HUD has no room for a streak');
      await open(page, 'date=2026-11-12T21:00&critter=none&shower');
      await expect(page.locator('.streak').first()).toBeAttached({ timeout: 15_000 });
      const p = await openSky(page);
      await page.mouse.click(p.x, p.y);
      await expect(page.locator('[data-fx="wish-note"].placed')).toBeVisible({ timeout: 3000 });
      await expectClear(page, '[data-fx="wish-note"]');
    });

    test("Gulliver's sleep talk", async ({ page }) => {
      await open(page, 'date=2026-11-04T12:00&visitor=gulliver&critter=none');
      const v = await centre(page, '[data-visitor="gulliver"] .art');
      await page.mouse.click(v.x, v.y);
      await page.waitForTimeout(1200);
      await page.mouse.click(v.x, v.y);
      await expect(page.locator('[data-mumble]')).toBeVisible({ timeout: 3000 });
      await expectClear(page, '[data-mumble]');
    });
  });
