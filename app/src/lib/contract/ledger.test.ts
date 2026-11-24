// The stored ledger's step (contract/ledger.ts): the same pocket, かいがら, pieces and games as the fold it replaces
// (contract/shop.ts shopLedger over caughtOf) and the same ずかん totals (model/tally.ts tallyTotals), op by op; a
// give-back owes nothing; the parts round-trip as JSON.
import { describe, expect, it } from 'vitest';
import { caughtOf, isPocketKey, isSellable, shopLedger, shopRefusal, type ShopRow } from './shop.ts';
import { copyLedger, emptyLedger, ledgerStep, partInto, partJson, pruneGames, tallyStep, LEDGER_PARTS, type LedgerPart } from './ledger.ts';
import { mergeTally, type Tally } from './tally.ts';
import { seeded } from '../random.ts';
import { tallyTotals } from '../model/tally.ts';

const KEYS = ['fish:koi', 'fish:sea-bass', 'bug:ant', 'shell:coral', 'goods:wood', 'goods:apple', 'goods:tomato-start', 'item:froggy-chair', 'recipe:log-stool'];
const ITEMS = ['f3672', 'f7047', 'f1001'];

describe('ledgerStep and tallyStep against the fold', () => {
  it('leave the pocket, かいがら, pieces, games and ずかん totals the fold of the same rows does (200 seeded histories)', () => {
    for (let seed = 0; seed < 200; seed++) {
      const r = seeded(`ledger-${seed}`);
      const l = emptyLedger();
      const days = new Map<string, Tally>();
      const rows: ShopRow[] = [];
      for (let i = 0; i < 60; i++) {
        const x = r();
        if (x < 0.35) {
          // a day's tally sent again, grown (or a stale lower one: it adds nothing)
          const date = `2026-11-${String(1 + Math.floor(r() * 5)).padStart(2, '0')}`;
          const sent: Tally = { [KEYS[Math.floor(r() * KEYS.length)]]: 1 + Math.floor(r() * 9) };
          const held = days.get(date) ?? null;
          const kept = held ? mergeTally(held, sent) : sent;
          tallyStep(l, kept, held, false);
          days.set(date, kept);
          continue;
        }
        // (the fold's tallies as they stand; a row the ledger refuses the record never keeps, so the fold never sees it)
        const { caught } = caughtOf([...days.values()].map((counts) => ({ counts })));
        const row: ShopRow =
          x < 0.65 ? { type: 'sell', data: { species: KEYS[Math.floor(r() * 7)].replace('goods:apple', 'goods:goal-apple'), n: 1 + Math.floor(r() * 3), v: 7 } }
          : x < 0.8 ? { type: 'buy', data: { item: ITEMS[Math.floor(r() * ITEMS.length)], price: 5 + Math.floor(r() * 20), d: '2026-11-03' } }
          : x < 0.9 ? { type: 'starts', data: { crop: 'tomato', n: 1, v: 14 } }
          : { type: 'reward', data: { g: `game-${Math.floor(r() * 4)}`, v: 30, to: ['A'], d: '2026-11-03' } };
        const why = ledgerStep(l, row, i);
        expect(why, `seed ${seed} op ${i}`).toBe(shopRefusal(shopLedger(caught, rows), caught, row));
        if (!why) rows.push(row);
        const fold = shopLedger(caught, rows);
        // the pocket: the fold's caught less sold, the positive ones of a pocket's kind
        const want = new Map<string, number>();
        for (const k of new Set([...caught.keys(), ...fold.sold.keys()])) {
          const n = (caught.get(k) ?? 0) - (fold.sold.get(k) ?? 0);
          if (n > 0 && isPocketKey(k)) want.set(k, n);
        }
        expect(new Map([...l.p].sort()), `seed ${seed} op ${i}`).toEqual(new Map([...want].sort()));
        expect(l.h).toBe(fold.shells);
        expect(l.w.map(([c]) => c)).toEqual(fold.owned);
        expect(new Set(l.g.keys())).toEqual(fold.games);
      }
      // the ずかん's totals: tallyTotals of the day rows
      const totals = tallyTotals([...days].map(([date, counts], i) => ({ at: i, person: 'A' as const, date, counts })));
      expect(new Map([...l.z].sort())).toEqual(new Map([...totals.by.A].sort()));
    }
  });

  it('a resend of a day held adds nothing; a give-back takes from the pocket and the totals, never below 0, and owes nothing', () => {
    const l = emptyLedger();
    tallyStep(l, { 'fish:koi': 2, 'item:froggy-chair': 1 }, null, false);
    tallyStep(l, { 'fish:koi': 2, 'item:froggy-chair': 1 }, { 'fish:koi': 2, 'item:froggy-chair': 1 }, false);
    expect([...l.p]).toEqual([['fish:koi', 2]]);
    expect(new Map(l.z)).toEqual(new Map([['fish:koi', 2], ['item:froggy-chair', 1]]));
    expect(ledgerStep(l, { type: 'sell', data: { species: 'fish:koi', n: 2, v: 4000 } }, 1)).toBeNull();
    // (a claim race lost after the sale: the pocket is empty, the かいがら stay)
    tallyStep(l, { 'fish:koi': 1 }, null, true);
    expect(l.p.size).toBe(0);
    expect(l.h).toBe(4000);
    expect(new Map(l.z)).toEqual(new Map([['fish:koi', 1], ['item:froggy-chair', 1]]));
  });

  it('refuses as the record does: pocket, owned, wallet, paid; a correction never, and never below 0', () => {
    const l = emptyLedger();
    expect(ledgerStep(l, { type: 'sell', data: { species: 'fish:koi', n: 1, v: 2000 } }, 1)).toBe('pocket');
    expect(ledgerStep(l, { type: 'buy', data: { item: 'f3672', price: 6, d: '2026-11-03' } }, 1)).toBe('wallet');
    expect(ledgerStep(l, { type: 'reward', data: { g: 'game-1', v: 10, to: ['A'], d: '2026-11-03' } }, 1)).toBeNull();
    expect(ledgerStep(l, { type: 'reward', data: { g: 'game-1', v: 10, to: ['A'], d: '2026-11-03' } }, 2)).toBe('paid');
    expect(ledgerStep(l, { type: 'buy', data: { item: 'f3672', price: 6, d: '2026-11-03' } }, 3)).toBeNull();
    expect(ledgerStep(l, { type: 'buy', data: { item: 'f3672', price: 6, d: '2026-11-03' } }, 4)).toBe('owned');
    expect(l.w).toEqual([['f3672', 3]]);
    expect(ledgerStep(l, { type: 'adjust', data: { v: -100, note: 'x' } }, 5)).toBeNull();
    expect(l.h).toBe(0);
  });

  it('lets a game go GAMES_KEEP_DAYS after its day', () => {
    const l = emptyLedger();
    l.g.set('old', '2026-10-01').set('new', '2026-11-20');
    expect(pruneGames(l, '2026-11-24')).toBe(true);
    expect([...l.g.keys()]).toEqual(['new']);
    expect(pruneGames(l, '2026-11-24')).toBe(false);
  });

  it('round-trips each part as JSON, and refuses what isn’t one', () => {
    const l = emptyLedger();
    l.h = 12;
    l.p.set('fish:koi', 2);
    l.w.push(['f1', 5]);
    l.g.set('g-1', '2026-11-20');
    l.z.set('item:x', 3);
    const back = emptyLedger();
    for (const part of LEDGER_PARTS) expect(partInto(back, part, JSON.parse(JSON.stringify(partJson(l, part))))).toBe(true);
    expect(back).toEqual(copyLedger(l));
    const bad: [LedgerPart, unknown][] = [['hp', { h: -1, p: [] }], ['hp', { h: 1, p: [['k', 0]] }], ['w', [['f1']]], ['g', [['g', 'x']]], ['z', {}]];
    for (const [part, x] of bad) expect(partInto(back, part, x), part).toBe(false);
    expect(isSellable('fish:koi')).toBe(true);
  });
});
