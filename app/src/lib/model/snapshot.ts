// Pure helpers to merge incremental (`since`) `snapshot` replies into the cached rows (docs/backend.md#tabs, #api).
// Rows are compact arrays in the sheet's column order.
import type { SnapshotRows } from '#lib/contract/api.ts';
import { instantOrNull } from '#lib/time/dates.ts';

export const emptyRows = (): SnapshotRows => ({ metrics: [], events: [] });

/** Natural key per tab: a re-sent or overlapping `since` page never duplicates a row. */
const KEYS: { [K in keyof SnapshotRows]: (r: SnapshotRows[K][number]) => string } = {
  metrics: (r) => `${r[1]}|${r[2]}|${r[3]}|${Number(r[4])}`,
  events: (r) => String(r[2])
};

const parsed = new WeakMap<readonly unknown[], number | null>();
/**
 * A row's server `at` (its first cell) in epoch ms, or null if unreadable. Rows are never mutated and the same row
 * objects are merged, compacted and reduced again after every poll, so the merge and the compaction keep what they
 * parse (`keep`); `reduce` only reads it, since a cold start's rows (fresh from IndexedDB) would pay more to store
 * than to parse.
 */
export function rowAt(r: readonly unknown[], keep = true): number | null {
  let ms = parsed.get(r);
  if (ms === undefined) {
    ms = instantOrNull(r[0]);
    if (keep) parsed.set(r, ms);
  }
  return ms;
}
const atMs = (r: readonly unknown[]): number => rowAt(r) ?? 0;

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

/**
 * Merge a `since` reply into cached rows (dedupe by natural key, ordered by server `at`). `base` itself when nothing
 * was added (the usual empty poll), so the store keeps its reduced state (view.ts composeModel compares by identity).
 */
export function mergeRows(base: SnapshotRows, add: Partial<SnapshotRows>): SnapshotRows {
  const metrics = mergeTab(base.metrics, add.metrics, KEYS.metrics);
  const events = mergeTab(base.events, add.events, KEYS.events);
  return metrics === base.metrics && events === base.events ? base : { metrics, events };
}

/** The largest server `at` in the rows (the next `since`), or null when empty. */
export function maxAt(rows: SnapshotRows): string | null {
  let best: string | null = null;
  let bestMs = -Infinity;
  for (const tab of [rows.metrics, rows.events] as (readonly unknown[])[][]) {
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
