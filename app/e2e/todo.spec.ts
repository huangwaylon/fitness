// やること (docs/todo.md): the one shared list on paired phones over the relay's real room and record in the test's
// process (e2e/liveRoom.ts), WebKit with taps, Chromium with clicks. The menu's pill opens it (empty: its line); a
// member adds items (追加 and the return key, the keyboard kept up), ticks one and edits another (its メモ too), the
// partner's open sheet following live; 上へ / 下へ move one (the first row's 上へ can't); 削除 acts at once (取り消す brings
// it back), 完了した項目を削除 takes the done ones, the partner sees both go. The guest adds, ticks and edits as a member
// does. Offline: items added with the relay out of reach reach the partner once it's back. A migrated list (an item
// with a note) reads as its title over its first lines. Day and night shots at 393×659 (SHOTS=<dir>).
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { newIsland } from './liveRoom.ts';
import { fromMenu } from './hud.ts';
import { shot } from './shots.ts';

type Island = ReturnType<typeof newIsland>;
type How = 'tap' | 'click';
const VIEW = { width: 393, height: 659 };
const howOf = (name: string): How => (name.startsWith('webkit') ? 'tap' : 'click');

async function phone(browser: Browser, island: Island, who: 'A' | 'B' | 'G', how: How) {
  const context = await browser.newContext({ viewport: VIEW, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', hasTouch: how === 'tap' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await island.pair(context, who);
  const page = await context.newPage();
  await page.goto('');
  await islandUp(page, { timeout: 20_000 });
  await expect.poll(() => island.sockets(who), { timeout: 10_000 }).toBe(1);
  await fromMenu(page, 'todo', how);
  return page;
}
/** Items on the record (`done`: the ticked ones), as `who` made them. */
function seed(island: Island, who: 'A' | 'G', texts: string[], done: string[] = [], extra: Record<string, object> = {}) {
  const at = island.now();
  texts.forEach((text, i) => expect(island.event(who, 'todo', { id: `dseed${String(i).padStart(3, '0')}`, at: at + i, text, ord: i, done: done.includes(text) ? 1 : 0, ...extra[text] })).toMatchObject({ ok: true }));
}

const texts = (p: Page) => p.locator('dialog[open] [data-todo-item] [data-todo-acts] .t');
const acts = (p: Page, text: string) => p.getByRole('button', { name: `「${text}」の操作`, exact: true });
const item = (p: Page, text: string) => p.locator('[data-todo-item]').filter({ has: acts(p, text) });
const top = (p: Page) => p.locator('dialog[open]').last();
const banner = (p: Page) => p.getByRole('button', { name: '取り消す' });
/** The mouse off where it clicked (Chromium's clicks; a phone has no resting pointer): the undo banner slides in low,
 *  where the last button was, and under a resting mouse it reads as hovered and holds its send up to 2 min
 *  (Toast.svelte, store/backend.ts HOLD_MAX_MS: the partner never saw a removal). */
const mouseAway = (p: Page, how: How) => (how === 'click' ? p.mouse.move(1, 1) : Promise.resolve());

async function add(p: Page, how: How, text: string, enter = false) {
  const field = p.locator('[data-todo-field]');
  await field[how]();
  await field.fill(text);
  if (enter) await field.press('Enter');
  else await p.locator('[data-todo-add]')[how]();
  await expect(field).toHaveValue('');
  await expect(item(p, text)).toBeVisible();
}
async function act(p: Page, how: How, text: string, action: string) {
  await acts(p, text)[how]();
  await top(p).locator(`[data-action="${action}"]`)[how]();
}
async function dayAndNight(p: Page, name: string, project: string) {
  await shot(p, `${name}-day-${project}`);
  await p.evaluate(() => (document.documentElement.dataset.tod = 'night'));
  await shot(p, `${name}-night-${project}`);
  await p.evaluate(() => (document.documentElement.dataset.tod = 'day'));
}

test.afterEach(async ({ browser }) => {
  for (const c of browser.contexts()) await c.close();
});

test('a member adds, ticks and edits items (a note too); the partner’s open sheet follows live', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  const [a, b] = await Promise.all([phone(browser, island, 'A', how), phone(browser, island, 'B', how)]);
  // empty: its line, the field under it
  for (const p of [a, b]) await expect(p.locator('[data-todo-empty]')).toBeVisible();
  await dayAndNight(a, 'todo-empty', info.project.name);

  await add(a, how, '牛乳');
  await add(a, how, '卵', true);
  // (the return key keeps the field focused: the keyboard stays up for the next)
  await expect(a.locator('[data-todo-field]')).toBeFocused();
  await expect(texts(a)).toHaveText(['牛乳', '卵']);
  await expect(texts(b)).toHaveText(['牛乳', '卵']);
  await expect(b.locator('[data-todo-empty]')).toHaveCount(0);
  // a tick is everyone's
  await item(a, '牛乳').getByRole('checkbox')[how]();
  await expect(item(b, '牛乳')).toHaveAttribute('data-done', 'true');
  // 編集: the text and a note of two lines
  await act(a, how, '卵', 'edit');
  const field = top(a).locator('[data-todo-form-field]');
  await expect(field).toHaveValue('卵');
  await field.fill('卵 10個');
  await top(a).locator('[data-todo-form-note]').fill('赤玉\nなければ白');
  await top(a).locator('[data-todo-save]')[how]();
  await expect(texts(b)).toHaveText(['牛乳', '卵 10個']);
  await expect(item(b, '卵 10個').locator('[data-todo-note]')).toHaveText('赤玉\nなければ白');
  await dayAndNight(a, 'todo-list', info.project.name);
});

test('上へ / 下へ move an item; 削除 acts at once with 取り消す; 完了した項目を削除 takes the done ones; the partner sees it', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', ['牛乳', '卵', 'パン', 'りんご'], ['卵']);
  const [a, b] = await Promise.all([phone(browser, island, 'A', how), phone(browser, island, 'B', how)]);
  await act(a, how, 'パン', 'up');
  await expect(texts(a)).toHaveText(['牛乳', 'パン', '卵', 'りんご']);
  await expect(texts(b)).toHaveText(['牛乳', 'パン', '卵', 'りんご']);
  // (the first row's 上へ can't; its 下へ can)
  await acts(a, '牛乳')[how]();
  await expect(top(a).locator('[data-action="up"]')).toHaveAttribute('aria-disabled', 'true');
  await top(a).locator('[data-action="down"]')[how]();
  await expect(texts(a)).toHaveText(['パン', '牛乳', '卵', 'りんご']);
  // 削除: gone at once, 取り消す brings it back; again, kept
  await act(a, how, 'りんご', 'del');
  await expect(item(a, 'りんご')).toHaveCount(0);
  await banner(a)[how]();
  await expect(item(a, 'りんご')).toBeVisible();
  await act(a, how, 'りんご', 'del');
  await expect(item(a, 'りんご')).toHaveCount(0);
  // 完了した項目を削除 (卵): its link gone with them
  await a.locator('[data-todo-clear]')[how]();
  await mouseAway(a, how);
  await expect(texts(a)).toHaveText(['パン', '牛乳']);
  await expect(a.locator('[data-todo-clear]')).toHaveCount(0);
  // (each sent once its 取り消す is over)
  await expect(texts(b)).toHaveText(['パン', '牛乳'], { timeout: 15_000 });
});

