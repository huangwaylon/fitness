// The LINE menu's 📱 アプリで設定 (gym/README.md): `/gym#<key>` on a phone with no key of its own (LINE's browser) shows
// ジム's page alone, its reads and changes sent with the link's key, the key out of the URL and kept for a reload; no
// key, a line instead. The Worker is e2e/gymbot.ts's stand-in, at the pinned clock (11/4（水） 12:00). No network.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { pinnedClock } from './fixtures.ts';
import { fakeGym, routeGym, CONFIG, ACT } from './gymbot.ts';

const LINK = '5e'.repeat(32);
const RELAY = /island-fund-relay\.workers\.dev\/(?!gym|status)|\/room/;

async function linePhone(page: Page, context: BrowserContext) {
  const clock = pinnedClock();
  await clock.device(context);
  const gym = fakeGym(clock.now);
  const calls = await routeGym(page, gym, clock.now);
  const keys: string[] = [];
  page.on('request', (r) => {
    if (r.url() === CONFIG || r.url() === ACT) if (r.method() !== 'OPTIONS') keys.push(r.headers().authorization ?? '');
  });
  const relay: string[] = [];
  page.on('request', (r) => void (RELAY.test(r.url()) && !r.url().includes('gym-bot') && relay.push(r.url())));
  return { gym, calls, keys, relay };
}

test('the link opens ジム alone with its key: reads, a change, the key out of the URL and kept for a reload', async ({ page, context }) => {
  const { gym, keys, relay } = await linePhone(page, context);
  await page.goto(`gym#${LINK}`);
  const root = page.locator('[data-gym-link="page"]');
  await expect(root.locator('.navbar')).toContainText('ジム');
  const day = (i: number) => root.locator(`[data-gym-day="${gym.days[i]}"]`);
  await expect(root.locator('[data-gym-day]')).toHaveCount(25);
  expect(new URL(page.url()).hash).toBe('');
  await day(5).click();
  await page.locator('dialog[open] [data-gym-editor] [data-gym-kind="any"]').click();
  await expect(day(5)).toHaveAttribute('data-fill', 'any');
  await expect.poll(() => gym.acts).toEqual([{ a: 'any', d: gym.days[5], base: 'v0' }]);
  await page.reload();
  await expect(day(5)).toHaveAttribute('data-fill', 'any');
  expect(new Set(keys)).toEqual(new Set([`Bearer ${LINK}`]));
  expect(relay).toEqual([]); // no island: no record, no room
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('no key in the link: a line saying to open it from LINE, nothing asked', async ({ page, context }) => {
  const { calls } = await linePhone(page, context);
  await page.goto('gym');
  await expect(page.locator('[data-gym-link-none]')).toHaveText(/LINEのメニュー/);
  expect(calls.config + calls.act).toBe(0);
});
