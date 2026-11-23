// 保存した場所 (components/places, docs/places.md), the logic tier: GET /places routed to invented places (e2e/places.ts;
// never a real list), a paired phone on the tests' own record (record.ts), the map its stub (the matches as buttons,
// no MapLibre, no tiles). Opened from the menu's 地図; the field read into chips as typed (営業中, a category on a
// space or Enter, Backspace on an empty field), the category chips and their subs, 見つかりませんでした and
// 条件を全部外す; the list and the map the same matches, a row and a marker opening the card, a long press's
// この地点の周辺; the card's hours line and week view, the note and its hint, 経路, コピー; offline
// from the copy and on a first run; the guest's view (no notes); the location refused; empty; ?since=. Taps in WebKit,
// clicks in Chromium. The perf check: places-perf.spec.ts.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { shot } from './shots.ts';
import { finger, fixturePlaces, manyPlaces, routePlaces } from './places.ts';
import { settle } from './overlap.ts';
import { KEY_OF } from './relay.ts';
import { aboveKeyboard, fakeKeyboard, keyboard, KEYBOARD_PX } from './keyboard.ts';
import { readFileSync } from 'node:fs';

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
  await expect(field(page)).toHaveAttribute('placeholder', '店名・エリア・ジャンル・メモで検索');
  await shot(page, 'shot-main');
});

test('the keyboard up: the full sheet stays full (the layout’s height, not innerHeight), the field, the chips and the first rows above it', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await fakeKeyboard(page);
  await phone(page, context);
  await openPlaces(page, how);
  await field(page)[how]();
  await expect(view(page)).toHaveAttribute('data-sheet', 'full');
  await keyboard(page, KEYBOARD_PX);
  for (const sel of ['[data-places-q]', '[data-cat]', '[data-place-row]']) await expect.poll(async () => (await aboveKeyboard(page, `dialog[open] [data-places] ${sel}`)).ok, { message: sel }).toBe(true);
});

test('the field read into chips: time words at once, a category on a space or Enter, Backspace takes the last; the chips’ subs; none found and 条件を全部外す', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context);
  await openPlaces(page, how);
  await type(page, '営業中');
  await expect(qchips(page)).toHaveText(['営業中']);
  await expect(field(page)).toHaveValue('');
  // 12:00 Wednesday: 5 open (かりそめ Fri/Sat nights, 見本 weekends, 例題の湯 from 15:00, おためし from 17:00, まぼろし
  // unknown; サンプル山 by its facet hours: e2e/places.ts FIXTURE_FACETS)
  expect(new Set(await names(page))).toEqual(new Set(['テスト麺屋 いちばん', '仮想うどん店', 'ためしカフェ', 'ダミー書店', 'サンプル山']));
  await type(page, 'ラーメン');
  await expect(field(page)).toHaveValue('ラーメン');
  await expect(rows(page)).toHaveCount(1);
  await field(page).press('Enter');
  await expect(field(page)).toHaveValue('');
  // every active chip yuzu with ×, in the order added; the picked top's other subs after them
  await expect(qchips(page)).toHaveText(['営業中', 'ラーメン']);
  await expect(view(page).locator('[data-qchip="cat:麺:ラーメン"]')).toHaveAttribute('aria-label', /を外す$/);
  await expect(view(page).locator('[data-sub="うどん"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(view(page).locator('[data-cat="麺"]')).toHaveCount(0);
  // Backspace on the empty field takes the last chip: ラーメン's, then 営業中
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
  await expect(qchips(page)).toHaveText(['麺']);
  await view(page).locator('[data-sub="うどん"]')[how]();
  await expect(rows(page)).toHaveCount(1);
  await expect(qchips(page)).toHaveText(['うどん']);
  await expect(view(page).locator('[data-places-meta]')).toHaveText('1 / 10件 · 同期 1時間前');
  // a name, a note, a fuzzy name
  await view(page).locator('[data-qchip="cat:麺:うどん"]')[how]();
  await type(page, 'クロワッサン');
  expect(await names(page)).toEqual(['見本ベーカリー']);
  await field(page).fill('');
  await type(page, '日曜に');
  await expect(qchips(page)).toHaveText(['日曜営業']);
  // (a word nothing has is ignored, not an empty list: places-filter.spec; none found: a chip that leaves nothing)
  await type(page, 'まぼろし');
  await expect(view(page).locator('[data-places-none]')).toContainText('見つかりませんでした');
  await view(page).locator('[data-places-clear]')[how]();
  await expect(qchips(page)).toHaveCount(0);
  await expect(field(page)).toHaveValue('');
  await expect(rows(page)).toHaveCount(10);
});

