// Fishing, NH's (docs/design.md "Fishing"; island/fishing.ts): every tap on water answers. Any water, however far from
// my villager (the user: "I want to be able to fish from anywhere"), it casts there from where it stands. A shadow near the float swims up, nibbles and bites, and a tap on the bite catches it, in every water on the default
// island and on the user's (the record of 2026-11-03), at 30 and 60 frames a second. The user: "Sometimes I can't
// fish: tapping with no response". What this guards: a tap right after a scroll (gestures.ts kept its swallow window
// open: iOS sends no click after a drag, so the next real tap was eaten), a tap on water with no shadow near it (a
// ripple only), a tap on the bank of a narrow stream, a tap while my villager walks, a tap on my villager with the line
// out (its squish, no reel).
import { expect, test, type Page } from './fixtures.ts';
import RECORD from '../src/lib/layout/record-2026-11-03.json' with { type: 'json' };
import { is3d, lawnTap, reelOnBite, toTheWater } from './island';
import { defaultLayout, withChanges } from '../src/lib/layout/model.ts';
import { GRID, chunkId, chunkOf, chunkString, chunkXZ } from '../src/lib/layout/grid.ts';
import { validate } from '../src/lib/layout/validate.ts';

test.use({ viewport: { width: 393, height: 852 } });

const USER_LAYOUT = [
  ...(RECORD as object[]),
  { who: 'A', sc: 'o', id: 'museum', at: 1.79e12, k: 'museum', x: 9, z: 18, f: 0 },
  { who: 'A', sc: 'o', id: 'shop', at: 1.79e12, k: 'shop', x: 7, z: 49, f: 0 }
];
type Fish = { water: string; id: string; x: number; z: number; len: number };
type Line = { x: number; z: number; water: string; phase: string; fish: string | null };
type Hooks = {
  __fish: { why(): string; fish(): Fish[]; casting(): boolean; line(): Line | null };
  __world3d: { go(z: number, k?: number, x?: number): void; client(x: number, z: number): [number, number]; ground(cx: number, cy: number): { x: number; z: number } | null; zoomRange(): { min: number; max: number }; camStill(): boolean };
  __world: { ground(x: number, z: number): { surface: string }; mine(): [number, number]; put(x: number, z: number): void; free(x: number, z: number, away?: number): boolean };
};
const hooks = <R,>(page: Page, fn: (h: Hooks) => R) => page.evaluate(`(${fn.toString()})(window)`) as Promise<R>;
const line = (page: Page) => hooks(page, (h) => h.__fish.line());

async function open(page: Page, o: { layout?: 'default' | 'user'; fps?: number; q?: string; ops?: object[] } = {}) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  if (o.fps) await page.addInitScript((fps) => localStorage.setItem('island.fps', String(fps)), o.fps);
  const ops = o.ops ?? (o.layout === 'user' ? USER_LAYOUT : null);
  if (ops) await page.addInitScript((ops) => localStorage.setItem('island-demo.layout', ops), JSON.stringify(ops));
  await page.goto(`?demo&visitor=none&date=2026-11-04T12:00${o.q ?? ''}`);
  expect(await is3d(page)).toBe(true);
}
const cues = (page: Page) => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? []);

