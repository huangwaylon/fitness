// Fishing on the 3D island (docs/design.md "Fishing"): the whole flow in every kind of water, the sea by
// day, the river and the pond at night. My villager on the bank, a tap by the shadow casts there from where it stands;
// my 3D villager takes out NH's rod and faces the float, the line from the rod's tip; the fish nibbles and bites (the
// float under, the 「！」); a tap reels it in and the catch plate names it; the rod goes away. Missed, the fish gets
// away and the float stays out till a tap reels it in. Where the 3D island draws the shadow and the float is where their
// tap areas are (the DOM's nodes, placed through the same camera): a tap on what's drawn is a tap on it.
import { expect, test, type Page } from '@playwright/test';
import { camTo, geo, toTheWater } from './island.ts';
import { markShown, overHead, type Mark } from './biteMark.ts';

test.use({ viewport: { width: 393, height: 852 } });

type W3 = { loaded(): boolean; client(x: number, z: number, lift?: number): [number, number]; where(id: string): { x: number; y: number; z: number; hidden: boolean } | null };
type V3 = { state(slot: string): string | null; tool(slot: string): string | null; tip(slot: string): number[] | null };
const v3 = <R,>(page: Page, fn: (v: V3) => R) => page.evaluate(`(${fn.toString()})(window.__villagers3)`) as Promise<R>;
const SHOTS = process.env.SHOTS;
type Fx3 = { log(): { kind: string; t: number; size?: number }[] };
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
  ['river', '&critter=river&date=2026-11-04T21:00', 'oku', '[data-critter="pond"][data-water="river"]', false],
  ['pond', '&critter=pond&date=2026-11-04T21:00', 'oku', '[data-critter="pond"][data-water="pond"]', false],
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
    // (the river's: おく as the page's island has it, the layout's, held there)
    if (cam === 'oku') await camTo(page, (await geo(page)).CAMS.oku, false);
    await expect(page.locator(sel)).toBeAttached({ timeout: 10_000 });
    // my villager on its bank (NH casts from where it stands), the camera on the shadow; the reel's tap
    // later where the cast's was (open water: no door, nothing over it)
    const [rx, ry] = await toTheWater(page, water);
    // my villager in 3D (its model in: under CI's software GL that takes a while)
    await expect.poll(() => v3(page, (v) => v.state('mine')), { timeout: 30_000 }).not.toBeNull();
    // the shadow drawn where its tap area is (it swims: a few px of lag between the two at most): the model's spot is its
    // head (Critters' fish3: the body trails behind it), half its length from the tap area's middle
    const half = () => page.locator(`${sel} .fin`).evaluate((el) => { const r = el.getBoundingClientRect(); return Math.max(r.width, r.height) / 2; });
    await expect.poll(async () => apart(await drawnAt(page, sel, `fish-${water}-`)) - (await half()), { timeout: 8000 }).toBeLessThan(16);
    // a tap by the shadow (on open water by where it's drawn): the cast, in place
    await page.mouse.click(rx, ry);
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
    // the bite, read in the page the moment it comes (the float plunged under, a splash, the 「！」 popped over my
    // villager's head, every nibble before it) and the reel at once, in the page (NH's short window: island/fishing.ts
    // BITE_WINDOW_MS); a look at each in turn from here took past it on a loaded runner
    const bite = await page.evaluate(([miss, rx, ry]) => new Promise<{ text: string; nibbles: number; mark: Mark }>((ok, no) => {
      const W = window as unknown as { __fx3: Fx3; __world3d: { bite(slot: string): Mark | null } };
      const t0 = performance.now();
      const look = () => {
        const el = document.querySelector('[data-bobber="bite"]'), l = W.__fx3.log(), mark = W.__world3d.bite('mine');
        const nibbled = l.findLast((e) => e.kind === 'ripple' && e.size === 0.7), splash = !!nibbled && l.some((e) => e.kind === 'splash' && e.t >= nibbled.t);
        if (el && splash && mark?.shown) {
          // the reel: a tap anywhere (a click on the island, as a finger's)
          if (!miss) document.elementFromPoint(rx, ry)?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: rx, clientY: ry }));
          return ok({ text: document.querySelector('[data-bite]')?.textContent ?? '', mark, nibbles: l.filter((e) => e.kind === 'ripple' && e.size === 0.7).length });
        }
        if (performance.now() - t0 > 12_000) return no(new Error('no bite'));
        requestAnimationFrame(look);
      };
      look();
    }), [miss, rx, ry] as const);
    expect(bite.text).toBe('！');
    expect(bite.nibbles).toBeGreaterThanOrEqual(1);
    // straight over my villager's head on screen, its bottom just over the head's top (e2e/bite-mark.spec: every zoom)
    expect(overHead(bite.mark), JSON.stringify(bite.mark)).toEqual([]);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/fish3d-${water}${miss ? '-miss' : ''}-bite.png` });
    if (miss) {
      // it got away (it darts off), the 「！」 with it; the float stays out bobbing (NH), till a tap reels it in
      await expect(page.locator('[data-bobber="wait"]')).toBeAttached({ timeout: 4000 });
      await expect.poll(() => markShown(page), { timeout: 2000 }).toBe(false);
      await expect.poll(() => page.evaluate(() => (window as { __cues?: string[] }).__cues ?? [])).toContain('scene-flee');
      await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
      await page.mouse.click(rx, ry);
      await expect(page.locator('[data-bobber]')).toHaveCount(0);
      return;
    }
    await expect(page.locator('[data-fx="catch"]')).toContainText('釣', { timeout: 4000 });
    // the 「！」 gone with the reel
    await expect.poll(() => markShown(page), { timeout: 2000 }).toBe(false);
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
        // (placed and fading in: a model just made stands at the origin till its first frame)
        if (p && !p.hidden && (p as S & { fade: number }).fade > 0) return { ...p, water: w.water(p.x, -p.z) };
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
    expect(s.y, JSON.stringify(s)).toBeGreaterThan(Math.min(bed, top) - 0.01);
    expect(s.y, JSON.stringify(s)).toBeLessThanOrEqual(top + 0.01);
  });

// The rod stays in the hand at every zoom (the user: "when fishing, the rod's position changes with the zoom level"):
// the rod and a hat, put on after the villager was added to the island, were drawn unbent (engine.ts bend), off the
// bent hand and the line's start by the bend's drop, and slid as a pinch or a scroll moved the camera. Everything on the
// villager is bent with the island, and the rod's tip (the line's start) stays where it is against the villager's feet.
test('3D fishing: the rod stays in the hand, its tip where the line starts, at every zoom', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('?demo&visitor=none&critter=fish&date=2026-11-04T12:00');
  await page.waitForFunction(() => (window as unknown as { __world3d?: W3 }).__world3d?.loaded(), null, { timeout: 30_000 });
  await expect.poll(() => v3(page, (v) => v.state('mine')), { timeout: 30_000 }).not.toBeNull();
  const fish = () => page.evaluate(() => {
    const w = (window as unknown as { __world3d: W3 }).__world3d;
    for (let n = 0; n < 200; n++) {
      const q = w.where(`fish-sea-${n}`);
      if (q && !q.hidden) return [q.x, -q.z, q.y];
    }
    return null;
  });
  await expect.poll(fish, { timeout: 10_000 }).not.toBeNull();
  {
    const [x, z] = (await fish())!;
    await page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z < 0 ? 20 : z + 45), [x, z]);
    // (my 3D villager there)
    await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3: { last(s: string): { x: number } | null } }).__villagers3.last('mine')?.x), { timeout: 5000 }).toBeCloseTo(x, 0);
  }
  // (the shadow drifts: cast by where it is now, on open water)
  const [cx, cy] = await toTheWater(page, 'sea');
  await page.mouse.click(cx, cy);
  await expect(page.locator('[data-bobber="wait"]')).toBeAttached({ timeout: 8000 });
  await expect.poll(() => v3(page, (v) => [v.tool('mine'), v.state('mine')]), { timeout: 15_000 }).toEqual(['tools/rod', 'fish']);
  type V = V3 & { last(slot: string): { x: number; z: number }; unbent(slot: string): string[] };
  type G = { view(): { camZ: number }; go(z: number, k: number): void; camStill(): boolean };
  /** The rod's tip against the villager's feet (three's space: the feet's world z turned), and what's drawn unbent. */
  const tipNow = () => page.evaluate(() => {
    const v = (window as unknown as { __villagers3: V }).__villagers3, t = v.tip('mine'), l = v.last('mine');
    return t && { d: [t[0] - l.x, t[1], t[2] + l.z], unbent: v.unbent('mine') };
  });
  const camZ = await page.evaluate(() => (window as unknown as { __world3d: G }).__world3d.view().camZ);
  let first: number[] | null = null;
  for (const k of [1, 2, 3.2, 1]) {
    await page.evaluate(([z, k]) => (window as unknown as { __world3d: G }).__world3d.go(z, k), [camZ, k]);
    await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: G }).__world3d.camStill()), { timeout: 5000 }).toBe(true);
    const t = (await tipNow())!;
    expect(t.unbent).toEqual([]);
    first ??= t.d;
    // (the fishing pose's breathing and the cast's swing move the tip a little: a few units of the rod's 81)
    expect(Math.hypot(t.d[0] - first[0], t.d[1] - first[1], t.d[2] - first[2])).toBeLessThan(8);
  }
});
