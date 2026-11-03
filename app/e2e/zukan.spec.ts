// The ずかん (docs/design.md "Zukan"): the HUD menu's ずかん sheet, every fish, bug, fossil and shell; the found ones with their icon, name
// and first find (shared between us), silhouettes and ？？？ for the rest.
import { expect, test, type Page } from '@playwright/test';
import { CATCH_LINES } from '../src/lib/components/island/catchLines.ts';
import { BUGS, FISH } from '../src/lib/components/island/critters.ts';
import { POND_FISH } from '../src/lib/components/island/pondFish.ts';
import { FOSSIL_SETS, digSpots } from '../src/lib/components/island/beach.ts';
import { addDays } from '../src/lib/time/dates.ts';
import { readFileSync } from 'node:fs';
import { fossilOnScreen } from './island.ts';
import { fromMenu } from './hud.ts';
/** The catalogue's rows (island/catalog.json; its module needs Vite's JSON import). */
const { items: ITEMS, recipes: RECIPES } = JSON.parse(readFileSync(new URL('../src/lib/components/island/catalog.json', import.meta.url), 'utf8')) as { items: string[]; recipes: string[] };

test.use({ viewport: { width: 390, height: 844 } });
const hudJar = (page: Page) => page.getByRole('button', { name: /^ごほうび · ふたりのベル / });

test('a netted butterfly appears in the ずかん with who found it and when; the rest are silhouettes', async ({ page }) => {
  await page.goto('?demo&date=2026-07-04T12:00&critter=common-butterfly');
  await expect(hudJar(page)).toBeVisible();
  await page.waitForTimeout(2200);
  const b = (await page.locator('[data-critter="common-butterfly"]').boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator('[data-fx="catch"]')).toBeAttached();
  await fromMenu(page, 'zukan');
  const row = page.locator('[data-zukan="bug"]');
  await expect(row).toContainText(`1 / ${Object.keys(BUGS).length}`);
  await expect(page.locator('[data-zukan="fish"]')).toContainText(`0 / ${Object.keys(FISH).length + Object.keys(POND_FISH).length}`);
  await expect(page.locator('[data-zukan="fossil"]')).toContainText('0 / 73');
  await expect(page.locator('[data-zukan="sea"]')).toContainText('0 / 40');
  await expect(page.locator('[data-zukan="shell"]')).toContainText('0 / 9');
  await row.click();
  await expect(page.locator('.tile.unknown')).toHaveCount(Object.keys(BUGS).length - 1);
  await page.locator('button.tile[data-entry="common-butterfly"]').click();
  const detail = page.locator('[data-zukan-detail="common-butterfly"]');
  await expect(detail).toContainText('モンシロチョウ');
  await expect(detail).toContainText('7/4 ウェイが 見つけた');
  await expect(detail.locator('.line')).toHaveText(CATCH_LINES['common-butterfly'][0].replace(/\s+/g, ' '));
  // the silhouettes' icons load lazily
  expect(await page.locator('.tile.unknown img').first().getAttribute('loading')).toBe('lazy');
});

test('the fossils: a dug-up piece shows under its dinosaur with the set’s count (「Tレックス 1 / 3」)', async ({ page }) => {
  // a day whose dig spots are all pieces of a dinosaur (seeded by the date: both phones see the same)
  const piece = (id: string) => Object.entries(FOSSIL_SETS).find(([, ids]) => (ids as readonly string[]).includes(id));
  let date = '2026-07-01';
  while (!digSpots(date, new Set()).every((s) => piece(s.fossil))) date = addDays(date, 1);
  await page.goto(`?demo&date=${date}T12:00`);
  await expect(hudJar(page)).toBeVisible();
  // the one on screen (on the layout they lie all over the island: the camera to it)
  const p = await fossilOnScreen(page);
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('[data-fx="catch"]')).toContainText('化石を ほりだした！');
  const id = await page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{}').events ?? []).find((e: { type: string }) => e.type === 'find')?.data.id as string);
  const [set, ids] = piece(id)!;
  await fromMenu(page, 'zukan');
  await expect(page.locator('[data-zukan="fossil"]')).toContainText('1 / 73');
  await page.locator('[data-zukan="fossil"]').click();
  await expect(page.locator('h4.set')).toHaveCount(Object.keys(FOSSIL_SETS).length);
  await expect(page.locator(`h4.set[data-set="${set}"]`)).toContainText(`1 / ${ids.length}`);
  await expect(page.locator('h4.set[data-set="diplo"]')).toContainText(set === 'diplo' ? '1 / 6' : '0 / 6');
  await page.locator(`h4.set[data-set="${set}"]`).scrollIntoViewIfNeeded();
  await page.screenshot({ path: '/tmp/more-catch/zukan-fossils-390.png' });
  await page.locator(`button.tile[data-entry="${id}"]`).click();
  await expect(page.locator(`[data-zukan-detail="${id}"]`)).toContainText('の ');
});

