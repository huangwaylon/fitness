// The money app's figures, pure folds over entries (contract/finance.ts FinEntry), ported from the shared-expense
// app's balance.js. A deleted entry (`del`) counts in none of them. The balance is all time and counts settlements
// (they're how it comes back to 0); every spend figure is expenses only (a settlement is money moving between the two,
// not leaving the household: counted, it doubles what the expense already counted). Every share goes through finSplit,
// so the two people's parts always add back to the amount.
import { finNet, finSplit, type FinEntry } from '#lib/contract/finance.ts';
import type { PersonId } from '#lib/types.ts';
import { sumYen } from './money.ts';
import { isRecurringInstance, type FinDraft } from './recurring.ts';

/** Newest first, for keys that sort as they date: the one comparator. */
const descending = (a: string, b: string): number => (a < b ? 1 : a > b ? -1 : 0);
const live = (entries: readonly FinEntry[]): FinEntry[] => entries.filter((e) => e.del === undefined);
const expenses = (entries: readonly FinEntry[]): FinEntry[] => live(entries).filter((e) => e.k === 'x');

/** The balance: `net` from A's side (positive: B owes A), who owes whom and how much (null each when settled). */
export interface Balance {
  net: number;
  debtor: PersonId | null;
  creditor: PersonId | null;
  amt: number;
}

/** The balance over every live entry (all time: the contract's finNet). */
export function balanceOf(entries: readonly FinEntry[]): Balance {
  const net = finNet(entries);
  if (net === 0) return { net: 0, debtor: null, creditor: null, amt: 0 };
  return { net, debtor: net > 0 ? 'B' : 'A', creditor: net > 0 ? 'A' : 'B', amt: Math.abs(net) };
}

/** The money that left the household (yen): expenses only. */
export const totalSpend = (entries: readonly FinEntry[]): number => sumYen(expenses(entries).map((e) => e.amt));

/** Spend per category, biggest first, ties by code point (never localeCompare: two phones would disagree). Expenses
 *  only; no category is '' (the UI names it). */
export function spendByCategory(entries: readonly FinEntry[]): { cat: string; amt: number }[] {
  const by = new Map<string, number[]>();
  for (const e of expenses(entries)) {
    let list = by.get(e.cat);
    if (!list) by.set(e.cat, (list = []));
    list.push(e.amt);
  }
  return [...by].map(([cat, list]) => ({ cat, amt: sumYen(list) })).sort((a, b) => b.amt - a.amt || descending(b.cat, a.cat));
}

/** What each person paid out of pocket (the cash flow, not the fair share). Expenses only. */
export function spendByPerson(entries: readonly FinEntry[]): Record<PersonId, number> {
  const out = { A: 0, B: 0 };
  for (const e of expenses(entries)) out[e.payer] += e.amt;
  return out;
}

/** Each person's share once every split is applied: the two add back to totalSpend exactly (a percentage per person
 *  would invent a yen on every odd split). Expenses only. */
export function shareByPerson(entries: readonly FinEntry[]): Record<PersonId, number> {
  const out = { A: 0, B: 0 };
  for (const e of expenses(entries)) {
    const { payerYen, otherYen } = finSplit(e.amt, e.ps);
    out[e.payer] += payerYen;
    out[e.payer === 'A' ? 'B' : 'A'] += otherYen;
  }
  return out;
}

/** A month's live entries (by the date's `YYYY-MM`: a prefix, never a Date that shifts the 1st and the last). */
export const inMonth = (entries: readonly FinEntry[], month: string): FinEntry[] => live(entries).filter((e) => e.d.slice(0, 7) === month);

/** A month's figures: expenses only (the balance is all time, balanceOf). */
export function monthFigures(entries: readonly FinEntry[], month: string): { total: number; byCat: { cat: string; amt: number }[]; paid: Record<PersonId, number>; share: Record<PersonId, number> } {
  const m = inMonth(entries, month);
  return { total: totalSpend(m), byCat: spendByCategory(m), paid: spendByPerson(m), share: shareByPerson(m) };
}

/** Every month with a live entry, newest first. */
export const monthsPresent = (entries: readonly FinEntry[]): string[] => [...new Set(live(entries).map((e) => e.d.slice(0, 7)))].sort(descending);

/** The month to open on: the newest with data when `current` has none; null to stay (current has data, or nothing
 *  has). */
export function initialMonth(entries: readonly FinEntry[], current: string): string | null {
  const months = monthsPresent(entries);
  return !months.length || months.includes(current) ? null : months[0];
}

/** A month's deleted entries, the latest deleted first: the restore list (under the month switcher, so this month's). */
export const deletedIn = (entries: readonly FinEntry[], month: string): FinEntry[] =>
  entries.filter((e) => e.del !== undefined && e.d.slice(0, 7) === month).sort((a, b) => b.del! - a.del!);

/** A day's section: its live entries, by id descending (stable whatever order they came in), and its spend. */
export interface DayGroup {
  d: string;
  entries: FinEntry[];
  total: number;
}

/** Live entries by day, newest day first; a day's total its spend (settlements listed, not counted). */
export function groupByDate(entries: readonly FinEntry[]): DayGroup[] {
  const by = new Map<string, FinEntry[]>();
  for (const e of live(entries)) {
    let list = by.get(e.d);
    if (!list) by.set(e.d, (list = []));
    list.push(e);
  }
  return [...by]
    .map(([d, list]) => ({ d, entries: list.sort((a, b) => descending(a.id, b.id)), total: totalSpend(list) }))
    .sort((a, b) => descending(a.d, b.d));
}

/**
 * A month's list as its two sections: the recurring costs (the instances, lifted out of their days, and the drafts
 * still `unpaid`: not entries, in no total), then the days. One function, so the two partition: every live entry in
 * exactly one. `recurring` null when the month has neither (no heading over nothing).
 */
export function monthSections(entries: readonly FinEntry[], unpaid: readonly FinDraft[] = []): {
  recurring: { entries: FinEntry[]; unpaid: FinDraft[]; total: number } | null;
  groups: DayGroup[];
} {
  const rec: FinEntry[] = [];
  const rest: FinEntry[] = [];
  for (const e of live(entries)) (isRecurringInstance(e) ? rec : rest).push(e);
  return {
    recurring: rec.length || unpaid.length ? { entries: groupByDate(rec).flatMap((g) => g.entries), unpaid: [...unpaid], total: totalSpend(rec) } : null,
    groups: groupByDate(rest)
  };
}
