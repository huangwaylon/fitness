// Decorating (docs/design.md "Decorating"): せってい → もようがえ opens the decorate mode. On the 2D island and the 3D one
// off its layout, the old decorations' mode (DecorMode); on the layout (island/site.svelte.ts), the layout's own
// (layoutEdit/IslandEdit.svelte: the second half of this file). The old mode: a tray item goes down as a
// ghost on fine ground in the middle of the view, a drag or a tap on the ground moves it (snapped to the half-tile
// grid), its footprint green or red, ✓ places it; a tap on a placed item picks it up to move, turn or put away (with
// とりけす). Both players' tabs show the same layout (the demo's relay, as two phones over the real one), and it stays
// across a reload and for a tab opening later.
import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

type W = { go(z: number): void; at(x: number, z: number): [number, number]; mine(): [number, number]; idle(): boolean };
const go = (page: Page, z: number) => page.evaluate((z) => (window as unknown as { __world: W }).__world.go(z), z);
const at = (page: Page, x: number, z: number) => page.evaluate(([x, z]) => (window as unknown as { __world: W }).__world.at(x, z), [x, z] as const);
const DATE = '2026-11-04T12:00';

async function open(page: Page, q = '') {
  await page.goto(`?demo&date=${DATE}&critter=none${q}`);
  await expect(page.getByRole('button', { name: /^ごほうび · ふたりのベル / })).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(2000);
}
/** The island reads its layout (its もようがえ is IslandEdit then). */
const onLayout = (page: Page) => page.evaluate(() => (window as unknown as { __world: { site(): { on: boolean } } }).__world.site().on);
const OLD = 'the old decorations’ mode: the layout’s もようがえ is IslandEdit (its tests below)';
async function decorate(page: Page) {
  await page.bringToFront(); // a tab in the back gets no frames
  await page.getByRole('button', { name: /^ごほうび · ふたりのベル / }).click();
  await page.locator('[data-tab="settings"]').click();
  await page.locator('[data-decor-start]').click();
  await expect(page.locator('[data-tray]')).toHaveCount(10);
  await page.waitForTimeout(400);
}
/** Tap the island's ground at a world point (the mode takes the tap). */
async function tapGround(page: Page, x: number, z: number) {
  const [cx, cy] = await at(page, x, z);
  await page.mouse.click(cx, cy);
  await page.waitForTimeout(150);
}
const ghost = (page: Page) => page.locator('[data-ghost]');
const spot = async (page: Page) => [Number(await ghost(page).getAttribute('data-x')), Number(await ghost(page).getAttribute('data-z'))];

test('place: a tray item goes down on fine ground, a drag and a tap move it on the grid, red over water, ✓ places it', async ({ page }) => {
  await open(page);
  test.skip(await onLayout(page), OLD);
  await decorate(page);
  await expect(page.locator('[data-decor-count]')).toHaveText('0/30');
  await page.locator('[data-tray="stone-lantern"]').click();
  await expect(ghost(page)).toHaveCount(1);
  await expect(page.locator('[data-foot]')).toHaveAttribute('data-foot', 'ok');
  const [x0, z0] = await spot(page);
  expect(x0 % 12).toBe(0); // a 2 × 2 item's centre is on a grid line
  // a drag with one finger moves it (the world stays put)
  const b = (await page.locator('[data-ghost] .ghost').boundingBox())!;
  const cam = await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam());
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(b.x + b.width / 2 + i * 8, b.y + b.height / 2 + i * 2);
  await page.mouse.up();
  const [x1] = await spot(page);
  expect(x1).toBeGreaterThan(x0 + 30);
  expect(await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam())).toBe(cam);
  // a tap on the ground puts it there
  await tapGround(page, 300, 432);
  expect(await spot(page)).toEqual([300, 432]);
  await expect(page.locator('[data-foot]')).toHaveAttribute('data-foot', 'ok');
  // turned a quarter
  await page.locator('button[data-act="turn"]').click();
  await expect(ghost(page)).toHaveAttribute('data-f', '1');
  // over the pond it's red, and ✓ won't place it
  await go(page, 600);
  await page.waitForTimeout(300);
  await tapGround(page, 74, 772);
  await expect(page.locator('[data-foot]')).toHaveAttribute('data-foot', 'bad');
  await expect(page.locator('button[data-act="place"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-why]')).toHaveText('みずの うえには おけません');
  await go(page, 0);
  await page.waitForTimeout(300);
  await tapGround(page, 300, 432);
  await page.locator('button[data-act="place"]').click();
  await expect(ghost(page)).toHaveCount(0);
  const placed = page.locator('[data-decor]');
  await expect(placed).toHaveCount(1);
  await expect(placed).toHaveAttribute('data-item', 'stone-lantern');
  await expect(placed).toHaveAttribute('data-x', '300');
  await expect(placed).toHaveAttribute('data-f', '1');
  await expect(page.locator('[data-decor-count]')).toHaveText('1/30');
  // nothing runs when still, in the mode too
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as { __world: W }).__world.idle())).toBe(true);
  // ✓ おわる: the tray goes; a tap on the item jiggles it where it stands (no walk)
  await page.locator('[data-decor-done]').click();
  await expect(page.locator('[data-tray]')).toHaveCount(0);
  const mine = await page.evaluate(() => (window as unknown as { __world: W }).__world.mine());
  await placed.click();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as unknown as { __world: W }).__world.mine())).toEqual(mine);
});

