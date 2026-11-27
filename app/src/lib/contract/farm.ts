// The field (docs/farming.md): NH 2.0's vegetables on the island's shared plots (layout kind `field`, lib/layout/field.ts;
// a plot is one of its tiles, `fd:<objectId>.<col>.<row>`). Anyone plants, waters, harvests or digs any plot (the user,
// 2026-11-25): a `farm` event is one person's batch of ops; what it takes or gives (a start or a vegetable planted, a
// harvest, a dug-up start) is the sender's pocket. A plant is ripe FARM.growMs after it was planted, and again
// FARM.growMs after each harvest (6 hours: the user, 2026-11-25); it yields FARM.maxYield if watered while growing, or
// if it rained the day it started or ripened (contract/wet.ts), else 1. Time is the record's: a row's `at`.
// The record judges each new op (farmRefusal) against the field and the sender's pocket, drops a refused one and keeps
// a harvest at the yield it reckons (farmStep); the phones step their unsent rows the same way on the record's field.
// Shared by the record and the model; pure.
import { isWho, keysAre } from './api.ts';
import { isRec } from './guards.ts';
import { localDateAt } from './tokyo.ts';
import type { LocalDate, Who } from '../types.ts';

/** NH 2.0's six vegetables (one price, any season). */
export const CROPS = ['tomato', 'wheat', 'sugarcane', 'potato', 'carrot', 'pumpkin'] as const;
export type Crop = (typeof CROPS)[number];
export const isFarmCrop = (c: unknown): c is Crop => (CROPS as readonly unknown[]).includes(c);

/** The field's numbers (docs/farming.md "Balance"): a start's price (NH's 280 Bells ÷ 20), the time to ripe (and to
 *  ripe again after a harvest), what a watered plant yields, ops in one event. */
export const FARM = { startBuy: 14, growMs: 6 * 3600_000, maxYield: 3, batchMax: 40 } as const;

export type FarmSrc = 'start' | 'crop';
export type FarmOp =
  | { o: 'plant'; p: string; c: Crop; src: FarmSrc }
  | { o: 'water'; p: string }
  | { o: 'harvest'; p: string; n: number }
  | { o: 'dig'; p: string };
export interface FarmData { ops: FarmOp[] }

/** A plot's id: `fd:`, its field's layout object id and the tile's column and row in it. */
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
  if (x.o === 'water' || x.o === 'dig') return keysAre(x, ['o', 'p']) ? { o: x.o, p: x.p } : null;
  return null;
}

/** A `farm`'s data: `{ops}` (an older build's `{d, ops}`: its day dropped), 1…FARM.batchMax well-formed ops. */
export function farmOf(d: Record<string, unknown>): FarmData | null {
  if (!(keysAre(d, ['ops']) || keysAre(d, ['d', 'ops'])) || !Array.isArray(d.ops) || !d.ops.length || d.ops.length > FARM.batchMax) return null;
  const ops: FarmOp[] = [];
  for (const x of d.ops) {
    const op = opOf(x);
    if (!op) return null;
    ops.push(op);
  }
  return { ops };
}

/** A plant: its crop, when it is (or was) ripe from (ms), `r` once harvested (growing back), `w` watered this growth,
 *  `by` who harvested it last (a plant growing back since 2026-11-26: the plot's word says so; none on older ones). */
export interface Plot { c: Crop; t: number; r?: true; w?: true; by?: Who }

/** Ms till a plant is ripe at `now` (0: ripe). */
export const msLeft = (pl: Plot, now: number): number => Math.max(0, pl.t - now);
export const isRipe = (pl: Plot, now: number): boolean => now >= pl.t;

/** A plant's stage at `now`: 0, 1, 2 through a first growth's thirds, 2 growing back after a harvest, 3 ripe. */
export function stageOf(pl: Plot, now: number): 0 | 1 | 2 | 3 {
  const left = msLeft(pl, now);
  if (!left) return 3;
  if (pl.r) return 2;
  // (a clock behind the record's, planted "in the future": 0)
  return Math.max(0, Math.min(2, Math.floor((FARM.growMs - left) / (FARM.growMs / 3)))) as 0 | 1 | 2;
}

/** When `pl`'s stage next changes after `now` (ms), or null once ripe. */
export function nextStageAt(pl: Plot, now: number): number | null {
  if (isRipe(pl, now)) return null;
  if (pl.r) return pl.t;
  const third = FARM.growMs / 3, start = pl.t - FARM.growMs;
  return start + (Math.floor((now - start) / third) + 1) * third;
}

/** Whether a Tokyo day was wet (rain or snow: the record's `wet` rows). */
export type WetDay = (date: LocalDate) => boolean;

/** What a plant yields once ripe: FARM.maxYield if watered while growing or it rained the day it started or ripened,
 *  else 1. A kept harvest keeps its `n` (farmStep): only new ones are reckoned so. */
export const yieldOf = (pl: Plot, wet: WetDay): number =>
  pl.w || wet(localDateAt(pl.t)) || wet(localDateAt(pl.t - FARM.growMs)) ? FARM.maxYield : 1;

/** Whether watering `pl` at `now` would count (growing, not watered yet). */
export const needsWater = (pl: Plot, now: number): boolean => !pl.w && !isRipe(pl, now);

