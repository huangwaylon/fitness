// Two-phone sync probe (on demand: docs/ops/testing.md "Run it locally"): two paired phones (the live app, each its own
// browser context) on one record and one live room (e2e/liveRoom.ts: the relay's real code in the test's process). Each
// page samples what it shows for every person every 50 ms (window.__probe: the island's actors or the room's walkers),
// and after each step the two phones' views are compared by time: what differs, how long until they agree.
// It records, never asserts a match: on demand only (SYNC_PROBE=1), ~15 min a browser.
//   SYNC_PROBE=1 E2E_PORT=4791 npx playwright test e2e/zz-sync-probe.spec.ts --project=webkit --workers=1 [-g " 4 "]
// Findings are printed as `[probe] {json}` lines and a `[probe-summary]` per test. Needs the hooks' `yaw`
// (__villagers3.yaw, __tent.v3(w).yaw).
import { expect, test, type Browser, type Page } from './fixtures.ts';
import { castIn, geo, islandUp, lawnTap, quiet, reelOnBite, tapOn } from './island.ts';
import { roomUp, tentStill } from './rooms.ts';
import { sayOwn } from './say.ts';
import { newIsland, setVisible } from './liveRoom.ts';

type Island = ReturnType<typeof newIsland>;
type Who = 'A' | 'B';

/** One person as a phone shows them at one moment. */
type Seen = { x: number; z: number; walking: boolean; state: string | null; yaw: number | null; seat: string | null; gym: string | null; act: string | null; fx: string[]; tool: string | null; inside?: boolean; head?: number[] | null; hidden?: boolean };
/** A phone's view at one moment: where it is (island or a room), each person it shows, and a room's pieces' state. */
type View = { t: number; where: string; vis?: string; people: Record<string, Seen | null>; room?: { size: number; pieces: string; toggles: string; lights: string; mySeat: string | null; partnerSeat: string | null } };

/** The in-page sampler: every 50 ms, what this phone shows (island: __world / __world3d / __villagers3; a room: __tent). */
function sampler() {
  const W = window as unknown as Record<string, any>;
  const out: View[] = (W.__probe = []);
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const take = (): View | null => {
    const t = Math.round(performance.timeOrigin + performance.now()); // (the real time: a skewed Date.now() would pair the wrong moments)
    const tent = W.__tent, world = W.__world, w3 = W.__world3d, v3 = W.__villagers3;
    if (location.pathname.includes('/tent') && tent?.stats?.()) {
      const people: Record<string, Seen | null> = {};
      for (const who of ['A', 'B', 'G']) {
        const at = tent.who(who), v = tent.v3(who);
        people[who] = at ? { x: r1(at.at[0]), z: r1(at.at[1]), walking: !!at.walking, state: v?.state ?? null, yaw: v ? r1(v.yaw) : null, seat: null, gym: null, act: null, fx: [], tool: null, head: v?.head?.map(r1) ?? null, hidden: tent.hidden(who) } : null;
      }
      const home = document.querySelector('[data-room-home]')?.getAttribute('data-room-home') ?? '?';
      const toggles = JSON.stringify(tent.toggles?.() ?? []);
      return {
        t, where: `room:${home}`, people, vis: document.visibilityState,
        room: { size: tent.size(), pieces: JSON.stringify(tent.pieces().map((p: any) => [p.id, p.item, p.x, p.z, p.f, p.on ?? null]).sort()), toggles, lights: JSON.stringify(tent.lights()), mySeat: tent.seat()?.id ?? null, partnerSeat: tent.partnerSeat()?.id ?? null }
      };
    }
    if (world?.state && w3?.actor) {
      const people: Record<string, Seen | null> = {};
      for (const slot of ['mine', 'partner', 'third']) {
        const a = w3.actor(slot);
        if (!a?.who) continue;
        const [x, z] = world.feet(slot);
        people[a.who] = { x: r1(x), z: r1(z), walking: !!a.walking, state: v3?.state(slot) ?? null, yaw: v3?.yaw ? (((y) => (y === null ? null : r1(y)))(v3.yaw(slot))) : null, seat: a.seat, gym: a.gym, act: a.act, fx: a.fx, tool: v3?.tool(slot) ?? null, inside: a.inside };
      }
      return { t, where: 'island', people, vis: document.visibilityState };
    }
    return null;
  };
  setInterval(() => {
    try {
      const v = take();
      if (v) out.push(v);
      if (out.length > 10_000) out.splice(0, 2000);
    } catch { /* a page between scenes */ }
  }, 50);
}

