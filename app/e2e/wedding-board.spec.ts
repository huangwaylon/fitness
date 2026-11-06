// けっこんしき (docs/wedding.md): the wedding board's sheet from the menu's pill, over the demo's made-up board
// (store/demo/rows.ts: the record's rows through the store, components/wedding/board.svelte.ts): the countdown and the
// bouquet, the chips and their counts, the lifted sections and the months, ticking (a ticked row stays put), the old
// Sheet's tick (「むかしの きろく」), a task's page (its checklist, ✎, 🗑 with とりけす), ＋, the note (rendered safely,
// written with the format buttons; two phones' crossed saves: both versions, これに する), せってい (names, categories, the
// deleted list, ぜんぶ けす after its ask) and the guest's read-only board (`?demo&as=G`). Logic tier: nothing here is
// drawn 3D. WED_SHOTS=1 saves screenshots to /tmp/wedding-ui-shots/.
import { expect, test, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const DAY = 'date=2026-11-06T12:00';
const sheet = (p: Page) => p.locator('dialog[open] [data-wedding]');
const card = (p: Page, id: string) => sheet(p).locator(`[data-wed-task="${id}"]`);
/** The island as `as` (A, B or G), the board's sheet open from the menu. */
async function board(p: Page, as = 'A') {
  await p.goto(`?demo&as=${as}&${DAY}&critter=none&visitor=none`);
  await fromMenu(p, 'wedding');
  await expect(sheet(p).locator('[data-wed-top]')).toBeVisible();
}
const shot = async (p: Page, name: string) => {
  if (!process.env.WED_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path: `/tmp/wedding-ui-shots/${name}.png` });
};

test('the menu\'s けっこんしき opens the board over the island, with its ⚙ and ＋; ✕ closes it', async ({ page }) => {
  await board(page);
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('dialog[open] [data-wed-gear]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-add]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-tick]').first()).toBeVisible();
  await page.locator('dialog[open] .titlebar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(hudMenu(page)).toBeFocused();
});

test('the plan: the countdown, the bouquet, the chips\' counts, 期限切れ and こんげつ lifted, the months, the wedding\'s month', async ({ page }) => {
  await board(page);
  await expect(sheet(page).locator('[data-wed-days]')).toHaveAttribute('data-wed-days', '160');
  await expect(sheet(page).locator('[data-wed-names]')).toHaveText('たろう ＆ はなこ');
  // (2 done + 1/3 + 1/3 of 8)
  await expect(sheet(page).locator('[data-wed-progress]')).toHaveAttribute('data-wed-progress', '33');
  await expect(sheet(page).locator('[data-wed-top] [data-wed-tally]')).toHaveText('2 / 8');
  await expect(sheet(page).locator('[data-wed-greet]')).toBeVisible(); // (the day's first opening)
  const counts = Object.fromEntries(await sheet(page).locator('[data-wed-filter]').evaluateAll((els) => els.map((e) => [e.getAttribute('data-wed-filter'), Number(e.getAttribute('data-count'))])));
  expect(counts).toEqual({ all: 8, overdue: 1, soon: 1, later: 4, done: 2 });
  // the five chips in one row at 393
  const ys = await sheet(page).locator('[data-wed-filter]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(ys).size).toBe(1);
  const groups = await sheet(page).locator('[data-wed-group]').evaluateAll((els) => els.map((e) => e.getAttribute('data-wed-group')));
  expect(groups).toEqual(['overdue', 'thisMonth', '2026-12', '2027-01', '2027-03', '2027-04']);
  await expect(sheet(page).locator('[data-wed-group="overdue"] [data-wed-task]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-wed-group="2027-04"]')).toHaveClass(/wedding/);
  await expect(sheet(page).locator('[data-wed-group="2027-04"] [data-wed-group-tally]')).toHaveAttribute('data-wed-group-tally', '0/1');
  // finished rows hidden under すべて; shown on asking (kept on this phone): the old Sheet's tick and a member's
  await expect(card(page, 'wdemo01')).toHaveCount(0);
  await sheet(page).locator('[data-wed-showdone]').click();
  await expect(card(page, 'wdemo01').locator('[data-wed-imported]')).toBeVisible();
  await expect(card(page, 'wdemo09').locator('[data-wed-by="A"]')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('island.weddingDone'))).toBe('1');
  await shot(page, 'e2e-plan');
  // a slice: 期限切れ only, no month tallies under it
  await sheet(page).locator('[data-wed-filter="overdue"]').click();
  await expect(sheet(page).locator('[data-wed-task]')).toHaveCount(1);
  await expect(sheet(page).locator('[data-wed-group-tally]')).toHaveCount(0);
});

