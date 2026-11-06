// つうち is gone (2026-11-02): せってい has no つうち, nothing asks for notification permission or subscribes, and nothing
// is sent to the relay's old /push/* routes (gone too, 2026-11-05: every phone let its subscription go by then).
import { expect, test, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';

/** The page's browser with a service worker holding a subscription (Playwright blocks real ones), and a probe. */
async function fakePush(page: Page) {
  await page.addInitScript(() => {
    const probe = { asked: 0, subscribed: 0, unsubscribed: 0 };
    (window as unknown as { __push: typeof probe }).__push = probe;
    Object.defineProperty(window, 'Notification', {
      value: class { static permission = 'granted'; static async requestPermission() { probe.asked++; return 'granted'; } },
      configurable: true
    });
    let sub: object | null = { endpoint: 'https://web.push.apple.com/QOLD', unsubscribe: async () => ((probe.unsubscribed++, (sub = null)), true) };
    const pushManager = { getSubscription: async () => sub, subscribe: async () => (probe.subscribed++, sub) };
    const reg = { pushManager, update: async () => {}, addEventListener() {} };
    const sw = { ready: Promise.resolve(reg), register: async () => reg, getRegistration: async () => reg, getRegistrations: async () => [reg], addEventListener() {}, controller: null };
    Object.defineProperty(Navigator.prototype, 'serviceWorker', { get: () => sw, configurable: true });
  });
}
const probe = (page: Page) => page.evaluate(() => (window as unknown as { __push: { asked: number; subscribed: number; unsubscribed: number } }).__push);

test('nothing asks, subscribes or calls /push; せってい has no つうち', async ({ page }) => {
  const pushCalls: string[] = [];
  page.on('request', (r) => r.url().includes('/push/') && pushCalls.push(r.url()));
  await fakePush(page);
  await page.goto('?demo');
  await islandUp(page);
  // せってい: no つうち section, no switch for it
  await fromMenu(page, 'settings');
  const panel = page.locator('dialog[open]');
  await expect(panel.locator('#sec-sound')).toBeVisible();
  await expect(panel.locator('#sec-notify')).toHaveCount(0);
  await expect(panel).not.toContainText('つうち');
  await expect(panel).not.toContainText('しらせる');
  // a reload: still nothing
  await page.reload();
  await islandUp(page);
  await page.waitForTimeout(500); // (proving nothing happens)
  expect(await probe(page)).toEqual({ asked: 0, subscribed: 0, unsubscribed: 0 });
  expect(pushCalls).toEqual([]);
});
