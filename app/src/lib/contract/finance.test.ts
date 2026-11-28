// The money contract (contract/finance.ts): the three ops read (known keys only, integer yen and basis points, the id
// shapes, the import's mark), the texts cleaned as the record keeps them, the slots, the split's exact arithmetic and
// the all-time balance.
import { describe, expect, it } from 'vitest';
import {
  FIN_AMT_MAX, FIN_BP, FIN_CFG_DEFAULT, finClean, finConfigOf, finEntryOf, finInstanceId, finNet, finSlot, finSplit, finTemplateOf, isFinType, type FinEntry
} from './finance.ts';

const T = Date.parse('2026-11-20T03:00:00.000Z');
const UUID = '0b9f7a52-3c1e-4d8a-9f00-1a2b3c4d5e6f';
const entry = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({ id: UUID, k: 'x', d: '2026-11-03', amt: 1200, payer: 'A', ps: 5000, desc: 'lunch', cat: 'Dining', ...extra });
const tpl = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({ id: 'rent-1', desc: 'Rent', cat: 'Rent', payer: 'B', amt: 90000, ps: null, months: [], day: 31, from: '2026-01', to: null, ...extra });
const cfg = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({ id: 'cfg', cats: ['Food', 'Home'], split: { A: 8000, B: 2000 }, notes: ['weekly shop'], ...extra });

describe('the types', () => {
  it('knows its three types', () => {
    expect(['fin_e', 'fin_t', 'fin_c'].every(isFinType)).toBe(true);
    for (const t of ['fin', 'fin_x', 'todo', 1, null]) expect(isFinType(t)).toBe(false);
  });
});

describe('an entry', () => {
  it('reads an expense, a settlement, a deleted one and an imported one (the import only)', () => {
    expect(finEntryOf(entry())).toEqual(entry());
    expect(finEntryOf(entry({ k: 's', ps: 0, cat: '' }))).toMatchObject({ k: 's', ps: 0 });
    expect(finEntryOf(entry({ del: T }))).toMatchObject({ del: T });
    expect(finEntryOf(entry({ id: 'rent-1#2026-02' }))).toMatchObject({ id: 'rent-1#2026-02' });
    expect(finEntryOf(entry({ desc: '' }))).toMatchObject({ desc: '' });
    expect(finEntryOf(entry({ imp: 1 }))).toBeNull();
    expect(finEntryOf(entry({ imp: 1 }), { imp: true })).toMatchObject({ imp: 1 });
    expect(finEntryOf(entry({ imp: true }), { imp: true })).toBeNull();
  });

  it('refuses anything malformed', () => {
    for (const extra of [
      { id: '' }, { id: 'x'.repeat(65) }, { id: 'a b' }, { id: 'a/b' }, { id: 7 },
      { k: 'e' }, { d: '2026-02-30' }, { d: '2026-11-3' },
      { amt: 0 }, { amt: -5 }, { amt: 12.5 }, { amt: FIN_AMT_MAX + 1 }, { amt: '1200' },
      { payer: 'G' }, { payer: 'a' },
      { ps: -1 }, { ps: 10001 }, { ps: 0.5 }, { ps: '5000' }, { ps: null },
      { k: 's', ps: 5000 },
      { desc: ' lunch' }, { desc: 'a\nb' }, { desc: 'x'.repeat(201) }, { cat: 'x'.repeat(41) }, { cat: undefined },
      { del: 5 }, { del: null },
      { extra: 1 }
    ]) expect(finEntryOf(entry(extra)), JSON.stringify(extra)).toBeNull();
    expect(finEntryOf(entry({ amt: FIN_AMT_MAX, ps: FIN_BP }))).not.toBeNull();
    expect(finEntryOf(entry({ id: 'x'.repeat(64) }))).not.toBeNull();
  });
});

describe('a template', () => {
  it('reads a fixed and a variable cost, a quarterly one and a retired one', () => {
    expect(finTemplateOf(tpl())).toEqual(tpl());
    expect(finTemplateOf(tpl({ amt: null, ps: 7500 }))).toMatchObject({ amt: null, ps: 7500 });
    expect(finTemplateOf(tpl({ months: [1, 4, 7, 10] }))).toMatchObject({ months: [1, 4, 7, 10] });
    expect(finTemplateOf(tpl({ to: '2026-06' }))).toMatchObject({ to: '2026-06' });
    // retired in its first month: it never ran
    expect(finTemplateOf(tpl({ from: '2026-06', to: '2026-05' }))).not.toBeNull();
    expect(finTemplateOf(tpl({ del: T }))).toMatchObject({ del: T });
  });

  it('refuses anything malformed, and an id with no room for its instances', () => {
    for (const extra of [
      { id: 'a#b' }, { id: 'x'.repeat(57) }, { desc: '' }, { payer: 'G' },
      { amt: 0 }, { amt: undefined }, { ps: 10001 }, { ps: undefined },
      { months: [4, 1] }, { months: [1, 1] }, { months: [0] }, { months: [13] }, { months: null },
      { day: 0 }, { day: 32 }, { day: 1.5 },
      { from: '2026-13' }, { from: '2026-1' }, { from: null }, { to: '2026' }, { to: undefined },
      { extra: 1 }
    ]) expect(finTemplateOf(tpl(extra)), JSON.stringify(extra)).toBeNull();
    const id = 'x'.repeat(56);
    expect(finTemplateOf(tpl({ id }))).not.toBeNull();
    expect(finEntryOf(entry({ id: finInstanceId(id, '2026-12') }))).not.toBeNull();
  });
});

