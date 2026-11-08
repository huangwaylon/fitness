// The two-phone harness (docs/backend.md#shared-world "Checked"): two players run a scripted session (tap-walks, a
// pick-up, a catch, a present put down, a watered flower, a shake, a wish, both grabbing the same thing at once), then
// both phones must have the same island: the shared day's canonical hash and each villager's spot and sleep. A third
// phone opening later must rebuild the same. It times what the partner sees: a tap → their villager setting off, a
// change → its arrival, a join → the same island.
//   npm run e2e -- sync-harness             the demo's two tabs (BroadcastChannel: no network)
//   RELAY_E2E=1 npm run e2e -- sync-harness --workers=1   two browser contexts against the test relay (relay/.smoke-keys;
//                                                         one at a time: each person's key opens one socket)
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { lawnTap, oku, tapOn, quiet, watchComings } from './island.ts';
import { sayOwn } from './say.ts';
import { existsSync, readFileSync } from 'node:fs';

/** The edit tray open, and the room re-centred above it (a tap's px only holds once the camera is at rest). */
async function openEdit(p: Page) {
  await p.locator('[data-tent-edit-open]').click();
  await settled(p);
}
/** The tent's camera at rest, framed for the bar as it is now (a pick or a place changes the bar and re-frames the
 *  room: a px is only where the finger lands once it's still). */
const settled = (p: Page) => p.waitForFunction(() => (window as unknown as { __tent: { still(): boolean } }).__tent.still(), null, { timeout: 10_000 });

/** Where a villager stands just out of the tent (buildings.ts outOf, the page's island's: 30 in front of its door, each
 *  to one side, on walkable ground). */
const OUT = (p: Page, who: 'A' | 'B') =>
  p.evaluate((who) => (window as unknown as { __world: { exit(id: string, who: string): { at: [number, number] } } }).__world.exit('campsite', who).at, who);

/** A tap on the tent where it is the tent's (a villager may stand in front of its door). */
async function tapTent(p: Page) {
  await tapOn(p, p.locator('[data-building="campsite"] .door'));
}

test.use({ viewport: { width: 390, height: 844 } });

type State = { day: string; decor: string; villagers: Record<'A' | 'B', { x: number; z: number; asleep: boolean; walking: boolean }> };
type W = {
  go(z: number): void; at(x: number, z: number): [number, number]; mine(): [number, number]; partner(): [number, number];
  state(): State; share(i: object): boolean; heard(): Record<string, number>;
  metrics(): { sent: number; sentBytes: number; recv: number; recvBytes: number; resent: number; ackMs: number[]; pending: number } | null;
};
const w = <T,>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([fn, args]) => ((window as unknown as { __world: Record<string, (...a: unknown[]) => unknown> }).__world[fn as string](...(args as unknown[]))), [fn, args] as const) as Promise<T>;

const RELAY = process.env.RELAY_E2E ? (process.env.RELAY_URL ?? 'wss://island-fund-relay-test.island-fund-relay.workers.dev/room') : null;
const KEYS_FILE = new URL('../../relay/.smoke-keys', import.meta.url);
const keys = (): Record<string, string> =>
  Object.fromEntries(readFileSync(KEYS_FILE, 'utf8').trim().split('\n').map((l) => l.split('=') as [string, string]));
// the relay's day is today's: no `?date=` against it (`?awake`: the villagers up at any hour); the demo's tabs preview a
// fixed day
const q = (who: 'A' | 'B') =>
  RELAY ? `?demo&awake${who === 'B' ? '&as=B' : ''}&relay=${encodeURIComponent(RELAY)}&key=${keys()[`KEY_${who}`]}` : `?demo&date=2026-11-04T12:00${who === 'B' ? '&as=B' : ''}`;

const CTX = { viewport: { width: 390, height: 844 }, bypassCSP: !!RELAY };

async function phones(browser: Browser) {
  // against the relay each phone is its own browser context (its own storage; the page's CSP lets only the production
  // relay in, so the test copy's socket needs it bypassed); the demo's two tabs share one
  const ctxA = await browser.newContext(CTX);
  const ctxB = RELAY ? await browser.newContext(CTX) : ctxA;
  const open = async (who: 'A' | 'B', ctx = who === 'A' ? ctxA : ctxB) => {
    const p = await ctx.newPage();
    await p.goto(q(who));
    await p.waitForFunction(() => (window as unknown as { __world?: { state?: unknown } }).__world?.state);
    return p;
  };
  return { open, ctxB, close: async () => (await ctxA.close(), RELAY ? await ctxB.close() : undefined) };
}

/** When the watcher's partner villager first moves (Date.now()), polled in its page. */
const setsOff = (page: Page) =>
  page.evaluate(async () => {
    const w = (window as unknown as { __world: W }).__world;
    const [x0, z0] = w.partner();
    const t0 = Date.now();
    while (Date.now() - t0 < 2500) {
      const [x, z] = w.partner();
      if (Math.hypot(x - x0, z - z0) > 0.5) return Date.now();
      await new Promise((r) => setTimeout(r, 4));
    }
    return null;
  });

/** When `key` arrived on the page (its heard log; or, when the sheet's row brought it first and it was no news, the
 *  shared day holding `needle`), waiting up to 4 s. */
/** How often `needle` is in the page's canonical day now. */
const inCanon = (page: Page, needle: string) =>
  page.evaluate((needle) => (window as unknown as { __world: { canon(): string } }).__world.canon().split(needle).length - 1, needle);
