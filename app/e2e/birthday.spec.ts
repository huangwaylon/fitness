// Birthdays (docs/design.md "Birthdays"): on one of ours (config: ウェイ Oct 6, うめ Mar 4) NH's birthday hats on both
// villagers, the cake in front of centre stage (world.ts CAKE, the plaza on the front lawn; a tap: its music box, the candles out for the day), confetti the first
// time the island opens, しずえ's line; an NH villager's own birthday puts the hat on that villager and a line in its
// chats. Nothing over a control; no ベル.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, controlsUnder, geo, islandUp, offFrom, sawIt, stageCam, tapFigure, villager, watchFor, type ActorIs } from './island.ts';
import { hudBells } from './hud.ts';

/** How many of the villagers wear a hat (`__world3d.actor`). */
const hats = async (page: Page) => (await Promise.all(['mine', 'partner', 'third'].map((s) => villager(page, s)))).filter((a) => a?.hat).length;
const CONFETTI: ActorIs = { actor: '*', is: 'fx:confetti' };

test("うめ's birthday: hats, the cake clear of every control, confetti and しずえ's wishes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await watchFor(page, [CONFETTI]);
  await page.goto('?demo&date=2027-03-04T12:00');
  await islandUp(page);
  const bells = await hudBells(page).getAttribute('aria-label');
  await expect.poll(() => hats(page)).toBe(2);
  await camTo(page, await stageCam(page), false);
  await expect(page.locator('[data-cake="lit"] .official')).toBeVisible();
  expect(await offFrom(page, 'cake', '', ...(await geo(page)).CAKE)).toBeLessThan(2);
  expect(await controlsUnder(page, 'cake')).toEqual([]);
  // (watched from the start: on a slow GPU it may be over before the camera's there)
  await expect.poll(() => sawIt(page, CONFETTI), { timeout: 4000 }).toBe(true);
  await expect(page.locator('.news')).toContainText('さん、おたんじょうび おめでとう！');
  // the cake: a music box, and the candles out for the day
  await tapFigure(page, 'cake');
  await expect(page.locator('[data-cake="out"]')).toBeAttached();
  expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('birthday-cake');
  // a tap while it plays starts nothing over for everyone (it did: a new record, the song from the top on every phone)
  const at = () => page.evaluate(() => (window as unknown as { __music: { stage(): { on: { isl?: { song: string | null; at: number } } } } }).__music.stage().on.isl);
  const first = await at();
  expect(first?.song).toBe('ev-happy-birthday');
  await tapFigure(page, 'cake');
  await page.waitForTimeout(300); // hold: proving nothing happens (a restart is a new record within the tap)
  expect(await at()).toEqual(first);
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
  await page.reload();
  await islandUp(page);
  await expect(page.locator('[data-cake="out"]')).toBeAttached({ timeout: 4000 });
  await page.waitForTimeout(2000);
  expect((await Promise.all(['mine', 'partner'].map((s) => villager(page, s)))).some((a) => a?.fx.includes('confetti'))).toBe(false); // once a day
});

test('ウェイ’s birthday too; none the day after; an NH villager’s own birthday: its hat', async ({ page }) => {
  await page.goto('?demo&date=2026-10-06T12:00');
  await islandUp(page);
  await expect.poll(() => hats(page)).toBe(2);
  await expect(page.locator('.news')).toContainText('さん、おたんじょうび おめでとう！');
  await page.goto('?demo&date=2026-10-07T12:00');
  await islandUp(page);
  await page.waitForTimeout(800);
  await expect.poll(() => hats(page)).toBe(0);
  await expect(page.locator('[data-cake]')).toHaveCount(0);
  await expect(page.locator('.news')).toHaveCount(0);
  // Goldie (my villager in the demo) was born on Dec 27
  await page.goto('?demo&date=2026-12-27T12:00');
  await islandUp(page);
  await expect.poll(() => hats(page)).toBe(1);
  await expect(page.locator('[data-cake]')).toHaveCount(0);
});