// The whole of it in each water, on both islands, at both frame rates: the cast where the tap was, a shadow noticing
// the float, its nibbles, the bite and the catch.
for (const layout of ['default', 'user'] as const)
  for (const fps of [30, 60])
    for (const water of ['sea', 'pond', 'river', 'mouth', 'clifftop'] as const)
      test(`${layout} island, ${fps} fps: a tap on the ${water} by my villager casts there, the shadow bites, a tap catches it`, async ({ page }) => {
        test.slow();
        await open(page, { layout, fps, q: `&critter=${water === 'sea' ? 'fish' : water}` });
        await expect.poll(() => hooks(page, (h) => h.__fish.fish().map((f) => f.water)), { timeout: 15_000 }).toContain(water);
        const [x, y] = await toTheWater(page, water);
        // (the ground under the finger: where the float must land. Not the shadow's spot read after the cast: it swims,
        // and fish()[0] may be another water's; that was 21 flaky runs in a day, 2026-11-05)
        const tapped = (await page.evaluate(([x, y]) => (window as unknown as Hooks).__world3d.ground(x, y), [x, y] as const))!;
        await page.touchscreen.tap(x, y);
        // (the river's lower reach and its mouth are one channel: a tap by a shadow at the seam may land in either)
        const ok = water === 'river' || water === 'mouth' ? ['cast in the river', 'cast in the mouth'] : [`cast in the ${water}`];
        await expect.poll(async () => ok.includes(await hooks(page, (h) => h.__fish.why()))).toBe(true);
        const l = (await line(page))!;
        expect(l).not.toBeNull();
        // where the tap was (pulled in off the bank a little at most), and on that water
        expect(Math.hypot(l.x - tapped.x, l.z - tapped.z)).toBeLessThan(40);
        // the shadow notices the float and comes; it bites; the reel the moment it does
        await expect.poll(async () => (await line(page))?.fish ?? null, { timeout: 8000 }).not.toBeNull();
        await reelOnBite(page, x, y, 15_000);
        await expect(page.locator('[data-fx="catch"]')).toBeVisible({ timeout: 5000 });
        expect(await line(page)).toBeNull();
        expect(await hooks(page, (h) => h.__fish.why())).toBe('caught');
        expect(await cues(page)).toEqual(expect.arrayContaining(['scene-cast', 'scene-plop', 'scene-nibble', 'scene-bite', 'scene-reel', 'scene-catch']));
      });

// The sea all round the island (island/coast.ts: a shadow off every stretch of coast, not just the front beach's): off a
// side and the back beach, a cast by my villager there brings the shadow up and a tap catches it.
for (const layout of ['default', 'user'] as const)
  for (const side of ['left', 'right', 'back'] as const)
    test(`${layout} island: a cast off the ${side} beach, the shadow there bites, a tap catches it`, async ({ page }) => {
      test.slow();
      await open(page, { layout, q: `&critter=fish&coast=${side}` });
      await expect.poll(() => hooks(page, (h) => h.__fish.fish().map((f) => f.water)), { timeout: 15_000 }).toContain('sea');
      const f = (await hooks(page, (h) => h.__fish.fish()))[0];
      // (off that side: left or right of the land, or round the back)
      if (side === 'left') expect(f.x).toBeLessThan(-30);
      else if (side === 'right') expect(f.x).toBeGreaterThan(420);
      else expect(f.z).toBeGreaterThan(1400);
      // (zoomed in, the view panned to it: a side's sea shows only so, world3d/engine.ts xRoom.) Off the back beach the
      // camera's far stop leaves the sea high on the screen beside the doors and the beach's finds: a touch there is
      // the sea's (exact-taps.spec), a real tap.
      const [x, y] = await toTheWater(page, 'sea', 3);
      await page.touchscreen.tap(x, y);
      await expect.poll(() => hooks(page, (h) => h.__fish.why())).toBe('cast in the sea');
      await expect.poll(async () => (await line(page))?.fish ?? null, { timeout: 8000 }).not.toBeNull();
      await reelOnBite(page, x, y, 15_000);
      await expect(page.locator('[data-fx="catch"]')).toBeVisible({ timeout: 5000 });
      expect(await hooks(page, (h) => h.__fish.why())).toBe('caught');
    });

/** The screen's points over water a finger can tap (no tap area of the island's over them), every `step` px. */
const waterPoints = (page: Page, step: number) => page.evaluate((step) => {
  const h = window as unknown as Hooks, out: [number, number][] = [];
  for (let y = 140; y < innerHeight - 90; y += step)
    for (let x = 16; x < innerWidth - 16; x += step) {
      const g = h.__world3d.ground(x, y), s = g && h.__world.ground(g.x, g.z).surface;
      if ((s === 'sea' || s === 'water') && !document.elementFromPoint(x, y)?.closest('button, a, [role="button"], [data-bush], [data-tree], [data-flower], [data-sit], [data-fixture], [data-campfire], [data-building]')) out.push([x, y]);
    }
  return out;
}, step);

