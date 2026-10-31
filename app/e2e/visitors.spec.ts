// Visitors (docs/design.md "Visitors"): K.K. on Saturday nights (a song with the music on), Daisy Mae on Sunday
// mornings, Wisp on some nights, Gulliver washed up on some days. On the front beach, never over a control; a tap gives
// a line (an introduction first), no trading, no ベル.
import { expect, test, type Page } from '@playwright/test';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
async function tapOn(page: Page, sel: string) {
  const r = (await page.locator(sel).boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}
/** The controls under a figure's corners and middle. */
const under = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const b = document.querySelector(s)!.getBoundingClientRect();
    const pts = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
    return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button')).map((e) => e.className));
  }, sel);

test('K.K. Slider comes on Saturday night; with the music on a tap plays his song', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('island.sound', JSON.stringify({ music: true, sfx: true, volume: 0.8 }));
    (window as { __cues?: string[] }).__cues = [];
  });
  await page.goto('?demo&date=2026-10-31T20:00'); // a Saturday
  await expect(ribbon(page)).toBeVisible();
  const bells = await ribbon(page).getAttribute('aria-label');
  const kk = page.locator('[data-visitor="kk-slider"] .art');
  await expect(kk).toBeVisible();
  expect(await under(page, '[data-visitor="kk-slider"] .art')).toEqual([]);
  await tapOn(page, '[data-visitor="kk-slider"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('とたけけ');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('♪');
  expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('kk-song');
  await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
});

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`visitors stand on the beach clear of every control; the first tap is an introduction (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    for (const [q, id, name] of [['2026-11-01T08:00&critter=none', 'daisy-mae', 'ウリ'], ['2026-11-04T22:00&visitor=wisp&critter=none', 'wisp', 'ゆうたろう'], ['2026-11-04T12:00&visitor=gulliver&critter=none', 'gulliver', 'ジョニー']] as const) {
      await page.goto(`?demo&date=${q}`);
      await expect(ribbon(page)).toBeVisible();
      await expect(page.locator(`[data-visitor="${id}"] .art`)).toBeVisible();
      expect(await under(page, `[data-visitor="${id}"] .art`), id).toEqual([]);
      await tapOn(page, `[data-visitor="${id}"] .art`);
      const box = page.locator('[data-fx="talk"].placed');
      await expect(box.locator('.who')).toHaveText(name);
      await expect(box).toHaveAttribute('data-pages', '2');
      // and its balloon covers no control (but itself: it's the button that turns its pages)
      const notSelf = await page.evaluate(() => {
        const b = document.querySelector('[data-fx="talk"]')!.getBoundingClientRect();
        return [[b.left + 3, b.top + 3], [b.right - 3, b.bottom - 3], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]]
          .flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button') && !e.closest('[data-fx="talk"]')).map((e) => e.className));
      });
      expect(notSelf).toEqual([]);
    }
  });

test('nobody visits on an ordinary weekday evening', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T19:00');
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator('[data-visitor]')).toHaveCount(0);
});