test('the guest adds, ticks and edits as a member does; a migrated list reads as its title over its first lines', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', ['家事', '洗濯'], [], { 家事: { note: '掃除機\n風呂\n窓\n✓ ゴミ出し' } });
  const [g, a] = await Promise.all([phone(browser, island, 'G', how), phone(browser, island, 'A', how)]);
  // the note: its first 3 lines shown (pre-line, clamped)
  const note = g.locator('[data-todo-note]');
  await expect(note).toHaveText('掃除機\n風呂\n窓\n✓ ゴミ出し');
  expect(await note.evaluate((el) => el.scrollHeight > el.clientHeight + 2)).toBe(true);
  await add(g, how, '買い出し');
  await item(g, '洗濯').getByRole('checkbox')[how]();
  await act(g, how, '家事', 'edit');
  await top(g).locator('[data-todo-form-field]').fill('週末の家事');
  await top(g).locator('[data-todo-save]')[how]();
  await expect(texts(a)).toHaveText(['週末の家事', '洗濯', '買い出し']);
  await expect(item(a, '洗濯')).toHaveAttribute('data-done', 'true');
  await expect(item(a, '週末の家事').locator('[data-todo-note]')).toContainText('掃除機');
});

test('offline: items added with the relay out of reach reach the partner once it is back', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  const [a, b] = await Promise.all([phone(browser, island, 'A', how), phone(browser, island, 'B', how)]);
  island.offline('A');
  await a.context().setOffline(true);
  await add(a, how, 'テント');
  await add(a, how, 'ランタン', true);
  await expect(texts(b)).toHaveCount(0);
  island.offline('A', false);
  await a.context().setOffline(false);
  await expect(texts(b)).toHaveText(['テント', 'ランタン'], { timeout: 15_000 });
});
