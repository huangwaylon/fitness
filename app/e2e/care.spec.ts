// Island care (docs/design.md "Island care"): weeds to pull, flowers to water (a hybrid now and then the next day), the
// rock by the hedge. None of it changes ベル, opens a sheet or navigates; nothing sits over a control.
import { expect, test, type Page } from '@playwright/test';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo${q}`);
  await expect(ribbon(page)).toBeVisible();
  return { bells: await ribbon(page).getAttribute('aria-label'), url: page.url() };
}
async function unchanged(page: Page, before: { bells: string | null; url: string }) {
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(page.url()).toBe(before.url);
  await expect(ribbon(page)).toHaveAttribute('aria-label', before.bells!);
}
const at = (page: Page, sel: string, n = 0) =>
  page.locator(sel).nth(n).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`weeds sprout on open lawn, never over a control; a tap pulls one, and it stays pulled (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const before = await open(page, '&date=2026-11-04T12:00');
    const weeds = page.locator('[data-care="weed"]');
    await expect(weeds).toHaveCount(3);
    // every weed and dig spot on bare lawn: a few px above the anchor (the tuft), nothing but scenery under it
    const onControls = await page.evaluate(() =>
      [...document.querySelectorAll('[data-care="weed"], [data-find="fossil"], [data-care="rock"]')].flatMap((el) => {
        const r = el.getBoundingClientRect();
        return document.elementsFromPoint(r.left, r.top - 4).filter((e) => e.closest('button')).map((e) => e.className);
      }));
    expect(onControls).toEqual([]);
    const p = await at(page, '[data-care="weed"]');
    await page.mouse.click(p.x, p.y - 4);
    await expect(weeds).toHaveCount(2);
    expect(await cues(page)).toContain('scene-weed');
    await unchanged(page, before);
    await page.reload();
    await expect(ribbon(page)).toBeVisible();
    await expect(weeds).toHaveCount(2);
  });

test('a tap on a flower waters it (the can, a sprinkle); a watered bed can show a hybrid the next day', async ({ page }) => {
  const before = await open(page, '&date=2026-11-03T12:00');
  const f = await at(page, '[data-flower="0-1"]');
  await page.mouse.click(f.x, f.y - 12);
  await expect(page.locator('[data-fx="water"]')).toBeAttached();
  expect(await cues(page)).toContain('scene-water');
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('scene-garden')))!)).toMatchObject({ date: '2026-11-03', watered: ['0-1'] });
  await unchanged(page, before);
  // 2026-11-04 is a hybrid day for a bed watered the day before (care.ts, seeded): the autumn cosmos grows black
  await page.goto('?demo&date=2026-11-04T09:00');
  await expect(page.locator('[data-flower="0-1"] img')).toHaveAttribute('src', /black-cosmos/);
  await expect(page.locator('[data-flower="0-0"] img')).toHaveAttribute('src', /pink-cosmos/);
  await page.reload(); // it stays for the day
  await expect(page.locator('[data-flower="0-1"] img')).toHaveAttribute('src', /black-cosmos/);
});

test('the rock by the hedge: a tap clonks it (now and then a sparkle or a bug)', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00');
  const p = await at(page, '[data-care="rock"]');
  await page.mouse.click(p.x, p.y - 8);
  expect(await cues(page)).toContain('scene-clonk');
  await unchanged(page, before);
});
