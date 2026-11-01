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
/** The nearest weed on screen (the lawn runs back past the river: some lie further off than まえ shows): its index. */
const nearestWeed = (page: Page) =>
  page.evaluate(() => {
    const all = [...document.querySelectorAll('[data-care="weed"]')];
    const on = all.map((el, i) => ({ i, r: el.getBoundingClientRect(), shown: el.checkVisibility({ visibilityProperty: true }) }))
      .filter((w) => w.shown && w.r.top > 0 && w.r.top < innerHeight);
    return on.sort((a, b) => b.r.top - a.r.top)[0]?.i ?? -1;
  });

for (const [w, h] of [[390, 844], [320, 568]] as const)
  test(`weeds sprout on open lawn, never over a control; a tap pulls one, and it stays pulled (${w}px)`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const before = await open(page, '&date=2026-11-04T12:00');
    const weeds = page.locator('[data-care="weed"]');
    // the day's three, less one a control covers on this screen (a weed behind a canopy, on a small phone)
    await expect(weeds.first()).toBeAttached();
    await page.waitForTimeout(600); // measured once the camera has settled
    const n = await weeds.count();
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(3);
    // every weed and dig spot on this screen on bare lawn: a few px above the anchor (the tuft), nothing but scenery
    // under it (the villagers walk about: not counted)
    const onControls = await page.evaluate(() =>
      [...document.querySelectorAll('[data-care="weed"], [data-find="fossil"], [data-care="rock"]')].flatMap((el) => {
        if (!el.checkVisibility({ visibilityProperty: true })) return [];
        const r = el.getBoundingClientRect();
        if (r.top < 0 || r.top > innerHeight) return [];
        return document.elementsFromPoint(r.left, r.top - 4).filter((e) => e.closest('button') && !e.closest('[data-actor]')).map((e) => e.className);
      }));
    expect(onControls).toEqual([]);
    const i = await nearestWeed(page);
    expect(i, 'a weed on screen').toBeGreaterThanOrEqual(0);
    const p = await at(page, '[data-care="weed"]', i);
    await page.mouse.click(p.x, p.y - 4);
    await expect(weeds).toHaveCount(n - 1);
    await expect.poll(() => cues(page)).toContain('scene-weed');
    await unchanged(page, before);
    await page.reload();
    await expect(ribbon(page)).toBeVisible();
    await page.waitForTimeout(600);
    await expect(weeds).toHaveCount(n - 1);
  });

test('a tap on a flower waters it (the can, a sprinkle); a watered bed can show a hybrid the next day', async ({ page }) => {
  const before = await open(page, '&date=2026-11-03T12:00');
  const f = await at(page, '[data-flower="0-1"]');
  await page.mouse.click(f.x, f.y - 12);
  await expect(page.locator('[data-fx="water"]')).toBeAttached();
  expect(await cues(page)).toContain('scene-water');
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('scene-garden')))!)).toMatchObject({ date: '2026-11-03', watered: ['0-1'] });
  await unchanged(page, before);
  // NH: a watered flower keeps a glitter for the rest of the day (only that one), after a reload too
  await expect(page.locator('[data-flower="0-1"] [data-watered]')).toHaveCount(1);
  await expect(page.locator('[data-watered]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('[data-flower="0-1"] [data-watered]')).toHaveCount(1);
  // 2026-11-04 is a hybrid day for a bed watered the day before (care.ts, seeded): the autumn cosmos grows black
  // (it shows once that goal's flower has bloomed: by 23:00 every goal is met, e2e/trees.spec.ts)
  await page.goto('?demo&date=2026-11-04T23:00');
  await expect(page.locator('[data-flower="0-1"]')).toHaveAttribute('data-stage', 'open', { timeout: 5000 });
  await expect(page.locator('[data-watered]')).toHaveCount(0); // a new day: no glitter until watered again
  await expect(page.locator('[data-flower="0-1"] img')).toHaveAttribute('src', /black-cosmos/);
  await expect(page.locator('[data-flower="0-0"] img')).toHaveAttribute('src', /pink-cosmos/);
  await page.reload(); // it stays for the day
  await expect(page.locator('[data-flower="0-1"] img')).toHaveAttribute('src', /black-cosmos/);
});

test('the rock by the hedge: a tap clonks it (now and then a sparkle or a bug)', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00');
  const p = await at(page, '[data-care="rock"]');
  await page.mouse.click(p.x, p.y - 8);
  await expect.poll(() => cues(page)).toContain('scene-clonk'); // after my villager's walk to it
  await unchanged(page, before);
});
