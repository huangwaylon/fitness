// Things on the island's tables (docs/island-layout.md "Table tops"): in the editor's phone もようがえ a small thing held
// over a table goes on its top (a tap on the table puts it there, as in the rooms); the island draws it there, at the
// top's height, a lantern's light on the stool at night; the table carries its things when moved, and isn't put away
// with them on it.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp, openEditor } from './island.ts';

test.use({ viewport: { width: 393, height: 852 } });
const DAY = '2026-11-04T12:00', NIGHT = '2026-11-04T21:00';
const SHOTS = process.env.SHOTS;

type Sel = { id: string | null; k: string; x: number; z: number; on?: string; why: string | null };
type IE = { sel(): Sel | null; tileScreen(c: number, r: number): [number, number] | null };
// (the grid's back-left corner: layout/grid.ts GRID x0, z0; a tile 30u)
type Obj = { id: string; k: string; x: number; z: number; f: number; on?: string };
const sel = (ed: Page) => ed.evaluate(() => (window as unknown as { __islandEdit: IE }).__islandEdit.sel());
const obj = (p: Page, id: string) => p.evaluate((id) => (window as unknown as { __layout: { obj(id: string): Obj | undefined } }).__layout.obj(id) ?? null, id);
const ids = (p: Page, k: string) => p.evaluate((k) => (window as unknown as { __layout: { ids(k: string): string[] } }).__layout.ids(k), k);
const where = (p: Page, id: string) => p.evaluate((id) => (window as unknown as { __world3d: { where(id: string): { x: number; y: number; z: number } | null } }).__world3d.where(id), id);
const lamps = (p: Page) => p.evaluate(() => (window as unknown as { __world3d: { lamps(): string[] } }).__world3d.lamps());

async function tapTile(ed: Page, c: number, r: number) {
  const [x, y] = (await ed.evaluate(([c, r]) => (window as unknown as { __islandEdit: IE }).__islandEdit.tileScreen(c, r), [c, r] as const))!;
  await ed.mouse.click(x, y);
}
async function hold(ed: Page, tab: string, kind: string) {
  await ed.locator(`[data-tab="${tab}"]`).click();
  await ed.locator(`[data-island-item="${kind}"]`).click();
  await expect.poll(async () => (await sel(ed))?.k ?? null).toBe(kind);
}
async function place(ed: Page, kind: string): Promise<string> {
  const before = await ids(ed, kind);
  await ed.locator('button[data-act="place"]').dispatchEvent('click');
  await expect.poll(() => sel(ed)).toBeNull();
  return (await ids(ed, kind)).find((id) => !before.includes(id))!;
}
/** A new piece put down on the first tile from (c, r) along its row where it may stand: its id. */
async function putDown(ed: Page, tab: string, kind: string, c: number, r: number): Promise<string> {
  await hold(ed, tab, kind);
  for (let d = 0; d < 8; d++)
    for (const cc of [c + d, c - d]) {
      await tapTile(ed, cc, r);
      const s = await sel(ed);
      if (s && !s.id && s.k === kind && !s.why) return place(ed, kind);
      if (s?.id) {
        await ed.locator('button[data-act="cancel"]').dispatchEvent('click');
        await hold(ed, tab, kind);
      }
    }
  throw new Error(`no free tile by ${c}, ${r}`);
}
/** A small thing put on surface `on`'s tile (c, r) with a tap there: its id. */
async function putOn(ed: Page, tab: string, kind: string, on: string, c: number, r: number): Promise<string> {
  await hold(ed, tab, kind);
  await tapTile(ed, c, r);
  await expect.poll(() => sel(ed)).toMatchObject({ k: kind, x: c, z: r, on, why: null });
  return place(ed, kind);
}
async function open(page: Page, date: string) {
  await page.goto(`?demo&date=${date}`);
  await islandUp(page);
}
/** The camp: an outdoor table with bread and a meal on it, a log stool with a lantern on it. */
async function camp(page: Page, date: string) {
  const ed = await openEditor(page.context(), `demo&date=${date}`);
  const table = await putDown(ed, 'camp', 'outdoor-table', 11, 17);
  const t = (await obj(ed, table))!;
  const stool = await putDown(ed, 'camp', 'log-stool', t.x + 2, t.z);
  const s = (await obj(ed, stool))!;
  const bread = await putOn(ed, 'food', 'bread', table, t.x, t.z);
  const meal = await putOn(ed, 'food', 'japanese-meal', table, t.x + 1, t.z);
  const lantern = await putOn(ed, 'camp', 'lantern', stool, s.x, s.z);
  return { ed, table, stool, bread, meal, lantern, t };
}
/** A screenshot zoomed in on a thing (the camera on it, at 2.2× the island's zoom). */
async function shot(page: Page, id: string, tag: string) {
  const [x, z] = (await page.evaluate((id) => (window as unknown as { __layout: { pos(id: string): [number, number] | null } }).__layout.pos(id), id))!;
  await page.evaluate(([x, z]) => {
    type G = { go(z: number, k?: number, x?: number): void; client(x: number, z: number): [number, number]; view(): { camZ: number } };
    const w = (window as unknown as { __world3d: G }).__world3d;
    let best: [number, number] | null = null;
    for (let cz = z - 500; cz <= z + 100; cz += 10) {
      w.go(cz, 2.2, x);
      const d = Math.abs(w.client(x, z)[1] - innerHeight * 0.5);
      if (!best || d < best[1]) best = [w.view().camZ, d];
    }
    w.go(best![0], 2.2, x);
  }, [x, z] as const);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { camStill(): boolean } }).__world3d.camStill())).toBe(true);
  await page.screenshot({ path: `${SHOTS}/table-tops-${tag}.png` });
}
const above = async (page: Page, kid: string, parent: string) => {
  const [a, b] = [await where(page, kid), await where(page, parent)];
  return a && b ? a.y - b.y : null;
};