/** When `key` was heard on `page` (after `after`), or its `needle` came into the canonical day (more than `base` of it:
 *  what it held already); null after 4 s. */
const arrived = (page: Page, key: string, needle: string, after: number, base = 0) =>
  page.evaluate(async ([key, needle, after, base]) => {
    const w = (window as unknown as { __world: W & { canon(): string } }).__world, t0 = Date.now();
    while (Date.now() - t0 < 4000) {
      const h = w.heard()[key];
      const t = (h !== undefined && h >= after ? h : 0) || (w.canon().split(needle).length - 1 > base ? Date.now() : 0);
      if (t) return t;
      await new Promise((r) => setTimeout(r, 4));
    }
    return null;
  }, [key, needle, after, base] as const);

/** What two canonical days hold differently (each part's entries only one side has). */
const diff = (x: Record<string, unknown>, y: Record<string, unknown>) =>
  Object.keys(x).flatMap((k) => {
    const xs = new Set((Array.isArray(x[k]) ? (x[k] as unknown[]) : [x[k]]).map((e) => JSON.stringify(e)));
    const ys = new Set((Array.isArray(y[k]) ? (y[k] as unknown[]) : [y[k]]).map((e) => JSON.stringify(e)));
    const only = (a: Set<string>, b: Set<string>) => [...a].filter((e) => !b.has(e));
    const d = [...only(xs, ys).map((e) => `-${e}`), ...only(ys, xs).map((e) => `+${e}`)];
    return d.length ? [`${k}: ${d.join(' ')}`] : [];
  }).join('; ');

const same = (a: State, b: State) => {
  expect(b.day).toBe(a.day);
  expect(b.decor, 'the decorations').toBe(a.decor);
  for (const who of ['A', 'B'] as const) {
    expect(Math.hypot(a.villagers[who].x - b.villagers[who].x, a.villagers[who].z - b.villagers[who].z), `${who}'s villager`).toBeLessThanOrEqual(1);
    expect(b.villagers[who].asleep, `${who} asleep`).toBe(a.villagers[who].asleep);
  }
};

/** The island's camera at rest on these phones (a tap's px only holds once it is). */
const atRest = (...ps: Page[]) => Promise.all(ps.map((p) => expect.poll(() => w<boolean>(p, 'idle'), { timeout: 5000 }).toBe(true)));
/** Both phones have each other's villager where its own phone has it (the join's word in: villagerSync JOIN_SAY_MS). */
const joined = (a: Page, b: Page) =>
  expect.poll(async () => {
    const [am, ap, bm, bp] = await Promise.all([w<[number, number]>(a, 'mine'), w<[number, number]>(a, 'partner'), w<[number, number]>(b, 'mine'), w<[number, number]>(b, 'partner')]);
    return Math.max(Math.hypot(am[0] - bp[0], am[1] - bp[1]), Math.hypot(bm[0] - ap[0], bm[1] - ap[1]));
  }, { timeout: 5000 }).toBeLessThanOrEqual(1);
/** Two phones' islands the same (as `same` checks) with nobody walking: everything sent has arrived. */
const settledAs = (x: Page, y: Page) =>
  expect.poll(async () => {
    const [a, b] = [await w<State>(x, 'state'), await w<State>(y, 'state')];
    const who = ['A', 'B'] as const;
    return a.day === b.day && a.decor === b.decor && who.every((k) => !a.villagers[k].walking && !b.villagers[k].walking &&
      Math.hypot(a.villagers[k].x - b.villagers[k].x, a.villagers[k].z - b.villagers[k].z) <= 1 && a.villagers[k].asleep === b.villagers[k].asleep);
  }, { timeout: 10_000 }).toBe(true).catch(() => undefined); // (`same` then says what differs)
/** A tap-walk's ring, if the tap took (a short wait: it comes at once or not at all). */
const ringed = (p: Page) => p.locator('[data-ring="mine"]').first().waitFor({ state: 'attached', timeout: 300 }).then(() => true, () => false);

test.skip(!!RELAY && !existsSync(KEYS_FILE), 'RELAY_E2E needs relay/.smoke-keys');
// against the real relay: its socket is the network (e2e/fixtures.ts), and its day is today's (no pinned clock)
if (RELAY) test.use({ network: 'any', ownClock: true });
// every phone's context goes when the test does, passed or not (the relay's room holds 8 sockets at most)
test.afterEach(async ({ browser }) => {
  for (const c of browser.contexts()) await c.close();
});

