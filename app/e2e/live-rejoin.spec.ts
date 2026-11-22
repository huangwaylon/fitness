// A phone back while the relay still holds its old socket (2026-11-22: two phones disagreed on where the players were):
// a home-screen relaunch with a new tab, a network switch, a phone asleep, before the room's sweep let the old socket
// go. The room tells the others it's back (`presence {re}`) and replays where each other one is inside and their line
// out (relay/src/room.ts Pres), so the returning phone shows them at once, not when they next move. The relay's real
// room in the test's process (e2e/liveRoom.ts), each phone its own browser context, logic mode.
//   seat  B sits in the tent; A's phone, there too, goes without a word and opens again: A sees B seated
//   line  B's line is out; A's phone opens late: A sees it
import { expect, test, type Browser, type BrowserContext, type Page } from './fixtures.ts';
import { DEMO_CTX, newIsland } from './liveRoom.ts';
import { roomUp } from './rooms.ts';

type Island = ReturnType<typeof newIsland>;
type T = {
  loading(): number;
  fill(codes: string[]): number;
  pieces(): { id: string; item: string; x: number; z: number }[];
  tile(x: number, z: number): [number, number];
  seat(): { id: string; n: number } | null;
  partnerSeat(): { id: string } | null;
  peer(): boolean;
};
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;

test.afterEach(async ({ browser }) => {
  for (const c of browser.contexts()) await c.close();
});

/** A demo phone's context on `island`'s room, as `who`. */
async function phone(browser: Browser, island: Island, who: 'A' | 'B') {
  const context = await browser.newContext({ ...DEMO_CTX, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', hasTouch: true });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await island.demo(context, who);
  return context;
}
/** `who`'s tent on a new page of `context`, drawn. */
async function inTent(context: BrowserContext, island: Island, who: 'A' | 'B') {
  const page = await context.newPage();
  await page.goto('tent' + island.demoUrl(who));
  await roomUp(page, 'tent');
  return page;
}

test('seat: B sits in the tent; A\'s phone goes without a word and opens again: A sees B seated at once', async ({ browser, browserName }) => {
  const island = newIsland();
  const b = await inTent(await phone(browser, island, 'B'), island, 'B');
  expect(await b.evaluate(() => (window as unknown as { __tent: T }).__tent.fill(['f4039']))).toBe(1);
  await b.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  const chair = (await tent(b, (t) => t.pieces())).find((p) => p.item === 'f4039')!;
  const [x, y] = await b.evaluate(([x, z]) => (window as unknown as { __tent: T }).__tent.tile(x, z), [chair.x, chair.z] as const);
  if (browserName === 'webkit') await b.touchscreen.tap(x, y);
  else await b.mouse.click(x, y);
  await expect.poll(() => tent(b, (t) => t.seat()?.id ?? null), { timeout: 10_000 }).toBe(chair.id);
  // A comes into the tent: B's chair (the day's replay) and B on it
  const ctxA = await phone(browser, island, 'A');
  const a = await inTent(ctxA, island, 'A');
  await expect.poll(() => tent(a, (t) => t.partnerSeat()?.id ?? null), { timeout: 10_000 }).toBe(chair.id);
  // A's phone goes without a word (the relay still holds its socket) and A opens the app again: a new page
  island.ghost('A');
  await a.close();
  const a2 = await inTent(ctxA, island, 'A');
  // B seated on A's new page within a few seconds (the room's replay, and B's own word on A's `re`), not when B moves
  await expect.poll(() => tent(a2, (t) => t.partnerSeat()?.id ?? null), { timeout: 4000 }).toBe(chair.id);
  expect(island.said('B').tent ?? 0).toBeGreaterThanOrEqual(2);
});

test('line: B\'s line is out; A opens the app after: A sees B fishing at its float', async ({ browser }) => {
  const island = newIsland();
  // B's phone (in the room itself): its line out in the sea
  const b = island.bot('B');
  const pt: [number, number] = [120, -40];
  b.say({ kind: 'fish', ph: 'cast', pt, from: [118, -60], s: island.now() });
  b.say({ kind: 'fish', ph: 'nibble', pt, from: [118, -60], s: island.now() });
  const ctxA = await phone(browser, island, 'A');
  const a = await ctxA.newPage();
  await a.goto(island.demoUrl('A'));
  await a.waitForFunction(() => (window as unknown as { __fish?: unknown }).__fish);
  await expect.poll(() => a.evaluate(() => (window as unknown as { __fish: { lines(): ({ who: string; x: number; z: number } | null)[] } }).__fish.lines().map((l) => l && [l.who, l.x, l.z])), { timeout: 8000 }).toEqual([['B', ...pt]]);
  // and gone when B reels it in
  b.say({ kind: 'fish', ph: 'reel' });
  await expect.poll(() => a.evaluate(() => (window as unknown as { __fish: { lines(): unknown[] } }).__fish.lines().length), { timeout: 5000 }).toBe(0);
});
