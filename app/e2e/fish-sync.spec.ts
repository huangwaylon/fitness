// Fishing seen by everyone (docs/design.md "Shared world"; the user: "i want other players to see others fishing state so
// we know who's actively trying to catch a fish. this needs to be synced"): each step of a line goes to the others'
// phones (`fish`, presence only): the line out to the float where it landed, the nibbles and the bite, the reel; the
// shadow it's cast at is the angler's while the line is out (a tap on it on another phone only boops). A phone coming
// while a line is out hears its step again; an angler whose phone goes is no longer fishing. The demo's players are two
// tabs of one browser (sync/live-local.ts plays the room).
import { expect, test, type Page } from '@playwright/test';
import { is3d, reelOnBite, sawIt, tapOn, watchFor } from './island';

test.use({ viewport: { width: 393, height: 852 } });

type Line = { x: number; z: number; landed: boolean; under: boolean };
type Fish = { water: string; x: number; z: number; cid: string | null };
type H = {
  __fish: { why(): string; fish(): Fish[]; casting(): boolean; line(): Line | null; lines(): (Line & { who: string; id: string | null })[] };
  __world3d: { client(x: number, z: number): [number, number]; where(id: string): { hidden: boolean; x: number; z: number } | null };
  __villagers3?: { last(slot: string): { angling: { phase: string | null; x: number; z: number } } | null };
};
const h = <R,>(page: Page, fn: (h: H) => R) => page.evaluate(`(${fn.toString()})(window)`) as Promise<R>;
const Q = 'visitor=none&critter=fish&date=2026-11-04T12:00';

