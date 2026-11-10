// The fields' writes on this phone (docs/farming.md): my plants, harvests and digs as `farm` ops, shown at once (the
// model folds the queued row as the record will judge it: model/farm.ts) and sent as one event per Tokyo day held
// FARM_HOLD_MS (a dig FIELD_UNDO_MS: its 取り消す), each op added to the held one; the starts bought at the shop's かう
// (`buy_starts`, with the shop's 5 s 取り消す); what I plant next (たね: kept on this phone).
import { week } from './week.svelte.ts';
import type { SendResult } from './backend.ts';
import { UNDO_MS, together } from './actions.ts';
import { newId } from '#lib/sync/queue.ts';
import { CROPS, FARM, isFarmCrop, type Crop, type FarmOp, type FarmSrc } from '#lib/contract/farm.ts';
import { localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import type { LocalDate } from '#lib/types.ts';

/** A batch waits this long for the next tap (a row of plots planted is one event). */
const FARM_HOLD_MS = 2000;

let held: { d: LocalDate; ops: FarmOp[]; until: number; undo: () => boolean } | null = null;

/** `op` on day `d` into the held batch (taken back and sent again with it), else a new one: held `holdMs` at least. */
function add(d: LocalDate, op: FarmOp, holdMs = FARM_HOLD_MS): SendResult {
  const now = Date.now();
  let ops = [op], until = now + holdMs;
  if (held && held.d === d && held.until > now && held.ops.length < FARM.batchMax && held.undo()) {
    ops = [...held.ops, op];
    until = Math.max(held.until, until);
  }
  held = null;
  const r = week.send('farm', { d, ops }, { holdMs: until - now });
  if (r.ok && r.undo) held = { d, ops, until, undo: r.undo };
  return r;
}

export const plant = (d: LocalDate, p: string, c: Crop, src: FarmSrc): SendResult => add(d, { o: 'plant', p, c, src });
export const harvest = (d: LocalDate, p: string, n: number): SendResult => add(d, { o: 'harvest', p, n });

/** A dig (the shovel): held for its 取り消す; the undo takes that op back out of the batch (false once it was sent). */
export function dig(d: LocalDate, p: string): { ok: boolean; undo?: () => boolean } {
  const r = add(d, { o: 'dig', p }, UNDO_MS);
  if (!r.ok) return r;
  return {
    ok: true,
    undo: () => {
      const h = held;
      if (!h || !h.ops.some((o) => o.o === 'dig' && o.p === p) || !h.undo()) return false;
      const ops = h.ops.filter((o) => !(o.o === 'dig' && o.p === p));
      held = null;
      if (ops.length) {
        const again = week.send('farm', { d: h.d, ops }, { holdMs: Math.max(0, h.until - Date.now()) });
        held = again.ok && again.undo ? { ...h, ops, undo: again.undo } : null;
      }
      return true;
    }
  };
}

/** Starts from the shop's かう: `n` of each crop at FARM.startBuy each (the record checks the cover): one `buy_starts` a
 *  crop, all in one group (kept all or none, relay store.ts group, as the shop's ぜんぶ), one undo. */
export function buyStarts(picks: Partial<Record<Crop, number>>): SendResult & { v?: number } {
  const list = CROPS.flatMap((c) => (picks[c] ? [[c, picks[c]] as const] : []));
  if (!week.model || !list.length || list.some(([, n]) => !Number.isInteger(n) || n < 1 || n > 99)) return { ok: false };
  const group = newId();
  const r = together(list.map(([crop, n]) => week.send('buy_starts', { crop, n, v: n * FARM.startBuy }, { holdMs: UNDO_MS, group })));
  return { ...r, v: list.reduce((a, [, n]) => a + n * FARM.startBuy, 0) };
}

// ---- what I plant next (たね), this phone's

const SEED_KEY = 'farm.seed';
export interface Seed { c: Crop; src: FarmSrc }
const seedOf = (x: unknown): Seed | null => {
  const s = x as Partial<Seed> | null;
  return s && isFarmCrop(s.c) && (s.src === 'start' || s.src === 'crop') ? { c: s.c, src: s.src } : null;
};

export const seed = $state<{ pick: Seed | null }>({ pick: seedOf(readJson(localKV(), SEED_KEY)) });

export function pickSeed(s: Seed | null): void {
  seed.pick = s;
  writeJson(localKV(), SEED_KEY, s);
}
