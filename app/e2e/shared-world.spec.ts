// The shared island (docs/backend.md#shared-world, docs/design.md "Shared world"): both phones show the same world. The
// demo's two players are two tabs of one browser (`?demo` and `?demo&as=B`), sharing it the way two phones do over
// the relay (sync/live-local.ts plays the room: first claim wins, the day's world kept for a tab opening later).
// Every tree shakes (NH's three quick taps): an oak's branch, a palm's coconuts; the partner's tab sees the shake,
// their villager turns to it where it stands, and what's picked up on one tab is gone on the other.
import { expect, test, type Page } from './fixtures.ts';
import { critter, dropsOut, findCount, findsOut, geo, islandUp, isOut, mid, openNear, pauseNow, piece, plateOnly, pointOn, quiet, slotOf, tapAt, tapOn, villager, visitorOut, w3, walking, watered, type W3 } from './island.ts';
import { SPEED } from '../src/lib/world/speed.ts';

test.use({ viewport: { width: 390, height: 844 } });

type W = { go(z: number): void; at(x: number, z: number): [number, number]; mine(): [number, number]; partner(): [number, number] };
const go = (page: Page, z: number) => page.evaluate((z) => (window as unknown as { __world: W }).__world.go(z), z);
/** The island's camera at rest on these tabs (a tap's px only holds once it is). */
const atRest = (...ps: Page[]) =>
  Promise.all(ps.map((p) => expect.poll(() => p.evaluate(() => (window as unknown as { __world: { idle(): boolean } }).__world.idle()), { timeout: 5000 }).toBe(true)));
const DATE = '2026-11-04T12:00';
/** How many drops of `what` lie out to pick up (`__world3d.shakes`; a branch's id its tree's), only `id`'s if given. */
const drops = async (page: Page, what: string, id?: string) => (await dropsOut(page, what)).filter((d) => !id || d.id === id).length;

async function open(page: Page, q = '', o: { clock?: boolean } = {}) {
  // (`clock`: the page's own clock, running, for shake's taps on it)
  if (o.clock) await page.clock.install({ time: new Date(`${DATE}:00+09:00`) }), await page.clock.resume();
  await page.goto(`?demo&date=${DATE}${q}`);
  await islandUp(page);
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await quiet(page); // the opening beats are over
}

/** A point on a tree the finger reaches (its tap area's middle, else the nearest part nothing covers). */
const leaves = async (page: Page, id: string) => (await pointOn(page, 'tree', id))!;
/** The camera in front of a tree (world.ts SCENERY as the page has it). */
const toTree = async (page: Page, id: string) => go(page, (await geo(page)).SCENERY.find((s) => s.id === id)!.z - 114);
/** NH's three quick taps, 140 ms of the page's time apart (its clock installed by open's `clock`, paused for the taps:
 *  on a loaded runner's wall clock the round trips spread them past SHAKE_WINDOW_MS, and nothing fell). */
async function shake(page: Page, id: string) {
  await pauseNow(page);
  try {
    for (let i = 0; i < 3; i++) {
      if (i) await page.clock.runFor(140);
      const p = await leaves(page, id);
      await page.mouse.click(p.x, p.y);
    }
  } finally {
    await page.clock.resume();
  }
}

test('every tree shakes: three quick taps on an oak drop a branch beside it; one tap only rustles', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=branch', { clock: true });
  await toTree(page, 'oak-m1');
  await atRest(page);
  const p = await leaves(page, 'oak-m1');
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(1400); // a run has to be quick: this one is over (proving no branch comes)
  expect(await drops(page, 'branch')).toBe(0);
  await shake(page, 'oak-m1');
  await expect.poll(() => drops(page, 'branch', 'oak-m1'), { timeout: 3000 }).toBe(1);
  await page.waitForTimeout(700); // (the fall: a tap mid-fall isn't a pick-up, and no hook says it has landed)
  await tapOn(page, 'drop', 'oak-m1');
  await expect.poll(() => drops(page, 'branch'), { timeout: 3000 }).toBe(0);
  // a reload finds today's island as it was: the branch is gone, and stays gone
  await page.reload();
  await islandUp(page);
  await page.waitForTimeout(800); // (proving the branch doesn't come back)
  expect(await drops(page, 'branch')).toBe(0);
});