test('ticking: the ✓ marks it done with my chip, it stays where it was, the counts follow; again, it is open again', async ({ page }) => {
  await board(page);
  await sheet(page).locator('[data-wed-filter="soon"]').click();
  await sheet(page).locator('[data-wed-tick="wdemo03"]').click();
  await expect(card(page, 'wdemo03')).toHaveAttribute('data-done', 'true');
  await expect(card(page, 'wdemo03').locator('[data-wed-by="A"]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-filter="done"]')).toHaveAttribute('data-count', '3');
  await expect(sheet(page).locator('[data-wed-filter="soon"]')).toHaveAttribute('data-count', '0');
  await expect(sheet(page).locator('[data-wed-task]')).toHaveCount(1); // (held where it was)
  await expect(sheet(page).locator('[data-wed-top] [data-wed-tally]')).toHaveText('3 / 8');
  await sheet(page).locator('[data-wed-tick="wdemo03"]').click();
  await expect(card(page, 'wdemo03')).not.toHaveAttribute('data-done', 'true');
  // choosing the filter again lets the held rows go
  await sheet(page).locator('[data-wed-tick="wdemo03"]').click();
  await sheet(page).locator('[data-wed-filter="all"]').click();
  await expect(card(page, 'wdemo03')).toHaveCount(0);
});

test('a task\'s page: the checklist ticks and grows, ✎ saves its fields, 🗑 deletes it with its checklist and とりけす brings it back', async ({ page }) => {
  await board(page);
  await card(page, 'wdemo02').locator('.head').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'task');
  await expect(sheet(page).locator('[data-wed-title]')).toHaveText('招待客リストをつくる');
  // a URL in an item is a link, safely
  const link = sheet(page).locator('[data-wed-sub="wdemo02c"] a');
  await expect(link).toHaveAttribute('href', 'https://example.com/form');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAttribute('target', '_blank');
  await sheet(page).locator('[data-wed-sub-tick="wdemo02b"]').click();
  await expect(sheet(page).locator('[data-wed-sub="wdemo02b"]')).toHaveAttribute('data-done', 'true');
  await sheet(page).locator('[data-wed-sub-field]').fill('せきの はいち');
  await sheet(page).locator('[data-wed-sub-add]').click();
  await expect(sheet(page).locator('[data-wed-sub]')).toHaveCount(4);
  await expect(sheet(page).locator('[data-wed-sub-field]')).toHaveValue('');
  await expect(sheet(page).locator('#wed-cl')).toContainText('2 / 4');
  await shot(page, 'e2e-task');
  // ✎: the fields; ほぞん with the name and category changed
  await sheet(page).locator('[data-wed-edit]').click();
  await sheet(page).locator('[data-wed-field="title"]').fill('ゲストの リスト');
  await sheet(page).locator('[data-wed-field="cat"]').selectOption('Attire');
  await sheet(page).locator('[data-wed-save]').click();
  await expect(sheet(page).locator('[data-wed-title]')).toHaveText('ゲストの リスト');
  // 🗑 (in ✎): gone with its checklist, home; the banner's とりけす restores both
  await sheet(page).locator('[data-wed-edit]').click();
  await sheet(page).locator('[data-wed-remove]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'home');
  await expect(card(page, 'wdemo02')).toHaveCount(0);
  await page.locator('dialog[open] .banner .act').click();
  await expect(card(page, 'wdemo02')).toBeVisible();
  await expect(card(page, 'wdemo02')).toContainText('Attire');
  await expect(card(page, 'wdemo02').locator('[data-wed-tally]')).toHaveAttribute('data-wed-tally', '2/4');
  // ‹ back from a page
  await card(page, 'wdemo04').locator('.head').click();
  await page.locator('dialog[open] .titlebar .back').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'home');
});

