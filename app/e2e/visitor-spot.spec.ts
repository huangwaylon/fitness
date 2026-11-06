// The visitors' spot (docs/design.md "Visitors", docs/island-layout.md "Phone editing"): the もようがえ's おきゃくさん tab
// puts down the plaza's mark (one on the island: the tray's item picks up the one there), a layout op every phone holds;
// the visitors stand on it on both phones, move with it, and go back to the island's usual spot when it's taken away.
// The editor's phone view without WebGL (`preview=0`), as island-edit.spec's.
import { expect, test, type Page } from './fixtures.ts';
import { geo, offFrom } from './island.ts';
import { GRID, TILE } from '../src/lib/layout/grid.ts';

test.use({ viewport: { width: 393, height: 852 } });

const Q = '?demo&date=2026-11-04T12:00&preview=0';
const ISLAND = '?demo&date=2026-11-04T12:00&visitor=kicks&critter=none';
type IE = { sel(): { id: string | null; k: string; x: number; z: number; why: string | null } | null; tileScreen(c: number, r: number): [number, number] | null };
const ie = <R,>(page: Page, fn: (e: IE) => R) => page.evaluate(`(${fn.toString()})(window.__islandEdit)`) as Promise<R>;
type L = { ids(k: string): string[]; obj(id: string): { x: number; z: number } };
const plaza = (page: Page) => page.evaluate(() => {
  const l = (window as unknown as { __layout: L }).__layout, id = l.ids('plaza')[0];
  return id ? [l.obj(id).x, l.obj(id).z] as [number, number] : null;
});
const mid = ([c, r]: [number, number]) => [GRID.x0 + (c + 0.5) * TILE, GRID.z0 + (r + 0.5) * TILE];

/** Kicks on an island tab, reloaded (his next appearance): the stage where it should be, and he stands on it. */
async function visitorAt(page: Page, want: readonly number[]) {
  await page.reload();
  await expect.poll(async () => (await geo(page)).CENTRE_STAGE).toEqual(want);
  await expect(page.locator('[data-visitor="kicks"] .art')).toBeAttached();
  await expect.poll(() => offFrom(page, '[data-visitor="kicks"]', want[0], want[1])).toBeLessThan(2);
}

test('put the visitors’ spot down, move it, take it away: Kicks stands there on both phones, then where he did', async ({ context }) => {
  const a = await context.newPage(), b = await context.newPage();
  await a.goto(ISLAND);
  await b.goto(`${ISLAND}&as=B`);
  await a.reload();
  const usual = (await geo(a)).CENTRE_STAGE;
  await visitorAt(a, usual);
  const ed = await context.newPage();
  await ed.goto(`editor/${Q}&view=phone&edit&cam=300`);
  await ed.waitForFunction(() => (window as unknown as { __islandEdit?: unknown }).__islandEdit);
  // no plaza yet: the usual spot's ring
  await expect(ed.locator('[data-mark="usual"]')).toHaveCount(1);
  await ed.locator('[data-tab="visitor"]').click();
  await ed.locator('[data-island-item="plaza"]').click();
  // down on the clear tile nearest the view's middle, ✓
  await expect.poll(() => ie(ed, (e) => e.sel()?.k ?? null)).toBe('plaza');
  expect(await ie(ed, (e) => e.sel()!.why)).toBeNull();
  await ed.locator('[data-act="place"]').click();
  await expect.poll(() => plaza(ed)).not.toBeNull();
  const first = (await plaza(ed))!;
  await expect(ed.locator('[data-mark="plaza"][data-mark-ok="true"]')).toHaveCount(1);
  await expect(ed.locator('[data-mark="usual"]')).toHaveCount(0);
  for (const p of [a, b]) {
    await p.bringToFront();
    await visitorAt(p, mid(first));
  }

  // the tray's item again picks up the one there; a tap a few tiles off moves it (a clear tile: no red)
  await ed.bringToFront();
  await ed.locator('[data-island-item="plaza"]').click();
  await expect.poll(() => ie(ed, (e) => e.sel()?.id ?? null)).not.toBeNull();
  let moved: [number, number] | null = null;
  for (const [dc, dr] of [[3, 0], [-3, 0], [0, 3], [0, -3], [4, 2], [-4, 2]] as const) {
    const at = await ed.evaluate(([c, r]) => (window as unknown as { __islandEdit: IE }).__islandEdit.tileScreen(c, r), [first[0] + dc, first[1] + dr] as const);
    if (!at) continue;
    await ed.mouse.click(at[0], at[1]);
    await expect.poll(() => ie(ed, (e) => e.sel()?.x ?? null)).toBe(first[0] + dc);
    if ((await ie(ed, (e) => e.sel()!.why)) === null) {
      moved = [first[0] + dc, first[1] + dr];
      break;
    }
  }
  expect(moved).not.toBeNull();
  await ed.locator('[data-act="place"]').click();
  await expect.poll(() => plaza(ed)).toEqual(moved);
  expect(await ed.evaluate(() => (window as unknown as { __layout: L }).__layout.ids('plaza').length)).toBe(1);
  for (const p of [a, b]) {
    await p.bringToFront();
    await visitorAt(p, mid(moved!));
  }

  // 🗑: the usual spot again
  await ed.bringToFront();
  await ed.locator('[data-island-item="plaza"]').click();
  await ed.locator('[data-act="remove"]').click();
  await expect.poll(() => plaza(ed)).toBeNull();
  await expect(ed.locator('[data-mark="usual"]')).toHaveCount(1);
  for (const p of [a, b]) {
    await p.bringToFront();
    await visitorAt(p, usual);
  }
});

test('something put on the spot: red, why in the bar, the usual spot’s ring again; the mark won’t go down there', async ({ page }) => {
  await page.goto(`editor/${Q}&view=phone&edit&cam=300`);
  await page.waitForFunction(() => (window as unknown as { __islandEdit?: unknown }).__islandEdit);
  await page.locator('[data-tab="visitor"]').click();
  await page.locator('[data-island-item="plaza"]').click();
  await expect.poll(() => ie(page, (e) => e.sel()?.k ?? null)).toBe('plaza');
  await page.locator('[data-act="place"]').click();
  await expect.poll(() => plaza(page)).not.toBeNull();
  const at = (await plaza(page))!;
  // a bench on it
  await page.locator('[data-tab="furniture"]').click();
  await page.locator('[data-island-item="park-bench"]').click();
  const p = (await page.evaluate(([c, r]) => (window as unknown as { __islandEdit: IE }).__islandEdit.tileScreen(c, r), at))!;
  await page.mouse.click(p[0], p[1]);
  await expect.poll(() => ie(page, (e) => (e.sel() ? [e.sel()!.k, e.sel()!.why] : null))).toEqual(['park-bench', null]);
  await page.locator('[data-act="place"]').click();
  await expect(page.locator('[data-mark="plaza"][data-mark-ok="false"]')).toHaveCount(1);
  await expect(page.locator('[data-island-warn]')).toContainText('お客さんの場所');
  await expect(page.locator('[data-mark="usual"]')).toHaveCount(1);
  // and the mark itself won't go down where nobody can stand
  await page.locator('[data-tab="visitor"]').click();
  await page.locator('[data-island-item="plaza"]').click();
  await page.mouse.click(p[0], p[1]);
  await expect.poll(() => ie(page, (e) => e.sel()?.why ?? null)).toContain('立てない');
  await expect(page.locator('[data-act="place"]')).toHaveAttribute('aria-disabled', 'true');
});
