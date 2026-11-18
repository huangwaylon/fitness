// The かいがら wallet (docs/backend.md#the-wallet, store.ts shopState): the running ledger's `h`, the stored number the
// phones show. Moved only by the step of each new row kept (never below 0: the user, 2026-11-18), never folded again
// once kept (not by a load, a re-check or a rule change), seeded from the fold only when there's none; served with
// the snapshots and the acks; the admin's wallet / walletset / walletcheck.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { sellPrice } from '../../app/src/lib/contract/shop.ts';
import { buyPrice, stockOf } from '../../app/src/lib/contract/stock.ts';
import { FARM } from '../../app/src/lib/contract/farm.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
type W = 'A' | 'B' | 'G';
const WHO: W[] = ['A', 'B', 'G'];
// 2026-11-04 12:00 Tokyo
const T0 = Date.parse('2026-11-04T03:00:00.000Z');
const DAY = 86_400_000;
const D = '2026-11-04';
const K = sellPrice('fish:koi')!, WS = sellPrice('fish:whale-shark')!;
const tokyo = (t: number) => new Date(t + 9 * 3_600_000).toISOString().slice(0, 10);

/** A seeded random (mulberry32): the same sequence each run. */
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
  const store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => (box.now += 10), notify: () => {} });
  let n = 0;
  const send = (who: W, type: string, data: object, id = `w${++n}`) => store.handle({ key: keyOf[who], action: 'event', id, type, data }, 100) as Record<string, any>;
  const batch = (who: W, events: { type: string; data: object }[]) =>
    store.handle({ key: keyOf[who], action: 'events', events: events.map((e) => ({ id: `w${++n}`, ...e })) }, 100) as Record<string, any>;
  const snap = (who: W, since?: string) => store.handle({ key: keyOf[who], action: 'snapshot', ...(since ? { since } : {}) }, 100) as Record<string, any>;
  /** The served wallets (a member's first fetch: everyone's). */
  const served = () => snap('A').wallets as Record<W, { h: number; seq: number }>;
  /** The full fold of `who`'s rows, unfloored (store.ts shopFold). */
  const fold = (who: W) => (store as unknown as { shopFold(w: W): { l: { shells: number } } }).shopFold(who).l.shells;
  const ledger = (who: W) => JSON.parse((db.db.prepare('SELECT v FROM meta WHERE k = ?').get(`shop|${who}`) as { v: string }).v) as Record<string, any>;
  return { box, db, store, send, batch, snap, served, fold, ledger };
}

