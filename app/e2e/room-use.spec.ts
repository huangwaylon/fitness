// Using a room's pieces (docs/design.md "The gym"; seats3d.json `u`, poses.ts the motion, tent/uses.ts what the piece
// does): a tap on the treadmill, a yoga mat, an exercise mat (a rug), the climbing wall, a bathtub, the bathroom stall, the
// barbell and the weight bench walks my villager up to it and on, into its use (state via the test hooks): the treadmill
// runs, the mats cycle their yoga poses, the wall is climbed up and down, the tub soaked in low behind its rim, the
// stall's door swings open and shut and hides who's in, the barbell comes up into the hands, the bench's barbell off its
// rack. The partner's phone shows the use too. WebKit taps, Chromium clicks. `SHOTS=<dir>` writes shot-<use>-<who>.png of
// every use, my human player's and the partner's villager's.
import { expect, test, type Page } from './fixtures.ts';
import { roomUp } from './rooms.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00';

type V = { state: string; box: [number[], number[]]; at: number[]; head: number[] | null } | null;
type T = {
  loading(): number;
  fill(codes: string[], f?: number): number;
  pieces(): { id: string; item: string; x: number; z: number; f: number }[];
  px(x: number, z: number, y?: number): [number, number];
  seat(): { id: string; n: number; lie: boolean } | null;
  partnerSeat(): { id: string } | null;
  peer(): boolean;
  v3(w: string): V;
  model(w: string): string | null;
  use(id: string): { held: number; ajar: number; hidden: boolean; fade: number } | null;
  hidden(w: string): boolean;
  orbit(a: number, p?: number): void;
  zoom(f: number): void;
  stats(): { frames: number };
};
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;

/** The tent with just these pieces, facing us, drawn with my villager in (as `who`). */
async function room(page: Page, codes: string[], who: 'A' | 'B' = 'A', fresh = true) {
  if (fresh) await page.addInitScript(() => localStorage.getItem('use-seeded') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('use-seeded', '1')));
  await page.goto('tent' + Q + (who === 'B' ? '&as=B' : ''));
  await roomUp(page, 'tent');
  if (codes.length) expect(await page.evaluate((c) => (window as unknown as { __tent: T }).__tent.fill(c, 0), codes)).toBe(codes.length);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  await expect.poll(() => tent(page, (t) => t.v3('A')), { timeout: 15_000 }).not.toBeNull();
  return tent(page, (t) => t.pieces());
}

/** A tap on a piece's middle at `y` up (the phone's touch on WebKit, a click on Chromium). */
async function tapPiece(page: Page, browserName: string, p: { x: number; z: number; item: string }, y: number) {
  const [w, d] = SIZE[p.item] ?? [1, 1];
  const [x, py] = await page.evaluate(([x, z, y]) => (window as unknown as { __tent: T }).__tent.px(x, z, y), [-40 + p.x * 10 + w * 5, -40 + p.z * 10 + d * 5, y] as const);
  if (browserName === 'webkit') await page.touchscreen.tap(x, py);
  else await page.mouse.click(x, py);
}
/** The pieces' footprints (tiles, unturned: items.json). */
const SIZE: Record<string, [number, number]> = { f290: [2, 1], f13683: [2, 1], f12386: [3, 2], f4006: [2, 1], f1757: [2, 1], f1235: [1, 1], f4078: [2, 1], f1452: [2, 1], f7535: [1, 1], f13293: [1, 1], f287: [1, 1], f1598: [1, 1], f4013: [1, 1], f7653: [1, 1], f7845: [1, 1], f4008: [2, 2], f3819: [1, 1], f14554: [2, 2] };

/** Each piece: its use, where on it a tap lands (up from the floor), what to check of it once in use. */
const CASES = [
  ['f290', 'treadmill', 'run', 1.5],
  ['f13683', 'yoga-mat', 'yoga', 0.3],
  ['f12386', 'exercise-mat', 'yoga', 0.1],
  ['f4006', 'climbing-wall', 'climb', 12],
  ['f1757', 'claw-foot-tub', 'soak', 5],
  ['f1235', 'bathroom-stall', 'stall', 9],
  ['f4078', 'barbell', 'curl', 3],
  ['f1452', 'weight-bench', 'press', 4]
] as const;

for (const [code, name, use, y] of CASES) {
  test(`a tap on the ${name} starts its use (${use})`, async ({ page, browserName }) => {
    const [p] = await room(page, [code]);
    await tapPiece(page, browserName, p, y);
    await expect.poll(() => tent(page, (t) => t.seat()?.id ?? null), { timeout: 10_000 }).toBe(p.id);
    await expect.poll(() => tent(page, (t) => t.v3('A')?.state ?? null), { timeout: 10_000 }).toBe(use);
    if (use === 'soak') {
      // in, low in the tub: the body's bottom on its inner floor (2.1 up), under the rim (8.4)
      await expect.poll(async () => ((v) => v.box[0][1] + v.at[1])((await tent(page, (t) => t.v3('A')))!), { timeout: 5000 }).toBeLessThan(4);
    }
    if (use === 'climb') {
      // up the wall's face over time
      const ys: number[] = [];
      await expect.poll(async () => (ys.push((await tent(page, (t) => t.v3('A')))!.box[0][1]), Math.max(...ys) - Math.min(...ys)), { timeout: 15_000, intervals: [400] }).toBeGreaterThan(2);
    }
    if (use === 'stall') {
      // the door swings open as it goes in, shuts behind; then it's hidden in there
      await expect.poll(() => tent(page, (t) => t.hidden('A')), { timeout: 8000 }).toBe(true);
      expect(await page.evaluate((id) => (window as unknown as { __tent: T }).__tent.use(id)?.ajar ?? 0, p.id)).toBe(0);
    }
    if (use === 'curl' || use === 'press') {
      // the barbell (the piece itself; the bench's: NH's barbell for its small bar) up into the hands
      await expect.poll(() => page.evaluate((id) => (window as unknown as { __tent: T }).__tent.use(id)?.held ?? 0, p.id), { timeout: 8000 }).toBe(1);
    }
  });
}

