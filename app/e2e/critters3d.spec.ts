// The critters on the 3D island never pop (the user: "they'll suddenly flash in and flash out. They should fade in,
// and fade out, and swim away fast with a wiggle if escaping. They should also nudge the ball when being baited";
// docs/design.md "Fishing"): a fish's shadow and a bug fade in where they come (an opacity ramp and a slight scale-up,
// world3d/things.ts) and out where they go; they move smoothly (no jump between frames, glide.ts); my cast's fish turns
// to the float and each nibble is its nose touching it; scared, it darts off fast and fades as it goes. The game's state
// says where each model is (__world3d.where: its spot, its fade, its scale), sampled every frame in the page.
import { expect, test, type Page } from './fixtures.ts';
import { is3d, toTheWater, w3 } from './island.ts';

test.use({ viewport: { width: 393, height: 852 } });

type Sample = { t: number; x: number; z: number; fade: number; scale: number; hidden: boolean; line?: boolean } | null;
type Fx3 = { log(): { kind: string; t: number; size?: number }[] };

/** The id of the first model `prefix`N there is (polled). */
async function modelId(page: Page, prefix: string): Promise<string> {
  const find = () => w3(page, new Function('w', `for (let n = 0; n < 400; n++) if (w.where('${prefix}' + n)) return '${prefix}' + n; return null;`) as (w: unknown) => string | null);
  await expect.poll(find, { timeout: 30_000, message: `a model ${prefix}N` }).not.toBeNull();
  return (await find())!;
}

/** `id`'s spot, fade and scale every frame for `ms` (in the page: a sample from the test would skip frames). */
const sample = (page: Page, id: string, ms: number) => page.evaluate(([id, ms]) => new Promise<Sample[]>((ok) => {
  const w = (window as unknown as { __world3d: { where(id: string): { x: number; z: number; fade: number; scale: number; hidden: boolean } | null } }).__world3d;
  const out: Sample[] = [], t0 = performance.now();
  const frame = () => {
    const p = w.where(id);
    out.push(p && { t: performance.now() - t0, x: p.x, z: p.z, fade: p.fade, scale: p.scale, hidden: p.hidden, line: !!document.querySelector('[data-bobber="bite"]') });
    if (performance.now() - t0 < ms) requestAnimationFrame(frame);
    else ok(out);
  };
  frame();
}), [id, ms] as const);

/** The first model `prefix`N's spot, fade and scale every frame from the frame it comes for `ms` after (in the page, from
 *  before it's there: a poll from the test found it late, now and then 0.8 faded in already under CI's load). */
const sampleFirst = (page: Page, prefix: string, ms: number) => page.evaluate(([prefix, ms]) => new Promise<Sample[]>((ok, no) => {
  const w = (window as unknown as { __world3d: { where(id: string): { x: number; z: number; fade: number; scale: number; hidden: boolean } | null } }).__world3d;
  const out: Sample[] = [], start = performance.now();
  let id: string | null = null, t0 = 0;
  const frame = () => {
    if (!id) {
      for (let n = 0; n < 400 && !id; n++) if (w.where(prefix + n)) id = prefix + n;
      if (!id) return performance.now() - start > 30_000 ? no(new Error(`no model ${prefix}N`)) : void requestAnimationFrame(frame);
      t0 = performance.now();
    }
    const p = w.where(id);
    out.push(p && { t: performance.now() - t0, x: p.x, z: p.z, fade: p.fade, scale: p.scale, hidden: p.hidden });
    if (performance.now() - t0 < ms) requestAnimationFrame(frame);
    else ok(out);
  };
  frame();
}), [prefix, ms] as const);

/** The biggest move between two frames (u), at 60 frames a second (a slow frame of a busy runner moves it further:
 *  speed, not a jump). */
const maxStep = (s: Sample[]) => {
  let m = 0;
  // (one faded out to nothing has no spot)
  const on = (p: Sample): p is NonNullable<Sample> => !!p && p.fade > 0;
  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1], b = s[i];
    if (on(a) && on(b)) m = Math.max(m, (Math.hypot(b.x - a.x, b.z - a.z) * (1000 / 60)) / Math.max(1000 / 60, b.t - a.t));
  }
  return m;
};

