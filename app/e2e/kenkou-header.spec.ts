// 健康 | ごはん's title bar (docs/design.md "Kenkou"): whose (the avatar alone) at the left, the page switch in the title's
// place, ✕ at the right, no tab bar; one whose for both tabs, synced both ways; the guest's phone: 健康 shows a member
// and says so; both tabs' range rows at one height; nothing past the edge at 393 or 320.
import { expect, test, type Page } from './fixtures.ts';
import { openKenkou } from './hud.ts';

const DATE = '2026-11-04T12:30';
const dlg = (page: Page) => page.locator('dialog[open]');
const bar = (page: Page) => dlg(page).locator('.titlebar .navbar');
const whoSel = (page: Page) => bar(page).locator('select[data-pick=who]');
const tab = (page: Page, id: string) => dlg(page).locator(`[data-kenkou-tab=${id}]`);
const box = async (page: Page, sel: string) => (await dlg(page).locator(sel).first().boundingBox())!;

async function open(page: Page, as = '') {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none${as}`);
  await expect(page.getByRole('button', { name: 'けんこう', exact: true })).toBeVisible({ timeout: 15_000 });
  await openKenkou(page, 'health');
}
/** What sticks out past the screen's right edge in the shown tab and the bar. */
const overflow = (page: Page) => dlg(page).evaluate((d) => [...d.querySelectorAll('.titlebar *, .body:not([hidden]) *')]
  .filter((e) => (e as HTMLElement).offsetParent && e.getBoundingClientRect().right > innerWidth + 0.5 && !e.closest('.sr-only'))
  .map((e) => `${e.tagName.toLowerCase()}.${(e as HTMLElement).className}`));

test('the switch in the title bar: whose at the left, 健康 | ごはん centred and taller than the pills under it, ✕ at the right; no tab bar; the range rows at one height', async ({ page }) => {
  await open(page);
  await expect(dlg(page).locator('.tabbar')).toHaveCount(0);
  await expect(bar(page).locator('nav')).toHaveAccessibleName('健康とごはんのページ');
  await expect(tab(page, 'health')).toHaveAttribute('aria-current', 'page');
  await expect(bar(page).locator('[data-kenkou-tab] img')).toHaveCount(2); // each page its NH art, its name always shown
  await expect(dlg(page).locator('[data-kenkou-tab]')).toHaveText(['健康', 'ごはん']);
  const [w, sw, x, d, pill] = [await box(page, '.navbar .dd.who'), await box(page, '.navbar nav'), await box(page, '.navbar button.close'),
    (await dlg(page).boundingBox())!, await box(page, '[data-group=activity]')];
  expect(w.x + w.width).toBeLessThanOrEqual(sw.x);
  expect(sw.x + sw.width).toBeLessThanOrEqual(x.x);
  expect(Math.abs(sw.x + sw.width / 2 - (d.x + d.width / 2))).toBeLessThan(3); // centred
  expect(Math.abs(w.y + w.height / 2 - (sw.y + sw.height / 2))).toBeLessThan(3); // one row
  expect(sw.height).toBeGreaterThan(pill.height); // the page, not another filter
  const hit = (await tab(page, 'food').evaluate((b) => { const r = b.getBoundingClientRect(); const a = getComputedStyle(b, '::after'); return r.height - parseFloat(a.top) - parseFloat(a.bottom); }));
  expect(hit).toBeGreaterThanOrEqual(44);
  expect(await overflow(page)).toEqual([]);
  const healthRange = (await box(page, '[data-health-sheet] .nav')).y;

  await tab(page, 'food').click();
  await expect(tab(page, 'food')).toHaveAttribute('aria-current', 'page');
  await expect(dlg(page).locator('[data-food-date]')).toBeVisible();
  const foodRange = (await box(page, '[data-food-sheet] .nav')).y;
  expect(Math.abs(foodRange - healthRange)).toBeLessThan(1); // the same height on both tabs
  expect(await overflow(page)).toEqual([]);
  // a narrow phone (320): the switch's names alone, still nothing past the edge
  await page.setViewportSize({ width: 320, height: 640 });
  await expect(tab(page, 'food').locator('.gi')).toBeHidden();
  await expect(dlg(page).locator('[data-kenkou-tab]')).toHaveText(['健康', 'ごはん']);
  expect(await overflow(page)).toEqual([]);
});

test('whose: the avatar alone, its name in the picker and the accessible name; one pick for both tabs, synced both ways', async ({ page }) => {
  await open(page);
  const pill = bar(page).locator('.dd.who');
  await expect(pill).toHaveClass(/\bonly\b/);
  expect((await pill.boundingBox())!.width).toBeLessThanOrEqual(72);
  await expect(whoSel(page)).toHaveAccessibleName('誰のデータ：ウェイ');
  await expect(whoSel(page).locator('option')).toHaveText(['ウェイ', 'うめ']);
  await whoSel(page).selectOption('B');
  await expect(whoSel(page)).toHaveAccessibleName('誰のデータ：うめ');
  await tab(page, 'food').click(); // うめ's day on ごはん too
  await expect(whoSel(page)).toHaveValue('B');
  await expect(whoSel(page)).toHaveAccessibleName('誰のごはん：うめ');
  await whoSel(page).selectOption('A');
  await tab(page, 'health').click(); // and back
  await expect(whoSel(page)).toHaveValue('A');
  // kept for the session: closed and opened again
  await whoSel(page).selectOption('B');
  await dlg(page).locator('.titlebar .close').click();
  await expect(dlg(page)).toHaveCount(0);
  await openKenkou(page, 'food');
  await expect(whoSel(page)).toHaveValue('B');
});

test('the guest’s phone: ごはん on its own day, 健康 on a member’s, its pill dashed and a line saying so; no からだ; picking there syncs ごはん', async ({ page }) => {
  await open(page, '&as=G');
  await expect(dlg(page).locator('[data-group]')).toHaveCount(0); // かつどう only
  await expect(dlg(page).locator('[data-metric=weight]')).toHaveCount(0);
  await expect(whoSel(page)).toHaveValue('A');
  await expect(bar(page).locator('.dd.who')).toHaveClass(/\baway\b/);
  await expect(dlg(page).locator('[data-health-away]')).toHaveText('おきゃくさんの健康データはありません。ウェイを表示しています');
  await expect(whoSel(page)).toHaveAccessibleName(/^誰のデータ：ウェイ（おきゃくさんの健康データ/);
  expect(await overflow(page)).toEqual([]);
  await tab(page, 'food').click();
  await expect(whoSel(page)).toHaveValue('G');
  await expect(bar(page).locator('.dd.who')).not.toHaveClass(/\baway\b/);
  expect(await overflow(page)).toEqual([]);
  // a member picked on 健康: ごはん shows them too, the line gone
  await tab(page, 'health').click();
  await whoSel(page).selectOption('B');
  await expect(dlg(page).locator('[data-health-away]')).toHaveCount(0);
  await expect(bar(page).locator('.dd.who')).not.toHaveClass(/\baway\b/);
  await tab(page, 'food').click();
  await expect(whoSel(page)).toHaveValue('B');
  // the guest again on ごはん: 健康 keeps the last member, うめ
  await whoSel(page).selectOption('G');
  await tab(page, 'health').click();
  await expect(whoSel(page)).toHaveValue('B');
  await expect(dlg(page).locator('[data-health-away]')).toContainText('うめを表示しています');
});