/** The stub map's moveend: its box as the map would say it (west, south, east, north). */
async function bounds(p: Page, b: [number, number, number, number]) {
  await p.waitForFunction(() => !!(window as unknown as { __placesMap?: unknown }).__placesMap);
  await p.evaluate((b) => (window as unknown as { __placesMap: { bounds(...a: number[]): void } }).__placesMap.bounds(...b), b);
}
/** The sheet's height settled (its transition) and the virtual list's rows drawn down to its scrolled foot. */
async function frames(p: Page) {
  await p.evaluate(() => Promise.all(document.getAnimations().filter((a) => a instanceof CSSTransition).map((a) => a.finished.catch(() => {}))));
  await expect.poll(() => view(p).locator('[data-places-list]').evaluate((el) => {
    const ys = [...el.querySelectorAll<HTMLElement>('[data-place-row]')].map((r) => new DOMMatrix(getComputedStyle(r).transform).m42);
    return Math.max(...ys) + 56 >= el.scrollTop + el.clientHeight;
  })).toBe(true);
}

test('browse: no search, the list is the map’s view (the map all of them); a filter chip keeps the view, typed text searches everywhere, cleared back to the view; an empty view and 全体を見る', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context);
  await openPlaces(page, how);
  const meta = view(page).locator('[data-places-meta]');
  // about 渋谷: 7 of the 10
  await bounds(page, [139.69, 35.65, 139.71, 35.67]);
  await expect(rows(page)).toHaveCount(7);
  await expect(meta).toHaveText('この範囲 7 / 10件 · 同期 1時間前');
  await expect(stubMap(page)).toHaveAttribute('data-count', '10');
  await expect(view(page).locator('[data-search-here]')).toHaveCount(0);
  // a category chip: the view's (its count the view's)
  await expect(view(page).locator('[data-cat="温泉"]')).toHaveCount(0);
  await view(page).locator('[data-cat="麺"]')[how]();
  await expect(rows(page)).toHaveCount(3);
  await view(page).locator('[data-qchip="cat:麺:"]')[how]();
  // the same category typed: a search, the whole list's (麺 has 3, none of them in 高尾)
  await bounds(page, [139.2, 35.6, 139.3, 35.7]);
  await type(page, '麺 ');
  await expect(rows(page)).toHaveCount(3);
  await expect(meta).toHaveText('3 / 10件 · 同期 1時間前');
  await view(page).locator('[data-qchip^="cat:麺"]').first()[how]();
  await field(page).blur();
  // panned to 高尾
  await bounds(page, [139.2, 35.6, 139.3, 35.7]);
  expect(await names(page)).toEqual(['サンプル山']);
  // typed: everywhere, not the view's; cleared: the view again
  await type(page, 'ためし');
  expect(new Set(await names(page))).toEqual(new Set(['ためしカフェ', 'おためし酒場']));
  await expect(meta).toHaveText('2 / 10件 · 同期 1時間前');
  await field(page).fill('');
  await expect(rows(page)).toHaveCount(1);
  await field(page).blur();
  // nothing in view: says so, 全体を見る fits them all
  await bounds(page, [140.5, 36.5, 140.6, 36.6]);
  await expect(view(page).locator('[data-places-none-here]')).toContainText('この範囲に保存した場所はありません');
  await expect(rows(page)).toHaveCount(0);
  await expect(meta).toHaveText('この範囲 0 · 全体 10件 · 同期 1時間前');
  await view(page).locator('[data-places-all]')[how]();
  await expect(rows(page)).toHaveCount(10);
  await expect(meta).toHaveText('10件 · 同期 1時間前');
  // the meta's この範囲 shows them all too
  await bounds(page, [139.69, 35.65, 139.71, 35.67]);
  await view(page).locator('[data-places-inview]')[how]();
  await expect(rows(page)).toHaveCount(10);
});

test('browse: a new view waits while the full list is scrolled, then applies at the top; the card stays open whatever the view', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context, 'A', { rows: manyPlaces(300) });
  await openPlaces(page, how);
  await field(page)[how]();
  await field(page).blur();
  await expect(view(page)).toHaveAttribute('data-sheet', 'full');
  const list = view(page).locator('[data-places-list]');
  await list.evaluate((el) => (el.scrollTop = 600));
  await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBe(600);
  await frames(page);
  const before = await rows(page).locator('.nmt').allTextContents();
  await bounds(page, [139.4, 35.5, 139.6, 35.7]);
  await frames(page);
  expect(await list.evaluate((el) => el.scrollTop)).toBe(600);
  expect(await rows(page).locator('.nmt').allTextContents()).toEqual(before);
  await list.evaluate((el) => (el.scrollTop = 0));
  await expect.poll(async () => (await view(page).locator('[data-places-meta]').textContent()) ?? '').toMatch(/^この範囲 \d+ \/ 300件/);
  // a card, then a view without it: still open
  await rows(page).first()[how]();
  const id = await card(page).getAttribute('data-place-card');
  await bounds(page, [140.5, 36.5, 140.6, 36.6]);
  await expect(card(page)).toHaveAttribute('data-place-card', id!);
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
    // (the sheet's height settled first: the vendored hold released AND its collapse tween done — settle() sees the
    // Web Animations; the old CSSTransition-only wait saw neither, and the grip moved mid-swipe)
    await expect(view(page).locator('.band-hold')).toHaveCount(0);
    await settle(page);
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

