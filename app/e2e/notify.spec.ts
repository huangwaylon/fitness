// せってい → つうち (docs/backend.md#notifications) in the built app, with the browser's notification permission, the
// push subscription and the relay mocked: the switch is off by default, asks permission only on a tap, hands the
// subscription to the relay, turns off again, and says why when it can't work.
import { expect, test, type Page } from '@playwright/test';

const KEY = 'ab'.repeat(16);
const RELAY = 'https://island-fund-relay.island-fund-relay.workers.dev';

type Probe = { asked: number; subscribed: number; unsubscribed: number };

/** A fake Notification / PushManager / service worker; `push: false` = a browser without Web Push (Safari in a tab). */
async function fakeBrowser(page: Page, o: { answer?: NotificationPermission; push?: boolean } = {}) {
  await page.addInitScript(({ key, answer, push }) => {
    localStorage.setItem('island.key', key);
    const probe: Probe = { asked: 0, subscribed: 0, unsubscribed: 0 };
    (window as unknown as { __probe: Probe }).__probe = probe;
    if (!push) {
      delete (window as { PushManager?: unknown }).PushManager;
      return;
    }
    // (the Home Screen app's Web Push: Playwright's WebKit has no PushManager of its own)
    if (!('PushManager' in window)) Object.defineProperty(window, 'PushManager', { value: class PushManager {}, configurable: true });
    let permission: NotificationPermission = 'default';
    class FakeNotification {
      static get permission() { return permission; }
      static async requestPermission() {
        probe.asked++;
        permission = answer;
        return answer;
      }
    }
    Object.defineProperty(window, 'Notification', { value: FakeNotification, configurable: true });
    let sub: object | null = null;
    const pushManager = {
      getSubscription: async () => sub,
      subscribe: async (opts: { applicationServerKey: Uint8Array }) => {
        probe.subscribed++;
        const endpoint = `https://web.push.apple.com/QTEST${probe.subscribed}`;
        sub = {
          endpoint,
          options: { applicationServerKey: opts.applicationServerKey.buffer },
          toJSON: () => ({ endpoint, expirationTime: null, keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) } }),
          unsubscribe: async () => ((probe.unsubscribed++, (sub = null)), true)
        };
        return sub;
      }
    };
    const reg = { pushManager, update: async () => {}, addEventListener() {} };
    const sw = { ready: Promise.resolve(reg), register: async () => reg, getRegistration: async () => reg, addEventListener() {}, controller: null };
    Object.defineProperty(Navigator.prototype, 'serviceWorker', { get: () => sw, configurable: true });
  }, { key: KEY, answer: o.answer ?? 'granted', push: o.push ?? true });
}

/** The relay's /push/* answered here; the bodies it got. */
async function fakeRelay(page: Page) {
  const got: { path: string; body: Record<string, unknown> }[] = [];
  await page.route(`${RELAY}/push/**`, async (route) => {
    const req = route.request();
    got.push({ path: new URL(req.url()).pathname, body: JSON.parse(req.postData() ?? '{}') });
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' });
  });
  return got;
}

async function openSettings(page: Page) {
  await page.goto('?demo');
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  const dlg = page.locator('dialog[open]');
  await dlg.locator('.tab[data-tab=settings]').click();
  const sec = dlg.locator('section[aria-labelledby=sec-notify]');
  await expect(sec.getByRole('heading', { name: 'つうち' })).toBeVisible();
  return { sec, sw: sec.getByRole('switch', { name: /うめの ぜんぶ たっせいを しらせる/ }) };
}

const probe = (page: Page) => page.evaluate(() => (window as unknown as { __probe: Probe }).__probe);

test('the switch is off by default; on asks permission once, subscribes and tells the relay; off undoes it', async ({ page }) => {
  await fakeBrowser(page);
  const got = await fakeRelay(page);
  const { sw, sec } = await openSettings(page);
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(sec).toContainText('22時〜8時は おやすみ');
  expect((await probe(page)).asked).toBe(0); // nothing asked until the tap

  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  expect(await probe(page)).toMatchObject({ asked: 1, subscribed: 1 });
  expect(got).toEqual([{ path: '/push/subscribe', body: { key: KEY, lang: 'ja', sub: { endpoint: 'https://web.push.apple.com/QTEST1', expirationTime: null, keys: { p256dh: 'B'.repeat(87), auth: 'A'.repeat(22) } } } }]);
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('island.push')))!)).toMatchObject({ on: true, endpoint: 'https://web.push.apple.com/QTEST1', lang: 'ja' });

  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect.poll(() => got.length).toBe(2);
  expect(got[1]).toEqual({ path: '/push/unsubscribe', body: { key: KEY, endpoint: 'https://web.push.apple.com/QTEST1' } });
  await expect.poll(async () => (await probe(page)).unsubscribed).toBe(1);

  // kept per phone: a reload opens it off (and on stays on)
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  const again = await openSettings(page);
  await expect(again.sw).toHaveAttribute('aria-checked', 'true');
});

test('permission refused: stays off and says where to turn it on', async ({ page }) => {
  await fakeBrowser(page, { answer: 'denied' });
  const got = await fakeRelay(page);
  const { sw, sec } = await openSettings(page);
  await sw.click();
  await expect(sec.getByRole('status')).toContainText('せってい → つうち → しまの貯金箱');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  expect(got).toEqual([]);
});

test("an iPhone's Safari tab: no prompt, a note to add the app to the Home Screen", async ({ page }) => {
  await fakeBrowser(page, { push: false });
  const { sw, sec } = await openSettings(page);
  await expect(sw).toHaveAttribute('aria-disabled', 'true');
  await expect(sec).toContainText('ホーム画面に追加した アプリで つかえます');
  await sw.click({ force: true }); // aria-disabled: a tap does nothing
  await expect(sw).toHaveAttribute('aria-checked', 'false');
});
