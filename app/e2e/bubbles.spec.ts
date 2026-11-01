// Speech balloons by their speakers (docs/design.md "Dialogue"): every speaker's balloon stands by them, the tail at
// them, never over the HUD, never off screen, never over the speaker's face; it follows a speaker who moves. The bug: a
// visitor's balloon floated above the museum, 100px+ off their head.
import { expect, test, type Page } from '@playwright/test';

/** The balloon against its speaker and the HUD (the controls outside the stage). */
const measure = (page: Page, speaker: string) =>
  page.evaluate((sel) => {
    const box = document.querySelector('[data-fx="talk"].placed')!, sp = document.querySelector(sel)!;
    const b = box.getBoundingClientRect(), s = sp.getBoundingClientRect();
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
    return { dist, hud, onScreen, face, side };
  }, speaker);

async function expectBy(page: Page, speaker: string, near: number) {
  const m = await measure(page, speaker);
  expect(m.dist, `tail ${m.dist}px off (${m.side})`).toBeLessThanOrEqual(near);
  expect(m.hud).toEqual([]);
  expect(m.onScreen).toBe(true);
  expect(m.face).toBe(false);
}
async function tapAt(page: Page, sel: string, fy = 0.5) {
  const r = (await page.locator(sel).boundingBox())!;
  await page.mouse.click(r.x + r.width / 2, r.y + r.height * fy);
}
/** Gulliver sleeps face down until the fifth nudge (NH): the first tap walks my villager over, four more wake him. */
async function wakeGulliver(page: Page, sel: string) {
  await tapAt(page, sel);
  await page.waitForTimeout(1100);
  for (let i = 1; i < 5; i++) {
    await tapAt(page, sel);
    await page.waitForTimeout(250);
  }
}
/** The camera to world z (ひろば 860: centre stage, where most visitors stand; おく 1380: the museum). */
async function go(page: Page, z: number) {
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(400);
  await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z);
  await page.waitForTimeout(300);
}
const balloon = (page: Page) => expect(page.locator('[data-fx="talk"].placed')).toBeVisible({ timeout: 6000 });

for (const vp of [{ width: 390, height: 844 }, { width: 320, height: 568 }]) {
  test.describe(`at ${vp.width}`, () => {
    test.use({ viewport: vp });
    for (const [v, at] of [['gulliver', '12:00'], ['kk-slider', '21:00'], ['wisp', '22:00'], ['jack', '21:00'], ['reese', '12:00'], ['daisy-mae', '09:00']] as const)
      test(`${v}: the balloon by their head, not floated above the museum`, async ({ page }) => {
        await page.goto(`?demo&date=2026-11-04T${at}&visitor=${v}&critter=none`);
        const art = `[data-visitor="${v}"] .art`;
        // Gulliver washes up on the front beach and Daisy Mae wanders the front lawn (まえ); the rest take centre stage
        if (v !== 'gulliver' && v !== 'daisy-mae') await go(page, 860);
        await expect(page.locator(art)).toBeVisible();
        if (v === 'gulliver') await wakeGulliver(page, art);
        else await tapAt(page, art, 0.3);
        await balloon(page);
        await expectBy(page, art, 56); // GAP + NEAR, and a little
      });
    test('Blathers at the museum', async ({ page }) => {
      await page.goto('?demo&date=2026-11-04T21:00&critter=none');
      await go(page, 1380);
      await page.getByRole('button', { name: 'はくぶつかん：ずかんを ひらく' }).click();
      await balloon(page);
      await expectBy(page, '.museum .art', 56);
    });
    test('my villager, right over its head', async ({ page }) => {
      await page.goto('?demo&date=2026-11-04T12:00&critter=none');
      await expect(page.locator('[data-actor="mine"] .vil')).toBeVisible();
      await tapAt(page, '[data-actor="mine"] .vil');
      await balloon(page);
      await page.waitForTimeout(700); // its hop (R9) over: the balloon stays put through it
      await expectBy(page, '[data-actor="mine"] .vil', 24); // the tail at the head, the ♪ behind the balloon
    });
  });
}

test.use({ viewport: { width: 390, height: 844 } });
test('the balloon follows a speaker who moves while talking, and closes if they go', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=gulliver&critter=none');
  const art = '[data-visitor="gulliver"] .art';
  await expect(page.locator(art)).toBeVisible();
  await wakeGulliver(page, art);
  await balloon(page);
  await page.waitForTimeout(700); // up on his feet
  const y0 = (await page.locator('[data-fx="talk"]').boundingBox())!.y;
  // a step down the lawn: the balloon goes after it (once the move has lasted), its tail still at the head
  await page.locator('[data-visitor="gulliver"]').evaluate((el) => ((el as HTMLElement).style.marginTop = '60px'));
  await expect.poll(async () => (await page.locator('[data-fx="talk"]').boundingBox())!.y - y0, { timeout: 3000 }).toBeGreaterThan(30);
  await page.waitForTimeout(300); // its glide
  await expectBy(page, art, 56);
  await page.locator('[data-visitor="gulliver"]').evaluate((el) => el.remove());
  await expect(page.locator('[data-fx="talk"]')).toHaveCount(0);
});