// Never silent: every tap on water casts (then a tap reels it in), near my villager or far, whatever the zoom, on both
// islands: no water out of reach.
for (const layout of ['default', 'user'] as const)
  test(`${layout} island: every tap on water casts, near or far, and every tap with the line out reels it in`, async ({ page }) => {
    test.slow();
    await open(page, { layout, fps: 30, q: '&critter=river' });
    await expect.poll(() => hooks(page, (h) => h.__fish.fish().length), { timeout: 15_000 }).toBeGreaterThan(0);
    // my villager on the river's bank (some water near it, the rest far off)
    await toTheWater(page, 'river');
    const { min, max } = await hooks(page, (h) => h.__world3d.zoomRange());
    let casts = 0, far = 0;
    for (const k of [min, max]) {
      // (each zoom framed on the river's shadow as toTheWater frames it, the shadow a little below the screen's middle:
      // one camera z kept for both zooms, across my villager, zoomed in it now and then held two water points, "water
      // on screen" failing in 2 of 3 runs at 6 workers)
      await page.evaluate((k) => {
        const h = window as unknown as Hooks & { __world3d: { view(): { camZ: number } } }, f = h.__fish.fish().find((f) => f.water === 'river')!;
        let best: [number, number] | null = null;
        for (let z = f.z - 700; z <= f.z + 100; z += 25) {
          h.__world3d.go(z, k, f.x);
          const d = Math.abs(h.__world3d.client(f.x, f.z)[1] - innerHeight * 0.58);
          if (!best || d < best[1]) best = [h.__world3d.view().camZ, d];
        }
        h.__world3d.go(best![0], k, f.x);
      }, k);
      await expect.poll(() => hooks(page, (h) => h.__world3d.camStill())).toBe(true);
      // (every 24 px: the river's narrow reach, zoomed in, held 4 points of a 36 px grid)
      const pts = await waterPoints(page, 24);
      expect(pts.length, 'water on screen').toBeGreaterThan(2);
      for (const [x, y] of pts.slice(0, 14)) {
        // (still nothing of the island's over it: a house's tap area follows its model in as it loads)
        // (nor K.K. on his stool by the river: the scene asks him, a tap within his box is his)
        if (await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('button, a, [role="button"], [data-bush], [data-tree], [data-flower], [data-sit], [data-fixture], [data-campfire], [data-building]')
          || [...document.querySelectorAll('[data-kk] .art')].some((el) => {
            const b = el.getBoundingClientRect();
            return x > b.left - 14 && x < b.right + 14 && y > b.top - 14 && y < b.bottom + 14;
          }), [x, y] as const)) continue;
        const n0 = (await cues(page)).length;
        // (a click, the tap's own path: WebKit moves a touch that comes within a double tap's time of the last one to
        // where that one was, and these come one after another)
        await page.mouse.click(x, y);
        await expect.poll(async () => (await line(page)) !== null, { message: `a tap at ${x},${y}: ${await hooks(page, (h) => h.__fish.why())}` }).toBe(true);
        const w = await hooks(page, (h) => h.__fish.why());
        expect(w).toMatch(/^cast in the /);
        const [mx, mz] = await hooks(page, (h) => h.__world.mine()), l = (await line(page))!;
        far = Math.max(far, Math.hypot(l.x - mx, l.z - mz));
        casts++;
        // the line out: the next tap anywhere is its reel
        await page.mouse.click(x, y);
        await expect.poll(() => line(page)).toBeNull();
        expect(['reel', 'scared', 'caught']).toContain(await hooks(page, (h) => h.__fish.why()));
        expect((await cues(page)).slice(n0)).toContain('scene-reel');
      }
    }
    expect(casts, 'casts').toBeGreaterThan(4);
    // (some of them well past the old 190u reach)
    expect(far).toBeGreaterThan(250);
  });

/** Open ground at least `min` u from (x, z) (and at most `max`), nothing standing there. */
const farGround = (page: Page, x: number, z: number, min: number, max: number) => page.evaluate(([x, z, min, max]) => {
  const w = window as unknown as Hooks;
  for (let r = min; r <= max; r += 20)
    for (let a = 0; a < 36; a++) {
      const px = Math.round(x + Math.cos((a / 36) * Math.PI * 2) * r), pz = Math.round(z + Math.sin((a / 36) * Math.PI * 2) * r);
      if (pz > z && w.__world.free(px, pz, 0)) return [px, pz] as [number, number];
    }
  return null;
}, [x, z, min, max] as const);

