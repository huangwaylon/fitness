// けっこんしき's plan rules (view.ts) over the invented board (fixtures/board.ts): the chips' counts, what each filter
// draws, the lifted sections and the month groups, the countdown.
import { describe, expect, it } from 'vitest';
import { addDays } from '#lib/time/dates.ts';
import { counts, daysLeft, groupPlan, isThisMonth, summary, visibleTasks, type Task } from './view.ts';
import { apply, boardOf, demoBoard } from './fixtures/board.ts';

const TODAY = '2026-11-06';
const demo = demoBoard(TODAY);
const board = boardOf(demo, TODAY);
const ids = (ts: Task[]) => ts.map((t) => t.id);
const byId = (id: string) => board.tasks.find((t) => t.id === id)!;

describe('the board', () => {
  it('holds the top-level tasks with their subtasks (deleted ones apart)', () => {
    expect(board.tasks).toHaveLength(24);
    expect(byId('guests').subtasks).toHaveLength(5);
    expect(byId('guests').progress).toMatchObject({ state: 'overdue', tally: { done: 3, total: 5 } });
    expect(board.deleted.map((d) => d.id)).toEqual(['cake', 'old']);
  });
  it('the summary is the mean of the tasks\' percents; done counts the finished ones', () => {
    const s = summary(board.tasks);
    expect(s.total).toBe(24);
    expect(s.done).toBe(6);
    // 6 done + guests 3/5 + photo 1/3 + music 2/4
    expect(s.percent).toBeCloseTo((6 + 0.6 + 1 / 3 + 0.5) / 24, 6);
    expect(summary([])).toEqual({ percent: 0, done: 0, total: 0 });
  });
});

describe('filters', () => {
  it('count over the whole board; undated only under すべて', () => {
    expect(counts(board.tasks)).toEqual({ all: 24, overdue: 2, soon: 2, later: 12, done: 6 });
  });
  it('すべて hides the finished unless asked; 完了 lists them; a slice draws its state', () => {
    expect(visibleTasks(board.tasks, 'all', false)).toHaveLength(18);
    expect(visibleTasks(board.tasks, 'all', true)).toHaveLength(24);
    expect(ids(visibleTasks(board.tasks, 'done', false)).sort()).toEqual(['budget', 'day', 'fair', 'rings', 'tasting', 'venue']);
    expect(ids(visibleTasks(board.tasks, 'overdue', false))).toEqual(['guests', 'estimate']);
  });
  it('a row ticked since stays where it was, wearing its tick', () => {
    const ticked = boardOf(apply(demo, { op: 'tick', id: 'estimate', done: true, by: 'A' }), TODAY);
    expect(ids(visibleTasks(ticked.tasks, 'overdue', false, new Set(['estimate'])))).toEqual(['guests', 'estimate']);
    expect(ids(visibleTasks(ticked.tasks, 'overdue', false))).toEqual(['guests']);
  });
});

describe('groups', () => {
  const groups = groupPlan(visibleTasks(board.tasks, 'all', true), board.tasks, TODAY, board.config.date);
  it('期限切れ, then こんげつ, then the months in order, ひづけ なし last; a row in one place only', () => {
    expect(groups.map((g) => g.kind).slice(0, 2)).toEqual(['overdue', 'thisMonth']);
    expect(groups.at(-1)!.kind).toBe('nodate');
    const months = groups.filter((g) => g.kind === 'month').map((g) => g.month);
    expect(months).toEqual([...months].sort());
    const all = groups.flatMap((g) => ids(g.tasks));
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(24);
    expect(ids(groups[0].tasks)).toEqual(['guests', 'estimate']);
  });
  it('こんげつ holds this month\'s and a task already begun (its start come), not the overdue', () => {
    expect(ids(groups[1].tasks)).toEqual(['dress', 'photo']);
    expect(isThisMonth(byId('photo'), TODAY)).toBe(true);
    expect(isThisMonth(byId('invite-design'), addDays(TODAY, 21))).toBe(true);
    expect(isThisMonth(byId('invite-design'), TODAY)).toBe(false);
  });
  it('a month\'s tally counts the whole month (its hidden finished rows too); a filter withholds it', () => {
    const hidden = groupPlan(visibleTasks(board.tasks, 'all', false), board.tasks, TODAY, board.config.date);
    const sep = hidden.find((g) => g.month === '2026-09')!;
    expect(sep).toBeUndefined(); // (all of September done and hidden: no group drawn)
    // October: two done and the overdue guest list, lifted into 期限切れ but still October's
    const oct = groups.find((g) => g.month === '2026-10')!;
    expect(oct.tally).toEqual({ done: 2, total: 3 });
    const sliced = groupPlan(visibleTasks(board.tasks, 'later', false), board.tasks, TODAY, board.config.date, true);
    expect(sliced.every((g) => g.tally === null)).toBe(true);
  });
  it('the wedding month is marked', () => {
    const wm = groups.filter((g) => g.wedding);
    expect(wm.map((g) => g.month)).toEqual([board.config.date.slice(0, 7)]);
    expect(ids(wm[0].tasks)).toContain('wedding');
  });
  it('the countdown', () => {
    expect(daysLeft(TODAY, board.config.date)).toBe(225);
    expect(daysLeft(TODAY, TODAY)).toBe(0);
    expect(daysLeft(TODAY, '')).toBeNull();
  });
});

describe('the demo\'s actions', () => {
  it('add, edit, remove with its subtasks, restore, purge', () => {
    let d = apply(demo, { op: 'add', t: { title: 'x', cat: 'ゲスト', due: TODAY }, id: 'x', by: 'A' });
    d = apply(d, { op: 'add', t: { title: 'x-1', cat: '', parent: 'x' }, id: 'x-1', by: 'A' });
    expect(boardOf(d, TODAY).tasks.find((t) => t.id === 'x')!.subtasks.map((s) => s.id)).toEqual(['x-1']);
    d = apply(d, { op: 'edit', id: 'x', patch: { title: 'y' } });
    d = apply(d, { op: 'remove', id: 'x', at: 5 });
    expect(boardOf(d, TODAY).tasks.some((t) => t.id === 'x')).toBe(false);
    expect(boardOf(d, TODAY).deleted.map((t) => t.title)).toContain('y');
    d = apply(d, { op: 'restore', id: 'x' });
    expect(boardOf(d, TODAY).tasks.find((t) => t.id === 'x')!.subtasks).toHaveLength(1);
    d = apply(d, { op: 'purge' });
    expect(boardOf(d, TODAY).deleted).toEqual([]);
  });
});
