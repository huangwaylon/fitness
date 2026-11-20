// Speech balloons by their speakers (docs/design.md "Dialogue"): every speaker's balloon stands by them, the tail at
// them, never over the HUD, never off screen, never over the speaker's face; it follows a speaker who moves. The bug: a
// visitor's balloon floated above a building (the museum then), 100px+ off their head.
import { expect, test, type Page } from './fixtures.ts';
import { expectWhole, fingers, liftFingers, spreading } from './balloon.ts';
import { camTo, tapFigure, visitorOut, type W3 } from './island.ts';
import type { BoxKind } from '../src/lib/components/island/probe.ts';

/** A speaker on the island by kind and id (its box: `__world3d.box`). */
type Who = { kind: BoxKind; id: string };

/** The balloon against its speaker and the HUD (the controls outside the stage). */
const measure = (page: Page, speaker: Who) =>
  page.evaluate((who) => {
    const box = document.querySelector('[data-fx="talk"].placed')!, sp = (window as unknown as { __world3d: W3 }).__world3d.box(who.kind, who.id)!;
    const b = box.getBoundingClientRect(), s = new DOMRect(sp.left, sp.top, sp.width, sp.height);
    const tail = parseFloat(getComputedStyle(box).getPropertyValue('--tail'));
    const side = box.getAttribute('data-side');
    const mx = b.left + b.width / 2, my = b.top + b.height / 2;
    const tip = side === 'bottom' ? [mx + tail, b.top - 9] : side === 'left' ? [b.right + 9, my + tail] : side === 'right' ? [b.left - 9, my + tail] : [mx + tail, b.bottom + 9];
    const dist = Math.hypot(Math.max(s.left - tip[0], 0, tip[0] - s.right), Math.max(s.top - tip[1], 0, tip[1] - s.bottom));
    const hud = [...document.querySelectorAll('button, .news')].filter((el) => !el.closest('.stage')).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width && r.left < b.right && b.left < r.right && r.top < b.bottom && b.top < r.bottom;
    }).map((el) => el.className);
    const onScreen = b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight;
    const face = b.left < s.right && s.left < b.right && b.top < s.top + s.height * 0.5 && s.top < b.bottom;
    return { dist, hud, onScreen, face, side, box: [b.left, b.top, b.right, b.bottom, innerWidth, innerHeight, s.left, s.top, s.width, s.height] };
  }, speaker);

async function expectBy(page: Page, speaker: Who, near: number) {
  const m = await measure(page, speaker);
  expect(m.dist, `tail ${m.dist}px off (${m.side})`).toBeLessThanOrEqual(near);
  expect(m.hud).toEqual([]);
  expect(m.onScreen, `on screen: ${JSON.stringify(m.box)}`).toBe(true);
  expect(m.face).toBe(false);
}
/** Gulliver sleeps face down until the fifth nudge (NH): five taps wake him. */
async function wakeGulliver(page: Page) {
  await tapFigure(page, 'visitor', 'gulliver');
  await page.waitForTimeout(400);
  for (let i = 1; i < 5; i++) {
    await tapFigure(page, 'visitor', 'gulliver');
    await page.waitForTimeout(250);
  }
}
const balloon = (page: Page) => expect(page.locator('[data-fx="talk"].placed')).toBeVisible({ timeout: 6000 });

