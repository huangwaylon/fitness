// トレイル (components/hiking, docs/hiking.md), the logic tier: under drawOff() the trail's map is a stub that draws the
// track and the scrub's dot as SVG (no MapLibre, no tiles: nothing leaves the preview). Every trail's track is the
// invented fixture (e2e/fixtures/hiking/tiny.gpx, converted here by the app's own converter): the list, its chips, a
// trail's peek and sheet, the elevation scrub moving the map's dot, Kinpu's plan, ‹ and ✕.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from './fixtures.ts';
import { BASE } from './island.ts';
import { fromMenu } from './hud.ts';
import { toTrack } from '../src/lib/hiking/track.ts';

test.use({ viewport: { width: 393, height: 852 } });

const TRACK = toTrack(readFileSync(join(import.meta.dirname, 'fixtures', 'hiking', 'tiny.gpx'), 'utf8'));
const sheet = (p: Page) => p.locator('dialog[open][data-hiking]');
const cards = (p: Page) => sheet(p).locator('[data-trail]');

async function openTrails(page: Page) {
  await page.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await page.route('**/hiking/tracks/*.json', (r) => r.fulfill({ json: TRACK }));
  await page.goto(`${BASE}/?demo&date=2026-11-04T12:00&critter=none&visitor=none`);
  await page.waitForFunction(() => !!(window as unknown as { __world?: unknown }).__world, null, { timeout: 30_000 });
  await fromMenu(page, 'hiking');
  await expect(cards(page)).toHaveCount(10);
}

