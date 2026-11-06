// けっこんしき (docs/wedding.md): the wedding board's sheet from the menu's pill, over the demo's made-up board
// (store/demo/rows.ts: the record's rows through the store, components/wedding/board.svelte.ts), on the unified kit: the
// banner (the photo under the countdown, the names' plate, the day, the rose ring with its percent and count, ⚙), the chips and their counts (pinned),
// the lifted sections and the months, ticking (a ticked row stays put), a row opened in place (its checklist ticked,
// who finished it, the old Sheet's tick in a soft line, 完了), 編集 and ＋ in a form sheet (every missing field said
// at once, the checklist renamed and grown, 削除 with とりけす), the letter (rendered safely, written with the format
// tools, 完了 over a keyboard; the draft kept through ✕; an unchanged save sends nothing; two phones' crossed saves:
// both versions, mine marked, これにする with とりけす, ふたつを合わせる), 設定 (names, ‹ right after typing, categories
// with とりけす, the deleted list, 完全に削除 after its ask) and the guest's read-only board (`?demo&as=G`). Logic tier:
// nothing here is drawn 3D. Pictures under SHOTS=<dir>.
import { expect, test, type Locator, type Page } from './fixtures.ts';
import { fromMenu, hudMenu, unfoldMenu } from './hud.ts';
import { islandQuery, islandUp } from './island.ts';
import { shot } from './shots.ts';

test.use({ viewport: { width: 393, height: 852 } });
const DAY = 'date=2026-11-06T12:00';
/** The board's sheet (its title bar, scroller, ＋ and tab bar). */
const root = (p: Page) => p.locator('dialog[open] .wd');
/** Its one scroller. */
const sheet = (p: Page) => p.locator('dialog[open] [data-wedding]');
const card = (p: Page, id: string) => sheet(p).locator(`[data-wed-task="${id}"]`);
const bar = (p: Page) => root(p).locator('.navbar');
/** The task form (a form sheet over the board). */
const form = (p: Page) => p.locator('dialog[open]:has(> .inner > [data-wed-form])');
const banner = (p: Page) => p.locator('dialog[open] .banner');
/** The animations on `el` played out. */
const played = (el: Locator) => el.evaluate((e) => Promise.all(e.getAnimations().map((a) => a.finished)));
/** The island as `as` (A, B or G), the board's sheet open from the menu and grown to its place (Sheet's pop: a box
 *  measured during it is scaled, CI run 42235342027's ＋ above the last row). */
async function board(p: Page, as = 'A') {
  await p.goto(islandQuery(`demo&as=${as}&${DAY}`));
  await fromMenu(p, 'wedding');
  await expect(sheet(p).locator('[data-wed-top]')).toBeVisible();
  await played(p.locator('dialog[open].full'));
}
/** A row opened, its slide over: a tap inside it mid-slide (the row clipped, scrolled into view and unscrolled as it
 *  grows) landed beside 編集. */
async function open(p: Page, id: string) {
  await card(p, id).locator('.head').click();
  await played(card(p, id).locator('.more'));
}
/** A banner just raised (`text`), slid in: a tap under it then waits for it to go instead of landing on it as it
 *  rises over the bottom rows (the dismissing tap of a 保存しました, not 編集: CI run 42235342027). */
async function bannerIn(p: Page, text: string) {
  await expect(banner(p)).toContainText(text);
  await played(banner(p));
}

