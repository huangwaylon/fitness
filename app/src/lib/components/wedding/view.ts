// けっこんしき's view (docs/wedding.md): the store's shapes as the board's components take them, and the plan's own
// rules (the filters, their counts, the lifted sections and the month groups). Every rule of a percentage, a state, a
// day or this month is lib/wedding/progress.ts and time.ts (the old board's, ported once); nothing here re-decides one.
// The store (board.svelte.ts) is the `Board` and the `WeddingActions` itself: the host hands it to the sheet.
import type { WedTask } from '#lib/contract/wedding.ts';
import type { Overall, WithProgress } from '#lib/wedding/progress.ts';
import { monthOf } from '#lib/wedding/time.ts';
import type { board } from './board.svelte.ts';

type Store = typeof board;

/** A live top-level task with its subtasks (in the order typed) and its progress. */
export type Task = WithProgress<WedTask>;
/** What the sheet reads (the store's getters). */
export type Board = Pick<Store, 'tasks' | 'overall' | 'countdown' | 'today' | 'config' | 'note' | 'conflict' | 'deleted'>;
/** What the sheet asks of the store (members only: the guest's sheet is given none, and the store refuses anyway). */
export type WeddingActions = Pick<Store, 'addTask' | 'addSub' | 'editTask' | 'tick' | 'remove' | 'restore' | 'purge' | 'setConfig' | 'saveNote'>;

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

/** The deleted rows ぜんぶ けす and もどす list: a task, or a subtask removed on its own (one deleted with its task comes
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
  /** A month's done / total over the whole board's tasks of that month (null under a filter, and on the lifted
   *  sections, which carry a bare count: every row there is unfinished by definition). */
  tally: { done: number; total: number } | null;
  tasks: Task[];
}

/** The plan: 期限切れ, then こんげつ (both only when they hold a row: a row is in the first that claims it), then one
 *  group per month in the store's order (by due date, undated last), ひづけ なし last. `shown` the rows drawn
 *  (visibleTasks), `all` the board's (the month tallies count the whole month, the lifted and the hidden rows too);
 *  `filtered`: a chip other than すべて is on. */
export function groupPlan(shown: readonly Task[], all: readonly Task[], today: string, wedding: string, filtered = false): Group[] {
  const wm = monthOf(wedding);
  const tallies = new Map<string, { done: number; total: number }>();
  for (const t of all) {
    const k = monthOf(t.due);
    const tl = tallies.get(k) ?? { done: 0, total: 0 };
    tl.total++;
    if (t.progress.state === 'done') tl.done++;
    tallies.set(k, tl);
  }
  const overdue: Group = { key: 'overdue', kind: 'overdue', month: '', wedding: false, tally: null, tasks: [] };
  const now: Group = { key: 'thisMonth', kind: 'thisMonth', month: monthOf(today), wedding: !!wm && monthOf(today) === wm, tally: null, tasks: [] };
  const months: Group[] = [];
  for (const t of shown) {
    if (t.progress.state === 'overdue') overdue.tasks.push(t);
    else if (t.progress.thisMonth) now.tasks.push(t);
    else {
      const k = t.progress.state === 'nodate' ? '' : monthOf(t.due);
      let g = months.at(-1);
      if (!g || g.month !== k) {
        g = { key: k || 'nodate', kind: k ? 'month' : 'nodate', month: k, wedding: !!k && k === wm, tally: filtered || !k ? null : (tallies.get(k) ?? null), tasks: [] };
        months.push(g);
      }
      g.tasks.push(t);
    }
  }
  return [overdue, now, ...months].filter((g) => g.tasks.length);
}
