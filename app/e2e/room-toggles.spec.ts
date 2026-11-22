// What a tap on a room's piece does (docs/design.md "The tent": Things that do something; tent/toggles.ts): a TV on, its
// channel changed, kept over a reload and on the other phone (its light switch); a piano walked up to and played; a
// fan on, its blades at the ambient rate only, still again once off.
//   SHOTS=/tmp/interact-c npx playwright test room-toggles --project=webkit   a TV on, a fan on, a piano played
import { expect, test, type Page } from './fixtures.ts';
import { roomUp, tentStill } from './rooms.ts';

const VIEW = { viewport: { width: 393, height: 852 } } as const;
const Q = (who: 'A' | 'B') => `tent?demo&date=2026-11-04T12:00${who === 'B' ? '&as=B' : ''}`;
type Piece = { id: string; item: string; x: number; z: number; f: number };
type Toggle = { id: string; item: string; fam: string; on?: boolean; ch?: number };
type T = {
  stats(): { frames: number; queued: boolean; gap: number }; still(): boolean; loading(): number; walking(w: string): boolean; pieces(): Piece[]; fill(codes: string[]): number;
  tile(x: number, z: number): [number, number]; toggles(): Toggle[]; fx(id: string): { on: boolean; moving: boolean; glow: number } | null; playing(): string | null; moving(): number;
};
const te = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const snap = async (p: Page, name: string) => {
  if (!process.env.SHOTS) return;
  await p.screenshot({ path: `${process.env.SHOTS}/shot-${name}.png` });
};

const evalArg = <R, A>(page: Page, fn: (t: T, a: A) => R, a: A) => page.evaluate(`(${fn.toString()})(window.__tent, ${JSON.stringify(a)})`) as Promise<R>;
/** A phone in the tent (`who`), its room emptied and furnished with `codes` (A's), all loaded. */
async function furnished(page: Page, codes: string[]) {
  await page.goto(Q('A'));
  await roomUp(page, 'tent', { timeout: 15_000 });
  await page.evaluate(() => localStorage.removeItem('island-demo.tent'));
  await page.reload();
  await roomUp(page, 'tent', { timeout: 15_000 });
  expect(await evalArg(page, (t, c) => t.fill(c), codes)).toBe(codes.length);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  await tentStill(page, 15_000);
}

test('a TV: on as it came, a tap the next channel, after the last off, then on again; kept over a reload and on the other phone', async ({ browser, browserName }) => {
  const ctx = await browser.newContext({ ...VIEW, hasTouch: browserName === 'webkit' });
  const a = await ctx.newPage();
  // the retro TV (NH's: a light too, on as it came)
  await furnished(a, ['f1108']);
  const tv = (await te(a, (t) => t.pieces()))[0];
  const state = (p: Page) => evalArg(p, (t, id) => t.toggles().find((x) => x.id === id) ?? null, tv.id);
  expect(await state(a)).toMatchObject({ fam: 'screen', on: true });
  const tap = async () => {
    const [x, y] = await evalArg(a, (t, p) => t.tile(p.x, p.z), tv);
    await (browserName === 'webkit' ? a.touchscreen.tap(x, y) : a.mouse.click(x, y));
  };
  // to off (at most CHANNELS taps), then on: channel 0, then 1
  for (let i = 0; i < 3 && (await state(a))?.on; i++) {
    const was = (await state(a))!;
    await tap();
    await expect.poll(async () => JSON.stringify(await state(a))).not.toBe(JSON.stringify(was));
  }
  expect((await state(a))?.on).toBe(false);
  expect(await evalArg(a, (t, id) => t.fx(id), tv.id)).toMatchObject({ on: false });
  await tap();
  await expect.poll(() => state(a)).toMatchObject({ on: true, ch: 0 });
  await tap();
  await expect.poll(() => state(a)).toMatchObject({ on: true, ch: 1 });
  expect(await evalArg(a, (t, id) => t.fx(id), tv.id)).toMatchObject({ on: true, moving: false });
  expect((await evalArg(a, (t, id) => t.fx(id), tv.id))!.glow).toBeGreaterThan(0);
  await tentStill(a, 10_000);
  await snap(a, 'tv-on');
  // kept
  await a.reload();
  await roomUp(a, 'tent', { timeout: 15_000 });
  await a.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  await expect.poll(() => state(a)).toMatchObject({ on: true, ch: 1 });
  await expect.poll(() => evalArg(a, (t, id) => t.fx(id)?.on ?? null, tv.id)).toBe(true);
  // the other phone (the demo's: a tab of the same context) has it on, on that channel
  const b = await ctx.newPage();
  await b.goto(Q('B'));
  await roomUp(b, 'tent', { timeout: 15_000 });
  await expect.poll(() => state(b)).toMatchObject({ on: true, ch: 1 });
  // and sees the next change live
  await a.bringToFront();
  await tap();
  await expect.poll(() => state(b), { timeout: 4000 }).toMatchObject({ on: true, ch: 2 });
  await ctx.close();
});