test('food on a camp table and a lantern on a log stool, put there in the editor, stand on their tops on the island; the lantern lit at night', async ({ page }, info) => {
  await open(page, NIGHT);
  const { ed, table, stool, bread, meal, lantern, t } = await camp(page, NIGHT);
  // a tap on the table's taken tile with something held: there, red, and why
  await hold(ed, 'food', 'cookies');
  await tapTile(ed, t.x, t.z);
  await expect.poll(async () => (await sel(ed))?.why ?? null).toBe('ほかの家具と重なります');
  await ed.close();
  await page.bringToFront();
  expect(await obj(page, bread)).toMatchObject({ on: table, x: t.x, z: t.z });
  // the island: on the table's top (NH's 7.2 model units at 3u each) and the stool's (4.2), over their tiles
  await expect.poll(() => above(page, bread, table), { timeout: 10_000 }).toBeCloseTo(21.6, 0);
  await expect.poll(() => above(page, meal, table)).toBeCloseTo(21.6, 0);
  await expect.poll(() => above(page, lantern, stool)).toBeCloseTo(12.6, 0);
  const [b, m] = [(await where(page, bread))!, (await where(page, meal))!];
  expect(Math.abs(b.x - m.x)).toBeCloseTo(30, 0);
  await expect.poll(() => lamps(page), { timeout: 10_000 }).toContain(lantern);
  if (SHOTS && info.project.name.includes('webkit')) {
    await shot(page, bread, 'night');
  }
});

test('the table carries what\'s on it when moved and turned, and isn\'t put away with things on it', async ({ page }, info) => {
  await open(page, DAY);
  const { ed, table, bread, meal, t } = await camp(page, DAY);
  if (SHOTS && info.project.name.includes('webkit')) {
    await page.bringToFront();
    await expect.poll(() => above(page, bread, table), { timeout: 10_000 }).toBeCloseTo(21.6, 0);
    await shot(page, bread, 'day');
    await ed.bringToFront();
  }
  // a tap on a thing on the top takes it; on the rest of the tile, the table (both its tiles hold a thing)
  await tapTile(ed, t.x + 1, t.z);
  await expect.poll(async () => (await sel(ed))?.id).toBe(meal);
  await ed.locator('button[data-act="cancel"]').dispatchEvent('click');
  const [cx, cy] = (await ed.evaluate(([x, z]) => (window as unknown as { __islandEdit: { screenOf(x: number, z: number): [number, number] | null } }).__islandEdit.screenOf(x, z), [-90 + (t.x + 0.12) * 30, -90 + (t.z + 0.15) * 30] as const))!;
  await ed.mouse.click(cx, cy);
  await expect.poll(async () => (await sel(ed))?.id).toBe(table);
  await ed.locator('button[data-act="remove"]').dispatchEvent('click');
  await expect(ed.locator('[data-why]')).toHaveText('上のものを先に片付けてください');
  expect(await obj(ed, table)).not.toBeNull();
  // turned and moved along: its things go with it, turned with it
  await ed.locator('button[data-act="turn"]').dispatchEvent('click');
  for (const [c, r] of [[t.x - 2, t.z], [t.x - 2, t.z - 2], [t.x - 3, t.z], [t.x - 3, t.z - 2]]) {
    await tapTile(ed, c, r);
    const s = await sel(ed);
    if (s?.id === table && s.x === c && s.z === r && !s.why) break;
  }
  await expect.poll(() => sel(ed)).toMatchObject({ id: table, f: 1, why: null });
  await ed.locator('button[data-act="place"]').dispatchEvent('click');
  await expect.poll(() => sel(ed)).toBeNull();
  const nt = (await obj(ed, table))!;
  expect(nt).toMatchObject({ f: 1 });
  const [nb, nm] = [(await obj(ed, bread))!, (await obj(ed, meal))!];
  expect([nb.on, nm.on]).toEqual([table, table]);
  expect([[nb.x, nb.z], [nm.x, nm.z]].map((p) => p.join()).sort()).toEqual([[nt.x, nt.z], [nt.x, nt.z + 1]].map((p) => p.join()).sort());
  await ed.close();
  await page.bringToFront();
  await expect.poll(() => obj(page, bread)).toMatchObject({ x: nb.x, z: nb.z, on: table });
  await expect.poll(() => above(page, bread, table), { timeout: 10_000 }).toBeCloseTo(21.6, 0);
});