test('the menu\'s けっこんしき opens the board over the island, with its ⚙ and ＋; ✕ closes it', async ({ page }) => {
  await board(page);
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(sheet(page).locator('[data-wed-top] [data-wed-gear]')).toBeVisible();
  await expect(root(page).locator('[data-wed-add]')).toBeVisible();
  await expect(root(page).locator('[data-wed-tab="plan"]')).toHaveAttribute('aria-current', 'page');
  await expect(sheet(page).locator('[data-wed-tick]').first()).toBeVisible();
  // our photo, in
  await expect.poll(() => sheet(page).locator('[data-wed-top] > img').evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBe(1200);
  await bar(page).locator('.close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(hudMenu(page)).toBeFocused();
});

test('the plan: the countdown, the ring, the chips\' counts, 期限切れ and 今月 lifted, the months, the wedding\'s month', async ({ page }) => {
  await board(page);
  await expect(sheet(page).locator('[data-wed-days]')).toHaveAttribute('data-wed-days', '336');
  await expect(sheet(page).locator('[data-wed-names]')).toHaveText('たろう & はなこ');
  // (2 done + 1/3 + 1/3 of 8)
  await expect(sheet(page).locator('[data-wed-progress]')).toHaveAttribute('data-wed-progress', '33');
  await expect(sheet(page).locator('[data-wed-top] [data-wed-progress]')).toHaveAccessibleName('準備 33%、8件中2件完了');
  await expect(sheet(page).locator('[data-wed-progress] [data-wed-tally]')).toHaveText('2 / 8');
  const counts = Object.fromEntries(await sheet(page).locator('[data-wed-filter]').evaluateAll((els) => els.map((e) => [e.getAttribute('data-wed-filter'), Number(e.getAttribute('data-count'))])));
  expect(counts).toEqual({ all: 8, overdue: 1, soon: 1, later: 4, done: 2 });
  // the chips in one row
  const ys = await sheet(page).locator('[data-wed-filter]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(ys).size).toBe(1);
  const groups = await sheet(page).locator('[data-wed-group]').evaluateAll((els) => els.map((e) => e.getAttribute('data-wed-group')));
  expect(groups).toEqual(['overdue', 'thisMonth', '2026-12', '2027-01', '2027-03', '2027-10']);
  await expect(sheet(page).locator('[data-wed-group="overdue"] [data-wed-task]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-wed-group="thisMonth"] h3')).toContainText('11月 · 今月');
  await expect(sheet(page).locator('[data-wed-group="2027-01"] h3')).toContainText('2027年 1月');
  await expect(sheet(page).locator('[data-wed-group="2027-03"] h3')).toHaveText(/^3月/);
  await expect(sheet(page).locator('[data-wed-group="2027-10"] h3')).toContainText('式の月');
  await expect(sheet(page).locator('[data-wed-group="2027-10"] [data-wed-group-tally]')).toHaveAttribute('data-wed-group-tally', '0/1');
});

test('finished rows: hidden under すべて, shown on asking; who finished one inside it, the old Sheet\'s in a soft line', async ({ page }) => {
  await board(page);
  await expect(card(page, 'wdemo01')).toHaveCount(0);
  await sheet(page).locator('[data-wed-showdone]').click();
  await expect(card(page, 'wdemo01')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('island.weddingDone'))).toBe('1');
  // who finished it, inside the opened row only: a member's, muted; the old Sheet's says so
  await open(page, 'wdemo09');
  await expect(card(page, 'wdemo09').locator('[data-wed-by="A"]')).toBeVisible();
  await open(page, 'wdemo01');
  await expect(card(page, 'wdemo01').locator('[data-wed-imported]')).toHaveText('前のボードで完了');
  await expect(card(page, 'wdemo09').locator('[data-wed-by]')).toHaveCount(0); // (one row open at a time)
  // the finished months come before 今月
  const all = await sheet(page).locator('[data-wed-group]').evaluateAll((els) => els.map((e) => e.getAttribute('data-wed-group')));
  expect(all.slice(0, 4)).toEqual(['overdue', '2026-10', 'thisMonth', '2026-12']);
  await shot(page, 'e2e-plan');
});

test('a slice: 期限切れ only, its heading counting its rows; the chips stay pinned as the plan scrolls', async ({ page }) => {
  await board(page);
  await sheet(page).locator('[data-wed-filter="overdue"]').click();
  await expect(sheet(page).locator('[data-wed-task]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-wed-group-tally]')).toHaveAttribute('data-wed-group-tally', '0/1');
  // the chips stay pinned as the plan scrolls
  await sheet(page).locator('[data-wed-filter="all"]').click();
  expect(await sheet(page).evaluate((el) => (el.scrollTo({ top: 600 }), el.scrollTop))).toBeGreaterThan(0);
  // the filters' band at the scroller's top (its chip inside it, under the band's padding)
  const top = (await sheet(page).boundingBox())!.y;
  await expect.poll(async () => Math.abs((await sheet(page).locator('.filters').boundingBox())!.y - top)).toBeLessThan(6);
  const chip = await sheet(page).locator('[data-wed-filter="soon"]').boundingBox();
  expect(chip!.height).toBeGreaterThanOrEqual(32);
  expect(chip!.y - top).toBeGreaterThanOrEqual(0);
  expect(chip!.y - top).toBeLessThan(20);
});

test('reopened, the plan is すべて again', async ({ page }) => {
  await board(page);
  await sheet(page).locator('[data-wed-filter="later"]').click();
  await bar(page).locator('.close').click();
  await fromMenu(page, 'wedding');
  await expect(sheet(page).locator('[data-wed-filter="all"]')).toHaveAttribute('aria-pressed', 'true');
});

test('ticking: the tick marks it done with my name, it stays where it was, the counts follow; again, it is open again', async ({ page }) => {
  await board(page);
  await sheet(page).locator('[data-wed-filter="soon"]').click();
  await sheet(page).locator('[data-wed-tick="wdemo03"]').click();
  await expect(card(page, 'wdemo03')).toHaveAttribute('data-done', 'true');
  await expect(sheet(page).locator('[data-wed-filter="done"]')).toHaveAttribute('data-count', '3');
  await expect(sheet(page).locator('[data-wed-filter="soon"]')).toHaveAttribute('data-count', '0');
  await expect(sheet(page).locator('[data-wed-task]')).toHaveCount(1); // (held where it was)
  await expect(sheet(page).locator('[data-wed-progress] [data-wed-tally]')).toHaveAttribute('data-wed-tally', '3/8');
  await open(page, 'wdemo03');
  await expect(card(page, 'wdemo03').locator('[data-wed-by="A"]')).toHaveText(/.が完了$/);
  await sheet(page).locator('[data-wed-tick="wdemo03"]').click();
  await expect(card(page, 'wdemo03')).not.toHaveAttribute('data-done', 'true');
  // choosing the filter again lets the held rows go
  await sheet(page).locator('[data-wed-tick="wdemo03"]').click();
  await sheet(page).locator('[data-wed-filter="all"]').click();
  await expect(card(page, 'wdemo03')).toHaveCount(0);
});

test('a row opens in place: its checklist ticks (links safe), 完了 and back', async ({ page }) => {
  await board(page);
  await open(page, 'wdemo02');
  await expect(card(page, 'wdemo02').locator('.head')).toHaveAttribute('aria-expanded', 'true');
  await expect(card(page, 'wdemo02').locator('[data-wed-title]')).toHaveText('招待客リストをつくる');
  // a URL in an item is a link, safely
  const link = sheet(page).locator('[data-wed-sub="wdemo02c"] a');
  await expect(link).toHaveAttribute('href', 'https://example.com/form');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAttribute('target', '_blank');
  await sheet(page).locator('[data-wed-sub-tick="wdemo02b"]').click();
  await expect(sheet(page).locator('[data-wed-sub="wdemo02b"]')).toHaveAttribute('data-done', 'true');
  await expect(card(page, 'wdemo02').locator('[data-wed-tally]')).toHaveAttribute('data-wed-tally', '2/3');
  // 完了 on the open row: done, then back
  await card(page, 'wdemo02').locator('[data-wed-page-tick]').click();
  await expect(card(page, 'wdemo02')).toHaveAttribute('data-done', 'true');
  await card(page, 'wdemo02').locator('[data-wed-page-tick]').click();
  await expect(card(page, 'wdemo02')).not.toHaveAttribute('data-done', 'true');
  await shot(page, 'e2e-task');
});

test('編集 in a form sheet: the title, category and checklist saved; ✕ changes nothing', async ({ page }) => {
  await board(page);
  await open(page, 'wdemo02');
  // the title and category changed, an item renamed, one added (Enter adds it, it doesn't save)
  await card(page, 'wdemo02').locator('[data-wed-edit]').click();
  await expect(form(page)).toBeVisible();
  await form(page).locator('[data-wed-field="title"]').fill('ゲストの リスト');
  await form(page).locator('[data-wed-cat-pick="Attire"]').click();
  await form(page).locator('[data-wed-sub-name="wdemo02a"]').fill('しんぞく');
  await form(page).locator('[data-wed-sub-field]').fill('せきの はいち');
  await form(page).locator('[data-wed-sub-field]').press('Enter');
  await expect(form(page)).toBeVisible();
  await expect(form(page).locator('[data-wed-sub-field]')).toHaveValue('');
  await shot(page, 'e2e-edit');
  await form(page).locator('[data-wed-save]').click();
  await expect(form(page)).toHaveCount(0);
  await expect(card(page, 'wdemo02').locator('[data-wed-title]')).toHaveText('ゲストの リスト');
  await expect(sheet(page).locator('[data-wed-sub="wdemo02a"]')).toContainText('しんぞく');
  await expect(card(page, 'wdemo02').locator('[data-wed-sub]')).toHaveCount(4);
  await expect(card(page, 'wdemo02').locator('[data-wed-tally]')).toHaveAttribute('data-wed-tally', '1/4');
  // ✕ changes nothing
  await card(page, 'wdemo02').locator('[data-wed-edit]').click();
  await form(page).locator('[data-wed-field="title"]').fill('べつの なまえ');
  await form(page).locator('.navbar .close').click();
  await expect(card(page, 'wdemo02').locator('[data-wed-title]')).toHaveText('ゲストの リスト');
});

test('削除 (in 編集): gone with its checklist; the banner\'s とりけす restores both', async ({ page }) => {
  await board(page);
  await open(page, 'wdemo02');
  await card(page, 'wdemo02').locator('[data-wed-edit]').click();
  await form(page).locator('[data-wed-remove]').click();
  await expect(form(page)).toHaveCount(0);
  await expect(card(page, 'wdemo02')).toHaveCount(0);
  await banner(page).locator('.act').click();
  await expect(card(page, 'wdemo02')).toBeVisible();
  await expect(card(page, 'wdemo02').locator('[data-wed-tally]')).toHaveAttribute('data-wed-tally', '1/3');
});

test('＋: a new task needs a title and a due day (both said at once); saved, it opens in its month', async ({ page }) => {
  await board(page);
  await root(page).locator('[data-wed-add]').click();
  await expect(form(page)).toBeVisible();
  await form(page).locator('[data-wed-save]').click();
  await expect(form(page).locator('[data-wed-error]')).toHaveCount(2);
  await form(page).locator('[data-wed-field="title"]').fill('ペーパーアイテムを たのむ');
  await form(page).locator('[data-wed-save]').click();
  await expect(form(page).locator('[data-wed-error]')).toHaveAttribute('data-wed-error', 'due');
  await form(page).locator('[data-wed-field="due"]').fill('2026-11-20');
  await form(page).locator('[data-wed-cat-pick="Stationery"]').click();
  await form(page).locator('[data-wed-sub-field]').fill('いろを えらぶ');
  await shot(page, 'e2e-new');
  await form(page).locator('[data-wed-save]').click();
  await expect(form(page)).toHaveCount(0);
  const row = sheet(page).locator('[data-wed-group="thisMonth"] [data-wed-task]', { hasText: 'ペーパーアイテムを たのむ' });
  await expect(row.locator('.head')).toHaveAttribute('aria-expanded', 'true');
  await expect(row.locator('[data-wed-sub]')).toHaveText('いろを えらぶ');
  await expect(banner(page)).toContainText('追加しました');
  await expect(sheet(page).locator('[data-wed-filter="all"]')).toHaveAttribute('data-count', '9');
});

test('the ＋ sits over the tab bar, clear of every row\'s tick (659 px tall)', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 659 });
  await board(page);
  const add = (await root(page).locator('[data-wed-add]').boundingBox())!;
  const tabs = (await root(page).locator('.tabbar').boundingBox())!;
  expect(add.y + add.height).toBeLessThanOrEqual(tabs.y);
  for (const tick of await sheet(page).locator('[data-wed-tick]').all()) {
    const b = await tick.boundingBox();
    if (b) expect(b.y >= add.y + add.height || b.y + b.height <= add.y || b.x >= add.x + add.width || b.x + b.width <= add.x).toBe(true);
  }
  // the last row scrolls clear of it
  await sheet(page).evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  const last = (await sheet(page).locator('[data-wed-task]').last().boundingBox())!;
  expect(last.y + last.height).toBeLessThanOrEqual(add.y);
  // the first row in view under the banner, its ring whole on the photo, clear of ⚙ and the type
  await sheet(page).evaluate((el) => el.scrollTo({ top: 0 }));
  const top = (await sheet(page).locator('[data-wed-top]').boundingBox())!;
  const ring = (await sheet(page).locator('[data-wed-progress]').boundingBox())!;
  const gear = (await sheet(page).locator('[data-wed-gear]').boundingBox())!;
  const days = (await sheet(page).locator('[data-wed-days]').boundingBox())!;
  expect(ring.height).toBeGreaterThanOrEqual(100);
  expect(ring.y).toBeGreaterThanOrEqual(gear.y + gear.height);
  expect(ring.y + ring.height).toBeLessThanOrEqual(top.y + top.height);
  expect(days.x + days.width).toBeLessThanOrEqual(ring.x);
  const first = (await sheet(page).locator('[data-wed-task]').first().boundingBox())!;
  expect(first.y + first.height).toBeLessThan(tabs.y);
  await shot(page, 'e2e-659');
});