test('a palm drops its two coconuts, once a day: a tap picks one up (NH’s line)', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ page }) => {
  await open(page, '&shake=coconut', { clock: true });
  await shake(page, 'palm-3');
  await expect.poll(() => drops(page, 'coconut'), { timeout: 3000 }).toBe(2);
  await page.waitForTimeout(700); // (the fall: a tap mid-fall isn't a pick-up, and no hook says it has landed)
  await tapOn(page, 'drop', (await dropsOut(page, 'coconut'))[1].id); // (the two lie side by side, the later one on top)
  await expect(page.locator('[data-fx="catch"]')).toContainText('ヤシのみを ひろった！', { timeout: 4000 });
  await expect.poll(() => drops(page, 'coconut')).toBe(1);
});

test('two players see the same island, not mirrored: A (ウェイ) on the left, B (うめ) on the right on both tabs', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  /** Where each person's villager and goal tree and two wild flowers stand on a tab (screen x of their middles, the same camera). */
  const { FLOWERS } = await geo(a);
  const layout = (p: Page) => p.evaluate((flowers) => {
    const out: Record<string, number> = {}, w3 = (window as unknown as { __world3d: W3 & { boxDom: W3['box'] } }).__world3d;
    const mid = (kind: 'goal' | 'flower', id: string) => {
      // (where the projector puts it, in view or not: a flower past the camera's window has no 3D tap area)
      const r = w3.boxDom(kind, id)!;
      return Math.round(r.left + r.width / 2);
    };
    for (const who of ['A', 'B']) {
      const v = w3.box('villager', ['mine', 'partner', 'third'].find((s) => w3.actor(s)?.who === who))!;
      out[`villager${who}`] = Math.round(v.left + v.width / 2);
      out[`tree${who}`] = mid('goal', who);
    }
    for (const id of flowers) out[id] = mid('flower', id);
    return out;
  }, [FLOWERS[0].id, FLOWERS[3].id]);
  for (const p of [a, b]) await go(p, 0);
  await atRest(a, b);
  const [la, lb] = [await layout(a), await layout(b)];
  // my own villager is A's on tab A and B's on tab B, yet both stand where their person lives
  expect((await villager(a))?.who).toBe('A');
  expect((await villager(b))?.who).toBe('B');
  for (const l of [la, lb]) {
    expect(l.villagerA).toBeLessThan(l.villagerB);
    expect(l.treeA).toBeLessThan(195);
    expect(l.treeB).toBeGreaterThan(195);
  }
  for (const k of Object.keys(la)) expect(Math.abs(la[k] - lb[k]), k).toBeLessThanOrEqual(4);
  await ctx.close();
});

/** Where a person's villager stands on a tab now (its own, or the partner's), world units. */
const feet = (page: Page, own: boolean) =>
  page.evaluate((own) => {
    const w = (window as unknown as { __world: W }).__world;
    return own ? w.mine() : w.partner();
  }, own);

test('two players: a tap-walk on one tab plays on the other from the same start at the same time, and ends at the same point', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a);
  await open(b, '&as=B');
  for (const p of [a, b]) await go(p, 300);
  await a.waitForTimeout(400);
  for (const [tapper, watcher, nx, nz] of [[a, b, 240, 500], [b, a, 150, 560]] as const) {
    // (open ground there a tap walks to, nothing over it on this screen)
    const [tx, tz] = await openNear(tapper, nx, nz, 45, true);
    const [x, y] = await tapper.evaluate(([tx, tz]) => (window as unknown as { __world: W }).__world.at(tx, tz), [tx, tz]);
    // where the tap lands: the ground under the finger (the 3D island's pick, within openNear's 8u of the spot asked for:
    // on WebKit B's spot is on a rise, 8u off)
    const [gx, gz] = await tapper.evaluate(([x, y, tx, tz]) => {
      const g = (window as unknown as { __world3d?: { ground(cx: number, cy: number): { x: number; z: number } | null } }).__world3d?.ground(x, y);
      return g ? [g.x, g.z] : [tx, tz];
    }, [x, y, tx, tz]);
    await tapper.mouse.click(x, y);
    // under way: the two tabs have it within a few steps of each other (one frame and the evaluate's skew apart: the
    // two reads up to 0.2 s apart, as far as the tap-walk's run goes in that time). Not drawn (the full tier): two tabs
    // drawing under software GL each take a second a frame, and a walk's next leg starts in a frame, so it measures
    // SwiftShader (80–150u); never two drawn 3D tabs in a sync check (docs/ops/testing.md "Two phones")
    let worst = 0;
    for (let i = 0; i < 8; i++) {
      await tapper.waitForTimeout(150); // (a sample every 150 ms of the walk)
      const [p, q] = await Promise.all([feet(tapper, true), feet(watcher, false)]);
      worst = Math.max(worst, Math.hypot(p[0] - q[0], p[1] - q[1]));
    }
    console.log(`drift under way (worst of 8 samples): ${worst.toFixed(1)}u`);
    if (process.env.E2E_RENDER === 'none') expect(worst).toBeLessThan(SPEED.run * 0.2);
    // the walk over on both tabs
    const who = tapper === a ? 'A' : 'B';
    for (const t of [tapper, watcher])
      await expect.poll(() => t.evaluate((who) => (window as unknown as { __world: { state(): { villagers: Record<string, { walking: boolean }> } } }).__world.state().villagers[who].walking, who), { timeout: 8000 }).toBe(false);
    const [p, q] = await Promise.all([feet(tapper, true), feet(watcher, false)]);
    expect(Math.hypot(p[0] - q[0], p[1] - q[1])).toBeLessThan(1.5);
    expect(Math.hypot(p[0] - gx, p[1] - gz)).toBeLessThan(4);
  }
  // a tab opening later (B's phone again) has A's villager where A's tab has it
  const c = await ctx.newPage();
  await open(c, '&as=B');
  const [pa, pc] = await Promise.all([feet(a, true), feet(c, false)]);
  expect(Math.hypot(pa[0] - pc[0], pa[1] - pc[1])).toBeLessThan(1.5);
  await ctx.close();
});

