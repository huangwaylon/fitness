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

/** Row lists known to be in `at` order (a merge's output): the next merge checks only what it appends. */
const sortedLists = new WeakSet<readonly unknown[]>();
const isSorted = (rows: readonly (readonly unknown[])[], from = 1): boolean => {
  for (let i = Math.max(1, from); i < rows.length; i++) if (atMs(rows[i - 1]) > atMs(rows[i])) return false;
  return true;
};

/**
 * The natural keys of a row list, kept with it: a merge reuses its base's and adds its own new ones in a layer (a
 * poll costs O(rows it brings), not a Set of every row), flattened every few layers. Lists are never mutated.
 */
class Keys {
  private readonly below: Keys | null;
  private readonly own: Set<string>;
  readonly depth: number;
  constructor(below: Keys | null, own: Set<string>) {
    this.below = below;
    this.own = own;
    this.depth = below ? below.depth + 1 : 0;
  }
  has(k: string): boolean {
    return this.own.has(k) || (this.below?.has(k) ?? false);
  }
  addAll(into: Set<string>): void {
    this.below?.addAll(into);
    for (const k of this.own) into.add(k);
  }
}
const keysMemo = new WeakMap<readonly unknown[], Keys>();
function keysOf<T extends readonly unknown[]>(rows: T[], key: (r: T) => string): Keys {
  let k = keysMemo.get(rows);
  if (!k) keysMemo.set(rows, (k = new Keys(null, new Set(rows.map(key)))));
  return k;
}

/** The event ids of a row set (`has` only), kept with its events list. */
export const eventIds = (rows: SnapshotRows): { has(id: string): boolean } => keysOf(rows.events, KEYS.events);

function mergeTab<T extends readonly unknown[]>(base: T[], add: T[] | undefined, key: (r: T) => string): T[] {
  if (!add?.length) return base;
  const seen = keysOf(base, key);
  const added = new Set<string>();
  const out = [...base];
  for (const r of add) {
    const k = key(r);
    if (added.has(k) || seen.has(k)) continue;
    added.add(k);
    out.push(r);
  }
  // nothing new (a reply that repeats rows: the record's late rows, the own rows already merged): the same rows
  if (out.length === base.length) return base;
  let keys = new Keys(seen, added);
  if (keys.depth > 8) {
    const all = new Set<string>();
    keys.addAll(all);
    keys = new Keys(null, all);
  }
  // The usual poll only adds newer rows to sorted ones: nothing to sort (same result as the stable sort below).
  const merged = isSorted(out, sortedLists.has(base) ? base.length : 1) ? out
    // Stable: rows keep append order within the same timestamp.
    : out.map((r, i) => [r, i] as const).sort((x, y) => atMs(x[0]) - atMs(y[0]) || x[1] - y[1]).map(([r]) => r);
  sortedLists.add(merged);
  keysMemo.set(merged, keys);
  if (merged === out) appendedFrom.set(merged, base);
  return merged;
}

/** A merge's output that is its base with rows appended (no sort), and that base: reduce folds only what was added. */
const appendedFrom = new WeakMap<readonly unknown[], readonly unknown[]>();
/** The rows `next` adds to `prev` when it is `prev` with rows appended by merges (a few in a row at most), else null. */
export function appendedTo<T>(next: readonly T[], prev: readonly T[]): T[] | null {
  if (next === prev) return [];
  let l: readonly unknown[] | undefined = next;
  for (let i = 0; i < 16 && l; i++) {
    l = appendedFrom.get(l);
    if (l === prev) return next.slice(prev.length);
  }
  return null;
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