test('the full list pulled down from its top folds the sheet; a pull that starts mid-list, or first goes up, is the list’s', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context, 'A', { rows: manyPlaces(60) });
  await openPlaces(page, how);
  await field(page)[how]();
  await field(page).blur();
  await expect(view(page)).toHaveAttribute('data-sheet', 'full');
  const list = view(page).locator('[data-places-list]');
  /** A finger on the list (touch events' types, as iOS sends them), its moves in px from where it went down. */
  const pull = (steps: number[]) => list.evaluate((el, steps) => {
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + 120;
    // (WebKit's desktop build makes no Touch: an event with the touches the view reads)
    const fire = (type: string, dy: number) => {
      const e = new Event(type, { bubbles: true, cancelable: true });
      const t = [{ identifier: 1, target: el, clientX: x, clientY: y + dy }];
      Object.defineProperty(e, 'touches', { value: type === 'touchend' ? [] : t });
      el.dispatchEvent(e);
    };
    fire('touchstart', 0);
    for (const dy of steps) fire('touchmove', dy);
    fire('touchend', steps.at(-1) ?? 0);
  }, steps);
  // mid-list: the list's
  await list.evaluate((el) => (el.scrollTop = 300));
  await pull([20, 60, 120]);
  await expect(view(page)).toHaveAttribute('data-sheet', 'full');
  // at the top but first up: the list's
  await list.evaluate((el) => (el.scrollTop = 0));
  await pull([-20, 40, 120]);
  await expect(view(page)).toHaveAttribute('data-sheet', 'full');
  // at the top, down: folded
  await pull([20, 60, 120]);
  await expect(view(page)).toHaveAttribute('data-sheet', 'peek');
});

// The same with a real finger (Chromium's: the browser's own touch and scrolling, not events made in the page): the
// list scrolled, a pull down scrolls it back (the sheet stays); at its top, the pull folds the sheet.
test('a real finger on the full list: scrolled, a pull down scrolls it; at its top, folds the sheet', { tag: '@chromium' }, async ({ page, context }) => {
  await phone(page, context, 'A', { rows: manyPlaces(60) });
  await openPlaces(page, 'click');
  await field(page).click();
  await field(page).blur();
  await expect(view(page)).toHaveAttribute('data-sheet', 'full');
  const list = view(page).locator('[data-places-list]');
  const b = (await list.boundingBox())!;
  const [x, y] = [b.x + b.width / 2, b.y + 120];
  await list.evaluate((el) => (el.scrollTop = 300));
  await finger(page, x, y, [10, 30, 60, 90]);
  await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeLessThan(300);
  await expect(view(page)).toHaveAttribute('data-sheet', 'full');
  await list.evaluate((el) => (el.scrollTop = 0));
  await finger(page, x, y, [10, 30, 60, 90, 120]);
  await expect(view(page)).toHaveAttribute('data-sheet', 'peek');
});

test('the card: the hours line, the week view (today yuzu, 定休日), the note and its hint, 経路, コピー; 保存日', async ({ page, context }, info) => {
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
  // a note's words find nothing (left out: nothing else has them)
  await card(page).getByRole('button', { name: '戻る' })[how]();
  await field(page).fill('');
  await type(page, 'クロワッサン');
  await expect(view(page).locator('[data-places-meta]')).toContainText('“クロワッサン”は無視しました');
  await expect(view(page).locator('[data-place-why]')).toHaveCount(0);
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
  await expect(view(page).locator('[data-map-note]')).toHaveText('位置情報がオフです 設定 › アプリ › Safari › 位置情報 地図を長押しで地点を選べます');
  // the maps' two lines and places' hint: three, none broken at 393 px
  expect(await view(page).locator('[data-map-note]').evaluate((n) => Math.round((n.clientHeight - 12) / parseFloat(getComputedStyle(n).lineHeight)))).toBe(3);
  // the disc grey and struck through, as every map's (DECISIONS 1; the sheet folded: the full sheet has no disc)
  await field(page).blur();
  await view(page).locator('[data-sheet-grip]')[how]();
  await expect(view(page)).toHaveAttribute('data-sheet', 'peek');
  await expect(view(page).locator('.locate')).toHaveAttribute('data-locate', 'denied');
  await expect(view(page).locator('.locate .slash')).toHaveCount(1);
  await expect(rows(page)).toHaveCount(10); // (no location: nothing filtered)
});