test('two players at night: both awake on both tabs (no night’s sleep); B’s, its app closed, asleep on both; a tap wakes it on both for its minute, and both put it back to sleep at the same moment', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  // (each tab's own clock, installed and running: stepped past the wake's minute below, not waited out)
  await Promise.all([a, b].map((p) => p.clock.install()));
  for (const [p, as] of [[a, ''], [b, '&as=G']] as const) {
    await p.goto(`?demo&date=2026-11-04T23:00${as}`);
    await islandUp(p);
    await p.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  }
  /** Whether person `who`'s villager shows its sleeper's zzz on tab `p`. */
  const zzz = async (p: Page, who: string) => !!(await villager(p, (await slotOf(p, who)) ?? '-'))?.fx.includes('zzz');
  for (const p of [a, b]) await expect.poll(() => zzz(p, 'B'), { timeout: 4000 }).toBe(true);
  for (const p of [a, b]) for (const who of ['A', 'G']) await expect.poll(() => zzz(p, who)).toBe(false);
  await a.waitForTimeout(600);
  await tapAt(a, (w, s) => ((v) => (v ? [v.left + v.width / 2, v.top + v.height * 0.6] as const : null))(w.__world3d.box('villager', s)), await slotOf(a, 'B'), { clear: null, mouse: true });
  for (const p of [a, b]) await expect.poll(() => zzz(p, 'B'), { timeout: 1500 }).toBe(false);
  // its minute later: asleep again on both (the same moment: the wake's own time on each, each tab's clock stepped on)
  await Promise.all([a, b].map((p) => p.clock.runFor(59_000)));
  for (const p of [a, b]) await expect.poll(() => zzz(p, 'B'), { timeout: 2500 }).toBe(true);
  await ctx.close();
});

test('two players: Gulliver woken on one tab is up on the other too', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  for (const [p, as] of [[a, ''], [b, '&as=B']] as const) {
    await p.goto(`?demo&date=2026-11-04T12:00&visitor=gulliver${as}`);
    await islandUp(p);
  }
  const asleep = async (p: Page) => (await visitorOut(p, 'gulliver'))?.asleep;
  for (const p of [a, b]) await expect.poll(() => asleep(p), { timeout: 5000 }).toBe('lie');
  for (let i = 0; i < 5; i++) {
    const r = (await w3(a, (w) => w.box('visitor', 'gulliver')))!;
    await a.mouse.click(r.left + r.width / 2, r.top + r.height / 2);
    await a.waitForTimeout(i ? 300 : 500);
  }
  await expect.poll(() => asleep(a)).toBeNull();
  await expect.poll(() => asleep(b), { timeout: 2000 }).toBeNull();
  await ctx.close();
});

