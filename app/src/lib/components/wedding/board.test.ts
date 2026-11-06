// The wedding board on a phone (components/wedding/board.svelte.ts, docs/wedding.md): the model's rows (the record's,
// then this phone's queued ones, marked) folded by the record's rules and read as the old board read its Sheet; my
// changes as the ops the record takes, each stamped after what it replaces; the guest's phone reads, never writes.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventRow } from '#lib/contract/api.ts';
import { foldEvents, reduce } from '#lib/model/state.ts';

const T = Date.parse('2026-11-06T03:00:00.000Z');
const fake = vi.hoisted(() => ({
  me: 'A' as 'A' | 'B' | 'G',
  now: 0,
  rows: [] as EventRow[],
  queued: [] as EventRow[],
  sent: [] as { type: string; data: Record<string, unknown> }[]
}));
vi.mock('#lib/store/world.svelte.ts', () => ({ world: { now: () => fake.now } }));
vi.mock('#lib/store/week.svelte.ts', async () => {
  const { reduce: red, foldEvents: fold } = await import('#lib/model/state.ts');
  return {
    week: {
      get view() {
        return { viewer: fake.me };
      },
      get model() {
        const base = red({ metrics: [], events: fake.rows });
        return { state: fake.queued.length ? fold(base, fake.queued, null)! : base };
      },
      send(type: string, data: Record<string, unknown>) {
        fake.sent.push({ type, data });
        fake.queued.push([new Date(T + 1e9 + fake.queued.length).toISOString(), fake.me, `q${fake.queued.length}`, type as EventRow[3], JSON.stringify(data)]);
        return { ok: true };
      }
    }
  };
});
const { board } = await import('./board.svelte.ts');

const rec = (t: number, who: 'A' | 'B' | 'G', type: string, data: object): EventRow => [new Date(t).toISOString(), who, `r${t}${who}${type}`, type as EventRow[3], JSON.stringify(data)];
const task = (t: number, id: string, extra: object = {}) => rec(t, 'B', 'wtask', { id, at: t, c: t, title: id, cat: 'Venue', due: '2026-11-10', ...extra });

beforeEach(() => {
  fake.me = 'A';
  fake.now = T;
  fake.rows = [];
  fake.queued = [];
  fake.sent = [];
});

describe('the model', () => {
  it('folds the four types into state.wedding, the queued ones marked, the guest’s never', () => {
    const rows = [task(T - 3, 'a'), rec(T - 2, 'A', 'wdone', { id: 'a', at: T - 2, v: 1 }), rec(T - 1, 'G', 'wconf', { k: 'p1', at: T - 1, v: 'x' })];
    const s = reduce({ metrics: [], events: rows });
    expect(s.wedding.map((r) => [r.type, r.who, !!r.queued])).toEqual([['wtask', 'B', false], ['wdone', 'A', false]]);
    const q = foldEvents(s, [rec(T + 1, 'A', 'wnote', { at: T + 1, md: 'x' })], null)!;
    expect(q.wedding.at(-1)).toMatchObject({ type: 'wnote', queued: true });
    expect(s.wedding).toHaveLength(2);
  });
});

