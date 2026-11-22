// The pieces stood at (docs/design.md "The gym": Stood at; poses-stand.ts the motion, world3d/heldProps.ts what's held,
// tent/standFx.ts what moves besides): a tap on a stove, a workbench, a desk, the telescope, a bookshelf, the chalkboard
// walks my villager up to its front and into its use (its seat: the partner's phone shows it too), the prop in its hands
// (the pot, the hammer, the book), the stove steaming; a tap on a one-off's piece (the espresso maker, the camera, the
// phone, the dartboard, the billiard table, the hoop, the goal, a ball) plays it here (a drink, a photo, a call, a dart
// that flies and sticks, a cue, a shot, a kick). WebKit taps, Chromium clicks. `SHOTS=<dir>` writes shot-<kind>-<who>.png
// and a crop round the body of every kind, my human player's and a villager's (the guest's).
import { expect, test, type Page } from './fixtures.ts';
import { roomUp } from './rooms.ts';

test.use({ viewport: { width: 393, height: 852 } });
const Q = '?demo&date=2026-11-04T12:00';

type V = { state: string; box: [number[], number[]]; at: number[]; head: number[] | null } | null;
type S = { prop: string | null; held: boolean; fx: string[] } | null;
type T = {
  loading(): number;
  fill(codes: string[], f?: number): number;
  pieces(): { id: string; item: string; x: number; z: number; f: number }[];
  px(x: number, z: number, y?: number): [number, number];
  seat(): { id: string; n: number; lie: boolean } | null;
  partnerSeat(): { id: string } | null;
  peer(): boolean;
  v3(w: string): V;
  acting(w?: string): string | null;
  stand(w: string, id?: string): S;
  orbit(a: number, p?: number): void;
  zoom(f: number): void;
  stats(): { frames: number };
};
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const stand = (page: Page, w: string, id?: string) => page.evaluate(([w, id]) => (window as unknown as { __tent: T }).__tent.stand(w, id), [w, id] as const);

/** The tent with just these pieces, facing us, drawn with my villager in (as `who`). */
async function room(page: Page, codes: string[], who: 'A' | 'B' | 'G' = 'A', fresh = true) {
  if (fresh) await page.addInitScript(() => localStorage.getItem('stand-seeded') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('stand-seeded', '1')));
  await page.goto('tent' + Q + (who !== 'A' ? `&as=${who}` : ''));
  await roomUp(page, 'tent');
  if (codes.length) expect(await page.evaluate((c) => (window as unknown as { __tent: T }).__tent.fill(c, 0), codes)).toBe(codes.length);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  await expect.poll(() => page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), who), { timeout: 15_000 }).not.toBeNull();
  return tent(page, (t) => t.pieces());
}

/** The pieces' footprints (tiles, unturned: items.json). */
const SIZE: Record<string, [number, number]> = { f292: [2, 1], f3995: [2, 1], f840: [2, 1], f2012: [2, 1], f863: [2, 1], f4226: [2, 2], f1149: [3, 2] };
/** A tap on a piece's middle at `y` up (the phone's touch on WebKit, a click on Chromium). */
async function tapPiece(page: Page, browserName: string, p: { x: number; z: number; item: string }, y: number) {
  const [w, d] = SIZE[p.item] ?? [1, 1];
  const [x, py] = await page.evaluate(([x, z, y]) => (window as unknown as { __tent: T }).__tent.px(x, z, y), [-40 + p.x * 10 + w * 5, -40 + p.z * 10 + d * 5, y] as const);
  if (browserName === 'webkit') await page.touchscreen.tap(x, py);
  else await page.mouse.click(x, py);
}

/** The synced uses: the piece, its use, where a tap lands (up from the floor), the prop in the hands, an fx at it. */
const USES = [
  ['f292', 'cook', 5, 'pot', 'steam'],
  ['f3995', 'hammer', 6, 'hammer', null],
  ['f840', 'type', 5, null, null],
  ['f1186', 'peer', 8, null, null],
  ['f1558', 'read', 6, 'book', null],
  ['f2012', 'write', 10, null, null]
] as const;

