// Uses at once in a full room (docs/ops/perf.md "Uses"): 60 typical pieces in the 8 × 8 with the treadmill, the bike and a
// yoga mat among them, my villager running and two others (the partner's, the guest's: as heard from their phones) on the
// bike and the mat, nobody touching: frames a second (a use's loop draws at the idle rate, 12, not the full 30), a frame's
// own cost (CPU), a frame drawn and read back (GPU-synced), draw calls; against the same room at rest. On demand
// (USE_PERF=1; the numbers go to the console and USE_PERF_OUT).
//   USE_PERF=1 USE_PERF_OUT=/tmp/interact-b/perf.json npx playwright test room-use-perf --project=webkit --workers=1
import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from './fixtures.ts';
import { roomUp, tentStill } from './rooms.ts';
import base from '../src/lib/components/tent/items.json' with { type: 'json' };
import more from '../src/lib/components/tent/more.json' with { type: 'json' };

test.skip(!process.env.USE_PERF, 'uses at once run on demand (USE_PERF=1)');
test.use({ viewport: { width: 393, height: 852 } });

type M = { w?: number; d?: number; rug?: number; wl?: number; cl?: number; lt?: number };
const ITEMS = { ...base.items, ...more.items } as Record<string, M>;
const floor = Object.keys(ITEMS).sort().filter((c) => { const m = ITEMS[c]; return !m.rug && !m.wl && !m.cl && (m.w ?? 1) * (m.d ?? 1) <= 2; });
// (a piece stood at goes in last, by the walls: a step in front of it left free)
const MIX = (used: string[], stood = false) => (stood ? [...Array.from({ length: 36 }, (_, i) => floor[(i * 11) % floor.length]), ...used] : [...used, ...Array.from({ length: 57 }, (_, i) => floor[(i * 11) % floor.length])]);

type T = {
  stats(): { frames: number; calls: number; tris: number; cost: number[] };
  loading(): number; fill(c: string[]): number; pieces(): { id: string; item: string; x: number; z: number }[];
  seatAs(w: string, id: string, n: number): boolean; walkTo(x: number, z: number): void; seat(): unknown; v3(w: string): { state: string } | null;
  drawMs(n: number): number; px(x: number, z: number, y?: number): [number, number];
};
const te = <R,>(page: Page, fn: string) => page.evaluate(fn) as Promise<R>;
const rows: Record<string, unknown>[] = [];
test.afterAll(() => {
  console.table(rows);
  if (process.env.USE_PERF_OUT) writeFileSync(process.env.USE_PERF_OUT, JSON.stringify(rows, null, 1));
});

/** `ms` of the page's own clock gone by (untouched: the state polled, no sleep). */
const after = async (page: Page, ms: number) => {
  const t0 = await page.evaluate(() => performance.now());
  await expect.poll(() => page.evaluate((t0) => performance.now() - t0, t0), { timeout: ms + 5000, intervals: [250] }).toBeGreaterThan(ms);
};
/** Frames a second and the frames' own cost over `ms`, untouched. */
async function sample(page: Page, ms: number) {
  const f0 = await te<number>(page, 'window.__tent.stats().frames');
  await after(page, ms);
  const s = await te<{ frames: number; calls: number; tris: number; cost: number[] }>(page, 'window.__tent.stats()');
  const cost = [...s.cost].sort((a, b) => a - b);
  return { fps: Math.round(((s.frames - f0) / ms) * 10000) / 10, calls: s.calls, tris: s.tris, costP50: cost[Math.floor(cost.length / 2)], costP95: cost[Math.floor(cost.length * 0.95)] };
}

/** Three uses at once in the full room: my villager taps the first piece, the partner and the guest are put on the other
 *  two (as heard from their phones); their states are `want`. */
async function threeUses(page: Page, browserName: string, label: string, USED: string[], want: string) {
  await page.goto('tent?demo&checks=0&preview=0&date=2026-11-04T12:00');
  await roomUp(page, 'tent');
  await page.evaluate(() => localStorage.removeItem('island-demo.tent'));
  await page.goto('tent?demo&checks=0&preview=0&date=2026-11-04T12:00');
  await roomUp(page, 'tent');
  expect(await te<number>(page, `window.__tent.fill(${JSON.stringify(MIX(USED, label.includes("stood")))})`)).toBeGreaterThan(35);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0, null, { timeout: 60_000 });
  await tentStill(page, 20_000);
  const rest = await sample(page, 4000);
  const drawRest = await te<number>(page, 'window.__tent.drawMs(60)');
  const ps = await te<T['pieces'] extends () => infer R ? R : never>(page, 'window.__tent.pieces()');
  const [tread, bike, mat] = USED.map((c) => ps.find((p) => p.item === c)!);
  expect(await te<boolean>(page, `window.__tent.seatAs('B', '${bike.id}', 0)`)).toBe(true);
  expect(await te<boolean>(page, `window.__tent.seatAs('G', '${mat.id}', 0)`)).toBe(true);
  // (a spot on screen where a tap is the treadmill, not what stands in front of it)
  let at: [number, number] | null = null;
  for (const dx of [5, 15]) for (const yy of [0.2, 1.5, 4, 8]) {
    if (at) break;
    const p = await te<[number, number]>(page, `window.__tent.px(${-40 + tread.x * 10 + dx}, ${-40 + tread.z * 10 + 5}, ${yy})`);
    if ((await te<{ id?: string } | null>(page, `window.__tent.hit(${p[0]}, ${p[1]})`))?.id === tread.id) at = p;
  }
  expect(at).not.toBeNull();
  await page.mouse.click(at![0], at![1]);
  await expect.poll(() => te<string | null>(page, `window.__tent.v3('A')?.state ?? null`), { timeout: 15_000 }).toBe(want.split('/')[0]);
  await after(page, 2500);
  const used = await sample(page, 6000);
  const drawUsed = await te<number>(page, 'window.__tent.drawMs(60)');
  rows.push({ browser: browserName, case: `${label} at rest`, ...rest, drawMs: Math.round(drawRest * 100) / 100 });
  const states = await te<string>(page, "['A', 'B', 'G'].map((w) => window.__tent.v3(w)?.state).join('/')");
  rows.push({ browser: browserName, case: label, ...used, drawMs: Math.round(drawUsed * 100) / 100, states });
  expect(states).toBe(want);
  // the loops alone: the idle rate, not the full one
  expect(used.fps).toBeGreaterThan(8);
  expect(used.fps).toBeLessThan(16);
}

test('three uses at once in a full room: the idle rate, the frame\'s cost', ({ page, browserName }) => threeUses(page, browserName, '3 uses', ['f290', 'f287', 'f13683'], 'run/pedal/yoga'));
// the uses stood at (poses-stand.ts): the stove's steam, the props in hand (the pot, the book) (standFx.ts)
test('three uses stood at in a full room: still the idle rate', ({ page, browserName }) => threeUses(page, browserName, '3 stood at', ['f292', 'f1558', 'f1128'], 'cook/read/type'));
