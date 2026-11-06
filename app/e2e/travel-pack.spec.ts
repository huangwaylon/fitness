// りょこう's packing list (docs/travel.md "Packing list (relay)", components/travel/PackList.svelte) in the quiet kit:
// a quiet trip's 持ち物 (NZ) in the trips' sheet, over the demo's record: my ticks and counts, who has packed it, 編集
// (a row's or a category's actions: 名前を変更 · 上へ · 下へ · 削除; 「＋ 追加」 under each category; a new
// category; 削除 with とりけす, a category's asked first), リセット inside 編集 (mine only, asked first, とりけす), the
// guest's own only, two tabs in step (the demo's tabs share the record's rows through localStorage, as phones share
// the record), and a trip that's over (a quiet count). SHOTS=<dir>: screenshots of the list.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { BASE, islandQuery } from './island.ts';
import { shot } from './shots.ts';
import { openTrip } from './trips.ts';
import { nz } from '../src/lib/travel/trips/nz.ts';

test.use({ viewport: { width: 393, height: 852 } });
/** Before the trip (Feb 11), and after it. */
const BEFORE = '2027-01-20T12:00', AFTER = '2027-03-01T12:00';
/** The guide's items and the demo's one of うめ's (_demob002, in 書類). */
const TOTAL = nz.packing.cats.reduce((n, c) => n + c.items.length, 0) + 1;

