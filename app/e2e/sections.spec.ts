// The island's two sections (docs/design.md "World", docs/decisions.md "Two sections, smooth"): the scroller scrolls
// freely between the two stops (its ends) and settles softly onto the nearer when it comes to rest (CSS proximity
// snapping, else an ease of 400 ms), never a jump; a follow ends on a stop; at each stop the HUD covers none of the
// section's key content: まえ the villagers and their goal trees (with a wide band of sea under the beach), おく the
// campsite. On the target phones (iPhone 15 / 16: 393 × 852; 16 Pro: 402 × 874) and still on the small ones.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { SHORE_Z } from '../src/lib/components/island/world.ts';

type W = { cam(): number; stops(): number[]; following(): boolean; snapping(): string; settle(): string; at(x: number, z: number): [number, number]; idle(): boolean };
const call = <T,>(page: Page, fn: (w: W, a: number[]) => T, args: number[] = []) =>
  page.evaluate(([f, a]) => new Function('w', 'a', `return (${f})(w, a)`)((window as unknown as { __world: W }).__world, a), [fn.toString(), args] as const) as Promise<T>;
const SHOTS = process.env.SHOTS_DIR;

async function open(page: Page, q = '') {
  await page.goto(`?demo&season=summer&date=2026-07-01T10:00${q}`);
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
  }, { timeout: 5000, intervals: [250] }).toBe(true);
  return last;
}
const stopIndex = (cam: number, stops: number[]) => stops.findIndex((z) => Math.abs(z - cam) < 0.6);

/** The scroll position every frame for `ms` (the settle's smoothness). */
const frames = (page: Page, ms: number) =>
  page.evaluate((ms) => new Promise<number[]>((done) => {
    const el = document.querySelector('[data-world-scroller]')!, out: number[] = [], t0 = performance.now();
    const f = () => {
      out.push(el.scrollTop);
      if (performance.now() - t0 < ms) requestAnimationFrame(f);
      else done(out);
    };
    requestAnimationFrame(f);
  }), ms);
/** No reversal (a settle never runs back the way it came) and no jump between two frames. */
function smooth(ys: number[], maxStep = 60) {
  let dir = 0;
  for (let i = 1; i < ys.length; i++) {
    const d = ys[i] - ys[i - 1];
    expect(Math.abs(d), `frame ${i}: ${d.toFixed(1)} px`).toBeLessThanOrEqual(maxStep);
    if (Math.abs(d) < 0.5) continue;
    if (dir && Math.sign(d) !== dir) throw new Error(`reversed at frame ${i}: ${ys.slice(Math.max(0, i - 3), i + 3).map((y) => y.toFixed(1)).join(', ')}`);
    dir = Math.sign(d);
  }
}

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

    for (const settle of ['css', 'js'] as const)
      test(`two stops; a scroll of any size settles onto the nearer, both ways (${settle})`, async ({ page }) => {
        await open(page, settle === 'js' ? '&settle=js' : '');
        expect(await call(page, (w) => w.settle())).toBe(settle);
        const stops = await call(page, (w) => w.stops());
        expect(stops).toHaveLength(2);
        expect(stops[0]).toBeLessThan(stops[1]);
        expect(await call(page, (w) => w.cam())).toBeCloseTo(stops[0], 0); // まえ on open
        const span = await page.evaluate(() => { const e = document.querySelector('[data-world-scroller]')!; return e.scrollHeight - e.clientHeight; });
        // a short scroll settles back, smoothly
        await swipe(page, Math.round(span * 0.25));
        smooth(await frames(page, 700));
        expect(stopIndex(await rest(page), stops)).toBe(0);
        // past half way: on to おく
        await swipe(page, Math.round(span * 0.7));
        smooth(await frames(page, 700));
        expect(stopIndex(await rest(page), stops)).toBe(1);
        // and back
        await swipe(page, -Math.round(span * 0.7));
        expect(stopIndex(await rest(page), stops)).toBe(0);
        // a huge one rests at the top
        await swipe(page, 3000);
        expect(stopIndex(await rest(page), stops)).toBe(1);
        // no drift once landed, and nothing runs
        const at = await call(page, (w) => w.cam());
        await page.waitForTimeout(800);
        expect(await call(page, (w) => w.cam())).toBe(at);
        await expect.poll(() => call(page, (w) => w.idle()), { timeout: 10_000 }).toBe(true);
      });

    test('touch: a drag and a fling rest on a stop, smoothly', async ({ page }) => {
      await open(page);
      const stops = await call(page, (w) => w.stops());
      const moved = await swipe(page, 450, 3000, true);
      test.skip(!moved, 'this browser build does not scroll a synthesized touch gesture (the wheel test above covers the settling)');
      expect(stopIndex(await rest(page), stops)).toBe(1);
      await swipe(page, -160, 600, true);
      smooth(await frames(page, 900));
      expect(stopIndex(await rest(page), stops)).toBe(1);
      await swipe(page, -700, 3000, true);
      expect(stopIndex(await rest(page), stops)).toBe(0);
    });

    test('the HUD covers none of a section’s key content; まえ shows a wide band of sea', async ({ page }) => {
      await open(page);
      const stops = await call(page, (w) => w.stops());
      const want = [['[data-actor] .vil', '[data-tree-node] .canopy'], ['[data-building="campsite"] .door']];
      for (let i = 0; i < 2; i++) {
        if (i) await swipe(page, 3000);
        expect(stopIndex(await rest(page), stops)).toBe(i);
        await page.waitForTimeout(200);
        for (const r of await clearOfHud(page, want[i])) expect(r.top, `${r.sel} at stop ${i}`).toBeGreaterThanOrEqual(r.hud);
        if (i === 0) {
          const shore = (await call(page, (w, [z]) => w.at(195, z), [SHORE_Z]))[1];
          expect(shore).toBeLessThan(vp.height * 0.8);
        }
        if (SHOTS) {
          mkdirSync(SHOTS, { recursive: true });
          await page.screenshot({ path: `${SHOTS}/section-${vp.width}-${i}.png` });
        }
      }
    });

    test('a follow ends on a stop', async ({ page }) => {
      await open(page);
      const stops = await call(page, (w) => w.stops());
      const [x, y] = await call(page, (w) => w.at(240, 860));
      await page.mouse.click(x, y);
      await expect.poll(() => call(page, (w) => w.following())).toBe(true);
      await expect.poll(() => call(page, (w) => w.following()), { timeout: 10_000 }).toBe(false);
      await expect.poll(() => call(page, (w) => w.snapping()), { timeout: 3000 }).toBe('');
      expect(stopIndex(await rest(page), stops)).toBeGreaterThanOrEqual(0);
    });
  });
}

for (const vp of [{ width: 430, height: 932 }, { width: 375, height: 667 }, { width: 320, height: 568 }]) {
  test(`at ${vp.width} × ${vp.height} the two stops still work`, async ({ page }) => {
    await page.setViewportSize(vp);
    await open(page);
    const stops = await call(page, (w) => w.stops());
    expect(stops).toHaveLength(2);
    await swipe(page, 3000);
    expect(stopIndex(await rest(page), stops)).toBe(1);
    await swipe(page, -3000);
    expect(stopIndex(await rest(page), stops)).toBe(0);
  });
}