test('the list: ten trails, the difficulty chips, the sorts; a card opens its trail, ‹ back, ✕ closes', async ({ page }) => {
  await openTrails(page);
  await expect(sheet(page).locator('h1')).toHaveText('梅ちゃんのトレイル');
  await expect(cards(page).first()).toHaveAttribute('data-trail', 'lake-22');
  await expect(cards(page).first().locator('.stats')).toContainText('9.8 km');
  await expect(cards(page).first().locator('.stats')).toContainText('444 m');
  await expect(cards(page).first().locator('.stats')).toContainText('3時間17分');
  await sheet(page).locator('[data-filter="hard"]').click();
  await expect(cards(page)).toHaveCount(4);
  await expect(sheet(page).locator('[data-filter="hard"]')).toHaveAttribute('aria-pressed', 'true');
  await sheet(page).locator('[data-filter="veryhard"]').click();
  await expect(cards(page)).toHaveCount(1);
  await sheet(page).locator('[data-filter="all"]').click();
  await sheet(page).locator('[data-sort="dist"]').click();
  await expect(cards(page).first()).toHaveAttribute('data-trail', 'talapus-lake');
  await expect(cards(page).last()).toHaveAttribute('data-trail', 'enchantments');
  // a second tap: the source's order again
  await sheet(page).locator('[data-sort="dist"]').click();
  await expect(cards(page).first()).toHaveAttribute('data-trail', 'lake-22');

  await cards(page).nth(1).click();
  const view = sheet(page).locator('[data-trail-view="snow-lake"]');
  await expect(view).toBeVisible();
  await expect(sheet(page)).toHaveAttribute('data-level', 'trail');
  await expect(view.locator('.pk-title')).toHaveText('スノーレイク・トレイル');
  await view.locator('.back .nav').click();
  await expect(view).toHaveCount(0);
  await expect(sheet(page).locator('[data-trail-list]')).toBeVisible();
  await sheet(page).locator('.x .nav').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('a trail: the peek shows the whole chart; the scrub moves the map\'s dot and stays; a tap clears it; the sheet up and down', async ({ page }) => {
  await openTrails(page);
  await cards(page).first().click();
  const view = sheet(page).locator('[data-trail-view="lake-22"]');
  const map = view.locator('[data-trail-map]');
  const elev = view.locator('[data-elev]');
  await expect(map).toHaveAttribute('data-mode', 'stub');
  await expect(view.locator('[data-map-stub] polyline')).toHaveCount(1);
  await expect(elev).toBeVisible();
  await expect(elev.locator('[data-elev-range]')).toHaveText(/^\d+～\d+ m$/);
  // the peek reaches just under the chart: the chart all on screen, the sheet's top above it
  // (once the sheet has eased up to it)
  await expect.poll(async () => ((b) => b.y + b.height)((await elev.boundingBox())!)).toBeLessThanOrEqual(852);
  await expect(view).toHaveAttribute('data-sheet', 'peek');

  // press at the middle: the readout and the map's dot; drag to three quarters; let go: it stays
  const svg = (await elev.locator('svg').boundingBox())!;
  const y = svg.y + svg.height / 2;
  await page.mouse.move(svg.x + svg.width * 0.5, y);
  await page.mouse.down();
  await expect(elev.locator('[data-scrub-tip]')).toBeVisible();
  await expect(elev.locator('[data-scrub-tip]')).toHaveText(/^\d+ m\d+\.\d km$/);
  const half = Number(await elev.getAttribute('data-held'));
  expect(Math.abs(half - TRACK.len / 2)).toBeLessThan(TRACK.len * 0.02);
  const at1 = await map.getAttribute('data-scrub');
  expect(at1).not.toBe('');
  await expect(view.locator('[data-scrub-dot]')).toHaveCount(1);
  await page.mouse.move(svg.x + svg.width * 0.75, y, { steps: 4 });
  await expect.poll(async () => Number(await elev.getAttribute('data-held'))).toBeGreaterThan(TRACK.len * 0.7);
  await page.mouse.up();
  await expect(elev.locator('[data-scrub-tip]')).toBeVisible();
  expect(await map.getAttribute('data-scrub')).not.toBe(at1);
  // a tap on the held readout clears it, and the map's dot with it
  await page.mouse.click(svg.x + svg.width * 0.2, y);
  await expect(elev.locator('[data-scrub-tip]')).toHaveCount(0);
  await expect(map).toHaveAttribute('data-scrub', '');
  await expect(view.locator('[data-scrub-dot]')).toHaveCount(0);

  // the grip: up to 90 %, the sections in reach; Esc folds it; Esc again closes the sheet
  await view.locator('[data-sheet-grip]').click();
  await expect(view).toHaveAttribute('data-sheet', 'full');
  await expect(view.locator('.facts dd').first()).toHaveText('往復');
  await expect(view.locator('.attrib')).toHaveText('コース情報・写真：AllTrails ／ 地図 © USGS National Map');
  await page.keyboard.press('Escape');
  await expect(view).toHaveAttribute('data-sheet', 'peek');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test("Kinpu's plan: the date, the timeline (a stay's badge, a leg's minutes), its private values locked; openTrail lands on the trail, ‹ the list", async ({ page }) => {
  await openTrails(page);
  await sheet(page).locator('.x .nav').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.evaluate(() => (window as unknown as { __hiking: { openTrail(s: string): void } }).__hiking.openTrail('kinpu-odarumi'));
  const view = sheet(page).locator('[data-trail-view="kinpu-odarumi"]');
  await expect(view).toBeVisible();
  const plan = view.locator('[data-plan]');
  await expect(plan.locator('.date')).toHaveText('2026年6月27日（土）');
  await expect(plan.locator('[data-stop]')).toHaveCount(11);
  await expect(plan.locator('[data-stop]').nth(5)).toContainText('金峰山（甲州御岳山）');
  await expect(plan.locator('.stay')).toHaveText('滞在 2時間');
  await expect(plan.locator('.leg').first()).toHaveText('39分');
  // (the demo has no `hiking` note: the link hidden, the party and the planner locked)
  await expect(plan.locator('[data-plan-link]')).toHaveCount(0);
  await expect(plan.locator('.lock')).toHaveCount(2);
  await expect(view.locator('.attrib')).toContainText('国土地理院');
  await view.locator('.back .nav').click();
  await expect(sheet(page).locator('[data-trail-list]')).toBeVisible();
});
