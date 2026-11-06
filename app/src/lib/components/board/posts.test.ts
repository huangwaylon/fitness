// The board on a phone (components/board/posts.svelte.ts, docs/board.md): the model's rows (the record's, taken as they
// are, then this phone's queued ones, marked and judged by the record's rules) folded into the posts.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventRow } from '#lib/contract/api.ts';

const T = Date.parse('2026-11-06T03:00:00.000Z');
const fake = vi.hoisted(() => ({
  me: 'A' as 'A' | 'B' | 'G',
  rows: [] as EventRow[],
  queued: [] as EventRow[]
}));
vi.mock('#lib/store/world.svelte.ts', () => ({ world: { now: () => T + 100, serverNow: () => T + 100 }, opClock: (last: number, after = 0) => Math.max(T + 100, last + 1, after + 1) }));
vi.mock('#lib/store/week.svelte.ts', async () => {
  const { reduce: red, foldEvents: fold } = await import('#lib/model/state.ts');
  return {
    week: {
      demo: true,
      get view() {
        return { viewer: fake.me, people: {}, guest: {} };
      },
      get model() {
        const base = red({ metrics: [], events: fake.rows });
        return { state: fake.queued.length ? fold(base, fake.queued, null)! : base };
      },
      send(type: string, data: Record<string, unknown>) {
        fake.queued.push([new Date(T + 1e9 + fake.queued.length).toISOString(), fake.me, `q${fake.queued.length}`, type as EventRow[3], JSON.stringify(data)]);
        return { ok: true };
      }
    }
  };
});
const { board } = await import('./posts.svelte.ts');

const rec = (t: number, who: 'A' | 'B' | 'G', data: object): EventRow => [new Date(t).toISOString(), who, `r${t}${who}`, 'board', JSON.stringify(data)];
const posts = () => board.posts.map((p) => [p.id, p.who, p.t]);

beforeEach(() => {
  fake.me = 'A';
  fake.rows = [];
  fake.queued = [];
});

describe('the board from a fresh snapshot', () => {
  it('shows a post the record holds only as its edit (its latest row, the first one replaced)', () => {
    fake.rows = [rec(T + 5, 'A', { id: 'b1111111', at: T + 5, p: T, t: 'なおした' }), rec(T + 7, 'B', { id: 'b2222222', at: T + 7, p: T + 1, t: 'うめの' })];
    expect(posts()).toEqual([['b2222222', 'B', 'うめの'], ['b1111111', 'A', 'なおした']]);
    expect(board.mayEdit(board.posts[1])).toBe(true);
  });
  it('folds this phone’s queued ops over it by the record’s rules', () => {
    fake.rows = [rec(T + 5, 'A', { id: 'b1111111', at: T + 5, p: T, t: 'なおした' }), rec(T + 7, 'B', { id: 'b2222222', at: T + 7, p: T + 1, t: 'うめの' })];
    expect(board.edit('b1111111', 'もういちど')).toBe(true);
    expect(board.remove('b2222222')).toBe(true);
    expect(board.write('あたらしい')).toBe(true);
    expect(posts().map(([, , t]) => t)).toEqual(['あたらしい', 'もういちど']);
    // a queued edit of a post the record doesn't hold, and of someone else's: the record drops them, so does the phone
    fake.queued.push(rec(T + 2e9, 'A', { id: 'b3333333', at: T + 200, p: T, t: 'ないもの' }));
    fake.rows.push(rec(T + 8, 'B', { id: 'b4444444', at: T + 8, p: T + 8, t: 'うめの2' }));
    fake.queued.push(rec(T + 2e9 + 1, 'A', { id: 'b4444444', at: T + 201, p: T + 8, t: 'のっとり' }));
    expect(posts().map(([, , t]) => t)).toEqual(['あたらしい', 'うめの2', 'もういちど']);
  });
});