for (const [code, use, y, prop, fx] of USES) {
  test(`a tap on ${code} stands at it and ${use}s, the partner's use too`, async ({ page, browserName }) => {
    const [p] = await room(page, [code]);
    await tapPiece(page, browserName, p, y);
    await expect.poll(() => tent(page, (t) => t.seat()?.id ?? null), { timeout: 10_000 }).toBe(p.id);
    await expect.poll(() => tent(page, (t) => t.v3('A')?.state ?? null), { timeout: 10_000 }).toBe(use);
    if (prop) await expect.poll(async () => (await stand(page, 'A'))?.held ? (await stand(page, 'A'))!.prop : null, { timeout: 8000 }).toBe(prop);
    else expect((await stand(page, 'A'))?.prop ?? null).toBeNull();
    if (fx) await expect.poll(async () => (await stand(page, 'A', p.id))?.fx ?? [], { timeout: 8000 }).toContain(fx);
    // stood in front of it (by its front edge or out of it), facing it
    const v = (await tent(page, (t) => t.v3('A')))!, [w, d] = SIZE[code] ?? [1, 1], x0 = -40 + p.x * 10, z0 = -40 + p.z * 10;
    expect(v.at[2]).toBeGreaterThan(z0 + d * 10 - 0.5);
    expect(v.at[0]).toBeGreaterThan(x0 - 1);
    expect(v.at[0]).toBeLessThan(x0 + w * 10 + 1);
  });
}

/** The one-offs: the piece, the one-off, where a tap lands, the prop held, and whether something flies after. */
const ONES = [
  ['f954', 'sip', 5, 'cup', false],
  ['f13575', 'photo', 2, 'slr', false],
  ['f4009', 'call', 3, 'phone', false],
  ['f937', 'dart', 12, 'dart', true],
  ['f863', 'cue', 5, 'cue', false],
  ['f4226', 'shoot', 6, 'basketball', true],
  ['f2010', 'kick', 2, null, true]
] as const;

for (const [code, act, y, prop, flies] of ONES) {
  test(`a tap on ${code} plays a ${act} here`, async ({ page, browserName }) => {
    const [p] = await room(page, [code]);
    await tapPiece(page, browserName, p, y);
    await expect.poll(() => tent(page, (t) => t.acting()), { timeout: 10_000 }).toBe(act);
    expect(await tent(page, (t) => t.seat())).toBeNull();
    if (prop) await expect.poll(async () => (await stand(page, 'A'))?.prop ?? null, { timeout: 4000 }).toBe(prop);
    if (flies) await expect.poll(async () => (await stand(page, 'A', p.id))?.fx ?? [], { timeout: 6000 }).toContain('flying');
    if (act === 'photo') await expect.poll(async () => (await stand(page, 'A', p.id))?.fx ?? [], { timeout: 4000, intervals: [50] }).toContain('flash');
    // and done: the hands empty again
    await expect.poll(() => tent(page, (t) => t.acting()), { timeout: 10_000 }).toBeNull();
    await expect.poll(async () => (await stand(page, 'A'))?.prop ?? null, { timeout: 4000 }).toBeNull();
  });
}

test('the partner\'s phone shows the uses stood at: B sees A cook with the pot, A sees B type', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await a.addInitScript(() => localStorage.getItem('stand-seeded') || (localStorage.removeItem('island-demo.tent'), localStorage.setItem('stand-seeded', '1')));
  const ps = await room(a, ['f292', 'f840'], 'A', false);
  await room(b, [], 'B', false);
  await expect.poll(() => tent(b, (t) => t.pieces().length), { timeout: 6000 }).toBe(2);
  await expect.poll(() => Promise.all([a, b].map((p) => tent(p, (t) => t.peer()))), { timeout: 8000 }).toEqual([true, true]);
  const stove = ps.find((p) => p.item === 'f292')!, desk = ps.find((p) => p.item === 'f840')!;
  await a.bringToFront();
  await tapPiece(a, 'chromium', stove, 5);
  await expect.poll(() => tent(a, (t) => t.v3('A')?.state ?? null), { timeout: 10_000 }).toBe('cook');
  await b.bringToFront();
  await expect.poll(() => tent(b, (t) => t.partnerSeat()?.id ?? null), { timeout: 6000 }).toBe(stove.id);
  await expect.poll(() => tent(b, (t) => t.v3('A')?.state ?? null), { timeout: 10_000 }).toBe('cook');
  await expect.poll(async () => (await stand(b, 'A'))?.prop ?? null, { timeout: 8000 }).toBe('pot');
  await tapPiece(b, 'chromium', desk, 5);
  await expect.poll(() => tent(b, (t) => t.v3('B')?.state ?? null), { timeout: 10_000 }).toBe('type');
  await a.bringToFront();
  await expect.poll(() => tent(a, (t) => t.v3('B')?.state ?? null), { timeout: 10_000 }).toBe('type');
  await ctx.close();
});

