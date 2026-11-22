// Ambient life converges on every phone (docs/backend.md#ambient-life "Positions"): a villager nobody's phone moves
// (A's, woken by a tap while A is away) goes on its slots' outings and the day's visitor strolls, on every open phone
// from the schedule alone; a phone hidden for 2 minutes and shown again has them where the phone that watched does (a
// jump to where the schedule has them by now), and the jump is cheap. The demo's players are tabs of one browser
// (sync/live-local.ts), their device clock one (context.clock, stepped a second at a time while one is hidden).
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp, tapOn } from './island.ts';

const VIEW = { width: 393, height: 852 };
// (ambient life on: the villagers' outings and the visitor's strolls are what's checked; the clock the test's)
test.use({ viewport: VIEW, ambient: 'on', ownClock: true });
type P = { x: number; z: number; asleep: boolean };
type W = { state(): { villagers: Record<string, P> }; feet(id: string): [number, number] };
const vil = (p: Page, w: string) => p.evaluate((w) => (window as unknown as { __world: W }).__world.state().villagers[w], w);
const visitor = (p: Page) => p.evaluate(() => (window as unknown as { __world: W }).__world.feet('visitor'));
const gap = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);
const xz = ([x, z]: [number, number]) => ({ x, z });

/** The page hidden or shown, as a phone's going to the background does (document.hidden and its event). */
const hide = (p: Page, hidden: boolean) =>
  p.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);

async function open(ctx: BrowserContext, as: 'B' | 'G') {
  const page = await ctx.newPage();
  // Sunday noon: Daisy Mae, who strolls; a tap's wake long enough for the test
  await page.goto(`?demo&as=${as}&critter=none&balloon=none&stars=none&guest=none&visitor=daisy-mae&wake=900000`);
  await islandUp(page);
  return page;
}
/** Both pages' clock on a second (their timers due by then fired once, the 3D island's every frame not drawn). */
const step = async (ctx: BrowserContext, s: number) => {
  for (let i = 0; i < s; i++) await ctx.clock.fastForward(1_000);
};

test('hidden 2 min and shown: the woken villager and the visitor where the phone that watched has them', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: VIEW, serviceWorkers: 'block' });
  await ctx.clock.install({ time: new Date('2026-11-01T12:00:00+09:00') });
  const b = await open(ctx, 'B'), g = await open(ctx, 'G');
  // B taps A's sleeping villager: awake on both phones, in the island's life (not moved by its phone: A is away)
  await tapOn(b, 'villager', 'partner');
  for (const p of [b, g]) await expect.poll(async () => (await vil(p, 'A')).asleep, { timeout: 4000 }).toBe(false);
  // the shared clock held from here (both pages read at the same instant), stepped a second at a time
  await ctx.clock.pauseAt(await b.evaluate(() => Date.now() + 500));
  const rest = await vil(b, 'A'), spot = xz(await visitor(b));
  // the guest's phone goes to the background for 2 minutes; B's watches A's outings and Daisy Mae's strolls
  await hide(g, true);
  let out = 0, strolled = 0;
  for (let s = 0; s < 120; s += 4) {
    await step(ctx, 4);
    if (gap(await vil(b, 'A'), rest) > 20) out++;
    if (gap(xz(await visitor(b)), spot) > 20) strolled++;
  }
  expect(out, 'A went out on B’s phone').toBeGreaterThan(0);
  expect(strolled, 'Daisy Mae strolled on B’s phone').toBeGreaterThan(0);
  await hide(g, false);
  // shown: where B has them (sampled on one tick of the shared clock), A and the visitor, a second at a time till
  // they've been compared away from their spots a few times (A out on an outing, Daisy Mae on a stroll)
  let away = 0;
  for (let i = 0; i < 150 && (i < 10 || away < 4); i++) {
    await step(ctx, 1);
    const [ab, ag, vb, vg] = [await vil(b, 'A'), await vil(g, 'A'), xz(await visitor(b)), xz(await visitor(g))];
    expect(gap(ab, ag), `A: B ${ab.x},${ab.z} G ${ag.x},${ag.z}`).toBeLessThan(3);
    expect(gap(vb, vg), `Daisy Mae: B ${vb.x},${vb.z} G ${vg.x},${vg.z}`).toBeLessThan(3);
    if (gap(ab, rest) > 20 || gap(vb, spot) > 20) away++;
  }
  expect(away).toBeGreaterThan(0);
  // the jump's cost on coming back, on the real clock (the fake one is held): the wake's slots replayed, no frames
  const stats = () => g.evaluate(() => (window as unknown as { __lifeSync?: { ms: number; n: number } }).__lifeSync ?? null);
  const n = (await stats())?.n ?? 0;
  await ctx.clock.resume();
  await hide(g, true);
  await hide(g, false);
  await expect.poll(async () => (await stats())?.n ?? 0).toBeGreaterThan(n);
  const ms = (await stats())!.ms;
  expect(ms).toBeLessThan(25);
  test.info().annotations.push({ type: 'resume sync', description: `${ms.toFixed(2)} ms` });
  await ctx.close();
});
