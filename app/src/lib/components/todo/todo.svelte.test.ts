// やること's store on a phone (components/todo/todo.svelte.ts, docs/todo.md): every item write carries the item's due,
// reminder and recipients forward (the record keeps the latest op whole), 編集 sets and clears them, a quick chip's
// date rides on an add, and a date alone never sends a reminder.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventRow } from '#lib/contract/api.ts';

const T = Date.parse('2026-11-20T03:00:00.000Z');
const fake = vi.hoisted(() => ({ rows: [] as EventRow[], queued: [] as EventRow[], sent: [] as Record<string, unknown>[] }));
vi.mock('#lib/store/world.svelte.ts', () => ({ world: { now: () => T + 100, serverNow: () => T + 100 }, opClock: (last: number, after = 0) => Math.max(T + 100, last + 1, after + 1) }));
vi.mock('#lib/store/week.svelte.ts', async () => {
  const { reduce: red, foldEvents: fold } = await import('#lib/model/state.ts');
  return {
    week: {
      get view() {
        return { viewer: 'A', people: {}, guest: {} };
      },
      get model() {
        const base = red({ metrics: [], events: fake.rows });
        return { state: fake.queued.length ? fold(base, fake.queued, null)! : base };
      },
      send(type: string, data: Record<string, unknown>) {
        fake.sent.push(data);
        fake.queued.push([new Date(T + 1e9 + fake.queued.length).toISOString(), 'A', `q${fake.queued.length}`, type as EventRow[3], JSON.stringify(data)]);
        return { ok: true };
      }
    }
  };
});
const { todo } = await import('./todo.svelte.ts');

const rec = (t: number, data: object): EventRow => [new Date(t).toISOString(), 'A', `r${t}`, 'todo', JSON.stringify(data)];
const items = () => todo.lists[0].items;

beforeEach(() => {
  fake.queued = [];
  fake.sent = [];
  fake.rows = [
    rec(T, { id: 'dlist01', at: T, title: '家', ord: 0 }),
    rec(T + 1, { id: 'ditem01', at: T + 1, list: 'dlist01', text: '牛乳', ord: 0, done: 0, due: '2026-11-20T15:00', rem: 'b10', to: ['A', 'B'] }),
    rec(T + 2, { id: 'ditem02', at: T + 2, list: 'dlist01', text: '電話', ord: 1, done: 0 })
  ];
});

describe('due, rem and to carried forward', () => {
  it('a tick, a move and a text edit keep them', () => {
    expect(todo.tick('ditem01', true)).toBe(true);
    expect(todo.move('ditem01', 1)).toBe(true);
    expect(todo.editItem('ditem01', '牛乳2本')).toBe(true);
    for (const op of fake.sent) expect(op).toMatchObject({ due: '2026-11-20T15:00', rem: 'b10', to: ['A', 'B'] });
    expect(items().find((i) => i.id === 'ditem01')).toMatchObject({ text: '牛乳2本', done: true, due: '2026-11-20T15:00', rem: 'b10', to: ['A', 'B'] });
  });
  it('編集 clears the due (the reminder with it), or sets a date alone with no reminder', () => {
    expect(todo.editItem('ditem01', '牛乳', { due: null })).toBe(true);
    expect(fake.sent.at(-1)).not.toHaveProperty('due');
    expect(fake.sent.at(-1)).not.toHaveProperty('rem');
    expect(todo.editItem('ditem02', '電話', { due: '2026-11-21' })).toBe(true);
    expect(fake.sent.at(-1)).toMatchObject({ due: '2026-11-21' });
    expect(fake.sent.at(-1)).not.toHaveProperty('rem');
    // a reminder with no one to get it is no reminder
    expect(todo.editItem('ditem02', '電話', { due: '2026-11-21', rem: 'am', to: [] })).toBe(true);
    expect(items().find((i) => i.id === 'ditem02')).toEqual({ id: 'ditem02', text: '電話', ord: 1, done: false, due: '2026-11-21' });
  });
  it('an unchanged 保存 sends nothing', () => {
    expect(todo.editItem('ditem01', '牛乳', { due: '2026-11-20T15:00', rem: 'b10', to: ['A', 'B'] })).toBe(true);
    expect(fake.sent).toEqual([]);
  });
  it('an add takes the quick chip’s date, never a reminder', () => {
    const id = todo.addItem('dlist01', 'ゴミ出し', '2026-11-20');
    expect(id).toBeTruthy();
    expect(fake.sent.at(-1)).toMatchObject({ text: 'ゴミ出し', due: '2026-11-20' });
    expect(fake.sent.at(-1)).not.toHaveProperty('rem');
    expect(todo.addItem('dlist01', 'なし')).toBeTruthy();
    expect(fake.sent.at(-1)).not.toHaveProperty('due');
  });
});
