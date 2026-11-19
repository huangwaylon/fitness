// The 3D pick (world3d/pick3d.ts, behind `?pick3d=1`; the R4 plan's step 5) held to the DOM island's (island/probe.ts,
// the oracle): over a grid of points, what a tap goes to by the 3D tap areas is what the DOM's says, and each thing's
// box is the DOM's, a few px's slack at the edges. Agreed differences, each with its reason, are let be (AGREED).
import { expect, test, type Page } from './fixtures.ts';
import { is3d, quiet, stageCam } from './island.ts';

type Ref = { kind: string; id: string } | null;
type Box = { left: number; top: number; width: number; height: number };
type W3 = { pick(x: number, y: number): Ref; pickDom(x: number, y: number): Ref; box(k: string, id: string): Box | null; boxDom(k: string, id: string): Box | null };

/** Px a tap may move for the two to agree: the 3D pick's own slop (pick3d.ts SLOP: 2 px and a px of a scaled node's,
 *  up to ~6 px zoomed in, where WebKit hit-tests the DOM's area past its box) and a rounded corner's curve. */
const SLACK = 7;

/** Each grid point where the 3D pick and the DOM's disagree (neither's answer found by the other within SLACK px of
 *  it), by `dom/3d` kinds; and how many points were something. */
const compare = (page: Page) =>
  page.evaluate((slack) => {
    const w = (window as unknown as { __world3d: W3 }).__world3d;
    const key = (r: Ref) => (r ? `${r.kind}:${r.id}` : 'none');
    const round = (f: (x: number, y: number) => Ref, x: number, y: number) =>
      new Set([[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]].map(([dx, dy]) => key(f(x + dx * slack, y + dy * slack))));
    const out: Record<string, string[]> = {};
    let hits = 0;
    for (let y = 4; y < innerHeight; y += 12)
      for (let x = 4; x < innerWidth; x += 12) {
        const dom = w.pickDom(x, y), p3 = w.pick(x, y);
        if (dom || p3) hits++;
        if (key(dom) === key(p3)) continue;
        // (within the slack of the other's answer: an edge)
        if (round((a, b) => w.pick(a, b), x, y).has(key(dom)) || round((a, b) => w.pickDom(a, b), x, y).has(key(p3))) continue;
        // (agreed: a flower's tap target a true 44 px on screen either way, where the DOM's ring follows its node's
        // squash and is ~36–40 px tall: the 3D's flower reaches past it, over the ground or the scenery behind it)
        if (p3?.kind === 'flower' && (!dom || ['flower', 'tree', 'bush', 'campfire', 'sit', 'fixture'].includes(dom.kind))) continue;
        (out[`${dom?.kind ?? 'none'}/${p3?.kind ?? 'none'}`] ??= []).push(`${x},${y} ${key(dom)} ${key(p3)}`);
      }
    return { out, hits };
  }, SLACK);

/** Each thing's box (the 3D's against the DOM's), off by more than SLACK on a side. */
const boxes = (page: Page, things: readonly (readonly [string, string])[]) =>
  page.evaluate(
    ({ things, slack }) => {
      const w = (window as unknown as { __world3d: W3 }).__world3d, out: string[] = [];
      for (const [k, id] of things) {
        const a = w.boxDom(k, id), b = w.box(k, id);
        // (one side only: real where that side's own pick at its middle finds it; a hidden node keeps its last box)
        const real = (x: Box | null, p: (x: number, y: number) => Ref) => !!x && ((r) => r?.kind === k && r.id === id)(p(x.left + x.width / 2, x.top + x.height * 0.75));
        if (!a || !b) {
          if (real(a, (x, y) => w.pickDom(x, y)) || real(b, (x, y) => w.pick(x, y))) out.push(`${k}:${id} dom ${JSON.stringify(a)} 3d ${JSON.stringify(b)}`);
          continue;
        }
        const off = Math.max(Math.abs(a.left - b.left), Math.abs(a.top - b.top), Math.abs(a.left + a.width - b.left - b.width), Math.abs(a.top + a.height - b.top - b.height));
        if (off > slack) out.push(`${k}:${id} dom ${JSON.stringify(a)} 3d ${JSON.stringify(b)}`);
      }
      return out;
    },
    { things, slack: SLACK }
  );

/** The things whose boxes are compared, where they're in view. */
const THINGS = [['villager', 'mine'], ['villager', 'partner'], ['villager', 'third'], ['goal', 'A'], ['goal', 'B'], ['row', 'A'], ['row', 'B'], ['trunk', 'A'], ['trunk', 'B'], ['building', 'campsite'], ['building', 'museum'], ['building', 'shop'], ['board', ''], ['tree', 'palm-3']] as const;

/** A camera: its z ('far': the far stop), zoom and x (centred when undefined). */
type View = readonly [number | 'stage' | 'far', number, number?];
const NEAR: readonly View[] = [['stage', 1], [300, 1], [700, 1]];
const FAR: readonly View[] = [['far', 1], ['far', 3, 120], ['far', 3, 225], ['far', 3, 330]];

for (const [name, q, views] of [
  ['noon: a visitor, villagers, trees, doors', '?demo&date=2026-11-04T12:00&visitor=redd&awake', NEAR],
  ['spring morning, zoomed in', '?demo&date=2026-04-10T10:00&awake', [['stage', 1.8], [300, 1.8, 120], [700, 2.4, 300]]],
  ['a winter night: the campfire, snowy bushes', '?demo&date=2026-12-20T20:30&awake', NEAR],
  ['the far stop, zoomed in along the back beach', '?demo&date=2026-11-04T12:00&awake', FAR]
] as const satisfies readonly (readonly [string, string, readonly View[]])[])
  test(`the 3D pick agrees with the DOM island's over the screen (${name})`, async ({ page }) => {
    await page.goto(`${q}&pick3d=1`);
    expect(await is3d(page)).toBe(true);
    await quiet(page);
    for (const [z, k, x] of views) {
      const cz = z === 'stage' ? await stageCam(page) : z;
      await page.evaluate(([z, k, x]) => {
        const w = (window as unknown as { __world3d: { go(z: number, k?: number, x?: number): void; limits(): { max: number } } }).__world3d;
        w.go(z === 'far' ? w.limits().max : (z as number), k, x ?? undefined);
      }, [cz, k, x ?? null] as const);
      await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { camStill(): boolean } }).__world3d.camStill())).toBe(true);
      const { out, hits } = await compare(page);
      const bx = await boxes(page, THINGS);
      if (Object.keys(out).length || bx.length) console.log(z, k, x, JSON.stringify(out, null, 1), bx);
      expect(Object.keys(out)).toEqual([]);
      expect(hits, 'something to tap on screen').toBeGreaterThan(20);
      expect(bx).toEqual([]);
    }
  });
