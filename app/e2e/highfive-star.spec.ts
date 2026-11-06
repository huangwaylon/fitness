// The high five's star (docs/design.md "Villager taps"): every tap on the partner flies the star from my villager to
// theirs on both phones, from the very first after the island opens, for its whole flight. It's the 3D island's own
// flourish (world3d/effects.ts `zap`: a star in code, unlit, warmed with the island): before, it was a lit model
// instance of the island's things, loaded on first use (the first high five after opening had none: it came after the
// flight was over) and drawn black (no normals, its colours ignored). Two tabs of the demo, its relay between them.
import { expect, test, type Page } from './fixtures.ts';
import { is3d, quiet } from './island.ts';

const q = (who: 'A' | 'B') => `?demo&date=2026-11-04T12:00&critter=none${who === 'B' ? '&as=B' : ''}`;
type Live = { x: number; y: number; z: number; s: number };
type Fx3 = { live(name: string): Live[] };

/** Each frame for at least `ms`: when (ms since the page's epoch: the same clock for both tabs), the zap's parts drawn
 *  (scale > 0) and where the first is. */
const watch = (p: Page, ms: number) =>
  p.evaluate((ms) => new Promise<{ t: number; n: number; x: number | null }[]>((done) => {
    const fx = (window as unknown as { __fx3: Fx3 }).__fx3, out: { t: number; n: number; x: number | null }[] = [];
    const f = () => {
      const z = fx.live('zap');
      out.push({ t: performance.timeOrigin + performance.now(), n: z.length, x: z[0]?.x ?? null });
      if (out.length < 3 || out[out.length - 1].t - out[0].t < ms) requestAnimationFrame(f);
      else done(out);
    };
    requestAnimationFrame(f);
  }), ms);

test('20 high fives in a row: each flies the star from mine to the partner on both phones, the first one too, for its whole flight', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a 0.5 s flight sampled frame by frame, which a software-GL frame of 0.5–1 s can’t show' } }, async ({ browser }) => {
  test.setTimeout(150_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const open = async (who: 'A' | 'B') => {
    const p = await ctx.newPage();
    await p.goto(q(who));
    await p.waitForFunction(() => (window as unknown as { __world?: { state?: unknown } }).__world?.state);
    return p;
  };
  const a = await open('A'), b = await open('B');
  // both islands in and their opening beats over (B opened last: its models still loading and parsing held its frames
  // through high five 1's flight, the star missing in 11–17 of its mid-flight frames on B, 15 flaky runs in a day)
  for (const p of [a, b]) {
    expect(await is3d(p)).toBe(true);
    await quiet(p);
  }
  const mx = () => a.evaluate(() => (window as unknown as { __world: { mine(): [number, number] } }).__world.mine()[0]);
  const px = () => a.evaluate(() => (window as unknown as { __world: { partner(): [number, number] } }).__world.partner()[0]);
  for (let i = 0; i < 20; i++) {
    const [m0, p0] = [await mx(), await px()];
    const wa = watch(a, 800), wb = watch(b, 800);
    const tap = await a.evaluate(() => performance.timeOrigin + performance.now());
    await a.locator('[data-actor="partner"] .vil').click();
    const [ra, rb] = await Promise.all([wa, wb]);
    for (const [who, r] of [['A', ra], ['B', rb]] as const) {
      const on = r.filter((f) => f.n > 0);
      expect(on.length, `high five ${i + 1}: the star on ${who}`).toBeGreaterThan(0);
      expect(Math.max(...r.map((f) => f.n)), `high five ${i + 1}: one star on ${who}`).toBe(1);
      // in every frame of its flight (0.52 s from the tap; B's from the tap's relay time, heard a moment later): the
      // frames between 0.16 and 0.44 s after the tap, whatever it took to come or a stall meanwhile (CI's first high
      // five holds a tab's frames ~0.5 s in the compositor, no script running: not the phones')
      const mid = r.filter((f) => f.t - tap > 160 && f.t - tap < 440);
      expect(mid.filter((f) => f.n === 0).length, `high five ${i + 1}: frames without the star mid-flight on ${who} (${mid.length})`).toBe(0);
      // from my villager toward the partner's (each phone's x for the same two), where its flight was seen
      const xs = on.map((f) => f.x!);
      if (on[on.length - 1].t - on[0].t > 300) expect(Math.abs(xs[xs.length - 1] - xs[0]), `high five ${i + 1}: the star flew on ${who}`).toBeGreaterThan(Math.abs(p0 - m0) * 0.4);
    }
    // (one at a time: the next once this one's over on both)
    await a.waitForTimeout(2000);
  }
  await ctx.close();
});

