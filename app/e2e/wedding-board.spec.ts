// けっこんしき (docs/wedding.md): the wedding board's sheet. The menu's pill opens it on the island (`?demo`: the store
// isn't wired yet, so the empty board); the dev page (routes/dev/wedding, `?demo`) shows it over the invented board
// (components/wedding/fixtures/board.ts), editable as the store would be: the chips and their counts, the lifted
// sections and the months, ticking (a ticked row stays put), a task's page (its checklist, ✎, 🗑 with とりけす), ＋,
// the note (rendered safely, written with the format buttons, a conflict's two versions), せってい (names, categories,
// the deleted list, ぜんぶ けす after its ask) and the guest's read-only board. Logic tier: nothing here is drawn 3D.
// WED_SHOTS=1 saves screenshots to /tmp/wedding-ui-shots/.
import { expect, test, type Page } from '@playwright/test';
import { fromMenu, hudMenu } from './hud.ts';

test.use({ viewport: { width: 393, height: 852 } });
const DAY = 'date=2026-11-06T12:00';
const sheet = (p: Page) => p.locator('dialog[open] [data-wedding]');
const card = (p: Page, id: string) => sheet(p).locator(`[data-wed-task="${id}"]`);
async function dev(p: Page, q = '') {
  await p.goto(`dev/wedding?demo&${DAY}${q}`);
  await expect(sheet(p)).toBeVisible();
}
const shot = async (p: Page, name: string) => {
  if (!process.env.WED_SHOTS) return;
  await expect(p.locator('dialog[open] [data-typing="true"]')).toHaveCount(0);
  await p.screenshot({ path: `/tmp/wedding-ui-shots/${name}.png` });
};

