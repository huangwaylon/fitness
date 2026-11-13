// ごはん's chain menus (Kalori, docs/food-data.md "Kalori"): on a member's paired phone (e2e/record.ts: the relay's real
// record) the search's open fetches the relay's `/food/kalori` with the phone's key (here a route to a fixture of
// invented items), its rows show their shop, and one logs by the serving (`sv`, kept by the record); the guest's phone
// never asks for them. The demo has none (e2e/food.spec.ts).
import { readFileSync } from 'node:fs';
import { expect, test, type Browser } from './fixtures.ts';
import { islandUp } from './island.ts';
import { openKenkou } from './hud.ts';
import { newRecord } from './record.ts';
import { KEY_OF, RELAY } from './relay.ts';

const DATA = readFileSync(new URL('./fixtures/kalori.json', import.meta.url), 'utf8');
/** Kalori's hotlinked pictures, never fetched from the real host: a row's (_200) a 1 px PNG, the amount's (_400) failing. */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
type Rec = ReturnType<typeof newRecord>;

/** A fresh phone paired as `who` on `rec`, the relay's chain menus routed to the fixture (each request's key kept;
 *  answered once `held` settles), its ごはん open on 昼ごはん's search. */
async function search(browser: Browser, rec: Rec, who: 'A' | 'G', held?: Promise<void>) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, who);
  const auth: string[] = [];
  const imgs: { url: string; referer?: string }[] = [];
  await context.route('https://assets.kalori.jp/**', (route) => {
    const url = route.request().url();
    imgs.push({ url, referer: route.request().headers()['referer'] });
    return url.endsWith('_200.webp') ? route.fulfill({ status: 200, contentType: 'image/png', body: PNG }) : route.abort();
  });
  await context.route(`${RELAY}/food/kalori`, async (route) => {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, If-None-Match', 'Access-Control-Expose-Headers': 'ETag' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    auth.push(route.request().headers()['authorization'] ?? '');
    await held;
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { ...cors, ETag: '"e2e"', 'Cache-Control': 'private, no-cache' }, body: DATA });
  });
  const page = await context.newPage();
  await page.goto('');
  await islandUp(page);
  await openKenkou(page, 'food');
  const sheet = page.locator('dialog[open] :is(.titlebar, [data-food-sheet])');
  await sheet.locator('[data-add=l]').click();
  await sheet.locator('[data-food-q]').fill('ためし丼');
  return { page, sheet, auth, imgs };
}

test('a member’s search has the chain menus: the shop on the row, logged by the serving with the phone’s key', async ({ browser }) => {
  const rec = newRecord();
  const a = await search(browser, rec, 'A');
  const row = a.sheet.locator('[data-food-results] [data-item="kal:900001"]');
  await expect(row).toBeVisible({ timeout: 15_000 });
  await expect(row.locator('[data-brand]')).toHaveText('ためし食堂');
  await expect(row.locator('.kc')).toContainText('1,180');
  await expect(row.locator('.kc small')).toHaveText('1食');
  expect(a.auth).toEqual([`Bearer ${KEY_OF.A}`]);
  // a shop named narrows to its menu (the header's aliases: ためし), the other words within it
  const q = a.sheet.locator('[data-food-q]');
  await q.fill('ためし');
  await expect(a.sheet.locator('[data-food-results] [data-item]')).toHaveCount(2);
  await q.fill('みほん珈琲 ブレンド');
  await expect(a.sheet.locator('[data-food-results] [data-item]')).toHaveCount(1);
  await expect(a.sheet.locator('[data-food-results] [data-item="kal:900003"]')).toBeVisible();
  await q.fill('ためし丼');
  await row.click();
  await a.sheet.locator('[data-food-open-add]').click();
  await expect.poll(() => rec.sent.filter((e) => e.type === 'food').map((e) => [e.ok, e.data.g, e.data.f])).toEqual([
    [true, 100, { id: 'kal:900001', n: 'ためし丼 並盛', k: 1180, p: 31.5, fa: 28, c: 190.2, s: 3.4, u: '1食', sv: true }]
  ]);
});