test('two phones, one island: a scripted session leaves both (and a phone opening later) with the same state', async ({ browser }) => {
  test.setTimeout(120_000);
  const { open, ctxB, close } = await phones(browser);
  const a = await open('A'), b = await open('B');
  const run = Date.now().toString(36).slice(-6);
  // both there (the relay's presence; the demo's hello), and the same island to start with
  for (const p of [a, b])
    await expect.poll(() => w<{ connected: boolean; peer: boolean } | null>(p, 'status').then((s) => !!s?.connected && s.peer), { timeout: 10_000 }).toBe(true).catch(async (e) => {
      console.log('status', JSON.stringify(await w(a, 'status')), JSON.stringify(await w(b, 'status')), JSON.stringify(await w(a, 'metrics')), JSON.stringify(await w(b, 'metrics')));
      throw e;
    });
  await joined(a, b);
  await expect.poll(async () => (await w<State>(a, 'state')).day === (await w<State>(b, 'state')).day, { timeout: 10_000 }).toBe(true).catch(async (e) => {
    console.log('at the start, A vs B:', diff(JSON.parse(await w<string>(a, 'canon')), JSON.parse(await w<string>(b, 'canon'))), JSON.stringify(await w(a, 'state')), JSON.stringify(await w(b, 'state')), JSON.stringify(await w(a, 'metrics')), JSON.stringify(await w(b, 'metrics')));
    throw e;
  });
  await quiet(a); // the opening beats are over
  for (const p of [a, b]) await w(p, 'go', 300);
  await atRest(a, b);
  const lat: Record<string, number[]> = {};
  const note = (k: string, ms: number | null) => (ms === null ? null : (lat[k] ??= []).push(ms));

  // tap-walks, each way: the partner's villager sets off on the other phone (on open lawn near each spot in turn, read
  // from the page's island: e2e/island.ts lawnTap, never a fixed point the day's things or the layout's may stand on)
  const SPOTS: [number, number][] = [[200, 420], [240, 500], [120, 400], [300, 440], [160, 300], [260, 330], [90, 300]];
  for (const [tapper, watcher] of [[a, b], [b, a], [a, b], [b, a]] as const) {
    for (const [sx, sz] of SPOTS) {
      const { at: [x, z], x: cx, y: cy } = await lawnTap(tapper, sx, sz);
      const before = await w<[number, number]>(tapper, 'mine');
      if (Math.hypot(before[0] - x, before[1] - z) < 30) continue;
      const off = setsOff(watcher);
      const t0 = Date.now();
      await tapper.mouse.click(cx, cy);
      if (!(await ringed(tapper))) continue;
      const t1 = await off;
      note('tap → walk starts', t1 && t1 - t0);
      await tapper.waitForTimeout(400);
      break;
    }
  }
  // the world's things, every kind, each timed to its arrival on the other phone
  const changes: [Page, Page, object, string][] = [
    [a, b, { kind: 'pick', id: `h${run}1`, what: 'find:shell:cowrie', at: [150, 40] }, `pick:h${run}1`],
    [b, a, { kind: 'catch', what: 'sea-bass', id: `h${run}2`, at: [120, -60], how: 'rod' }, `catch:h${run}2`],
    [a, b, { kind: 'put', id: `h${run}3`, what: 'present', at: [210, 380] }, `put:h${run}3`],
    [b, a, { kind: 'world', op: 'watered', id: `fl:${run}` }, `world:fl:${run}`],
    [a, b, { kind: 'shake', tree: 'oak-m1', drop: 'branch' }, 'shake:oak-m1'],
    [b, a, { kind: 'pick', id: `h${run}3`, what: 'present' }, `pick:h${run}3`],
    [a, b, { kind: 'world', op: 'wished', id: '2026-11-05' }, 'world:2026-11-05']
  ];
  for (const [from, to, i, key] of changes) {
    // the change in the other phone's canonical day too, not only heard: a shake has no id of its own, so its needle is
    // its tree, one more of it than before (`shake:oak-m1` was null twice on 2026-11-06 and once on 11-02 with the
    // heard time its only way: B can fold the same shake from A's island day row first, and a shake that isn't fresh
    // is never heard, though it's there)
    const needle = key.includes(run) ? key.slice(key.indexOf(':') + 1) : key === 'world:2026-11-05' ? '["2026-11-05",1' : '"oak-m1"';
    const base = needle === '"oak-m1"' ? await inCanon(to, needle) : 0;
    const t0 = await from.evaluate((i) => ((window as unknown as { __world: W }).__world.share(i), Date.now()), i);
    const t1 = await arrived(to, key, needle, t0, base);
    note(`${(i as { kind: string }).kind} → there`, t1 && t1 - t0);
    if (t1 === null) console.log(`${key} not on the other phone: its canon`, await to.evaluate(() => (window as unknown as { __world: { canon(): string } }).__world.canon()), 'the sender\'s metrics', JSON.stringify(await w(from, 'metrics')));
    expect(t1, key).not.toBeNull();
    await from.waitForTimeout(80);
  }
  // the decorations (persistent, docs/design.md "Decorating"): placed on each phone, moved by the other, one put away,
  // and both moving the same one at once (the later wins on both)
  const d1 = `d${run}a1`, d2 = `d${run}b2`;
  const decorChanges: [Page, Page, string, unknown[]][] = [
    [a, b, 'decorSet', [{ id: d1, item: 'tanuki', x: 300, z: 456, f: 0 }]],
    [b, a, 'decorSet', [{ id: d2, item: 'birdbath', x: 144, z: 360, f: 1 }]],
    [b, a, 'decorSet', [{ id: d1, item: 'tanuki', x: 264, z: 480, f: 2 }]],
    [a, b, 'decorRemove', [d2]]
  ];
  for (const [from, to, fn, args] of decorChanges) {
    const id = (args[0] as { id?: string }).id ?? (args[0] as string);
    const t0 = await from.evaluate(([fn, args]) => ((window as unknown as { __world: Record<string, (...a: unknown[]) => unknown> }).__world[fn as string](...(args as unknown[])), Date.now()), [fn, args] as const);
    // there when the other phone's layout is this one's (the relay's op, or the sheet's row first: no news then)
    const want = await w<string>(from, 'decorCanon');
    const t1 = await to.evaluate(async ([want, key, after]) => {
      const w = (window as unknown as { __world: { decorCanon(): string; heard(): Record<string, number> } }).__world, t = Date.now();
      while (Date.now() - t < 4000) {
        const h = w.heard()[key];
        if (w.decorCanon() === want) return h !== undefined && h >= after ? h : Date.now();
        await new Promise((r) => setTimeout(r, 4));
      }
      return null;
    }, [want, `decor:${id}`, t0] as const);
    note('decor → there', t1 && t1 - t0);
    expect(t1, `decor ${fn} ${id}`).not.toBeNull();
    await from.waitForTimeout(80);
  }
  await Promise.all([[a, 96], [b, 312]].map(([p, x]) => w(p as Page, 'decorSet', { id: d1, item: 'tanuki', x, z: 504, f: 0 })));
  // (the later wins on both: one layout before the next race, the demo's room is a log both tabs write)
  await expect.poll(async () => (await w<string>(a, 'decorCanon')) === (await w<string>(b, 'decorCanon')), { timeout: 4000 }).toBe(true);
  // both grab the same thing at once: one wins, both agree on who
  await Promise.all([a, b].map((p) => w(p, 'share', { kind: 'pick', id: `h${run}x`, what: 'weed' })));
  await settledAs(a, b); // the walks are over, everything has arrived
  const [sa, sb] = [await w<State>(a, 'state'), await w<State>(b, 'state')];
  if (sa.day !== sb.day) console.log('A vs B:', diff(JSON.parse(await w<string>(a, 'canon')), JSON.parse(await w<string>(b, 'canon'))));
  same(sa, sb);
  // a phone opening later (B again: its own storage against the relay, a tab of the same in the demo)
  const t0 = Date.now();
  const c = await open('B', RELAY ? await browser.newContext(CTX) : ctxB);
  // (its own villager where this phone has it, told to A as it joins: compared with A as it is now)
  await expect.poll(async () => (await w<State>(c, 'state')).day === (await w<State>(a, 'state')).day, { timeout: 10_000, intervals: [20] }).toBe(true).catch(async (e) => {
    console.log('later, A vs C:', diff(JSON.parse(await w<string>(a, 'canon')), JSON.parse(await w<string>(c, 'canon'))));
    throw e;
  });
  note('join → the same day', Date.now() - t0);
  await settledAs(a, c);
  same(await w<State>(a, 'state'), await w<State>(c, 'state'));
  const m = await w<ReturnType<W['metrics']>>(a, 'metrics');
  const med = (xs: number[]) => [...xs].sort((x, y) => x - y)[Math.floor(xs.length / 2)];
  console.log(`[${RELAY ? 'relay' : 'demo'}] ` + Object.entries(lat).map(([k, v]) => `${k}: median ${med(v)} ms (max ${Math.max(...v)}, n=${v.length})`).join('; '));
  if (m) console.log(`[relay] A's socket: ${m.sent} sent (${m.sentBytes} B), ${m.recv} received (${m.recvBytes} B), ${m.resent} resent, acks median ${med(m.ackMs)} ms, ${m.pending} waiting`);
  await close();
});

