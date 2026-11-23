// 保存した場所's search v2 in the UI (components/places PlacesView + PlacesFilter, docs/places.md "Search"): the ⇅ chip's
// 絞り込み sheet (live: 並び順, 営業 with 日時を指定, 評価, 距離, 保存日, 保存した人 + メモあり for members, ジャンル;
// the CTA's count), the quick chips with their counts, every active chip with ×, 条件を全部外す, the rows' rating
// (rn ≥ 5), kind and facet hours, the why-matched line, an empty search's relaxations, 入力の例, the ignored word;
// the overlap guard at the peek, the full sheet and the filter sheet; pictures day and night (SHOTS). Invented places
// and facets only (e2e/places.ts); taps in WebKit, clicks in Chromium.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { shot } from './shots.ts';
import { fixturePlaces, routePlaces } from './places.ts';
import { IPHONE, insets, noOverlaps, settle } from './overlap.ts';

test.use({ viewport: { width: 393, height: 852 } });
type Tap = 'tap' | 'click';
const howOf = (project: string): Tap => (project.startsWith('webkit') ? 'tap' : 'click');
const view = (p: Page) => p.locator('dialog[open] [data-places]');
const rows = (p: Page) => view(p).locator('[data-place-row]');
const field = (p: Page) => view(p).locator('[data-places-q]');
const qchips = (p: Page) => view(p).locator('[data-qchip]');
const sheet = (p: Page) => p.locator('dialog[open] [data-places-filter]');
const names = (p: Page) => rows(p).locator('.nmt').allTextContents();
const row = (p: Page, id: string) => view(p).locator(`[data-place-row="${id}"]`);

async function phone(page: Page, context: BrowserContext, o: { who?: 'A' | 'G'; date?: string } = {}) {
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await insets(page, IPHONE);
  const rec = newRecord();
  await rec.pair(context, o.who ?? 'A');
  // one of them saved by the other member (B), for 保存した人
  const rs = fixturePlaces().map((p) => (p.id === '104' ? { ...p, by: 1 } : p));
  await routePlaces(page, rs, { guest: o.who === 'G' });
  await page.goto(o.date ? `?date=${o.date}` : '');
  await islandUp(page);
}
async function openPlaces(page: Page, how: Tap) {
  await fromMenu(page, 'places', how);
  await expect(view(page)).toBeVisible();
  await expect(rows(page).first()).toBeVisible();
}
async function type(page: Page, s: string) {
  await field(page).focus();
  await field(page).pressSequentially(s);
}

