// The wedding countdown (docs/design.md "Wedding countdown"): on the milestone days before 2027-10-08 Reese and Cyrus
// visit the centre stage with a heart float and count down; on the day, confetti, the wedding pose and fireworks at
// night; every June Sunday NH's wedding arch stands behind the centre stage. Nothing over a control; no ベル.
import { expect, test, type Page } from '@playwright/test';
import { geo, is3d, sawIt, stageCam, watchFor } from './island.ts';
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
  test(`100 days to go: Reese and Cyrus on the centre stage under their heart float, counting down (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('?demo&date=2027-06-30T12:00&critter=none');
    await expect(hudMenu(page)).toBeVisible();
    const bells = await hudBells(page).getAttribute('aria-label');
    const pair = page.locator('[data-visitor="reese"]');
    await camera(page, await stageCam(page));
    await expect(pair.locator('.art')).toBeVisible();
    expect(await offFrom(page, '[data-visitor="reese"]', ...(await geo(page)).CENTRE_STAGE)).toBeLessThan(2);
    await expect(pair).toHaveAttribute('data-stage', 'true');
    await expect(pair.locator('[data-heart-float]')).toBeVisible();
    expect(await under(page, '[data-visitor="reese"] .art')).toEqual([]);
    await tapOn(page, '[data-visitor="reese"] .art');
    const box = page.locator('[data-fx="talk"].placed');
    await expect(box.locator('.who')).toHaveText('リサ', { timeout: 4000 });
    await expect(page.locator('[data-fx="talk"] .sr')).toContainText('けっこんしき まで あと 100日！');
    await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
  });

test('no countdown the day before; the arch on a June Sunday, clear of every control', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('?demo&date=2027-06-29T12:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  await page.waitForTimeout(600);
  await expect(page.locator('[data-visitor="reese"]')).toHaveCount(0);
  await expect(page.locator('[data-arch]')).toHaveCount(0);
  await page.goto('?demo&date=2027-06-27T12:00&critter=none');
  await camera(page, await stageCam(page));
  await expect(page.locator('[data-arch] .official')).toBeVisible();
  expect(await offFrom(page, '[data-arch]', ...(await geo(page)).ARCH)).toBeLessThan(2);
  expect(await under(page, '[data-arch] .official')).toEqual([]);
});

test('the wedding day: confetti and hearts on the villagers, Reese’s congratulations, fireworks at night', async ({ page }) => {
  // (watched from the start: on a slow GPU the confetti may be over by the time the island's up)
  await watchFor(page, ['.fxa.confetti', '.fxa.hearts']);
  await page.goto('?demo&date=2027-10-08T20:00&critter=none');
  await expect(hudMenu(page)).toBeVisible();
  await is3d(page);
  await expect.poll(() => sawIt(page, '.fxa.confetti'), { timeout: 4000 }).toBe(true);
  await expect.poll(() => sawIt(page, '.fxa.hearts')).toBe(true);
  await expect(page.locator('[data-firework]').first()).toBeAttached({ timeout: 6000 }); // the show (Fireworks.svelte)
  await camera(page, await stageCam(page));
  await tapOn(page, '[data-visitor="reese"] .art');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('ごけっこん おめでとう', { timeout: 4000 });
  // the confetti once a day on this phone; the hearts every time
  await page.reload();
  await expect(hudMenu(page)).toBeVisible();
  await is3d(page); // (the 3D island up: the hearts come on its villagers)
  await expect.poll(() => sawIt(page, '.fxa.hearts'), { timeout: 4000 }).toBe(true);
  expect(await sawIt(page, '.fxa.confetti')).toBe(false);
});