/** A paired phone (the live app) on `island`, sampling. */
async function phone(browser: Browser, island: Island, who: Who, o: { skewMs?: number; open?: boolean } = {}) {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  await context.addInitScript(() => (localStorage.setItem('e2e.render', 'none'), localStorage.setItem('e2e', '1')));
  await island.pair(context, who);
  if (o.skewMs) await context.addInitScript((skew) => {
    // this phone's device clock off by `skew` ms (after the pinned clock's own shift): Date.now() and new Date() both
    const Prev = Date, now = () => Prev.now() + skew;
    const Skewed = function (this: unknown, ...a: unknown[]) {
      if (!new.target) return new Prev(now()).toString();
      return a.length ? new (Prev as unknown as new (...b: unknown[]) => Date)(...a) : new Prev(now());
    } as unknown as DateConstructor;
    Object.setPrototypeOf(Skewed, Prev);
    Object.defineProperty(Skewed, 'prototype', { value: Prev.prototype });
    Skewed.now = now;
    globalThis.Date = Skewed;
  }, o.skewMs);
  await context.addInitScript(sampler);
  const page = await context.newPage();
  if (o.open !== false) await openIsland(page, island, who);
  return { context, page };
}
async function openIsland(page: Page, island: Island, who: Who) {
  await page.goto('');
  await islandUp(page, { timeout: 30_000 });
  await expect.poll(() => island.sockets(who), { timeout: 15_000 }).toBe(1);
}

const views = (p: Page, since = 0) => p.evaluate((since) => ((window as unknown as { __probe: View[] }).__probe ?? []).filter((v) => v.t >= since), since);
const pnow = (p: Page) => p.evaluate(() => Math.round(performance.timeOrigin + performance.now()));

/** What differs between two views of the same moment (people by person; positions within `tol` u, more while walking). */
function differ(a: View, b: View, tol: number): string[] {
  const d: string[] = [];
  if (a.room && b.room && a.where === b.where) {
    for (const k of ['size', 'pieces', 'toggles', 'lights'] as const) if (a.room[k] !== b.room[k]) d.push(`room.${k}`);
  }
  for (const who of ['A', 'B', 'G']) {
    const x = a.people[who] ?? null, y = b.people[who] ?? null;
    if (a.where !== b.where) {
      // each phone in its own place: someone in a room on one phone is inside (or not shown) on the other's island
      const [rv, iv] = a.where === 'island' ? [b, a] : b.where === 'island' ? [a, b] : [null, null];
      const inRoom = rv?.people[who], onIsland = iv?.people[who];
      if (rv && inRoom && onIsland && !onIsland.inside && (who === 'A' || who === 'B')) d.push(`${who}:outOnIsland`);
      continue;
    }
    if (!x !== !y) { d.push(`${who}:${x ? 'onlyA' : 'onlyB'}`); continue; }
    if (!x || !y) continue;
    const walking = x.walking || y.walking;
    if (Math.hypot(x.x - y.x, x.z - y.z) > tol * (walking ? 6 : 1)) d.push(`${who}.pos`);
    if (!walking) {
      if (x.state !== y.state) d.push(`${who}.state`);
      if (x.yaw !== null && y.yaw !== null && Math.abs(Math.atan2(Math.sin(x.yaw - y.yaw), Math.cos(x.yaw - y.yaw))) > 0.35) d.push(`${who}.yaw`);
    }
    if (x.walking !== y.walking) d.push(`${who}.walking`);
    for (const k of ['seat', 'gym', 'tool', 'inside', 'hidden'] as const) if ((x[k] ?? null) !== (y[k] ?? null)) d.push(`${who}.${k}`);
  }
  return d;
}

/** The two phones' samples since `since` paired by time (≤ 40 ms apart): each pair's differences. */
async function compare(a: Page, b: Page, since: number, tol = 3) {
  const [va, vb] = await Promise.all([views(a, since), views(b, since)]);
  const rows: { t: number; d: string[]; a: View; b: View }[] = [];
  let j = 0;
  for (const x of va) {
    while (j + 1 < vb.length && Math.abs(vb[j + 1].t - x.t) <= Math.abs(vb[j].t - x.t)) j++;
    const y = vb[j];
    if (!y || Math.abs(y.t - x.t) > 40) continue;
    rows.push({ t: x.t, d: differ(x, y, tol), a: x, b: y });
  }
  return rows;
}


/** A person as one line: where, state, seat/gym/tool, facing. */
const brief = (s: Seen | null | undefined) => (s ? `${s.x},${s.z}${s.walking ? ' walking' : ''} ${s.state ?? '-'}${s.seat ? ` seat=${s.seat}` : ''}${s.gym ? ` gym=${s.gym}` : ''}${s.tool ? ` tool=${s.tool}` : ''}${s.inside ? ' inside' : ''}${s.hidden ? ' hidden' : ''} yaw=${s.yaw}` : 'absent');
const briefView = (v: View) => `${v.where}${v.vis && v.vis !== "visible" ? `(${v.vis})` : ""} ` + ['A', 'B', 'G'].map((w) => `${w}[${brief(v.people[w])}]`).join(' ') + (v.room ? ` mySeat=${v.room.mySeat} partnerSeat=${v.room.partnerSeat}` : '');

