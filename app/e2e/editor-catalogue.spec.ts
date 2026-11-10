// The outdoor catalogue in the editor (docs/island-layout.md "The outdoor catalogue"): the rooms' pieces NH puts
// outdoors, in the phone もようがえ's tabs (はにわ, 公園, 街…); a few put down there stand on the island as the rooms'
// own models at NH's furniture scale (a tile is 10 model units: 30u), a lamp lit at night by its room emitter.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp, openEditor } from './island.ts';
import O from '../src/lib/layout/outdoor.json' with { type: 'json' };

test.use({ viewport: { width: 393, height: 852 } });
const DAY = '2026-11-04T12:00', NIGHT = '2026-11-04T21:00';
const PIECES = O.pieces as Record<string, { t: string; h: number; w: number; d: number }>;

type Sel = { id: string | null; k: string; x: number; z: number; why: string | null };
type IE = { sel(): Sel | null; tileScreen(c: number, r: number): [number, number] | null };
type W = { where(id: string): { model: string } | null; size(id: string): { h: number; w: number } | null; lamps(): string[] };
const sel = (ed: Page) => ed.evaluate(() => (window as unknown as { __islandEdit: IE }).__islandEdit.sel());
const ids = (p: Page, k: string) => p.evaluate((k) => (window as unknown as { __layout: { ids(k: string): string[] } }).__layout.ids(k), k);
const w3 = <R,>(p: Page, fn: (w: W, id: string) => R, id: string) => p.evaluate(`(${fn.toString()})(window.__world3d, ${JSON.stringify(id)})`) as Promise<R>;

async function hold(ed: Page, tab: string, kind: string) {
  await ed.locator(`[data-tab="${tab}"]`).click();
  await ed.locator(`[data-island-item="${kind}"]`).click();
  await expect.poll(async () => (await sel(ed))?.k ?? null).toBe(kind);
}
/** A piece put down on the first free tile from (c, r) along its row: its id. */
async function putDown(ed: Page, tab: string, kind: string, c: number, r: number): Promise<string> {
  await hold(ed, tab, kind);
  for (let d = 0; d < 8; d++)
    for (const cc of [c + d, c - d]) {
      const [x, y] = (await ed.evaluate(([c, r]) => (window as unknown as { __islandEdit: IE }).__islandEdit.tileScreen(c, r), [cc, r] as const))!;
      await ed.mouse.click(x, y);
      const s = await sel(ed);
      if (s && !s.id && s.k === kind && !s.why) {
        const before = await ids(ed, kind);
        await ed.locator('button[data-act="place"]').dispatchEvent('click');
        await expect.poll(() => sel(ed)).toBeNull();
        return (await ids(ed, kind)).find((id) => !before.includes(id))!;
      }
      if (s?.id) {
        await ed.locator('button[data-act="cancel"]').dispatchEvent('click');
        await hold(ed, tab, kind);
      }
    }
  throw new Error(`no free tile by ${c}, ${r}`);
}

/** The plaza bench (家具), a round streetlight (明かり, a light), the castle gate (街, 3 × 1) and a gyroid (はにわ). */
const PUT = [['furniture', 'f12688', 5, 13], ['light', 'f13312', 12, 13], ['town', 'f13581', 6, 17], ['gyroid', 'f14074', 12, 17]] as const;

for (const [time, date] of [['day', DAY], ['night', NIGHT]] as const)
  test(`pieces of the outdoor catalogue put down in the editor stand on the island at NH’s scale (${time})`, async ({ page }) => {
    const ed = await openEditor(page.context(), `demo&date=${date}`);
    // the gyroids' tab holds all 36
    await ed.locator('[data-tab="gyroid"]').click();
    await expect(ed.locator('[data-island-item^="nh-"]')).toHaveCount(36);
    const put: [string, string][] = [];
    for (const [tab, code, c, r] of PUT) put.push([code, await putDown(ed, tab, `nh-${code}`, c, r)]);
    await ed.close();

    await page.goto(`?demo&date=${date}`);
    await islandUp(page);
    for (const [code, id] of put) {
      // the room piece's own model, at NH's furniture scale, its drawn height the room's (model units × 3u)
      await expect.poll(() => w3(page, (w, id) => w.where(id), id), { timeout: 30_000 }).toMatchObject({ model: `nh/${code}` });
      const size = (await w3(page, (w, id) => w.size(id), id))!;
      expect(size.h, code).toBeGreaterThan(PIECES[code].h * 3 * 0.8);
      expect(size.h, code).toBeLessThan(PIECES[code].h * 3 * 1.25);
      expect(size.w, code).toBeLessThan(Math.max(PIECES[code].w, PIECES[code].d) * 30 * 1.3);
    }
    // the streetlight's lamp lit at night only
    const light = put.find(([c]) => c === 'f13312')![1];
    await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: W }).__world3d.lamps())).toEqual(time === 'night' ? expect.arrayContaining([light]) : expect.not.arrayContaining([light]));
  });