test('メモ: the note as a letter, links safe; 編集 with the format tools, 完了', async ({ page }) => {
  await board(page);
  await root(page).locator('[data-wed-tab="notes"]').click();
  const doc = sheet(page).locator('[data-wed-letter] [data-wed-doc]');
  await expect(doc.locator('h4').first()).toHaveText('メモ');
  await expect(doc.locator('strong').first()).toHaveText('予算');
  await expect(doc.locator('script, img')).toHaveCount(0);
  for (const a of await doc.locator('a').all()) {
    await expect(a).toHaveAttribute('href', /^https:\/\//);
    await expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await shot(page, 'e2e-note');
  await sheet(page).locator('[data-wed-note-edit]').click();
  await expect(bar(page)).toContainText('メモを編集');
  await expect(root(page).locator('.tabbar')).toHaveCount(0); // (the tools take its place)
  const field = sheet(page).locator('[data-wed-note-field]');
  await field.fill('ケーキ');
  await field.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(0, 3));
  await sheet(page).locator('[data-wed-fmt="b"]').click();
  await expect(field).toHaveValue('**ケーキ**');
  await sheet(page).locator('[data-wed-fmt="ul"]').click();
  await expect(field).toHaveValue('- **ケーキ**');
  await field.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(el.value.length, el.value.length));
  await sheet(page).locator('[data-wed-fmt="link"]').click();
  await expect(field).toHaveValue('- **ケーキ**[リンク](https://)');
  await field.fill('- **ケーキ**');
  await sheet(page).locator('[data-wed-note-save]').click();
  await expect(doc.locator('li strong')).toHaveText('ケーキ');
  await expect(root(page).locator('.tabbar')).toBeVisible();
  await expect(sheet(page)).toContainText(/\d+月\d+日\(.\)に.+が更新/);
  await expect(banner(page)).toContainText('保存しました');
});