test('絞り込み: the ⇅ chip opens it; 並び順, 営業 (日時を指定: a day and an hour), 評価, 距離, 保存日, 保存した人 and メモあり are chips at once, each with ×; the CTA counts and closes; 条件を全部外す', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context);
  await openPlaces(page, how);
  await view(page).locator('[data-sort]')[how]();
  const f = sheet(page);
  await expect(f).toBeVisible();
  await expect(page.locator('dialog[open][aria-label="絞り込み"]')).toBeVisible();
  const cta = page.locator('dialog[open] [data-places-filter-show]');
  await expect(cta).toHaveText('10件を表示');
  await shot(page, 'places-filter');
  // 並び順: 評価順 (the prior-weighted rating, the unrated last), 保存が新しい順 (NEW on the one saved yesterday)
  await f.locator('[data-sort-pick="rate"]')[how]();
  await expect(view(page).locator('[data-sort]')).toHaveText('評価順');
  expect((await names(page)).slice(0, 3)).toEqual(['まぼろし寺', 'テスト麺屋 いちばん', 'ためしカフェ']);
  await f.locator('[data-sort-pick="new"]')[how]();
  await expect(rows(page).first().locator('.nmt')).toHaveText('ためしカフェ');
  await expect(rows(page).first().locator('.tag.new')).toHaveText('NEW');
  // 営業: one at a time; 日時を指定 picks a day and an hour (19時 first), 終日 the day alone
  await f.locator('[data-hours-pick="open"]')[how]();
  await expect(qchips(page)).toHaveText(['営業中']);
  await expect(cta).toHaveText('5件を表示');
  await f.locator('[data-hours-pick="when"]')[how]();
  await expect(qchips(page)).toHaveText(['19時に営業']);
  await f.locator('[data-day-pick="6"]')[how]();
  await expect(qchips(page)).toHaveText(['土曜 19時に営業']);
  await f.locator('[data-hour-pick]').selectOption('21');
  await expect(qchips(page)).toHaveText(['土曜 21時に営業']);
  await f.locator('[data-hour-pick]').selectOption('-1');
  await expect(qchips(page)).toHaveText(['土曜営業']);
  await f.locator('[data-hours-pick="any"]')[how]();
  await expect(qchips(page)).toHaveCount(0);
  // 評価, 距離, 保存日: one each
  await f.locator('[data-filter="rate"] [data-pick="4.5"]')[how]();
  await expect(qchips(page)).toHaveText(['★4.5以上']);
  await expect(cta).toHaveText('3件を表示');
  await f.locator('[data-filter="rate"] [data-pick="4"]')[how]();
  await expect(qchips(page)).toHaveText(['★4.0以上']);
  await f.locator('[data-filter="radius"] [data-pick="500"]')[how]();
  await f.locator('[data-filter="recent"] [data-pick="7"]')[how]();
  await expect(qchips(page)).toHaveText(['★4.0以上', '半径 500 m', '最近7日に保存']);
  await expect(cta).toHaveText('1件を表示');
  await f.locator('[data-filter="recent"] [data-pick="any"]')[how]();
  await f.locator('[data-filter="radius"] [data-pick="any"]')[how]();
  // 保存した人 (the members' names) and メモあり
  await f.locator('[data-filter="by"] [data-pick="1"]')[how]();
  await expect(qchips(page)).toHaveText(['★4.0以上', 'Bの保存']);
  await expect(cta).toHaveText('1件を表示');
  await f.locator('[data-filter="by"] [data-pick="any"]')[how]();
  await f.locator('[data-filter-memo]')[how]();
  await expect(f.locator('[data-filter-memo]')).toHaveAttribute('aria-checked', 'true');
  await expect(qchips(page)).toHaveText(['★4.0以上', 'メモあり']);
  await expect(cta).toHaveText('1件を表示');
  // ジャンル: a top with its count, its subs under it
  await f.locator('[data-cat-pick="麺"]')[how]();
  await expect(f.locator('[data-sub-pick="ラーメン"]')).toBeVisible();
  await expect(qchips(page)).toHaveText(['★4.0以上', 'メモあり', '麺']);
  // the CTA closes it; the head's chips each with ×; 条件を全部外す (2 or more)
  await cta[how]();
  await expect(f).toHaveCount(0);
  await view(page).locator('[data-qchip="memo"]')[how]();
  await expect(qchips(page)).toHaveText(['★4.0以上', '麺']);
  await view(page).locator('[data-places-clear-all]')[how]();
  await expect(qchips(page)).toHaveCount(0);
  await expect(view(page).locator('[data-places-clear-all]')).toHaveCount(0);
  await expect(rows(page)).toHaveCount(10);
});

test('the guest’s 絞り込み: no 保存した人, no メモあり', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context, { who: 'G' });
  await openPlaces(page, how);
  await view(page).locator('[data-sort]')[how]();
  await expect(sheet(page).locator('[data-filter="rate"]')).toBeVisible();
  await expect(sheet(page).locator('[data-filter="by"]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-filter-memo]')).toHaveCount(0);
});

test('quick chips with their counts (営業中, ★4.5以上), gone once set; the rows: ★ (≥ 5 reviews), Google’s kind, hours from the facets; why a match: メモ：… / 説明：…', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context);
  await openPlaces(page, how);
  // 12:00 Wednesday: 5 open (サンプル山 by its facet hours), 3 rated 4.5 or more
  await expect(view(page).locator('[data-quick="open"] .n')).toHaveText('5');
  await expect(view(page).locator('[data-quick="rate"] .n')).toHaveText('3');
  await view(page).locator('[data-quick="rate"]')[how]();
  await expect(qchips(page)).toHaveText(['★4.5以上']);
  await expect(view(page).locator('[data-quick="rate"]')).toHaveCount(0);
  await expect(rows(page)).toHaveCount(3);
  await expect(view(page).locator('[data-quick="open"] .n')).toHaveText('2');
  await qchips(page).first()[how]();
  // the rating: one decimal, read out with its count; none under 5 reviews (仮想うどん店: 3)
  await expect(row(page, '101').locator('[data-row-rating]')).toHaveText('★4.6');
  await expect(row(page, '101').locator('[data-row-rating]')).toHaveAttribute('aria-label', '評価4.6、120件');
  await expect(row(page, '103').locator('[data-row-rating]')).toHaveCount(0);
  await expect(row(page, '101').locator('.sbt')).toHaveText(/^ラーメン店 · /);
  await expect(row(page, '106').locator('.sbt')).toHaveText(/^銭湯 · /); // (no kind: the sub)
  await expect(row(page, '108').locator('.hr')).toHaveText('営業中');
  // why: a note's word, a description's
  await type(page, '味玉');
  await expect(rows(page)).toHaveCount(1);
  await expect(row(page, '101').locator('[data-place-why]')).toHaveText('メモ：味玉を追加する');
  await field(page).fill('');
  await type(page, 'テラス');
  await expect(row(page, '104').locator('[data-place-why]')).toHaveText(/^説明：.*テラス/);
});

