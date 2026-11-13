// Notifications are ボット → 保養所's alone (docs/decisions.md; lib/its/push.ts): nothing in the app asks for the
// notification permission, subscribes to push or calls a /push/ route, until a member taps 保養所's 通知 switch, and
// then only the its-bot Worker's /its/push/subscribe is called. (The relay's old /push/* routes are gone: 2026-11-05.)
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu, unfoldMenu } from './hud.ts';
import { newRecord } from './record.ts';
import { ORIGIN, cors, payload } from './its.ts';
import example from '../../its/contract-example.json' with { type: 'json' };

/** The page's browser with a service worker that can subscribe (Playwright blocks real ones), the Home Screen app,
 *  and a probe. */
async function fakePush(page: Page) {
  await page.addInitScript(() => {
    const probe = { asked: 0, subscribed: 0, unsubscribed: 0 };
    (window as unknown as { __push: typeof probe }).__push = probe;
    const N = { permission: 'default', requestPermission: async () => (probe.asked++, (N.permission = 'granted')) };
    Object.defineProperty(window, 'Notification', { value: N, configurable: true });
    Object.defineProperty(window, 'PushManager', { value: class {}, configurable: true });
    let sub: object | null = null;
    const make = () => ({
      endpoint: 'https://web.push.apple.com/QNEW', options: { applicationServerKey: null },
      toJSON: () => ({ endpoint: 'https://web.push.apple.com/QNEW', keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } }),
      unsubscribe: async () => ((probe.unsubscribed++, (sub = null)), true)
    });
    const pushManager = { getSubscription: async () => sub, subscribe: async () => (probe.subscribed++, (sub = make())) };
    const reg = { pushManager, update: async () => {}, addEventListener() {} };
    const sw = { ready: Promise.resolve(reg), register: async () => reg, getRegistration: async () => reg, getRegistrations: async () => [reg], addEventListener() {}, removeEventListener() {}, controller: null };
    Object.defineProperty(Navigator.prototype, 'serviceWorker', { get: () => sw, configurable: true });
    Object.defineProperty(Navigator.prototype, 'standalone', { get: () => true, configurable: true });
  });
}
const probe = (page: Page) => page.evaluate(() => (window as unknown as { __push: { asked: number; subscribed: number; unsubscribed: number } }).__push);

test('nothing asks, subscribes or calls /push/ but 保養所’s 通知 switch, and only on its tap', async ({ page, context }) => {
  const rec = newRecord();
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await rec.pair(context, 'A');
  const pushCalls: string[] = [];
  page.on('request', (r) => r.url().includes('/push/') && pushCalls.push(new URL(r.url()).origin + new URL(r.url()).pathname));
  await page.route(`${ORIGIN}/**`, (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors() });
    const body = new URL(req.url()).pathname.startsWith('/its/push/') ? { ok: true, push: example.statusNewer.push } : { ...payload(rec.now()), push: example.statusNewer.push };
    return route.fulfill({ status: 200, contentType: 'application/json', headers: cors(), body: JSON.stringify(body) });
  });
  await fakePush(page);
  await page.goto('');
  await islandUp(page);
  // 設定: no 通知 of its own
  await fromMenu(page, 'settings');
  const settings = page.locator('dialog[open]');
  await expect(settings.locator('#sec-sound')).toBeVisible();
  await expect(settings).not.toContainText('通知');
  await page.keyboard.press('Escape');
  await expect(settings).toHaveCount(0);
  // a reload, then ボット → 保養所 opened: still nothing (the switch is off)
  await page.reload();
  await islandUp(page);
  await unfoldMenu(page);
  await page.locator('[data-hud-bots]').click();
  const notify = page.locator('dialog[open] [data-its-notify]');
  await expect(notify.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'false');
  await page.waitForTimeout(500); // (proving nothing happens)
  expect(await probe(page)).toEqual({ asked: 0, subscribed: 0, unsubscribed: 0 });
  expect(pushCalls).toEqual([]);
  // the tap: asked once, subscribed once, handed to the its-bot Worker only
  await notify.locator('[role="switch"]').click();
  await expect(notify.locator('[role="switch"]')).toHaveAttribute('aria-checked', 'true');
  expect(await probe(page)).toEqual({ asked: 1, subscribed: 1, unsubscribed: 0 });
  expect(pushCalls).toEqual([`${ORIGIN}/its/push/subscribe`]);
});
