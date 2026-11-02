// The island in 3D (?island=3d, せってい's switch: docs/decisions.md "The island in 3D"): the 2D island never loads
// three; the 3D one draws its canvas under the DOM island, a tap on open lawn walks my villager, one finger scrolls
// along the island only (z, never x), two pinch the zoom, and /world3d (the POC's address) opens it.
import { expect, test, type Page } from '@playwright/test';

type W3 = {
  xRoom(k?: number): number;
  stats(): { frames: number; calls: number; tris: number; dpr: number; loading: number; fps: number };
  loaded(): boolean;
  view(): { camZ: number; zoom: number; pitch: number; camX: number };
  limits(): { min: number; max: number };
  client(x: number, z: number, lift?: number): [number, number];
  go(z: number, k?: number, x?: number): void;
};
const w3 = <R,>(page: Page, fn: (w: W3) => R) => page.evaluate(`(${fn.toString()})(window.__world3d)`) as Promise<R>;
const ready = (page: Page) => page.waitForFunction(() => (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded(), null, { timeout: 30_000 });
const Q = 'demo&date=2026-11-04T12:00&critter=none&visitor=none';

test('the 2D island never loads three; ?island=3d draws the island in 3D and a tap on the lawn walks my villager', async ({ page }) => {
  test.setTimeout(60_000);
  const scripts: string[] = [];
  page.on('response', async (r) => {
    if (r.url().endsWith('.js')) scripts.push((await r.text().catch(() => '')).includes('WebGLRenderer') ? 'three' : 'other');
  });
  await page.goto(`?${Q}`);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(800); // (proving nothing loads three for a while)
  expect(scripts).not.toContain('three');

  await page.goto(`?${Q}&island=3d`);
  await expect(page.locator('canvas[data-w3d]')).toBeVisible();
  await ready(page);
  expect(scripts).toContain('three');
  await expect(page.locator('.if-scene[data-r3]')).toBeVisible();
  const s = await w3(page, (w) => w.stats());
  expect(s.calls).toBeGreaterThan(10);
  expect(s.dpr).toBeLessThanOrEqual(2);

  // a tap on open lawn between the villagers' homes and the stream (world 200, 300) walks mine there
  const [x, y] = await w3(page, (w) => w.client(200, 300));
  await expect.poll(() => page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.matches('.stage'), [x, y])).toBe(true);
  await page.mouse.click(x, y);
  await expect.poll(async () => {
    const [ax, az] = await page.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine());
    return Math.hypot(ax - 200, az - 300);
  }, { timeout: 10_000 }).toBeLessThan(14);
});

/** A touch gesture in the page (gestures.ts reads pointer events): each frame the fingers' points, ~16 ms apart, in one
 *  evaluate (CI's software GL takes about a second for each CDP touch event: a drag of them ran a test out). `up`: the
 *  fingers lift after the last frame (at once: a fling if they were moving; `still`: after a rest, no fling); else they
 *  stay down for `lift()`. */
const touches = (page: Page, frames: [number, number][][], up = true, still = false) => page.evaluate(async ({ frames, up, still }) => {
  const W = window as unknown as { __touch?: { el: Element; ids: number[]; at: [number, number][] } };
  const ev = (type: string, el: Element | Window, id: number, [x, y]: [number, number]) =>
    el.dispatchEvent(new PointerEvent(type, { pointerId: 10 + id, pointerType: 'touch', isPrimary: id === 0, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true, composed: true }));
  const el = document.elementFromPoint(...frames[0][0])!;
  const ids = frames[0].map((_, i) => i);
  for (const i of ids) ev('pointerdown', el, i, frames[0][i]);
  for (const f of frames.slice(1)) {
    await new Promise((r) => setTimeout(r, 16));
    for (const i of ids) ev('pointermove', el, i, f[i]);
  }
  W.__touch = { el, ids, at: frames[frames.length - 1] };
  if (up && still) await new Promise((r) => setTimeout(r, 120));
  if (up) for (const i of ids) ev('pointerup', el, i, frames[frames.length - 1][i]);
}, { frames, up, still });
const lift = (page: Page) => page.evaluate(() => {
  const t = (window as unknown as { __touch: { el: Element; ids: number[]; at: [number, number][] } }).__touch;
  for (const i of t.ids) t.el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 10 + i, pointerType: 'touch', clientX: t.at[i][0], clientY: t.at[i][1], bubbles: true, cancelable: true }));
});
const line = (n: number, f: (i: number) => [number, number][]) => Array.from({ length: n + 1 }, (_, i) => f(i));
/** The camera at rest (its own: a villager wandering by doesn't keep it waiting). */
const idle = (page: Page) => expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { camStill(): boolean } }).__world3d.camStill()), { timeout: 20_000 }).toBe(true);