// every kind, close in (SHOTS=<dir> only): my human player's (A) and a villager's (the guest's)
const SHOTS: [string, string, number][] = [
  ...USES.map(([c, u, y]): [string, string, number] => [c, u, y]),
  ['f13717', 'cook-pot', 3], ['f724', 'cook-kettle', 3], ['f1429', 'cook-campfire', 2], ['f1043', 'cook-microwave', 3], ['f4116', 'write-whiteboard', 10],
  ['f1319', 'peer-microscope', 4], ['f1128', 'type-sewing', 4], ['f12676', 'read-magazine', 6],
  ...ONES.map(([c, a, y]): [string, string, number] => [c, a, y]),
  ['f1149', 'kick-goal', 5], ['f1802', 'sip-machine', 8], ['f1412', 'photo-tv', 8]
];
/** About `ms` on, by the room's own frames (a use's loop draws 12 a second at rest). */
const after = async (page: Page, ms: number) => {
  const f0 = await tent(page, (t) => t.stats().frames);
  await expect.poll(() => tent(page, (t) => t.stats().frames), { timeout: ms + 5000, intervals: [100] }).toBeGreaterThan(f0 + (ms * 12) / 1000);
};
if (process.env.SHOTS) for (const who of ['A', 'G'] as const) for (const [code, name, y] of SHOTS) test(`shots: ${name}, ${who === 'A' ? 'a player' : 'a villager'}`, async ({ page, browserName }) => {
  const tag = `${name}-${who === 'A' ? 'player' : 'villager'}`;
  await page.goto('tent' + Q + `&as=${who}`);
  await roomUp(page, 'tent');
  expect(await page.evaluate((c) => (window as unknown as { __tent: T }).__tent.fill([c], 0), code)).toBe(1);
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  await expect.poll(() => page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), who), { timeout: 15_000 }).not.toBeNull();
  const p = (await tent(page, (t) => t.pieces())).filter((q) => q.item === code).pop()!;
  await page.evaluate(() => (window as unknown as { __tent: T }).__tent.orbit(0.55, -0.05));
  await tapPiece(page, browserName, p, y);
  const one = ONES.find((o) => o[0] === code) ?? (code === 'f1149' || code === 'f1802' || code === 'f1412' ? [code, '', 0, '', false] : null);
  if (one) {
    await expect.poll(() => page.evaluate((w) => (window as unknown as { __tent: T }).__tent.acting(w), who), { timeout: 10_000 }).not.toBeNull();
    const ms = { sip: 2400, photo: 1700, call: 1500, dart: 1000, cue: 1500, shoot: 1100, kick: 900, 'kick-goal': 900, 'sip-machine': 2400, 'photo-tv': 1700 }[name] ?? 1200;
    await after(page, ms);
  } else {
    await expect.poll(() => tent(page, (t) => t.seat()?.id ?? null), { timeout: 10_000 }).toBe(p.id);
    await after(page, 2600);
  }
  // (side on, close in: the hands and the prop in profile)
  const n = await page.evaluate(() => {
    const t = (window as unknown as { __tent: T }).__tent;
    t.orbit(1.05, -0.12);
    t.zoom(3.2);
    return t.stats().frames;
  });
  await roomUp(page, 'tent', { frames: n + 3 });
  await page.screenshot({ path: `${process.env.SHOTS}/shot-${tag}.png` });
  const v = (await page.evaluate((w) => (window as unknown as { __tent: T }).__tent.v3(w), who))!;
  const [cx, cy] = await page.evaluate(([x, z, y]) => (window as unknown as { __tent: T }).__tent.px(x, z, y), [v.at[0], v.at[2], v.at[1] + 7] as const);
  const clip = { x: Math.max(0, Math.min(393 - 300, cx - 150)), y: Math.max(0, Math.min(852 - 320, cy - 160)), width: 300, height: 320 };
  await page.screenshot({ path: `${process.env.SHOTS}/crop-${tag}.png`, clip });
});