describe('the wallet, property: after every step the served h is the fold with the floor in order', () => {
  // the oracle: h₀ = 0; a step moves it by the full fold's change (F after − F before, the rows' sum unfloored), never
  // below 0; a load never moves it. The record's running ledger works its step out by the same rules from its own
  // state, so the two agree only if every path keeps that state the fold's (review 11/18: tally repays, farm, undo…).
  const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
  const STEPS = 260;
  const totals = { floors: 0, loads: 0, unadjusts: 0, rewards: 0, farms: 0, backs: 0, kept: 0 };

  for (const seed of SEEDS)
    it(`seed ${seed}: ${STEPS} random steps (tallies, give-backs, sells, buys, starts, rewards, farm, adjust/unadjust, loads, days)`, () => {
      const r = rand(seed);
      const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
      const t = setup();
      const species = ['fish:koi', 'fish:whale-shark', 'bug:common-butterfly'];
      const tallies: Record<string, Record<string, number>> = {}, backs: Record<string, Record<string, number>> = {};
      const adjusts: string[] = [];
      const plots = ['fd:f.0.0', 'fd:f.1.0', 'fd:f.2.0', 'fd:f.3.0'];
      let loadN = 0, adjN = 0;
      const expected: Record<W, number> = { A: 0, B: 0, G: 0 };
      let last = t.served();
      expect(last).toEqual({ A: { h: 0, seq: 0 }, B: { h: 0, seq: 0 }, G: { h: 0, seq: 0 } });
      for (let step = 0; step < STEPS; step++) {
        // (a few seconds a step: the keys' rate limit, store.ts RATE_PER_MINUTE)
        t.box.now += 5000;
        const before = { A: t.fold('A'), B: t.fold('B'), G: t.fold('G') };
        const who = pick(WHO), today = tokyo(t.box.now + 20);
        const x = r();
        let load = false;
        if (x < 0.22) {
          // a tally: today's counts grow
          const key = `${who}|${today}`, s = pick(species);
          const c = (tallies[key] ??= {});
          c[s] = (c[s] ?? 0) + 1 + Math.floor(r() * 4);
          t.send(who, 'tally', { date: today, counts: { ...c } });
        } else if (x < 0.30) {
          // a give-back of a day's catches (a claim race lost): at most its tally
          const key = `${who}|${today}`, c = tallies[key];
          if (c) {
            const s = pick(Object.keys(c)), b = (backs[key] ??= {});
            b[s] = Math.min(c[s], (b[s] ?? 0) + 1 + Math.floor(r() * 3));
            if (t.send(who, 'tally_back', { date: today, counts: { ...b } }).ok) totals.backs++;
          }
        } else if (x < 0.48) {
          const s = pick(species), k = 1 + Math.floor(r() * 3);
          t.send(who, 'sell', { species: s, n: k, v: k * sellPrice(s)! });
        } else if (x < 0.58) {
          const item = pick(stockOf(today).slice(0, 8));
          if (t.send(who, 'buy', { item, price: buyPrice(item)!, d: today }).ok) totals.kept++;
        } else if (x < 0.63) {
          const k = 1 + Math.floor(r() * 2);
          t.send(who, 'buy_starts', { crop: 'tomato', n: k, v: k * FARM.startBuy });
        } else if (x < 0.70) {
          const p = pick(plots), o = pick(['plant', 'plant', 'harvest', 'dig']);
          const op = o === 'plant' ? { o, p, c: 'tomato', src: 'start' } : o === 'harvest' ? { o, p, n: 1 } : { o, p };
          if (t.send(who, 'farm', { d: today, ops: [op] }).ok) totals.farms++;
        } else if (x < 0.77) {
          // 英語すごろく's reward: several recipients, a game paying each once (its id from a small pool)
          const to = WHO.filter(() => r() < 0.6);
          if (to.length && t.send(who, 'sg_reward', { g: `sg-game-${String(Math.floor(r() * 6)).padStart(4, '0')}`, v: 1 + Math.floor(r() * 1000), to, d: today }).ok) totals.rewards++;
        } else if (x < 0.83) {
          const id = `adj-${seed}-${++adjN}`;
          const v = (r() < 0.5 ? -1 : 1) * (1 + Math.floor(r() * 3000));
          expect(t.store.adjust({ id, who, v, note: 'property' })).toMatchObject({ ok: true });
          adjusts.push(id);
        } else if (x < 0.86) {
          if (adjusts.length) {
            const id = adjusts.splice(Math.floor(r() * adjusts.length), 1)[0];
            expect(t.store.unadjust({ id })).toMatchObject({ ok: true });
            totals.unadjusts++;
          }
        } else if (x < 0.90) {
          // a load: rows older than the record's (a dump's), never moving a wallet
          load = true;
          const at = new Date(T0 - DAY + ++loadN).toISOString();
          const row = r() < 0.5
            ? [at, who, `ld-${seed}-${loadN}`, 'tally', JSON.stringify({ date: '2026-11-02', counts: { [pick(species)]: 1 + loadN } })]
            : [at, who, `ld-${seed}-${loadN}`, 'shop_adjust', JSON.stringify({ v: 1 + Math.floor(r() * 500), note: 'loaded' })];
          expect(t.store.load({ rows: { events: [row] } })).toMatchObject({ ok: true });
          totals.loads++;
        } else if (x < 0.93) {
          t.box.now += DAY;
        } else {
          // a batch of sells (全部売る) and a group of buys (ぜんぶ かう)
          const s = pick(species);
          t.batch(who, [{ type: 'sell', data: { species: s, n: 1, v: sellPrice(s)! } }, { type: 'sell', data: { species: s, n: 1, v: sellPrice(s)! } }]);
          const g = `grp-${seed}-${step}`;
          t.store.handle({ key: keyOf[who], action: 'events', events: stockOf(today).slice(8, 10).map((item, i) => ({ id: `${g}-${i}`, group: g, type: 'buy', data: { item, price: buyPrice(item)!, d: today } })) }, 100);
        }
        const now = t.served();
        for (const w of WHO) {
          if (!load) {
            const raw = expected[w] + t.fold(w) - before[w];
            if (raw < 0) totals.floors++;
            expected[w] = Math.max(0, raw);
          }
          expect(now[w].h, `seed ${seed} step ${step} ${w}`).toBe(expected[w]);
          // (a change counted exactly when the wallet moved)
          expect(now[w].seq > last[w].seq, `seed ${seed} step ${step} ${w} seq`).toBe(now[w].h !== last[w].h);
        }
        last = now;
      }
      // the pockets' part stays the fold's all along (only the wallets may differ, by the floor and the loads)
      for (const w of WHO) {
        const c = t.store.shopCheck()[w];
        expect(c === 'same' || (c as { differs: string[] }).differs.every((k) => k === 'h' || k === 'stale'), `${seed} ${w} ${JSON.stringify(c)}`).toBe(true);
      }
    });

  it('the sequences took every path: floors, loads, undos, rewards, the field, give-backs, buys', () => {
    for (const [k, v] of Object.entries(totals)) expect(v, k).toBeGreaterThan(0);
  });
});