async function open(ctx: BrowserContext, as: 'A' | 'B' | 'G' = 'A', date = BEFORE) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${islandQuery(`demo&date=${date}${as === 'A' ? '' : `&as=${as}`}`)}`);
  await openTrip(page, 'nz', 'pack');
  await expect(page.locator('[data-pack-item]').first()).toBeVisible();
  return page;
}
/** A reload: the island again, the trip's 持ち物. */
async function reopen(page: Page) {
  await page.reload();
  await openTrip(page, 'nz', 'pack');
}
const item = (p: Page, id: string) => p.locator(`[data-pack-item="${id}"]`);
const tick = (p: Page, id: string) => item(p, id).getByRole('checkbox');
const mine = (p: Page) => p.locator('[data-pack-mine]');
/** A person's name on an item's 「… ✓」 (there only once they've packed it). */
const chip = (p: Page, id: string, who: 'A' | 'B' | 'G') => item(p, id).locator(`[data-chip="${who}"]`);
const cat = (p: Page, id: string) => p.locator(`[data-pack-cat="${id}"]`);
const edit = (p: Page) => p.locator('[data-pack-edit]').click();
const banner = (p: Page) => p.getByRole('button', { name: 'とりけす' });
/** A row's (or a category's) actions, then one of them. */
async function act(p: Page, id: string, action: 'rename' | 'up' | 'down' | 'del') {
  await p.locator(`[data-pack-acts="${id}"]`).click();
  await p.locator(`dialog[open] [data-action="${action}"]`).click();
}
/** The form sheet's field: typed, then 保存 (the return key). */
async function type(p: Page, text: string) {
  const f = p.locator('dialog[open] [data-pack-field]');
  await f.fill(text);
  await f.press('Enter');
  await expect(f).toHaveCount(0);
}

test('my ticks: the circle, my counts, and who has packed it', async ({ context }) => {
  const a = await open(context);
  // the demo: A packed the passports; うめ the passports, the NZeTA and her sunscreen
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '1');
  await expect(mine(a)).toHaveAttribute('data-pack-total', String(TOTAL));
  await expect(tick(a, 'nz-0-0')).toHaveAttribute('aria-checked', 'true');
  await expect(chip(a, 'nz-0-1', 'B')).toBeVisible();
  await expect(chip(a, 'nz-0-1', 'A')).toHaveCount(0);
  // nobody yet: no names
  await expect(item(a, 'nz-0-2').locator('.by')).toHaveCount(0);
  await expect(tick(a, 'nz-0-0')).toHaveAccessibleName(/ウェイ、うめが準備済み/);
  // the names on one line, right of the text
  const line = (await item(a, 'nz-0-0').locator('.by').boundingBox())!;
  expect(line.height).toBeLessThan(22);
  await shot(a, 'pack-A-day');

  await tick(a, 'nz-0-1').click();
  await expect(tick(a, 'nz-0-1')).toHaveAttribute('aria-checked', 'true');
  await expect(chip(a, 'nz-0-1', 'A')).toBeVisible();
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '2');
  await expect(cat(a, 'nz-0').locator('[data-pack-cat-mine]')).toHaveAttribute('data-pack-cat-mine', '2');
  await tick(a, 'nz-0-1').click();
  await expect(tick(a, 'nz-0-1')).toHaveAttribute('aria-checked', 'false');
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '1');
  // after a reload, as left
  await reopen(a);
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '1');
});

test('編集: no buttons on the rows; ＋ 追加, 名前を変更, 削除 with とりけす, a category asks first, 下へ, a new category', async ({ context }) => {
  const a = await open(context);
  await edit(a);
  await expect(a.locator('[data-pack-editbar]')).toContainText('並べかえ');
  // a row is one tap target: no per-row buttons, and no ticks while editing
  await expect(item(a, 'nz-0-0').locator('button')).toHaveCount(1);
  await expect(a.getByRole('checkbox')).toHaveCount(0);

  await cat(a, 'nz-2').locator('[data-pack-add]').click();
  await type(a, 'ビーチサンダル');
  const added = cat(a, 'nz-2').locator('[data-pack-item]').last();
  await expect(added).toContainText('ビーチサンダル');
  await expect(mine(a)).toHaveAttribute('data-pack-total', String(TOTAL + 1));

  // its actions: the caption names it; 名前を変更 opens the form with its name
  await added.locator('[data-pack-acts]').click();
  await expect(a.locator('dialog[open] .cap')).toHaveText('ビーチサンダル');
  await shot(a, 'pack-A-actions');
  await a.locator('dialog[open] [data-action="rename"]').click();
  await expect(a.locator('dialog[open] [data-pack-field]')).toHaveValue('ビーチサンダル');
  await type(a, 'ジャンダル');
  await expect(added).toContainText('ジャンダル');

  // 削除: gone at once, とりけす brings it back (the banner one line: 「削除しました：…」)
  await act(a, 'nz-0-2', 'del');
  await expect(item(a, 'nz-0-2')).toHaveCount(0);
  await expect(a.getByText(/^削除しました：/)).toBeVisible();
  await banner(a).click();
  await expect(item(a, 'nz-0-2')).toHaveCount(1);

  // a category: asked first; キャンセル keeps it, 削除 takes it with its items (とりけす too)
  await act(a, 'nz-1', 'del');
  await expect(a.locator('dialog[open] .cap')).toContainText('「服装」を削除しますか？');
  await a.locator('dialog[open] [data-q-cancel]').click();
  await expect(cat(a, 'nz-1')).toHaveCount(1);
  await act(a, 'nz-1', 'del');
  await a.locator('dialog[open] [data-action="yes"]').click();
  await expect(cat(a, 'nz-1')).toHaveCount(0);
  await expect(mine(a)).toHaveAttribute('data-pack-total', String(TOTAL + 1 - nz.packing.cats[1].items.length));
  await banner(a).click();
  await expect(cat(a, 'nz-1')).toHaveCount(1);

  // 下へ moves a category below the next; 上へ on the first can't (it boops)
  await act(a, 'nz-0', 'down');
  await expect(a.locator('[data-pack-cat]').nth(1)).toHaveAttribute('data-pack-cat', 'nz-0');
  await a.locator('[data-pack-acts="nz-1"]').click();
  await expect(a.locator('dialog[open] [data-action="up"]')).toHaveAttribute('aria-disabled', 'true');
  await a.keyboard.press('Escape');

  // a new category, then an item in it
  await a.locator('[data-pack-addcat]').click();
  await type(a, 'おやつ');
  const last = a.locator('[data-pack-cat]').last();
  await expect(last).toContainText('おやつ');
  await last.locator('[data-pack-add]').click();
  await type(a, 'ちんすこう');
  await expect(last.locator('[data-pack-item]')).toContainText('ちんすこう');
  // 完了: the ticks again
  await edit(a);
  await expect(tick(a, 'nz-0-0')).toBeVisible();
});

test('リセット (inside 編集): only my ticks, asked first; とりけす brings them back', async ({ context }) => {
  const a = await open(context);
  await tick(a, 'nz-1-0').click();
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '2');
  await edit(a);
  const reset = async () => {
    await a.locator('[data-pack-reset]').click();
    await expect(a.locator('dialog[open] .cap')).toContainText('自分のチェックを');
    await a.locator('dialog[open] [data-action="yes"]').click();
    await expect(mine(a)).toHaveAttribute('data-pack-mine', '0');
  };
  await reset();
  await shot(a, 'pack-A-undo-reset');
  await banner(a).click();
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '2');
  await reset();
  await expect(a.locator('[data-pack-reset]')).toHaveCount(0);
  await edit(a);
  await expect(tick(a, 'nz-0-0')).toHaveAttribute('aria-checked', 'false');
  // うめ's stay
  await expect(chip(a, 'nz-0-0', 'B')).toBeVisible();
  // past the banner (the pointer off it: a hovered banner holds): sent, and kept after a reload
  await a.mouse.move(200, 120);
  await expect(banner(a)).toHaveCount(0, { timeout: 10_000 });
  await reopen(a);
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '0');
});

test('the guest ticks and adds, and changes only what it added', async ({ context }) => {
  const g = await open(context, 'G');
  await expect(mine(g)).toHaveAttribute('data-pack-mine', '0');
  await tick(g, 'nz-0-3').click();
  await expect(chip(g, 'nz-0-3', 'G')).toBeVisible();
  await edit(g);
  await expect(g.locator('[data-pack-editbar]')).toContainText('自分で追加したものだけ');
  // a seed item and category, and うめ's item: shown, but no actions (a tap boops)
  for (const id of ['nz-0-0', '_demob002', 'nz-0']) await expect(g.locator(`[data-pack-acts="${id}"]`)).toHaveAttribute('aria-disabled', 'true');
  await g.locator('[data-pack-acts="nz-0-0"]').click();
  await expect(g.locator('dialog[open] [data-action]')).toHaveCount(0);
  // its own: added, renamed, removed
  await cat(g, 'nz-0').locator('[data-pack-add]').click();
  await type(g, 'おみやげリスト');
  const own = cat(g, 'nz-0').locator('[data-pack-item]').last();
  await expect(own).toContainText('おみやげリスト');
  const id = await own.getAttribute('data-pack-item');
  await act(g, id!, 'rename');
  await type(g, 'おみやげ');
  await expect(own).toContainText('おみやげ');
  await shot(g, 'pack-G-edit');
  await act(g, id!, 'del');
  await expect(cat(g, 'nz-0').getByText('おみやげ')).toHaveCount(0);
});

test('a trip that’s over: a quiet count, no bar; ticking still works', async ({ context }) => {
  const a = await open(context, 'A', AFTER);
  await expect(a.locator('[data-pack-past]')).toBeVisible();
  await expect(a.locator('[role=progressbar]')).toHaveCount(0);
  await tick(a, 'nz-0-1').click();
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '2');
  await shot(a, 'pack-A-past');
});

test('two tabs: a tick and an item on one are on the other at once', async ({ context }) => {
  const a = await open(context, 'A');
  const b = await open(context, 'B');
  await a.bringToFront();
  await tick(a, 'nz-0-2').click();
  await expect(chip(b, 'nz-0-2', 'A')).toBeVisible();
  await expect(tick(b, 'nz-0-2')).toHaveAttribute('aria-checked', 'false');
  await b.bringToFront();
  await edit(b);
  await cat(b, 'nz-3').locator('[data-pack-add]').click();
  await type(b, 'うちわ');
  await expect(cat(a, 'nz-3')).toContainText('うちわ');
});