describe('the config', () => {
  it('reads every key, the split each person’s own', () => {
    expect(finConfigOf(cfg())).toEqual({ cats: ['Food', 'Home'], split: { A: 8000, B: 2000 }, notes: ['weekly shop'] });
    expect(finConfigOf(cfg({ split: { A: 8000, B: 8000 }, notes: [] }))).not.toBeNull();
    expect(finConfigOf({ ...FIN_CFG_DEFAULT, id: 'cfg' })).toEqual(FIN_CFG_DEFAULT);
  });

  it('refuses another id, a missing key, empty categories, repeats and a share out of range', () => {
    for (const d of [
      cfg({ id: 'x' }), cfg({ cats: [] }), cfg({ cats: ['A', 'A'] }), cfg({ cats: [''] }), cfg({ cats: ['x'.repeat(41)] }),
      cfg({ cats: Array.from({ length: 51 }, (_, i) => `c${i}`) }), cfg({ notes: undefined }), cfg({ split: { A: 8000 } }),
      cfg({ split: { A: 8000, B: 2000, G: 0 } }), cfg({ split: { A: 0.8, B: 0.2 } }), cfg({ split: [8000, 2000] }), cfg({ extra: 1 })
    ]) expect(finConfigOf(d), JSON.stringify(d)).toBeNull();
  });
});

describe('cleaning', () => {
  it('cleans texts as the record keeps them, then they read', () => {
    const e = finClean('fin_e', entry({ desc: '  lunch\n with​ friends ', cat: ' Dining ' }));
    expect(e).toMatchObject({ desc: 'lunch with friends', cat: 'Dining' });
    expect(finEntryOf(e)).not.toBeNull();
    const c = finClean('fin_c', cfg({ cats: [' Food', 'Food', '', 'Home'], notes: ['  a  b '] }));
    expect(c).toMatchObject({ cats: ['Food', 'Home'], notes: ['a b'] });
    expect(finConfigOf(c)).not.toBeNull();
  });
});

describe('the slots', () => {
  it('one per type and id; the config one', () => {
    expect(finSlot('fin_e', entry())).toBe(`fin_e|${UUID}`);
    expect(finSlot('fin_t', tpl())).toBe('fin_t|rent-1');
    expect(finSlot('fin_c', cfg())).toBe('fin_c|cfg');
    expect(finSlot('fin_c', cfg({ id: 'other' }))).toBeNull();
    expect(finSlot('fin_t', tpl({ id: 'a#b' }))).toBeNull();
    expect(finSlot('fin_e', entry({ id: 'a b' }))).toBeNull();
  });
});

describe('the split', () => {
  it('rounds the payer’s part half up, the other takes the rest', () => {
    expect(finSplit(3, 5000)).toEqual({ payerYen: 2, otherYen: 1 });
    expect(finSplit(1, 5000)).toEqual({ payerYen: 1, otherYen: 0 });
    expect(finSplit(99, 5000)).toEqual({ payerYen: 50, otherYen: 49 });
    expect(finSplit(101, 8000)).toEqual({ payerYen: 81, otherYen: 20 });
    expect(finSplit(101, FIN_BP)).toEqual({ payerYen: 101, otherYen: 0 });
    expect(finSplit(101, 0)).toEqual({ payerYen: 0, otherYen: 101 });
    expect(finSplit(0, 5000)).toEqual({ payerYen: 0, otherYen: 0 });
    expect(finSplit(FIN_AMT_MAX, 3333)).toEqual({ payerYen: 33_330_000, otherYen: 66_670_000 });
  });

  it('throws on anything but integer yen and basis points', () => {
    for (const [a, p] of [[1.5, 5000], [-1, 5000], [NaN, 5000], [FIN_AMT_MAX + 1, 5000], [100, 0.5], [100, -1], [100, 10001], [100, NaN]] as const) {
      expect(() => finSplit(a, p), `${a} ${p}`).toThrow(TypeError);
    }
  });
});

describe('the balance', () => {
  const e = (payer: 'A' | 'B', amt: number, ps: number, extra: Partial<FinEntry> = {}): FinEntry => ({ ...(entry({ payer, amt, ps }) as unknown as FinEntry), ...extra });

  it('nets every live entry from A’s side, a settlement of what’s owed bringing it to 0', () => {
    expect(finNet([])).toBe(0);
    expect(finNet([e('A', 1000, 5000)])).toBe(500);
    expect(finNet([e('A', 1000, 5000), e('B', 3000, 8000)])).toBe(500 - 600);
    expect(finNet([e('A', 1000, 5000), e('B', 500, 0, { k: 's' })])).toBe(0);
    expect(finNet([e('A', 1000, 5000), e('A', 9999, 0, { del: T })])).toBe(500);
  });
});
