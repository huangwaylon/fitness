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
