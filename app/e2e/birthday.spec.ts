// Birthdays (docs/design.md "Birthdays"): on one of ours (config: ウェイ Oct 6, うめ Mar 4) NH's birthday hats on both
// villagers, the cake in front of centre stage (world.ts CAKE, the plaza on the front lawn; a tap: its music box, the candles out for the day), confetti the first
// time the island opens, しずえ's line; an NH villager's own birthday puts the hat on that villager and a line in its
// chats. Nothing over a control; no ベル.
import { expect, test, type Page } from '@playwright/test';
import { geo, sawIt, stageCam, watchFor } from './island.ts';
import { hudBells, hudMenu } from './hud.ts';

/** The controls under a thing's corners and middle (a building's door behind a world prop is the world's, not a control over it). */
const under = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const b = document.querySelector(s)!.getBoundingClientRect();
    const pts = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
    return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button') && !e.closest('[data-building]')).map((e) => e.className));
  }, sel);
/** The camera to a world z (まえ, 642 おく: the campsite's clearing), settled. */
async function camera(page: Page, z: number) {
  await page.waitForFunction(() => !!(window as unknown as { __world?: unknown }).__world);
  // (again until it holds: the scene may still re-fit its camera as it settles in)
  await expect.poll(async () => {
    await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z);
    await page.waitForTimeout(250);
    return page.evaluate((z) => Math.abs((window as unknown as { __world: { cam(): number } }).__world.cam() - z), z);
  }, { timeout: 5000 }).toBeLessThan(1.5); // (WebKit scrolls by whole px: within a px of z)
  await page.waitForTimeout(250);
}
/** A world node's origin (its foot) on screen against where a world point projects (px apart). */
const offFrom = (page: Page, sel: string, x: number, z: number) =>
  page.evaluate(([sel, x, z]) => {
    const r = document.querySelector(sel as string)!.getBoundingClientRect();
    const [px, py] = (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(x as number, z as number);
    return Math.hypot(r.left - px, r.top - py);
  }, [sel, x, z] as const);
async function tapOn(page: Page, sel: string) {
  const r = (await page.locator(sel).first().boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`うめ's birthday: hats, the cake clear of every control, confetti and しずえ's wishes (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
    await watchFor(page, ['.fxa.confetti']);
    await page.goto('?demo&date=2027-03-04T12:00&critter=none');
    await expect(hudMenu(page)).toBeVisible();
    const bells = await hudBells(page).getAttribute('aria-label');
    await expect(page.locator('.vil [data-hat]')).toHaveCount(2);
    await camera(page, await stageCam(page));
    await expect(page.locator('[data-cake="lit"] .official')).toBeVisible();
    expect(await offFrom(page, '[data-cake]', ...(await geo(page)).CAKE)).toBeLessThan(2);
    expect(await under(page, '[data-cake] .official')).toEqual([]);
    // (watched from the start: on a slow GPU it may be over before the camera's there)
    await expect.poll(() => sawIt(page, '.fxa.confetti'), { timeout: 4000 }).toBe(true);
    await expect(page.locator('.news')).toContainText('さん、おたんじょうび おめでとう！');
    // the cake: a music box, and the candles out for the day
    await tapOn(page, '[data-cake] .official');
    await expect(page.locator('[data-cake="out"]')).toBeAttached();
    expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('birthday-cake');
    await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
    await page.reload();
    await expect(hudMenu(page)).toBeVisible();
    await expect(page.locator('[data-cake="out"]')).toBeAttached({ timeout: 4000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('.fxa.confetti')).toHaveCount(0); // once a day
  });

test('ウェイ’s birthday too; none the day after; an NH villager’s own birthday: its hat', async ({ page }) => {
  await page.goto('?demo&date=2026-10-06T12:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  await expect(page.locator('.vil [data-hat]')).toHaveCount(2);
  await expect(page.locator('.news')).toContainText('さん、おたんじょうび おめでとう！');
  await page.goto('?demo&date=2026-10-07T12:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.locator('.vil [data-hat]')).toHaveCount(0);
  await expect(page.locator('[data-cake]')).toHaveCount(0);
  await expect(page.locator('.news')).toHaveCount(0);
  // Goldie (my villager in the demo) was born on Dec 27
  await page.goto('?demo&date=2026-12-27T12:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  await expect(page.locator('.vil [data-hat]')).toHaveCount(1);
  await expect(page.locator('[data-cake]')).toHaveCount(0);
});
