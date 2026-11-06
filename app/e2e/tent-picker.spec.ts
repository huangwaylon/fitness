// The tent's picker and framing on the iPhone 15 and 16 (docs/design.md "The tent"): every icon in every tab takes the
// first tap, where it is, with no jump of the list (the user: "I can't select the bottom leftmost item ... It jumps
// the list to the right"); the floor's middle sits at the middle of what the controls leave of the screen, at NH's view,
// after a turn and back, and with the edit tray open.
import { expect, test, type Page } from './fixtures.ts';

const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none';
type C = { at: [number, number]; band: [number, number] };
const centre = (page: Page) => page.evaluate(() => (window as unknown as { __tent: { centre(): C } }).__tent.centre());

async function openTent(page: Page) {
  await page.addInitScript(() => localStorage.removeItem('island-demo.tent'));
  await page.goto('tent' + Q);
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
}
/** Within a few px of the band's middle (after any glide). */
async function centred(page: Page) {
  await expect.poll(async () => {
    const c = await centre(page);
    return Math.max(Math.abs(c.at[0] - c.band[0]), Math.abs(c.at[1] - c.band[1]));
  }, { timeout: 3000 }).toBeLessThan(4);
}

for (const vp of [{ width: 393, height: 852, name: 'iPhone 15' }, { width: 402, height: 874, name: 'iPhone 16' }]) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, hasTouch: true, isMobile: true });

    test('the floor’s middle is the middle of the usable screen: NH’s view, turned, back, and with the tray open', async ({ page }) => {
      await openTent(page);
      await centred(page);
      await page.evaluate(() => (window as unknown as { __tent: { orbit(a: number, p: number): void; zoom(f: number): void } }).__tent.orbit(0.9, -0.2));
      await centred(page);
      await page.evaluate(() => (window as unknown as { __tent: { zoom(f: number): void } }).__tent.zoom(2.5));
      await centred(page);
      await page.locator('[data-tent-reset]').tap();
      await expect.poll(() => page.evaluate(() => (window as unknown as { __tent: { isDefault(): boolean } }).__tent.isDefault())).toBe(true);
      await centred(page);
      await page.locator('[data-tent-edit-open]').tap();
      await centred(page);
      // the band is above the tray: the floor's middle above the bar
      const c = await centre(page), bar = (await page.locator('[data-tent-edit] .bar').boundingBox())!;
      expect(c.at[1]).toBeLessThan(bar.y);
    });

    test('every icon in every tab is picked on the first tap, where it is, and the list never jumps', async ({ page }) => {
      await openTent(page);
      await page.locator('[data-tent-edit-open]').tap();
      for (const tab of ['furniture', 'rugs', 'wall', 'floor']) {
        await page.locator(`[data-tab="${tab}"]`).tap();
        const items = page.locator('[data-tent-items] [data-tent-item]');
        const n = await items.count();
        // the first row's length (the grid's columns), then the first, the bottom-left and bottom-right of what shows, the last
        const cols = await items.evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetTop === (els[0] as HTMLElement).offsetTop).length);
        const picks = [...new Set([0, Math.min(n - 1, cols), Math.min(n - 1, 2 * cols - 1), n - 1])];
        for (const i of picks) {
          const it = items.nth(i);
          await it.scrollIntoViewIfNeeded();
          const code = (await it.getAttribute('data-tent-item'))!;
          const before = await page.locator('[data-tent-items]').evaluate((g) => [g.scrollLeft, g.scrollTop]);
          const box = (await it.boundingBox())!;
          await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
          await expect(it, `${tab} #${i}`).toHaveAttribute('aria-pressed', 'true');
          expect(await page.locator('[data-tent-items]').evaluate((g) => [g.scrollLeft, g.scrollTop]), `${tab} #${i} ${code}`).toEqual(before);
        }
        if (await page.locator('[data-act="cancel"]').count()) await page.locator('[data-act="cancel"]').tap();
      }
      // みつけた with nothing found yet says so
      await page.locator('[data-tab="finds"]').tap();
      await expect(page.locator('[data-tent-empty]')).toBeVisible();
      // さいきん: what I picked last, newest first
      await page.locator('[data-tab="recent"]').tap();
      await expect(page.locator('[data-tent-items] [data-tent-item]').first()).toHaveAttribute('data-tent-item', /^f/);
    });
  });
}
