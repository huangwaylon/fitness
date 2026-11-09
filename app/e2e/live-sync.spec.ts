// Two phones' live sync through what a phone's network does to them (docs/backend.md#live-sync): the relay's real
// room and record in the test's process (e2e/liveRoom.ts), each phone its own browser context, in the logic tier's way
// (nothing drawn). What the reviewer's two-phone experiments found, each kept as a regression (kill, an intent made
// offline and the app killed before it went: sync-offline.spec.ts, in the gate set):
//   E15  a 3.5 s app switch while the partner writes: the record's change is fetched on coming back
//   E14  the relay closes the socket (1012, a deploy) while the partner writes: fetched after the reconnect
//   dead a socket that stays open and carries nothing: found out and replaced, what was sent goes again
//   E13  both phones move a different piece onto one tile at once: the later op's phone moves its piece off
//   burst 40 layout ops at once (the editor's save): what each phone's main thread spends on them
//   tabs two tabs of one phone (the second's socket replaces the first's): neither's layout ops written over
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { newIsland, setVisible } from './liveRoom.ts';
import { connected, demoPhone, fakeCatch, w, type W } from './liveSync.ts';

type Island = ReturnType<typeof newIsland>;
type Who = 'A' | 'B';

/** A paired phone (the live app) on `island`. */
async function phone(browser: Browser, island: Island, who: Who) {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await island.pair(context, who);
  const page = await context.newPage();
  await page.goto('');
  await islandUp(page, { timeout: 20_000 });
  await expect.poll(() => island.sockets(who), { timeout: 10_000 }).toBe(1);
  return page;
}

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

test('an intent the relay drops without a word (one it can’t read): sent again on the same socket, never a reconnect loop', async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const { page: a } = await demoPhone(browser, island, 'A');
  const { page: b } = await demoPhone(browser, island, 'B');
  await connected(a);
  await connected(b);
  const id = `e2e-mute-${Date.now().toString(36).slice(-5)}`;
  island.ctl.drop = (who, text) => who === 'A' && text.includes(id);
  const hellos = island.said('A').hello;
  expect(await w<boolean>(a, 'share', fakeCatch(id))).toBe(true);
  // its ack overdue at 5 s with nothing heard since: the socket is asked (it answers), and the catch goes again on it at
  // 10 s (was: given up as dead at 5 s, a new socket, the same again, for good)
  await expect.poll(() => island.said('A').catch, { timeout: 16_000 }).toBeGreaterThanOrEqual(2);
  expect(island.said('A').hello).toBe(hellos);
  expect(await w<{ closed: number } | null>(a, 'metrics').then((m) => m?.closed)).toBe(0);
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

test('a door blocked between two edits at once (a palm by K.K.’s stool, the stool turned to face it): the later op’s phone moves its piece, both agree', async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const { page: a } = await demoPhone(browser, island, 'A');
  const { page: b } = await demoPhone(browser, island, 'B');
  await connected(a);
  await connected(b);
  const kk = (await lay(a, (l) => l.obj('kk-slider')))!;
  const [p] = await lay(a, (l) => l.ids('palm'));
  const palm = (await lay(a, (l, id) => l.obj(id), p))!;
  const [ta, tb] = await Promise.all([w<number>(a, 'layoutStamp'), w<number>(b, 'layoutStamp')]);
  // A's palm east of the stool, B's turn of the stool to face east (B's the later op): each fine on its own island
  await Promise.all([
    w<number>(a, 'layoutApply', [{ sc: 'o', id: p, at: Math.min(ta, tb), k: palm.k, x: kk.x + 1, z: kk.z, f: palm.f }]),
    w<number>(b, 'layoutApply', [{ sc: 'o', id: 'kk-slider', at: Math.max(ta, tb) + 50, k: kk.k, x: kk.x, z: kk.z, f: 1 }])
  ]);
  const where = (pg: Page) => Promise.all([p, 'kk-slider'].map((id) => lay(pg, (l, id) => { const o = l.obj(id)!; return `${o.x},${o.z},${o.f}`; }, id)));
  await expect.poll(async () => {
    const [wa, wb] = await Promise.all([where(a), where(b)]);
    return wa.join() === wb.join() && wa[1] !== `${kk.x},${kk.z},1`;
  }, { timeout: 10_000 }).toBe(true);
  // the palm (the earlier op) stood; the stool moved, still facing east, its front clear
  const [wa] = [await where(a)];
  expect(wa[0]).toBe(`${kk.x + 1},${kk.z},${palm.f}`);
  expect(wa[1].endsWith(',1')).toBe(true);
  await a.waitForTimeout(1000);
  expect((await where(a)).join()).toBe(wa.join());
  expect((await where(b)).join()).toBe(wa.join());
});

