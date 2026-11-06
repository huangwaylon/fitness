// Under a full-height sheet (けんこう, ごはん: docs/design.md "Island scene") the island does nothing: the 3D island
// draws no frame (its engine paused) and no CSS animation runs in the page but the sheet's own, so nothing behind the
// sheet asks the compositor for frames while someone reads their charts; closed, the island runs again.
import { expect, test, type Page } from './fixtures.ts';

type W3 = { loaded(): boolean; stats(): { frames: number; paused: boolean } };
const w3 = <R,>(page: Page, fn: (w: W3) => R) => page.evaluate(`(${fn.toString()})(window.__world3d)`) as Promise<R>;
const sheet = (page: Page) => page.locator('dialog[open]');
/** The CSS animations running outside the open sheet (its own zoom has played). */
const runningBehind = (page: Page) => page.evaluate(() => document.getAnimations()
  .filter((a) => a.playState === 'running' && !(a.effect as KeyframeEffect | null)?.target?.closest('dialog[open]'))
  .map((a) => `${(a as CSSAnimation).animationName ?? a.constructor.name} on .${String(((a.effect as KeyframeEffect).target as Element).className).split(' ')[0]}`));

for (const [name, ready] of [['けんこう', '.health .mc'], ['ごはん', '[data-food-summary]']] as const)
  test(`under ${name} the island draws no frames and no animation runs behind the sheet; closed, it draws again`, async ({ page }) => {
    await page.goto('?demo&date=2026-11-04T12:30');
    await page.waitForFunction(() => (window as unknown as { __world3d?: W3 }).__world3d?.loaded(), null, { timeout: 30_000 });
    await page.getByRole('button', { name, exact: true }).click();
    await expect(sheet(page).locator(ready).first()).toBeVisible();
    await sheet(page).evaluate((d) => Promise.all(d.getAnimations().map((a) => a.finished)));
    expect(await w3(page, (w) => w.stats().paused)).toBe(true);
    const f0 = await w3(page, (w) => w.stats().frames);
    await page.waitForTimeout(1500);
    expect(await w3(page, (w) => w.stats().frames)).toBe(f0);
    expect(await runningBehind(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);
    await expect.poll(() => w3(page, (w) => w.stats().frames)).toBeGreaterThan(f0);
  });