test('a phrase is presence: the partner sees it over my villager at once, a phone opening later never', async ({ browser }) => {
  test.setTimeout(60_000);
  const { open, ctxB, close } = await phones(browser);
  const a = await open('A'), b = await open('B');
  for (const p of [a, b]) await expect.poll(() => w<{ connected: boolean; peer: boolean } | null>(p, 'status').then((s) => !!s?.connected && s.peer), { timeout: 10_000 }).toBe(true);
  await quiet(a); // the opening beats are over
  const said = b.locator('[data-say="partner"]');
  // a phrase, each way (A's first: nothing kept yet, the field at once; the demo's tabs share one storage, so B's
  // picker lists A's and goes through じぶんで かく…)
  for (const [from, to, name] of [[a, b, 'やっほー！'], [b, a, 'おつかれさま！']] as const) {
    await from.getByRole('button', { name: 'ひとこと いう' }).click();
    const box = from.getByRole('dialog', { name: 'なにを いう？' }), field = box.locator('[data-say-field]');
    await expect(box).toBeVisible();
    if (!(await field.count())) await box.getByRole('button', { name: 'じぶんで かく…' }).click();
    await field.fill(name);
    const t0 = Date.now();
    await field.press('Enter');
    await expect(to.locator('[data-say="partner"]')).toHaveText(new RegExp(name), { timeout: 2000 });
    if (from === a) await expect(said.locator('.who')).toHaveText('ウェイ');
    console.log(`[${RELAY ? 'relay' : 'demo'}] say → there: ${Date.now() - t0} ms (the Enter included)`);
    await expect(from.locator('[data-say="mine"]')).toHaveText(new RegExp(name));
  }
  // (my own words cleaned on the way: say.spec's, and live-protocol.test's parseServer)
  // gone after a few seconds, and never replayed to a phone opening later
  await expect(said).toHaveCount(0, { timeout: 5500 });
  const c = await open('B', RELAY ? await browser.newContext(CTX) : ctxB);
  await c.waitForTimeout(1500); // (proving nothing comes)
  await expect(c.locator('[data-say]')).toHaveCount(0);
  await close();
});

// The tent (docs/design.md "The tent"): both phones in it see one room; a piece A drags moves on B as A drags it (held
// there: lifted, not B's to pick up), lands where A drops it; each villager is its own phone's, the other's walks
// replayed.
type TentHooks = {
  stats(): { frames: number }; tile(x: number, z: number): [number, number]; pieces(): { id: string; item: string; x: number; z: number; f: number }[];
  held(): { id: string; x: number; z: number }[]; edit(): { sel: { id: string; x: number; z: number; f: number } | null } | null;
  partner(): { at: [number, number]; walking: boolean } | null; mine(): [number, number]; walking(w: string): boolean;
};
const tt = <R,>(page: Page, fn: (t: TentHooks) => R) => page.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;

