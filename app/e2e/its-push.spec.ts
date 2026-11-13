// ボット → 保養所's 通知 (docs/design.md "Bots"; lib/its/push.ts): off by default; the permission asked only by the switch's
// tap; the subscription (for the Worker's key from its status) POSTed to /its/push/subscribe; on only once the Worker
// took it, kept across a reload; off unsubscribes at the Worker and in the browser; テスト通知 (429: 「30秒ほど待ってから
// もう一度」); the lines where it can't work (an iPhone's Safari tab, refused notifications, a Worker without push yet);
// and a notification's tap: `?open=its` and the service worker's message open ボット on 保養所. The browser's
// Notification, PushManager and service worker are stubbed (Playwright has no push service), the Worker mocked (its.ts).
import { expect, test, type BrowserContext, type Page, type Route } from './fixtures.ts';
import { unfoldMenu } from './hud.ts';
import { islandUp } from './island.ts';
import { newRecord } from './record.ts';
import { ORIGIN, cors, payload, type Status } from './its.ts';
import example from '../../its/contract-example.json' with { type: 'json' };

type Call = { path: string; body: Record<string, unknown> | null };
type Opts = { permission?: NotificationPermission; grant?: NotificationPermission; standalone?: boolean; push?: Status['push'] | null; test?: number };

/** The browser's push, stubbed: the permission (asked: counted), a push manager holding one subscription, a service
 *  worker whose messages a spec can send (`__swSay`); `standalone`: the Home Screen app. */
async function stubPush(context: BrowserContext, o: Opts) {
  await context.addInitScript(({ permission, grant, standalone }) => {
    const probe = { asked: 0, subscribed: 0, unsubscribed: 0, key: '' };
    const w = window as unknown as { __push: typeof probe; __swSay: (d: unknown) => void };
    w.__push = probe;
    const saved = localStorage.getItem('e2e.pushSub');
    let sub: object | null = null;
    const make = (endpoint: string) => ({
      endpoint, options: { applicationServerKey: null },
      toJSON: () => ({ endpoint, keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } }),
      unsubscribe: async () => (probe.unsubscribed++, (sub = null), localStorage.removeItem('e2e.pushSub'), true)
    });
    if (saved) sub = make(saved);
    // (the answer kept across a reload, as the browser keeps it)
    const N = { permission: (localStorage.getItem('e2e.pushPerm') as NotificationPermission | null) ?? permission,
      requestPermission: async () => (probe.asked++, localStorage.setItem('e2e.pushPerm', grant), (N.permission = grant)) };
    Object.defineProperty(window, 'Notification', { value: N, configurable: true });
    Object.defineProperty(window, 'PushManager', { value: class {}, configurable: true });
    const pushManager = {
      getSubscription: async () => sub,
      subscribe: async (opts: { applicationServerKey: Uint8Array }) => {
        probe.subscribed++;
        probe.key = btoa(String.fromCharCode(...opts.applicationServerKey)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        localStorage.setItem('e2e.pushSub', 'https://web.push.apple.com/QE2E');
        return (sub = make('https://web.push.apple.com/QE2E'));
      }
    };
    const listeners: ((e: { data: unknown }) => void)[] = [];
    w.__swSay = (data) => listeners.forEach((f) => f({ data }));
    const reg = { pushManager, update: async () => {}, addEventListener() {}, unregister: async () => true };
    const sw = {
      ready: Promise.resolve(reg), register: async () => reg, getRegistration: async () => reg, getRegistrations: async () => [reg], controller: null,
      addEventListener: (t: string, f: (e: { data: unknown }) => void) => void (t === 'message' && listeners.push(f)), removeEventListener() {}
    };
    Object.defineProperty(Navigator.prototype, 'serviceWorker', { get: () => sw, configurable: true });
    if (standalone) Object.defineProperty(Navigator.prototype, 'standalone', { get: () => true, configurable: true });
  }, { permission: o.permission ?? 'default', grant: o.grant ?? 'granted', standalone: o.standalone ?? true });
}
const probe = (page: Page) => page.evaluate(() => (window as unknown as { __push: { asked: number; subscribed: number; unsubscribed: number; key: string } }).__push);

/** A member's phone with the push stubs, the Worker answering its status (with `push`: the example's, null = an older
 *  Worker without it) and the push routes (404 from one without them; `test`: the test route's status). */
async function phone(page: Page, context: BrowserContext, o: Opts = {}) {
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  // (保養所 the tab last shown on this phone: ジム is the first opening's)
  await context.addInitScript(() => localStorage.setItem('island.botsTab', 'its'));
  await rec.pair(context, 'A');
  await stubPush(context, o);
  const push = o.push === undefined ? (example.statusNewer.push as Status['push']) : o.push;
  const calls: Call[] = [];
  await page.route(`${ORIGIN}/**`, async (route: Route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors() });
    const path = new URL(req.url()).pathname;
    const reply = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', headers: cors(), body: JSON.stringify(body) }).catch(() => {});
    if (path.startsWith('/its/push/')) {
      calls.push({ path, body: req.postData() ? JSON.parse(req.postData()!) : null });
      if (!push) return reply(404, { ok: false, error: 'not_found' });
      if (path === '/its/push/test' && o.test && o.test !== 200) return reply(o.test, { ok: false, error: 'rate_limited' });
      return reply(200, { ok: true, push });
    }
    const s = payload(rec.now());
    return reply(200, push ? { ...s, push } : s);
  });
  await page.goto('');
  await islandUp(page);
  const open = async () => {
    await unfoldMenu(page);
    await page.locator('[data-hud-bots]').click();
    await expect(page.locator('dialog[open] [data-its-verdict]')).toBeVisible();
  };
  return { calls, open, notify: page.locator('dialog[open] [data-its-notify]'), pushes: () => calls.filter((c) => c.path === '/its/push/subscribe') };
}

