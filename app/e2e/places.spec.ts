// 保存した場所 (components/places, docs/places.md), the logic tier: GET /places routed to invented places (e2e/places.ts;
// never a real list), a paired phone on the tests' own record (record.ts), the map its stub (the matches as buttons,
// no MapLibre, no tiles). Opened from the menu's 地図; the field read into chips as typed (営業中, a category on a
// space or Enter, Backspace on an empty field), the category chips and their subs, 見つかりませんでした and
// 条件をすべて外す; the list and the map the same matches, a row and a marker opening the card, a long press's
// この地点の周辺; the card's hours line and week view, the note and its hint, ルート, コピー; the sorts and NEW; offline
// from the copy and on a first run; the guest's view (no notes); the location refused; empty; ?since=. Taps in WebKit,
// clicks in Chromium. The perf check: places-perf.spec.ts.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { shot } from './shots.ts';
import { fixturePlaces, routePlaces } from './places.ts';
import { KEY_OF } from './relay.ts';

test.use({ viewport: { width: 393, height: 852 } });
type Tap = 'tap' | 'click';
const howOf = (project: string): Tap => (project.startsWith('webkit') ? 'tap' : 'click');
const view = (p: Page) => p.locator('dialog[open] [data-places]');
const rows = (p: Page) => view(p).locator('[data-place-row]');
const field = (p: Page) => view(p).locator('[data-places-q]');
const qchips = (p: Page) => view(p).locator('[data-qchip]');
const card = (p: Page) => view(p).locator('[data-place-card]');
const stubMap = (p: Page) => view(p).locator('[data-places-map]');

async function phone(page: Page, context: BrowserContext, who: 'A' | 'G' = 'A', o: Parameters<typeof routePlaces>[2] & { rows?: ReturnType<typeof fixturePlaces> } = {}) {
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  const rec = newRecord();
  await rec.pair(context, who);
  const relay = await routePlaces(page, o.rows ?? fixturePlaces(), { guest: who === 'G', ...o });
  await page.goto('');
  await islandUp(page);
  return { rec, relay };
}
async function openPlaces(page: Page, how: Tap) {
  await fromMenu(page, 'places', how);
  await expect(view(page)).toBeVisible();
}
const names = (p: Page) => rows(p).locator('.nmt').allTextContents();
/** Type into the field as a keyboard would, one key at a time. */
async function type(page: Page, s: string) {
  await field(page).focus();
  await field(page).pressSequentially(s);
}

test('opened from 地図: titled 保存した場所, the count and the sync, the rows and the map the same matches, the key sent', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  const { relay } = await phone(page, context);
  await openPlaces(page, how);
  await expect(page.locator('dialog[open]')).toHaveAttribute('aria-label', '保存した場所');
  await expect(view(page).locator('[data-places-meta]')).toHaveText('10件 · 同期 1時間前');
  await expect(rows(page).first()).toBeVisible();
  await expect(stubMap(page)).toHaveAttribute('data-count', '10');
  expect(await rows(page).count()).toBe(10);
  expect(relay.calls[0]).toEqual({ search: '', auth: `Bearer ${KEY_OF.A}` });
  // the field and the peek: a tap on it raises the sheet
  await expect(view(page)).toHaveAttribute('data-sheet', 'peek');
  await field(page)[how]();
  await expect(view(page)).toHaveAttribute('data-sheet', 'full');
  await expect(field(page)).toHaveAttribute('placeholder', '店名・エリア・メモで検索');
  await shot(page, 'shot-main');
});

