// Recurring costs (finance/recurring.ts, ported from the shared-expense app's recurring tests): the instance id and its
// draft, what a month says about each template (scheduled, recorded deleted or not, the draft), the one-tap record
// with the payer's default, retiring through `to`.
import { describe, expect, it } from 'vitest';
import type { FinEntry, FinTemplate } from '#lib/contract/finance.ts';
import { draftOf, isRecurringInstance, isRetired, recordableEntry, recurringRows, restoredTemplate, retiredTemplate, unpaidRecurring } from './recurring.ts';

const tpl = (extra: Partial<FinTemplate> = {}): FinTemplate => ({ id: 'rent', desc: 'Rent', cat: 'Home', payer: 'A', amt: 90000, ps: null, months: [], day: 27, from: '2026-01', to: null, ...extra });
const entry = (id: string, extra: Partial<FinEntry> = {}): FinEntry => ({ id, k: 'x', d: '2026-09-27', amt: 90000, payer: 'A', ps: 5000, desc: '', cat: 'Home', ...extra });
const T = Date.parse('2026-09-28T00:00:00Z');

describe('the instance', () => {
  it('takes its id from the template and the month, never from what a person edits', () => {
    expect(draftOf(tpl({ desc: 'Rent (Aug)' }), '2026-09').id).toBe('rent#2026-09');
  });

  it('is the shape the form opens on, its day clamped to the month, a variable amount empty', () => {
    expect(draftOf(tpl({ ps: 8000 }), '2026-09')).toEqual({ id: 'rent#2026-09', k: 'x', d: '2026-09-27', amt: 90000, payer: 'A', ps: 8000, desc: 'Rent', cat: 'Home' });
    expect(draftOf(tpl({ day: 31 }), '2026-02').d).toBe('2026-02-28');
    expect(draftOf(tpl({ amt: null }), '2026-09').amt).toBe(0);
  });

  it('is told apart by its id alone, the last # deciding', () => {
    for (const id of ['rent#2026-09', 'gym#1999-01', 'a#b#2026-12']) expect(isRecurringInstance({ id }), id).toBe(true);
    for (const id of ['rent', '#2026-09', 'rent#2026-13', 'rent#2026-09-01', 'rent#', 'rent-2026-09', '0b9f7a52-3c1e-4d8a-9f00-1a2b3c4d5e6f']) expect(isRecurringInstance({ id }), id).toBe(false);
  });
});

describe('recurringRows', () => {
  const templates = [tpl(), tpl({ id: 'gym', desc: 'Gym', amt: 8000, payer: 'B', day: 1 })];
  const draftIds = (ids: Iterable<string>, month: string) => unpaidRecurring(templates, new Set(ids), month).map((d) => d.id);

  it('answers for every template in order, even for a month that isn’t one', () => {
    expect(recurringRows(templates, new Set(), '2026-09').map((r) => r.template.id)).toEqual(['rent', 'gym']);
    expect(recurringRows([], new Set(), '2026-09')).toEqual([]);
    for (const month of ['', '2026-13', '2026-09-01']) {
      const rows = recurringRows(templates, new Set(), month);
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => !r.scheduled && !r.recorded && !r.draft)).toBe(true);
    }
  });

  it('offers what the month has no entry for, before its day, past and future months alike', () => {
    expect(draftIds([], '2026-09')).toEqual(['rent#2026-09', 'gym#2026-09']);
    const [rent] = recurringRows(templates, new Set(), '2026-09');
    expect(rent).toMatchObject({ scheduled: true, recorded: false });
    expect(rent.draft).toEqual(draftOf(templates[0], '2026-09'));
    expect(draftIds([], '2099-10')).toEqual(['rent#2099-10', 'gym#2099-10']);
  });

  it('counts a month recorded once its instance exists, deleted or not, unsent or not; another month’s doesn’t', () => {
    const live = entry('rent#2026-09'), gone = entry('rent#2026-09', { del: T });
    for (const e of [live, gone]) {
      const [rent] = recurringRows(templates, new Map([[e.id, e]]), '2026-09');
      expect(rent).toMatchObject({ recorded: true, draft: null });
    }
    expect(draftIds(['gym#2026-09'], '2026-09')).toEqual(['rent#2026-09']);
    expect(draftIds(['rent#2026-08'], '2026-09')).toContain('rent#2026-09');
  });

  it('honours the window (inclusive, as months) and the months list; a retired template stays listed', () => {
    const bounded = tpl({ from: '2026-04', to: '2026-08' });
    const at = (t: FinTemplate, m: string) => recurringRows([t], new Set(), m)[0].scheduled;
    expect(['2026-03', '2026-04', '2026-08', '2026-09'].map((m) => at(bounded, m))).toEqual([false, true, true, false]);
    const quarterly = tpl({ months: [1, 4, 7, 10] });
    expect(['2026-01', '2026-04', '2026-02', '2026-12'].map((m) => at(quarterly, m))).toEqual([true, true, false, false]);
    const [state] = recurringRows([tpl({ to: '2026-08' })], new Set(), '2026-09');
    expect(state).toMatchObject({ scheduled: false, draft: null, template: { id: 'rent' } });
    expect(at(tpl({ del: T }), '2026-09')).toBe(false);
  });
});

describe('recordableEntry', () => {
  const config = { split: { A: 8000, B: 2000 } };

  it('takes a blank share from the PAYER’s default, keeps a pinned one (0 too)', () => {
    expect(recordableEntry(draftOf(tpl(), '2026-09'), config)?.ps).toBe(8000);
    expect(recordableEntry(draftOf(tpl({ payer: 'B' }), '2026-09'), config)?.ps).toBe(2000);
    expect(recordableEntry(draftOf(tpl({ ps: 0 }), '2026-09'), config)?.ps).toBe(0);
    expect(recordableEntry(draftOf(tpl(), '2026-09'), config)).toMatchObject({ id: 'rent#2026-09', d: '2026-09-27' });
  });

  it('refuses a variable cost (to the form), no category, a month that isn’t one', () => {
    expect(recordableEntry(draftOf(tpl({ amt: null }), '2026-09'), config)).toBeNull();
    expect(recordableEntry(draftOf(tpl({ cat: '' }), '2026-09'), config)).toBeNull();
    expect(recordableEntry(draftOf(tpl(), '2026-13'), config)).toBeNull();
  });
});

describe('retiring and restoring', () => {
  it('ends the template as of last month, keeping its id; restores by clearing `to`; never mutates', () => {
    const t = tpl();
    const r = retiredTemplate(t, '2026-09');
    expect(r).toEqual({ ...t, to: '2026-08' });
    expect(isRetired(r)).toBe(true);
    expect(retiredTemplate(t, '2026-01').to).toBe('2025-12');
    expect(restoredTemplate(r)).toEqual(t);
    expect(isRetired(t)).toBe(false);
    expect(t.to).toBeNull();
  });
});
