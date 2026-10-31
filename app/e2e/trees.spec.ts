// The trees' fruit through a day (docs/design.md "Trees"): grey in the canopy at 0, colouring with progress; once met
// it falls to the ground (once) and a flower blooms at the trunk; a tap picks it up and it stays gone for the Tokyo day
// (this phone's fruit-day); all four met, the canopy glints. Picking up never changes ベル. The demo's progress follows
// ?date= (no sync before 06:40; most goals settled by 23:00).
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
async function open(page: Page, date: string) {
  await page.goto(`?demo&date=${date}`);
  await expect(ribbon(page)).toBeVisible();
}
const fruit = (page: Page) => page.locator('.if-scene [data-fruit]');
const filterOf = (page: Page, sel: string) => page.locator(sel).locator('.f').evaluate((el) => getComputedStyle(el).filter);

test('at 0 every fruit hangs grey in its canopy: nothing on the ground, no flowers, no glints', async ({ page }) => {
  await open(page, '2026-11-04T05:30');
  await expect(fruit(page)).toHaveCount(8);
  await expect(page.locator('[data-stage="tree"]')).toHaveCount(8);
  for (const f of await fruit(page).all()) expect(await f.locator('.f').evaluate((el) => getComputedStyle(el).filter)).toContain('grayscale(1)');
  await expect(page.locator('[data-bloom], .glints[data-tree]')).toHaveCount(0);
  // the canopy still opens its popup
  await page.locator('button.canopy').first().click();
  await expect(page.locator('.detail')).toBeVisible();
});

test('met fruit falls to the ground in colour with a flower each; unmet ones colour with progress; a tap picks one up, it stays gone after a reload and comes back the next day', async ({ page }) => {
  await open(page, '2026-11-04T23:00');
  const ground = page.locator('[data-stage="ground"]');
  await expect(page.locator('[data-stage="fall"]')).toHaveCount(0, { timeout: 5000 }); // every met fruit has fallen
  const met = await ground.count();
  expect(met).toBeGreaterThan(0);
  await expect(page.locator('[data-bloom]')).toHaveCount(met);
  for (const f of await ground.all()) expect(await f.locator('.f').evaluate((el) => getComputedStyle(el).filter)).toBe('none');
  for (const f of await page.locator('[data-stage="tree"]').all()) {
    const g = Number(/grayscale\(([\d.]+)\)/.exec(await f.locator('.f').evaluate((el) => getComputedStyle(el).filter))?.[1]);
    expect(g).toBeGreaterThan(0), expect(g).toBeLessThan(0.55); // 50–95% of the goal by night
  }
  // a tree with all four met glints
  for (const p of ['A', 'B']) {
    const all = (await page.locator(`[data-bloom][data-tree="${p}"]`).count()) === 4;
    await expect(page.locator(`.glints[data-tree="${p}"]`)).toHaveCount(all ? 1 : 0);
  }

  // pick one up: it hops away; ベル don't move
  const bells = await ribbon(page).getAttribute('aria-label');
  const one = ground.first();
  const [id, tree] = [await one.getAttribute('data-fruit'), await one.getAttribute('data-tree')];
  const b = (await one.boundingBox())!;
  await page.waitForTimeout(1700); // the drop's bounce is over
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator(`[data-fruit="${id}"][data-tree="${tree}"]`)).toHaveCount(0);
  await expect(page.locator(`[data-bloom="${id}"][data-tree="${tree}"]`)).toHaveCount(1); // its flower stays
  await expect(page.locator('.detail')).toHaveCount(0); // a pick-up, not the popup
  await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);

  // a reload: still gone, and the others lie there without falling again
  await page.reload();
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator(`[data-fruit="${id}"][data-tree="${tree}"]`)).toHaveCount(0);
  await expect(ground).toHaveCount(met - 1);
  await expect(page.locator('[data-stage="fall"], .fruit.drop')).toHaveCount(0);
  await page.waitForTimeout(1200);
  await expect(page.locator('.fruit.drop')).toHaveCount(0);

  // the next Tokyo day: everything back in the canopy, grey
  await open(page, '2026-11-05T05:30');
  await expect(page.locator('[data-stage="tree"]')).toHaveCount(8);
  await expect(page.locator('[data-bloom]')).toHaveCount(0);
});

test('with nothing fallen, the fruit row still opens the popup; from the keyboard it picks up the first fallen fruit', async ({ page }) => {
  await open(page, '2026-11-04T05:30');
  await page.locator('button.row-btn').first().click();
  await expect(page.locator('.detail')).toBeVisible();
  await open(page, '2026-11-04T23:00');
  await expect(page.locator('[data-stage="fall"]')).toHaveCount(0, { timeout: 5000 });
  const row = page.locator('button.row-btn[tabindex="0"]').first();
  await expect(row).toHaveAttribute('aria-label', /を ひろう$/);
  const before = await page.locator('[data-stage="ground"]').count();
  await row.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-stage="ground"]')).toHaveCount(before - 1);
});
