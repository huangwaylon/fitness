// Sitting on the pieces NH's sheet leaves unused (docs/design.md "The tent": Sit, lie and switch; room-models.ts
// USE_HINT): a tap on a toilet, a rocking chair or the lifeguard chair sits my villager on its seat (the lifeguard
// chair's up its ladder), the rocking chair rocking. WebKit taps, Chromium clicks. `SHOTS=<dir>` writes
// shot-<name>-<browser>.png.
import { expect, test, type Page } from './fixtures.ts';
import { roomUp } from './rooms.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00';

type V = { state: string; box: [number[], number[]]; at: number[] } | null;
type T = {
  loading(): number;
  fill(codes: string[], f?: number): number;
  pieces(): { id: string; item: string; x: number; z: number; f: number }[];
  px(x: number, z: number, y?: number): [number, number];
  seat(): { id: string; n: number; lie: boolean } | null;
  v3(w: string): V;
};
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;

/** The room with just this piece, facing us, drawn with my villager in. */
async function room(page: Page, code: string) {
  await page.addInitScript(() => localStorage.getItem('interact-seeded') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('interact-seeded', '1')));
  await page.goto('tent' + Q);
  await roomUp(page, 'tent');
  expect(await page.evaluate((c) => (window as unknown as { __tent: T }).__tent.fill([c], 0), code)).toBe(1);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  await expect.poll(() => tent(page, (t) => t.v3('A')), { timeout: 15_000 }).not.toBeNull();
  return (await tent(page, (t) => t.pieces()))[0];
}

/** `w` seated and still (its spot the same twice running; `rocks`: its height moving between polls instead). */
async function seated(page: Page, rocks = false) {
  const ys: number[] = [];
  await expect.poll(async () => {
    const v = await tent(page, (t) => t.v3('A'));
    if (v?.state !== 'sit') return false;
    ys.push(v.at[1]);
    const last = ys.slice(-6);
    return rocks ? last.length === 6 && Math.max(...last) - Math.min(...last) > 0.2 : last.length >= 2 && Math.abs(last[last.length - 1] - last[last.length - 2]) < 1e-3;
  }, { timeout: 15_000, intervals: [150] }).toBe(true);
  return (await tent(page, (t) => t.v3('A')))!;
}

// each piece (1 × 1): its seat's height (seats3d.json / seats-more.json), rocking or not
for (const [code, name, y, rocks] of [['f1929', 'toilet', 5, false], ['f1103', 'rocking-chair', 5, true], ['f3345', 'lifeguard-chair', 15.1, false]] as const) {
  test(`a tap on the ${name} sits my villager on it`, async ({ page, browserName }) => {
    const p = await room(page, code);
    // (a tap: the phone's touch on WebKit, a click on Chromium) on the seat itself
    const [x, py] = await page.evaluate(([x, z, y]) => (window as unknown as { __tent: T }).__tent.px(x, z, y), [-40 + p.x * 10 + 5, -40 + p.z * 10 + 5, y] as const);
    if (browserName === 'webkit') await page.touchscreen.tap(x, py);
    else await page.mouse.click(x, py);
    await expect.poll(() => tent(page, (t) => t.seat()), { timeout: 8000 }).toMatchObject({ id: p.id, lie: false });
    const v = await seated(page, rocks);
    // its body's bottom on the seat (a hair under: the hips sink into it), not the floor
    const bottom = v.box[0][1] + v.at[1];
    expect(bottom).toBeGreaterThan(y - 3);
    expect(bottom).toBeLessThan(y + 2);
    if (process.env.SHOTS) {
      // (close in and a little turned, to see the body on the seat; a few frames drawn after)
      const n = await page.evaluate(() => {
        const t = (window as unknown as { __tent: { zoom(f: number): void; orbit(a: number, p: number): void; stats(): { frames: number } } }).__tent;
        t.orbit(0.7, -0.15);
        t.zoom(4);
        return t.stats().frames;
      });
      await roomUp(page, 'tent', { frames: n + 3 });
      await page.screenshot({ path: `${process.env.SHOTS}/shot-${name}-${browserName}.png` });
    }
  });
}
