// やること's due dates, reminders and the menu's 今日・明日 panel (docs/todo.md "The sheet", docs/design.md "Menu"), on
// the relay's real record in the test's process (e2e/liveRoom.ts), WebKit with taps, Chromium with clicks, the scene
// clock pinned (2026-11-04 12:00 Tokyo, a Wednesday). The add field's quick chips (今日 then return, held across two
// adds and named in the placeholder, gone on a blur; 日付… a native date input over the chip's whole hit); 編集's 期限
// and 通知 (a time, a reminder: なし by default, me pressed when turned on, the moment it fires in words; 期限 なし drops
// it); the row's chip opening 編集 at 期限. The panel: today's (timed first), tomorrow's, the past folded into one row,
// a tick from it struck through and seen in the sheet, a row's text opening the sheet at the item; hidden with nothing
// due, in edit mode and with やること's pill hidden; the guest ticks from it. This phone's opt-in (Notification,
// PushManager and the service worker stubbed, the relay's /api/push routes mocked): asked in the tap, handed over, and a
// chosen person with no phone on named. Shots at 393×852, day and night (SHOTS=<dir>).
import { expect, test, type Browser, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { newIsland } from './liveRoom.ts';
import { fromMenu, unfoldMenu } from './hud.ts';
import { RELAY } from './relay.ts';
import { shot } from './shots.ts';

type Island = ReturnType<typeof newIsland>;
type How = 'tap' | 'click';
const VIEW = { width: 393, height: 852 };
const howOf = (name: string): How => (name.startsWith('webkit') ? 'tap' : 'click');
const VAPID = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

/** The browser of a Home Screen app that can subscribe (Playwright has no push service), counting what it's asked. */
async function fakePush(context: BrowserContext) {
  await context.addInitScript(() => {
    const probe = { asked: 0, subscribed: 0 };
    (window as unknown as { __push: typeof probe }).__push = probe;
    const N = { permission: 'default', requestPermission: async () => (probe.asked++, (N.permission = 'granted')) };
    Object.defineProperty(window, 'Notification', { value: N, configurable: true });
    Object.defineProperty(window, 'PushManager', { value: class {}, configurable: true });
    let sub: object | null = null;
    const ep = 'https://web.push.apple.com/QTODO';
    const make = () => ({ endpoint: ep, options: { applicationServerKey: null }, toJSON: () => ({ endpoint: ep, keys: { p256dh: 'P256', auth: 'AUTH' } }), unsubscribe: async () => ((sub = null), true) });
    const reg = { pushManager: { getSubscription: async () => sub, subscribe: async () => (probe.subscribed++, (sub = make())) }, update: async () => {}, addEventListener() {} };
    const sw = { ready: Promise.resolve(reg), register: async () => reg, getRegistration: async () => reg, getRegistrations: async () => [reg], addEventListener() {}, removeEventListener() {}, controller: null };
    Object.defineProperty(Navigator.prototype, 'serviceWorker', { get: () => sw, configurable: true });
    Object.defineProperty(Navigator.prototype, 'standalone', { get: () => true, configurable: true });
    for (const k of ['width', 'height'] as const) Object.defineProperty(screen, k, { get: () => (k === 'width' ? innerWidth : innerHeight), configurable: true });
  });
}
/** The relay's push routes (not on the test's relay): its key, who has a phone on, what it was handed. */
async function pushRoutes(context: BrowserContext, subs: { A: boolean; B: boolean; G: boolean }) {
  const got: { path: string; body: unknown }[] = [];
  await context.route(`${RELAY}/api/push**`, (route) => {
    const r = route.request(), path = new URL(r.url()).pathname;
    if (r.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
    got.push({ path, body: r.postData() ? JSON.parse(r.postData()!) : null });
    const on = path.endsWith('/subscribe');
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, push: { vapidPublic: VAPID, on, subs: { ...subs, ...(on ? { A: true } : {}) } } }) });
  });
  return got;
}

