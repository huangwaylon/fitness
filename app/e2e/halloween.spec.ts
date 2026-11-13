// Halloween (docs/design.md "Halloween"; world/events.ts): on Oct 31 a few orange pumpkins on the health lawn (まえ)
// and round the campsite's clearing (おく), lit as jack-o'-lanterns from 17:00 under a purple and orange wash; Jack visits at
// centre stage 17:00–24:00 and asks for candy: a treat delights him, nothing earns his trick (a goofy face on my
// villager). Never under a control; no ベル.
import { expect, test, type Page } from './fixtures.ts';
import { camTo, geo, islandUp, stageCam, tapFigure } from './island.ts';
import { hudBells } from './hud.ts';

/** The controls under a figure's corners and middle (`hud`: only the HUD's, outside the stage); only what's on screen
 *  (a world node out of view is hidden). */
const under = (page: Page, sel: string, hud = false) =>
  page.evaluate(([s, hud]) => {
    return [...document.querySelectorAll(s)].filter((el) => getComputedStyle(el).visibility !== 'hidden').flatMap((el) => {
      const b = el.getBoundingClientRect();
      const pts = [[b.left + 2, b.top + 2], [b.right - 2, b.top + 2], [b.left + 2, b.bottom - 2], [b.right - 2, b.bottom - 2], [(b.left + b.right) / 2, (b.top + b.bottom) / 2]];
      return pts.flatMap(([x, y]) => document.elementsFromPoint(x, y).filter((e) => e.closest('button') && !e.closest('[data-fx]') && !e.closest('[data-building]') && !(hud && e.closest('.stage'))).map((e) => e.className));
    });
  }, [sel, hud] as const);
/** The camera to a world z (まえ, おく: the campsite's clearing), held there and the island at rest (camTo: the pumpkins
 *  placed where the camera settled, not a fixed wait for it). */
const camera = (page: Page, z: number) => camTo(page, z);
/** Press a balloon's answer where it is on screen (a locator click would first scroll it "into view", moving the
 *  camera: the stage is sticky in its scroller). */
