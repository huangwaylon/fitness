// やること's due dates, reminders and the HUD's disc and peek (docs/todo.md "The sheet", "The disc and the peek"), on
// the relay's real record in the test's process (e2e/liveRoom.ts), WebKit with taps, Chromium with clicks, the scene
// clock pinned (2026-11-04 12:00 Tokyo, a Wednesday). The add field's quick chips (今日 then return, held across two
// adds and named in the placeholder, gone on a blur; 日付… a native date input over the chip's whole hit); 編集's 期限
// and 通知 (a time, a reminder: なし by default, me pressed when turned on, the moment it fires in words; 期限 なし drops
// it); the row's chip opening 編集 at 期限. The disc: left of the dumbbell, the count of what's due today or before
// (coral with anything overdue), nothing with only tomorrow's or later; its peek (前の日 / 今日 / 明日, a tick struck
// through with 取り消す and shared after it, a second tap unticking, a row's text opening the sheet at the item,
// やることを開く); the guest ticks from it. This phone's opt-in (Notification, PushManager and the service worker
// stubbed, the relay's /api/push routes mocked): asked in the tap, handed over, and a chosen person with no phone on
// named. Shots at 393×852, day and night (SHOTS=<dir>).
import { expect, test, type Browser, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { newIsland } from './liveRoom.ts';
import { fromMenu } from './hud.ts';
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
/** Items on the record (`due`, done), as `who` made them: ids `{id}i0`, `{id}i1` … */
function seed(island: Island, who: 'A' | 'G', id: string, items: { text: string; due?: string; done?: boolean; rem?: string; to?: string[] }[]) {
  const at = island.now();
  items.forEach((x, i) => expect(island.event(who, 'todo', {
    id: `${id}i${i}`, at: at + 1 + i, text: x.text, ord: i, done: x.done ? 1 : 0, ...(x.due && { due: x.due }), ...(x.rem && { rem: x.rem, to: x.to })
  })).toMatchObject({ ok: true }));
}

const top = (p: Page) => p.locator('dialog[open]').last();
const acts = (p: Page, text: string) => p.getByRole('button', { name: `「${text}」の操作`, exact: true });
const item = (p: Page, text: string) => p.locator('[data-todo-item]').filter({ has: acts(p, text) });
const chip = (p: Page, text: string) => item(p, text).locator('[data-todo-due]');
const disc = (p: Page) => p.locator('[data-hud-disc]');
const peek = (p: Page) => p.locator('[data-todo-peek]');
const banner = (p: Page) => p.getByRole('button', { name: '取り消す' });
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
  seed(island, 'A', 'dhome001', [{ text: '洗濯' }]);
  const { page: a } = await phone(browser, island, 'A', how);
  await fromMenu(a, 'todo', how);
  const field = a.locator('[data-todo-field]');
  // focused: the chips over the field; 今日, then two adds by the return key, both today's
  await field[how]();
  await expect(a.locator('[data-todo-quick]')).toBeVisible();
  await a.locator('[data-todo-quick-pick="today"]')[how]();
  await expect(field).toBeFocused();
  await expect(field).toHaveAttribute('placeholder', '今日の項目を追加');
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
  await expect(field).toHaveAttribute('placeholder', '11/24（火）の項目を追加');
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

test('the disc: today and before counted, coral when overdue; its peek ticks in place with 取り消す, opens an item and the sheet; the guest ticks too', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', 'dhome001', [
    { text: 'ゴミ出し', due: '2026-11-04' },
    { text: '牛乳を買う', due: '2026-11-04T15:00' },
    { text: '区役所に電話', due: '2026-11-02' },
    { text: '歯医者', due: '2026-11-05T09:30', rem: 'b60', to: ['A'] },
    { text: 'いつか', due: '2026-11-20' },
    { text: '日付なし' }
  ]);
  const { page: a } = await phone(browser, island, 'A', how);
  // left of the dumbbell, the leaf's size; 3 (1 overdue): coral
  await expect(disc(a)).toHaveAttribute('data-n', '3');
  await expect(disc(a)).toHaveAttribute('data-over', 'true');
  await expect(disc(a)).toHaveAccessibleName('やること 3けん');
  const [d, h] = [(await disc(a).boundingBox())!, (await a.locator('.hud-health').boundingBox())!];
  expect(d.width).toBe(44);
  expect(Math.round(h.x - (d.x + d.width))).toBe(6);
  expect(Math.abs(d.y + d.height / 2 - (h.y + h.height / 2))).toBeLessThan(1);
  // (the badge's pop runs once: no endless animation anywhere on the disc)
  expect(await disc(a).evaluate((el) => el.closest('.todo-disc')!.getAnimations({ subtree: true }).filter((x) => x.effect?.getComputedTiming().iterations === Infinity).length)).toBe(0);
  await shot(a, `todo-disc-overdue-${info.project.name}`);
  // the peek: 前の日, 今日 (timed first), 明日; tomorrow's not counted
  await disc(a)[how]();
  await expect(disc(a)).toHaveAttribute('aria-expanded', 'true');
  await expect(peek(a).locator('[data-peek-day]')).toHaveText(['前の日', '今日', '明日']);
  await expect(peek(a).locator('[data-peek-item] .name')).toHaveText(['区役所に電話', '牛乳を買う', 'ゴミ出し', '歯医者']);
  await expect(peek(a).locator('[data-peek-item] .when')).toHaveText(['11/2', '15:00', '9:30']);
  // under the disc, its right edge on the leaf's, inside the screen (once its drop is over)
  await peek(a).evaluate((el) => Promise.all(el.getAnimations().map((x) => x.finished)));
  const pb = (await peek(a).boundingBox())!, leaf = (await a.locator('[data-hud-menu]').boundingBox())!;
  expect(pb.y).toBeGreaterThan(d.y + d.height);
  expect(Math.abs(pb.x + pb.width - (leaf.x + leaf.width))).toBeLessThan(1.5);
  expect(pb.x).toBeGreaterThanOrEqual(13);
  await dayAndNight(a, 'todo-peek', info.project.name);
  // a tick: struck through in place, the count down (no overdue left: yuzu), 取り消す on the snackbar takes it back
  await peek(a).locator('[data-peek-item="dhome001i2"]').getByRole('checkbox')[how]();
  await expect(peek(a).locator('[data-peek-item="dhome001i2"]')).toHaveAttribute('data-done', 'true');
  await expect(disc(a)).toHaveAttribute('data-n', '2');
  await expect(disc(a)).not.toHaveAttribute('data-over');
  await shot(a, `todo-peek-ticked-${info.project.name}`);
  await banner(a)[how]();
  await expect(peek(a).locator('[data-peek-item="dhome001i2"]')).not.toHaveAttribute('data-done');
  await expect(disc(a)).toHaveAttribute('data-n', '3');
  // ticked again, and unticked by a second tap: nothing sent
  await peek(a).locator('[data-peek-item="dhome001i0"]').getByRole('checkbox')[how]();
  await peek(a).locator('[data-peek-item="dhome001i0"]').getByRole('checkbox')[how]();
  await expect(peek(a).locator('[data-peek-item="dhome001i0"]')).not.toHaveAttribute('data-done');
  // the guest's disc and peek: its own tick reaches A once the snackbar's 4 s are over
  const { page: g } = await phone(browser, island, 'G', how);
  await expect(disc(g)).toHaveAttribute('data-n', '3');
  await disc(g)[how]();
  await peek(g).locator('[data-peek-item="dhome001i1"]').getByRole('checkbox')[how]();
  if (how === 'click') await g.mouse.move(1, 1);
  await expect(peek(a).locator('[data-peek-item="dhome001i1"]')).toHaveCount(0, { timeout: 15_000 });
  await expect(disc(a)).toHaveAttribute('data-n', '2');
  // a tap elsewhere shuts it
  await g.mouse.click(200, 600);
  await expect(peek(g)).toHaveCount(0);
  // a row's text: the peek shuts, やること at the item, flashed
  await peek(a).locator('[data-peek-open="dhome001i3"]')[how]();
  await expect(a.locator('dialog[open] [data-todo]')).toBeVisible();
  await expect(peek(a)).toHaveCount(0);
  await expect(item(a, '歯医者')).toHaveClass(/hl/);
  await expect(item(a, '牛乳を買う')).toHaveAttribute('data-done', 'true');
  await shot(a, `todo-sheet-${info.project.name}`);
  await a.keyboard.press('Escape');
  await expect(a.locator('dialog[open]')).toHaveCount(0);
  // やることを開く
  await disc(a)[how]();
  await peek(a).locator('[data-peek-all]')[how]();
  await expect(a.locator('dialog[open] [data-todo]')).toBeVisible();
});

