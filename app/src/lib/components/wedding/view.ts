// けっこんしき's view (docs/wedding.md): the shapes the board's components draw, and the pure rules of the plan's
// list (the filters, their counts, the lifted sections and the month groups, the countdown). The components are
// props-driven: the store (components/wedding/board.svelte.ts, over the record's wtask / wdone / wconf / wnote) hands
// a `Board` and takes the `WeddingActions`; each task's `progress` comes from lib/wedding/progress.ts (the old
// board's rules: done → 1, else the subtasks' share, else 0; the state by the due date in the board's zone).
import { daysBetween } from '#lib/time/dates.ts';

export type Who3 = 'A' | 'B' | 'G';
export type TaskState = 'done' | 'overdue' | 'soon' | 'later' | 'nodate';

interface Progress {
  /** 0–1: done 1, else the subtasks' share, else 0. */
  percent: number;
  state: TaskState;
  tally?: { done: number; total: number } | null;
}

export interface Task {
  id: string;
  title: string;
  cat: string;
  /** `YYYY-MM-DD` (required on a new task; an old row may lack it: ひづけ なし). Subtasks have none. */
  due?: string;
  start?: string;
  done: boolean;
  /** Who ticked it (the record's person); with `imported`, the old Sheet's (never recorded who). */
  by?: Who3;
  imported?: boolean;
  /** One level; a subtask's own `subtasks` is empty. */
  subtasks: Task[];
  progress: Progress;
}

export interface Config {
  p1: string;
  p2: string;
  /** The wedding day, `YYYY-MM-DD` ('' unset). */
  date: string;
  venue: string;
  /** IANA zone the board's today is read in (default Asia/Tokyo). */
  tz: string;
  cats: string[];
}

export interface Note {
  md: string;
  /** The held note's `at` (relay clock; 0: none yet). A save sends it as `base`. */
  at: number;
  /** Two saves crossed (a save whose base wasn't the held note's): both versions, to choose from. */
  conflict?: { mine: string; theirs: string } | null;
}

/** A deleted task (restorable until purged). */
export interface Deleted {
  id: string;
  title: string;
  /** Deleted at (ms). */
  del: number;
  cat?: string;
  due?: string;
}

export interface Board {
  /** Live top-level tasks, each with its live subtasks. */
  tasks: Task[];
  deleted: Deleted[];
  config: Config;
  note: Note;
  /** Today in the board's zone (`YYYY-MM-DD`). */
  today: string;
}

export interface NewTask {
  title: string;
  cat: string;
  due?: string;
  start?: string;
  /** A subtask's parent (no dates). */
  parent?: string;
}
/** A task's fields as edited ('' for none). */
export interface Fields {
  title: string;
  cat: string;
  start: string;
  due: string;
}
export type TaskPatch = Partial<Pick<Task, 'title' | 'cat' | 'due' | 'start'>>;
export type ConfigKey = 'names' | 'date' | 'venue' | 'tz' | 'cats';
export type ConfigValue = { p1: string; p2: string } | string | string[];

/** What the board asks of the store (members only: the guest's board offers none of them). */
export interface WeddingActions {
  onadd: (t: NewTask) => void;
  onedit: (id: string, patch: TaskPatch) => void;
  ontick: (id: string, done: boolean) => void;
  /** Soft delete (a task with its subtasks; とりけす → onrestore). */
  onremove: (id: string) => void;
  onrestore: (id: string) => void;
  /** Remove every deleted task for good. */
  onpurge: () => void;
  onconfig: (k: ConfigKey, v: ConfigValue) => void;
  /** Save the note; `base`: the note's `at` the edit started from (the store flags a conflict on a mismatch). */
  onnote: (md: string, base: number) => void;
}

// ---- the filters

export const FILTERS = ['all', 'overdue', 'soon', 'later', 'done'] as const;
export type Filter = (typeof FILTERS)[number];

/** Each chip's count, over the whole board (never over what is drawn): `all` every task. */
export function counts(tasks: readonly Task[]): Record<Filter, number> {
  const c: Record<Filter, number> = { all: tasks.length, overdue: 0, soon: 0, later: 0, done: 0 };
  for (const t of tasks) if (t.progress.state !== 'nodate') c[t.progress.state]++;
  return c;
}

/** The board's percent (the mean of each top-level task's, each counting once) and how many are done. */
export function summary(tasks: readonly Task[]): { percent: number; done: number; total: number } {
  const total = tasks.length;
  const sum = tasks.reduce((s, t) => s + Math.min(1, Math.max(0, t.progress.percent || 0)), 0);
  return { percent: total ? sum / total : 0, done: tasks.filter((t) => t.progress.state === 'done').length, total };
}

/** The rows the plan draws: the filter's slice, finished rows hidden unless asked for (the 完了 chip, or
 *  `showDone`), but a row ticked since (`held`) stays where it was, wearing its tick. */
export function visibleTasks(tasks: readonly Task[], filter: Filter, showDone: boolean, held: ReadonlySet<string> = new Set()): Task[] {
  const sliced = filter === 'all' ? [...tasks] : tasks.filter((t) => t.progress.state === filter || held.has(t.id));
  if (showDone || filter === 'done') return sliced;
  return sliced.filter((t) => t.progress.state !== 'done' || held.has(t.id));
}

// ---- the groups

/** `YYYY-MM` of a day, '' for none. */
const monthOf = (d: string | undefined): string => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d.slice(0, 7) : '');

/** The board's order: dated first by due date then title; undated last. */
function sortTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const da = monthOf(a.due) ? a.due! : '', db = monthOf(b.due) ? b.due! : '';
    if (!da !== !db) return da ? -1 : 1;
    if (da !== db) return da < db ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

/** This month's: due this month, or begun (its start come) and not yet due, unless overdue or undated. */
export function isThisMonth(t: Task, today: string): boolean {
  const s = t.progress.state;
  if (s === 'overdue' || s === 'nodate' || !monthOf(t.due)) return false;
  if (monthOf(t.due) === monthOf(today)) return true;
  return !!t.start && t.start <= today && s !== 'done' && t.due! > today;
}

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
 *  group per month in order, ひづけ なし last. `shown` the rows drawn (visibleTasks), `all` the board's (the month
 *  tallies count the whole month, the lifted and the hidden rows too); `filtered`: a chip other than すべて is on. */
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
  for (const t of sortTasks(shown)) {
    if (t.progress.state === 'overdue') overdue.tasks.push(t);
    else if (isThisMonth(t, today)) now.tasks.push(t);
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
  // (undated rows sort last already: one ひづけ なし group at the end)
  return [overdue, now, ...months].filter((g) => g.tasks.length);
}

/** Days from today to the wedding (negative after it), or null with no date. */
export const daysLeft = (today: string, date: string): number | null => (monthOf(date) && monthOf(today) ? daysBetween(today, date) : null);

/** Days past due (> 0) or to go (≥ 0) for a card's line, or null with no date. */
export const dueIn = (today: string, due: string | undefined): number | null => (monthOf(due) ? daysBetween(today, due!) : null);
