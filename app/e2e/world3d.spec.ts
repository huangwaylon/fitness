// The 3D island POC (/world3d, /tmp/world3d/design.md): an unlinked route that draws the whole island in three.js.
// The island never loads three; the route does, draws its canvas, and a tap on open ground walks my villager.
import { expect, test } from '@playwright/test';

type W = { stats(): { frames: number; calls: number; tris: number; dpr: number; loading: number }; loaded(): boolean; at(w: string): [number, number]; client(x: number, y: number, z: number): [number, number]; go(z: number): void };
const w3d = <R,>(page: import('@playwright/test').Page, fn: (w: W) => R) => page.evaluate(`(${fn.toString()})(window.__w3d)`) as Promise<R>;

test('the island never loads three; /world3d draws the whole island in 3D, and a tap on the lawn walks my villager', async ({ page }) => {
  test.setTimeout(60_000);
  const scripts: string[] = [];
  page.on('response', async (r) => {
    if (r.url().endsWith('.js')) scripts.push((await r.text().catch(() => '')).includes('WebGLRenderer') ? 'three' : 'other');
  });
  await page.goto('?demo&date=2026-11-04T12:00&critter=none&visitor=none');
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(800);
  expect(scripts).not.toContain('three');

  await page.goto('world3d/?demo&date=2026-11-04T12:00');
  await expect(page.locator('canvas[data-w3d]')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await page.waitForFunction(() => (window as unknown as { __w3d?: { stats(): { frames: number } } }).__w3d?.stats().frames, null, { timeout: 30_000 });
  expect(scripts).toContain('three');
  await page.waitForFunction(() => (window as unknown as { __w3d: { loaded(): boolean } }).__w3d.loaded(), null, { timeout: 30_000 });
  const s = await w3d(page, (w) => w.stats());
  expect(s.calls).toBeGreaterThan(10);
  expect(s.dpr).toBeLessThanOrEqual(2);

  // a tap on open lawn in front of the villagers (world 200, 150) walks mine (A) there
  const [x, y] = await w3d(page, (w) => w.client(230, 3, 150));
  await page.mouse.click(x, y);
  await expect.poll(async () => {
    const [ax, az] = await w3d(page, (w) => w.at('A'));
    return Math.hypot(ax - 230, az - 150);
  }, { timeout: 10_000 }).toBeLessThan(12);
});