// One place at a time for a phrase too (docs/design.md "Villager taps"): said in a room (`say` with its `sc`), it shows
// only on a phone whose villager is in that room; said on the island, only on the island.
test('a phrase in the tent: B in there sees it over A; B on the island doesn’t, nor does A in the tent hear B’s on the island', async ({ browser }) => {
  test.setTimeout(60_000);
  const ctxA = await browser.newContext(CTX);
  const ctxB = RELAY ? await browser.newContext(CTX) : ctxA;
  const room = async (p: Page, who: 'A' | 'B') => {
    await p.goto('tent' + q(who));
    await p.waitForFunction(() => ((window as unknown as { __tent?: TentHooks }).__tent?.stats()?.frames ?? 0) > 0, null, { timeout: 15_000 });
  };
  const say = async (p: Page, name: string) => {
    await p.bringToFront();
    await sayOwn(p, name);
    await expect(p.locator('[data-say="mine"]')).toHaveText(new RegExp(name));
  };
  const a = await ctxA.newPage(), b = await ctxB.newPage();
  await room(a, 'A');
  await room(b, 'B');
  // each sees the other in the room
  for (const p of [a, b]) await expect.poll(() => tt(p, (t) => t.partner()), { timeout: 8000 }).not.toBeNull();
  await say(a, 'やっほー！');
  await expect(b.locator('[data-say="partner"]')).toHaveText(/やっほー！/, { timeout: 3000 });
  await expect(b.locator('[data-say="partner"] .who')).toHaveText('ウェイ');
  // B goes out to the island: A's next phrase in the tent isn't for it
  await b.goto(q('B'));
  await b.waitForFunction(() => (window as unknown as { __world?: { state?: unknown } }).__world?.state);
  await expect.poll(() => tt(a, (t) => t.partner()), { timeout: 6000 }).toBeNull();
  await a.waitForTimeout(1600); // (one per 1.5 s)
  await say(a, 'がんばろう！');
  await b.waitForTimeout(1500); // (proving nothing comes)
  await expect(b.locator('[data-say]')).toHaveCount(0);
  // and B's on the island isn't for A in the tent
  await quiet(b); // the opening beats are over
  await say(b, 'おつかれさま！');
  await a.waitForTimeout(1500); // (proving nothing comes)
  await expect(a.locator('[data-say="partner"]')).toHaveCount(0);
  await ctxA.close();
  if (RELAY) await ctxB.close();
});

test('two phones in the tent: one room, A’s drag live on B (held there), the drop on both; each villager its own', async ({ browser }) => {
  // (two rooms drawn in software on CI's runners, and the drag waited out spot by spot on B)
  test.setTimeout(60_000);
  const ctxA = await browser.newContext(CTX);
  const ctxB = RELAY ? await browser.newContext(CTX) : ctxA;
  const open = async (who: 'A' | 'B', ctx: typeof ctxA) => {
    const p = await ctx.newPage();
    await p.goto('tent' + q(who));
    await p.waitForFunction(() => ((window as unknown as { __tent?: TentHooks }).__tent?.stats()?.frames ?? 0) > 0, null, { timeout: 15_000 });
    return p;
  };
  const a = await open('A', ctxA);
  await a.evaluate(() => localStorage.removeItem('island-demo.tent'));
  const b = await open('B', ctxB);
  // A puts the camping cot down in the back row (the demo's two phones are two tabs: the one acting in front)
  await a.bringToFront();
  await openEdit(a);
  await a.locator('[data-tent-item="f4081"]').click();
  await settled(a);
  // (a 2 × 1 piece's middle on the line between tiles 1 and 2)
  let [x, y] = await a.evaluate(() => (window as unknown as { __tent: { px(x: number, z: number): [number, number] } }).__tent.px(-20, -25));
  await a.mouse.click(x, y);
  await expect.poll(() => tt(a, (t) => t.edit()?.sel ?? null)).toMatchObject({ x: 1, z: 1 });
  await a.locator('[data-act="place"]').click();
  await expect.poll(() => tt(b, (t) => t.pieces().map((p) => p.item)), { timeout: 4000 }).toEqual(['f4081']);
  const p0 = (await tt(a, (t) => t.pieces()))[0];
  // A drags it across the back row; B follows it as it goes
  await settled(a);
  [x, y] = await tt(a, (t) => t.tile(t.pieces()[0].x, t.pieces()[0].z));
  const [x2, y2] = await tt(a, (t) => t.tile(6, 1));
  // both phones know the other is there (presence: a drag goes only to a partner who is)
  await expect.poll(() => Promise.all([a, b].map((p) => p.evaluate(() => (window as unknown as { __tent: { peer(): boolean } }).__tent.peer()))), { timeout: 6000 }).toEqual([true, true]);
  // (the piece is drawn there: its model in)
  await expect.poll(() => a.evaluate(([x, y]) => (window as unknown as { __tent: { hit(x: number, y: number): { kind: string } } }).__tent.hit(x, y)?.kind, [x, y]), { timeout: 4000 }).toBe('piece');
  await a.mouse.move(x, y);
  await a.mouse.down();
  // A has it (a press on a placed piece picks it up)
  await expect.poll(() => tt(a, (t) => t.edit()?.sel?.id ?? null), { timeout: 2000 }).toBe(p0.id);
  // each spot A's finger takes it to is held there on B (its middle: the 2 × 1 cot's, facing as placed), live, before
  // A's finger goes on (the stream's ≤ 10 a second, its last spot always sent)
  const seen = new Set<number>();
  for (let k = 1; k <= 10; k++) {
    await a.mouse.move(x + ((x2 - x) * k) / 10, y + ((y2 - y) * k) / 10);
    const sel = (await tt(a, (t) => t.edit()?.sel ?? null))!;
    expect(sel).toMatchObject({ id: p0.id, f: p0.f });
    const mid = -40 + (sel.x + 1) * 10;
    await expect.poll(() => tt(b, (t) => t.held()[0]?.x ?? null), { timeout: 3000 }).toBe(mid);
    seen.add(mid);
  }
  // held on B: B can't pick it up while A has it
  expect(await tt(b, (t) => t.held().length)).toBe(1);
  await b.bringToFront();
  await openEdit(b);
  const [bx, by] = await tt(b, (t) => t.tile(t.pieces()[0].x, t.pieces()[0].z));
  await b.mouse.click(bx, by);
  expect((await tt(b, (t) => t.edit()))?.sel ?? null).toBeNull();
  await a.bringToFront();
  await a.mouse.up();
  await a.locator('[data-act="place"]').click();
  await expect.poll(async () => (await tt(a, (t) => t.pieces()))[0].x).toBeGreaterThan(p0.x + 2);
  const end = (await tt(a, (t) => t.pieces()))[0];
  // B saw it on its way (several spots between), then it landed where A dropped it, no longer held
  expect(seen.size).toBeGreaterThanOrEqual(3);
  await expect.poll(() => tt(b, (t) => t.held().length), { timeout: 3000 }).toBe(0);
  await expect.poll(() => tt(b, (t) => t.pieces()[0]), { timeout: 3000 }).toMatchObject({ id: end.id, x: end.x, z: end.z, f: end.f });
  // A walks: B plays A's villager there (A's to move)
  await a.locator('[data-tent-done]').click();
  await b.locator('[data-tent-done]').click();
  await settled(a);
  [x, y] = await tt(a, (t) => t.tile(5, 4));
  await a.mouse.click(x, y);
  // (there: the tile's middle, 15, 5)
  await expect.poll(() => tt(a, (t) => {
    const [mx, mz] = t.mine();
    return !t.walking('A') && Math.hypot(mx - 15, mz - 5) < 1.5;
  }), { timeout: 8000 }).toBe(true);
  const mine = await tt(a, (t) => t.mine());
  await expect.poll(async () => {
    const p = await tt(b, (t) => t.partner());
    return p ? Math.hypot(p.at[0] - mine[0], p.at[1] - mine[1]) : 999;
  }, { timeout: 4000 }).toBeLessThan(1.5);
  await ctxA.close();
  if (RELAY) await ctxB.close();
});

