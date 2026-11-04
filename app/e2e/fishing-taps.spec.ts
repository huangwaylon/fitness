// Fishing, NH's (docs/design.md "Fishing"; island/fishing.ts): every tap on water answers. Within a cast of my villager
// it casts there from where it stands; further, 「とどかない」 where the tap was (a boop, my villager turns to it). A
// shadow near the float swims up, nibbles and bites, and a tap on the bite catches it, in every water on the default
// island and on the user's (the record of 2026-11-03), at 30 and 60 frames a second. The user: "Sometimes I can't
// fish: tapping with no response". What this guards: a tap right after a scroll (gestures.ts kept its swallow window
// open: iOS sends no click after a drag, so the next real tap was eaten), a tap on water with no shadow near it (a
// ripple only), a tap on the bank of a narrow stream, a tap while my villager walks, a tap on my villager with the line
// out (its squish, no reel).
import { expect, test, type Page } from '@playwright/test';
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
        await page.touchscreen.tap(x, y);
        // (the river's lower reach and its mouth are one channel: a tap by a shadow at the seam may land in either)
        const ok = water === 'river' || water === 'mouth' ? ['cast in the river', 'cast in the mouth'] : [`cast in the ${water}`];
        await expect.poll(async () => ok.includes(await hooks(page, (h) => h.__fish.why()))).toBe(true);
        const l = (await line(page))!;
        expect(l).not.toBeNull();
        // where the tap was (pulled in off the bank a little at most), and on that water
        const tapped = (await hooks(page, (h) => h.__fish.fish()))[0];
        expect(Math.hypot(l.x - tapped.x, l.z - tapped.z)).toBeLessThan(40);
        // the shadow notices the float and comes; it bites; the reel the moment it does
        await expect.poll(async () => (await line(page))?.fish ?? null, { timeout: 8000 }).not.toBeNull();
        await reelOnBite(page, x, y, 15_000);
        await expect(page.locator('[data-fx="catch"]')).toBeVisible({ timeout: 5000 });
        expect(await line(page)).toBeNull();
        expect(await hooks(page, (h) => h.__fish.why())).toBe('caught');
        expect(await cues(page)).toEqual(expect.arrayContaining(['scene-cast', 'scene-plop', 'scene-nibble', 'scene-bite', 'scene-reel', 'scene-catch']));
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

// Never silent: every tap on water does something you see. Each lands as a cast (then a tap reels it in) or says it's
// too far, wherever my villager stands, whatever the zoom, on both islands.
for (const layout of ['default', 'user'] as const)
  test(`${layout} island: every tap on water casts or says it's too far, and every tap with the line out reels it in`, async ({ page }) => {
    test.slow();
    await open(page, { layout, fps: 30, q: '&critter=river' });
    await expect.poll(() => hooks(page, (h) => h.__fish.fish().length), { timeout: 15_000 }).toBeGreaterThan(0);
    // my villager on the river's bank (some water near it, more out of reach)
    await toTheWater(page, 'river');
    const { min, max } = await hooks(page, (h) => h.__world3d.zoomRange());
    const said: Record<string, number> = {};
    const camZ = await page.evaluate(() => (window as unknown as { __world3d: { view(): { camZ: number } } }).__world3d.view().camZ);
    for (const k of [min, max]) {
      const [mx] = await hooks(page, (h) => h.__world.mine());
      await page.evaluate(([z, k, x]) => (window as unknown as Hooks).__world3d.go(z, k, x), [camZ, k, mx] as const);
      await expect.poll(() => hooks(page, (h) => h.__world3d.camStill())).toBe(true);
      const pts = await waterPoints(page, 36);
      expect(pts.length, 'water on screen').toBeGreaterThan(2);
      for (const [x, y] of pts.slice(0, 14)) {
        // (still nothing of the island's over it: a house's tap area follows its model in as it loads)
        if (await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('button, a, [role="button"], [data-bush], [data-tree], [data-flower], [data-sit], [data-fixture], [data-campfire], [data-building]'), [x, y] as const)) continue;
        const n0 = (await cues(page)).length;
        // (a click, the tap's own path: WebKit moves a touch that comes within a double tap's time of the last one to
        // where that one was, and these come one after another)
        await page.mouse.click(x, y);
        await expect.poll(async () => (await line(page)) !== null || (await hooks(page, (h) => h.__fish.why())) === 'too far', { message: `a tap at ${x},${y}: ${await hooks(page, (h) => h.__fish.why())}` }).toBe(true);
        const w = await hooks(page, (h) => h.__fish.why());
        said[w.replace(/ in the .*/, '')] = (said[w.replace(/ in the .*/, '')] ?? 0) + 1;
        if (w === 'too far') {
          await expect(page.locator('[data-fish-nope="far"]')).toBeVisible();
          expect((await cues(page)).slice(n0)).toContain('boop');
          continue;
        }
        expect(w).toMatch(/^cast in the /);
        // the line out: the next tap anywhere is its reel
        await page.mouse.click(x, y);
        await expect.poll(() => line(page)).toBeNull();
        expect(['reel', 'scared', 'caught']).toContain(await hooks(page, (h) => h.__fish.why()));
        expect((await cues(page)).slice(n0)).toContain('scene-reel');
      }
    }
    expect(said.cast, 'casts').toBeGreaterThan(0);
  });

test('too far: a tap on water out of my villager’s reach says so where it was, and nothing goes out', async ({ page }) => {
  await open(page, { q: '&critter=fish' });
  await expect.poll(() => hooks(page, (h) => h.__fish.fish().length), { timeout: 15_000 }).toBeGreaterThan(0);
  const f = (await hooks(page, (h) => h.__fish.fish()))[0];
  // my villager well up the lawn, the sea's shadow in view
  await page.evaluate(([x, z]) => (window as unknown as Hooks).__world.put(x, z), [f.x, f.z + 420] as const);
  await page.evaluate(([x, z]) => (window as unknown as Hooks).__world3d.go(z - 200, 1, x), [f.x, f.z] as const);
  await expect.poll(() => hooks(page, (h) => h.__world3d.camStill())).toBe(true);
  const [x, y] = await hooks(page, (h) => { const f = h.__fish.fish()[0]; return h.__world3d.client(f.x, f.z); });
  await page.touchscreen.tap(x, y);
  await expect(page.locator('[data-fish-nope="far"]')).toBeVisible();
  await expect(page.locator('[data-fish-nope="far"]')).toHaveText('とどかない');
  expect(await hooks(page, (h) => [h.__fish.why(), h.__fish.casting()])).toEqual(['too far', false]);
  expect(await cues(page)).toContain('boop');
  await expect(page.locator('[data-fish-nope]')).toHaveCount(0, { timeout: 3000 });
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
