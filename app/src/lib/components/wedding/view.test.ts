// けっこんしき's plan rules (view.ts) over store-shaped tasks (lib/wedding/progress.ts withProgress over the record's
// rows as contract/wedding.ts wedTasks reads them): the chips' counts, what each filter draws, the lifted sections and
// the month groups, the deleted list. The rules of a percent, a state and this month are progress.test's.
import { describe, expect, it } from 'vitest';
import type { WedTask } from '#lib/contract/wedding.ts';
import { overallProgress, withProgress } from '#lib/wedding/progress.ts';
import { counts, groupPlan, restorable, visibleTasks, type Task } from './view.ts';

const TODAY = '2026-11-06';
const WEDDING = '2027-04-18';
let n = 0;
const row = (id: string, o: Partial<WedTask> = {}): WedTask => ({
  id, title: id, category: '', due: '', start: '', doneAt: '', doneBy: '', createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, ++n)).toISOString(),
  deletedAt: '', parentId: '', ...o
});
const DONE = { doneAt: '2026-10-01T00:00:00.000Z', doneBy: 'A' as const };
const rows: WedTask[] = [
  row('venue', { due: '2026-09-10', ...DONE }),
  row('budget', { due: '2026-10-02', ...DONE }),
  row('guests', { due: '2026-10-30' }),
  row('guests-1', { parentId: 'guests', ...DONE }),
  row('guests-2', { parentId: 'guests' }),
  row('estimate', { due: '2026-11-01' }),
  row('dress', { due: '2026-11-15' }),
  row('photo', { due: '2026-12-20', start: '2026-11-01' }),
  row('invite', { due: '2027-01-20', start: '2026-12-01' }),
  row('cake', { due: '2027-02-01', ...DONE }),
  row('day', { due: WEDDING }),
  row('loose'),
  row('gone', { due: '2027-01-01', deletedAt: '2026-11-01T00:00:00.000Z' }),
  row('gone-1', { parentId: 'gone', deletedAt: '2026-11-01T00:00:00.000Z' }),
  row('dropped', { parentId: 'guests', deletedAt: '2026-11-02T00:00:00.000Z' })
];
const tasks = withProgress(rows, TODAY);
const ids = (ts: readonly Task[]) => ts.map((t) => t.id);

describe('filters', () => {
  it('count over the whole board (the store\'s overall); undated only under すべて', () => {
    expect(counts(overallProgress(tasks))).toEqual({ all: 10, overdue: 2, soon: 1, later: 3, done: 3 });
  });
  it('すべて hides the finished unless asked; 完了 lists them; a slice draws its state', () => {
    expect(visibleTasks(tasks, 'all', false)).toHaveLength(7);
    expect(visibleTasks(tasks, 'all', true)).toHaveLength(10);
    expect(ids(visibleTasks(tasks, 'done', false))).toEqual(['venue', 'budget', 'cake']);
    expect(ids(visibleTasks(tasks, 'overdue', false))).toEqual(['guests', 'estimate']);
  });
  it('a row ticked since stays where it was, wearing its tick', () => {
    const ticked = withProgress(rows.map((r) => (r.id === 'estimate' ? { ...r, ...DONE } : r)), TODAY);
    expect(ids(visibleTasks(ticked, 'overdue', false, new Set(['estimate'])))).toEqual(['guests', 'estimate']);
    expect(ids(visibleTasks(ticked, 'overdue', false))).toEqual(['guests']);
  });
});

describe('groups', () => {
  const groups = groupPlan(visibleTasks(tasks, 'all', true), tasks, TODAY, WEDDING);
  it('期限切れ, then こんげつ, then the months in order, ひづけ なし last; a row in one place only', () => {
    expect(groups.map((g) => g.key)).toEqual(['overdue', 'thisMonth', '2026-09', '2026-10', '2027-01', '2027-02', '2027-04', 'nodate']);
    const all = groups.flatMap((g) => ids(g.tasks));
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(10);
    expect(ids(groups[0].tasks)).toEqual(['guests', 'estimate']);
  });
  it('こんげつ holds this month\'s and a task already begun (progress.thisMonth), not the overdue', () => {
    expect(ids(groups[1].tasks)).toEqual(['dress', 'photo']);
  });
  it('a month\'s tally counts the whole month (its hidden finished rows too); a filter withholds it', () => {
    const hidden = groupPlan(visibleTasks(tasks, 'all', false), tasks, TODAY, WEDDING);
    expect(hidden.find((g) => g.month === '2026-09')).toBeUndefined(); // (all of September done and hidden)
    // October: one done and the overdue guest list, lifted into 期限切れ but still October's
    expect(groups.find((g) => g.month === '2026-10')!.tally).toEqual({ done: 1, total: 2 });
    const sliced = groupPlan(visibleTasks(tasks, 'later', false), tasks, TODAY, WEDDING, true);
    expect(sliced.every((g) => g.tally === null)).toBe(true);
  });
  it('the wedding month is marked', () => {
    const wm = groups.filter((g) => g.wedding);
    expect(wm.map((g) => g.month)).toEqual(['2027-04']);
    expect(ids(wm[0].tasks)).toEqual(['day']);
  });
});

describe('the deleted list', () => {
  it('a task and a subtask removed on its own; one deleted with its task comes back with it', () => {
    expect(restorable(rows.filter((r) => r.deletedAt)).map((r) => r.id)).toEqual(['gone', 'dropped']);
  });
});