test('two players: a shake on one tab plays on the other (their villager stays where it is), and a pick-up there is gone here', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: three quick taps within 1.2 s are NH\'s shake, and a drawn software-GL frame takes 0.5-1 s' } }, async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  await open(a, '&shake=branch', { clock: true });
  await open(b, '&as=B');
  for (const p of [a, b]) await toTree(p, 'oak-m1');
  await atRest(a, b);
  await shake(a, 'oak-m1');
  await expect.poll(() => drops(a, 'branch', 'oak-m1'), { timeout: 3000 }).toBe(1);
  // B's tab: the oak shakes and the branch falls beside it; A's villager (B's partner) doesn't run over
  await expect.poll(() => drops(b, 'branch', 'oak-m1'), { timeout: 6000 }).toBe(1);
  expect(await walking(b, 'partner')).toBe(false);
  await b.waitForTimeout(800); // (the fall: a tap mid-fall isn't a pick-up, and no hook says it has landed)
  await b.bringToFront(); // (tapOn holds the page's frames: a tab behind another runs none)
  await tapOn(b, 'drop', 'oak-m1');
  await expect.poll(() => drops(b, 'branch'), { timeout: 3000 }).toBe(0);
  await expect.poll(() => drops(a, 'branch'), { timeout: 3000 }).toBe(0);
  await ctx.close();
});

test('two players: a bug netted on one tab is gone on the other, where their plate joins the stack, nothing over their villager’s head', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  for (const [p, as] of [[a, ''], [b, '&as=B']] as const) {
    await p.goto(`?demo&date=2026-05-10T12:00&critter=ladybug${as}`);
    await islandUp(p);
  }
  for (const p of [a, b]) await expect.poll(() => isOut(p, 'ladybug'), { timeout: 6000 }).toBe(true);
  await a.waitForTimeout(900);
  const r = mid((await critter(a, 'ladybug'))!.box);
  await a.mouse.click(r.x, r.y);
  await expect(a.locator('[data-fx="catch"]')).toContainText('テントウムシ', { timeout: 4000 });
  // B: gone, and A's (B's partner's) plate in the stack: 「〇〇が テントウムシを つかまえた！」
  await expect.poll(() => isOut(b, 'ladybug'), { timeout: 5000 }).toBe(false);
  await expect(b.locator('[data-fx="catch"]').first()).toContainText('テントウムシを つかまえた！', { timeout: 5000 });
  await plateOnly(b, 'critters/ladybug');
  // the shared day has it as A's
  const day = JSON.parse((await b.evaluate(() => localStorage.getItem('island-demo.world.B')))!) as { events: { kind: string; id?: string; who: string }[] };
  expect(day.events).toContainEqual(expect.objectContaining({ kind: 'catch', id: 'hook:ladybug', who: 'A' }));
  await ctx.close();
});

test('two players: a shell picked up on one tab is gone on the other, and from a tab opening later; a watered flower glitters on both', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const a = await ctx.newPage(), b = await ctx.newPage();
  for (const [p, as] of [[a, ''], [b, '&as=B']] as const) {
    await p.goto(`?demo&date=${DATE}${as}`);
    await islandUp(p);
  }
  const shells = (p: Page) => () => findCount(p, 'shell');
  for (const p of [a, b]) await expect.poll(shells(p)).toBe(3);
  await a.waitForTimeout(1500);
  const [sx, sy] = (await findsOut(a, 'shell'))[0].foot;
  await a.mouse.click(sx, sy);
  await expect(a.locator('[data-fx="catch"]')).toContainText('を ひろった！', { timeout: 4000 });
  await expect.poll(shells(a)).toBe(2);
  await expect.poll(shells(b), { timeout: 4000 }).toBe(2);
  // the partner's villager went for it: their line on B (in view at まえ)
  await expect(b.locator('[data-fx="catch"]').first()).toContainText('を ひろった！', { timeout: 5000 });
  // A waters a flower (world.ts FLOWERS): it glitters on B's tab too, the same flower
  // (one of the front lawn's: in view at まえ)
  const fl = (await geo(a)).FLOWERS.filter((f) => f.z < 600).sort((p, q) => p.z - q.z)[0].id;
  const at = (await pointOn(a, 'flower', fl))!;
  await a.mouse.click(at.x, at.y);
  await expect.poll(async () => (await piece(a, fl))?.watered, { timeout: 4000 }).toBe(true);
  await expect.poll(() => watered(b), { timeout: 5000 }).toEqual([fl]);
  // B's phone again, later: the day as it is
  const c = await ctx.newPage();
  await c.goto(`?demo&date=${DATE}&as=B`);
  await islandUp(c);
  await expect.poll(shells(c)).toBe(2);
  await ctx.close();
});
