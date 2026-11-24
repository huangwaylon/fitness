// The stored ledger in shadow (docs/backend.md#the-ledger, store.ts ledgerReady / ledgerNote / ledgerCheck,
// ledger.ts): seeded from the running ledger at a person's first op, stepped by every op the record keeps, the same
// numbers as the running one and the rows after every step (no drift), its log chained; a give-back after a sale
// owes nothing (its only difference, by the user's rule of 2026-11-24); a dump's ledger loads as it was.
import { describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { sellPrice } from '../../app/src/lib/contract/shop.ts';
import { buyPrice, stockOf } from '../../app/src/lib/contract/stock.ts';
import { FARM } from '../../app/src/lib/contract/farm.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64), KEY_B = 'b'.repeat(64), KEY_C = 'c'.repeat(64);
const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
type W = 'A' | 'B' | 'G';
const WHO: W[] = ['A', 'B', 'G'];
const T0 = Date.parse('2026-11-04T03:00:00.000Z');
const DAY = 86_400_000;
const K = sellPrice('fish:koi')!;
const tokyo = (t: number) => new Date(t + 9 * 3_600_000).toISOString().slice(0, 10);

function rand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function setup() {
  const box = { now: T0 };
  const db = memSql();
  const logs: { e: string; d: Record<string, unknown> }[] = [];
  const store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (box.now += 10), notify: () => {}, log: (e, d) => logs.push({ e, d }) });
  let n = 0;
  const send = (who: W, type: string, data: object) => store.handle({ key: keyOf[who], action: 'event', id: `l${++n}`, type, data }, 100) as Record<string, any>;
  const read = () => store.ledgerRead() as Record<string, any>;
  return { box, db, store, send, read, logs };
}

