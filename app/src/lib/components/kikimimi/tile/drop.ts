// ことば タイル's drag and drop, the board's side (TilePlay.svelte; docs/kikimimi-engine.md "ことば タイル"): what a sentence
// becomes when a tile is let go. Slots stay fixed and numbered; only mine move (`mine`: my slots in order, without the
// partner's or easy's given one), so shifting walks them alone. Pure.
import { EMPTY } from '#lib/kikimimi/games/listened.ts';

/** Where a drag began: a pool tile (the board's index) or one of my filled slots. */
export type From = { tile: number } | { slot: number };
/** Where it was let go: one of my slots, back to the pool (the pool, or off the sentence), or nowhere (a cancel: the
 *  partner's or the given slot, a gap in the sentence). */
export type To = { slot: number } | 'back' | null;

/** The sentence after the drop, or null: nothing changes (the tile flies back). From the pool: onto an empty slot, there;
 *  onto a filled one, inserted, my later tiles shifting one slot right into the nearest empty one (none after it: the
 *  occupant goes back to the pool). From a slot: onto another, moved, the tiles between shifting one place toward the
 *  one it left (a list's reorder); back, the slot emptied. */
export function dropOn(a: readonly number[], mine: readonly number[], from: From, to: To): number[] | null {
  const out = [...a];
  if ('tile' in from) {
    if (to === null || to === 'back' || a.includes(from.tile)) return null;
    const p = mine.indexOf(to.slot);
    if (p < 0) return null;
    if (a[to.slot] === EMPTY) {
      out[to.slot] = from.tile;
      return out;
    }
    const q = mine.findIndex((j, r) => r > p && a[j] === EMPTY);
    for (let r = q; r > p; r--) out[mine[r]] = out[mine[r - 1]];
    out[to.slot] = from.tile;
    return out;
  }
  const s = mine.indexOf(from.slot);
  if (s < 0 || a[from.slot] === EMPTY || to === null) return null;
  if (to === 'back') {
    out[from.slot] = EMPTY;
    return out;
  }
  const t = mine.indexOf(to.slot);
  if (t < 0 || t === s) return null;
  if (a[to.slot] === EMPTY) {
    out[to.slot] = a[from.slot];
    out[from.slot] = EMPTY;
    return out;
  }
  const step = s < t ? 1 : -1;
  for (let r = s; r !== t; r += step) out[mine[r]] = a[mine[r + step]];
  out[to.slot] = a[from.slot];
  return out;
}