test('the disc: nothing due today or before, nothing drawn (tomorrow’s alone never lights it); today’s alone, yuzu', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', 'dhome001', [{ text: '日付なし' }, { text: '歯医者', due: '2026-11-05T09:30' }, { text: 'いつか', due: '2026-11-20' }, { text: '済み', due: '2026-11-03', done: true }]);
  const { page: a } = await phone(browser, island, 'A', how);
  await expect(a.locator('.hud-health')).toBeVisible();
  await expect(disc(a)).toHaveCount(0);
  // one due today comes in from the partner: the disc pops in, yuzu
  seed(island, 'G', 'dguest01', [{ text: '朝ごはん', due: '2026-11-04T08:00' }]);
  await expect(disc(a)).toHaveAttribute('data-n', '1');
  await expect(disc(a)).not.toHaveAttribute('data-over');
  await shot(a, `todo-disc-today-${info.project.name}`);
  // ticked from the peek: the disc stays while the peek is up, gone once it shuts
  await disc(a)[how]();
  await peek(a).locator('[data-peek-item="dguest01i0"]').getByRole('checkbox')[how]();
  await expect(disc(a)).toBeVisible();
  await a.keyboard.press('Escape');
  await expect(disc(a)).toHaveCount(0);
});

test('this phone’s opt-in: asked in the tap, handed to the relay; a chosen person with no phone on is named', async ({ browser }, info) => {
  const how = howOf(info.project.name);
  const island = newIsland();
  seed(island, 'A', 'dhome001', [{ text: '歯医者', due: '2026-11-05T09:30' }]);
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
  await chip(a, '歯医者')[how]();
  await top(a).locator('[data-due-rem="at"]')[how]();
  await top(a).locator('[data-due-to="B"]')[how]();
  await expect(top(a).locator('[data-due-off="B"]')).toHaveText('うめ：端末の通知がオフ');
  await expect(top(a).locator('[data-due-off="A"]')).toHaveCount(0);
  await expect(top(a).locator('[data-due-enable]')).toHaveCount(0);
  await top(a).locator('[data-todo-save]')[how]();
  await expect(chip(a, '歯医者').locator('svg')).toHaveCount(1);
});