const found: Record<string, unknown>[] = [];
/** Watch both phones for `ms` after `since`: whether they agree at the end, when they last disagreed, and what; for
 *  `who`, what each phone showed of them over the window (states, seats, uses, tools, effects), and for a looped use the
 *  head's place apart at the same moment (the loop's phase). */
async function judge(name: string, a: Page, b: Page, since: number, ms: number, o: { tol?: number; who?: string } = {}) {
  const end = since + ms;
  while ((await pnow(a)) < end) await a.waitForTimeout(200);
  const rows = await compare(a, b, since, o.tol ?? 3);
  const bad = rows.filter((r) => r.d.length);
  const last = rows.at(-1);
  // each kind of difference: its samples, and when it was last seen (ms after `since`)
  const kinds: Record<string, string> = {};
  for (const k of new Set(bad.flatMap((r) => r.d))) {
    const rs = bad.filter((r) => r.d.includes(k));
    kinds[k] = `${rs.length}×, ${rs[0].t - since}…${rs.at(-1)!.t - since} ms`;
  }
  const lastBad = bad.at(-1);
  const res: Record<string, unknown> = {
    name, samples: rows.length, mismatched: bad.length, kinds,
    agreeAtEnd: !!last && last.d.length === 0,
    lastMismatchAtMs: lastBad ? lastBad.t - since : null
  };
  if (last && last.d.length) (res.endA = briefView(last.a)), (res.endB = briefView(last.b)), (res.endDiff = last.d);
  if (last?.d.some((k) => k.startsWith('room.'))) res.rooms = [last.a.room, last.b.room];
  if (bad[0]) res.first = { at: bad[0].t - since, d: bad[0].d, a: briefView(bad[0].a), b: briefView(bad[0].b) };
  if (o.who) {
    const seen = (rs: View[]) => {
      const set = new Set<string>();
      for (const v of rs) {
        const s = v.people[o.who!];
        if (!s) {
          set.add(`absent@${v.where}`);
          continue;
        }
        if (s.state) set.add(`state:${s.state}`);
        if (s.seat) set.add(`seat:${s.seat}`);
        if (s.gym) set.add(`gym:${s.gym}`);
        if (s.tool) set.add(`tool:${s.tool}`);
        if (s.act) set.add(`act:${s.act}`);
        if (s.hidden) set.add('hidden');
        for (const f of s.fx) set.add(`fx:${f}`);
      }
      return [...set].sort();
    };
    const sa = seen(rows.map((r) => r.a)), sb = seen(rows.map((r) => r.b));
    res.seen = { onlyA: sa.filter((x) => !sb.includes(x)), onlyB: sb.filter((x) => !sa.includes(x)), both: sa.filter((x) => sb.includes(x)) };
    const dh = rows.flatMap((r) => {
      const x = r.a.people[o.who!], y = r.b.people[o.who!];
      return x?.head && y?.head && x.state === y.state && !x.walking && !y.walking ? [Math.round(Math.hypot(x.head[0] - y.head[0], x.head[1] - y.head[1], x.head[2] - y.head[2]) * 10) / 10] : [];
    }).sort((p, q) => p - q);
    if (dh.length) res.headApart = { n: dh.length, median: dh[Math.floor(dh.length / 2)], p90: dh[Math.floor(dh.length * 0.9)], max: dh.at(-1) };
  }
  found.push(res);
  console.log('[probe] ' + JSON.stringify(res));
  return res;
}
const summary = () => console.log('[probe-summary]\n' + found.map((f) => `  ${f.agreeAtEnd ? 'OK  ' : 'DIFF'} ${f.name}: last mismatch ${f.lastMismatchAtMs ?? '-'} ms, ${f.mismatched}/${f.samples} ${JSON.stringify(f.kinds)}${f.seen ? ' seen ' + JSON.stringify(f.seen) : ''}${f.headApart ? ' head ' + JSON.stringify(f.headApart) : ''}`).join('\n'));

type T = Record<string, (...a: any[]) => any>;
const tt = <R,>(p: Page, fn: (t: T, a: any) => R, a?: unknown) => p.evaluate(`(${fn.toString()})(window.__tent, ${JSON.stringify(a ?? null)})`) as Promise<R>;
const world = <R,>(p: Page, fn: (w: T, a: any) => R, a?: unknown) => p.evaluate(`(${fn.toString()})(window.__world, ${JSON.stringify(a ?? null)})`) as Promise<R>;