test('the chain menus still coming: 読み込み中, never 見つかりませんでした; arriving, they go under the rows shown', async ({ browser }) => {
  let answer = () => {};
  const a = await search(browser, newRecord(), 'A', new Promise<void>((ok) => (answer = ok)));
  const pending = a.sheet.locator('[data-food-pending]');
  await expect(pending).toHaveText('商品・お店のメニューを読み込み中…', { timeout: 15_000 });
  await expect(a.sheet.locator('[data-food-none]')).toHaveCount(0);
  // a query the catalog has: its rows, the line under them; the menus' rows come in below, the first row unmoved
  await a.sheet.locator('[data-food-q]').fill('ラテ');
  const rows = a.sheet.locator('[data-food-results] [data-item]');
  await expect(rows.first()).toBeVisible();
  await expect(pending).toHaveText('ほかの候補を読み込み中…');
  const ids = () => rows.evaluateAll((els) => els.map((e) => e.getAttribute('data-item')!));
  const shown = await ids();
  expect(shown.filter((id) => id.startsWith('kal:'))).toEqual([]);
  answer();
  await expect(pending).toHaveCount(0);
  await rows.last().scrollIntoViewIfNeeded();
  await expect(a.sheet.locator('[data-food-results] [data-item^="kal:"]').first()).toBeAttached();
  expect((await ids()).slice(0, shown.length)).toEqual(shown);
});

test('a chain menu’s row: the shop’s mark and Kalori’s picture hotlinked (no referrer); its amount: the shop, the values’ trust, its kalori.jp page, the picture failing: its tile', async ({ browser }) => {
  const a = await search(browser, newRecord(), 'A');
  const row = a.sheet.locator('[data-food-results] [data-item="kal:900001"]');
  await expect(row.locator('[data-thumb="img"] img')).toHaveAttribute('src', 'https://assets.kalori.jp/products/tameshi/generated/g/900001_200.webp');
  await expect(row.locator('[data-shop]')).toBeVisible();
  await expect(row).toContainText('店のメニュー：');
  // no picture: the category's tile, and no mark on a generic food's row
  await a.sheet.locator('[data-food-q]').fill('みほん');
  await expect(a.sheet.locator('[data-item="kal:900003"] [data-thumb="cat"]')).toBeVisible();
  await a.sheet.locator('[data-food-q]').fill('ごはん');
  await expect(a.sheet.locator('[data-food-results] [data-item^="mext:"]').first()).toBeVisible();
  await expect(a.sheet.locator('[data-food-results] [data-item^="mext:"] [data-shop]')).toHaveCount(0);
  await a.sheet.locator('[data-food-q]').fill('ためし丼');
  await row.click();
  await a.sheet.locator('[data-food-open-more]').click();
  const pic = a.sheet.locator('[data-food-pic]');
  await expect.poll(() => a.imgs.some((i) => i.url.endsWith('/900001_400.webp'))).toBe(true);
  await expect(pic.locator('[data-thumb="cat"]')).toBeVisible();
  await expect(pic.locator('img')).toHaveCount(0);
  // the amount's head: the shop and category, how far the values are its own, its page on kalori.jp
  await expect(a.sheet.locator('[data-food-shop]')).toHaveText('店のメニュー：ためし食堂 · 丼・定食');
  await expect(a.sheet.locator('[data-food-trust="p"]')).toContainText('公式の値（PFCは推定）');
  const link = a.sheet.locator('[data-food-kalori]');
  await expect(link).toHaveAttribute('href', 'https://kalori.jp/ja/shops/tameshi/products/900001/');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  expect(a.imgs.filter((i) => !/^https:\/\/assets\.kalori\.jp\/products\/(tameshi|mihon)\/generated\/g\/\d+_(200|400)\.webp$/.test(i.url) || i.referer)).toEqual([]);
});

