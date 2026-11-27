// /editor asks before a field with plants is deleted or made smaller (the user, 2026-11-26: deleting fields had
// silently left 48 ripe plants off any field): how many plants, how many ripe, that they stay off the field (the shop's
// 苗に戻す takes them back); やめる keeps the field, 消す / 小さくする does it. On a desktop (Delete, the inspector's
// size) and an iPhone 15 (taps on the card's 削除). On `?demo`: a 2 × 2 field and its four plants as the demo's events
// (farm rows unsent, as farm.spec.ts seeds them), the page's clock past the first two's ripe time.
import { expect, test, type Page } from './fixtures.ts';

const D = '2026-11-04';
type Seed = [type: string, data: object, who: 'A' | 'B' | 'G', hm?: string];
const P = (i: number, j: number) => `fd:field-A.${i}.${j}`;
const plants = (ps: string[]) => ps.map((p) => ({ o: 'plant', p, c: 'tomato', src: 'start' }));
const SEEDS: Seed[] = [
  ['decor', { sc: 'o', id: 'field-A', at: 1.79e12, k: 'field', x: 10, z: 17, f: 0, s: 'f-2x2' }, 'A'],
  ['tally', { date: D, counts: { 'fish:koi': 1 } }, 'A'], ['sell', { species: 'fish:koi', n: 1, v: 200 }, 'A'], ['buy_starts', { crop: 'tomato', n: 4, v: 56 }, 'A'],
  // the front row ripe at 11:30, the back row at 11:50
  ['farm', { ops: plants([P(0, 0), P(1, 0)]) }, 'A', '05:30'],
  ['farm', { ops: plants([P(0, 1), P(1, 1)]) }, 'A', '05:50']
];

type E = { tileScreen(c: number, r: number): [number, number]; layout(): { objects: Map<string, { s?: string }> }; apply(ops: object[]): number };
const field = (page: Page) => page.evaluate(() => (window as unknown as { __editor: E }).__editor.layout().objects.get('field-A')?.s ?? null);
const tile = (page: Page) => page.evaluate(() => (window as unknown as { __editor: E }).__editor.tileScreen(10, 17));

/** The editor at 11:40 on D (the clock from 06:00: seeds at 05:xx keep their times, as farm.spec.ts's at6). */
async function open(page: Page) {
  await page.addInitScript(([day, list]) => {
    if (localStorage.getItem('island-demo.events')) return;
    const rows = list.map(([type, data, person, hm], i) => {
      const at = Date.parse(`${day}T${hm ?? '00:00'}:00+09:00`) + i;
      return { id: `seed-${i}`, type, data, queuedAt: at, tries: 0, nextAt: 0, ...(type === 'farm' ? {} : { ackedAt: at }), person };
    });
    localStorage.setItem('island-demo.events', JSON.stringify({ day, events: rows }));
  }, [D, SEEDS] as const);
  await page.clock.install({ time: new Date(`${D}T06:00:00+09:00`) });
  await page.goto('editor/?demo&preview=0');
  await page.waitForFunction(() => (window as unknown as { __editor?: unknown }).__editor);
  await page.clock.fastForward('05:40:00');
  await expect.poll(() => field(page)).toBe('f-2x2');
}
const ask = (page: Page) => page.locator('[data-field-ask]');

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('a field with plants: made smaller or deleted only once asked, with its plants and ripe ones counted', async ({ page }) => {
    await open(page);
    await page.mouse.click(...(await tile(page)));
    await expect(page.locator('[data-field-plants]')).toHaveText('この畑には 4株あります。');
    // 横 2 → 1: the right column's two (one ripe) would be left off it; やめる keeps it
    await page.locator('[data-field-w]').fill('1');
    await page.locator('[data-field-w]').press('Enter');
    await expect(ask(page)).toContainText('小さくすると 2株が畑の外に残ります（熟した株 1）。');
    await page.locator('[data-field-ask-no]').click();
    await expect(ask(page)).toBeHidden();
    expect(await field(page)).toBe('f-2x2');
    // 横 3: nothing left off, no ask
    await page.locator('[data-field-w]').fill('3');
    await page.locator('[data-field-w]').press('Enter');
    await expect.poll(() => field(page)).toBe('f-3x2');
    await expect(ask(page)).toBeHidden();
    // Delete: asked, then gone
    await page.mouse.click(...(await tile(page)));
    await page.keyboard.press('Delete');
    await expect(ask(page)).toContainText('この畑には 4株あります（熟した株 2）。消すと株は畑の外に残ります。');
    await page.locator('[data-field-ask-yes]').click();
    await expect.poll(() => field(page)).toBeNull();
  });
});

test.describe('desktop, the other phone editing meanwhile', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('an edit landing while the sheet asks stays: 消す deletes only the field, ⌘Z brings back only the field', async ({ page }) => {
    await open(page);
    const has = (id: string) => page.evaluate((id) => (window as unknown as { __editor: E }).__editor.layout().objects.has(id), id);
    await page.mouse.click(...(await tile(page)));
    await page.keyboard.press('Delete');
    await expect(ask(page)).toBeVisible();
    // a tree put down meanwhile (the partner's もようがえ; a layout made when the sheet opened would take it away again)
    expect(await page.evaluate(() => (window as unknown as { __editor: E }).__editor.apply([{ sc: 'o', id: 'oak-t1', k: 'oak', x: 14, z: 24, f: 0 }]))).toBe(1);
    await page.locator('[data-field-ask-yes]').click();
    await expect.poll(() => field(page)).toBeNull();
    expect(await has('oak-t1')).toBe(true);
    await page.keyboard.press('ControlOrMeta+z');
    await expect.poll(() => field(page)).toBe('f-2x2');
    expect(await has('oak-t1')).toBe(true);
  });
  test('やめる on a smaller size puts the field’s size back in the box', async ({ page }) => {
    await open(page);
    await page.mouse.click(...(await tile(page)));
    await page.locator('[data-field-w]').fill('1');
    await page.locator('[data-field-w]').press('Enter');
    await expect(ask(page)).toBeVisible();
    await page.locator('[data-field-ask-no]').click();
    await expect(ask(page)).toBeHidden();
    await expect(page.locator('[data-field-w]')).toHaveValue('2');
  });
});

test.describe('iPhone 15', () => {
  test.use({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });
  test('the card’s 削除 on a field with plants asks first: やめる keeps it, 消す deletes it', async ({ page }) => {
    await open(page);
    await expect(page.locator('[data-editor][data-layout="phone"]')).toBeVisible();
    await page.touchscreen.tap(...(await tile(page)));
    await page.locator('[data-card] [data-delete]').tap();
    await expect(ask(page)).toContainText('この畑には 4株あります（熟した株 2）。消すと株は畑の外に残ります。');
    await page.locator('[data-field-ask-no]').tap();
    await expect(ask(page)).toBeHidden();
    expect(await field(page)).toBe('f-2x2');
    await page.locator('[data-card] [data-delete]').tap();
    await page.locator('[data-field-ask-yes]').tap();
    await expect.poll(() => field(page)).toBeNull();
  });
});