// Advisory (the drawn smoke: CI's software GL isn't the phones' Metal, docs/ops/testing.md): the star is drawn sharp,
// gold and whole, mid-flight: no texture to blur (geometry in its colours), or one at least as many pixels as it covers
// on the screen at the device's pixel ratio; and on the screenshot, its gold covers a star's size round where it is.
test('the high five\'s star is drawn sharp mid-flight: no texture smaller than it shows, its gold on the screen', { tag: '@render' }, async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(q('A'));
  await page.waitForFunction(() => (window as unknown as { __world3d?: { loaded(): boolean } }).__world3d?.loaded());
  await quiet(page);
  // the high five's star as it flies, held up between the two for long enough to see (a software-GL frame is ~0.5 s,
  // its flight 0.52 s: the logic spec above times the flight itself)
  await page.evaluate(() => {
    const W = window as unknown as { __world: { mine(): [number, number]; partner(): [number, number] }; __world3d: { fx(k: string, x: number, z: number, l: number, o: object): void } };
    const [ax, az] = W.__world.mine(), [bx, bz] = W.__world.partner();
    W.__world3d.fx('zap', (ax + bx) / 2, (az + bz) / 2, 60, { ms: 8000 });
  });
  await page.waitForFunction(() => (window as unknown as { __fx3: Fx3 }).__fx3.live('zap').some((p) => p.s > 10), null, { polling: 'raf', timeout: 10_000 });
  // (two frames more: drawn at that size)
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  // the frames held where they are (the canvas keeps the last one drawn) while it's measured and shot
  const at = await page.evaluate(() => {
    const W = window as unknown as {
      __fx3: Fx3 & { maps(n: string): ([number, number] | null)[][] }; __held?: FrameRequestCallback[];
      __world3d: { client(x: number, z: number, l?: number): [number, number]; water(x: number, z: number): [number, number] };
    };
    window.requestAnimationFrame = (f) => ((W.__held ??= []).push(f), 0);
    const p = W.__fx3.live('zap')[0], lift = p.y - W.__world3d.water(p.x, p.z)[1];
    const c = W.__world3d.client(p.x, p.z, lift), up = W.__world3d.client(p.x + p.s, p.z, lift);
    return { c, r: Math.hypot(up[0] - c[0], up[1] - c[1]), maps: W.__fx3.maps('zap').flat(), dpr: devicePixelRatio };
  });
  const png = (await page.screenshot()).toString('base64');
  const gold = await page.evaluate(async ({ png, c, r }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${png}`;
    await img.decode();
    const k = img.width / innerWidth, box = Math.ceil((r * 1.6 + 6) * k), cx = Math.round(c[0] * k), cy = Math.round(c[1] * k);
    const cv = document.createElement('canvas');
    cv.width = cv.height = box * 2;
    const g = cv.getContext('2d')!;
    g.drawImage(img, cx - box, cy - box, box * 2, box * 2, 0, 0, box * 2, box * 2);
    const d = g.getImageData(0, 0, box * 2, box * 2).data;
    let n = 0, x0 = Infinity, x1 = -Infinity;
    for (let i = 0; i < d.length; i += 4) {
      const [R, G, B] = [d[i], d[i + 1], d[i + 2]];
      if (R > 235 && G > 200 && B < 165) {
        n++;
        const x = (i / 4) % (box * 2);
        x0 = Math.min(x0, x), x1 = Math.max(x1, x);
      }
    }
    return { n, across: n ? (x1 - x0 + 1) / k : 0, k };
  }, { png, c: at.c, r: at.r });
  console.log(`the star mid-flight: radius ${at.r.toFixed(1)} px, ${gold.n} gold device px, ${gold.across.toFixed(1)} px across; maps ${JSON.stringify(at.maps)}`);
  // a texture (none now) at least as big as the star shows at the device's pixel ratio
  for (const m of at.maps) if (m) expect(Math.min(...m), 'its texture covers its pixels').toBeGreaterThanOrEqual(at.r * 2 * at.dpr);
  // its gold there, about a star's size (as wide as its radius at least: its points)
  expect(gold.n, 'its gold on the screen').toBeGreaterThan(at.r * at.r * gold.k * gold.k * 0.15);
  expect(gold.across, 'its gold across').toBeGreaterThan(at.r);
});
