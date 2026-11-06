// せってい → フレームレート (docs/design.md "Frame rate"): 30 by default, 60 kept on this phone (localStorage), and the
// 3D island paced to it: at 30 never two frames a display frame apart while the camera moves.
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';

/** The island's frames drawn while the camera pans each display frame for `ms`: the median gap between them (ms). */
const panGaps = (page: Page, ms: number) => page.evaluate((ms) => new Promise<number>((done) => {
  const w = (window as unknown as { __world3d: { pan(dy: number): void; stats(): { frames: number } } }).__world3d;
  const s = performance.now(), at: number[] = [];
  let f0 = w.stats().frames, k = 0;
  (function f(now: number) {
    w.pan(++k % 120 < 60 ? 3 : -3);
    const fr = w.stats().frames;
    if (fr !== f0) (at.push(now), (f0 = fr));
    if (now - s < ms) requestAnimationFrame(f);
    else {
      const g = at.slice(1).map((x, i) => x - at[i]).sort((a, b) => a - b);
      done(g[Math.floor(g.length / 2)] ?? 0);
    }
  })(s);
}), ms);

test('フレームレート: 30 by default; 60 picked is kept on this phone', async ({ page }) => {
  // (the e2e pin 60 in storage: this phone as a new one, once)
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('fps-fresh')) (localStorage.removeItem('island.fps'), sessionStorage.setItem('fps-fresh', '1'));
  });
  await page.goto('?demo&date=2026-11-04T12:00');
  await fromMenu(page, 'settings');
  await expect(page.locator('[data-fps="30"]')).toHaveAttribute('aria-checked', 'true');
  await page.locator('[data-fps="60"]').click();
  await expect(page.locator('[data-fps="60"]')).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => localStorage.getItem('island.fps'))).toBe('60');
  await page.reload();
  await fromMenu(page, 'settings');
  await expect(page.locator('[data-fps="60"]')).toHaveAttribute('aria-checked', 'true');
});

test('at 30 the island draws every other display frame while the camera moves', async ({ page }) => {
  await page.goto('?demo&visitor=none&critter=none&date=2026-11-04T12:00&fps=30');
  await page.waitForFunction(() => (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 30_000 });
  // (a slow runner draws less often still: the gap is never under two display frames' less half of one)
  expect(await panGaps(page, 1500)).toBeGreaterThan(27);
});
