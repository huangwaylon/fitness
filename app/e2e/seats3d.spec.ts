// Sitting and lying on NH's furniture with NH's 3D villagers (villager3d seats: the seat and bed anchors from the
// models' geometry, villager3d sitAt / lieAt): in the tent, my villager sits on a chair, the log sofa and a stool and
// lies on the cot and the log bed; its hips on the seat, its body inside the piece's bounds, never through it.
import { expect, test, type Page } from '@playwright/test';
import { geo } from './island.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00&critter=none&visitor=none';
const SHOTS = process.env.SHOTS;

type B = { state: string; box: [number[], number[]] } | null;
type T = {
  stats(): { frames: number };
  loading(): number;
  fill(codes: string[]): number;
  pieces(): { id: string; item: string; x: number; z: number; f: number }[];
  tile(x: number, z: number): [number, number];
  seat(): { id: string; n: number; lie: boolean } | null;
  v3(w: string): B;
  zoom(f: number): void;
  still(): boolean;
};
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;

async function room(page: Page, code: string) {
  await page.addInitScript(() => localStorage.getItem('seats-seeded') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('seats-seeded', '1')));
  await page.goto('tent' + Q);
  await page.waitForFunction(() => ((window as unknown as { __tent?: T }).__tent?.stats()?.frames ?? 0) > 0);
  expect(await page.evaluate((c) => (window as unknown as { __tent: T }).__tent.fill([c]), code)).toBe(1);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  await expect.poll(() => tent(page, (t) => t.v3('A')), { timeout: 15_000 }).not.toBeNull();
}

for (const [code, lie, name] of [['f4039', false, 'log-chair'], ['f4044', false, 'log-sofa'], ['f4038', false, 'log-stool'], ['f4081', true, 'cot'], ['f4041', true, 'log-bed']] as const) {
  test(`${name}: my villager ${lie ? 'lies on' : 'sits on'} it`, async ({ page }) => {
    test.setTimeout(60_000);
    await room(page, code);
    const p = (await tent(page, (t) => t.pieces()))[0];
    const [x, y] = await page.evaluate(([x, z]) => (window as unknown as { __tent: T }).__tent.tile(x, z), [p.x, p.z] as const);
    await page.mouse.click(x, y);
    await expect.poll(() => tent(page, (t) => t.seat()), { timeout: 8000 }).toMatchObject({ id: p.id, lie });
    await expect.poll(async () => (await tent(page, (t) => t.v3('A')))?.state, { timeout: 8000 }).toBe(lie ? 'lie' : 'sit');
    // settled on it, whole (never strewn by its bones): sitting upright, lying long along the bed and low
    await expect.poll(async () => {
      const b = await tent(page, (t) => t.v3('A'));
      if (!b) return false;
      const [lo, hi] = b.box, h = hi[1] - lo[1];
      return (lie ? h < 12 && Math.max(hi[0] - lo[0], hi[2] - lo[2]) > 11 : h > 9 && h < 19);
    }, { timeout: 8000 }).toBe(true);
    if (SHOTS) {
      await page.waitForTimeout(800);
      await page.evaluate(() => (window as unknown as { __tent: T & { orbit(a: number, p: number): void } }).__tent.zoom(3.2));
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${SHOTS}/tent-${name}.png` });
    }
  });
}

// on the 3D island: the front bench, the pond's log bench and a campfire stool (world.ts SEATS): my villager, put on
// the seat's spot, sits on the piece's own seat
type W3 = { loaded(): boolean; go(z: number, k?: number, x?: number): void };
type V3 = { state(slot: string): string | null };
for (const seat of ['seatMaeL', 'seatPondR', 'stoolW'] as const) {
  test(`island ${seat}: my villager sits on it`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(`?demo&date=2026-11-04T12:00&critter=none&visitor=none`);
    await page.waitForFunction(() => (window as unknown as { __world3d?: W3 }).__world3d?.loaded(), null, { timeout: 30_000 });
    await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3?: V3 }).__villagers3?.state('mine') ?? null), { timeout: 30_000 }).not.toBeNull();
    // (the seat's spot as the page's island has it: the layout's on it)
    const at = (await geo(page)).SEATS[seat], camZ = at[1] - 4;
    await page.evaluate(([x, z]) => (window as unknown as { __world: { put(x: number, z: number): void } }).__world.put(x, z), at);
    await expect.poll(() => page.evaluate(() => (window as unknown as { __villagers3: V3 }).__villagers3.state('mine')), { timeout: 8000 }).toBe('sit');
    if (SHOTS) {
      await page.evaluate(([z, x]) => (window as unknown as { __world3d: W3 }).__world3d.go(z, 2.2, x), [camZ, at[0]] as const);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${SHOTS}/island-${seat}.png` });
    }
  });
}