test('the partner\'s phone shows the use: B sees A run on the treadmill, A sees B soak in the tub', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await a.addInitScript(() => localStorage.getItem('use-seeded') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('use-seeded', '1')));
  const ps = await room(a, ['f290', 'f1757'], 'A', false);
  await room(b, [], 'B', false);
  await expect.poll(() => tent(b, (t) => t.pieces().length), { timeout: 6000 }).toBe(2);
  await expect.poll(() => Promise.all([a, b].map((p) => tent(p, (t) => t.peer()))), { timeout: 8000 }).toEqual([true, true]);
  const tread = ps.find((p) => p.item === 'f290')!, tub = ps.find((p) => p.item === 'f1757')!;
  await a.bringToFront();
  await tapPiece(a, 'chromium', tread, 5);
  await expect.poll(() => tent(a, (t) => t.v3('A')?.state ?? null), { timeout: 10_000 }).toBe('run');
  await b.bringToFront();
  await expect.poll(() => tent(b, (t) => t.partnerSeat()?.id ?? null), { timeout: 6000 }).toBe(tread.id);
  await expect.poll(() => tent(b, (t) => t.v3('A')?.state ?? null), { timeout: 10_000 }).toBe('run');
  await tapPiece(b, 'chromium', tub, 5);
  await expect.poll(() => tent(b, (t) => t.v3('B')?.state ?? null), { timeout: 10_000 }).toBe('soak');
  await a.bringToFront();
  await expect.poll(() => tent(a, (t) => t.v3('B')?.state ?? null), { timeout: 10_000 }).toBe('soak');
  await ctx.close();
});

// every use, close in (SHOTS=<dir> only: not planned otherwise): my human player's (A) and a villager's (the guest's)
const SHOTS: [string, string, number, number][] = [
  ['f290', 'run', 1.5, 0.5], ['f287', 'pedal', 8, 0.6], ['f1598', 'bounce', 4, 0.4], ['f4013', 'punch', 10, 0.5], ['f7653', 'punch-speed', 10, 0.5],
  ['f7845', 'pullup', 12, 0.5], ['f1452', 'press', 4, 0.6], ['f4078', 'curl', 3, 0.4], ['f7535', 'swing', 3, 0.4], ['f13293', 'ring', 4, 0.4],
  ['f13683', 'yoga', 0.3, 0.4], ['f4006', 'climb', 12, 0.3], ['f1757', 'soak', 5, 0.5], ['f4008', 'soak-kettle', 5, 0.5], ['f3819', 'soak-barrel', 8, 0.4],
  ['f14554', 'soak-yuzu', 5, 0.5], ['f1235', 'stall', 9, 0.5]
];
/** About `ms` on, by the room's own frames (a use's loop draws 12 a second at rest). */
const after = async (page: Page, ms: number) => {
  const f0 = await tent(page, (t) => t.stats().frames);
  await expect.poll(() => tent(page, (t) => t.stats().frames), { timeout: ms + 5000, intervals: [250] }).toBeGreaterThan(f0 + (ms * 12) / 1000);
};
if (process.env.SHOTS) for (const who of ['A', 'G'] as const) for (const [code, name, , wait] of SHOTS) test(`shots: ${name}, ${who === 'A' ? 'a player' : 'a villager'}`, async ({ page, browserName }) => {
  const tag = `${name}-${who === 'A' ? 'player' : 'villager'}`;
  await page.goto('tent' + Q + `&as=${who}`);
  await roomUp(page, 'tent');
  expect(await page.evaluate((c) => (window as unknown as { __tent: T }).__tent.fill([c], 0), code)).toBe(1);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  await expect.poll(() => page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), who), { timeout: 15_000 }).not.toBeNull();
  const p = (await tent(page, (t) => t.pieces())).filter((q) => q.item === code).pop()!;
  // (its own floor tile's middle: the piece, whatever's open there)
  await tapPiece(page, browserName, p, 0.2);
  await expect.poll(() => tent(page, (t) => t.seat()?.id ?? null), { timeout: 10_000 }).toBe(p.id);
  await after(page, 1500 + wait * 4000);
  const n = await page.evaluate((name) => {
    const t = (window as unknown as { __tent: T }).__tent;
    t.orbit(name === 'climb' || name === 'run' || name === 'pedal' ? 0.5 : 0.35, -0.1);
    t.zoom(3.2);
    return t.stats().frames;
  }, name);
  await roomUp(page, 'tent', { frames: n + 3 });
  await page.screenshot({ path: `${process.env.SHOTS}/shot-${tag}.png` });
  // (and close round the body, to look for clipping; the yoga's four poses, one a hold and its fade apart)
  const v = (await page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), who))!;
  const [cx, cy] = await page.evaluate(([x, z, y]) => (window as unknown as { __tent: T }).__tent.px(x, z, y), [v.at[0], v.at[2], v.at[1] + 7] as const);
  const clip = { x: Math.max(0, Math.min(393 - 200, cx - 100)), y: Math.max(0, Math.min(852 - 220, cy - 110)), width: 200, height: 220 };
  await page.screenshot({ path: `${process.env.SHOTS}/crop-${tag}.png`, clip });
  if (name === 'yoga') for (let i = 1; i <= 3; i++) {
    await after(page, 5300);
    await page.screenshot({ path: `${process.env.SHOTS}/crop-${name}${i}-${who === 'A' ? 'player' : 'villager'}.png`, clip });
  }
});
