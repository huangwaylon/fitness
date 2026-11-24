// やること (docs/todo.md): shared to-do lists on two paired phones over the relay's real room and record in the test's
// process (e2e/liveRoom.ts), WebKit with taps, Chromium with clicks. The menu's pill opens it (empty: its line); a
// member makes a list and adds items (追加 and the return key, the keyboard kept up), ticks and edits one, the
// partner's open sheet following live; 上へ / 下へ move one (the first row's 上へ can't); 削除 acts at once (取り消す brings
// it back), 完了した項目を削除 takes the done ones, the partner sees both go. The guest makes, ticks, renames a list and
// deletes it (asked first: キャンセル keeps it), and the member inside it is taken back to the lists. Offline: a list made
// with the relay out of reach reaches the partner once it's back. Reopened within 10 min of the close, the sheet shows the
// list it closed on; later, the lists. Day and night shots at 393×659 (SHOTS=<dir>).
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
/** A list with items on the record (`done`: the ticked ones), as `who` made it. */
function seed(island: Island, who: 'A' | 'G', id: string, title: string, items: string[], done: string[] = []) {
  const at = island.now();
  expect(island.event(who, 'todo', { id, at, title, ord: 0 })).toMatchObject({ ok: true });
  items.forEach((text, i) => expect(island.event(who, 'todo', { id: `${id}i${i}`, at: at + 1 + i, list: id, text, ord: i, done: done.includes(text) ? 1 : 0 })).toMatchObject({ ok: true }));
}

const sheet = (p: Page) => p.locator('dialog[open] [data-todo]');
const listRow = (p: Page, id: string) => p.locator(`[data-todo-open="${id}"]`);
const rows = (p: Page) => p.locator('dialog[open] [data-todo-open]');
const texts = (p: Page) => p.locator('dialog[open] [data-todo-item] [data-todo-acts]');
const acts = (p: Page, text: string) => p.getByRole('button', { name: `「${text}」の操作`, exact: true });
const item = (p: Page, text: string) => p.locator('[data-todo-item]').filter({ has: acts(p, text) });
const top = (p: Page) => p.locator('dialog[open]').last();
const title = (p: Page) => p.locator('dialog[open] .navbar h2').first();
const banner = (p: Page) => p.getByRole('button', { name: '取り消す' });
/** The mouse off where it clicked (Chromium's clicks; a phone has no resting pointer): the undo banner slides in low,
 *  where the last button was, and under a resting mouse it reads as hovered and holds its send up to 2 min
 *  (Toast.svelte, store/backend.ts HOLD_MAX_MS: the partner never saw a removal, todo:146 flaky on 6 of 6 commits). */
const mouseAway = (p: Page, how: How) => (how === 'click' ? p.mouse.move(1, 1) : Promise.resolve());

async function newList(p: Page, how: How, name: string) {
  await p.locator('[data-todo-new]')[how]();
  const field = top(p).locator('[data-todo-form-field]');
  await expect(field).toBeFocused();
  await field.fill(name);
  await top(p).locator('[data-todo-save]')[how]();
  await expect(sheet(p)).toHaveAttribute('data-todo-at', /^d/);
  await expect(title(p)).toHaveText(name);
}
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

test('a member makes a list, adds, ticks and edits items; the partner’s open sheet follows live', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  const [a, b] = await Promise.all([phone(browser, island, 'A', how), phone(browser, island, 'B', how)]);
  // empty: its line, and 新しいリスト
  for (const p of [a, b]) await expect(p.locator('[data-todo-empty]')).toBeVisible();
  await dayAndNight(a, 'todo-empty', info.project.name);

  await newList(a, how, '買い物');
  await expect(a.locator('[data-todo-none]')).toBeVisible();
  // the partner's open sheet: the new list at once
  await expect(rows(b)).toHaveCount(1);
  await expect(rows(b).first()).toContainText('買い物');
  await add(a, how, '牛乳');
  await add(a, how, '卵', true);
  // (the return key keeps the field focused: the keyboard stays up for the next)
  await expect(a.locator('[data-todo-field]')).toBeFocused();
  await expect(texts(a)).toHaveText(['牛乳', '卵']);
  await expect(rows(b).first()).toContainText('0 / 2');
  await rows(b).first()[how]();
  await expect(texts(b)).toHaveText(['牛乳', '卵']);
  // a tick is everyone's
  await item(a, '牛乳').getByRole('checkbox')[how]();
  await expect(item(b, '牛乳')).toHaveAttribute('data-done', 'true');
  // 編集
  await act(a, how, '卵', 'edit');
  const field = top(a).locator('[data-todo-form-field]');
  await expect(field).toHaveValue('卵');
  await field.fill('卵 10個');
  await top(a).locator('[data-todo-save]')[how]();
  await expect(texts(b)).toHaveText(['牛乳', '卵 10個']);
  await dayAndNight(a, 'todo-list', info.project.name);
  await a.locator('dialog[open] .navbar').first().getByRole('button', { name: '戻る' })[how]();
  await expect(rows(a).first()).toContainText('1 / 2');
  await dayAndNight(a, 'todo-lists', info.project.name);
});

