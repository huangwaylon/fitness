// The 畑 sheet (docs/farming.md "Playing"): what my field holds and its batch writes. On `?demo`: the demo's events in
// localStorage (a field put down in the editor, catches sold, the starts bought, the plants, as their writes have them).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp, quiet } from './island.ts';

test.use({ viewport: { width: 393, height: 852 } });
type Seed = [type: string, data: object, who: 'A' | 'B' | 'G'];
/** The demo's events of a day (as the writes keep them). */
const seed = (page: Page, day: string, events: Seed[]) =>
  page.addInitScript(([day, list]) => {
    if (localStorage.getItem('island-demo.events')) return;
    const at = Date.parse(`${day}T09:00:00+09:00`);
    const rows = list.map(([type, data, person], i) => ({ id: `seed-${i}`, type, data, queuedAt: at + i, tries: 0, nextAt: 0, ackedAt: at + i, person }));
    localStorage.setItem('island-demo.events', JSON.stringify({ day, events: rows }));
  }, [day, events] as const);
const D = '2026-11-04';
/** ウェイ's field, 10 × 4 (40 plots, the cap). */
const FIELD: Seed = ['decor', { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 10, z: 17, f: 0, s: 'a-10x4' }, 'A'];
const plots = Array.from({ length: 40 }, (_, k) => `fd:field-A.${k % 10}.${Math.floor(k / 10)}`);
/** 600 かいがら (three koi sold) and 40 tomato starts (40 × 14). */
const POCKET: Seed[] = [['tally', { date: D, counts: { 'fish:koi': 3 } }, 'A'], ['sell', { species: 'fish:koi', n: 3, v: 600 }, 'A'], ['buy_starts', { crop: 'tomato', n: 40, v: 560 }, 'A']];

/** The 畑 sheet from the farm control at the bottom left (a menu's はたけ, if it has one). */
async function openSheet(page: Page) {
  await page.locator('[data-farm-open]').click();
  const item = page.locator('[data-farm-field]');
  await expect(page.locator('[data-farm-sheet], [data-farm-field]').first()).toBeVisible();
  if (await item.isVisible()) await item.click();
  await expect(page.locator('[data-farm-sheet]')).toBeVisible();
}

test('a full field: 40/40 and 「空きはありません」, never 「自分の畑がありません」', async ({ page }) => {
  await seed(page, D, [FIELD, ...POCKET, ['farm', { d: D, ops: plots.map((p) => ({ o: 'plant', p, c: 'tomato', src: 'start' })) }, 'A']]);
  await page.goto(`?demo&date=${D}T12:00`);
  await islandUp(page);
  await quiet(page);
  await openSheet(page);
  await expect(page.locator('[data-farm-count]')).toHaveText('40/40株');
  await expect(page.locator('[data-farm-empty]')).toHaveText('空きはありません');
});

const D3 = '2026-11-07';
/** The farm ops this page sent (not the seeds'). */
const farmRows = (page: Page) => page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.events') ?? '{"events":[]}').events as { id: string; type: string; data: { ops: { o: string; p: string; n?: number }[] } }[])
  .filter((e) => e.type === 'farm' && !e.id.startsWith('seed-')).flatMap((e) => e.data.ops));
const planted = (ps: string[], d = D): Seed => ['farm', { d, ops: ps.map((p) => ({ o: 'plant', p, c: 'tomato', src: 'start' })) }, 'A'];
async function up(page: Page, events: Seed[], day = D3) {
  await seed(page, day, events);
  await page.goto(`?demo&date=${day}T12:00&weather=clear`);
  await islandUp(page);
  await quiet(page);
  await openSheet(page);
}

test('収穫: every ripe plant of mine in one event, its 取り消す gives them back', async ({ page }) => {
  await up(page, [FIELD, ...POCKET, planted(plots.slice(0, 5))]);
  await expect(page.locator('[data-farm-today]')).toHaveText('収穫できる 5株（5個・90かいがら）');
  await page.locator('[data-farm-harvest]').click();
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('5個を収穫しました');
  await expect(page.locator('[data-farm-today]')).toHaveText('次の収穫まであと3日');
  // the vegetables in my pocket: 植える offers them
  await expect(page.locator('[data-farm-seed="crop:tomato"] .n')).toHaveText('5');
  await page.getByRole('button', { name: '取り消す' }).click();
  await expect(page.locator('[data-farm-harvest]')).toHaveText('実ったものを収穫（5株）');
  await expect(page.locator('[data-farm-seed="crop:tomato"]')).toHaveCount(0);
  await page.locator('[data-farm-harvest]').click();
  await expect.poll(() => farmRows(page), { timeout: 15_000 }).toEqual(plots.slice(0, 5).map((p) => ({ o: 'harvest', p, n: 1 })));
});

