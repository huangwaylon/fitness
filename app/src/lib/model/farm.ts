// The field as each phone shows it (docs/farming.md): the relay's stored field (docs/backend.md#the-ledger, State
// `field`: every acknowledged farm row in it) and this phone's unsent farm rows stepped on it as the record will
// (contract/farm.ts farmStep, judged at each row's `at`), whose pocket changes are the only `net` (model/shop.ts adds
// them: the stored ledger has the rest). Pure. Never ベル: the economy never imports this.
import type { LocalDate, Who } from '#lib/types.ts';
import { emptyFarm, farmStep, fieldFromJson, type Farm, type FarmData, type WetDay } from '#lib/contract/farm.ts';
import type { FieldWire } from '#lib/contract/ledger.ts';

/** One person's `farm` row (model/state.ts `farm`). */
export interface FarmRow {
  at: number;
  person: Who;
  data: FarmData;
  queued?: true;
  /** Not acknowledged by the record yet (the stored field and ledger don't hold it). */
  unsent?: true;
}

/** What the field reads of the model's State (never imported here: the shop's fold reads this, and never the economy). */
interface FarmState { farm: readonly FarmRow[]; wet: readonly LocalDate[]; field?: FieldWire }

const wetMemo = new WeakMap<FarmState['wet'], WetDay>();
/** Whether a Tokyo day was wet by the State's `wet` rows. Memoised per list. */
export function wetOf(s: Pick<FarmState, 'wet'>): WetDay {
  let w = wetMemo.get(s.wet);
  if (!w) {
    const days = new Set(s.wet);
    wetMemo.set(s.wet, (w = (d) => days.has(d)));
  }
  return w;
}

/** No stored field heard (an older relay): an empty one. */
const NONE = emptyFarm();
const stored = new WeakMap<FieldWire, Farm>();
const storedOf = (f: FieldWire | undefined): Farm => {
  if (!f) return NONE;
  let hit = stored.get(f);
  if (!hit) stored.set(f, (hit = fieldFromJson(f.v) ?? emptyFarm()));
  return hit;
};

const memo = new WeakMap<Farm, WeakMap<FarmState['farm'], WeakMap<FarmState['wet'], Farm>>>();

/** The field: each plot's plant and each person's pocket changes by this phone's unsent rows. Memoised per State
 *  lists (a frame's reads are lookups); never to be changed by the caller. */
export function farmOfState(s: FarmState): Farm {
  const base = storedOf(s.field);
  const byRows = memo.get(base) ?? memo.set(base, new WeakMap()).get(base)!;
  const byWet = byRows.get(s.farm) ?? byRows.set(s.farm, new WeakMap()).get(s.farm)!;
  let f = byWet.get(s.wet);
  if (f) return f;
  f = base;
  const judge = { wet: wetOf(s), pocket: () => Infinity };
  for (const r of s.farm) {
    if (!r.unsent) continue;
    if (f === base) f = { plots: new Map(base.plots), net: {} };
    farmStep(f, r.person, r.data, r.at, judge);
  }
  byWet.set(s.wet, f);
  return f;
}
