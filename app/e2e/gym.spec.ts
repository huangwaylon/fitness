// The gym (docs/design.md "Decorating: the gym"): the editor's もようがえ's ジム tab lists NH's fitness furniture; a
// treadmill put down there stays (a reload) and is on both phones at once; a tap on it walks my villager up to it and
// it runs on it (the 3D villager's 'run'), and the other phone sees it running too (the walk is all the relay carries:
// standing still on its spot is on it, island/sitting.ts).
import { expect, test, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { geo, islandUp, openEditor, openNear, tapOn } from './island.ts';
import { HELD_SCALE } from '../src/lib/components/world3d/benchBar.ts';

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
  await islandUp(page);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await expect.poll(() => v3(page, 'mine'), { timeout: 30_000 }).not.toBeNull();
}
/** A piece of `kind` put down from the editor's tray (its ジム tab) near tile 6 × 12, the editor closed: its id. */
async function putDown(page: Page, kind: string): Promise<string> {
  const ed = await openEditor(page.context(), `demo&date=${DATE}`);
  await ed.locator('[data-tab="gym"]').click();
  await ed.locator(`[data-island-item="${kind}"]`).click();
  await expect.poll(() => ie(ed, (e) => e.sel()?.k ?? null)).toBe(kind);
  await fineFrom(ed, 6, 12);
  await ed.locator('button[data-act="place"]').dispatchEvent('click');
  await expect.poll(() => ie(ed, (e) => e.sel())).toBeNull();
  const id = (await ids(ed, kind)).at(-1)!;
  await ed.close();
  // the island's camera a little up the lawn, by it
  await page.bringToFront();
  await go(page, 300);
  return id;
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
  const ed = await openEditor(ctx, `demo&date=${DATE}`);
  await ed.locator('[data-tab="gym"]').click();
  await expect(ed.locator('[data-tab="gym"]')).toHaveText('ジム');
  for (const k of GYM) await expect(ed.locator(`[data-island-item="${k}"]`), k).toBeVisible();
  await expect(ed.locator('[data-island-item="treadmill"]')).toHaveAttribute('aria-label', 'ランニングマシン');
  await ed.locator('[data-island-item="treadmill"]').click();
  await expect.poll(() => ie(ed, (e) => e.sel()?.k ?? null)).toBe('treadmill');
  const [x0, z0] = await fineFrom(ed, 6, 12);
  await ed.locator('button[data-act="place"]').dispatchEvent('click');
  await expect.poll(() => ie(ed, (e) => e.sel())).toBeNull();
  const id = (await ids(ed, 'treadmill')).at(-1)!;
  await ed.close();
  // A's island has it at once, where it was put
  await expect.poll(() => where(a, id), { timeout: 10_000 }).toEqual([x0, z0]);
  // B's too, drawn as NH's model
  await expect.poll(() => where(b, id), { timeout: 10_000 }).toEqual([x0, z0]);
  await expect.poll(() => b.evaluate((id) => (window as unknown as { __world3d: { where(id: string): { model: string } | null } }).__world3d.where(id)?.model ?? null, id)).toBe('decor/treadmill');
  // A taps it: my villager walks up to it and runs on it; B sees A's villager (its partner) running there
  await a.bringToFront();
  await go(a, 300);
  await tapOn(a, a.locator(`[data-decor="${id}"]`));
  await expect.poll(() => v3(a, 'mine'), { timeout: 15_000 }).toBe('run');
  await b.bringToFront();
  await expect.poll(() => v3(b, 'partner'), { timeout: 15_000 }).toBe('run');
  // and it's kept: after a reload it's there, and A's villager is still on it
  await a.bringToFront();
  await a.reload();
  await islandUp(a);
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

/** The weight bench's bar with a villager (world3d/benchBar.ts): how far off the rack, its hands and their middle. */
type Xyz = [number, number, number];
type Bar = { piece: string; k: number; l: Xyz; r: Xyz; hands: Xyz } | null;
const bar = (page: Page, slot: string) => page.evaluate((s) => (window as unknown as { __villagers3?: { bar(s: string): Bar } }).__villagers3?.bar(s) ?? null, slot);
/** The bench's bar (three's space): where it's drawn off the bench (null: not), the model drawn there (the gym's
 *  barbell) and whether the bench still shows its own small bar. */
type Part = { at: Xyz | null; model: string | null; racked: boolean } | null;
const part = (page: Page, id: string) => page.evaluate((id) => (window as unknown as { __world3d: { part(id: string, n: string): Part } }).__world3d.part(id, 'bar'), id);
/** As at rest: the small bar on the bench's rack, nothing drawn off it. */
const racked = async (page: Page, id: string) => {
  const p = await part(page, id);
  return !!p && p.racked && p.at === null && p.model === null;
};
/** The barbell's grip (between its inner plates: 12 of its 19.2 model units, at the island's scale 3 and its own; u). */
const GRIP = 12 * 3 * HELD_SCALE;

/** Over a rep (1.8 s), on `page`: the gym's barbell in the hands and the bench's small bar off its rack; the barbell's
 *  middle at the hands' middle, pressed up and down, the hands on its grip. */
async function rep(page: Page, slot: string, id: string) {
  const ys: number[] = [], spans: number[] = [];
  for (let i = 0; i < 20; i++) {
    const [h, p] = await page.evaluate(([s, id]) => {
      const w = window as unknown as { __villagers3: { bar(s: string): Bar }; __world3d: { part(id: string, n: string): Part } };
      return [w.__villagers3.bar(s), w.__world3d.part(id, 'bar')] as const;
    }, [slot, id] as const);
    expect(h && p?.at, 'held').toBeTruthy();
    expect(p!.model, 'the gym\'s barbell').toBe('decor/barbell');
    expect(p!.racked, 'the small bar off the rack').toBe(false);
    expect(Math.hypot(p!.at![0] - h!.hands[0], p!.at![1] - h!.hands[1], p!.at![2] - h!.hands[2]), 'at the hands').toBeLessThan(4);
    ys.push(p!.at![1]);
    spans.push(Math.hypot(h!.l[0] - h!.r[0], h!.l[1] - h!.r[1], h!.l[2] - h!.r[2]));
    await page.waitForTimeout(100);
  }
  expect(Math.max(...ys) - Math.min(...ys), 'pressed up and down').toBeGreaterThan(3);
  if (process.env.SHOTS) console.log(`${slot}: the hands ${Math.min(...spans).toFixed(1)}-${Math.max(...spans).toFixed(1)} u apart`);
  expect(Math.max(...spans), 'the hands on the grip').toBeLessThan(GRIP);
}

for (const who of ['a human player', 'a villager'] as const) test(`the weight bench, ${who} on it: lying down, the gym's barbell takes the small bar's place and is pressed in the hands (on both phones); getting up racks the small bar`, async ({ browser }) => {
  test.setTimeout(90_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  // (the demo's A is a human player; a villager's look: ジャック)
  expect(await a.evaluate(() => (window as unknown as { __villagers3: { model(s: string): string | null } }).__villagers3.model('mine'))).toMatch(/^p:/);
  if (who === 'a villager') {
    const st = a.locator('dialog[open]').first();
    await fromMenu(a, 'settings');
    await st.locator('[data-push=look]').click();
    await st.locator('[data-look-tab=villager]').click();
    await st.getByRole('searchbox').fill('ジャック');
    await st.getByRole('radio', { name: 'ジャック' }).click();
    await st.locator('.titlebar .back').click();
    await a.keyboard.press('Escape');
    await expect.poll(() => a.evaluate(() => (window as unknown as { __villagers3: { model(s: string): string | null } }).__villagers3.model('mine')), { timeout: 30_000 }).toBe('v:raymond');
  }
  const id = await putDown(a, 'weight-bench');
  await expect.poll(() => a.evaluate((id) => (window as unknown as { __world3d: { where(id: string): { model: string } | null } }).__world3d.where(id)?.model ?? null, id)).toBe('decor/weight-bench');
  // at rest the bench is as it was: its small bar on the rack, no barbell
  expect(await racked(a, id)).toBe(true);
  await tapOn(a, a.locator(`[data-decor="${id}"]`));
  await expect.poll(() => v3(a, 'mine'), { timeout: 15_000 }).toBe('press');
  // lain down, the barbell comes off the rack into the hands
  await expect.poll(async () => (await bar(a, 'mine'))?.k ?? 0, { timeout: 5000 }).toBe(1);
  if (process.env.SHOTS) await a.screenshot({ path: `${process.env.SHOTS}/gym-press.png` });
  await rep(a, 'mine', id);
  // the other phone: A's villager (its partner) pressing, the barbell in its hands there too
  await b.bringToFront();
  await expect.poll(() => v3(b, 'partner'), { timeout: 15_000 }).toBe('press');
  await expect.poll(async () => (await bar(b, 'partner'))?.k ?? 0, { timeout: 8000 }).toBe(1);
  await rep(b, 'partner', id);
  // a tap on the ground: A gets up, the barbell goes and the small bar is back on the rack
  await a.bringToFront();
  const [bx, bz] = (await where(a, id))!;
  const [tx, tz] = await openNear(a, bx, bz + 60, 45, true);
  const [x, y] = await a.evaluate(([tx, tz]) => (window as unknown as { __world: { at(x: number, z: number): [number, number] } }).__world.at(tx, tz), [tx, tz]);
  await a.mouse.click(x, y);
  await expect.poll(() => v3(a, 'mine'), { timeout: 5000 }).not.toBe('press');
  await expect.poll(() => racked(a, id), { timeout: 3000 }).toBe(true);
  await b.bringToFront();
  await expect.poll(() => racked(b, id), { timeout: 8000 }).toBe(true);
  await ctx.close();
});
