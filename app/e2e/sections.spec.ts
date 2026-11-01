// The island's sections (docs/design.md "World"): the scroller rests only on a section's stop (mandatory snapping, one
// section a swipe, however hard the fling), a follow ends on a stop, and at each stop the HUD covers none of the
// section's key content: まえ the villagers and their goal trees, ひろば Resident Services, おく the campsite. On the
// target phones (iPhone 15 / 16: 393 × 852; 16 Pro: 402 × 874) and still on the small ones.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

type W = { cam(): number; stops(): number[]; following(): boolean; snapping(): string; at(x: number, z: number): [number, number]; idle(): boolean };
const call = <T,>(page: Page, fn: (w: W, a: number[]) => T, args: number[] = []) =>
  page.evaluate(([f, a]) => new Function('w', 'a', `return (${f})(w, a)`)((window as unknown as { __world: W }).__world, a), [fn.toString(), args] as const) as Promise<T>;
const SHOTS = process.env.SHOTS_DIR;

async function open(page: Page) {
  await page.goto('?demo&season=summer&date=2026-07-01T10:00');
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(600);
}

/** A swipe on the scroller: `dy` > 0 drags the island toward you (up it), < 0 back toward the beach. By default a wheel
 *  gesture of that size (every Chromium scrolls it, headless too); `touch`: CDP's synthesized touch scroll with its
 *  fling at `speed` px/s. Says whether the scroller moved at all. */
async function swipe(page: Page, dy: number, speed = 800, touch = false): Promise<boolean> {
  const vp = page.viewportSize()!;
  await page.evaluate(() => {
    const el = document.querySelector('[data-world-scroller]')!, w = window as unknown as { __scrolls: number };
    w.__scrolls = 0;
    el.addEventListener('scroll', () => w.__scrolls++, { passive: true });
  });
  if (touch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.synthesizeScrollGesture', { x: vp.width / 2, y: dy > 0 ? vp.height * 0.4 : vp.height * 0.7, yDistance: dy, speed, gestureSourceType: 'touch' });
    await cdp.detach();
  } else {
    await page.mouse.move(vp.width / 2, vp.height * 0.55);
    await page.mouse.wheel(0, -dy);
  }
  await page.waitForTimeout(200);
  return page.evaluate(() => (window as unknown as { __scrolls: number }).__scrolls > 0);
}

/** Wait until the camera is still, and say where it rests. */
async function rest(page: Page): Promise<number> {
  let last = NaN;
  await expect.poll(async () => {
    const c = await call(page, (w) => w.cam());
    const still = Math.abs(c - last) < 0.01;
    last = c;
    return still;
  }, { timeout: 5000, intervals: [150] }).toBe(true);
  return last;
}
const onStop = (cam: number, stops: number[]) => stops.some((z) => Math.abs(z - cam) < 0.6);
const stopIndex = (cam: number, stops: number[]) => stops.findIndex((z) => Math.abs(z - cam) < 0.6);

/** The rect of the top chrome, and the tops of what must stay clear of it. */
async function clearOfHud(page: Page, sels: string[]) {
  return page.evaluate((sels) => {
    const hud = document.querySelector('.ribbon-wrap')!.getBoundingClientRect().bottom;
    return sels.map((sel) => {
      const tops = [...document.querySelectorAll(sel)].map((e) => e.getBoundingClientRect().top);
      return { sel, hud, top: Math.min(...tops) };
    });
  }, sels);
}