async function phone(browser: Browser, island: Island, who: 'A' | 'B' | 'G', how: How, o: { push?: boolean; subs?: { A: boolean; B: boolean; G: boolean } } = {}) {
  const context = await browser.newContext({ viewport: VIEW, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', hasTouch: how === 'tap' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  if (o.push) await fakePush(context);
  await island.pair(context, who);
  // (after the island's: the last route added answers first)
  const got = await pushRoutes(context, o.subs ?? { A: false, B: false, G: false });
  const page = await context.newPage();
  await page.goto('');
  await islandUp(page, { timeout: 20_000 });
  await expect.poll(() => island.sockets(who), { timeout: 10_000 }).toBe(1);
  return { page, got };
}
/** A list on the record with items (`due`, done), as `who` made them. */
function seed(island: Island, who: 'A' | 'G', id: string, title: string, items: { text: string; due?: string; done?: boolean; rem?: string; to?: string[] }[]) {
  const at = island.now();
  expect(island.event(who, 'todo', { id, at, title, ord: 0 })).toMatchObject({ ok: true });
  items.forEach((x, i) => expect(island.event(who, 'todo', {
    id: `${id}i${i}`, at: at + 1 + i, list: id, text: x.text, ord: i, done: x.done ? 1 : 0, ...(x.due && { due: x.due }), ...(x.rem && { rem: x.rem, to: x.to })
  })).toMatchObject({ ok: true }));
}

const top = (p: Page) => p.locator('dialog[open]').last();
const acts = (p: Page, text: string) => p.getByRole('button', { name: `「${text}」の操作`, exact: true });
const item = (p: Page, text: string) => p.locator('[data-todo-item]').filter({ has: acts(p, text) });
const chip = (p: Page, text: string) => item(p, text).locator('[data-todo-due]');
const panel = (p: Page) => p.locator('[data-due-panel]');
async function dayAndNight(p: Page, name: string, project: string) {
  await shot(p, `${name}-day-${project}`);
  await p.evaluate(() => (document.documentElement.dataset.tod = 'night'));
  await shot(p, `${name}-night-${project}`);
  await p.evaluate(() => (document.documentElement.dataset.tod = 'day'));
}

test.afterEach(async ({ browser }) => {
  for (const c of browser.contexts()) await c.close();
});

test('quick chips date the next adds (held, named in the field, gone on a blur); 編集 sets a time and a reminder, なし by default; 期限 なし clears it', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', 'dhome001', '家のこと', [{ text: '洗濯' }]);
  const { page: a } = await phone(browser, island, 'A', how);
  await fromMenu(a, 'todo', how);
  await a.locator('[data-todo-open="dhome001"]')[how]();
  const field = a.locator('[data-todo-field]');
  // focused: the chips over the field; 今日, then two adds by the return key, both today's
  await field[how]();
  await expect(a.locator('[data-todo-quick]')).toBeVisible();
  await a.locator('[data-todo-quick-pick="today"]')[how]();
  await expect(field).toBeFocused();
  await expect(field).toHaveAttribute('placeholder', '今日のやることを追加');
  await dayAndNight(a, 'todo-due-quick', info.project.name);
  for (const t of ['ゴミ出し', '牛乳']) {
    await field.fill(t);
    await field.press('Enter');
    await expect(chip(a, t)).toHaveText('今日');
  }
  await expect(field).toBeFocused();
  // 日付…: the native input covers the chip's whole 44px hit
  const box = await a.locator('[data-todo-quick-date]').boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await expect(a.locator('[data-todo-quick-date]')).toHaveAttribute('aria-label', '日付を選ぶ');
  await a.locator('[data-todo-quick-date]').fill('2026-11-24');
  await expect(field).toHaveAttribute('placeholder', '11/24（火）のやることを追加');
  await field.fill('区役所');
  await field.press('Enter');
  await expect(chip(a, '区役所')).toHaveText('11/24（火）');
  // a blur (a tap on the title): the chips and the pick go
  await a.locator('dialog[open] .navbar h2').first()[how]();
  await expect(a.locator('[data-todo-quick]')).toHaveCount(0);
  await field[how]();
  await expect(field).toHaveAttribute('placeholder', '項目を追加');
  await field.fill('なにか');
  await field.press('Enter');
  await expect(item(a, 'なにか')).toBeVisible();
  await expect(chip(a, 'なにか')).toHaveCount(0);

  // 編集 (the action sheet): 明日, a time, the reminder なし by default; 10分前 presses me alone
  await acts(a, '洗濯')[how]();
  await top(a).locator('[data-action="edit"]')[how]();
  const form = top(a);
  await form.locator('[data-due-pick="tomorrow"]')[how]();
  await form.locator('[data-due-timed]')[how]();
  await form.locator('[data-due-time]').fill('09:30');
  await expect(form.locator('[data-due-rem="none"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(form.locator('[data-due-to]')).toHaveCount(0);
  await form.locator('[data-due-rem="b10"]')[how]();
  await expect(form.locator('[data-due-to="A"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(form.locator('[data-due-to="B"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(form.locator('[data-due-fire]')).toHaveText('11/5（木）9:20 に通知');
  await dayAndNight(a, 'todo-due-form', info.project.name);
  await form.locator('[data-todo-save]')[how]();
  await expect(chip(a, '洗濯')).toHaveText(/明日 9:30/);
  await expect(chip(a, '洗濯').locator('svg')).toHaveCount(1);
  // the chip opens 編集 at 期限; なし drops the reminder with the date
  await chip(a, '洗濯')[how]();
  await expect(top(a).locator('[data-due-rem="b10"]')).toHaveAttribute('aria-pressed', 'true');
  await top(a).locator('[data-due-pick="none"]')[how]();
  await expect(top(a).locator('[data-due-rem]')).toHaveCount(0);
  await top(a).locator('[data-todo-save]')[how]();
  await expect(chip(a, '洗濯')).toHaveCount(0);
  await expect(item(a, '洗濯')).toBeVisible();
});

test('the menu’s panel: today timed first, tomorrow, the past folded; a tick struck through and shared; a row opens the item; hidden while editing, with the pill hidden, with nothing due', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', 'dhome001', '家のこと', [
    { text: 'ゴミ出し', due: '2026-11-04' },
    { text: '牛乳を買う', due: '2026-11-04T15:00' },
    { text: '区役所に電話', due: '2026-11-02' },
    { text: '歯医者', due: '2026-11-05T09:30', rem: 'b60', to: ['A'] },
    { text: 'いつか', due: '2026-11-20' },
    { text: '日付なし' }
  ]);
  const { page: a } = await phone(browser, island, 'A', how);
  await unfoldMenu(a, how);
  await expect(panel(a)).toBeVisible();
  await expect(panel(a).locator('[data-due-past]')).toHaveText(/前の日 1件/);
  await expect(panel(a).locator('[data-due-day]')).toHaveText(['今日', '明日']);
  await expect(panel(a).locator('[data-due-item] .name')).toHaveText(['牛乳を買う', 'ゴミ出し', '歯医者']);
  await expect(panel(a).locator('[data-due-item] .when')).toHaveText(['15:00', '9:30']);
  // left of the pills, top-aligned with the first, 12px clear of them, never past the screen's side
  const [pb, first] = [await panel(a).boundingBox(), await a.locator('[data-menu-pill]').first().boundingBox()];
  expect(Math.abs(pb!.y - first!.y)).toBeLessThan(1);
  expect(first!.x - (pb!.x + pb!.width)).toBeGreaterThanOrEqual(11);
  expect(pb!.x).toBeGreaterThanOrEqual(13);
  await dayAndNight(a, 'todo-due-panel', info.project.name);
  // a tick: struck through, kept till the menu folds, seen on the guest's
  await panel(a).locator('[data-due-item="dhome001i0"]').getByRole('checkbox')[how]();
  await expect(panel(a).locator('[data-due-item="dhome001i0"]')).toHaveAttribute('data-done', 'true');
  // the guest's panel: the tick there, and its own tick back
  const { page: g } = await phone(browser, island, 'G', how);
  await unfoldMenu(g, how);
  await expect(panel(g).locator('[data-due-item] .name')).toHaveText(['牛乳を買う', '歯医者']);
  await panel(g).locator('[data-due-item="dhome001i1"]').getByRole('checkbox')[how]();
  await expect(panel(a).locator('[data-due-item="dhome001i1"]')).toHaveCount(0);
  // a row's text: the menu folds, やること on the list at the item, flashed
  await panel(a).locator('[data-due-open="dhome001i3"]')[how]();
  await expect(a.locator('dialog[open] [data-todo]')).toHaveAttribute('data-todo-at', 'dhome001');
  await expect(item(a, '歯医者')).toHaveClass(/hl/);
  await expect(item(a, 'ゴミ出し')).toHaveAttribute('data-done', 'true');
  await expect(item(a, '牛乳を買う')).toHaveAttribute('data-done', 'true');
  await a.keyboard.press('Escape');
  await a.keyboard.press('Escape');
  await expect(a.locator('dialog[open]')).toHaveCount(0);
  // folded and unfolded again: the done ones gone
  await unfoldMenu(a, how);
  await expect(panel(a).locator('[data-due-item] .name')).toHaveText(['歯医者']);
  // edit mode (a pill held): no panel; やること hidden (⊖), 完了: still none
  const todoPill = a.locator('[data-hud-todo]');
  await todoPill.evaluate((el) => el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, pointerType: 'touch', isPrimary: true, button: 0, buttons: 1, bubbles: true, clientX: 1, clientY: 1 })));
  await expect(a.locator('#hud-menu-items')).toHaveAttribute('data-menu-editing', 'true');
  await todoPill.evaluate((el) => el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9, pointerType: 'touch', isPrimary: true, bubbles: true, clientX: 1, clientY: 1 })));
  await expect(panel(a)).toHaveCount(0);
  await todoPill.click({ force: true });
  await expect(todoPill).toHaveAttribute('data-menu-hidden', 'true');
  await a.locator('[data-menu-done]').click();
  await expect(a.locator('[data-hud-todo]')).toHaveCount(0);
  await expect(panel(a)).toHaveCount(0);
});