describe('the stored ledger', () => {
  for (const seed of [1, 2, 3, 4, 5, 6])
    it(`seed ${seed}: 200 random ops leave it the rows' fold after every step, its log chained`, () => {
      const r = rand(seed);
      const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
      const t = setup();
      const species = ['fish:koi', 'fish:whale-shark', 'bug:common-butterfly', 'item:froggy-chair'];
      const tallies: Record<string, Record<string, number>> = {};
      const plots = ['fd:f.0.0', 'fd:f.1.0', 'fd:f.2.0'];
      const adjusts: [string, number][] = [];
      let adjN = 0;
      for (let step = 0; step < 200; step++) {
        t.box.now += 5000;
        const who = pick(WHO), today = tokyo(t.box.now + 20), x = r();
        if (x < 0.3) {
          const key = `${who}|${today}`, s = pick(species), c = (tallies[key] ??= {});
          c[s] = (c[s] ?? 0) + 1 + Math.floor(r() * 4);
          // (sometimes a stale lower resend first: it adds nothing)
          if (r() < 0.2) t.send(who, 'tally', { date: today, counts: { [s]: 1 } });
          t.send(who, 'tally', { date: today, counts: { ...c } });
        } else if (x < 0.5) {
          const s = pick(species.slice(0, 3)), k = 1 + Math.floor(r() * 3);
          t.send(who, 'sell', { species: s, n: k, v: k * sellPrice(s)! });
        } else if (x < 0.6) {
          const item = pick(stockOf(today).slice(0, 6));
          t.send(who, 'buy', { item, price: buyPrice(item)!, d: today });
        } else if (x < 0.66) {
          t.send(who, 'buy_starts', { crop: 'tomato', n: 2, v: 2 * FARM.startBuy });
        } else if (x < 0.76) {
          const p = pick(plots), o = pick(['plant', 'plant', 'harvest', 'dig']);
          t.send(who, 'farm', { d: today, ops: [o === 'plant' ? { o, p, c: 'tomato', src: 'start' } : o === 'harvest' ? { o, p, n: 1 } : { o, p }] });
        } else if (x < 0.84) {
          const to = WHO.filter(() => r() < 0.6);
          if (to.length) t.send(who, 'sg_reward', { g: `sg-game-${String(Math.floor(r() * 5)).padStart(4, '0')}`, v: 1 + Math.floor(r() * 900), to, d: today });
        } else if (x < 0.9) {
          const id = `adj-${seed}-${++adjN}`, v = (r() < 0.5 ? -1 : 1) * (1 + Math.floor(r() * 3000));
          t.store.adjust({ id, who, v, note: 'p' });
          adjusts.push([id, v]);
        } else if (x < 0.93) {
          // (a correction undone: another of −v)
          if (adjusts.length) {
            const [id, v] = adjusts.splice(Math.floor(r() * adjusts.length), 1)[0];
            t.store.adjust({ id: `un-${id}`, who: pick(WHO), v: -v, note: 'p' });
          }
        } else if (x < 0.96) {
          t.store.walletSet({ id: `ws-${seed}-${step}`, who, h: Math.floor(r() * 5000), note: 'p' });
        } else t.box.now += DAY;
        const c = t.store.ledgerCheck();
        expect(c.drift, `seed ${seed} step ${step}`).toEqual([]);
        // the stored かいがら are the served wallets'
        const served = (t.store.handle({ key: KEY_A, action: 'snapshot' }, 100) as Record<string, any>).wallets;
        const l = t.read();
        for (const w of WHO) if (l[w]) expect(l[w].hp.v.h, `seed ${seed} step ${step} ${w}`).toBe(served[w].h);
      }
      expect(t.logs.filter((x) => x.e === 'ledger.drift')).toEqual([]);
      expect(t.logs.filter((x) => x.e === 'ledger.seed').length).toBeGreaterThan(0);
    });

  it('seeds a person from the running ledger at their first op, before the op goes in, and logs its ops', () => {
    const t = setup();
    t.send('A', 'tally', { date: '2026-11-04', counts: { 'fish:koi': 3, 'item:froggy-chair': 1 } });
    expect(t.read().A.hp.v).toEqual({ h: 0, p: [['fish:koi', 3]] });
    expect(t.read().A.z.v).toEqual([['fish:koi', 3], ['item:froggy-chair', 1]]);
    expect(t.send('A', 'sell', { species: 'fish:koi', n: 2, v: 2 * K }).ok).toBe(true);
    expect(t.read().A.hp).toMatchObject({ seq: 3, v: { h: 2 * K, p: [['fish:koi', 1]] } });
    // (z untouched by a sale: its seq still the seed's and the tally's)
    expect(t.read().A.z.seq).toBe(2);
    const log = (t.store.ledgerRead({ log: 'A' }) as { log: { type: string; h0: number; h1: number }[] }).log;
    expect(log.map((x) => [x.type, x.h0, x.h1])).toEqual([['sell', 0, 2 * K], ['tally', 0, 0]]);
    expect(t.logs.filter((x) => x.e === 'ledger.seed')).toEqual([{ e: 'ledger.seed', d: { who: 'A', h: 0, p: 0, w: 0, z: 0 } }]);
  });

  it('the daily check seeds a person with none stored from their rows, and finds it their fold', () => {
    const t = setup();
    t.send('A', 'tally', { date: '2026-11-04', counts: { 'fish:koi': 2 } });
    t.db.db.exec('DELETE FROM ledger; DELETE FROM ledger_log');
    expect(t.store.ledgerCheck()).toEqual({ ok: true, drift: [], pruned: 0 });
    expect(t.read().A.hp.v).toEqual({ h: 0, p: [['fish:koi', 2]] });
    expect(t.read().B.hp.v).toEqual({ h: 0, p: [] });
  });

  it('a record from before it: each person seeded from what is kept (the かいがら as stored), not refolded', () => {
    const t = setup();
    t.send('B', 'tally', { date: '2026-11-04', counts: { 'fish:koi': 2 } });
    t.send('B', 'sell', { species: 'fish:koi', n: 1, v: K });
    // (as a relay before the ledger left it: no ledger rows)
    t.db.db.exec('DELETE FROM ledger; DELETE FROM ledger_log');
    t.send('B', 'tally', { date: '2026-11-04', counts: { 'fish:koi': 3 } });
    expect(t.read().B.hp.v).toEqual({ h: K, p: [['fish:koi', 2]] });
    expect(t.read().B.z.v).toEqual([['fish:koi', 3]]);
    expect(t.store.ledgerCheck().drift).toEqual([]);
  });

  it('a give-back after the sale owes nothing: the pocket stays empty, the かいがら stay (the user, 2026-11-24)', () => {
    const t = setup();
    t.send('A', 'tally', { date: '2026-11-04', counts: { 'fish:koi': 1 } });
    t.send('A', 'sell', { species: 'fish:koi', n: 1, v: K });
    expect(t.send('A', 'tally_back', { date: '2026-11-04', counts: { 'fish:koi': 1 } }).ok).toBe(true);
    expect(t.read().A.hp.v).toEqual({ h: K, p: [] });
    expect(t.read().A.z.v).toEqual([]);
    expect(t.store.ledgerCheck().drift).toEqual([]);
    // (the wallets an older build reads: the same かいがら)
    expect((t.store.handle({ key: KEY_A, action: 'snapshot' }, 100) as Record<string, any>).wallets.A.h).toBe(K);
  });

  it('a dump’s ledger loads as it was; a load into an empty record without one seeds again from the loaded rows', () => {
    const t = setup();
    t.send('A', 'tally', { date: '2026-11-04', counts: { 'fish:koi': 2 } });
    t.send('A', 'sell', { species: 'fish:koi', n: 1, v: K });
    const dump = t.store.dump().rows;
    expect(dump.ledger.length).toBe(4);
    expect(dump.ledger_log.length).toBe(2);
    const u = setup();
    expect(u.store.load({ rows: dump })).toMatchObject({ ok: true });
    expect(u.read()).toEqual(t.read());
    const v = setup();
    expect(v.store.load({ rows: { events: dump.events } })).toMatchObject({ ok: true });
    expect(v.read().A).toBeUndefined();
    v.store.handle({ key: KEY_A, action: 'event', id: 'after-load', type: 'tally', data: { date: '2026-11-04', counts: { 'fish:koi': 3 } } }, 100);
    expect(v.read().A.hp.v).toEqual({ h: K, p: [['fish:koi', 2]] });
  });

  it('an ack carries the parts its ops moved, each its seq; a snapshot every part on a first fetch, else those changed since; anyone’s, the guest’s phone too', () => {
    const t = setup();
    const ack = (who: W, type: string, data: object) => t.store.handle({ key: keyOf[who], action: 'events', events: [{ id: `x-${type}-${Math.random()}`, type, data }] }, 100) as Record<string, any>;
    // (the first op of A's seeds the whole: every part, then the tally's two again)
    expect(ack('A', 'tally', { date: '2026-11-04', counts: { 'fish:koi': 2 } }).ledgers).toEqual({
      A: { hp: { seq: 2, at: expect.any(String), v: { h: 0, p: [['fish:koi', 2]] } }, z: { seq: 2, at: expect.any(String), v: [['fish:koi', 2]] }, w: { seq: 1, at: expect.any(String), v: [] }, g: { seq: 1, at: expect.any(String), v: [] } }
    });
    expect(ack('A', 'sell', { species: 'fish:koi', n: 1, v: K }).ledgers).toEqual({ A: { hp: { seq: 3, at: expect.any(String), v: { h: K, p: [['fish:koi', 1]] } } } });
    // (refused: nothing moved, the かいがら and pocket as they are)
    expect(ack('A', 'sell', { species: 'fish:koi', n: 5, v: 5 * K }).ledgers).toEqual({ A: { hp: { seq: 3, at: expect.any(String), v: { h: K, p: [['fish:koi', 1]] } } } });
    expect(ack('A', 'pref', { key: 'moveGoal', value: 500 }).ledgers).toBeUndefined();
    const first = t.store.handle({ key: KEY_C, action: 'snapshot' }, 100) as Record<string, any>;
    expect(Object.keys(first.ledgers.A).sort()).toEqual(['g', 'hp', 'w', 'z']);
    expect(first.ledgers.A.hp.v).toEqual({ h: K, p: [['fish:koi', 1]] });
    const since = first.rows.events.at(-1)[0];
    expect((t.store.handle({ key: KEY_B, action: 'snapshot', since }, 100) as Record<string, any>).ledgers).toEqual({});
    t.send('B', 'tally', { date: '2026-11-04', counts: { 'bug:ant': 1 } });
    const later = t.store.handle({ key: KEY_C, action: 'snapshot', since }, 100) as Record<string, any>;
    expect(Object.keys(later.ledgers)).toEqual(['B']);
    // (paged: on the last page only, read with its rows)
    let page = t.store.handle({ key: KEY_A, action: 'snapshot', page: 1 }, 100) as Record<string, any>;
    expect(page.ledgers).toBeUndefined();
    while (page.next) page = t.store.handle({ key: KEY_A, action: 'snapshot', page: 1, after: page.next }, 100) as Record<string, any>;
    expect(Object.keys(page.ledgers).sort()).toEqual(['A', 'B']);
  });
});