test('the field read into chips: time words at once, a category on a space or Enter, Backspace takes the last; the chips’ subs; none found and 条件をすべて外す', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context);
  await openPlaces(page, how);
  await type(page, '営業中');
  await expect(qchips(page)).toHaveText(['営業中']);
  await expect(field(page)).toHaveValue('');
  // 12:00 Wednesday: 4 open (かりそめ Fri/Sat nights, 見本 weekends, 例題の湯 from 15:00, おためし from 17:00, two unknown)
  expect(new Set(await names(page))).toEqual(new Set(['テスト麺屋 いちばん', '仮想うどん店', 'ためしカフェ', 'ダミー書店']));
  await type(page, 'ラーメン');
  await expect(field(page)).toHaveValue('ラーメン');
  await expect(rows(page)).toHaveCount(1);
  await field(page).press('Enter');
  await expect(field(page)).toHaveValue('');
  await expect(view(page).locator('[data-cat="麺"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(view(page).locator('[data-sub="ラーメン"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(view(page).locator('[data-sub="うどん"]')).toHaveAttribute('aria-pressed', 'false');
  // Backspace on the empty field takes the last chip: ラーメン's (shown in the category row), then 営業中
  await field(page).focus();
  await field(page).press('Backspace');
  await expect(view(page).locator('[data-cat="麺"]')).toHaveAttribute('aria-pressed', 'false');
  await field(page).press('Backspace');
  await expect(qchips(page)).toHaveCount(0);
  await expect(rows(page)).toHaveCount(10);
  // a category chip, then its sub
  await field(page).blur();
  await view(page).locator('[data-cat="麺"]')[how]();
  await expect(rows(page)).toHaveCount(3);
  await view(page).locator('[data-sub="うどん"]')[how]();
  await expect(rows(page)).toHaveCount(1);
  await expect(view(page).locator('[data-places-meta]')).toHaveText('1 / 10件 · 同期 1時間前');
  // a name, a note, a fuzzy name
  await view(page).locator('[data-cat="麺"]')[how]();
  await type(page, 'クロワッサン');
  expect(await names(page)).toEqual(['見本ベーカリー']);
  await field(page).fill('');
  await type(page, '日曜に');
  await expect(qchips(page)).toHaveText(['日曜営業']);
  await type(page, 'zzz');
  await expect(view(page).locator('[data-places-none]')).toContainText('見つかりませんでした');
  await view(page).locator('[data-places-clear]')[how]();
  await expect(qchips(page)).toHaveCount(0);
  await expect(field(page)).toHaveValue('');
  await expect(rows(page)).toHaveCount(10);
});

test('the list and the map: a row flies there and opens the card, a marker opens it, ‹ back; a long press: この地点の周辺', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context);
  await openPlaces(page, how);
  await type(page, 'おためし');
  await expect(stubMap(page)).toHaveAttribute('data-count', '1');
  await rows(page).first()[how]();
  await expect(view(page)).toHaveAttribute('data-level', 'card');
  await expect(card(page)).toHaveAttribute('data-place-card', '109');
  await expect(stubMap(page)).toHaveAttribute('data-sel', '109');
  await card(page).getByRole('button', { name: '戻る' })[how]();
  await expect(view(page)).toHaveAttribute('data-level', 'list');
  await expect(stubMap(page)).toHaveAttribute('data-sel', '');
  await expect(field(page)).toHaveValue('おためし'); // the search kept
  await stubMap(page).locator('[data-place-pin="109"]')[how]();
  await expect(card(page)).toHaveAttribute('data-place-card', '109');
  await card(page).getByRole('button', { name: '戻る' })[how]();
  await field(page).fill('');
  // a long press near 高尾: only サンプル山 within 1.5 km
  await page.evaluate(() => (window as unknown as { __placesMap: { longPress(a: number, b: number): void } }).__placesMap.longPress(139.255, 35.633));
  await expect(qchips(page)).toHaveText(['この地点の周辺']);
  await expect(stubMap(page)).toHaveAttribute('data-pin', '139.2550,35.6330');
  expect(await names(page)).toEqual(['サンプル山']);
  await expect(rows(page).first().locator('.sbt')).toHaveText('山 · 八王子 · 560 m'); // the distance from the point
  // このあたりで探す after a pan
  await page.evaluate(() => (window as unknown as { __placesMap: { pan(a: number, b: number): void } }).__placesMap.pan(139.7, 35.66));
  await view(page).locator('[data-search-here]')[how]();
  await expect(qchips(page)).toHaveText(['地図の中心']);
  await expect(view(page).locator('[data-search-here]')).toHaveCount(0);
});

