// The money app's figures (finance/balance.ts, ported from the shared-expense app's balance tests): the all-time
// balance (settlements in, deleted out), the spend figures (expenses only), the month's entries by its date's prefix,
// the day groups and the month's two sections, which partition the live entries.
import { describe, expect, it } from 'vitest';
import { finSplit, type FinEntry } from '#lib/contract/finance.ts';
import { balanceOf, deletedIn, groupByDate, initialMonth, inMonth, monthFigures, monthSections, monthsPresent, shareByPerson, spendByCategory, spendByPerson, totalSpend } from './balance.ts';
import { draftOf } from './recurring.ts';

const T = Date.parse('2026-03-20T00:00:00Z');
const expense = (id: string, amt: number, extra: Partial<FinEntry> = {}): FinEntry => ({ id, k: 'x', d: '2026-03-10', amt, payer: 'A', ps: 5000, desc: '', cat: 'Food', ...extra });
const settlement = (id: string, amt: number, extra: Partial<FinEntry> = {}): FinEntry => ({ id, k: 's', d: '2026-03-31', amt, payer: 'B', ps: 0, desc: '', cat: '', ...extra });

describe('the balance', () => {
  it('is settled for nothing, and for two mirrored expenses', () => {
    expect(balanceOf([])).toEqual({ net: 0, debtor: null, creditor: null, amt: 0 });
    expect(balanceOf([expense('a', 1000), expense('b', 1000, { payer: 'B' })])).toEqual({ net: 0, debtor: null, creditor: null, amt: 0 });
  });

  it('says who owes whom', () => {
    expect(balanceOf([expense('a', 1000)])).toEqual({ net: 500, debtor: 'B', creditor: 'A', amt: 500 });
    expect(balanceOf([expense('a', 1000, { payer: 'B' })])).toEqual({ net: -500, debtor: 'A', creditor: 'B', amt: 500 });
    expect(balanceOf([expense('a', 1000, { ps: 0 })]).net).toBe(1000);
    expect(balanceOf([expense('a', 1000, { ps: 10000 })]).net).toBe(0);
  });

  it('comes to exactly 0 when a settlement pays off what’s owed, odd amounts throughout', () => {
    const xs = [
      expense('e1', 4331),
      expense('e2', 1999, { ps: 0 }),
      expense('e3', 8049, { payer: 'B' }),
      expense('e4', 5000, { ps: 10000 })
    ];
    const before = balanceOf(xs);
    // e1: 4331 − 2166 = 2165 owed to A; e2: all 1999; e3: 8049 − 4025 = 4024 owed to B; e4: nothing
    expect(before).toEqual({ net: 2165 + 1999 - 4024, debtor: 'B', creditor: 'A', amt: 140 });
    expect(balanceOf([...xs, settlement('s1', before.amt, { payer: before.debtor! })]).net).toBe(0);
  });

  it('flips on a settlement too large, leaves a remainder on a partial one, ignores order', () => {
    const e = expense('e1', 10000);
    expect(balanceOf([e, settlement('s1', 6000)])).toMatchObject({ net: -1000, debtor: 'A', creditor: 'B' });
    expect(balanceOf([e, settlement('s1', 2000)])).toMatchObject({ net: 3000, debtor: 'B' });
    const xs = [e, expense('e2', 777, { payer: 'B', ps: 3333 }), settlement('s1', 123)];
    expect(balanceOf([...xs].reverse()).net).toBe(balanceOf(xs).net);
  });
});

