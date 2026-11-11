// Lying down and sitting on a turned piece (docs/design.md "The tent": Sit, lie and switch): the bed's pose comes from
// its model (villager3d/seats3d.json) turned with it, so at every facing my villager lies along the bed, its head on
// the pillow's end (NH's beds: the model's −x), on the mattress and inside the footprint; a double bed sleeps two side
// by side; the cold sleep pod's lid shuts over its sleeper and opens before they get up.
import { expect, test, type Page } from './fixtures.ts';
import { roomUp } from './rooms.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00';

type V = { state: string; box: [number[], number[]]; at: number[]; head: number[] | null } | null;
type T = {
  stats(): { frames: number };
  loading(): number;
  fill(codes: string[], f?: number): number;
  pieces(): { id: string; item: string; x: number; z: number; f: number }[];
  tile(x: number, z: number): [number, number];
  seat(): { id: string; n: number; lie: boolean } | null;
  seatAs(w: string, id: string, n: number): boolean;
  lid(id: string): number | null;
  v3(w: string): V;
};
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;

async function room(page: Page, code: string, f: number) {
  await page.addInitScript(() => localStorage.getItem('lie-seeded') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('lie-seeded', '1')));
  await page.goto('tent' + Q);
  await roomUp(page, 'tent');
  expect(await page.evaluate(([c, f]) => (window as unknown as { __tent: T }).__tent.fill([c as string], f as number), [code, f] as const)).toBe(1);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  await expect.poll(() => tent(page, (t) => t.v3('A')), { timeout: 15_000 }).not.toBeNull();
  return (await tent(page, (t) => t.pieces()))[0];
}

/** The footprint's rectangle (model units) and the pillow end's way (the model's −x, turned as the room turns it). */
function bedOf(p: { x: number; z: number; f: number }, w: number, d: number) {
  const [fw, fd] = p.f % 2 ? [d, w] : [w, d], x0 = -40 + p.x * 10, z0 = -40 + p.z * 10;
  const t = (p.f * Math.PI) / 2;
  return { rect: [x0, z0, x0 + fw * 10, z0 + fd * 10], headWay: [-Math.round(Math.cos(t)), Math.round(Math.sin(t))] };
}

async function lieOn(page: Page, p: { id: string; x: number; z: number }) {
  const [x, y] = await page.evaluate(([x, z]) => (window as unknown as { __tent: T }).__tent.tile(x, z), [p.x, p.z] as const);
  await page.mouse.click(x, y);
  await expect.poll(() => tent(page, (t) => t.seat()), { timeout: 8000 }).toMatchObject({ id: p.id, lie: true });
  await lain(page, 'A');
}

/** `w` lying and still (on the bed: its box the same twice running). */
async function lain(page: Page, w: string) {
  let last = '';
  await expect.poll(async () => {
    const v = await page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), w);
    const k = JSON.stringify(v && [...v.box.flat(), ...v.at].map((n) => Math.round(n * 10)));
    const still = k === last && v?.state === 'lie';
    last = k;
    return still;
  }, { timeout: 15_000, intervals: [200] }).toBe(true);
}


