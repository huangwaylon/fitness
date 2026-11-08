// Celeste and meteor showers (docs/design.md "Celeste and meteor showers"): about one night in ten, at most one a week,
// seeded by the week (2026-11-12 is one), Celeste comes to watch from 20:00 to 04:00 and shooting stars cross every
// 3–8 s; each wish that night is a star fragment the next morning (the season's zodiac one likelier). No ベル.
import { expect, test } from './fixtures.ts';
import { camTo, controlsUnder, is3d, islandUp, stageCam, tapFigure, watchComings } from './island.ts';
import { hudBells } from './hud.ts';

test("a meteor shower's night: Celeste at centre stage, clear of every control, explains wishes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('?demo&date=2026-11-12T21:00');
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
  await page.goto('?demo&date=2026-11-12T22:00');
  await islandUp(page);
  // (the 3D island's whole-island view leaves the night sky a sliver under the HUD: there a streak crosses on down over
  // the island's far end)
  await is3d(page);
  // (every streak counted, two crossing at once too)
  const came = await watchComings(page, { star: { sel: '[data-fx="shoot"]', each: true } });
  // at least two in 24 s (a clear night would bring one at most; a streak with no clear path is skipped now and then):
  // the page's clock run on a second at a time
  for (let s = 0; s < 24 && (await came('star')) < 2; s++) await page.clock.runFor(1000);
  expect(await came('star')).toBeGreaterThanOrEqual(2);
});

test('not a shower night: no Celeste; each wish is a fragment the next morning, a shower night’s like any other', async ({ page }) => {
  await page.goto('?demo&date=2026-11-11T21:00');
  await islandUp(page);
  await page.waitForTimeout(500);
  await expect(page.locator('[data-visitor="celeste"]')).toHaveCount(0);
  // five wishes on the shower night of 11-12: five fragments on the 13th's beach
  await page.evaluate(() => localStorage.setItem('scene-wish', JSON.stringify({ '2026-11-13': 5 })));
  await page.goto('?demo&date=2026-11-13T08:00');
  await expect(page.locator('[data-find="fragment"]')).toHaveCount(5);
  // two wishes on a plain night: two
  await page.evaluate(() => localStorage.setItem('scene-wish', JSON.stringify({ '2026-11-12': 2 })));
  await page.goto('?demo&date=2026-11-12T08:00');
  await expect(page.locator('[data-find="fragment"]')).toHaveCount(2);
});
