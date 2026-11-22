// Walking under an arch (docs/design.md "The tent"; scripts/room-pass.ts, #lib/pass.ts): an arch's posts block the
// walk, its middle doesn't, so a floor tap beyond it walks my villager straight under it, and a tap on the floor under
// it is floor (it stands there); a tap on the arch itself still knocks it. WebKit taps, Chromium clicks, at 393 × 852.
//   SHOTS=/tmp/arch npx playwright test tent-arch      the villager under the arch, a shot per browser
import { expect, test, type Page } from './fixtures.ts';
import { roomUp, tentStill } from './rooms.ts';

type Pt = [number, number];
type Piece = { id: string; item: string; x: number; z: number; f: number };
type T = {
  fill(codes: string[]): number; pieces(): Piece[]; mine(): Pt; walking(w: string): boolean; walkTo(x: number, z: number): void;
  way(): { from: Pt; via: Pt[]; to: Pt } | null;
  px(x: number, z: number, y?: number): Pt; hit(cx: number, cy: number): { kind: string; id?: string } | null;
};
type W = { __tent: T };
const te = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const px = (page: Page, x: number, z: number, y = 0) => page.evaluate(([x, z, y]) => (window as unknown as W).__tent.px(x, z, y), [x, z, y] as const);
const idle = (page: Page) => expect.poll(() => te(page, (t) => t.walking('A')), { timeout: 10_000 }).toBe(false);

test('an arch is walked under: a tap beyond it goes through its middle, a tap under it stands there, a tap on it knocks it', async ({ browser, browserName }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: browserName === 'webkit' });
  const page = await ctx.newPage();
  // (our 2026 arch is a find of 11-22)
  await page.goto('tent?demo&date=2026-11-22T12:00');
  await roomUp(page, 'tent', { timeout: 15_000 });
  await page.evaluate(() => (localStorage.removeItem('island-demo.tent'), localStorage.removeItem('island-demo.tent.u')));
  await page.reload();
  await roomUp(page, 'tent', { timeout: 15_000 });
  const tap = (x: number, y: number) => (browserName === 'webkit' ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));

  // the 2026 arch facing us (3 × 1: its posts the end tiles), near the room's middle
  await te(page, (t) => t.fill(['f90002']));
  const arch = (await te(page, (t) => t.pieces()))[0];
  expect(arch).toMatchObject({ item: 'f90002', f: 0 });
  const x0 = -40 + arch.x * 10, z0 = -40 + arch.z * 10, mx = x0 + 15, mz = z0 + 5;
  /** Under its middle tile (a hair in from the posts' lines), under a post. */
  const under = ([x, z]: Pt) => x > x0 + 10.5 && x < x0 + 19.5 && z > z0 && z < z0 + 10;
  const onPost = ([x, z]: Pt) => z > z0 + 0.5 && z < z0 + 9.5 && ((x > x0 + 0.5 && x < x0 + 9.5) || (x > x0 + 20.5 && x < x0 + 29.5));

  // my villager in front of it, then a floor tap straight beyond it through the middle
  await te(page, (t) => t.walkTo(0, 30));
  await idle(page);
  await page.evaluate(([x, z]) => (window as unknown as W).__tent.walkTo(x, z), [mx, z0 + 22] as const);
  await idle(page);
  await tentStill(page, 10_000);
  const hitAt = async (p: Pt) => page.evaluate(([x, y]) => (window as unknown as W).__tent.hit(x, y), await px(page, ...p));
  // the farthest floor straight behind it a tap reaches (through its opening or over its crown; the back wall's 3 off)
  let beyond: Pt | null = null;
  for (let z = z0 - 3; z > -37; z -= 1) if ((await hitAt([mx, z]))?.kind === 'floor') beyond = [mx, z];
  expect(beyond).not.toBeNull();
  const far = beyond!;
  await tap(...(await px(page, ...far)));
  await expect.poll(() => te(page, (t) => t.walking('A'))).toBe(true);
  // its way (the engine's: where it set out, its corners, its end) sampled along each leg: under the arch's middle,
  // never through a post, straight on, not round
  const way = (await te(page, (t) => t.way()))!;
  const legs = [way.from, ...way.via, way.to];
  const trail: Pt[] = legs.slice(1).flatMap((b, i) => Array.from({ length: 41 }, (_, k): Pt => [legs[i][0] + ((b[0] - legs[i][0]) * k) / 40, legs[i][1] + ((b[1] - legs[i][1]) * k) / 40]));
  expect(trail.some(under), JSON.stringify(legs)).toBe(true);
  expect(trail.filter(onPost)).toEqual([]);
  expect(trail.every(([x]) => Math.abs(x - mx) < 6), 'straight through').toBe(true);
  await idle(page);
  const end = await te(page, (t) => t.mine());
  expect(Math.hypot(end[0] - far[0], end[1] - far[1])).toBeLessThan(1);

  // a tap on the floor under it: floor, and my villager stands under it
  await tentStill(page, 10_000);
  const mid = await px(page, mx, mz);
  expect(await page.evaluate(([x, y]) => (window as unknown as W).__tent.hit(x, y), mid)).toMatchObject({ kind: 'floor' });
  await tap(...mid);
  await expect.poll(() => te(page, (t) => t.walking('A'))).toBe(true);
  await idle(page);
  expect(under(await te(page, (t) => t.mine()))).toBe(true);
  await tentStill(page, 10_000);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/shot-under-${browserName}.png` });

  // a tap on a post: the arch (it knocks where it stands; my villager stays under it)
  const post = await px(page, x0 + 5, z0 + 5, 10);
  expect(await page.evaluate(([x, y]) => (window as unknown as W).__tent.hit(x, y), post)).toEqual({ kind: 'piece', id: arch.id });
  const here = await te(page, (t) => t.mine());
  await tap(...post);
  expect(await te(page, (t) => t.walking('A'))).toBe(false);
  expect(await te(page, (t) => t.mine())).toEqual(here);
  await ctx.close();
});