describe('deleted entries count in nothing', () => {
  const xs = [expense('a', 1000), expense('b', 50000, { del: T, cat: 'Gone' })];
  it('in any figure, and only in the restore list', () => {
    expect(balanceOf(xs).net).toBe(500);
    expect(totalSpend(xs)).toBe(1000);
    expect(spendByCategory(xs)).toEqual([{ cat: 'Food', amt: 1000 }]);
    expect(spendByPerson(xs)).toEqual({ A: 1000, B: 0 });
    expect(inMonth(xs, '2026-03').map((e) => e.id)).toEqual(['a']);
    expect(groupByDate(xs).flatMap((g) => g.entries.map((e) => e.id))).toEqual(['a']);
    expect(monthsPresent([xs[1]])).toEqual([]);
  });

  it('the restore list: the month’s, the latest deleted first, not by when spent', () => {
    const ys = [
      expense('old', 1, { del: T, d: '2026-03-01' }),
      expense('new', 1, { del: T + 5000, d: '2026-03-02' }),
      expense('feb', 1, { del: T + 9000, d: '2026-02-28' }),
      expense('live', 1)
    ];
    expect(deletedIn(ys, '2026-03').map((e) => e.id)).toEqual(['new', 'old']);
    expect(deletedIn(ys, '2026-13')).toEqual([]);
    expect(ys.map((e) => e.id)).toEqual(['old', 'new', 'feb', 'live']);
  });
});

describe('settlements are transfers, not spending', () => {
  const xs = [expense('e', 3000), settlement('s', 1500, { cat: 'Food' })];
  it('out of every spend figure, in the balance, listed but not counted in their day', () => {
    expect(totalSpend(xs)).toBe(3000);
    expect(spendByCategory(xs)).toEqual([{ cat: 'Food', amt: 3000 }]);
    expect(spendByPerson(xs)).toEqual({ A: 3000, B: 0 });
    expect(balanceOf(xs).net).toBe(0);
    const day = groupByDate([settlement('s', 1500, { d: '2026-03-10' }), expense('e', 3000)])[0];
    expect(day.entries.map((e) => e.id)).toEqual(['s', 'e']);
    expect(day.total).toBe(3000);
  });
});

describe('the spend figures', () => {
  it('by category: biggest first, ties by code point, no category its own bucket, summing to the total', () => {
    const xs = [expense('a', 100, { cat: 'b' }), expense('b', 300, { cat: 'Z' }), expense('c', 100, { cat: 'a' }), expense('d', 50, { cat: '' }), expense('e', 100, { cat: 'B' })];
    expect(spendByCategory(xs)).toEqual([{ cat: 'Z', amt: 300 }, { cat: 'B', amt: 100 }, { cat: 'a', amt: 100 }, { cat: 'b', amt: 100 }, { cat: '', amt: 50 }]);
    expect(spendByCategory(xs).reduce((s, r) => s + r.amt, 0)).toBe(totalSpend(xs));
    expect(spendByCategory([])).toEqual([]);
  });

  it('by person: paid out of pocket, and each one’s share, both summing to the total exactly', () => {
    const xs = [expense('a', 1001), expense('b', 3, { payer: 'B', ps: 3333 }), expense('c', 99, { ps: 6667 }), expense('d', 12000, { payer: 'B', ps: 10000 }), expense('e', 3300, { payer: 'B', ps: 0 })];
    const paid = spendByPerson(xs), share = shareByPerson(xs);
    expect(paid).toEqual({ A: 1100, B: 15303 });
    expect(paid.A + paid.B).toBe(totalSpend(xs));
    expect(share.A + share.B).toBe(totalSpend(xs));
    expect(shareByPerson([expense('a', 1000, { ps: 0 })])).toEqual({ A: 0, B: 1000 });
    // what each paid less their share is exactly the balance those rows make
    expect(paid.A - share.A).toBe(balanceOf(xs).net);
  });
});

describe('months', () => {
  const xs = [expense('a', 1, { d: '2026-03-01' }), expense('b', 2, { d: '2026-03-31' }), expense('c', 4, { d: '2026-02-28' }), expense('d', 8, { d: '2026-04-01' }), expense('e', 16, { d: '2025-12-31' })];

  it('a month’s entries by its date’s prefix, its first and last day in, the neighbours out', () => {
    expect(inMonth(xs, '2026-03').map((e) => e.id)).toEqual(['a', 'b']);
    expect(inMonth(xs, '2026-3')).toEqual([]);
    expect(inMonth(xs, '026-03')).toEqual([]);
    expect(monthFigures(xs, '2026-03')).toEqual({ total: 3, byCat: [{ cat: 'Food', amt: 3 }], paid: { A: 3, B: 0 }, share: { A: 2, B: 1 } });
  });

  it('the months with data, newest first across a year; where to open', () => {
    expect(monthsPresent(xs)).toEqual(['2026-04', '2026-03', '2026-02', '2025-12']);
    expect(monthsPresent([])).toEqual([]);
    expect(initialMonth(xs, '2026-03')).toBeNull();
    expect(initialMonth(xs, '2026-08')).toBe('2026-04');
    expect(initialMonth([], '2026-08')).toBeNull();
  });
});

