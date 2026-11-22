// The yoga mat's flows and the kettlebell's swing in a room (villager3d/yoga.ts, poses.ts swing; docs/design.md "The
// gym"): a tap on the mat starts the yoga and its pose moves on through the flow (a key pose apart, the head somewhere
// else); a tap on the kettlebell starts the swing, the bell held, the head low at the bottom and up at the top. The
// loop's clock held at a key time (__tent.loopAt) for each. WebKit taps, Chromium clicks.
// `SHOTS=<dir>`: contact sheets of every flow's key poses (the room's camera and from the side) and the swing's bottom
// and top, for my human player (A) and a villager (the guest, G): <dir>/shot-yoga-<flow>-<who>.png, shot-swing-<who>.png.
import { expect, test, type Page } from './fixtures.ts';
import { roomUp } from './rooms.ts';
import { FLOW_NAMES, keyTimes, type FlowName } from '../src/lib/components/villager3d/yoga.ts';
import { REP_MS } from '../src/lib/components/villager3d/poses.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00';

type V = { state: string; box: [number[], number[]]; at: number[]; head: number[] | null } | null;
type T = {
  loading(): number;
  fill(codes: string[], f?: number): number;
  pieces(): { id: string; item: string; x: number; z: number }[];
  px(x: number, z: number, y?: number): [number, number];
  seat(): { id: string } | null;
  v3(w: string): V;
  use(id: string): { held: number } | null;
  loop(): number;
  loopAt(ms: number | null): void;
  orbit(a: number, p?: number): void;
  zoom(f: number): void;
  stats(): { frames: number };
};
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const SIZE: Record<string, [number, number]> = { f13683: [2, 1], f7535: [1, 1] };
/** The person seed the room gives `who` (tent/engine.ts: its letter's code × 0.7): its yoga flow's. */
const seedOf = (who: string) => who.charCodeAt(0) * 0.7;

/** The tent with just `code` in it, my villager (`who`) walked onto it by a tap and in its use. */
async function onto(page: Page, browserName: string, code: string, use: string, who: 'A' | 'G' = 'A') {
  await page.goto('tent' + Q + `&as=${who}`);
  await roomUp(page, 'tent');
  expect(await page.evaluate((c) => (window as unknown as { __tent: T }).__tent.fill([c], 0), code)).toBe(1);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  await expect.poll(() => page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), who), { timeout: 15_000 }).not.toBeNull();
  const p = (await tent(page, (t) => t.pieces())).find((q) => q.item === code)!;
  const [w, d] = SIZE[code];
  const [x, y] = await page.evaluate(([x, z]) => (window as unknown as { __tent: T }).__tent.px(x, z, 0.2), [-40 + p.x * 10 + w * 5, -40 + p.z * 10 + d * 5] as const);
  if (browserName === 'webkit') await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  await expect.poll(() => tent(page, (t) => t.seat()?.id ?? null), { timeout: 10_000 }).toBe(p.id);
  await expect.poll(() => page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w)?.state ?? null, who), { timeout: 10_000 }).toBe(use);
  return p;
}
/** `n` more of the room's frames drawn. */
const frames = async (page: Page, n = 3) => {
  const f0 = await tent(page, (t) => t.stats().frames);
  await roomUp(page, 'tent', { frames: f0 + n });
};
/** The loop held at `ms`, a few frames drawn (past the getting-on's fade), `who`'s villager then. */
async function at(page: Page, ms: number, who = 'A') {
  await page.evaluate((ms) => (window as unknown as { __tent: T }).__tent.loopAt(ms), ms);
  await frames(page, 4);
  return (await page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), who))!;
}

test('the yoga mat: the pose flows on, from one key pose to the next', async ({ page, browserName }) => {
  await onto(page, browserName, 'f13683', 'yoga');
  // past the getting-on (its fade), then the sun salutation's mountain, its dog and its plank, held in turn
  const now = await tent(page, (t) => t.loop());
  const k = keyTimes('sun', seedOf('A'), now);
  const pose = (a: string) => k.find((x) => x.a === a)!.t;
  const m = await at(page, pose('mountain')), d = await at(page, pose('dog')), pl = await at(page, pose('plank'));
  // the head comes down from standing in the dog and the plank, and the body's box is longer along the mat
  expect(d.head![1]).toBeLessThan(m.head![1] - 2);
  expect(pl.head![1]).toBeLessThan(m.head![1] - 2);
  const span = (v: NonNullable<V>) => Math.max(v.box[1][0] - v.box[0][0], v.box[1][2] - v.box[0][2]);
  expect(span(d)).toBeGreaterThan(span(m) + 2);
  // and on its own clock it moves on (no key pose held forever)
  await page.evaluate(() => (window as unknown as { __tent: T }).__tent.loopAt(null));
  const heads: number[][] = [];
  await expect.poll(async () => (heads.push((await tent(page, (t) => t.v3('A')))!.head!), Math.max(...heads.map((h) => h[1])) - Math.min(...heads.map((h) => h[1])) + Math.max(...heads.map((h) => h[0])) - Math.min(...heads.map((h) => h[0]))), { timeout: 20_000, intervals: [500] }).toBeGreaterThan(0.5);
});