for (const vp of [{ width: 393, height: 852 }, { width: 402, height: 874 }]) {
  test.describe(`at ${vp.width} × ${vp.height}`, () => {
    test.use({ viewport: vp });

    test('three stops; a scroll of any size rests exactly on one, one section a swipe, both ways', async ({ page }) => {
      await open(page);
      const stops = await call(page, (w) => w.stops());
      expect(stops).toHaveLength(3);
      expect(stops[0]).toBeLessThan(stops[1]);
      expect(stops[1]).toBeLessThan(stops[2]);
      expect(await call(page, (w) => w.cam())).toBeCloseTo(stops[0], 0); // まえ on open
      // a short scroll: it settles back or onto the next stop, never between
      await swipe(page, 120);
      expect(onStop(await rest(page), stops)).toBe(true);
      // up the island: one section a swipe
      await page.evaluate(() => document.querySelector('[data-world-scroller]')!.scrollTo({ top: 1e6, behavior: 'instant' }));
      expect(stopIndex(await rest(page), stops)).toBe(0);
      await swipe(page, 450);
      expect(stopIndex(await rest(page), stops)).toBe(1);
      await swipe(page, 450);
      expect(stopIndex(await rest(page), stops)).toBe(2);
      // and back
      await swipe(page, -450);
      expect(stopIndex(await rest(page), stops)).toBe(1);
      await swipe(page, -450);
      expect(stopIndex(await rest(page), stops)).toBe(0);
      // a huge one from the front still stops at the plaza
      await swipe(page, 3000);
      expect(stopIndex(await rest(page), stops)).toBe(1);
      // no drift once landed, and nothing runs
      const at = await call(page, (w) => w.cam());
      await page.waitForTimeout(800);
      expect(await call(page, (w) => w.cam())).toBe(at);
      await expect.poll(() => call(page, (w) => w.idle()), { timeout: 10_000 }).toBe(true);
    });

    test('touch: a drag and a hard fling rest exactly on a stop, one section a swipe (the fling caught at the plaza)', async ({ page }) => {
      await open(page);
      const stops = await call(page, (w) => w.stops());
      const moved = await swipe(page, 450, 3000, true);
      test.skip(!moved, 'this browser build does not scroll a synthesized touch gesture (the wheel test above covers the snapping)');
      expect(stopIndex(await rest(page), stops)).toBe(1);
      await swipe(page, -700, 3000, true);
      expect(stopIndex(await rest(page), stops)).toBe(0);
      await swipe(page, 1000, 9000, true);
      expect(stopIndex(await rest(page), stops)).toBe(1);
    });

    test('the HUD covers none of a section’s key content', async ({ page }) => {
      await open(page);
      const stops = await call(page, (w) => w.stops());
      const want = [
        ['[data-actor] .vil', '[data-tree-node] .canopy'],
        ['[data-building="rs"] .door'],
        ['[data-building="campsite"] .door', '[data-building="museum"], .museum']
      ];
      for (let i = 0; i < 3; i++) {
        if (i) await swipe(page, 450);
        expect(stopIndex(await rest(page), stops)).toBe(i);
        await page.waitForTimeout(200);
        for (const r of await clearOfHud(page, want[i].slice(0, i === 2 ? 1 : undefined))) expect(r.top, `${r.sel} at stop ${i}`).toBeGreaterThanOrEqual(r.hud);
        if (SHOTS) {
          mkdirSync(SHOTS, { recursive: true });
          await page.screenshot({ path: `${SHOTS}/section-${vp.width}-${i}.png` });
        }
      }
    });

    test('a follow ends on a stop', async ({ page }) => {
      await open(page);
      const stops = await call(page, (w) => w.stops());
      const [x, y] = await call(page, (w) => w.at(195, 800));
      await page.mouse.click(x, y);
      await expect.poll(() => call(page, (w) => w.following())).toBe(true);
      await expect.poll(() => call(page, (w) => w.following()), { timeout: 10_000 }).toBe(false);
      await expect.poll(() => call(page, (w) => w.snapping()), { timeout: 3000 }).toBe('');
      expect(onStop(await rest(page), stops)).toBe(true);
    });
  });
}

for (const vp of [{ width: 430, height: 932 }, { width: 375, height: 667 }, { width: 320, height: 568 }]) {
  test(`at ${vp.width} × ${vp.height} the three stops still work`, async ({ page }) => {
    await page.setViewportSize(vp);
    await open(page);
    const stops = await call(page, (w) => w.stops());
    for (let i = 1; i < 3; i++) {
      await swipe(page, Math.round(vp.height * 0.75));
      expect(stopIndex(await rest(page), stops)).toBe(i);
    }
  });
}