test('a high-five over the relay: the partner plays the same moment, its banner and hearts once; held while they are away', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a transient pose or effect (a squish, a sparkle) over before a software-GL frame shows it' } }, async ({ browser }) => {
  test.setTimeout(90_000);
  const { open, ctxB, close } = await phones(browser);
  const a = await open('A'), b = await open('B');
  for (const p of [a, b]) await expect.poll(() => w<{ connected: boolean; peer: boolean } | null>(p, 'status').then((s) => !!s?.connected && s.peer), { timeout: 10_000 }).toBe(true);
  await quiet(a); // the opening beats are over
  // B watches for the moment, in its page from before the tap: each thing's comings (it showing after it wasn't), so a
  // transient sparkle is seen however late a loaded runner reads it, and a second coming is counted
  const came = await watchComings(b, {
    zap: '[data-zap]',
    hearts: '[data-actor="mine"] .fx.hearts',
    sparklesMine: '[data-actor="mine"] .fx.sparkles',
    sparklesPartner: '[data-actor="partner"] .fx.sparkles',
    banner: { sel: '.banner[role="status"] .txt', text: 'ウェイさんからハイタッチ！' }
  });
  const t0 = await a.evaluate(() => Date.now());
  await a.locator('[data-actor="partner"] .vil').click();
  // the moment played there (how soon is the relay's business, not this flow's: logged, never asserted)
  await expect.poll(() => came('zap'), { message: 'B played the sparkle' }).toBe(1);
  console.log(`[${RELAY ? 'relay' : 'demo'}] high-five tap → played there by: ${(await b.evaluate(() => Date.now())) - t0} ms`);
  for (const k of ['hearts', 'sparklesMine', 'sparklesPartner', 'banner']) await expect.poll(() => came(k), { message: `B's ${k}` }).toBeGreaterThan(0);
  await expect(a.getByText('うめさんに ハイタッチ！')).toBeVisible();
  // once: B heard it once (its kept high-fives today: the one), and by the time the banner has gone and A has nothing
  // left unsent, it came once and so did the hearts (nothing comes from the sheet any more)
  await expect(b.getByText('ウェイさんからハイタッチ！')).toHaveCount(0, { timeout: 10_000 });
  await expect.poll(() => a.evaluate(() => (window as unknown as { __world: W }).__world.metrics()?.pending ?? 0)).toBe(0);
  expect(await b.evaluate(() => (JSON.parse(localStorage.getItem('hf-got.B') ?? '{}') as { ats?: unknown[] }).ats?.length)).toBe(1);
  expect(await came('banner')).toBe(1);
  expect(await came('hearts')).toBe(1);
  if (RELAY) {
    // B's phone closed: the room holds A's high-five, and B hears it (the banner, the hearts) when it opens
    await b.close();
    await a.waitForTimeout(800);
    await a.locator('[data-actor="partner"] .vil').click();
    await a.waitForTimeout(800);
    const c = await open('B', ctxB);
    await expect(c.getByText('ウェイさんからハイタッチ！')).toBeVisible({ timeout: 6000 });
    await c.close();
    // heard and said got: not again
    const d = await open('B', ctxB);
    await d.waitForTimeout(3500);
    await expect(d.getByText('ウェイさんからハイタッチ！')).toHaveCount(0);
  }
  await close();
});

