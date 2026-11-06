// The wedding countdown (docs/design.md "Wedding countdown"): on the milestone days before 2027-10-08 Reese and Cyrus
// visit the centre stage with a heart float and count down; on the day, confetti, the wedding pose and fireworks at
// night; every June Sunday NH's wedding arch stands behind the centre stage. Nothing over a control; no ベル.
import { expect, test } from './fixtures.ts';
import { camTo, controlsUnder, geo, is3d, islandUp, offFrom, sawIt, stageCam, tapFigure, watchFor } from './island.ts';
import { hudBells } from './hud.ts';

test('100 days to go: Reese and Cyrus on the centre stage under their heart float, counting down', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('?demo&date=2027-06-30T12:00&critter=none');
  await islandUp(page);
  const bells = await hudBells(page).getAttribute('aria-label');
  const pair = page.locator('[data-visitor="reese"]');
  await camTo(page, await stageCam(page), false);
  await expect(pair.locator('.art')).toBeVisible();
  expect(await offFrom(page, '[data-visitor="reese"]', ...(await geo(page)).CENTRE_STAGE)).toBeLessThan(2);
  await expect(pair).toHaveAttribute('data-stage', 'true');
  await expect(pair.locator('[data-heart-float]')).toBeVisible();
  expect(await controlsUnder(page, '[data-visitor="reese"] .art')).toEqual([]);
  await tapFigure(page, '[data-visitor="reese"] .art');
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box.locator('.who')).toHaveText('リサ', { timeout: 4000 });
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('けっこんしき まで あと 100日！');
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
});

test('no countdown the day before; the arch on a June Sunday, clear of every control', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('?demo&date=2027-06-29T12:00&critter=none');
  await islandUp(page);
  await page.waitForTimeout(600);
  await expect(page.locator('[data-visitor="reese"]')).toHaveCount(0);
  await expect(page.locator('[data-arch]')).toHaveCount(0);
  await page.goto('?demo&date=2027-06-27T12:00&critter=none');
  await camTo(page, await stageCam(page), false);
  await expect(page.locator('[data-arch] .official')).toBeVisible();
  expect(await offFrom(page, '[data-arch]', ...(await geo(page)).ARCH)).toBeLessThan(2);
  expect(await controlsUnder(page, '[data-arch] .official')).toEqual([]);
});

test('the wedding day: confetti and hearts on the villagers, Reese’s congratulations, fireworks at night', async ({ page }) => {
  // (watched from the start: on a slow GPU the confetti may be over by the time the island's up)
  await watchFor(page, ['.fxa.confetti', '.fxa.hearts']);
  await page.goto('?demo&date=2027-10-08T20:00&critter=none');
  await islandUp(page);
  await is3d(page);
  await expect.poll(() => sawIt(page, '.fxa.confetti'), { timeout: 4000 }).toBe(true);
  await expect.poll(() => sawIt(page, '.fxa.hearts')).toBe(true);
  await expect(page.locator('[data-firework]').first()).toBeAttached({ timeout: 6000 }); // the show (Fireworks.svelte)
  await camTo(page, await stageCam(page), false);
  await tapFigure(page, '[data-visitor="reese"] .art');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('ごけっこん おめでとう', { timeout: 4000 });
  // the confetti once a day on this phone; the hearts every time
  await page.reload();
  await islandUp(page);
  await is3d(page); // (the 3D island up: the hearts come on its villagers)
  await expect.poll(() => sawIt(page, '.fxa.hearts'), { timeout: 4000 }).toBe(true);
  expect(await sawIt(page, '.fxa.confetti')).toBe(false);
});