test('the sheet: a swipe up on the peek’s rows raises it (no row opened), a tap on a row opens its card (one ✕: the bar’s), a swipe down folds it to the card', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context);
  await openPlaces(page, how);
  await expect(view(page)).toHaveAttribute('data-sheet', 'peek');
  const swipe = async (dy: number, from = rows(page).first()) => {
    // (the sheet's height settled first: its transition)
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.finished.catch(() => {}))));
    const b = (await from.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    for (let k = 1; k <= 6; k++) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 + (dy * k) / 6);
    await page.mouse.up();
  };
  await swipe(-120);
  await expect(view(page)).toHaveAttribute('data-sheet', 'full');
  await expect(view(page)).toHaveAttribute('data-level', 'list');
  // folded by the head, then a row's tap: its card, the bar's ✕ the only one
  await swipe(150, view(page).locator('[data-places-meta]'));
  await expect(view(page)).toHaveAttribute('data-sheet', 'peek');
  await rows(page).first()[how]();
  await expect(view(page)).toHaveAttribute('data-level', 'card');
  await expect(view(page).getByRole('button', { name: '閉じる' })).toHaveCount(1);
  await swipe(-200, view(page).locator('[data-sheet-grip]'));
  await expect(view(page)).toHaveAttribute('data-sheet', 'full');
  await swipe(200, view(page).locator('[data-sheet-grip]'));
  await expect(view(page)).toHaveAttribute('data-sheet', 'card');
});

test('the card: the hours line, the week view (today yuzu, 定休日), the note and its hint, ルート, コピー; 保存日', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  if (info.project.name.startsWith('chromium')) await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await phone(page, context);
  await openPlaces(page, how);
  await type(page, 'いちばん');
  await rows(page).first()[how]();
  const c = card(page);
  await expect(c.locator('h2')).toHaveText('テスト麺屋 いちばん');
  await expect(c.locator('.st')).toHaveText('ラーメン · 渋谷');
  await expect(c.locator('[data-hours]')).toHaveText('営業中 · 21:30まで');
  await expect(c.locator('[data-hours]')).toHaveAttribute('data-hours', 'open');
  await c.locator('[data-hours]')[how]();
  await expect(c.locator('[data-week] tr')).toHaveCount(7);
  await expect(c.locator('[data-week] tr.today')).toHaveAttribute('data-day', '3');
  await expect(c.locator('[data-week] tr.today td')).toHaveText('11:00–21:30');
  await expect(c.locator('[data-place-note] .nt')).toHaveText('味玉を追加する');
  await expect(c.locator('[data-place-note] .hint')).toHaveText('メモはGoogleマップで編集');
  await expect(c.locator('[data-place-route]')).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=35.661,139.701');
  await expect(c.locator('[data-place-maps]')).toHaveAttribute('href', 'https://maps.google.com/?cid=101');
  await expect(c.locator('.foot')).toHaveText('保存日 2026年9月25日（金）');
  await shot(page, 'shot-card');
  if (info.project.name.startsWith('chromium')) {
    await c.locator('[data-place-copy]')[how]();
    await expect(page.locator('.banner[role=status]')).toContainText('住所をコピーしました');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('テスト麺屋 いちばん\n東京都渋谷区神南1-1-1');
  }
  // closed days: 仮想うどん's Sunday, its line at 12:00 Wednesday
  await c.getByRole('button', { name: '戻る' })[how]();
  await field(page).fill('');
  await type(page, '仮想うどん');
  await rows(page).first()[how]();
  await expect(c.locator('[data-hours]')).toHaveText('営業中 · 15:00まで');
  await c.locator('[data-hours]')[how]();
  await expect(c.locator('[data-week] tr[data-day="0"]')).toHaveClass(/off/);
  await expect(c.locator('[data-week] tr[data-day="0"] td')).toHaveText('定休日');
  // one with no hours
  await c.getByRole('button', { name: '戻る' })[how]();
  await field(page).fill('');
  await type(page, 'まぼろし');
  await rows(page).first()[how]();
  await expect(c.locator('[data-hours]')).toHaveText('営業時間は不明');
});

test('the sorts: 名前順, 保存が新しい順 (NEW on a place saved within 3 days)', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context);
  await openPlaces(page, how);
  await view(page).locator('[data-sort]')[how]();
  await page.locator('dialog[open] [data-sort-name]')[how]();
  await expect(view(page).locator('[data-sort]')).toHaveText('名前順');
  const want = fixturePlaces().map((p) => p.name).sort(new Intl.Collator('ja').compare);
  expect(await names(page)).toEqual(want);
  await view(page).locator('[data-sort]')[how]();
  await page.locator('dialog[open] [data-sort-new]')[how]();
  await expect(rows(page).first().locator('.nmt')).toHaveText('ためしカフェ');
  await expect(rows(page).first().locator('.tag.new')).toHaveText('NEW');
  await expect(view(page).locator('.tag.new')).toHaveCount(1);
});

