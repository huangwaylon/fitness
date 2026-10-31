// Celeste and meteor showers (docs/design.md "Celeste and meteor showers"): about one night in ten, at most one a week,
// seeded by the week (2026-11-12 is one), Celeste comes to watch from 20:00 to 04:00 and shooting stars cross every
// 3–8 s; a wish that night brings 4–5 star fragments the next morning. No ベル.
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
  await page.goto('?demo&date=2026-11-12T22:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await page.evaluate(() => {
    const w = window as { __stars?: number };
    w.__stars = 0;
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) if (n instanceof HTMLElement && n.dataset.fx === 'shoot') w.__stars!++;
    }).observe(document.body, { childList: true, subtree: true });
  });
  await page.waitForTimeout(17_000);
  expect(await page.evaluate(() => (window as { __stars?: number }).__stars)).toBeGreaterThanOrEqual(2);
});

test('not a shower night: no Celeste; a wish on a shower night brings 4–5 fragments the next morning (else 2–3)', async ({ page }) => {
  await page.goto('?demo&date=2026-11-11T21:00&critter=none');
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator('[data-visitor="celeste"]')).toHaveCount(0);
  await page.evaluate(() => localStorage.setItem('scene-wish', JSON.stringify('2026-11-13')));
  await page.goto('?demo&date=2026-11-13T08:00&critter=none');
  await expect(page.locator('[data-find="fragment"]').first()).toBeAttached();
  const n = await page.locator('[data-find="fragment"]').count();
  expect(n).toBeGreaterThanOrEqual(4);
  expect(n).toBeLessThanOrEqual(5);
  await page.evaluate(() => localStorage.setItem('scene-wish', JSON.stringify('2026-11-12')));
  await page.goto('?demo&date=2026-11-12T08:00&critter=none');
  await expect(page.locator('[data-find="fragment"]').first()).toBeAttached();
  const plain = await page.locator('[data-find="fragment"]').count();
  expect(plain).toBeGreaterThanOrEqual(2);
  expect(plain).toBeLessThanOrEqual(3);
});