test('メモ being written: キャンセル in the title bar, ✕ keeps the draft, 完了 in reach over a keyboard', async ({ page }) => {
  await board(page);
  await root(page).locator('[data-wed-tab="notes"]').click();
  await sheet(page).locator('[data-wed-note-edit]').click();
  await expect(bar(page).locator('[data-wed-note-cancel]')).toBeVisible();
  await sheet(page).locator('[data-wed-note-field]').fill('まだ とちゅう');
  await bar(page).locator('.close').click();
  await fromMenu(page, 'wedding');
  await expect(sheet(page).locator('[data-wed-note-field]')).toHaveValue('まだ とちゅう');
  // a keyboard's worth less screen: 完了 still on it
  await page.setViewportSize({ width: 393, height: 420 });
  await sheet(page).locator('[data-wed-note-field]').focus();
  await expect(sheet(page).locator('[data-wed-note-save]')).toBeInViewport({ ratio: 1 });
  await shot(page, 'e2e-note-keyboard');
  await sheet(page).locator('[data-wed-note-save]').click();
  await expect(sheet(page).locator('[data-wed-letter]')).toContainText('まだ とちゅう');
  // キャンセル: the note as it was
  await sheet(page).locator('[data-wed-note-edit]').click();
  await sheet(page).locator('[data-wed-note-field]').fill('やめる ぶん');
  await bar(page).locator('[data-wed-note-cancel]').click();
  await expect(sheet(page).locator('[data-wed-letter]')).toContainText('まだ とちゅう');
});

