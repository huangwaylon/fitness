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

test('the reads begin with the HTML, before the page’s JS (gym/early.ts), and are each asked for once', async ({ page, context }) => {
  const { calls } = await linePhone(page, context);
  let release!: () => void;
  const held = new Promise<void>((r) => (release = r));
  await page.route(/\/_app\/immutable\/.*\.js$/, async (r) => {
    await held;
    await r.fallback();
  });
  await page.goto(`gym#${LINK}`, { waitUntil: 'commit' });
  // every chunk held: the inline script alone asked
  await expect.poll(() => [calls.status, calls.config]).toEqual([1, 1]);
  release();
  const root = page.locator('[data-gym-link="page"]');
  await expect(root.locator('[data-gym-day]')).toHaveCount(25);
  await expect(root.locator('[data-gym-verdict="degraded"]')).toBeVisible();
  await expect(root.locator('[data-bots-dot]')).toHaveRole('img'); // alone: no Jobs to open
  expect(new URL(page.url()).hash).toBe('');
  expect([calls.status, calls.config]).toEqual([1, 1]);
  expect(await page.evaluate(() => '__gymEarly' in window)).toBe(false); // taken, the key gone with it
});

test('a refused link key (rotated: an old card): the kept settings dropped, a line naming the cure', async ({ page, context }) => {
  await linePhone(page, context);
  await page.goto(`gym#${LINK}`);
  await expect(page.locator('[data-gym-day]')).toHaveCount(25);
  expect(await page.evaluate(() => localStorage.getItem('island.gymConfig'))).not.toBeNull();
  await page.route(CONFIG, (r) =>
    r.request().method() === 'OPTIONS' ? r.fallback() : r.fulfill({ status: 401, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: '{"ok":false,"error":"unauthorized"}' }));
  await page.goto('about:blank'); // (a new load: from /gym, the hash alone would be a jump in the page)
  await page.goto(`gym#${'7a'.repeat(32)}`);
  await expect(page.locator('[data-gym-link-none="old"]')).toHaveText(/「メニュー」と送ると/);
  await expect(page.locator('[data-gym-day]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('island.gymConfig'))).toBeNull();
});

test('a repeat open paints the kept status and calendar before any answer; back to the page after leaving it, the same', async ({ page, context }) => {
  await linePhone(page, context);
  await page.goto(`gym#${LINK}`);
  await expect(page.locator('[data-gym-day]')).toHaveCount(25);
  await expect(page.locator('[data-gym-verdict="degraded"]')).toBeVisible();
  // the Worker silent from now on (lie-fi): nothing answers
  await page.route(/gym-bot\.island-fund-relay\.workers\.dev\//, () => new Promise(() => {}));
  await page.goto('about:blank');
  await page.goto(`gym#${LINK}`);
  await expect(page.locator('[data-gym-day]')).toHaveCount(25);
  await expect(page.locator('[data-gym-verdict="degraded"]')).toBeVisible();
  await page.goto('about:blank');
  await page.goBack(); // (LINE's ‹: the hash already gone, the tab's key read)
  await expect(page.locator('[data-gym-day]')).toHaveCount(25);
  expect(new URL(page.url()).hash).toBe('');
});
