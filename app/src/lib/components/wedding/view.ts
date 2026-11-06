// けっこんしき's view (docs/wedding.md): the plan's own rules (the filters, their counts, the lifted sections and the
// month groups) over the store's tasks (board.svelte.ts). Every rule of a percentage, a state, a day or this month is
// lib/wedding/progress.ts and time/zone.ts (the old board's, ported once); nothing here re-decides one.
import type { WedTask } from '#lib/contract/wedding.ts';
import { monthOf, type Overall, type WithProgress } from '#lib/wedding/progress.ts';

/** A live top-level task with its subtasks (in the order typed) and its progress. */
export type Task = WithProgress<WedTask>;

/** A task's fields as edited ('' for none). */
export interface Fields {
  title: string;
  cat: string;
  start: string;
  due: string;
}

// ---- the filters

export const FILTERS = ['all', 'overdue', 'soon', 'later', 'done'] as const;
export type Filter = (typeof FILTERS)[number];

/** Each chip's count, over the whole board (the store's overall: never over what is drawn); `all` every task. */
export const counts = (o: Overall): Record<Filter, number> => ({ all: o.total, overdue: o.overdue, soon: o.soon, later: o.later, done: o.done });

/** The rows the plan draws: the filter's slice, finished rows hidden unless asked for (the 完了 chip, or
 *  `showDone`), but a row ticked since (`held`) stays where it was, wearing its tick. */
export function visibleTasks(tasks: readonly Task[], filter: Filter, showDone: boolean, held: ReadonlySet<string> = new Set()): Task[] {
  const sliced = filter === 'all' ? [...tasks] : tasks.filter((t) => t.progress.state === filter || held.has(t.id));
  if (showDone || filter === 'done') return sliced;
  return sliced.filter((t) => t.progress.state !== 'done' || held.has(t.id));
}

/** The deleted rows 完全に削除 and 戻す list: a task, or a subtask removed on its own (one deleted with its task comes
 *  back with it). */
export const restorable = (deleted: readonly WedTask[]): WedTask[] => deleted.filter((d) => !deleted.some((p) => p.id === d.parentId));

// ---- the groups

export interface Group {
  key: string;
  kind: 'overdue' | 'thisMonth' | 'month' | 'nodate';
  /** The month the heading names (`YYYY-MM`; '' for 期限切れ and ひづけ なし). */
  month: string;
  /** The wedding's month (the arch on its plate). */
  wedding: boolean;
  /** The heading's done / total: a month's over the whole board's tasks of that month (its lifted and hidden rows
   *  too) under すべて; else, and on the lifted sections and ひづけ なし, over the rows drawn. */
  tally: { done: number; total: number };
  tasks: Task[];
}

const tallyOf = (ts: readonly Task[]) => ({ done: ts.filter((t) => t.progress.state === 'done').length, total: ts.length });

/** The plan: 期限切れ, the months before this one (their finished rows, when shown), こんげつ (each lifted section
 *  only when it holds a row: a row is in the first that claims it), then one group per later month in the store's
 *  order (by due date), ひづけ なし last. `shown` the rows drawn (visibleTasks), `all` the board's (the month tallies
 *  count the whole month); `filtered`: a chip other than すべて is on. */
export function groupPlan(shown: readonly Task[], all: readonly Task[], today: string, wedding: string, filtered = false): Group[] {
  const wm = monthOf(wedding), tm = monthOf(today);
  const overdue: Group = { key: 'overdue', kind: 'overdue', month: '', wedding: false, tally: { done: 0, total: 0 }, tasks: [] };
  const now: Group = { key: 'thisMonth', kind: 'thisMonth', month: tm, wedding: !!wm && tm === wm, tally: { done: 0, total: 0 }, tasks: [] };
  const months: Group[] = [];
  for (const t of shown) {
    if (t.progress.state === 'overdue') overdue.tasks.push(t);
    else if (t.progress.thisMonth) now.tasks.push(t);
    else {
      const k = t.progress.state === 'nodate' ? '' : monthOf(t.due);
      let g = months.at(-1);
      if (!g || g.month !== k) {
        g = { key: k || 'nodate', kind: k ? 'month' : 'nodate', month: k, wedding: !!k && k === wm, tally: { done: 0, total: 0 }, tasks: [] };
        months.push(g);
      }
      g.tasks.push(t);
    }
  }
  for (const g of [overdue, now, ...months])
    g.tally = tallyOf(g.kind === 'month' && !filtered ? all.filter((t) => monthOf(t.due) === g.month) : g.tasks);
  const past = months.filter((g) => g.kind === 'month' && g.month < tm);
  return [overdue, ...past, now, ...months.filter((g) => !past.includes(g))].filter((g) => g.tasks.length);
}
