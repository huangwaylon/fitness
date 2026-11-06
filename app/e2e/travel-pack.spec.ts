// りょこう's packing list (docs/travel.md "Packing list (relay)", components/travel/PackList.svelte): a trip's もちもの
// in the trips' sheet, over the demo's record: my ticks and counts, the chips of who has packed it, ✎ (add, rename,
// 🗑 with とりけす, a category's NH confirm), リセット (mine only), the guest's own only, two tabs in step (the demo's tabs
// share the record's rows through localStorage, as phones share the record), and 「じゅんび OK！」 once.
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';
import { gotoTrip, openTrip } from './travelMap.ts';

test.use({ viewport: { width: 393, height: 852 } });
const DATE = '2026-11-04T12:00';

async function open(ctx: BrowserContext, as: 'A' | 'B' | 'G' = 'A', trip = 'okinawa') {
  const page = await ctx.newPage();
  await gotoTrip(page, trip, 'pack', as === 'A' ? '' : `as=${as}`);
  await expect(page.locator('[data-pack-item]').first()).toBeVisible();
  return page;
}
/** A reload: the island again, the same trip's もちもの. */
async function reopen(page: Page, trip = 'okinawa') {
  await page.reload();
  await openTrip(page, trip, 'pack');
}
const item = (p: Page, id: string) => p.locator(`[data-pack-item="${id}"]`);
const tick = (p: Page, id: string) => item(p, id).getByRole('checkbox');
const mine = (p: Page) => p.locator('[data-pack-mine]');
const chip = (p: Page, id: string, who: 'A' | 'B' | 'G') => item(p, id).locator(`[data-chip="${who}"]`);
const cat = (p: Page, id: string) => p.locator(`[data-pack-cat="${id}"]`);
const edit = (p: Page) => p.locator('[data-pack-edit]').click();
const banner = (p: Page) => p.getByRole('button', { name: 'とりけす' });

test('my ticks: the bubble, my counts, and the others’ chips', async ({ context }) => {
  const a = await open(context);
  // the demo: A packed the ID; うめ the ID, the licence and her sunscreen
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '1');
  await expect(mine(a)).toHaveAttribute('data-pack-total', '36');
  await expect(tick(a, 'ok-0-0')).toHaveAttribute('aria-checked', 'true');
  await expect(chip(a, 'ok-0-1', 'B')).toHaveAttribute('data-on', 'true');
  await expect(chip(a, 'ok-0-1', 'A')).not.toHaveAttribute('data-on');
  await expect(chip(a, 'ok-0-1', 'G')).toHaveCount(0);

  await tick(a, 'ok-0-1').click();
  await expect(tick(a, 'ok-0-1')).toHaveAttribute('aria-checked', 'true');
  await expect(chip(a, 'ok-0-1', 'A')).toHaveAttribute('data-on', 'true');
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '2');
  await expect(cat(a, 'ok-0').locator('[data-pack-cat-mine]')).toHaveAttribute('data-pack-cat-mine', '2');
  await tick(a, 'ok-0-1').click();
  await expect(tick(a, 'ok-0-1')).toHaveAttribute('aria-checked', 'false');
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '1');
  // after a reload, as left
  await reopen(a);
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '1');
});

test('✎: add with enter, rename, 🗑 with とりけす, a category asks first', async ({ context }) => {
  const a = await open(context);
  await edit(a);
  const field = cat(a, 'ok-2').getByRole('textbox', { name: '海遊びに ついか' });
  await field.fill('ビーチサンダル');
  await field.press('Enter');
  const added = cat(a, 'ok-2').locator('[data-pack-item]').last();
  await expect(added).toContainText('ビーチサンダル');
  await expect(field).toHaveValue('');
  await expect(mine(a)).toHaveAttribute('data-pack-total', '37');

  // rename: a tap on the name, a new one, enter
  await added.locator('[data-pack-rename]').click();
  const rn = added.getByRole('textbox');
  await rn.fill('ぎょさん');
  await rn.press('Enter');
  await expect(added).toContainText('ぎょさん');

  // 🗑: gone at once, とりけす brings it back
  await item(a, 'ok-0-2').locator('[data-pack-del]').click();
  await expect(item(a, 'ok-0-2')).toHaveCount(0);
  await banner(a).click();
  await expect(item(a, 'ok-0-2')).toHaveCount(1);

  // a category: 「…を けしますか？」, いいえ keeps it, はい takes it with its items (とりけす too)
  await cat(a, 'ok-1').locator('[data-pack-del="ok-1"]').click();
  await expect(a.getByText('「服装」を けしますか？')).toBeVisible();
  await a.locator('[data-pack-no]').click();
  await expect(cat(a, 'ok-1')).toHaveCount(1);
  await cat(a, 'ok-1').locator('[data-pack-del="ok-1"]').click();
  await a.locator('[data-pack-yes]').click();
  await expect(cat(a, 'ok-1')).toHaveCount(0);
  await expect(mine(a)).toHaveAttribute('data-pack-total', '31');
  await banner(a).click();
  await expect(cat(a, 'ok-1')).toHaveCount(1);

  // ↓ moves a category below the next
  await cat(a, 'ok-0').locator('[data-pack-down="ok-0"]').click();
  await expect(a.locator('[data-pack-cat]').nth(1)).toHaveAttribute('data-pack-cat', 'ok-0');

  // a new category, then an item in it
  const nc = a.locator('[data-pack-addcat]').getByRole('textbox');
  await nc.fill('おやつ');
  await nc.press('Enter');
  const last = a.locator('[data-pack-cat]').last();
  await expect(last).toContainText('おやつ');
  await last.getByRole('textbox').fill('ちんすこう');
  await last.getByRole('textbox').press('Enter');
  await expect(last.locator('[data-pack-item]')).toContainText('ちんすこう');
});

