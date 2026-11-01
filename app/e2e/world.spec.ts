// The rolling-log world (docs/design.md "World"): one depth order for everything (behind a tree a villager is hidden
// by it; just in front it covers the trunk while the canopy covers its head; a building likewise), the native scroller
// is the camera with three stops (まえ, ひろば, おく), taps land on transformed sprites near the horizon, and nothing
// runs once it is still.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

type W = { go(z: number): void; cam(): number; idle(): boolean; at(x: number, z: number): [number, number]; put(x: number, z: number): void };
const world = async (page: Page) => {
  await page.waitForFunction(() => (window as unknown as { __world?: W }).__world);
  await page.waitForTimeout(500);
};
const call = <T,>(page: Page, fn: (w: W, a: number[]) => T, args: number[] = []) =>
  page.evaluate(([f, a]) => new Function('w', 'a', `return (${f})(w, a)`)((window as unknown as { __world: W }).__world, a), [fn.toString(), args] as const) as Promise<T>;

async function open(page: Page, cam: number) {
  await page.goto('?demo&season=summer&date=2026-07-01T10:00');
  await world(page);
  await call(page, (w, [z]) => w.go(z), [cam]);
  await page.waitForTimeout(400);
}

/** Put my villager at (x, z) and say who is on top at a point of it (fy: 0 its head … 1 its feet). */
async function topAt(page: Page, x: number, z: number, fy: number) {
  await call(page, (w, [x, z]) => w.put(x, z), [x, z]);
  // the scenery's art lets taps through (pointer-events: none): make it hit-testable for the probe
  await page.addStyleTag({ content: '[data-scenery-id] .art, [data-building] .door { pointer-events: auto !important; }' });
  await page.waitForTimeout(150);
  const r = (await page.locator('[data-actor="mine"] .vil img').first().boundingBox())!;
  return page.evaluate(([px, py]) => {
    const e = document.elementFromPoint(px, py);
    if (!e) return null;
    if (e.closest('[data-actor="mine"]')) return 'mine';
    const tree = e.closest('[data-scenery-id]');
    if (tree) return `${(tree as HTMLElement).dataset.sceneryId}:${(tree as HTMLElement).dataset.part}`;
    const b = e.closest('[data-building]');
    if (b) return `building:${(b as HTMLElement).dataset.building}`;
    return e.className.toString() || e.tagName;
  }, [r.x + r.width / 2, r.y + r.height * fy]);
}

test('a villager behind a tree is hidden by it; just in front it covers the trunk and the canopy covers its head', async ({ page }) => {
  await open(page, 860);
  // the plaza's oak at (330, 1170)
  expect(await topAt(page, 330, 1186, 0.55)).toMatch(/^oak-p3:/);
  expect(await topAt(page, 330, 1162, 0.92)).toBe('mine');
  expect(await topAt(page, 330, 1162, 0.08)).toBe('oak-p3:canopy');
  expect(await topAt(page, 330, 1120, 0.1)).toBe('mine');
});

test('behind a building it is hidden, in front of it it covers it', async ({ page }) => {
  await open(page, 1100);
  expect(await topAt(page, 195, 1090, 0.6)).toBe('building:rs');
  expect(await topAt(page, 195, 1050, 0.4)).toBe('mine');
});

test('the camera is the scroller: three stops, the sprites follow it, nothing runs once it stops', async ({ page }) => {
  await page.goto('?demo&season=summer');
  await world(page);
  expect(await call(page, (w) => w.cam())).toBe(150); // まえ: the bottom of the scroller
  expect(await page.evaluate(() => document.scrollingElement!.scrollHeight <= innerHeight)).toBe(true);
  const before = await page.locator('[data-tree-node]').first().evaluate((e) => (e as HTMLElement).style.transform);
  await page.locator('[data-world-scroller]').evaluate((e) => e.scrollBy(0, -400));
  await page.waitForTimeout(500);
  expect(await call(page, (w) => w.cam())).toBeGreaterThan(400);
  expect(await page.locator('[data-tree-node]').first().evaluate((e) => (e as HTMLElement).style.transform)).not.toBe(before);
  // proximity snapping settles on a stop (ひろば) or stays put; either way, once still, no frame is pending (polled: on
  // a slow runner the snap's smooth scroll, or an ambient beat that sets a villager walking, can still be under way)
  await expect.poll(() => call(page, (w) => w.idle()), { timeout: 10_000 }).toBe(true);
  for (const z of [860, 1380, 150]) {
    await call(page, (w, [z]) => w.go(z), [z]);
    await page.waitForTimeout(300);
    expect(Math.round(await call(page, (w) => w.cam()))).toBe(z);
  }
});

test('a tap on a sprite far up near the horizon lands on it (hit-testing follows the transforms)', async ({ page }) => {
  await open(page, 1000);
  // the museum, far up the island: its door is a button, small near the horizon
  const door = page.locator('[data-building="museum"] button');
  const r = (await door.boundingBox())!;
  expect(r.height).toBeGreaterThan(10);
  const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('[data-building="museum"]'), [r.x + r.width / 2, r.y + r.height * 0.8]);
  expect(hit).toBe(true);
});

test('the ground is baked: the bands in view show the season’s terrain chunks; the back loads lazily', async ({ page }) => {
  await page.goto('?demo&season=summer');
  await world(page);
  const shown = await page.locator('[data-world-ground] .gband:not([style*="hidden"]) img').evaluateAll((els) => [...new Set(els.map((e) => (e as HTMLImageElement).src.split('/').slice(-2).join('/')))]);
  expect(shown.length).toBeGreaterThan(0);
  for (const s of shown) expect(s).toMatch(/^summer\/[0-7]\.webp\?v=\d+$/);
});
