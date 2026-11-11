// The fields' writes on this phone (docs/farming.md): my plants, harvests and digs as `farm` ops, shown at once (the
// model folds the queued row as the record will judge it: model/farm.ts) and sent as one event per Tokyo day held
// FARM_HOLD_MS (the 畑 sheet's batches and digs UNDO_MS: their 取り消す), each added to the held one (its data replaced); the sheet's 水やり
// (the shared day's); the starts bought at the shop's かう (`buy_starts`, with the shop's 5 s 取り消す); what I plant
// next (the pick: kept on this phone).
import { week } from './week.svelte.ts';
import { world } from './world.svelte.ts';
import type { SendResult } from './backend.ts';
import { UNDO_MS, together } from './actions.ts';
import { newId } from '#lib/sync/queue.ts';
import { CROPS, FARM, isFarmCrop, type Crop, type FarmOp, type FarmSrc } from '#lib/contract/farm.ts';
import { localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import type { LocalDate } from '#lib/types.ts';

/** A batch waits this long for the next tap (a row of plots planted is one event). */
const FARM_HOLD_MS = 2000;

/** A batch: its day, its ops and when it goes (`until`), and its event in the queue (`r`: its data replaced as ops join
 *  or leave it, one fold of the model a tap). Each send's undo and hold keep their own batch, so a later batch never
 *  strands them. */
interface Batch { d: LocalDate; ops: FarmOp[]; until: number; r: SendResult }
let held: Batch | null = null;

/** `more` ops on day `d` into the held batch (its event's data replaced) while it holds and has room, else a new one:
 *  held `holdMs` at least. Its undo takes these ops back out; its hold holds the batch (an undo banner touched:
 *  store/actions.ts undoBanner). Both false / 0 once the batch was sent. */
function add(d: LocalDate, more: FarmOp[], holdMs = FARM_HOLD_MS): SendResult {
  const now = Date.now();
  let b = held;
  const ops = b ? [...b.ops, ...more] : more, until = Math.max(b?.until ?? 0, now + holdMs);
  if (b && b.d === d && b.until > now && ops.length <= FARM.batchMax && b.r.replace?.({ d, ops }, until - now)) {
    b.ops = ops;
    b.until = until;
  } else {
    held = b = { d, ops: more, until: now + holdMs, r: { ok: false } };
    b.r = week.send('farm', { d, ops: more }, { holdMs });
    if (!b.r.ok || !b.r.undo) {
      held = null;
      return { ok: b.r.ok };
    }
  }
  const batch = b;
  return {
    ok: true,
    undo: () => takeBack(batch, more),
    hold: (ms) => {
      const granted = batch.r.hold?.(ms) ?? 0;
      if (granted || ms === 0) batch.until = Date.now() + granted;
      return granted;
    }
  };
}

/** `ops` out of batch `b`, the rest sent at what was left of its hold; false once it was sent. */
function takeBack(b: Batch, ops: readonly FarmOp[]): boolean {
  if (!ops.every((o) => b.ops.includes(o))) return false;
  const rest = b.ops.filter((o) => !ops.includes(o));
  if (rest.length ? !b.r.replace?.({ d: b.d, ops: rest }, Math.max(0, b.until - Date.now())) : !b.r.undo?.()) return false;
  b.ops = rest;
  if (!rest.length && held === b) held = null;
  return true;
}

/** A plot's tap (held 2 s for the next). */
export const plant = (d: LocalDate, p: string, c: Crop, src: FarmSrc): SendResult => add(d, [{ o: 'plant', p, c, src }]);
export const harvest = (d: LocalDate, p: string, n: number): SendResult => add(d, [{ o: 'harvest', p, n }]);
/** The 畑 sheet's, held for their 取り消す (UNDO_MS). */
export const dig = (d: LocalDate, p: string): SendResult => add(d, [{ o: 'dig', p }], UNDO_MS);
export const digMany = (d: LocalDate, ps: readonly string[]): SendResult => add(d, ps.map((p) => ({ o: 'dig', p })), UNDO_MS);
export const harvestAll = (d: LocalDate, ops: readonly { p: string; n: number }[]): SendResult => add(d, ops.map(({ p, n }) => ({ o: 'harvest', p, n })), UNDO_MS);
export const plantMany = (d: LocalDate, ps: readonly string[], c: Crop, src: FarmSrc): SendResult => add(d, ps.map((p) => ({ o: 'plant', p, c, src })), UNDO_MS);

/** These plants watered today (a tap's 3 × 3, the 畑 sheet's 水やり): one change of the shared day, one day row
 *  (store/world.svelte.ts shareMany). */
export const waterAll = (ids: readonly string[]): number => world.shareMany(ids.map((id) => ({ kind: 'world', op: 'watered', id })));

/** Starts from the shop's かう: `n` of each crop at FARM.startBuy each (the record checks the cover): one `buy_starts` a
 *  crop, all in one group (kept all or none, relay store.ts group, as the shop's ぜんぶ), one undo. */
export function buyStarts(picks: Partial<Record<Crop, number>>): SendResult {
  const list = CROPS.flatMap((c) => (picks[c] ? [[c, picks[c]] as const] : []));
  if (!week.model || !list.length || list.some(([, n]) => !Number.isInteger(n) || n < 1 || n > 99)) return { ok: false };
  const group = newId();
  return together(list.map(([crop, n]) => week.send('buy_starts', { crop, n, v: n * FARM.startBuy }, { holdMs: UNDO_MS, group })));
}

// ---- what I plant next (the pick), this phone's (the demo's apart: a pick in `?demo` never carries into the app)

const seedKey = () => (week.demo ? 'island-demo.farm.seed' : 'farm.seed');
export interface Seed { c: Crop; src: FarmSrc }
const seedOf = (x: unknown): Seed | null => {
  const s = x as Partial<Seed> | null;
  return s && isFarmCrop(s.c) && (s.src === 'start' || s.src === 'crop') ? { c: s.c, src: s.src } : null;
};

/** Bumped by a pick, so `seed.pick` is read again. */
let picks = $state(0);
/** The pick as last read, by its key and pick (read again only after a pick, or in or out of the demo). */
let read: { k: string; n: number; s: Seed | null } | null = null;
export const seed = {
  get pick(): Seed | null {
    const k = seedKey(), n = picks;
    if (read?.k !== k || read.n !== n) read = { k, n, s: seedOf(readJson(localKV(), k)) };
    return read.s;
  }
};

export function pickSeed(s: Seed | null): void {
  writeJson(localKV(), seedKey(), s);
  picks++;
}