test('the 3D camera: at the default zoom one finger scrolls along the island only, two pinch the zoom, nothing else moves it', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`?${Q}&island=3d`);
  await ready(page);
  const { min, max } = await w3(page, (w) => w.limits());
  expect(max).toBeGreaterThan(min + 200);
  expect((await w3(page, (w) => w.view())).camZ).toBeCloseTo(min, 0);
  // a diagonal drag: down the screen (into the island) and sideways; the camera's x never moves (the island stays centred)
  const [cx0] = await w3(page, (w) => w.client(195, 400));
  await touches(page, line(6, (i) => [[120 + i * 20, 420 + i * 28]]));
  await idle(page);
  const after = await w3(page, (w) => w.view());
  expect(after.camZ).toBeGreaterThan(min + 60);
  expect(after.zoom).toBeCloseTo(1, 3);
  const [cx1] = await w3(page, (w) => w.client(195, 400));
  expect(Math.abs(cx1 - cx0)).toBeLessThan(0.5);
  // a pinch apart zooms in, and stays a pinch (no scroll) though its fingers drift down together
  const z1 = after.camZ;
  await touches(page, line(5, (i) => [[150 - i * 12, 400 + i * 4], [240 + i * 12, 420 + i * 4]]), true, true);
  await idle(page);
  const pinched = await w3(page, (w) => w.view());
  expect(pinched.zoom).toBeGreaterThan(1.2);
  expect(Math.abs(pinched.camZ - z1)).toBeLessThan(80);
  // still: nothing moves it
  await page.waitForTimeout(600); // (proving the camera stays put)
  expect((await w3(page, (w) => w.view())).camZ).toBeCloseTo(pinched.camZ, 1);
});

test('the 3D camera zoomed in: one finger pans sideways too, held over the island; a pinch past the default springs back, centred', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`?${Q}&island=3d`);
  await ready(page);
  const drag = async (x0: number, dx: number, n: number) => {
    await touches(page, line(n, (i) => [[x0 + i * dx, 500]]), true, true);
    await idle(page);
  };
  // zoomed in, a sideways drag pans x (with the finger: the view moves right as it goes left), as far as the room lets it
  await w3(page, (w) => w.go(300, 1.5));
  expect(await w3(page, (w) => w.xRoom())).toBeGreaterThan(5);
  await drag(300, -30, 4);
  const panned = await w3(page, (w) => ({ ...w.view(), room: w.xRoom() }));
  expect(panned.camX).toBeGreaterThan(195 + 5);
  expect(panned.camX).toBeLessThanOrEqual(195 + panned.room + 0.01);
  // far past the edge: held at the island plus its sea margin
  await drag(380, -90, 4);
  const edge = await w3(page, (w) => ({ ...w.view(), room: w.xRoom() }));
  expect(edge.camX).toBeCloseTo(195 + edge.room, 1);

  // a pinch together past the default: it gives (zoomed out under 1 while held), x centred; let go, it springs back
  // to exactly the default, centred
  await touches(page, line(5, (i) => [[60 + i * 24, 420], [330 - i * 24, 440]]), false);
  const held = await w3(page, (w) => w.view());
  expect(held.zoom).toBeLessThan(1);
  expect(held.camX).toBeCloseTo(195, 3);
  await lift(page);
  await idle(page);
  const back = await w3(page, (w) => w.view());
  expect(back.zoom).toBeCloseTo(1, 4);
  expect(back.camX).toBeCloseTo(195, 4);
  // and at the default a sideways drag moves nothing sideways
  await drag(300, -30, 4);
  expect((await w3(page, (w) => w.view())).camX).toBeCloseTo(195, 4);
});

