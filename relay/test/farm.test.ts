// The shared field in the record (docs/farming.md, contract/farm.ts): starts bought at their price with the かいがら that
// cover them; anyone plants (of their own pocket) on an empty plot, waters, harvests (the produce theirs) or digs (the
// start theirs) any plant; ripe FARM.growMs after the row's `at`, again after a harvest; 3 if watered or rained on, else
// 1; the stored field always the fold of the rows; an older relay's field folded anew once; old farm_water rows harmless.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { sellPrice } from '../../app/src/lib/contract/shop.ts';
import { FARM, fieldFromJson, type Plot } from '../../app/src/lib/contract/farm.ts';
import { gameWet } from '../../app/src/lib/contract/wet.ts';
import { memSql, noWallets } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
// 2026-11-04 12:00 Tokyo
const T0 = Date.parse('2026-11-04T03:00:00.000Z');
const DAY = 86_400_000;
const D = '2026-11-04', D1 = '2026-11-05';
const K = sellPrice('bug:common-butterfly')!;
const P1 = 'fd:field.0.0', P2 = 'fd:field.1.0', P3 = 'fd:field.2.0';

describe('the shared field in the record', () => {
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
  /** `who` gets at least `k` かいがら by selling common butterflies: how many. */
  const shells = (who: W, k: number): number => {
    const fish = Math.ceil(k / K);
    send(who, 'tally', { date: D, counts: { 'bug:common-butterfly': fish } });
    expect(send(who, 'sell', { species: 'bug:common-butterfly', n: fish, v: fish * K })).toEqual({ ok: true });
    return fish * K;
  };
  const starts = (who: W, crop: string, k: number) => {
    shells(who, k * FARM.startBuy);
    return send(who, 'buy_starts', { crop, n: k, v: k * FARM.startBuy });
  };
  const farm = (who: W, ...ops: object[]) => send(who, 'farm', { ops });
  const plant = (p: string, c = 'tomato', src = 'start') => ({ o: 'plant', p, c, src });
  const harvest = (p: string) => ({ o: 'harvest', p, n: 1 });
  const water = (p: string) => ({ o: 'water', p });
  const dig = (p: string) => ({ o: 'dig', p });
  const sell = (who: W, species: string, k: number) => send(who, 'sell', { species, n: k, v: k * sellPrice(species)! });
  const snap = () => store.handle({ key: KEY_A, action: 'snapshot' }, 10) as Record<string, any>;
  /** The record's rows of `type` (data parsed). */
  const typed = (type: string) => (snap().rows.events as unknown[][]).filter((r) => r[3] === type).map((r) => JSON.parse(r[4] as string));
  const rows = () => typed('farm');
  /** The stored field as a snapshot carries it. */
  const field = () => fieldFromJson(snap().field.v)!.plots;
  const plot = (p: string): Plot => field().get(p)!;
  const refused = (detail: string) => ({ ok: false, error: 'bad_request', detail });
  const sqlOf = () => db.sql as { exec: (q: string, ...a: unknown[]) => { toArray(): any[] } };

  it('starts at exactly their price, only with the かいがら to cover them', () => {
    expect(send('A', 'buy_starts', { crop: 'tomato', n: 1, v: FARM.startBuy })).toEqual(refused('wallet short'));
    const k = Math.floor(shells('A', 3 * FARM.startBuy) / FARM.startBuy);
    expect(send('A', 'buy_starts', { crop: 'tomato', n: 2, v: 2 * FARM.startBuy - 1 })).toEqual({ ok: false, error: 'bad_request' });
    expect(send('A', 'buy_starts', { crop: 'turnip', n: 1, v: FARM.startBuy })).toEqual({ ok: false, error: 'bad_request' });
    expect(send('A', 'buy_starts', { crop: 'tomato', n: k, v: k * FARM.startBuy })).toEqual({ ok: true });
    expect(send('A', 'buy_starts', { crop: 'tomato', n: 1, v: FARM.startBuy })).toEqual(refused('wallet short'));
    expect(sell('A', 'goods:tomato-start', k)).toEqual({ ok: true });
    expect(sell('A', 'goods:tomato-start', 1)).toEqual(refused('pocket short'));
  });

  it('plants what the sender’s pocket holds on an empty plot; a refused op is dropped, the rest kept; ripe FARM.growMs after the row', () => {
    starts('A', 'tomato', 1);
    expect(farm('A', plant(P1, 'carrot'))).toEqual(refused('farm refused')); // no carrot start
    expect(farm('B', plant(P1))).toEqual(refused('farm refused')); // B has none: A's are A's
    expect(farm('A', plant(P1), plant(P2))).toEqual({ ok: true }); // one start: the second refused
    expect(rows()).toEqual([{ ops: [plant(P1)] }]);
    const at = Date.parse(snap().rows.events.filter((r: unknown[]) => r[3] === 'farm')[0][0]);
    expect(plot(P1)).toEqual({ c: 'tomato', t: at + FARM.growMs });
    expect(sell('A', 'goods:tomato-start', 1)).toEqual(refused('pocket short')); // planted
    expect(send('A', 'farm', { ops: [] })).toEqual({ ok: false, error: 'bad_request' });
    expect(send('A', 'farm', { ops: [{ o: 'water', p: P1, n: 1 }] })).toEqual({ ok: false, error: 'bad_request' });
  });

  it('an older build’s {d, ops} is taken (its day dropped), judged at the record’s time, whatever day it names', () => {
    starts('A', 'tomato', 1);
    expect(send('A', 'farm', { d: '2026-09-01', ops: [plant(P1)] })).toEqual({ ok: true });
    expect(rows()).toEqual([{ ops: [plant(P1)] }]);
    expect(send('A', 'farm', { d: '2026-12-31', ops: [harvest(P1)] })).toEqual(refused('farm refused')); // unripe now
  });

  it('shared plots: B harvests A’s plant (the produce B’s), anyone waters, G digs it up (the start G’s)', () => {
    starts('A', 'tomato', 1);
    farm('A', plant(P1));
    expect(farm('B', water(P1))).toEqual({ ok: true });
    expect(farm('G', water(P1))).toEqual(refused('farm refused')); // watered already
    expect(plot(P1).w).toBe(true);
    now = plot(P1).t;
    expect(farm('B', harvest(P1))).toEqual({ ok: true });
    expect(rows().at(-1)).toEqual({ ops: [{ o: 'harvest', p: P1, n: FARM.maxYield }] });
    expect(sell('A', 'goods:tomato', 1)).toEqual(refused('pocket short'));
    expect(sell('B', 'goods:tomato', FARM.maxYield)).toEqual({ ok: true });
    // growing back (stage 2), no longer watered
    expect(plot(P1)).toEqual({ c: 'tomato', t: expect.any(Number), r: true });
    expect(farm('G', dig(P1))).toEqual({ ok: true });
    expect(field().has(P1)).toBe(false);
    expect(sell('G', 'goods:tomato-start', 1)).toEqual({ ok: true });
    expect(sell('A', 'goods:tomato-start', 1)).toEqual(refused('pocket short'));
    expect(farm('A', dig(P1))).toEqual(refused('farm refused')); // empty
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'same' });
    expect(store.ledgerCheck().drift).toEqual([]);
  });

  it('two planting one plot: the first in the record keeps it, the second keeps its start', () => {
    starts('A', 'tomato', 1);
    starts('B', 'potato', 1);
    expect(farm('A', plant(P1))).toEqual({ ok: true });
    expect(farm('B', plant(P1, 'potato'))).toEqual(refused('farm refused'));
    expect(sell('B', 'goods:potato-start', 1)).toEqual({ ok: true });
  });

  it('no cap: a whole batch of plants, from one person', () => {
    starts('A', 'wheat', FARM.batchMax);
    expect(farm('A', ...Array.from({ length: FARM.batchMax }, (_, i) => plant(`fd:f.${i % 10}.${Math.floor(i / 10)}`, 'wheat')))).toEqual({ ok: true });
    expect(field().size).toBe(FARM.batchMax);
  });

  it('6 hours to ripe, and 6 hours again after each harvest; unwatered and dry it yields 1', () => {
    starts('A', 'tomato', 1);
    farm('A', plant(P1));
    const t = plot(P1).t;
    now = t - 1000;
    expect(farm('A', harvest(P1))).toEqual(refused('farm refused'));
    now = t;
    expect(farm('A', harvest(P1))).toEqual({ ok: true });
    expect(rows().at(-1).ops[0].n).toBe(1);
    const t2 = plot(P1).t;
    expect(t2 - now).toBeLessThanOrEqual(FARM.growMs);
    expect(t2 - now).toBeGreaterThan(FARM.growMs - 1000);
    now = t2 - 1000;
    expect(farm('A', harvest(P1))).toEqual(refused('farm refused'));
    now = t2;
    expect(farm('A', harvest(P1))).toEqual({ ok: true });
    expect(sell('A', 'goods:tomato', 2)).toEqual({ ok: true });
  });

  it('a watering counts while growing, once a growth; a ripe plant’s is refused; the island day’s `watered` no longer counts', () => {
    starts('A', 'tomato', 3);
    farm('A', plant(P1), plant(P2), plant(P3));
    // (an older build's island day naming a plot: unread)
    send('A', 'island', { date: D, taken: [], puts: [], shakes: [], watered: [P3], wishes: {} });
    expect(farm('A', water(P1), water(P1))).toEqual({ ok: true });
    expect(rows().at(-1)).toEqual({ ops: [water(P1)] }); // the second dropped
    now = plot(P1).t;
    expect(farm('B', water(P2))).toEqual(refused('farm refused')); // ripe
    expect(farm('A', harvest(P1), harvest(P2), harvest(P3))).toEqual({ ok: true });
    expect(rows().at(-1).ops.map((o: { n: number }) => o.n)).toEqual([3, 1, 1]);
    // growing back: watered anew
    expect(farm('G', water(P1))).toEqual({ ok: true });
  });

  it('rain the day a plant started or the day it ripens: 3', () => {
    starts('A', 'pumpkin', 2);
    farm('A', plant(P1, 'pumpkin')); // 12:00 D: ripe 18:00 D
    expect(store.wetTick([D, '2026-11-01'])).toEqual([D]); // (only yesterday's and today's)
    expect(store.wetTick([D])).toEqual([]); // once
    now = T0 + 9 * 3600_000; // 21:00 D: P2 ripe 03:00 D1, started on wet D
    farm('A', plant(P2, 'pumpkin'));
    now = T0 + DAY;
    expect(farm('A', harvest(P1), harvest(P2))).toEqual({ ok: true });
    expect(rows().at(-1).ops.map((o: { n: number }) => o.n)).toEqual([3, 3]);
    // growing back from 12:00 D1, ripe 18:00 D1: dry, 1; D1 wet: 3
    now += FARM.growMs;
    expect(farm('A', harvest(P1))).toEqual({ ok: true });
    expect(rows().at(-1).ops[0].n).toBe(1);
    expect(store.wetTick([D1])).toEqual([D1]);
    now += FARM.growMs;
    expect(farm('A', harvest(P2))).toEqual({ ok: true });
    expect(rows().at(-1).ops[0].n).toBe(3);
    // a phone never writes one
    expect(send('A', 'wet', { date: D1 })).toEqual({ ok: false, error: 'bad_request' });
    expect(send('G', 'wet', { date: D1 })).toEqual({ ok: false, error: 'bad_request' });
  });

  it('in the game mode the seeded wet days are the record’s', () => {
    send('A', 'pref', { key: 'weatherMode', value: 'game' });
    expect(store.wetTick([])).toEqual(['2026-11-03', D].filter((d) => gameWet(d)));
  });

  it('a vegetable plants too, of the sender’s pocket', () => {
    starts('G', 'carrot', 1);
    farm('G', plant(P1, 'carrot'), water(P1));
    now = plot(P1).t;
    expect(farm('B', plant(P2, 'carrot', 'crop'))).toEqual(refused('farm refused')); // B has no carrot
    expect(farm('G', harvest(P1), plant(P2, 'carrot', 'crop'))).toEqual({ ok: true }); // the vegetable replanted
    expect(sell('G', 'goods:carrot', 2)).toEqual({ ok: true });
    expect(sell('G', 'goods:carrot', 1)).toEqual(refused('pocket short'));
  });

  it('the field is judged at the row’s `at`: the stored field is the fold of the rows, the ack’s field the snapshot’s', () => {
    starts('A', 'tomato', 2);
    const ack = store.handle({ key: KEY_A, action: 'event', id: 'f1', type: 'farm', data: { ops: [plant(P1), plant(P2)] } }, 100) as Record<string, any>;
    const at = (snap().rows.events as string[][]).find((r) => r[3] === 'farm')![0];
    expect(ack.field.at).toBe(at);
    expect(ack.field.v).toEqual([[P1, { c: 'tomato', t: Date.parse(at) + FARM.growMs }], [P2, { c: 'tomato', t: Date.parse(at) + FARM.growMs }]]);
    expect(snap().field).toEqual(ack.field);
    now += FARM.growMs;
    farm('B', harvest(P1), water(P2));
    now += 3 * DAY;
    farm('G', harvest(P2), dig(P1));
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'same' });
    expect(store.ledgerCheck().drift).toEqual([]);
  });

  it('shopcheck folds anew: a stored field gone wrong is found and mended', () => {
    starts('A', 'tomato', 2);
    farm('A', plant(P1), plant(P2));
    sqlOf().exec("UPDATE ledger SET v = ? WHERE who = 'F'", JSON.stringify([[P1, { c: 'tomato', t: 0 }]]));
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'differs' });
    expect(store.ledgerCheck().drift).toMatchObject([{ part: 'field', keys: [P1, P2] }]);
    expect(store.shopCheck({ fix: true })).toMatchObject({ farm: 'differs' });
    expect(store.shopCheck()).toMatchObject({ farm: 'same' });
    expect(store.ledgerCheck().drift).toEqual([]);
    expect(farm('A', plant(P2))).toEqual(refused('farm refused')); // taken
  });

  it('the deploy: the old relay’s field ({p, n}, day-based, owners) and its key are dropped and the rows folded at once under the new rules, each at its `at`', () => {
    starts('A', 'tomato', 2);
    starts('B', 'potato', 1);
    // what the old relay kept: day rows ({d, ops}), its field and its copy under `farm|g1r1`
    const put = (id: string, t: number, who: W, d: object) => sqlOf().exec("INSERT INTO events (id, at, person, type, data) VALUES (?, ?, ?, 'farm', ?)", id, new Date(t).toISOString(), who, JSON.stringify(d));
    put('old1', T0 + 1000, 'A', { d: D, ops: [plant(P1), plant(P2)] });
    put('old2', T0 + 2000, 'B', { d: D, ops: [plant(P3, 'potato')] });
    put('old3', T0 + DAY, 'A', { d: D1, ops: [{ o: 'harvest', p: P1, n: 3 }, dig(P2)] });
    const old = { p: [[P1, { who: 'A', c: 'tomato', from: '2026-11-06', r: true }], [P3, { who: 'B', c: 'potato', from: D1 }]], n: {} };
    sqlOf().exec("INSERT INTO ledger (who, part, seq, at, v) VALUES ('F', 'field', 7, ?, ?) ON CONFLICT (who, part) DO UPDATE SET v = excluded.v", new Date(T0).toISOString(), JSON.stringify(old));
    sqlOf().exec("INSERT INTO meta (k, v) VALUES ('farm|g1r1', ?)", JSON.stringify(old));
    // (the old relay's pockets: the ledgers stepped by its rows)
    sqlOf().exec("UPDATE ledger SET v = json_set(v, '$.p', json('[[\"goods:tomato\",3],[\"goods:tomato-start\",1]]')) WHERE who = 'A' AND part = 'hp'");
    sqlOf().exec("UPDATE ledger SET v = json_set(v, '$.p', json('[]')) WHERE who = 'B' AND part = 'hp'");
    now = T0 + DAY + 3600_000;
    start();
    // folded at the start: a snapshot carries the new field before any farm op
    // (its seq on from the old one's: a phone keeps the highest)
    expect(snap().field).toMatchObject({ seq: 8, v: [
      [P1, { c: 'tomato', t: T0 + DAY + FARM.growMs, r: true }],
      [P3, { c: 'potato', t: T0 + 2000 + FARM.growMs }]
    ] });
    expect(sqlOf().exec("SELECT k FROM meta WHERE k = 'farm' OR k LIKE 'farm|%'").toArray().map((r) => r.k)).toEqual(['farm|t6h']);
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'same' });
    expect(store.ledgerCheck().drift).toEqual([]);
    // B's potato, ripe by the new rule, A harvests it
    expect(farm('A', harvest(P3))).toEqual({ ok: true });
    expect(sell('A', 'goods:potato', 1)).toEqual({ ok: true });
    // a plain wake keeps the field (no fold)
    const seq = snap().field.seq;
    start();
    expect(snap().field.seq).toBe(seq);
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'same' });
  });

  it('a rollback to the old relay, then forward: its key found at the start, its rows folded in, so its dig stands', () => {
    starts('A', 'tomato', 1);
    farm('A', plant(P1));
    sqlOf().exec("INSERT INTO events (id, at, person, type, data) VALUES ('old1', ?, 'A', 'farm', ?)", new Date(now += 10).toISOString(), JSON.stringify({ d: D, ops: [dig(P1)] }));
    sqlOf().exec("INSERT INTO meta (k, v) VALUES ('farm|g1r1', '{}')");
    now += DAY;
    const seq = snap().field.seq;
    start();
    expect(snap().field.seq).toBe(seq + 1);
    expect(field().size).toBe(0);
    expect(farm('A', harvest(P1))).toEqual(refused('farm refused'));
    expect(store.shopCheck()).toMatchObject({ farm: 'same' });
  });

  it('a load: the dump’s field of the old shape skipped, the field folded from the loaded rows', () => {
    starts('A', 'tomato', 2);
    farm('A', plant(P1), plant(P2));
    const dump = store.dump().rows as Record<string, unknown[][]>;
    const ledger = dump.ledger.map((r) => (r[0] === 'F' ? ['F', 'field', 3, r[3], JSON.stringify({ p: [], n: {} })] : r));
    const want = snap().field.v;
    db = memSql();
    start();
    expect(store.load({ rows: { ...dump, ledger } })).toMatchObject({ ok: true });
    expect(snap().field.v).toEqual(want);
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'same' });
  });

  it('old farm_water rows: carried by the snapshot and the dump as any row, never a phone’s, deleted by the prune with the island days before yesterday', () => {
    starts('A', 'tomato', 1);
    farm('A', plant(P1));
    sqlOf().exec("INSERT INTO events (id, at, person, type, data, slot) VALUES ('fw-1', ?, 'A', 'farm_water', ?, ?)", new Date(now += 10).toISOString(), JSON.stringify({ p: P1, date: D }), `farm_water|${P1}`);
    const island = (who: W, date: string) => send(who, 'island', { date, taken: [], puts: [], shakes: [], watered: [], wishes: {} });
    island('A', D);
    island('B', D);
    noWallets(store.handle({ key: KEY_A, action: 'ingest', dates: 'Nov 4, 2026 at 7:11 AM', steps: '855' }, 100));
    expect(typed('farm_water')).toEqual([{ p: P1, date: D }]);
    expect(send('A', 'farm_water', { p: P1, date: D })).toEqual({ ok: false, error: 'bad_request' });
    now += 2 * DAY; // D2: D1 yesterday
    island('A', D1);
    const before = store.dump().rows;
    expect(store.islandPrune(true)).toEqual({ old: 3, deleted: 0, more: false });
    expect(store.islandPrune(false, 1)).toEqual({ old: 1, deleted: 1, more: true });
    expect(store.islandPrune()).toEqual({ old: 2, deleted: 2, more: false });
    expect(store.islandPrune()).toEqual({ old: 0, deleted: 0, more: false });
    const after = store.dump().rows;
    const gone = (r: unknown[]) => r[3] === 'farm_water' || (r[3] === 'island' && JSON.parse(r[4] as string).date < D1);
    expect(after.metrics).toEqual(before.metrics);
    expect(after.events).toEqual(before.events.filter((r) => !gone(r)));
    expect(typed('island').map((d) => d.date)).toEqual([D1]);
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'same' });
  });

  it('an island day before yesterday is refused (the record keeps only yesterday\'s, today\'s and tomorrow\'s)', () => {
    now += 2 * DAY;
    const island = (date: string) => send('A', 'island', { date, taken: [], puts: [], shakes: [], watered: [], wishes: {} });
    expect(island(D)).toEqual({ ok: false, error: 'bad_request' });
    expect(island(D1)).toEqual({ ok: true });
  });
});