test('two phones\' saves crossed: both versions under their writers, これにする keeps one and settles it', async ({ page, context }) => {
  await board(page, 'A');
  await root(page).locator('[data-wed-tab="notes"]').click();
  await sheet(page).locator('[data-wed-note-edit]').click();
  await sheet(page).locator('[data-wed-note-field]').fill('# かいじょう\n- **もりの チャペル** に へんこう？');
  // meanwhile B's phone saves its own (the demo's taps are both players', shared by their tabs)
  const b = await context.newPage();
  await board(b, 'B');
  await root(b).locator('[data-wed-tab="notes"]').click();
  await sheet(b).locator('[data-wed-note-edit]').click();
  await sheet(b).locator('[data-wed-note-field]').fill('- はなぞの テラス');
  await sheet(b).locator('[data-wed-note-save]').click();
  await expect(sheet(b).locator('[data-wed-letter]')).toContainText('はなぞの テラス');
  await b.close();
  // A saves over the version it began from: kept, the held one beside it
  await sheet(page).locator('[data-wed-note-save]').click();
  await expect(sheet(page).locator('[data-wed-conflict]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-version]')).toHaveCount(2);
  await expect(sheet(page).locator('[data-wed-version="current"]')).toHaveAttribute('data-wed-who', 'A');
  await expect(sheet(page).locator('[data-wed-version="other"]')).toHaveAttribute('data-wed-who', 'B');
  await expect(sheet(page).locator('[data-wed-version="current"] [data-wed-mine]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-version="other"] [data-wed-mine]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-wed-note-edit]')).toHaveCount(0); // (choose first)
  await expect(banner(page)).toHaveCount(0); // (no 保存しました: it crossed)
  await shot(page, 'e2e-conflict');
  // これにする, then とりけす: both again
  await sheet(page).locator('[data-wed-pick="other"]').click();
  await expect(sheet(page).locator('[data-wed-letter]')).toContainText('はなぞの テラス');
  await banner(page).locator('.act').click();
  await expect(sheet(page).locator('[data-wed-version]')).toHaveCount(2);
  // ふたつを合わせる: the editor with both
  await sheet(page).locator('[data-wed-merge]').click();
  const field = sheet(page).locator('[data-wed-note-field]');
  await expect(field).toHaveValue(/はなぞの テラス[\s\S]*もりの チャペル/);
  await sheet(page).locator('[data-wed-note-save]').click();
  await expect(sheet(page).locator('[data-wed-conflict]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-wed-letter]')).toContainText('はなぞの テラス');
  await expect(sheet(page).locator('[data-wed-letter]')).toContainText('もりの チャペル');
});

