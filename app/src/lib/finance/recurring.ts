// Recurring costs: what a month says about each declaration (contract/finance.ts `fin_t`). A declaration is never a
// schedule anything runs: every instance is an entry someone records, its id the template's and the month's
// (finInstanceId), so a second tap is a no-op and a month stays recorded once its instance exists, deleted or not.
// Ported from the shared-expense app's recurring.js. Pure.
import { finInstanceId, isFinYen, isMonthKey, type FinConfig, type FinEntry, type FinTemplate } from '#lib/contract/finance.ts';
import { dayInMonth, monthNumber, shiftMonth } from './dates.ts';
import { defaultSplitFor } from './split.ts';

/** A month's entry a template would post: the form's draft. `amt` 0 for a variable cost (the form opens empty and a
 *  one-tap record refuses it: recordableEntry); `ps` null for "the payer's default". */
export type FinDraft = Omit<FinEntry, 'amt' | 'ps'> & { amt: number; ps: number | null };

/** Whether an entry is some month's instance of a recurring cost: its id `<template id>#YYYY-MM`. The id, not the
 *  templates (a deleted template's instances are still fixed costs). */
export function isRecurringInstance(e: Pick<FinEntry, 'id'>): boolean {
  const j = e.id.lastIndexOf('#');
  return j > 0 && isMonthKey(e.id.slice(j + 1));
}

/** The entry a template would post for a month. */
export function draftOf(t: FinTemplate, month: string): FinDraft {
  return { id: finInstanceId(t.id, month), k: 'x', d: dayInMonth(month, t.day), amt: t.amt ?? 0, payer: t.payer, ps: t.ps, desc: t.desc, cat: t.cat };
}

/** Whether a template applies to a month: within `from`…`to` (inclusive; months compare as strings), then its months
 *  ([] every month). A deleted template applies to none. */
function scheduledIn(t: FinTemplate, month: string): boolean {
  if (t.del !== undefined || !isMonthKey(month) || month < t.from || (t.to !== null && month > t.to)) return false;
  return t.months.length === 0 || t.months.includes(monthNumber(month)!);
}

/** What a month says about one template: whether it applies (`scheduled`), whether its instance exists (`recorded`,
 *  deleted or not), and the draft to record (null: nothing to). */
export interface RecurringRow {
  template: FinTemplate;
  scheduled: boolean;
  recorded: boolean;
  draft: FinDraft | null;
}

/** The entry ids the ledger holds: a Set, or the ledger's map itself (ledger.ts Ledger `all`). */
type Ids = { has(id: string): boolean };

/**
 * Every template with what the month says about it, in the templates' order: the one derivation of what a month has
 * and hasn't recorded. `ids`: every entry id the ledger holds, DELETED ONES TOO (the one place they count, or a
 * deleted double charge is offered again all month) and the phone's unsent ones (a second tap can't duplicate). The
 * template's day gates nothing: a cost is recordable all its month, the day only dates the instance.
 */
export function recurringRows(templates: readonly FinTemplate[], ids: Ids, month: string): RecurringRow[] {
  return templates.map((template) => {
    const scheduled = scheduledIn(template, month);
    const recorded = isMonthKey(month) && ids.has(finInstanceId(template.id, month));
    return { template, scheduled, recorded, draft: scheduled && !recorded ? draftOf(template, month) : null };
  });
}

/** The drafts a month is still missing, in the templates' order: drafts, not entries (no total counts them). */
export const unpaidRecurring = (templates: readonly FinTemplate[], ids: Ids, month: string): FinDraft[] =>
  recurringRows(templates, ids, month).flatMap((r) => (r.draft ? [r.draft] : []));

/** The entry one tap would write, its share the template's or else the PAYER's default (never an even split on an
 *  80/20 config); null when the form has to open instead (a variable amount, no category, a bad date). */
export function recordableEntry(draft: FinDraft, config: Pick<FinConfig, 'split'>): FinEntry | null {
  if (!isFinYen(draft.amt) || !draft.cat || !draft.d) return null;
  return { ...draft, ps: draft.ps ?? defaultSplitFor(config, draft.payer) };
}

/** A template retired as of `month` (its last month the one before: `to` is inclusive), never deleted: a new id
 *  would read every month it already posted as unrecorded. */
export const retiredTemplate = (t: FinTemplate, month: string): FinTemplate => ({ ...t, to: shiftMonth(month, -1) });
/** A retired template brought back. */
export const restoredTemplate = (t: FinTemplate): FinTemplate => ({ ...t, to: null });
/** Whether a cost was stopped (not the same as "not this month": a quarterly cost out of its quarter isn't). */
export const isRetired = (t: FinTemplate): boolean => t.to !== null;
