// The rooms' two-finger pan (docs/design.md "The tent"): in the tent, the shop and the museum two fingers moving
// together slide the view (screen space: a floor point under them moves with them), held so the room never leaves it
// (past that it gives and eases back on the lift), flung on by a lift on the move; a pinch zooms about the fingers in the
// same gesture; one finger's tap still walks there; the home button brings NH's framing back.
// Chromium's fingers are real touches (CDP Input.dispatchTouchEvent: touch-action, pointer capture and all); WebKit's
// are pointer events sent in the page (Playwright has no multi-touch there).
import { expect, test, type Page } from './fixtures.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00';

type R = { stats(): { frames: number }; still(): boolean; px(x: number, z: number, y?: number): [number, number]; mine(): [number, number]; walking(w?: string): boolean };
const ROOMS = [
  { name: 'the tent', path: 'tent', hook: '__tent', reset: '[data-tent-reset]' },
  // (the shop's walk-in ends by the stage's foot, the sign before it: the floor point toward the door)
  { name: 'the shop', path: 'shop', hook: '__shop', reset: '[data-shop-reset]', dx: -40, dz: 0 },
  { name: 'the museum', path: 'museum', hook: '__museum', reset: '[data-museum-reset]' }
] as const;
type Pt = [number, number];

/** Two fingers through `frames` (each its fingers' points), a task apart; lifted after the last at once (a fling, if
 *  moving), or not (`up` false: lift() later; what the view does under held fingers is exactly the pan). */
async function fingers(page: Page, frames: Pt[][], up = true) {
  if (page.context().browser()?.browserType().name() === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    const pts = (f: Pt[]) => f.map(([x, y], id) => ({ x, y, id, radiusX: 4, radiusY: 4, force: 1 }));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(frames[0]) });
    for (const f of frames.slice(1)) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(f) });
    (page as Page & { __lift?: () => Promise<void> }).__lift = async () => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
    };
  } else {
    await page.evaluate(async (frames) => {
      // (a pointer made up in the page has no capture to take: the room's setPointerCapture would throw)
      const proto = HTMLCanvasElement.prototype as unknown as { setPointerCapture(id: number): void; __cap?: boolean };
      if (!proto.__cap) {
        const real = proto.setPointerCapture;
        proto.setPointerCapture = function (this: HTMLCanvasElement, id: number) {
          try {
            real.call(this, id);
          } catch {
            /* a made-up pointer */
          }
        };
        proto.__cap = true;
      }
      const el = document.elementFromPoint(...frames[0][0])!;
      const ev = (type: string, id: number, [x, y]: [number, number]) =>
        el.dispatchEvent(new PointerEvent(type, { pointerId: 20 + id, pointerType: 'touch', isPrimary: id === 0, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true, composed: true }));
      frames[0].forEach((p, i) => ev('pointerdown', i, p));
      for (const f of frames.slice(1)) {
        // (a task between moves: the room's frames run between them)
        await new Promise((r) => setTimeout(r, 0));
        f.forEach((p, i) => ev('pointermove', i, p));
      }
      const last = frames[frames.length - 1];
      (window as unknown as { __fingers?: () => void }).__fingers = () => last.forEach((p, i) => ev('pointerup', i, p));
    }, frames);
  }
  if (up) await lift(page);
}
async function lift(page: Page) {
  const p = page as Page & { __lift?: () => Promise<void> };
  if (p.__lift) {
    await p.__lift();
    p.__lift = undefined;
  } else await page.evaluate(() => (window as unknown as { __fingers: () => void }).__fingers());
}
/** Two fingers 100 px apart about (x, y), moved by (dx, dy) over `n` frames (spread × `k` by the end). */
const two = (x: number, y: number, dx: number, dy: number, n = 10, k = 1): Pt[][] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const f = i / n, cx = x + dx * f, cy = y + dy * f, h = 50 * (1 + (k - 1) * f);
    return [[cx - h, cy], [cx + h, cy]];
  });