// One place at a time (docs/design.md "The tent"): a villager in the tent is nowhere on the island, on both phones;
// inside, the partner's villager is there only while the partner is; out of the door it stands at the tent's door on
// both; a phone that goes quiet inside has its villager back on the island where it went in after the timeout.
test('one place at a time: A in the tent is gone from B’s island, there with B inside, out at the door on both; quiet inside, back there', { tag: '@logic', annotation: { type: 'logic', description: 'drawn: a wait sized for the game at full speed (an animation, a spawn, a sync within its seconds); software GL slows the game itself' } }, async ({ browser }) => {
  test.setTimeout(90_000);
  const ctxA = await browser.newContext(CTX);
  const ctxB = RELAY ? await browser.newContext(CTX) : ctxA;
  const open = async (who: 'A' | 'B', ctx: typeof ctxA, extra = '') => {
    const p = await ctx.newPage();
    await p.goto(q(who) + extra);
    await p.waitForFunction(() => (window as unknown as { __world?: { state?: unknown } }).__world?.state);
    return p;
  };
  const a = await open('A', ctxA), b = await open('B', ctxB, '&quietafter=1500');
  for (const p of [a, b]) await expect.poll(() => w<{ connected: boolean; peer: boolean } | null>(p, 'status').then((s) => !!s?.connected && s.peer), { timeout: 10_000 }).toBe(true);
  const inside = (p: Page) => p.locator('[data-actor="partner"]').getAttribute('data-inside');
  const door = async (p: Page) => {
    await p.bringToFront();
    await w(p, 'go', await oku(p));
    await atRest(p);
    await tapTent(p);
    await expect(p).toHaveURL(/\/tent\?/, { timeout: 10_000 });
    await p.waitForFunction(() => ((window as unknown as { __tent?: TentHooks }).__tent?.stats()?.frames ?? 0) > 0);
  };
  expect(await inside(b)).toBeNull();
  // A walks up to the tent and goes in: gone from B's island
  await door(a);
  await expect.poll(() => inside(b), { timeout: 6000 }).toBe('true');
  // A's tent shows nobody else (B is on the island)
  expect(await tt(a, (t) => t.partner())).toBeNull();
  // B goes in: A is there
  await door(b);
  await expect.poll(() => tt(b, (t) => t.partner()), { timeout: 6000 }).not.toBeNull();
  await expect.poll(() => tt(a, (t) => t.partner()), { timeout: 6000 }).not.toBeNull();
  // A comes out: at the door on A's island, gone from B's tent
  await a.bringToFront();
  await a.getByRole('button', { name: '島へ' }).click();
  await a.waitForFunction(() => (window as unknown as { __world?: { state?: unknown } }).__world?.state);
  const out = await OUT(a, 'A');
  await expect.poll(async () => {
    const at = await w<[number, number]>(a, 'mine');
    return Math.hypot(at[0] - out[0], at[1] - out[1]);
  }, { timeout: 3000 }).toBeLessThan(2);
  await expect.poll(() => tt(b, (t) => t.partner()), { timeout: 4000 }).toBeNull();
  // B comes out: A on B's island, at the door too
  await b.bringToFront();
  await b.getByRole('button', { name: '島へ' }).click();
  await b.waitForFunction(() => (window as unknown as { __world?: { state?: unknown } }).__world?.state);
  await expect.poll(() => inside(b), { timeout: 4000 }).toBeNull();
  // (where A's own phone has it: both phones agree; A's own villager is A's phone's to move)
  await expect.poll(async () => {
    const p = await w<[number, number]>(b, 'partner'), m = await w<[number, number]>(a, 'mine');
    return Math.hypot(p[0] - m[0], p[1] - m[1]);
  }, { timeout: 6000 }).toBeLessThan(3);
  // A goes in again (right at the door: straight in) and its phone goes quiet: back on B's island after the timeout,
  // where it went in (its last walk's end), and there it stays (no walk home)
  await door(a);
  await expect.poll(() => inside(b), { timeout: 6000 }).toBe('true');
  const went = await w<[number, number]>(b, 'partner'); // (where B's island had it as it went in)
  await a.close({ runBeforeUnload: true }); // (its bye: else the demo's relay notices it 10 s on)
  await expect.poll(() => inside(b), { timeout: 15_000 }).toBeNull();
  const near = async () => {
    const p = await w<[number, number]>(b, 'partner');
    return Math.hypot(p[0] - went[0], p[1] - went[1]);
  };
  await expect.poll(near, { timeout: 4000 }).toBeLessThan(3);
  // (proving nothing moves it for a while: a fixed wait, on purpose)
  await b.waitForTimeout(3000);
  expect(await near()).toBeLessThan(3);
  expect((await w<State>(b, 'state')).villagers.A.walking).toBe(false);
  await ctxA.close();
  if (RELAY) await ctxB.close();
});

