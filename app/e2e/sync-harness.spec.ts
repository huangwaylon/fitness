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
import { BUILDINGS, CAMS, HOMES, SEATS } from '../src/lib/components/island/world.ts';

/** The edit tray open, and the room re-centred above it (a tap's px only holds once the camera is at rest). */
async function openEdit(p: Page) {
  await p.locator('[data-tent-edit-open]').click();
  await settled(p);
}
/** The tent's camera at rest, framed for the bar as it is now (a pick or a place changes the bar and re-frames the
 *  room: a px is only where the finger lands once it's still). */
const settled = (p: Page) => p.waitForFunction(() => (window as unknown as { __tent: { still(): boolean } }).__tent.still(), null, { timeout: 10_000 });

/** Where a villager stands at the tent's door (nav.ts doorOf). */
const DOOR = ((b) => [b.x, b.z - 16] as const)(BUILDINGS.find((b) => b.id === 'campsite')!);
/** Where a villager stands just out of the tent (buildings.ts outOfTent): ±12 of the door, 30 in front. */
const OUT = (who: 'A' | 'B') => [DOOR[0] + (who === 'A' ? -12 : 12), DOOR[1] - 30] as const;

/** A tap on the tent (its upper part: a villager may stand in front of its door). */
async function tapTent(p: Page) {
  const door = p.locator('[data-building="campsite"] .door');
  const box = (await door.boundingBox())!;
  await door.click({ position: { x: box.width * 0.5, y: box.height * 0.25 } });
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
    // For the CI agent (2026-11-02): `shake:oak-m1` was null here once, in the CI retry of 74fa10c's run (shard 4),
    // and never in ~130 local runs (6 workers, repeat-each 16). The shake is the only change whose wait has no fallback
    // needle (`\u0000`): it must arrive through heardAt, which IslandScene sets only when world.svelte.ts #heard finds
    // it fresh. Ways it could not be: B already folded the same shake (tree, who and `at`) from A's island day row
    // (applyRow marks it `row`, and the relay's copy only clears the mark: still fresh), or the tab's BroadcastChannel
    // message came after the 4 s (a busy CI runner rendering two pages). If it comes back: log `w.canon()` shakes on B
    // and A's `metrics()` at the failure, and give the shake the row's needle too (`oak-m1` in canon) to tell the two
    // apart.
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
  // the fixed decor (docs/design.md "The fixed decor"): A's pump waters the flowers round it (the shared watered op:
  // on both), and A's villager sitting on the front bench is drawn seated on both phones (from where it stands)
  await w(a, 'go', CAMS.oku);
  await a.waitForTimeout(400);
  const pump = await a.locator('[data-fixture="pump"]').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height * 0.6];
  });
  await a.mouse.click(pump[0], pump[1]);
  await w(a, 'go', 300);
  await w(a, 'put', ...SEATS.seatMaeL);
  await expect(a.locator('[data-actor="mine"]')).toHaveAttribute('data-seat', 'seatMaeL');
  await expect(b.locator('[data-actor="partner"]')).toHaveAttribute('data-seat', 'seatMaeL', { timeout: 4000 });
  await a.waitForTimeout(300);
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

