// りょこう's packing list (docs/travel.md "Packing list (relay)", components/travel/PackList.svelte): a trip's もちもの
// in the trips' sheet, over the demo's record: my ticks and counts, the line of who has packed it, ✎ (add, rename,
// 🗑 with とりけす, a category's NH confirm), リセット (mine only, with とりけす), the guest's own only, two tabs in step
// (the demo's tabs share the record's rows through localStorage, as phones share the record), 「じゅんび OK！」 once,
// and a trip that's over (a quiet count). SHOTS=<dir>: WebKit screenshots of the list.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { fromMenu } from './hud.ts';
import { BASE, islandQuery, islandUp } from './island.ts';
import { shot } from './shots.ts';
import { openTrip } from './trips.ts';

test.use({ viewport: { width: 393, height: 852 } });
const DATE = '2026-11-04T12:00';
/** NZ's days before it (Feb 11, still to come), and after it. Okinawa's and Seattle's lists are frozen (their classic
 *  guides: travel-classic.spec). */
const BEFORE = '2027-02-01T12:00';
const AFTER = '2027-03-01T12:00';

async function open(ctx: BrowserContext, as: 'A' | 'B' | 'G' = 'A', trip = 'nz', date = BEFORE) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${islandQuery(`demo&date=${date}${as === 'A' ? '' : `&as=${as}`}`)}`);
  await openTrip(page, trip, 'pack');
  await expect(page.locator('[data-pack-item]').first()).toBeVisible();
  return page;
}
/** A reload: the island again, the same trip's もちもの. */
async function reopen(page: Page, trip = 'nz') {
  await page.reload();
  await openTrip(page, trip, 'pack');
}
const item = (p: Page, id: string) => p.locator(`[data-pack-item="${id}"]`);
const tick = (p: Page, id: string) => item(p, id).getByRole('checkbox');
const mine = (p: Page) => p.locator('[data-pack-mine]');
/** A person's name on an item's 「✓ …」 line (there only once they've packed it). */
const chip = (p: Page, id: string, who: 'A' | 'B' | 'G') => item(p, id).locator(`[data-chip="${who}"]`);
const cat = (p: Page, id: string) => p.locator(`[data-pack-cat="${id}"]`);
const edit = (p: Page) => p.locator('[data-pack-edit]').click();
const banner = (p: Page) => p.getByRole('button', { name: 'とりけす' });

test('my ticks: the bubble, my counts, and who has packed it', async ({ context }) => {
  const a = await open(context);
  // the demo: A packed the ID; うめ the ID, the licence and her sunscreen
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '1');
  await expect(mine(a)).toHaveAttribute('data-pack-total', '30');
  await expect(tick(a, 'nz-0-0')).toHaveAttribute('aria-checked', 'true');
  await expect(chip(a, 'nz-0-1', 'B')).toBeVisible();
  await expect(chip(a, 'nz-0-1', 'A')).toHaveCount(0);
  await expect(chip(a, 'nz-0-1', 'G')).toHaveCount(0);
  // nobody yet: no line at all
  await expect(item(a, 'nz-0-2').locator('.by')).toHaveCount(0);
  // the line's names: one line, the checkbox's name says who
  await expect(tick(a, 'nz-0-0')).toHaveAccessibleName(/ウェイ、うめが じゅんびずみ/);
  const line = await item(a, 'nz-0-0').locator('.by').boundingBox();
  expect(line!.height).toBeLessThan(26);
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

test('✎: add with enter, rename, 🗑 with とりけす, a category asks first', async ({ context }) => {
  const a = await open(context);
  await edit(a);
  const field = cat(a, 'nz-2').getByRole('textbox', { name: '登山に ついか' });
  await field.fill('ビーチサンダル');
  await field.press('Enter');
  const added = cat(a, 'nz-2').locator('[data-pack-item]').last();
  await expect(added).toContainText('ビーチサンダル');
  await expect(field).toHaveValue('');
  await expect(mine(a)).toHaveAttribute('data-pack-total', '31');

  // rename: a tap on the name, a new one, enter
  await added.locator('[data-pack-rename]').click();
  const rn = added.getByRole('textbox');
  await rn.fill('ぎょさん');
  await rn.press('Enter');
  await expect(added).toContainText('ぎょさん');

  // 🗑: gone at once, とりけす brings it back (the banner one line: 「けしたよ：…」)
  await item(a, 'nz-0-2').locator('[data-pack-del]').click();
  await expect(item(a, 'nz-0-2')).toHaveCount(0);
  await expect(a.getByText(/^けしたよ：/)).toBeVisible();
  await shot(a, 'pack-A-undo-delete');
  await banner(a).click();
  await expect(item(a, 'nz-0-2')).toHaveCount(1);

  // a category: 「…を けしますか？」, いいえ keeps it, はい takes it with its items (とりけす too)
  await cat(a, 'nz-1').locator('[data-pack-del="nz-1"]').click();
  await expect(a.getByText('「服装」を けしますか？')).toBeVisible();
  await a.locator('[data-pack-no]').click();
  await expect(cat(a, 'nz-1')).toHaveCount(1);
  await cat(a, 'nz-1').locator('[data-pack-del="nz-1"]').click();
  await a.locator('[data-pack-yes]').click();
  await expect(cat(a, 'nz-1')).toHaveCount(0);
  await expect(mine(a)).toHaveAttribute('data-pack-total', '25');
  await banner(a).click();
  await expect(cat(a, 'nz-1')).toHaveCount(1);

  // ↓ moves a category below the next
  await cat(a, 'nz-0').locator('[data-pack-down="nz-0"]').click();
  await expect(a.locator('[data-pack-cat]').nth(1)).toHaveAttribute('data-pack-cat', 'nz-0');

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

test('リセット: only my ticks, after the NH confirm; とりけす brings them back', async ({ context }) => {
  const a = await open(context);
  await tick(a, 'nz-1-0').click();
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '2');
  const reset = async () => {
    await a.locator('[data-pack-reset]').click();
    await expect(a.locator('[data-pack-ask="reset"]')).toBeVisible();
    await a.locator('[data-pack-yes]').click();
    await expect(mine(a)).toHaveAttribute('data-pack-mine', '0');
  };
  await reset();
  await shot(a, 'pack-A-undo-reset');
  await banner(a).click();
  await expect(mine(a)).toHaveAttribute('data-pack-mine', '2');
  await expect(tick(a, 'nz-1-0')).toHaveAttribute('aria-checked', 'true');

  await reset();
  await expect(tick(a, 'nz-0-0')).toHaveAttribute('aria-checked', 'false');
  // うめ's stay
  await expect(chip(a, 'nz-0-0', 'B')).toBeVisible();
  await expect(a.locator('[data-pack-reset]')).toHaveCount(0);
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
  await shot(g, 'pack-G-day');
  await edit(g);
  await expect(g.locator('[data-pack-editbar]')).toContainText('じぶんで ついかした ものだけ');
  // a seed item and category, and うめ's item: no ✎ controls
  await expect(item(g, 'nz-0-0').locator('[data-pack-rename], [data-pack-del]')).toHaveCount(0);
  await expect(item(g, '_demob001').locator('[data-pack-rename], [data-pack-del]')).toHaveCount(0);
  await expect(cat(g, 'nz-0').locator('[data-pack-del="nz-0"]')).toHaveCount(0);
  // its own: added, renamed, removed
  const field = cat(g, 'nz-0').getByRole('textbox', { name: /ついか$/ });
  await field.fill('おみやげ リスト');
  await field.press('Enter');
  const own = cat(g, 'nz-0').locator('[data-pack-item]').last();
  await expect(own).toContainText('おみやげ リスト');
  await own.locator('[data-pack-rename]').click();
  await own.getByRole('textbox').fill('おみやげ');
  await own.getByRole('textbox').press('Enter');
  await expect(own).toContainText('おみやげ');
  await shot(g, 'pack-G-edit');
  await own.locator('[data-pack-del]').click();
  await expect(cat(g, 'nz-0').getByText('おみやげ')).toHaveCount(0);
});

test('✎ off mid-rename keeps the typed name', async ({ context }) => {
  const a = await open(context);
  await edit(a);
  await item(a, 'nz-0-2').locator('[data-pack-rename]').click();
  await item(a, 'nz-0-2').getByRole('textbox').fill('ざいりゅう カード');
  await edit(a);
  await expect(item(a, 'nz-0-2')).toContainText('ざいりゅう カード');
});

test('a trip that’s over: a quiet count, no 「あと Nこ」 or bar; ticking still works', async ({ context }) => {
  const a = await open(context, 'A', 'nz', AFTER);
  await expect(a.locator('[data-pack-past]')).toBeVisible();
  await expect(a.locator('[role=progressbar]')).toHaveCount(0);
  await expect(a.getByText(/^あと \d+こ$/)).toHaveCount(0);
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
  const field = cat(b, 'nz-3').getByRole('textbox', { name: /ついか$/ });
  await field.fill('うちわ');
  await field.press('Enter');
  await expect(cat(a, 'nz-3')).toContainText('うちわ');
});

test('all packed: Orville’s 「じゅんび OK！」, celebrated once', async ({ context }) => {
  const a = await open(context, 'A');
  const open1 = a.locator('[data-pack-item] [role=checkbox][aria-checked=false]');
  const n = await open1.count();
  for (let i = 0; i < n; i++) await open1.first().click();
  await expect(a.locator('[data-pack-stamp]')).toHaveAttribute('data-pack-stamp', 'cheer');
  await expect(a.getByText('ばっちり！ いい たびを！')).toBeVisible();
  await shot(a, 'pack-A-cheer');
  // again (a reload): the stamp, no celebration
  await reopen(a);
  await expect(a.locator('[data-pack-stamp]')).toHaveAttribute('data-pack-stamp', 'on');
  await expect(a.getByText('ばっちり！ いい たびを！')).toHaveCount(0);
  // one unticked: no stamp
  await tick(a, 'nz-0-0').click();
  await expect(a.locator('[data-pack-stamp]')).toHaveCount(0);
});

test('せってい → りょこう: km / mi, kept on this phone', async ({ page }) => {
  await page.goto(`?demo&date=${DATE}`);
  await islandUp(page);
  await fromMenu(page, 'settings');
  const sec = page.locator('dialog[open] [data-travel-section]');
  await expect(sec.locator('[data-units="km"]')).toHaveAttribute('aria-pressed', 'true');
  await sec.locator('[data-units="mi"]').click();
  await expect(sec.locator('[data-units="mi"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('island.travel.units'))).toBe('mi');
  if (process.env.SHOTS) await sec.screenshot({ path: `${process.env.SHOTS}/settings-units.png` });
  await page.reload();
  await islandUp(page);
  await fromMenu(page, 'settings');
  await expect(page.locator('dialog[open] [data-travel-section] [data-units="mi"]')).toHaveAttribute('aria-pressed', 'true');
});