/** A tap-walk on the island to open lawn near (x, z) (the camera brought there first): where it goes. */
async function tapLawn(p: Page, x: number, z: number) {
  await world(p, (w, z) => w.go(z - 150), z);
  await p.waitForTimeout(400);
  const t = await lawnTap(p, x, z);
  await p.mouse.click(t.x, t.y);
  return t.at;
}
/** Into a building from the island (its door tapped; the camera there first). */
async function goIn(p: Page, building: string) {
  await p.bringToFront();
  const g = await geo(p);
  const bd = g.BUILDINGS.find((x) => x.id === building)!;
  await world(p, (w, z) => w.go(z), bd.z - 150);
  await p.waitForTimeout(500);
  await tapOn(p, 'building', building);
  await expect(p).toHaveURL(/\/tent/, { timeout: 15_000 });
  await roomUp(p, 'tent', { timeout: 20_000 });
}
async function goOut(p: Page) {
  await p.getByRole('button', { name: 'しまへ' }).click();
  await islandUp(p, { timeout: 20_000 });
}
/** The pieces' footprints (tiles, unturned). */
const SIZE: Record<string, [number, number]> = { f290: [2, 1], f13683: [2, 1], f1757: [2, 1], f4039: [1, 1], f1108: [1, 1], f2736: [1, 1], f1081: [2, 1], f90002: [3, 1], f1432: [1, 1] };
/** A tap (a click) on a piece: the first point over its footprint (from `y` up, then lower and higher) where the room's
 *  canvas is on top (no DOM over it) and the room's hit is that piece. */
async function tapPiece(p: Page, piece: { id?: string; x: number; z: number; item: string }, y: number) {
  const [w, d] = SIZE[piece.item] ?? [1, 1];
  // (ハニワくん's letter comes up on its own once the room's furnished: it covers the room)
  const letter = p.locator('.letter[role="dialog"]');
  if (await letter.count()) {
    await p.keyboard.press('Escape');
    await letter.waitFor({ state: 'detached', timeout: 3000 }).catch(async () => {
      await letter.locator('button').last().click().catch(() => {});
      await letter.waitFor({ state: 'detached', timeout: 3000 }).catch(() => console.log('[probe] the letter stays'));
    });
  }
  const pt = await p.evaluate(([x0, z0, w, d, y, id]) => {
    const t = (window as unknown as { __tent: T }).__tent;
    for (const yy of [y, y / 2, y * 1.5, 0.2])
      for (const fz of [0.5, 0.3, 0.7, 0.15, 0.85])
        for (const fx of [0.5, 0.3, 0.7, 0.15, 0.85]) {
          const [cx, cy] = t.px(x0 + w * 10 * fx, z0 + d * 10 * fz, yy);
          const el = document.elementFromPoint(cx, cy);
          const h = t.hit(cx, cy) as { kind: string; id: string } | null;
          if (el?.tagName === 'CANVAS' && h?.kind === 'piece' && (!id || h.id === id)) return [cx, cy];
        }
    return null;
  }, [-40 + piece.x * 10, -40 + piece.z * 10, w, d, y, piece.id ?? null] as const);
  if (!pt) console.log('[probe] no clear point on ' + piece.item + ' ' + JSON.stringify(await p.evaluate(([x, z]) => {
    const t = (window as unknown as { __tent: T }).__tent, [cx, cy] = t.px(x, z, 1);
    return [cx, cy, document.elementFromPoint(cx, cy)?.outerHTML.slice(0, 120), t.hit(cx, cy), document.querySelector('dialog[open], [role=dialog]')?.outerHTML.slice(0, 160)];
  }, [-35 + piece.x * 10, -35 + piece.z * 10])));
  else await p.mouse.click(pt[0], pt[1]);
}
const pieces = (p: Page) => tt<{ id: string; item: string; x: number; z: number; f: number }[]>(p, (t) => t.pieces());
const loaded = (p: Page) => p.waitForFunction(() => (window as unknown as { __tent: T }).__tent.loading() === 0, null, { timeout: 20_000 });

test.skip(!process.env.SYNC_PROBE, 'the sync probe runs on demand (SYNC_PROBE=1)');
test.afterEach(async ({ browser }) => {
  summary();
  found.length = 0;
  for (const c of browser.contexts()) await c.close();
});

test('1 island walks: far taps, a tap during a walk, both walking', async ({ browser }) => {
  test.setTimeout(180_000);
  const island = newIsland();
  const { page: a } = await phone(browser, island, 'A');
  const { page: b } = await phone(browser, island, 'B');
  await quiet(a);
  await a.waitForTimeout(1500);
  let t0 = await pnow(a);
  await judge('1.0 opening', a, b, t0 - 1000, 1500);
  for (const [x, z] of [[200, 420], [120, 300], [300, 500], [140, 620]] as const) {
    t0 = await pnow(a);
    const at = await tapLawn(a, x, z);
    await judge(`1.1 A walks to ${at} (+5 s at rest)`, a, b, t0, 12_000, { who: 'A' });
  }
  t0 = await pnow(a);
  await tapLawn(a, 120, 400);
  await a.waitForTimeout(700);
  await tapLawn(a, 260, 330);
  await judge('1.2 A re-taps mid-walk', a, b, t0, 10_000, { who: 'A' });
  t0 = await pnow(b);
  await tapLawn(b, 160, 300);
  await judge('1.3 B walks (+5 s at rest)', a, b, t0, 12_000, { who: 'B' });
  t0 = await pnow(a);
  await Promise.all([tapLawn(a, 300, 420), tapLawn(b, 120, 500)]);
  await judge('1.4 both walk at once', a, b, t0, 10_000);
});

