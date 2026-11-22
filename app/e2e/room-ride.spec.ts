// Riding a room's pieces (docs/design.md "The gym"; seats3d.json `u`, poses-ride.ts the motion, tent/rideFx.ts what the
// piece does): a tap on a vehicle, a bike, the rocket, the helm, a board, a cart, the sandbox, the elephant slide, the
// plastic pool, the teacup ride, the carousel, a massage chair, a gaming chair, the tire toy and the playground gym walks
// my villager up to it and into its use (state via the test hooks): the rocket's rider hidden once in, the slide's carried
// up and down it, the pool soaked in low, the teacup turning with the wall clock (the same turn on the partner's phone,
// who sees the ride). WebKit taps, Chromium clicks. `SHOTS=<dir>` writes shot-<name>-<who>.png of every ride, my human
// player's and the guest's villager's, and a crop round the body.
import { expect, test, type Page } from './fixtures.ts';
import { roomUp } from './rooms.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00';

type V = { state: string; box: [number[], number[]]; at: number[]; head: number[] | null } | null;
type Ride = { ry: number; y: number; sy: number; w: number } | null;
type T = {
  loading(): number;
  fill(codes: string[], f?: number): number;
  pieces(): { id: string; item: string; x: number; z: number; f: number }[];
  px(x: number, z: number, y?: number): [number, number];
  seat(): { id: string; n: number; lie: boolean } | null;
  partnerSeat(): { id: string } | null;
  peer(): boolean;
  v3(w: string): V;
  use(id: string): { held: number; ajar: number; hidden: boolean; fade: number; ride: Ride } | null;
  hidden(w: string): boolean;
  orbit(a: number, p?: number): void;
  zoom(f: number): void;
  stats(): { frames: number };
};
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const rideOf = (page: Page, id: string) => page.evaluate((id) => (window as unknown as { __tent: T }).__tent.use(id)?.ride ?? null, id);

/** The tent with just these pieces, drawn with my villager in (as `who`). */
async function room(page: Page, codes: string[], who: 'A' | 'B' | 'G' = 'A', fresh = true) {
  if (fresh) await page.addInitScript(() => localStorage.getItem('ride-seeded') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('ride-seeded', '1')));
  await page.goto('tent' + Q + (who !== 'A' ? `&as=${who}` : ''));
  await roomUp(page, 'tent');
  if (codes.length) expect(await page.evaluate((c) => (window as unknown as { __tent: T }).__tent.fill(c, 0), codes)).toBe(codes.length);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0, null, { timeout: 30_000 });
  await expect.poll(() => page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), who), { timeout: 15_000 }).not.toBeNull();
  return tent(page, (t) => t.pieces());
}

/** The pieces' footprints (tiles, unturned: items.json, more.json). */
const SIZE: Record<string, [number, number]> = {
  f12606: [2, 2], f12600: [2, 2], f12602: [3, 2], f12603: [3, 2], f14049: [3, 2], f13621: [3, 2], f2614: [2, 1], f12311: [2, 1], f1441: [2, 1], f1444: [2, 1],
  f1447: [2, 2], f1116: [3, 2], f86: [2, 1], f3348: [2, 2], f3596: [3, 3], f1507: [3, 3], f12684: [3, 3], f12803: [2, 1], f3430: [2, 2], f8419: [2, 1]
};
/** A tap on a piece's middle at `y` up (the phone's touch on WebKit, a click on Chromium). */
async function tapPiece(page: Page, browserName: string, p: { x: number; z: number; item: string }, y: number) {
  const [w, d] = SIZE[p.item] ?? [1, 1];
  const [x, py] = await page.evaluate(([x, z, y]) => (window as unknown as { __tent: T }).__tent.px(x, z, y), [-40 + p.x * 10 + w * 5, -40 + p.z * 10 + d * 5, y] as const);
  if (browserName === 'webkit') await page.touchscreen.tap(x, py);
  else await page.mouse.click(x, py);
}
/** A tap that gets on it: my seat that piece, my villager in its use. */
async function ride(page: Page, browserName: string, p: { id: string; x: number; z: number; item: string }, y: number, use: string, who = 'A') {
  await tapPiece(page, browserName, p, y);
  await expect.poll(() => tent(page, (t) => t.seat()?.id ?? null), { timeout: 10_000 }).toBe(p.id);
  await expect.poll(() => page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w)?.state ?? null, who), { timeout: 10_000 }).toBe(use);
}
/** A spinning piece's turn as its clock has it (poses-ride.ts SPIN: a turn in `ms`). */
const turnAt = (w: number, ms: number) => ((w % ms) / ms) * 2 * Math.PI;
const near = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

