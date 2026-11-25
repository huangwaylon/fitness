// やること's contract (contract/todo.ts): the op's shapes and cleaning (the note's lines kept), the merge (the latest
// `at`, then who; a removal final), the cap, an older build's list op told apart, the phone's fold (the record's rows
// taken, its own queued ones judged) and the items as the sheet shows them.
import { describe, expect, it } from 'vitest';
import { cleanNote, newTodoId, TodoBook, todoClean, todoFold, todoItems, todoLegacy, todoOpOf, todoRowOf, todoSlot, type TodoEntry } from './todo.ts';
import { eventSlot, validEventData } from './record.ts';
import { guestMayWrite } from './guest.ts';

const T = Date.parse('2026-11-20T03:00:00.000Z');
type W = 'A' | 'B' | 'G';
const row = (who: W, d: Record<string, unknown>, queued = false): TodoEntry => ({ ...todoRowOf('todo', d, who)!, ...(queued ? { queued: true as const } : {}) });
const item = (who: W, id: string, at: number, extra: Record<string, unknown> = {}, queued = false) => row(who, { id, at, text: id, ord: 0, done: 0, ...extra }, queued);
const rm = (who: W, id: string, at: number, queued = false) => row(who, { id, at, rm: true }, queued);

describe('the op', () => {
  it('reads an item and a removal, their known keys only', () => {
    expect(todoOpOf({ id: 'dabc1235', at: T, text: '牛乳', ord: -1, done: 1 })).toEqual({ id: 'dabc1235', at: T, text: '牛乳', ord: -1, done: 1 });
    expect(todoOpOf({ id: 'dabc1235', at: T, text: '買い物', note: '牛乳\n卵', ord: 0, done: 0 })).toMatchObject({ note: '牛乳\n卵' });
    expect(todoOpOf({ id: 'dabc1234', at: T, rm: true })).toEqual({ id: 'dabc1234', at: T, rm: true });
    for (const d of [
      { id: 'xabc1234', at: T, text: 'x', ord: 0, done: 0 },
      { id: 'dabc1234', at: 5, text: 'x', ord: 0, done: 0 },
      { id: 'dabc1234', at: T, text: '', ord: 0, done: 0 },
      { id: 'dabc1234', at: T, text: ' x', ord: 0, done: 0 },
      { id: 'dabc1234', at: T, text: 'x', ord: Infinity, done: 0 },
      { id: 'dabc1234', at: T, text: 'x', ord: 0, done: true },
      { id: 'dabc1234', at: T, text: 'x', ord: 0, done: 0, note: '' },
      { id: 'dabc1234', at: T, text: 'x', ord: 0, done: 0, note: ' x' },
      { id: 'dabc1234', at: T, text: 'x', ord: 0, done: 0, note: 'x'.repeat(2001) },
      { id: 'dabc1234', at: T, text: 'x', ord: 0, done: 0, list: 'dabc1235' },
      { id: 'dabc1234', at: T, title: 'x', ord: 0 },
      { id: 'dabc1234', at: T, rm: 1 },
      { id: 'dabc1234', at: T, rm: true, ord: 0 }
    ]) expect(todoOpOf(d), JSON.stringify(d)).toBeNull();
    expect(todoOpOf({ id: 'dabc1234', at: T + 2 * 86400_000, text: 'x', ord: 0, done: 0 }, T)).toBeNull();
    expect(newTodoId(T)).toMatch(/^d[0-9a-z]{6,24}$/);
  });

  it('cleans texts as the record keeps them (the text one line, the note’s lines kept); the record takes it from anyone, in its id’s slot', () => {
    expect(todoClean({ id: 'dabc1234', at: T, text: ' a\n\u0007b ', ord: 0, done: 0 })).toMatchObject({ text: 'a b' });
    expect((todoClean({ id: 'dabc1234', at: T, text: 'x'.repeat(300), ord: 0, done: 0 }).text as string).length).toBe(200);
    expect(todoClean({ id: 'dabc1234', at: T, text: 'x', note: '\n a \r\n\n\n\tb c  \n', ord: 0, done: 0 }).note).toBe('a\n\n b\nc');
    expect(todoClean({ id: 'dabc1234', at: T, text: 'x', note: ' \n ', ord: 0, done: 0 })).not.toHaveProperty('note');
    expect([...cleanNote('あ'.repeat(3000))].length).toBe(2000);
    expect(cleanNote(cleanNote(' a\n\n\nb '))).toBe(cleanNote(' a\n\n\nb '));
    expect(validEventData('todo', { id: 'dabc1234', at: T, text: 'x', ord: 0, done: 0 }, T)).toBe(true);
    expect(validEventData('todo', { id: 'dabc1234', at: T, text: ' x', ord: 0, done: 0 }, T)).toBe(false);
    expect(eventSlot('todo', 'G', 'G', { id: 'dabc1234' }, T)).toBe('todo|dabc1234');
    expect(todoSlot({ id: 1 })).toBeNull();
    expect(guestMayWrite('todo', {})).toBe(true);
  });

  it('an older build’s list or list item: let through to be acknowledged, never read', () => {
    for (const d of [{ id: 'dabc1234', at: T, title: '買い物', ord: 0 }, { id: 'dabc1235', at: T, list: 'dabc1234', text: '牛乳', ord: 0, done: 0 }]) {
      expect(todoLegacy(d)).toBe(true);
      expect(validEventData('todo', d, T)).toBe(true);
      expect(todoRowOf('todo', d, 'A')).toBeNull();
    }
    expect(todoLegacy({ id: 'dabc1234', at: T, text: 'x', ord: 0, done: 0 })).toBe(false);
    expect(todoLegacy({ id: 'dabc1234', at: T, rm: true })).toBe(false);
    expect(validEventData('todo', { id: 'BAD', at: T, title: 'x', ord: 0 }, T)).toBe(false);
  });
});

