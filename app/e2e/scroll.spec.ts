// The island scrolls freely (docs/decisions.md "Free scrolling"): only the finger moves the camera, between the two
// ends (まえ at the foot, where it opens, おく at the top); it rests wherever the scroll leaves it, nothing settles it, and
// nothing runs once it is still. At each end the HUD covers none of the key content: まえ the villagers and their goal
// trees with a band of sea under the beach, おく the campsite. A tree's popup opens in screen space, wholly in view,
// over the canopies when it fits, never dimmed at night.
import { expect, test, type Page } from '@playwright/test';
import { SHORE_Z } from '../src/lib/components/island/world.ts';

type W = { cam(): number; stops(): number[]; at(x: number, z: number): [number, number]; idle(): boolean; go(z: number): void };
const call = <T,>(page: Page, fn: (w: W, a: number[]) => T, args: number[] = []) =>
  page.evaluate(([f, a]) => new Function('w', 'a', `return (${f})(w, a)`)((window as unknown as { __world: W }).__world, a), [fn.toString(), args] as const) as Promise<T>;

async function open(page: Page, q = '&date=2026-07-01T10:00') {
  await page.goto(`?demo&season=summer${q}`);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(600);
}
/** The tops of what must stay clear of the HUD, and its bottom. */
const clearOfHud = (page: Page, sels: string[]) =>
  page.evaluate((sels) => {
    const hud = document.querySelector('.ribbon-wrap')!.getBoundingClientRect().bottom;
    return sels.map((sel) => ({ sel, hud, top: Math.min(...[...document.querySelectorAll(sel)].map((e) => e.getBoundingClientRect().top)) }));
  }, sels);

for (const vp of [{ width: 393, height: 852 }, { width: 402, height: 874 }, { width: 320, height: 568 }]) {
  test.describe(`at ${vp.width} × ${vp.height}`, () => {
    test.use({ viewport: vp });

    test('the HUD covers none of the key content at either end; the front shows sea under the beach', async ({ page }) => {
      await open(page);
      for (const r of await clearOfHud(page, ['[data-actor] .vil', 'button.canopy'])) expect(r.top, r.sel).toBeGreaterThanOrEqual(r.hud);
      const shore = (await call(page, (w, [z]) => w.at(195, z), [SHORE_Z]))[1];
      expect(shore).toBeLessThan(vp.height * 0.9);
      expect(shore).toBeGreaterThan(vp.height * 0.7);
      // おく
      await call(page, (w) => w.go(w.stops()[1]));
      await page.waitForTimeout(700);
      for (const r of await clearOfHud(page, ['[data-building="campsite"] .door'])) expect(r.top, r.sel).toBeGreaterThanOrEqual(r.hud);
    });

    test('a tree’s popup opens wholly in view, the other tree still tappable, never dimmed', async ({ page }) => {
      await open(page, '&date=2026-07-01T21:00&critter=none');
      for (const z of [0, 200]) {
        await call(page, (w, [z]) => w.go(z), [z]);
        await page.waitForTimeout(400);
        await page.locator('button.canopy').first().click({ force: true });
        const d = page.locator('.detail');
        await expect(d).toBeVisible();
        await page.waitForTimeout(500);
        const b = (await d.boundingBox())!;
        const hud = await page.evaluate(() => document.querySelector('.ribbon-wrap')!.getBoundingClientRect().bottom);
        expect(b.y).toBeGreaterThanOrEqual(hud);
        expect(b.y + b.height).toBeLessThanOrEqual(vp.height);
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(vp.width);
        // over every tint: no filter on it or its layer, above the ground's tint plane
        expect(await d.evaluate((el) => getComputedStyle(el.closest('.pop')!).filter)).toBe('none');
        // the 3D island's popup goes over the canopies when it fits, else on its tree's side (FruitTree's fitPopup):
        // the other tree's middle stays tappable
        expect(await page.locator('button.canopy').evaluateAll((els) => els.slice(1).filter((e) => e.getBoundingClientRect().width).map((e) => {
          const r = e.getBoundingClientRect();
          return e.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
        }))).not.toContain(false);
        await page.keyboard.press('Escape');
        await expect(d).toHaveCount(0);
      }
    });
  });
}
