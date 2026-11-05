// Two phones' live sync through what a phone's network does to them (docs/backend.md#live-sync): the relay's real
// room and record in the test's process (e2e/liveRoom.ts), each phone its own browser context, in the logic tier's way
// (nothing drawn). What the reviewer's two-phone experiments found, each kept as a regression:
//   E15  a 3.5 s app switch while the partner writes: the record's change is fetched on coming back
//   E14  the relay closes the socket (1012, a deploy) while the partner writes: fetched after the reconnect
//   dead a socket that stays open and carries nothing: found out and replaced, what was sent goes again
//   kill an intent made offline and the app killed before it went: sent when the app opens again
//   E13  both phones move a different piece onto one tile at once: the later op's phone moves its piece off
//   tabs two tabs of one phone (the second's socket replaces the first's): neither's layout ops written over
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

type W = { layoutStamp(): number; layoutApply(ops: object[]): number; share(i: object): boolean; canon(): string; status(): { connected: boolean; peer: boolean } | null; metrics(): { pending: number; closed: number } | null };
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

type Obj = { id: string; k: string; x: number; z: number; f: number };
type L = { obj(id: string): Obj | undefined; ids(k: string): string[] };
const lay = <T,>(p: Page, fn: (l: L, arg: string) => T, arg = '') => p.evaluate(([f, a]) => new Function('l', 'a', `return (${f})(l, a)`)((window as unknown as { __layout: L }).__layout, a), [fn.toString(), arg] as const) as Promise<T>;
/** One of my palms moved one tile east, as the editor would (its stamp the layout's). */
async function nudge(p: Page, id: string): Promise<Obj> {
  const o = (await lay(p, (l, id) => l.obj(id), id))!;
  const at = await w<number>(p, 'layoutStamp');
  const op = { sc: 'o', id, at, k: o.k, x: o.x + 1, z: o.z, f: o.f };
  expect(await w<number>(p, 'layoutApply', [op])).toBe(1);
  return { ...o, x: o.x + 1 };
}

test('two tabs of one phone: each one’s layout op is kept, and the other tab folds it in', async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const A = await demoPhone(browser, island, 'A');
  const a1 = A.page;
  await connected(a1);
  // a second tab: its hello replaces the first's socket (4002: the first hears nothing more)
  const a2 = await A.open();
  await connected(a2);
  const [p1, p2, p3] = (await lay(a1, (l) => l.ids('palm'))).slice(0, 3);
  // the first tab hears nothing of the second's writes as they land (a live phone between fetches; the demo's shared
  // record still brings the op over in the end, so here this guards the merge and the fold: store/layout.test and
  // tent.test fail without them)
  await a1.evaluate(() => {
    const w = window as unknown as { __deaf?: (e: Event) => void };
    w.__deaf = (e) => e.stopImmediatePropagation();
    window.addEventListener('storage', w.__deaf, true);
  });
  const moved2 = await nudge(a2, p2);
  const moved1 = await nudge(a1, p1);
  // the storage both tabs share has both (the first tab's write didn't drop the second's)
  const kept = await a1.evaluate(() => JSON.parse(localStorage.getItem('island-demo.layout') ?? '[]') as { id: string; x: number }[]);
  expect(kept.find((e) => e.id === p2)?.x).toBe(moved2.x);
  expect(kept.find((e) => e.id === p1)?.x).toBe(moved1.x);
  // and each tab has the other's: the first merged the second's in with its own write, the second folds the first's
  // as its write lands
  expect(await lay(a1, (l, id) => l.obj(id)?.x, p2)).toBe(moved2.x);
  await expect.poll(() => lay(a2, (l, id) => l.obj(id)?.x, p1)).toBe(moved1.x);
  await a1.evaluate(() => window.removeEventListener('storage', (window as unknown as { __deaf: (e: Event) => void }).__deaf, true));
  const moved3 = await nudge(a2, p3);
  await expect.poll(() => lay(a1, (l, id) => l.obj(id)?.x, p3)).toBe(moved3.x);
});

test('E13: both phones move a different piece onto one tile at once: the later one’s phone moves its piece off, both agree', async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const { page: a } = await demoPhone(browser, island, 'A');
  const { page: b } = await demoPhone(browser, island, 'B');
  await connected(a);
  await connected(b);
  const [p1, p2] = (await lay(a, (l) => l.ids('palm'))).slice(0, 2);
  const o1 = (await lay(a, (l, id) => l.obj(id), p1))!, o2 = (await lay(a, (l, id) => l.obj(id), p2))!;
  const to = { x: o1.x + 1, z: o1.z };
  // each phone's op fine on its own island; sent before either hears the other's
  const op = (o: Obj, at: number) => ({ sc: 'o', id: o.id, at, k: o.k, x: to.x, z: to.z, f: o.f });
  const [ta, tb] = await Promise.all([w<number>(a, 'layoutStamp'), w<number>(b, 'layoutStamp')]);
  await Promise.all([w<number>(a, 'layoutApply', [op(o1, ta)]), w<number>(b, 'layoutApply', [op(o2, tb)])]);
  const where = (p: Page) => Promise.all([p1, p2].map((id) => lay(p, (l, id) => { const o = l.obj(id)!; return `${o.x},${o.z}`; }, id)));
  await expect.poll(async () => {
    const [wa, wb] = await Promise.all([where(a), where(b)]);
    return wa.join() === wb.join() && wa[0] !== wa[1];
  }, { timeout: 10_000 }).toBe(true);
  // the earlier op stood: its piece is on the tile
  const [wa] = await Promise.all([where(a)]);
  expect(wa).toContain(`${to.x},${to.z}`);
  // and it stays settled (nothing ping-pongs)
  await a.waitForTimeout(1000);
  expect((await where(a)).join()).toBe(wa.join());
  expect((await where(b)).join()).toBe(wa.join());
});