test('水やり: every plant whose watering today counts and isn’t done, one change of the shared day', async ({ page }) => {
  // (and three ripe today: their watering can't change their yield)
  await up(page, [FIELD, ...POCKET, planted(plots.slice(0, 12), '2026-11-06'), planted(plots.slice(12, 15))]);
  await expect(page.locator('[data-farm-water]')).toHaveText('水やり（12株）');
  await page.locator('[data-farm-water]').click();
  await expect(page.locator('[data-farm-water]')).toHaveText('水やり済み');
  await expect(page.locator('[data-farm-water]')).toHaveAttribute('aria-disabled', 'true');
  const watered = await page.evaluate(() => (JSON.parse(localStorage.getItem('island-demo.world.A') ?? '{}').events as { kind: string; op?: string; id?: string }[]).filter((e) => e.kind === 'world' && e.op === 'watered').map((e) => e.id));
  expect(watered.sort()).toEqual(plots.slice(0, 12).sort());
});

test('植える: the held crop on my empty plots as the map reads them (the back row first), up to what I hold', async ({ page }) => {
  await up(page, [FIELD, ...POCKET, planted(plots.slice(0, 2))], D);
  await expect(page.locator('[data-farm-seed="start:tomato"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-farm-plant-all]')).toHaveText('トマトの苗を植える（38区画）');
  await page.locator('[data-farm-plant-all]').click();
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('トマトの苗を38区画に植えました');
  await expect(page.locator('[data-farm-count]')).toHaveText('40/40株');
  await expect(page.locator('[data-farm-empty]')).toHaveText('空きはありません');
  const order = [...plots.slice(30), ...plots.slice(20, 30), ...plots.slice(10, 20), ...plots.slice(2, 10)];
  await expect.poll(() => farmRows(page), { timeout: 15_000 }).toEqual(order.map((p) => ({ o: 'plant', p, c: 'tomato', src: 'start' })));
});

test('the map: a cell a plot, a tap selects it; its row digs (取り消す puts it back) or plants', async ({ page }) => {
  await up(page, [FIELD, ...POCKET, planted(plots.slice(0, 3))], D);
  await expect(page.locator('[data-farm-cell]')).toHaveCount(40);
  const first = page.locator(`[data-farm-cell="${plots[0]}"]`);
  await expect(first).toHaveAttribute('aria-label', 'トマト・あと3日・見込み1〜3個');
  await first.click();
  await expect(page.locator('[data-farm-selected] .what')).toHaveText('トマト・あと3日・見込み1〜3個');
  await page.locator('[data-farm-act="dig"]').click();
  await expect(page.locator('.banner[role="status"] .txt')).toHaveText('トマトを掘り起こしました');
  await expect(page.locator('[data-farm-count]')).toHaveText('2/40株');
  await expect(first).toHaveAttribute('aria-label', '空き区画');
  await page.getByRole('button', { name: '取り消す' }).click();
  await expect(page.locator('[data-farm-count]')).toHaveText('3/40株');
  await expect(first.locator('img')).toHaveCount(1);
  // an empty plot: 植える with the held start
  await page.locator(`[data-farm-cell="${plots[39]}"]`).click();
  await page.locator('[data-farm-act="plant"]').click();
  await expect(page.locator('[data-farm-count]')).toHaveText('4/40株');
  await expect.poll(() => farmRows(page), { timeout: 15_000 }).toEqual([{ o: 'plant', p: plots[39], c: 'tomato', src: 'start' }]);
});

test('after a harvest with no starts left: the vegetables offered, never picked for me; the map as the island shows the field', async ({ page }) => {
  const five: Seed[] = [['tally', { date: D, counts: { 'fish:koi': 1 } }, 'A'], ['sell', { species: 'fish:koi', n: 1, v: 200 }, 'A'], ['buy_starts', { crop: 'tomato', n: 5, v: 70 }, 'A']];
  await up(page, [FIELD, ...five, planted(plots.slice(0, 5))]);
  // the field's front row (row 0, nearest the beach) at the map's bottom, its back row at the top, as on the island
  await expect(page.locator('[data-farm-cell]').first()).toHaveAttribute('data-farm-cell', plots[30]);
  await expect(page.locator('[data-farm-cell]').last()).toHaveAttribute('data-farm-cell', plots[9]);
  await page.locator('[data-farm-harvest]').click();
  await expect(page.locator('[data-farm-empty]')).toHaveText('苗がありません。タヌキ商店で買えます（野菜も植えられます）');
  await expect(page.locator('[data-farm-seed="crop:tomato"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-farm-plant-all]')).toHaveCount(0);
  await page.locator('[data-farm-seed="crop:tomato"]').click();
  await expect(page.locator('[data-farm-plant-all]')).toHaveText('トマトを植える（5区画）');
});
