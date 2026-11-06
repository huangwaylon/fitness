// NH's holiday hosts in the visitor slot (docs/design.md "Holiday hosts"), each on its Nookipedia date rule
// (events.ts): Franklin on Turkey Day (he asks for a fish; the next catch makes him happy), Jingle on Toy Day,
// Zipper on Bunny Day's first and last days; Bunny Day's eggs in a dig spot. No ベル.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, castIn, controlsUnder, fossilOnScreen, islandUp, reelOnBite, stageCam, tapFigure, tapOn } from './island.ts';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';
import { hudBells } from './hud.ts';

test.use({ viewport: { width: 390, height: 844 } });

const at = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
/** Tap the balloon until it has said everything (each tap finishes a page, the next turns it). */
async function readAll(page: Page) {
  for (let i = 0; i < 12 && (await page.locator('[data-fx="talk"]').count()); i++) {
    await tapOn(page, page.locator('[data-fx="talk"]'));
    await page.waitForTimeout(150);
  }
}

test('each host on its day, at centre stage clear of every control, introducing themselves', async ({ page }) => {
  for (const [date, id, name] of [
    ['2026-11-26T10:00', 'franklin', 'フランクリン'], ['2026-12-24T12:00', 'jingle', 'ジングル'],
    ['2027-03-21T09:00', 'zipper', 'ぴょんたろう']
  ] as const) {
    await page.goto(`?demo&date=${date}&critter=none`);
    await islandUp(page);
    const sel = `[data-visitor="${id}"] .art`;
    await camTo(page, await stageCam(page), false);
    await expect(page.locator(sel)).toBeVisible();
    expect(await controlsUnder(page, sel), id).toEqual([]);
    await tapFigure(page, sel);
    await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText(name, { timeout: 4000 });
  }
});

test('Turkey Day: Franklin asks for a fish; the next catch makes him happy, and he stays happy after a reload', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('?demo&date=2026-11-26T10:00&critter=sea-bass');
  await islandUp(page);
  const bells = await hudBells(page).getAttribute('aria-label');
  // he stands at centre stage; the sea is at まえ
  await camTo(page, await stageCam(page), false);
  await tapFigure(page, '[data-visitor="franklin"] .art');
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('サンクスギビング', { timeout: 4000 });
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('さかなが 1ぴき');
  await readAll(page);
  await camTo(page, 114, false);
  // fish one: from the beach by the shadow (NH casts from where it stands), cast beside it, reel in on the bite
  await expect(page.locator('[data-critter="fish"]')).toBeAttached();
  const [fx, fy] = await castIn(page, 'sea');
  // the reel the moment it bites (e2e/island.ts reelOnBite)
  await expect(page.locator('[data-bobber="wait"]')).toBeAttached({ timeout: 4000 }); // landed
  const b = await at(page, '[data-bobber]');
  await reelOnBite(page, b.x < 195 ? 366 : 24, b.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText(CATCH_LINES['sea-bass'][0].split('\n')[0]);
  await expect(page.locator('[data-treat]')).toBeAttached({ timeout: 6000 });
  await expect(page.locator('[data-fx="talk"] .sr')).toContainText('ありがとう', { timeout: 6000 });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('scene-franklin') ?? '{}'))).toMatchObject({ date: '2026-11-26', asked: true, fed: true });
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
  await page.goto('?demo&date=2026-11-26T11:00&critter=none');
  await camTo(page, await stageCam(page), false);
  await expect(page.locator('[data-visitor="franklin"] .art')).toBeVisible();
  await tapFigure(page, '[data-visitor="franklin"] .art');
  await expect(page.locator('[data-fx="talk"].placed .who')).toHaveText('フランクリン', { timeout: 4000 });
  await expect(page.locator('[data-fx="talk"] .sr')).not.toContainText('さかなが 1ぴき');
});

test('Toy Day: two presents beside the goal trees (まえ)', async ({ page }) => {
  await page.goto('?demo&date=2026-12-24T12:00&critter=none');
  await islandUp(page);
  await camTo(page, 114);
  await expect(page.locator('[data-toy]')).toHaveCount(2);
  await expect(page.locator('[data-toy] .art').first()).toBeVisible();
  expect(await controlsUnder(page, '[data-toy] .art')).toEqual([]);
});

test('Bunny Day week: no Zipper mid-week, and a dig spot can hold an earth egg (no ずかん find)', async ({ page }) => {
  await page.goto('?demo&date=2027-03-24T12:00&find=earth-egg&critter=none');
  await islandUp(page);
  await expect(page.locator('[data-visitor="zipper"]')).toHaveCount(0);
  const p = await fossilOnScreen(page);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText('じめんのたまごを ほりだした！', { timeout: 5000 });
  const finds = await page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'find'));
  expect(finds).toEqual([]);
});
