// The fields in the record (docs/farming.md, contract/farm.ts): starts bought at their price with the かいがら that cover
// them; a plant only of what the pocket holds, on an empty plot, under the cap; a harvest only of one's own ripe plant,
// at the yield the record reckons from the waterings and the wet days; a dig only of one's own, its start back; the
// produce sold like any catch; the guest's its own; the wet days the record's own.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { sellPrice } from '../../app/src/lib/contract/shop.ts';
import { emptyFarm, FARM, farmStep, type Watered } from '../../app/src/lib/contract/farm.ts';
import { gameWet } from '../../app/src/lib/contract/wet.ts';
import { memSql, noWallets } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
// 2026-11-04 12:00 Tokyo
const T0 = Date.parse('2026-11-04T03:00:00.000Z');
const DAY = 86_400_000;
const D = '2026-11-04', D1 = '2026-11-05', D2 = '2026-11-06', D3 = '2026-11-07';
const K = sellPrice('bug:common-butterfly')!;
const P1 = 'fd:field-A.0.0', P2 = 'fd:field-A.1.0';

describe('the fields in the record', () => {
  let now: number;
  let store: StoreCore;
  let db: ReturnType<typeof memSql>;
  /** The object's start (a deploy, a rollback, a wake) over the same rows. */
  const start = () => { store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (now += 10), notify: () => {} }); };
  beforeEach(() => {
    now = T0;
    db = memSql();
    start();
  });
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  type W = 'A' | 'B' | 'G';
  let n = 0;
  const send = (who: W, type: string, data: object, id = `e${++n}`) => noWallets(store.handle({ key: keyOf[who], action: 'event', id, type, data }, 100));
  /** `who` gets at least `k` かいがら by selling common butterflies (the cheapest catch: a dearer one, since the × 10, buys more starts than one buy takes): how many. */
  const shells = (who: W, k: number): number => {
    const fish = Math.ceil(k / K);
    send(who, 'tally', { date: D, counts: { 'bug:common-butterfly': fish } });
    expect(send(who, 'sell', { species: 'bug:common-butterfly', n: fish, v: fish * K })).toEqual({ ok: true });
    return fish * K;
  };
  const starts = (who: W, crop: string, k: number) => send(who, 'buy_starts', { crop, n: k, v: k * FARM.startBuy });
  const farm = (who: W, d: string, ops: object[]) => send(who, 'farm', { d, ops });
  const plant = (p: string, c = 'tomato', src = 'start') => ({ o: 'plant', p, c, src });
  const sell = (who: W, species: string, k: number) => send(who, 'sell', { species, n: k, v: k * sellPrice(species)! });
  const water = (who: W, date: string, ids: string[]) => send(who, 'island', { date, taken: [], puts: [], shakes: [], watered: ids, wishes: {} });
  const rows = () => ((store.handle({ key: KEY_A, action: 'snapshot' }, 10) as Record<string, any>).rows.events as unknown[][]).filter((r) => r[3] === 'farm').map((r) => JSON.parse(r[4] as string));
  const refused = (detail: string) => ({ ok: false, error: 'bad_request', detail });

  it('starts at exactly their price, only with the かいがら to cover them', () => {
    expect(starts('A', 'tomato', 1)).toEqual(refused('wallet short'));
    const k = Math.floor(shells('A', 3 * FARM.startBuy) / FARM.startBuy);
    expect(send('A', 'buy_starts', { crop: 'tomato', n: 2, v: 2 * FARM.startBuy - 1 })).toEqual({ ok: false, error: 'bad_request' });
    expect(send('A', 'buy_starts', { crop: 'turnip', n: 1, v: FARM.startBuy })).toEqual({ ok: false, error: 'bad_request' });
    expect(starts('A', 'tomato', k)).toEqual({ ok: true });
    expect(starts('A', 'tomato', 1)).toEqual(refused('wallet short'));
    // a start sells back (NH's 70 Bells ÷ 20)
    expect(sell('A', 'goods:tomato-start', k)).toEqual({ ok: true });
    expect(sell('A', 'goods:tomato-start', 1)).toEqual(refused('pocket short'));
  });

  it('plants what the pocket holds on an empty plot; a refused op is dropped, the rest kept', () => {
    shells('A', 2 * FARM.startBuy);
    starts('A', 'tomato', 1);
    expect(farm('A', D, [plant(P1, 'carrot')])).toEqual(refused('farm refused')); // no carrot start
    expect(farm('A', D, [plant(P1), plant(P2)])).toEqual({ ok: true }); // one start: the second refused
    expect(rows().at(-1)).toEqual({ d: D, ops: [plant(P1)] });
    expect(farm('A', '2026-09-29', [plant(P2)])).toEqual({ ok: false, error: 'bad_request' }); // over 35 days ago
    expect(farm('A', D2, [plant(P2)])).toEqual({ ok: false, error: 'bad_request' }); // after tomorrow
    expect(sell('A', 'goods:tomato-start', 1)).toEqual(refused('pocket short')); // planted
  });

  it('a phone offline over two midnights: its farm rows, then the sells of their produce, all kept (2026-11-21)', () => {
    shells('A', FARM.startBuy);
    starts('A', 'tomato', 1);
    // queued on D (plant) and D1 (harvest, sell), sent on D3
    now = T0 + 3 * DAY;
    expect(farm('A', D, [plant(P1)])).toEqual({ ok: true });
    expect(farm('A', D1, [{ o: 'harvest', p: P1, n: 1 }])).toEqual({ ok: true });
    expect(sell('A', 'goods:tomato', 1)).toEqual({ ok: true });
    expect(rows()).toEqual([{ d: D, ops: [plant(P1)] }, { d: D1, ops: [{ o: 'harvest', p: P1, n: 1 }] }]);
    // 35 days on, the oldest day kept
    now = T0 + 35 * DAY;
    expect(farm('A', D1, [{ o: 'dig', p: P1 }])).toEqual({ ok: true });
  });

  it('two planting one plot: the first in the record keeps it, the second keeps its start', () => {
    shells('A', FARM.startBuy);
    shells('B', FARM.startBuy);
    starts('A', 'tomato', 1);
    starts('B', 'potato', 1);
    expect(farm('A', D, [plant(P1)])).toEqual({ ok: true });
    expect(farm('B', D, [plant(P1, 'potato')])).toEqual(refused('farm refused'));
    expect(sell('B', 'goods:potato-start', 1)).toEqual({ ok: true });
  });

  it(`at most ${FARM.cap} plants each`, () => {
    shells('A', (FARM.cap + 1) * FARM.startBuy);
    starts('A', 'wheat', FARM.cap + 1);
    const ops = Array.from({ length: FARM.cap }, (_, i) => plant(`fd:f.${i}.0`, 'wheat'));
    expect(farm('A', D, ops)).toEqual({ ok: true });
    expect(farm('A', D, [plant('fd:f.0.1', 'wheat')])).toEqual(refused('farm refused'));
    expect(farm('A', D, [{ o: 'dig', p: 'fd:f.0.0' }, plant('fd:f.0.1', 'wheat')])).toEqual({ ok: true }); // room again
  });

  it('a harvest only of my ripe plant, at the yield the record reckons: 3 if watered the day before ripe, else 1', () => {
    shells('A', 3 * FARM.startBuy);
    starts('A', 'tomato', 3);
    farm('A', D, [plant(P1), plant(P2), plant('fd:field-A.2.0')]);
    expect(farm('A', D, [{ o: 'harvest', p: P1, n: 1 }])).toEqual(refused('farm refused')); // not ripe till D1
    water('B', D, [P1]); // anyone waters anything
    water('G', D, [P2]);
    now += DAY;
    expect(farm('B', D1, [{ o: 'harvest', p: P1, n: 3 }])).toEqual(refused('farm refused')); // not B's
    expect(farm('A', D1, [{ o: 'harvest', p: P1, n: 1 }, { o: 'harvest', p: P2, n: 3 }, { o: 'harvest', p: 'fd:field-A.2.0', n: 3 }])).toEqual({ ok: true });
    expect(rows().at(-1).ops.map((o: { n: number }) => o.n)).toEqual([3, 3, 1]);
    // 7 tomatoes: sold at NH's 350 ÷ 20
    expect(sell('A', 'goods:tomato', 7)).toEqual({ ok: true });
    expect(sell('A', 'goods:tomato', 1)).toEqual(refused('pocket short'));
    // harvested, it grows back: ripe again FARM.regrowDays on
    expect(farm('A', D1, [{ o: 'harvest', p: P1, n: 1 }])).toEqual(refused('farm refused'));
    now += FARM.regrowDays * DAY;
    expect(farm('A', D2, [{ o: 'harvest', p: P1, n: 1 }])).toEqual({ ok: true });
  });

  it('the plant day and the harvest day count, before or after the planting or the harvest', () => {
    shells('A', 2 * FARM.startBuy);
    starts('A', 'tomato', 2);
    water('B', D, [P1]); // before the planting that day: it counts
    farm('A', D, [plant(P1), plant(P2)]);
    water('A', D, [P2]); // after it: the same
    now += DAY;
    expect(farm('A', D1, [{ o: 'harvest', p: P1, n: 1 }, { o: 'harvest', p: P2, n: 1 }])).toEqual({ ok: true });
    expect(rows().at(-1).ops.map((o: { n: number }) => o.n)).toEqual([3, 3]);
    // growing back: the harvest day's watering (after the harvest) gives 3, none 1
    water('A', D1, [P1]);
    now += DAY;
    expect(farm('A', D2, [{ o: 'harvest', p: P1, n: 1 }, { o: 'harvest', p: P2, n: 1 }])).toEqual({ ok: true });
    expect(rows().at(-1).ops.map((o: { n: number }) => o.n)).toEqual([3, 1]);
    // (B's and G's seeded by the snapshots' wallets)
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'same', A: 'same', B: 'same', G: 'same' });
  });

  it('a harvest kept under an older rule replays at its kept n (the fold reads it as kept, never reckons it anew)', () => {
    shells('A', FARM.startBuy);
    starts('A', 'tomato', 1);
    water('B', D, [P1]);
    farm('A', D, [plant(P1)]);
    now += 3 * DAY;
    // (the row as the record kept it before the plant day counted: n 1; the running field mended from the rows)
    const sql = (store as unknown as { io: { sql: { exec: (q: string, ...a: unknown[]) => unknown } } }).io.sql;
    sql.exec('INSERT INTO events (id, at, person, type, data, slot, late) VALUES (?, ?, ?, ?, ?, ?, ?)', 'old-harvest', new Date(now).toISOString(), 'A', 'farm', JSON.stringify({ d: D3, ops: [{ o: 'harvest', p: P1, n: 1 }] }), null, null);
    store.shopCheck({ fix: true });
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'same', A: 'same', B: 'none', G: 'none' });
    expect(sell('A', 'goods:tomato', 2)).toEqual(refused('pocket short'));
    expect(sell('A', 'goods:tomato', 1)).toEqual({ ok: true });
  });

  it('a wet day waters every plant', () => {
    shells('A', FARM.startBuy);
    starts('A', 'pumpkin', 1);
    farm('A', D, [plant(P1, 'pumpkin')]);
    expect(store.wetTick([D, '2026-11-01'])).toEqual([D]); // (only yesterday's and today's)
    expect(store.wetTick([D])).toEqual([]); // once
    now += DAY;
    farm('A', D1, [{ o: 'harvest', p: P1, n: 1 }]);
    expect(rows().at(-1).ops[0].n).toBe(3);
    // a phone never writes one
    expect(send('A', 'wet', { date: D1 })).toEqual({ ok: false, error: 'bad_request' });
    expect(send('G', 'wet', { date: D1 })).toEqual({ ok: false, error: 'bad_request' });
  });

  it('in the game mode the seeded wet days are the record’s', () => {
    send('A', 'pref', { key: 'weatherMode', value: 'game' });
    const kept = store.wetTick([]);
    expect(kept).toEqual(['2026-11-03', D].filter((d) => gameWet(d)));
  });

  it('a dig only of my plant, its start back', () => {
    shells('A', FARM.startBuy);
    starts('A', 'sugarcane', 1);
    farm('A', D, [plant(P1, 'sugarcane')]);
    expect(farm('B', D, [{ o: 'dig', p: P1 }])).toEqual(refused('farm refused'));
    expect(farm('A', D, [{ o: 'dig', p: P1 }])).toEqual({ ok: true });
    expect(sell('A', 'goods:sugarcane-start', 1)).toEqual({ ok: true });
  });

  it('a vegetable plants too, and the guest farms its own', () => {
    shells('G', FARM.startBuy);
    expect(starts('G', 'carrot', 1)).toEqual({ ok: true });
    expect(farm('G', D, [plant(P1, 'carrot')])).toEqual({ ok: true });
    now += 3 * DAY;
    expect(farm('G', D3, [{ o: 'harvest', p: P1, n: 1 }])).toEqual({ ok: true });
    expect(farm('G', D3, [plant(P2, 'carrot', 'crop')])).toEqual({ ok: true }); // the vegetable replanted
    expect(sell('G', 'goods:carrot', 1)).toEqual(refused('pocket short'));
  });

  it('a phone’s queued harvest reckons the yield the record keeps, over the same rows', () => {
    // six plants: none watered, watered on the plant day (by one, by two), watered only on their ripe day (no help),
    // and one growing back after a harvest over a wet day
    const ps = [0, 1, 2, 3, 4, 5].map((c) => `fd:field-A.${c}.0`);
    shells('A', 6 * FARM.startBuy);
    starts('A', 'wheat', 6);
    farm('A', D, ps.map((p) => plant(p, 'wheat')));
    water('A', D, [ps[1], ps[3]]);
    water('B', D, [ps[3]]);
    now += DAY;
    farm('A', D1, [{ o: 'harvest', p: ps[5], n: 1 }]);
    store.wetTick([D1]);
    water('G', D1, [ps[2], ps[4]]);
    now += DAY;
    // (D's island days gone: their waterings stand on the plots, farm_water)
    expect(store.islandPrune()).toMatchObject({ deleted: 2 });
    // the phone: the field folded from the kept rows, the waterings from the island days, the plots' farm_water and
    // the wet days (as model/farm.ts farmOfState and wateredOf: the relay never imports the model), its batch judged
    // by farmStep
    const snap = (store.handle({ key: KEY_A, action: 'snapshot' }, 10) as Record<string, any>).rows.events as [string, W, string, string, string][];
    const f = emptyFarm(), days = new Map<string, Set<string>>(), wet = new Set<string>();
    for (const [, who, , type, raw] of snap) {
      const x = JSON.parse(raw);
      if (type === 'farm') farmStep(f, who, x);
      if (type === 'island') for (const id of x.watered) (days.get(x.date) ?? days.set(x.date, new Set()).get(x.date)!).add(id);
      if (type === 'farm_water') (days.get(x.date) ?? days.set(x.date, new Set()).get(x.date)!).add(x.p);
      if (type === 'wet') wet.add(x.date);
    }
    const watered: Watered = (p, date) => wet.has(date) || (days.get(date)?.has(p) ?? false);
    const batch = { d: D2, ops: ps.map((p) => ({ o: 'harvest' as const, p, n: 1 })) };
    const queued = farmStep(f, 'A', batch, { watered, pocket: () => Infinity })!;
    expect(farm('A', batch.d, batch.ops)).toEqual({ ok: true });
    expect(rows().at(-1)).toEqual(queued);
    expect(queued.ops.map((o) => (o.o === 'harvest' ? o.n : 0))).toEqual([1, 3, 1, 3, 1, 3]);
  });

  /** The record's rows of `type` (data parsed). */
  const typed = (type: string) => ((store.handle({ key: KEY_A, action: 'snapshot' }, 10) as Record<string, any>).rows.events as unknown[][]).filter((r) => r[3] === type).map((r) => JSON.parse(r[4] as string));
  const sqlOf = () => (store as unknown as { io: { sql: { exec: (q: string, ...a: unknown[]) => unknown } } }).io.sql;

  it('a watering that counts is kept on its plot (farm_water), so the yield outlives the island days', () => {
    shells('A', 3 * FARM.startBuy);
    starts('A', 'tomato', 3);
    const P3 = 'fd:field-A.2.0';
    water('B', D, [P1]); // before the planting: kept once it is planted
    farm('A', D, [plant(P1), plant(P2), plant(P3)]);
    water('A', D, [P2, 'fl:1:2']);
    water('A', D, [P2]); // (again: no second row)
    expect(typed('farm_water')).toEqual([{ p: P1, date: D }, { p: P2, date: D }]);
    // the ripe day's watering doesn't count: none kept
    now += DAY;
    water('A', D1, [P3]);
    expect(typed('farm_water')).toHaveLength(2);
    // harvested three days on, D's island days gone
    now += 2 * DAY;
    expect(store.islandPrune()).toEqual({ stamped: 0, old: 3, deleted: 3 });
    expect(typed('island').map((d) => d.date)).toEqual([]);
    expect(farm('A', D3, [{ o: 'harvest', p: P1, n: 1 }, { o: 'harvest', p: P2, n: 1 }, { o: 'harvest', p: P3, n: 1 }])).toEqual({ ok: true });
    expect(rows().at(-1).ops.map((o: { n: number }) => o.n)).toEqual([3, 3, 1]);
    // growing back: the harvest day's watering kept anew, the plot's slot one row
    water('A', D3, [P1]);
    expect(typed('farm_water')).toEqual([{ p: P2, date: D }, { p: P1, date: D3 }]);
    // a phone never writes one
    expect(send('A', 'farm_water', { p: P1, date: D3 })).toEqual({ ok: false, error: 'bad_request' });
    expect(send('G', 'farm_water', { p: P1, date: D3 })).toEqual({ ok: false, error: 'bad_request' });
  });

  it('an island day before yesterday is refused (the record keeps only yesterday\'s, today\'s and tomorrow\'s)', () => {
    now += 2 * DAY; // D2
    expect(water('A', D, [])).toEqual({ ok: false, error: 'bad_request' });
    expect(water('A', D1, [])).toEqual({ ok: true });
    expect(water('A', D2, [])).toEqual({ ok: true });
    expect(water('A', D3, [])).toEqual({ ok: true });
  });

  it('the prune: the waterings backfilled first (dry: only that), then only the island days before yesterday deleted, every other row kept', () => {
    shells('A', 2 * FARM.startBuy);
    starts('A', 'tomato', 2);
    farm('A', D, [plant(P1), plant(P2)]);
    water('A', D, [P1]);
    water('B', D, [P2]);
    // (rows from before farm_water: none on the plots)
    sqlOf().exec("DELETE FROM events WHERE type = 'farm_water'");
    noWallets(store.handle({ key: KEY_A, action: 'ingest', dates: 'Nov 4, 2026 at 7:11 AM', steps: '855' }, 100));
    now += DAY;
    expect(store.wetTick([D1])).toEqual([D1]); // (the ripe day's: no help)
    water('A', D1, []);
    now += DAY; // D2: D1 is yesterday
    water('B', D2, []);
    water('G', D3, []);
    const before = store.dump().rows;
    expect(store.islandPrune(true)).toEqual({ stamped: 2, old: 2, deleted: 0 });
    expect(typed('farm_water')).toEqual([{ p: P1, date: D }, { p: P2, date: D }]);
    expect(store.islandPrune(true)).toEqual({ stamped: 0, old: 2, deleted: 0 }); // idempotent
    expect(store.islandPrune()).toEqual({ stamped: 0, old: 2, deleted: 2 });
    const after = store.dump().rows;
    const notFw = (r: unknown[]) => r[3] !== 'farm_water';
    const gone = (r: unknown[]) => r[3] === 'island' && JSON.parse(r[4] as string).date < D1;
    expect(after.metrics).toEqual(before.metrics);
    expect(after.metrics.length).toBeGreaterThan(0);
    expect(after.events.filter(notFw)).toEqual(before.events.filter((r) => !gone(r)));
    expect(before.events.filter(gone)).toHaveLength(2);
    expect(typed('island').map((d) => d.date).sort()).toEqual([D1, D2, D3]);
    expect(store.islandPrune()).toEqual({ stamped: 0, old: 0, deleted: 0 });
    // the plants' yield as before the prune
    farm('A', D2, [{ o: 'harvest', p: P1, n: 1 }, { o: 'harvest', p: P2, n: 1 }]);
    expect(rows().at(-1).ops.map((o: { n: number }) => o.n)).toEqual([3, 3]);
  });

  it('the running ledgers and the field match their fold from the rows', () => {
    shells('A', 2 * FARM.startBuy);
    starts('A', 'tomato', 2);
    farm('A', D, [plant(P1), plant(P2)]);
    now += 3 * DAY;
    farm('A', D3, [{ o: 'harvest', p: P1, n: 1 }, { o: 'dig', p: P2 }]);
    sell('A', 'goods:tomato', 1);
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'same', A: 'same', B: 'none', G: 'none' });
  });

  it('shopcheck folds the field anew too: a running field gone wrong is found and mended, the ledgers judged by the fold', () => {
    shells('A', 2 * FARM.startBuy);
    starts('A', 'tomato', 2);
    farm('A', D, [plant(P1), plant(P2)]);
    // (the field's meta gone wrong: P2's plant lost, its start not taken from the pocket)
    const sql = (store as unknown as { io: { sql: { exec: (q: string, ...a: unknown[]) => unknown } } }).io.sql;
    sql.exec("UPDATE meta SET v = ? WHERE k LIKE 'farm|%'", JSON.stringify({ p: [[P1, { who: 'A', c: 'tomato', from: D3 }]], n: { A: [['goods:tomato-start', -1]] } }));
    // A's running ledger is right: judged by the field's fold, not the wrong field (its fix would write a wrong one)
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'differs', A: 'same', B: 'none', G: 'none' });
    expect(store.shopCheck({ fix: true })).toMatchObject({ farm: 'differs' });
    expect(store.shopCheck()).toMatchObject({ farm: 'same', A: 'same' });
    expect(farm('A', D, [plant(P2)])).toEqual(refused('farm refused')); // taken
  });

  it('growth rules changed: the old rules\' running field (from = D+3, its own key) is dropped and folded anew, so a harvest ripe by the new rule is kept', () => {
    shells('A', FARM.startBuy);
    starts('A', 'tomato', 1);
    farm('A', D, [plant(P1)]);
    const sql = (store as unknown as { io: { sql: { exec: (q: string, ...a: unknown[]) => { toArray(): { k: string }[] } } } }).io.sql;
    // what the relay wrote under the 3-day rule (2a7da941e's deploy): the field under the unversioned key, from = D+3
    sql.exec("DELETE FROM meta WHERE k LIKE 'farm|%'");
    sql.exec("INSERT INTO meta (k, v) VALUES ('farm', ?)", JSON.stringify({ p: [[P1, { who: 'A', c: 'tomato', from: D3 }]], n: { A: [['goods:tomato-start', -1]] } }));
    now += DAY;
    expect(farm('A', D1, [{ o: 'harvest', p: P1, n: 1 }])).toEqual({ ok: true });
    expect(sql.exec("SELECT k FROM meta WHERE k = 'farm' OR k LIKE 'farm|%'").toArray().map((r) => r.k)).toEqual([`farm|g${FARM.growDays}r${FARM.regrowDays}`]);
    expect(store.shopCheck()).toMatchObject({ farm: 'same', A: 'same' });
  });

  it('a rollback to an older relay, then forward: its rows (a dig of P1) are folded in at the start, so the dug plant is not harvested again', () => {
    shells('A', FARM.startBuy);
    starts('A', 'tomato', 1);
    farm('A', D, [plant(P1)]);
    // the older relay (before the rule-named key) keeps a dig of P1: its row, its own key; this one's copy untouched
    db.sql.exec("INSERT INTO events (id, at, person, type, data) VALUES ('old1', ?, 'A', 'farm', ?)", new Date(now += 10).toISOString(), JSON.stringify({ d: D, ops: [{ o: 'dig', p: P1 }] }));
    db.sql.exec("INSERT INTO meta (k, v) VALUES ('farm', '{}') ON CONFLICT (k) DO UPDATE SET v = excluded.v");
    now += DAY;
    start();
    expect(farm('A', D1, [{ o: 'harvest', p: P1, n: 1 }])).toMatchObject({ ok: false });
    expect(store.shopCheck()).toMatchObject({ farm: 'same' }); // (A's ledger: the older relay's to keep, not this row's)
    // a plain wake keeps the copy (no fold)
    start();
    expect(db.sql.exec("SELECT k FROM meta WHERE k = 'farm' OR k LIKE 'farm|%'").toArray().map((r) => (r as { k: string }).k)).toEqual([`farm|g${FARM.growDays}r${FARM.regrowDays}`]);
  });
});
