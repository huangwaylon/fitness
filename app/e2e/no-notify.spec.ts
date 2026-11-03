// つうち is gone (2026-11-02): せってい has no つうち, nothing asks for notification permission or subscribes, nothing
// is sent to the relay's old /push/* routes, and a phone that had it on lets its Web Push subscription go on the next
// open (sync/pushGone.ts), its old prefs forgotten.
import { expect, test, type Page } from '@playwright/test';

/** The page's browser with a service worker holding a subscription (Playwright blocks real ones), and a probe. */
async function fakePush(page: Page) {
  await page.addInitScript(() => {
    const probe = { asked: 0, subscribed: 0, unsubscribed: 0 };
    (window as unknown as { __push: typeof probe }).__push = probe;
    localStorage.setItem('island.push', JSON.stringify({ on: true, endpoint: 'https://web.push.apple.com/QOLD', lang: 'ja', at: 1 }));
    localStorage.setItem('island.goalSent', JSON.stringify({ me: 'A', date: '2026-11-01' }));
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

test('an old subscription is let go on open, its prefs forgotten; nothing asks, subscribes or calls /push', async ({ page }) => {
  const pushCalls: string[] = [];
  page.on('request', (r) => r.url().includes('/push/') && pushCalls.push(r.url()));
  await fakePush(page);
  await page.goto('?demo');
  await expect(page.getByRole('button', { name: /^ごほうび · ふたりのベル / })).toBeVisible();
  await expect.poll(() => probe(page)).toEqual({ asked: 0, subscribed: 0, unsubscribed: 1 });
  expect(await page.evaluate(() => [localStorage.getItem('island.push'), localStorage.getItem('island.goalSent')])).toEqual([null, null]);
  // せってい: no つうち section, no switch for it
  await page.getByRole('button', { name: /^ごほうび · ふたりのベル / }).click();
  const panel = page.locator('dialog[open]');
  await panel.locator('.tab[data-tab=settings]').click();
  await expect(panel.locator('#sec-sound')).toBeVisible();
  await expect(panel.locator('#sec-notify')).toHaveCount(0);
  await expect(panel).not.toContainText('つうち');
  await expect(panel).not.toContainText('しらせる');
  // a reload: nothing left to drop
  await page.reload();
  await expect(page.getByRole('button', { name: /^ごほうび · ふたりのベル / })).toBeVisible();
  await page.waitForTimeout(500); // (proving nothing more happens)
  expect((await probe(page)).subscribed).toBe(0);
  expect(pushCalls).toEqual([]);
});
