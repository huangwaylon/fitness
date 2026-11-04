// Diving (docs/design.md "Scene interactions"): now and then a spot of bubbles rises in the sea off the beach; a tap
// there dives (a splash): a slow sea creature is caught, a quick one darts off as a shadow and a second tap catches it,
// or it gets away. Now and then the bubbles are NH's pearl. A ずかん find (kind 'sea'; the pearl a shell), never ベル.
// `?sea=<id>|pearl` (with ?demo) brings a bubble spot at once and keeps it until dived.
import { expect, test, type Page } from '@playwright/test';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';
import { CHASE_MS, SEA } from '../src/lib/components/island/sea.ts';
import { fromMenu, hudBells, hudMenu } from './hud.ts';

const said = (id: keyof typeof CATCH_LINES) => CATCH_LINES[id][0].replace(/\s+/g, ' ');
test.use({ viewport: { width: 390, height: 844 } });

async function open(page: Page, q: string) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo&date=2026-07-04T12:00${q}`);
  await expect(hudMenu(page)).toBeVisible();
  const bells = await hudBells(page).getAttribute('aria-label');
  await expect(page.locator('[data-bubbles]')).toBeAttached();
  await page.waitForTimeout(300);
  return bells;
}
const at = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
const finds = (page: Page) =>
  page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).filter((e: { type: string }) => e.type === 'find').map((e: { data: unknown }) => e.data));
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);

test('a tap on the bubbles dives: a slow one (seaweed) is caught, NH’s line, a ずかん find, no ベル', async ({ page }) => {
  const bells = await open(page, '&sea=seaweed');
  const b = await at(page, '[data-bubbles]');
  // the bubbles sit in the open sea in front of the beach (nearer than the shoreline, seen from まえ), on no control
  const shore = await page.evaluate(() => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(195, 0)[1]);
  expect(b.y).toBeGreaterThan(shore);
  expect(b.y).toBeLessThan(844);
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.className ?? '', b)).toBe('');
  await page.mouse.click(b.x, b.y);
  // the splash lives for under half a second after the walk: the catch and the splash's cue are what stay
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('seaweed'));
  await expect(page.locator('[data-bubbles]')).toHaveCount(0);
  expect(await finds(page)).toEqual([{ kind: 'sea', id: 'seaweed' }]);
  expect(await cues(page)).toEqual(expect.arrayContaining(['scene-splash', 'scene-catch']));
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/critters-dive-caught.png` });
});

test('a quick one (a lobster) darts off as a shadow; a second tap on it in time catches it', async ({ page }) => {
  expect(SEA.lobster.speed).toBe('fast');
  await open(page, '&sea=lobster');
  const b = await at(page, '[data-bubbles]');
  await page.mouse.click(b.x, b.y);
  await expect(page.locator('[data-dive="chase"]')).toBeAttached({ timeout: 3000 }); // the walk to the water's edge, then the dive
  await page.waitForTimeout(350); // it has darted
  // (the tap first: the chase is a 1 s window, a screenshot on a slow runner could eat it)
  const s = await at(page, '[data-dive="chase"]');
  await page.mouse.click(s.x, s.y);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/critters-dive-chase.png` });
  await expect(page.locator('[data-fx="catch"]')).toContainText(said('lobster'));
  expect(await finds(page)).toEqual([{ kind: 'sea', id: 'lobster' }]);
});

test('left alone, a darting one gets away', async ({ page }) => {
  await open(page, '&sea=lobster');
  const b = await at(page, '[data-bubbles]');
  await page.mouse.click(b.x, b.y);
  await expect(page.locator('[data-dive="chase"]')).toBeAttached({ timeout: 3000 }); // the walk to the water's edge, then the dive
  await page.waitForTimeout(CHASE_MS.fast + 1200);
  await expect(page.locator('[data-dive]')).toHaveCount(0);
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
  expect(await cues(page)).toContain('scene-flee');
  expect(await finds(page)).toEqual([]);
});

test('now and then the bubbles hold a pearl: picked up, a shell in the ずかん (9 with the pearl), 「うみのさち」 its own row', async ({ page }) => {
  await open(page, '&sea=pearl');
  const b = await at(page, '[data-bubbles]');
  await page.mouse.click(b.x, b.y);
  await expect(page.locator('[data-dive="chase"]')).toBeAttached({ timeout: 3000 }); // the walk to the water's edge, then the dive
  await page.waitForTimeout(350);
  const s = await at(page, '[data-dive="chase"]');
  await page.mouse.click(s.x, s.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText('しんじゅを ひろった！');
  expect(await finds(page)).toEqual([{ kind: 'shell', id: 'pearl' }]);
  await fromMenu(page, 'zukan');
  await expect(page.locator('[data-zukan="shell"]')).toContainText('1 / 9');
  await expect(page.locator('[data-zukan="sea"]')).toContainText('0 / 40');
  await expect(page.locator('[data-zukan="sea"]')).toContainText('うみのさち');
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/critters-zukan-rows.png` });
});
