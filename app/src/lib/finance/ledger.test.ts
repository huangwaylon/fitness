// The money app's state from the record's rows (finance/ledger.ts): each slot's latest op, deleted entries kept, the
// live templates in order, the config over its defaults, unread rows counted.
import { describe, expect, it } from 'vitest';
import { FIN_CFG_DEFAULT } from '#lib/contract/finance.ts';
import { ledgerOf, type FinRow } from './ledger.ts';
import { balanceOf } from './balance.ts';
import { unpaidRecurring } from './recurring.ts';

const T = Date.parse('2026-11-20T03:00:00.000Z');
const e = (id: string, extra: Record<string, unknown> = {}): FinRow => ({ type: 'fin_e', d: { id, k: 'x', d: '2026-11-03', amt: 1000, payer: 'A', ps: 5000, desc: '', cat: 'Food', ...extra } });
const t = (id: string, extra: Record<string, unknown> = {}): FinRow => ({ type: 'fin_t', d: { id, desc: id, cat: 'Home', payer: 'B', amt: 5000, ps: null, months: [], day: 1, from: '2026-01', to: null, ...extra } });
const c = (extra: Record<string, unknown> = {}): FinRow => ({ type: 'fin_c', d: { id: 'cfg', cats: ['Food'], split: { A: 8000, B: 2000 }, notes: [], ...extra } });

describe('ledgerOf', () => {
  it('is empty with the default config for no rows, the default a copy', () => {
    const l = ledgerOf([]);
    expect(l).toMatchObject({ entries: [], templates: [], config: FIN_CFG_DEFAULT, bad: 0 });
    l.config.cats.push('x');
    expect(FIN_CFG_DEFAULT.cats).not.toContain('x');
  });

  it('keeps each slot’s latest op: an edit, a delete, a restore', () => {
    const l = ledgerOf([e('a'), e('b'), e('a', { amt: 3000 }), e('b', { del: T }), e('c', { del: T }), e('c')]);
    expect(l.entries.map((x) => [x.id, x.amt, x.del])).toEqual([['a', 3000, undefined], ['b', 1000, T], ['c', 1000, undefined]]);
    expect(l.all.get('b')?.del).toBe(T);
    expect(balanceOf(l.entries).net).toBe(1500 + 500);
  });

  it('reads the import’s mark from the record', () => {
    expect(ledgerOf([e('a', { imp: 1 })]).entries[0].imp).toBe(1);
  });

  it('lists the templates not deleted, by day then name; a deleted instance still records its month', () => {
    const l = ledgerOf([t('water', { day: 20 }), t('rent', { day: 27 }), t('gas', { day: 20 }), t('old', { del: T }), e('rent#2026-11', { del: T })]);
    expect(l.templates.map((x) => x.id)).toEqual(['gas', 'water', 'rent']);
    expect(unpaidRecurring(l.templates, l.all, '2026-11').map((d) => d.id)).toEqual(['gas#2026-11', 'water#2026-11']);
  });

  it('takes the config’s latest op', () => {
    expect(ledgerOf([c(), c({ cats: ['Food', 'Home'] })]).config).toEqual({ cats: ['Food', 'Home'], split: { A: 8000, B: 2000 }, notes: [] });
  });

  it('skips and counts what it can’t read, keeping the last good op of a slot', () => {
    const l = ledgerOf([e('a'), e('a', { amt: 0 }), t('x', { day: 0 }), c({ id: 'other' }), { type: 'todo', d: {} }, e('b', { ps: 0.5 })]);
    expect(l.bad).toBe(5);
    expect(l.entries.map((x) => [x.id, x.amt])).toEqual([['a', 1000]]);
    expect(l.config).toEqual(FIN_CFG_DEFAULT);
  });
});