/** How long its fade took to come in whole (ms), from its first frame shown: a pop is one frame; things.ts's fade-in
 *  takes FADE_IN_MS (600). (Its first frame shown may come late, half faded in already, under a busy runner: the
 *  time it then still takes, not where it starts, says it faded.) */
const fadeInMs = (shown: NonNullable<Sample>[]) => (shown.find((p) => p.fade >= 0.99)?.t ?? Infinity) - shown[0].t;

/** A ramp: from under `lo` to over `hi` (or back), through at least `n` frames between. */
const ramps = (fades: number[], n = 3) => fades.filter((f) => f > 0.05 && f < 0.95).length >= n;

test('a fish shadow fades in where it comes and swims smoothly: never a jump between frames', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: frame-by-frame smoothness, and drawn under software GL the ambience runs at 2 frames a second' } }, async ({ page }) => {
  await page.goto('?demo&visitor=none&critter=fish&date=2026-11-04T12:00');
  expect(await is3d(page)).toBe(true);
  const s = await sampleFirst(page, 'fish-sea-', 4000);
  const shown = s.filter((p): p is NonNullable<Sample> => !!p && !p.hidden);
  // faded in: from (nearly) nothing, through the frames of a ramp, to whole; a slight scale-up with it
  expect(shown[0].fade).toBeLessThan(0.75);
  expect(fadeInMs(shown)).toBeGreaterThan(150);
  expect(ramps(shown.map((p) => p.fade))).toBe(true);
  expect(shown.at(-1)!.fade).toBe(1);
  expect(shown[0].scale).toBeLessThan(0.95);
  expect(shown.at(-1)!.scale).toBeCloseTo(1, 2);
  // it swims (moved), and smoothly: no frame jumps it more than a few units (its head swinging round as it turns about
  // its middle)
  expect(Math.hypot(shown.at(-1)!.x - shown[0].x, shown.at(-1)!.z - shown[0].z)).toBeGreaterThan(2);
  expect(maxStep(s)).toBeLessThan(8);
});

/** The fishing flow up to my float waiting on the water, the fish swimming up to it (fishing3d.spec's start). */
async function castAtFish(page: Page): Promise<string> {
  await page.goto('?demo&visitor=none&critter=fish&date=2026-11-04T12:00');
  expect(await is3d(page)).toBe(true);
  const id = await modelId(page, 'fish-sea-');
  // my villager on the beach by the shadow (NH casts from where it stands), and a tap by it
  const [x, y] = await toTheWater(page, 'sea');
  await page.mouse.click(x, y);
  await expect(page.locator('[data-bobber="wait"]')).toBeAttached({ timeout: 5000 });
  return id;
}

test('baited: the fish turns to the float, and each nibble is its nose touching it (backed off between)', async ({ page }) => {
  test.setTimeout(120_000);
  // (a fish may bite without a nibble, as in NH: then once more)
  for (let i = 0; ; i++) if ((await baited(page)) || i === 3) break;
});

/** One cast's nibbles checked; false when the fish bit with none. */
async function baited(page: Page): Promise<boolean> {
  const id = await castAtFish(page);
  // every frame till the bite: the nose (the model's spot: the shadow's head) to the float, and the nibbles' times
  const s = await page.evaluate((id) => new Promise<{ t: number; d: number }[]>((ok) => {
    const w = (window as unknown as { __world3d: { where(id: string): { x: number; z: number; hidden: boolean } | null } }).__world3d;
    const out: { t: number; d: number }[] = [];
    const frame = () => {
      const f = w.where(id), b = w.where('bobber');
      if (f && b && !f.hidden && !b.hidden) out.push({ t: performance.now(), d: Math.hypot(f.x - b.x, f.z - b.z) });
      if (document.querySelector('[data-bobber="bite"]') || !document.querySelector('[data-bobber]')) ok(out);
      else requestAnimationFrame(frame);
    };
    frame();
  }), id);
  const nibbles = await page.evaluate(() => (window as unknown as { __fx3: Fx3 }).__fx3.log().filter((e) => e.kind === 'ripple' && e.size === 0.7).map((e) => e.t));
  if (!nibbles.length) return false;
  // each nibble: the nose at the float (within a unit) in the ~200 ms round its dip
  for (const n of nibbles) {
    const near = s.filter((p) => p.t >= n - 30 && p.t <= n + 250).map((p) => p.d);
    expect(Math.min(...near), `the nibble at ${Math.round(n)}`).toBeLessThan(1);
  }
  // and between them backed off a little (not glued to it), never far (it stays with the float)
  const settled = s.filter((p) => p.t > nibbles[0] + 450 && nibbles.every((n) => p.t < n - 30 || p.t > n + 450)).map((p) => p.d);
  if (settled.length) {
    expect(Math.max(...settled)).toBeGreaterThan(1.5);
    expect(Math.max(...settled)).toBeLessThan(6);
  }
  expect(maxStep(s.map((p) => ({ t: p.t, x: p.d, z: 0, fade: 1, scale: 1, hidden: false })))).toBeLessThan(4);
  return true;
}

