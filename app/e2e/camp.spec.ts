// The camp goods, the food and the rest of the gym (docs/design.md "Decorating"): the editor's もようがえ has a キャンプ and
// a 食べ物 tab and more of the ジム (NH's models, a pack a tab: scripts/world3d-assets.ts PACKS); a campfire put down is
// NH's model and a light at night, a hammock put down is lain on, a folding chair sat on, and the gym's new pieces are
// used as the old ones are (the speed bag punched; the guest on a yoga mat).
import { expect, test, type Page } from './fixtures.ts';
import { camTo, islandUp, openEditor, tapOn } from './island.ts';

test.use({ viewport: { width: 393, height: 852 } });
const DAY = '2026-11-04T12:00', NIGHT = '2026-11-04T21:00';
const CAMP = ['campfire', 'small-campfire', 'fire-pit', 'lantern', 'hammock', 'camping-cot', 'sleeping-bag', 'kids-tent', 'cooler-box', 'barbecue', 'camp-stove', 'folding-chair', 'folding-table', 'outdoor-bench', 'log-bench', 'directors-chair', 'destinations-signpost'];
const FOOD = ['picnic-basket', 'picnic-set', 'fruit-basket', 'bread', 'sandwich-set', 'campfire-cookware', 'stewpot', 'frying-pan', 'seafood-ajillo', 'grilled-sea-bass', 'western-meal', 'japanese-meal', 'bottled-beverage', 'coconut-juice', 'cookies'];
const GYM = ['yoga-mat', 'nook-yoga-mat', 'speed-bag', 'massage-chair', 'dumbbell'];

type IE = { sel(): { id: string | null; k: string; x: number; z: number; why: string | null } | null; tileScreen(c: number, r: number): [number, number] | null };
const sel = (page: Page) => page.evaluate(() => (window as unknown as { __islandEdit: IE }).__islandEdit.sel());
const ids = (page: Page, k: string) => page.evaluate((k) => (window as unknown as { __layout: { ids(k: string): string[] } }).__layout.ids(k), k);
const v3 = (page: Page, slot: string) => page.evaluate((s) => (window as unknown as { __villagers3?: { state(s: string): string | null } }).__villagers3?.state(s) ?? null, slot);
const model = (page: Page, id: string) => page.evaluate((id) => (window as unknown as { __world3d: { where(id: string): { model: string } | null } }).__world3d.where(id)?.model ?? null, id);

async function open(page: Page, date: string, q = '') {
  await page.goto(`?demo&date=${date}${q}`);
  await islandUp(page);
  await expect.poll(() => v3(page, 'mine'), { timeout: 30_000 }).not.toBeNull();
}
/** The first tile from (c, r) on along its row where the held new piece may stand (a tap on a placed one takes that up
 *  instead: put back, and on). */
async function fineFrom(ed: Page, kind: string, c: number, r: number): Promise<void> {
  for (let d = 0; d < 8; d++)
    for (const cc of [c + d, c - d]) {
      const [x, y] = (await ed.evaluate(([c, r]) => (window as unknown as { __islandEdit: IE }).__islandEdit.tileScreen(c, r), [cc, r] as const))!;
      await ed.mouse.click(x, y);
      const s = await sel(ed);
      if (s && !s.id && s.k === kind && !s.why) return;
      if (s?.id) {
        await ed.locator('button[data-act="cancel"]').dispatchEvent('click');
        await ed.locator(`[data-island-item="${kind}"]`).click();
      }
    }
  throw new Error(`no fine tile by ${c}, ${r}`);
}
/** Pieces put down from the editor's tray (`tab`'s), each near its tile: their ids. */
async function putDown(page: Page, date: string, pieces: readonly [tab: string, kind: string, c: number, r: number][]): Promise<string[]> {
  const ed = await openEditor(page.context(), `demo&date=${date}`);
  const out: string[] = [];
  for (const [tab, kind, c, r] of pieces) {
    await ed.locator(`[data-tab="${tab}"]`).click();
    await ed.locator(`[data-island-item="${kind}"]`).click();
    await expect.poll(async () => (await sel(ed))?.k ?? null).toBe(kind);
    await fineFrom(ed, kind, c, r);
    await ed.locator('button[data-act="place"]').dispatchEvent('click');
    await expect.poll(() => sel(ed)).toBeNull();
    out.push((await ids(ed, kind)).at(-1)!);
  }
  await ed.close();
  await page.bringToFront();
  return out;
}
const zOf = (page: Page, id: string) => page.evaluate((id) => (window as unknown as { __layout: { pos(id: string): [number, number] | null } }).__layout.pos(id)?.[1] ?? 0, id);