test.use({ viewport: { width: 390, height: 844 } });
for (const [v, at] of [['gulliver', '12:00'], ['kk-slider', '21:00'], ['wisp', '22:00'], ['jack', '21:00'], ['reese', '12:00'], ['daisy-mae', '09:00']] as const)
  test(`${v}: the balloon by their head, not floated above the campsite`, async ({ page }) => {
    // (K.K. on his stool, no visitor: in view from まえ)
    const kk = v === 'kk-slider';
    await page.goto(`?demo&date=2026-11-04T${at}&visitor=${kk ? 'none' : v}`);
    const art: Who = kk ? { kind: 'kk', id: '' } : { kind: 'visitor', id: v };
    // Gulliver washes up on the front beach and Daisy Mae wanders the front lawn (まえ); the rest take centre stage
    if (v !== 'gulliver' && v !== 'daisy-mae' && !kk) await camTo(page, 642, false);
    await expect.poll(async () => (await visitorOut(page, kk ? 'kk' : v))?.shown).toBe(true);
    if (v === 'gulliver') await wakeGulliver(page);
    else await tapFigure(page, kk ? 'kk' : 'visitor', kk ? '' : v, 0.3);
    await balloon(page);
    await expectBy(page, art, 56); // GAP + NEAR, and a little
  });

test('the balloon follows a speaker who moves while talking, and closes if they go', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=gulliver');
  const art: Who = { kind: 'visitor', id: 'gulliver' };
  await expect.poll(async () => (await visitorOut(page, art.id))?.shown).toBe(true);
  await wakeGulliver(page);
  await balloon(page);
  await page.waitForTimeout(700); // up on his feet
  const y0 = (await page.locator('[data-fx="talk"]').boundingBox())!.y;
  // a step down the lawn: the balloon goes after it (once the move has lasted), its tail still at the head
  await page.evaluate(() => {
    const w = (window as unknown as { __world: { feet(id: string): [number, number]; put(x: number, z: number, id: string): void } }).__world, [x, z] = w.feet('visitor');
    w.put(x, z - 40, 'visitor');
  });
  await expect.poll(async () => (await page.locator('[data-fx="talk"]').boundingBox())!.y - y0, { timeout: 3000 }).toBeGreaterThan(30);
  await page.waitForTimeout(300); // its glide
  await expectBy(page, art, 56);
  await page.evaluate(() => (window as unknown as { __world3d: { leave(): void } }).__world3d.leave()); // (he sets off: his balloon goes)
  await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
});

// The bug (the user, on the phone): "When speech bubbles appear from NPCs, if we change the zoom level, the speech bubble
// disappears, leaving only the text, until we let go." The balloon stepped aside while the camera moved (its layer
// visibility: hidden), but its page's text is visibility: visible of its own, so the text stayed alone. Now it's carried
// with its speaker each of the camera's frames, whole.
test('mid-pinch and mid-scroll the balloon stays whole (its box, not only its text) and by its speaker; let go, it stands by them again', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=reese');
  await camTo(page, 642, false);
  const art: Who = { kind: 'visitor', id: 'reese' }, box = '[data-fx="talk"]';
  await expect.poll(async () => (await visitorOut(page, art.id))?.shown).toBe(true);
  await tapFigure(page, 'visitor', 'reese', 0.3);
  await balloon(page);
  await page.waitForTimeout(400); // (its pop-in)
  const zoom = () => page.evaluate(() => (window as unknown as { __world3d: { view(): { zoom: number } } }).__world3d.view().zoom);
  const z0 = await zoom();
  // two fingers down and apart, held there: zoomed in, the balloon whole at the head
  await fingers(page, spreading(200, 640, 8, 6));
  await expect.poll(zoom).toBeGreaterThan(z0 * 1.1);
  await expectWhole(page, box, art, 16);
  // further, still held
  await fingers(page, spreading(200, 640, 8, 6, 6).slice(1));
  await page.waitForTimeout(50);
  await expectWhole(page, box, art, 16);
  await liftFingers(page);
  await page.waitForTimeout(600); // (the camera settles; the balloon placed again by the rule)
  await expect(page.locator(`${box}.placed`)).toBeVisible();
  await expectWhole(page, box, art, 56);
  // one finger along the island, held: the same
  await fingers(page, Array.from({ length: 6 }, (_, i) => [[200, 300 + i * 14]]));
  await page.waitForTimeout(50);
  await expectWhole(page, box, art, 16);
  await liftFingers(page);
});