test('move and remove: a tap picks a placed item up, ✓ moves it, 🗑 puts it away and とりけす brings it back', async ({ page }) => {
  await open(page);
  test.skip(await onLayout(page), OLD);
  await decorate(page);
  await page.locator('[data-tray="tanuki"]').click();
  await tapGround(page, 300, 432);
  await page.locator('button[data-act="place"]').click();
  const item = page.locator('[data-decor]');
  await expect(item).toHaveCount(1);
  const id = await item.getAttribute('data-decor');
  // picked up: the ghost is that item, the placed one hidden
  await item.click();
  await expect(ghost(page)).toHaveAttribute('data-ghost', id!);
  await expect(page.locator('[data-decor]')).toHaveCount(0);
  await tapGround(page, 264, 480);
  await page.locator('button[data-act="place"]').click();
  await expect(page.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '264');
  // ✕ puts it back where it was
  await page.locator(`[data-decor="${id}"]`).click();
  await tapGround(page, 120, 380);
  await page.locator('button[data-act="cancel"]').click();
  await expect(page.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '264');
  // put away, and back with とりけす (a new one where it stood)
  await page.locator(`[data-decor="${id}"]`).click();
  await page.locator('button[data-act="remove"]').click();
  await expect(page.locator('[data-decor]')).toHaveCount(0);
  await expect(page.locator('[data-decor-count]')).toHaveText('0/30');
  await page.getByRole('button', { name: 'とりけす' }).click();
  await expect(page.locator('[data-decor]')).toHaveCount(1);
  await expect(page.locator('[data-decor]')).toHaveAttribute('data-x', '264');
  await expect(page.locator('[data-decor-count]')).toHaveText('1/30');
});

test('both players see the same layout, live and after a reload; a tab opening later too', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  test.skip(await onLayout(a), OLD);
  await open(b, '&as=B');
  await decorate(a);
  await a.locator('[data-tray="garden-wagon"]').click();
  await tapGround(a, 234, 384);
  await a.locator('button[data-act="place"]').click();
  const id = await a.locator('[data-decor]').getAttribute('data-decor');
  // B sees it at once, where A put it (a 5-cell wagon's centre is half a cell off the line)
  await expect(a.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '234');
  await expect(b.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '234', { timeout: 3000 });
  await expect(b.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-item', 'garden-wagon');
  // B moves it; A sees the move
  await decorate(b);
  await b.locator(`[data-decor="${id}"]`).click();
  await tapGround(b, 222, 504);
  await expect(b.locator('[data-foot]')).toHaveAttribute('data-foot', 'ok');
  await b.locator('button[data-act="place"]').click();
  await expect(b.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '222');
  await expect(a.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '222', { timeout: 3000 });
  await expect(a.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-z', '504');
  // a reload keeps it; a third tab opening later finds it too
  await a.bringToFront();
  await a.reload();
  await expect(a.getByRole('button', { name: /^ごほうび · ふたりのベル / })).toBeVisible();
  await expect(a.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-x', '222');
  const c = await ctx.newPage();
  await open(c, '&as=B');
  await expect(c.locator(`[data-decor="${id}"]`)).toHaveAttribute('data-z', '504');
  // A puts it away: gone on B
  await decorate(a);
  await a.locator(`[data-decor="${id}"]`).click();
  await a.locator('button[data-act="remove"]').click();
  await expect(b.locator('[data-decor]')).toHaveCount(0, { timeout: 3000 });
  await ctx.close();
});

// ---- on the layout: IslandEdit over the 3D island (docs/island-layout.md "Phone editing") ----

type IE = { sel(): { id?: string; k: string; x: number; z: number; f: number; why: string | null } | null; tileScreen(c: number, r: number): [number, number] | null };
const ie = <R,>(page: Page, fn: (e: IE) => R) => page.evaluate(`(${fn.toString()})(window.__islandEdit)`) as Promise<R>;
type L = { count(k: string): number; ids(k: string): string[]; obj(id: string): { x: number; z: number; f: number } | undefined };
const lay = <R,>(page: Page, fn: (l: L) => R) => page.evaluate(`(${fn.toString()})(window.__layout)`) as Promise<R>;
const NEW = 'the layout’s もようがえ (IslandEdit): on the layout only';
/** もようがえ on the layout: IslandEdit over the island, the camera a little up the lawn. */
async function editLayout(page: Page) {
  await page.bringToFront();
  await go(page, 300);
  await page.getByRole('button', { name: /^ごほうび · ふたりのベル / }).click();
  await page.locator('[data-tab="settings"]').click();
  await page.locator('[data-decor-start]').click();
  await expect(page.locator('[data-island-edit]')).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __islandEdit?: unknown }).__islandEdit);
  await page.waitForTimeout(300);
}
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

