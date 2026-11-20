// やること's contract (contract/todo.ts): the op's shapes and cleaning, the merge (the latest `at`, then who; a removal
// final), an item only in a list held, a list's removal taking its items, the cap, the phone's fold (the record's rows
// taken, its own queued ones judged) and the lists as the sheet shows them.
import { describe, expect, it } from 'vitest';
import { newTodoId, TodoBook, todoClean, todoFold, todoLists, todoOpOf, todoRowOf, todoSlot, type TodoEntry } from './todo.ts';
import { eventSlot, validEventData } from './record.ts';
import { guestMayWrite } from './guest.ts';

const T = Date.parse('2026-11-20T03:00:00.000Z');
type W = 'A' | 'B' | 'G';
const row = (who: W, d: Record<string, unknown>, queued = false): TodoEntry => ({ ...todoRowOf('todo', d, who)!, ...(queued ? { queued: true as const } : {}) });
const list = (who: W, id: string, at: number, title = id, ord = 0, queued = false) => row(who, { id, at, title, ord }, queued);
const item = (who: W, id: string, l: string, at: number, extra: Record<string, unknown> = {}, queued = false) => row(who, { id, at, list: l, text: id, ord: 0, done: 0, ...extra }, queued);
const rm = (who: W, id: string, at: number, queued = false) => row(who, { id, at, rm: true }, queued);

describe('the op', () => {
  it('reads a list, an item and a removal, their known keys only', () => {
    expect(todoOpOf({ id: 'dabc1234', at: T, title: '買い物', ord: 1.5 })).toEqual({ id: 'dabc1234', at: T, title: '買い物', ord: 1.5 });
    expect(todoOpOf({ id: 'dabc1235', at: T, list: 'dabc1234', text: '牛乳', ord: -1, done: 1 })).toEqual({ id: 'dabc1235', at: T, list: 'dabc1234', text: '牛乳', ord: -1, done: 1 });
    expect(todoOpOf({ id: 'dabc1234', at: T, rm: true })).toEqual({ id: 'dabc1234', at: T, rm: true });
    for (const d of [
      { id: 'xabc1234', at: T, title: 'x', ord: 0 },
      { id: 'dabc1234', at: 5, title: 'x', ord: 0 },
      { id: 'dabc1234', at: T, title: '', ord: 0 },
      { id: 'dabc1234', at: T, title: ' x', ord: 0 },
      { id: 'dabc1234', at: T, title: 'x', ord: Infinity },
      { id: 'dabc1234', at: T, title: 'x', ord: 0, done: 0 },
      { id: 'dabc1234', at: T, list: 'nope', text: 'x', ord: 0, done: 0 },
      { id: 'dabc1234', at: T, list: 'dabc1235', text: 'x', ord: 0, done: true },
      { id: 'dabc1234', at: T, rm: 1 },
      { id: 'dabc1234', at: T, rm: true, ord: 0 }
    ]) expect(todoOpOf(d), JSON.stringify(d)).toBeNull();
    expect(todoOpOf({ id: 'dabc1234', at: T + 2 * 86400_000, title: 'x', ord: 0 }, T)).toBeNull();
    expect(newTodoId(T)).toMatch(/^d[0-9a-z]{6,24}$/);
  });

  it('cleans texts as the record keeps them (one line, the length); the record takes it from anyone, in its id’s slot', () => {
    expect(todoClean({ id: 'dabc1234', at: T, title: ' a\n\u0007b ', ord: 0 })).toMatchObject({ title: 'a b' });
    expect((todoClean({ id: 'dabc1234', at: T, list: 'dabc1235', text: 'x'.repeat(300), ord: 0, done: 0 }).text as string).length).toBe(200);
    expect(validEventData('todo', { id: 'dabc1234', at: T, title: 'x', ord: 0 }, T)).toBe(true);
    expect(validEventData('todo', { id: 'dabc1234', at: T, title: ' x', ord: 0 }, T)).toBe(false);
    expect(eventSlot('todo', 'G', 'G', { id: 'dabc1234' }, T)).toBe('todo|dabc1234');
    expect(todoSlot({ id: 1 })).toBeNull();
    expect(guestMayWrite('todo', {})).toBe(true);
  });
});

