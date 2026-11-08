// Decorating (docs/design.md "Decorating", docs/island-layout.md "Phone editing"): the island is arranged in /editor
// only (2026-11-08), its phone view's もようがえ (layoutEdit/IslandEdit.svelte; here over the plan, e2e/island.ts
// openEditor): a piece from the tray goes down on fine ground, a drag moves it a tile at a time, a tap on the ground
// puts it there, red over the water, ✓ places it; a tap picks a placed piece up to move, turn, put back or put away.
// Both players' islands have it at once (the demo's relay, as two phones over the real one), and it stays across a
// reload and for a tab opening later.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp, openEditor } from './island.ts';

test.use({ viewport: { width: 390, height: 844 } });

const DATE = '2026-11-04T12:00';
const Q = `demo&date=${DATE}`;

async function open(page: Page, q = '') {
  await page.goto(`?demo&date=${DATE}${q}`);
  await islandUp(page);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(2000);
}

type IE = { sel(): { id?: string; k: string; x: number; z: number; f: number; why: string | null } | null; tileScreen(c: number, r: number): [number, number] | null };
const ie = <R,>(page: Page, fn: (e: IE) => R) => page.evaluate(`(${fn.toString()})(window.__islandEdit)`) as Promise<R>;
type L = { count(k: string): number; ids(k: string): string[]; obj(id: string): { x: number; z: number; f: number } | undefined };
const lay = <R,>(page: Page, fn: (l: L) => R) => page.evaluate(`(${fn.toString()})(window.__layout)`) as Promise<R>;
/** (IslandEdit's bar rides with the held piece, a frame at a time: its buttons pressed where they are) */
/** A tile's middle on screen. */
const tile = async (page: Page, c: number, r: number) => (await page.evaluate(([c, r]) => (window as unknown as { __islandEdit: IE }).__islandEdit.tileScreen(c, r), [c, r] as const))!;
async function tapTile(page: Page, c: number, r: number) {
  const [x, y] = await tile(page, c, r);
  await page.mouse.click(x, y);
  await page.waitForTimeout(150);
}
async function dragTile(page: Page, from: readonly [number, number], to: readonly [number, number]) {
  const a = await tile(page, ...from), b = await tile(page, ...to);
  await page.mouse.move(a[0], a[1]);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(a[0] + ((b[0] - a[0]) * i) / 6, a[1] + ((b[1] - a[1]) * i) / 6);
  await page.mouse.up();
  await page.waitForTimeout(150);
}
/** The first tile from (c, r) on along its row where a held piece may stand. */
async function fineFrom(page: Page, c: number, r: number): Promise<[number, number]> {
  for (let d = 0; d < 8; d++)
    for (const cc of [c + d, c - d]) {
      await tapTile(page, cc, r);
      const s = await ie(page, (e) => e.sel());
      if (s && !s.why) return [s.x, s.z];
    }
  throw new Error(`no fine tile by ${c}, ${r}`);
}

test('in the editor: a piece from the tray goes down on fine ground, a drag moves it a tile at a time, a tap on the ground puts it there, red over the water, ✓ places it', async ({ context }) => {
  const page = await openEditor(context, Q);
  const before = await lay(page, (l) => l.count('stone-lantern'));
  await page.locator('[data-tab="furniture"]').click();
  await page.locator('[data-island-item="stone-lantern"]').click();
  await expect.poll(() => ie(page, (e) => e.sel()?.k ?? null)).toBe('stone-lantern');
  expect(await ie(page, (e) => e.sel()!.why)).toBeNull();
  // a drag with one finger moves it a tile at a time
  const s0 = (await ie(page, (e) => e.sel()))!;
  await dragTile(page, [s0.x, s0.z], [s0.x - 2, s0.z]);
  await expect.poll(() => ie(page, (e) => e.sel()!.x)).toBe(s0.x - 2);
  // a tap on the ground puts it there
  const [fx, fz] = await fineFrom(page, s0.x + 3, s0.z + 1);
  expect(await ie(page, (e) => [e.sel()!.x, e.sel()!.z])).toEqual([fx, fz]);
  // turned a quarter
  await page.locator('button[data-act="turn"]').dispatchEvent('click');
  await expect.poll(() => ie(page, (e) => e.sel()!.f)).toBe(1);
  // over the stream it's red, and ✓ won't place it
  await tapTile(page, 5, 24);
  await expect.poll(() => ie(page, (e) => e.sel()?.why ?? null)).toContain('水');
  await expect(page.locator('button[data-act="place"]')).toHaveAttribute('aria-disabled', 'true');
  await tapTile(page, fx, fz);
  await expect.poll(() => ie(page, (e) => e.sel()?.why ?? 'held')).toBe('held');
  await page.locator('button[data-act="place"]').dispatchEvent('click');
  await expect.poll(() => ie(page, (e) => e.sel())).toBeNull();
  await expect.poll(() => lay(page, (l) => l.count('stone-lantern'))).toBe(before + 1);
  const id = (await lay(page, (l) => l.ids('stone-lantern'))).at(-1)!;
  expect(await page.evaluate((id) => (window as unknown as { __layout: L }).__layout.obj(id), id)).toMatchObject({ x: fx, z: fz, f: 1 });
  // おわる: the mode goes; nothing held
  await page.locator('[data-island-done]').click();
  await expect(page.locator('[data-island-edit]')).toHaveCount(0);
});