test('offline: a first run offline says so, もう一度 loads; the copy on this phone works (オフライン · 同期…, the map’s note); back online a ?since= delta, kept', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  const { relay } = await phone(page, context, 'A', { down: true });
  await openPlaces(page, how);
  await expect(view(page).locator('[data-places-error="offline"]')).toContainText('オフラインのため読み込めませんでした');
  relay.down(false);
  await view(page).locator('[data-places-error] button')[how]();
  await expect(rows(page)).toHaveCount(10);
  // the copy, read again after a reload with the relay out of reach
  relay.down(true);
  await page.reload();
  await islandUp(page);
  await openPlaces(page, how);
  await expect(rows(page)).toHaveCount(10);
  await expect(view(page).locator('[data-places-meta]')).toHaveText('オフライン · 同期 1時間前');
  await context.setOffline(true);
  await expect(view(page).locator('[data-map-note]')).toHaveText('地図はオフラインです（場所のみ表示）');
  // back online: a delta (?since=5) brings a new one
  relay.add([{ ...fixturePlaces()[0], id: '201', name: '新入り食堂', cat: '和食・寿司', sub: '定食', added: Date.parse('2026-11-04T09:00:00+09:00') / 1000 }]);
  relay.down(false);
  await context.setOffline(false);
  await expect(rows(page)).toHaveCount(11);
  expect(relay.calls.at(-1)?.search).toBe('?since=5');
  await expect(view(page).locator('[data-places-meta]')).toHaveText('11件 · 同期 1時間前');
  // kept: the next load reads all 11 offline
  relay.down(true);
  await page.reload();
  await islandUp(page);
  await openPlaces(page, how);
  await expect(rows(page)).toHaveCount(11);
});

test('the relay’s list over 2 h old: one POST /places/sync an opening, quietly, then the delta (同期 たった今)', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  const { relay } = await phone(page, context, 'A', { syncedAt: Date.parse('2026-11-04T09:00:00+09:00') });
  await openPlaces(page, how);
  await expect(view(page).locator('[data-places-meta]')).toHaveText('10件 · 同期 たった今');
  expect(relay.syncs).toBe(1);
  expect(relay.calls.map((c) => c.search)).toEqual(['', '?since=5']);
});

test('the guest: the places, never a note', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  const { relay } = await phone(page, context, 'G');
  await openPlaces(page, how);
  await expect(rows(page)).toHaveCount(10);
  expect(relay.calls[0].auth).toBe(`Bearer ${KEY_OF.G}`);
  await type(page, 'いちばん');
  await rows(page).first()[how]();
  await expect(card(page).locator('[data-hours]')).toBeVisible();
  await expect(card(page).locator('[data-place-note]')).toHaveCount(0);
  // a note's words find nothing
  await card(page).getByRole('button', { name: '戻る' })[how]();
  await field(page).fill('');
  await type(page, 'クロワッサン');
  await expect(view(page).locator('[data-places-none]')).toBeVisible();
});

test('the location refused: 近く says how to pick a spot instead; an empty list says so', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await context.addInitScript(() => {
    navigator.geolocation.watchPosition = (_ok, err) => (setTimeout(() => err?.({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError), 10), 1);
    navigator.geolocation.clearWatch = () => {};
  });
  await phone(page, context);
  await openPlaces(page, how);
  await type(page, '近くの');
  await expect(qchips(page)).toHaveText(['現在地周辺']);
  await expect(view(page).locator('[data-map-note]')).toHaveText('現在地を使えません。地図を長押しすると地点を選べます');
  await expect(rows(page)).toHaveCount(10); // (no location: nothing filtered)
});

test('an empty list', async ({ page, context }, info) => {
  await phone(page, context, 'A', { rows: [] });
  await openPlaces(page, howOf(info.project.name));
  await expect(view(page).locator('[data-places-empty]')).toHaveText('保存した場所はまだありません');
});
