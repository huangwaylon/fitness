// The fields in the record (docs/farming.md, contract/farm.ts): starts bought at their price with the かいがら that cover
// them; a plant only of what the pocket holds, on an empty plot, under the cap; a harvest only of one's own ripe plant,
// at the yield the record reckons from the waterings and the wet days; a dig only of one's own, its start back; the
// produce sold like any catch; the guest's its own; the wet days the record's own.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { sellPrice } from '../../app/src/lib/contract/shop.ts';
import { emptyFarm, FARM, farmStep, type Watered } from '../../app/src/lib/contract/farm.ts';
import { gameWet } from '../../app/src/lib/contract/wet.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
// 2026-11-04 12:00 Tokyo
const T0 = Date.parse('2026-11-04T03:00:00.000Z');
const DAY = 86_400_000;
const D = '2026-11-04', D1 = '2026-11-05', D2 = '2026-11-06', D3 = '2026-11-07';
const K = sellPrice('fish:koi')!;
const P1 = 'fd:field-A.0.0', P2 = 'fd:field-A.1.0';

describe('the fields in the record', () => {
  let now: number;
  let store: StoreCore;
  beforeEach(() => {
    now = T0;
    const db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (now += 10), notify: () => {} });
  });
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  type W = 'A' | 'B' | 'G';
  let n = 0;
  const send = (who: W, type: string, data: object, id = `e${++n}`) => store.handle({ key: keyOf[who], action: 'event', id, type, data }, 100) as Record<string, unknown>;
  /** `who` gets at least `k` かいがら by selling koi: how many. */
  const shells = (who: W, k: number): number => {
    const fish = Math.ceil(k / K);
    send(who, 'tally', { date: D, counts: { 'fish:koi': fish } });
    expect(send(who, 'sell', { species: 'fish:koi', n: fish, v: fish * K })).toEqual({ ok: true });
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
    expect(farm('A', '2026-11-02', [plant(P2)])).toEqual({ ok: false, error: 'bad_request' }); // its day not about today
    expect(sell('A', 'goods:tomato-start', 1)).toEqual(refused('pocket short')); // planted
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

  it('a harvest only of my ripe plant, at the yield the record reckons: 1, 2 or 3 by the days watered', () => {
    shells('A', 3 * FARM.startBuy);
    starts('A', 'tomato', 3);
    farm('A', D, [plant(P1), plant(P2), plant('fd:field-A.2.0')]);
    expect(farm('A', D1, [{ o: 'harvest', p: P1, n: 1 }])).toEqual(refused('farm refused')); // not ripe till D3
    now += DAY;
    water('B', D1, [P1, P2]); // anyone waters anything
    now += DAY;
    water('G', D2, [P1]);
    now += DAY;
    expect(farm('B', D3, [{ o: 'harvest', p: P1, n: 3 }])).toEqual(refused('farm refused')); // not B's
    expect(farm('A', D3, [{ o: 'harvest', p: P1, n: 1 }, { o: 'harvest', p: P2, n: 3 }, { o: 'harvest', p: 'fd:field-A.2.0', n: 3 }])).toEqual({ ok: true });
    expect(rows().at(-1).ops.map((o: { n: number }) => o.n)).toEqual([3, 2, 1]);
    // 6 tomatoes: sold at NH's 350 ÷ 20
    expect(sell('A', 'goods:tomato', 6)).toEqual({ ok: true });
    expect(sell('A', 'goods:tomato', 1)).toEqual(refused('pocket short'));
    // harvested, it grows back: ripe again FARM.regrowDays on
    expect(farm('A', D3, [{ o: 'harvest', p: P1, n: 1 }])).toEqual(refused('farm refused'));
    now += FARM.regrowDays * DAY;
    expect(farm('A', '2026-11-10', [{ o: 'harvest', p: P1, n: 1 }])).toEqual({ ok: true });
  });

  it('a wet day waters every plant', () => {
    shells('A', FARM.startBuy);
    starts('A', 'pumpkin', 1);
    farm('A', D, [plant(P1, 'pumpkin')]);
    now += DAY;
    expect(store.wetTick([D1])).toEqual([D1]);
    expect(store.wetTick([D1])).toEqual([]); // once
    now += DAY;
    store.wetTick([D2, '2026-11-01']); // (only yesterday's and today's)
    now += DAY;
    farm('A', D3, [{ o: 'harvest', p: P1, n: 1 }]);
    expect(rows().at(-1).ops[0].n).toBe(3);
    // a phone never writes one
    expect(send('A', 'wet', { date: D3 })).toEqual({ ok: false, error: 'bad_request' });
    expect(send('G', 'wet', { date: D3 })).toEqual({ ok: false, error: 'forbidden' });
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
    // six plants, watered every way the two days before they ripen: none, the first, the second, both (two people),
    // and one growing back after a harvest over a wet day and a watering
    const ps = [0, 1, 2, 3, 4, 5].map((c) => `fd:field-A.${c}.0`);
    shells('A', 6 * FARM.startBuy);
    starts('A', 'wheat', 6);
    farm('A', D, ps.map((p) => plant(p, 'wheat')));
    now += DAY;
    water('A', D1, [ps[1], ps[3]]);
    water('B', D1, [ps[3]]);
    now += DAY;
    water('G', D2, [ps[2], ps[3]]);
    now += DAY;
    farm('A', D3, [{ o: 'harvest', p: ps[5], n: 1 }]);
    now += DAY;
    store.wetTick(['2026-11-08']);
    now += DAY;
    water('B', '2026-11-09', [ps[5]]);
    now += DAY;
    // the phone: the field folded from the kept rows, the waterings from the island days and the wet days (as
    // model/farm.ts farmOfState and wateredOf: the relay never imports the model), its batch judged by farmStep
    const snap = (store.handle({ key: KEY_A, action: 'snapshot' }, 10) as Record<string, any>).rows.events as [string, W, string, string, string][];
    const f = emptyFarm(), days = new Map<string, Set<string>>(), wet = new Set<string>();
    for (const [, who, , type, raw] of snap) {
      const x = JSON.parse(raw);
      if (type === 'farm') farmStep(f, who, x);
      if (type === 'island') for (const id of x.watered) (days.get(x.date) ?? days.set(x.date, new Set()).get(x.date)!).add(id);
      if (type === 'wet') wet.add(x.date);
    }
    const watered: Watered = (p, date) => wet.has(date) || (days.get(date)?.has(p) ?? false);
    const batch = { d: '2026-11-10', ops: ps.map((p) => ({ o: 'harvest' as const, p, n: 1 })) };
    const queued = farmStep(f, 'A', batch, { watered, pocket: () => Infinity })!;
    expect(farm('A', batch.d, batch.ops)).toEqual({ ok: true });
    expect(rows().at(-1)).toEqual(queued);
    expect(queued.ops.map((o) => (o.o === 'harvest' ? o.n : 0))).toEqual([1, 2, 2, 3, 1, 3]);
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
    sql.exec("UPDATE meta SET v = ? WHERE k = 'farm'", JSON.stringify({ p: [[P1, { who: 'A', c: 'tomato', from: D3 }]], n: { A: [['goods:tomato-start', -1]] } }));
    // A's running ledger is right: judged by the field's fold, not the wrong field (its fix would write a wrong one)
    expect(store.shopCheck()).toEqual({ ok: true, farm: 'differs', A: 'same', B: 'none', G: 'none' });
    expect(store.shopCheck({ fix: true })).toMatchObject({ farm: 'differs' });
    expect(store.shopCheck()).toMatchObject({ farm: 'same', A: 'same' });
    expect(farm('A', D, [plant(P2)])).toEqual(refused('farm refused')); // taken
  });
});