/** One of each kind: its use, where on it a tap lands (up from the floor). */
const CASES = [
  ['f12606', 'tractor', 'drive', 6],
  ['f2614', 'mountain-bike', 'pedal', 0.2],
  ['f1441', 'rocket', 'board', 1],
  ['f1273', 'helm', 'steer', 6],
  ['f13523', 'skateboard', 'balance', 1],
  ['f1493', 'stroller', 'push', 5],
  ['f1116', 'sandbox', 'dig', 1],
  ['f86', 'elephant-slide', 'slide', 5],
  ['f3348', 'plastic-pool', 'soak', 3],
  ['f1507', 'teacup-ride', 'ride', 4],
  ['f12684', 'carousel', 'carousel', 6],
  ['f12338', 'massage-chair', 'massage', 4],
  ['f13519', 'gaming-chair', 'swivel', 5],
  ['f2329', 'tire-toy', 'bounce', 2],
  ['f3430', 'playground-gym', 'climb', 6]
] as const;

for (const [code, name, use, y] of CASES) {
  test(`a tap on the ${name} starts its ride (${use})`, async ({ page, browserName }) => {
    const [p] = await room(page, [code]);
    await ride(page, browserName, p, y, use);
    if (use === 'board') {
      // climbed in: hidden once inside
      await expect.poll(() => tent(page, (t) => t.hidden('A')), { timeout: 8000 }).toBe(true);
    }
    if (use === 'soak') {
      // in, low in the pool: under its rim (5.1)
      await expect.poll(async () => ((v) => v.box[0][1] + v.at[1])((await tent(page, (t) => t.v3('A')))!), { timeout: 5000 }).toBeLessThan(3);
    }
    if (use === 'slide') {
      // carried up its back and down its trunk over its round
      const ys: number[] = [];
      await expect.poll(async () => (ys.push((await tent(page, (t) => t.v3('A')))!.at[1]), Math.max(...ys) - Math.min(...ys)), { timeout: 15_000, intervals: [300] }).toBeGreaterThan(5);
    }
    if (use === 'ride' || use === 'swivel' || use === 'bounce' || use === 'drive') {
      // the piece itself moves while it's ridden: a turn, a swivel, a squash, a rumble
      const drawn = async () => ((r) => r && [r.ry, r.y, r.sy].map((n) => n.toFixed(4)).join())(await rideOf(page, p.id));
      await expect.poll(drawn, { timeout: 5000 }).not.toBeNull();
      const a = await drawn();
      await expect.poll(drawn, { timeout: 5000 }).not.toBe(a);
    }
    if (use === 'ride') {
      // the teacup's turn is the wall clock's (a turn in 9 s)
      const r = (await rideOf(page, p.id))!;
      expect(near(r.ry, turnAt(r.w, 9000))).toBeLessThan(1e-6);
    }
  });
}

test('the partner\'s phone sees the ride: B sees A in the teacup, turning as A\'s does; the rocket hides B on A\'s', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await a.addInitScript(() => localStorage.getItem('ride-seeded') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('ride-seeded', '1')));
  const ps = await room(a, ['f1507', 'f1441'], 'A', false);
  await room(b, [], 'B', false);
  await expect.poll(() => tent(b, (t) => t.pieces().length), { timeout: 6000 }).toBe(2);
  await expect.poll(() => Promise.all([a, b].map((p) => tent(p, (t) => t.peer()))), { timeout: 8000 }).toEqual([true, true]);
  const cup = ps.find((p) => p.item === 'f1507')!, rocket = ps.find((p) => p.item === 'f1441')!;
  await a.bringToFront();
  await ride(a, 'chromium', cup, 4, 'ride');
  await b.bringToFront();
  await expect.poll(() => tent(b, (t) => t.partnerSeat()?.id ?? null), { timeout: 6000 }).toBe(cup.id);
  await expect.poll(() => tent(b, (t) => t.v3('A')?.state ?? null), { timeout: 10_000 }).toBe('ride');
  // the same turn at the same moment on both: each the wall clock's
  await expect.poll(() => rideOf(b, cup.id), { timeout: 5000 }).not.toBeNull();
  for (const pg of [a, b]) {
    const r = (await rideOf(pg, cup.id))!;
    expect(near(r.ry, turnAt(r.w, 9000))).toBeLessThan(1e-6);
  }
  await ride(b, 'chromium', rocket, 1, 'board', 'B');
  await a.bringToFront();
  await expect.poll(() => tent(a, (t) => t.v3('B')?.state ?? null), { timeout: 10_000 }).toBe('board');
  await expect.poll(() => tent(a, (t) => t.hidden('B')), { timeout: 8000 }).toBe(true);
  await ctx.close();
});