test('2 island actions: a phrase, a high-five, a bench, the pull-up bar, fishing', async ({ browser }) => {
  test.setTimeout(240_000);
  const island = newIsland();
  const { page: a } = await phone(browser, island, 'A');
  const { page: b } = await phone(browser, island, 'B');
  await quiet(a);
  await a.waitForTimeout(1000);
  let t0 = await pnow(a);
  await sayOwn(a, 'やあ');
  await judge('2.1 A says a phrase', a, b, t0, 4000, { who: 'A' });
  t0 = await pnow(a);
  await tapOn(a, 'villager', 'partner');
  await judge('2.2 A high-fives B', a, b, t0, 5000, { who: 'A' });
  const g = await geo(a);
  const slot = (id: string) => g.DECOR_SLOTS.find((s) => s.id === id)!;
  for (const [p, id, who] of [[a, 'bench-mae', 'A'], [b, 'pullup', 'B']] as const) {
    await world(p, (w, z) => w.go(z), slot(id).z - 110);
    await p.waitForTimeout(600);
    t0 = await pnow(a);
    await tapOn(p, 'sit', id);
    await judge(`2.3 ${who} onto ${id}`, a, b, t0, 12_000, { who });
  }
  t0 = await pnow(a);
  await tapLawn(b, 200, slot('pullup').z + 80);
  await tapLawn(a, 150, slot('bench-mae').z + 90);
  await judge('2.4 both get up and walk off', a, b, t0, 10_000);
  t0 = await pnow(a);
  try {
    await castIn(a, 'sea');
    await judge('2.5 A casts', a, b, t0, 8000, { who: 'A' });
    const lines = await Promise.all([a, b].map((p) => p.evaluate(() => (window as unknown as { __fish?: { lines(): unknown[] } }).__fish?.lines() ?? null)));
    console.log('[probe] 2.5 lines A/B ' + JSON.stringify(lines));
    t0 = await pnow(a);
    await reelOnBite(a, 200, 400, 25_000).catch((e) => console.log('[probe] 2.6 no bite: ' + String(e).slice(0, 120)));
    await judge('2.6 A reels (catch or not)', a, b, t0, 6000, { who: 'A' });
  } catch (e) {
    console.log('[probe] 2.5 cast failed: ' + String(e).slice(0, 200));
  }
});