test('/world3d, the POC\'s address, opens the island in 3D; without the flag the island is 2D', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`world3d/?${Q}`);
  await expect(page).toHaveURL(/island=3d/);
  await ready(page);
  await page.goto(`?${Q}`);
  await expect(page.locator('.if-scene')).toBeVisible();
  await expect(page.locator('canvas[data-w3d]')).toHaveCount(0);
});

test('the board\'s focus: the camera frames a thing, the finger does nothing meanwhile, and restore() goes back exactly', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`?${Q}&island=3d`);
  await ready(page);
  const before = await w3(page, (w) => w.view());
  await page.evaluate(() => (window as unknown as { __world3d: { focus(x: number, z: number, l: number): Promise<void> } }).__world3d.focus(150, 60, 20));
  const on = await w3(page, (w) => w.view());
  expect(on.zoom).toBeGreaterThan(2);
  // a drag while focused: nothing moves
  await page.mouse.move(200, 400);
  await page.mouse.down();
  await page.mouse.move(200, 600, { steps: 8 });
  await page.mouse.up();
  expect((await w3(page, (w) => w.view())).camZ).toBeCloseTo(on.camZ, 3);
  await page.evaluate(() => (window as unknown as { __world3d: { restore(): Promise<void> } }).__world3d.restore());
  const after = await w3(page, (w) => w.view());
  expect(after.camZ).toBe(before.camZ);
  expect(after.zoom).toBe(before.zoom);
  expect(after.pitch).toBe(before.pitch);
});

test('nothing drawn strays off the island: no NaN or far-flung vertex (the falling leaves\' lines), no material warnings', async ({ page }) => {
  test.setTimeout(60_000);
  const warns: string[] = [];
  page.on('console', (m) => (m.type() === 'warning' || m.type() === 'error') && /THREE/.test(m.text()) && warns.push(m.text()));
  // the autumn's falling leaves round the camera (NH's leaf models: quantized, so a baked matrix overflowed them)
  await page.goto(`?${Q}&island=3d`);
  await ready(page);
  const strays = () => page.evaluate(() => (window as unknown as { __world3d: { strays(): unknown[] } }).__world3d.strays());
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { stats(): { calls: number } } }).__world3d.stats().calls)).toBeGreaterThan(10);
  for (let i = 0; i < 12; i++) {
    expect(await strays()).toEqual([]);
    await page.waitForTimeout(300); // (sampling the flourishes as they come and go)
  }
  expect(warns).toEqual([]);
});

test('at night the glows add light without touching the canvas\'s alpha (a lamp\'s halo over the sky was a black box)', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`?demo&date=2026-11-04T22:00&critter=none&visitor=none&island=3d`);
  await ready(page);
  // at the front at the closest zoom, the far lamps' halos behind the campsite's trees
  await page.evaluate(() => {
    const w = (window as unknown as { __world3d: { go(z: number, k?: number): void; limits(): { min: number } } }).__world3d;
    w.go(w.limits().min, 99);
  });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { stats(): { calls: number } } }).__world3d.stats().calls)).toBeGreaterThan(10);
  expect(await page.evaluate(() => (window as unknown as { __world3d: { alphaBlends(): string[] } }).__world3d.alphaBlends())).toEqual([]);
});