test('the shop chips: typed, the results’ shops; a tap writes the name, the field focused; ✕ resets; よく行く店 once I log one', async ({ browser }) => {
  const a = await search(browser, newRecord(), 'A');
  const q = a.sheet.locator('[data-food-q]');
  const chips = a.sheet.locator('[data-food-shops]');
  await expect(a.sheet.locator('[data-food-results] [data-item="kal:900001"]')).toBeVisible({ timeout: 15_000 });
  // one shop in the results: no chips
  await expect(chips).toHaveCount(0);
  await q.fill('カレー');
  await expect(chips).toHaveAttribute('data-food-shops', 'in');
  await expect(chips.locator('[data-shop-chip]')).toHaveText([/ためし食堂\s*1/, /みほん珈琲\s*1/]);
  await chips.locator('[data-shop-chip="tameshi"]').click();
  await expect(q).toHaveValue('ためし食堂 カレー');
  await expect(q).toBeFocused();
  await expect(a.sheet.locator('[data-food-results] [data-item]')).toHaveCount(1);
  await expect(a.sheet.locator('[data-food-results] [data-item="kal:900004"]')).toBeVisible();
  // a shop named: no chips; ✕: the query gone, and none of mine yet: no よく行く店
  await expect(chips).toHaveCount(0);
  await a.sheet.getByRole('button', { name: 'クリア' }).click();
  await expect(q).toHaveValue('');
  await expect(a.sheet.locator('[data-food-recent], .note').first()).toBeVisible();
  await expect(chips).toHaveCount(0);
  // logged by its ＋: then よく行く店, a tap the shop's whole menu
  await q.fill('みほんカレー');
  await a.sheet.locator('[data-food-results] li:has([data-item="kal:900005"]) [data-quick]').click();
  await expect(q).toHaveValue('');
  await expect(chips).toHaveAttribute('data-food-shops', 'often');
  await expect(chips).toContainText('よく行く店');
  // さいきん's row says its shop too
  await expect(a.sheet.locator('[data-food-recent] [data-item="kal:900005"] [data-brand]')).toHaveText('みほん珈琲');
  await chips.locator('[data-shop-chip="mihon"]').click();
  await expect(q).toHaveValue('みほん珈琲 ');
  await expect(q).toBeFocused();
  // (its blend, its curry, its latte once in its five states)
  await expect(a.sheet.locator('[data-food-results] [data-item]')).toHaveCount(3);
});

test('a chain menu’s sizes and milks: two chip groups, a pick keeps the ×n; a serving counted (×2 → ×3)', async ({ browser }) => {
  const a = await search(browser, newRecord(), 'A');
  await a.sheet.locator('[data-food-q]').fill('みほんラテ');
  const row = a.sheet.locator('[data-food-results] [data-item="kal:900010"]');
  await expect(row).toContainText('Tall・ミルク');
  await row.click();
  const open = a.sheet.locator('[data-food-open]');
  const kcal = open.locator('[data-food-open-kcal]');
  await expect(open.locator('[data-states="size"] [data-state]')).toHaveText([/^Short/, /^Tall/, /^Grande/]);
  await expect(open.locator('[data-states="milk"] [data-state]')).toHaveText([/^ミルク/, /^豆乳/]);
  await expect(open.locator('[data-states] [aria-pressed="true"]')).toHaveText([/^Tall/, /^ミルク/]);
  await expect(kcal).toHaveText('190 kcal');
  // ×0.5 → ×1 → ×1.5 → ×2: each chip says its kcal at it
  for (let i = 0; i < 2; i++) await open.locator('[data-step="1"]').click();
  await expect(open.locator('.mult')).toHaveText('×2');
  await expect(open.locator('[data-state="Grande"] small')).toHaveText('480 kcal');
  await open.locator('[data-state="Grande"]').click();
  await open.locator('[data-state="豆乳"]').click();
  await expect(open).toHaveAttribute('data-food-open', 'kal:900013');
  await expect(open.locator('.mult')).toHaveText('×2');
  await expect(kcal).toHaveText('430 kcal');
  await expect(open.locator('[data-state="Short"] small')).toHaveText('280 kcal');
  // a serving past ×2 counts whole ones (a custom food's goes by halves)
  await open.locator('[data-step="1"]').click();
  await expect(open.locator('.mult')).toHaveText('×3');
  await expect(kcal).toHaveText('645 kcal');
});

test('the guest’s phone never asks for the chain menus: its search has none', async ({ browser }) => {
  const g = await search(browser, newRecord(), 'G');
  await expect(g.sheet.locator('[data-food-none]')).toBeVisible({ timeout: 15_000 });
  await expect(g.sheet.locator('[data-item^="kal:"]')).toHaveCount(0);
  expect(g.auth).toEqual([]);
  expect(g.imgs).toEqual([]);
});
