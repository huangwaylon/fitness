// Two phones on the tests' own relay room (e2e/liveRoom.ts), as the sync specs drive them: a demo phone (its hooks on,
// a second page for the app killed and opened again), its __world hooks, and a catch to share.
import { expect, type Browser, type Page } from './fixtures.ts';
import { DEMO_CTX, newIsland } from './liveRoom.ts';

type Island = ReturnType<typeof newIsland>;
type Who = 'A' | 'B';

export type W = { layoutStamp(): number; layoutApply(ops: object[]): number; share(i: object): boolean; canon(): string; status(): { connected: boolean; peer: boolean } | null; metrics(): { pending: number; closed: number } | null };
export const w = <T,>(p: Page, fn: keyof W, ...args: unknown[]) =>
  p.evaluate(([fn, args]) => ((window as unknown as { __world: Record<string, (...a: unknown[]) => unknown> }).__world[fn as string](...(args as unknown[]))), [fn, args] as const) as Promise<T>;

/** A demo phone (its hooks on) on `island`'s room; `context` kept for a second page (the app killed and opened again). */
export async function demoPhone(browser: Browser, island: Island, who: Who) {
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
export const connected = (p: Page) => expect.poll(() => w<{ connected: boolean } | null>(p, 'status').then((s) => !!s?.connected), { timeout: 10_000 }).toBe(true);
/** A catch of a critter no island has (its own id: nothing on screen claims it), as the e2e's share does. */
export const fakeCatch = (id: string) => ({ kind: 'catch', what: 'koi', id, how: 'net' });