// From anywhere (the user: "I want to be able to fish from anywhere. Get rid of the distance restriction"): my villager
// far up the island, a tap on the sea's shadow casts from where it stands, the float on the water tapped, and the
// whole of it plays out there: the shadow notices the float (near the float: my villager's distance doesn't matter),
// nibbles, bites, and a tap catches it. The line runs from the rod's tip to the float, sagging by its length, clear of the island.
test('a far cast: from across the island the float lands where the tap was, the line sags to it, and the shadow is caught', async ({ page }) => {
  test.slow();
  await open(page, { q: '&critter=fish' });
  await expect.poll(() => hooks(page, (h) => h.__fish.fish().length), { timeout: 15_000 }).toBeGreaterThan(0);
  const f = (await hooks(page, (h) => h.__fish.fish()))[0];
  const spot = await farGround(page, f.x, f.z, 450, 900);
  expect(spot, 'open ground far from the sea').not.toBeNull();
  await page.evaluate(([x, z]) => (window as unknown as Hooks).__world.put(x, z), spot!);
  await expect.poll(async () => { const [x, z] = await hooks(page, (h) => h.__world.mine()); return Math.hypot(x - spot![0], z - spot![1]); }).toBeLessThan(1);
  // the camera back on the shadow (my villager may be off the screen), and a tap on open water by it
  await page.evaluate(([x, z]) => (window as unknown as Hooks).__world3d.go(z - 200, 1, x), [f.x, f.z] as const);
  await expect.poll(() => hooks(page, (h) => h.__world3d.camStill())).toBe(true);
  // (the point and the ground under it read together: the shadow swims between two reads)
  const [x, y, at] = await hooks(page, (h) => { const f = h.__fish.fish()[0]; const [x, y] = h.__world3d.client(f.x, f.z); return [x, y, h.__world3d.ground(x, y)] as const; });
  await page.touchscreen.tap(x, y);
  await expect.poll(() => hooks(page, (h) => h.__fish.why())).toBe('cast in the sea');
  const l = (await line(page))!;
  const [mx, mz] = await hooks(page, (h) => h.__world.mine());
  // from where it stood (no walk), the float on the water tapped, far off
  expect(Math.hypot(mx - spot![0], mz - spot![1])).toBeLessThan(1);
  expect(Math.hypot(l.x - at!.x, l.z - at!.z)).toBeLessThan(14);
  expect(Math.hypot(l.x - mx, l.z - mz)).toBeGreaterThan(400);
  // the line as drawn, landed: from the rod's tip to the float, every 16u or so, bent with the island, over the ground
  await expect.poll(async () => (await line(page))?.phase).not.toBe('flying');
  type L3 = { visible: boolean; bent: boolean; pts: number[][] } | null;
  const drawn = () => page.evaluate(() => {
    const w = window as unknown as { __world3d: { line(id?: string): L3; where(id: string): { x: number; y: number; z: number } | null; water(x: number, z: number): number[] }; __villagers3: { tip(s: string): number[] | null } };
    return { line: w.__world3d.line(), tip: w.__villagers3.tip('mine'), float: w.__world3d.where('bobber'), bed: (w.__world3d.line()?.pts ?? []).map(([x, , z]) => Math.max(...w.__world3d.water(x, -z))) };
  });
  await expect.poll(async () => { const d = await drawn(); return !!d.line?.visible && !!d.tip && !!d.float; }, { timeout: 15_000 }).toBe(true);
  const d = await drawn(), pts = d.line!.pts, bad: string[] = [];
  const dist = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  if (!d.line!.bent) bad.push('unbent');
  // (the tip is read after the line's frame: the cast's swing settling, the fishing pose's breathing move it a little)
  if (dist(pts[0], d.tip!) > 6) bad.push(`start ${pts[0]} vs tip ${d.tip}`);
  if (dist(pts.at(-1)!, [d.float!.x, d.float!.y, d.float!.z]) > 3) bad.push(`end ${pts.at(-1)} vs float ${JSON.stringify(d.float)}`);
  const len = dist(pts[0], pts.at(-1)!);
  if (pts.length < Math.min(64, len / 16)) bad.push(`${pts.length} points over ${len.toFixed(0)}u`);
  if (pts.some((p) => !p.every(Number.isFinite))) bad.push('NaN');
  // a curve, not a straight laser: its middle off the straight line between its ends (its sag, or lifted clear)
  const mid = pts[Math.floor(pts.length / 2)];
  if (!(Math.abs(mid[1] - (pts[0][1] + pts.at(-1)![1]) / 2) > 2)) bad.push(`straight: ${mid[1]} over ${len}u`);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/far-cast.png` });
  // and never under the ground or the water it passes over (bar the ends: the float sits in the water)
  pts.forEach((p, i) => { if (i > 2 && i < pts.length - 3 && p[1] < d.bed[i]) bad.push(`under the ground or the water at ${i}: ${p[1].toFixed(1)} < ${d.bed[i].toFixed(1)}`); });
  expect(bad).toEqual([]);
  // the shadow notices the float, bites, and a tap catches it (my villager still far off)
  await expect.poll(async () => (await line(page))?.fish ?? null, { timeout: 10_000 }).not.toBeNull();
  await reelOnBite(page, x, y, 15_000);
  await expect(page.locator('[data-fx="catch"]')).toBeVisible({ timeout: 5000 });
  expect(await hooks(page, (h) => h.__fish.why())).toBe('caught');
});

test('a tap on the water right after a scroll casts (no tap swallowed after a drag)', async ({ page }) => {
  await open(page, { q: '&critter=fish' });
  await expect.poll(() => hooks(page, (h) => h.__fish.fish().length), { timeout: 15_000 }).toBeGreaterThan(0);
  const [x, y] = await toTheWater(page, 'sea');
  // a drag (the finger's own pointer events, as gestures.ts has them: a scroll of the island), lifted, then at once a
  // tap on the water: iOS sends no click after a drag, so nothing may wait to eat the next one
  // (lifted after a still moment: no fling, so the camera stays where the drag left it)
  await page.evaluate(([x, y]) => new Promise<void>((done) => {
    const el = document.querySelector('.if-scene')!;
    const ev = (type: string, yy: number) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 9, pointerType: 'touch', clientX: x, clientY: yy, isPrimary: true }));
    ev('pointerdown', y - 200);
    ev('pointermove', y - 190);
    ev('pointermove', y - 170);
    setTimeout(() => (ev('pointerup', y - 170), done()), 120);
  }), [x, y] as const);
  const [x2, y2] = await hooks(page, (h) => { const f = h.__fish.fish()[0]; return h.__world3d.client(f.x, f.z); });
  await page.touchscreen.tap(x2, y2);
  await expect.poll(() => hooks(page, (h) => h.__fish.why())).toBe('cast in the sea');
});

test('a tap on the water while my villager walks: it stops where it is and casts', async ({ page }) => {
  await open(page, { q: '&critter=fish' });
  await expect.poll(() => hooks(page, (h) => h.__fish.fish().length), { timeout: 15_000 }).toBeGreaterThan(0);
  const [x, y] = await toTheWater(page, 'sea');
  const [mx, mz] = await hooks(page, (h) => h.__world.mine());
  // a tap-walk along the beach (open ground a little way off, on this screen), and the tap on the water while it's under way
  const to = await lawnTap(page, mx + 100, mz + 50);
  await page.touchscreen.tap(to.x, to.y);
  await expect(page.locator('[data-actor="mine"].walking'), JSON.stringify([to, mx, mz, await hooks(page, (h) => h.__fish.why())])).toHaveCount(1);
  await page.touchscreen.tap(x, y);
  await expect.poll(() => hooks(page, (h) => h.__fish.why())).toBe('cast in the sea');
  await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0);
  expect(await line(page)).not.toBeNull();
});

test('with the line out, a tap on my villager reels it in (NH’s A button), not its squish', async ({ page }) => {
  await open(page, { q: '&critter=fish' });
  await expect.poll(() => hooks(page, (h) => h.__fish.fish().length), { timeout: 15_000 }).toBeGreaterThan(0);
  const [x, y] = await toTheWater(page, 'sea');
  await page.touchscreen.tap(x, y);
  await expect.poll(() => line(page)).not.toBeNull();
  const me = page.locator('[data-actor="mine"] .vil');
  const box = (await me.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect.poll(() => line(page)).toBeNull();
  expect(['reel', 'scared']).toContain(await hooks(page, (h) => h.__fish.why()));
});

// NH reels in to move: with the line out, a tap on the ground is the reel (my villager stays), the next one walks.
test('with the line out, a tap on the ground reels it in where my villager stands; the next tap walks', async ({ page }) => {
  await open(page, { q: '&critter=fish' });
  await expect.poll(() => hooks(page, (h) => h.__fish.fish().length), { timeout: 15_000 }).toBeGreaterThan(0);
  const [x, y] = await toTheWater(page, 'sea');
  await page.touchscreen.tap(x, y);
  await expect.poll(() => line(page)).not.toBeNull();
  const [mx, mz] = await hooks(page, (h) => h.__world.mine());
  const to = await lawnTap(page, mx + 100, mz + 50);
  await page.touchscreen.tap(to.x, to.y);
  await expect.poll(() => line(page)).toBeNull();
  expect(['reel', 'scared']).toContain(await hooks(page, (h) => h.__fish.why()));
  await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0);
  expect(await hooks(page, (h) => h.__world.mine())).toEqual([mx, mz]);
  // (past the reel's own moment: a tap on the ground walks)
  await page.waitForTimeout(400);
  await page.touchscreen.tap(to.x, to.y);
  await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(1);
});

/** The default island with its painted pond grass and a pond put down where one fits (the user's island has only ponds
 *  put down): its layout ops, as the record keeps them. */
function pondPutDown(): object[] {
  const AT = Date.UTC(2026, 10, 1);
  const l = defaultLayout(), codes = l.codes.slice(), chunks = new Set<number>();
  codes.forEach((c, i) => {
    if (c >> 2 !== 8 || l.tier(i % GRID.cols, Math.floor(i / GRID.cols)) !== 0) return;
    codes[i] = 4;
    chunks.add(chunkOf(i % GRID.cols, Math.floor(i / GRID.cols)));
  });
  const ops: object[] = [...chunks].map((i) => ({ sc: 'c', id: chunkId(...chunkXZ(i)), g: chunkString(codes, i), at: AT, who: 'A' }));
  const grass = withChanges(l, { tiles: [...codes].flatMap((c, i) => (c !== l.codes[i] ? [[i % GRID.cols, Math.floor(i / GRID.cols), c] as [number, number, number]] : [])) });
  for (let z = 8; z < 50; z++)
    for (let x = 2; x < 16; x++)
      if (!validate(withChanges(grass, { set: [{ id: 'p-e2e', k: 'pond', x, z, f: 0 }] })).some((i) => i.level === 'error' && i.ids?.includes('p-e2e')))
        return [...ops, { sc: 'o', id: 'p-e2e', k: 'pond', x, z, f: 0, at: AT + 1, who: 'A' }];
  throw new Error('no room for a pond');
}

test('a pond put down on an island without the painted pond: its fish in it, and a tap on it casts', async ({ page }) => {
  test.slow();
  await open(page, { ops: pondPutDown(), q: '&critter=pond' });
  const geo = await page.evaluate(() => (window as unknown as { __world: { geo(): { PONDS: unknown[]; POND: { x: number } } } }).__world.geo());
  expect(geo.PONDS).toHaveLength(1);
  expect(geo.POND.x).toBeLessThan(-1000);
  await expect.poll(() => hooks(page, (h) => h.__fish.fish().map((f) => f.water)), { timeout: 15_000 }).toContain('pond');
  // in the pond put down, never off the island
  expect(await hooks(page, (h) => { const f = h.__fish.fish()[0]; return h.__world.ground(f.x, f.z).surface; })).toBe('water');
  const [x, y] = await toTheWater(page, 'pond');
  await page.touchscreen.tap(x, y);
  await expect.poll(() => hooks(page, (h) => h.__fish.why())).toBe('cast in the pond');
});