test('3 rooms: in and out, together and apart, the house, pieces placed and moved, the size', async ({ browser }) => {
  test.setTimeout(240_000);
  const island = newIsland();
  const { page: a } = await phone(browser, island, 'A');
  const { page: b } = await phone(browser, island, 'B');
  await quiet(a);
  let t0 = await pnow(a);
  await goIn(a, 'campsite');
  await judge('3.1 A into the tent, B on the island', a, b, t0, 4000, { who: 'A' });
  console.log('[probe] 3.1 B shows A: ' + JSON.stringify((await views(b, t0)).at(-1)?.people.A));
  t0 = await pnow(a);
  await goIn(b, 'campsite');
  await judge('3.2 B into the tent too', a, b, t0, 5000);
  t0 = await pnow(a);
  await tt(a, (t) => t.walkTo(10, -10));
  await judge('3.3 A walks in the tent', a, b, t0, 5000, { who: 'A' });
  t0 = await pnow(a);
  await tt(b, (t) => t.walkTo(-20, 10));
  await judge('3.4 B walks in the tent', a, b, t0, 5000, { who: 'B' });
  t0 = await pnow(a);
  expect(await tt(a, (t) => t.fill(['f4039', 'f1432', 'f1108']))).toBeGreaterThan(0);
  await loaded(a);
  await judge('3.5 A places three pieces', a, b, t0, 4000);
  t0 = await pnow(a);
  await tt(b, (t) => t.resize(10));
  await judge('3.6 B switches the room to 10 × 10', a, b, t0, 4000);
  t0 = await pnow(a);
  const before = (await pieces(a))[0];
  await a.locator('[data-tent-edit-open]').click();
  await tentStill(a, 10_000);
  const [x, y] = await tt<[number, number]>(a, (t, p) => t.tile(p.x, p.z), before);
  const [x2, y2] = await tt<[number, number]>(a, (t, p) => t.tile(p.x + 3, p.z + 2), before);
  await a.mouse.move(x, y);
  await a.mouse.down();
  for (let k = 1; k <= 8; k++) await a.mouse.move(x + ((x2 - x) * k) / 8, y + ((y2 - y) * k) / 8);
  await a.mouse.up();
  await a.locator('[data-act="place"]').click({ timeout: 3000 }).catch(() => {});
  await a.locator('[data-tent-done]').click({ timeout: 3000 }).catch(() => {});
  await judge('3.7 A drags a piece across', a, b, t0, 5000);
  console.log('[probe] 3.7 moved ' + JSON.stringify(before) + ' -> ' + JSON.stringify((await pieces(a)).find((q) => q.id === before.id)));
  t0 = await pnow(a);
  await goOut(a);
  await judge('3.8 A out, B in the tent', a, b, t0, 5000, { who: 'A' });
  t0 = await pnow(a);
  await goOut(b);
  await judge('3.9 B out too', a, b, t0, 5000);
  const ids = (await geo(a)).BUILDINGS.map((x) => x.id);
  console.log('[probe] buildings ' + JSON.stringify(ids));
  const homeB = ids.find((id) => /B$/.test(id));
  if (homeB) {
    t0 = await pnow(a);
    await goIn(a, homeB);
    await goIn(b, homeB);
    await judge(`3.10 both into ${homeB}`, a, b, t0, 6000);
    t0 = await pnow(a);
    await tt(a, (t) => t.walkTo(0, 0));
    await tt(b, (t) => t.fill(['f4039']));
    await judge('3.11 A walks, B places in the house', a, b, t0, 5000);
    t0 = await pnow(a);
    await goOut(a);
    await goIn(a, 'campsite');
    await judge('3.12 A from the house to the tent, B in the house', a, b, t0, 5000);
  }
});

test('4 room uses: chair, tub, treadmill, yoga, TV, fan, piano; both on one toggle', async ({ browser }) => {
  test.setTimeout(300_000);
  const island = newIsland();
  const { page: a } = await phone(browser, island, 'A');
  const { page: b } = await phone(browser, island, 'B');
  await goIn(a, 'campsite');
  expect(await tt(a, (t) => t.fill(['f4039', 'f1757', 'f290', 'f13683', 'f1108', 'f2736', 'f1081']))).toBe(7);
  await loaded(a);
  await goIn(b, 'campsite');
  await loaded(b);
  await expect.poll(() => tt(b, (t) => t.peer()), { timeout: 8000 }).toBe(true);
  const ps = await pieces(a);
  const of = (item: string) => ps.find((p) => p.item === item)!;
  for (const [item, y, label, who, p] of [['f4039', 3, 'chair', 'A', a], ['f1757', 5, 'tub soak', 'B', b], ['f290', 1.5, 'treadmill', 'A', a], ['f13683', 0.3, 'yoga', 'B', b]] as const) {
    await tentStill(p, 10_000);
    const t0 = await pnow(a);
    await tapPiece(p, of(item), y);
    await judge(`4.${label} (${who})`, a, b, t0, 12_000, { who });
  }
  for (const [item, who, p] of [['f1108', 'A', a], ['f2736', 'B', b]] as const) {
    const t0 = await pnow(a);
    await tapPiece(p, of(item), 3);
    await judge(`4.${who} taps the ${item === 'f1108' ? 'TV' : 'fan'}`, a, b, t0, 4000);
  }
  let t0 = await pnow(a);
  const tv = of('f1108');
  await Promise.all([tt(a, (t, id) => t.switchTo(id, 1, 2), tv.id), tt(b, (t, id) => t.switchTo(id, 0), tv.id)]);
  await judge('6.2 both switch the TV at once (A ch 2, B off)', a, b, t0, 5000);
  t0 = await pnow(a);
  await tapPiece(a, of('f1081'), 4);
  await judge('4.piano (A, local by design)', a, b, t0, 6000, { who: 'A' });
  console.log('[probe] 4.piano playing A/B ' + JSON.stringify(await Promise.all([a, b].map((p) => tt(p, (t) => t.playing())))));
});