describe('due and reminder', () => {
  const base = { id: 'dabc1235', at: T, text: '牛乳', ord: 0, done: 0 };
  it('reads a due, a reminder fitting its kind and its people; an item without them unchanged', () => {
    expect(todoOpOf(base)).toEqual(base);
    expect(todoOpOf({ ...base, due: '2026-11-24' })).toEqual({ ...base, due: '2026-11-24' });
    expect(todoOpOf({ ...base, due: '2026-11-24T15:00', rem: 'b10', to: ['B', 'G'] })).toEqual({ ...base, due: '2026-11-24T15:00', rem: 'b10', to: ['B', 'G'] });
    expect(todoOpOf({ ...base, due: '2026-11-24', rem: 'am', to: ['A'] })).toMatchObject({ rem: 'am' });
    expect(todoOpOf({ ...base, due: '2028-02-29', rem: 'eve', to: ['A', 'B', 'G'] })).toMatchObject({ rem: 'eve' });
    expect(validEventData('todo', { ...base, due: '2026-11-24T09:30', rem: 'at', to: ['A'] }, T)).toBe(true);
  });

  it('refuses a bad due, a reminder without a due or people, people without a reminder, a kind mismatch', () => {
    for (const x of [
      { due: '2026-02-30' }, { due: '2027-02-29' }, { due: '2023-12-31' }, { due: '2100-01-01' }, { due: '2026-11-24T24:00' },
      { due: '2026-11-24T09:60' }, { due: '2026-11-24 09:00' }, { due: '2026-11-24T9:00' }, { due: 20261124 }, { due: '' },
      { rem: 'at', to: ['A'] }, { to: ['A'] }, { due: '2026-11-24', to: ['A'] },
      { due: '2026-11-24', rem: 'at', to: ['A'] }, { due: '2026-11-24', rem: 'b60', to: ['A'] }, { due: '2026-11-24T15:00', rem: 'am', to: ['A'] },
      { due: '2026-11-24', rem: 'am' }, { due: '2026-11-24', rem: 'am', to: [] }, { due: '2026-11-24', rem: 'am', to: ['A', 'A'] },
      { due: '2026-11-24', rem: 'am', to: ['C'] }, { due: '2026-11-24', rem: 'am', to: 'A' }, { due: '2026-11-24', rem: 'noon', to: ['A'] }
    ]) expect(todoOpOf({ ...base, ...x }), JSON.stringify(x)).toBeNull();
  });

  it('the fold keeps a due across a tick; a write without it clears it; the view has the fields only when set', () => {
    const b = new TodoBook();
    b.apply(item('A', 'ditem001', T, { due: '2026-11-24T15:00', rem: 'at', to: ['A'], note: 'メモ' }));
    b.apply(item('B', 'ditem001', T + 1, { due: '2026-11-24T15:00', rem: 'at', to: ['A'], note: 'メモ', done: 1 }));
    b.apply(item('A', 'ditem002', T, { ord: 1, due: '2026-11-25' }));
    expect(todoItems(b)).toEqual([
      { id: 'ditem001', text: 'ditem001', note: 'メモ', ord: 0, done: true, due: '2026-11-24T15:00', rem: 'at', to: ['A'] },
      { id: 'ditem002', text: 'ditem002', ord: 1, done: false, due: '2026-11-25' }
    ]);
    b.apply(item('A', 'ditem001', T + 2));
    expect(todoItems(b)[0]).toEqual({ id: 'ditem001', text: 'ditem001', ord: 0, done: false });
  });
});

describe('the book', () => {
  it('the latest `at` wins, then G over B over A; a removal is final', () => {
    const b = new TodoBook();
    expect(b.apply(item('A', 'ditem001', T)).v).toBe('append');
    expect(b.apply(item('B', 'ditem001', T - 1, { text: 'older' })).v).toBe('stale');
    expect(b.apply(item('A', 'ditem001', T, { text: 'same A' })).v).toBe('stale');
    expect(b.apply(item('G', 'ditem001', T, { text: 'same G' })).v).toBe('append');
    expect(todoItems(b)[0].text).toBe('same G');
    expect(b.apply(rm('A', 'ditem001', T + 1)).v).toBe('append');
    expect(b.apply(item('B', 'ditem001', T + 9, { text: 'back' })).v).toBe('stale');
    expect(todoItems(b)).toEqual([]);
  });

  it('only a creation makes a row; the cap counts what stands', () => {
    const b = new TodoBook();
    expect(b.apply(rm('A', 'dnever01', T)).v).toBe('stale');
    for (let i = 0; i < 500; i++) expect(b.apply(item('A', `dc${String(i).padStart(6, '0')}`, T)).v).toBe('append');
    expect(b.apply(item('A', 'dfull001', T)).v).toBe('full');
    b.apply(rm('A', 'dc000001', T + 2));
    expect(b.apply(item('A', 'dfull001', T)).v).toBe('append');
  });

  it('the phone’s fold: the record’s rows as they are, its queued ones by the rules; by ord, then id', () => {
    const b = todoFold([
      item('B', 'dx000001', T, { ord: 2, done: 1 }),
      item('G', 'dy000001', T + 6, {}, true),
      item('A', 'dw000001', T + 7, { ord: 1, text: 'first' }, true),
      item('A', 'dv000001', T + 7, { ord: 1 }, true)
    ]);
    expect(todoItems(b).map((i) => i.id)).toEqual(['dy000001', 'dv000001', 'dw000001', 'dx000001']);
  });
});
