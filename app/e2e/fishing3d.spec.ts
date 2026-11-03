// Fishing on the 3D island (docs/design.md "Fishing"): the whole flow in every kind of water, the sea by
// day, the river and the pond at night. A tap by the shadow casts in place; my 3D villager takes out NH's rod and faces
// the float, the line from the rod's tip; the fish nibbles and bites (the float under, the 「！」); a tap reels it in
// and the catch plate names it; the rod goes away. Where the 3D island draws the shadow and the float is where their
// tap areas are (the DOM's nodes, placed through the same camera): a tap on what's drawn is a tap on it.
import { expect, test, type Page } from '@playwright/test';
import { CAMS } from '../src/lib/components/island/world.ts';

test.use({ viewport: { width: 393, height: 852 } });

type W3 = { loaded(): boolean; client(x: number, z: number, lift?: number): [number, number]; where(id: string): { x: number; y: number; z: number; hidden: boolean } | null };
type V3 = { state(slot: string): string | null; tool(slot: string): string | null; tip(slot: string): number[] | null };
const v3 = <R,>(page: Page, fn: (v: V3) => R) => page.evaluate(`(${fn.toString()})(window.__villagers3)`) as Promise<R>;
const SHOTS = process.env.SHOTS;
type Fx3 = { live(name: string): { x: number; y: number; z: number; s: number }[]; log(): { kind: string; t: number; size?: number }[] };
const fx3 = <R,>(page: Page, fn: (f: Fx3) => R) => page.evaluate(`(${fn.toString()})(window.__fx3)`) as Promise<R>;

/** A DOM node's middle and, through the 3D camera, where the island draws the model of the same id (client px). */
const drawnAt = (page: Page, sel: string, prefix: string) => page.evaluate(([sel, prefix]) => {
  const w = (window as unknown as { __world3d: W3 }).__world3d, el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  for (let n = 0; n < 200; n++) {
    const id = prefix.endsWith('-') ? `${prefix}${n}` : prefix, p = w.where(id);
    if (p && !p.hidden) {
      const [cx, cy] = w.client(p.x, -p.z, p.y);
      return { dom: [r.left + r.width / 2, r.top + r.height / 2], model: [cx, cy] };
    }
    if (!prefix.endsWith('-')) break;
  }
  return null;
}, [sel, prefix] as const);
const apart = (a: { dom: number[]; model: number[] } | null) => (a ? Math.hypot(a.dom[0] - a.model[0], a.dom[1] - a.model[1]) : Infinity);