// A table and the lamp on it (docs/design.md "The tent": NH's table tops): the partner's room has the lamp on the table,
// and it rides along when the table moves there too.
test('a lamp on a table, on both phones: on its top there, and along with the table when it moves', async ({ browser }) => {
  const ctxA = await browser.newContext(CTX);
  const ctxB = RELAY ? await browser.newContext(CTX) : ctxA;
  const open = async (who: 'A' | 'B', ctx: typeof ctxA) => {
    const p = await ctx.newPage();
    await p.goto('tent' + q(who));
    await p.waitForFunction(() => ((window as unknown as { __tent?: TentHooks }).__tent?.stats()?.frames ?? 0) > 0);
    return p;
  };
  const a = await open('A', ctxA);
  await a.evaluate(() => localStorage.removeItem('island-demo.tent'));
  const b = await open('B', ctxB);
  type P = { id: string; item: string; x: number; z: number; y: number; on?: string };
  const placedOf = (p: Page) => p.evaluate(() => (window as unknown as { __tent: { placed(): P[]; pieces(): P[] } }).__tent.placed());
  await a.bringToFront();
  await openEdit(a);
  await a.locator('[data-tent-item="f4054"]').click();
  let [x, y] = await a.evaluate(() => (window as unknown as { __tent: { px(x: number, z: number): [number, number] } }).__tent.px(-20, -25));
  await a.mouse.click(x, y);
  await a.locator('[data-act="place"]').click();
  await a.locator('[data-tent-item="f4050"]').click();
  [x, y] = await tt(a, (t) => t.tile(2, 1));
  await a.mouse.click(x, y);
  await a.locator('[data-act="place"]').click();
  const lampOn = async (p: Page) => (await placedOf(p)).find((q) => q.y > 0) ?? null;
  await expect.poll(() => lampOn(b), { timeout: 4000 }).toMatchObject({ x: 2, z: 1 });
  // A turns the table (↻ on it, ✓): the lamp turns with it on B too
  [x, y] = await tt(a, (t) => t.tile(1, 1));
  await a.mouse.click(x, y);
  await a.locator('[data-act="turn"]').click();
  await a.locator('[data-act="place"]').click();
  const onA = await lampOn(a);
  expect(onA).not.toBeNull();
  await expect.poll(async () => { const l = await lampOn(b); return l && [l.x, l.z]; }, { timeout: 4000 }).toEqual([onA!.x, onA!.z]);
  // the HHA's rating is the room's alone: the same on both phones
  const hha = (p: Page) => p.evaluate(() => (window as unknown as { __tent: { hha(): Promise<{ total: number }> } }).__tent.hha());
  const ra = await hha(a);
  expect(ra.total).toBeGreaterThan(0);
  expect(await hha(b)).toEqual(ra);
  await ctxA.close();
  if (RELAY) await ctxB.close();
});

// Sitting and the lights (docs/design.md "The tent"): the partner sees me sit where I sit (one to a seat), and a lamp
// switched off is off on both phones.
test('in the tent: B sees A sit on the chair, and the lamp A switches off is off on B', async ({ browser }) => {
  const ctxA = await browser.newContext(CTX);
  const ctxB = RELAY ? await browser.newContext(CTX) : ctxA;
  const open = async (who: 'A' | 'B', ctx: typeof ctxA) => {
    const p = await ctx.newPage();
    await p.goto('tent' + q(who));
    await p.waitForFunction(() => ((window as unknown as { __tent?: TentHooks }).__tent?.stats()?.frames ?? 0) > 0);
    return p;
  };
  const a = await open('A', ctxA);
  await a.evaluate(() => localStorage.removeItem('island-demo.tent'));
  const b = await open('B', ctxB);
  type U = { fill(c: string[]): number; seat(): { id: string } | null; partnerSeat(): { id: string } | null; lights(): { pieces: { on: boolean }[] }; loading(): number };
  const u = <R,>(p: Page, fn: (t: U & TentHooks) => R) => p.evaluate(`(${fn.toString()})(window.__tent)`) as Promise<R>;
  await a.bringToFront();
  await u(a, (t) => t.fill(['f4039', 'f1432']));
  await a.waitForFunction(() => (window as unknown as { __tent: U }).__tent.loading() === 0);
  await expect.poll(() => u(b, (t) => t.pieces().length), { timeout: 4000 }).toBe(2);
  await expect.poll(() => Promise.all([a, b].map((p) => p.evaluate(() => (window as unknown as { __tent: { peer(): boolean } }).__tent.peer()))), { timeout: 6000 }).toEqual([true, true]);
  const ps = await u(a, (t) => t.pieces());
  const chair = ps.find((p) => p.item === 'f4039')!, lamp = ps.find((p) => p.item === 'f1432')!;
  let [x, y] = await tt(a, (t) => t.tile(0, 0));
  [x, y] = await a.evaluate(([cx, cz]) => (window as unknown as { __tent: TentHooks }).__tent.tile(cx, cz), [chair.x, chair.z]);
  await a.mouse.click(x, y);
  await expect.poll(() => u(a, (t) => t.seat()?.id ?? null), { timeout: 6000 }).toBe(chair.id);
  await expect.poll(() => u(b, (t) => t.partnerSeat()?.id ?? null), { timeout: 4000 }).toBe(chair.id);
  [x, y] = await a.evaluate(([cx, cz]) => (window as unknown as { __tent: TentHooks }).__tent.tile(cx, cz), [lamp.x, lamp.z]);
  await a.mouse.click(x, y);
  await expect.poll(() => u(b, (t) => t.lights().pieces.map((p) => p.on)), { timeout: 4000 }).toEqual([false]);
  await ctxA.close();
  if (RELAY) await ctxB.close();
});
