// NH's holiday hosts in the visitor slot (docs/design.md "Holiday hosts"), each on its Nookipedia date rule
// (events.ts): Franklin on Turkey Day (he asks for a fish; the next catch makes him happy), Jingle on Toy Day,
// Zipper on Bunny Day's first and last days; Bunny Day's eggs in a dig spot. No ベル.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, castIn, controlsUnder, fossilOnScreen, islandUp, reelOnBite, stageCam, tapFigure, tapOn } from './island.ts';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';
import { hudBells } from './hud.ts';

test.use({ viewport: { width: 390, height: 844 } });

/** Tap the balloon until it has said everything (each tap finishes a page, the next turns it). */
async function readAll(page: Page) {
  for (let i = 0; i < 12 && (await page.locator('[data-fx="talk"]').count()); i++) {
    await tapOn(page, page.locator('[data-fx="talk"]'));
    await page.waitForTimeout(150);
  }
}

// (each host on its day: events.test's 'holiday hosts in the visitor slot'; Franklin and Jingle at centre stage clear of
// every control, introducing themselves, on their own days below)
test('Turkey Day: Franklin at centre stage clear of every control asks for a fish; the next catch makes him happy, and he stays happy after a reload', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('?demo&date=2026-11-26T10:00&critter=sea-bass');
  await islandUp(page);
  const bells = await hudBells(page).getAttribute('aria-label');
  // he stands at centre stage, nothing of the HUD over him; the sea is at まえ
  await camTo(page, await stageCam(page), false);
  await expect(page.locator('[data-visitor="franklin"] .art')).toBeVisible();
  expect(await controlsUnder(page, '[data-visitor="franklin"] .art')).toEqual([]);
  await tapFigure(page, '[data-visitor="franklin"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('フランクリン', { timeout: 4000 });
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('サンクスギビング', { timeout: 4000 });
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('さかなが 1ぴき');
  await readAll(page);
  await camTo(page, 114, false);
  // fish one: from the beach by the shadow (NH casts from where it stands), cast beside it, reel in on the bite
  await expect(page.locator('[data-critter="fish"]')).toBeAttached();
  const [fx, fy] = await castIn(page, 'sea');
  // the reel the moment it bites (e2e/island.ts reelOnBite)
  await expect(page.locator('[data-bobber="wait"]')).toBeAttached({ timeout: 4000 }); // landed
  // (where it cast: a fixed point by the screen's side may be a door or off the island once the camera zoomed in to
  // the shadow)
  await reelOnBite(page, fx, fy);
  await expect(page.locator('[data-fx="catch"]')).toContainText(CATCH_LINES['sea-bass'][0].split('\n')[0]);
  // (his thanks come 2.8 s after the catch, in a balloon by him: the camera back on him at the whole island's zoom,
  // as a shadow by the sea's edge had it zoomed in on the sea, and a balloon whose speaker is out of view closes)
  await page.evaluate((z) => (window as unknown as { __world3d: { go(z: number, k?: number): void } }).__world3d.go(z, 1), await stageCam(page));
  await expect(page.locator('[data-treat]')).toBeAttached({ timeout: 6000 });
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('ありがとう', { timeout: 6000 });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('scene-franklin') ?? '{}'))).toMatchObject({ date: '2026-11-26', asked: true, fed: true });
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
  await page.goto('?demo&date=2026-11-26T11:00');
  await camTo(page, await stageCam(page), false);
  await expect(page.locator('[data-visitor="franklin"] .art')).toBeVisible();
  await tapFigure(page, '[data-visitor="franklin"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('フランクリン', { timeout: 4000 });
  await expect(page.locator('[data-fx="talk"] .sr')).not.toContainText('さかなが 1ぴき');
});

test('Toy Day: two presents beside the goal trees (まえ); Jingle at centre stage clear of every control, introducing himself', async ({ page }) => {
  await page.goto('?demo&date=2026-12-24T12:00');
  await islandUp(page);
  await camTo(page, 114);
  await expect(page.locator('[data-toy]')).toHaveCount(2);
  await expect(page.locator('[data-toy] .art').first()).toBeVisible();
  expect(await controlsUnder(page, '[data-toy] .art')).toEqual([]);
  const sel = '[data-visitor="jingle"] .art';
  await camTo(page, await stageCam(page), false);
  await expect(page.locator(sel)).toBeVisible();
  expect(await controlsUnder(page, sel)).toEqual([]);
  await tapFigure(page, sel);
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('ジングル', { timeout: 4000 });
});

test('Bunny Day week: no Zipper mid-week, and a dig spot can hold an earth egg (no ずかん find)', async ({ page }) => {
  await page.goto('?demo&date=2027-03-24T12:00&find=earth-egg');
  await islandUp(page);
  await expect(page.locator('[data-visitor="zipper"]')).toHaveCount(0);
  const p = await fossilOnScreen(page);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText('じめんのたまごを ほりだした！', { timeout: 5000 });
  const finds = await page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'find'));
  expect(finds).toEqual([]);
});