test('off by default; only the tap asks; on once the Worker took the subscription (its key, this phone’s language); kept across a reload; off unsubscribes', async ({ page, context }) => {
  const { calls, open, notify, pushes } = await phone(page, context);
  await open();
  const sw = notify.locator('[role="switch"]');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(notify).toContainText('仮押さえと予約確定を通知する');
  await expect(notify.locator('[data-its-push-note]')).toContainText('メール');
  await expect(notify.locator('[data-its-push-test]')).toHaveCount(0);
  expect(await probe(page)).toMatchObject({ asked: 0, subscribed: 0 });

  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  expect(await probe(page)).toMatchObject({ asked: 1, subscribed: 1, key: example.statusNewer.push.vapidPublic });
  expect(pushes()).toEqual([{ path: '/its/push/subscribe', body: { endpoint: 'https://web.push.apple.com/QE2E', keys: { p256dh: expect.any(String), auth: 'BTBZMqHH6r4Tts7J_aSIgg' }, lang: 'ja' } }]);

  // a reload: still on, nothing asked or handed over again (fresh)
  await page.reload();
  await islandUp(page);
  await open();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await page.waitForTimeout(300); // (proving the refresh sends nothing)
  expect(await probe(page)).toMatchObject({ asked: 0, subscribed: 0 });
  expect(pushes()).toHaveLength(1);

  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect.poll(() => calls.filter((c) => c.path === '/its/push/unsubscribe').map((c) => c.body)).toEqual([{ endpoint: 'https://web.push.apple.com/QE2E' }]);
  await expect.poll(async () => (await probe(page)).unsubscribed).toBe(1);
});

test('テスト通知 goes to this phone’s endpoint; the Worker’s rate says 「30秒ほど待ってからもう一度」', async ({ page, context }) => {
  const { calls, open, notify } = await phone(page, context, { test: 429 });
  await open();
  await notify.locator('[role="switch"]').click();
  const btn = notify.locator('[data-its-push-test]');
  await btn.click();
  await expect(notify.locator('[data-its-push-tested]')).toHaveText('30秒ほど待ってからもう一度');
  expect(calls.filter((c) => c.path === '/its/push/test').map((c) => c.body)).toEqual([{ endpoint: 'https://web.push.apple.com/QE2E' }]);
  const box = (await btn.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test('where it can’t work, one line says why: an iPhone’s Safari tab, refused notifications, a Worker without push yet', async ({ browser }) => {
  const cases: [Opts, string, string][] = [
    [{ standalone: false }, 'install', 'ホーム画面に追加すると通知を受け取れます'],
    [{ permission: 'denied', grant: 'denied' }, 'denied', '設定アプリ → 通知で許可してください'],
    [{ push: null }, 'soon', '通知は準備中です']
  ];
  for (const [o, why, text] of cases) {
    const context = await browser.newContext({ ...test.info().project.use, serviceWorkers: 'block' });
    const page = await context.newPage();
    const { open, notify, calls } = await phone(page, context, o);
    await open();
    await expect(notify.locator('[data-its-push-why]')).toHaveAttribute('data-its-push-why', why);
    await expect(notify.locator('[data-its-push-why]')).toHaveText(text);
    // refused: a tap asks again (the browser answers at once: still refused); else the switch can't be used
    const sw = notify.locator('[role="switch"]');
    if (why === 'denied') await sw.click();
    else await expect(sw).toHaveAttribute('aria-disabled', 'true');
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(await probe(page)).toMatchObject({ subscribed: 0, ...(why === 'denied' ? {} : { asked: 0 }) });
    expect(calls).toEqual([]);
    await context.close();
  }
});

test('a notification’s tap: ?open=its opens ボット on 保養所 (the param let go); the service worker’s message does too', async ({ page, context }) => {
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await context.addInitScript(() => localStorage.setItem('island.botsTab', 'gym'));
  await rec.pair(context, 'A');
  await stubPush(context, {});
  await page.route(`${ORIGIN}/**`, (route) => route.request().method() === 'OPTIONS'
    ? route.fulfill({ status: 204, headers: cors() })
    : route.fulfill({ status: 200, contentType: 'application/json', headers: cors(), body: JSON.stringify(payload(rec.now())) }));
  await page.goto('?open=its');
  await islandUp(page);
  const sheet = page.locator('dialog[open] [data-bots]');
  await expect(sheet).toHaveAttribute('data-tab', 'its');
  await expect(sheet.locator('[data-its-verdict]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => location.search)).toBe('');
  // (still open on 保養所 once the launch is settled, the param let go only then: the user's report, 2026-11-13)
  await expect(sheet).toHaveAttribute('data-tab', 'its');
  // closed, then a tap on a notification while the app is open: the worker's message
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await page.evaluate(() => (window as unknown as { __swSay: (d: unknown) => void }).__swSay({ k: 'open', to: 'its' }));
  await expect(sheet.locator('[data-its-verdict]')).toBeVisible();
  await expect(sheet).toHaveAttribute('data-tab', 'its');
});