// the log bed (2 × 2, a double) and the cot (2 × 1) at a quarter and three quarters turned
for (const [code, w, d, f, name] of [['f4041', 2, 2, 1, 'log-bed'], ['f4081', 2, 1, 3, 'cot']] as const) {
  test(`${name} turned ${f * 90}°: lain along it, the head on the pillow's end, on the mattress`, async ({ page }) => {
    const p = await room(page, code, f);
    await lieOn(page, p);
    const { rect, headWay } = bedOf(p, w, d);
    const v = (await tent(page, (t) => t.v3('A')))!;
    const lo = v.box[0].map((q, i) => q + v.at[i]), hi = v.box[1].map((q, i) => q + v.at[i]);
    // inside the footprint (a hair over for a hand or a foot)
    expect(lo[0]).toBeGreaterThan(rect[0] - 2);
    expect(hi[0]).toBeLessThan(rect[2] + 2);
    expect(lo[2]).toBeGreaterThan(rect[1] - 2);
    expect(hi[2]).toBeLessThan(rect[3] + 2);
    // along the bed's length (the model's x, turned), low on the mattress
    const along = Math.abs(headWay[0]) ? hi[0] - lo[0] : hi[2] - lo[2], across = Math.abs(headWay[0]) ? hi[2] - lo[2] : hi[0] - lo[0];
    expect(along).toBeGreaterThan(across);
    expect(lo[1]).toBeGreaterThan(2);
    // the feet (its group's spot) toward the foot's end, the head (its neck's bone) from them toward the pillow's
    const mid = [(rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2], hd = v.head!, at = v.at;
    expect((at[0] - mid[0]) * headWay[0] + (at[2] - mid[1]) * headWay[1]).toBeLessThan(-3);
    expect((hd[0] - at[0]) * headWay[0] + (hd[2] - at[2]) * headWay[1]).toBeGreaterThan(6);
  });
}

test('a double bed sleeps two side by side', async ({ page }) => {
  const p = await room(page, 'f4041', 2);
  await lieOn(page, p);
  const mine = (await tent(page, (t) => t.seat()))!;
  expect(await page.evaluate(([id, n]) => (window as unknown as { __tent: T }).__tent.seatAs('B', id as string, n as number), [p.id, 1 - mine.n] as const)).toBe(true);
  await lain(page, 'B');
  const [a, b] = [(await tent(page, (t) => t.v3('A')))!, (await tent(page, (t) => t.v3('B')))!];
  // turned half round, the bed's length is along x: the two apart across it (z), their boxes clear of each other
  const az = [a.box[0][2] + a.at[2], a.box[1][2] + a.at[2]], bz = [b.box[0][2] + b.at[2], b.box[1][2] + b.at[2]];
  expect(Math.min(az[1], bz[1]) - Math.max(az[0], bz[0])).toBeLessThan(1);
});

test('the cold sleep pod: its lid shuts over me lying in it, and opens before I get up', async ({ page }) => {
  const p = await room(page, 'f13508', 1);
  expect(await tent(page, (t) => t.lid(t.pieces()[0].id))).toBe(0);
  await lieOn(page, p);
  const lid = () => page.evaluate((id) => (window as unknown as { __tent: T }).__tent.lid(id), p.id);
  await expect.poll(lid, { timeout: 5000 }).toBe(1);
  // shut over me, still lying, settled a little deeper: my top (the head's) under its glass (11.2-11.7 over the floor
  // over the head's middle)
  await expect.poll(async () => ((v) => v && v.state === 'lie' && v.box[1][1] + v.at[1])(await tent(page, (t) => t.v3('A'))), { timeout: 3000 }).toBeLessThan(11.2);
  // a tap on the floor away from it: the lid opens first, me lying till it has, then up and off
  const [x, y] = await page.evaluate((z) => (window as unknown as { __tent: T }).__tent.tile(3, z), p.z >= 4 ? 1 : 6);
  await page.mouse.click(x, y);
  await expect.poll(lid, { timeout: 2000, intervals: [30] }).toBeLessThan(0.95);
  const mid = await page.evaluate((id) => ({ k: (window as unknown as { __tent: T }).__tent.lid(id), v: (window as unknown as { __tent: T }).__tent.v3('A')?.state }), p.id);
  if (mid.k! > 0.05) expect(mid.v).toBe('lie');
  await expect.poll(lid, { timeout: 3000 }).toBe(0);
  await expect.poll(() => tent(page, (t) => t.seat()), { timeout: 3000 }).toBeNull();
  await expect.poll(async () => (await tent(page, (t) => t.v3('A')))?.state, { timeout: 5000 }).not.toBe('lie');
});