/** The field as the rows leave it: each plot's plant, and per person what the field put into (+) or took out of (−)
 *  their pocket per goods key (a harvest's vegetables, a dug-up plant's start; a planted start or vegetable). */
export interface Farm { plots: Map<string, Plot>; net: Partial<Record<Who, Map<string, number>>> }
export const emptyFarm = (): Farm => ({ plots: new Map(), net: {} });

/** What the record judges a new op by: the wet days and the sender's pocket before the batch; `refused`, told each op
 *  dropped and why (the record's log). */
interface FarmJudge { wet: WetDay; pocket(key: string): number; refused?: (why: FarmRefusal) => void }

export const FARM_REFUSALS = ['taken', 'seed', 'empty', 'ripe', 'watered', 'unripe'] as const;
export type FarmRefusal = (typeof FARM_REFUSALS)[number];

/** Why the record refuses this op at `now`, or null: `taken` (a plant there: the first in server order keeps the
 *  plot), `seed` (none in the pocket), `empty` (no plant), `ripe` / `watered` (a watering that can't count),
 *  `unripe` (a harvest too soon). `pocket`: the sender's stock of a key now. */
export function farmRefusal(f: Farm, now: number, op: FarmOp, pocket: (key: string) => number): FarmRefusal | null {
  const pl = f.plots.get(op.p);
  if (op.o === 'plant') return pl ? 'taken' : pocket(seedKey(op.c, op.src)) < 1 ? 'seed' : null;
  if (!pl) return 'empty';
  if (op.o === 'water') return pl.w ? 'watered' : isRipe(pl, now) ? 'ripe' : null;
  return op.o === 'harvest' && !isRipe(pl, now) ? 'unripe' : null;
}

const add = (f: Farm, who: Who, key: string, n: number): void => {
  const m = (f.net[who] ??= new Map());
  m.set(key, (m.get(key) ?? 0) + n);
};

/**
 * One `farm` row of `who`'s at `at` (ms) into the field, in place; the row as kept, or null when no op of it stands.
 * `judge`: a new row (the record's, a phone's unsent one): each op judged (farmRefusal), a refused one dropped, a
 * harvest at its yield. Without it a kept row as the record kept it, where an op that can't apply is skipped alike.
 */
export function farmStep(f: Farm, who: Who, data: FarmData, at: number, judge?: FarmJudge): FarmData | null {
  const kept: FarmOp[] = [];
  const at0 = new Map(f.net[who]);
  const pocket = (k: string) => (judge ? judge.pocket(k) : Infinity) + (f.net[who]?.get(k) ?? 0) - (at0.get(k) ?? 0);
  for (const op of data.ops) {
    const why = farmRefusal(f, at, op, pocket);
    if (why && judge) {
      judge.refused?.(why);
      continue;
    }
    if (why === 'taken' || why === 'empty') continue;
    const pl = f.plots.get(op.p);
    if (op.o === 'plant') {
      f.plots.set(op.p, { c: op.c, t: at + FARM.growMs });
      add(f, who, seedKey(op.c, op.src), -1);
      kept.push(op);
    } else if (op.o === 'water') {
      f.plots.set(op.p, { ...pl!, w: true });
      kept.push(op);
    } else if (op.o === 'harvest') {
      const n = judge ? yieldOf(pl!, judge.wet) : op.n;
      add(f, who, cropKey(pl!.c), n);
      f.plots.set(op.p, { c: pl!.c, t: at + FARM.growMs, r: true, by: who });
      kept.push({ o: 'harvest', p: op.p, n });
    } else {
      add(f, who, startKey(pl!.c), 1);
      f.plots.delete(op.p);
      kept.push(op);
    }
  }
  return kept.length ? { ops: kept } : null;
}

/** A plant with its keys in one order (c, t, r, w, by), whichever steps made it: a harvest then a watering gives
 *  the keys in another order, which compared as JSON text reads as a different plant (the record's checks). */
export const plotJson = (pl: Plot): Plot => ({ c: pl.c, t: pl.t, ...(pl.r ? { r: true } : {}), ...(pl.w ? { w: true } : {}), ...(pl.r && pl.by ? { by: pl.by } : {}) });

/** The field's plots as a JSON value (the record's stored field, relay/src/ledger.ts; a reply's `field`; each plant
 *  plotJson's) and back (a plot not of this shape, an older relay's, dropped). */
export const fieldJson = (f: Farm): unknown => [...f.plots].sort(([a], [b]) => (a < b ? -1 : 1)).map(([p, pl]) => [p, plotJson(pl)]);
export function fieldFromJson(x: unknown): Farm | null {
  if (!Array.isArray(x)) return null;
  const plots = new Map<string, Plot>();
  for (const e of x) {
    if (!Array.isArray(e) || typeof e[0] !== 'string' || !isRec(e[1])) continue;
    const pl = e[1];
    if (isFarmCrop(pl.c) && typeof pl.t === 'number') plots.set(e[0], { c: pl.c, t: pl.t, ...(pl.r ? { r: true } : {}), ...(pl.w ? { w: true } : {}), ...(pl.r && isWho(pl.by) ? { by: pl.by } : {}) });
  }
  return { plots, net: {} };
}