async function open(page: Page, as = '') {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo${as}&${Q}`);
  expect(await is3d(page)).toBe(true);
  await expect.poll(() => h(page, (w) => w.__fish?.fish().some((f) => f.water === 'sea') ?? false), { timeout: 15_000 }).toBe(true);
}
/** Where this tab's sea shadow is on screen (client px). */
const shadowAt = (page: Page) => h(page, (w) => { const f = w.__fish.fish().find((x) => x.water === 'sea')!; return w.__world3d.client(f.x, f.z); });
/** A casts at its shadow: where its float went (world). */
async function cast(a: Page): Promise<Line> {
  const [x, y] = await shadowAt(a);
  await a.mouse.click(x, y);
  await expect.poll(() => h(a, (w) => w.__fish.casting())).toBe(true);
  return (await h(a, (w) => w.__fish.line()))!;
}

test('A’s line on B’s phone: the float where it landed, the bite, the shadow taken, the reel clears it', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const a = await ctx.newPage(), b = await ctx.newPage();
  const BITE = '[data-angler="A"][data-line="bite"]';
  await watchFor(b, [BITE]);
  await open(a);
  await open(b, '&as=B');
  const at = await cast(a);
  // (A reels in at its bite whenever it comes: a tap anywhere is the reel)
  const reel = reelOnBite(a, 200, 400, 20_000);
  // B: A's line, its float at the very spot, landed; their villager's line (the 3D angler) at it too
  await expect.poll(() => h(b, (w) => w.__fish.lines().map((l) => [l.who, Math.round(l.x), Math.round(l.z), l.landed]))).toEqual([['A', Math.round(at.x), Math.round(at.z), true]]);
  await expect(b.locator('[data-angler="A"]')).toHaveAttribute('data-line', 'wait');
  expect(await h(b, (w) => w.__fish.lines()[0].id)).toBe('hook:fish');
  await expect.poll(() => h(b, (w) => w.__world3d.where('bobber-partner')?.hidden ?? true)).toBe(false);
  await expect.poll(async () => { const p = await h(b, (w) => w.__world3d.where('bobber-partner')); return p ? Math.hypot(p.x - at.x, -p.z - at.z) : Infinity; }).toBeLessThan(2);
  // the shadow A's working is A's: a tap on it on B's phone casts nothing
  await b.waitForTimeout(1200); // (it swims up to A's float)
  const [bx, by] = await shadowAt(b);
  await b.mouse.click(bx, by);
  await expect.poll(() => h(b, (w) => w.__fish.why())).toBe('the partner’s');
  expect(await h(b, (w) => w.__fish.casting())).toBe(false);
  expect(await b.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('boop');
  // A's bite reaches B (the float under), and A reels it in: the catch on both, B's view of the line cleared
  await reel;
  expect(await sawIt(b, BITE)).toBe(true);
  await expect.poll(() => h(a, (w) => w.__fish.casting())).toBe(false);
  await expect(b.locator('[data-angler]')).toHaveCount(0);
  await expect.poll(() => h(b, (w) => w.__world3d.where('bobber-partner')?.hidden ?? true)).toBe(true);
  await ctx.close();
});

test('a tab coming while a line is out sees it; the angler’s tab gone, its line goes with it', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const a = await ctx.newPage();
  await open(a);
  const at = await cast(a);
  const b = await ctx.newPage();
  await open(b, '&as=B');
  await expect.poll(() => h(b, (w) => w.__fish.lines().map((l) => [l.who, Math.round(l.x), Math.round(l.z)])), { timeout: 10_000 }).toEqual([['A', Math.round(at.x), Math.round(at.z)]]);
  await a.close({ runBeforeUnload: true });
  await expect(b.locator('[data-angler]')).toHaveCount(0, { timeout: 15_000 });
  await ctx.close();
});

/** Through the museum's door (a button: no tap on the ground reels a line in first), and back out (‹ 島へ). */
async function intoMuseum(page: Page) {
  const door = await page.evaluate(() => (window as unknown as { __world: { site(): { doors: Record<string, [number, number]> } } }).__world.site().doors.museum);
  await page.evaluate(`window.__world.go(${door[1] - 120})`);
  await expect.poll(() => page.evaluate('window.__world3d.camStill()')).toBe(true);
  // (my villager a few steps off the door: in at once, the line still out)
  await page.evaluate(`window.__world.put(${door[0] + 70}, ${door[1] - 40})`);
  await page.waitForTimeout(300);
  await tapOn(page, page.locator('[data-building="museum"] .door'));
  await expect(page).toHaveURL(/\/museum\/?\?/, { timeout: 20_000 });
}
async function outOfMuseum(page: Page) {
  await page.getByRole('button', { name: '島へ' }).click();
  await expect(page).toHaveURL(/fitness\/?\?/);
  expect(await is3d(page)).toBe(true);
}
/** B taps its sea shadow and casts (the shadow nobody's). */
async function castsFree(b: Page) {
  await expect.poll(async () => {
    const [x, y] = await shadowAt(b);
    await b.mouse.click(x, y);
    return h(b, (w) => w.__fish.casting());
  }, { timeout: 10_000 }).toBe(true);
}

test('A goes through a door with the line out: A’s tab says the line ended, and it ends on B’s phone', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  // (what A's tab says over the demo's relay: its leaving clears its line on B's phone in any case, as a phone's
  // socket closing does; going through a door on a phone, the socket stays and only A's `off` ends the line)
  await b.evaluate(() => {
    const said: unknown[] = ((window as unknown as { __said: unknown[] }).__said = []);
    new BroadcastChannel('island-demo-relay').onmessage = (e) => said.push(e.data);
  });
  await cast(a);
  await expect.poll(() => h(b, (w) => w.__fish.lines().map((l) => [l.who, l.landed]))).toEqual([['A', true]]);
  await intoMuseum(a);
  await expect.poll(() => b.evaluate(() => (window as unknown as { __said: { k: string; m?: { kind: string; ph?: string; who: string } }[] }).__said
    .some((w) => w.k === 'm' && w.m?.kind === 'fish' && w.m.ph === 'off' && w.m.who === 'A'))).toBe(true);
  await expect.poll(() => h(b, (w) => w.__fish.lines().length)).toBe(0);
  await expect(b.locator('[data-angler]')).toHaveCount(0);
  await ctx.close();
});

test('a line cast at a new spot (its off never came) frees the shadow the old one was at', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  // (A's steps as the relay brings them: a cast at B's shadow, then one elsewhere with no off between)
  const tell = (m: object) => b.evaluate((m) => {
    const bc = new BroadcastChannel('island-demo-relay');
    bc.postMessage({ k: 'm', m: { kind: 'fish', who: 'A', v: 3, t: Date.now(), ...m } });
    bc.close();
  }, m);
  const f = await h(b, (w) => w.__fish.fish().find((x) => x.water === 'sea')!);
  await tell({ ph: 'cast', pt: [Math.round(f.x), Math.round(f.z)], from: [Math.round(f.x), Math.round(f.z) - 40], id: f.cid });
  await expect.poll(() => h(b, (w) => w.__fish.lines().length)).toBe(1);
  await b.waitForTimeout(1200); // (it swims up to A's float)
  const [bx, by] = await shadowAt(b);
  await b.mouse.click(bx, by);
  await expect.poll(() => h(b, (w) => w.__fish.why())).toBe('the partner’s');
  await tell({ ph: 'cast', pt: [Math.round(f.x) + 300, Math.round(f.z)], from: [Math.round(f.x) + 300, Math.round(f.z) - 40] });
  await expect.poll(() => h(b, (w) => w.__fish.lines().map((l) => l.id))).toEqual([null]);
  await castsFree(b);
  await ctx.close();
});

test('B away while A’s line ends: back on the island, A’s villager no longer holds a rod', async ({ browser }) => {
  test.slow();
  const ctx = await browser.newContext();
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  await cast(a);
  await expect.poll(() => h(b, (w) => w.__villagers3?.last('partner')?.angling.phase ?? null)).toBe('wait');
  await intoMuseum(b);
  // (A's line ends while B's away: the fish bites and gets away, or nobody came)
  await expect.poll(() => h(a, (w) => w.__fish.casting()), { timeout: 30_000 }).toBe(false);
  await outOfMuseum(b);
  await expect.poll(() => h(b, (w) => w.__villagers3?.last('partner') != null)).toBe(true);
  await b.waitForTimeout(500);
  expect(await h(b, (w) => w.__fish.lines().length)).toBe(0);
  expect(await h(b, (w) => w.__villagers3!.last('partner')!.angling.phase)).toBeNull();
  await ctx.close();
});