test('a missed bite: the fish darts away fast with a wiggle, fading as it goes', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: frame-by-frame smoothness, and drawn under software GL the ambience runs at 2 frames a second' } }, async ({ page }) => {
  test.setTimeout(60_000);
  const id = await castAtFish(page);
  await expect(page.locator('[data-bobber="bite"]')).toBeAttached({ timeout: 15_000 });
  // no tap: once the bite's window is over it's scared off (the float back up, waiting: NH): every frame from the bite on
  const all = await sample(page, id, 3400);
  const from = all.findIndex((p) => !!p && !p.line);
  expect(from).toBeGreaterThan(0);
  const s = all.slice(from), seen = s.filter((p): p is NonNullable<Sample> => !!p);
  // it fades out over frames (not gone in one), and is gone at the end
  expect(seen[0].fade).toBeGreaterThan(0.6);
  expect(ramps(seen.map((p) => p.fade))).toBe(true);
  expect(s.at(-1) === null || s.at(-1)!.fade === 0).toBe(true);
  // fast: over 30u a second while it's seen (a dawdle's 40u takes 2.5–6 s), smoothly
  const left = seen.filter((p) => p.fade > 0), [a, b] = [left[0], left.at(-1)!];
  expect((Math.hypot(b.x - a.x, b.z - a.z) / (b.t - a.t)) * 1000).toBeGreaterThan(30);
  // (it turns tail and bolts: its head swings round over its body's length as it darts, ~90u in its first quarter
  // second, slowing; a jump would be all of that in one frame)
  expect(maxStep(s)).toBeLessThan(25);
});

test('a bug fades in where it comes, moves smoothly, and fades out where it goes (never popped)', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: frame-by-frame smoothness, and drawn under software GL the ambience runs at 2 frames a second' } }, async ({ page }) => {
  await page.goto('?demo&visitor=none&critter=common-butterfly&date=2026-05-04T11:00');
  expect(await is3d(page)).toBe(true);
  const s = await sampleFirst(page, 'bug-', 2500);
  const id = await modelId(page, 'bug-');
  const shown = s.filter((p): p is NonNullable<Sample> => !!p && !p.hidden);
  expect(shown[0].fade).toBeLessThan(0.75);
  expect(fadeInMs(shown)).toBeGreaterThan(150);
  expect(ramps(shown.map((p) => p.fade))).toBe(true);
  expect(shown.at(-1)!.fade).toBe(1);
  expect(shown[0].scale).toBeLessThan(0.95);
  expect(maxStep(s)).toBeLessThan(12);
  // netted (a tap on it where it's drawn): gone from the island, its model fades out where it was
  const [bx, by] = await w3(page, new Function('w', `const q = w.where('${id}'); return w.client(q.x, -q.z, q.y);`) as (w: unknown) => number[]);
  await page.mouse.click(bx, by);
  const out = await sample(page, id, 2500);
  const going = out.filter((p): p is NonNullable<Sample> => !!p);
  expect(going.length).toBeGreaterThan(2);
  expect(ramps(going.map((p) => p.fade))).toBe(true);
  expect(out.at(-1) === null || out.at(-1)!.fade === 0).toBe(true);
});