test('the menu\'s けっこんしき opens the board\'s sheet over the island (the empty board until the store is wired); ✕ closes it', async ({ page }) => {
  await page.goto(`?demo&${DAY}&critter=none&visitor=none`);
  await expect(hudMenu(page)).toBeVisible();
  await fromMenu(page, 'wedding');
  await expect(hudMenu(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(sheet(page).locator('[data-wed-empty]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-top]')).toBeVisible();
  // nothing to act on yet: no ⚙, no ＋
  await expect(page.locator('dialog[open] [data-wed-gear], dialog[open] [data-wed-add]')).toHaveCount(0);
  await page.locator('dialog[open] .titlebar .close').click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(hudMenu(page)).toBeFocused();
});

test('the guest\'s menu has it too', async ({ page }) => {
  await page.goto(`?demo&as=G&${DAY}&critter=none&visitor=none`);
  await fromMenu(page, 'wedding');
  await expect(sheet(page)).toHaveAttribute('data-guest', 'true');
});

test('a member\'s board has its ⚙ and ＋', async ({ page }) => {
  await dev(page);
  await expect(page.locator('dialog[open] [data-wed-gear]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-add]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-tick]').first()).toBeVisible();
});

test('the plan: the countdown, the bouquet, the chips\' counts, 期限切れ and こんげつ lifted, the months, the wedding\'s month', async ({ page }) => {
  await dev(page);
  await expect(sheet(page).locator('[data-wed-days]')).toHaveAttribute('data-wed-days', '225');
  await expect(sheet(page).locator('[data-wed-names]')).toHaveText('ハル ＆ ミオ');
  await expect(sheet(page).locator('[data-wed-progress]')).toHaveAttribute('data-wed-progress', '31');
  await expect(sheet(page).locator('[data-wed-top] [data-wed-tally]')).toHaveText('6 / 24');
  await expect(sheet(page).locator('[data-wed-greet]')).toBeVisible(); // (the day's first opening)
  const counts = Object.fromEntries(await sheet(page).locator('[data-wed-filter]').evaluateAll((els) => els.map((e) => [e.getAttribute('data-wed-filter'), Number(e.getAttribute('data-count'))])));
  expect(counts).toEqual({ all: 24, overdue: 2, soon: 2, later: 12, done: 6 });
  // the five chips in one row at 393
  const ys = await sheet(page).locator('[data-wed-filter]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(new Set(ys).size).toBe(1);
  const groups = await sheet(page).locator('[data-wed-group]').evaluateAll((els) => els.map((e) => e.getAttribute('data-wed-group')));
  expect(groups.slice(0, 2)).toEqual(['overdue', 'thisMonth']);
  expect(groups.at(-1)).toBe('nodate');
  await expect(sheet(page).locator('[data-wed-group="overdue"] [data-wed-task]')).toHaveCount(2);
  await expect(sheet(page).locator('[data-wed-group="2027-06"]')).toHaveClass(/wedding/);
  await expect(sheet(page).locator('[data-wed-group="2027-06"] [data-wed-group-tally]')).toHaveAttribute('data-wed-group-tally', '0/3');
  // finished rows hidden under すべて; shown on asking (kept on this phone)
  await expect(card(page, 'venue')).toHaveCount(0);
  await sheet(page).locator('[data-wed-showdone]').click();
  await expect(card(page, 'venue')).toBeVisible();
  await expect(card(page, 'venue').locator('[data-wed-imported]')).toBeVisible();
  await expect(card(page, 'rings').locator('[data-wed-by="B"]')).toHaveText('ミオ');
  expect(await page.evaluate(() => localStorage.getItem('island.weddingDone'))).toBe('1');
  await shot(page, 'e2e-plan');
  // a slice: 期限切れ only, no month tallies under it
  await sheet(page).locator('[data-wed-filter="overdue"]').click();
  await expect(sheet(page).locator('[data-wed-task]')).toHaveCount(2);
  await expect(sheet(page).locator('[data-wed-group-tally]')).toHaveCount(0);
});

test('ticking: the ✓ marks it done with my chip, it stays where it was, the counts follow; again, it is open again', async ({ page }) => {
  await dev(page);
  await sheet(page).locator('[data-wed-filter="overdue"]').click();
  await sheet(page).locator('[data-wed-tick="estimate"]').click();
  await expect(card(page, 'estimate')).toHaveAttribute('data-done', 'true');
  await expect(card(page, 'estimate').locator('[data-wed-by="A"]')).toHaveText('ハル');
  await expect(sheet(page).locator('[data-wed-filter="done"]')).toHaveAttribute('data-count', '7');
  await expect(sheet(page).locator('[data-wed-filter="overdue"]')).toHaveAttribute('data-count', '1');
  await expect(sheet(page).locator('[data-wed-task]')).toHaveCount(2); // (held where it was)
  await expect(sheet(page).locator('[data-wed-top] [data-wed-tally]')).toHaveText('7 / 24');
  await sheet(page).locator('[data-wed-tick="estimate"]').click();
  await expect(card(page, 'estimate')).not.toHaveAttribute('data-done', 'true');
  // choosing the filter again lets the held rows go
  await sheet(page).locator('[data-wed-tick="estimate"]').click();
  await sheet(page).locator('[data-wed-filter="all"]').click();
  await sheet(page).locator('[data-wed-filter="overdue"]').click();
  await expect(sheet(page).locator('[data-wed-task]')).toHaveCount(1);
});

test('a task\'s page: the checklist ticks and grows, ✎ saves its fields, 🗑 deletes it and とりけす brings it back', async ({ page }) => {
  await dev(page);
  await card(page, 'guests').locator('.head').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'task');
  await expect(sheet(page).locator('[data-wed-title]')).toHaveText('招待する ゲストの リスト');
  // a URL in an item is a link, safely
  const link = sheet(page).locator('[data-wed-sub="guests-4"] a');
  await expect(link).toHaveAttribute('href', 'https://example.com/form');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAttribute('target', '_blank');
  await sheet(page).locator('[data-wed-sub-tick="guests-4"]').click();
  await expect(sheet(page).locator('[data-wed-sub="guests-4"]')).toHaveAttribute('data-done', 'true');
  await sheet(page).locator('[data-wed-sub-field]').fill('せきの はいち');
  await sheet(page).locator('[data-wed-sub-add]').click();
  await expect(sheet(page).locator('[data-wed-sub]')).toHaveCount(6);
  await expect(sheet(page).locator('[data-wed-sub-field]')).toHaveValue('');
  await expect(sheet(page).locator('#wed-cl')).toContainText('4 / 6');
  await shot(page, 'e2e-task');
  // ✎: the fields; ほぞん with the name changed
  await sheet(page).locator('[data-wed-edit]').click();
  await sheet(page).locator('[data-wed-field="title"]').fill('ゲストの リスト');
  await sheet(page).locator('[data-wed-field="cat"]').selectOption('いしょう');
  await sheet(page).locator('[data-wed-save]').click();
  await expect(sheet(page).locator('[data-wed-title]')).toHaveText('ゲストの リスト');
  // 🗑 (in ✎): gone, home, the banner's とりけす restores it
  await sheet(page).locator('[data-wed-edit]').click();
  await sheet(page).locator('[data-wed-remove]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'home');
  await expect(card(page, 'guests')).toHaveCount(0);
  await page.locator('dialog[open] .banner .act').click();
  await expect(card(page, 'guests')).toBeVisible();
  await expect(card(page, 'guests')).toContainText('いしょう');
  // ‹ back from a page
  await card(page, 'dress').locator('.head').click();
  await page.locator('dialog[open] .titlebar .back').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'home');
});

test('＋: a new task needs a name and a due day', async ({ page }) => {
  await dev(page);
  await sheet(page).locator('[data-wed-add]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'new');
  await sheet(page).locator('[data-wed-save]').click();
  await expect(sheet(page).locator('[data-wed-error]')).toHaveAttribute('data-wed-error', 'title');
  await sheet(page).locator('[data-wed-field="title"]').fill('ペーパーアイテムを たのむ');
  await sheet(page).locator('[data-wed-save]').click();
  await expect(sheet(page).locator('[data-wed-error]')).toHaveAttribute('data-wed-error', 'due');
  await sheet(page).locator('[data-wed-field="due"]').fill('2026-11-20');
  await sheet(page).locator('[data-wed-field="cat"]').selectOption('ゲスト');
  await sheet(page).locator('[data-wed-save]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'home');
  await expect(sheet(page).locator('[data-wed-group="thisMonth"]')).toContainText('ペーパーアイテムを たのむ');
  await expect(sheet(page).locator('[data-wed-filter="all"]')).toHaveAttribute('data-count', '25');
});

test('メモ: the note as a letter, markup shown as typed, links safe; かく with the format buttons, ほぞん', async ({ page }) => {
  await dev(page);
  await sheet(page).locator('[data-wed-tab="notes"]').click();
  const doc = sheet(page).locator('[data-wed-letter] [data-wed-doc]');
  await expect(doc.locator('h4')).toHaveText('かいじょう');
  await expect(doc.locator('strong').first()).toHaveText('はなぞの テラス');
  await expect(doc).toContainText('<b>タグ</b>');
  await expect(doc.locator('b, script, img')).toHaveCount(0);
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

test('a conflict: both versions, これに する keeps one', async ({ page }) => {
  await dev(page, '&conflict');
  await sheet(page).locator('[data-wed-tab="notes"]').click();
  await expect(sheet(page).locator('[data-wed-conflict]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-version]')).toHaveCount(2);
  await shot(page, 'e2e-conflict');
  await sheet(page).locator('[data-wed-pick="theirs"]').click();
  await expect(sheet(page).locator('[data-wed-letter]')).toContainText('もりの チャペル');
});

test('せってい: the names, a category added and removed, a deleted task restored, ぜんぶ けす after its ask', async ({ page }) => {
  await dev(page);
  await page.locator('dialog[open] [data-wed-gear]').click();
  await expect(sheet(page)).toHaveAttribute('data-level', 'settings');
  await sheet(page).locator('[data-wed-set="p1"]').fill('ハルト');
  await sheet(page).locator('[data-wed-set="p1"]').blur();
  await sheet(page).locator('[data-wed-cat-field]').fill('ドリンク');
  await sheet(page).locator('[data-wed-cat-add]').click();
  await expect(sheet(page).locator('[data-wed-cat="ドリンク"]')).toBeVisible();
  await sheet(page).locator('[data-wed-cat-remove="くらし"]').click();
  await expect(sheet(page).locator('[data-wed-cat="くらし"]')).toHaveCount(0);
  await expect(sheet(page).locator('[data-wed-deleted]')).toHaveCount(2);
  await sheet(page).locator('[data-wed-restore="cake"]').click();
  await expect(sheet(page).locator('[data-wed-deleted]')).toHaveCount(1);
  await sheet(page).locator('[data-wed-purge]').click();
  const ask = page.locator('dialog[open] [data-wed-purge-ask]');
  await expect(ask).toContainText('1こ');
  await shot(page, 'e2e-purge');
  await page.locator('dialog[open] [data-wed-purge-yes]').click();
  await expect(ask).toHaveCount(0);
  await expect(sheet(page).locator('[data-wed-deleted]')).toHaveCount(0);
  await page.locator('dialog[open] .titlebar .back').click();
  await expect(sheet(page).locator('[data-wed-names]')).toHaveText('ハルト ＆ ミオ');
  await expect(card(page, 'cake')).toBeVisible();
});

test('the guest reads everything and has nothing to tick or edit', async ({ page }) => {
  await dev(page, '&as=G');
  await expect(card(page, 'guests')).toBeVisible();
  await expect(page.locator('dialog[open] :is([data-wed-tick], [data-wed-add], [data-wed-gear])')).toHaveCount(0);
  await sheet(page).locator('[data-wed-showdone]').click();
  await expect(card(page, 'rings').locator('[data-wed-mark]')).toBeVisible();
  await card(page, 'guests').locator('.head').click();
  await expect(sheet(page).locator('[data-wed-sub]')).toHaveCount(5);
  await expect(sheet(page).locator('[data-wed-edit], [data-wed-page-tick], [data-wed-sub-tick], [data-wed-sub-field]')).toHaveCount(0);
  await shot(page, 'e2e-guest-task');
  await page.locator('dialog[open] .titlebar .back').click();
  await sheet(page).locator('[data-wed-tab="notes"]').click();
  await expect(sheet(page).locator('[data-wed-letter]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-note-edit]')).toHaveCount(0);
});

test('パニエル\'s line: the day\'s first opening only', async ({ page }) => {
  await dev(page);
  await expect(sheet(page).locator('[data-wed-greet]')).toBeVisible();
  await page.reload();
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page).locator('[data-wed-top]')).toBeVisible();
  await expect(sheet(page).locator('[data-wed-greet]')).toHaveCount(0);
});
