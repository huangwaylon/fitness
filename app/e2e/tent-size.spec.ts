// A home's size (docs/design.md "The tent", "Room size"): もようがえ's 広さ picks NH's main room, 8 × 8, 6 × 6 or the
// tent's 4 × 4, or 10 × 10 or the long 8 × 16; the room's walls close round it on both phones, the furniture stays where
// it stood, and a size that would leave a piece outside is refused (the bar says how many, the pieces glow red) until
// it's moved.
//   SHOTS=/tmp/home-size npx playwright test tent-size --project=webkit   each size's screenshot
import { expect, test, type Page } from './fixtures.ts';
import { roomUp, tentStill } from './rooms.ts';

const VIEW = { viewport: { width: 393, height: 852 } } as const;
const Q = (who: 'A' | 'B') => `tent?demo&date=2026-11-04T12:00${who === 'B' ? '&as=B' : ''}`;
type Piece = { id: string; item: string; x: number; z: number; f: number };
type T = {
  stats(): { frames: number }; still(): boolean; size(): number; pieces(): Piece[]; fill(codes: string[]): number;
  tile(x: number, z: number): [number, number]; px(x: number, z: number, y?: number): [number, number]; hit(cx: number, cy: number): { kind: string; id?: string } | null;
  edit(): { sel: (Piece & { fresh: boolean }) | null } | null;
};
const te = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
const snap = async (p: Page, name: string) => {
  if (!process.env.SHOTS) return;
  await tentStill(p, 10_000);
  await p.screenshot({ path: `${process.env.SHOTS}/${name}.png` });
};
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
    await roomUp(p, 'tent', { timeout: 15_000 });
    return p;
  };
  const a = await open('A');
  await a.evaluate(() => (localStorage.removeItem('island-demo.tent'), localStorage.removeItem('island-demo.tent.u')));
  await a.reload();
  await roomUp(a, 'tent', { timeout: 15_000 });
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
  await expect(a.locator('[data-tent-size] .nm')).toHaveText(['テント', '初めての家', '増築した部屋', '広い部屋', '長い部屋']);
  await expect(a.locator('[data-tent-size] .dim')).toHaveText(['4×4マス', '6×6マス', '8×8マス', '10×10マス', '8×16マス']);
  const shot = (n: number) => snap(a, `size-${n}`);
  await shot(8);

  // 6 × 6: the walls close in on both phones, the bed where it was
  await a.locator('[data-tent-size="6"]').click();
  await expect(a.locator('[data-tent-size="6"]')).toHaveAttribute('aria-pressed', 'true');
  for (const p of [a, b]) await expect.poll(() => te(p, (t) => t.size()), { timeout: 4000 }).toBe(6);
  await expect.poll(() => te(b, (t) => t.pieces().map((p) => [p.id, p.x, p.z]))).toEqual([[bed.id, 3, 2]]);
  await tentStill(a, 10_000);
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
  await tentStill(a, 10_000);
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

