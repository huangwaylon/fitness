// The fields' writes on this phone (docs/farming.md): my plants, harvests and digs as `farm` ops, shown at once (the
// model folds the queued row as the record will judge it: model/farm.ts) and sent as one event per Tokyo day held
// FARM_HOLD_MS (the 畑 sheet's batches and digs UNDO_MS: their 取り消す), each added to the held one; the sheet's 水やり
// (the shared day's); the starts bought at the shop's かう (`buy_starts`, with the shop's 5 s 取り消す); what I plant
// next (たね: kept on this phone).
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

let held: { d: LocalDate; ops: FarmOp[]; until: number; undo: () => boolean } | null = null;

/** `more` ops on day `d` into the held batch (taken back and sent again with them) while it holds and has room, else a
 *  new one: held `holdMs` at least. Its undo takes these ops back out of the batch (false once it was sent). */
function add(d: LocalDate, more: FarmOp[], holdMs = FARM_HOLD_MS): SendResult {
  const now = Date.now();
  let ops = more, until = now + holdMs;
  if (held && held.d === d && held.until > now && held.ops.length + more.length <= FARM.batchMax && held.undo()) {
    ops = [...held.ops, ...more];
    until = Math.max(held.until, until);
  }
  held = null;
  const r = week.send('farm', { d, ops }, { holdMs: until - now });
  if (!r.ok || !r.undo) return { ok: r.ok };
  held = { d, ops, until, undo: r.undo };
  return { ok: true, undo: () => takeBack(more) };
}

/** `ops` out of the held batch, the rest sent again with what was left of its hold; false once it was sent. */
function takeBack(ops: FarmOp[]): boolean {
  const h = held;
  if (!h || !ops.every((o) => h.ops.includes(o)) || !h.undo()) return false;
  const rest = h.ops.filter((o) => !ops.includes(o));
  held = null;
  if (rest.length) {
    const again = week.send('farm', { d: h.d, ops: rest }, { holdMs: Math.max(0, h.until - Date.now()) });
    held = again.ok && again.undo ? { ...h, ops: rest, undo: again.undo } : null;
  }
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

/** The 畑 sheet's 水やり: these plants watered today, one change of the shared day (store/world.svelte.ts shareMany). */
export const waterAll = (ids: readonly string[]): number => world.shareMany(ids.map((id) => ({ kind: 'world', op: 'watered', id })));

/** Starts from the shop's かう: `n` of each crop at FARM.startBuy each (the record checks the cover): one `buy_starts` a
 *  crop, all in one group (kept all or none, relay store.ts group, as the shop's ぜんぶ), one undo. */
export function buyStarts(picks: Partial<Record<Crop, number>>): SendResult {
  const list = CROPS.flatMap((c) => (picks[c] ? [[c, picks[c]] as const] : []));
  if (!week.model || !list.length || list.some(([, n]) => !Number.isInteger(n) || n < 1 || n > 99)) return { ok: false };
  const group = newId();
  return together(list.map(([crop, n]) => week.send('buy_starts', { crop, n, v: n * FARM.startBuy }, { holdMs: UNDO_MS, group })));
}

// ---- what I plant next (たね), this phone's (the demo's apart: a pick in `?demo` never carries into the app)

const seedKey = () => (week.demo ? 'island-demo.farm.seed' : 'farm.seed');
export interface Seed { c: Crop; src: FarmSrc }
const seedOf = (x: unknown): Seed | null => {
  const s = x as Partial<Seed> | null;
  return s && isFarmCrop(s.c) && (s.src === 'start' || s.src === 'crop') ? { c: s.c, src: s.src } : null;
};

/** Bumped by a pick, so `seed.pick` is read again. */
let picks = $state(0);
export const seed = {
  get pick(): Seed | null {
    void picks;
    return seedOf(readJson(localKV(), seedKey()));
  }
};

export function pickSeed(s: Seed | null): void {
  writeJson(localKV(), seedKey(), s);
  picks++;
}
