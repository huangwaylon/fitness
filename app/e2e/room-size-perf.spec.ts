// A furnished room's cost by size (docs/ops/perf.md "Rooms by size"): 60 typical pieces in the 8 × 8 against 120 in
// the 10 × 10 and the long 8 × 16, by day and by night (eight lamp lights), at the iPhone's 393 × 852: draw calls,
// triangles, the GPU's geometries, textures and programs, a frame drawn and read back (GPU-synced: 60 draws back to
// back, with and without the shadow map drawn again), a frame's own cost (CPU) and the gaps of a camera's full turn. On demand (ROOM_PERF=1; ?checks=0): it reads
// the page's clocks, which a loaded runner skews; the numbers go to the console and ROOM_PERF_OUT (JSON).
//   ROOM_PERF=1 ROOM_PERF_OUT=/tmp/rooms/perf.json npx playwright test room-size-perf --project=webkit --workers=1
import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from './fixtures.ts';
import { roomUp, tentStill } from './rooms.ts';
import base from '../src/lib/components/tent/items.json' with { type: 'json' };
import more from '../src/lib/components/tent/more.json' with { type: 'json' };

test.skip(!process.env.ROOM_PERF, 'the rooms’ cost by size runs on demand (ROOM_PERF=1)');
test.use({ viewport: { width: 393, height: 852 } });

type M = { w?: number; d?: number; rug?: number; wl?: number; cl?: number; lt?: number; sm?: number; s?: number; kb?: number };
const ITEMS = { ...base.items, ...more.items } as Record<string, M>;
const codes = Object.keys(ITEMS).sort();
/** Every k-th of those that pass, to `n`: a spread of the catalogue, the same each run. */
const pick = (n: number, ok: (m: M) => boolean, k = 7) => {
  const all = codes.filter((c) => ok(ITEMS[c]));
  return Array.from({ length: n }, (_, i) => all[(i * k) % all.length]);
};
const floor = (m: M) => !m.rug && !m.wl && !m.cl;
/** A furnished room's mix, as the tray's kinds go: furniture (lamps and tables among it), rugs, wall things and the
 *  ceiling's; ~80 kinds, some twice. Its first half is the 60's. */
const MIX = (() => {
  const lamps = pick(8, (m) => floor(m) && !!m.lt && (m.w ?? 1) * (m.d ?? 1) === 1, 5);
  const ones = pick(26, (m) => floor(m) && !m.lt && (m.w ?? 1) * (m.d ?? 1) === 1, 11);
  const twos = pick(16, (m) => floor(m) && !m.lt && (m.w ?? 1) * (m.d ?? 1) === 2, 13);
  const rugs = pick(12, (m) => !!m.rug && (m.w ?? 1) * (m.d ?? 1) <= 4, 5);
  const walls = pick(28, (m) => !!m.wl && (m.w ?? 1) <= 2, 3);
  const ceil = pick(14, (m) => !!m.cl, 3);
  const half = (xs: string[]) => [xs.slice(0, xs.length / 2), xs.slice(xs.length / 2)];
  const parts = [lamps, ones, ones.slice(0, 16), twos, rugs, walls, ceil].map(half);
  return [...parts.flatMap((p) => p[0]), ...parts.flatMap((p) => p[1])];
})();

type Stats = { frames: number; shadows: number; calls: number; tris: number; dpr: number; mem: [number, number, number]; lamps: number[] };
type T = { stats(): Stats; still(): boolean; loading(): number; fill(c: string[]): number; resize(n: number): boolean; size(): number; pieces(): { item: string }[]; drawMs(n: number, shadows?: boolean): number; orbitBench(steps?: number): Promise<{ cost: { p50: number; p95: number }; gap: { p50: number; p95: number } }> };
const te = <R,>(page: Page, fn: (t: T) => R | Promise<R>) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const r2 = (x: number) => Math.round(x * 100) / 100;

const CASES = [
  { size: 8, n: 60 },
  { size: 10, n: 120 },
  { size: 16, n: 120 }
] as const;

const rows: Record<string, unknown>[] = [];
test.afterAll(() => {
  console.table(rows);
  if (process.env.ROOM_PERF_OUT) writeFileSync(process.env.ROOM_PERF_OUT, JSON.stringify(rows, null, 1));
});

for (const night of [false, true]) for (const c of CASES) {
  test(`${c.n} pieces in the ${c.size === 16 ? '8 × 16' : `${c.size} × ${c.size}`}${night ? ' at night' : ''}`, async ({ page, browserName }) => {
    await page.goto(`tent?demo&checks=0&preview=0&date=2026-11-04T${night ? '22' : '12'}:00`);
    await roomUp(page, 'tent');
    expect(await te(page, (t) => t.pieces().length)).toBe(0);
    await page.evaluate((n) => (window as unknown as { __tent: T }).__tent.resize(n), c.size);
    const placed = await page.evaluate((list) => (window as unknown as { __tent: T }).__tent.fill(list), MIX.slice(0, c.n));
    await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0, null, { timeout: 25_000 });
    await tentStill(page, 10_000);
    const s = await te(page, (t) => t.stats());
    const items = await te(page, (t) => t.pieces().map((p) => p.item));
    const kb = items.reduce((a, code) => a + (ITEMS[code]?.kb ?? 0), 0);
    // five rounds of 60 draws each (the GPU drained once a round), with and without the shadow map drawn again
    const draw: number[] = [], shadow: number[] = [];
    for (let i = 0; i < 5; i++) {
      draw.push(await te(page, (t) => t.drawMs(60)));
      shadow.push(await te(page, (t) => t.drawMs(60, true)));
    }
    const bench = await te(page, (t) => t.orbitBench(180));
    const row = {
      browser: browserName, night, size: c.size, pieces: placed, kinds: new Set(items).size, modelKB: Math.round(kb), calls: s.calls, tris: s.tris, geometries: s.mem[0], textures: s.mem[1], programs: s.mem[2],
      lampsLit: s.lamps.filter((k) => k > 0).length, dpr: s.dpr, drawMs: r2(med(draw)), withShadowMs: r2(med(shadow)), cpuP50: bench.cost.p50, cpuP95: bench.cost.p95, gapP95: r2(bench.gap.p95)
    };
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/perf-${c.size}-${c.n}${night ? '-night' : ''}.png` });
    rows.push(row);
    console.log(JSON.stringify(row));
  });
}