describe('the book', () => {
  it('the latest `at` wins, then G over B over A; a removal is final', () => {
    const b = new TodoBook();
    expect(b.apply(list('A', 'dlist001', T)).v).toBe('append');
    expect(b.apply(list('B', 'dlist001', T - 1, 'older')).v).toBe('stale');
    expect(b.apply(list('A', 'dlist001', T, 'same A')).v).toBe('stale');
    expect(b.apply(list('G', 'dlist001', T, 'same G')).v).toBe('append');
    expect(b.apply(rm('A', 'dlist001', T + 1)).v).toBe('append');
    expect(b.apply(list('B', 'dlist001', T + 9, 'back')).v).toBe('stale');
    expect(todoLists(b)).toEqual([]);
  });

  it('only a creation makes a row; an item only in a list held; its list never changes', () => {
    const b = new TodoBook();
    expect(b.apply(rm('A', 'dnever01', T)).v).toBe('stale');
    expect(b.apply(item('A', 'ditem001', 'dnolist1', T)).v).toBe('stale');
    b.apply(list('A', 'dlist001', T));
    b.apply(list('A', 'dlist002', T));
    expect(b.apply(item('A', 'ditem001', 'dlist001', T + 1)).v).toBe('append');
    expect(b.apply(item('A', 'ditem001', 'dlist002', T + 2)).v).toBe('moved');
    expect(b.apply(list('A', 'ditem001', T + 2)).v).toBe('moved');
    expect(b.apply(item('A', 'ditem002', 'ditem001', T + 2)).v).toBe('stale');
  });

  it('a list’s removal drops its items; the cap counts what stands', () => {
    const b = new TodoBook();
    b.apply(list('A', 'dlist001', T));
    b.apply(list('A', 'dlist002', T));
    b.apply(item('A', 'da000001', 'dlist001', T));
    b.apply(item('A', 'db000001', 'dlist002', T));
    expect(b.apply(rm('B', 'dlist001', T + 1))).toMatchObject({ v: 'append', drop: ['todo|da000001'] });
    expect([...b.rows.keys()].sort()).toEqual(['todo|db000001', 'todo|dlist001', 'todo|dlist002']);
    for (let i = 2; i < 500; i++) expect(b.apply(item('A', `dc${String(i).padStart(6, '0')}`, 'dlist002', T)).v).toBe('append');
    expect(b.apply(item('A', 'dfull001', 'dlist002', T)).v).toBe('full');
    b.apply(rm('A', 'db000001', T + 2));
    expect(b.apply(item('A', 'dfull001', 'dlist002', T)).v).toBe('append');
  });

  it('the phone’s fold: the record’s rows as they are, its queued ones by the rules (a queued item after its queued list)', () => {
    const b = todoFold([
      list('A', 'dlist001', T, 'L', 1),
      item('B', 'dx000001', 'dlist001', T, { ord: 2, done: 1 }),
      list('G', 'dlist002', T + 5, 'M', 0, true),
      item('G', 'dy000001', 'dlist002', T + 6, {}, true),
      item('G', 'dz000001', 'dgone001', T + 6, {}, true),
      item('A', 'dw000001', 'dlist001', T + 7, { ord: 1, text: 'first' }, true)
    ]);
    expect(todoLists(b)).toEqual([
      { id: 'dlist002', title: 'M', ord: 0, items: [{ id: 'dy000001', text: 'dy000001', ord: 0, done: false }] },
      { id: 'dlist001', title: 'L', ord: 1, items: [{ id: 'dw000001', text: 'first', ord: 1, done: false }, { id: 'dx000001', text: 'dx000001', ord: 2, done: true }] }
    ]);
  });

  it('hides an item whose list is gone (a phone that kept the item’s row from before the removal)', () => {
    const c = new TodoBook();
    c.merge(item('A', 'da000001', 'dlist001', T));
    c.merge(rm('A', 'dlist001', T + 1));
    expect(todoLists(c)).toEqual([]);
  });
});