test('＋: a new task needs a name and a due day', async ({ page }) => {
  await board(page);
  await sheet(page).locator('[data-wed-add]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'new');
  await sheet(page).locator('[data-wed-save]').click();
  await expect(sheet(page).locator('[data-wed-error]')).toHaveAttribute('data-wed-error', 'title');
  await sheet(page).locator('[data-wed-field="title"]').fill('ペーパーアイテムを たのむ');
  await sheet(page).locator('[data-wed-save]').click();
  await expect(sheet(page).locator('[data-wed-error]')).toHaveAttribute('data-wed-error', 'due');
  await sheet(page).locator('[data-wed-field="due"]').fill('2026-11-20');
  await sheet(page).locator('[data-wed-field="cat"]').selectOption('Stationery');
  await sheet(page).locator('[data-wed-save]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'home');
  await expect(sheet(page).locator('[data-wed-group="thisMonth"]')).toContainText('ペーパーアイテムを たのむ');
  await expect(sheet(page).locator('[data-wed-filter="all"]')).toHaveAttribute('data-count', '9');
});

test('メモ: the note as a letter, links safe; かく with the format buttons, ほぞん', async ({ page }) => {
  await board(page);
  await sheet(page).locator('[data-wed-tab="notes"]').click();
  const doc = sheet(page).locator('[data-wed-letter] [data-wed-doc]');
  await expect(doc.locator('h4')).toHaveText('メモ');
  await expect(doc.locator('strong').first()).toHaveText('予算');
  await expect(doc.locator('script, img')).toHaveCount(0);
  for (const a of await doc.locator('a').all()) {
    await expect(a).toHaveAttribute('href', /^https:\/\//);
    await expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  }
  await shot(page, 'e2e-note');
  await sheet(page).locator('[data-wed-note-edit]').click();
  await expect(sheet(page).locator('[data-wed-top]')).toHaveCount(0); // (the field has the room)
  const field = sheet(page).locator('[data-wed-note-field]');
  await field.fill('ケーキ');
  await field.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(0, 3));
  await sheet(page).locator('[data-wed-fmt="b"]').click();
  await expect(field).toHaveValue('**ケーキ**');
  await sheet(page).locator('[data-wed-fmt="ul"]').click();
  await expect(field).toHaveValue('- **ケーキ**');
  await sheet(page).locator('[data-wed-note-save]').click();
  await expect(doc.locator('li strong')).toHaveText('ケーキ');
  await expect(sheet(page).locator('[data-wed-top]')).toBeVisible();
});

test('two phones\' saves crossed: both versions under their writers, これに する keeps one and settles it', async ({ page, context }) => {
  await board(page, 'A');
  await sheet(page).locator('[data-wed-tab="notes"]').click();
  await sheet(page).locator('[data-wed-note-edit]').click();
  await sheet(page).locator('[data-wed-note-field]').fill('# かいじょう\n- **もりの チャペル** に へんこう？');
  // meanwhile B's phone saves its own (the demo's taps are both players', shared by their tabs)
  const b = await context.newPage();
  await board(b, 'B');
  await sheet(b).locator('[data-wed-tab="notes"]').click();
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
  await shot(page, 'e2e-conflict');
  await sheet(page).locator('[data-wed-pick="other"]').click();
  await expect(sheet(page).locator('[data-wed-conflict]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-wed-letter]')).toContainText('はなぞの テラス');
});

test('せってい: the names, a category added and removed, a deleted task restored, ぜんぶ けす after its ask', async ({ page }) => {
  await board(page);
  await page.locator('dialog[open] [data-wed-gear]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'settings');
  await sheet(page).locator('[data-wed-set="p1"]').fill('たろうさん');
  await sheet(page).locator('[data-wed-set="p1"]').blur();
  await sheet(page).locator('[data-wed-cat-field]').fill('ドリンク');
  await sheet(page).locator('[data-wed-cat-add]').click();
  await expect(sheet(page).locator('[data-wed-cat="ドリンク"]')).toBeVisible();
  await sheet(page).locator('[data-wed-cat-remove="Beauty"]').click();
  await expect(sheet(page).locator('[data-wed-cat="Beauty"]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-wed-deleted]')).toHaveCount(1);
  await sheet(page).locator('[data-wed-restore="wdemo07"]').click();
  await expect(sheet(page).locator('[data-wed-deleted]')).toHaveCount(0);
  await page.locator('dialog[open] .titlebar .back').click();
  await expect(sheet(page).locator('[data-wed-names]')).toHaveText('たろうさん ＆ はなこ');
  await expect(card(page, 'wdemo07')).toBeVisible();
  // delete it again, then for good
  await card(page, 'wdemo07').locator('.head').click();
  await sheet(page).locator('[data-wed-edit]').click();
  await sheet(page).locator('[data-wed-remove]').click();
  await page.locator('dialog[open] [data-wed-gear]').click();
  await sheet(page).locator('[data-wed-purge]').click();
  const ask = page.locator('dialog[open] [data-wed-purge-ask]');
  await expect(ask).toContainText('1こ');
  await shot(page, 'e2e-purge');
  await page.locator('dialog[open] [data-wed-purge-yes]').click();
  await expect(ask).toHaveCount(0);
  await expect(sheet(page).locator('[data-wed-deleted]')).toHaveCount(0);
});

test('the guest reads everything and has nothing to tick or edit', async ({ page }) => {
  await board(page, 'G');
  await expect(sheet(page)).toHaveAttribute('data-guest', 'true');
  await expect(card(page, 'wdemo02')).toBeVisible();
  await expect(page.locator('dialog[open] :is([data-wed-tick], [data-wed-add], [data-wed-gear])')).toHaveCount(0);
  await sheet(page).locator('[data-wed-showdone]').click();
  await expect(card(page, 'wdemo09').locator('[data-wed-mark]')).toBeVisible();
  await card(page, 'wdemo02').locator('.head').click();
  await expect(sheet(page).locator('[data-wed-sub]')).toHaveCount(3);
  await expect(sheet(page).locator('[data-wed-edit], [data-wed-page-tick], [data-wed-sub-tick], [data-wed-sub-field]')).toHaveCount(0);
  await shot(page, 'e2e-guest-task');
  await page.locator('dialog[open] .titlebar .back').click();
  await sheet(page).locator('[data-wed-tab="notes"]').click();
  await expect(sheet(page).locator('[data-wed-letter]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-note-edit]')).toHaveCount(0);
});

test('パニエル\'s line: the day\'s first opening only', async ({ page }) => {
  await board(page);
  await expect(sheet(page).locator('[data-wed-greet]')).toBeVisible();
  await page.reload();
  await fromMenu(page, 'wedding');
  await expect(sheet(page).locator('[data-wed-top]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-greet]')).toHaveCount(0);
});