for (const [water, q, cam, sel, miss] of [
  ['sea', '&critter=fish&date=2026-11-04T12:00', null, '[data-critter="fish"]', false],
  ['river', '&critter=river&date=2026-11-04T21:00', CAMS.oku, '[data-critter="pond"][data-water="river"]', false],
  ['pond', '&critter=pond&date=2026-11-04T21:00', CAMS.oku, '[data-critter="pond"][data-water="pond"]', false],
  // no tap in the bite's window: it gets away, and the 「！」 goes with it
  ['sea', '&critter=fish&date=2026-11-04T12:00', null, '[data-critter="fish"]', true]
] as const) {
  test(`3D fishing in the ${water}: cast, the rod and its line, the bite, ${miss ? 'too late: it gets away' : 'the catch'}`, async ({ page }) => {
    test.setTimeout(90_000);
    // TODO(3D engine): on CI's drawn tier (software GL) the rod and the line-up pass, but the bite's 「！」 or the reel's
    // catch plate is missed (the bite's window under CI's load); the logic tier (E2E_RENDER=none) runs it
    test.fixme(!!process.env.CI && process.env.E2E_RENDER !== 'none', 'CI drawn tier: the bite window is missed under its software GL');
    await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
    await page.goto(`?demo&visitor=none${q}`);
    await page.waitForFunction(() => (window as unknown as { __world3d?: W3 }).__world3d?.loaded(), null, { timeout: 30_000 });
    if (cam !== null) await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), cam);
    await expect(page.locator(sel)).toBeAttached({ timeout: 10_000 });
    // my villager in 3D (its model in: under CI's software GL that takes a while), else it's a card and holds no rod
    await expect.poll(() => v3(page, (v) => v.state('mine')), { timeout: 30_000 }).not.toBeNull();
    // the shadow drawn where its tap area is (it swims: a few px of lag between the two at most): the model's spot is its
    // head (Critters' fish3: the body trails behind it), half its length from the tap area's middle
    const half = () => page.locator(`${sel} .fin`).evaluate((el) => { const r = el.getBoundingClientRect(); return Math.max(r.width, r.height) / 2; });
    await expect.poll(async () => apart(await drawnAt(page, sel, `fish-${water}-`)) - (await half()), { timeout: 8000 }).toBeLessThan(16);
    // my villager by the water (behind it: never over the shadow on screen), within a line's reach (across the island, the line runs from the bank: no rod in hand)
    {
      const p = await page.evaluate((pre) => { const w = (window as unknown as { __world3d: W3 }).__world3d; for (let n = 0; n < 200; n++) { const q = w.where(`${pre}${n}`); if (q) return [q.x, -q.z]; } return null; }, `fish-${water}-`);
      await page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z < 0 ? 20 : z + 45), p!);
      await page.waitForTimeout(300);
    }
    const f = (await drawnAt(page, sel, `fish-${water}-`))!;
    // a tap by the shadow, where it's drawn: the cast, in place
    await page.mouse.click(f.model[0] + 6, f.model[1]);
    await expect(page.locator('[data-bobber]')).toBeAttached({ timeout: 3000 });
    await expect(page.locator('[data-actor="mine"].walking')).toHaveCount(0);
    // NH's rod in my villager's hand, fishing
    await expect.poll(() => v3(page, (v) => [v.tool('mine'), v.state('mine')]), { timeout: 15_000 }).toEqual(['tools/rod', 'fish']);
    expect(await v3(page, (v) => v.tip('mine')?.every(Number.isFinite))).toBe(true);
    // facing the float square on, the rod pointed at it and the line straight on from its tip, in plan (the user:
    // "face straight towards the fish… hold the pole pointed in the direction of the fish, so the line is straight")
    const lineUp = () => page.evaluate(() => {
      const a = (window as unknown as { __world3d: { angler(): { facing: number; rod: number; line: number } | null } }).__world3d.angler();
      if (!a) return Infinity;
      const d = (x: number, y: number) => Math.abs(((x - y + 540) % 360) - 180);
      return Math.max(d(a.facing, a.rod), d(a.rod, a.line), d(a.facing, a.line));
    });
    await expect.poll(lineUp, { timeout: 5000 }).toBeLessThan(5);
    await expect(page.locator('[data-bobber="wait"]')).toBeAttached({ timeout: 4000 });
    // the float on the water where its node is
    await expect.poll(async () => apart(await drawnAt(page, '[data-bobber]', 'bobber')), { timeout: 4000 }).toBeLessThan(16);
    // waiting: the float bobs on the water (its height changes from frame to frame) and a soft ring spreads now and then
    {
      const y = () => page.evaluate(() => (window as unknown as { __world3d: W3 }).__world3d.where('bobber')?.y ?? NaN);
      const y0 = await y();
      await expect.poll(async () => Math.abs((await y()) - y0), { timeout: 3000 }).toBeGreaterThan(0.05);
    }
    await expect.poll(() => fx3(page, (f) => f.log().some((e) => e.kind === 'ripple' && e.size === 0.45)), { timeout: 4000 }).toBe(true);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/fish3d-${water}${miss ? '-miss' : ''}-wait.png` });
    // the nibbles (1–3) before the bite: each a dip of the float and a small ring on the water
    await page.waitForFunction(() => (window as unknown as { __fx3: Fx3 }).__fx3.log().some((e) => e.kind === 'ripple' && e.size === 0.7), null, { timeout: 12_000, polling: 50 });
    if (SHOTS) {
      await page.waitForTimeout(200); // (its ring spread a little: the picture of it)
      await page.screenshot({ path: `${SHOTS}/fish3d-${water}${miss ? '-miss' : ''}-nibble.png` });
    }
    await expect(page.locator('[data-bobber="bite"]')).toBeAttached({ timeout: 12_000 });
    await expect(page.locator('[data-bite]')).toHaveText('！');
    // the bite: the float plunged under, a splash, and the 「！」 popped over my villager's head; every nibble before it
    await expect.poll(() => fx3(page, (f) => f.live('bang').length), { timeout: 2000 }).toBe(1);
    const order = () => fx3(page, (f) => {
      const l = f.log(), bang = l.findLast((e) => e.kind === 'bang')!;
      return { nibbles: l.filter((e) => e.kind === 'ripple' && e.size === 0.7 && e.t < bang.t).length, splash: l.some((e) => e.kind === 'splash' && e.t >= bang.t - 50) };
    });
    expect((await order()).nibbles).toBeGreaterThanOrEqual(1);
    await expect.poll(async () => (await order()).splash, { timeout: 2000 }).toBe(true);
    {
      const [b] = await fx3(page, (f) => f.live('bang'));
      const head = await page.evaluate(() => (window as unknown as { __world3d: { head(slot: string): number[] | null } }).__world3d.head('mine'));
      // (three's z is the world's −z) straight over the head, above it
      expect(Math.hypot(b.x - head![0], b.z + head![2])).toBeLessThan(6);
      expect(b.y).toBeGreaterThan(head![1]);
    }
    if (SHOTS) {
      await page.waitForTimeout(250); // (its pop in over: the picture of it at its size)
      await page.screenshot({ path: `${SHOTS}/fish3d-${water}${miss ? '-miss' : ''}-bite.png` });
    }
    if (miss) {
      await expect(page.locator('[data-bobber]')).toHaveCount(0, { timeout: 4000 });
      await expect.poll(() => fx3(page, (f) => f.live('bang').length), { timeout: 2000 }).toBe(0);
      await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
      return;
    }
    // the reel: a tap anywhere
    await page.mouse.click(196, 420);
    await expect(page.locator('[data-fx="catch"]')).toContainText('釣', { timeout: 4000 });
    // the 「！」 gone with the reel
    await expect.poll(() => fx3(page, (f) => f.live('bang').length), { timeout: 2000 }).toBe(0);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/fish3d-${water}${miss ? '-miss' : ''}-catch.png` });
    expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues ?? [])).toEqual(expect.arrayContaining(['scene-cast', 'scene-bite', 'scene-reel', 'scene-catch']));
    // the rod put away once the reel's over
    await expect.poll(() => v3(page, (v) => v.tool('mine')), { timeout: 6000 }).toBeNull();
  });
}

