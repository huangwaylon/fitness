// The island's critters and the balloon (docs/design.md "Scene interactions"): a tap pops the balloon and its present
// falls; a fish shadow can be fished (caught on the bite, lost on an early tap); a bug can be netted. None of it
// changes ベル, opens a sheet or navigates. `?critter=` (with ?demo) brings one on at once and keeps it until caught.
import { expect, test, type Page } from '@playwright/test';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=2026-11-04T12:00${q}`);
  await expect(ribbon(page)).toBeVisible();
  return { bells: await ribbon(page).getAttribute('aria-label'), url: page.url() };
}

/** Nothing counted, nothing opened, nowhere gone. */
async function unchanged(page: Page, before: { bells: string | null; url: string }) {
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  expect(page.url()).toBe(before.url);
  await expect(ribbon(page)).toHaveAttribute('aria-label', before.bells!);
}

/** The centre of an element (critters are 0 × 0 anchors: their box is the point). */
const at = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);

test('a tap pops the balloon; its present falls onto the island', async ({ page }) => {
  const before = await open(page, '&balloon');
  const balloon = page.locator('.if-scene .balloon');
  // it drifts in from off the screen's edge: wait until it's well inside
  await expect.poll(async () => { const r = await balloon.boundingBox(); return !!r && r.x > 40 && r.x + r.width < 350; }, { timeout: 15_000 }).toBe(true);
  const b = (await balloon.boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height * 0.25);
  await expect(page.locator('[data-fx="present"]')).toHaveCount(1);
  await expect(balloon).toHaveCount(0);
  expect(await cues(page)).toContain('scene-balloon');
  await expect(page.locator('[data-fx="present"]')).toHaveCount(0, { timeout: 5000 });
  await unchanged(page, before);
});

test('fishing: a tap on the bite catches the fish', async ({ page }) => {
  const before = await open(page, '&critter=fish');
  const fish = page.locator('[data-critter="fish"]');
  await expect(fish).toBeAttached();
  await page.waitForTimeout(500); // faded in
  const f = await at(page, '[data-critter="fish"]');
  await page.mouse.click(f.x, f.y);
  await expect(page.locator('[data-bobber]')).toBeAttached();
  await expect(page.locator('[data-bobber="bite"]')).toBeAttached({ timeout: 10_000 });
  await page.mouse.click(f.x, f.y);
  const caught = page.locator('[data-fx="catch"]');
  await expect(caught).toHaveCount(1);
  await expect(caught).toHaveText(/つりあげた|と思ったら/);
  await expect(page.locator('[data-bobber]')).toHaveCount(0);
  await expect(fish).toHaveCount(0);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-cast', 'scene-bite', 'scene-reel', 'scene-catch']));
  await unchanged(page, before);
});

test('fishing: a tap before the bite scares the fish away', async ({ page }) => {
  const before = await open(page, '&critter=fish');
  await expect(page.locator('[data-critter="fish"]')).toBeAttached();
  await page.waitForTimeout(500);
  const f = await at(page, '[data-critter="fish"]');
  await page.mouse.click(f.x, f.y);
  await expect(page.locator('[data-bobber="wait"]')).toBeAttached();
  await page.mouse.click(f.x, f.y); // still swimming up to it: too early
  await expect(page.locator('[data-bobber]')).toHaveCount(0);
  await expect(page.locator('[data-critter="fish"]')).toHaveCount(0, { timeout: 2000 });
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
  expect(await cues(page)).toContain('scene-flee');
  await unchanged(page, before);
});

test('a tap on a butterfly nets it', async ({ page }) => {
  const before = await open(page, '&critter=common-butterfly');
  await expect(page.locator('[data-critter="common-butterfly"]')).toBeAttached();
  await page.waitForTimeout(2200); // in over its flower bed
  const b = await at(page, '[data-critter="common-butterfly"]');
  await page.mouse.click(b.x, b.y);
  await expect(page.locator('[data-fx="catch"]')).toHaveText('モンシロチョウを つかまえた！');
  await expect(page.locator('[data-critter]')).toHaveCount(0);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-net', 'scene-catch']));
  await unchanged(page, before);
});
