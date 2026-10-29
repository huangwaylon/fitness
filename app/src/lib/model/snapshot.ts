// The `snapshot` reply of the Apps Script backend (docs/design/sheets-architecture.md §1–2) and pure helpers to
// merge incremental (`since`) replies. Rows are compact arrays in the sheet's column order.
import type { PersonId } from '#lib/types.ts';
import type { SnapshotRows } from '#lib/ingest/sheet-api.ts';

export interface Snapshot {
  me: PersonId;
  /** Server time of the reply (ISO). */
  now: string;
  rows: SnapshotRows;
}

export const emptyRows = (): SnapshotRows => ({ metrics: [], workouts: [], presence: [], events: [] });

/** Natural key per tab: a re-sent or overlapping `since` page never duplicates a row. */
const KEYS: { [K in keyof SnapshotRows]: (r: SnapshotRows[K][number]) => string } = {
  metrics: (r) => `${r[1]}|${r[2]}|${r[3]}|${Number(r[4])}`,
  workouts: (r) => `${r[1]}|${r[2]}`,
  presence: (r) => `${r[0]}|${r[1]}|${r[2]}|${r[3]}|${r[4]}`,
  events: (r) => String(r[2])
};

/** Server `at` of a row in epoch ms (0 if unreadable), parsed once per row. */
const parsed = new WeakMap<readonly unknown[], number>();
function atMs(r: readonly unknown[]): number {
  let ms = parsed.get(r);
  if (ms === undefined) {
    ms = Date.parse(String(r[0]));
    if (Number.isNaN(ms)) ms = 0;
    parsed.set(r, ms);
  }
  return ms;
}

const isSorted = (rows: readonly (readonly unknown[])[]): boolean => rows.every((r, i) => i === 0 || atMs(rows[i - 1]) <= atMs(r));

function mergeTab<T extends readonly unknown[]>(base: T[], add: T[] | undefined, key: (r: T) => string): T[] {
  if (!add?.length) return base;
  const seen = new Set(base.map(key));
  const out = [...base];
  for (const r of add) {
    const k = key(r);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  // The usual poll only adds newer rows to sorted ones: nothing to sort (same result as the stable sort below).
  if (isSorted(out)) return out;
  // Stable: rows keep append order within the same timestamp.
  return out.map((r, i) => [r, i] as const).sort((x, y) => atMs(x[0]) - atMs(y[0]) || x[1] - y[1]).map(([r]) => r);
}

/** Merge a `since` reply into cached rows (dedupe by natural key, ordered by server `at`). */
export function mergeRows(base: SnapshotRows, add: Partial<SnapshotRows>): SnapshotRows {
  return {
    metrics: mergeTab(base.metrics, add.metrics, KEYS.metrics),
    workouts: mergeTab(base.workouts, add.workouts, KEYS.workouts),
    presence: mergeTab(base.presence, add.presence, KEYS.presence),
    events: mergeTab(base.events, add.events, KEYS.events)
  };
}

/** The largest server `at` in the rows (the next `since`), or null when empty. */
export function maxAt(rows: SnapshotRows): string | null {
  let best: string | null = null;
  let bestMs = -Infinity;
  for (const tab of [rows.metrics, rows.workouts, rows.presence, rows.events] as (readonly unknown[])[][]) {
    for (const r of tab) {
      const ms = atMs(r);
      if (ms > bestMs) {
        bestMs = ms;
        best = String(r[0]);
      }
    }
  }
  return best;
}
