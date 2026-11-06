// Birthdays (docs/design.md "Birthdays"): on one of ours (config: ウェイ Oct 6, うめ Mar 4) NH's birthday hats on both
// villagers, the cake in front of centre stage (world.ts CAKE, the plaza on the front lawn; a tap: its music box, the candles out for the day), confetti the first
// time the island opens, しずえ's line; an NH villager's own birthday puts the hat on that villager and a line in its
// chats. Nothing over a control; no ベル.
import { expect, test } from './fixtures.ts';
import { camTo, controlsUnder, geo, islandUp, offFrom, sawIt, stageCam, tapFigure, watchFor } from './island.ts';
import { hudBells } from './hud.ts';

test("うめ's birthday: hats, the cake clear of every control, confetti and しずえ's wishes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await watchFor(page, ['.fxa.confetti']);
  await page.goto('?demo&date=2027-03-04T12:00&critter=none');
  await islandUp(page);
  const bells = await hudBells(page).getAttribute('aria-label');
  await expect(page.locator('.vil [data-hat]')).toHaveCount(2);
  await camTo(page, await stageCam(page), false);
  await expect(page.locator('[data-cake="lit"] .official')).toBeVisible();
  expect(await offFrom(page, '[data-cake]', ...(await geo(page)).CAKE)).toBeLessThan(2);
  expect(await controlsUnder(page, '[data-cake] .official')).toEqual([]);
  // (watched from the start: on a slow GPU it may be over before the camera's there)
  await expect.poll(() => sawIt(page, '.fxa.confetti'), { timeout: 4000 }).toBe(true);
  await expect(page.locator('.news')).toContainText('さん、おたんじょうび おめでとう！');
  // the cake: a music box, and the candles out for the day
  await tapFigure(page, '[data-cake] .official');
  await expect(page.locator('[data-cake="out"]')).toBeAttached();
  expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('birthday-cake');
  // a tap while it plays starts nothing over for everyone (it did: a new record, the song from the top on every phone)
  const at = () => page.evaluate(() => (window as unknown as { __music: { stage(): { on: { isl?: { song: string | null; at: number } } } } }).__music.stage().on.isl);
  const first = await at();
  expect(first?.song).toBe('ev-happy-birthday');
  await tapFigure(page, '[data-cake] .official');
  await page.waitForTimeout(300); // hold: proving nothing happens (a restart is a new record within the tap)
  expect(await at()).toEqual(first);
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
  await page.reload();
  await islandUp(page);
  await expect(page.locator('[data-cake="out"]')).toBeAttached({ timeout: 4000 });
  await page.waitForTimeout(2000);
  await expect(page.locator('.fxa.confetti')).toHaveCount(0); // once a day
});

test('ウェイ’s birthday too; none the day after; an NH villager’s own birthday: its hat', async ({ page }) => {
  await page.goto('?demo&date=2026-10-06T12:00&critter=none');
  await islandUp(page);
  await expect(page.locator('.vil [data-hat]')).toHaveCount(2);
  await expect(page.locator('.news')).toContainText('さん、おたんじょうび おめでとう！');
  await page.goto('?demo&date=2026-10-07T12:00&critter=none');
  await islandUp(page);
  await page.waitForTimeout(800);
  await expect(page.locator('.vil [data-hat]')).toHaveCount(0);
  await expect(page.locator('[data-cake]')).toHaveCount(0);
  await expect(page.locator('.news')).toHaveCount(0);
  // Goldie (my villager in the demo) was born on Dec 27
  await page.goto('?demo&date=2026-12-27T12:00&critter=none');
  await islandUp(page);
  await expect(page.locator('.vil [data-hat]')).toHaveCount(1);
  await expect(page.locator('[data-cake]')).toHaveCount(0);
});