test('none found: each chip let go with what it would bring, the words alone; 条件を全部外す', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context);
  await openPlaces(page, how);
  // まぼろし寺 has no hours: open now finds none
  await type(page, '営業中 ');
  await type(page, '★4.5以上 ');
  await type(page, 'まぼろし');
  await expect(view(page).locator('[data-places-none]')).toBeVisible();
  await expect(view(page).locator('[data-places-relax="open"]')).toHaveText('営業中を外す · 1件');
  await expect(view(page).locator('[data-places-relax="text"]')).toHaveText('キーワードだけで探す · 1件');
  await field(page).blur();
  await shot(page, 'places-none');
  await view(page).locator('[data-places-relax="open"]')[how]();
  await expect(qchips(page)).toHaveText(['★4.5以上']);
  await expect(rows(page)).toHaveCount(1);
});

test('入力の例 on the focused empty field: a tap types it and reads it; a word that matches nothing is left out and said so', async ({ page, context }, info) => {
  const how = howOf(info.project.name);
  await phone(page, context);
  await openPlaces(page, how);
  await field(page)[how]();
  const ex = view(page).locator('[data-places-examples]');
  await expect(ex).toBeVisible();
  await expect(ex.locator('[data-places-example]')).toHaveCount(4);
  await shot(page, 'places-examples');
  await ex.locator('[data-places-example]').first()[how]();
  await expect(qchips(page)).toHaveText(['渋谷周辺', 'ラーメン']);
  await expect(field(page)).toBeFocused();
  await expect(ex).toHaveCount(0);
  await view(page).locator('[data-places-clear-all]')[how]();
  // a free word nothing has (the descriptions in): ignored, not an empty list
  await type(page, 'デート');
  await expect(view(page).locator('[data-places-meta]')).toContainText('“デート”は無視しました');
  await expect(rows(page)).toHaveCount(10);
});

for (const [tod, date] of [['day', '2026-11-04T12:00'], ['night', '2026-11-04T21:00']] as const) {
  test(`the overlap guard (${tod}): the peek with chips and 条件を全部外す, the full sheet, the filter sheet; the peek's height as before`, async ({ page, context }, info) => {
    const how = howOf(info.project.name);
    await phone(page, context, { date });
    await openPlaces(page, how);
    await settle(page);
    const peek0 = await view(page).locator('.sheet').evaluate((e) => e.getBoundingClientRect().height);
    await view(page).locator('[data-quick="rate"]')[how]();
    await view(page).locator('[data-cat="麺"]')[how]();
    await expect(view(page).locator('[data-places-clear-all]')).toBeVisible();
    await settle(page);
    expect(await view(page).locator('.sheet').evaluate((e) => e.getBoundingClientRect().height)).toBe(peek0);
    await shot(page, `places-peek-${tod}-${info.project.name}`);
    await noOverlaps(page, { insets: IPHONE });
    await field(page)[how]();
    await field(page).blur();
    await expect(view(page)).toHaveAttribute('data-sheet', 'full');
    await settle(page);
    await shot(page, `places-full-${tod}-${info.project.name}`);
    await noOverlaps(page, { insets: IPHONE });
    await view(page).locator('[data-sort]')[how]();
    await expect(sheet(page)).toBeVisible();
    await settle(page);
    await shot(page, `places-filter-${tod}-${info.project.name}`);
    await noOverlaps(page, { insets: IPHONE, allow: [{ check: 'target', sel: '[data-filter="cat"] .chip', why: 'the sheet scrolls: its last chips under the sticky 「N件を表示」 till scrolled' }] });
  });
}