// The page's head is pinned (as the むらびと picker's): the picked entry's details stay in view while the grid scrolls
// in its own scroller under them, and picking another updates them without moving the grid.
for (const vp of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test(`the picked fish stays pinned over the scrolling grid, another pick keeps the grid's scroll (${vp.width}x${vp.height})`, async ({ page }) => {
    await page.setViewportSize(vp);
    // three fish A found today (the demo's own events, as a catch writes them)
    await page.addInitScript(() => {
      if (localStorage.getItem('island-demo.events')) return;
      const at = Date.parse('2026-07-04T11:00:00+09:00');
      const events = ['bitterling', 'sea-bass', 'coelacanth'].map((id, i) => ({
        id: `seed-${i}`, type: 'find', data: { kind: 'fish', id }, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i
      }));
      localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-07-04', events }));
    });
    await page.goto('?demo&date=2026-07-04T12:00');
    await expect(hudJar(page)).toBeVisible();
    await fromMenu(page, 'zukan');
    await page.locator('[data-zukan="fish"]').click();
    const head = page.locator('[data-zukan-head]');
    const grid = page.locator('[data-zukan-grid]');
    // nothing picked: the head shows the page's count
    await expect(head).toContainText(`3 / ${Object.keys(FISH).length + Object.keys(POND_FISH).length}`);
    // the grid keeps most of the screen
    expect((await grid.boundingBox())!.height).toBeGreaterThan(vp.height * 0.5);

    const first = page.locator('button.tile[data-entry="bitterling"]');
    const firstName = (await first.getAttribute('aria-label'))!;
    await first.click();
    await expect(head.locator('[data-zukan-detail="bitterling"]')).toContainText(firstName);
    await expect(head.locator('.line')).toBeVisible();
    const headBox = (await head.boundingBox())!;

    // scrolled to the bottom: the head hasn't moved and still names the bitterling; the panel body itself never scrolled
    await grid.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect.poll(() => grid.evaluate((el) => el.scrollTop)).toBeGreaterThan(300);
    expect(await page.locator('dialog[open] [data-zukan-sheet]').evaluate((el) => el.scrollTop)).toBe(0);
    await expect(head).toBeInViewport({ ratio: 1 });
    await expect(head).toContainText(firstName);
    expect(Math.abs((await head.boundingBox())!.y - headBox.y)).toBeLessThan(1);
    // the head sits above the grid, never over it; the last row clears the bottom of the screen
    expect(headBox.y + headBox.height).toBeLessThanOrEqual((await grid.boundingBox())!.y + 1);
    const last = (await page.locator('[data-entry="coelacanth"]').boundingBox())!;
    expect(last.y + last.height).toBeLessThanOrEqual(vp.height);

    // another pick from down there: the head updates, the grid stays where it was
    const top = await grid.evaluate((el) => el.scrollTop);
    const other = page.locator('button.tile[data-entry="coelacanth"]');
    const otherName = (await other.getAttribute('aria-label'))!;
    await other.click();
    await expect(head.locator('[data-zukan-detail="coelacanth"]')).toContainText(otherName);
    await expect(head).not.toContainText(firstName);
    await expect(head.locator('.line')).toBeVisible(); // its catch line
    await page.waitForTimeout(300);
    expect(Math.abs((await grid.evaluate((el) => el.scrollTop)) - top)).toBeLessThan(2);
    await page.screenshot({ path: `/tmp/zukan-pin/fish-${vp.width}.png` });
  });
}


