// Everyone's villager asleep while its app is closed, awake while it's open (docs/design.md "Sleep", the user,
// 2026-11-09): by the relay's presence (here the demo's tabs: sync/live-local.ts), with a grace for a reload or a
// moment away, at any hour (no night's sleep); a tap wakes a sleeping one for its minute on every open phone, in the
// island's life meanwhile, then it sleeps where it ended up; back online, it's awake where it was. The spans short here
// (`?grace=`, `?wake=`: ui-state/cast.ts setSpans). Screenshots (SHOTS=<dir>, WebKit at 393×852): both members asleep,
// one woken, one online.
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp, quiet } from './island.ts';

const VIEW = { width: 393, height: 852 };
test.use({ viewport: VIEW });
const GRACE = 3000, WAKE = 6000;
type V = { x: number; z: number; asleep: boolean; life: boolean };
type W = { state(): { villagers: Record<string, V> } };
const vil = (p: Page, w: string) => p.evaluate((w) => (window as unknown as { __world: W }).__world.state().villagers[w] ?? null, w);
const asleep = async (p: Page, w: string) => (await vil(p, w))?.asleep ?? null;
const life = async (p: Page, w: string) => (await vil(p, w))?.life ?? null;
const near = (a: V | null, b: V | null) => (a && b ? Math.hypot(a.x - b.x, a.z - b.z) : 999);

async function open(ctx: BrowserContext, as: 'A' | 'B' | 'G', date: string) {
  const page = await ctx.newPage();
  await page.goto(`?demo&date=${date}&critter=none&visitor=none&grace=${GRACE}&wake=${WAKE}${as === 'A' ? '' : `&as=${as}`}`);
  await islandUp(page);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  return page;
}
const shot = async (p: Page, name: string) => {
  if (process.env.SHOTS) await quiet(p), await p.screenshot({ path: `${process.env.SHOTS}/${name}.png` });
};

test('asleep while its app is closed; a tap wakes it for its minute on both open phones, in the island’s life, then it sleeps where it ended up', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: VIEW });
  // the guest alone: both members' villagers asleep, its own awake
  const g = await open(ctx, 'G', '2026-07-04T12:00');
  for (const w of ['A', 'B']) await expect.poll(() => asleep(g, w), { message: w }).toBe(true);
  expect(await asleep(g, 'G')).toBe(false);
  expect([await life(g, 'A'), await life(g, 'B'), await life(g, 'G')]).toEqual([false, false, true]);
  await shot(g, 'both-members-asleep');
  // B opens: awake on both phones, A still asleep on both
  const b = await open(ctx, 'B', '2026-07-04T12:00');
  await expect.poll(() => asleep(g, 'B'), { timeout: 6000 }).toBe(false);
  for (const p of [g, b]) expect(await asleep(p, 'A'), 'A').toBe(true);
  await shot(g, 'one-online');
  // B taps A's villager (its partner): A wakes on both phones, in the island's life there, not moved by its phone
  const at = await vil(b, 'A');
  await b.locator('[data-actor="partner"] .vil').click();
  for (const p of [b, g]) {
    await expect.poll(() => asleep(p, 'A'), { timeout: 4000 }).toBe(false);
    expect(await life(p, 'A')).toBe(true);
  }
  await shot(g, 'one-woken');
  // its minute over: asleep again on both, at the same moment, where it is
  for (const p of [b, g]) await expect.poll(() => asleep(p, 'A'), { timeout: WAKE + 3000 }).toBe(true);
  const [onB, onG] = [await vil(b, 'A'), await vil(g, 'A')];
  expect(near(onB, onG)).toBeLessThan(4);
  expect(near(onB, at)).toBeLessThan(4); // (nothing moved it: ambient life off)
  expect(await life(g, 'A')).toBe(false);
  await ctx.close();
});

test('back online it wakes where it was, at any hour, in the island’s life; closed, awake for the grace, then asleep', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: VIEW });
  // 23:00: no night's sleep, only the app's presence
  const a = await open(ctx, 'A', '2026-07-04T23:00');
  expect(await asleep(a, 'A')).toBe(false);
  await expect.poll(() => asleep(a, 'B')).toBe(true);
  const was = await vil(a, 'B');
  const b = await open(ctx, 'B', '2026-07-04T23:00');
  for (const [p, w] of [[a, 'B'], [b, 'A'], [b, 'B']] as const) await expect.poll(() => asleep(p, w), { timeout: 6000, message: w }).toBe(false);
  expect(near(await vil(a, 'B'), was)).toBeLessThan(2); // (no walk home)
  expect([await life(a, 'A'), await life(a, 'B'), await life(b, 'A'), await life(b, 'B')]).toEqual([true, true, true, true]);
  // B closes: awake on A's island for the grace (a reload's moment), then asleep where it stood
  const left = await vil(b, 'B');
  await b.close();
  expect(await asleep(a, 'B')).toBe(false);
  await expect.poll(() => asleep(a, 'B'), { timeout: GRACE + 4000 }).toBe(true);
  expect(near(await vil(a, 'B'), left)).toBeLessThan(2);
  await ctx.close();
});
