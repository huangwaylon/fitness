// けっこんしき's categories in Japanese (contract/wedCats.ts): the starter list, and the record's one-time rename as ops
// a phone could send: the record's rules take every one, and once they're in there is nothing left to rename.
import { describe, expect, it } from 'vitest';
import { WedBook, wedOpOf, wedRowOf, type WedRow } from '#lib/contract/wedding.ts';
import { boardConfig } from './config.ts';
import { CATEGORIES, catsRenameOps } from '#lib/contract/wedCats.ts';

const T = Date.parse('2026-11-08T03:00:00.000Z');
const row = (type: string, d: Record<string, unknown>, who: 'A' | 'B' = 'A'): WedRow => wedRowOf(type, d, who)!;
/** A record as the old board's import and the phones left it: English starter names, one typed by hand, a deleted task, a subtask. */
function legacy(): WedBook {
  return new WedBook().fold([
    row('wtask', { id: 't1', at: T - 9e8, c: T - 9e8, title: '式場を決める', cat: 'Venue', due: '2026-10-01', imported: true }),
    row('wtask', { id: 't2', at: T - 8e8, c: T - 8e8, title: '招待客リストをつくる', cat: 'Guests', due: '2026-11-01', start: '2026-10-01' }, 'B'),
    row('wtask', { id: 't3', at: T - 7e8, c: T - 7e8, title: '引き出物', cat: 'Gifts', due: '2027-01-01', del: T - 1e8 }),
    row('wtask', { id: 't4', at: T - 6e8, c: T - 6e8, title: '親族', cat: 'Guests', parent: 't2' }),
    row('wtask', { id: 't5', at: T - 5e8, c: T - 5e8, title: 'ドリンク', cat: 'ドリンク', due: '2027-02-01' }),
    row('wconf', { k: 'cats', at: T - 4e8, v: ['Budget', 'Venue', 'Guests', 'ドリンク', 'Other'] })
  ]);
}

describe('wedding categories', () => {
  it('the starter list is Japanese (招待客, 手続き)', () => {
    expect(boardConfig({}).cats).toEqual([...CATEGORIES]);
    expect(CATEGORIES).toContain('招待客');
    expect(CATEGORIES).toContain('手続き');
    expect(boardConfig({ cats: ['予算', 'ドリンク'] }).cats).toEqual(['予算', 'ドリンク']);
  });

  it('the rename: every task with an old name (deleted and subtasks too) and the list, each taken by the record; again: nothing', () => {
    const book = legacy();
    const ops = catsRenameOps(book, T);
    expect(ops.map((o) => (o.type === 'wtask' ? `${o.data.id}:${o.data.cat}` : `cats:${(o.data.v as string[]).join(',')}`))).toEqual([
      't1:会場', 't2:招待客', 't3:ギフト', 't4:招待客', 'cats:予算,会場,招待客,ドリンク,その他'
    ]);
    // the rest of each task as it was (its dates, deletion, parent), never `imported` (a phone's op can't say it)
    const t2 = ops.find((o) => o.type === 'wtask' && o.data.id === 't2')!.data;
    expect(t2).toEqual({ id: 't2', at: T + 1, c: T - 8e8, title: '招待客リストをつくる', cat: '招待客', due: '2026-11-01', start: '2026-10-01' });
    expect(ops.find((o) => o.type === 'wtask' && o.data.id === 't3')!.data).toMatchObject({ del: T - 1e8 });
    expect(ops.find((o) => o.type === 'wtask' && o.data.id === 't1')!.data).not.toHaveProperty('imported');
    for (const o of ops) {
      // as the record's live path reads a phone's op, then its rules
      const op = wedOpOf(o.type, o.data as unknown as Record<string, unknown>, { now: T });
      expect(op, JSON.stringify(o)).not.toBeNull();
      const v = book.apply({ type: o.type, who: 'A', op } as WedRow);
      expect('row' in v, JSON.stringify(v)).toBe(true);
    }
    expect(catsRenameOps(book, T + 100)).toEqual([]);
  });

  it('a record with nothing to rename (the list never set, every name Japanese): no ops', () => {
    const book = new WedBook().fold([row('wtask', { id: 't9', at: T - 1, c: T - 1, title: 'x', cat: '写真', due: '2027-01-01' })]);
    expect(catsRenameOps(book, T)).toEqual([]);
  });
});