test('an empty list', async ({ page, context }, info) => {
  await phone(page, context, 'A', { rows: [] });
  await openPlaces(page, howOf(info.project.name));
  await expect(view(page).locator('[data-places-empty]')).toHaveText('保存した場所はまだありません');
});

// The vendored card (Google details + photos: lib/places/vendored.ts): /places/index.json → one shard (まぼろし寺's
// detail: 2 pics of one sheet, hours, tel, web, desc, r/rn) → the sheet (fixtures/places: a 3200×1800 two-cell webp).
// No network: every path route-fulfilled.
const vfix = (f: string) => readFileSync(new URL(`./fixtures/places/${f}`, import.meta.url));
async function routeVendored(page: Page, on = true) {
  await page.route('**/places/index.json', (r) =>
    on ? r.fulfill({ status: 200, contentType: 'application/json', body: vfix('index.json') }) : r.fulfill({ status: 404, body: 'not found' }));
  if (!on) return;
  await page.route('**/places/d/0.0123abcd.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: vfix('shard.json') }));
  await page.route('**/places/img/c0.12345678.webp', (r) => r.fulfill({ status: 200, contentType: 'image/webp', body: vfix('card-sheet.webp') }));
}

test('the vendored card: the photo band and its dots, the rating, the line about it, its hours, ⋯ with 電話 and ウェブサイト', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context);
  await routeVendored(page);
  await openPlaces(page, how);
  await type(page, 'まぼろし'); // まぼろし寺: the relay's own has no hours and no website
  await rows(page).first()[how]();
  const c = card(page);
  await expect(c.locator('h2')).toHaveText('まぼろし寺');
  // the band: two cells of the one sheet, two pager dots
  await expect(c.locator('[data-place-photos]')).toBeVisible();
  await expect(c.locator('[data-place-photos] .cell')).toHaveCount(2);
  await expect(c.locator('[data-photo-dots] .dot')).toHaveCount(2);
  await expect(c.locator('[data-place-photos] .cell').first()).toHaveCSS('background-image', /c0\.12345678\.webp/);
  await expect(c.locator('[data-place-photos] .cred')).toHaveText('写真：Googleマップ');
  // the rating, the line about it, the hours filled in from the vendored week (12:00 Wednesday: open until 21:30)
  await expect(c.locator('[data-place-rating]')).toHaveText('★ 4.3 · 512件');
  await expect(c.locator('[data-place-desc]')).toContainText('浅草の静かな寺');
  await expect(c.locator('[data-hours]')).toHaveText('営業中 · 21:30まで');
  // ⋯: the vendored website and phone
  await c.locator('[data-place-more]')[how]();
  await expect(page.locator('dialog[open] [data-place-web]')).toHaveText('ウェブサイト');
  await expect(page.locator('dialog[open] [data-place-tel]')).toHaveText('電話 0312345678');
});

test('the vendored index missing (404): the card as ever, no console errors', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  // nothing our code logs (the vendored loader fails quietly); the browser's own "Failed to load resource" for a
  // refused fetch (the index's 404, the menu's status pings) isn't ours
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && !m.text().startsWith('Failed to load resource') && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await phone(page, context);
  await routeVendored(page, false);
  await openPlaces(page, how);
  await type(page, 'まぼろし');
  const asked = page.waitForResponse('**/places/index.json'); // (listened for before the tap: the refusal can beat the h2)
  await rows(page).first()[how]();
  const c = card(page);
  await expect(c.locator('h2')).toHaveText('まぼろし寺');
  // the index asked for and refused, the page's microtasks flushed (not a wall-clock wait): nothing vendored, the relay's (no hours) as ever
  await asked;
  await page.evaluate(() => Promise.resolve());
  await expect(c.locator('[data-hours]')).toHaveText('営業時間は不明');
  await expect(c.locator('[data-place-photos]')).toHaveCount(0);
  await expect(c.locator('[data-place-rating]')).toHaveCount(0);
  await expect(c.locator('[data-place-desc]')).toHaveCount(0);
  await c.locator('[data-place-more]')[how]();
  await expect(page.locator('dialog[open] [data-place-tel]')).toHaveCount(0);
  await expect(page.locator('dialog[open] [data-place-web]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