/** The island's 2D art showing over the 3D canvas now (not the sky's, the UI's, nor NH's 2D reaction glyphs over a
 *  villager, which NH draws flat too): `[tag class <parent>]`. */
const domArt = (page: Page) => page.evaluate(() => {
  const st = document.querySelector('.stage')!;
  const vis = (e0: Element) => {
    for (let e: Element | null = e0; e && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.02) return false;
    }
    return true;
  };
  const out: string[] = [];
  for (const e of st.querySelectorAll('img, svg, [data-m3art], .official')) {
    if (e.closest('.band, .sky, [data-ui], .float:not([data-mark]), .float[data-mark="question"], .bubble') || (e.tagName.toLowerCase() !== 'svg' && e.parentElement?.closest('svg'))) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight || !vis(e)) continue;
    out.push(`${e.tagName.toLowerCase()} ${e.getAttribute('class') ?? ''} <${e.parentElement?.getAttribute('class') ?? ''}>`);
  }
  return out;
});

test('the 3D island draws what the 2D sprites did: no 2D art shows over it (a scroll, a high five), and the first high five\'s sparkles are ready', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`?${Q}&island=3d`);
  await ready(page);
  // the flourishes' models are loaded and on the GPU before any is asked for
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { fxWarmed(): boolean } }).__world3d.fxWarmed()), { timeout: 20_000 }).toBe(true);
  for (let i = 0; i < 6; i++) {
    await page.evaluate((i) => (window as unknown as { __world3d: { pan(dy: number): void } }).__world3d.pan(i < 3 ? -90 : 90), i);
    await page.waitForTimeout(150); // (sampling as the island scrolls)
    expect(await domArt(page)).toEqual([]);
  }
  // a high five: the zap between us and the sparkles over our heads are NH's models in the canvas, at once
  const fx0 = await w3(page, (w) => (w as unknown as { stats(): { fx: number } }).stats().fx);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world: { idle(): boolean } }).__world.idle()), { timeout: 20_000 }).toBe(true);
  await page.locator('.actor[data-actor="partner"] .vil').click();
  await expect.poll(() => w3(page, (w) => (w as unknown as { stats(): { fx: number } }).stats().fx), { timeout: 5000 }).toBeGreaterThan(fx0);
  for (let i = 0; i < 6; i++) {
    expect(await domArt(page)).toEqual([]);
    await page.waitForTimeout(120); // (sampling through the high five's 0.5 s zap and its marks)
  }
});

test('a goal tree\'s glints (all four met) stand whole on the 3D island: the canopy\'s node is squashed upright as the model, the stars not', async ({ page }) => {
  await page.goto(`?demo&date=2026-11-04T23:00&critter=none&visitor=none&island=3d`);
  await ready(page);
  await expect(page.locator('.glints[data-tree]').first()).toBeAttached();
  // each glint's aspect on screen (its canopy node's scale × its own), whatever the node's squash
  const aspect = () => page.evaluate(() => [...document.querySelectorAll('.glints[data-tree] .glint')].map((g) => {
    const m = new DOMMatrix(getComputedStyle(g.closest('.node')!).transform);
    const s = getComputedStyle(g).scale.split(' ').map(Number), sx = s[0] || 1, sy = s[1] ?? sx;
    return { squash: m.d / m.a, aspect: (m.d * sy) / (m.a * sx) };
  }));
  await expect.poll(async () => (await aspect()).length).toBeGreaterThan(0);
  for (const a of await aspect()) {
    expect(a.squash).toBeLessThan(0.9); // (the node is squashed: the camera looks down on the tree)
    expect(Math.abs(a.aspect - 1)).toBeLessThan(0.02);
  }
});

