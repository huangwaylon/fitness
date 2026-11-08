// The island's もようがえ on the phone (docs/island-layout.md "Phone editing", layoutEdit/IslandEdit.svelte): a kind from
// the tray goes down as a ghost on the free tile nearest the view's middle, ✓ puts it there; a placed thing is picked
// up, dragged a tile at a time and put down again; each a layout op the other phone holds at once. Here over the
// editor's phone view without WebGL (`preview=0`: the plan; CI draws WebGL in software), the stage the 3D island
// gives it otherwise.
import { expect, test, type Page } from './fixtures.ts';

test.use({ viewport: { width: 393, height: 852 } });

const Q = '?demo&date=2026-11-04T12:00&preview=0';
type IE = { sel(): { k: string; x: number; z: number; why: string | null } | null; tileScreen(c: number, r: number): [number, number] | null };
const ie = <R,>(page: Page, fn: (e: IE) => R) => page.evaluate(`(${fn.toString()})(window.__islandEdit)`) as Promise<R>;

async function openEdit(page: Page, cam = 300) {
  await page.goto(`editor/${Q}&view=phone&edit&cam=${cam}`);
  await expect(page.locator('[data-island-edit]')).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __islandEdit?: unknown }).__islandEdit);
}

test('a new piece from the tray: down near the middle, ✓ puts it there; the other phone has it', async ({ context }) => {
  const phone = await context.newPage();
  await phone.goto(`${Q}&as=B`);
  await phone.waitForFunction(() => (window as unknown as { __layout?: unknown }).__layout);
  const page = await context.newPage();
  await openEdit(page);
  await page.locator('[data-tab="furniture"]').click();
  await page.locator('[data-island-item="park-bench"]').click();
  await expect.poll(() => ie(page, (e) => e.sel()?.k ?? null)).toBe('park-bench');
  expect(await ie(page, (e) => e.sel()!.why)).toBeNull();
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => ie(page, (e) => e.sel())).toBeNull();
  // a bench of a new id on the other phone's island
  await phone.bringToFront();
  await expect.poll(() => phone.evaluate(() => (window as unknown as { __layout: { count(k: string): number } }).__layout.count('park-bench'))).toBe(2);
});

test('pick up a placed thing, drag it two tiles, ✓; red over the river; 🗑 never for the tape deck', async ({ page }) => {
  await openEdit(page);
  // the tape deck at its default tile
  const t = await page.evaluate(() => {
    const l = (window as unknown as { __layout: { obj(id: string): { x: number; z: number } } }).__layout.obj('tape-deck');
    return [l.x, l.z] as [number, number];
  });
  const from = (await page.evaluate(([c, r]) => (window as unknown as { __islandEdit: IE }).__islandEdit.tileScreen(c, r), t))!;
  const to = (await page.evaluate(([c, r]) => (window as unknown as { __islandEdit: IE }).__islandEdit.tileScreen(c - 2, r), t))!;
  await page.mouse.move(from[0], from[1]);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(from[0] + ((to[0] - from[0]) * i) / 6, from[1] + ((to[1] - from[1]) * i) / 6);
  await page.mouse.up();
  await expect.poll(() => ie(page, (e) => e.sel()?.x ?? null)).toBe(t[0] - 2);
  expect(await ie(page, (e) => e.sel()!.why)).toBeNull();
  // no 🗑 for the tape deck (one of the island's one-offs)
  await expect(page.locator('[data-act="remove"]')).toHaveCount(0);
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __layout: { obj(id: string): { x: number } } }).__layout.obj('tape-deck').x)).toBe(t[0] - 2);
  // a tree over the stream: red, and why
  await page.locator('[data-tab="tree"]').click();
  await page.locator('[data-island-item="oak"]').click();
  const river = (await page.evaluate(() => (window as unknown as { __islandEdit: IE }).__islandEdit.tileScreen(5, 24)))!;
  await page.mouse.click(river[0], river[1]);
  await expect.poll(() => ie(page, (e) => e.sel()?.why ?? null)).toContain('水');
  await expect(page.locator('[data-act="place"]')).toHaveAttribute('aria-disabled', 'true');
});

test('the guest arranges the outdoors as a member does: its piece on both members’ islands', async ({ context }) => {
  const a = await context.newPage();
  await a.goto(`${Q}`);
  await a.waitForFunction(() => (window as unknown as { __layout?: unknown }).__layout);
  const b = await context.newPage();
  await b.goto(`${Q}&as=B`);
  await b.waitForFunction(() => (window as unknown as { __layout?: unknown }).__layout);
  const page = await context.newPage();
  await page.goto(`editor/${Q}&as=G&view=phone&edit&cam=300`);
  await expect(page.locator('[data-island-edit]')).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __islandEdit?: unknown }).__islandEdit);
  await page.locator('[data-tab="furniture"]').click();
  await page.locator('[data-island-item="park-bench"]').click();
  await expect.poll(() => ie(page, (e) => e.sel()?.k ?? null)).toBe('park-bench');
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => ie(page, (e) => e.sel())).toBeNull();
  for (const p of [a, b]) await expect.poll(() => p.evaluate(() => (window as unknown as { __layout: { count(k: string): number } }).__layout.count('park-bench'))).toBe(2);
  // and it's the record's: a member's phone opening later has it
  await a.reload();
  await a.waitForFunction(() => (window as unknown as { __layout?: unknown }).__layout);
  await expect.poll(() => a.evaluate(() => (window as unknown as { __layout: { count(k: string): number } }).__layout.count('park-bench'))).toBe(2);
});
