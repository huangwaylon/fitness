// NH's dialogue box (docs/design.md "Dialogue"): the speech balloon and the catch plate type their text in, two lines a
// page; a tap finishes the page, the next turns it (a ▼ bobs only while a page follows), the last tap closes it.
import { expect, test, type Page } from '@playwright/test';
import { reelOnBite } from './island.ts';
import { hudBells, hudMenu } from './hud.ts';

test.use({ viewport: { width: 390, height: 844 } });
/** A tap on a scene figure (its layer lets taps through to the scene's own listener). */
async function tapOn(page: Page, sel: string) {
  const r = (await page.locator(sel).boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}

test('a visitor’s introduction: typed, two pages, the ▼ only before the last; tap finishes, turns, then closes', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=gulliver&critter=none'); // no ambient critters to net instead
  await expect(hudMenu(page)).toBeVisible();
  const bells = await hudBells(page).getAttribute('aria-label');
  // he sleeps face down until the fifth nudge (NH); then his introduction
  await tapOn(page, '[data-visitor="gulliver"] .art');
  await page.waitForTimeout(400); // the first nudge
  for (let i = 1; i < 5; i++) {
    await tapOn(page, '[data-visitor="gulliver"] .art');
    await page.waitForTimeout(250);
  }
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box).toBeVisible();
  await expect(box).toHaveAttribute('data-pages', '2');
  await expect(box).toHaveAttribute('data-page', '0');
  await expect(box.locator('.who')).toHaveText('ジョニー');
  await expect(box.locator('[data-next]')).toHaveCount(0); // still typing
  await box.click(); // finish the page at once
  await expect(box.locator('.pg.now .rest')).toHaveText('');
  await expect(box.locator('[data-next]')).toHaveCount(1);
  await expect(box).toHaveAttribute('data-page', '0');
  await box.click(); // the next page
  await expect(box).toHaveAttribute('data-page', '1');
  await box.click(); // finish it: the last page, no ▼
  await expect(box.locator('.pg.now .rest')).toHaveText('');
  await expect(box.locator('[data-next]')).toHaveCount(0);
  await box.click(); // close
  await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
  await page.waitForTimeout(300); // a person's pause between taps
  // the next tap on him: one of his lines, one page
  await expect.poll(async () => {
    // his head (the balloon may sit over the rest of him)
    const g = (await page.locator('[data-visitor="gulliver"] .art').boundingBox())!;
    if (!(await page.locator('[data-fx="talk"]').count())) await page.mouse.click(g.x + g.width / 2, g.y + g.height * 0.12);
    return page.locator('[data-fx="talk"].placed').getAttribute('data-pages').catch(() => null);
  }, { timeout: 8000 }).toBe('1');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
});

test('the catch plate pages NH’s catch line (two lines a page) and, on a first find, says it’s in the ずかん', async ({ page }) => {
  await page.goto('?demo&date=2026-07-04T12:00&critter=olive-flounder');
  await expect(hudMenu(page)).toBeVisible();
  const fish = page.locator('[data-critter="fish"]');
  await expect(fish).toBeAttached();
  await page.waitForTimeout(600);
  const f = await fish.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  await page.mouse.click(f.x + (f.x < 195 ? 40 : -40), f.y);
  const bobber = page.locator('[data-bobber]');
  // the reel the moment it bites (the 1.6 s window: e2e/island.ts reelOnBite)
  await expect(page.locator('[data-bobber="wait"]')).toBeAttached({ timeout: 4000 }); // landed
  const b = await bobber.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  await reelOnBite(page, b.x < 195 ? 366 : 24, b.y);
  const plate = page.locator('[data-fx="catch"].placed .catch-plate');
  await expect(plate).toBeVisible();
  // カレイを 釣り上げたー / って、んん？ / これって よく見たら / ヒラメ・・・？ ヒラメなの？  + ずかんに のったよ！
  await expect(plate).toHaveAttribute('data-pages', '3');
  await plate.click(); // finish
  await expect(plate.locator('[data-next]')).toHaveCount(1);
  await plate.click(); // page 2
  await expect(plate).toHaveAttribute('data-page', '1');
  await plate.click();
  await plate.click(); // page 3: the ずかん
  await expect(plate).toHaveAttribute('data-page', '2');
  await expect(plate.locator('.pg.now')).toContainText('ずかんに のったよ！');
  await plate.click();
  await expect(plate.locator('[data-next]')).toHaveCount(0);
  await plate.click(); // close
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
});