test('nothing due: no panel; the guest’s wide ベル row still leaves the panel its room', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', 'dhome001', '家のこと', [{ text: '日付なし' }, { text: 'いつか', due: '2026-11-20' }]);
  const { page: a } = await phone(browser, island, 'A', how);
  await unfoldMenu(a, how);
  await expect(a.locator('[data-menu-pill]').first()).toBeVisible();
  await expect(panel(a)).toHaveCount(0);
  await shot(a, `todo-due-empty-day-${info.project.name}`);
  seed(island, 'G', 'dguest01', 'ゲストの', [{ text: '朝ごはん', due: '2026-11-04T08:00' }, { text: '長い名前のやることがここに入ります', due: '2026-11-05' }]);
  for (const width of [393, 402]) {
    const { page: g } = await phone(browser, island, 'G', how);
    await g.setViewportSize({ width, height: 852 });
    await unfoldMenu(g, how);
    await expect(panel(g)).toBeVisible();
    const box = (await panel(g).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(150);
    await expect(panel(g).locator('[data-due-item] .name').last()).toHaveCSS('text-overflow', 'ellipsis');
    await dayAndNight(g, `todo-due-guest-${width}`, info.project.name);
    await g.context().close();
    await expect.poll(() => island.sockets('G')).toBe(0);
  }
});

