// The two-phone harness (docs/backend.md#shared-world "Checked"): two players run a scripted session (tap-walks, a
// pick-up, a catch, a present put down, a watered flower, a shake, a wish, both grabbing the same thing at once), then
// both phones must have the same island: the shared day's canonical hash and each villager's spot and sleep. A third
// phone opening later must rebuild the same. It times what the partner sees: a tap → their villager setting off, a
// change → its arrival, a join → the same island.
//   npm run e2e -- sync-harness             the demo's two tabs (BroadcastChannel: no network)
//   RELAY_E2E=1 npm run e2e -- sync-harness --workers=1   two browser contexts against the test relay (relay/.smoke-keys;
//                                                         one at a time: each person's key opens one socket)
import { expect, test, type Browser, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

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
  RELAY ? `?demo&awake&critter=none${who === 'B' ? '&as=B' : ''}&relay=${encodeURIComponent(RELAY)}&key=${keys()[`KEY_${who}`]}` : `?demo&date=2026-11-04T12:00&critter=none${who === 'B' ? '&as=B' : ''}`;

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
const arrived = (page: Page, key: string, needle: string, after: number) =>
  page.evaluate(async ([key, needle, after]) => {
    const w = (window as unknown as { __world: W & { canon(): string } }).__world, t0 = Date.now();
    while (Date.now() - t0 < 4000) {
      const h = w.heard()[key];
      const t = (h !== undefined && h >= after ? h : 0) || (w.canon().includes(needle) ? Date.now() : 0);
      if (t) return t;
      await new Promise((r) => setTimeout(r, 4));
    }
    return null;
  }, [key, needle, after] as const);

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

test.skip(!!RELAY && !existsSync(KEYS_FILE), 'RELAY_E2E needs relay/.smoke-keys');
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
  await a.waitForTimeout(800); // each one's villager as it is (villagerSync JOIN_SAY_MS)
  await expect.poll(async () => (await w<State>(a, 'state')).day === (await w<State>(b, 'state')).day, { timeout: 10_000 }).toBe(true).catch(async (e) => {
    console.log('at the start, A vs B:', diff(JSON.parse(await w<string>(a, 'canon')), JSON.parse(await w<string>(b, 'canon'))), JSON.stringify(await w(a, 'state')), JSON.stringify(await w(b, 'state')), JSON.stringify(await w(a, 'metrics')), JSON.stringify(await w(b, 'metrics')));
    throw e;
  });
  await a.waitForTimeout(2600); // the opening beats are over
  for (const p of [a, b]) await w(p, 'go', 300);
  await a.waitForTimeout(400);
  const lat: Record<string, number[]> = {};
  const note = (k: string, ms: number | null) => (ms === null ? null : (lat[k] ??= []).push(ms));

  // tap-walks, each way: the partner's villager sets off on the other phone (on the first spot of open ground that
  // takes the tap: the day's things, the river and the layout move)
  const SPOTS: [number, number][] = [[200, 420], [240, 500], [120, 400], [300, 440], [160, 300], [260, 330], [90, 300]];
  for (const [tapper, watcher] of [[a, b], [b, a], [a, b], [b, a]] as const) {
    for (const [x, z] of SPOTS) {
      const [cx, cy] = await w<[number, number]>(tapper, 'at', x, z);
      const before = await w<[number, number]>(tapper, 'mine');
      if (Math.hypot(before[0] - x, before[1] - z) < 30) continue;
      const off = setsOff(watcher);
      const t0 = Date.now();
      await tapper.mouse.click(cx, cy);
      if (!(await tapper.locator('[data-ring="mine"]').count())) await tapper.waitForTimeout(150);
      if (!(await tapper.locator('[data-ring="mine"]').count())) continue;
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
    const t0 = await from.evaluate((i) => ((window as unknown as { __world: W }).__world.share(i), Date.now()), i);
    const t1 = await arrived(to, key, key.includes(run) ? key.slice(key.indexOf(":") + 1) : key === "world:2026-11-05" ? "[\"2026-11-05\",1" : "\u0000", t0);
    note(`${(i as { kind: string }).kind} → there`, t1 && t1 - t0);
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
  await a.waitForTimeout(500); // (the demo's room is a log both tabs write: one race at a time)
  // both grab the same thing at once: one wins, both agree on who
  await Promise.all([a, b].map((p) => w(p, 'share', { kind: 'pick', id: `h${run}x`, what: 'weed' })));
  await a.waitForTimeout(2500); // the walks are over, everything has arrived
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
  await c.waitForTimeout(600);
  same(await w<State>(a, 'state'), await w<State>(c, 'state'));
  const m = await w<ReturnType<W['metrics']>>(a, 'metrics');
  const med = (xs: number[]) => [...xs].sort((x, y) => x - y)[Math.floor(xs.length / 2)];
  console.log(`[${RELAY ? 'relay' : 'demo'}] ` + Object.entries(lat).map(([k, v]) => `${k}: median ${med(v)} ms (max ${Math.max(...v)}, n=${v.length})`).join('; '));
  if (m) console.log(`[relay] A's socket: ${m.sent} sent (${m.sentBytes} B), ${m.recv} received (${m.recvBytes} B), ${m.resent} resent, acks median ${med(m.ackMs)} ms, ${m.pending} waiting`);
  await close();
});