test('one source for screen ↔ world: at the default, zoomed in panned sideways and scrolled far, the tap areas sit on the 3D models, a ground tap walks where the camera says, and its ring is drawn once', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(`?${Q}&island=3d`);
  await ready(page);
  type Wd = { mine(): [number, number] };
  type W3x = W3 & { where(id: string): { x: number; y: number; z: number } | null; xRoom(): number; ground(cx: number, cy: number): { x: number; z: number } | null };
  const states: [string, (w: W3x) => void][] = [
    ['default', (w) => w.go(w.limits().min)],
    ['zoomed in, panned right', (w) => w.go(260, 1.6, 999)],
    ['zoomed in, panned left', (w) => w.go(420, 1.5, -999)],
    ['scrolled far', (w) => w.go(w.limits().max)]
  ];
  for (const [name, go] of states) {
    await page.evaluate(`(${go.toString()})(window.__world3d)`);
    await idle(page);
    // the rock and my villager: the 3D model's middle on screen falls in its DOM tap area, wherever it's on screen
    // (polled: the DOM island's nodes follow the camera in its next frame)
    const off = () => page.evaluate(() => {
      const w = (window as unknown as { __world3d: W3x; __world: Wd }).__world3d, W = (window as unknown as { __world: Wd }).__world;
      const out: string[] = [];
      const inBox = (name: string, el: Element | null, p: [number, number]) => {
        if (!el || p[0] < 0 || p[0] > innerWidth || p[1] < 60 || p[1] > innerHeight - 60) return;
        const r = el.getBoundingClientRect();
        if (p[0] < r.left - 4 || p[0] > r.right + 4 || p[1] < r.top - 4 || p[1] > r.bottom + 4) out.push(`${name} at ${p.map(Math.round)} not in ${[r.left, r.top, r.right, r.bottom].map(Math.round)}`);
      };
      const rock = w.where('rock');
      if (rock) inBox('rock', document.querySelector('[data-care="rock"] > span'), w.client(rock.x, -rock.z, 8));
      const [mx, mz] = W.mine();
      inBox('mine', document.querySelector('.actor[data-actor="mine"] .vil'), w.client(mx, mz, 30));
      return out;
    });
    await expect.poll(off, { message: name }).toEqual([]);
    // a tap on open lawn ahead: my villager sets off to the very ground the camera has under the finger
    const target = await page.evaluate(() => {
      const w = (window as unknown as { __world3d: W3x }).__world3d;
      // (off the middle's path: a tap on a path is no walk)
      for (const [cx, cy] of [[110, 520], [290, 500], [120, 430], [280, 600], [90, 600]] as const) {
        const g = w.ground(cx, cy);
        const el = document.elementFromPoint(cx, cy);
        if (g && el?.matches('.stage')) return { cx, cy, g };
      }
      return null;
    });
    if (!target) continue;
    // (the island at rest: no moment of the opening's under way, which would take my villager its own way)
    await expect.poll(() => page.evaluate(() => (window as unknown as { __world: { idle(): boolean } }).__world.idle()), { timeout: 20_000 }).toBe(true);
    const fx0 = await w3(page, (w) => (w as unknown as { stats(): { fx: number } }).stats().fx);
    await page.mouse.click(target.cx, target.cy);
    // its ring: the 3D island's, the DOM's hidden (its own animation once showed it through: two rings)
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('.tap-ring')].map((e) => +getComputedStyle(e).opacity)), { message: `${name}: the DOM's ring` }).toEqual([0]);
    expect(await w3(page, (w) => (w as unknown as { stats(): { fx: number } }).stats().fx)).toBeGreaterThan(fx0);
    // and my villager heads for the ground under the finger (the nav may snap it a little)
    await expect.poll(async () => {
      const [x, z] = await page.evaluate(() => (window as unknown as { __world: Wd }).__world.mine());
      return Math.hypot(x - target.g.x, z - target.g.z);
    }, { timeout: 8000, message: `${name}: walked to the tap` }).toBeLessThan(30);
  }
});
