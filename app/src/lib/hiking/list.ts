// トレイル's list (docs/hiking.md "Screens"): which section a trail sits in, the filters and the sorts. Pure: the day
// comes in as 'YYYY-MM-DD' (time/clock.ts dayKey, Tokyo's), so the e2e's pinned clock decides 予定 and 歩いた.
import type { Diff, Region, Trail } from './types.ts';

/** 予定 (a plan on or after today), 歩いた (walked, or a plan's day gone), 行きたい (the rest). */
export type Status = 'planned' | 'want' | 'walked';
const STATUSES: readonly Status[] = ['planned', 'want', 'walked'];

export type SortKey = 'auto' | 'dist' | 'gain' | 'time';
export const SORTS: readonly SortKey[] = ['auto', 'dist', 'gain', 'time'];

/** The day a trail was (or will be) walked, if it has one. */
export const dayOf = (t: Trail): string | undefined => t.walked?.dateISO ?? t.plan?.dateISO;

export function statusOf(t: Trail, today: string): Status {
  if (t.walked) return 'walked';
  if (t.plan) return t.plan.dateISO >= today ? 'planned' : 'walked';
  return 'want';
}

/** A trail's time in minutes, for the sort: a range by its low end ('10 – 13 h' → 600), '~3 h 30 min' → 210. */
export function minutesOf(time: string): number {
  const h = /(\d+(?:\.\d+)?)\s*(?:[–-]\s*\d+\s*)?h/.exec(time), m = /(\d+)\s*min/.exec(time);
  return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0);
}

const BY: Record<Exclude<SortKey, 'auto'>, (t: Trail) => number> = { dist: (t) => t.lengthKm, gain: (t) => t.gainM, time: (t) => minutesOf(t.time) };

export interface Filter {
  region: Region | null;
  /** None: every level. */
  diffs: ReadonlySet<Diff>;
}

const matches = (t: Trail, f: Filter): boolean => (!f.region || t.tiles === f.region) && (!f.diffs.size || f.diffs.has(t.diff));

/** The trails shown, by section (empty ones dropped). おすすめ: 予定 soonest first, 歩いた newest first, 行きたい as the
 *  guide lists them; any other sort orders every section by it, ascending (a tie keeps the guide's order). */
export function sections(trails: readonly Trail[], f: Filter, sort: SortKey, today: string): { status: Status; trails: Trail[] }[] {
  const out = new Map<Status, Trail[]>(STATUSES.map((s) => [s, []]));
  for (const t of trails) if (matches(t, f)) out.get(statusOf(t, today))!.push(t);
  for (const [s, xs] of out) {
    if (sort !== 'auto') xs.sort((a, b) => BY[sort](a) - BY[sort](b));
    else if (s !== 'want') xs.sort((a, b) => (s === 'planned' ? 1 : -1) * dayOf(a)!.localeCompare(dayOf(b)!));
  }
  return STATUSES.map((status) => ({ status, trails: out.get(status)! })).filter((x) => x.trails.length);
}
