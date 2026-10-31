// The pond (docs/design.md "Pond"): NH's freshwater fish in a small pond at the back of the island, fished exactly like
// the sea's: a tap in the pond near the shadow casts, the fish nibbles and bites, a tap on the bite catches it with NH's
// catch line, and the first of each is a ずかん find. `?critter=pond|<pond fish id>` (with ?demo) brings one now.
import { expect, test, type Page } from '@playwright/test';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';
import { FISH } from '../src/lib/components/island/critters.ts';
import { POND_FISH } from '../src/lib/components/island/pondFish.ts';

const said = (id: keyof typeof CATCH_LINES) => CATCH_LINES[id][0].replace(/\s+/g, ' ');
const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
const at = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);
const finds = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? [])
    .filter((e: { type: string }) => e.type === 'find').map((e: { data: unknown }) => e.data));
/** The pond's water on screen (client px): its oval's box. */
const pond = (page: Page) => page.locator('[data-pond-water]').evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
});

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=2026-11-04T21:00${q}`);
  await expect(ribbon(page)).toBeVisible();
  return { bells: await ribbon(page).getAttribute('aria-label'), url: page.url() };
}

for (const vp of [{ width: 375, height: 667 }, { width: 390, height: 844 }]) {
  test(`pond fishing at ${vp.width}: cast in the pond, the bite, a tap on the pond catches it, a ずかん find (no ベル)`, async ({ page }) => {
    await page.setViewportSize(vp);
    const before = await open(page, '&critter=carp');
    const fish = page.locator('[data-critter="pond"]');
    await expect(fish).toBeAttached();
    await expect(page.locator('[data-critter="fish"]')).toHaveCount(0); // the sea's own stays away while one is pinned
    await page.waitForTimeout(600);
    // the shadow swims in the pond, under no control
    const p = await pond(page), f = await at(page, '[data-critter="pond"]');
    expect(Math.abs(f.x - p.x)).toBeLessThan(p.w / 2);
    expect(Math.abs(f.y - p.y)).toBeLessThan(p.h / 2);
    expect(await page.evaluate(({ x, y }) => !document.elementFromPoint(x, y)?.closest('button'), p)).toBe(true);
    // a cast beside the shadow, in the pond
    await page.mouse.click(f.x + (f.x < p.x ? 8 : -8), f.y);
    await expect(page.locator('[data-bobber]')).toBeAttached();
    await expect(page.locator('[data-bite]')).toHaveText('！', { timeout: 10_000 });
    await page.waitForTimeout(400);
    await page.mouse.click(p.x, p.y); // any tap is the reel
    const plate = page.locator('[data-fx="catch"]');
    await expect(plate).toContainText(said('carp'));
    await expect(fish).toHaveCount(0);
    expect(await cues(page)).toEqual(expect.arrayContaining(['scene-cast', 'scene-bite', 'scene-reel', 'scene-catch']));
    expect(await finds(page)).toEqual([{ kind: 'fish', id: 'carp' }]);
    // the plate's next page: it's in the ずかん now
    const box = page.locator('[data-fx="catch"].placed .catch-plate');
    await expect(box).toHaveAttribute('data-pages', '2');
    await box.click(); // finish
    await box.click(); // turn
    await expect(box.locator('.pg.now')).toContainText('ずかんに のったよ！');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    expect(page.url()).toBe(before.url);
    await expect(ribbon(page)).toHaveAttribute('aria-label', before.bells!);
  });
}

test('the pond ripples to a tap without a fish; its fish come by on their own (the chunk loads with the first)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '');
  const p = await pond(page);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="splash"]')).toHaveCount(1);
  expect(await cues(page)).toContain('scene-splash');
  // no pond shadow yet: its table isn't loaded with the island
  const chunks = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /pondFish/.test(n)));
  expect(chunks).toEqual([]);
  // within a couple of visits a shadow swims in the pond
  await expect(page.locator('[data-critter="pond"]')).toBeAttached({ timeout: 40_000 });
});

test('the ずかん lists every fish, the pond’s and the sea’s, in NH’s order', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '');
  await ribbon(page).click();
  await page.locator('dialog[open] .tab[data-tab=kiroku]').click();
  const total = Object.keys(FISH).length + Object.keys(POND_FISH).length;
  await expect(page.locator('[data-zukan="fish"]')).toContainText(`0 / ${total}`);
  await page.locator('[data-zukan="fish"]').click();
  await expect(page.locator('.tile.unknown')).toHaveCount(total);
  expect(await page.locator('.tile').first().getAttribute('data-entry')).toBe('bitterling');
});

test('a pondskater skates on the pond on a summer day; a tap nets it (a ずかん bug)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-07-04T12:00&critter=pondskater');
  await expect(ribbon(page)).toBeVisible();
  const bug = page.locator('[data-critter="pondskater"]');
  await expect(bug).toBeAttached();
  await page.waitForTimeout(800);
  const p = await pond(page), b = await at(page, '[data-critter="pondskater"]');
  expect(Math.abs(b.x - p.x)).toBeLessThan(p.w / 2); // on the water
  expect(Math.abs(b.y - p.y)).toBeLessThan(p.h / 2);
  await page.mouse.click(b.x, b.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('pondskater'), { timeout: 6000 });
  expect(await finds(page)).toEqual([{ kind: 'bug', id: 'pondskater' }]);
});