test('this phone’s opt-in: asked in the tap, handed to the relay; a chosen person with no phone on is named', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', 'dhome001', '家のこと', [{ text: '歯医者', due: '2026-11-05T09:30' }]);
  const { page: a, got } = await phone(browser, island, 'A', how, { push: true, subs: { A: false, B: false, G: false } });
  await fromMenu(a, 'todo', how);
  const sw = a.locator('[data-todo-notify] [role="switch"]');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect.poll(() => got.map((x) => x.path)).toContain('/api/push');
  expect(await a.evaluate(() => (window as unknown as { __push: object }).__push)).toEqual({ asked: 0, subscribed: 0 });
  await dayAndNight(a, 'todo-due-optin', info.project.name);
  await sw[how]();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  expect(await a.evaluate(() => (window as unknown as { __push: object }).__push)).toEqual({ asked: 1, subscribed: 1 });
  expect(got.find((x) => x.path === '/api/push/subscribe')?.body).toEqual({ endpoint: 'https://web.push.apple.com/QTODO', keys: { p256dh: 'P256', auth: 'AUTH' }, lang: 'ja' });
  await expect(a.locator('[data-todo-push-test]')).toBeVisible();
  // a reminder for うめ too: her phone isn't on (the relay's presence)
  await a.locator('[data-todo-open="dhome001"]')[how]();
  await chip(a, '歯医者')[how]();
  await top(a).locator('[data-due-rem="at"]')[how]();
  await top(a).locator('[data-due-to="B"]')[how]();
  await expect(top(a).locator('[data-due-off="B"]')).toHaveText('うめ：端末の通知がオフ');
  await expect(top(a).locator('[data-due-off="A"]')).toHaveCount(0);
  await expect(top(a).locator('[data-due-enable]')).toHaveCount(0);
  await top(a).locator('[data-todo-save]')[how]();
  await expect(chip(a, '歯医者').locator('svg')).toHaveCount(1);
});