/** Start timing `p`'s frames (framesDone: its longest frame and its time over budget, frames past 17 ms). */
const frames = (p: Page) => p.evaluate(() => {
  const w = window as unknown as { __frames?: { gaps: number[]; on: boolean } };
  const f: { gaps: number[]; on: boolean } = (w.__frames = { gaps: [], on: true });
  let last = performance.now();
  const tick = (t: number) => {
    f.gaps.push(t - last);
    last = t;
    if (f.on) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
const framesDone = (p: Page) => p.evaluate(() => {
  const f = (window as unknown as { __frames: { gaps: number[]; on: boolean } }).__frames;
  f.on = false;
  return { max: Math.round(Math.max(...f.gaps)), over: Math.round(f.gaps.reduce((a, g) => a + Math.max(0, g - 17), 0)) };
});

test('burst: 40 layout ops at once cost each phone one rebuild, not forty', async ({ browser }) => {
  test.setTimeout(60_000);
  const island = newIsland();
  const { page: a } = await demoPhone(browser, island, 'A');
  const { page: b } = await demoPhone(browser, island, 'B');
  await connected(a);
  await connected(b);
  const ids = (await lay(a, (l) => [...l.ids('palm'), ...l.ids('oak'), ...l.ids('cedar'), ...l.ids('flower')].join())).split(',').slice(0, 40);
  expect(ids).toHaveLength(40);
  await frames(b);
  // A: the editor's save of 40 moves (each a tile east), timed in the page, through the frame after it
  const ms = await a.evaluate(async (ids) => {
    const l = (window as unknown as { __layout: L }).__layout, wo = (window as unknown as { __world: W }).__world;
    let at = wo.layoutStamp();
    const ops = ids.map((id) => {
      const o = l.obj(id)!;
      return { sc: 'o', id, at: at++, k: o.k, x: o.x + 1, z: o.z, f: o.f };
    });
    const t0 = performance.now();
    wo.layoutApply(ops);
    const sync = performance.now() - t0;
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
    return { sync: Math.round(sync), frame: Math.round(performance.now() - t0) };
  }, ids);
  // (the room relays a burst of 20 at once, the rest over its rate limit: a live phone's record push brings those)
  await expect.poll(() => lay(b, (l, id) => l.obj(id)?.x, ids[0]), { timeout: 10_000 }).toBe(await lay(a, (l, id) => l.obj(id)?.x, ids[0]));
  await b.waitForTimeout(500);
  const fb = await framesDone(b);
  console.log(`burst of 40: A ${ms.sync} ms (${ms.frame} ms through its next frame); B's longest frame ${fb.max} ms, ${fb.over} ms over budget`);
  expect(ms.sync).toBeLessThan(400);
  // every op reaches B live (numbered: those over the room's rate limit hear `busy` and go again), not only the first
  // 20 (the demo's phones have no record to bring the rest)
  for (const id of [ids[19], ids[20], ids[39]]) {
    await expect.poll(() => lay(b, (l, i) => l.obj(i)?.x, id), { timeout: 10_000 }).toBe(await lay(a, (l, i) => l.obj(i)?.x, id));
  }
});
