// Celeste and meteor showers (docs/design.md "Celeste and meteor showers"): about one night in ten, at most one a week,
// seeded by the week (2026-11-12 is one), Celeste comes to watch from 20:00 to 04:00 and shooting stars cross every
// 3–8 s; each wish that night is a star fragment the next morning (the season's zodiac one likelier). No ベル.
import { expect, test } from './fixtures.ts';
import { camTo, controlsUnder, is3d, islandUp, stageCam, tapFigure } from './island.ts';
import { hudBells } from './hud.ts';

test("a meteor shower's night: Celeste at centre stage, clear of every control, explains wishes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('?demo&date=2026-11-12T21:00&critter=none');
  await islandUp(page);
  const bells = await hudBells(page).getAttribute('aria-label');
  await camTo(page, await stageCam(page), false);
  const art = page.locator('[data-visitor="celeste"] .art');
  await expect(art).toBeVisible();
  expect(await controlsUnder(page, '[data-visitor="celeste"] .art')).toEqual([]);
  await tapFigure(page, '[data-visitor="celeste"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('フーコ');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('ながれぼし');
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
});

test('shooting stars every 3–8 s on a shower night (a clear night: 15–40 s)', async ({ page }) => {
  // (the phone's whole screen, the installed app's: on the browser profile's 659 px the sky band is so short that a
  // third of the streaks find no clear path and are skipped, and two in 24 s failed ~1 run in 10)
  await page.setViewportSize({ width: 393, height: 852 });
  await page.clock.install({ time: new Date('2026-11-12T22:00:00+09:00') });
  await page.clock.resume();
  await page.goto('?demo&date=2026-11-12T22:00&critter=none');
  await islandUp(page);
  // (the 3D island's whole-island view leaves the night sky a sliver under the HUD: there a streak crosses on down over
  // the island's far end)
  await is3d(page);
  await page.evaluate(() => {
    const w = window as { __stars?: number };
    w.__stars = 0;
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) if (n instanceof HTMLElement && n.dataset.fx === 'shoot') w.__stars!++;
    }).observe(document.body, { childList: true, subtree: true });
  });
  // at least two in 24 s (a clear night would bring one at most; a streak with no clear path is skipped now and then):
  // the page's clock run on a second at a time
  const stars = () => page.evaluate(() => (window as { __stars?: number }).__stars ?? 0);
  for (let s = 0; s < 24 && (await stars()) < 2; s++) await page.clock.runFor(1000);
  expect(await stars()).toBeGreaterThanOrEqual(2);
});

test('not a shower night: no Celeste; each wish is a fragment the next morning, a shower night’s like any other', async ({ page }) => {
  await page.goto('?demo&date=2026-11-11T21:00&critter=none');
  await islandUp(page);
  await page.waitForTimeout(500);
  await expect(page.locator('[data-visitor="celeste"]')).toHaveCount(0);
  // five wishes on the shower night of 11-12: five fragments on the 13th's beach
  await page.evaluate(() => localStorage.setItem('scene-wish', JSON.stringify({ '2026-11-13': 5 })));
  await page.goto('?demo&date=2026-11-13T08:00&critter=none');
  await expect(page.locator('[data-find="fragment"]')).toHaveCount(5);
  // two wishes on a plain night: two
  await page.evaluate(() => localStorage.setItem('scene-wish', JSON.stringify({ '2026-11-12': 2 })));
  await page.goto('?demo&date=2026-11-12T08:00&critter=none');
  await expect(page.locator('[data-find="fragment"]')).toHaveCount(2);
});