describe('the wallet', () => {
  let t: ReturnType<typeof setup>;
  beforeEach(() => {
    t = setup();
  });
  const koi = (who: W, k: number, date = D) => {
    t.send(who, 'tally', { date, counts: { 'fish:koi': k } });
    return t.send(who, 'sell', { species: 'fish:koi', n: k, v: k * K });
  };

  it('a give-back after the かいがら were spent floors at 0, never below; a later catch repays the debt', () => {
    const item = stockOf(D)[0], price = buyPrice(item)!, k = Math.ceil(price / WS);
    t.send('A', 'tally', { date: D, counts: { 'fish:whale-shark': k } });
    t.send('A', 'sell', { species: 'fish:whale-shark', n: k, v: k * WS });
    expect(t.send('A', 'buy', { item, price, d: D })).toMatchObject({ ok: true });
    const left = k * WS - price;
    expect(t.served().A.h).toBe(left);
    t.send('A', 'tally_back', { date: D, counts: { 'fish:whale-shark': k } });
    expect(t.fold('A')).toBe(left - k * WS); // the rows' sum below 0
    expect(t.served().A).toEqual({ h: 0, seq: 3 }); // the wallet stops at 0
    expect(t.store.walletCheck().drift).toEqual([]); // (judged against the fold floored)
    // the catch made good: the debt's かいがら back, on the 0
    t.send('A', 'tally', { date: D, counts: { 'fish:whale-shark': 2 * k } });
    expect(t.served().A.h).toBe(k * WS);
  });

  it('a snapshot carries the wallets on a first fetch and with rows; a poll with nothing new carries none; the guest only its own', () => {
    koi('A', 2);
    const first = t.snap('A');
    expect(first.wallets).toEqual({ A: { h: 2 * K, seq: 1 }, B: { h: 0, seq: 0 }, G: { h: 0, seq: 0 } });
    const since = first.rows.events.at(-1)[0];
    expect(t.snap('A', since).wallets).toBeUndefined();
    koi('B', 1);
    expect(t.snap('A', since).wallets).toMatchObject({ B: { h: K, seq: 1 } });
    expect(t.snap('G').wallets).toEqual({ G: { h: 0, seq: 0 } });
    // paged: each page with rows
    expect(t.store.handle({ key: KEY_B, action: 'snapshot', page: 1 }, 100)).toMatchObject({ wallets: { B: { h: K } }, next: expect.any(String) });
  });

  it('an op’s ack carries the wallets it may have moved, kept or refused; a reward each recipient’s', () => {
    expect(koi('A', 3)).toEqual({ ok: true, wallets: { A: { h: 3 * K, seq: 1 } } });
    const item = stockOf(D).find((i) => buyPrice(i)! > 3 * K)!;
    expect(t.send('A', 'buy', { item, price: buyPrice(item)!, d: D })).toEqual({ ok: false, error: 'bad_request', detail: 'wallet short', wallets: { A: { h: 3 * K, seq: 1 } } });
    expect(t.send('A', 'pref', { key: 'moveGoal', value: 500 })).toEqual({ ok: true }); // (not the ledger's)
    const r = t.batch('B', [{ type: 'sg_reward', data: { g: 'sg-game-0001', v: 50, to: ['A', 'G'], d: D } }]);
    expect(r).toEqual({ ok: true, results: [expect.objectContaining({ ok: true })], wallets: { A: { h: 3 * K + 50, seq: 2 }, G: { h: 50, seq: 1 } } });
    // the guest's ack: only its own
    expect(t.batch('G', [{ type: 'sg_reward', data: { g: 'sg-game-0002', v: 5, to: ['A', 'G'], d: D } }]).wallets).toEqual({ G: { h: 55, seq: 2 } });
  });

  it('a load never moves a wallet, its rows the pockets’ only; walletcheck says so, walletset settles it with one row', () => {
    koi('A', 4);
    t.store.adjust({ id: 'adj-1', who: 'A', v: 1000, note: 'x' });
    const h = 4 * K + 1000;
    expect(t.served().A.h).toBe(h);
    const at = new Date(T0 - DAY).toISOString();
    expect(t.store.load({ rows: { events: [[at, 'A', 'ld-1', 'tally', JSON.stringify({ date: '2026-11-02', counts: { 'fish:koi': 6 } })], [at, 'A', 'ld-2', 'sell', JSON.stringify({ species: 'fish:koi', n: 6, v: 6 * K })]] } })).toMatchObject({ ok: true, events: 2 });
    expect(t.served().A).toMatchObject({ h, seq: 2 });
    expect(t.store.walletCheck()).toEqual({ ok: true, drift: [{ who: 'A', stored: h, fold: h + 6 * K }] });
    // the pocket folded again, the wallet as it was: the loaded koi are sold (the pocket empty), their かいがら not added
    expect(koi('A', 1)).toMatchObject({ ok: false, detail: 'pocket short' });
    // the admin keeps the stored number: the rows are made to say it
    expect(t.store.walletSet({ id: 'ws-1', who: 'A', h, note: 'stored wins' })).toMatchObject({ ok: true, v: -6 * K, before: h, after: h });
    expect(t.store.walletCheck().drift).toEqual([]);
    expect(t.store.walletSet({ id: 'ws-2', who: 'A', h, note: 'again' })).toEqual({ ok: true, same: true, h });
    expect(t.store.walletSet({ id: 'ws-3', who: 'A', h: h + 200_000, note: 'too far' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(t.store.walletSet({ id: 'ws-4', who: 'A', h: -1, note: 'x' })).toEqual({ ok: false, error: 'bad_request' });
    expect(t.served().A).toMatchObject({ h, seq: 2 });
  });

  it('a load into an empty record seeds the wallets from its rows, though a read seeded them from nothing before', () => {
    expect(t.served().A).toEqual({ h: 0, seq: 0 }); // (a phone's first fetch on the new record)
    const at = new Date(T0 - DAY).toISOString();
    expect(t.store.load({ rows: { events: [[at, 'A', 'ld-e', 'shop_adjust', JSON.stringify({ v: 500, note: 'dump' })]] } })).toMatchObject({ ok: true, events: 1 });
    expect(t.served().A.h).toBe(500);
    expect(t.store.walletCheck().drift).toEqual([]);
  });

  it('adjust then unadjust: the wallet +v then back, its seq counting both; a correction past 0 stops at 0', () => {
    koi('B', 1);
    const w0 = t.served().B;
    expect(t.store.adjust({ id: 'adj-p', who: 'B', v: 1, note: 'test' })).toMatchObject({ ok: true, before: K, after: K + 1 });
    expect(t.served().B).toEqual({ h: K + 1, seq: w0.seq + 1 });
    expect(t.store.unadjust({ id: 'adj-p' })).toMatchObject({ ok: true, who: 'B', before: K + 1, after: K });
    expect(t.served().B).toEqual({ h: K, seq: w0.seq + 2 });
    expect(t.store.walletCheck().drift).toEqual([]);
    expect(t.store.adjust({ id: 'adj-n', who: 'B', v: -(K + 50), note: 'past 0' })).toMatchObject({ ok: true, after: 0 });
  });

  it('a ledger an older relay kept (no n, t) keeps its h: a rollback and back never moves a wallet', () => {
    koi('A', 2);
    // (the older relay's JSON: the same ledger without the wallet's fields, its h moved by its own steps)
    const { n: _n, t: _t, ...old } = t.ledger('A');
    t.db.db.prepare('UPDATE meta SET v = ? WHERE k = ?').run(JSON.stringify({ ...old, h: 2 * K + 7 }), 'shop|A');
    expect(t.served().A).toEqual({ h: 2 * K + 7, seq: 0 });
    koi('A', 1, '2026-11-03');
    expect(t.served().A).toEqual({ h: 3 * K + 7, seq: 1 });
  });

  it('the guest’s drift (2026-11-18): a ledger kept before the rewards (no `g`) took no correction; now it is seeded from the fold, the correction in it', () => {
    // the guest's last op before ac2aac745 (`g` added): its ledger without `g`, which that relay couldn't read, so
    // shopNote skipped the admin's +19,800 and shopcheck said `differs` (stored 2,084, fold 21,884)
    koi('G', 2);
    const { g: _g, n: _n, t: _t, ...old } = t.ledger('G');
    t.db.db.prepare('UPDATE meta SET v = ? WHERE k = ?').run(JSON.stringify(old), 'shop|G');
    expect(t.store.shopCheck().G).toMatchObject({ differs: ['stale', 'h'], h: [null, 2 * K] });
    expect(t.store.adjust({ id: 'adj-g', who: 'G', v: 19_800, note: 'last sale → 20,000' })).toMatchObject({ ok: true, before: 2 * K, after: 2 * K + 19_800 });
    expect(t.served().G.h).toBe(2 * K + 19_800);
    expect(t.store.shopCheck().G).toBe('same');
    expect(t.store.walletCheck().drift).toEqual([]);
  });

  it('a pocket the rules can’t read any more (a rule change) is folded again, the wallet kept as it was', () => {
    koi('A', 2);
    t.store.adjust({ id: 'adj-r', who: 'A', v: 300, note: 'x' });
    const led = t.ledger('A');
    // (as a rule change would find it: an old goal fruit's key)
    t.db.db.prepare('UPDATE meta SET v = ? WHERE k = ?').run(JSON.stringify({ ...led, c: [['goods:apple', 1], ...led.c], h: 999 }), 'shop|A');
    expect(t.served().A).toEqual({ h: 999, seq: led.n });
    expect(t.ledger('A').c).toEqual(led.c);
  });

  it('the admin’s wallet: each person’s h, seq, at and the fold beside it', () => {
    koi('A', 1);
    expect(t.store.wallets()).toEqual({ ok: true, A: { h: K, seq: 1, at: expect.any(String), fold: K }, B: { h: 0, seq: 0, at: expect.any(String), fold: 0 }, G: { h: 0, seq: 0, at: expect.any(String), fold: 0 } });
  });
});