test('the kettlebell: swung up to the chest and back between the legs, held in both hands', async ({ page, browserName }) => {
  const p = await onto(page, browserName, 'f7535', 'swing');
  await expect.poll(() => page.evaluate((id) => (window as unknown as { __tent: T }).__tent.use(id)?.held ?? 0, p.id), { timeout: 8000 }).toBe(1);
  const t0 = Math.ceil((await tent(page, (t) => t.loop())) / REP_MS.swing + 2) * REP_MS.swing;
  // (the seed's shift: tent/engine.ts's, poses.ts cyc's 137 ms a unit)
  const shift = seedOf('A') * 137;
  const low = await at(page, t0 - shift), top = await at(page, t0 - shift + 0.43 * REP_MS.swing);
  expect(top.head![1]).toBeGreaterThan(low.head![1] + 1);
});

// ---- the shots (SHOTS=<dir>) ----------------------------------------------------------------------------------------

/** A contact sheet written to `path`: a cell a key pose (the room's camera over the side's), `cols` to a row. */
async function sheet(page: Page, title: string, cells: { name: string; front: string; side: string }[], path: string, cols = 6) {
  const html = `<body style="margin:0;background:#ddd;font:13px sans-serif"><div style="padding:4px">${title} (top: the room's camera; under: from the side)</div><div style="display:grid;grid-template-columns:repeat(${cols},170px);gap:3px">${cells.map((c) => `<figure style="margin:0"><img src="${c.front}" width="170"><img src="${c.side}" width="170"><figcaption>${c.name}</figcaption></figure>`).join('')}</div></body>`;
  const p2 = await page.context().newPage();
  await p2.setViewportSize({ width: cols * 173 + 4, height: 400 });
  await p2.setContent(html);
  await p2.screenshot({ path, fullPage: true });
  await p2.close();
}
/** A crop round `who` (from the room's camera as it is), as a data URL. */
async function crop(page: Page, who: string) {
  const v = (await page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), who))!;
  const [cx, cy] = await page.evaluate(([x, z, y]) => (window as unknown as { __tent: T }).__tent.px(x, z, y), [v.at[0], v.at[2], v.at[1] + 6] as const);
  const clip = { x: Math.max(0, Math.min(393 - 170, cx - 85)), y: Math.max(0, Math.min(852 - 190, cy - 100)), width: 170, height: 190 };
  return 'data:image/png;base64,' + (await page.screenshot({ clip })).toString('base64');
}
const SIDE = Math.PI / 2;

if (process.env.SHOTS) for (const who of ['A', 'G'] as const) {
  const tag = who === 'A' ? 'player' : 'villager';
  for (const flow of FLOW_NAMES) test(`shots: yoga ${flow}, ${tag}`, async ({ page, browserName }) => {
    await onto(page, browserName, 'f13683', 'yoga', who);
    await tent(page, (t) => t.zoom(1.7));
    const now = await tent(page, (t) => t.loop());
    const keys = keyTimes(flow as FlowName, seedOf(who), now + 3000).filter((k, i, a) => a.findIndex((x) => x.a === k.a && x.side === k.side) === i);
    const front: string[] = [], side: string[] = [];
    for (const k of keys) {
      await at(page, k.t, who);
      front.push(await crop(page, who));
      await page.evaluate((a) => (window as unknown as { __tent: T }).__tent.orbit(a, -0.45), SIDE);
      await frames(page, 12);
      side.push(await crop(page, who));
      await page.evaluate((a) => (window as unknown as { __tent: T }).__tent.orbit(a, 0.45), -SIDE);
    }
    await sheet(page, `yoga: ${flow}, ${tag}`, keys.map((k, i) => ({ name: k.a + (k.side ? (k.side > 0 ? ' R' : ' L') : ''), front: front[i], side: side[i] })), `${process.env.SHOTS}/shot-yoga-${flow}-${tag}.png`);
  });
  test(`shots: swing, ${tag}`, async ({ page, browserName }) => {
    await onto(page, browserName, 'f7535', 'swing', who);
    await tent(page, (t) => t.zoom(1.7));
    const t0 = Math.ceil((await tent(page, (t) => t.loop())) / REP_MS.swing + 2) * REP_MS.swing - seedOf(who) * 137;
    const ks = [0, 0.15, 0.3, 0.43, 0.6, 0.75, 0.9];
    const front: string[] = [], side: string[] = [];
    for (const k of ks) {
      await at(page, t0 + k * REP_MS.swing, who);
      front.push(await crop(page, who));
      await page.evaluate((a) => (window as unknown as { __tent: T }).__tent.orbit(a, -0.45), SIDE);
      await frames(page, 12);
      side.push(await crop(page, who));
      await page.evaluate((a) => (window as unknown as { __tent: T }).__tent.orbit(a, 0.45), -SIDE);
    }
    await sheet(page, `kettlebell swing, ${tag}`, ks.map((k, i) => ({ name: k === 0 ? 'bottom (between the legs)' : k === 0.43 ? 'top (the float)' : `${k} of the rep`, front: front[i], side: side[i] })), `${process.env.SHOTS}/shot-swing-${tag}.png`, 7);
  });
}
