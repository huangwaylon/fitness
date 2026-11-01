// The tent (docs/design.md "The tent"): the campsite's door opens its inside, NH's largest room in 3D, as a screen of
// its own: the room's code and three.js come only then (the island never loads them); my villager walks where the
// floor is tapped; the doormat and ‹ 島へ go back out, to the island as it was.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

type T = { stats(): { frames: number; calls: number; tris: number; dpr: number }; mine(): [number, number]; walking(w: string): boolean; px(x: number, z: number, y?: number): [number, number]; loading(): number };
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none';

/** Into the tent from the island: the camera up to the campsite, its door tapped. */
async function enter(page: Page) {
  await page.goto(Q);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(642));
  await page.waitForTimeout(300);
  await page.locator('[data-building="campsite"] .door').click();
  await expect(page).toHaveURL(/\/tent\?/);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  // the door's iris has opened
  await expect(page.locator('html')).not.toHaveAttribute('data-door', /./, { timeout: 4000 });
}

test('the island never loads the room; the tent does, opens through the door, and goes back out to the island as it was', async ({ page }) => {
  const scripts: string[] = [];
  page.on('response', async (r) => {
    if (r.url().endsWith('.js')) scripts.push((await r.text().catch(() => '')).includes('WebGLRenderer') ? 'three' : 'other');
  });
  await page.goto(Q);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(800);
  expect(scripts).not.toContain('three');
  await page.evaluate(() => (window as unknown as { __world: { go(z: number): void } }).__world.go(642));
  await page.waitForTimeout(300);
  const cam = await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam());
  await page.locator('[data-building="campsite"] .door').click();
  await expect(page).toHaveURL(/\/tent\?/);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  expect(scripts).toContain('three');
  await expect(page.locator('html')).not.toHaveAttribute('data-door', /./, { timeout: 4000 });
  // the device pixel ratio is capped (the iPhone 13 profile is 3)
  expect((await tent(page, (t) => t.stats())).dpr).toBeLessThanOrEqual(2);
  // out by the doormat (the front edge's middle)
  const [x, y] = await tent(page, (t) => t.px(0, 36.5));
  await page.mouse.click(x, y);
  await expect(page).toHaveURL(/\/fitness\/\?/);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  expect(Math.abs((await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam())) - cam)).toBeLessThan(2);
  await expect(page.locator('[data-tent]')).toHaveCount(0);
});

test('a tap on the floor walks my villager there; ‹ 島へ goes back out; nothing is drawn while nothing moves', async ({ page }) => {
  await enter(page);
  await page.waitForFunction(() => !(window as unknown as { __tent: { walking(w: string): boolean } }).__tent.walking('A'));
  const [x, y] = await tent(page, (t) => t.px(25, -20));
  await page.mouse.click(x, y);
  await page.waitForTimeout(200);
  expect(await tent(page, (t) => t.walking('A'))).toBe(true);
  await page.waitForFunction(() => !(window as unknown as { __tent: { walking(w: string): boolean } }).__tent.walking('A'), null, { timeout: 5000 });
  const [mx, mz] = await tent(page, (t) => t.mine());
  expect(Math.hypot(mx - 25, mz + 20)).toBeLessThan(1.5);
  // still: no frames
  const f0 = (await tent(page, (t) => t.stats())).frames;
  await page.waitForTimeout(600);
  expect((await tent(page, (t) => t.stats())).frames).toBe(f0);
  await page.getByRole('button', { name: '島へ' }).click();
  await expect(page).toHaveURL(/\/fitness\/\?/);
});
