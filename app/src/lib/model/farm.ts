// The fields as each phone shows them (docs/farming.md): the plants (contract/farm.ts farmStep over the `farm` rows, a
// kept row as kept, a queued one judged as the record will), what was watered (every island day's `watered`, anyone's;
// a wet day's every plot) and what the fields put in or took out of each pocket (model/shop.ts adds it). Pure. Never
// ベル: the economy never imports this.
import type { LocalDate, Who } from '#lib/types.ts';
import { emptyFarm, farmStep, type Farm, type FarmData, type Watered } from '#lib/contract/farm.ts';

/** One person's `farm` row (model/state.ts `farm`). */
export interface FarmRow {
  at: number;
  person: Who;
  data: FarmData;
  queued?: true;
}

/** What the fold reads of the model's State (never imported here: the shop's fold reads this, and never the economy). */
interface FarmState { farm: readonly FarmRow[]; islandDays: readonly { data: { date: LocalDate; watered: readonly string[] } }[]; wet: readonly LocalDate[] }

const wateredMemo = new WeakMap<FarmState['islandDays'], WeakMap<FarmState['wet'], Watered>>();

/** Whether a plot was watered on a day by the State's rows: in anyone's island day of it, or every plot on a wet day. */
export function wateredOf(s: Pick<FarmState, 'islandDays' | 'wet'>): Watered {
  let byWet = wateredMemo.get(s.islandDays);
  if (!byWet) wateredMemo.set(s.islandDays, (byWet = new WeakMap()));
  const hit = byWet.get(s.wet);
  if (hit) return hit;
  const days = new Map<LocalDate, Set<string>>();
  // (a day's rows only grow: contract/island.ts mergeIslandDay unions the waterings, so every row's count)
  for (const r of s.islandDays) {
    if (!r.data.watered.some((id) => id.startsWith('fd:'))) continue;
    let set = days.get(r.data.date);
    if (!set) days.set(r.data.date, (set = new Set()));
    for (const id of r.data.watered) set.add(id);
  }
  const wet = new Set(s.wet);
  const w: Watered = (p, date) => wet.has(date) || (days.get(date)?.has(p) ?? false);
  byWet.set(s.wet, w);
  return w;
}

const farmMemo = new WeakMap<FarmState['farm'], WeakMap<Watered, Farm>>();

/** The last fold of a list's kept rows (as kept: no watering read) and how many: a list that starts with the same row
 *  objects folds on from a copy of it, so a tap (a queued row replaced) or a poll (a row or two more) folds only its
 *  new rows, not the year's (the State's lists are never changed in place: model/state.ts). */
let kept: { rows: readonly FarmRow[]; f: Farm } | null = null;
const copyFarm = (f: Farm): Farm => ({ plots: new Map(f.plots), net: Object.fromEntries(Object.entries(f.net).map(([w, m]) => [w, new Map(m)])) });

/** The fields: each plot's plant and each person's pocket changes. Memoised per State lists. */
export function farmOfState(s: FarmState): Farm {
  const watered = wateredOf(s);
  let byW = farmMemo.get(s.farm);
  if (!byW) farmMemo.set(s.farm, (byW = new WeakMap()));
  const hit = byW.get(watered);
  if (hit) return hit;
  const rows = s.farm;
  let n = rows.findIndex((r) => r.queued);
  if (n < 0) n = rows.length;
  let from = 0;
  if (kept && kept.rows.length <= n && kept.rows.every((r, i) => rows[i] === r)) from = kept.rows.length;
  const f = from ? copyFarm(kept!.f) : emptyFarm();
  for (let i = from; i < n; i++) farmStep(f, rows[i].person, rows[i].data);
  if (n > from || !kept) kept = { rows: rows.slice(0, n), f: copyFarm(f) };
  // (a queued row as the record will judge it: its harvests at their yield; the pocket the phone's own check, before)
  for (let i = n; i < rows.length; i++) {
    const r = rows[i];
    farmStep(f, r.person, r.data, r.queued ? { watered, pocket: () => Infinity } : undefined);
  }
  byW.set(watered, f);
  return f;
}