test('リセット: only my ticks, after the NH confirm', async ({ context }) => {
  const a = await open(context);
  await tick(a, 'ok-1-0').click();
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '2');
  await a.locator('[data-pack-reset]').click();
  await expect(a.locator('[data-pack-ask="reset"]')).toBeVisible();
  await a.locator('[data-pack-yes]').click();
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '0');
  await expect(tick(a, 'ok-0-0')).toHaveAttribute('aria-checked', 'false');
  // うめ's stay
  await expect(chip(a, 'ok-0-0', 'B')).toHaveAttribute('data-on', 'true');
  await expect(a.locator('[data-pack-reset]')).toHaveCount(0);
});

test('the guest ticks and adds, and changes only what it added', async ({ context }) => {
  const g = await open(context, 'G');
  await expect(mine(g)).toHaveAttribute('data-pack-mine', '0');
  await tick(g, 'ok-0-3').click();
  await expect(chip(g, 'ok-0-3', 'G')).toHaveAttribute('data-on', 'true');
  await edit(g);
  await expect(g.locator('[data-pack-editbar]')).toContainText('じぶんで ついかした ものだけ');
  // a seed item and category, and うめ's item: no ✎ controls
  await expect(item(g, 'ok-0-0').locator('[data-pack-rename], [data-pack-del]')).toHaveCount(0);
  await expect(item(g, '_demob001').locator('[data-pack-rename], [data-pack-del]')).toHaveCount(0);
  await expect(cat(g, 'ok-0').locator('[data-pack-del="ok-0"]')).toHaveCount(0);
  // its own: added, renamed, removed
  const field = cat(g, 'ok-0').getByRole('textbox', { name: /ついか$/ });
  await field.fill('おみやげ リスト');
  await field.press('Enter');
  const own = cat(g, 'ok-0').locator('[data-pack-item]').last();
  await expect(own).toContainText('おみやげ リスト');
  await own.locator('[data-pack-rename]').click();
  await own.getByRole('textbox').fill('おみやげ');
  await own.getByRole('textbox').press('Enter');
  await expect(own).toContainText('おみやげ');
  await own.locator('[data-pack-del]').click();
  await expect(cat(g, 'ok-0').getByText('おみやげ')).toHaveCount(0);
});

test('two tabs: a tick and an item on one are on the other at once', async ({ context }) => {
  const a = await open(context, 'A');
  const b = await open(context, 'B');
  await a.bringToFront();
  await tick(a, 'ok-0-2').click();
  await expect(chip(b, 'ok-0-2', 'A')).toHaveAttribute('data-on', 'true');
  await expect(tick(b, 'ok-0-2')).toHaveAttribute('aria-checked', 'false');
  await b.bringToFront();
  await edit(b);
  const field = cat(b, 'ok-3').getByRole('textbox', { name: /ついか$/ });
  await field.fill('うちわ');
  await field.press('Enter');
  await expect(cat(a, 'ok-3')).toContainText('うちわ');
});

test('all packed: Orville’s 「じゅんび OK！」, celebrated once', async ({ context }) => {
  const a = await open(context, 'A', 'seattle');
  const open1 = a.locator('[data-pack-item] [role=checkbox][aria-checked=false]');
  const n = await open1.count();
  for (let i = 0; i < n; i++) await open1.first().click();
  await expect(a.locator('[data-pack-stamp]')).toHaveAttribute('data-pack-stamp', 'cheer');
  await expect(a.getByText('ばっちり！ いい たびを！')).toBeVisible();
  // again (a reload): the stamp, no celebration
  await reopen(a, 'seattle');
  await expect(a.locator('[data-pack-stamp]')).toHaveAttribute('data-pack-stamp', 'on');
  await expect(a.getByText('ばっちり！ いい たびを！')).toHaveCount(0);
  // one unticked: no stamp
  await tick(a, 'se-0-0').click();
  await expect(a.locator('[data-pack-stamp]')).toHaveCount(0);
});

test('せってい → りょこう: km / mi, kept on this phone', async ({ page }) => {
  await page.goto(`?demo&date=${DATE}`);
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'settings');
  const sec = page.locator('dialog[open] [data-travel-section]');
  await expect(sec.locator('[data-units="km"]')).toHaveAttribute('aria-pressed', 'true');
  await sec.locator('[data-units="mi"]').click();
  await expect(sec.locator('[data-units="mi"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('island.travel.units'))).toBe('mi');
  if (process.env.SHOTS) await sec.screenshot({ path: `${process.env.SHOTS}/settings-units.png` });
  await page.reload();
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'settings');
  await expect(page.locator('dialog[open] [data-travel-section] [data-units="mi"]')).toHaveAttribute('aria-pressed', 'true');
});