test('上へ / 下へ move an item; 削除 acts at once with 取り消す; 完了した項目を削除 takes the done ones; the partner sees it', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', 'dshop001', '買い物', ['牛乳', '卵', 'パン', 'りんご'], ['卵']);
  const [a, b] = await Promise.all([phone(browser, island, 'A', how), phone(browser, island, 'B', how)]);
  for (const p of [a, b]) await listRow(p, 'dshop001')[how]();
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

test('the guest adds and ticks, renames a list and deletes it (asked first); the member inside it is taken back', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', 'dhome001', '家事', ['洗濯']);
  const [g, a] = await Promise.all([phone(browser, island, 'G', how), phone(browser, island, 'A', how)]);
  for (const p of [g, a]) await listRow(p, 'dhome001')[how]();
  await add(g, how, '掃除');
  await item(g, '洗濯').getByRole('checkbox')[how]();
  await expect(texts(a)).toHaveText(['洗濯', '掃除']);
  await expect(item(a, '洗濯')).toHaveAttribute('data-done', 'true');
  // ⋯ 名前を変更
  await g.locator('[data-todo-more]')[how]();
  await top(g).locator('[data-action="rename"]')[how]();
  await top(g).locator('[data-todo-form-field]').fill('週末の家事');
  await top(g).locator('[data-todo-save]')[how]();
  await expect(title(a)).toHaveText('週末の家事');
  // ⋯ リストを削除: asked, naming its items (キャンセル keeps it), then 削除: the lists, 取り消す on the banner
  await g.locator('[data-todo-more]')[how]();
  await top(g).locator('[data-action="del"]')[how]();
  await expect(top(g)).toContainText('「週末の家事」を削除しますか？');
  await expect(top(g)).toContainText('項目2件も削除されます。');
  await top(g).locator('[data-confirm-no]')[how]();
  await expect(sheet(g)).toHaveAttribute('data-todo-at', 'dhome001');
  await g.locator('[data-todo-more]')[how]();
  await top(g).locator('[data-action="del"]')[how]();
  await top(g).locator('[data-confirm-yes]')[how]();
  await mouseAway(g, how);
  await expect(g.locator('[data-todo-empty]')).toBeVisible();
  await expect(banner(g)).toBeVisible();
  await expect(a.locator('[data-todo-empty]')).toBeVisible({ timeout: 15_000 });
});

test('a reopening within 10 min shows the list it closed on; a later one the lists', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', 'dshop001', '買い物', ['牛乳']);
  const a = await phone(browser, island, 'A', how);
  const close = () => a.locator('dialog[open] .navbar').first().locator('.nav.close')[how]();
  await listRow(a, 'dshop001')[how]();
  await expect(title(a)).toHaveText('買い物');
  await close();
  await expect(sheet(a)).toBeHidden();
  await fromMenu(a, 'todo', how);
  await expect(sheet(a)).toHaveAttribute('data-todo-at', 'dshop001');
  await expect(texts(a)).toHaveText(['牛乳']);
  await close();
  await expect(sheet(a)).toBeHidden();
  // 11 min on (the phone's Date is liveRoom's shifted one, which a Playwright clock doesn't reach: moved on by hand)
  await a.evaluate(() => ((n) => (Date.now = () => n() + 11 * 60_000))(Date.now));
  await fromMenu(a, 'todo', how);
  await expect(rows(a)).toHaveCount(1);
  await expect(title(a)).toHaveText('やること');
});

test('offline: a list made with the relay out of reach reaches the partner once it is back', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  const [a, b] = await Promise.all([phone(browser, island, 'A', how), phone(browser, island, 'B', how)]);
  island.offline('A');
  await a.context().setOffline(true);
  await newList(a, how, 'キャンプ');
  await add(a, how, 'テント');
  await add(a, how, 'ランタン', true);
  await expect(rows(b)).toHaveCount(0);
  island.offline('A', false);
  await a.context().setOffline(false);
  await expect(rows(b).first()).toContainText('0 / 2', { timeout: 15_000 });
  await rows(b).first()[how]();
  await expect(texts(b)).toHaveText(['テント', 'ランタン']);
});
