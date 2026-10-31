// Celeste and meteor showers (docs/design.md "Celeste and meteor showers"): about one night in ten, at most one a week,
// seeded by the week (2026-11-12 is one), Celeste comes to watch from 20:00 to 04:00 and shooting stars cross every
// 3–8 s; each wish that night is a star fragment the next morning (the season's zodiac one likelier). No ベル.
import { expect, test, type Page } from '@playwright/test';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
const under = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const b = document.querySelector(s)!.getBoundingClientRect();
    const pts = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
    return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button')).map((e) => e.className));
  }, sel);

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`a meteor shower's night: Celeste on the beach, clear of every control, explains wishes (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('?demo&date=2026-11-12T21:00&critter=none');
    await expect(ribbon(page)).toBeVisible();
    const bells = await ribbon(page).getAttribute('aria-label');
    const art = page.locator('[data-visitor="celeste"] .art');
    await expect(art).toBeVisible();
    expect(await under(page, '[data-visitor="celeste"] .art')).toEqual([]);
    const r = (await art.boundingBox())!;
    await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('フーコ');
    await expect(page.locator('[data-fx="talk"] .sr')).toContainText('ながれぼし');
    await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);
  });

test('shooting stars every 3–8 s on a shower night (a clear night: 15–40 s)', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('?demo&date=2026-11-12T22:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await page.evaluate(() => {
    const w = window as { __stars?: number };
    w.__stars = 0;
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) if (n instanceof HTMLElement && n.dataset.fx === 'shoot') w.__stars!++;
    }).observe(document.body, { childList: true, subtree: true });
  });
  // at least two in 24 s (a clear night would bring one at most; a streak with no clear path is skipped now and then)
  await expect.poll(() => page.evaluate(() => (window as { __stars?: number }).__stars ?? 0), { timeout: 24_000, intervals: [1000] }).toBeGreaterThanOrEqual(2);
});

test('not a shower night: no Celeste; each wish is a fragment the next morning, a shower night’s like any other', async ({ page }) => {
  await page.goto('?demo&date=2026-11-11T21:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator('[data-visitor="celeste"]')).toHaveCount(0);
  // five wishes on the shower night of 11-12: five fragments on the 13th's beach
  await page.evaluate(() => localStorage.setItem('scene-wish', JSON.stringify({ '2026-11-13': 5 })));
  await page.goto('?demo&date=2026-11-13T08:00&critter=none');
  await expect(page.locator('[data-find="fragment"]')).toHaveCount(5);
  // two wishes on a plain night: two
  await page.evaluate(() => localStorage.setItem('scene-wish', JSON.stringify({ '2026-11-12': 2 })));
  await page.goto('?demo&date=2026-11-12T08:00&critter=none');
  await expect(page.locator('[data-find="fragment"]')).toHaveCount(2);
});
