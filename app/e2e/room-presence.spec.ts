// Who's in a room, the same on both phones (docs/backend.md "Live relay", store/where.svelte.ts, rooms/roomLife.ts
// onPresence/showOthers, rooms/seating.ts, villager3d/loopClock.ts): the partner gone out of the room leaves their seat
// free on my phone; my own outage in a room never takes the partner out of it; a piece's use loops on the relay's
// clock, so a phone whose device clock is off shows the same moment of the yoga. Two tabs of one browser (the demo's
// relay) for the seat, two phones on the tests' own relay room (e2e/liveRoom.ts: its real code) for the rest. WebKit
// taps, Chromium clicks: here the hooks act, the rule is the presence.
import { expect, test, type Browser, type BrowserContext, type Page } from './fixtures.ts';
import { DEMO_CTX, newIsland } from './liveRoom.ts';
import { openRoom, roomUp } from './rooms.ts';

test.use({ viewport: { width: 393, height: 852 } });

type T = {
  loading(): number;
  fill(codes: string[]): number;
  pieces(): { id: string; item: string }[];
  sit(id: string): boolean;
  seat(): { id: string } | null;
  partnerSeat(): { id: string } | null;
  who(w: string): { at: number[] } | null;
  peer(): boolean;
  loop(): number;
};
const tent = <R,>(page: Page, fn: (t: T) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;

test('the partner gone out of うめ’s house: their seat is free on my phone at once (their island’s word, no `sc`)', async ({ context }) => {
  const b = await context.newPage();
  await openRoom(b, 'B', 'B');
  const a = await context.newPage();
  await openRoom(a, 'A', 'B');
  // the log chair, put down by me, seen by her
  expect(await tent(a, (t) => t.fill(['f4039']))).toBe(1);
  const chair = (await tent(a, (t) => t.pieces())).find((p) => p.item === 'f4039')!;
  await b.bringToFront();
  await expect.poll(() => tent(b, (t) => t.pieces().map((p) => p.id))).toContain(chair.id);
  await expect.poll(() => tent(b, (t) => t.peer()), { timeout: 8000 }).toBe(true);
  expect(await b.evaluate((id) => (window as unknown as { __tent: T }).__tent.sit(id), chair.id)).toBe(true);
  await expect.poll(() => tent(b, (t) => t.seat()?.id ?? null), { timeout: 10_000 }).toBe(chair.id);
  await a.bringToFront();
  await expect.poll(() => tent(a, (t) => t.partnerSeat()?.id ?? null), { timeout: 8000 }).toBe(chair.id);
  // her room closed without a word (the app swiped away), her island opened: it tells my phone she's out (`in: false`,
  // no `sc`), before where's own CONFIRM_MS (6 s) would
  await b.close();
  const bi = await context.newPage();
  await bi.goto('?demo&date=2026-11-04T12:00&preview=0&as=B');
  await expect.poll(() => tent(a, (t) => t.partnerSeat()), { timeout: 5000 }).toBeNull();
  await expect.poll(() => tent(a, (t) => t.who('B')), { timeout: 2000 }).toBeNull();
  // and mine to take
  expect(await a.evaluate((id) => (window as unknown as { __tent: T }).__tent.sit(id), chair.id)).toBe(true);
  await expect.poll(() => tent(a, (t) => t.seat()?.id ?? null), { timeout: 10_000 }).toBe(chair.id);
});

/** A phone on `island`'s room in the tent (`extra`: more of the query). */
async function inTent(context: BrowserContext, island: ReturnType<typeof newIsland>, who: 'A' | 'B', extra = '') {
  const page = await context.newPage();
  await page.goto(`tent/${island.demoUrl(who, `&date=2026-11-04T12:00&preview=0${extra}`)}`);
  await roomUp(page, 'tent');
  await page.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0);
  return page;
}
/** The phones' contexts this test made (closed after it). */
const made: BrowserContext[] = [];
const phoneCtx = async (browser: Browser, island: ReturnType<typeof newIsland>, who: 'A' | 'B') => {
  const c = await browser.newContext({ ...DEMO_CTX, viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await c.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await island.demo(c, who);
  made.push(c);
  return c;
};

test.afterEach(async () => {
  for (const c of made.splice(0)) await c.close();
});

test('my phone offline in the tent past the partner’s gone time: they’re still shown, and when I’m back', async ({ browser }) => {
  const island = newIsland();
  // (`quietafter`: one gone quiet inside is out after 1.5 s, not 180: my outage outlasts it)
  const [ca, cb] = [await phoneCtx(browser, island, 'A'), await phoneCtx(browser, island, 'B')];
  const a = await inTent(ca, island, 'A', '&quietafter=1500');
  const b = await inTent(cb, island, 'B', '&quietafter=1500');
  await expect.poll(() => Promise.all([a, b].map((p) => tent(p, (t) => t.peer()))), { timeout: 10_000 }).toEqual([true, true]);
  await expect.poll(() => tent(a, (t) => t.who('B')), { timeout: 10_000 }).not.toBeNull();
  island.offline('A');
  await expect.poll(() => tent(a, (t) => t.peer()), { timeout: 10_000 }).toBe(false);
  // through the outage, past quietafter on A's own clock: B never leaves A's room
  const t0 = await a.evaluate(() => Date.now());
  const seen: boolean[] = [];
  await expect.poll(async () => {
    seen.push((await tent(a, (t) => t.who('B'))) !== null);
    return (await a.evaluate(() => Date.now())) - t0;
  }, { timeout: 10_000, intervals: [250] }).toBeGreaterThan(3000);
  expect(seen.every(Boolean)).toBe(true);
  // back: still shown (their room said where they are to my arrival)
  island.offline('A', false);
  await expect.poll(() => tent(a, (t) => t.peer()), { timeout: 15_000 }).toBe(true);
  await expect.poll(() => tent(a, (t) => t.who('B')), { timeout: 5000 }).not.toBeNull();
});

test('a use loops on the relay’s clock: a phone 2.65 s off (half a yoga hold) is at the same moment of it', async ({ browser }) => {
  const island = newIsland();
  const [ca, cb] = [await phoneCtx(browser, island, 'A'), await phoneCtx(browser, island, 'B')];
  // B's device clock 2.65 s ahead of the room's (its offset measured by the live socket, as a phone's is)
  await cb.addInitScript((skew) => {
    const Real = Date, now = Real.now.bind(Real);
    const Skewed = function (this: unknown, ...a: unknown[]) {
      if (!new.target) return new Real(now() + skew).toString();
      return a.length ? new (Real as unknown as new (...b: unknown[]) => Date)(...a) : new Real(now() + skew);
    } as unknown as DateConstructor;
    Object.setPrototypeOf(Skewed, Real);
    Object.defineProperty(Skewed, 'prototype', { value: Real.prototype });
    Skewed.now = () => now() + skew;
    globalThis.Date = Skewed;
  }, 2650);
  const a = await inTent(ca, island, 'A');
  const b = await inTent(cb, island, 'B');
  await expect.poll(() => Promise.all([a, b].map((p) => tent(p, (t) => t.peer()))), { timeout: 10_000 }).toEqual([true, true]);
  expect(Math.abs((await b.evaluate(() => Date.now())) - (await a.evaluate(() => Date.now())) - 2650)).toBeLessThan(500);
  // B's loop clock read between two of A's: the same moment (to the reads' own latency), not 2.65 s on
  const loop = (p: Page) => tent(p, (t) => t.loop());
  await expect.poll(async () => {
    const a0 = await loop(a), bt = await loop(b), a1 = await loop(a);
    return bt >= a0 - 200 && bt <= a1 + 200;
  }, { timeout: 10_000 }).toBe(true);
});