test('a piano: a tap walks my villager up to it and it plays a few seconds, then stands as before', async ({ browser, browserName }) => {
  const ctx = await browser.newContext({ ...VIEW, hasTouch: browserName === 'webkit' });
  const a = await ctx.newPage();
  await furnished(a, ['f1081']);
  const piano = (await te(a, (t) => t.pieces()))[0];
  expect(await te(a, (t) => t.toggles())).toEqual([{ id: piano.id, item: 'f1081', fam: 'keys' }]);
  const [x, y] = await evalArg(a, (t, p) => t.tile(p.x, p.z), piano);
  await (browserName === 'webkit' ? a.touchscreen.tap(x, y) : a.mouse.click(x, y));
  await expect.poll(() => te(a, (t) => t.playing()), { timeout: 8000 }).toBe('keys');
  // (its pose a moment in, its ♪ up: some frames on)
  const p0 = (await te(a, (t) => t.stats())).frames;
  await expect.poll(async () => (await te(a, (t) => t.stats())).frames).toBeGreaterThan(p0 + 20);
  await snap(a, 'piano-played');
  await expect.poll(() => te(a, (t) => t.playing()), { timeout: 6000 }).toBeNull();
  // the piece answered in place: nothing switched
  expect(await te(a, (t) => t.toggles())).toEqual([{ id: piano.id, item: 'f1081', fam: 'keys' }]);
  await ctx.close();
});

test('a fan: on with a tap, its blades at the ambient rate (12 a second, never 30), still again once off', async ({ browser, browserName }) => {
  const ctx = await browser.newContext({ ...VIEW, hasTouch: browserName === 'webkit' });
  const a = await ctx.newPage();
  await furnished(a, ['f2736']);
  const fan = (await te(a, (t) => t.pieces()))[0];
  const tap = async () => {
    const [x, y] = await evalArg(a, (t, p) => t.tile(p.x, p.z), fan);
    await (browserName === 'webkit' ? a.touchscreen.tap(x, y) : a.mouse.click(x, y));
  };
  expect(await te(a, (t) => t.moving())).toBe(0);
  await tap();
  await expect.poll(() => evalArg(a, (t, id) => t.fx(id), fan.id)).toMatchObject({ on: true, moving: true });
  // the tap's own frames over (the jiggle, my villager turning), then the blades' alone: the last frames ~83 ms apart
  const f0 = (await te(a, (t) => t.stats())).frames;
  await expect.poll(async () => (await te(a, (t) => t.stats())).frames, { timeout: 6000 }).toBeGreaterThan(f0 + 30);
  await expect.poll(() => te(a, (t) => t.stats().gap), { timeout: 6000 }).toBeGreaterThan(70);
  expect(await te(a, (t) => t.stats().gap)).toBeLessThan(110);
  await snap(a, 'fan-on');
  await tap();
  await expect.poll(() => evalArg(a, (t, id) => t.fx(id), fan.id)).toMatchObject({ on: false, moving: false });
  expect(await te(a, (t) => t.moving())).toBe(0);
  // still: no frame asked for
  await tentStill(a, 10_000);
  await a.waitForFunction(() => !(window as unknown as { __tent: T }).__tent.stats().queued, null, { timeout: 5000 });
  await ctx.close();
});