test('5 robustness: backgrounded, offline, reloaded mid-walk, a late joiner, a slow network', async ({ browser }) => {
  test.setTimeout(420_000);
  const island = newIsland();
  const A = await phone(browser, island, 'A');
  const B = await phone(browser, island, 'B');
  let a = A.page, b = B.page;
  await quiet(a);
  // B in the background while A walks (an app switch, 5 s)
  let t0 = await pnow(a);
  await tapLawn(a, 300, 500);
  await a.waitForTimeout(500);
  await setVisible(b, false);
  await a.waitForTimeout(5000);
  await setVisible(b, true);
  await judge('5.1 B backgrounded 5 s while A walks', a, b, t0, 14_000, { who: 'A' });
  // A in the background 40 s (past the relay's silence), B walks meanwhile
  t0 = await pnow(a);
  await setVisible(a, false);
  await tapLawn(b, 200, 420);
  await b.waitForTimeout(40_000);
  await setVisible(a, true);
  const back = await pnow(a);
  await judge('5.2 A backgrounded 40 s, B walked meanwhile', a, b, back, 10_000, { who: 'B' });
  // B offline 25 s (no socket, no /api, the browser offline too): A walks twice, B walks too
  t0 = await pnow(a);
  island.offline('B', true);
  await B.context.setOffline(true);
  await tapLawn(a, 140, 600);
  await a.waitForTimeout(6000);
  await tapLawn(b, 260, 330);
  await a.waitForTimeout(6000);
  await tapLawn(a, 300, 420);
  await a.waitForTimeout(13_000);
  island.offline('B', false);
  await B.context.setOffline(false);
  const on = await pnow(a);
  await judge('5.3 B offline 25 s (A walked twice, B once), then online', a, b, on, 15_000);
  // A reloads mid-walk
  t0 = await pnow(b);
  await tapLawn(a, 140, 300);
  await a.waitForTimeout(900);
  await a.reload();
  await islandUp(a, { timeout: 30_000 });
  await judge('5.4 A reloads mid-walk', a, b, t0, 15_000, { who: 'A' });
  // B reloads while A walks
  t0 = await pnow(a);
  await tapLawn(a, 300, 560);
  await b.waitForTimeout(600);
  await b.reload();
  await islandUp(b, { timeout: 30_000 });
  await judge('5.5 B reloads while A walks', a, b, t0, 12_000, { who: 'A' });
  // a late joiner: B closes; A walks and sits on the bench; B opens again
  await B.context.close();
  const g = await geo(a);
  const bench = g.DECOR_SLOTS.find((s) => s.id === 'bench-mae')!;
  await tapLawn(a, 200, 420);
  await a.waitForTimeout(6000);
  await world(a, (w, z) => w.go(z), bench.z - 110);
  await a.waitForTimeout(600);
  await tapOn(a, 'sit', 'bench-mae');
  await a.waitForTimeout(8000);
  const B2 = await phone(browser, island, 'B');
  b = B2.page;
  t0 = await pnow(a);
  await judge('5.6 B opens later: A walked and sat on the bench', a, b, t0 - 500, 8000, { who: 'A' });
  // a slow network: 400 ms each way
  island.ctl.lag = 400;
  t0 = await pnow(a);
  await tapLawn(a, 300, 500);
  await judge('5.7 slow network (400 ms each way): A walks off the bench', a, b, t0, 12_000, { who: 'A' });
  t0 = await pnow(a);
  await tapLawn(b, 150, 420);
  await judge('5.8 slow network: B walks', a, b, t0, 12_000, { who: 'B' });
  island.ctl.lag = 0;
});

for (const skew of [0, 4000]) test(`5b late joiner in a room${skew ? `, its clock +${skew / 1000} s` : ''}`, async ({ browser }) => {
  test.setTimeout(300_000);
  const island = newIsland();
  const { page: a } = await phone(browser, island, 'A');
  await goIn(a, 'campsite');
  expect(await tt(a, (t) => t.fill(['f4039', 'f1108', 'f290']))).toBe(3);
  await loaded(a);
  await tentStill(a, 10_000);
  const ps = await pieces(a);
  const of = (item: string) => ps.find((p) => p.item === item)!;
  await tapPiece(a, of('f1108'), 3);
  await a.waitForTimeout(1500);
  await tapPiece(a, of('f290'), 1.5);
  await a.waitForTimeout(6000);
  // B opens later, its device clock 4 s fast (a phone's clock off: the relay's offset should cover it)
  const { page: b } = await phone(browser, island, 'B', { skewMs: skew });
  const c = skew ? ` (clock +${skew / 1000} s)` : '';
  let t0 = await pnow(a);
  await judge(`5.9 B${c} opens later on the island: A in the tent`, a, b, t0 - 500, 4000, { who: 'A' });
  t0 = await pnow(a);
  await goIn(b, 'campsite');
  await judge(`5.10 B${c} comes into the tent: A on the treadmill, the TV switched`, a, b, t0, 12_000, { who: 'A' });
  t0 = await pnow(a);
  await tt(b, (t) => t.walkTo(-20, 10));
  await judge(`5.11 B${c} walks in the tent`, a, b, t0, 6000, { who: 'B' });
  t0 = await pnow(a);
  await tentStill(b, 10_000);
  await tapPiece(b, of('f4039'), 3);
  await judge(`5.12 B${c} sits on the chair`, a, b, t0, 8000, { who: 'B' });
});

