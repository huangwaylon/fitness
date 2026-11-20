// The 3D pick (world3d/pick3d.ts: the canvas router's): over a grid of points in several scenes (zoomed in, at night, at
// the far stop), every point the tap areas give a thing lies in that thing's box, and the scene's own chain (SceneTaps
// claims: a figure before the scenery and the ground) finds each figure on screen; a figure in front takes its body's
// taps, the stage never scrolls off the canvas, and the helpers aim where the router gives a thing. The DOM island it was
// held to till R4 step 8 is gone (step 9: no oracle left), so its checks are its own.
import { expect, test, type Page } from './fixtures.ts';
import { is3d, pointOn, quiet, stageCam } from './island.ts';

type Ref = { kind: string; id: string } | null;
type Box = { left: number; top: number; width: number; height: number };
type W3 = { pick(x: number, y: number): Ref; claim(x: number, y: number): Ref; box(k: string, id: string): Box | null };

/** Each grid point the tap areas give a thing that lies outside that thing's box (past the pick's own slop: pick3d.ts
 *  SLOP, 2 px), and how many points were a tap area's. */
const outside = (page: Page) =>
  page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, out: string[] = [];
    let hits = 0;
    for (let y = 4; y < innerHeight; y += 12)
      for (let x = 4; x < innerWidth; x += 12) {
        const p = w.pick(x, y);
        if (!p || p.kind === 'ui' || p.kind === 'talk') continue;
        hits++;
        const b = w.box(p.kind, p.id);
        if (!b || x < b.left - 2 || x > b.left + b.width + 2 || y < b.top - 2 || y > b.top + b.height + 2) out.push(`${x},${y} ${p.kind}:${p.id} ${JSON.stringify(b)}`);
      }
    return { out, hits };
  });

/** How many grid points the scene's chain gives each kind. */
const claimed = (page: Page) =>
  page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, kinds: Record<string, number> = {};
    for (let y = 4; y < innerHeight; y += 12)
      for (let x = 4; x < innerWidth; x += 12) {
        const c = w.claim(x, y);
        if (c) kinds[c.kind] = (kinds[c.kind] ?? 0) + 1;
      }
    return kinds;
  });

/** A camera: its z ('far': the far stop), zoom and x (centred when undefined). */
type View = readonly [number | 'stage' | 'far', number, number?];
const NEAR: readonly View[] = [['stage', 1], [300, 1], [700, 1]];
const FAR: readonly View[] = [['far', 1], ['far', 3, 120], ['far', 3, 225], ['far', 3, 330]];
const look = async (page: Page, [z, k, x]: View) => {
  const cz = z === 'stage' ? await stageCam(page) : z;
  await page.evaluate(([z, k, x]) => {
    const w = (window as unknown as { __world3d: { go(z: number, k?: number, x?: number): void; limits(): { max: number } } }).__world3d;
    w.go(z === 'far' ? w.limits().max : (z as number), k, x ?? undefined);
  }, [cz, k, x ?? null] as const);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { camStill(): boolean } }).__world3d.camStill())).toBe(true);
};

for (const [name, q, views] of [
  ['noon: a visitor, villagers, trees, doors', '?demo&date=2026-11-04T12:00&visitor=redd&awake', NEAR],
  ['spring morning, zoomed in', '?demo&date=2026-04-10T10:00&awake', [['stage', 1.8], [300, 1.8, 120], [700, 2.4, 300]]],
  ['a winter night: the campfire, snowy bushes', '?demo&date=2026-12-20T20:30&awake', NEAR],
  ['the far stop, zoomed in along the back beach', '?demo&date=2026-11-04T12:00&awake', FAR]
] as const satisfies readonly (readonly [string, string, readonly View[]])[])
  test(`every point the 3D pick gives a thing is in its box (${name})`, async ({ page }) => {
    await page.goto(q);
    expect(await is3d(page)).toBe(true);
    await quiet(page);
    for (const v of views) {
      await look(page, v);
      const { out, hits } = await outside(page);
      if (out.length) console.log(v, out);
      expect(out).toEqual([]);
      expect(hits, 'something to tap on screen').toBeGreaterThan(20);
    }
  });

