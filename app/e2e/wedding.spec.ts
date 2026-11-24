// The wedding countdown (docs/design.md "Wedding countdown"): on the milestone days before 2027-10-08 Reese and Cyrus
// visit the centre stage with a heart float and count down; on the day, confetti, the wedding pose and fireworks at
// night; every June Sunday NH's wedding arch stands behind the centre stage. Nothing over a control; no ベル.
import { expect, test } from './fixtures.ts';
import { camTo, controlsUnder, geo, is3d, islandUp, offFrom, propsOut, sawIt, stageCam, tapFigure, visitorOut, watchFor, type ActorIs } from './island.ts';
import { hudBells } from './hud.ts';

test('100 days to go: Reese and Cyrus on the centre stage under their heart float, counting down', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('?demo&date=2027-06-30T12:00');
  await islandUp(page);
  const bells = await hudBells(page).getAttribute('aria-label');
  await camTo(page, await stageCam(page), false);
  await expect.poll(async () => (await visitorOut(page, 'reese'))?.shown).toBe(true);
  expect(await offFrom(page, 'visitor', 'reese', ...(await geo(page)).CENTRE_STAGE)).toBeLessThan(2);
  expect((await visitorOut(page, 'reese'))?.stage).toBe('true');
  await expect.poll(async () => (await visitorOut(page, 'reese'))?.heart).toBe(true);
  expect(await controlsUnder(page, 'visitor', 'reese')).toEqual([]);
  await tapFigure(page, 'visitor', 'reese');
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box.locator('.who')).toHaveText('リサ', { timeout: 4000 });
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('けっこんしき まで あと 100にち！');
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
});

test('no countdown the day before; the arch on a June Sunday, clear of every control', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('?demo&date=2027-06-29T12:00');
  await islandUp(page);
  await page.waitForTimeout(600);
  await expect.poll(() => visitorOut(page, 'reese')).toBeNull();
  await expect.poll(async () => (await propsOut(page)).arch).toBeNull();
  await page.goto('?demo&date=2027-06-27T12:00');
  await camTo(page, await stageCam(page), false);
  await expect.poll(async () => (await propsOut(page)).arch?.shown).toBe(true);
  expect(await offFrom(page, 'arch', '', ...(await geo(page)).ARCH)).toBeLessThan(2);
  expect(await controlsUnder(page, 'arch')).toEqual([]);
});

const [CONFETTI, HEARTS]: ActorIs[] = [{ actor: '*', is: 'fx:confetti' }, { actor: '*', is: 'fx:hearts' }];

test('the wedding day: confetti and hearts on the villagers, Reese’s congratulations, fireworks at night', async ({ page }) => {
  // (watched from the start: on a slow GPU the confetti may be over by the time the island's up)
  await watchFor(page, [CONFETTI, HEARTS]);
  await page.goto('?demo&date=2027-10-08T20:00');
  await islandUp(page);
  await is3d(page);
  await expect.poll(() => sawIt(page, CONFETTI), { timeout: 4000 }).toBe(true);
  await expect.poll(() => sawIt(page, HEARTS)).toBe(true);
  await expect(page.locator('[data-firework]').first()).toBeAttached({ timeout: 6000 }); // the show (Fireworks.svelte)
  await camTo(page, await stageCam(page), false);
  await tapFigure(page, 'visitor', 'reese');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('ごけっこん おめでとう', { timeout: 4000 });
  // the confetti once a day on this phone; the hearts every time
  await page.reload();
  await islandUp(page);
  await is3d(page); // (the 3D island up: the hearts come on its villagers)
  await expect.poll(() => sawIt(page, HEARTS), { timeout: 4000 }).toBe(true);
  expect(await sawIt(page, CONFETTI)).toBe(false);
});