test('in the editor: a tap picks a placed piece up, a drag and ✓ move it, ✕ puts it back, 🗑 puts it away', async ({ context }) => {
  const page = await openEditor(context, Q);
  await page.locator('[data-tab="furniture"]').click();
  await page.locator('[data-island-item="tanuki"]').click();
  const [x0, z0] = await fineFrom(page, 6, 12);
  await page.locator('button[data-act="place"]').dispatchEvent('click');
  await expect.poll(() => ie(page, (e) => e.sel())).toBeNull();
  const id = (await lay(page, (l) => l.ids('tanuki'))).at(-1)!;
  // picked up (a finger on it), dragged a tile on, ✓: it's there
  await dragTile(page, [x0, z0], [x0 + 1, z0]);
  await expect.poll(() => ie(page, (e) => e.sel()?.id ?? null)).toBe(id);
  const [x1, z1] = await ie(page, (e) => [e.sel()!.x, e.sel()!.z] as const);
  expect(await ie(page, (e) => e.sel()!.why)).toBeNull();
  await page.locator('button[data-act="place"]').dispatchEvent('click');
  await expect.poll(() => page.evaluate((id) => (window as unknown as { __layout: L }).__layout.obj(id)?.x, id)).toBe(x1);
  // ✕: back where it was
  await dragTile(page, [x1, z1], [x1 - 1, z1]);
  await expect.poll(() => ie(page, (e) => e.sel()?.id ?? null)).toBe(id);
  await page.locator('button[data-act="cancel"]').dispatchEvent('click');
  await expect.poll(() => ie(page, (e) => e.sel())).toBeNull();
  expect(await page.evaluate((id) => (window as unknown as { __layout: L }).__layout.obj(id)?.x, id)).toBe(x1);
  // 🗑: put away
  await tapTile(page, x1, z1);
  await expect.poll(() => ie(page, (e) => e.sel()?.id ?? null)).toBe(id);
  await page.locator('button[data-act="remove"]').dispatchEvent('click');
  await expect.poll(() => page.evaluate((id) => (window as unknown as { __layout: L }).__layout.obj(id) ?? null, id)).toBeNull();
});

test('both players see the editor\'s changes on their islands, live and after a reload; a tab opening later too', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a wait sized for the game at full speed (an animation, a spawn, a sync within its seconds); software GL slows the game itself' } }, async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  // A's editor puts a wagon down
  const ea = await openEditor(ctx, Q);
  await ea.locator('[data-tab="furniture"]').click();
  await ea.locator('[data-island-item="garden-wagon"]').click();
  const [x0, z0] = await fineFrom(ea, 6, 12);
  await ea.locator('button[data-act="place"]').dispatchEvent('click');
  const id = (await lay(ea, (l) => l.ids('garden-wagon'))).at(-1)!;
  // both islands have it at once, where it was put
  const where = (p: Page) => p.evaluate((id) => { const o = (window as unknown as { __layout: L }).__layout.obj(id); return o ? [o.x, o.z] : null; }, id);
  await expect.poll(() => where(a), { timeout: 3000 }).toEqual([x0, z0]);
  await expect.poll(() => where(b), { timeout: 3000 }).toEqual([x0, z0]);
  // B's editor moves it; A's island has the move
  const eb = await openEditor(ctx, `${Q}&as=B`);
  await dragTile(eb, [x0, z0], [x0 - 1, z0 + 1]);
  await expect.poll(() => ie(eb, (e) => e.sel()?.id ?? null)).toBe(id);
  if (await ie(eb, (e) => e.sel()!.why)) await fineFrom(eb, x0 - 1, z0 + 1);
  const moved = await ie(eb, (e) => [e.sel()!.x, e.sel()!.z]);
  await eb.locator('button[data-act="place"]').dispatchEvent('click');
  await expect.poll(() => where(a), { timeout: 3000 }).toEqual(moved);
  // a reload keeps it; a third tab opening later finds it too
  await a.bringToFront();
  await a.reload();
  await islandUp(a);
  await expect.poll(() => where(a)).toEqual(moved);
  const c = await ctx.newPage();
  await open(c, '&as=B');
  await expect.poll(() => where(c)).toEqual(moved);
  // A's editor puts it away: gone on B
  await ea.bringToFront();
  await tapTile(ea, moved[0], moved[1]);
  await expect.poll(() => ie(ea, (e) => e.sel()?.id ?? null)).toBe(id);
  await ea.locator('button[data-act="remove"]').dispatchEvent('click');
  await expect.poll(() => where(b), { timeout: 3000 }).toBeNull();
  await ctx.close();
});