test('the larger rooms: 10 × 10 and the long 8 × 16 on both phones, a piece put on their new tiles by a tap there; between them only with nothing left outside', async ({ browser, browserName }) => {
  const ctx = await browser.newContext({ ...VIEW, hasTouch: browserName === 'webkit' });
  const open = async (who: 'A' | 'B') => {
    const p = await ctx.newPage();
    await p.goto(Q(who));
    await roomUp(p, 'tent', { timeout: 15_000 });
    return p;
  };
  const a = await open('A');
  await a.evaluate(() => (localStorage.removeItem('island-demo.tent'), localStorage.removeItem('island-demo.tent.u')));
  await a.reload();
  await roomUp(a, 'tent', { timeout: 15_000 });
  const b = await open('B');
  await a.bringToFront();
  // (a tap: the phone's touch on WebKit, a click on Chromium)
  const tap = (x: number, y: number) => (browserName === 'webkit' ? a.touchscreen.tap(x, y) : a.mouse.click(x, y));
  await a.locator('[data-tent-edit-open]').click();
  await a.locator('[data-tab="size"]').click();

  // the long room: its walls round 16 tiles deep on both phones, the back half's tiles floor
  await tap(...(await centreOf(a.locator('[data-tent-size="16"]'))));
  await expect(a.locator('[data-tent-size="16"]')).toHaveAttribute('aria-pressed', 'true');
  for (const p of [a, b]) await expect.poll(() => te(p, (t) => t.size()), { timeout: 4000 }).toBe(16);
  await tentStill(a, 10_000);
  expect((await tileHit(a, 3, -7))?.kind).toBe('floor');
  // framed whole in the band over the tray, though it was picked as the tray's tab was still easing in: its back
  // wall's top corners on screen, its front edge over the bar
  const [bl, br, front] = await a.evaluate((pts) => pts.map(([x, z, y]) => (window as unknown as { __tent: T }).__tent.px(x, z, y)), [[-40, -120, 40], [40, -120, 40], [0, 40, 0]]);
  const bar = (await a.locator('[data-tent-hint]').boundingBox())!;
  expect([bl[0] > 0, bl[1] > 0, br[0] < 393, front[1] < bar.y]).toEqual([true, true, true, true]);
  await snap(a, 'shot-16');
  // a stool from the tray, tapped over to the long room's back half (z −6) and placed: kept there on both phones
  await a.locator('[data-tab="furniture"]').click();
  await a.locator('[data-tent-item="f4038"]').click();
  await expect.poll(() => te(a, (t) => t.edit()?.sel?.fresh)).toBe(true);
  await tentStill(a, 10_000);
  await tap(...(await te(a, (t) => t.tile(2, -6))));
  await expect.poll(() => te(a, (t) => t.edit()?.sel)).toMatchObject({ x: 2, z: -6 });
  await a.locator('[data-act="place"]').click();
  await expect.poll(() => te(b, (t) => t.pieces().map((p) => [p.item, p.x, p.z])), { timeout: 4000 }).toEqual([['f4038', 2, -6]]);

  // 10 × 10 would leave it outside (its tiles z −2…7): refused, the bar says so
  await a.locator('[data-tab="size"]').click();
  await tap(...(await centreOf(a.locator('[data-tent-size="10"]'))));
  await expect(a.locator('[data-note="size"]')).toHaveText('部屋の外に出る家具が1個あります。先に動かすか片付けてください');
  expect(await te(b, (t) => t.size())).toBe(16);
  // the stool to the 8 × 8's tiles (a tap on it, a tap on the floor there, placed), then the 10 × 10 takes
  await a.locator('[data-tab="furniture"]').click();
  await tentStill(a, 10_000);
  const id = (await te(a, (t) => t.pieces()))[0].id;
  await tap(...(await te(a, (t) => t.tile(2, -6))));
  await expect.poll(() => te(a, (t) => t.edit()?.sel?.id ?? null)).toBe(id);
  await tap(...(await te(a, (t) => t.tile(1, 1))));
  await expect.poll(() => te(a, (t) => t.edit()?.sel)).toMatchObject({ x: 1, z: 1 });
  await a.locator('[data-act="place"]').click();
  await expect.poll(() => te(b, (t) => t.pieces().map((p) => [p.x, p.z])), { timeout: 4000 }).toEqual([[1, 1]]);
  await a.locator('[data-tab="size"]').click();
  await tap(...(await centreOf(a.locator('[data-tent-size="10"]'))));
  for (const p of [a, b]) await expect.poll(() => te(p, (t) => t.size()), { timeout: 4000 }).toBe(10);
  await tentStill(a, 10_000);
  // its side and back tiles floor (x −1, z −2), the long room's back half not
  expect((await tileHit(a, -1, -2))?.kind).toBe('floor');
  expect((await tileHit(a, 8, 5))?.kind).toBe('floor');
  // a piece onto the 10 × 10's own column (x −1): placed by a tap there
  await a.locator('[data-tab="furniture"]').click();
  await a.locator('[data-tent-item="f4039"]').click();
  await expect.poll(() => te(a, (t) => t.edit()?.sel?.fresh)).toBe(true);
  await tentStill(a, 10_000);
  await tap(...(await te(a, (t) => t.tile(-1, 0))));
  await expect.poll(() => te(a, (t) => t.edit()?.sel)).toMatchObject({ x: -1, z: 0 });
  await a.locator('[data-act="place"]').click();
  await expect.poll(() => te(b, (t) => t.pieces().length), { timeout: 4000 }).toBe(2);
  // (the screenshot here: the refused switch's red glow long gone)
  await snap(a, 'shot-10');
  // now the long room would leave that one outside, the 8 × 8 too; the bar says one
  await a.locator('[data-tab="size"]').click();
  for (const n of [16, 8]) {
    await tap(...(await centreOf(a.locator(`[data-tent-size="${n}"]`))));
    await expect(a.locator('[data-note="size"]')).toHaveText('部屋の外に出る家具が1個あります。先に動かすか片付けてください');
  }
  expect(await te(b, (t) => t.size())).toBe(10);
  // kept across a reload, as stored
  await b.reload();
  await roomUp(b, 'tent', { timeout: 15_000 });
  expect([await te(b, (t) => t.size()), (await te(b, (t) => t.pieces().map((p) => [p.x, p.z]))).sort()]).toEqual([10, [[-1, 0], [1, 1]]]);
  await ctx.close();
});

const centreOf = async (l: import('@playwright/test').Locator): Promise<[number, number]> => {
  const r = (await l.boundingBox())!;
  return [r.x + r.width / 2, r.y + r.height / 2];
};
