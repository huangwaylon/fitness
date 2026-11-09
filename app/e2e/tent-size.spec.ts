// A home's size (docs/design.md "The tent", "Room size"): もようがえ's 広さ picks NH's main room, 8 × 8, 6 × 6 or the
// tent's 4 × 4; the room's walls close round it on both phones, the furniture stays where it stood, and a shrink that
// would leave a piece outside is refused (the bar says how many, the pieces glow red) until it's moved.
//   SHOTS=/tmp/home-size npx playwright test tent-size --project=webkit   each size's screenshot
import { expect, test, type Page } from './fixtures.ts';

const VIEW = { viewport: { width: 393, height: 852 } } as const;
const Q = (who: 'A' | 'B') => `tent?demo&date=2026-11-04T12:00${who === 'B' ? '&as=B' : ''}`;
type Piece = { id: string; item: string; x: number; z: number; f: number };
type T = {
  stats(): { frames: number }; still(): boolean; size(): number; pieces(): Piece[]; fill(codes: string[]): number;
  tile(x: number, z: number): [number, number]; px(x: number, z: number): [number, number]; hit(cx: number, cy: number): { kind: string; id?: string } | null;
  edit(): { sel: (Piece & { fresh: boolean }) | null } | null;
};
const te = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const settled = (p: Page) => p.waitForFunction(() => (window as unknown as { __tent: T }).__tent.still(), null, { timeout: 10_000 });
const tileHit = async (p: Page, x: number, z: number) => {
  const [cx, cy] = await p.evaluate(([a, b]) => (window as unknown as { __tent: T }).__tent.tile(a, b), [x, z] as const);
  return p.evaluate(([a, b]) => (window as unknown as { __tent: T }).__tent.hit(a, b), [cx, cy] as const);
};