test('a phrase is presence: the partner sees it over my villager at once, a phone opening later never', async ({ browser }) => {
  test.setTimeout(60_000);
  const { open, ctxB, close } = await phones(browser);
  const a = await open('A'), b = await open('B');
  for (const p of [a, b]) await expect.poll(() => w<{ connected: boolean; peer: boolean } | null>(p, 'status').then((s) => !!s?.connected && s.peer), { timeout: 10_000 }).toBe(true);
  await a.waitForTimeout(2600); // the opening beats are over
  const said = b.locator('[data-say="partner"]');
  // a preset, each way
  for (const [from, to, name] of [[a, b, 'やっほー！'], [b, a, 'おつかれさま！']] as const) {
    await from.getByRole('button', { name: 'ひとこと いう' }).click();
    const t0 = Date.now();
    await from.getByRole('dialog', { name: 'なにを いう？' }).getByRole('button', { name }).click();
    await expect(to.locator('[data-say="partner"]')).toHaveText(new RegExp(name), { timeout: 2000 });
    console.log(`[${RELAY ? 'relay' : 'demo'}] say → there: ${Date.now() - t0} ms (the click included)`);
    await expect(from.locator('[data-say="mine"]')).toHaveText(new RegExp(name));
  }
  // my own words, cleaned on the way
  await a.waitForTimeout(1600); // (one per 1.5 s)
  await a.getByRole('button', { name: 'ひとこと いう' }).click();
  await a.getByRole('button', { name: 'じぶんで かく…' }).click();
  await a.locator('[data-say-field]').fill(' ジム\u202Eいこう ');
  await a.locator('[data-say-field]').press('Enter');
  await expect(said.locator('.text')).toHaveText('ジムいこう', { timeout: 2000 });
  await expect(said.locator('.who')).toHaveText('ウェイ');
  // gone after a few seconds, and never replayed to a phone opening later
  await expect(said).toHaveCount(0, { timeout: 5500 });
  const c = await open('B', RELAY ? await browser.newContext(CTX) : ctxB);
  await c.waitForTimeout(1500);
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

test('a high-five over the relay: the partner plays the same moment at once, its banner and hearts once; held while they are away', async ({ browser }) => {
  test.setTimeout(90_000);
  const { open, ctxB, close } = await phones(browser);
  const a = await open('A'), b = await open('B');
  for (const p of [a, b]) await expect.poll(() => w<{ connected: boolean; peer: boolean } | null>(p, 'status').then((s) => !!s?.connected && s.peer), { timeout: 10_000 }).toBe(true);
  await a.waitForTimeout(2600); // the opening beats are over
  // B watches for the moment: the sparkle flying from A's villager, hearts on B's own
  const plays = b.evaluate(async () => {
    const t0 = Date.now();
    while (Date.now() - t0 < 3000) {
      if (document.querySelector('[data-zap]')) return Date.now();
      await new Promise((r) => setTimeout(r, 4));
    }
    return null;
  });
  const t0 = await a.evaluate(() => Date.now());
  await a.locator('[data-actor="partner"] .vil').click();
  const t1 = await plays;
  expect(t1, 'B played the sparkle').not.toBeNull();
  console.log(`[${RELAY ? 'relay' : 'demo'}] high-five tap → played there: ${t1! - t0} ms`);
  expect(t1! - t0).toBeLessThan(RELAY ? 600 : 400);
  await expect(b.locator('[data-actor="mine"] .fx.hearts').first()).toBeAttached({ timeout: 2000 });
  for (const id of ['mine', 'partner']) await expect(b.locator(`[data-actor="${id}"] .fx.sparkles`).first()).toBeAttached({ timeout: 2000 });
  await expect(b.getByText('ウェイさんからハイタッチ！')).toBeVisible({ timeout: 3000 });
  await expect(a.getByText('うめさんに ハイタッチ！')).toBeVisible();
  // once: no second banner, no second hearts (nothing comes from the sheet any more)
  await b.waitForTimeout(4500);
  await expect(b.getByText('ウェイさんからハイタッチ！')).toHaveCount(0);
  await expect(b.locator('[data-actor="mine"] .fx.hearts')).toHaveCount(0);
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
// both; a phone that goes quiet inside has its villager home again after the timeout.
test('one place at a time: A in the tent is gone from B’s island, there with B inside, out at the door on both; quiet inside, home', async ({ browser }) => {
  test.setTimeout(90_000);
  const ctxA = await browser.newContext(CTX);
  const ctxB = RELAY ? await browser.newContext(CTX) : ctxA;
  const open = async (who: 'A' | 'B', ctx: typeof ctxA, extra = '') => {
    const p = await ctx.newPage();
    await p.goto(q(who) + extra);
    await p.waitForFunction(() => (window as unknown as { __world?: { state?: unknown } }).__world?.state);
    return p;
  };
  const a = await open('A', ctxA), b = await open('B', ctxB, '&homeafter=1500');
  for (const p of [a, b]) await expect.poll(() => w<{ connected: boolean; peer: boolean } | null>(p, 'status').then((s) => !!s?.connected && s.peer), { timeout: 10_000 }).toBe(true);
  const inside = (p: Page) => p.locator('[data-actor="partner"]').getAttribute('data-inside');
  const door = async (p: Page) => {
    await p.bringToFront();
    await w(p, 'go', 642);
    await p.waitForTimeout(300);
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
  await expect.poll(async () => {
    const at = await w<[number, number]>(a, 'mine');
    return Math.hypot(at[0] - OUT('A')[0], at[1] - OUT('A')[1]);
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
  // A goes in again (right at the door: straight in) and its phone goes quiet: home on B's island after the timeout
  await door(a);
  await expect.poll(() => inside(b), { timeout: 6000 }).toBe('true');
  await a.close({ runBeforeUnload: true }); // (its bye: else the demo's relay notices it 10 s on, the walk maybe over)
  await expect.poll(() => inside(b), { timeout: 15_000 }).toBeNull();
  // out of the door and home at a stroll (villagerSync's walk home), not put there: anywhere but home, it's walking
  await expect.poll(async () => {
    const v = (await w<State>(b, 'state')).villagers.A;
    return v.walking || Math.hypot(v.x - HOMES.A[0], v.z - HOMES.A[1]) <= 3;
  }, { timeout: 2000, message: 'on its way home' }).toBe(true);
  await expect.poll(async () => {
    const home = await w<[number, number]>(b, 'partner');
    return Math.hypot(home[0] - HOMES.A[0], home[1] - HOMES.A[1]);
  }, { timeout: 20_000 }).toBeLessThan(3);
  await ctxA.close();
  if (RELAY) await ctxB.close();
});

// A phone gone a while (docs/decisions.md "A villager whose phone is gone walks home"): after the timeout (shortened
// here) its villager walks home on the other phone, from where it was, at a stroll; its own phone back mid-walk takes
// it over from where the walk has it, with no jump on the other phone, and both end with it home.
test('a phone gone a while: its villager walks home on the other phone; back mid-walk, it takes over without a jump', async ({ browser }) => {
  test.setTimeout(90_000);
  const AFTER = 2500;
  const ctxA = await browser.newContext(CTX);
  const ctxB = RELAY ? await browser.newContext(CTX) : ctxA;
  const open = async (who: 'A' | 'B', ctx: typeof ctxA) => {
    const p = await ctx.newPage();
    await p.goto(q(who) + `&homeafter=${AFTER}`);
    await p.waitForFunction(() => (window as unknown as { __world?: { state?: unknown } }).__world?.state);
    return p;
  };
  const connected = (p: Page) => expect.poll(() => w<{ connected: boolean; peer: boolean } | null>(p, 'status').then((s) => !!s?.connected && s.peer), { timeout: 10_000 }).toBe(true);
  let a = await open('A', ctxA);
  const b = await open('B', ctxB);
  for (const p of [a, b]) await connected(p);
  await a.waitForTimeout(800); // each one's villager as it is (villagerSync JOIN_SAY_MS)
  // A walks far from home (the first spot of open ground that takes the tap), and stays there
  await a.bringToFront();
  await w(a, 'go', 400);
  await a.waitForTimeout(300);
  let at: [number, number] | null = null;
  for (const [x, z] of [[200, 640], [160, 600], [240, 620], [120, 560], [280, 580], [200, 520]] as [number, number][]) {
    const [cx, cy] = await w<[number, number]>(a, 'at', x, z);
    await a.mouse.click(cx, cy);
    await a.waitForTimeout(150);
    if (!(await a.locator('[data-ring="mine"]').count())) continue;
    await expect.poll(async () => (await w<State>(a, 'state')).villagers.A.walking, { timeout: 6000 }).toBe(false);
    at = await w<[number, number]>(a, 'mine');
    if (Math.hypot(at[0] - HOMES.A[0], at[1] - HOMES.A[1]) > 250) break;
  }
  expect(at, 'a spot far from home').not.toBeNull();
  const away = at!;
  await expect.poll(async () => {
    const p = await w<[number, number]>(b, 'partner');
    return Math.hypot(p[0] - away[0], p[1] - away[1]);
  }, { timeout: 6000 }).toBeLessThan(3);
  // A's phone goes (the app closed): on B, A's villager stays where it was for the timeout, then sets off home
  await a.close({ runBeforeUnload: true });
  await expect.poll(() => w<{ here: string[] } | null>(b, 'status').then((s) => s?.here.includes('A')), { timeout: 12_000 }).toBe(false);
  const still = await w<[number, number]>(b, 'partner');
  expect(Math.hypot(still[0] - away[0], still[1] - away[1]), 'there till the timeout').toBeLessThan(3);
  await expect.poll(async () => (await w<State>(b, 'state')).villagers.A.walking, { timeout: AFTER + 12_000 }).toBe(true);
  // B watches A's villager every frame from here on: the largest step between two frames (a jump would show)
  await b.evaluate(() => {
    const g = window as unknown as { __world: W; __steps?: { max: number; on: boolean } };
    const s = (g.__steps = { max: 0, on: true });
    let last = g.__world.partner();
    const f = () => {
      const p = g.__world.partner();
      s.max = Math.max(s.max, Math.hypot(p[0] - last[0], p[1] - last[1]));
      last = p;
      if (s.on) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  // A's phone back, mid-walk: its villager where the walk home has it (near B's), walking the rest home
  a = await open('A', ctxA);
  await connected(a);
  await a.waitForTimeout(800);
  const [mine, theirs] = [await w<[number, number]>(a, 'mine'), await w<[number, number]>(b, 'partner')];
  const mid = Math.hypot(mine[0] - HOMES.A[0], mine[1] - HOMES.A[1]);
  if (mid > 3) {
    // (still on the way when it came back: the two phones have it at about the same point)
    expect(Math.hypot(mine[0] - theirs[0], mine[1] - theirs[1]), 'A’s phone takes it from where it is').toBeLessThan(40);
  }
  for (const [p, fn] of [[a, 'mine'], [b, 'partner']] as const)
    await expect.poll(async () => {
      const h = await w<[number, number]>(p, fn);
      return Math.hypot(h[0] - HOMES.A[0], h[1] - HOMES.A[1]);
    }, { timeout: 15_000 }).toBeLessThan(3);
  const steps = await b.evaluate(() => {
    const s = (window as unknown as { __steps: { max: number; on: boolean } }).__steps;
    s.on = false;
    return s.max;
  });
  expect(steps, 'no jump on B').toBeLessThan(30);
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