// every ride, close in (SHOTS=<dir> only: not planned otherwise): my human player's (A) and a villager's (the guest's)
const SHOTS: [string, string, number][] = [
  ['f12606', 'drive-tractor', 0.5], ['f12600', 'drive-bulldozer', 0.4], ['f12602', 'drive-excavator', 0.4], ['f12603', 'drive-steamroller', 0.4],
  ['f14049', 'drive-truck', 0.4], ['f13621', 'drive-minicar', 0.4], ['f2614', 'pedal-mountain-bike', 0.4], ['f12311', 'pedal-cruiser', 0.4],
  ['f1441', 'board-rocket', 0], ['f1444', 'board-shuttle', 0], ['f1447', 'board-saucer', 0], ['f1273', 'steer-helm', 0.4],
  ['f13523', 'balance-skateboard', 0.4], ['f7868', 'balance-surfboard', 0.4], ['f1493', 'push-stroller', 0.4], ['f1133', 'push-shopping-cart', 0.3],
  ['f7229', 'push-handcart', 0.3], ['f13638', 'push-utility-wagon', 0.3], ['f13505', 'push-mining-car', 0.3], ['f8419', 'push-garden-wagon', 0.3],
  ['f1116', 'dig-sandbox', 0.4], ['f1117', 'dig-sandcastle', 0.4], ['f86', 'slide', 0.3], ['f3348', 'soak-plastic-pool', 0.4], ['f3596', 'soak-pool', 0.4],
  ['f1507', 'ride-teacup', 0.4], ['f12684', 'ride-carousel', 0.4], ['f12803', 'ride-train', 0.4], ['f12338', 'massage-retro', 0.3],
  ['f12339', 'massage-plush', 0.3], ['f13519', 'swivel-gaming', 0.3], ['f12599', 'swivel-office', 0.3], ['f2329', 'bounce-tire', 0.3], ['f3430', 'climb-playground', 0.5]
];
/** About `ms` on, by the room's own frames (a use's loop draws 12 a second at rest). */
const after = async (page: Page, ms: number) => {
  const f0 = await tent(page, (t) => t.stats().frames);
  await expect.poll(() => tent(page, (t) => t.stats().frames), { timeout: ms + 5000, intervals: [250] }).toBeGreaterThan(f0 + (ms * 12) / 1000);
};
if (process.env.SHOTS) for (const who of ['A', 'G'] as const) for (const [code, name, wait] of SHOTS) test(`shots: ${name}, ${who === 'A' ? 'a player' : 'a villager'}`, async ({ page, browserName }) => {
  const tag = `${name}-${who === 'A' ? 'player' : 'villager'}`;
  await page.goto('tent' + Q + `&as=${who}`);
  await roomUp(page, 'tent');
  expect(await page.evaluate((c) => (window as unknown as { __tent: T }).__tent.fill([c], 0), code)).toBe(1);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0, null, { timeout: 30_000 });
  await expect.poll(() => page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), who), { timeout: 15_000 }).not.toBeNull();
  const p = (await tent(page, (t) => t.pieces())).filter((q) => q.item === code).pop()!;
  await tapPiece(page, browserName, p, 0.2);
  await expect.poll(() => tent(page, (t) => t.seat()?.id ?? null), { timeout: 10_000 }).toBe(p.id);
  await after(page, 1500 + wait * 4000);
  const n = await page.evaluate(() => {
    const t = (window as unknown as { __tent: T }).__tent;
    t.orbit(0.45, -0.1);
    t.zoom(2.6);
    return t.stats().frames;
  });
  await roomUp(page, 'tent', { frames: n + 3 });
  await page.screenshot({ path: `${process.env.SHOTS}/shot-${tag}.png` });
  // (and close round the body, to look for clipping)
  const v = (await page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), who))!;
  const [cx, cy] = await page.evaluate(([x, z, y]) => (window as unknown as { __tent: T }).__tent.px(x, z, y), [v.at[0], v.at[2], v.at[1] + 7] as const);
  const clip = { x: Math.max(0, Math.min(393 - 200, cx - 100)), y: Math.max(0, Math.min(852 - 220, cy - 110)), width: 200, height: 220 };
  await page.screenshot({ path: `${process.env.SHOTS}/crop-${tag}.png`, clip });
});