test('on the layout: a piece from the tray goes down on fine ground, a drag moves it a tile at a time, a tap on the ground puts it there, red over the water, ✓ places it', async ({ page }) => {
  await open(page);
  test.skip(!(await onLayout(page)), NEW);
  await editLayout(page);
  // (not the old decorations' tray)
  await expect(page.locator('[data-tray]')).toHaveCount(0);
  const before = await lay(page, (l) => l.count('stone-lantern'));
  await page.locator('[data-tab="furniture"]').click();
  await page.locator('[data-island-item="stone-lantern"]').click();
  await expect.poll(() => ie(page, (e) => e.sel()?.k ?? null)).toBe('stone-lantern');
  expect(await ie(page, (e) => e.sel()!.why)).toBeNull();
  // a drag with one finger moves it a tile at a time (the camera stays put)
  const s0 = (await ie(page, (e) => e.sel()))!, cam = await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam());
  await dragTile(page, [s0.x, s0.z], [s0.x - 2, s0.z]);
  await expect.poll(() => ie(page, (e) => e.sel()!.x)).toBe(s0.x - 2);
  expect(await page.evaluate(() => (window as unknown as { __world: { cam(): number } }).__world.cam())).toBeCloseTo(cam, 0);
  // a tap on the ground puts it there
  const [fx, fz] = await fineFrom(page, s0.x + 3, s0.z + 1);
  expect(await ie(page, (e) => [e.sel()!.x, e.sel()!.z])).toEqual([fx, fz]);
  // turned a quarter
  await page.locator('button[data-act="turn"]').dispatchEvent('click');
  await expect.poll(() => ie(page, (e) => e.sel()!.f)).toBe(1);
  // over the stream it's red, and ✓ won't place it
  await tapTile(page, 5, 24);
  await expect.poll(() => ie(page, (e) => e.sel()?.why ?? null)).toContain('みず');
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

test('on the layout: a tap picks a placed piece up, a drag and ✓ move it, ✕ puts it back, 🗑 puts it away', async ({ page }) => {
  await open(page);
  test.skip(!(await onLayout(page)), NEW);
  await editLayout(page);
  await page.locator('[data-tab="furniture"]').click();
  await page.locator('[data-island-item="tanuki"]').click();
  const [x0, z0] = await fineFrom(page, 11, 18);
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

test('on the layout: both players see the same island, live and after a reload; a tab opening later too', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  test.skip(!(await onLayout(a)), NEW);
  await open(b, '&as=B');
  await editLayout(a);
  await a.locator('[data-tab="furniture"]').click();
  await a.locator('[data-island-item="garden-wagon"]').click();
  const [x0, z0] = await fineFrom(a, 11, 18);
  await a.locator('button[data-act="place"]').dispatchEvent('click');
  const id = (await lay(a, (l) => l.ids('garden-wagon'))).at(-1)!;
  // B has it at once, where A put it
  const where = (p: Page) => p.evaluate((id) => { const o = (window as unknown as { __layout: L }).__layout.obj(id); return o ? [o.x, o.z] : null; }, id);
  await expect.poll(() => where(b), { timeout: 3000 }).toEqual([x0, z0]);
  // B moves it; A has the move
  await editLayout(b);
  await dragTile(b, [x0, z0], [x0 - 1, z0 + 1]);
  await expect.poll(() => ie(b, (e) => e.sel()?.id ?? null)).toBe(id);
  const to = await ie(b, (e) => [e.sel()!.x, e.sel()!.z]);
  if (await ie(b, (e) => e.sel()!.why)) await fineFrom(b, x0 - 1, z0 + 1);
  const moved = await ie(b, (e) => [e.sel()!.x, e.sel()!.z]);
  void to;
  await b.locator('button[data-act="place"]').dispatchEvent('click');
  await expect.poll(() => where(a), { timeout: 3000 }).toEqual(moved);
  // a reload keeps it; a third tab opening later finds it too
  await a.bringToFront();
  await a.reload();
  await expect(a.getByRole('button', { name: /^ごほうび · ふたりのベル / })).toBeVisible();
  await expect.poll(() => where(a)).toEqual(moved);
  const c = await ctx.newPage();
  await open(c, '&as=B');
  await expect.poll(() => where(c)).toEqual(moved);
  // A puts it away: gone on B
  await editLayout(a);
  await tapTile(a, moved[0], moved[1]);
  await expect.poll(() => ie(a, (e) => e.sel()?.id ?? null)).toBe(id);
  await a.locator('button[data-act="remove"]').dispatchEvent('click');
  await expect.poll(() => where(b), { timeout: 3000 }).toBeNull();
  await ctx.close();
});

