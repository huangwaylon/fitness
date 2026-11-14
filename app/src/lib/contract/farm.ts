// The fields (docs/farming.md): NH 2.0's vegetables on each player's field (layout kind `field`: its owner and size,
// lib/layout/field.ts; a plot is one of its tiles, `fd:<objectId>.<col>.<row>`). A `farm` event is one person's batch
// of ops on one Tokyo day `d`: plant a start or a vegetable of their pocket, harvest a ripe plant of theirs, dig one of
// theirs up (its start back). A plant is ripe FARM.growDays after planting; harvested, it grows back from stage 2 and
// is ripe again FARM.regrowDays on (a day each: the user, 2026-11-14); it yields FARM.maxYield if watered the day before
// it ripened, else 1 (anyone's watering, the island day's `watered`: contract/island.ts; a wet day waters all:
// contract/wet.ts). Whose field a plot is the phones' rule (the layout is theirs): the record keeps a plot's plant its
// planter's.
// The record judges each new op (farmRefusal) against the field and the sender's pocket, drops a refused one and keeps
// a harvest at the yield it reckons (farmStep); the phones fold the same rows by the same step (model/farm.ts), a kept
// row as kept. The produce and the starts are pocket goods (`goods:<crop>`, `goods:<crop>-start`: contract/pocket.ts),
// so the shop sells them as any other. Shared by the record and the model; pure.
import { isLocalDate, keysAre } from './api.ts';
import { isRec } from './guards.ts';
import { addDays, dayNum } from './tokyo.ts';
import type { LocalDate, Who } from '../types.ts';

/** NH 2.0's six vegetables (one price, any season). */
export const CROPS = ['tomato', 'wheat', 'sugarcane', 'potato', 'carrot', 'pumpkin'] as const;
export type Crop = (typeof CROPS)[number];
export const isFarmCrop = (c: unknown): c is Crop => (CROPS as readonly unknown[]).includes(c);

/**
 * The fields' numbers (docs/farming.md "Balance"): a start's price (NH's 280 Bells ÷ 20), plants a person may have at
 * once (a fixed 40, whatever their field's size: the user, 2026-11-10), days to ripe and to ripe again (one each: the
 * user, 2026-11-14), what a watered plant yields, ops in one event. The levers if the numbers drift are `regrowDays`
 * and `cap`, never a price.
 */
export const FARM = { startBuy: 14, cap: 40, growDays: 1, regrowDays: 1, maxYield: 3, batchMax: 40 } as const;

export type FarmSrc = 'start' | 'crop';
export type FarmOp = { o: 'plant'; p: string; c: Crop; src: FarmSrc } | { o: 'harvest'; p: string; n: number } | { o: 'dig'; p: string };
export interface FarmData { d: LocalDate; ops: FarmOp[] }

/** A plot's id: `fd:`, its field's layout object id and the tile's column and row in it (it fits the island day's
 *  ids: contract/island.ts). */
const PLOT_RE = /^fd:[\w:.-]{1,29}$/;
export const plotOf = (fieldId: string, col: number, row: number): string => `fd:${fieldId}.${col}.${row}`;
/** A crop's pocket keys: its vegetable (`goods:tomato`) and its start (`goods:tomato-start`). */
export const cropKey = (c: Crop): string => `goods:${c}`;
export const startKey = (c: Crop): string => `goods:${c}-start`;
/** What a plant takes from the pocket. */
export const seedKey = (c: Crop, src: FarmSrc): string => (src === 'start' ? startKey(c) : cropKey(c));

function opOf(x: unknown): FarmOp | null {
  if (!isRec(x) || typeof x.p !== 'string' || !PLOT_RE.test(x.p)) return null;
  if (x.o === 'plant') return keysAre(x, ['o', 'p', 'c', 'src']) && isFarmCrop(x.c) && (x.src === 'start' || x.src === 'crop') ? { o: 'plant', p: x.p, c: x.c, src: x.src } : null;
  if (x.o === 'harvest') return keysAre(x, ['o', 'p', 'n']) && Number.isInteger(x.n) && (x.n as number) >= 1 && (x.n as number) <= FARM.maxYield ? { o: 'harvest', p: x.p, n: x.n as number } : null;
  if (x.o === 'dig') return keysAre(x, ['o', 'p']) ? { o: 'dig', p: x.p } : null;
  return null;
}

/** A `farm`'s data: `{d, ops}` and nothing else, a real date, 1…FARM.batchMax well-formed ops. */
export function farmOf(d: Record<string, unknown>): FarmData | null {
  if (!keysAre(d, ['d', 'ops']) || !isLocalDate(d.d) || !Array.isArray(d.ops) || !d.ops.length || d.ops.length > FARM.batchMax) return null;
  const ops: FarmOp[] = [];
  for (const x of d.ops) {
    const op = opOf(x);
    if (!op) return null;
    ops.push(op);
  }
  return { d: d.d, ops };
}

/** A plant: whose, which crop, the day it is (or was) ripe from, and `r` once harvested (growing back). */
export interface Plot { who: Who; c: Crop; from: LocalDate; r?: true }

/** Days till a plant is ripe on `date` (0: ripe). */
export const daysLeft = (plot: Plot, date: LocalDate): number => Math.max(0, dayNum(plot.from) - dayNum(date));

/** A plant's stage on `date`: 0 the day it was planted, 3 ripe; one growing back after a harvest 2 till ripe. */
export function stageOf(plot: Plot, date: LocalDate): 0 | 2 | 3 {
  const left = daysLeft(plot, date);
  if (!left) return 3;
  return plot.r ? 2 : 0;
}

