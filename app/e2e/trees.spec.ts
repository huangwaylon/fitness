// The trees' fruit and the goal flowers through a day (docs/design.md "Trees"): grey in the canopy at 0, colouring
// with progress; once met it falls to the ground (once) and that goal's flower in its person's bed blooms (once); a tap
// picks the fruit up and it stays gone for the Tokyo day (this phone's fruit-day), the flower stays open; all four met,
// the canopy glints. Picking up never changes ベル. The demo's progress follows ?date= (no sync before 06:40; most
// goals settled by 23:00).
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
async function open(page: Page, date: string) {
  await page.goto(`?demo&date=${date}`);
  await expect(ribbon(page)).toBeVisible();
}
const fruit = (page: Page) => page.locator('.if-scene [data-fruit]');
const flowers = (page: Page) => page.locator('.if-scene [data-flower]');
const opened = (page: Page) => page.locator('.if-scene [data-flower][data-stage="open"]');
const filterOf = (page: Page, sel: string) => page.locator(sel).locator('.f').evaluate((el) => getComputedStyle(el).filter);

test('at 0 every fruit hangs grey in its canopy and every goal flower is a bud: nothing on the ground, no glints', async ({ page }) => {
  await open(page, '2026-11-04T05:30');
  await expect(fruit(page)).toHaveCount(8);
  await expect(page.locator('[data-stage="tree"]')).toHaveCount(8);
  for (const f of await fruit(page).all()) expect(await f.locator('.f').evaluate((el) => getComputedStyle(el).filter)).toContain('grayscale(1)');
  // eight goal flowers, a bud each (no flower art), one per person and goal
  await expect(flowers(page)).toHaveCount(8);
  await expect(page.locator('[data-flower][data-stage="bud"] svg.budart')).toHaveCount(8);
  await expect(page.locator('[data-flower] img')).toHaveCount(0);
  for (const p of ['A', 'B']) for (const f of ['pear', 'peach', 'cherry', 'apple']) await expect(page.locator(`[data-flower][data-person="${p}"][data-goal="${f}"]`)).toHaveCount(1);
  await page.waitForTimeout(1800); // nothing blooms
  await expect(opened(page)).toHaveCount(0);
  await expect(page.locator('.glints[data-tree]')).toHaveCount(0);
  // the canopy still opens its popup
  await page.locator('button.canopy').first().click();
  await expect(page.locator('.detail')).toBeVisible();
});

test('met fruit falls to the ground in colour and its goal flower blooms; unmet ones colour with progress; a tap picks one up, it stays gone after a reload (the flower stays open, no second bloom) and the next day starts over', async ({ page }) => {
  await open(page, '2026-11-04T23:00');
  const ground = page.locator('[data-stage="ground"]');
  await expect(page.locator('[data-stage="fall"]')).toHaveCount(0, { timeout: 5000 }); // every met fruit has fallen
  const met = await ground.count();
  expect(met).toBeGreaterThan(0);
  // each met goal's flower blooms in its person's bed (the bud gives way to the flower art), the rest stay buds
  await expect(opened(page)).toHaveCount(met, { timeout: 5000 });
  await expect(page.locator('[data-flower][data-stage="bud"]')).toHaveCount(8 - met);
  for (const f of await ground.all()) {
    const [p, g] = [await f.getAttribute('data-tree'), await f.getAttribute('data-fruit')];
    const fl = page.locator(`[data-flower][data-person="${p}"][data-goal="${g}"]`);
    await expect(fl).toHaveAttribute('data-stage', 'open');
    await expect(fl.locator('img')).toHaveCount(1);
    // the bed beside its person: on the same side of the island as their tree's fruit
    const [fb, gb] = [(await fl.boundingBox())!, (await f.boundingBox())!];
    expect(fb.x < 195 === gb.x < 195).toBe(true);
  }
  for (const f of await ground.all()) expect(await f.locator('.f').evaluate((el) => getComputedStyle(el).filter)).toBe('none');
  for (const f of await page.locator('[data-stage="tree"]').all()) {
    const g = Number(/grayscale\(([\d.]+)\)/.exec(await f.locator('.f').evaluate((el) => getComputedStyle(el).filter))?.[1]);
    expect(g).toBeGreaterThan(0), expect(g).toBeLessThan(0.55); // 50–95% of the goal by night
  }
  // a tree with all four met glints
  for (const p of ['A', 'B']) {
    const all = (await page.locator(`[data-flower][data-stage="open"][data-person="${p}"]`).count()) === 4;
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
  await expect(page.locator(`[data-flower][data-goal="${id}"][data-person="${tree}"]`)).toHaveAttribute('data-stage', 'open'); // its flower stays
  await expect(page.locator('.detail')).toHaveCount(0); // a pick-up, not the popup
  await expect(ribbon(page)).toHaveAttribute('aria-label', bells!);

  // a reload: still gone, and the others lie there without falling again
  await page.reload();
  await expect(ribbon(page)).toBeVisible();
  await expect(page.locator(`[data-fruit="${id}"][data-tree="${tree}"]`)).toHaveCount(0);
  await expect(ground).toHaveCount(met - 1);
  await expect(page.locator('[data-stage="fall"], .fruit.drop')).toHaveCount(0);
  await expect(opened(page)).toHaveCount(met); // open straight away, no second bloom
  await page.waitForTimeout(1800);
  await expect(page.locator('.fruit.drop, [data-flower].opening')).toHaveCount(0);

  // the next Tokyo day: everything back in the canopy, grey
  await open(page, '2026-11-05T05:30');
  await expect(page.locator('[data-stage="tree"]')).toHaveCount(8);
  await expect(page.locator('[data-flower][data-stage="bud"]')).toHaveCount(8);
});

test('a goal flower blooms once: the bud squashes and the flower pops open with its petal bits and the bloom cue', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __cues: string[] }).__cues = [];
  });
  await open(page, '2026-11-05T21:00'); // a mixed evening: some goals met on each side
  await expect(page.locator('[data-flower].opening').first()).toBeAttached({ timeout: 4000 });
  await expect(page.locator('[data-flower].opening .burst i').first()).toBeAttached();
  expect(await page.evaluate(() => (window as unknown as { __cues: string[] }).__cues)).toContain('flower-bloom');
  await expect(page.locator('[data-flower].opening')).toHaveCount(0, { timeout: 5000 });
  const n = await opened(page).count();
  expect(n).toBeGreaterThan(0), expect(n).toBeLessThan(8);
  await expect(page.locator('[data-flower][data-stage="bud"]')).toHaveCount(8 - n);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fruit-day')!).bloomed.length)).toBe(n);
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