// The shadows seen in every water (the user: "i don't see any fish shadows inside the ponds … i also don't see any fish
// in the rivers"): a fresh water's surface is 74% opaque and the sea's deep water whole, so a shadow drawn before it
// (renderOrder 0) showed as a tenth of itself, nothing over a pond's or a stream's dark bed; and in a pond put down
// (pond.ts, on the grass) the shadow 2.5 under the stream's level was under the grass. Each is drawn after the water
// (world3d/things.ts UNDER_WATER) between the bed and the surface (Island3D waterY, bedY).
const POND_OP = { sc: 'o', id: 'pond-e2e', at: 1793708607120, k: 'pond', x: 5, z: 16, f: 0, who: 'A' };
for (const water of ['pond', 'river', 'mouth', 'sea'] as const)
  test(`the ${water}'s shadow is drawn over its water, between the bed and the surface`, async ({ page }) => {
    test.slow();
    // a pond put down on the grass in view (the user's island has two, and no painted pond): the shadow comes there
    if (water === 'pond') await page.addInitScript((op) => localStorage.setItem('island-demo.layout', JSON.stringify([op])), POND_OP);
    await page.goto(`?demo&visitor=none&critter=${water === 'sea' ? 'fish' : water}&date=2026-11-04T12:00`);
    await page.waitForFunction(() => (window as unknown as { __world3d?: W3 }).__world3d?.loaded(), null, { timeout: 30_000 });
    type S = { x: number; y: number; z: number; hidden: boolean; order: number };
    const shadow = () => page.evaluate((wt) => {
      const w = (window as unknown as { __world3d: { where(id: string): S | null; water(x: number, z: number): [number, number] } }).__world3d;
      for (let n = 0; n < 200; n++) {
        const p = w.where(`fish-${wt}-${n}`);
        if (p && !p.hidden) return { ...p, water: w.water(p.x, -p.z) };
      }
      return null;
    }, water);
    await expect.poll(shadow, { timeout: 15_000 }).not.toBeNull();
    const s = (await shadow())!;
    // after the sea (1) and the fresh water (2)
    expect(s.order).toBeGreaterThan(2);
    // over what's under the water, never above its surface
    const [top, bed] = s.water;
    // (the pond put down's: its water over the grass, GRASS_Y 3)
    if (water === 'pond') expect(top).toBeGreaterThan(3);
    expect(s.y).toBeGreaterThan(Math.min(bed, top) - 0.01);
    expect(s.y).toBeLessThanOrEqual(top + 0.01);
  });