/** The figures' scenes, and what the chain must find on screen in each (a kind: at least that many grid points). */
const FIGURES: readonly (readonly [string, string, readonly View[], Record<string, number>])[] = [
  ['a visitor, K.K., the tape deck, the finds and weeds', '?demo&date=2026-11-04T12:00&visitor=redd&awake', NEAR, { visitor: 4 }],
  ['a birthday: the cake', '?demo&date=2026-10-06T12:00&awake', [['stage', 1], ['stage', 2]], { cake: 4 }],
  ['a butterfly', '?demo&date=2026-11-04T12:00&awake&critter=common-butterfly', [['stage', 1], ['stage', 2]], { critter: 2 }],
  ['a fish in the sea, the beach', '?demo&date=2026-11-04T12:00&awake&critter=fish', FAR, { fish: 20 }],
  ['Gulliver washed up', '?demo&date=2026-11-04T09:00&visitor=gulliver&awake', [...NEAR, ...FAR], { visitor: 2 }]
];
for (const [name, q, views, want] of FIGURES)
  test(`the scene's chain finds the figures on the 3D boxes (${name})`, async ({ page }) => {
    await page.goto(q);
    expect(await is3d(page)).toBe(true);
    await quiet(page);
    const seen: Record<string, number> = {};
    for (const v of views) {
      await look(page, v);
      for (const [kd, n] of Object.entries(await claimed(page))) seen[kd] = (seen[kd] ?? 0) + n;
    }
    for (const [kd, n] of Object.entries(want)) expect(seen[kd] ?? 0, `${kd} on screen`).toBeGreaterThanOrEqual(n);
  });

// A figure lying in front of the island's fixtures (Gulliver washed up on the beach, the board and the day's finds up
// the sand behind him): every point of his body is his (the chain's figure layer before the tap areas behind), and the
// world layer can't be scrolled off the canvas under it (a balloon's focus or scrollIntoView scrolled the stage 46 px:
// the router's 3D boxes and the DOM's then disagreed, dialogue.spec's tap after his introduction found a find instead).
test('a figure lying in front of the fixtures takes every tap on his body; the stage never scrolls off the 3D canvas', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&visitor=gulliver');
  expect(await is3d(page)).toBe(true);
  await quiet(page);
  const read = () => page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d, g = w.box('visitor', 'gulliver')!, miss: string[] = [];
    for (let y = g.top + 3; y < g.top + g.height - 3; y += 4)
      for (let x = g.left + 3; x < g.left + g.width - 3; x += 4) {
        const c = w.claim(x, y);
        if (c?.kind !== 'visitor') miss.push(`${Math.round(x)},${Math.round(y)} ${c?.kind ?? w.pick(x, y)?.kind ?? 'none'}`);
      }
    return { lying: g.width > g.height, miss };
  });
  expect(await read()).toEqual({ lying: true, miss: [] });
  const scrolled = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('.stage')!;
    stage.scrollLeft = 46;
    stage.scrollTop = 30;
    const end = document.createElement('i');
    end.style.cssText = 'position:absolute;left:600px;top:10px;width:2px;height:2px';
    stage.append(end);
    end.scrollIntoView();
    end.remove();
    return [stage.scrollLeft, stage.scrollTop];
  });
  expect(scrolled).toEqual([0, 0]);
  expect((await read()).miss).toEqual([]);
});

// K.K. on his stool stands in front of the white flowers at his feet: the router gives a tap there to him (the scene's
// chain before the scenery), while pick, the tap areas' answer, says flower. The helpers aim where the router gives a
// thing (claim, else pick), never a flower point he takes (the c1 r3 design review's R2).
test('the flowers at K.K.\'s feet: the helpers aim where the router gives them, never where he stands in front', async ({ page }) => {
  await page.goto('?demo&date=2026-11-04T12:00&awake');
  expect(await is3d(page)).toBe(true);
  await quiet(page);
  const under = await page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 & { scenery(): { id: string; kind: string }[] } }).__world3d;
    // (the flowers whose tap area K.K. claims a part of: points where pick says the flower and the router K.K.)
    return w.scenery().filter((f) => f.kind === 'flower').flatMap((f) => {
      const b = w.box('flower', f.id);
      if (!b) return [];
      let taken = 0;
      for (let y = b.top + 2; y < b.top + b.height; y += 4) for (let x = b.left + 2; x < b.left + b.width; x += 4) if (w.pick(x, y)?.id === f.id && w.claim(x, y)?.kind === 'kk') taken++;
      return taken ? [f.id] : [];
    });
  });
  expect(under.length, 'a flower at K.K.\'s feet').toBeGreaterThan(0);
  for (const id of under) {
    const p = (await pointOn(page, 'flower', id))!;
    // (the point's answer as the router has it; pointOn falls back to the middle only when no point is the flower's)
    const at = await page.evaluate(([x, y]) => ((w) => w.claim(x, y)?.kind ?? w.pick(x, y)?.kind ?? null)((window as unknown as { __world3d: W3 }).__world3d), [p.x, p.y] as const);
    const free = await page.evaluate((id) => {
      const w = (window as unknown as { __world3d: W3 }).__world3d, b = w.box('flower', id)!;
      for (let y = b.top + 1; y < b.top + b.height; y += 3) for (let x = b.left + 1; x < b.left + b.width; x += 3) if (!w.claim(x, y) && w.pick(x, y)?.id === id) return true;
      return false;
    }, id);
    expect(at, `${id} at ${Math.round(p.x)},${Math.round(p.y)}`).toBe(free ? 'flower' : 'kk');
  }
});