// カタログ and レシピ (a balloon's presents): the same page, by NH's categories and the recipes' seasons, built a slice per
// frame; every found tile shows how many we've had (the day tallies), the head too, for each of us.
test('the catalogue and the recipes: found entries with their counts, in all and per person (390x844)', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse('2026-07-04T11:00:00+09:00');
    const ev = (i: number, type: string, data: object, person: 'A' | 'B') => ({ id: `seed-${i}`, type, data, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person });
    const events = [
      ev(0, 'find', { kind: 'item', id: 'froggy-chair' }, 'A'),
      ev(1, 'tally', { date: '2026-07-03', counts: { 'item:froggy-chair': 2 } }, 'A'),
      ev(2, 'tally', { date: '2026-07-04', counts: { 'item:froggy-chair': 1 } }, 'A'),
      ev(3, 'find', { kind: 'recipe', id: 'mush-lamp' }, 'B'),
      ev(4, 'tally', { date: '2026-07-04', counts: { 'item:froggy-chair': 1 } }, 'B'),
      // a later tally of the same day replaces the earlier one
      ev(5, 'tally', { date: '2026-07-04', counts: { 'item:froggy-chair': 2, 'recipe:mush-lamp': 1 } }, 'B')
    ];
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-07-04', events }));
  });
  await page.goto('?demo&date=2026-07-04T12:00');
  await expect(hudJar(page)).toBeVisible();
  await fromMenu(page, 'zukan');
  await expect(page.locator('[data-zukan="item"]')).toContainText(`1 / ${ITEMS.length}`);
  await expect(page.locator('[data-zukan="recipe"]')).toContainText(`1 / ${RECIPES.length}`);

  await page.locator('[data-zukan="item"]').click();
  const head = page.locator('[data-zukan-head]');
  await expect(head).toContainText('カタログ');
  await expect(head).toContainText(`1 / ${ITEMS.length}`);
  // by NH's categories, every tile built in the end (a slice per frame)
  await expect(page.locator('h4.set')).toHaveCount(12);
  await expect(page.locator('[data-zukan-grid] [data-entry]')).toHaveCount(ITEMS.length, { timeout: 10_000 });
  const chair = page.locator('button.tile[data-entry="froggy-chair"]');
  await expect(chair).toHaveAttribute('aria-label', 'カエルのチェア');
  await expect(chair.locator('[data-times]')).toHaveText('×5');
  await expect(page.locator('.tile.unknown')).toHaveCount(ITEMS.length - 1);
  await chair.click();
  const detail = head.locator('[data-zukan-detail="froggy-chair"]');
  await expect(detail).toContainText('カエルのチェア');
  await expect(detail.locator('[data-zukan-times]')).toHaveText('×5');
  await expect(detail.locator('[data-zukan-person="A"]')).toContainText('×3');
  await expect(detail.locator('[data-zukan-person="B"]')).toContainText('×2');
  await expect(detail).toContainText('7/4');
  await page.screenshot({ path: '/tmp/zukan-catalog/catalog-390.png' });

  await page.locator('dialog[open] button.nav.back').click();
  await page.locator('[data-zukan="recipe"]').click();
  await expect(page.locator('h4.set')).toHaveCount(11);
  const lamp = page.locator('button.tile[data-entry="mush-lamp"]');
  await expect(lamp.locator('[data-times]')).toHaveText('×1');
  await lamp.click();
  await expect(head.locator('[data-zukan-detail="mush-lamp"]')).toContainText('キノコのランプ');
  await page.screenshot({ path: '/tmp/zukan-catalog/recipes-390.png' });
});