/** Whether plot `p` was watered on `date` (anyone's watering, or a wet day). */
export type Watered = (p: string, date: LocalDate) => boolean;

/** What a plant yields once ripe: FARM.maxYield if it was watered the day before it ripened (the plant day, or the
 *  harvest day it grew back from), else 1. A kept harvest keeps its `n` (farmStep): only new ones are reckoned so. */
export const yieldOf = (p: string, plot: Plot, watered: Watered): number =>
  watered(p, addDays(plot.from, -1)) ? FARM.maxYield : 1;

/** Whether a watering on `date` counts toward the plant's yield (`date` its day before ripe: yieldOf). */
export const wateringCounts = (plot: Plot, date: LocalDate): boolean => daysLeft(plot, date) === 1;

/** The field as the rows leave it: each plot's plant, and per person what the field put into (+) or took out of (−)
 *  their pocket per goods key (a harvest's vegetables, a dug-up plant's start; a planted start or vegetable). */
export interface Farm { plots: Map<string, Plot>; net: Partial<Record<Who, Map<string, number>>> }
export const emptyFarm = (): Farm => ({ plots: new Map(), net: {} });

/** Plants `who` has on the field. */
export const plantsOf = (f: Farm, who: Who): number => {
  let n = 0;
  for (const pl of f.plots.values()) if (pl.who === who) n++;
  return n;
};

/** What the record judges a new op by: the waterings and the sender's pocket before the batch (their tallies' and the
 *  field's goods less what they sold, with the starts they bought). */
interface FarmJudge { watered: Watered; pocket(key: string): number }

/** Why the record refuses this op of `who`'s on day `d`, or null: `taken` (a plant there: the first in server order
 *  keeps the plot), `cap` (FARM.cap plants already), `seed` (none in the pocket), `empty` (no plant), `owner` (another's:
 *  only its planter harvests or digs it), `unripe`. `pocket`: the sender's stock of a key now. */
export function farmRefusal(f: Farm, who: Who, d: LocalDate, op: FarmOp, pocket: (key: string) => number): 'taken' | 'cap' | 'seed' | 'empty' | 'owner' | 'unripe' | null {
  if (op.o === 'plant') {
    if (f.plots.has(op.p)) return 'taken';
    if (plantsOf(f, who) >= FARM.cap) return 'cap';
    return pocket(seedKey(op.c, op.src)) < 1 ? 'seed' : null;
  }
  const pl = f.plots.get(op.p);
  if (!pl) return 'empty';
  if (pl.who !== who) return 'owner';
  return op.o === 'harvest' && d < pl.from ? 'unripe' : null;
}

const add = (f: Farm, who: Who, key: string, n: number): void => {
  const m = (f.net[who] ??= new Map());
  m.set(key, (m.get(key) ?? 0) + n);
};

/**
 * One `farm` row of `who`'s into the field, in place; the row as kept, or null when no op of it stands. `judge`: a new
 * row (the record's, a phone's queued one): each op judged (farmRefusal), a refused one dropped, a harvest at its
 * yield. Without it a kept row as the record kept it, where an op that can't apply (none should) is skipped alike.
 */
export function farmStep(f: Farm, who: Who, data: FarmData, judge?: FarmJudge): FarmData | null {
  const kept: FarmOp[] = [];
  const at0 = new Map(f.net[who]);
  const pocket = (k: string) => (judge ? judge.pocket(k) : Infinity) + (f.net[who]?.get(k) ?? 0) - (at0.get(k) ?? 0);
  for (const op of data.ops) {
    const why = farmRefusal(f, who, data.d, op, pocket);
    if (why && (judge || why === 'taken' || why === 'empty' || why === 'owner')) continue;
    if (op.o === 'plant') {
      f.plots.set(op.p, { who, c: op.c, from: addDays(data.d, FARM.growDays) });
      add(f, who, seedKey(op.c, op.src), -1);
      kept.push(op);
    } else if (op.o === 'harvest') {
      const pl = f.plots.get(op.p)!;
      const n = judge ? yieldOf(op.p, pl, judge.watered) : op.n;
      add(f, who, cropKey(pl.c), n);
      f.plots.set(op.p, { who: pl.who, c: pl.c, from: addDays(data.d, FARM.regrowDays), r: true });
      kept.push({ o: 'harvest', p: op.p, n });
    } else {
      add(f, who, startKey(f.plots.get(op.p)!.c), 1);
      f.plots.delete(op.p);
      kept.push(op);
    }
  }
  return kept.length ? { d: data.d, ops: kept } : null;
}

/** The field and its pockets' changes as a JSON value (the record's running copy, relay/src/store.ts) and back. */
export function farmJson(f: Farm): unknown {
  return { p: [...f.plots].sort(([a], [b]) => (a < b ? -1 : 1)), n: Object.fromEntries(Object.entries(f.net).map(([w, m]) => [w, [...m].filter(([, n]) => n !== 0).sort(([a], [b]) => (a < b ? -1 : 1))])) };
}
export function farmFromJson(x: unknown): Farm | null {
  if (!isRec(x) || !Array.isArray(x.p) || !isRec(x.n)) return null;
  return { plots: new Map(x.p as [string, Plot][]), net: Object.fromEntries(Object.entries(x.n).map(([w, m]) => [w, new Map(m as [string, number][])])) };
}