test('a note saved unchanged after the other phone\'s save sends nothing (no conflict)', async ({ page, context }) => {
  await board(page, 'A');
  await root(page).locator('[data-wed-tab="notes"]').click();
  await sheet(page).locator('[data-wed-note-edit]').click();
  const b = await context.newPage();
  await board(b, 'B');
  await root(b).locator('[data-wed-tab="notes"]').click();
  await sheet(b).locator('[data-wed-note-edit]').click();
  await sheet(b).locator('[data-wed-note-field]').fill('- はなぞの テラス');
  await sheet(b).locator('[data-wed-note-save]').click();
  await b.close();
  await sheet(page).locator('[data-wed-note-save]').click();
  await expect(sheet(page).locator('[data-wed-letter]')).toContainText('はなぞの テラス');
  await expect(sheet(page).locator('[data-wed-conflict]')).toHaveCount(0);
});

test('設定: the names, a category added and removed, a deleted task restored, 完全に削除 after its ask', async ({ page }) => {
  await board(page);
  await sheet(page).locator('[data-wed-gear]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'settings');
  await expect(bar(page)).toContainText('設定');
  await expect(root(page).locator('.tabbar, [data-wed-add]')).toHaveCount(0);
  await sheet(page).locator('[data-wed-set="venue"]').fill('も'.repeat(150));
  await sheet(page).locator('[data-wed-set="venue"]').blur();
  await expect(sheet(page).locator('[data-wed-set="venue"]')).toHaveValue('も'.repeat(150));
  await sheet(page).locator('[data-wed-cat-field]').fill('ドリンク');
  await sheet(page).locator('[data-wed-cat-add]').click();
  await expect(sheet(page).locator('[data-wed-cat="ドリンク"]')).toBeVisible();
  // a category removed: とりけす brings it back
  await sheet(page).locator('[data-wed-cat-remove="Photo"]').click();
  await expect(sheet(page).locator('[data-wed-cat="Photo"]')).toHaveCount(0);
  await expect(banner(page)).toContainText('1件');
  await banner(page).locator('.act').click();
  await expect(sheet(page).locator('[data-wed-cat="Photo"]')).toBeVisible();
  await sheet(page).locator('[data-wed-cat-remove="Beauty"]').click();
  await bannerIn(page, 'Beauty');
  await expect(sheet(page).locator('[data-wed-cat="Beauty"]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-wed-deleted]')).toHaveCount(1);
  await shot(page, 'e2e-settings');
  await sheet(page).locator('[data-wed-restore="wdemo07"]').click();
  await expect(sheet(page).locator('[data-wed-deleted]')).toHaveCount(0);
  // ‹ right after typing (no blur first): the name saved, the board still open, home
  await sheet(page).locator('[data-wed-set="p1"]').fill('たろうさん');
  await bar(page).locator('.back').click();
  await bannerIn(page, '保存しました');
  await expect(sheet(page)).toHaveAttribute('data-level', 'home');
  await expect(sheet(page).locator('[data-wed-names]')).toHaveText('たろうさん & はなこ');
  await expect(card(page, 'wdemo07')).toBeVisible();
  // delete it again, then for good
  await open(page, 'wdemo07');
  await card(page, 'wdemo07').locator('[data-wed-edit]').click();
  await form(page).locator('[data-wed-remove]').click();
  await sheet(page).locator('[data-wed-gear]').click();
  await sheet(page).locator('[data-wed-purge]').click();
  const ask = page.locator('dialog[open]:has(> .inner > .acts)');
  await expect(ask).toContainText('1件');
  await shot(page, 'e2e-purge');
  await ask.locator('[data-action="purge"]').click();
  await expect(ask).toHaveCount(0);
  await expect(sheet(page).locator('[data-wed-deleted]')).toHaveCount(0);
});

test('the guest reads everything and has nothing to tick or edit', async ({ page }) => {
  await board(page, 'G');
  await expect(sheet(page)).toHaveAttribute('data-guest', 'true');
  // the same banner, read-only
  await expect(sheet(page).locator('[data-wed-days]')).toHaveAttribute('data-wed-days', '336');
  await expect(sheet(page).locator('[data-wed-top] [data-wed-progress]')).toHaveAttribute('data-wed-progress', '33');
  await expect(card(page, 'wdemo02')).toBeVisible();
  await expect(root(page).locator(':is([data-wed-tick], [data-wed-add], [data-wed-gear])')).toHaveCount(0);
  await sheet(page).locator('[data-wed-showdone]').click();
  await expect(card(page, 'wdemo09').locator('[data-wed-mark]')).toBeVisible();
  await open(page, 'wdemo02');
  await expect(card(page, 'wdemo02').locator('[data-wed-sub]')).toHaveCount(3);
  await expect(root(page).locator('[data-wed-edit], [data-wed-page-tick], [data-wed-sub-tick]')).toHaveCount(0);
  await shot(page, 'e2e-guest-task');
  await root(page).locator('[data-wed-tab="notes"]').click();
  await expect(sheet(page).locator('[data-wed-letter]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-note-edit]')).toHaveCount(0);
});

test('the island paused under the board; offline before the first opening: the banner, もういちど opens it once back', async ({ page, context }) => {
  await page.goto(islandQuery(`demo&${DAY}`));
  await islandUp(page);
  await context.setOffline(true);
  await unfoldMenu(page);
  await page.locator('[data-hud-wedding]').click();
  await expect(page.getByText('オフラインです')).toBeVisible();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await context.setOffline(false);
  // Chromium fetches the chunk again; WebKit keeps a failed import for the page's life, so it reloads: the pill again
  const how = Promise.race([page.waitForEvent('load').then(() => 'reload'), sheet(page).waitFor().then(() => 'open')]);
  await page.getByRole('button', { name: 'もういちど' }).click();
  if ((await how) === 'reload') await fromMenu(page, 'wedding');
  await expect(sheet(page).locator('[data-wed-top]')).toBeVisible();
  await expect(page.locator('[data-covered][data-sheet]')).toHaveCount(1);
});