async function press(page: Page, name: string) {
  const b = page.getByRole('button', { name });
  await expect(b).toBeVisible();
  await page.waitForTimeout(300);
  const r = (await b.boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}
/** Tap the balloon until its last page has typed (its answers show). */
async function toAnswers(page: Page) {
  const box = page.locator('[data-fx="talk"].placed');
  for (let i = 0; i < 12 && !(await page.locator('.choices.asking').count()); i++) {
    const b = (await box.boundingBox())!;
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(120);
  }
  await expect(page.locator('.choices.asking')).toBeVisible();
}

test('Oct 31 by day: pumpkins on the lawn and round the campsite, clear of every control; no Jack, no lanterns', async ({ page }) => {
  await page.goto('?demo&date=2026-10-31T16:59');
  await islandUp(page);
  await camera(page, 114);
  await expect(page.locator('[data-halloween="day"] .pumpkin .art:visible').first()).toBeVisible();
  expect(await page.locator('.pumpkin').count()).toBeGreaterThanOrEqual(3);
  await expect.poll(() => under(page, '.pumpkin .art')).toEqual([]); // (re-measured where the camera settled)
  await camera(page, (await geo(page)).CAMS.oku);
  // (polled: Halloween.svelte measures which spots a control covers 300 ms after the camera rests, so a read straight
  // after camTo could still have the last camera's set: CI's 2 of 3 now and then)
  await expect.poll(() => page.locator('.pumpkin .art').evaluateAll((els) => els.filter((e) => getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().top > 140).length), { message: 'the pumpkins round the campsite, on screen' }).toBeGreaterThanOrEqual(3);
  await expect.poll(() => under(page, '.pumpkin .art')).toEqual([]); // (re-measured where the camera settled)
  await expect(page.locator('[data-visitor="jack"]')).toHaveCount(0);
  await expect(page.locator('.pumpkin .glow')).toHaveCount(0);
});

test('Nov 1: no Halloween', async ({ page }) => {
  await page.goto('?demo&date=2026-11-01T00:00');
  await islandUp(page);
  await expect(page.locator('[data-halloween]')).toHaveCount(0);
  await expect(page.locator('[data-visitor="jack"]')).toHaveCount(0);
});

test('Halloween night: lanterns lit, Jack at centre stage (K.K. on his own stool, no visitor), a treat delights him', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('?demo&date=2026-10-31T19:00');
  await islandUp(page);
  const bells = await hudBells(page).getAttribute('aria-label');
  await camera(page, await stageCam(page));
  await expect(page.locator('[data-halloween="night"] .glow:visible').first()).toBeVisible();
  const jack = page.locator('[data-visitor="jack"] .art');
  await expect(jack).toBeVisible();
  expect(await under(page, '[data-visitor="jack"] .art')).toEqual([]);
  await expect.poll(() => under(page, '.pumpkin .art')).toEqual([]); // (re-measured where the camera settled)
  if (process.env.SHOTS) await page.waitForTimeout(500), await page.screenshot({ path: `${process.env.SHOTS}/halloween-night-390.png` });
  await tapFigure(page, '[data-visitor="jack"] .art');
  const box = page.locator('[data-fx="talk"].placed');
  await expect(box.locator('.who')).toHaveText('パンプキング');
  await expect(box).toHaveAttribute('data-pages', '3'); // the introduction (two pages), then the ask
  await toAnswers(page);
  // the question and its answers cover none of the HUD's controls (they may sit over the island's, by Jack)
  expect((await under(page, '[data-fx="talk"], .choices.asking', true))).toEqual([]);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/halloween-jack-ask-390.png` });
  await press(page, 'キャンディを あげる');
  await expect(page.locator('[data-treat] .candy')).toBeVisible();
  await expect(page.locator('[data-fx="talk"].placed .sr')).toContainText('キャンディ');
  if (process.env.SHOTS) await page.waitForTimeout(300), await page.screenshot({ path: `${process.env.SHOTS}/halloween-jack-treat-390.png` });
  await expect(page.locator('[data-tricked]')).toHaveCount(0);
  // after a treat he just chats (no ask)
  await page.waitForTimeout(400);
  await tapFigure(page, '[data-visitor="jack"] .art');
  await expect(page.locator('[data-fx="talk"].placed')).toHaveAttribute('data-pages', '1');
  await expect(page.locator('.choices')).toHaveCount(0);
  await expect(hudBells(page)).toHaveAttribute('aria-label', bells!);
});

test('nothing for Jack: his trick puts goofy glasses on my villager', async ({ page }) => {
  await page.goto('?demo&date=2026-10-31T23:59');
  await islandUp(page);
  await camera(page, await stageCam(page));
  await tapFigure(page, '[data-visitor="jack"] .art');
  await toAnswers(page);
  await press(page, 'なにも あげない');
  await expect(page.locator('[data-tricked]')).toHaveCount(1);
  await expect(page.locator('[data-fx="talk"].placed .sr')).toContainText('イタズラ');
  // my villager (at home, まえ) wears it
  await camera(page, 114);
  if (process.env.SHOTS) await page.waitForTimeout(600), await page.screenshot({ path: `${process.env.SHOTS}/halloween-jack-trick-390.png` });
  // only my villager's face, on the left
  const g = (await page.locator('[data-tricked]').boundingBox())!;
  expect(g.x + g.width / 2).toBeLessThan(195);
  // asking again (no candy yet): the ask alone
  // tap the trick line away (finish, then close; it may have finished typing already)
  const talk = page.locator('[data-fx="talk"].placed');
  for (let i = 0; i < 4 && (await talk.count()); i++) {
    const b = await talk.boundingBox().catch(() => null);
    if (b) await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(150);
  }
  await expect(talk).toHaveCount(0);
  await camera(page, await stageCam(page));
  await tapFigure(page, '[data-visitor="jack"] .art');
  await expect(page.locator('[data-fx="talk"].placed')).toHaveAttribute('data-pages', '1');
});

test('?event=halloween brings the evening on any day', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&event=halloween');
  await islandUp(page);
  await camera(page, await stageCam(page));
  await expect(page.locator('[data-visitor="jack"] .art')).toBeVisible();
  await expect(page.locator('[data-halloween="night"]')).toHaveCount(1);
});