test('5c a phone whose clock is 90 s off, on the island', async ({ browser }) => {
  test.setTimeout(180_000);
  const island = newIsland();
  const { page: a } = await phone(browser, island, 'A');
  const { page: b } = await phone(browser, island, 'B', { skewMs: -90_000 });
  await quiet(a);
  let t0 = await pnow(a);
  await tapLawn(a, 300, 500);
  await judge('5.13 B (clock −90 s): A walks', a, b, t0, 12_000, { who: 'A' });
  t0 = await pnow(a);
  await tapLawn(b, 140, 420);
  await judge('5.14 B (clock −90 s) walks', a, b, t0, 12_000, { who: 'B' });
});

test('6 both on one thing: the hammock at once, the tent chair at once', async ({ browser }) => {
  test.setTimeout(240_000);
  const island = newIsland();
  const { page: a } = await phone(browser, island, 'A');
  const { page: b } = await phone(browser, island, 'B');
  await quiet(a);
  const g = await geo(a);
  const ham = g.DECOR_SLOTS.find((s) => s.id === 'hammock');
  if (ham) {
    for (const p of [a, b]) await world(p, (w, z) => w.go(z), ham.z - 110);
    await a.waitForTimeout(800);
    const t0 = await pnow(a);
    await Promise.all([tapOn(a, 'sit', 'hammock'), tapOn(b, 'sit', 'hammock')]);
    await judge('6.1 both tap the hammock at once', a, b, t0, 14_000);
  } else console.log('[probe] no hammock');
  await goIn(a, 'campsite');
  expect(await tt(a, (t) => t.fill(['f4039']))).toBe(1);
  await loaded(a);
  await goIn(b, 'campsite');
  await loaded(b);
  await Promise.all([tentStill(a, 10_000), tentStill(b, 10_000)]);
  const chair = (await pieces(a))[0];
  const t0 = await pnow(a);
  await Promise.all([tapPiece(a, chair, 3), tapPiece(b, chair, 3)]);
  await judge('6.3 both tap the tent chair at once', a, b, t0, 10_000);
});

/** A demo phone (its hooks on: __fish) on `island`'s room, sampling; `extra`: more of its URL. */
async function demo(browser: Browser, island: Island, who: Who, extra = '') {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', bypassCSP: true });
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await island.demo(context, who);
  await context.addInitScript(sampler);
  const page = await context.newPage();
  await page.goto(island.demoUrl(who, extra));
  await islandUp(page, { timeout: 30_000 });
  return page;
}

test('2b fishing (demo phones on the live room: the fishing hooks)', async ({ browser }) => {
  test.setTimeout(180_000);
  const island = newIsland();
  const a = await demo(browser, island, 'A', '&critter=fish&date=2026-11-04T12:00');
  const b = await demo(browser, island, 'B', '&critter=fish&date=2026-11-04T12:00');
  await quiet(a);
  await expect.poll(() => a.evaluate(() => (window as unknown as { __fish?: { fish(): { water: string }[] } }).__fish?.fish().some((f) => f.water === 'sea') ?? false), { timeout: 15_000 }).toBe(true);
  let t0 = await pnow(a);
  await castIn(a, 'sea');
  await judge('2.5 A casts (demo phones)', a, b, t0, 6000, { who: 'A' });
  const lines = await Promise.all([a, b].map((p) => p.evaluate(() => (window as unknown as { __fish?: { lines(): unknown[]; line(): unknown } }).__fish?.lines() ?? null)));
  console.log('[probe] 2.5 lines A/B ' + JSON.stringify(lines));
  t0 = await pnow(a);
  await reelOnBite(a, 200, 400, 25_000).catch((e) => console.log('[probe] 2.6 no bite: ' + String(e).slice(0, 120)));
  await judge('2.6 A reels (demo phones)', a, b, t0, 6000, { who: 'A' });
  const after = await Promise.all([a, b].map((p) => p.evaluate(() => (window as unknown as { __fish?: { lines(): unknown[] } }).__fish?.lines() ?? null)));
  console.log('[probe] 2.6 lines after A/B ' + JSON.stringify(after));
});

test('7 idle soak: both phones idle 3.5 min on the island, A touched now and then, B not', async ({ browser }) => {
  test.setTimeout(330_000);
  const island = newIsland();
  const { page: a } = await phone(browser, island, 'A');
  const { page: b } = await phone(browser, island, 'B');
  await quiet(a);
  const t0 = await pnow(a);
  for (let i = 0; i < 14; i++) {
    await a.keyboard.press('Shift');
    await a.waitForTimeout(15_000);
  }
  await judge('7.1 idle 3.5 min (A pressed a key every 15 s, B untouched)', a, b, t0, 210_000, { who: 'A' });
  await judge('7.2 idle (the same window, B)', a, b, t0, 210_000, { who: 'B' });
});
