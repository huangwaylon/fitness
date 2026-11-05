// The gym (docs/design.md "Decorating: the gym"): もようがえ's ジム tab lists NH's fitness furniture; a treadmill put
// down stays (a reload) and is on the other phone at once; a tap on it out of the mode walks my villager up to it and
// it runs on it (the 3D villager's 'run'), and the other phone sees it running too (the walk is all the relay carries:
// standing still on its spot is on it, island/sitting.ts).
import { expect, test, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';
import { geo, tapOn } from './island.ts';

test.use({ viewport: { width: 390, height: 844 } });
const DATE = '2026-11-04T12:00';
const GYM = ['pullup', 'weight-bench', 'exercise-bike', 'treadmill', 'punching-bag', 'exercise-ball', 'barbell', 'kettlebell', 'protein-shaker', 'water-cooler', 'digital-scale', 'climbing-wall', 'upright-locker'];

type IE = { sel(): { id?: string; k: string; x: number; z: number; f: number; why: string | null } | null; tileScreen(c: number, r: number): [number, number] | null };
const ie = <R,>(page: Page, fn: (e: IE) => R) => page.evaluate(`(${fn.toString()})(window.__islandEdit)`) as Promise<R>;
type L = { ids(k: string): string[]; obj(id: string): { x: number; z: number; f: number } | undefined };
const ids = (page: Page, k: string) => page.evaluate((k) => (window as unknown as { __layout: L }).__layout.ids(k), k);
const where = (page: Page, id: string) => page.evaluate((id) => { const o = (window as unknown as { __layout: L }).__layout.obj(id); return o ? [o.x, o.z] : null; }, id);
/** The 3D villager's state (villager3d: 'run' on the treadmill), null before its model is in. */
const v3 = (page: Page, slot: string) => page.evaluate((s) => (window as unknown as { __villagers3?: { state(s: string): string | null } }).__villagers3?.state(s) ?? null, slot);
const go = (page: Page, z: number) => page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z);

async function open(page: Page, q = '') {
  await page.goto(`?demo&date=${DATE}&critter=none&visitor=none${q}`);
  await expect(hudMenu(page)).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await expect.poll(() => v3(page, 'mine'), { timeout: 30_000 }).not.toBeNull();
}
async function editLayout(page: Page) {
  await page.bringToFront();
  await go(page, 300);
  await fromMenu(page, 'settings');
  await page.locator('[data-decor-start]').click();
  await expect(page.locator('[data-island-edit]')).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __islandEdit?: unknown }).__islandEdit);
}
/** The first tile from (c, r) on along its row where the held piece may stand (a tap on the ground moves it there). */
async function fineFrom(page: Page, c: number, r: number): Promise<[number, number]> {
  for (let d = 0; d < 8; d++)
    for (const cc of [c + d, c - d]) {
      const [x, y] = (await page.evaluate(([c, r]) => (window as unknown as { __islandEdit: IE }).__islandEdit.tileScreen(c, r), [cc, r] as const))!;
      await page.mouse.click(x, y);
      const s = await ie(page, (e) => e.sel());
      if (s && !s.why) return [s.x, s.z];
    }
  throw new Error(`no fine tile by ${c}, ${r}`);
}

test('the ジム tab lists the gym; a treadmill put down stays and is on the other phone; a tap on it runs on it, on both', async ({ browser }) => {
  test.setTimeout(90_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  await editLayout(a);
  await a.locator('[data-tab="gym"]').click();
  await expect(a.locator('[data-tab="gym"]')).toHaveText('ジム');
  for (const k of GYM) await expect(a.locator(`[data-island-item="${k}"]`), k).toBeVisible();
  await expect(a.locator('[data-island-item="treadmill"]')).toHaveAttribute('aria-label', 'ランニングマシン');
  await a.locator('[data-island-item="treadmill"]').click();
  await expect.poll(() => ie(a, (e) => e.sel()?.k ?? null)).toBe('treadmill');
  const [x0, z0] = await fineFrom(a, 6, 12);
  await a.locator('button[data-act="place"]').dispatchEvent('click');
  await expect.poll(() => ie(a, (e) => e.sel())).toBeNull();
  const id = (await ids(a, 'treadmill')).at(-1)!;
  expect(await where(a, id)).toEqual([x0, z0]);
  await a.locator('[data-island-done]').click();
  await expect(a.locator('[data-island-edit]')).toHaveCount(0);
  // B has it at once, where A put it, drawn as NH's model
  await expect.poll(() => where(b, id), { timeout: 10_000 }).toEqual([x0, z0]);
  await expect.poll(() => b.evaluate((id) => (window as unknown as { __world3d: { where(id: string): { model: string } | null } }).__world3d.where(id)?.model ?? null, id)).toBe('decor/treadmill');
  // A taps it: my villager walks up to it and runs on it; B sees A's villager (its partner) running there
  await a.bringToFront();
  await tapOn(a, a.locator(`[data-decor="${id}"]`));
  await expect.poll(() => v3(a, 'mine'), { timeout: 15_000 }).toBe('run');
  await b.bringToFront();
  await expect.poll(() => v3(b, 'partner'), { timeout: 15_000 }).toBe('run');
  // and it's kept: after a reload it's there, and A's villager is still on it
  await a.bringToFront();
  await a.reload();
  await expect(hudMenu(a)).toBeVisible();
  await expect.poll(() => where(a, id), { timeout: 10_000 }).toEqual([x0, z0]);
  await expect.poll(() => v3(a, 'mine'), { timeout: 30_000 }).toBe('run');
  if (process.env.SHOTS) await a.screenshot({ path: `${process.env.SHOTS}/gym-treadmill.png` });
  await ctx.close();
});

test('the default island\'s pull-up bar is the gym\'s: a tap walks up to it and my villager does pull-ups there', async ({ page }) => {
  test.setTimeout(60_000);
  await open(page);
  const d = (await geo(page)).DECOR_SLOTS.find((s) => s.id === 'pullup')!;
  await go(page, d.z - 110);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world: { idle(): boolean } }).__world.idle()), { timeout: 5000 }).toBe(true);
  await tapOn(page, page.locator('[data-sit="pullup"]'));
  await expect.poll(() => v3(page, 'mine'), { timeout: 15_000 }).toBe('pullup');
});