test('the キャンプ and 食べ物 tabs list NH\'s camp goods and food, the ジム its new pieces, by their names', async ({ page }) => {
  const ed = await openEditor(page.context(), `demo&date=${DAY}`);
  for (const [tab, name, kinds] of [['camp', 'キャンプ', CAMP], ['food', '食べ物', FOOD], ['gym', 'ジム', GYM]] as const) {
    await ed.locator(`[data-tab="${tab}"]`).click();
    await expect(ed.locator(`[data-tab="${tab}"]`)).toHaveText(name);
    for (const k of kinds) await expect(ed.locator(`[data-island-item="${k}"]`), k).toBeVisible();
  }
  await ed.locator('[data-tab="camp"]').click();
  await expect(ed.locator('[data-island-item="small-campfire"]')).toHaveAttribute('aria-label', 'たき火');
  await expect(ed.locator('[data-island-item="folding-chair"]')).toHaveAttribute('aria-label', '折りたたみアウトドアチェア');
  await ed.locator('[data-tab="food"]').click();
  await expect(ed.locator('[data-island-item="campfire-cookware"]')).toHaveAttribute('aria-label', '飯ごう');
});

test('a campfire and a hammock put down: NH\'s models, the campfire a light at night; the hammock lain on, a folding chair sat on', async ({ page }) => {
  await open(page, NIGHT);
  const [fire, hammock, chair] = await putDown(page, NIGHT, [['camp', 'small-campfire', 6, 12], ['camp', 'hammock', 4, 14], ['camp', 'folding-chair', 8, 14]]);
  await expect.poll(() => model(page, fire), { timeout: 10_000 }).toBe('decor/small-campfire');
  await expect.poll(() => model(page, hammock)).toBe('hammock');
  await expect.poll(() => model(page, chair)).toBe('decor/folding-chair');
  // at night the campfire is one of the island's lights (its halo and pool, faded in: lights.ts)
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world3d: { lamps(): string[] } }).__world3d.lamps()), { timeout: 10_000 }).toContain(fire);
  await camTo(page, (await zOf(page, hammock)) - 110);
  await tapOn(page, page.locator(`[data-decor="${chair}"]`));
  await expect.poll(() => v3(page, 'mine'), { timeout: 15_000 }).toBe('sit');
  await tapOn(page, page.locator(`[data-sit="${hammock}"]`));
  await expect.poll(() => v3(page, 'mine'), { timeout: 15_000 }).toBe('lie');
});

test('the new gym: the speed bag punched; the guest lies on a yoga mat', async ({ page }) => {
  await open(page, DAY);
  // (the guest's phone open already: the pieces come to it live, as to any phone)
  const g = await page.context().newPage();
  await open(g, DAY, '&as=G');
  await page.bringToFront();
  const [bag, mat] = await putDown(page, DAY, [['gym', 'speed-bag', 6, 12], ['gym', 'yoga-mat', 4, 15]]);
  await expect.poll(() => model(page, bag), { timeout: 10_000 }).toBe('decor/speed-bag');
  await camTo(page, (await zOf(page, bag)) - 110);
  await tapOn(page, page.locator(`[data-decor="${bag}"]`));
  await expect.poll(() => v3(page, 'mine'), { timeout: 15_000 }).toBe('punch');
  // the guest, on its own phone: the mat lain on
  await g.bringToFront();
  await expect.poll(() => model(g, mat), { timeout: 10_000 }).toBe('decor/yoga-mat');
  await camTo(g, (await zOf(g, mat)) - 110);
  await tapOn(g, g.locator(`[data-decor="${mat}"]`));
  await expect.poll(() => v3(g, 'mine'), { timeout: 15_000 }).toBe('lie');
});