describe('the days and the month’s sections', () => {
  it('days newest first, a day by id descending whatever the order in, the input untouched', () => {
    const xs = [expense('a', 1, { d: '2026-03-02' }), expense('c', 1, { d: '2026-03-05' }), expense('b', 1, { d: '2026-03-02' })];
    const copy = [...xs];
    expect(groupByDate(xs).map((g) => [g.d, g.entries.map((e) => e.id)])).toEqual([['2026-03-05', ['c']], ['2026-03-02', ['b', 'a']]]);
    expect(xs).toEqual(copy);
    expect(groupByDate([])).toEqual([]);
  });

  it('lifts the recurring instances out of their days, every live entry in exactly one section', () => {
    const xs = [expense('rent#2026-03', 90000, { d: '2026-03-27' }), expense('x', 500, { d: '2026-03-27' }), expense('gym#2026-03', 8000, { d: '2026-03-01' }), expense('gone#2026-03', 1, { del: T })];
    const s = monthSections(xs);
    expect(s.recurring?.entries.map((e) => e.id)).toEqual(['rent#2026-03', 'gym#2026-03']);
    expect(s.recurring?.total).toBe(98000);
    expect(s.groups.flatMap((g) => g.entries.map((e) => e.id))).toEqual(['x']);
    expect(s.recurring!.total + s.groups.reduce((n, g) => n + g.total, 0)).toBe(totalSpend(xs));
  });

  it('null with no recurring row; the drafts carried apart, in no total', () => {
    expect(monthSections([expense('x', 1)]).recurring).toBeNull();
    const draft = draftOf({ id: 'gas', desc: 'Gas', cat: 'Home', payer: 'B', amt: null, ps: null, months: [], day: 10, from: '2026-01', to: null }, '2026-03');
    const s = monthSections([expense('x', 1)], [draft]);
    expect(s.recurring).toEqual({ entries: [], unpaid: [draft], total: 0 });
    expect(s.groups).toHaveLength(1);
  });
});

describe('end to end: a month of shared life', () => {
  const xs = [
    expense('g1', 8735, { d: '2026-03-02', cat: 'Food' }),
    expense('d1', 6200, { d: '2026-03-05', payer: 'B', cat: 'Eating out' }),
    expense('h1', 4999, { d: '2026-03-07', cat: 'Home' }),
    expense('solo', 12000, { d: '2026-03-08', payer: 'B', cat: 'Other', ps: 10000 }),
    expense('gift', 3300, { d: '2026-03-09', payer: 'B', cat: 'Other', ps: 0 }),
    expense('void', 50000, { d: '2026-03-09', cat: 'Eating out', del: T }),
    expense('feb', 1000, { d: '2026-02-27', cat: 'Eating out' })
  ];

  it('the month’s spend leaves out the deleted and the other months', () => {
    const march = inMonth(xs, '2026-03');
    expect(totalSpend(march)).toBe(8735 + 6200 + 4999 + 12000 + 3300);
    expect(spendByCategory(march).map((r) => r.cat)).toEqual(['Other', 'Food', 'Eating out', 'Home']);
    expect(spendByPerson(march)).toEqual({ A: 8735 + 4999, B: 6200 + 12000 + 3300 });
  });

  it('settling one month doesn’t zero the whole history', () => {
    const march = inMonth(xs, '2026-03');
    const b = balanceOf(march);
    const payoff = settlement('payoff', b.amt, { payer: b.debtor! });
    expect(balanceOf([...march, payoff]).net).toBe(0);
    expect(balanceOf([...xs, payoff]).net).toBe(finSplit(1000, 5000).otherYen);
  });
});
