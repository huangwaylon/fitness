// Two phones' live sync through what a phone's network does to them (docs/backend.md#live-sync): the relay's real
// room and record in the test's process (e2e/liveRoom.ts), each phone its own browser context, in the logic tier's way
// (nothing drawn). What the reviewer's two-phone experiments found, each kept as a regression:
//   E15  a 3.5 s app switch while the partner writes: the record's change is fetched on coming back
//   E14  the relay closes the socket (1012, a deploy) while the partner writes: fetched after the reconnect
//   dead a socket that stays open and carries nothing: found out and replaced, what was sent goes again
//   kill an intent made offline and the app killed before it went: sent when the app opens again
import { expect, test, type Browser, type Page } from '@playwright/test';
import { DEMO_CTX, newIsland, setVisible } from './liveRoom.ts';
import { hudMenu } from './hud.ts';

type Island = ReturnType<typeof newIsland>;
type Who = 'A' | 'B';

/** A paired phone (the live app) on `island`. */
async function phone(browser: Browser, island: Island, who: Who) {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await island.pair(context, who);
  const page = await context.newPage();
  await page.goto('');
  await expect(hudMenu(page)).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => island.sockets(who), { timeout: 10_000 }).toBe(1);
  return page;
}

type W = { share(i: object): boolean; canon(): string; status(): { connected: boolean; peer: boolean } | null; metrics(): { pending: number; closed: number } | null };
const w = <T,>(p: Page, fn: keyof W, ...args: unknown[]) =>
  p.evaluate(([fn, args]) => ((window as unknown as { __world: Record<string, (...a: unknown[]) => unknown> }).__world[fn as string](...(args as unknown[]))), [fn, args] as const) as Promise<T>;

/** A demo phone (its hooks on) on `island`'s room; `context` kept for a second page (the app killed and opened again). */
async function demoPhone(browser: Browser, island: Island, who: Who) {
  const context = await browser.newContext({ ...DEMO_CTX, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await island.demo(context, who);
  const open = async () => {
    const page = await context.newPage();
    await page.goto(island.demoUrl(who));
    await page.waitForFunction(() => (window as unknown as { __world?: { state?: unknown } }).__world?.state);
    return page;
  };
  return { context, open, page: await open() };
}
const connected = (p: Page) => expect.poll(() => w<{ connected: boolean } | null>(p, 'status').then((s) => !!s?.connected), { timeout: 10_000 }).toBe(true);
/** A catch of a critter no island has (its own id: nothing on screen claims it), as the e2e's share does. */
const fakeCatch = (id: string) => ({ kind: 'catch', what: 'koi', id, how: 'net' });

test.afterEach(async ({ browser }) => {
  for (const c of browser.contexts()) await c.close();
});

test('E15: back from a 3.5 s app switch, a phone fetches what the partner wrote meanwhile', async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const a = await phone(browser, island, 'A');
  await phone(browser, island, 'B');
  // (the opening's fetches done)
  await a.waitForTimeout(1500);
  await setVisible(a, false);
  await expect.poll(() => island.sockets('A')).toBe(0);
  const before = island.fetches('A');
  expect(island.event('B', 'pref', { key: 'villagerName', value: 'うめこ' })).toMatchObject({ ok: true });
  await a.waitForTimeout(3500);
  await setVisible(a, true);
  await expect.poll(() => island.sockets('A'), { timeout: 10_000 }).toBe(1);
  // the welcome said the record moved on: fetched, inside the 30 s floor
  await expect.poll(() => island.fetches('A'), { timeout: 5000 }).toBeGreaterThan(before);
});

test('E14: after the relay restarts (1012), a phone fetches what the partner wrote while its socket was down', async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const a = await phone(browser, island, 'A');
  await phone(browser, island, 'B');
  await a.waitForTimeout(1500);
  const before = island.fetches('A');
  island.drop('A', 1012);
  expect(island.event('B', 'pref', { key: 'villagerName', value: 'うめこ' })).toMatchObject({ ok: true });
  await expect.poll(() => island.sockets('A'), { timeout: 10_000 }).toBe(1);
  await expect.poll(() => island.fetches('A'), { timeout: 5000 }).toBeGreaterThan(before);
  // and a reconnect with nothing new fetches nothing
  await a.waitForTimeout(1000);
  const after = island.fetches('A');
  island.drop('A', 1012);
  await expect.poll(() => island.sockets('A'), { timeout: 10_000 }).toBe(1);
  await a.waitForTimeout(1500);
  expect(island.fetches('A')).toBe(after);
});

test('a dead socket (open, carrying nothing) is found out: what I sent on it reaches the partner', async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const { page: a } = await demoPhone(browser, island, 'A');
  const { page: b } = await demoPhone(browser, island, 'B');
  await connected(a);
  await connected(b);
  island.dead('A');
  const id = `e2e-dead-${Date.now().toString(36).slice(-5)}`;
  expect(await w<boolean>(a, 'share', fakeCatch(id))).toBe(true);
  // its ack never comes: the phone gives the socket up, opens another and sends it again
  await expect.poll(() => w<string>(b, 'canon').then((c) => c.includes(id)), { timeout: 15_000 }).toBe(true);
});

test('a dead socket is found out on coming back to the app (focus): the partner’s news arrives', async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const { page: a } = await demoPhone(browser, island, 'A');
  const { page: b } = await demoPhone(browser, island, 'B');
  await connected(a);
  await connected(b);
  island.dead('A');
  const id = `e2e-wake-${Date.now().toString(36).slice(-5)}`;
  expect(await w<boolean>(b, 'share', fakeCatch(id))).toBe(true);
  // the room's send to A's socket was lost; back in the app, a ping goes unanswered and a new socket replays the day
  await a.waitForTimeout(300);
  await a.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => w<string>(a, 'canon').then((c) => c.includes(id)), { timeout: 15_000 }).toBe(true);
});

test('kill: a change made offline and the app killed before it went is sent when the app opens again', async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const A = await demoPhone(browser, island, 'A');
  const { page: b } = await demoPhone(browser, island, 'B');
  await connected(A.page);
  await connected(b);
  island.offline('A');
  await expect.poll(() => w<{ connected: boolean } | null>(A.page, 'status').then((s) => !!s?.connected)).toBe(false);
  const id = `e2e-kill-${Date.now().toString(36).slice(-5)}`;
  expect(await w<boolean>(A.page, 'share', fakeCatch(id))).toBe(true);
  expect(await w<{ pending: number } | null>(A.page, 'metrics').then((m) => m?.pending)).toBe(1);
  // killed (the page gone, nothing sent), then opened again online
  await A.page.close();
  island.offline('A', false);
  const a2 = await A.open();
  await connected(a2);
  await expect.poll(() => w<string>(b, 'canon').then((c) => c.includes(id)), { timeout: 10_000 }).toBe(true);
  await expect.poll(() => w<{ pending: number } | null>(a2, 'metrics').then((m) => m?.pending), { timeout: 5000 }).toBe(0);
});
