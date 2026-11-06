// Progress on the wedding board, ported from the old board's `src/lib/progress.js` (~/Documents/other/wedding), its
// rules unchanged: the only file that decides what a percentage means.
//   - A task's percent: done → 100 %, else its live subtasks' share ticked, else 0 (an unfinished task is 0 % whatever
//     the date says; nothing advances a percentage but a tick).
//   - The board's percent: the mean over the live top-level tasks, each counting equally (decomposing one task more
//     finely never changes what the rest are worth). No pace verdict: what the calendar asked for is the overdue count.
//   - Subtasks: one level, enforced on the read; a row that can't be placed under a live top-level task is promoted,
//     never hidden.
import type { WedTask } from '#lib/contract/wedding.ts';
import { daysBetween } from '#lib/time/dates.ts';

/** 'YYYY-MM' of a day ('' for none: it groups with the undated rows). */
export const monthOf = (day: string): string => day.slice(0, 7);

/** A task as the board reads it (contract/wedding.ts WedTask: the old Sheet's rows, every field a string; who ticked
 *  it aside). */
type TaskRow = Omit<WedTask, 'doneBy'>;

/** How near a due date has to be to count as soon (today included). */
export const SOON_DAYS = 14;

/** A task's state (the filter chips' slices): `soon` due within SOON_DAYS, today included; `nodate` no usable date
 *  (counted in the total, 0 unless done). */
type TaskState = 'done' | 'overdue' | 'soon' | 'later' | 'nodate';

const isLive = (t: TaskRow): boolean => !t.deletedAt;
const isDone = (t: TaskRow): boolean => Boolean(t.doneAt);

/**
 * A flat list split into top-level tasks and the subtasks under them: a row is a subtask iff its `parentId` names a
 * live row whose own `parentId` is empty. A grandchild, a self-parent, a two-cycle, an orphan (its parent deleted) and
 * a dangling id are all promoted. Deleted rows are dropped.
 */
function partitionSubtasks<T extends TaskRow>(tasks: readonly T[]): { parents: T[]; children: Map<string, T[]> } {
  const live = tasks.filter(isLive);
  const topLevel = new Set<string>();
  for (const task of live) if (!task.parentId) topLevel.add(task.id);
  const parents: T[] = [];
  const children = new Map<string, T[]>();
  for (const task of live) {
    if (task.parentId && topLevel.has(task.parentId)) {
      const siblings = children.get(task.parentId);
      if (siblings) siblings.push(task);
      else children.set(task.parentId, [task]);
    } else parents.push(task);
  }
  return { parents, children };
}

/** A checklist in the order it was typed (ties: the list's order, sort being stable). */
function byCreated(a: TaskRow, b: TaskRow): number {
  if (a.createdAt === b.createdAt) return 0;
  return a.createdAt < b.createdAt ? -1 : 1;
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

interface TaskProgress {
  /** 0–1. */
  percent: number;
  state: TaskState;
  dated: boolean;
  /** In the plan's "this month" section: due this month (finished or not), or running (started, not done, not yet
   *  due); never an overdue or undated row. */
  thisMonth: boolean;
  /** Signed calendar days until it's due (null: undated). */
  days: number | null;
  tally: { done: number; total: number } | null;
}

/** A task's progress on `today` (the board's day, todayIn), from its live subtasks. */
function taskProgress(task: TaskRow, today: string, subtasks: readonly TaskRow[] = []): TaskProgress {
  const due = task.due;
  const dated = Boolean(due);
  const done = isDone(task);
  const days = dated ? daysBetween(today, due) : null;
  const total = subtasks.length;
  const tally = total ? { done: subtasks.filter(isDone).length, total } : null;
  // done_at > the tally > nothing, nothing blended
  const percent = done ? 1 : tally ? tally.done / tally.total : 0;
  let state: TaskState;
  if (done) state = 'done';
  else if (!dated) state = 'nodate';
  else if (days! < 0) state = 'overdue';
  else if (days! <= SOON_DAYS) state = 'soon';
  else state = 'later';
  const start = task.start;
  const started = Boolean(start) && start <= today;
  const dueThisMonth = dated && monthOf(due) === monthOf(today);
  const running = started && !done && dated && days! > 0;
  return {
    percent,
    state,
    dated,
    thisMonth: (dueThisMonth || running) && state !== 'overdue' && state !== 'nodate',
    days,
    tally
  };
}

export type WithProgress<T extends TaskRow> = T & { subtasks: T[]; progress: TaskProgress };

/** Every live top-level task (a subtask that couldn't be placed under one too) with its subtasks (in the order typed)
 *  and its progress, by due date then title; undated last. */
export function withProgress<T extends TaskRow>(tasks: readonly T[], today: string): WithProgress<T>[] {
  const { parents, children } = partitionSubtasks(tasks);
  return parents
    .map((task) => {
      const subtasks = (children.get(task.id) ?? []).slice().sort(byCreated);
      return { ...task, subtasks, progress: taskProgress(task, today, subtasks) };
    })
    .sort(compareForDisplay);
}

function compareForDisplay(a: WithProgress<TaskRow>, b: WithProgress<TaskRow>): number {
  if (a.progress.dated !== b.progress.dated) return a.progress.dated ? -1 : 1;
  if (a.due !== b.due) return a.due < b.due ? -1 : 1;
  return a.title.localeCompare(b.title);
}

export interface Overall { total: number; percent: number; done: number; overdue: number; soon: number; later: number; nodate: number }

/** The headline: the mean of the tasks' percents (withProgress's: top-level only), and a count per state. */
export function overallProgress(tasks: readonly { progress: TaskProgress }[]): Overall {
  const counts = { done: 0, overdue: 0, soon: 0, later: 0, nodate: 0 };
  let percentSum = 0;
  for (const task of tasks) {
    counts[task.progress.state] += 1;
    percentSum += task.progress.percent;
  }
  const total = tasks.length;
  return { total, percent: total ? percentSum / total : 0, ...counts };
}

/** 0–1 → a whole percent. */
export function toPercent(fraction: number): number {
  return Math.round(clamp01(fraction) * 100);
}