describe('the board', () => {
  it('the plan: top-level tasks with their subtasks, progress and states on the board’s day', () => {
    fake.rows = [
      task(T - 9, 'late', { due: '2026-11-01' }), task(T - 8, 'soon'), task(T - 7, 'later', { due: '2027-03-01' }),
      task(T - 6, 'sub1', { due: undefined, parent: 'later' }), task(T - 5, 'sub2', { due: undefined, parent: 'later' }),
      rec(T - 4, 'A', 'wdone', { id: 'sub1', at: T - 4, v: 1 }), task(T - 3, 'gone', { del: T - 3 }), task(T - 2, 'orphan', { due: undefined, parent: 'gone' })
    ];
    const plan = board.tasks;
    expect(plan.map((t) => [t.id, t.progress.state])).toEqual([['late', 'overdue'], ['soon', 'soon'], ['later', 'later'], ['orphan', 'nodate']]);
    expect(plan[2].subtasks.map((s) => s.id)).toEqual(['sub1', 'sub2']);
    expect(plan[2].progress.percent).toBe(0.5);
    expect(plan[3].promoted).toBe(true);
    expect(board.overall).toMatchObject({ total: 4, overdue: 1, soon: 1, later: 1, nodate: 1, percent: 0.125 });
    expect(board.deleted.map((t) => t.id)).toEqual(['gone']);
  });

  it('today and the countdown in the board’s time zone', () => {
    // 2026-11-06 20:00 UTC: the 7th in Tokyo, the 6th in Los Angeles
    fake.now = Date.parse('2026-11-06T20:00:00.000Z');
    fake.rows = [rec(T, 'A', 'wconf', { k: 'date', at: T, v: '2026-11-17' })];
    expect(board.today).toBe('2026-11-07');
    expect(board.countdown).toBe(10);
    fake.rows.push(rec(T + 1, 'A', 'wconf', { k: 'tz', at: T + 1, v: 'America/Los_Angeles' }));
    expect(board.today).toBe('2026-11-06');
    expect(board.countdown).toBe(11);
    expect(board.config).toMatchObject({ tz: 'America/Los_Angeles', p1: '', cats: expect.arrayContaining(['Venue']) });
  });

  it('adds, edits, ticks, deletes, restores and purges as the record’s ops, each after what it replaces', () => {
    const id = board.addTask({ title: ' Book the hall ', cat: 'Venue', due: '2027-01-10', start: '2026-12-01' })!;
    expect(fake.sent.at(-1)).toMatchObject({ type: 'wtask', data: { id, title: 'Book the hall', cat: 'Venue', due: '2027-01-10', start: '2026-12-01' } });
    expect(board.addTask({ title: 'x', due: '' })).toBeNull();
    const s = board.addSub(id, 'Call them')!;
    expect(board.addSub(s, 'grandchild')).toBeNull();
    expect(board.tasks[0].subtasks.map((x) => x.title)).toEqual(['Call them']);
    expect(board.editTask(id, { title: 'Hall', start: '' })).toBe(true);
    expect(board.task(id)).toMatchObject({ title: 'Hall', start: '', due: '2027-01-10' });
    expect(board.editTask(s, { due: '2027-01-01' })).toBe(false);
    expect(board.tick(s)).toBe(true);
    expect(board.tasks[0].progress.percent).toBe(1);
    expect(board.tick(s)).toBe(true);
    expect(board.tasks[0].progress.percent).toBe(0);
    // delete: the subtask with it; restore: both
    expect(board.remove(id)).toBe(true);
    expect(board.tasks).toEqual([]);
    expect(board.deleted.map((t) => t.id).sort()).toEqual([id, s].sort());
    expect(board.restore(id)).toBe(true);
    expect(board.tasks[0].subtasks).toHaveLength(1);
    // purge: only what's deleted, final
    expect(board.purge(id)).toBe(false);
    board.remove(id);
    expect(board.purge()).toBe(true);
    expect(board.deleted).toEqual([]);
    expect(board.task(id)).toBeNull();
    expect(board.tick(id)).toBe(false);
    const ats = fake.sent.map((x) => x.data.at as number);
    expect(new Set(ats).size).toBe(ats.length);
  });

  it('the notes: a save names the version it was edited from; two crossed saves show both until the next', () => {
    fake.rows = [rec(T - 5, 'B', 'wnote', { at: T - 5, md: 'v1' })];
    const from = board.note!.at;
    // B saves meanwhile (the record's), then I save from v1
    fake.rows.push(rec(T - 2, 'B', 'wnote', { at: T - 2, md: 'v2 (B)', base: T - 5 }));
    expect(board.saveNote('v2 (A)', from)).toBe(true);
    expect(fake.sent.at(-1)!.data).toMatchObject({ md: 'v2 (A)', base: from });
    expect(board.conflict).toMatchObject({ current: { md: 'v2 (A)', who: 'A' }, other: { md: 'v2 (B)', who: 'B' } });
    // keep mine: a save from the held one settles it
    expect(board.saveNote('v2 (A)')).toBe(true);
    expect(board.conflict).toBeNull();
    expect(board.note).toMatchObject({ md: 'v2 (A)' });
    expect(board.saveNote('x'.repeat(64_001))).toBe(false);
  });

  it('settings: one op a key', () => {
    expect(board.setConfig('p1', ' たろう ')).toBe(true);
    expect(board.setConfig('cats', ['Venue', 'Food'])).toBe(true);
    expect(board.setConfig('date', 'someday')).toBe(false);
    expect(board.config).toMatchObject({ p1: 'たろう', cats: ['Venue', 'Food'] });
  });

  it('the guest reads it all and changes nothing', () => {
    fake.me = 'G';
    fake.rows = [task(T - 3, 'a'), rec(T - 2, 'A', 'wnote', { at: T - 2, md: 'hi' })];
    expect(board.readOnly).toBe(true);
    expect(board.tasks.map((t) => t.id)).toEqual(['a']);
    expect(board.note?.md).toBe('hi');
    expect(board.addTask({ title: 'x', due: '2027-01-01' })).toBeNull();
    expect(board.tick('a')).toBe(false);
    expect(board.editTask('a', { title: 'y' })).toBe(false);
    expect(board.remove('a')).toBe(false);
    expect(board.setConfig('p1', 'x')).toBe(false);
    expect(board.saveNote('x')).toBe(false);
    expect(fake.sent).toEqual([]);
  });
});