test('広さ: NH’s rooms on both phones, the furniture kept where it stood; a shrink leaving a piece outside refused till it moves', async ({ browser }) => {
  // the demo's two phones are two tabs of one context (BroadcastChannel)
  const ctx = await browser.newContext(VIEW);
  const open = async (who: 'A' | 'B') => {
    const p = await ctx.newPage();
    await p.goto(Q(who));
    await p.waitForFunction(() => ((window as unknown as { __tent?: T }).__tent?.stats()?.frames ?? 0) > 0, null, { timeout: 15_000 });
    return p;
  };
  const a = await open('A');
  await a.evaluate(() => (localStorage.removeItem('island-demo.tent'), localStorage.removeItem('island-demo.tent.u')));
  await a.reload();
  await a.waitForFunction(() => ((window as unknown as { __tent?: T }).__tent?.stats()?.frames ?? 0) > 0, null, { timeout: 15_000 });
  const b = await open('B');
  await a.bringToFront();
  // the log bed (2 × 2) on the free spot nearest the room's middle, toward the back
  await te(a, (t) => t.fill(['f4041']));
  const bed = (await te(a, (t) => t.pieces()))[0];
  expect(bed).toMatchObject({ item: 'f4041', x: 3, z: 2 });
  await expect.poll(() => te(b, (t) => t.pieces().map((p) => [p.id, p.x, p.z]))).toEqual([[bed.id, 3, 2]]);
  // an old room: the largest
  expect(await te(a, (t) => t.size())).toBe(8);
  await a.locator('[data-tent-edit-open]').click();
  await a.locator('[data-tab="size"]').click();
  await expect(a.locator('[data-tent-size="8"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(a.locator('[data-tent-size] .nm')).toHaveText(['テント', '初めての家', '増築した部屋']);
  await expect(a.locator('[data-tent-size] .dim')).toHaveText(['4×4マス', '6×6マス', '8×8マス']);
  const shot = async (n: number) => {
    if (!process.env.SHOTS) return;
    await settled(a);
    await a.screenshot({ path: `${process.env.SHOTS}/size-${n}.png` });
  };
  await shot(8);

  // 6 × 6: the walls close in on both phones, the bed where it was
  await a.locator('[data-tent-size="6"]').click();
  await expect(a.locator('[data-tent-size="6"]')).toHaveAttribute('aria-pressed', 'true');
  for (const p of [a, b]) await expect.poll(() => te(p, (t) => t.size()), { timeout: 4000 }).toBe(6);
  await expect.poll(() => te(b, (t) => t.pieces().map((p) => [p.id, p.x, p.z]))).toEqual([[bed.id, 3, 2]]);
  await settled(a);
  // (the largest room's corner tile is off the floor now; the new room's own corner on it)
  expect((await tileHit(a, 0, 7))?.kind).not.toBe('floor');
  expect((await tileHit(a, 1, 7))?.kind).toBe('floor');
  await shot(6);

  // 4 × 4: the bed would be outside (its tiles z 2–3; the tent's are z 4–7): refused, the bar says so, nothing changes
  await a.locator('[data-tent-size="4"]').click();
  await expect(a.locator('[data-note="size"]')).toHaveText('部屋の外に出る家具が1個あります。先に動かすか片付けてください');
  await expect(a.locator('[data-tent-size="6"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await te(a, (t) => t.size())).toBe(6);
  expect(await te(b, (t) => t.size())).toBe(6);
  if (process.env.SHOTS) await a.screenshot({ path: `${process.env.SHOTS}/size-4-refused.png` });

  // the bed moved to the front (a tap takes it, a floor tap puts it there, ✓ places it), then the tent's size takes
  await a.locator('[data-tab="furniture"]').click();
  await settled(a);
  let [x, y] = await te(a, (t) => t.tile(3, 2));
  await expect.poll(() => a.evaluate(([cx, cy]) => (window as unknown as { __tent: T }).__tent.hit(cx, cy), [x, y] as const)).toEqual({ kind: 'piece', id: bed.id });
  await a.mouse.click(x, y);
  await expect.poll(() => te(a, (t) => t.edit()?.sel?.id ?? null)).toBe(bed.id);
  // (a spot inside the tent's tiles no villager stands on: a piece never lands on one)
  const people = await a.evaluate(() => (['A', 'B'] as const).map((w) => (window as unknown as { __tent: { who(w: string): { at: [number, number] } | null } }).__tent.who(w)?.at).filter((v) => !!v));
  const free = ([tx, tz]: number[]) => people.every(([px, pz]) => px <= -40 + tx * 10 - 2 || px >= -20 + tx * 10 + 2 || pz <= -40 + tz * 10 - 2 || pz >= -20 + tz * 10 + 2);
  const to = [[2, 4], [4, 4], [2, 5], [4, 5]].find(free)!;
  [x, y] = await a.evaluate(([tx, tz]) => (window as unknown as { __tent: { px(x: number, z: number): [number, number] } }).__tent.px(-40 + (tx + 1) * 10, -40 + (tz + 1) * 10), to);
  await a.mouse.click(x, y);
  await expect.poll(() => te(a, (t) => t.edit()?.sel ?? null)).toMatchObject({ x: to[0], z: to[1] });
  await a.locator('[data-act="place"]').click();
  await expect.poll(() => te(b, (t) => t.pieces()[0]), { timeout: 4000 }).toMatchObject({ id: bed.id, x: to[0], z: to[1] });
  await a.locator('[data-tab="size"]').click();
  await a.locator('[data-tent-size="4"]').click();
  for (const p of [a, b]) await expect.poll(() => te(p, (t) => t.size()), { timeout: 4000 }).toBe(4);
  expect(await te(b, (t) => t.pieces().map((p) => [p.id, p.x, p.z]))).toEqual([[bed.id, ...to]]);
  await shot(4);

  // and back to the largest: always allowed, the bed still there
  await a.locator('[data-tent-size="8"]').click();
  for (const p of [a, b]) await expect.poll(() => te(p, (t) => t.size()), { timeout: 4000 }).toBe(8);
  expect(await te(b, (t) => t.pieces().map((p) => [p.id, p.x, p.z]))).toEqual([[bed.id, ...to]]);
  await ctx.close();
});
