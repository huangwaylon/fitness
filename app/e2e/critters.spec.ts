// The island's critters and the balloon (docs/design.md "Scene interactions"): a tap pops the balloon and its present
// falls; a fish shadow can be fished (caught on the bite, lost on an early tap); a bug can be netted. None of it
// changes ベル, opens a sheet or navigates. `?critter=` (with ?demo) brings one on at once and keeps it until caught.
import { expect, test, type Page } from '@playwright/test';

// The installed app's full screen (a Home Screen app has no browser bars): with the island centred in the whole ocean,
// the 664px Safari viewport leaves too little sea under the beach for a fish.
test.use({ viewport: { width: 390, height: 844 } });

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

/** A tap on the sea well away from the bobber and the shadow (any sea tap is the reel while the bobber is out). */
async function seaTap(page: Page) {
  const b = await at(page, '[data-bobber]');
  await page.mouse.click(b.x < 195 ? 366 : 24, b.y);
}

test('fishing: react to the 「！」 and a tap anywhere on the sea catches the fish', async ({ page }) => {
  const before = await open(page, '&critter=fish');
  const fish = page.locator('[data-critter="fish"]');
  await expect(fish).toBeAttached();
  await page.waitForTimeout(500); // faded in
  const f = await at(page, '[data-critter="fish"]');
  await page.mouse.click(f.x + (f.x < 195 ? 40 : -40), f.y); // a cast beside the shadow, not on it
  await expect(page.locator('[data-bobber]')).toBeAttached();
  await expect(page.locator('[data-bite]')).toHaveText('！', { timeout: 10_000 });
  await expect(page.locator('[data-bobber="bite"]')).toBeAttached();
  await page.waitForTimeout(400); // a human's reaction
  await seaTap(page);
  const caught = page.locator('[data-fx="catch"]');
  await expect(caught).toHaveCount(1);
  await expect(caught).toHaveText(/つりあげた|と思ったら/);
  await expect(page.locator('[data-bobber]')).toHaveCount(0);
  await expect(page.locator('[data-bite]')).toHaveCount(0);
  await expect(fish).toHaveCount(0);
  const heard = await cues(page);
  expect(heard).toEqual(expect.arrayContaining(['scene-cast', 'scene-bite', 'scene-reel', 'scene-catch']));
  expect(heard).not.toContain('scene-flee');
  await unchanged(page, before);
});

test('fishing: a first early tap only makes the fish hesitate (it still bites); a second scares it away', async ({ page }) => {
  const before = await open(page, '&critter=fish');
  await expect(page.locator('[data-critter="fish"]')).toBeAttached();
  await page.waitForTimeout(500);
  const f = await at(page, '[data-critter="fish"]');
  await page.mouse.click(f.x, f.y);
  await expect(page.locator('[data-bobber="wait"]')).toBeAttached();
  await page.waitForTimeout(200);
  await seaTap(page); // still swimming up to it: too early, but only the first time
  await page.waitForTimeout(300);
  await expect(page.locator('[data-bobber="wait"]')).toBeAttached();
  await expect(page.locator('[data-critter="fish"]')).toBeAttached();
  expect(await cues(page)).not.toContain('scene-flee');
  await seaTap(page); // the second early tap
  await expect(page.locator('[data-bobber]')).toHaveCount(0);
  await expect(page.locator('[data-critter="fish"]')).toHaveCount(0, { timeout: 2000 });
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
  expect(await cues(page)).toContain('scene-flee');
  await unchanged(page, before);
});

test('fishing: after a hesitation the fish comes back and bites, and the bite still catches it', async ({ page }) => {
  await open(page, '&critter=fish');
  await expect(page.locator('[data-critter="fish"]')).toBeAttached();
  await page.waitForTimeout(500);
  const f = await at(page, '[data-critter="fish"]');
  await page.mouse.click(f.x, f.y);
  await expect(page.locator('[data-bobber="wait"]')).toBeAttached();
  await page.waitForTimeout(200);
  await seaTap(page);
  await expect(page.locator('[data-bite]')).toBeAttached({ timeout: 12_000 });
  await page.waitForTimeout(400);
  await seaTap(page);
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(1);
});

test('a shark: a fin cuts the surface (NH), and the catch names it', async ({ page }) => {
  const before = await open(page, '&critter=great-white-shark');
  const fish = page.locator('[data-critter="fish"].is-fin');
  await expect(fish).toBeAttached();
  await page.waitForTimeout(500);
  const f = await at(page, '[data-critter="fish"]');
  await page.mouse.click(f.x + (f.x < 195 ? 40 : -40), f.y);
  await expect(page.locator('[data-bite]')).toBeAttached({ timeout: 10_000 });
  await page.waitForTimeout(400);
  await seaTap(page);
  await expect(page.locator('[data-fx="catch"]')).toHaveText('サメを つりあげた！');
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

test('a cicada perches on a trunk, clear of the tree, and a tap on it nets it', async ({ page }) => {
  await open(page, '&critter=robust-cicada');
  const c = page.locator('[data-critter="robust-cicada"].sat');
  await expect(c).toBeAttached({ timeout: 5000 });
  const p = await at(page, '[data-critter="robust-cicada"]');
  const target = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', p);
  expect(target).toBe(''); // not on the canopy or the fruit row
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toHaveText('ミンミンゼミを つかまえた！');
});

test('a hermit crab crawls on the beach at night, clear of every control, and a tap on it nets it', async ({ page }) => {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto('?demo&date=2026-07-04T21:00&critter=hermit-crab');
  const crab = page.locator('[data-critter="hermit-crab"]');
  await expect(crab).toBeAttached();
  await page.waitForTimeout(1000);
  const p = await at(page, '[data-critter="hermit-crab"]');
  const sand = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', p);
  expect(sand).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toHaveText('ヤドカリを つかまえた！');
});

test('a stag beetle perches on a trunk at night and is netted', async ({ page }) => {
  await page.goto('?demo&date=2026-07-04T22:00&critter=rainbow-stag');
  await expect(page.locator('[data-critter="rainbow-stag"].sat')).toBeAttached({ timeout: 5000 });
  const p = await at(page, '[data-critter="rainbow-stag"]');
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', p)).toBe('');
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toHaveText('ニジイロクワガタを つかまえた！');
});

test('a balloon floats by on its own in the daytime (the first in 30–60 s), in the lane under the ribbon', async ({ page }) => {
  await page.clock.install();
  await open(page, '');
  await expect(page.locator('.fly')).toHaveCount(0);
  await page.clock.runFor(61_000);
  const fly = page.locator('.fly');
  await expect(fly).toBeAttached();
  const box = await page.evaluate(() => {
    const f = document.querySelector('.fly')!, rib = document.querySelector('.ribbon-wrap')!.getBoundingClientRect();
    const b = document.querySelector('.fly .balloon')!.getBoundingClientRect(), band = f.parentElement!.getBoundingClientRect();
    return { top: f.getBoundingClientRect().top, ribbon: rib.bottom, bottom: b.bottom, band: band.bottom };
  });
  expect(box.top).toBeGreaterThanOrEqual(box.ribbon + 6);
  expect(box.bottom).toBeLessThanOrEqual(box.band + 8);
});