for (const room of ROOMS) {
  const r = <T,>(page: Page, fn: (h: R) => T) => page.evaluate(`(${fn.toString()})(window.${room.hook})`) as Promise<T>;
  const rest = (page: Page) => expect.poll(() => r(page, (h) => !!h.still() && !h.walking('A')), { timeout: 15_000 }).toBe(true);
  /** In the room at rest; a floor point a little behind my villager (or `dx`, `dz` from it), followed on the screen. */
  async function open(page: Page) {
    await page.goto(room.path + Q);
    await page.waitForFunction((h) => ((window as unknown as Record<string, R | undefined>)[h]?.stats()?.frames ?? 0) > 0, room.hook);
    await rest(page);
    const box = (await page.locator('canvas').first().boundingBox())!;
    const m = await r(page, (h) => h.mine());
    const P = 'dx' in room ? ([m[0] + room.dx, m[1] + room.dz] as const) : ([m[0], m[1] - 25] as const);
    const at = (x: number = P[0], z: number = P[1]) => page.evaluate(`window.${room.hook}.px(${x}, ${z})`) as Promise<Pt>;
    return { box, m, P, at, cx: box.x + box.width / 2, cy: box.y + box.height * 0.55 };
  }

  test(`${room.name}: two fingers moving together pan the view with them; ⌂ brings NH's framing back; a tap still walks`, { tag: '@logic' }, async ({ page }) => {
    const { m, P, at, cx, cy } = await open(page);
    const p0 = await at();
    // (held: the point under the fingers moved with them; nobody walked)
    await fingers(page, two(cx, cy, 50, 90), false);
    const p1 = await at();
    // (Chromium holds back a touch's first moves within its slop: up to a frame's 5 px short)
    expect(Math.abs(p1[0] - p0[0] - 50)).toBeLessThan(8);
    expect(Math.abs(p1[1] - p0[1] - 90)).toBeLessThan(12);
    await lift(page);
    await rest(page);
    expect(await r(page, (h) => h.mine())).toEqual(m);
    await page.locator(room.reset).click();
    await rest(page);
    const h0 = await at();
    expect(Math.hypot(h0[0] - p0[0], h0[1] - p0[1])).toBeLessThan(1.5);
    await expect(page.locator(room.reset)).toHaveCount(0);
    // one finger: a tap on the floor still walks there (or as near as the floor lets: the shop's counter)
    await page.mouse.click(h0[0], h0[1]);
    await expect.poll(async () => ((q) => Math.hypot(q[0] - P[0], q[1] - P[1]))(await r(page, (h) => h.mine())), { timeout: 15_000 }).toBeLessThan(8);
  });

  test(`${room.name}: past the room's edge the pan gives and eases back on the lift; a flick flings on`, { tag: '@logic' }, async ({ page }) => {
    const { box, at, cx, cy } = await open(page);
    const p0 = await at();
    await fingers(page, two(cx, 200, 0, 600, 20), false);
    const held = await at();
    await lift(page);
    await rest(page);
    const back = await at();
    expect(back[1]).toBeLessThan(held[1] - 5);
    expect(back[1]).toBeGreaterThan(p0[1]);
    // (KEEP: 0.65 of the room, or of the band, stays in it: well short of the whole screen's height)
    expect(back[1] - p0[1]).toBeLessThan(box.height * 0.8);
    await page.locator(room.reset).click();
    await rest(page);
    // a quick flick up: the view goes on after the lift
    await fingers(page, two(cx, cy, 0, -60, 4));
    const flick = await at();
    await rest(page);
    expect((await at())[1]).toBeLessThan(flick[1] - 3);
  });

  test(`${room.name}: the first visit says two fingers move the view, gone at the first pan${room.path === 'shop' ? ' (each visit till then)' : ' (and not again)'}`, { tag: '@logic' }, async ({ page }) => {
    // (every hint shown this page, whenever: the tent's and the museum's go by themselves after 4 s)
    await page.addInitScript(() => {
      const w = window as unknown as { __hints: string[] };
      w.__hints = [];
      new MutationObserver(() => {
        for (const el of document.querySelectorAll<HTMLElement>('[data-pan-hint]')) if (!w.__hints.includes(el.innerText)) w.__hints.push(el.innerText);
      }).observe(document, { childList: true, subtree: true });
    });
    const hints = () => page.evaluate(() => (window as unknown as { __hints: string[] }).__hints);
    const hint = page.locator(`[data-pan-hint="${room.path}"]`);
    const { cx, cy } = await open(page);
    await expect.poll(hints).toEqual(['2ほんゆびで うごかせるよ']);
    if (room.path === 'shop') {
      // (the shop's stays: its counter starts off a phone's edge; the next visit says it again)
      await expect(hint).toBeVisible();
      await open(page);
      await expect(hint).toBeVisible();
    }
    await fingers(page, two(cx, cy, 30, 0));
    await expect(hint).toHaveCount(0);
    await open(page);
    expect(await hints()).toEqual([]);
  });

  test(`${room.name}: a pinch apart zooms in`, { tag: '@logic' }, async ({ page }) => {
    const { P, at, cx, cy } = await open(page);
    const span = async () => {
      const [a, b] = [await at(), await at(P[0] + 10, P[1] + 10)];
      return Math.hypot(a[0] - b[0], a[1] - b[1]);
    };
    const s0 = await span();
    await fingers(page, two(cx, cy, 0, 0, 8, 1.6), false);
    expect(await span()).toBeGreaterThan(s0 * 1.15);
    await lift(page);
    await expect(page.locator(room.reset)).toBeVisible();
  });
}
