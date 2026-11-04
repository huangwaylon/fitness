// Island care (docs/design.md "Island care"): weeds to pull, flowers to water (a hybrid now and then the next day), the
// rock by the hedge. None of it changes ベル, opens a sheet or navigates; nothing sits over a control.
import { expect, test, type Page } from '@playwright/test';
import { geo } from './island.ts';
import { hudBells, hudMenu } from './hud.ts';

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo${q}`);
  await expect(hudMenu(page)).toBeVisible();
  return { bells: await hudBells(page).getAttribute('aria-label'), url: page.url() };
}
async function unchanged(page: Page, before: { bells: string | null; url: string }) {
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(page.url()).toBe(before.url);
  await expect(hudBells(page)).toHaveAttribute('aria-label', before.bells!);
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

test('weeds sprout on open lawn, never over a control; a tap pulls one, and it stays pulled', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const before = await open(page, '&date=2026-11-04T12:00');
    const weeds = page.locator('[data-care="weed"]'), day = page.locator('[data-weeds]');
    // the day's two or three (wherever they are: on the layout they sprout all over the long island)
    await expect(weeds.first()).toBeAttached();
    const n = Number(await day.getAttribute('data-weeds'));
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(3);
    // the camera over the first
    const z = Number((await day.getAttribute('data-at'))!.split(' ')[0].split(',')[1]);
    if (z > 300) await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z - 160);
    await page.waitForTimeout(600); // measured once the camera has settled
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
    await expect(day).toHaveAttribute('data-weeds', String(n - 1));
    await expect.poll(() => cues(page)).toContain('scene-weed');
    await unchanged(page, before);
    await page.reload();
    await expect(hudMenu(page)).toBeVisible();
    await page.waitForTimeout(600);
    await expect(day).toHaveAttribute('data-weeds', String(n - 1));
  });

test('a tap on a flower waters it (the can, a sprinkle); a watered flower can show a hybrid the next day', async ({ page }) => {
  const before = await open(page, '&date=2026-11-03T12:00');
  // the front lawn's first clump (world.ts FLOWERS as the page has them: the scatter's own, its `fl:` ids, before the
  // layout's new ones), in view at まえ
  const wild = (await geo(page)).FLOWERS.filter((f) => f.id.startsWith('fl:'));
  const fl = wild[0], sel = `[data-flower="${fl.id}"]`, other = `[data-flower="${wild[1].id}"]`;
  const f = await at(page, sel);
  await page.mouse.click(f.x, f.y - 6);
  await expect(page.locator('[data-fx="water"]')).toBeAttached();
  expect(await cues(page)).toContain('scene-water');
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('scene-garden')))!)).toMatchObject({ date: '2026-11-03', watered: [fl.id] });
  await unchanged(page, before);
  // NH: a watered flower keeps a glitter for the rest of the day (only that one), after a reload too
  await expect(page.locator(`${sel} [data-watered]`)).toHaveCount(1);
  await expect(page.locator('[data-watered]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator(`${sel} [data-watered]`)).toHaveCount(1);
  // 2026-11-04 is a hybrid day for a flower watered the day before (care.ts, seeded): the autumn pink cosmos grows black
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(hudMenu(page)).toBeVisible();
  await expect(page.locator('[data-watered]')).toHaveCount(0); // a new day: no glitter until watered again
  await expect(page.locator(`${sel} img`)).toHaveAttribute('data-src', /black-cosmos/);
  await expect(page.locator(`${other} img`)).toHaveAttribute('data-src', /pink-cosmos/);
  await page.reload(); // it stays for the day
  await expect(page.locator(`${sel} img`)).toHaveAttribute('data-src', /black-cosmos/);
});

test('the rock by the hedge: a tap clonks it (now and then a sparkle or a bug)', async ({ page }) => {
  const before = await open(page, '&date=2026-11-04T12:00');
  const p = await at(page, '[data-care="rock"]');
  await page.mouse.click(p.x, p.y - 8);
  await expect.poll(() => cues(page)).toContain('scene-clonk'); // after my villager's walk to it
  await unchanged(page, before);
});
